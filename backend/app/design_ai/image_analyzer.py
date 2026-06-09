# image_analyzer.py
import cv2
import numpy as np
from sklearn.cluster import KMeans

def _load_bgr(img_or_path, grayscale=False):
    if isinstance(img_or_path, np.ndarray):
        img = img_or_path.copy()
    else:
        flags = cv2.IMREAD_GRAYSCALE if grayscale else cv2.IMREAD_COLOR
        img = cv2.imread(str(img_or_path), flags)
        if img is None:
            raise FileNotFoundError(f"Could not load image: {img_or_path}")

    if grayscale and img.ndim == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    return img

def extract_colors(img_or_path, num_colors=5):
    res = extract_colors_and_pipeline(img_or_path, num_colors)
    return res["dominant_colors"]

def extract_colors_and_pipeline(img_or_path, num_colors=5):
    def local_closest_color(requested_color):
        r, g, b = int(requested_color[0]), int(requested_color[1]), int(requested_color[2])
        bgr_px = np.array([[[b, g, r]]], dtype=np.uint8)
        hsv_px = cv2.cvtColor(bgr_px, cv2.COLOR_BGR2HSV)[0][0]
        h, s, v = int(hsv_px[0]), int(hsv_px[1]), int(hsv_px[2])

        max_val = max(r, g, b)
        min_val = min(r, g, b)
        diff = max_val - min_val

        # Warm neutral check (Cream / Beige / Khaki)
        # Require BOTH a warm hue AND meaningful saturation (s>=25) AND color spread (diff>=20)
        # This prevents near-grey pixels with a slight warm camera tint from being classified as Khaki.
        if (10 <= h < 42) and s >= 25 and diff >= 20:
            if v > 215:   return "Cream"
            elif v > 160: return "Beige"
            elif v > 80:  return "Khaki"
            else:         return "D.Brown"

        # Warm-tinted grey handler (warm hue but NOT saturated enough to be Khaki/Beige)
        # Handles camera white-balance artifacts that tint white/grey fabric slightly warm.
        # Stops at h<32 so olive/green pixels (h>=35 in OpenCV) are NOT caught here.
        if (10 <= h < 32) and (s < 25 or diff < 20):
            if v > 185:   return "H.White"
            elif v > 110 and h >= 15: return "Beige"
            elif v > 90:  return "Grey"
            elif v > 35:  return "DarkGrey"
            else:         return "Black"

        # 1. Pure Achromatic (Grayscale) Check — tight so muted greens/olives are NOT caught here
        if diff < 5 or s < 8:
            if v > 185:   return "H.White"
            elif v > 90:  return "Grey"
            elif v > 35:  return "DarkGrey"
            else:         return "Black"

        # 2. Low-saturation / pastel colors (where Sage Green, Olive, Beige live)
        if s < 75:
            # Green / Yellow-Green Hue Range -> Green / Olive
            # Extended to h>=32 to capture olive-green hues (H=40-45 in OpenCV HSV)
            if 32 <= h < 75:
                if s < 10:
                    if v > 185:   return "H.White"
                    elif v > 90:  return "Grey"
                    else:         return "DarkGrey"
                if v > 130:   return "Green"
                elif v > 90:  return "Green"
                elif v > 70:  return "Olive"
                else:         return "Olive"
            # Orange / Yellow Hue Range -> Cream / Beige / Khaki
            elif 8 <= h < 32:
                if s < 10:
                    if v > 185:   return "H.White"
                    elif v > 90:  return "Grey"
                    else:         return "DarkGrey"
                if v > 215:   return "Cream"
                elif v > 160: return "Beige"
                elif v > 120: return "Khaki"
                elif v > 80:  return "Khaki"
                else:         return "D.Brown"
            # Blue / Cyan Hue Range -> D.Blue / H.White
            elif 85 <= h < 130:
                if s < 50:
                    if v > 150:   return "H.White"
                    elif v > 90:  return "Grey"
                    else:         return "DarkGrey"
                if v > 150:   return "SkyBlue"
                elif v > 80:  return "D.Blue"
                else:         return "D.Blue"

        # 3. Standard fully-saturated color classification
        # Re-route dark/medium reds and purples/magentas to brown tones
        if h < 8 or h >= 172:
            if v <= 75:   return "D.Brown"
            elif v <= 125: return "L.Brown"
            else:         return "Red"
        elif h < 18:
            if v <= 75:   return "D.Brown"
            elif v <= 125: return "L.Brown"
            else:         return "Brown"
        elif h < 28:
            return "Orange"
        elif h < 38:
            return "Yellow" if v > 140 else "Mustard"
        elif h < 75:
            return "Green" if v > 90 else "DarkGreen"
        elif h < 90:
            return "Cyan" if v > 120 else "Teal"
        elif h < 100:
            return "D.Blue"
        elif h < 115:
            return "D.Blue"
        elif h < 130:
            # Purple / Magenta range
            if v <= 75:   return "D.Brown"
            elif v <= 125: return "L.Brown"
            else:         return "D.Blue"
        elif h < 150:
            if v <= 75:   return "D.Brown"
            elif v <= 125: return "L.Brown"
            else:         return "Purple"
        elif h < 165:
            if v <= 75:   return "D.Brown"
            elif v <= 125: return "L.Brown"
            else:         return "Magenta"
        else:
            if v <= 75:   return "D.Brown"
            elif v <= 125: return "L.Brown"
            else:         return "DeepPink"

    img = _load_bgr(img_or_path, grayscale=False)

    if img.ndim == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    h, w = img.shape[:2]
    scale = 300.0 / max(h, w)
    img_small = cv2.resize(img, (0, 0), fx=scale, fy=scale)

    filtered = cv2.GaussianBlur(img_small, (5, 5), 0)

    lab = cv2.cvtColor(filtered, cv2.COLOR_BGR2LAB)
    pixels = lab.reshape(-1, 3).astype(np.float32)
    if num_colors == "auto":
        optimal_k = 5
        for k in range(5, 1, -1):
            kmeans = KMeans(n_clusters=k, random_state=42, n_init=10, max_iter=300)
            kmeans.fit(pixels)
            centers = kmeans.cluster_centers_
            too_close = False
            for i in range(k):
                for j in range(i + 1, k):
                    dist = np.linalg.norm(centers[i] - centers[j])
                    if dist < 22.0:
                        too_close = True
                        break
                if too_close:
                    break
            if not too_close:
                optimal_k = k
                break
        else:
            optimal_k = 2
        num_colors = optimal_k
    else:
        num_colors = int(num_colors)

    kmeans = KMeans(n_clusters=num_colors, random_state=42, n_init=10, max_iter=300)
    labels = kmeans.fit_predict(pixels)
    unique, counts = np.unique(labels, return_counts=True)
    total_pixels = len(labels)
    percentages = (counts / total_pixels) * 100

    centers_lab = kmeans.cluster_centers_.astype(np.uint8).reshape(-1, 1, 3)
    centers_bgr = cv2.cvtColor(centers_lab, cv2.COLOR_LAB2BGR).reshape(-1, 3)
    centers_rgb = centers_bgr[:, [2, 1, 0]]

    results = []
    for idx, pct in zip(unique, percentages):
        r, g, b = int(centers_rgb[idx][0]), int(centers_rgb[idx][1]), int(centers_rgb[idx][2])
        color_name = local_closest_color((r, g, b))
        results.append({
            "rgb": [r, g, b],
            "bgr": [int(centers_bgr[idx][0]), int(centers_bgr[idx][1]), int(centers_bgr[idx][2])],
            "hex": f"#{r:02x}{g:02x}{b:02x}",
            "percentage": float(round(pct, 2)),
            "color_name": color_name
        })

    # Merge duplicate color names
    merged_results = {}
    for item in results:
        name = item["color_name"]
        if name in merged_results:
            merged_results[name]["percentage"] = float(round(merged_results[name]["percentage"] + item["percentage"], 2))
        else:
            merged_results[name] = item

    results = list(merged_results.values())

    # Merge multiple neutral colors into the single dominant neutral color to handle transition/shadow clusters
    NEUTRALS = {"White", "LightGrey", "Grey", "DarkGrey"}
    neutral_items = [item for item in results if item["color_name"] in NEUTRALS]
    if len(neutral_items) > 1:
        dominant_neutral = max(neutral_items, key=lambda x: x["percentage"])
        new_results = []
        merged_pct = 0.0
        for item in results:
            if item["color_name"] in NEUTRALS:
                merged_pct += item["percentage"]
            else:
                new_results.append(item)
        dominant_neutral["percentage"] = float(round(merged_pct, 2))
        new_results.append(dominant_neutral)
        results = new_results

    results.sort(key=lambda x: x["percentage"], reverse=True)

    def get_compressed_sequence_with_lengths(labels_line):
        seq = []
        current_label = None
        current_len = 0
        for label in labels_line:
            if label == current_label:
                current_len += 1
            else:
                if current_label is not None and current_len >= 5:
                    seq.append((current_label, current_len))
                current_label = label
                current_len = 1
        if current_label is not None and current_len >= 5:
            seq.append((current_label, current_len))

        final_seq = []
        for item in seq:
            if not final_seq or final_seq[-1][0] != item[0]:
                final_seq.append(item)
            else:
                final_seq[-1] = (final_seq[-1][0], final_seq[-1][1] + item[1])
        return final_seq

    def find_repeating_unit(lst):
        if not lst:
            return []
        n = len(lst)
        for p in range(1, n // 2 + 1):
            pattern = lst[:p]
            is_repeat = True
            for i in range(n):
                if lst[i] != pattern[i % p]:
                    is_repeat = False
                    break
            if is_repeat:
                return pattern
        return lst

    h_small, w_small = img_small.shape[:2]
    labels_grid = labels.reshape(h_small, w_small)
    seq_h = get_compressed_sequence_with_lengths(labels_grid[h_small // 2, :])
    seq_v = get_compressed_sequence_with_lengths(labels_grid[:, w_small // 2])

    if len(seq_h) >= len(seq_v):
        best_seq = seq_h
        orientation = "warp (vertical stripes)"
    else:
        best_seq = seq_v
        orientation = "weft (horizontal stripes)"

    best_seq_labels = [label for label, length in best_seq]
    repeating_labels = find_repeating_unit(best_seq_labels)

    # ── Thread-count normalization ────────────────────────────────────────────
    # Camera/lighting makes equal-proportion stripes appear unequal in pixels.
    # Strategy: if all stripes are within ±25% of the average pixel width,
    # treat as equal-proportion fabric → assign 8 threads per stripe.
    # Otherwise use proportional scaling with base unit 2 (smallest textile thread count).
    import math

    raw_pixel_lengths = []
    for i, label in enumerate(repeating_labels):
        raw_pixel_lengths.append(best_seq[i][1] if i < len(best_seq) else 1)

    thread_counts = []
    if raw_pixel_lengths:
        avg_px = sum(raw_pixel_lengths) / len(raw_pixel_lengths)
        # Check if all stripes have similar pixel widths (equal-proportion fabric)
        is_equal_proportion = all(
            abs(px - avg_px) / avg_px <= 0.30
            for px in raw_pixel_lengths
        )

        if is_equal_proportion:
            # Equal stripes (e.g. 8+8 blue-white) → force 8 threads each
            thread_counts = [8] * len(raw_pixel_lengths)
        else:
            # Proportional: scale using ratio relative to smallest stripe
            # Base unit = 1 thread (finest resolution for textile thread count)
            min_px = min(raw_pixel_lengths)
            thread_counts = [
                max(1, round(px / min_px))
                for px in raw_pixel_lengths
            ]

    repeating_sequence = []
    for i, label in enumerate(repeating_labels):
        r, g_c, b = int(centers_rgb[label][0]), int(centers_rgb[label][1]), int(centers_rgb[label][2])
        color_name = local_closest_color((r, g_c, b))
        repeating_sequence.append({
            "color_name": color_name,
            "threads": thread_counts[i] if i < len(thread_counts) else 8,
            "hex": f"#{r:02x}{g_c:02x}{b:02x}"
        })

    merged_sequence = []
    for item in repeating_sequence:
        if merged_sequence and merged_sequence[-1]["color_name"] == item["color_name"]:
            merged_sequence[-1]["threads"] += item["threads"]
        else:
            merged_sequence.append(item.copy())
    repeating_sequence = merged_sequence

    return {
        "dominant_colors": results,
        "img_small": img_small,
        "kmeans": kmeans,
        "repeating_sequence": repeating_sequence,
        "orientation": orientation
    }

def extract_weave_structure(img_or_path):
    img = _load_bgr(img_or_path, grayscale=True)

    f = np.fft.fft2(img)
    fshift = np.fft.fftshift(f)
    magnitude_spectrum = np.log(1.0 + np.abs(fshift))

    h, w = magnitude_spectrum.shape
    cy, cx = h // 2, w // 2

    mag_no_dc = magnitude_spectrum.copy()
    dc_radius = max(10, min(h, w) // 20)
    mag_no_dc[cy - dc_radius: cy + dc_radius + 1,
              cx - dc_radius: cx + dc_radius + 1] = 0

    flat_indices = np.argsort(mag_no_dc.flatten())[-10:]
    y_coords, x_coords = np.unravel_index(flat_indices, mag_no_dc.shape)

    distances = []
    vertical_peaks = 0
    for y, x in zip(y_coords, x_coords):
        dy = y - cy
        dx = x - cx
        dist = float(np.sqrt(dx ** 2 + dy ** 2))
        distances.append(dist)
        if abs(dx) <= 3 and abs(dy) >= 8:
            vertical_peaks += 1

    avg_dist = float(np.mean(distances)) if distances else 0.0

    return {
        "avg_peak_distance": avg_dist,
        "vertical_peaks_count": vertical_peaks,
        "img_shape": [h, w],
    }

def classify_weave(img_or_path):
    feats = extract_weave_structure(img_or_path)
    dist = feats["avg_peak_distance"]
    v_peaks = feats["vertical_peaks_count"]

    if dist > 45.0:
        return "Oxford Chambray", dist
    elif dist >= 12.0:
        if v_peaks >= 5:
            return "7 FRAME DOBBY", dist
        return "Plain", dist
    else:
        return "7 FRAME DOBBY", dist
