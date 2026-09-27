import logging
import os
from pathlib import Path
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient

logging.basicConfig(level=logging.INFO)

from app.main import app
from app.api.routes import is_valid_email

def run_tests():
    client = TestClient(app)
    
    # 1. Test is_valid_email helper function
    print("--- 1. Testing Email Format Validation ---")
    assert is_valid_email("user@example.com") is True
    assert is_valid_email("mohitsharma084400@gmail.com") is True
    assert is_valid_email("invalid-email") is False
    assert is_valid_email("user@no-domain") is False
    assert is_valid_email("") is False
    assert is_valid_email(None) is False
    print("✅ is_valid_email passed all unit assertions")

    # Sample images known to predict a severe category (Very Severe Cyclonic Storm)
    data_dir = Path(__file__).resolve().parents[1] / "data" / "sample_images"
    ir_path = data_dir / "sample_extremely_severe_cyclonic_storm_ir.png"
    wv_path = data_dir / "sample_extremely_severe_cyclonic_storm_wv.png"

    assert ir_path.exists(), f"Missing {ir_path}"
    assert wv_path.exists(), f"Missing {wv_path}"

    with open(ir_path, "rb") as ir_f, open(wv_path, "rb") as wv_f:
        ir_bytes = ir_f.read()
        wv_bytes = wv_f.read()

    # 2. Test /predict with malformed email (should silently ignore bad email and succeed)
    print("\n--- 2. Testing /predict with Malformed Email ---")
    files = {
        "ir_file": ("sample_ir.png", ir_bytes, "image/png"),
        "wv_file": ("sample_wv.png", wv_bytes, "image/png"),
    }
    data = {"email": "invalid-email-address"}
    response = client.post("/api/v1/predict", files=files, data=data)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    result = response.json()
    assert result["has_cyclone"] is True
    print(f"✅ Malformed email ignored silently. API status: 200, Category: {result['intensity_category']}")

    # 3. Test /predict with real email + Severe Cyclone sample
    print("\n--- 3. Testing /predict with Real Email & Critical Cyclone ---")
    target_email = "mohitsharma084400@gmail.com"
    files = {
        "ir_file": ("sample_ir.png", ir_bytes, "image/png"),
        "wv_file": ("sample_wv.png", wv_bytes, "image/png"),
    }
    data = {"email": target_email}
    response = client.post("/api/v1/predict", files=files, data=data)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    result = response.json()
    assert result["has_cyclone"] is True
    assert result["intensity_category"] in [
        "Severe Cyclonic Storm",
        "Very Severe Cyclonic Storm",
        "Extremely Severe Cyclonic Storm",
        "Super Cyclonic Storm",
    ]
    print("✅ /predict returned 200 OK")
    print(f"   - has_cyclone: {result['has_cyclone']}")
    print(f"   - intensity_category: {result['intensity_category']}")
    print(f"   - estimated_wind_speed_kmh: {result['estimated_wind_speed_kmh']}")
    print(f"   - confidence: {result['confidence']}%")

    # 4. Test failure non-blocking resilience: Even if email sending raises an error, /predict must return 200
    print("\n--- 4. Testing Non-Blocking Resilience on Email Failure ---")
    from unittest.mock import patch
    with patch("app.api.routes.send_cyclone_alert", side_effect=RuntimeError("Simulated Resend API crash")):
        response = client.post("/api/v1/predict", files=files, data=data)
        assert response.status_code == 200, f"Expected 200 despite email failure, got {response.status_code}"
        res_fail = response.json()
        assert res_fail["has_cyclone"] is True
        print("✅ /predict succeeded with 200 OK even when email service raised a RuntimeError")

    print("\n🎉 All /predict email alert integration tests PASSED successfully!")

if __name__ == "__main__":
    run_tests()
