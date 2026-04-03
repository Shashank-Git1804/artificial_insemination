import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  aiCentre: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  animal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true },
  prediction: { type: mongoose.Schema.Types.ObjectId, ref: 'Prediction' },
  report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  appointmentDate: { type: Date, required: true },
  serviceType: { type: String, enum: ['artificial_insemination', 'health_checkup', 'vaccination', 'deworming', 'semen_extraction', 'castration', 'gender_checkup'], required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  notes: String,
  technicianName: String,
  outcome: String,
}, { timestamps: true });

export default mongoose.model('Appointment', appointmentSchema);
