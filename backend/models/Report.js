import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reportNumber:   { type: String, unique: true },  // KA-PSMT-2025-XXXXX
  appointment:    { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  animal:         { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true },
  farmer:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  aiCentre:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceType:    String,
  technicianName: String,
  technicianId:   String,
  // Examination findings
  findings:       String,
  diagnosis:      String,
  // Prescription
  prescription: [{
    medicine:   String,
    dose:       String,
    duration:   String,
    instructions: String,
  }],
  // AI service specific
  semenBatchNo:   String,
  bullBreed:      String,
  // Follow-up
  followUpDate:   Date,
  followUpNotes:  String,
  // Govt validation
  issuedAt:       { type: Date, default: Date.now },
  validUntil:     Date,
  govtSeal:       { type: Boolean, default: true },
  // Payment
  serviceCharge:  { type: Number, default: 0 },
  paymentStatus:  { type: String, enum: ['free', 'pending', 'paid'], default: 'free' },
  paymentId:      String,
}, { timestamps: true });

// Auto-generate report number before save
reportSchema.pre('save', async function () {
  if (!this.reportNumber) {
    const count = await mongoose.model('Report').countDocuments();
    const year  = new Date().getFullYear();
    this.reportNumber = `KA-PSMT-${year}-${String(count + 1).padStart(5, '0')}`;
    this.validUntil   = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  }
});

export default mongoose.model('Report', reportSchema);
