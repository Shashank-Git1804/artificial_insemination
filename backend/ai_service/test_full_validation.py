"""Test the full validate_image_species function from main.py"""
import sys
sys.path.insert(0, '.')

# Import the validation function directly
from main import validate_image_species
import os

heat_folder   = r"C:\Users\Shashank\Downloads\pashimitra_model_training_package (3)\pashimitra_model_training_package\pashimitra_model_training_package\possible_heat"
notheat_folder = r"C:\Users\Shashank\Downloads\pashimitra_model_training_package (3)\pashimitra_model_training_package\pashimitra_model_training_package\not_in_heat_reference"

def test_image(path, expected_species, label):
    with open(path, 'rb') as f:
        img_bytes = f.read()
    result = validate_image_species(img_bytes, expected_species)
    status = "✅ PASS" if result["valid"] else "❌ BLOCK"
    print(f"\n{status} [{label}] {os.path.basename(path)}")
    print(f"  Expected: {expected_species} | Detected: {result['detected_species']} | Conf: {result['confidence']*100:.1f}%")
    if not result["valid"]:
        print(f"  Error: {result['error']}")
    print(f"  Top: {result['top_labels'][0] if result['top_labels'] else 'N/A'}")

print("="*60)
print("TEST 1: Cow images with species=cow (should PASS)")
print("="*60)
files = [f for f in os.listdir(heat_folder) if f.lower().endswith(('.jpg','.jpeg','.png','.webp'))][:5]
for f in files:
    test_image(os.path.join(heat_folder, f), "cow", "cow-heat")

print("\n" + "="*60)
print("TEST 2: Cow images with species=sheep (should BLOCK)")
print("="*60)
for f in files[:3]:
    test_image(os.path.join(heat_folder, f), "sheep", "cow-as-sheep")

print("\n" + "="*60)
print("TEST 3: Pig image with species=pig (should PASS)")
print("="*60)
# Use a pig image if available, else test with cow as pig (should block)
test_image(os.path.join(heat_folder, files[1]), "pig", "cow-as-pig")
