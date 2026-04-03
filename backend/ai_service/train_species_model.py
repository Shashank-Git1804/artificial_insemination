"""
train_species_model.py
Trains a species-specific image classifier using buffalo and cow data folders.
Outputs: model_artifacts/species_heat_classifier.pkl + metrics.json

Data layout expected:
  data/buffalo/Khundi/       -> buffalo reproductive (heat candidate)
  data/buffalo/Mix/          -> buffalo general
  data/buffalo/Neli Ravi/    -> buffalo reproductive (heat candidate)
  data/cow/possible_heat/    -> cow reproductive (heat candidate)
  data/cow/not_in_heat_reference/ -> cow not in heat

Run: python train_species_model.py
"""

import cv2
import numpy as np
import joblib
import json
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, accuracy_score

BASE      = Path(__file__).parent
DATA      = BASE / "data"
ARTIFACTS = BASE / "model_artifacts"
ARTIFACTS.mkdir(exist_ok=True)

# ── Feature extraction (same as main.py) ─────────────────────────────────────
def extract_features(img_path: Path) -> dict | None:
    img = cv2.imread(str(img_path))
    if img is None:
        return None

    img  = cv2.resize(img, (224, 224))
    hsv  = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    rgb  = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Blur detection — Laplacian variance (low = blurry)
    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    # Redness
    mean_color     = np.mean(rgb, axis=(0, 1))
    red_prominence = mean_color[0] - np.mean(mean_color)
    vulva_redness  = float(np.clip(red_prominence / 30, 0.0, 1.0))

    # Moisture
    moisture_level = float(np.mean(hsv[:, :, 1] > 100) / 255)

    # Swelling / contours
    blur_img    = cv2.GaussianBlur(gray, (5, 5), 0)
    _, binary   = cv2.threshold(blur_img, 127, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    vulva_swelling = float(min(len(contours) / 80, 1.0))

    # Edge density
    edges        = cv2.Canny(gray, 50, 150)
    edge_density = float(np.sum(edges > 0) / (224 * 224))

    # Texture
    laplacian      = cv2.Laplacian(gray, cv2.CV_64F)
    texture_change = float(min(np.sqrt(np.mean(laplacian ** 2)) / 800, 1.0))

    # Colour stats
    mean_h = float(np.mean(hsv[:, :, 0]))
    mean_s = float(np.mean(hsv[:, :, 1]))
    mean_v = float(np.mean(hsv[:, :, 2]))

    # Reproductive region focus — centre crop redness
    cx = img[80:144, 80:144]
    cx_rgb = cv2.cvtColor(cx, cv2.COLOR_BGR2RGB)
    cx_mean = np.mean(cx_rgb, axis=(0, 1))
    centre_redness = float(np.clip((cx_mean[0] - np.mean(cx_mean)) / 30, 0.0, 1.0))

    return {
        "blur_score":      blur_score,
        "vulva_redness":   vulva_redness,
        "moisture_level":  moisture_level,
        "vulva_swelling":  vulva_swelling,
        "edge_density":    edge_density,
        "texture_change":  texture_change,
        "mean_h":          mean_h,
        "mean_s":          mean_s,
        "mean_v":          mean_v,
        "centre_redness":  centre_redness,
    }

FEATURE_KEYS = [
    "blur_score", "vulva_redness", "moisture_level", "vulva_swelling",
    "edge_density", "texture_change", "mean_h", "mean_s", "mean_v", "centre_redness"
]

# ── Load images from folder ───────────────────────────────────────────────────
def load_folder(folder: Path, label: int, species: str) -> tuple[list, list, list]:
    X, y, meta = [], [], []
    exts = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
    files = [f for f in folder.rglob("*") if f.suffix.lower() in exts]
    print(f"  Loading {len(files)} images from {folder.name} (label={label}, species={species})")
    for f in files:
        feats = extract_features(f)
        if feats is None:
            continue
        X.append([feats[k] for k in FEATURE_KEYS])
        y.append(label)
        meta.append({"file": str(f.name), "species": species})
    return X, y, meta

# ── Build dataset ─────────────────────────────────────────────────────────────
print("Building dataset from buffalo and cow folders...")
X_all, y_all = [], []

# Buffalo — reproductive/heat images (label=1)
for sub in ["Khundi", "Neli Ravi"]:
    p = DATA / "buffalo" / sub
    if p.exists():
        X, y, _ = load_folder(p, label=1, species="buffalo")
        X_all += X; y_all += y

# Buffalo — general/mix images (label=0)
p = DATA / "buffalo" / "Mix"
if p.exists():
    X, y, _ = load_folder(p, label=0, species="buffalo")
    X_all += X; y_all += y

# Cow — possible heat / reproductive (label=1)
p = DATA / "cow" / "possible_heat"
if p.exists():
    X, y, _ = load_folder(p, label=1, species="cow")
    X_all += X; y_all += y

# Cow — not in heat reference (label=0)
p = DATA / "cow" / "not_in_heat_reference"
if p.exists():
    X, y, _ = load_folder(p, label=0, species="cow")
    X_all += X; y_all += y

X_arr = np.array(X_all)
y_arr = np.array(y_all)
print(f"\nTotal samples: {len(y_arr)}  |  Heat/reproductive: {sum(y_arr==1)}  |  Not-heat: {sum(y_arr==0)}")

# ── Train ─────────────────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X_arr, y_arr, test_size=0.2, random_state=42, stratify=y_arr
)

model = Pipeline([
    ("scaler", StandardScaler()),
    ("clf",    GradientBoostingClassifier(n_estimators=200, max_depth=4, learning_rate=0.1, random_state=42)),
])

print("\nTraining GradientBoosting classifier...")
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
acc    = accuracy_score(y_test, y_pred)
cv_scores = cross_val_score(model, X_arr, y_arr, cv=5, scoring="accuracy")

print(f"\nTest accuracy:  {acc*100:.1f}%")
print(f"CV accuracy:    {cv_scores.mean()*100:.1f}% ± {cv_scores.std()*100:.1f}%")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=["not_heat", "heat_reproductive"]))

# ── Save ──────────────────────────────────────────────────────────────────────
out_model   = ARTIFACTS / "species_heat_classifier.pkl"
out_metrics = ARTIFACTS / "species_heat_classifier_metrics.json"

joblib.dump(model, out_model)
metrics = {
    "test_accuracy":    round(acc, 4),
    "cv_mean":          round(float(cv_scores.mean()), 4),
    "cv_std":           round(float(cv_scores.std()), 4),
    "n_samples":        int(len(y_arr)),
    "n_heat":           int(sum(y_arr == 1)),
    "n_not_heat":       int(sum(y_arr == 0)),
    "feature_keys":     FEATURE_KEYS,
    "blur_threshold":   100.0,
}
with open(out_metrics, "w") as f:
    json.dump(metrics, f, indent=2)

print(f"\nSaved model  -> {out_model}")
print(f"Saved metrics -> {out_metrics}")
print("\nDone. Restart main.py to load the new model.")
