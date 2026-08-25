from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


class PredictionResponse(BaseModel):
    has_cyclone: bool
    center_lat: float | None = None
    center_lon: float | None = None
    intensity_category: Literal[
        "Depression",
        "Deep Depression",
        "Cyclonic Storm",
        "Severe Cyclonic Storm",
        "Very Severe Cyclonic Storm",
        "Extremely Severe Cyclonic Storm",
        "Super Cyclonic Storm",
    ]
    secondary_category: str | None = None
    estimated_wind_speed_kmh: float
    confidence: float = Field(..., ge=0.0, le=1.0)
    secondary_confidence: float | None = Field(None, ge=0.0, le=1.0)
    trend: Literal["Intensifying", "Weakening", "Steady"]
    trend_confidence: float = Field(..., ge=0.0, le=1.0)
    sources_used: list[str]
    is_valid_input: bool = True
    warning_message: str | None = None



class HistoryRecord(PredictionResponse):
    id: int
    timestamp: datetime
    filename: str


class TrackPoint(BaseModel):
    latitude: float
    longitude: float
    distance_km: float | None = None


class TrackPredictionRequest(BaseModel):
    current_lat: float = Field(..., description="Current latitude of cyclone center in degrees")
    current_lon: float = Field(..., description="Current longitude of cyclone center in degrees")
    storm_speed_kts: float = Field(10.0, description="Current speed of storm movement in knots")
    storm_dir_deg: float = Field(300.0, description="Heading direction angle in degrees (0-360)")
    past_lat_6h: float | None = None
    past_lon_6h: float | None = None
    past_lat_12h: float | None = None
    past_lon_12h: float | None = None
    past_lat_24h: float | None = None
    past_lon_24h: float | None = None
    dist2land_km: float = 300.0
    month: int = 5


class TrackPredictionResponse(BaseModel):
    current_location: TrackPoint
    forecast_24h: TrackPoint
    forecast_48h: TrackPoint
    movement_direction: str
    heading_degrees: float
    estimated_speed_kmh: float
    model_metrics: dict | None = None

