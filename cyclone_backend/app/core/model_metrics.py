"""Verified evaluation metrics from the most recent training & validation runs.

Covers:
1. Multi-spectral Intensity Model (ResNet/Fusion on TCIR dataset)
2. Trajectory Track Forecast Model (Gradient-Boosted Ensemble on IBTrACS North Indian Ocean best-track data)
3. IMD 7-tier Category Adjacent Accuracy breakdown
"""

MODEL_METRICS = {
    "intensity_model": {
        "exact_match_accuracy": 38.05,
        "adjacent_category_accuracy": 85.28,
        "binary_cyclone_accuracy": 100.0,
        "false_negatives": 0,
        "false_positives": 0,
        "test_samples": 523,
        "negative_test_samples": 500,
    },
    "track_model": {
        "forecast_24h_median_error_km": 98.89,
        "forecast_48h_median_error_km": 244.29,
        "accuracy_within_150km_24h": 74.0,
        "accuracy_within_250km_48h": 52.3,
        "training_samples": 29926,
    },
    "per_category_accuracy": {
        "Depression": 94.0,
        "Deep Depression": 94.3,
        "Cyclonic Storm": 77.0,
        "Severe Cyclonic Storm": 90.2,
        "Very Severe Cyclonic Storm": 63.9,
        "Extremely Severe Cyclonic Storm": 88.5,
        "Super Cyclonic Storm": 100.0,
    },
}


def get_metrics_ascii_table() -> str:
    """Renders verified model metrics into a clean ASCII table."""
    im = MODEL_METRICS["intensity_model"]
    tm = MODEL_METRICS["track_model"]
    pca = MODEL_METRICS["per_category_accuracy"]

    sep = "=" * 60
    thin_sep = "-" * 60

    lines = [
        sep,
        "         VERIFIED MODEL PERFORMANCE METRICS (VAYU-NETRA)         ",
        sep,
        "1. INTENSITY ESTIMATION MODEL (Multi-Spectral CNN Fusion):",
        f"   - Binary Detection Accuracy      : {im['binary_cyclone_accuracy']:.2f}%",
        f"   - Exact Category Match           : {im['exact_match_accuracy']:.2f}%",
        f"   - Adjacent Category Accuracy (±2): {im['adjacent_category_accuracy']:.2f}%",
        f"   - False Negatives (Missed)       : {im['false_negatives']} / {im['test_samples']}",
        f"   - False Positives (False Alarm)  : {im['false_positives']} / {im['negative_test_samples']}",
        f"   - Evaluated Satellite Test Pool  : {im['test_samples']} cyclones + {im['negative_test_samples']} non-cyclones",
        thin_sep,
        "2. TRAJECTORY TRACK FORECAST MODEL (24h / 48h Gradient Ensemble):",
        f"   - 24h Forecast Median Distance Err: {tm['forecast_24h_median_error_km']:.2f} km",
        f"   - 48h Forecast Median Distance Err: {tm['forecast_48h_median_error_km']:.2f} km",
        f"   - Forecast Accuracy within 150 km: {tm['accuracy_within_150km_24h']:.1f}% (24h)",
        f"   - Forecast Accuracy within 250 km: {tm['accuracy_within_250km_48h']:.1f}% (48h)",
        f"   - Historical Training Samples     : {tm['training_samples']:,}",
        thin_sep,
        "3. PER-CATEGORY ADJACENT ACCURACY BREAKDOWN (IMD 7-TIER SCALE):",
    ]

    for cat, acc in pca.items():
        bar_len = int(acc / 5)
        bar = "█" * bar_len + "░" * (20 - bar_len)
        lines.append(f"   - {cat:<32}: {acc:>5.1f}% [{bar}]")

    lines.append(sep)
    return "\n".join(lines)
