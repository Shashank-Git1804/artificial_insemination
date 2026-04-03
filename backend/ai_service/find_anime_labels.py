import json
from pathlib import Path

with open(Path("model_artifacts/imagenet_labels.json")) as f:
    labels = json.load(f)

# Find cartoon/anime/comic/illustration related labels
keywords = ["comic", "cartoon", "anime", "manga", "illustration", "drawing",
            "mask", "costume", "puppet", "doll", "toy", "figurine",
            "jersey", "bikini", "swimsuit", "brassiere", "lingerie",
            "miniskirt", "stocking", "sock", "sandal", "shoe",
            "lipstick", "nail", "perfume", "lotion"]

print("Potentially problematic labels:")
for i, label in enumerate(labels):
    for kw in keywords:
        if kw in label.lower():
            print(f"  [{i:4d}] {label}")
            break

print("\n\nAll labels 900-1000 (often people/objects):")
for i in range(900, 1000):
    print(f"  [{i:4d}] {labels[i]}")
