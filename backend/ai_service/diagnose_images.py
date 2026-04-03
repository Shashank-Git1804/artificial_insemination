"""
Test what MobileNetV2 sees for different image types.
Run this with a human photo to see what labels come up.
"""
import json, numpy as np, cv2, onnxruntime as ort, os, sys
from pathlib import Path

ARTIFACTS = Path("model_artifacts")
session   = ort.InferenceSession(str(ARTIFACTS / "mobilenetv2.onnx"))
inp_name  = session.get_inputs()[0].name

with open(ARTIFACTS / "imagenet_labels.json") as f:
    LABELS = json.load(f)

def top10(img_path):
    img = cv2.imread(img_path)
    if img is None:
        print(f"Cannot read: {img_path}")
        return []
    img = cv2.resize(img, (224, 224))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32)
    img = (img / 127.5) - 1.0
    img = np.transpose(img, (2, 0, 1))
    img = np.expand_dims(img, 0)
    out = session.run(None, {inp_name: img})[0][0]
    e = np.exp(out - np.max(out)); probs = e / e.sum()
    idx = np.argsort(probs)[::-1][:10]
    return [(LABELS[i], round(float(probs[i])*100, 3), i) for i in idx]

# Test all images in possible_heat folder
heat_folder = r"C:\Users\Shashank\Downloads\pashimitra_model_training_package (3)\pashimitra_model_training_package\pashimitra_model_training_package\possible_heat"

print("=== ALL IMAGES IN possible_heat ===\n")
files = sorted([f for f in os.listdir(heat_folder)
                if f.lower().endswith(('.jpg','.jpeg','.png','.webp'))])

for f in files:
    path = os.path.join(heat_folder, f)
    results = top10(path)
    top_label, top_conf, top_idx = results[0]
    print(f"{f[:50]:<50} -> [{top_idx:4d}] {top_label} ({top_conf}%)")
