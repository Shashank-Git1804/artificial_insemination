import json, numpy as np, cv2, onnxruntime as ort
from pathlib import Path

ARTIFACTS = Path("model_artifacts")
session   = ort.InferenceSession(str(ARTIFACTS / "mobilenetv2.onnx"))
inp_name  = session.get_inputs()[0].name
with open(ARTIFACTS / "imagenet_labels.json") as f:
    LABELS = json.load(f)

def top10(img_path):
    img = cv2.imread(img_path)
    if img is None: return []
    img = cv2.resize(img, (224, 224))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32)
    img = (img / 127.5) - 1.0
    img = np.transpose(img, (2, 0, 1))
    img = np.expand_dims(img, 0)
    out = session.run(None, {inp_name: img})[0][0]
    e = np.exp(out - np.max(out)); probs = e / e.sum()
    idx = np.argsort(probs)[::-1][:10]
    return [(int(i), LABELS[i], round(float(probs[i])*100, 2)) for i in idx]

base = r"C:\Users\Shashank\Downloads\pashimitra_model_training_package (3)\pashimitra_model_training_package\pashimitra_model_training_package\possible_heat"

# Check the problematic images
for fname in ["bvvv56.jpg.jpeg", "bvvv62.jpg.jpeg", "cheong.massive.1836.jpg.jpeg",
              "download (1).jpg.jpeg", "download (2).jpg.jpeg"]:
    import os
    path = os.path.join(base, fname)
    results = top10(path)
    print(f"\n{fname}:")
    for idx, label, conf in results[:5]:
        print(f"  [{idx:4d}] {label}: {conf}%")
    # Show image dimensions
    img = cv2.imread(path)
    if img is not None:
        print(f"  Size: {img.shape[1]}x{img.shape[0]}")
