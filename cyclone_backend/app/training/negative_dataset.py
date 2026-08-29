"""
Negative Dataset Generator for Non-Cyclone Imagery.

Generates a PyTorch Dataset containing negative (non-cyclone) samples derived from CIFAR-10.
Converts images to 4-channel tensors matching the TCIR satellite imagery shape (4, 224, 224)
and assigns class label 7 ("Not a Cyclone").
"""

import sys
from pathlib import Path
from typing import List, Tuple

# Ensure project root is in sys.path when script is executed directly
ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import numpy as np
from PIL import Image
import torch
from torch.utils.data import Dataset
import torchvision.datasets as datasets
import torchvision.transforms as transforms


class NegativeDataset(Dataset):
    """PyTorch Dataset yielding 4-channel non-cyclone negative samples from CIFAR-10.

    Each item yields:
        - tensor: PyTorch FloatTensor of shape (4, 224, 224)
        - label: int = 7 (representing 8th class "Not a Cyclone", 0-indexed index 7)
    """

    def __init__(self, cifar_dataset: Dataset, indices: List[int]):
        self.cifar_dataset = cifar_dataset
        self.indices = indices
        self.transform = transforms.Compose(
            [
                transforms.Grayscale(num_output_channels=1),
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
            ]
        )

    def __len__(self) -> int:
        return len(self.indices)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int, float, bool]:
        cifar_idx = self.indices[idx]
        img, _ = self.cifar_dataset[cifar_idx]

        if not isinstance(img, Image.Image):
            img = Image.fromarray(img)

        # Convert to 1-channel grayscale float tensor of shape (1, 224, 224)
        tensor_1ch = self.transform(img)

        # Duplicate into a 4-channel tensor (4, 224, 224) matching TCIR IR/WV/VIS/PMW shape
        tensor_4ch = tensor_1ch.repeat(4, 1, 1)

        # Label 7 represents "Not a Cyclone" (8th class, index 7)
        label = 7
        wind_speed = 0.0
        vis_was_missing = False
        return tensor_4ch, label, wind_speed, vis_was_missing


class SyntheticNegativeDataset(Dataset):
    """Fallback PyTorch Dataset yielding 4-channel synthetic negative samples in memory."""

    def __init__(self, n_samples: int = 500, seed: int = 42):
        self.n_samples = n_samples
        self.seed = seed

    def __len__(self) -> int:
        return self.n_samples

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int, float, bool]:
        rng = np.random.default_rng(self.seed + idx)
        data = rng.random((4, 224, 224), dtype=np.float32)
        tensor_4ch = torch.from_numpy(data)
        return tensor_4ch, 7, 0.0, False


def get_negative_samples(
    n_samples: int = 3000, seed: int = 42, train: bool = True
) -> Dataset:
    """Download or load CIFAR-10, fallback to SyntheticNegativeDataset if unavailable.

    Returns:
        Dataset: PyTorch Dataset yielding (tensor of shape (4, 224, 224), label=7, 0.0, False).
    """
    try:
        cifar_dataset = datasets.CIFAR10(root="./data/negatives", download=False, train=train)
        rng = np.random.default_rng(seed) if seed is not None else np.random.default_rng()
        total_available = len(cifar_dataset)
        replace = n_samples > total_available
        indices = rng.choice(total_available, size=n_samples, replace=replace).tolist()
        return NegativeDataset(cifar_dataset, indices)
    except Exception:
        print(f"Using SyntheticNegativeDataset in memory ({n_samples} samples)...")
        return SyntheticNegativeDataset(n_samples=n_samples, seed=seed)



if __name__ == "__main__":
    print("Initializing Negative Dataset...", flush=True)
    dataset = get_negative_samples(n_samples=10)
    print(f"Dataset length: {len(dataset)}", flush=True)
    sample_tensor, sample_label = dataset[0]
    print(f"Sample tensor shape: {sample_tensor.shape}", flush=True)
    print(f"Sample label: {sample_label}", flush=True)
    assert sample_tensor.shape == (4, 224, 224), f"Expected shape (4, 224, 224), got {sample_tensor.shape}"
    assert sample_label == 7, f"Expected label 7, got {sample_label}"
    print("Smoke test passed successfully!", flush=True)

