"""
Pashimitra — Full Retraining Script
Uses augmented images + ensemble model for higher accuracy.
Run: python retrain_with_augmented.py

Expected improvement:
  Image model:   80% → 88–92%
  Tabular model: 90% → 93–95% (with more species data)
"""

import os, json, cv2, joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.metrics import (classification_report, accuracy_score,
                             f1_score, roc_auc_score, precision_recall_fscore_support)

BASE      = Path(__file__).parent
ARTIFACTS = BASE / "model_artifacts"
# Absolute paths to training data
DATA_BASE    = Path(r"C:\Users\Shashank\Downloads\pashimitra_model_training_package (3)\pashimitra_model_training_package\pashimitra_model_training_package")
AUG_HEAT     = DATA_BASE / "augmented" / "heat"
AUG_NOT_HEAT = DATA_BASE / "augmented" / "not_heat"
ORIG_HEAT    = DATA_BASE / "possible_heat"
ORIG_NOT     = DATA_BASE / "not_in_heat_reference"
CSV_HEAT     = Path(r"C:\Users\Shashank\Downloads\pashimitra_model_training_package (3)\mernStackOfAtrificialIsemination\data\multi_livestock_heat_data.csv")
CSV_INF      = Path(r"C:\Users\Shashank\Downloads\pashimitra_model_training_package (3)\mernStackOfAtrificialIsemination\data\multi_livestock_infection_data.csv")

SUPPORTED = {'.jpg', '.jpeg', '.png', '.webp', '.bmp'}


# ── Feature extraction (same as main.py) ─────────────────────────────────────
def extract_features(image_path):
    img = cv2.imread(str(image_path))
    if img is None:
        return None
    img  = cv2.resize(img, (224, 224))
    hsv  = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    rgb  = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    mean_color     = np.mean(rgb, axis=(0, 1))
    red_prominence = mean_color[0] - np.mean(mean_color)
    vulva_redness  = float(np.clip(red_prominence / 50, 0.0, 1.0))
    moisture_level = float(np.mean(hsv[:, :, 1] > 150) / 255)
    edges          = cv2.Canny(gray, 50, 150)
    edge_density   = float(np.sum(edges > 0) / (edges.shape[0] * edges.shape[1]))
    blur           = cv2.GaussianBlur(gray, (5, 5), 0)
    _, binary      = cv2.threshold(blur, 127, 255, cv2.THRESH_BINARY)
    contours, _    = cv2.findContours(binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    vulva_swelling = float(min(len(contours) / 100, 1.0))
    laplacian      = cv2.Laplacian(gray, cv2.CV_64F)
    texture_change = float(min(np.sqrt(np.mean(laplacian ** 2)) / 1000, 1.0))

    return {
        'species':           'cow',
        'activity_spike':    float(min(vulva_redness + texture_change, 1.0)),
        'restlessness':      edge_density,
        'mounting_events':   float(max(len(contours) / 50, 0)),
        'vision_model_score': float((vulva_redness + moisture_level + vulva_swelling) / 3),
    }


def load_images(folder, label):
    rows = []
    folder = Path(folder)
    if not folder.exists():
        print(f"  Folder not found: {folder}")
        return rows
    for f in folder.iterdir():
        if f.suffix.lower() in SUPPORTED:
            feat = extract_features(f)
            if feat:
                feat['label_heat'] = label
                rows.append(feat)
    return rows


# ── Build ensemble model ──────────────────────────────────────────────────────
def build_ensemble_pipeline(cat_cols, num_cols):
    pre = ColumnTransformer([
        ('cat', Pipeline([
            ('imp', SimpleImputer(strategy='most_frequent')),
            ('oh',  OneHotEncoder(handle_unknown='ignore'))
        ]), cat_cols),
        ('num', Pipeline([
            ('imp',   SimpleImputer(strategy='median')),
            ('scale', StandardScaler())
        ]), num_cols),
    ])

    lr  = LogisticRegression(random_state=42, class_weight='balanced', max_iter=1000, C=1.0)
    rf  = RandomForestClassifier(n_estimators=200, random_state=42, class_weight='balanced',
                                  max_depth=10, min_samples_split=5)
    gb  = GradientBoostingClassifier(n_estimators=150, random_state=42,
                                      learning_rate=0.05, max_depth=4)

    ensemble = VotingClassifier(
        estimators=[('lr', lr), ('rf', rf), ('gb', gb)],
        voting='soft',
        weights=[1, 2, 2]   # RF and GB weighted higher
    )

    return Pipeline([('pre', pre), ('clf', ensemble)])


def evaluate_and_save(model, X_test, y_test, name):
    pred  = model.predict(X_test)
    proba = model.predict_proba(X_test)[:, 1]
    acc   = accuracy_score(y_test, pred)
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, pred, average='weighted')
    auc   = roc_auc_score(y_test, proba) if len(y_test.unique()) > 1 else 0.0

    metrics = {
        'accuracy':  round(float(acc), 4),
        'precision': round(float(prec), 4),
        'recall':    round(float(rec), 4),
        'f1':        round(float(f1), 4),
        'auc':       round(float(auc), 4),
        'model_type': 'VotingEnsemble(LR+RF+GradientBoosting)',
        'report':    classification_report(y_test, pred, output_dict=True),
    }

    joblib.dump(model, ARTIFACTS / f"{name}.pkl")
    with open(ARTIFACTS / f"{name}_metrics.json", 'w') as f:
        json.dump(metrics, f, indent=2)

    print(f"\n{'='*50}")
    print(f"  {name}")
    print(f"  Accuracy:  {acc:.4f}")
    print(f"  Precision: {prec:.4f}")
    print(f"  Recall:    {rec:.4f}")
    print(f"  F1:        {f1:.4f}")
    print(f"  AUC:       {auc:.4f}")
    print(classification_report(y_test, pred))
    return metrics


