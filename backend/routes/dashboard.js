import express from 'express';
import Animal from '../models/Animal.js';
import Prediction from '../models/Prediction.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

const yearAgo = () => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d; };

router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'farmer') {
      const fid = req.user._id;
      const [totalAnimals, heatPositive, infections, pendingAppointments] = await Promise.all([
        Animal.countDocuments({ farmer: fid }),
        Prediction.countDocuments({ farmer: fid, type: 'heat', result: 'positive' }),
        Prediction.countDocuments({ farmer: fid, type: 'infection', result: 'positive' }),
        Appointment.countDocuments({ farmer: fid, status: { $in: ['pending', 'confirmed'] } }),
      ]);
      const [recentPredictions, animalsBySpecies, animalsByGender, appointmentsByService, predictionsByMonth] = await Promise.all([
        Prediction.find({ farmer: fid }).populate('animal', 'tagId name species').sort({ createdAt: -1 }).limit(5),
        Animal.aggregate([{ $match: { farmer: fid } }, { $group: { _id: '$species', count: { $sum: 1 } } }]),
        Animal.aggregate([{ $match: { farmer: fid } }, { $group: { _id: '$gender', count: { $sum: 1 } } }]),
        Appointment.aggregate([{ $match: { farmer: fid } }, { $group: { _id: '$serviceType', count: { $sum: 1 } } }]),
        Prediction.aggregate([
          { $match: { farmer: fid, createdAt: { $gte: yearAgo() } } },
          { $group: { _id: { m: { $month: '$createdAt' }, y: { $year: '$createdAt' }, type: '$type', result: '$result' }, count: { $sum: 1 } } },
          { $sort: { '_id.y': 1, '_id.m': 1 } }
        ]),
      ]);
      res.json({ totalAnimals, heatPositive, infections, pendingAppointments, recentPredictions, animalsBySpecies, animalsByGender, appointmentsByService, predictionsByMonth });
    } else {
      const [totalFarmers, pendingAppointments, completedAppointments, totalAnimals] = await Promise.all([
        User.countDocuments({ role: 'farmer' }),
        Appointment.countDocuments({ status: 'pending' }),
        Appointment.countDocuments({ status: 'completed' }),
        Animal.countDocuments(),
      ]);
      const [recentAppointments, heatAlerts, animalsBySpecies, animalsByGender,
        farmersByDistrict, farmersRegisteredMonthly, appointmentsByService,
        appointmentsByMonth, heatBySpecies, animalsByBreed] = await Promise.all([
        Appointment.find().populate('farmer', 'name village district').populate('animal', 'tagId name species').sort({ createdAt: -1 }).limit(5),
        Prediction.find({ type: 'heat', result: 'positive' }).populate('animal', 'tagId name species').populate('farmer', 'name phone village').sort({ createdAt: -1 }).limit(10),
        Animal.aggregate([{ $group: { _id: '$species', count: { $sum: 1 } } }]),
        Animal.aggregate([{ $group: { _id: '$gender', count: { $sum: 1 } } }]),
        User.aggregate([{ $match: { role: 'farmer' } }, { $group: { _id: '$district', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
        User.aggregate([
          { $match: { role: 'farmer', createdAt: { $gte: yearAgo() } } },
          { $group: { _id: { m: { $month: '$createdAt' }, y: { $year: '$createdAt' } }, count: { $sum: 1 } } },
          { $sort: { '_id.y': 1, '_id.m': 1 } }
        ]),
        Appointment.aggregate([{ $group: { _id: '$serviceType', count: { $sum: 1 } } }]),
        Appointment.aggregate([
          { $match: { createdAt: { $gte: yearAgo() } } },
          { $group: { _id: { m: { $month: '$createdAt' }, y: { $year: '$createdAt' }, status: '$status' }, count: { $sum: 1 } } },
          { $sort: { '_id.y': 1, '_id.m': 1 } }
        ]),
        Prediction.aggregate([
          { $match: { type: 'heat', result: 'positive' } },
          { $lookup: { from: 'animals', localField: 'animal', foreignField: '_id', as: 'a' } },
          { $unwind: '$a' },
          { $group: { _id: '$a.species', count: { $sum: 1 } } }
        ]),
        Animal.aggregate([
          { $group: { _id: { species: '$species', breed: '$breed' }, count: { $sum: 1 } } },
          { $sort: { count: -1 } }, { $limit: 12 }
        ]),
      ]);
      res.json({ totalFarmers, pendingAppointments, completedAppointments, totalAnimals, recentAppointments, heatAlerts, animalsBySpecies, animalsByGender, farmersByDistrict, farmersRegisteredMonthly, appointmentsByService, appointmentsByMonth, heatBySpecies, animalsByBreed });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
