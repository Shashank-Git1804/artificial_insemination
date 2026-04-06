import express from 'express';
import multer from 'multer';
import fs from 'fs';
import Animal from '../models/Animal.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, true),
});

function toBase64(file) {
  const buf = fs.readFileSync(file.path);
  const mime = file.mimetype || 'image/jpeg';
  fs.unlink(file.path, () => {});
  return `data:${mime};base64,${buf.toString('base64')}`;
}

router.use(protect);

router.get('/', async (req, res) => {
  const filter = req.user.role === 'farmer' ? { farmer: req.user._id } : {};
  const animals = await Animal.find(filter).populate('farmer', 'name village district');
  res.json(animals);
});

router.post('/', restrictTo('farmer'), upload.single('image'), async (req, res) => {
  try {
    const data = { ...req.body, farmer: req.user._id };
    if (req.file) data.imageData = toBase64(req.file);
    const animal = await Animal.create(data);
    res.status(201).json(animal);
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(400).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  const animal = await Animal.findById(req.params.id).populate('farmer', 'name phone village district');
  if (!animal) return res.status(404).json({ message: 'Animal not found' });
  res.json(animal);
});

router.put('/:id', restrictTo('farmer'), upload.single('image'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) data.imageData = toBase64(req.file);
    const animal = await Animal.findOneAndUpdate(
      { _id: req.params.id, farmer: req.user._id },
      data, { returnDocument: 'after' }
    );
    if (!animal) return res.status(404).json({ message: 'Animal not found' });
    res.json(animal);
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', restrictTo('farmer'), async (req, res) => {
  await Animal.findOneAndDelete({ _id: req.params.id, farmer: req.user._id });
  res.json({ message: 'Animal removed' });
});

export default router;
