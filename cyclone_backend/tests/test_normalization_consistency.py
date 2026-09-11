"""
Normalization Consistency Test.

Verifies that:
1. Training Path: TCIRDataset.__getitem__
2. Live API Path: Raw H5 -> Exported PNG on disk -> preprocess_multisource()

produce numerically consistent normalized IR1 channel tensors within a tolerance of 0.02.
"""

import os
import sys
from pathlib import Path

# Add cyclone_backend to sys.path
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
if (PROJECT_ROOT / "cyclone_backend").exists():
    sys.path.insert(0, str(PROJECT_ROOT / "cyclone_backend"))
elif (PROJECT_ROOT / "app").exists():
    sys.path.insert(0, str(PROJECT_ROOT))
else:
    sys.path.insert(0, str(CURRENT_DIR))

import h5py
import numpy as np
import torch

from app.core.preprocessing import preprocess_multisource
from app.export_test_sample import channel_to_pil_image
from app.training.dataset_loader import TCIRDataset, combine_and_split


def test_normalization_consistency():
    print("\n" + "=" * 70)
    print("      RUNNING SATELLITE NORMALIZATION CONSISTENCY TEST")
    print("=" * 70)

    # 1. Load splits and get real Indian Ocean test sample
    print("\n[Step 1] Loading splits via combine_and_split()...")
    stage1_train, stage2_train, stage2_val, stage2_test, combined_df = combine_and_split()

    assert len(stage2_test) > 0, "stage2_test split is empty!"

    # Create dataset for held-out stage2_test
    test_dataset = TCIRDataset(file_indices=stage2_test, info_df=combined_df, augment=False)
    assert len(test_dataset) > 0, "test_dataset has no samples!"

    target_h5_path, row_idx = test_dataset.samples[0]
    print(f"   Selected Real Sample: HDF5={target_h5_path}, Row Index={row_idx}")

    # 2. Process through TRAINING path
    print("\n[Step 2] Processing through TRAINING path (TCIRDataset.__getitem__)...")
    train_tensor, cat_idx, wind_kmh, vis_missing = test_dataset[0]
    train_ir1 = train_tensor[0].numpy()  # Channel 0: IR1 -> shape (224, 224)
    print(f"   Training IR1 Tensor Shape: {train_ir1.shape}")
    print(f"   Training IR1 Range: [{train_ir1.min():.5f}, {train_ir1.max():.5f}], Mean: {train_ir1.mean():.5f}")

    # 3. Process through LIVE API path
    print("\n[Step 3] Processing through LIVE API path (Raw H5 -> Exported PNG -> preprocess_multisource)...")
    with h5py.File(target_h5_path, "r") as f:
        raw_sample = f["matrix"][row_idx]
    raw_ir1 = raw_sample[:, :, 0] if raw_sample.ndim == 3 else raw_sample[0]

    # Export to disk using export_test_sample's channel_to_pil_image
    pil_img = channel_to_pil_image(raw_ir1)
    temp_dir = Path("cyclone_backend/data/test_samples") if (Path("cyclone_backend/data").exists()) else Path("data/test_samples")
    temp_dir.mkdir(parents=True, exist_ok=True)
    temp_png_path = temp_dir / "test_consistency_ir1.png"
    pil_img.save(temp_png_path)
    print(f"   Saved temporary PNG to disk: {temp_png_path}")

    # Read bytes back from disk and preprocess via preprocess_multisource
    with open(temp_png_path, "rb") as f:
        png_bytes = f.read()

    live_tensor, sources_used = preprocess_multisource(ir_bytes=png_bytes)
    live_ir1 = live_tensor[0, 0].numpy()  # Batch 0, Channel 0 (IR1) -> shape (224, 224)
    print(f"   Live API IR1 Tensor Shape: {live_ir1.shape}, Sources: {sources_used}")
    print(f"   Live API IR1 Range: [{live_ir1.min():.5f}, {live_ir1.max():.5f}], Mean: {live_ir1.mean():.5f}")

    # 4. Compare resulting IR1 channel tensors
    print("\n[Step 4] Comparing Training Path vs Live API Path (Tolerance = 0.02)...")
    tol = 0.02
    min_diff = abs(train_ir1.min() - live_ir1.min())
    max_diff = abs(train_ir1.max() - live_ir1.max())
    mean_diff = abs(train_ir1.mean() - live_ir1.mean())
    overall_max_abs_diff = float(np.max(np.abs(train_ir1 - live_ir1)))

    print("-" * 70)
    print(f"{'Metric':<20} | {'Training Path':<15} | {'Live API Path':<15} | {'Difference':<12} | {'Status':<6}")
    print("-" * 70)
    print(f"{'Min (Cold Clouds)':<20} | {train_ir1.min():<15.5f} | {live_ir1.min():<15.5f} | {min_diff:<12.5f} | {'PASS' if min_diff <= tol else 'FAIL'}")
    print(f"{'Max (Warm Bkg)':<20} | {train_ir1.max():<15.5f} | {live_ir1.max():<15.5f} | {max_diff:<12.5f} | {'PASS' if max_diff <= tol else 'FAIL'}")
    print(f"{'Mean':<20} | {train_ir1.mean():<15.5f} | {live_ir1.mean():<15.5f} | {mean_diff:<12.5f} | {'PASS' if mean_diff <= tol else 'FAIL'}")
    print(f"{'Max Pixel Diff':<20} | {'-':<15} | {'-':<15} | {overall_max_abs_diff:<12.5f} | {'PASS' if overall_max_abs_diff <= tol else 'FAIL'}")
    print("-" * 70)

    # Compare 5 random pixel coordinates
    rng = np.random.default_rng(42)
    sample_y = rng.integers(0, 224, size=5)
    sample_x = rng.integers(0, 224, size=5)

    print("\nRandom Coordinate Comparisons (5 sample pixels):")
    print(f"{'Pixel (Y, X)':<20} | {'Training Value':<15} | {'Live API Value':<15} | {'Difference':<12} | {'Status':<6}")
    print("-" * 70)

    all_pixels_pass = True
    for y, x in zip(sample_y, sample_x):
        val_train = train_ir1[y, x]
        val_live = live_ir1[y, x]
        diff = abs(val_train - val_live)
        pixel_status = diff <= tol
        if not pixel_status:
            all_pixels_pass = False
        print(f"({y:3d}, {x:3d}){'':<11} | {val_train:<15.5f} | {val_live:<15.5f} | {diff:<12.5f} | {'PASS' if pixel_status else 'FAIL'}")

    print("-" * 70)

    # Assertions
    assert min_diff <= tol, f"Min difference {min_diff:.5f} exceeds tolerance {tol}"
    assert max_diff <= tol, f"Max difference {max_diff:.5f} exceeds tolerance {tol}"
    assert mean_diff <= tol, f"Mean difference {mean_diff:.5f} exceeds tolerance {tol}"
    assert all_pixels_pass, "At least one sample pixel difference exceeded tolerance 0.02"

    print("\n" + "=" * 70)
    print(">>> OVERALL RESULT: PASS - Training and Live API normalizations match! <<<")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    test_normalization_consistency()
