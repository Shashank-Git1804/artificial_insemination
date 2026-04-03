"""
Jeeva AI Microservice - FastAPI v4.0
Karnataka Govt Livestock AI Decision Support

Rules enforced on every uploaded photo:
  1. Species in photo must match selected species
  2. Reproductive part must be visible (centre-crop redness/texture check)
  3. Blurry photos are rejected — farmer asked to retake
  4. Non-animal photos rejected (humans, cartoons, objects)
  5. Uploaded photo shown fully in UI (handled frontend side)
"""

import json
import numpy as np
import cv2
import joblib
import pandas as pd
import onnxruntime as ort
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from pathlib import Path

BASE      = Path(__file__).parent
ARTIFACTS = BASE / "model_artifacts"

import os

app = FastAPI(title="Jeeva AI Service", version="4.0.0")
app.add_middleware(CORSMiddleware,
    allow_origins=[
        "http://localhost:5000","http://localhost:5173",
        "http://localhost:5174","http://localhost:5175",
        os.getenv("BACKEND_URL", ""),   # set on Render to your Node backend URL
    ],
    allow_methods=["*"], allow_headers=["*"])

heat_model      = joblib.load(ARTIFACTS / "heat_model.pkl")
heat_img_model  = joblib.load(ARTIFACTS / "heat_model_from_images.pkl")
infection_model = joblib.load(ARTIFACTS / "infection_model.pkl")

# Load species heat classifier if available (trained from buffalo/cow folders)
_shc_path = ARTIFACTS / "species_heat_classifier.pkl"
species_heat_clf = joblib.load(_shc_path) if _shc_path.exists() else None
if species_heat_clf:
    print("Species heat classifier loaded")

mobilenet_session = ort.InferenceSession(str(ARTIFACTS / "mobilenetv2.onnx"))
mobilenet_input   = mobilenet_session.get_inputs()[0].name

with open(ARTIFACTS / "imagenet_labels.json") as f:
    IMAGENET_LABELS = json.load(f)

print("All models loaded - Jeeva AI v4.0")

# ── ImageNet indices ──────────────────────────────────────────────────────────
SPECIES_INDICES = {
    "cow":     {345, 346, 347, 690, 344},
    "buffalo": {346, 347, 345, 690, 344},
    "goat":    {348, 349},
    "sheep":   {348, 349},
    "pig":     {341, 342, 343, 338},
}
LIVESTOCK_ALL = {338,341,342,343,344,345,346,347,348,349,690}

# Hard-reject non-livestock
REJECT_INDICES = set(range(151, 269))   # dogs
REJECT_INDICES |= set(range(281, 288))  # cats
REJECT_INDICES |= set(range(366, 383))  # primates
REJECT_INDICES |= {339, 352,            # horses
                   445, 570, 629, 643, 655, 796, 842,  # human clothing/body
                   917, 981, 982, 983}  # anime, human activity


# ── MobileNetV2 ───────────────────────────────────────────────────────────────
def run_mobilenet(image_bytes: bytes):
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return None, []
    img = cv2.resize(img, (224, 224))
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32)
    img = (img / 127.5) - 1.0
    img = np.transpose(img, (2, 0, 1))[np.newaxis]
    out   = mobilenet_session.run(None, {mobilenet_input: img})[0][0]
    e     = np.exp(out - np.max(out))
    probs = e / e.sum()
    top10 = [(int(i), IMAGENET_LABELS[i].lower(), float(probs[i]))
             for i in np.argsort(probs)[::-1][:10]]
    return probs, top10


# ── Rule 3: Blur detection ────────────────────────────────────────────────────
BLUR_THRESHOLD = 80.0  # Laplacian variance below this = blurry

def is_blurry(image_bytes: bytes) -> tuple[bool, float]:
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return True, 0.0
    gray  = cv2.cvtColor(cv2.resize(img, (224, 224)), cv2.COLOR_BGR2GRAY)
    score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    return score < BLUR_THRESHOLD, score


# ── Rule 4: Human/cartoon skin-tone detection ─────────────────────────────────
def has_human_skin_tone(image_bytes: bytes) -> tuple[bool, float]:
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return False, 0.0
    img   = cv2.resize(img, (224, 224))
    hsv   = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
    mask_hsv   = cv2.inRange(hsv,   np.array([0,  20, 120], np.uint8), np.array([18, 130, 255], np.uint8))
    mask_ycrcb = cv2.inRange(ycrcb, np.array([0, 133,  77], np.uint8), np.array([255, 173, 127], np.uint8))
    ratio = float(np.sum(cv2.bitwise_and(mask_hsv, mask_ycrcb) > 0)) / (224 * 224)
    return ratio > 0.35, ratio


