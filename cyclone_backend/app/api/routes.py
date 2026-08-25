from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.preprocessing import (
    check_valid_satellite_image,
    preprocess_multisource,
)
from app.db.database import get_db
from app.db.models_db import PredictionHistory
from app.models.inference import CycloneModel
from app.models.schema import (
    HistoryRecord,
    PredictionResponse,
    TrackPredictionRequest,
    TrackPredictionResponse,
)
from app.models.track_inference import TrackModel

router = APIRouter()

# Instantiate Models ONCE at module level
model = CycloneModel()
track_model = TrackModel()

# Allowed file extensions for validation
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".h5", ".hdf5"}


def validate_image_file(file: UploadFile | None):
    if not file or not file.filename:
        return

    filename_lower = file.filename.lower()
    has_valid_ext = any(filename_lower.endswith(ext) for ext in ALLOWED_EXTENSIONS)
    has_valid_content_type = file.content_type and (
        file.content_type.startswith("image/") or "hdf" in file.content_type
    )

    if not (has_valid_ext or has_valid_content_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type for '{file.filename}'. Supported formats: JPEG, PNG, HDF5.",
        )


@router.post(
    "/predict",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
)
async def predict_cyclone(
    ir_file: UploadFile | None = File(None, description="Optional Infrared (IR) satellite image"),
    wv_file: UploadFile | None = File(None, description="Optional Water Vapor (WV) satellite image"),
    vis_file: UploadFile | None = File(None, description="Optional Visible (VIS) satellite image"),
    pmw_file: UploadFile | None = File(None, description="Optional Passive Microwave (PMW) satellite image"),
    db: Session = Depends(get_db),
):
    """POST /predict

    Receives optional IR, WV, VIS, PMW satellite images (at least one required), validates image characteristics,
    runs early-fusion preprocessing & model inference, saves into DB, and returns PredictionResponse.
    """
    has_ir = bool(ir_file and ir_file.filename)
    has_wv = bool(wv_file and wv_file.filename)
    has_vis = bool(vis_file and vis_file.filename)
    has_pmw = bool(pmw_file and pmw_file.filename)

    # 1. If all four files are None / missing, return 400 error
    if not any([has_ir, has_wv, has_vis, has_pmw]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one satellite image (IR, WV, VIS, or PMW) is required",
        )

    # Validate provided file types
    if has_ir:
        validate_image_file(ir_file)
    if has_wv:
        validate_image_file(wv_file)
    if has_vis:
        validate_image_file(vis_file)
    if has_pmw:
        validate_image_file(pmw_file)

    # 2. Read file bytes
    try:
        ir_bytes = await ir_file.read() if has_ir else None
        if ir_bytes == b"":
            ir_bytes = None

        wv_bytes = await wv_file.read() if has_wv else None
        if wv_bytes == b"":
            wv_bytes = None

        vis_bytes = await vis_file.read() if has_vis else None
        if vis_bytes == b"":
            vis_bytes = None

        pmw_bytes = await pmw_file.read() if has_pmw else None
        if pmw_bytes == b"":
            pmw_bytes = None

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading uploaded files: {str(e)}",
        )

    if not any([ir_bytes, wv_bytes, vis_bytes, pmw_bytes]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one satellite image (IR, WV, VIS, or PMW) is required",
        )

    # 3. Check satellite image characteristics on base image
    base_bytes = ir_bytes or wv_bytes or vis_bytes or pmw_bytes
    base_filename = (
        (ir_file.filename if has_ir else None)
        or (wv_file.filename if has_wv else None)
        or (vis_file.filename if has_vis else None)
        or (pmw_file.filename if has_pmw else None)
        or "satellite_image.png"
    )

    is_valid_input, warning_reason = check_valid_satellite_image(base_bytes)
    warning_message = warning_reason if not is_valid_input else None

    # 4. Run Preprocessing & Inference (4 channels: IR, WV, VIS, PMW)
    try:
        tensor, sources_used = preprocess_multisource(ir_bytes, wv_bytes, vis_bytes, pmw_bytes)
        pred_dict = model.predict(tensor, sources_used)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Corrupted or invalid image data. Processing failed: {str(e)}",
        )

    # 5. Additional warning if model confidence is below 0.35
    confidence = pred_dict.get("confidence", 1.0)
    if confidence < 0.35:
        is_valid_input = False
        low_conf_warn = "Low model confidence — this may not be a valid cyclone satellite image"
        if warning_message:
            warning_message = f"{warning_message} | {low_conf_warn}"
        else:
            warning_message = low_conf_warn

    # Rare category warning (informational note, does not affect is_valid_input)
    intensity_category = pred_dict.get("intensity_category", "")
    RARE_CATEGORIES = {"Super Cyclonic Storm", "Extremely Severe Cyclonic Storm"}
    if intensity_category in RARE_CATEGORIES:
        rare_warn = "This category had limited training examples — treat this prediction with extra caution."
        if warning_message:
            warning_message = f"{warning_message} | {rare_warn}"
        else:
            warning_message = rare_warn

    pred_dict["is_valid_input"] = is_valid_input
    pred_dict["warning_message"] = warning_message


    # 6. Save prediction record into Database
    try:
        db_record = PredictionHistory(
            filename=base_filename,
            has_cyclone=pred_dict["has_cyclone"],
            center_lat=pred_dict["center_lat"],
            center_lon=pred_dict["center_lon"],
            intensity_category=pred_dict["intensity_category"],
            secondary_category=pred_dict.get("secondary_category"),
            estimated_wind_speed_kmh=pred_dict["estimated_wind_speed_kmh"],
            confidence=pred_dict["confidence"],
            secondary_confidence=pred_dict.get("secondary_confidence"),

            trend=pred_dict["trend"],
            trend_confidence=pred_dict["trend_confidence"],
            sources_used=pred_dict["sources_used"],
            is_valid_input=pred_dict["is_valid_input"],
            warning_message=pred_dict["warning_message"],
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error while saving prediction record: {str(e)}",
        )

    return PredictionResponse(**pred_dict)



