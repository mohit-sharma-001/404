import io
import numpy as np
from PIL import Image
from app.core.preprocessing import check_valid_satellite_image

def run_test():
    # 1. Create a colorful RGB test image (red/green/blue gradient pattern)
    img_data = np.zeros((100, 100, 3), dtype=np.uint8)
    for y in range(100):
        for x in range(100):
            img_data[y, x] = [x * 2, y * 2, (x + y)]

    img = Image.fromarray(img_data)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    colorful_bytes = buf.getvalue()

    print("=== SATELLITE IMAGE VALIDATION TEST ===")
    
    # Test 1: Uploading colorful photo as IR file (should fail strict grayscale check)
    is_valid_ir, reason_ir = check_valid_satellite_image(colorful_bytes, source_type="IR")
    print(f"Test 1 [IR  source with color image] -> Valid: {is_valid_ir} | Reason: '{reason_ir}'")
    
    # Test 2: Uploading non-satellite synthetic color image as VIS file (should fail non-satellite check)
    is_valid_vis, reason_vis = check_valid_satellite_image(colorful_bytes, source_type="VIS")
    print(f"Test 2 [VIS source with non-satellite color image] -> Valid: {is_valid_vis} | Reason: '{reason_vis}'")

    assert is_valid_ir == False, "IR check should fail for non-satellite color image!"
    assert is_valid_vis == False, "VIS check should fail for non-satellite color photo!"
    
    print("\n✅ All validation tests passed successfully!")

if __name__ == "__main__":
    run_test()
