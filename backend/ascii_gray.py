import cv2
import numpy as np

img = cv2.imread("uploads/designs/DEPL0001_67de58cf.jpeg")
h, w = img.shape[:2]

# Resize to something small but readable, e.g. 40x80
# We want to keep the horizontal details, so let's resize to width=91, height=40
img_small = cv2.resize(img, (91, 40))

chars = " .:-=+*#%@" # from dark to light
for y in range(40):
    row_chars = []
    for x in range(91):
        b, g, r = img_small[y, x]
        gray = int(0.299*r + 0.587*g + 0.114*b)
        idx = min(len(chars) - 1, int(gray / 256.0 * len(chars)))
        row_chars.append(chars[idx])
    print("".join(row_chars))
