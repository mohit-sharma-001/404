"""
Dataset Loader for Multi-Source Cyclone Data (TCIR Dataset).
Replaces dummy dataset with real dataset built on TCIR HDF5 imagery data.
Supports single-file (Indian Ocean) and multi-file (Global + Indian Ocean) pretraining/fine-tuning pipelines.
"""

import sys
from pathlib import Path
from typing import Dict, List, Tuple, Union

# Ensure project root is in sys.path when script is executed directly
ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import h5py
import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset
from app.core.config import settings


# Apply PyTables backward-compatibility patch for pandas HDF5 reading
def _patch_pytables_compat():
    try:
        import tables
        from tables.attributeset import AttributeSet

        orig_g_getattr = AttributeSet._g_getattr

        def patched_g_getattr(self, node, name):
            val = orig_g_getattr(self, node, name)
            if isinstance(val, bytes):
                val = val.decode("utf-8")
            if name == "encoding" and val == "N.":
                return "utf-8"
            return val

        AttributeSet._g_getattr = patched_g_getattr
    except Exception:
        pass


_patch_pytables_compat()

IMD_CATEGORIES = [
    "Depression",
    "Deep Depression",
    "Cyclonic Storm",
    "Severe Cyclonic Storm",
    "Very Severe Cyclonic Storm",
    "Extremely Severe Cyclonic Storm",
    "Super Cyclonic Storm",
]

CATEGORY_TO_INDEX = {cat: idx for idx, cat in enumerate(IMD_CATEGORIES)}


def load_tcir_dataframe(h5_path: str = None) -> pd.DataFrame:
    """Load TCIR info dataframe from Indian Ocean HDF5 file, inspect columns, filter for Indian Ocean region ('IO'),
    drop rows with missing intensity (Vmax), and add a 'source_file' column.
    """
    h5_path = h5_path or settings.TCIR_DATA_PATH
    _patch_pytables_compat()
    info_df = pd.read_hdf(h5_path, key="info")

    print(f"Indian Ocean DataFrame Columns: {info_df.columns.tolist()}")
    print("First 3 rows:")
    print(info_df.head(3))

    # Identify region column (data_set)
    region_col = "data_set" if "data_set" in info_df.columns else "region"
    if region_col in info_df.columns:
        # Filter for Indian Ocean (IO)
        info_df = info_df[info_df[region_col] == "IO"]
    else:
        print(f"Warning: Could not find region column in DataFrame. Available columns: {info_df.columns.tolist()}")

    # Drop missing intensity / Vmax rows
    vmax_col = "Vmax" if "Vmax" in info_df.columns else "vmax"
    if vmax_col in info_df.columns:
        info_df = info_df.dropna(subset=[vmax_col])
    else:
        print(f"Warning: Could not find intensity column in DataFrame. Available columns: {info_df.columns.tolist()}")

    info_df["source_file"] = h5_path
    return info_df


def load_global_dataframe(h5_path: str = None) -> pd.DataFrame:
    """Load global TCIR info dataframe from TCIR-ATLN_EPAC_WPAC.h5 using PyTables compatibility patch,
    drop rows with missing Vmax, and add a 'source_file' column.
    """
    h5_path = h5_path or settings.GLOBAL_TCIR_DATA_PATH
    _patch_pytables_compat()
    info_df = pd.read_hdf(h5_path, key="info")

    print(f"Global DataFrame Columns: {info_df.columns.tolist()}")
    print("First 3 rows:")
    print(info_df.head(3))

    vmax_col = "Vmax" if "Vmax" in info_df.columns else "vmax"
    if vmax_col in info_df.columns:
        info_df = info_df.dropna(subset=[vmax_col])
    else:
        print(f"Warning: Could not find intensity column in DataFrame. Available columns: {info_df.columns.tolist()}")

    info_df["source_file"] = h5_path
    return info_df


def knots_to_kmh(knots: float) -> float:
    """Convert wind speed from knots to km/h (1 knot = 1.852 km/h)."""
    return float(knots) * 1.852