# ════════════════════════════════════════════════════════════════════════════
# 1. RETRAIN IMAGE MODEL with augmented data
# ════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("STEP 1: Retraining image-based heat model")
print("="*60)

# Load augmented images (preferred) or fall back to originals
heat_rows     = load_images(AUG_HEAT,     label=1) or load_images(ORIG_HEAT, label=1)
not_heat_rows = load_images(AUG_NOT_HEAT, label=0) or load_images(ORIG_NOT,  label=0)

print(f"  Heat images:     {len(heat_rows)}")
print(f"  Not-heat images: {len(not_heat_rows)}")

if heat_rows and not_heat_rows:
    img_df = pd.DataFrame(heat_rows + not_heat_rows)
    X = img_df.drop(columns=['label_heat'])
    y = img_df['label_heat']

    cat_cols = ['species']
    num_cols = [c for c in X.columns if c not in cat_cols]

    model_img = build_ensemble_pipeline(cat_cols, num_cols)

    # Cross-validation
    cv_scores = cross_val_score(model_img, X, y, cv=StratifiedKFold(5), scoring='accuracy')
    print(f"  Cross-val accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    model_img.fit(X_train, y_train)
    img_metrics = evaluate_and_save(model_img, X_test, y_test, 'heat_model_from_images')
else:
    print("  Skipping image model — no images found. Run augment_data.py first.")


# ════════════════════════════════════════════════════════════════════════════
# 2. RETRAIN TABULAR HEAT MODEL with ensemble
# ════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("STEP 2: Retraining tabular heat model with ensemble")
print("="*60)

heat_df = pd.read_csv(CSV_HEAT)
print(f"  Dataset size: {len(heat_df)} rows")
print(f"  Species: {heat_df['species'].unique()}")

X = heat_df.drop(columns=['label_heat'])
y = heat_df['label_heat']
cat_cols = ['species']
num_cols = [c for c in X.columns if c not in cat_cols]

model_heat = build_ensemble_pipeline(cat_cols, num_cols)

cv_scores = cross_val_score(model_heat, X, y, cv=StratifiedKFold(5), scoring='accuracy')
print(f"  Cross-val accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
model_heat.fit(X_train, y_train)
heat_metrics = evaluate_and_save(model_heat, X_test, y_test, 'heat_model')


# ════════════════════════════════════════════════════════════════════════════
# 3. RETRAIN INFECTION MODEL with ensemble
# ════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print("STEP 3: Retraining infection model with ensemble")
print("="*60)

inf_df = pd.read_csv(CSV_INF)
print(f"  Dataset size: {len(inf_df)} rows")

X = inf_df.drop(columns=['label_infection'])
y = inf_df['label_infection']
cat_cols = ['species']
num_cols = [c for c in X.columns if c not in cat_cols]

model_inf = build_ensemble_pipeline(cat_cols, num_cols)

cv_scores = cross_val_score(model_inf, X, y, cv=StratifiedKFold(5), scoring='accuracy')
print(f"  Cross-val accuracy: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
model_inf.fit(X_train, y_train)
inf_metrics = evaluate_and_save(model_inf, X_test, y_test, 'infection_model')


print("\n" + "="*60)
print("RETRAINING COMPLETE — Restart the AI service to use new models")
print("  cd backend/ai_service")
print("  python -m uvicorn main:app --port 8000 --reload")
print("="*60)
