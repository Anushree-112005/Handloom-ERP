import os
import glob
import tempfile
import pytesseract
from PIL import Image

# Create a local temp directory for Tesseract
local_temp = "/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)/backend/tess_temp"
os.makedirs(local_temp, exist_ok=True)
tempfile.tempdir = local_temp

# Set TESSDATA_PREFIX to the folder containing 'eng.traineddata'
os.environ["TESSDATA_PREFIX"] = "/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)/backend"

media_dir = "/home/cubeai/.gemini/antigravity/brain/860c507b-a75d-4685-ae15-ae6d040e93aa"
image_files = glob.glob(os.path.join(media_dir, "media__*"))

for img_path in sorted(image_files):
    if img_path.lower().endswith(('.png', '.jpg', '.jpeg')):
        print("="*60)
        print(f"File: {os.path.basename(img_path)}")
        try:
            img = Image.open(img_path)
            text = pytesseract.image_to_string(img)
            print("OCR Text (first 500 chars):")
            print(text[:500])
        except Exception as e:
            print("Error:", e)
