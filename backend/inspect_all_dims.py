import os
import cv2

designs_dir = "uploads/designs"
for fname in os.listdir(designs_dir):
    if fname.endswith(".jpeg") or fname.endswith(".jpg"):
        fpath = os.path.join(designs_dir, fname)
        img = cv2.imread(fpath)
        if img is not None:
            print(f"{fname}: {img.shape[1]}x{img.shape[0]}")
        else:
            print(f"{fname}: Failed to load")
