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
    """Master Verification Filter: Inspects image to ensure it is authentic space-borne satellite imagery
    and strictly rejects all non-satellite images (humans, animals, objects, trees, furniture, sun, maps, etc.).
    """
    try:
        try:
            image = Image.open(io.BytesIO(image_bytes))
            image.load()
        except Exception as e:
            return (False, f"Corrupted or invalid image file. Unable to decode image: {str(e)}")

        width, height = image.size

        # Maximum pixel dimension check (resize down if > 4000px to prevent excessive memory usage)
        if width > 4000 or height > 4000:
            image.thumbnail((4000, 4000), Image.Resampling.LANCZOS)
            width, height = image.size

        # 1. Dimension check (minimum 50x50)
        if width < 50 or height < 50:
            return (
                False,
                f"Image dimensions ({width}x{height}) are too small for satellite analysis.",
            )

        img_rgb = image.convert("RGB")
        img_array = np.array(img_rgb, dtype=np.float32)

        # 2. Blank / Solid color check
        overall_std = float(np.std(img_array))
        if overall_std < 1.0:
            return (False, "Image is a solid single color or blank upload.")

        # 3. White / Light Background check (excessive white background of documents, plots, charts, walls)
        white_pixels_ratio = float(np.mean(np.all(img_array > 220.0, axis=2)))
        if white_pixels_ratio > 0.22:
            return (
                False,
                "Non-satellite image detected (excessive white background area of plot/document/wall). Not a satellite image.",
            )

        # 4. Color Variance Check across RGB channels
        # Satellite IR, WV, PMW are single-band grayscale. VIS satellite data has low cloud-ocean color divergence.
        # Humans, animals, trees, furniture, sun, objects, body parts, and maps have high RGB color std.
        color_std_per_pixel = np.std(img_array, axis=2)
        mean_color_std = float(np.mean(color_std_per_pixel))
        source_type_upper = (source_type or "IR").upper()

        if source_type_upper in ["IR", "WV", "PMW"]:
            if mean_color_std > 5.0:
                return (
                    False,
                    f"Non-satellite color photo detected ({mean_color_std:.1f} color std). {source_type_upper} satellite data must be grayscale thermal imagery.",
                )
        elif source_type_upper == "VIS":
            # Visible channel check for photos of humans, animals, objects, trees, maps
            if mean_color_std > 12.0:
                return (
                    False,
                    f"Non-satellite photo/graphic detected ({mean_color_std:.1f} color std). Upload authentic VIS satellite imagery.",
                )

        # 5. Non-Satellite Texture & Outline Edge Analysis
        # Detects object outlines, furniture edges, human shapes, text fonts, map borders, UI elements
        gray = np.mean(img_array, axis=2)
        dx = np.abs(np.diff(gray, axis=1))
        dy = np.abs(np.diff(gray, axis=0))
        mean_edge_intensity = float(np.mean(dx) + np.mean(dy))

        if mean_edge_intensity > 28.0:
            return (
                False,
                "Non-satellite object or graphic detected (unnatural sharp object outlines / map borders / non-cloud texture).",
            )

        # 6. Satellite Cloud Lightness & Background Check
        mean_lightness = float(np.mean(gray))
        if mean_lightness > 210.0 or mean_lightness < 8.0:
            return (
                False,
                "Image lighting does not match space-borne Earth satellite imagery (overexposed or underexposed).",
            )

        return (True, "")
    except Exception as e:
        return (False, f"Unable to analyze image file: {str(e)}")


def preprocess_single_channel(image_bytes: bytes) -> np.ndarray:
    """Helper function to load an image from bytes, convert to grayscale (1 channel),
    resize to 224x224, and normalize pixel values to float range [0.0, 1.0].
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.load()
    except Exception as e:
        raise ValueError(f"Corrupted or invalid image file. Unable to decode image: {str(e)}")

    width, height = image.size
    # Maximum pixel dimension check (resize down if > 4000px to prevent excessive memory usage)
    if width > 4000 or height > 4000:
        image.thumbnail((4000, 4000), Image.Resampling.LANCZOS)

    image = image.convert("L")  # Convert image to grayscale (single channel)
    image = image.resize((224, 224))  # Resize to 224x224 pixels
    img_array = np.array(image, dtype=np.float32) / 255.0  # Normalize pixel values to 0-1
    img_array = 1.0 - img_array  # Invert pixel values so bright cloud tops (high PNG values) map to low values matching training dataset
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
            pmw_array = np.zeros_like(base_array)
    else:
        pmw_array = np.zeros_like(base_array)

    # Stack IR, WV, VIS, PMW along axis 0 -> shape: (4, 224, 224)
    stacked_array = np.stack([ir_array, wv_array, vis_array, pmw_array], axis=0)

    # Convert NumPy array to PyTorch Tensor and add batch dimension -> shape: (1, 4, 224, 224)
    tensor = torch.from_numpy(stacked_array).unsqueeze(0)

    return tensor, sources_used
