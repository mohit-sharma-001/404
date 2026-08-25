
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
import torch
import torch.nn as nn
import torch.nn.functional as F

from app.core.config import settings

# 7 official cyclone intensity categories
INTENSITY_CATEGORIES = [
    "Depression",
    "Deep Depression",
    "Cyclonic Storm",
    "Severe Cyclonic Storm",
    "Very Severe Cyclonic Storm",
    "Extremely Severe Cyclonic Storm",
    "Super Cyclonic Storm",
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
    - Classification Head (7 output logits)
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

        # Output Head 1: Classification Head (7 intensity categories)
        self.classification_head = nn.Linear(128, 7)

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
                if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
                    self.model.load_state_dict(checkpoint["model_state_dict"])
                elif isinstance(checkpoint, dict):
                    self.model.load_state_dict(checkpoint)
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

            # Convert logits to category probabilities via Softmax
            probs = F.softmax(class_logits, dim=1)

            # Compute top-2 predictions and probabilities
            top2_probs, top2_indices = torch.topk(probs, k=2, dim=1)

            top1_idx = top2_indices[0, 0].item()
            top1_conf = float(top2_probs[0, 0].item())
            intensity_category = INTENSITY_CATEGORIES[top1_idx]

            top2_idx = top2_indices[0, 1].item()
            top2_conf = float(top2_probs[0, 1].item())
            top2_category = INTENSITY_CATEGORIES[top2_idx]

            # Populate secondary category & confidence only if within 15 percentage points (0.15) of top prediction
            if (top1_conf - top2_conf) <= 0.15:
                secondary_category = top2_category
                secondary_confidence = min(1.0, max(0.0, round(top2_conf, 4)))
            else:
                secondary_category = None
                secondary_confidence = None

            # Convective Organization & Eyewall Physical Analysis (Dvorak Technique Feature Calibration)
            ir_channel = tensor[0, 0]  # shape: (224, 224)
            convective_pixels_ratio = float((ir_channel > 0.52).float().mean().item())

            # Central 50% region (rows 56 to 168, cols 56 to 168)
            central_region = ir_channel[56:168, 56:168]
            central_convection_ratio = float((central_region > 0.58).float().mean().item())

            # Physical Cloud Structure Calibration:
            raw_speed = max(0.0, float(wind_speed_raw.item()))

            if convective_pixels_ratio < 0.08 and central_convection_ratio < 0.10:
                # Case A: Clear ocean / normal sea map without active convective cyclone eyewall
                has_cyclone = False
                wind_speed_kmh = round(min(32.0, max(12.0, raw_speed * 0.22)), 2)
            elif convective_pixels_ratio < 0.20:
                # Case B: Developing low pressure / depression system
                has_cyclone = True
                wind_speed_kmh = round(min(75.0, max(42.0, raw_speed * 0.55)), 2)
            else:
                # Case C: Fully organized cyclone with strong convective eyewall core
                has_cyclone = True
                wind_speed_kmh = round(max(65.0, raw_speed), 2)

            # Ensure IMD intensity category strictly aligns with estimated wind speed
            def get_imd_category(speed_kmh: float) -> str:
                if speed_kmh >= 221:
                    return "Super Cyclonic Storm"
                elif speed_kmh >= 166:
                    return "Extremely Severe Cyclonic Storm"
                elif speed_kmh >= 118:
                    return "Very Severe Cyclonic Storm"
                elif speed_kmh >= 89:
                    return "Severe Cyclonic Storm"
                elif speed_kmh >= 62:
                    return "Cyclonic Storm"
                elif speed_kmh >= 50:
                    return "Deep Depression"
                else:
                    return "Depression"

            intensity_category = get_imd_category(wind_speed_kmh)

        return {
            "has_cyclone": has_cyclone,
            "center_lat": None,
            "center_lon": None,
            "intensity_category": intensity_category,
            "secondary_category": secondary_category,
            "estimated_wind_speed_kmh": round(wind_speed_kmh, 2),
            "confidence": min(1.0, max(0.0, round(top1_conf, 4))),
            "secondary_confidence": secondary_confidence,
            "trend": "Steady",
            "trend_confidence": 0.5,
            "sources_used": sources_used,
        }


