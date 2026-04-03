import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['farmer', 'ai_centre'], required: true },
  phone: { type: String, required: true, unique: true },
  // Farmer specific
  village: String,
  taluk: String,
  district: String,
  aadhaarNumber: String,
  // AI Centre specific
  centreName: String,
  centreCode: String,
  licenseNumber: String,
  serviceArea: [String],
  isApproved: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
