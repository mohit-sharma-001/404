"""
Interactive Terminal Manual Testing Script for Cyclone Track Prediction.

Run in terminal:
    python test_track_cli.py
"""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.models.track_inference import TrackModel

PRESET_STORMS = {
    "1": {
        "name": "Cyclone Amphan (Bay of Bengal, 2020)",
        "current_lat": 15.0,
        "current_lon": 86.5,
        "storm_speed_kts": 12.0,
        "storm_dir_deg": 350.0,
        "past_lat_6h": 14.3,
        "past_lon_6h": 86.5,
        "past_lat_12h": 13.5,
        "past_lon_12h": 86.4,
        "past_lat_24h": 12.0,
        "past_lon_24h": 86.3,
    },
    "2": {
        "name": "Cyclone Nisarga (Arabian Sea, 2020)",
        "current_lat": 15.5,
        "current_lon": 71.2,
        "storm_speed_kts": 10.0,
        "storm_dir_deg": 20.0,
        "past_lat_6h": 14.8,
        "past_lon_6h": 71.0,
        "past_lat_12h": 14.0,
        "past_lon_12h": 70.8,
        "past_lat_24h": 12.5,
        "past_lon_24h": 70.5,
    },
    "3": {
        "name": "Cyclone Tauktae (Arabian Sea, 2021)",
        "current_lat": 16.2,
        "current_lon": 72.8,
        "storm_speed_kts": 13.0,
        "storm_dir_deg": 340.0,
        "past_lat_6h": 15.3,
        "past_lon_6h": 73.1,
        "past_lat_12h": 14.4,
        "past_lon_12h": 73.4,
        "past_lat_24h": 12.5,
        "past_lon_24h": 74.0,
    },
    "4": {
        "name": "Cyclone Biparjoy (Arabian Sea, 2023)",
        "current_lat": 17.5,
        "current_lon": 67.3,
        "storm_speed_kts": 9.0,
        "storm_dir_deg": 10.0,
        "past_lat_6h": 16.8,
        "past_lon_6h": 67.2,
        "past_lat_12h": 16.0,
        "past_lon_12h": 67.1,
        "past_lat_24h": 14.5,
        "past_lon_24h": 66.8,
    },
}


def print_prediction_results(res: dict, storm_name: str = "Custom Query"):
    print("\n" + "=" * 70)
    print(f" 🌀 CYCLONE TRACK FORECAST REPORT: {storm_name.upper()}")
    print("=" * 70)
    print(f" 📍 Current Location  : Lat {res['current_location']['latitude']}°N, Lon {res['current_location']['longitude']}°E")
    print(f" 🧭 Heading Direction : {res['movement_direction']} ({res['heading_degrees']}°)")
    print(f" ⚡ Estimated Speed   : {res['estimated_speed_kmh']} km/h")
    print("-" * 70)
    print(" 🚀 FUTURE TRACK FORECAST:")
    print(f"  ▶ +24 HOUR FORECAST : Lat {res['forecast_24h']['latitude']}°N, Lon {res['forecast_24h']['longitude']}°E (Distance: {res['forecast_24h']['distance_km']} km)")
    print(f"  ▶ +48 HOUR FORECAST : Lat {res['forecast_48h']['latitude']}°N, Lon {res['forecast_48h']['longitude']}°E (Distance: {res['forecast_48h']['distance_km']} km)")
    
    metrics = res.get("model_metrics")
    if metrics:
        print("-" * 70)
        print(" 🎯 MODEL CONFIDENCE & ERROR METRICS:")
        print(f"  • 24h Median Distance Error : {metrics.get('median_err_24h_km', 'N/A')} km")
        print(f"  • 48h Median Distance Error : {metrics.get('median_err_48h_km', 'N/A')} km")
        print(f"  • 24h Accuracy (<=100 km)   : {metrics.get('accuracy_24h_within_100km', 'N/A')}%")
    print("=" * 70 + "\n")


def main():
    print("=" * 70)
    print(" 🌀 MANUAL CYCLONE TRACK PREDICTION CLI TESTER")
    print("=" * 70)
    tm = TrackModel()

    print("\nSelect an option to test:")
    print("  1. Preset: Cyclone Amphan (Bay of Bengal, 2020)")
    print("  2. Preset: Cyclone Nisarga (Arabian Sea, 2020)")
    print("  3. Preset: Cyclone Tauktae (Arabian Sea, 2021)")
    print("  4. Preset: Cyclone Biparjoy (Arabian Sea, 2023)")
    print("  5. Custom Input (Enter Lat, Lon, Speed, Direction manually)")

    choice = input("\nEnter choice [1-5] (default is 1): ").strip() or "1"

    if choice in PRESET_STORMS:
        preset = PRESET_STORMS[choice]
        print(f"\nRunning track prediction for {preset['name']}...")
        res = tm.predict(
            current_lat=preset["current_lat"],
            current_lon=preset["current_lon"],
            storm_speed_kts=preset["storm_speed_kts"],
            storm_dir_deg=preset["storm_dir_deg"],
            past_lat_6h=preset["past_lat_6h"],
            past_lon_6h=preset["past_lon_6h"],
            past_lat_12h=preset["past_lat_12h"],
            past_lon_12h=preset["past_lon_12h"],
            past_lat_24h=preset["past_lat_24h"],
            past_lon_24h=preset["past_lon_24h"],
        )
        print_prediction_results(res, preset["name"])
    elif choice == "5":
        try:
            current_lat = float(input("Enter Current Latitude (e.g. 15.0): ").strip() or "15.0")
            current_lon = float(input("Enter Current Longitude (e.g. 85.0): ").strip() or "85.0")
            storm_speed_kts = float(input("Enter Speed in knots (e.g. 12.0): ").strip() or "12.0")
            storm_dir_deg = float(input("Enter Direction Angle in degrees 0-360 (e.g. 310.0): ").strip() or "310.0")

            res = tm.predict(
                current_lat=current_lat,
                current_lon=current_lon,
                storm_speed_kts=storm_speed_kts,
                storm_dir_deg=storm_dir_deg,
            )
            print_prediction_results(res, "Custom Input Track Test")
        except ValueError:
            print("Invalid input values. Please enter numbers.")
    else:
        print("Invalid option selected.")


if __name__ == "__main__":
    main()
