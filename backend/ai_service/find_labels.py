import json
from pathlib import Path

with open(Path("model_artifacts/imagenet_labels.json")) as f:
    labels = json.load(f)

keywords = ["cow","bull","ox","cattle","buffalo","bison","goat","sheep","pig","hog",
            "swine","boar","ram","ewe","lamb","bovine","dairy","calf","heifer",
            "bullock","cart","barn","pasture","livestock","farm","steer"]

print("All livestock-related ImageNet labels:")
for i, label in enumerate(labels):
    for kw in keywords:
        if kw in label.lower():
            print(f"  [{i}] {label}")
            break
