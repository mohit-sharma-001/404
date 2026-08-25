"""
Training Script for Cyclone Track Prediction Model (24h and 48h Forecast).

Trains Multi-Output Gradient Boosting models to predict 24h & 48h spatial displacements,
evaluates Great-Circle distance errors per storm, and prints accuracy formatted with storm names.
"""

import os
import pickle
import sys
from pathlib import Path
import numpy as np
import pandas as pd

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.multioutput import MultiOutputRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from app.training.track_dataset import (
    FEATURE_COLUMNS,
    TARGET_COLUMNS_24H,
    TARGET_COLUMNS_48H,
    haversine_distance,
    prepare_track_dataset,
)

MODEL_SAVE_PATH = ROOT_DIR / "data" / "track_model.pkl"


def train_track_model(csv_path: str | None = None) -> dict:
    """Trains 24h and 48h cyclone track models, calculates per-storm accuracy,
    and prints formatted performance metrics to the terminal.
    """
    print("=" * 70)
    print(" 🌀 TROPICAL CYCLONE TRACK PREDICTION MODEL TRAINING")
    print("=" * 70)
    print("Loading and preprocessing IBTrACS track dataset...")
    df = prepare_track_dataset(csv_path)
    print(f"✅ Preprocessed successfully. Total valid track observations: {len(df)}")

    # Time-based split: Train on seasons < 2021, Test on seasons >= 2021
    train_mask = df["SEASON"] < 2021
    test_mask = df["SEASON"] >= 2021

    if train_mask.sum() == 0 or test_mask.sum() == 0:
        train_mask = np.random.rand(len(df)) < 0.8
        test_mask = ~train_mask

    X_train = df.loc[train_mask, FEATURE_COLUMNS]
    X_test = df.loc[test_mask, FEATURE_COLUMNS]

    y24_train = df.loc[train_mask, TARGET_COLUMNS_24H]
    y24_test = df.loc[test_mask, TARGET_COLUMNS_24H]

    y48_train = df.loc[train_mask, TARGET_COLUMNS_48H]
    y48_test = df.loc[test_mask, TARGET_COLUMNS_48H]

    print(f"📊 Training Set Size: {len(X_train)} samples | Test Set Size: {len(X_test)} samples")

    # 1. Train 24-Hour Forecast Model
    print("\n[1/2] Training 24-Hour Track Prediction Model (HistGradientBoosting)...")
    base_reg_24 = HistGradientBoostingRegressor(max_iter=150, random_state=42)
    model_24h = MultiOutputRegressor(base_reg_24)
    pipeline_24h = Pipeline([("scaler", StandardScaler()), ("model", model_24h)])
    pipeline_24h.fit(X_train, y24_train)
    print("✅ 24-Hour Model trained successfully!")

    # 2. Train 48-Hour Forecast Model
    print("\n[2/2] Training 48-Hour Track Prediction Model (HistGradientBoosting)...")
    base_reg_48 = HistGradientBoostingRegressor(max_iter=150, random_state=42)
    model_48h = MultiOutputRegressor(base_reg_48)
    pipeline_48h = Pipeline([("scaler", StandardScaler()), ("model", model_48h)])
    pipeline_48h.fit(X_train, y48_train)
    print("✅ 48-Hour Model trained successfully!")

    # 3. Evaluate Predictions
    preds_24 = pipeline_24h.predict(X_test)
    preds_48 = pipeline_48h.predict(X_test)

    test_df = df.loc[test_mask].reset_index(drop=True)
    test_df["err_24h_km"] = 0.0
    test_df["err_48h_km"] = 0.0

    for i in range(len(test_df)):
        cur_lat = test_df.loc[i, "LAT"]
        cur_lon = test_df.loc[i, "LON"]

        actual_lat_24 = cur_lat + test_df.loc[i, "dlat_target_24h"]
        actual_lon_24 = cur_lon + test_df.loc[i, "dlon_target_24h"]
        pred_lat_24 = cur_lat + preds_24[i, 0]
        pred_lon_24 = cur_lon + preds_24[i, 1]
        test_df.loc[i, "err_24h_km"] = haversine_distance(actual_lat_24, actual_lon_24, pred_lat_24, pred_lon_24)

        actual_lat_48 = cur_lat + test_df.loc[i, "dlat_target_48h"]
        actual_lon_48 = cur_lon + test_df.loc[i, "dlon_target_48h"]
        pred_lat_48 = cur_lat + preds_48[i, 0]
        pred_lon_48 = cur_lon + preds_48[i, 1]
        test_df.loc[i, "err_48h_km"] = haversine_distance(actual_lat_48, actual_lon_48, pred_lat_48, pred_lon_48)

    mean_err_24h = float(test_df["err_24h_km"].mean())
    median_err_24h = float(test_df["err_24h_km"].median())
    mean_err_48h = float(test_df["err_48h_km"].mean())
    median_err_48h = float(test_df["err_48h_km"].median())

    acc_24h_100km = float((test_df["err_24h_km"] <= 100).mean() * 100)
    acc_24h_150km = float((test_df["err_24h_km"] <= 150).mean() * 100)
    acc_48h_250km = float((test_df["err_48h_km"] <= 250).mean() * 100)

    # Print Formatted Evaluation Results
    print("\n" + "=" * 70)
    print(" 📈 OVERALL MODEL ACCURACY & PERFORMANCE METRICS")
    print("=" * 70)
    print(f" Model Name                     : Gradient Boosted MultiOutput Track Regressor")
    print(f" 24h Forecast Median Distance Error : {median_err_24h:.2f} km  (Mean: {mean_err_24h:.2f} km)")
    print(f" 48h Forecast Median Distance Error : {median_err_48h:.2f} km  (Mean: {mean_err_48h:.2f} km)")
    print(f" 24h Accuracy (within 100 km)   : {acc_24h_100km:.1f}%")
    print(f" 24h Accuracy (within 150 km)   : {acc_24h_150km:.1f}%")
    print(f" 48h Accuracy (within 250 km)   : {acc_48h_250km:.1f}%")
    print("=" * 70)

    # Per-Storm Accuracy Table Breakdown
    print("\n 🌪️ INDIVIDUAL CYCLONE TEST ACCURACY (BY STORM NAME)")
    print("-" * 70)
    print(f"{'STORM NAME':<18} | {'SEASON':<6} | {'24H MEDIAN ERR (KM)':<20} | {'48H MEDIAN ERR (KM)':<20}")
    print("-" * 70)

    # Group by Storm Name & SID
    storm_groups = test_df.groupby(["NAME", "SEASON"])
    storm_metrics = []

    for (name, season), group in storm_groups:
        if len(group) < 3:
            continue
        clean_name = str(name).strip() if pd.notna(name) and str(name).strip() != "UNNAMED" else "CYCLONE"
        med_24 = group["err_24h_km"].median()
        med_48 = group["err_48h_km"].median()
        storm_metrics.append((clean_name, int(season), med_24, med_48))
        print(f"{clean_name:<18} | {season:<6} | {med_24:<20.2f} | {med_48:<20.2f}")

    print("-" * 70)

    # 4. Save Model Pipeline
    MODEL_SAVE_PATH.parent.mkdir(parents=True, exist_ok=True)
    track_artifact = {
        "pipeline_24h": pipeline_24h,
        "pipeline_48h": pipeline_48h,
        "feature_columns": FEATURE_COLUMNS,
        "metrics": {
            "mean_err_24h_km": round(mean_err_24h, 2),
            "median_err_24h_km": round(median_err_24h, 2),
            "mean_err_48h_km": round(mean_err_48h, 2),
            "median_err_48h_km": round(median_err_48h, 2),
            "accuracy_24h_within_100km": round(acc_24h_100km, 1),
            "accuracy_24h_within_150km": round(acc_24h_150km, 1),
        },
    }

    with open(MODEL_SAVE_PATH, "wb") as f:
        pickle.dump(track_artifact, f)

    print(f"\n💾 Track prediction model successfully saved to '{MODEL_SAVE_PATH}'\n")

    return track_artifact["metrics"]


if __name__ == "__main__":
    train_track_model()
