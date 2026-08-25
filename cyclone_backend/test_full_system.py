"""
Full System Terminal Tester (Satellite Intensity Nowcast + 24h/48h Track Forecast).

Loads test satellite images from data/test_samples/ and runs both:
1. Cyclone CNN Model (Intensity, Category, Wind Speed, Confidence)
2. Track Prediction Model (+24h and +48h Lat/Lon, Heading, Distance)

Run in terminal:
    python test_full_system.py
"""

import json
import os
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.core.preprocessing import preprocess_multisource
from app.models.inference import CycloneModel
from app.models.track_inference import TrackModel

TEST_SAMPLES = [
    {
        "id": "Sample 1 (Cyclone Amphan - Bay of Bengal)",
        "ir_path": "data/test_samples/sample_1_ir.png",
        "wv_path": "data/test_samples/sample_1_wv.png",
        "current_lat": 15.0,
        "current_lon": 86.5,
        "speed_kts": 12.0,
        "dir_deg": 350.0,
        "past_lat_6h": 14.3,
        "past_lon_6h": 86.5,
        "past_lat_12h": 13.5,
        "past_lon_12h": 86.4,
    },
    {
        "id": "Sample 2 (Cyclone Tauktae - Arabian Sea)",
        "ir_path": "data/test_samples/sample_2_ir.png",
        "wv_path": "data/test_samples/sample_2_wv.png",
        "current_lat": 16.2,
        "current_lon": 72.8,
        "speed_kts": 13.0,
        "dir_deg": 340.0,
        "past_lat_6h": 15.3,
        "past_lon_6h": 73.1,
        "past_lat_12h": 14.4,
        "past_lon_12h": 73.4,
    },
    {
        "id": "Sample 3 (Cyclone Biparjoy - Arabian Sea)",
        "ir_path": "data/test_samples/sample_3_ir.png",
        "wv_path": "data/test_samples/sample_3_wv.png",
        "current_lat": 17.5,
        "current_lon": 67.3,
        "speed_kts": 9.0,
        "dir_deg": 10.0,
        "past_lat_6h": 16.8,
        "past_lon_6h": 67.2,
        "past_lat_12h": 16.0,
        "past_lon_12h": 67.1,
    },
]


def run_full_system_test():
    print("=" * 75)
    print(" 🌀 FULL CYCLONE SYSTEM TERMINAL TESTER (INTENSITY NOWCAST + TRACK FORECAST)")
    print("=" * 75)

    print("\n[1/2] Initializing Models...")
    intensity_model = CycloneModel()
    track_model = TrackModel()
    print("✅ Models loaded successfully!\n")

    for i, sample in enumerate(TEST_SAMPLES, 1):
        print("=" * 75)
        print(f" 📦 TEST SAMPLE #{i}: {sample['id'].upper()}")
        print("=" * 75)

        # 1. Satellite Image Preprocessing & Nowcast Intensity Prediction
        ir_bytes = None
        wv_bytes = None

        if os.path.exists(sample["ir_path"]):
            with open(sample["ir_path"], "rb") as f:
                ir_bytes = f.read()
        if os.path.exists(sample["wv_path"]):
            with open(sample["wv_path"], "rb") as f:
                wv_bytes = f.read()

        tensor, sources_used = preprocess_multisource(ir_bytes=ir_bytes, wv_bytes=wv_bytes)
        nowcast_pred = intensity_model.predict(tensor, sources_used)

        # 2. Track Forecast Prediction
        track_pred = track_model.predict(
            current_lat=sample["current_lat"],
            current_lon=sample["current_lon"],
            storm_speed_kts=sample["speed_kts"],
            storm_dir_deg=sample["dir_deg"],
            past_lat_6h=sample.get("past_lat_6h"),
            past_lon_6h=sample.get("past_lon_6h"),
            past_lat_12h=sample.get("past_lat_12h"),
            past_lon_12h=sample.get("past_lon_12h"),
        )

        # Combined Payload Output
        combined_output = {
            "sample_id": sample["id"],
            "satellite_sources": sources_used,
            "nowcast_intensity": {
                "has_cyclone": nowcast_pred["has_cyclone"],
                "intensity_category": nowcast_pred["intensity_category"],
                "secondary_category": nowcast_pred["secondary_category"],
                "estimated_wind_speed_kmh": nowcast_pred["estimated_wind_speed_kmh"],
                "model_confidence": nowcast_pred["confidence"],
                "trend": nowcast_pred["trend"],
            },
            "track_forecast": {
                "current_location": track_pred["current_location"],
                "heading_direction": f"{track_pred['movement_direction']} ({track_pred['heading_degrees']}°)",
                "estimated_speed_kmh": track_pred["estimated_speed_kmh"],
                "forecast_24h": track_pred["forecast_24h"],
                "forecast_48h": track_pred["forecast_48h"],
            },
        }

        print("📄 API COMBINED RESPONSE JSON:")
        print(json.dumps(combined_output, indent=2))
        print("\n" + "-" * 75 + "\n")


if __name__ == "__main__":
    run_full_system_test()
