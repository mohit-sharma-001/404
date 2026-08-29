"""
Export Test Samples Script.

Picks random samples from the held-out Indian Ocean test set (stage2_test),
extracts IR1 and WV satellite channels, converts them to grayscale PNG images,
saves them to data/test_samples/, and prints ground truth intensity metadata.
"""

import os
import sys
from pathlib import Path

# Ensure project root is in sys.path when script is executed directly
ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import h5py
import numpy as np
from PIL import Image

from app.core.config import settings
from app.training.dataset_loader import (
    get_storm_level_split,
    knots_to_kmh,
    load_tcir_dataframe,
    wind_speed_to_imd_category,
)


def channel_to_pil_image(channel_data: np.ndarray) -> Image.Image:
    """Convert floating-point satellite channel data (with possible NaNs) into an 8-bit grayscale PIL Image.
    Inverts temperature/intensity scale so cold clouds appear white/bright and warm ocean appears dark.
    """
    clean_data = np.nan_to_num(channel_data, nan=channel_data[~np.isnan(channel_data)].max() if np.any(~np.isnan(channel_data)) else 0.0)
    c_min = clean_data.min()
    c_max = clean_data.max()

    if c_max > c_min:
        norm = (c_max - clean_data) / (c_max - c_min) * 255.0
    else:
        norm = np.zeros_like(clean_data)

    return Image.fromarray(norm.astype(np.uint8))


def export_test_samples(num_samples: int = 3, output_dir: str = "data/test_samples", seed: int = 123):
    """Picks random samples from held-out stage2_test split and saves IR1/WV images with metadata."""
    h5_path = settings.TCIR_DATA_PATH
    print(f"--- Exporting Test Samples from TCIR Dataset ---")
    print(f"Loading Indian Ocean Dataset from: {h5_path}")

    # 1. Load DataFrame & Storm-Level Split
    io_df = load_tcir_dataframe(h5_path)
    train_idx, val_idx, test_idx = get_storm_level_split(io_df, val_frac=0.15, test_frac=0.15, seed=42)

    print(f"Total Test Samples Available: {len(test_idx)}")

    # 2. Pick Random Samples from Test Set
    rng = np.random.default_rng(seed)
    chosen_indices = rng.choice(test_idx, size=num_samples, replace=False).tolist()

    os.makedirs(output_dir, exist_ok=True)
    vmax_col = "Vmax" if "Vmax" in io_df.columns else "vmax"
    storm_col = "ID" if "ID" in io_df.columns else "id"

    print(f"\nSaved {num_samples} test samples to: {output_dir}\n")
    print(f"=" * 70)
    print(f"{'Sample #':<10} | {'Storm ID':<10} | {'Ground Truth Category':<30} | {'Wind Speed':<15}")
    print(f"=" * 70)

    # 3. Extract & Export Channels
    with h5py.File(h5_path, "r") as f:
        matrix = f["matrix"]

        for i, idx in enumerate(chosen_indices, 1):
            row = io_df.loc[idx]
            storm_id = str(row[storm_col])
            vmax_knots = float(row[vmax_col])
            wind_kmh = knots_to_kmh(vmax_knots)
            category = wind_speed_to_imd_category(wind_kmh, verbose=False)

            raw_sample = matrix[idx]

            # Extract IR1 (channel 0) and WV (channel 1)
            ir1_raw = raw_sample[:, :, 0] if raw_sample.ndim == 3 else raw_sample[0]
            wv_raw = raw_sample[:, :, 1] if raw_sample.ndim == 3 else raw_sample[1]

            ir1_img = channel_to_pil_image(ir1_raw)
            wv_img = channel_to_pil_image(wv_raw)

            ir_filename = f"sample_{i}_ir.png"
            wv_filename = f"sample_{i}_wv.png"

            ir1_img.save(os.path.join(output_dir, ir_filename))
            wv_img.save(os.path.join(output_dir, wv_filename))

            print(
                f"Sample {i:<3} | {storm_id:<10} | {category:<30} | {wind_kmh:.1f} km/h ({vmax_knots:.0f} kt)"
            )
            print(f"           Files: [IR1] {ir_filename:<18} | [WV] {wv_filename}")
            print(f"-" * 70)

    print(f"\nDone! You can now upload these test images to the /predict API endpoint at http://127.0.0.1:8000/docs\n")


if __name__ == "__main__":
    export_test_samples()
