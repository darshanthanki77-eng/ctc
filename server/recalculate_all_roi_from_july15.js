require('dotenv').config();
const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
const round6 = (num) => Math.round(num * 1000000) / 1000000;
const july15 = new Date('2026-07-15T00:00:00.000Z');

async function recalculateAllRoi() {
  const startTime = Date.now();
  console.log('====================================================');
  console.log('[RECALCULATION] Connecting to MongoDB...');
  await mongoose.connect(mongoUri);
  console.log(`[RECALCULATION] Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);
  console.log('====================================================');

  const User = require('./models/User');
  const UserPackage = require('./models/UserPackage');
  const MiningIncome = require('./models/MiningIncome');
  const LevelIncome = require('./models/LevelIncome');
  const Package = require('./models/Package');
  const Withdrawal = require('./models/Withdrawal');

  // 1. Update Package templates to dailyProfit: 0.5
  const pkgRes = await Package.updateMany({}, { $set: { dailyProfit: 0.5 } });
  console.log(`[1/5] Updated ${pkgRes.modifiedCount} Package templates to dailyProfit = 0.5%`);

  // 2. Fetch all collections into memory
  console.log('[2/5] Loading collections into memory...');
  const [allUsers, allPackages, allMining, allLevels] = await Promise.all([
    User.find().lean(),
    UserPackage.find().lean(),
    MiningIncome.find().lean(),
    LevelIncome.find({ createdAt: { $gte: july15 } }).lean()
  ]);
  console.log(`Loaded: ${allUsers.length} users, ${allPackages.length} packages, ${allMining.length} mining records, ${allLevels.length} level records.`);

  const userMap = new Map(allUsers.map(u => [u._id.toString(), u]));

  // Group mining by userPackageId
  const miningByPkg = new Map();
  for (const m of allMining) {
    const pkgId = m.userPackageId?.toString();
    if (!pkgId) continue;
    if (!miningByPkg.has(pkgId)) miningByPkg.set(pkgId, []);
    miningByPkg.get(pkgId).push(m);
  }

  // Group levels by fromUser
  const levelsByFromUser = new Map();
  for (const l of allLevels) {
    const fromId = l.fromUser?.toString();
    if (!fromId) continue;
    if (!levelsByFromUser.has(fromId)) levelsByFromUser.set(fromId, []);
    levelsByFromUser.get(fromId).push(l);
  }

  const miningBulkOps = [];
  const levelBulkOps = [];
  const packageBulkOps = [];

  let totalMiningUpdated = 0;
  let totalLevelUpdated = 0;

  console.log('[3/5] Recalculating MiningIncome & LevelIncome from July 15th to now...');

  for (const pkg of allPackages) {
    const user = userMap.get(pkg.user?.toString());
    if (!user) continue;

    const isStaked = pkg.isStaked || pkg.stakingEnabled;
    const pkgMining = (miningByPkg.get(pkg._id.toString()) || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const miningBeforeJuly15 = pkgMining.filter(m => new Date(m.createdAt) < july15);
    const miningAfterJuly15 = pkgMining.filter(m => new Date(m.createdAt) >= july15);

    let currentCompBalance = pkg.amount + miningBeforeJuly15.reduce((s, m) => s + m.amount, 0);
    let pkgTotalEarned = miningBeforeJuly15.reduce((s, m) => s + m.amount, 0);

    for (const m of miningAfterJuly15) {
      const baseAmount = isStaked ? currentCompBalance : pkg.amount;
      const isFastrack = !!user.fastrackQualified;
      const dailyPercent = isFastrack ? 1.0 : 0.5; // 0.5% daily standard, 1.0% fastrack
      const cyclePercent = dailyPercent / 2; // 0.25% per 12H cycle standard, 0.50% fastrack

      const newMiningAmount = round6((baseAmount * cyclePercent) / 100);

      miningBulkOps.push({
        updateOne: {
          filter: { _id: m._id },
          update: {
            $set: {
              amount: newMiningAmount,
              percentage: dailyPercent
            }
          }
        }
      });
      totalMiningUpdated++;

      if (isStaked) {
        currentCompBalance = round6(currentCompBalance + newMiningAmount);
      }
      pkgTotalEarned = round6(pkgTotalEarned + newMiningAmount);

      // Recalculate related level incomes from this downline at this cycle
      const mTime = new Date(m.createdAt).getTime();
      const userLevels = levelsByFromUser.get(m.user?.toString()) || [];
      const relatedLevels = userLevels.filter(lvl => {
        const lTime = new Date(lvl.createdAt).getTime();
        return Math.abs(lTime - mTime) <= 60000;
      });

      for (const lvl of relatedLevels) {
        const newLvlAmount = round6((newMiningAmount * lvl.percentage) / 100);
        levelBulkOps.push({
          updateOne: {
            filter: { _id: lvl._id },
            update: {
              $set: {
                amount: newLvlAmount
              }
            }
          }
        });
        totalLevelUpdated++;
      }
    }

    packageBulkOps.push({
      updateOne: {
        filter: { _id: pkg._id },
        update: {
          $set: {
            dailyProfitPercent: 0.5,
            totalEarned: round6(pkgTotalEarned),
            compoundingBalance: isStaked ? round6(currentCompBalance) : pkg.amount
          }
        }
      }
    });
  }

  // Execute bulk operations for MiningIncome, LevelIncome, and UserPackage
  if (miningBulkOps.length > 0) {
    console.log(`Writing ${miningBulkOps.length} MiningIncome updates in bulk...`);
    await MiningIncome.bulkWrite(miningBulkOps, { ordered: false });
  }

  if (levelBulkOps.length > 0) {
    console.log(`Writing ${levelBulkOps.length} LevelIncome updates in bulk...`);
    await LevelIncome.bulkWrite(levelBulkOps, { ordered: false });
  }

  if (packageBulkOps.length > 0) {
    console.log(`Writing ${packageBulkOps.length} UserPackage updates in bulk...`);
    await UserPackage.bulkWrite(packageBulkOps, { ordered: false });
  }

  console.log(`[4/5] ✅ Updated ${totalMiningUpdated} MiningIncome, ${totalLevelUpdated} LevelIncome, and ${packageBulkOps.length} UserPackage records.`);

  // 4. Resync all Users balances and totals directly from updated database aggregations
  console.log('[5/5] Resynchronizing user totals and balances across all users...');

  const [miningTotals, levelTotals, allWithdrawals, freshPackages] = await Promise.all([
    MiningIncome.aggregate([
      { $group: { _id: '$user', total: { $sum: '$amount' } } }
    ]),
    LevelIncome.aggregate([
      { $group: { _id: '$user', total: { $sum: '$amount' } } }
    ]),
    Withdrawal.find({ status: { $ne: 'rejected' } }).lean(),
    UserPackage.find().lean()
  ]);

  const miningMap = new Map(miningTotals.map(t => [t._id.toString(), t.total]));
  const levelMap = new Map(levelTotals.map(t => [t._id.toString(), t.total]));

  // Group withdrawals by user
  const withdrawalsByUser = new Map();
  for (const w of allWithdrawals) {
    const uId = w.user?.toString();
    if (!uId) continue;
    withdrawalsByUser.set(uId, (withdrawalsByUser.get(uId) || 0) + (w.amount || 0));
  }

  // Group fresh packages by user
  const packagesByUser = new Map();
  for (const p of freshPackages) {
    const uId = p.user?.toString();
    if (!uId) continue;
    if (!packagesByUser.has(uId)) packagesByUser.set(uId, []);
    packagesByUser.get(uId).push(p);
  }

  const userBulkOps = [];
  const freshUsers = await User.find().lean();

  for (const u of freshUsers) {
    const uId = u._id.toString();
    const newMiningIncome = round6(miningMap.get(uId) || 0);
    const newLevelIncome = round6(levelMap.get(uId) || 0);
    const refIncome = u.referralIncome || 0;
    const promoIncome = u.promotionalIncome || 0;
    const lockedStaking = u.lockedStakingIncome || 0;
    const totalWithdrawn = withdrawalsByUser.get(uId) || 0;

    const uPkgs = packagesByUser.get(uId) || [];
    let activeStakedROI = 0;

    for (const p of uPkgs) {
      const isStakedPkg = p.isStaked || p.stakingEnabled;
      if (isStakedPkg && p.status === 'active') {
        activeStakedROI += Math.max(0, (p.compoundingBalance || 0) - (p.amount || 0));
      }
    }

    const newTotalEarning = round6(newMiningIncome + newLevelIncome + refIncome + promoIncome);
    const expectedBalance = round6(newMiningIncome + newLevelIncome + refIncome + promoIncome - activeStakedROI - lockedStaking - totalWithdrawn);
    const newAvailableBalance = expectedBalance;

    userBulkOps.push({
      updateOne: {
        filter: { _id: u._id },
        update: {
          $set: {
            miningIncome: newMiningIncome,
            levelIncome: newLevelIncome,
            totalEarning: newTotalEarning,
            availableBalance: newAvailableBalance
          }
        }
      }
    });
  }

  if (userBulkOps.length > 0) {
    await User.bulkWrite(userBulkOps, { ordered: false });
  }

  console.log(`[RECALCULATION] ✅ Resynchronized ${userBulkOps.length} User records.`);
  console.log(`[RECALCULATION] 🚀 Full historical recalculation completed successfully in ${Date.now() - startTime}ms!`);
  process.exit(0);
}

recalculateAllRoi().catch(err => {
  console.error('[RECALCULATION ERROR]', err);
  process.exit(1);
});
