"""
Track Dataset Preprocessor for NOAA IBTrACS North Indian Ocean Cyclone Data.

Extracts track historical trajectory features (lags, speeds, directions)
and builds future displacement targets for 24-hour and 48-hour forecasting.
"""

import math
import os
from pathlib import Path
import numpy as np
import pandas as pd

ROOT_DIR = Path(__file__).resolve().parents[2]
DEFAULT_CSV_PATH = ROOT_DIR / "ibtracs.NI.list.v04r01.csv"


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates Great-Circle distance in kilometers between two lat/lon points."""
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def get_compass_direction(deg: float) -> str:
    """Converts a heading angle in degrees (0-360) to a 16-point compass direction."""
    if deg is None or np.isnan(deg):
        return "Unknown"
    deg = deg % 360
    directions = [
        "N", "NNE", "NE", "ENE",
        "E", "ESE", "SE", "SSE",
        "S", "SSW", "SW", "WSW",
        "W", "WNW", "NW", "NNW"
    ]
    idx = int(round(deg / 22.5)) % 16
    return directions[idx]


def prepare_track_dataset(csv_path: str | Path | None = None) -> pd.DataFrame:
    """Loads IBTrACS CSV, filters North Indian Ocean data, cleans types,
    engineers lag features, and constructs +24h and +48h forecast targets.

    Returns:
        DataFrame containing processed features and target columns ready for training.
    """
    csv_path = Path(csv_path) if csv_path else DEFAULT_CSV_PATH
    if not csv_path.exists():
        raise FileNotFoundError(f"IBTrACS CSV file not found at '{csv_path}'")

    # Read IBTrACS CSV (skip row 1 which contains units string)
    df = pd.read_csv(csv_path, low_memory=False, skiprows=[1])

    # Convert numeric columns
    numeric_cols = ["LAT", "LON", "STORM_SPEED", "STORM_DIR", "DIST2LAND", "SEASON"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Clean & filter valid rows
    df = df.dropna(subset=["SID", "LAT", "LON", "ISO_TIME"]).copy()
    df["ISO_TIME"] = pd.to_datetime(df["ISO_TIME"], errors="coerce")
    df = df.dropna(subset=["ISO_TIME"]).sort_values(by=["SID", "ISO_TIME"]).reset_index(drop=True)

    # Impute or fill storm speed/direction
    df["STORM_SPEED"] = df["STORM_SPEED"].fillna(df["STORM_SPEED"].median())
    df["STORM_DIR"] = df["STORM_DIR"].fillna(0.0)
    df["DIST2LAND"] = df["DIST2LAND"].fillna(df["DIST2LAND"].median())

    # Convert direction angle to Radians for sin/cos decomposition
    dir_rad = np.radians(df["STORM_DIR"])
    df["dir_sin"] = np.sin(dir_rad)
    df["dir_cos"] = np.cos(dir_rad)

    # Create Grouped Lag Features per Storm ID (3-hour resolution per step)
    # Step shifts: 2 steps = 6h, 4 steps = 12h, 6 steps = 18h, 8 steps = 24h
    grouped = df.groupby("SID")

    df["lat_lag6h"] = grouped["LAT"].shift(2)
    df["lon_lag6h"] = grouped["LON"].shift(2)
    df["lat_lag12h"] = grouped["LAT"].shift(4)
    df["lon_lag12h"] = grouped["LON"].shift(4)
    df["lat_lag24h"] = grouped["LAT"].shift(8)
    df["lon_lag24h"] = grouped["LON"].shift(8)

    # Compute historical displacement vectors
    df["dlat_past6h"] = df["LAT"] - df["lat_lag6h"]
    df["dlon_past6h"] = df["LON"] - df["lon_lag6h"]
    df["dlat_past12h"] = df["LAT"] - df["lat_lag12h"]
    df["dlon_past12h"] = df["LON"] - df["lon_lag12h"]
    df["dlat_past24h"] = df["LAT"] - df["lat_lag24h"]
    df["dlon_past24h"] = df["LON"] - df["lon_lag24h"]

    # Month feature
    df["month"] = df["ISO_TIME"].dt.month

    # Generate Target Values:
    # +24h = 8 steps ahead (8 * 3h = 24h)
    # +48h = 16 steps ahead (16 * 3h = 48h)
    df["lat_target_24h"] = grouped["LAT"].shift(-8)
    df["lon_target_24h"] = grouped["LON"].shift(-8)
    df["lat_target_48h"] = grouped["LAT"].shift(-16)
    df["lon_target_48h"] = grouped["LON"].shift(-16)

    # Target displacements from current position (delta lat/lon)
    df["dlat_target_24h"] = df["lat_target_24h"] - df["LAT"]
    df["dlon_target_24h"] = df["lon_target_24h"] - df["LON"]
    df["dlat_target_48h"] = df["lat_target_48h"] - df["LAT"]
    df["dlon_target_48h"] = df["lon_target_48h"] - df["LON"]

    # Drop rows without past lags or future target labels
    cleaned_df = df.dropna(
        subset=[
            "lat_lag6h",
            "dlat_past6h",
            "dlat_past12h",
            "dlat_target_24h",
            "dlon_target_24h",
            "dlat_target_48h",
            "dlon_target_48h",
        ]
    ).reset_index(drop=True)

    return cleaned_df


FEATURE_COLUMNS = [
    "LAT",
    "LON",
    "STORM_SPEED",
    "STORM_DIR",
    "dir_sin",
    "dir_cos",
    "DIST2LAND",
    "month",
    "dlat_past6h",
    "dlon_past6h",
    "dlat_past12h",
    "dlon_past12h",
    "dlat_past24h",
    "dlon_past24h",
]

TARGET_COLUMNS_24H = ["dlat_target_24h", "dlon_target_24h"]
TARGET_COLUMNS_48H = ["dlat_target_48h", "dlon_target_48h"]
