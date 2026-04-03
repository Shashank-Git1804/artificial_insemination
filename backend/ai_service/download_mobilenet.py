"""Download MobileNetV2 ONNX model and ImageNet labels."""
import urllib.request, json
from pathlib import Path

BASE = Path(__file__).parent / "model_artifacts"
BASE.mkdir(exist_ok=True)

MODEL_URL  = "https://github.com/onnx/models/raw/main/validated/vision/classification/mobilenet/model/mobilenetv2-12.onnx"
LABELS_URL = "https://raw.githubusercontent.com/anishathalye/imagenet-simple-labels/master/imagenet-simple-labels.json"

model_path  = BASE / "mobilenetv2.onnx"
labels_path = BASE / "imagenet_labels.json"

if not model_path.exists():
    print("Downloading MobileNetV2 ONNX model (~14MB)...")
    urllib.request.urlretrieve(MODEL_URL, model_path)
    print(f"Saved: {model_path}")
else:
    print(f"Model already exists: {model_path}")

if not labels_path.exists():
    print("Downloading ImageNet labels...")
    urllib.request.urlretrieve(LABELS_URL, labels_path)
    print(f"Saved: {labels_path}")
else:
    print(f"Labels already exist: {labels_path}")

print("Done.")