def wind_speed_to_imd_category(wind_kmh: float, verbose: bool = True) -> str:
    """Map wind speed in km/h to one of 7 IMD categories:
    - 222+ km/h -> "Super Cyclonic Storm"
    - 168-221 -> "Extremely Severe Cyclonic Storm"
    - 118-167 -> "Very Severe Cyclonic Storm"
    - 89-117 -> "Severe Cyclonic Storm"
    - 62-88 -> "Cyclonic Storm"
    - 50-61 -> "Deep Depression"
    - below 50 -> "Depression" (with warning if below 31)
    """
    if wind_kmh >= 222:
        return "Super Cyclonic Storm"
    elif wind_kmh >= 168:
        return "Extremely Severe Cyclonic Storm"
    elif wind_kmh >= 118:
        return "Very Severe Cyclonic Storm"
    elif wind_kmh >= 89:
        return "Severe Cyclonic Storm"
    elif wind_kmh >= 62:
        return "Cyclonic Storm"
    elif wind_kmh >= 50:
        return "Deep Depression"
    else:
        if wind_kmh < 31 and verbose:
            print(f"Warning: Wind speed {wind_kmh:.2f} km/h is below 31 km/h threshold; mapping to Depression.")
        return "Depression"


def check_missing_vis_summary(h5_path: str, indices: List[int]) -> int:
    """Scan dataset indices to count how many samples have missing or all-zero VIS channel (Channel 2).
    Prints a single warning summary detailing the count and percentage.
    """
    missing_count = 0
    total = len(indices)
    with h5py.File(h5_path, "r") as f:
        matrix = f["matrix"]
        for idx in indices:
            vis = matrix[idx, :, :, 2]
            if np.isnan(vis).all() or (np.nan_to_num(vis, nan=0.0) == 0).all():
                missing_count += 1

    pct = (missing_count / total * 100.0) if total > 0 else 0.0
    print(
        f"\n[Warning Summary] {missing_count} / {total} samples ({pct:.1f}%) in the dataset had missing or all-zero VIS data.\n"
        f"Fallback applied: IR1 channel duplicated as VIS channel for these samples."
    )
    return missing_count


