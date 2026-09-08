const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  minAmount: { type: Number, required: true },
  maxAmount: { type: Number, required: true },
  dailyProfit: { type: Number, default: 0 }, // percentage (0 for live_trading)
  validity: { type: Number, default: 36500 }, // days
  packageType: { type: String, enum: ['standard', 'live_trading'], default: 'standard' },
  roiFrequency: { type: String, enum: ['daily', 'monthly'], default: 'daily' },
  monthlyRoiMin: { type: Number, default: 10 },
  monthlyRoiMax: { type: Number, default: 15 },
  isReferralOnly: { type: Boolean, default: false },
  isZeroPin: { type: Boolean, default: false },
  status: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Package', packageSchema);
