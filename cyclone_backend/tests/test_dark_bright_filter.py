"""
Tests for Dark Background with Unstructured Bright Region Filter in check_valid_satellite_image().
Verifies:
1. Genuine cyclone sample images continue to pass validation.
2. An authentic cyclone core placed on a mostly-dark (>70%) background passes validation.
3. Synthetic non-satellite images ("dark background + irregular bright blob" patterns like
   rectangles, face-like profiles, CCTV beams, or dark images lacking bright structures)
   are rejected with the exact reason:
   "Bright region pattern is not consistent with organized cyclone cloud structure".
4. Existing color variance checks remain active and working.
"""

import io
import os
import sys
from pathlib import Path

# Add project root to sys.path
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
if (PROJECT_ROOT / "app").exists():
    sys.path.insert(0, str(PROJECT_ROOT))
else:
    sys.path.insert(0, str(PROJECT_ROOT / "cyclone_backend"))

import cv2
import numpy as np
from PIL import Image

from app.core.preprocessing import check_valid_satellite_image


def image_to_png_bytes(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_genuine_cyclone_sample():
    sample_path = os.path.join(os.path.dirname(__file__), "..", "sample_data", "sample_01.png")
    assert os.path.exists(sample_path), f"Sample file not found at {sample_path}"

    with open(sample_path, "rb") as f:
        img_bytes = f.read()

    is_valid, reason = check_valid_satellite_image(img_bytes, source_type="IR")
    print(f"Genuine Sample 01 -> Valid: {is_valid} | Reason: '{reason}'")
    assert is_valid is True, f"Genuine cyclone image failed validation: {reason}"
    assert reason == "", f"Expected empty reason for valid image, got: {reason}"


def test_genuine_cyclone_on_dark_ocean():
    """Simulate a genuine cyclone eye and dense overcast core on a dark (>75%) ocean background.
    Because the cloud core is organized and roughly circular, it must pass the shape regularity check.
    """
    sample_path = os.path.join(os.path.dirname(__file__), "..", "sample_data", "sample_01.png")
    s1 = np.array(Image.open(sample_path).convert("L"), dtype=np.uint8)
    h, w = s1.shape

    # Composite: dark ocean (pixel value ~25, well within <38.25 dark threshold) with genuine cyclone in center
    composite = np.full((h, w), 25, dtype=np.uint8)
    cy, cx = h // 2, w // 2
    r = int(min(h, w) * 0.28)  # Covers ~25% of image area, background > 75% dark
    y, x = np.ogrid[:h, :w]
    mask = (x - cx) ** 2 + (y - cy) ** 2 <= r ** 2
    composite[mask] = s1[mask]

    img = Image.fromarray(composite)
    img_bytes = image_to_png_bytes(img)

    is_valid, reason = check_valid_satellite_image(img_bytes, source_type="IR")
    print(f"Cyclone on >75% Dark Ocean -> Valid: {is_valid} | Reason: '{reason}'")
    assert is_valid is True, f"Organized cyclone core on dark ocean should pass, but failed: {reason}"


def test_reject_irregular_bright_rectangle():
    """Synthetic test 1: Black background (90% of image) with an irregular 3:1 aspect ratio bright rectangle.
    Circularity ratio (contour area / min enclosing circle area) is ~0.38 (< 0.5), so it must be rejected.
    """
    canvas = np.zeros((200, 200), dtype=np.uint8)
    # 40x120 bright rectangle (aspect ratio 3:1)
    canvas[80:120, 40:160] = 220

    img = Image.fromarray(canvas)
    img_bytes = image_to_png_bytes(img)

    is_valid, reason = check_valid_satellite_image(img_bytes, source_type="IR")
    print(f"Irregular Bright Rectangle -> Valid: {is_valid} | Reason: '{reason}'")
    assert is_valid is False, "Irregular rectangle on dark background should be rejected!"
    assert reason == "Bright region pattern is not consistent with organized cyclone cloud structure", (
        f"Unexpected reason: {reason}"
    )


def test_reject_face_like_profile():
    """Synthetic test 2: Black background with a face-like silhouette / profile (avatar / CCTV portrait).
    The irregular contour has circularity ratio < 0.5 and must be rejected.
    """
    canvas = np.zeros((200, 200), dtype=np.uint8)
    pts = np.array([
        [90, 40],   # head top
        [120, 50],  # forehead
        [115, 70],  # eye socket
        [135, 85],  # nose tip
        [118, 95],  # upper lip
        [128, 115], # chin
        [105, 140], # jawline
        [105, 180], # neck front
        [75, 180],  # neck back
        [70, 90],   # back of head
        [75, 50],   # crown
    ], np.int32)
    cv2.fillPoly(canvas, [pts], 215)

    img = Image.fromarray(canvas)
    img_bytes = image_to_png_bytes(img)

    is_valid, reason = check_valid_satellite_image(img_bytes, source_type="IR")
    print(f"Face-like Profile Silhouette -> Valid: {is_valid} | Reason: '{reason}'")
    assert is_valid is False, "Face-like shape on dark background should be rejected!"
    assert reason == "Bright region pattern is not consistent with organized cyclone cloud structure", (
        f"Unexpected reason: {reason}"
    )


def test_reject_cctv_angled_beam():
    """Synthetic test 3: CCTV footage / night camera with an elongated angled headlight streak or glare beam.
    Circularity ratio is << 0.5 and must be rejected.
    """
    canvas = np.zeros((200, 200), dtype=np.uint8)
    pts = np.array([[30, 170], [170, 30], [185, 45], [45, 185]], np.int32)
    cv2.fillPoly(canvas, [pts], 230)

    img = Image.fromarray(canvas)
    img_bytes = image_to_png_bytes(img)

    is_valid, reason = check_valid_satellite_image(img_bytes, source_type="IR")
    print(f"CCTV Angled Headlight Beam -> Valid: {is_valid} | Reason: '{reason}'")
    assert is_valid is False, "CCTV light beam on dark background should be rejected!"
    assert reason == "Bright region pattern is not consistent with organized cyclone cloud structure", (
        f"Unexpected reason: {reason}"
    )


def test_reject_mostly_dark_without_bright_region():
    """Synthetic test 4: Dark background with no significant bright cloud region (dim murky noise, max < 60).
    Lacks any organized bright convective structure and must be rejected.
    """
    canvas = np.random.randint(10, 45, size=(200, 200), dtype=np.uint8)

    img = Image.fromarray(canvas)
    img_bytes = image_to_png_bytes(img)

    is_valid, reason = check_valid_satellite_image(img_bytes, source_type="IR")
    print(f"Dark Murky Noise Image -> Valid: {is_valid} | Reason: '{reason}'")
    assert is_valid is False, "Dark image without bright cloud structure should be rejected!"
    assert reason == "Bright region pattern is not consistent with organized cyclone cloud structure", (
        f"Unexpected reason: {reason}"
    )


def test_color_variance_still_active():
    """Verify that existing color variance checks are preserved and reject colorful photos."""
    img_data = np.zeros((100, 100, 3), dtype=np.uint8)
    for y in range(100):
        for x in range(100):
            img_data[y, x] = [x * 2, y * 2, (x + y)]

    img = Image.fromarray(img_data)
    img_bytes = image_to_png_bytes(img)

    is_valid, reason = check_valid_satellite_image(img_bytes, source_type="IR")
    print(f"Color Photo -> Valid: {is_valid} | Reason: '{reason}'")
    assert is_valid is False, "Color photo should still be rejected by color variance check!"
    assert "Non-satellite color photo detected" in reason, f"Unexpected reason: {reason}"


if __name__ == "__main__":
    print("=== RUNNING DARK BACKGROUND & SHAPE REGULARITY TESTS ===")
    test_genuine_cyclone_sample()
    test_genuine_cyclone_on_dark_ocean()
    test_reject_irregular_bright_rectangle()
    test_reject_face_like_profile()
    test_reject_cctv_angled_beam()
    test_reject_mostly_dark_without_bright_region()
    test_color_variance_still_active()
    print("\n✅ All dark background and shape regularity tests passed successfully!")
