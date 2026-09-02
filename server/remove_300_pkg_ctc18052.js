const mongoose = require('mongoose');

const prodURI = 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/CTC';
const round6 = (num) => Math.round(num * 1000000) / 1000000;

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(prodURI);
  console.log('Connected.');

  const User = require('./models/User');
  const UserPackage = require('./models/UserPackage');
  const MiningIncome = require('./models/MiningIncome');
  const LevelIncome = require('./models/LevelIncome');

  const userId = new mongoose.Types.ObjectId('6a2ab498c951ac477b77b7bb'); // CTC18052
  const pkgId = new mongoose.Types.ObjectId('6a59843ca6348e8441ddf46c'); // Active $300 package

  // 1. Get User
  const user = await User.findById(userId);
  if (!user) {
    console.error('User CTC18052 not found!');
    process.exit(1);
  }

  // 2. Get UserPackage
  const pkg = await UserPackage.findById(pkgId);
  if (!pkg) {
    console.error('Package 300 active not found!');
    process.exit(1);
  }

  console.log(`\n--- PROCESSING USER ${user.userId} ---`);
  console.log(`Current totalInvestment: $${user.totalInvestment}`);
  console.log(`Current miningIncome: $${user.miningIncome}`);
  console.log(`Current totalEarning: $${user.totalEarning}`);
  console.log(`Current availableBalance: $${user.availableBalance}`);

  // Calculate ROI sum
  const rois = await MiningIncome.find({ userPackageId: pkgId });
  const totalRoi = rois.reduce((s, r) => s + r.amount, 0);
  console.log(`Total ROIs to delete: ${rois.length} docs, sum: $${totalRoi}`);

  // Subtract package amount and ROI from user
  user.totalInvestment = Math.max(0, round6(user.totalInvestment - pkg.amount));
  user.miningIncome = Math.max(0, round6(user.miningIncome - totalRoi));
  user.totalEarning = Math.max(0, round6(user.totalEarning - totalRoi));
  user.availableBalance = Math.max(0, round6(user.availableBalance - totalRoi));

  // Determine if user remains active
  const activePkgsCount = await UserPackage.countDocuments({ user: userId, status: 'active', _id: { $ne: pkgId } });
  user.isActive = activePkgsCount > 0;
  console.log(`Setting isActive to: ${user.isActive} (remaining active packages: ${activePkgsCount})`);

  await user.save();
  console.log('User CTC18052 updated successfully.');

  // 3. Delete Package
  await UserPackage.deleteOne({ _id: pkgId });
  console.log('Deleted UserPackage document.');

  // 4. Delete MiningIncome (ROI)
  const delRois = await MiningIncome.deleteMany({ userPackageId: pkgId });
  console.log(`Deleted ${delRois.deletedCount} MiningIncome documents.`);

  // 5. Processing Uplines Level Incomes
  const levels = await LevelIncome.find({ fromUser: userId, createdAt: { $gte: new Date('2026-07-17T00:00:00.000Z') } });
  console.log(`Found ${levels.length} LevelIncome documents to adjust.`);

  const uplinesStats = {};

  for (const l of levels) {
    const uplineId = l.user.toString();
    if (!uplinesStats[uplineId]) {
      const u = await User.findById(l.user);
      uplinesStats[uplineId] = {
        doc: u,
        availableBalanceDeduct: 0,
        lockedStakingIncomeDeduct: 0,
        levelIncomeDeduct: 0,
        totalEarningDeduct: 0
      };
    }

    const activeStakedPkg = await UserPackage.findOne({
      user: l.user,
      status: 'active',
      $or: [
        { isStaked: true },
        { stakingEnabled: true }
      ],
      createdAt: { $lte: l.createdAt },
      stakingEndDate: { $gt: l.createdAt }
    });

    const amount = l.amount;
    uplinesStats[uplineId].levelIncomeDeduct += amount;
    uplinesStats[uplineId].totalEarningDeduct += amount;

    if (activeStakedPkg) {
      uplinesStats[uplineId].lockedStakingIncomeDeduct += amount;
    } else {
      uplinesStats[uplineId].availableBalanceDeduct += amount;
    }
  }

  // Apply uplines adjustments
  for (const id in uplinesStats) {
    const stat = uplinesStats[id];
    const u = stat.doc;
    if (u) {
      console.log(`\nAdjusting Upline: ${u.userId} (${u.fullName})`);
      console.log(`  Current levelIncome: $${u.levelIncome} -> Deducting $${stat.levelIncomeDeduct}`);
      console.log(`  Current totalEarning: $${u.totalEarning} -> Deducting $${stat.totalEarningDeduct}`);
      if (stat.lockedStakingIncomeDeduct > 0) {
        console.log(`  Current lockedStakingIncome: $${u.lockedStakingIncome} -> Deducting $${stat.lockedStakingIncomeDeduct}`);
        u.lockedStakingIncome = Math.max(0, round6(u.lockedStakingIncome - stat.lockedStakingIncomeDeduct));
      }
      if (stat.availableBalanceDeduct > 0) {
        console.log(`  Current availableBalance: $${u.availableBalance} -> Deducting $${stat.availableBalanceDeduct}`);
        u.availableBalance = Math.max(0, round6(u.availableBalance - stat.availableBalanceDeduct));
      }

      u.levelIncome = Math.max(0, round6(u.levelIncome - stat.levelIncomeDeduct));
      u.totalEarning = Math.max(0, round6(u.totalEarning - stat.totalEarningDeduct));

      await u.save();
      console.log(`  Upline ${u.userId} updated.`);
    }
  }

  // Delete LevelIncome docs
  const delLevels = await LevelIncome.deleteMany({ fromUser: userId, createdAt: { $gte: new Date('2026-07-17T00:00:00.000Z') } });
  console.log(`\nDeleted ${delLevels.deletedCount} LevelIncome documents.`);

  console.log('\nMigration run completed successfully.');
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
