import express from 'express';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch';
import fs from 'fs';
import Prediction from '../models/Prediction.js';
import Animal from '../models/Animal.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { predictHeat, predictInfection } from '../utils/aiEngine.js';

const router = express.Router();
const AI_SERVICE = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const upload = multer({ dest: 'uploads/', limits: { fileSize: 15 * 1024 * 1024 } });

// Handle multer errors (file too large etc.)
function uploadSingle(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE')
        return res.status(413).json({ message: 'Photo too large. Maximum size is 15MB. Please compress or retake the photo.' });
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}

router.use(protect);

// ── Check if Python AI service is running ────────────────────────────────────
async function isAIServiceUp() {
  try {
    const r = await fetch(`${AI_SERVICE}/health`, { signal: AbortSignal.timeout(10000) });
    return r.ok;
  } catch {
    return false;
  }
}

// ── Forward multipart form to Python AI service ──────────────────────────────
async function callAI(endpoint, fields, fileBuffer) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, String(v));
  if (fileBuffer) fd.append('image', fileBuffer, { filename: 'photo.jpg', contentType: 'image/jpeg' });

  const res = await fetch(`${AI_SERVICE}${endpoint}`, {
    method: 'POST', body: fd,
    signal: AbortSignal.timeout(30000)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'AI service error' }));
    const detail = err.detail || err;
    const message = typeof detail === 'object' ? (detail.error || JSON.stringify(detail)) : String(detail);
    const e = new Error(message);
    e.statusCode = res.status;
    e.detail = detail;
    throw e;
  }
  return res.json();
}

// ── GET cycle info ────────────────────────────────────────────────────────────
router.get('/cycle/:species', async (req, res) => {
  try {
    const r = await fetch(`${AI_SERVICE}/cycle/${req.params.species}`,
      { signal: AbortSignal.timeout(3000) });
    if (!r.ok) return res.status(404).json({ message: 'Species not found' });
    res.json(await r.json());
  } catch {
    res.status(503).json({ message: 'AI service unavailable' });
  }
});

// ── POST heat prediction ──────────────────────────────────────────────────────
router.post('/heat', restrictTo('farmer'), uploadSingle, async (req, res) => {
  try {
    const { animalId, activitySpike, restlessness, mountingEvents, visionModelScore } = req.body;
    const animal = await Animal.findById(animalId);
    if (!animal) return res.status(404).json({ message: 'Animal not found' });

    const fileBuffer = req.file ? fs.readFileSync(req.file.path) : null;
    const aiUp = await isAIServiceUp();

    let aiResult;
    if (aiUp) {
      // Use Python AI service (with image validation)
      aiResult = await callAI('/predict/heat', {
        species:            animal.species,
        activity_spike:     activitySpike,
        restlessness:       restlessness,
        mounting_events:    mountingEvents,
        vision_model_score: visionModelScore,
        age:                animal.age || 0,
        weight:             animal.weight || 0,
        breed:              animal.breed || '',
        gender:             animal.gender || 'female',
        stage:              req.body.stage || 'combined',
      }, fileBuffer);
    } else {
      // Fallback to JS engine (no image validation when AI service is down)
      aiResult = predictHeat(animal.species, {
        activitySpike:    parseFloat(activitySpike),
        restlessness:     parseFloat(restlessness),
        mountingEvents:   parseFloat(mountingEvents),
        visionModelScore: parseFloat(visionModelScore),
      });
    }

    const imageData = fileBuffer
      ? `data:image/jpeg;base64,${fileBuffer.toString('base64')}`
      : undefined;

    const prediction = await Prediction.create({
      animal:           animalId,
      farmer:           req.user._id,
      type:             'heat',
      activitySpike:    parseFloat(activitySpike),
      restlessness:     parseFloat(restlessness),
      mountingEvents:   parseFloat(mountingEvents),
      visionModelScore: parseFloat(visionModelScore),
      result:           aiResult.result,
      confidence:       aiResult.confidence,
      recommendation:   aiResult.recommendation,
      imageData,
    });

    if (aiResult.result === 'positive') {
      await Animal.findByIdAndUpdate(animalId, { lastHeatDate: new Date() }, { returnDocument: 'after' });
    }

    // Clean up uploaded file
    if (req.file) fs.unlink(req.file.path, () => {});

    res.status(201).json({ ...prediction.toObject(), aiDetail: aiResult });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    const status = err.statusCode === 422 ? 422 : 500;
    res.status(status).json({ message: err.message, detail: err.detail || null });
  }
});

