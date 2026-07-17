import cv2
import numpy as np

img = cv2.imread("uploads/designs/DEPL0001_67de58cf.jpeg")
h, w = img.shape[:2]

# Let's count how many pixels are in different brightness ranges
grays = [int(0.299*r + 0.587*g + 0.114*b) for row in img for (b, g, r) in row]
min_gray = min(grays)
max_gray = max(grays)
mean_gray = sum(grays) / len(grays)
print(f"Grayscale range: {min_gray} to {max_gray}, mean: {mean_gray:.2f}")

# Let's print the histogram of grayscale values
hist, bin_edges = np.histogram(grays, bins=10)
print("Histogram of gray levels:")
for i in range(10):
    print(f"  {bin_edges[i]:.1f} - {bin_edges[i+1]:.1f}: {hist[i]}")

# Let's check if there are very bright pixels (like white stripes) that are extremely narrow
# Let's count pixels with gray > 180 or gray < 80
bright_count = sum(1 for g in grays if g > 175)
dark_count = sum(1 for g in grays if g < 95)
print(f"Bright pixels (>175): {bright_count}")
print(f"Dark pixels (<95): {dark_count}")

# Let's find the maximum brightness in each column
col_max = [max(int(0.299*img[y, x, 2] + 0.587*img[y, x, 1] + 0.114*img[y, x, 0]) for y in range(h)) for x in range(w)]
print("Max brightness per column:")
for x, val in enumerate(col_max):
    print(f"col {x:2d}: {val}")