# ── Rule 2: Reproductive part visibility check ────────────────────────────────
def check_reproductive_visible(image_bytes: bytes) -> tuple[bool, str]:
    """
    Checks whether the reproductive area is likely visible.
    Uses centre-crop redness + edge density + texture.
    Returns (visible: bool, reason: str)
    """
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return False, "Could not read image"

    img  = cv2.resize(img, (224, 224))
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Centre crop (reproductive area typically in lower-centre of close-up)
    cx   = img[70:154, 70:154]  # 84x84 centre
    cx_rgb = cv2.cvtColor(cx, cv2.COLOR_BGR2RGB)
    cx_mean = np.mean(cx_rgb, axis=(0, 1))
    centre_redness = float(cx_mean[0] - np.mean(cx_mean))

    # Edge density in centre
    cx_gray = cv2.cvtColor(cx, cv2.COLOR_BGR2GRAY)
    edges   = cv2.Canny(cx_gray, 30, 100)
    edge_density = float(np.sum(edges > 0) / (84 * 84))

    # Texture (Laplacian RMS)
    lap     = cv2.Laplacian(gray, cv2.CV_64F)
    texture = float(np.sqrt(np.mean(lap ** 2)))

    # Heuristic: reproductive close-up has moderate-high edge density OR redness
    # Very low edge + very low redness = likely a full-body shot or irrelevant area
    if edge_density < 0.03 and centre_redness < 3.0 and texture < 15.0:
        return False, ("Reproductive area not clearly visible. "
                       "Please take a close-up photo of the reproductive area (vulva/rear).")
    return True, "Reproductive area detected"


# ── Master image validator (all 5 rules) ──────────────────────────────────────
def validate_image(image_bytes: bytes, expected_species: str) -> dict:
    expected = expected_species.lower()

    # Rule 3 — Blur check FIRST (fastest)
    blurry, blur_score = is_blurry(image_bytes)
    if blurry:
        return {
            "valid": False, "rule_failed": 3,
            "error": (f"Photo is too blurry (sharpness score: {blur_score:.0f}, minimum: {BLUR_THRESHOLD}). "
                      f"Please retake a clear, focused photo of your {expected_species}."),
            "action": "Retake photo in good lighting, hold camera steady.",
        }

    # Rule 4 — Non-animal reject (MobileNet + skin tone)
    is_human, skin_ratio = has_human_skin_tone(image_bytes)
    if is_human:
        return {
            "valid": False, "rule_failed": 4,
            "error": (f"Human or cartoon image detected ({skin_ratio*100:.0f}% skin tones). "
                      f"Only real livestock photos are accepted."),
            "action": f"Upload a real photo of your {expected_species}.",
        }

    probs, top10 = run_mobilenet(image_bytes)
    if probs is None:
        return {"valid": False, "rule_failed": 4,
                "error": "Could not read image. Please upload a valid JPG/PNG photo.",
                "action": "Upload a valid image file."}

    top_idx, top_label, top_conf = top10[0]
    top_labels_display = [f"{l} ({c*100:.1f}%)" for _, l, c in top10[:5]]

    # Hard-reject by ImageNet index
    for idx, label, conf in top10[:3]:
        if idx in REJECT_INDICES and conf > 0.12:
            return {
                "valid": False, "rule_failed": 4,
                "error": (f"Invalid image — detected '{label}' ({conf*100:.0f}%). "
                          f"Only livestock animal photos are accepted."),
                "action": f"Upload a clear photo of your {expected_species}.",
                "top_labels": top_labels_display,
            }

    # Score species
    species_scores  = {sp: float(sum(probs[i] for i in idx_set))
                       for sp, idx_set in SPECIES_INDICES.items()}
    best_species    = max(species_scores, key=species_scores.get)
    best_score      = species_scores[best_species]
    total_livestock = sum(species_scores.values())

    # Close-up reproductive photo — low MobileNet confidence is expected
    is_closeup = top_conf < 0.30 and total_livestock < 0.08

    # Rule 4 — No livestock at all
    if not is_closeup and total_livestock < 0.05:
        return {
            "valid": False, "rule_failed": 4,
            "error": (f"No livestock detected in photo. Top prediction: '{top_label}' ({top_conf*100:.1f}%). "
                      f"Please upload a photo of your {expected_species}."),
            "action": f"Upload a clear photo of your {expected_species}.",
            "top_labels": top_labels_display,
        }

    # Rule 1 — Species mismatch
    SIMILAR = {("cow", "buffalo"), ("buffalo", "cow")}
    if (not is_closeup and best_species != expected
            and (best_species, expected) not in SIMILAR
            and best_score >= 0.06):
        return {
            "valid": False, "rule_failed": 1,
            "error": (f"Species mismatch — photo shows a {best_species} ({best_score*100:.0f}%), "
                      f"but you selected {expected_species}. "
                      f"Please upload a photo of your {expected_species}."),
            "action": f"Upload the correct animal's photo.",
            "top_labels": top_labels_display,
            "detected_species": best_species,
        }

    # Rule 2 — Reproductive part visibility
    repro_visible, repro_reason = check_reproductive_visible(image_bytes)
    if not repro_visible:
        return {
            "valid": False, "rule_failed": 2,
            "error": repro_reason,
            "action": "Take a close-up photo showing the rear/vulva area clearly.",
            "top_labels": top_labels_display,
        }

    return {
        "valid": True,
        "rule_failed": None,
        "detected_species": best_species if best_score > 0.05 else expected,
        "confidence": best_score,
        "top_labels": top_labels_display,
        "blur_score": round(blur_score, 1),
        "error": None,
    }


