import mongoose from 'mongoose';

const animalSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tagId: { type: String, required: true, unique: true },
  name: String,
  species: { type: String, enum: ['cow', 'buffalo', 'goat', 'sheep', 'pig'], required: true },
  breed: String,
  age: Number,
  weight: Number,
  gender: { type: String, enum: ['female', 'male'], default: 'female' },
  lastCalvingDate: Date,
  lastHeatDate: Date,
  lastAIDate: Date,
  pregnancyStatus: { type: String, enum: ['open', 'pregnant', 'unknown'], default: 'unknown' },
  healthStatus: { type: String, enum: ['healthy', 'sick', 'under_treatment'], default: 'healthy' },
  imageUrl:  String,   // kept for backward compat
  imageData: String,   // base64 data URI stored in DB
  notes: String,
}, { timestamps: true });

export default mongoose.model('Animal', animalSchema);
