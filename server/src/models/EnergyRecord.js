import mongoose from 'mongoose';

const energyRecordSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    timestamp: { type: Date, required: true, index: true },
    usageKWh: { type: Number, required: true, min: 0 },
    note: { type: String },
  },
  { timestamps: true }
);

energyRecordSchema.index({ userId: 1, timestamp: -1 });

export const EnergyRecord = mongoose.model('EnergyRecord', energyRecordSchema);
