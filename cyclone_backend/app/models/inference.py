
"""
Inference Module for Tropical Cyclone Models.

Contains the CNN architecture, dual output heads (classification and regression),
checkpoint loading logic, and prediction execution.

Beginner Concepts:
------------------
1. Classification Head:
   The portion of the neural network responsible for assigning the input into discrete classes/categories.
   Here, it classifies the cyclone's intensity into one of 7 official meteorological categories
   (e.g., "Depression", "Cyclonic Storm", "Super Cyclonic Storm").

2. Regression Head:
   The portion of the neural network responsible for predicting a continuous numerical value.
   Here, it estimates the exact wind speed of the cyclone in km/h (e.g., 145.5 km/h).
"""

import os
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F

from app.core.config import settings

# 8 intensity categories (7 official IMD categories + 1 non-cyclone negative category)
INTENSITY_CATEGORIES = [
    "Depression",
    "Deep Depression",
    "Cyclonic Storm",
    "Severe Cyclonic Storm",
    "Very Severe Cyclonic Storm",
    "Extremely Severe Cyclonic Storm",
    "Super Cyclonic Storm",
    "Not a Cyclone",
]


# NOTE: Existing checkpoints trained on 2-channel or 3-conv input will NOT be compatible
# with this new 4-conv architecture — a fresh training run is required after this change.
class CycloneCNN(nn.Module):
    """4-Channel input CNN architecture with 4 Convolutional Layers, Batch Normalization,
    and dual output heads.

    Architecture:
    - 4 Convolutional Layers + BatchNorm + ReLU + Max Pooling
    - Adaptive Average Pooling (7x7)
    - 2 Fully Connected (Linear) Layers
    - Classification Head (8 output logits)
    - Regression Head (1 output value for wind speed in km/h)

    Batch Normalization Note:
    ------------------------
    Batch Normalization keeps feature map activations flowing through the network
    in a consistent, normalized range between layers. This prevents internal covariate shift,
    stabilizes training, and reduces epoch-to-epoch validation loss fluctuations.
    """

    def __init__(self):
        super().__init__()
        # 4 Convolutional Layers with BatchNorm (accepts 4 channels: IR, WV, VIS, PMW)
        self.conv1 = nn.Conv2d(in_channels=4, out_channels=32, kernel_size=3, padding=1)
        self.bn1 = nn.BatchNorm2d(32)

        self.conv2 = nn.Conv2d(in_channels=32, out_channels=64, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(64)

        self.conv3 = nn.Conv2d(in_channels=64, out_channels=128, kernel_size=3, padding=1)
        self.bn3 = nn.BatchNorm2d(128)

        self.conv4 = nn.Conv2d(in_channels=128, out_channels=256, kernel_size=3, padding=1)
        self.bn4 = nn.BatchNorm2d(256)

        # Max Pooling (reduces spatial dimensions by half)
        self.pool = nn.MaxPool2d(kernel_size=2, stride=2)

        # Adaptive Avg Pool to fix spatial size to 7x7
        self.adaptive_pool = nn.AdaptiveAvgPool2d((7, 7))

        # 2 Fully Connected Layers (256 filters * 7 * 7)
        self.fc1 = nn.Linear(256 * 7 * 7, 256)
        self.fc2 = nn.Linear(256, 128)

        # Output Head 1: Classification Head (8 output categories)
        self.classification_head = nn.Linear(128, 8)


        # Output Head 2: Regression Head (1 numerical value for wind speed in km/h)
        self.regression_head = nn.Linear(128, 1)

    def forward(self, x: torch.Tensor):
        # 4 Conv layers + BatchNorm + ReLU + MaxPool
        x = self.pool(F.relu(self.bn1(self.conv1(x))))  # (B, 32, 112, 112)
        x = self.pool(F.relu(self.bn2(self.conv2(x))))  # (B, 64, 56, 56)
        x = self.pool(F.relu(self.bn3(self.conv3(x))))  # (B, 128, 28, 28)
        x = self.pool(F.relu(self.bn4(self.conv4(x))))  # (B, 256, 14, 14)

        x = self.adaptive_pool(x)  # (B, 256, 7, 7)
        x = torch.flatten(x, 1)  # (B, 256 * 7 * 7)

        # 2 Fully Connected layers
        x = F.relu(self.fc1(x))
        features = F.relu(self.fc2(x))

        # Dual output heads
        class_logits = self.classification_head(features)
        wind_speed = self.regression_head(features)

        return class_logits, wind_speed



class CycloneModel:
    """Wrapper for model initialization, checkpoint loading, and running predictions."""

    def __init__(self, checkpoint_path: str | None = None):
        self.checkpoint_path = checkpoint_path or settings.MODEL_CHECKPOINT_PATH
        self.model = CycloneCNN()

        # Load checkpoint if exists, otherwise fallback to random weights
        if os.path.exists(self.checkpoint_path):
            try:
                checkpoint = torch.load(self.checkpoint_path, map_location="cpu")
                state_dict = (
                    checkpoint["model_state_dict"]
                    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint
                    else checkpoint
                )
                if "classification_head.weight" in state_dict and state_dict["classification_head.weight"].shape[0] != 8:
                    print("Note: Checkpoint classification_head size mismatch detected (7 vs 8 classes). Loading weights with strict=False.")
                    state_dict.pop("classification_head.weight", None)
                    state_dict.pop("classification_head.bias", None)
                    self.model.load_state_dict(state_dict, strict=False)
                else:
                    self.model.load_state_dict(state_dict)
                print(f"Loaded model weights from '{self.checkpoint_path}'")
            except Exception as e:
                print(
                    f"Warning: Failed to load checkpoint '{self.checkpoint_path}' ({e}). Using random weights."
                )

        else:
            print(
                f"Checkpoint file '{self.checkpoint_path}' not found. Initializing with random weights for development."
            )

        self.model.eval()

    def predict(self, tensor: torch.Tensor, sources_used: list[str]) -> dict:
        """Runs model inference on a 4-channel preprocessed tensor of shape (1, 4, 224, 224).

        Args:
            tensor: Input tensor of shape (1, 4, 224, 224)
            sources_used: List of data sources used (e.g., ["IR", "WV", "VIS", "PMW"])

        Returns:
            dict matching PredictionResponse Pydantic schema.
        """
        with torch.no_grad():
            class_logits, wind_speed_raw = self.model(tensor)

            # Convert logits to category probabilities via Softmax over all 8 classes
            probs = F.softmax(class_logits, dim=1)

            # 1. cyclone_probability = sum of probabilities for classes 0-6 (genuine cyclone categories combined)
            cyclone_probability = float(probs[0, :7].sum().item())

            # Top predicted class overall (across all 8 classes including class 7 "Not a Cyclone")
            top1_overall_idx = torch.argmax(probs, dim=1).item()

            # 2. category_confidence = top-1 probability among classes 0-6 only (renormalized)
            cyclone_probs = probs[0, :7]
            renorm_probs = cyclone_probs / (cyclone_probability + 1e-9)

            top2_renorm_probs, top2_renorm_indices = torch.topk(renorm_probs, k=2)
            top1_cat_idx = top2_renorm_indices[0].item()
            category_confidence = float(top2_renorm_probs[0].item())
            top_category = INTENSITY_CATEGORIES[top1_cat_idx]

            top2_cat_idx = top2_renorm_indices[1].item()
            second_category_confidence = float(top2_renorm_probs[1].item())
            second_category = INTENSITY_CATEGORIES[top2_cat_idx]

            # Populate secondary category & confidence if within 15 percentage points (0.15) OR if category confidence < 0.35
            if (category_confidence < 0.35) or ((category_confidence - second_category_confidence) <= 0.15):
                secondary_category = second_category
                secondary_confidence = min(1.0, max(0.0, round(second_category_confidence, 4)))
            else:
                secondary_category = None
                secondary_confidence = None

            # Convective Organization & Eyewall Physical Analysis (Dvorak Technique Feature Calibration)
            ir_channel = tensor[0, 0]  # shape: (224, 224)
            # Cold cloud tops map to low pixel values (< 0.48) in training normalization scale
            convective_pixels_ratio = float((ir_channel < 0.48).float().mean().item())

            # Physical Cloud Structure Calibration:
            raw_speed = max(0.0, float(wind_speed_raw.item()))

            # Determine has_cyclone: genuine cyclone requires cyclone_probability >= 0.85 and top predicted class != 7
            if (cyclone_probability >= 0.85) and (top1_overall_idx != 7):
                has_cyclone = True
                conv_factor = float(np.clip(0.55 + (convective_pixels_ratio - 0.10) * (0.45 / 0.15), 0.55, 1.0))
                wind_speed_kmh = round(max(42.0, raw_speed * conv_factor), 2)
                intensity_category = top_category
                final_confidence = min(1.0, max(0.0, round(category_confidence, 4)))
            else:
                has_cyclone = False
                wind_speed_kmh = round(min(32.0, max(12.0, raw_speed * 0.22)), 2)
                intensity_category = None
                final_confidence = 0.0
                secondary_category = None
                secondary_confidence = None

        return {
            "has_cyclone": has_cyclone,
            "center_lat": None,
            "center_lon": None,
            "intensity_category": intensity_category,
            "secondary_category": secondary_category,
            "estimated_wind_speed_kmh": wind_speed_kmh if has_cyclone else None,
            "confidence": final_confidence,
            "secondary_confidence": secondary_confidence,
            "cyclone_probability": min(1.0, max(0.0, round(cyclone_probability, 4))),
            "category_confidence": min(1.0, max(0.0, round(category_confidence, 4))),
            "top1_overall_idx": top1_overall_idx,
            "top_category": top_category,
            "second_category": second_category,
            "second_category_confidence": min(1.0, max(0.0, round(second_category_confidence, 4))),
            "trend": "Steady",
            "trend_confidence": 0.5,
            "sources_used": sources_used,
        }

