"""
Data Augmentation Script — Pashimitra
Multiplies existing images to improve model training.
Run: python augment_data.py
"""

import cv2
import numpy as np
import os
from pathlib import Path

BASE         = Path(r"C:\Users\Shashank\Downloads\pashimitra_model_training_package (3)\pashimitra_model_training_package\pashimitra_model_training_package")
HEAT_IN      = BASE / "possible_heat"
NOT_HEAT_IN  = BASE / "not_in_heat_reference"
HEAT_OUT     = BASE / "augmented" / "heat"
NOT_HEAT_OUT = BASE / "augmented" / "not_heat"

HEAT_OUT.mkdir(parents=True, exist_ok=True)
NOT_HEAT_OUT.mkdir(parents=True, exist_ok=True)

SUPPORTED = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}

def augment_image(img):
    """Returns list of augmented versions of one image."""
    results = [img]  # original

    # 1. Horizontal flip
    results.append(cv2.flip(img, 1))

    # 2. Brightness +30%
    bright = cv2.convertScaleAbs(img, alpha=1.3, beta=20)
    results.append(bright)

    # 3. Brightness -30%
    dark = cv2.convertScaleAbs(img, alpha=0.7, beta=-20)
    results.append(dark)

    # 4. Rotate +15°
    h, w = img.shape[:2]
    M = cv2.getRotationMatrix2D((w//2, h//2), 15, 1.0)
    results.append(cv2.warpAffine(img, M, (w, h)))

    # 5. Rotate -15°
    M2 = cv2.getRotationMatrix2D((w//2, h//2), -15, 1.0)
    results.append(cv2.warpAffine(img, M2, (w, h)))

    # 6. Gaussian blur (simulates out-of-focus phone camera)
    results.append(cv2.GaussianBlur(img, (5, 5), 0))

    # 7. Add noise (simulates low-light rural conditions)
    noise = np.random.normal(0, 15, img.shape).astype(np.int16)
    noisy = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    results.append(noisy)

    # 8. Crop center 80%
    ch, cw = int(h * 0.1), int(w * 0.1)
    cropped = img[ch:h-ch, cw:w-cw]
    results.append(cv2.resize(cropped, (w, h)))

    # 9. Saturation boost (vivid colors)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:,:,1] = np.clip(hsv[:,:,1] * 1.4, 0, 255)
    results.append(cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR))

    # 10. Contrast stretch
    results.append(cv2.equalizeHist(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
                   .reshape(*img.shape[:2], 1).repeat(3, axis=2))

    return results


def process_folder(input_folder, output_folder, label):
    input_path  = Path(input_folder)
    output_path = Path(output_folder)
    files       = [f for f in input_path.iterdir() if f.suffix.lower() in SUPPORTED]

    if not files:
        print(f"  No images found in {input_folder}")
        return 0

    count = 0
    for img_path in files:
        img = cv2.imread(str(img_path))
        if img is None:
            print(f"  Skipping unreadable: {img_path.name}")
            continue

        img = cv2.resize(img, (224, 224))
        augmented = augment_image(img)

        for i, aug in enumerate(augmented):
            out_name = f"{label}_{img_path.stem}_aug{i}.jpg"
            cv2.imwrite(str(output_path / out_name), aug)
            count += 1

    return count


print("=" * 60)
print("PASHIMITRA — Data Augmentation")
print("=" * 60)

heat_count     = process_folder(HEAT_IN,     HEAT_OUT,     "heat")
not_heat_count = process_folder(NOT_HEAT_IN, NOT_HEAT_OUT, "notheat")

print(f"\nHeat images:     {heat_count} (from {len(list(HEAT_IN.glob('*')))} originals)")
print(f"Not-heat images: {not_heat_count} (from {len(list(NOT_HEAT_IN.glob('*')))} originals)")
print(f"\nAugmented data saved to:")
print(f"  {HEAT_OUT}")
print(f"  {NOT_HEAT_OUT}")
print("\nNow run: python retrain_with_augmented.py")