class TCIRDataset(Dataset):
    """PyTorch Dataset for TCIR satellite imagery across single or multiple HDF5 files.

    - Supports single file (h5_path: str, indices: list[int]) OR multi-file dict (file_indices: dict[str, list[int]]).
    - 4 Channels: IR1, WV, VIS (with IR1 fallback if missing), PMW (NaNs zeroed).
    - Resizes to (4, 224, 224) and normalizes each channel independently to [0, 1].
    - Data augmentation: optional random horizontal flip & random rotation (90/180/270 deg) when augment=True.
    - Returns (tensor_4ch, category_class_index, wind_speed_kmh, vis_was_missing).
    """

    def __init__(
        self,
        file_indices: Union[Dict[str, List[int]], str] = None,
        indices: List[int] = None,
        info_df: pd.DataFrame = None,
        augment: bool = False,
        h5_path: str = None,
    ):
        self.augment = augment
        self.info_df = info_df

        # Normalize arguments to file_indices dict: {h5_path: [indices...]}
        if isinstance(file_indices, dict):
            self.file_indices = file_indices
        elif isinstance(file_indices, str):
            h5_p = file_indices
            idx_list = indices if indices is not None else []
            self.file_indices = {h5_p: list(idx_list)}
        elif h5_path is not None and indices is not None:
            self.file_indices = {h5_path: list(indices)}
        else:
            raise ValueError(
                "Must provide either a dict mapping h5_path -> list of indices, or h5_path and indices."
            )

        # Build linear list of sample tuples: [(h5_path, row_idx), ...]
        self.samples: List[Tuple[str, int]] = []
        for path, idxs in self.file_indices.items():
            for row_idx in idxs:
                self.samples.append((path, row_idx))

        # Build fast metadata lookup table if info_df is provided
        self.meta_lookup: Dict[Tuple[str, int], float] = {}
        if self.info_df is not None:
            vmax_col = "Vmax" if "Vmax" in self.info_df.columns else "vmax"
            has_src = "source_file" in self.info_df.columns
            for row_idx, row in self.info_df.iterrows():
                src = row["source_file"] if has_src else h5_path
                if src is not None:
                    self.meta_lookup[(src, row_idx)] = float(row[vmax_col])

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int, float, bool]:
        target_h5_path, row_idx = self.samples[idx]

        # Retrieve wind speed / metadata for (target_h5_path, row_idx)
        if (target_h5_path, row_idx) in self.meta_lookup:
            vmax_knots = self.meta_lookup[(target_h5_path, row_idx)]
        elif self.info_df is not None and row_idx in self.info_df.index:
            row = self.info_df.loc[row_idx]
            vmax_col = "Vmax" if "Vmax" in row else "vmax"
            vmax_knots = float(row[vmax_col])
        else:
            raise KeyError(f"Metadata for sample ({target_h5_path}, {row_idx}) not found in info_df.")

        wind_kmh = knots_to_kmh(vmax_knots)
        cat_str = wind_speed_to_imd_category(wind_kmh, verbose=False)
        cat_idx = CATEGORY_TO_INDEX[cat_str]

        # Read specific sample row from the correct HDF5 file
        with h5py.File(target_h5_path, "r") as f:
            raw_sample = f["matrix"][row_idx]

        # Extract channels: 0 (IR1), 1 (WV), 2 (VIS), 3 (PMW)
        if raw_sample.ndim == 3 and raw_sample.shape[2] >= 4:
            ir1 = raw_sample[:, :, 0]
            wv = raw_sample[:, :, 1]
            vis = raw_sample[:, :, 2]
            pmw = raw_sample[:, :, 3]
        elif raw_sample.ndim == 3 and raw_sample.shape[0] >= 4:
            ir1 = raw_sample[0, :, :]
            wv = raw_sample[1, :, :]
            vis = raw_sample[2, :, :]
            pmw = raw_sample[3, :, :]
        else:
            raise ValueError(f"Unexpected image matrix shape: {raw_sample.shape}")

        # Check VIS channel (Channel 2): if all-NaN or all-zero, replace with IR1 duplicate
        vis_is_nan = np.isnan(vis).all()
        vis_is_zero = (np.nan_to_num(vis, nan=0.0) == 0).all()
        if vis_is_nan or vis_is_zero:
            vis_was_missing = True
            vis_ch = np.nan_to_num(ir1, nan=0.0).copy()
        else:
            vis_was_missing = False
            vis_ch = np.nan_to_num(vis, nan=0.0).copy()

        # Handle NaNs for remaining channels
        ir1_ch = np.nan_to_num(ir1, nan=0.0)
        wv_ch = np.nan_to_num(wv, nan=0.0)
        pmw_ch = np.nan_to_num(pmw, nan=0.0)

        # Stack into (4, H, W) numpy array
        channels = np.stack([ir1_ch, wv_ch, vis_ch, pmw_ch], axis=0)

        # Convert to float PyTorch tensor
        tensor = torch.from_numpy(channels).float()

        # Replace any remaining NaNs with 0
        tensor = torch.nan_to_num(tensor, nan=0.0)

        # Normalize each channel independently to [0, 1] range
        for c in range(4):
            c_min = tensor[c].min()
            c_max = tensor[c].max()
            if c_max > c_min:
                tensor[c] = (tensor[c] - c_min) / (c_max - c_min)
            else:
                tensor[c] = torch.zeros_like(tensor[c])

        # Resize to (4, 224, 224)
        tensor = torch.nn.functional.interpolate(
            tensor.unsqueeze(0),
            size=(224, 224),
            mode="bilinear",
            align_corners=False,
        ).squeeze(0)

        # Apply Data Augmentation if requested (training data only)
        if self.augment:
            # 50% probability random horizontal flip
            if torch.rand(1).item() < 0.5:
                tensor = torch.flip(tensor, dims=[2])

            # 50% probability random rotation (90, 180, or 270 degrees)
            if torch.rand(1).item() < 0.5:
                k = int(torch.randint(1, 4, (1,)).item())
                tensor = torch.rot90(tensor, k=k, dims=[1, 2])

        return tensor, cat_idx, wind_kmh, vis_was_missing


def get_storm_level_split(
    info_df: pd.DataFrame, val_frac: float = 0.15, test_frac: float = 0.15, seed: int = 42
) -> Tuple[List[int], List[int], List[int]]:
    """Group rows by storm ID and perform a storm-level split into train, val, and test indices."""
    storm_col = None
    for col in ["ID", "id", "TC_ID", "storm_id", "name"]:
        if col in info_df.columns:
            storm_col = col
            break

    if storm_col is None:
        raise ValueError(
            f"Could not find storm identifier column in DataFrame. Available columns: {info_df.columns.tolist()}"
        )

    storms = info_df[storm_col].unique()
    rng = np.random.default_rng(seed)
    shuffled_storms = rng.permutation(storms)

    n_storms = len(shuffled_storms)
    n_val = int(n_storms * val_frac)
    n_test = int(n_storms * test_frac)
    n_train = n_storms - n_val - n_test

    val_storms = set(shuffled_storms[:n_val])
    test_storms = set(shuffled_storms[n_val : n_val + n_test])
    train_storms = set(shuffled_storms[n_val + n_test :])

    train_idx = info_df[info_df[storm_col].isin(train_storms)].index.tolist()
    val_idx = info_df[info_df[storm_col].isin(val_storms)].index.tolist()
    test_idx = info_df[info_df[storm_col].isin(test_storms)].index.tolist()

    return train_idx, val_idx, test_idx


