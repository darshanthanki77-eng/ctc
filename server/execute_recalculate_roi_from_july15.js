require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/CTC';
const round6 = (num) => Math.round(num * 1000000) / 1000000;

async function executeRecalculation() {
  console.log('[MIGRATION] Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log(`[MIGRATION] Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);

  const User = require('./models/User');
  const UserPackage = require('./models/UserPackage');
  const MiningIncome = require('./models/MiningIncome');
  const LevelIncome = require('./models/LevelIncome');
  const Package = require('./models/Package');
  const Withdrawal = require('./models/Withdrawal');

  const july15 = new Date('2026-07-15T00:00:00.000Z');

  // 1. Update all Package templates in Package collection to dailyProfit: 0.5
  const pkgRes = await Package.updateMany({}, { $set: { dailyProfit: 0.5 } });
  console.log(`[MIGRATION] Updated ${pkgRes.modifiedCount} Package definitions to dailyProfit = 0.5%`);

  // 2. Process all UserPackages and their MiningIncome and LevelIncome records
  const allUserPackages = await UserPackage.find().sort({ createdAt: 1 });
  console.log(`[MIGRATION] Processing ${allUserPackages.length} UserPackage documents...`);

  let totalMiningUpdated = 0;
  let totalLevelUpdated = 0;

  for (const pkg of allUserPackages) {
    const isStaked = pkg.isStaked || pkg.stakingEnabled;

    // Set package dailyProfitPercent to 0.5
    pkg.dailyProfitPercent = 0.5;

    // Fetch all MiningIncome docs for this package
    const allMining = await MiningIncome.find({ userPackageId: pkg._id }).sort({ createdAt: 1 });
    const miningBeforeJuly15 = allMining.filter(m => m.createdAt < july15);
    const miningAfterJuly15 = allMining.filter(m => m.createdAt >= july15);

    let currentCompBalance = pkg.amount + miningBeforeJuly15.reduce((s, m) => s + m.amount, 0);

    for (const m of miningAfterJuly15) {
      const baseAmount = isStaked ? currentCompBalance : pkg.amount;
      const wasFastrack = m.percentage >= 1.5 || (m.percentage === 1.0 && m.amount > baseAmount * 0.0035);
      const dailyPercent = wasFastrack ? 1.0 : 0.5;
      const cyclePercent = dailyPercent / 2; // 0.25% per cycle, 0.5% if fastrack

      const newMiningAmount = round6((baseAmount * cyclePercent) / 100);

      // Update MiningIncome doc
      await MiningIncome.updateOne(
        { _id: m._id },
        { 
          $set: { 
            amount: newMiningAmount, 
            percentage: dailyPercent 
          } 
        }
      );
      totalMiningUpdated++;

      if (isStaked) {
        currentCompBalance = round6(currentCompBalance + newMiningAmount);
      }

      // Update corresponding LevelIncome documents generated from this downline at this cycle
      const mTime = new Date(m.createdAt);
      const windowStart = new Date(mTime.getTime() - 60000);
      const windowEnd = new Date(mTime.getTime() + 60000);

      const relatedLevels = await LevelIncome.find({
        fromUser: m.user,
        createdAt: { $gte: windowStart, $lte: windowEnd }
      });

      for (const lvl of relatedLevels) {
        const newLvlAmount = round6((newMiningAmount * lvl.percentage) / 100);
        await LevelIncome.updateOne(
          { _id: lvl._id },
          { $set: { amount: newLvlAmount } }
        );
        totalLevelUpdated++;
      }
    }

    // Recalculate package totalEarned
    const allRecalculatedMining = await MiningIncome.find({ userPackageId: pkg._id });
    pkg.totalEarned = round6(allRecalculatedMining.reduce((s, m) => s + m.amount, 0));

    if (isStaked) {
      pkg.compoundingBalance = round6(currentCompBalance);
    }

    await pkg.save();
  }

  console.log(`[MIGRATION] Recalculated ${totalMiningUpdated} MiningIncome documents.`);
  console.log(`[MIGRATION] Recalculated ${totalLevelUpdated} LevelIncome documents.`);

  // 3. Resync all Users balances and totals
  const allUsers = await User.find();
  console.log(`[MIGRATION] Resyncing ${allUsers.length} user balances...`);

  let usersUpdated = 0;

  for (const u of allUsers) {
    const userMiningIncomes = await MiningIncome.find({ user: u._id });
    const userLevelIncomes = await LevelIncome.find({ user: u._id });

    const newMiningIncome = round6(userMiningIncomes.reduce((s, m) => s + m.amount, 0));
    const newLevelIncome = round6(userLevelIncomes.reduce((s, l) => s + l.amount, 0));

    const userPackages = await UserPackage.find({ user: u._id });
    let completedStakedPrincipal = 0;
    let activeStakedROI = 0;

    for (const p of userPackages) {
      const isStakedPkg = p.isStaked || p.stakingEnabled;
      if (isStakedPkg) {
        if (p.status === 'completed' || p.status === 'expired') {
          completedStakedPrincipal += (p.amount || 0);
        } else if (p.status === 'active') {
          activeStakedROI += Math.max(0, (p.compoundingBalance || 0) - (p.amount || 0));
        }
      }
    }

    const withdrawals = await Withdrawal.find({ user: u._id, status: { $ne: 'rejected' } });
    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);

    const refIncome = u.referralIncome || 0;
    const promoIncome = u.promotionalIncome || 0;
    const lockedStaking = u.lockedStakingIncome || 0;

    const newTotalEarning = round6(newMiningIncome + newLevelIncome + refIncome + promoIncome);
    const expectedBalance = round6(newMiningIncome + refIncome + newLevelIncome + promoIncome + completedStakedPrincipal - activeStakedROI - lockedStaking - totalWithdrawn);
    const newAvailableBalance = Math.max(0, expectedBalance);

    await User.updateOne(
      { _id: u._id },
      {
        $set: {
          miningIncome: newMiningIncome,
          levelIncome: newLevelIncome,
          totalEarning: newTotalEarning,
          availableBalance: newAvailableBalance
        }
      }
    );

    usersUpdated++;
  }

  console.log(`[MIGRATION] Successfully updated and resynced ${usersUpdated} users!`);
  console.log('[MIGRATION] ✅ Full historical recalculation from July 15 to now complete.');
  process.exit(0);
}

executeRecalculation().catch(err => {
  console.error('[MIGRATION ERROR]', err);
  process.exit(1);
});