// ── POST infection prediction ─────────────────────────────────────────────────
router.post('/infection', restrictTo('farmer'), uploadSingle, async (req, res) => {
  try {
    const { animalId, abnormalDischarge, purulentDischarge, swellingOrLesion,
      fever, bloodContamination, foulSmell, repeatAiFailureHistory } = req.body;

    const animal = await Animal.findById(animalId);
    if (!animal) return res.status(404).json({ message: 'Animal not found' });

    const fileBuffer = req.file ? fs.readFileSync(req.file.path) : null;
    const aiUp = await isAIServiceUp();

    let aiResult;
    if (aiUp) {
      aiResult = await callAI('/predict/infection', {
        species:                   animal.species,
        abnormal_discharge:        abnormalDischarge,
        purulent_discharge:        purulentDischarge,
        swelling_or_lesion:        swellingOrLesion,
        fever,
        blood_contamination:       bloodContamination,
        foul_smell:                foulSmell,
        repeat_ai_failure_history: repeatAiFailureHistory,
        age:                       animal.age || 0,
        weight:                    animal.weight || 0,
        stage:                     req.body.stage || 'combined',
      }, fileBuffer);
    } else {
      aiResult = predictInfection(animal.species, {
        abnormalDischarge:      parseFloat(abnormalDischarge),
        purulentDischarge:      parseFloat(purulentDischarge),
        swellingOrLesion:       parseFloat(swellingOrLesion),
        fever:                  parseFloat(fever),
        bloodContamination:     parseFloat(bloodContamination),
        foulSmell:              parseFloat(foulSmell),
        repeatAiFailureHistory: parseFloat(repeatAiFailureHistory),
      });
    }

    const imageData = fileBuffer
      ? `data:image/jpeg;base64,${fileBuffer.toString('base64')}`
      : undefined;

    const prediction = await Prediction.create({
      animal:                 animalId,
      farmer:                 req.user._id,
      type:                   'infection',
      abnormalDischarge:      parseFloat(abnormalDischarge),
      purulentDischarge:      parseFloat(purulentDischarge),
      swellingOrLesion:       parseFloat(swellingOrLesion),
      fever:                  parseFloat(fever),
      bloodContamination:     parseFloat(bloodContamination),
      foulSmell:              parseFloat(foulSmell),
      repeatAiFailureHistory: parseFloat(repeatAiFailureHistory),
      result:                 aiResult.result,
      confidence:             aiResult.confidence,
      recommendation:         aiResult.recommendation,
      imageData,
    });

    if (aiResult.result === 'positive') {
      await Animal.findByIdAndUpdate(animalId, { healthStatus: 'sick' }, { returnDocument: 'after' });
    }

    if (req.file) fs.unlink(req.file.path, () => {});

    res.status(201).json({ ...prediction.toObject(), aiDetail: aiResult });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    const status = err.statusCode === 422 ? 422 : 500;
    res.status(status).json({ message: err.message, detail: err.detail || null });
  }
});

// ── GET all predictions — paginated, filterable ──────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { result, type, limit = 20, skip = 0 } = req.query;
    const filter = req.user.role === 'farmer' ? { farmer: req.user._id } : {};
    if (result) filter.result = result;
    if (type)   filter.type   = type;

    const [predictions, total] = await Promise.all([
      Prediction.find(filter)
        .populate('animal', 'tagId name species breed')
        .populate('farmer', 'name phone village district')
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Math.min(Number(limit), 50))
        .lean(),
      Prediction.countDocuments(filter),
    ]);
    res.json({ predictions, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/animal/:animalId', async (req, res) => {
  try {
    const predictions = await Prediction.find({ animal: req.params.animalId })
      .sort({ createdAt: -1 }).limit(20).lean();
    res.json(predictions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