def combine_and_split(
    io_h5_path: str = None,
    global_h5_path: str = None,
    val_frac: float = 0.15,
    test_frac: float = 0.15,
    seed: int = 42,
) -> Tuple[Dict[str, List[int]], Dict[str, List[int]], Dict[str, List[int]], Dict[str, List[int]], pd.DataFrame]:
    """Load both Indian Ocean and Global TCIR datasets, perform separate storm-level splits,
    and return stage1_train, stage2_train, stage2_val, stage2_test index dicts and combined info DataFrame.
    """
    io_h5_path = io_h5_path or settings.TCIR_DATA_PATH
    global_h5_path = global_h5_path or settings.GLOBAL_TCIR_DATA_PATH

    print(f"--- Combining Datasets ---")
    print(f"Loading Indian Ocean Dataset: {io_h5_path}")
    io_df = load_tcir_dataframe(io_h5_path)

    print(f"\nLoading Global Dataset: {global_h5_path}")
    global_df = load_global_dataframe(global_h5_path)

    # Storm-level split for Global dataset (Stage 1 pretraining)
    g_train_idx, g_val_idx, g_test_idx = get_storm_level_split(global_df, val_frac=val_frac, test_frac=test_frac, seed=seed)

    # Storm-level split for Indian Ocean dataset (Stage 2 fine-tuning / val / test)
    io_train_idx, io_val_idx, io_test_idx = get_storm_level_split(io_df, val_frac=val_frac, test_frac=test_frac, seed=seed)

    stage1_train = {global_h5_path: g_train_idx}
    stage2_train = {io_h5_path: io_train_idx}
    stage2_val = {io_h5_path: io_val_idx}
    stage2_test = {io_h5_path: io_test_idx}

    combined_info_df = pd.concat([global_df, io_df], axis=0)

    # Print summary statistics
    storm_col = "ID" if "ID" in io_df.columns else "id"
    io_storms = io_df[storm_col].nunique()
    g_storms = global_df[storm_col].nunique()

    s1_train_storms = global_df.loc[g_train_idx, storm_col].nunique()
    s2_train_storms = io_df.loc[io_train_idx, storm_col].nunique()
    s2_val_storms = io_df.loc[io_val_idx, storm_col].nunique()
    s2_test_storms = io_df.loc[io_test_idx, storm_col].nunique()

    print(f"\n==================================================")
    print(f"         TCIR MULTI-DATASET SPLIT SUMMARY         ")
    print(f"==================================================")
    print(f"Indian Ocean Dataset: {io_storms:<4} storms | {len(io_df):<5} images")
    print(f"Global Dataset:       {g_storms:<4} storms | {len(global_df):<5} images")
    print(f"--------------------------------------------------")
    print(f"Stage 1 Train (Global Pretraining):  {s1_train_storms:<4} storms | {len(g_train_idx):<5} images")
    print(f"Stage 2 Train (IO Fine-tuning):     {s2_train_storms:<4} storms | {len(io_train_idx):<5} images")
    print(f"Stage 2 Val   (IO Validation):      {s2_val_storms:<4} storms | {len(io_val_idx):<5} images")
    print(f"Stage 2 Test  (IO Test):            {s2_test_storms:<4} storms | {len(io_test_idx):<5} images")
    print(f"==================================================\n")

    return stage1_train, stage2_train, stage2_val, stage2_test, combined_info_df


if __name__ == "__main__":
    stage1_train, stage2_train, stage2_val, stage2_test, combined_df = combine_and_split()

    print("--- Sanity Checking TCIRDataset Multi-File & Augmentation ---")
    s1_dataset = TCIRDataset(file_indices=stage1_train, info_df=combined_df, augment=True)
    s2_dataset = TCIRDataset(file_indices=stage2_train, info_df=combined_df, augment=False)

    tensor1, cat1, speed1, vis_miss1 = s1_dataset[0]
    tensor2, cat2, speed2, vis_miss2 = s2_dataset[0]

    print(f"Stage 1 Sample 0 (Augmented): Shape={tensor1.shape}, Speed={speed1:.2f} km/h, Cat={IMD_CATEGORIES[cat1]}, VIS_Missing={vis_miss1}")
    print(f"Stage 2 Sample 0 (Clean):     Shape={tensor2.shape}, Speed={speed2:.2f} km/h, Cat={IMD_CATEGORIES[cat2]}, VIS_Missing={vis_miss2}")
