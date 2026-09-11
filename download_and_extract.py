import os
import sys
import subprocess
import shutil
import gdown

TEMP_DIR = "/Users/abhinavshankarsaxena/VayuNetra/404/temp_downloads"
TARGET_DIR = "/Users/abhinavshankarsaxena/VayuNetra/404/cyclone_backend/data/raw"

os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(TARGET_DIR, exist_ok=True)

DATASETS = [
    {
        "name": "TCIR-CPAC_IO_SH",
        "id": "1nvDQvgcC5GlXIZuQNtSjL7tmRPunyOsG",
        "archive": "TCIR-CPAC_IO_SH.h5.tar.gz",
        "h5": "TCIR-CPAC_IO_SH.h5",
    },
    {
        "name": "TCIR-ATLN_EPAC_WPAC",
        "id": "1_g7aKIwJRbgjEiBqxWBgwLNhgF12-RVt",
        "archive": "TCIR-ATLN_EPAC_WPAC.h5.tar.gz",
        "h5": "TCIR-ATLN_EPAC_WPAC.h5",
    },
]

for item in DATASETS:
    archive_path = os.path.join(TEMP_DIR, item["archive"])
    final_h5_path = os.path.join(TARGET_DIR, item["h5"])
    
    if os.path.exists(final_h5_path) and os.path.getsize(final_h5_path) > 1024 * 1024 * 1024:
        gb = os.path.getsize(final_h5_path) / (1024**3)
        print(f"✓ {item['h5']} already exists ({gb:.2f} GB). Skipping download.")
        continue

    print(f"\n==========================================")
    print(f"Downloading {item['archive']} via gdown...")
    print(f"==========================================")
    gdown.download(id=item["id"], output=archive_path, quiet=False)
    
    if not os.path.exists(archive_path) or os.path.getsize(archive_path) < 1000:
        print(f"ERROR: Failed to download {item['archive']}", file=sys.stderr)
        sys.exit(1)
        
    archive_gb = os.path.getsize(archive_path) / (1024**3)
    print(f"✓ Downloaded {item['archive']} ({archive_gb:.2f} GB). Extracting to {TARGET_DIR}...")
    
    # Extract using system tar
    cmd = ["tar", "-xzf", archive_path, "-C", TARGET_DIR]
    ret = subprocess.run(cmd)
    if ret.returncode != 0:
        print(f"ERROR: tar extraction failed for {item['archive']}", file=sys.stderr)
        sys.exit(1)
        
    # Sometimes tar extracts to a subfolder or root, let's verify
    if not os.path.exists(final_h5_path):
        # search TARGET_DIR for item['h5']
        for root, dirs, files in os.walk(TARGET_DIR):
            if item["h5"] in files:
                found_path = os.path.join(root, item["h5"])
                shutil.move(found_path, final_h5_path)
                break
                
    if os.path.exists(final_h5_path):
        h5_gb = os.path.getsize(final_h5_path) / (1024**3)
        print(f"✓ Extracted {item['h5']} successfully ({h5_gb:.2f} GB)")
    else:
        print(f"ERROR: {item['h5']} not found after extraction!", file=sys.stderr)
        sys.exit(1)
        
    # Remove archive immediately to save disk space
    os.remove(archive_path)
    print(f"✓ Removed temporary archive {item['archive']} to preserve disk space.")

# Clean up temp directory
shutil.rmtree(TEMP_DIR, ignore_errors=True)
print("\n==========================================")
print("ALL TCIR DATASETS DOWNLOADED AND EXTRACTED SUCCESSFULLY!")
print("==========================================")
