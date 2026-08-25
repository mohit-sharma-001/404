"""
Data Preprocessing Module for Multi-Source Cyclone Data.
Handles Infrared (IR), Water Vapor (WV) satellite imagery, and Best Track data preprocessing.

Beginner Concepts:
------------------
1. Channel:
   In image processing, a "channel" represents a layer of data for each pixel.
   A standard color photo has 3 channels (Red, Green, Blue). Grayscale images have 1 channel.
   Here, we stack single-channel IR and WV satellite images together into a 2-channel input tensor:
   - Channel 0: Infrared (IR) image
   - Channel 1: Water Vapor (WV) image (or duplicate IR if WV is unavailable)

2. Early Fusion:
   Combining multiple distinct raw data sources (e.g. IR satellite images + Water Vapor satellite images)
   at the very beginning of the pipeline into a single multi-channel tensor before feeding them
   into a machine learning or deep learning model.
"""

import io
import numpy as np
import torch
from PIL import Image


def check_valid_satellite_image(image_bytes: bytes, source_type: str = "IR") -> tuple[bool, str]:
    """Inspects image dimensions, overall pixel variance, and color variance across R, G, B channels
    to determine if it resembles valid satellite imagery for the specified source_type ("IR", "WV", "VIS", "PMW").

    Checks:
    1. Unusually small dimensions (below 50x50 pixels) - Applies to all source types.
    2. Solid single color / blank image (near-zero overall variance) - Applies to all source types.
    3. Source-specific validation:
       - "IR", "WV", "PMW": Strict grayscale check (mean RGB std > 12.0 fails).
       - "VIS": Relaxed check — visible-channel images can legitimately be full-color (true-color satellite scenes)
         or grayscale-enhanced. Only flags as invalid if extreme color saturation indicates an artificial or non-satellite scene.

    Returns:
        (is_likely_valid, reason):
            - is_likely_valid: False if image fails validation check.
            - reason: Explanation message if invalid, otherwise empty string.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        width, height = image.size

        # 1. Small dimensions check (below 50x50 pixels)
        if width < 50 or height < 50:
            return (
                False,
                f"Image dimensions ({width}x{height}) are unusually small (minimum 50x50 required)",
            )

        img_rgb = image.convert("RGB")
        img_array = np.array(img_rgb, dtype=np.float32)

        # 2. Solid color / blank image check (near-zero overall variance)
        overall_std = float(np.std(img_array))
        if overall_std < 1.0:
            return (
                False,
                "Image appears to be a solid single color or blank upload (near-zero overall variance)",
            )

        # 3. Source-specific validation
        source_type_upper = (source_type or "IR").upper()

        if source_type_upper in ["IR", "WV", "PMW"]:
            # Strict grayscale check for sensor channels that are physically single-band/grayscale data
            color_std_per_pixel = np.std(img_array, axis=2)
            mean_color_std = float(np.mean(color_std_per_pixel))

            COLOR_VARIANCE_THRESHOLD = 12.0
            if mean_color_std > COLOR_VARIANCE_THRESHOLD:
                return (
                    False,
                    f"Image appears to be a regular color photo, not grayscale {source_type_upper} satellite data",
                )
        elif source_type_upper == "VIS":
            # Relaxed check for Visible channel (can legitimately be true-color RGB or grayscale)
            # Only flag if there are obvious non-satellite photo patterns (e.g., extreme saturation in localized patches)
            img_hsv = image.convert("HSV")
            hsv_array = np.array(img_hsv, dtype=np.float32)
            sat_channel = hsv_array[:, :, 1]  # Saturation values (0 to 255)

            mean_saturation = float(np.mean(sat_channel))
            max_patch_saturation = float(np.percentile(sat_channel, 99))

            if mean_saturation > 185.0 and max_patch_saturation > 245.0:
                return (
                    False,
                    "Visible image appears to be an artificial graphic or non-satellite photo (extreme color saturation)",
                )

        return (True, "")
    except Exception as e:
        return (False, f"Unable to analyze image data: {str(e)}")


def preprocess_single_channel(image_bytes: bytes) -> np.ndarray:
    """Helper function to load an image from bytes, convert to grayscale (1 channel),
    resize to 224x224, and normalize pixel values to float range [0.0, 1.0].
    """
    image = Image.open(io.BytesIO(image_bytes))
    image = image.convert("L")  # Convert image to grayscale (single channel)
    image = image.resize((224, 224))  # Resize to 224x224 pixels
    img_array = np.array(image, dtype=np.float32) / 255.0  # Normalize pixel values to 0-1
    return img_array


def preprocess_multisource(
    ir_bytes: bytes | None = None,
    wv_bytes: bytes | None = None,
    vis_bytes: bytes | None = None,
    pmw_bytes: bytes | None = None,
) -> tuple[torch.Tensor, list[str]]:
    """Preprocesses optional IR, WV, VIS, PMW satellite imagery bytes using Early Fusion.

    Steps:
    1. If all four parameters are None, raises a ValueError.
    2. Determines a "base" image: the first non-None bytes found in priority order:
       ir_bytes -> wv_bytes -> vis_bytes -> pmw_bytes.
    3. For each channel slot (IR, WV, VIS, PMW):
       - Uses actual provided bytes if available.
       - Otherwise falls back to base image bytes.
    4. Builds sources_used listing ONLY genuinely provided sources.
    5. Returns PyTorch tensor of shape (1, 4, 224, 224) and sources_used list.
    """
    if not any([ir_bytes, wv_bytes, vis_bytes, pmw_bytes]):
        raise ValueError("At least one satellite data source (IR, WV, VIS, or PMW) must be provided.")

    # Determine priority base image
    base_bytes = ir_bytes or wv_bytes or vis_bytes or pmw_bytes
    base_array = preprocess_single_channel(base_bytes)

    sources_used = []

    # Channel 0: IR
    if ir_bytes:
        try:
            ir_array = preprocess_single_channel(ir_bytes)
            sources_used.append("IR")
        except Exception:
            ir_array = base_array.copy()
    else:
        ir_array = base_array.copy()

    # Channel 1: WV
    if wv_bytes:
        try:
            wv_array = preprocess_single_channel(wv_bytes)
            sources_used.append("WV")
        except Exception:
            wv_array = base_array.copy()
    else:
        wv_array = base_array.copy()

    # Channel 2: VIS
    if vis_bytes:
        try:
            vis_array = preprocess_single_channel(vis_bytes)
            sources_used.append("VIS")
        except Exception:
            vis_array = base_array.copy()
    else:
        vis_array = base_array.copy()

    # Channel 3: PMW
    if pmw_bytes:
        try:
            pmw_array = preprocess_single_channel(pmw_bytes)
            sources_used.append("PMW")
        except Exception:
            pmw_array = base_array.copy()
    else:
        pmw_array = base_array.copy()

    # Stack IR, WV, VIS, PMW along axis 0 -> shape: (4, 224, 224)
    stacked_array = np.stack([ir_array, wv_array, vis_array, pmw_array], axis=0)

    # Convert NumPy array to PyTorch Tensor and add batch dimension -> shape: (1, 4, 224, 224)
    tensor = torch.from_numpy(stacked_array).unsqueeze(0)

    return tensor, sources_used
