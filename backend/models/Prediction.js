import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema({
  animal:  { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true },
  farmer:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  type:    { type: String, enum: ['heat', 'infection'], required: true },
  result:  { type: String, enum: ['positive', 'negative'], required: true },
  confidence:     Number,
  recommendation: String,
  imageUrl:       String,   // kept for backward compat
  imageData:      String,   // base64 data URI stored in DB
  stage:          { type: String, enum: ['csv', 'photo', 'combined'], default: 'combined' },
  // Heat inputs
  activitySpike: Number, restlessness: Number,
  mountingEvents: Number, visionModelScore: Number,
  // Infection inputs
  abnormalDischarge: Number, purulentDischarge: Number,
  swellingOrLesion: Number, fever: Number,
  bloodContamination: Number, foulSmell: Number,
  repeatAiFailureHistory: Number,
  // TTL field — negative predictions auto-deleted after 90 days
  expiresAt: { type: Date },
}, { timestamps: true });

// ── Indexes for fast queries ──────────────────────────────────────────────────
predictionSchema.index({ farmer: 1, createdAt: -1 });
predictionSchema.index({ animal: 1, createdAt: -1 });
predictionSchema.index({ result: 1, type: 1, createdAt: -1 });
predictionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// ── Auto-set TTL: negatives expire in 90 days, positives kept forever ─────────
predictionSchema.pre('save', function () {
  if (this.result === 'negative' && !this.expiresAt)
    this.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
});

export default mongoose.model('Prediction', predictionSchema);
