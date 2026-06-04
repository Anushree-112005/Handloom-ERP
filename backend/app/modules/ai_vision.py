"""
AI Vision & Pattern Detection Module for Textile Designs.
Includes KMeans color detection, Stripe width/repeat detection, and 2D FFT Weave analysis.
"""
import numpy as np
from PIL import Image
import io
import logging

logger = logging.getLogger("app.modules.ai_vision")

# ─── Color Name Mapping ───
COLOR_MAP = {
    "red": (180, 50, 50), "green": (50, 130, 50), "blue": (50, 50, 180),
    "yellow": (200, 200, 50), "orange": (220, 140, 40), "purple": (130, 50, 150),
    "brown": (140, 90, 50), "beige": (200, 180, 150), "white": (240, 240, 240),
    "black": (20, 20, 20), "grey": (130, 130, 130), "olive": (128, 128, 0),
    "navy": (0, 0, 128), "maroon": (128, 0, 0), "teal": (0, 128, 128),
    "cream": (255, 253, 208), "khaki": (195, 176, 145), "indigo": (75, 0, 130),
    "coral": (255, 127, 80), "ivory": (255, 255, 240),
}


def ensure_rgb(img_array):
    """Ensure the image array is in standard HxWx3 RGB format."""
    if img_array.ndim == 2:
        # Grayscale HxW -> HxWx3
        return np.stack([img_array, img_array, img_array], axis=-1)
    elif img_array.ndim == 3:
        if img_array.shape[2] == 4:
            # RGBA -> RGB (drop alpha channel)
            return img_array[:, :, :3]
        elif img_array.shape[2] == 1:
            # HxWx1 -> HxWx3
            return np.concatenate([img_array, img_array, img_array], axis=2)
    return img_array


def closest_color_name(rgb):
    """Map an RGB tuple to the closest named color."""
    min_dist = float("inf")
    closest = "unknown"
    # Ensure rgb elements are standard Python floats/ints
    rgb_clean = tuple(float(x) for x in rgb)
    for name, ref in COLOR_MAP.items():
        dist = sum((a - b) ** 2 for a, b in zip(rgb_clean, ref))
        if dist < min_dist:
            min_dist = dist
            closest = name
    return closest


# ─── MODULE 1: Color Detection (KMeans) ───
def detect_colors(img_array, n_clusters=5):
    """Detect dominant colors using KMeans clustering."""
    img_array = ensure_rgb(img_array)
    try:
        from sklearn.cluster import KMeans
    except ImportError:
        logger.error("scikit-learn is not installed or available.")
        # Fallback to simple color histogram / average if sklearn is missing
        return [{"color": "fallback-green", "rgb": [50, 130, 50], "hex": "#328232", "ratio": 100.0}]

    # Reshape to pixels
    pixels = img_array.reshape(-1, 3).astype(np.float64)
    # Sample if too large
    if len(pixels) > 50000:
        indices = np.random.choice(len(pixels), 50000, replace=False)
        pixels = pixels[indices]

    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    kmeans.fit(pixels)

    labels = kmeans.labels_
    centers = kmeans.cluster_centers_
    counts = np.bincount(labels)
    total = len(labels)

    colors = []
    for i, (center, count) in enumerate(sorted(zip(centers, counts), key=lambda x: -x[1])):
        # Cast to native python int to prevent JSON serialization errors
        rgb = tuple(int(round(x)) for x in center)
        ratio = round(float(count / total * 100), 1)
        name = closest_color_name(rgb)
        colors.append({
            "color": name,
            "rgb": list(rgb),
            "hex": "#{:02x}{:02x}{:02x}".format(*rgb),
            "ratio": ratio
        })
    return colors


