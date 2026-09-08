const mongoose = require('mongoose');

const monthlyRoiDistributionSchema = new mongoose.Schema({
  monthYear: { type: String, required: true }, // e.g., '2026-09'
  tier1RoiPercent: { type: Number, required: true }, // e.g., 12.5
  tier2RoiPercent: { type: Number, required: true }, // e.g., 14.0
  totalPackagesProcessed: { type: Number, default: 0 },
  totalCapitalUSD: { type: Number, default: 0 },
  totalInvestorPayoutUSD: { type: Number, default: 0 },
  totalInvestorPayoutINR: { type: Number, default: 0 },
  totalLevelPayoutUSD: { type: Number, default: 0 },
  totalLevelPayoutINR: { type: Number, default: 0 },
  executedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  executedByName: { type: String, default: 'Admin' },
  status: { type: String, enum: ['success', 'failed', 'partial'], default: 'success' },
  payoutDetails: [{
    userPackageId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPackage' },
    userId: { type: String },
    packageTier: { type: String },
    amount: { type: Number },
    roiPercent: { type: Number },
    grossRoiUSD: { type: Number },
    investorPayoutUSD: { type: Number },
    investorPayoutINR: { type: Number },
    levelBaseAmountUSD: { type: Number },
    paymentMethod: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  notes: { type: String }
}, { timestamps: true });

monthlyRoiDistributionSchema.index({ monthYear: 1 });

module.exports = mongoose.model('MonthlyRoiDistribution', monthlyRoiDistributionSchema);
