import os
import cv2
import json
from app.design_ai.image_analyzer import extract_colors_and_pipeline

designs_dir = "uploads/designs"
for fname in os.listdir(designs_dir):
    if fname.endswith(".jpeg") or fname.endswith(".jpg"):
        fpath = os.path.join(designs_dir, fname)
        print(f"\n--- Analyzing {fname} ({os.path.getsize(fpath)} bytes) ---")
        try:
            img = cv2.imread(fpath)
            if img is None:
                print("Failed to read image")
                continue
            res = extract_colors_and_pipeline(img, num_colors="auto")
            print("Dominant Colors:")
            for dc in res["dominant_colors"]:
                print(f"  {dc['color_name']}: {dc['percentage']}% (RGB: {dc['rgb']})")
            print("Orientation:", res["orientation"])
            print("Repeating Sequence:")
            for item in res["repeating_sequence"]:
                print(f"  {item['color_name']}: {item['threads']} threads (Hex: {item['hex']})")
        except Exception as e:
            print(f"Error: {e}")
