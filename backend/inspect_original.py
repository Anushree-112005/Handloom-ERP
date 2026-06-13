import cv2
import numpy as np

img = cv2.imread("uploads/designs/DEPL0001_67de58cf.jpeg")
h, w = img.shape[:2]
print(f"Original image dimensions: {w}x{h}")

# Print the BGR values along the middle row
mid_y = h // 2
print(f"BGR values for row y={mid_y}:")
for x in range(w):
    b, g, r = img[mid_y, x]
    # Calculate simple grayscale intensity to make it easy to see light vs dark
    gray = int(0.299*r + 0.587*g + 0.114*b)
    print(f"x={x:2d}: BGR=[{b:3d}, {g:3d}, {r:3d}] | Gray={gray:3d}")