# ── OpenCV feature extraction (improved for close-ups) ───────────────────────
def extract_image_features(image_bytes: bytes) -> dict:
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return None

    img  = cv2.resize(img, (224, 224))
    hsv  = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    rgb  = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Redness: heat causes vulva redness — use wider normalization for close-ups
    mean_color     = np.mean(rgb, axis=(0, 1))
    red_prominence = mean_color[0] - np.mean(mean_color)
    vulva_redness  = float(np.clip(red_prominence / 30, 0.0, 1.0))  # /30 more sensitive than /50

    # Moisture: high saturation pixels indicate discharge/moisture
    moisture_level = float(np.mean(hsv[:, :, 1] > 100) / 255)  # lowered threshold from 150

    # Swelling: more contours = more irregular tissue = swelling
    blur        = cv2.GaussianBlur(gray, (5, 5), 0)
    _, binary   = cv2.threshold(blur, 127, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(binary, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    vulva_swelling = float(min(len(contours) / 80, 1.0))  # /80 more sensitive than /100

    # Edge density
    edges       = cv2.Canny(gray, 50, 150)
    edge_density = float(np.sum(edges > 0) / (edges.shape[0] * edges.shape[1]))

    # Texture
    laplacian      = cv2.Laplacian(gray, cv2.CV_64F)
    texture_change = float(min(np.sqrt(np.mean(laplacian ** 2)) / 800, 1.0))  # /800 more sensitive

    # Vision model score: weighted combination for heat indicators
    vision_score = float((vulva_redness * 0.5 + moisture_level * 0.3 + vulva_swelling * 0.2))

    return {
        "activity_spike":     float(min(vulva_redness + texture_change, 1.0)),
        "restlessness":       edge_density,
        "mounting_events":    float(max(len(contours) / 40, 0)),
        "vision_model_score": vision_score,
        "vulva_redness":      vulva_redness,
        "moisture_level":     moisture_level,
        "vulva_swelling":     vulva_swelling,
        "texture_change":     texture_change,
    }


# ── Weight validation ─────────────────────────────────────────────────────────
IDEAL_WEIGHT = {
    "cow":     {1:(80,120),2:(180,250),3:(280,350),4:(350,450),5:(380,500)},
    "buffalo": {1:(100,150),2:(220,300),3:(320,420),4:(400,500),5:(450,550)},
    "goat":    {1:(10,18),2:(20,30),3:(28,40),4:(32,45),5:(35,50)},
    "sheep":   {1:(12,20),2:(22,32),3:(28,40),4:(32,45),5:(35,48)},
    "pig":     {1:(30,60),2:(80,120),3:(100,150),4:(110,160),5:(120,170)},
}

def validate_weight(species, age, weight):
    age_key = min(max(round(float(age)), 1), 5)
    ranges  = IDEAL_WEIGHT.get(species, {}).get(age_key)
    if not ranges:
        return {"valid": True, "message": "Weight range not available"}
    lo, hi = ranges
    if weight < lo * 0.7:
        return {"valid": False, "severity": "low",
                "message": f"Weight {weight}kg below ideal {lo}-{hi}kg for {age}yr {species}"}
    if weight > hi * 1.3:
        return {"valid": False, "severity": "high",
                "message": f"Weight {weight}kg above ideal {lo}-{hi}kg for {age}yr {species}"}
    if lo <= weight <= hi:
        return {"valid": True, "severity": "normal",
                "message": f"Weight {weight}kg within ideal {lo}-{hi}kg"}
    return {"valid": True, "severity": "borderline",
            "message": f"Weight {weight}kg borderline (ideal: {lo}-{hi}kg)"}


# ── Cycles ────────────────────────────────────────────────────────────────────
CYCLES = {
    "cow":     {"cycle_range":"18-24 days","heat_duration_hours":"12-18 hours",
                "best_ai_window":"12-18 hours after onset","gestation_range":"279-287 days",
                "ovulation_after_heat_hours":"10-14 hours after end of standing heat",
                "postpartum_heat_days":"45-60 days after calving","cycle_length_days":21,
                "signs":["Standing to be mounted","Mucus discharge","Swollen vulva","Restlessness"]},
    "buffalo": {"cycle_range":"18-22 days","heat_duration_hours":"5-27 hours",
                "best_ai_window":"6-12 hours after onset","gestation_range":"300-320 days",
                "ovulation_after_heat_hours":"12-18 hours after end of heat",
                "postpartum_heat_days":"60-90 days after calving","cycle_length_days":21,
                "signs":["Silent heat common","Mucus discharge","Frequent urination","Bellowing"]},
    "goat":    {"cycle_range":"18-22 days","heat_duration_hours":"24-48 hours",
                "best_ai_window":"12-24 hours after onset","gestation_range":"145-155 days",
                "ovulation_after_heat_hours":"24-36 hours after onset",
                "postpartum_heat_days":"30-40 days after kidding","cycle_length_days":21,
                "signs":["Tail wagging","Bleating","Swollen vulva","Mounting others"]},
    "sheep":   {"cycle_range":"14-19 days","heat_duration_hours":"24-36 hours",
                "best_ai_window":"12-18 hours after onset","gestation_range":"144-152 days",
                "ovulation_after_heat_hours":"24-30 hours after onset",
                "postpartum_heat_days":"28-35 days after lambing","cycle_length_days":17,
                "signs":["Restlessness","Seeking ram","Swollen vulva","Mucus discharge"]},
    "pig":     {"cycle_range":"18-24 days","heat_duration_hours":"48-72 hours",
                "best_ai_window":"12-24 hours after onset of standing reflex","gestation_range":"112-116 days",
                "ovulation_after_heat_hours":"36-44 hours after onset",
                "postpartum_heat_days":"3-7 days after weaning","cycle_length_days":21,
                "signs":["Standing reflex","Swollen red vulva","Mucus discharge","Ear erection"]},
}


# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status":"ok","version":"4.0.0",
            "validation":"5-rule: blur+species+reproductive+non-animal",
            "species_clf": "loaded" if species_heat_clf else "not trained yet",
            "models":["heat_model","heat_img_model","infection_model"]}

@app.get("/cycle/{species}")
def get_cycle(species: str):
    s = species.lower()
    if s not in CYCLES:
        raise HTTPException(404, f"Species '{s}' not supported")
    return CYCLES[s]


# ── Detailed factor report generator ────────────────────────────────────────
def generate_heat_report(species, is_heat, final_prob, csv_factors=None, img_factors=None, cycle=None):
    """
    Returns a structured factor report with numbered factors, scores, thresholds, and verdicts.
    csv_factors: dict with activity_spike, restlessness, mounting_events, vision_model_score
    img_factors: dict with vulva_redness, moisture_level, vulva_swelling, texture_change
    """
    factors = []
    factor_num = 1

    # CSV-based factors
    if csv_factors:
        thresholds = {
            "activity_spike":     {"low": 0.33, "high": 0.66, "name": "Activity Spike",
                "heat_desc": "Increased movement/restlessness indicates hormonal surge",
                "no_heat_desc": "Normal activity level — no hormonal surge detected"},
            "restlessness":       {"low": 0.33, "high": 0.66, "name": "Restlessness",
                "heat_desc": "Animal is unsettled, pacing — classic heat behaviour",
                "no_heat_desc": "Animal is calm and settled"},
            "mounting_events":    {"low": 0.33, "high": 0.66, "name": "Mounting Events",
                "heat_desc": "Mounting/standing-to-be-mounted observed — strong heat sign",
                "no_heat_desc": "No mounting behaviour observed"},
            "vision_model_score": {"low": 0.33, "high": 0.66, "name": "Visual Observation Score",
                "heat_desc": "Visual signs (swollen vulva, discharge) noted by farmer",
                "no_heat_desc": "No visible physical signs of heat reported"},
        }
        for key, meta in thresholds.items():
            val = csv_factors.get(key, 0)
            if val >= meta["high"]:
                status = "HIGH"; verdict = "Positive indicator"
            elif val >= meta["low"]:
                status = "MODERATE"; verdict = "Weak indicator"
            else:
                status = "LOW"; verdict = "Negative indicator"
            factors.append({
                "factor_number": factor_num,
                "source": "CSV/Observation",
                "name": meta["name"],
                "score": round(val, 3),
                "score_percent": round(val * 100, 1),
                "threshold_low": meta["low"],
                "threshold_high": meta["high"],
                "status": status,
                "verdict": verdict,
                "explanation": meta["heat_desc"] if val >= meta["low"] else meta["no_heat_desc"],
            })
            factor_num += 1

    # Image-based factors
    if img_factors:
        img_thresholds = {
            "vulva_redness":   {"low": 0.25, "high": 0.55, "name": "Vulva Redness",
                "heat_desc": "Redness detected — indicates increased blood flow during oestrus",
                "no_heat_desc": "No significant redness — normal tissue colour"},
            "moisture_level":  {"low": 0.20, "high": 0.50, "name": "Moisture / Discharge",
                "heat_desc": "Moisture/mucus discharge visible — typical oestrus sign",
                "no_heat_desc": "No abnormal moisture or discharge detected"},
            "vulva_swelling":  {"low": 0.30, "high": 0.60, "name": "Vulva Swelling",
                "heat_desc": "Tissue irregularity/swelling detected — oedema from oestrogen",
                "no_heat_desc": "No swelling detected — normal tissue contour"},
            "texture_change":  {"low": 0.20, "high": 0.50, "name": "Texture / Surface Change",
                "heat_desc": "Surface texture change detected — consistent with heat-related tissue changes",
                "no_heat_desc": "Normal surface texture — no heat-related changes"},
        }
        for key, meta in img_thresholds.items():
            val = img_factors.get(key, 0)
            if val >= meta["high"]:
                status = "HIGH"; verdict = "Positive indicator"
            elif val >= meta["low"]:
                status = "MODERATE"; verdict = "Weak indicator"
            else:
                status = "LOW"; verdict = "Negative indicator"
            factors.append({
                "factor_number": factor_num,
                "source": "Photo Analysis",
                "name": meta["name"],
                "score": round(val, 3),
                "score_percent": round(val * 100, 1),
                "threshold_low": meta["low"],
                "threshold_high": meta["high"],
                "status": status,
                "verdict": verdict,
                "explanation": meta["heat_desc"] if val >= meta["low"] else meta["no_heat_desc"],
            })
            factor_num += 1

    # Overall summary
    positive_count  = sum(1 for f in factors if f["status"] == "HIGH")
    moderate_count  = sum(1 for f in factors if f["status"] == "MODERATE")
    negative_count  = sum(1 for f in factors if f["status"] == "LOW")
    total           = len(factors)

    if is_heat:
        if final_prob >= 0.80:
            summary = f"STRONG HEAT SIGNAL: {positive_count}/{total} factors strongly positive. Immediate AI recommended."
        elif final_prob >= 0.65:
            summary = f"MODERATE HEAT SIGNAL: {positive_count} strong + {moderate_count} moderate factors. AI recommended within best window."
        else:
            summary = f"BORDERLINE HEAT: {positive_count} positive factors. Monitor closely and book AI within {cycle.get('best_ai_window','12-18 hours') if cycle else '12-18 hours'}."
    else:
        if final_prob <= 0.20:
            summary = f"CLEARLY NOT IN HEAT: {negative_count}/{total} factors negative. Next heat expected in ~{cycle.get('cycle_length_days',21) if cycle else 21} days."
        elif final_prob <= 0.35:
            summary = f"NOT IN HEAT: Only {positive_count} weak positive factors. Continue monitoring."
        else:
            summary = f"UNLIKELY IN HEAT: Mixed signals ({positive_count} positive, {negative_count} negative). Re-check in 24-48 hours."

    return {
        "factors": factors,
        "total_factors": total,
        "positive_factors": positive_count,
        "moderate_factors": moderate_count,
        "negative_factors": negative_count,
        "summary": summary,
        "final_probability_percent": round(final_prob * 100, 1),
        "verdict": "IN HEAT" if is_heat else "NOT IN HEAT",
    }


@app.post("/predict/heat")
async def predict_heat(
    species:            str   = Form(...),
    activity_spike:     float = Form(...),
    restlessness:       float = Form(...),
    mounting_events:    float = Form(...),
    vision_model_score: float = Form(...),
    age:   float = Form(0), weight: float = Form(0),
    breed: str   = Form(""), gender: str  = Form("female"),
    image: Optional[UploadFile] = File(None),
    stage: str = Form("combined"),  # "csv", "photo", "combined"
):
    species = species.lower()
    img_bytes = img_validation = img_features = img_prob = img_analysis = None

    if image and stage in ("photo", "combined"):
        img_bytes      = await image.read()
        img_validation = validate_image(img_bytes, species)
        if not img_validation["valid"]:
            raise HTTPException(422, detail={
                "error":           img_validation["error"],
                "rule_failed":     img_validation.get("rule_failed"),
                "detected_species":img_validation.get("detected_species"),
                "top_predictions": img_validation.get("top_labels", []),
                "action":          img_validation.get("action", f"Please upload a clear photo of your {species}."),
            })
        img_features = extract_image_features(img_bytes)
        if img_features:
            img_df   = pd.DataFrame([{"species":species,
                "activity_spike":img_features["activity_spike"],
                "restlessness":img_features["restlessness"],
                "mounting_events":img_features["mounting_events"],
                "vision_model_score":img_features["vision_model_score"]}])
            img_prob = float(heat_img_model.predict_proba(img_df)[0][1])
            img_analysis = {k: round(img_features[k], 3)
                            for k in ["vulva_redness","moisture_level","vulva_swelling","texture_change"]}

    csv_factors = {"activity_spike": activity_spike, "restlessness": restlessness,
                   "mounting_events": mounting_events, "vision_model_score": vision_model_score}

    tab_df   = pd.DataFrame([{"species":species,"activity_spike":activity_spike,
                "restlessness":restlessness,"mounting_events":mounting_events,
                "vision_model_score":vision_model_score}])
    tab_prob = float(heat_model.predict_proba(tab_df)[0][1])

    # Stage-based probability calculation
    if stage == "csv":
        final_prob = round(tab_prob, 4)
    elif stage == "photo":
        final_prob = round(img_prob, 4) if img_prob is not None else round(tab_prob, 4)
    else:  # combined
        final_prob = round(tab_prob*0.55 + img_prob*0.45, 4) if img_prob is not None else round(tab_prob, 4)

    is_heat    = final_prob >= 0.5
    confidence = round(final_prob * 100, 1)
    cycle      = CYCLES.get(species, {})

    # Generate detailed factor report
    report_csv_factors  = csv_factors if stage in ("csv", "combined") else None
    report_img_factors  = img_analysis if stage in ("photo", "combined") else None
    detailed_report     = generate_heat_report(species, is_heat, final_prob,
                                               report_csv_factors, report_img_factors, cycle)

    rec = (f"HEAT DETECTED - {species.upper()} | Confidence: {confidence}%\n"
           f"Best AI window: {cycle.get('best_ai_window','N/A')}\n"
           f"Heat duration: {cycle.get('heat_duration_hours','N/A')}\n"
           f"Ovulation: {cycle.get('ovulation_after_heat_hours','N/A')}\n"
           f"Book AI service immediately via Jeeva."
    ) if is_heat else (
           f"NO HEAT DETECTED - {species.upper()} | Confidence: {round((1-final_prob)*100,1)}%\n"
           f"Next expected heat: ~{cycle.get('cycle_length_days',21)} days\n"
           f"Cycle: {cycle.get('cycle_range','N/A')}\n"
           f"Watch for: {', '.join(cycle.get('signs',[])[:3])}")

    return {"result":"positive" if is_heat else "negative","confidence":confidence,
            "final_probability":final_prob,"tabular_probability":round(tab_prob,4),
            "image_probability":round(img_prob,4) if img_prob is not None else None,
            "recommendation":rec,"image_validation":img_validation,
            "image_analysis":img_analysis,
            "detailed_report": detailed_report,
            "stage": stage,
            "weight_validation":validate_weight(species,age,weight) if age and weight else None,
            "cycle_info":cycle,"species":species,"breed":breed,"gender":gender}


def generate_infection_report(species, is_infected, final_prob, csv_factors=None, img_factors=None):
    factors = []
    factor_num = 1

    if csv_factors:
        csv_meta = {
            "abnormal_discharge":       {"name": "Abnormal Discharge",
                "inf_desc": "Unusual discharge colour/consistency — key infection indicator",
                "no_inf_desc": "No abnormal discharge — normal secretion"},
            "purulent_discharge":       {"name": "Purulent (Pus) Discharge",
                "inf_desc": "Pus-like discharge detected — strong bacterial infection sign",
                "no_inf_desc": "No pus discharge observed"},
            "swelling_or_lesion":       {"name": "Swelling / Lesion",
                "inf_desc": "Visible swelling or lesion — tissue inflammation present",
                "no_inf_desc": "No swelling or lesions observed"},
            "fever":                    {"name": "Fever",
                "inf_desc": "Elevated temperature (>39.5°C) — systemic infection response",
                "no_inf_desc": "No fever — normal body temperature"},
            "blood_contamination":      {"name": "Blood Contamination",
                "inf_desc": "Blood in discharge outside calving — abnormal, needs attention",
                "no_inf_desc": "No blood contamination in discharge"},
            "foul_smell":               {"name": "Foul Odour",
                "inf_desc": "Offensive smell from discharge — anaerobic bacterial activity",
                "no_inf_desc": "No foul odour detected"},
            "repeat_ai_failure_history":{"name": "Repeat AI Failure History",
                "inf_desc": "Previous AI failures suggest underlying reproductive infection",
                "no_inf_desc": "No history of repeated AI failure"},
        }
        for key, meta in csv_meta.items():
            val = csv_factors.get(key, 0)
            if val >= 0.66:   status, verdict = "HIGH",     "Strong infection indicator"
            elif val >= 0.33: status, verdict = "MODERATE", "Mild infection indicator"
            else:             status, verdict = "LOW",      "Not an infection indicator"
            factors.append({
                "factor_number": factor_num, "source": "CSV/Observation",
                "name": meta["name"], "score": round(val, 3),
                "score_percent": round(val * 100, 1),
                "status": status, "verdict": verdict,
                "explanation": meta["inf_desc"] if val >= 0.33 else meta["no_inf_desc"],
            })
            factor_num += 1

    if img_factors:
        img_meta = {
            "vulva_redness":  {"name": "Redness / Inflammation",
                "inf_desc": "Redness detected — tissue inflammation consistent with infection",
                "no_inf_desc": "No abnormal redness — normal tissue colour"},
            "moisture_level": {"name": "Moisture / Discharge Visible",
                "inf_desc": "Abnormal moisture/discharge visible in photo",
                "no_inf_desc": "No abnormal discharge visible"},
            "vulva_swelling": {"name": "Visible Swelling",
                "inf_desc": "Swelling detected in photo — oedema from infection",
                "no_inf_desc": "No visible swelling"},
        }
        for key, meta in img_meta.items():
            val = img_factors.get(key, 0)
            if val >= 0.55:   status, verdict = "HIGH",     "Strong infection indicator"
            elif val >= 0.25: status, verdict = "MODERATE", "Mild infection indicator"
            else:             status, verdict = "LOW",      "Not an infection indicator"
            factors.append({
                "factor_number": factor_num, "source": "Photo Analysis",
                "name": meta["name"], "score": round(val, 3),
                "score_percent": round(val * 100, 1),
                "status": status, "verdict": verdict,
                "explanation": meta["inf_desc"] if val >= 0.25 else meta["no_inf_desc"],
            })
            factor_num += 1

    positive_count = sum(1 for f in factors if f["status"] == "HIGH")
    moderate_count = sum(1 for f in factors if f["status"] == "MODERATE")
    negative_count = sum(1 for f in factors if f["status"] == "LOW")
    total = len(factors)

    if is_infected:
        if final_prob >= 0.70:
            summary = f"INFECTION CONFIRMED: {positive_count}/{total} factors strongly positive. Immediate vet attention required."
        else:
            summary = f"INFECTION LIKELY: {positive_count} strong + {moderate_count} moderate factors. Postpone AI and treat."
    else:
        if final_prob <= 0.20:
            summary = f"HEALTHY: {negative_count}/{total} factors negative. Animal is safe for AI."
        else:
            summary = f"BORDERLINE: {positive_count} mild indicators. Monitor for 24-48 hours before AI."

    return {
        "factors": factors, "total_factors": total,
        "positive_factors": positive_count, "moderate_factors": moderate_count,
        "negative_factors": negative_count, "summary": summary,
        "final_probability_percent": round(final_prob * 100, 1),
        "verdict": "INFECTION SUSPECTED" if is_infected else "HEALTHY",
    }


@app.post("/predict/infection")
async def predict_infection(
    species:str=Form(...), abnormal_discharge:float=Form(...),
    purulent_discharge:float=Form(...), swelling_or_lesion:float=Form(...),
    fever:float=Form(...), blood_contamination:float=Form(...),
    foul_smell:float=Form(...), repeat_ai_failure_history:float=Form(...),
    age:float=Form(0), weight:float=Form(0),
    image:Optional[UploadFile]=File(None),
    stage:str=Form("combined"),  # "csv", "photo", "combined"
):
    species = species.lower()
    img_boost = 0.0; img_analysis = None; img_validation = None

    if image and stage in ("photo", "combined"):
        img_bytes      = await image.read()
        img_validation = validate_image(img_bytes, species)
        if not img_validation["valid"]:
            raise HTTPException(422, detail={
                "error":           img_validation["error"],
                "rule_failed":     img_validation.get("rule_failed"),
                "detected_species":img_validation.get("detected_species"),
                "top_predictions": img_validation.get("top_labels", []),
                "action":          img_validation.get("action", f"Please upload a correct photo of your {species}."),
            })
        feats = extract_image_features(img_bytes)
        if feats:
            img_boost    = (feats["vulva_redness"]*0.3 + feats["moisture_level"]*0.2)*0.3
            img_analysis = {k:round(feats[k],3) for k in ["vulva_redness","moisture_level","vulva_swelling"]}

    inf_df = pd.DataFrame([{"species":species,"abnormal_discharge":abnormal_discharge,
        "purulent_discharge":purulent_discharge,"swelling_or_lesion":swelling_or_lesion,
        "fever":fever,"blood_contamination":blood_contamination,
        "foul_smell":foul_smell,"repeat_ai_failure_history":repeat_ai_failure_history}])
    prob       = float(infection_model.predict_proba(inf_df)[0][1])
    final_prob = float(min(prob + (img_boost if stage in ("photo","combined") else 0.0), 1.0))
    is_infected = final_prob >= 0.5
    confidence  = round(final_prob * 100, 1)

    if final_prob >= 0.7:    action,action_label = "vet_review_required","Immediate veterinary attention required"
    elif final_prob >= 0.45: action,action_label = "postpone_and_treat","Postpone AI - treat infection first"
    else:                    action,action_label = "proceed_for_breeding","Animal appears healthy - safe to proceed"

    symptoms = [s for s,v in [("purulent discharge",purulent_discharge),("fever",fever),
        ("swelling/lesion",swelling_or_lesion),("blood contamination",blood_contamination),
        ("foul odour",foul_smell)] if v > 0.5]

    csv_factors = {"abnormal_discharge":abnormal_discharge,"purulent_discharge":purulent_discharge,
        "swelling_or_lesion":swelling_or_lesion,"fever":fever,"blood_contamination":blood_contamination,
        "foul_smell":foul_smell,"repeat_ai_failure_history":repeat_ai_failure_history}

    detailed_report = generate_infection_report(
        species, is_infected, final_prob,
        csv_factors if stage in ("csv","combined") else None,
        img_analysis if stage in ("photo","combined") else None,
    )

    return {"result":"positive" if is_infected else "negative","confidence":confidence,
            "final_probability":round(final_prob,4),"action":action,"action_label":action_label,
            "dominant_symptoms":symptoms,
            "recommendation":(f"{'INFECTION SUSPECTED' if is_infected else 'NO INFECTION'} - "
                f"{species.upper()} | Confidence: {confidence}%\n{action_label}\n"
                +(f"Symptoms: {', '.join(symptoms)}" if symptoms else "No dominant symptoms.")),
            "image_validation":img_validation,"image_analysis":img_analysis,
            "detailed_report": detailed_report, "stage": stage,
            "weight_validation":validate_weight(species,age,weight) if age and weight else None,
            "species":species}


@app.post("/validate-animal")
async def validate_animal(
    species:str=Form(...), breed:str=Form(""), gender:str=Form("female"),
    age:float=Form(0), weight:float=Form(0), image:Optional[UploadFile]=File(None),
):
    result = {"species_entered":species,"weight_validation":validate_weight(species,age,weight),
              "image_validation":None,"overall_valid":True,"warnings":[],
              "cycle_info":CYCLES.get(species.lower())}
    if image:
        val = validate_image(await image.read(), species)
        result["image_validation"] = val
        if not val["valid"]:
            result["overall_valid"] = False
            result["warnings"].append(val["error"])
    if not result["weight_validation"]["valid"]:
        result["overall_valid"] = False
        result["warnings"].append(result["weight_validation"]["message"])
    return result
