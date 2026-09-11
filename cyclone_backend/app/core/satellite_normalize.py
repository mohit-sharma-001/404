"""
Satellite Channel Normalization Module.

Single source of truth for 2D satellite channel array normalization across
both training (TCIRDataset) and live inference (preprocessing).
"""

import numpy as np


def normalize_satellite_channel(raw_array: np.ndarray) -> np.ndarray:
    """
    Takes a raw 2D satellite channel array and returns it normalized to 0-1 range,
    with a FIXED, documented convention: LOW values (near 0.0) = cold cloud tops,
    HIGH values (near 1.0) = warm background. This is the single source of truth
    for satellite data normalization used by BOTH training and live inference.
    """
    arr = np.asarray(raw_array, dtype=np.float32)

    # Squeeze extra leading/trailing single dimensions if present (e.g., (1, H, W) -> (H, W))
    if arr.ndim == 3 and (arr.shape[0] == 1 or arr.shape[-1] == 1):
        arr = np.squeeze(arr)

    # Clean NaNs and Infs, consistent with TCIRDataset handling
    arr = np.nan_to_num(arr, nan=0.0, posinf=0.0, neginf=0.0)

    arr_min = float(np.min(arr))
    arr_max = float(np.max(arr))

    if arr_max > arr_min:
        norm = (arr - arr_min) / (arr_max - arr_min)
    else:
        norm = np.zeros_like(arr, dtype=np.float32)

    return norm.astype(np.float32)
