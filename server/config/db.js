const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    isConnected = conn.connections[0].readyState === 1;
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Auto-update SystemSettings to ensure manualWithdrawalApproval is true by default
    const SystemSettings = require('../models/SystemSettings');
    const settings = await SystemSettings.findOne();
    if (settings) {
      if (settings.manualWithdrawalApproval === undefined || settings.manualWithdrawalApproval === false) {
        settings.manualWithdrawalApproval = true;
        await settings.save();
        console.log('SystemSettings updated: manualWithdrawalApproval set to true');
      }
    } else {
      await SystemSettings.create({ manualWithdrawalApproval: true });
      console.log('SystemSettings created with manualWithdrawalApproval: true');
    }

    // Auto-backfill compoundingBalance for UserPackage if undefined, and ensure isStaked/stakingDuration are populated
    const UserPackage = require('../models/UserPackage');
    const missingCompoundingPkgs = await UserPackage.find({
      $or: [
        { compoundingBalance: { $exists: false } },
        { isStaked: { $exists: false } },
        { stakingDuration: { $exists: false } }
      ]
    });
    if (missingCompoundingPkgs.length > 0) {
      console.log(`[DB] Found ${missingCompoundingPkgs.length} packages with missing compoundingBalance/isStaked/stakingDuration. Backfilling...`);
      for (let p of missingCompoundingPkgs) {
        if (p.compoundingBalance === undefined) p.compoundingBalance = p.amount;
        if (p.isStaked === undefined) p.isStaked = false;
        if (p.stakingDuration === undefined) p.stakingDuration = 0;
        await p.save();
      }
      console.log('[DB] Compounding balance and staking fields backfill complete.');
    }

    // Auto-backfill and sync availableBalance with total earnings minus approved withdrawals for all users
    const User = require('../models/User');
    const Withdrawal = require('../models/Withdrawal');
    const UserPackage = require('../models/UserPackage');
    const usersToSync = await User.find();
    console.log(`[DB] Syncing availableBalance for ${usersToSync.length} users...`);
    for (let u of usersToSync) {
      // Find all completed/expired staked packages to add back their released principals
      const userPackages = await UserPackage.find({ user: u._id });
      let completedStakedPrincipal = 0;
      for (let p of userPackages) {
        const isStakedPkg = p.isStaked || p.stakingEnabled;
        if (isStakedPkg && (p.status === 'completed' || p.status === 'expired')) {
          completedStakedPrincipal += (p.amount || 0);
        }
      }

      const withdrawals = await Withdrawal.find({ user: u._id, status: { $ne: 'rejected' } });
      const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
      
      const expectedBalance = (u.miningIncome || 0) + (u.referralIncome || 0) + (u.levelIncome || 0) + (u.promotionalIncome || 0) + completedStakedPrincipal - (u.lockedStakingIncome || 0) - totalWithdrawn;
      
      if (Math.abs((u.availableBalance || 0) - expectedBalance) > 0.01) {
        console.log(`[DB] Syncing balance for User ${u.userId}: current=${u.availableBalance}, expected=${expectedBalance}, locked=${u.lockedStakingIncome || 0}`);
        u.availableBalance = expectedBalance;
        await u.save();
      }
    }
    console.log('[DB] User availableBalance sync complete.');
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Do NOT call process.exit(1) — on Vercel serverless it kills the handler
    throw error;
  }
};

module.exports = connectDB;
