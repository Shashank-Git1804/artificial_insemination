import express from 'express';
import Report from '../models/Report.js';
import Appointment from '../models/Appointment.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ── POST — AI Centre generates report ────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    if (req.user.role !== 'ai_centre')
      return res.status(403).json({ message: 'Only AI Centre users can generate reports.' });

    const {
      appointmentId, findings, diagnosis,
      technicianName, technicianId, semenBatchNo, bullBreed,
      followUpDate, followUpNotes, serviceCharge,
    } = req.body;

    // Parse prescription — frontend may send it as JSON string or array
    let prescription = req.body.prescription || [];
    if (typeof prescription === 'string') {
      try { prescription = JSON.parse(prescription); } catch { prescription = []; }
    }
    if (!Array.isArray(prescription)) prescription = [];
    prescription = prescription.filter(p => p && p.medicine);

    if (!appointmentId)  return res.status(400).json({ message: 'appointmentId is required.' });
    if (!technicianName) return res.status(400).json({ message: 'Technician name is required.' });
    if (!technicianId)   return res.status(400).json({ message: 'Technician ID is required.' });
    if (!findings)       return res.status(400).json({ message: 'Examination findings are required.' });

    const appt = await Appointment.findById(appointmentId).populate('animal').populate('farmer');
    if (!appt)        return res.status(404).json({ message: 'Appointment not found.' });
    if (!appt.animal) return res.status(400).json({ message: 'Appointment has no linked animal.' });
    if (!appt.farmer) return res.status(400).json({ message: 'Appointment has no linked farmer.' });

    const report = await Report.create({
      appointment:    appointmentId,
      animal:         appt.animal._id,
      farmer:         appt.farmer._id,
      aiCentre:       req.user._id,
      serviceType:    appt.serviceType,
      technicianName,
      technicianId,
      findings,
      diagnosis:      diagnosis || '',
      prescription,
      semenBatchNo:   semenBatchNo || '',
      bullBreed:      bullBreed || '',
      followUpDate:   followUpDate || null,
      followUpNotes:  followUpNotes || '',
      serviceCharge:  Number(serviceCharge) || 0,
      paymentStatus:  Number(serviceCharge) > 0 ? 'pending' : 'free',
    });

    await Appointment.findByIdAndUpdate(appointmentId, { report: report._id })
      .catch(e => console.warn('Could not link report to appointment:', e.message));

    const populated = await Report.findById(report._id)
      .populate('animal',      'tagId name species breed age weight')
      .populate('farmer',      'name phone village district aadhaarNumber')
      .populate('aiCentre',    'centreName centreCode licenseNumber phone')
      .populate('appointment', 'serviceType appointmentDate');

    return res.status(201).json(populated);
  } catch (err) {
    console.error('Report creation error:', err.message, err.errors);
    const msg = err.errors
      ? Object.values(err.errors).map(e => e.message).join(', ')
      : err.message;
    return res.status(400).json({ message: msg });
  }
});

// ── GET all reports ───────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'farmer'
      ? { farmer: req.user._id }
      : { aiCentre: req.user._id };

    const reports = await Report.find(filter)
      .populate('animal',      'tagId name species breed')
      .populate('farmer',      'name phone village district')
      .populate('aiCentre',    'centreName centreCode')
      .populate('appointment', 'serviceType appointmentDate')
      .sort({ createdAt: -1 });

    return res.json(reports);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ── GET single report ─────────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('animal',      'tagId name species breed age weight gender')
      .populate('farmer',      'name phone village taluk district aadhaarNumber')
      .populate('aiCentre',    'centreName centreCode licenseNumber phone')
      .populate('appointment', 'serviceType appointmentDate notes');
    if (!report) return res.status(404).json({ message: 'Report not found' });
    return res.json(report);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ── GET report by appointment ID ──────────────────────────────────────────────
router.get('/appointment/:appointmentId', protect, async (req, res) => {
  try {
    const report = await Report.findOne({ appointment: req.params.appointmentId })
      .populate('animal',      'tagId name species breed age weight gender')
      .populate('farmer',      'name phone village taluk district aadhaarNumber')
      .populate('aiCentre',    'centreName centreCode licenseNumber phone')
      .populate('appointment', 'serviceType appointmentDate notes');
    if (!report) return res.status(404).json({ message: 'No report for this appointment' });
    return res.json(report);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