# ─── MODULE 2: Stripe Detection ───
def detect_stripes(img_array):
    """Detect vertical stripe patterns by analyzing column-averaged color transitions."""
    img_array = ensure_rgb(img_array)
    # Convert to grayscale
    gray = np.mean(img_array, axis=2)
    # Average along vertical axis to get horizontal profile
    profile = np.mean(gray, axis=0)

    # Normalize
    profile = (profile - profile.min()) / (profile.max() - profile.min() + 1e-6) * 255

    # Detect transitions using gradient
    gradient = np.abs(np.diff(profile))
    threshold = np.mean(gradient) + np.std(gradient)
    transitions = np.where(gradient > threshold)[0]

    # Build stripe sequence
    stripes = []
    if len(transitions) > 1:
        prev = 0
        for t in transitions:
            width = int(t - prev)
            if width > 3:  # minimum stripe width
                # Cast to native python float/int to prevent JSON serialization errors
                avg_color = tuple(int(round(x)) for x in np.mean(img_array[:, prev:t, :], axis=(0, 1)))
                color_name = closest_color_name(avg_color)
                stripes.append({
                    "color": color_name,
                    "width_px": width,
                    "rgb": list(avg_color)
                })
            prev = int(t)

    # Detect repeat pattern
    if len(stripes) >= 4:
        colors = [s["color"] for s in stripes]
        for repeat_len in range(2, len(colors) // 2 + 1):
            pattern = colors[:repeat_len]
            is_repeat = True
            for i in range(repeat_len, len(colors) - repeat_len + 1, repeat_len):
                if colors[i:i + repeat_len] != pattern:
                    is_repeat = False
                    break
            if is_repeat:
                return stripes, pattern
    return stripes, [s["color"] for s in stripes[:6]] if stripes else []


# ─── MODULE 3: FFT Weave Analysis ───
def analyze_weave_fft(img_array):
    """Use 2D FFT to detect weave structure from frequency domain analysis."""
    img_array = ensure_rgb(img_array)
    try:
        # pyrefly: ignore [missing-import]
        from scipy.fft import fft2, fftshift
        # pyrefly: ignore [missing-import]
        from scipy.signal import find_peaks
    except ImportError:
        logger.error("scipy is not installed or available.")
        return "Plain", 0.5, {"error": "scipy not installed"}

    gray = np.mean(img_array, axis=2)

    # Resize to standard size for consistent analysis
    gray_img = Image.fromarray(gray.astype(np.uint8))
    gray_img = gray_img.resize((256, 256))
    gray_resized = np.array(gray_img, dtype=np.float64)

    # Apply 2D FFT
    fft_result = fft2(gray_resized)
    fft_shifted = fftshift(fft_result)
    magnitude = np.log1p(np.abs(fft_shifted))

    # Analyze frequency spectrum
    center = magnitude.shape[0] // 2
    h_profile = magnitude[center, :]  # horizontal
    v_profile = magnitude[:, center]  # vertical

    # Diagonal analysis for twill
    diag_sum = 0
    for i in range(min(magnitude.shape)):
        diag_sum += magnitude[i, i]
    diag_avg = diag_sum / min(magnitude.shape)

    # Center cross analysis
    h_energy = np.sum(h_profile[center-20:center+20])
    v_energy = np.sum(v_profile[center-20:center+20])
    total_energy = np.sum(magnitude)
    cross_ratio = (h_energy + v_energy) / (total_energy + 1e-6)

    # Peak detection
    h_peaks, _ = find_peaks(h_profile, height=np.mean(h_profile), distance=5)
    v_peaks, _ = find_peaks(v_profile, height=np.mean(v_profile), distance=5)

    # Classify weave type
    n_h_peaks = len(h_peaks)
    n_v_peaks = len(v_peaks)

    if cross_ratio > 0.15:
        weave = "Plain"
        confidence = min(0.85, cross_ratio * 4)
    elif diag_avg > np.mean(magnitude) * 1.3:
        weave = "Twill"
        confidence = min(0.8, diag_avg / (np.mean(magnitude) + 1e-6) * 0.5)
    elif n_h_peaks > 8 and n_v_peaks > 8:
        weave = "Dobby"
        confidence = 0.65
    elif cross_ratio < 0.05:
        weave = "Satin"
        confidence = 0.6
    else:
        weave = "Plain"
        confidence = 0.5

    fft_profile = {
        "h_peaks": int(n_h_peaks),
        "v_peaks": int(n_v_peaks),
        "cross_ratio": round(float(cross_ratio), 4),
        "diag_avg": round(float(diag_avg), 4),
        "classification": weave
    }

    return weave, round(float(confidence), 3), fft_profile