@router.get(
    "/history",
    response_model=list[HistoryRecord],
    status_code=status.HTTP_200_OK,
)
def get_prediction_history(
    db: Session = Depends(get_db),
):
    """GET /history

    Returns the last 20 predictions from database history, most recent first.
    """
    records = (
        db.query(PredictionHistory)
        .order_by(PredictionHistory.timestamp.desc())
        .limit(20)
        .all()
    )
    return records


@router.get(
    "/history/{id}",
    response_model=HistoryRecord,
    status_code=status.HTTP_200_OK,
)
def get_prediction_by_id(
    id: int,
    db: Session = Depends(get_db),
):
    """GET /history/{id}

    Returns a single historical prediction by id, or 404 if not found.
    """
    record = db.query(PredictionHistory).filter(PredictionHistory.id == id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction record with id {id} not found.",
        )
    return record


@router.post(
    "/predict-track",
    response_model=TrackPredictionResponse,
    status_code=status.HTTP_200_OK,
)
def predict_cyclone_track(req: TrackPredictionRequest):
    """POST /predict-track

    Predicts +24h and +48h cyclone trajectory, compass direction, and estimated speed
    from current and past track positions using the trained IBTrACS model.
    """
    try:
        res = track_model.predict(
            current_lat=req.current_lat,
            current_lon=req.current_lon,
            storm_speed_kts=req.storm_speed_kts,
            storm_dir_deg=req.storm_dir_deg,
            past_lat_6h=req.past_lat_6h,
            past_lon_6h=req.past_lon_6h,
            past_lat_12h=req.past_lat_12h,
            past_lon_12h=req.past_lon_12h,
            past_lat_24h=req.past_lat_24h,
            past_lon_24h=req.past_lon_24h,
            dist2land_km=req.dist2land_km,
            month=req.month,
        )
        return TrackPredictionResponse(**res)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Track prediction failed: {str(e)}",
        )

