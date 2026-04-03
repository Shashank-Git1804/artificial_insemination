import express from 'express';
import Appointment from '../models/Appointment.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

router.post('/', restrictTo('farmer'), async (req, res) => {
  try {
    const appointment = await Appointment.create({ ...req.body, farmer: req.user._id });
    res.status(201).json(appointment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  const filter = req.user.role === 'farmer'
    ? { farmer: req.user._id }
    : {};  // AI centre sees ALL appointments
  const appointments = await Appointment.find(filter)
    .populate('animal', 'tagId name species breed')
    .populate('farmer', 'name phone village district')
    .populate('aiCentre', 'centreName centreCode')
    .populate('prediction', 'type result confidence')
    .sort({ appointmentDate: -1 });
  res.json(appointments);
});

router.put('/:id/status', restrictTo('ai_centre'), async (req, res) => {
  const { status, technicianName, outcome, notes } = req.body;
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status, technicianName, outcome, notes },
    { returnDocument: 'after' }
  );
  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
  res.json(appointment);
});

router.delete('/:id', restrictTo('farmer'), async (req, res) => {
  await Appointment.findOneAndDelete({ _id: req.params.id, farmer: req.user._id });
  res.json({ message: 'Appointment cancelled' });
});

export default router;
