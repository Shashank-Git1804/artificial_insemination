"""Quick test of MobileNetV2 species validation."""
import json, numpy as np, cv2, onnxruntime as ort, os
from pathlib import Path

ARTIFACTS = Path("model_artifacts")
session   = ort.InferenceSession(str(ARTIFACTS / "mobilenetv2.onnx"))
inp_name  = session.get_inputs()[0].name
print("Input shape expected:", session.get_inputs()[0].shape)

with open(ARTIFACTS / "imagenet_labels.json") as f:
    LABELS = json.load(f)

def top5(img_path):
    img = cv2.imread(img_path)
    if img is None:
        return []
    img = cv2.resize(img, (224, 224))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32)
    img = (img / 127.5) - 1.0
    img = np.transpose(img, (2, 0, 1))   # HWC -> CHW  (3, 224, 224)
    img = np.expand_dims(img, 0)          # (1, 3, 224, 224)
    out = session.run(None, {inp_name: img})[0][0]
    e = np.exp(out - np.max(out)); probs = e / e.sum()
    idx = np.argsort(probs)[::-1][:5]
    return [(LABELS[i], round(float(probs[i])*100, 2)) for i in idx]

heat_folder = r"C:\Users\Shashank\Downloads\pashimitra_model_training_package (3)\pashimitra_model_training_package\pashimitra_model_training_package\possible_heat"
files = [f for f in os.listdir(heat_folder) if f.lower().endswith(('.jpg','.jpeg','.png','.webp'))][:3]

print("\n=== Testing on cow/heat images ===")
for f in files:
    path = os.path.join(heat_folder, f)
    results = top5(path)
    print(f"\n{f}:")
    for label, conf in results:
        print(f"  {label}: {conf}%")
