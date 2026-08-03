const mongoose = require('mongoose');

const levelIncomeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fromUserId: { type: String },
  level: { type: Number, required: true },
  percentage: { type: Number, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: 'credited' }
}, { timestamps: true });

levelIncomeSchema.index({ user: 1 });
levelIncomeSchema.index({ fromUser: 1 });

module.exports = mongoose.model('LevelIncome', levelIncomeSchema);
