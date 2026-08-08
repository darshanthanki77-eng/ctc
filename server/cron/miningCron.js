const cron = require('node-cron');
const mongoose = require('mongoose');
const UserPackage = require('../models/UserPackage');
const User = require('../models/User');
const MiningIncome = require('../models/MiningIncome');
const CronState = require('../models/CronState');
const AuditLog = require('../models/AuditLog');
const SystemSettings = require('../models/SystemSettings');
const { distributeLevelIncome } = require('../services/levelService');
const { isStrictlyActiveUser } = require('../utils/userValidation');

const marginBonusMap = {
  'L1': 0.50, 'L2': 1.00, 'L3': 2.00, 'L4': 2.50, 'L5': 3.00, 'L6': 3.50,
  'L7': 4.00, 'L8': 4.50, 'L9': 5.00, 'L10': 5.50, 'L11': 6.00, 'L12': 6.50
};

// Run every 12 hours (Monday to Friday) UTC time
const runMiningCronCycle = async (force = false) => {
  const cronName = 'MINING_CRON_12H';

  const today = new Date();
  const utcHour = today.getUTCHours();
  const utcDay = today.getUTCDay();

  const cycleHour = utcHour < 12 ? 0 : 12;

  // Calculate cycleId based on UTC time to avoid timezone mismatch
  // e.g. MINING_2026-05-26_0 or MINING_2026-05-26_12
  const cycleId = `MINING_${today.toISOString().split('T')[0]}_${cycleHour}`;

  // 1. DUPLICATE & REPLAY PROTECTION (CRON LOCK)
  let state = await CronState.findOne({ cronName });
  if (!state) {
    try {
      state = await CronState.create({ cronName, isRunning: false });
    } catch (err) {
      state = await CronState.findOne({ cronName });
    }
  }

  // Auto-release stale lock if held for more than 20 minutes (handles crash/timeout scenarios)
  const LOCK_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes
  if (state.isRunning && state.lockAcquiredAt) {
    const lockAge = Date.now() - new Date(state.lockAcquiredAt).getTime();
    if (lockAge > LOCK_TIMEOUT_MS) {
      console.warn(`[CRON] ⚠️ Stale lock detected (held for ${Math.round(lockAge / 60000)}m). Force-releasing.`);
      await CronState.updateOne({ cronName }, { $set: { isRunning: false, lockAcquiredAt: null } });
      state.isRunning = false;
    }
  }

  if (state.isRunning) {
    console.log(`[CRON] ${cronName} is currently locked/running. Skipping.`);
    return { success: false, reason: 'LOCKED' };
  }

  if (state.lastCycleId === cycleId && !force) {
    console.log(`[CRON] ${cronName} already completed cycle ${cycleId}. Skipping.`);
    return { success: false, reason: 'ALREADY_COMPLETED' };
  }

  // Acquire the lock atomically.
  const acquiredLock = await CronState.findOneAndUpdate(
    { cronName, isRunning: false },
    { $set: { isRunning: true, lockAcquiredAt: new Date() } },
    { returnDocument: 'after' }
  );

  if (!acquiredLock) {
    console.log(`[CRON] ${cronName} could not acquire lock (already running). Skipping.`);
    return { success: false, reason: 'LOCKED' };
  }

  
  console.log('============================================');
  console.log('[CRON] ✅ CRON JOB IS RUNNING');
  console.log(`[CRON] Cycle: ${cycleId}`);
  console.log(`[CRON] UTC Time: ${new Date().toUTCString()}`);
  console.log('============================================');

  if ((utcDay === 0 || utcDay === 6) && !force) {
    console.log('[CRON] Skipping mining cron distribution on weekend (Saturday/Sunday UTC)');
    await CronState.updateOne({ cronName }, { $set: { isRunning: false, lockAcquiredAt: null, lastCycleId: cycleId, lastRunAt: new Date() } });
    return { success: false, reason: 'WEEKEND_SKIPPED' };
  }

  // Helper for decimal precision control
  const round6 = (num) => Math.round(num * 1000000) / 1000000;

  try {
    const settings = await SystemSettings.findOne() || await SystemSettings.create({});
    const inrRate = settings.inrExchangeRate || 90;

    // Release and complete expired packages
    const activeExpiredPackages = await UserPackage.find({
      status: 'active',
      endDate: { $lte: new Date() }
    });

    // Capped staked packages that reached cap early (status: completed) but their duration is now completed
    const completedStakedPackages = await UserPackage.find({
      status: 'completed',
      isStaked: true,
      isStakingReleased: { $ne: true },
      $or: [
        { stakingEndDate: { $lte: new Date() } },
        { stakingEndDate: { $exists: false }, endDate: { $lte: new Date() } }
      ]
    });

    const expiredPackages = [...activeExpiredPackages, ...completedStakedPackages];

    if (expiredPackages.length > 0) {
      console.log(`[CRON] Found ${expiredPackages.length} expired packages to process (${activeExpiredPackages.length} active, ${completedStakedPackages.length} completed/capped).`);
      const Transaction = require('../models/Transaction');
      for (let expiredPkg of expiredPackages) {
        const u = await User.findById(expiredPkg.user);
        if (u) {
          expiredPkg.status = 'completed';
          if (expiredPkg.isStaked) {
            // Check if there are any other active staked packages remaining
            const otherActiveStaked = await UserPackage.findOne({
              user: u._id,
              _id: { $ne: expiredPkg._id },
              status: 'active',
              $or: [
                { isStaked: true },
                { stakingEnabled: true }
              ],
              stakingEndDate: { $gt: new Date() }
            });

            let releaseAmount = Math.max(0, expiredPkg.compoundingBalance - expiredPkg.amount);
            if (!otherActiveStaked) {
              // No other active staked package. Release lockedStakingIncome as well!
              const lockedAmt = u.lockedStakingIncome || 0;
              releaseAmount += lockedAmt;
              u.lockedStakingIncome = 0;
              console.log(`[CRON] Releasing lockedStakingIncome of ${lockedAmt} to user ${u.userId}`);
            }

            if (expiredPkg.paymentMethod === 'INR') {
              const releaseAmountINR = releaseAmount * inrRate;
              u.availableBalanceINR = round6((u.availableBalanceINR || 0) + releaseAmountINR);
            } else {
              u.availableBalance = round6(u.availableBalance + releaseAmount);
            }
            await u.save();

            await Transaction.create({
              userId: u.userId,
              user: u._id,
              type: 'release',
              amount: expiredPkg.paymentMethod === 'INR' ? releaseAmount * inrRate : releaseAmount,
              status: 'success',
              description: expiredPkg.paymentMethod === 'INR' ? 'Staking ROI released in INR' : 'Staking ROI released in USDT'
            });

            await AuditLog.create({
              action: 'STAKING_RELEASE',
              userId: u._id,
              packageId: expiredPkg._id,
              amount: releaseAmount,
              details: { reason: 'Staking duration completed', duration: expiredPkg.stakingDuration, originalPrincipal: expiredPkg.amount }
            });
            console.log(`[CRON] Released staked package ${expiredPkg._id} ROI of ${releaseAmount} to user ${u.userId}`);
            
            // Mark as staking released
            expiredPkg.isStakingReleased = true;
          } else {
            // Normal package completes without refunding principal (since user got payouts)
            await AuditLog.create({
              action: 'PACKAGE_EXPIRED',
              userId: u._id,
              packageId: expiredPkg._id,
              amount: expiredPkg.amount,
              details: { reason: 'Validity duration completed' }
            });
            console.log(`[CRON] Standard package ${expiredPkg._id} expired for user ${u.userId}`);
          }
          await expiredPkg.save();
        }
      }
    }

    const activePackages = await UserPackage.find({
      status: 'active',
      endDate: { $gt: new Date() }
    }).populate('packageId');

    console.log(`[CRON] Found ${activePackages.length} active packages to process.`);
    let idx = 0;
    for (let pkg of activePackages) {
      idx++;
      const user = await User.findById(pkg.user);
      if (!user) continue;

      if (idx % 10 === 0 || idx === 1 || idx === activePackages.length) {
        console.log(`[CRON] Processing package ${idx}/${activePackages.length} (ID: ${pkg._id}) for user ${user.userId}`);
      }

      // Check if MiningIncome was already credited for this package in the current 12-hour cycle window
      const cycleStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), cycleHour, 0, 0));
      const cycleEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), cycleHour + 11, 59, 59, 999));
      
      const alreadyEarned = await MiningIncome.findOne({
        userPackageId: pkg._id,
        createdAt: { $gte: cycleStart, $lte: cycleEnd }
      });
      if (alreadyEarned) {
        console.log(`[CRON] Package ${pkg._id} (${user.userId}) already credited in cycle ${cycleId}. Skipping.`);
        continue;
      }

      // Check if staking duration has completed for active package
      if (pkg.stakingEnabled && pkg.stakingEndDate && pkg.stakingEndDate <= new Date()) {
        const UserPackage = require('../models/UserPackage');
        const Transaction = require('../models/Transaction');

        // 1. Calculate accumulated compounded ROI to release
        const accumulatedROI = Math.max(0, (pkg.compoundingBalance || pkg.amount) - pkg.amount);
        let totalRelease = accumulatedROI;

        // 2. Check if there are any other active staked packages remaining for the user
        const otherActiveStaked = await UserPackage.findOne({
          user: user._id,
          _id: { $ne: pkg._id },
          status: 'active',
          $or: [
            { isStaked: true },
            { stakingEnabled: true }
          ],
          stakingEndDate: { $gt: new Date() }
        });

        // 3. Release lockedStakingIncome if this is the last active staked package
        if (!otherActiveStaked) {
          const lockedAmt = user.lockedStakingIncome || 0;
          totalRelease += lockedAmt;
          user.lockedStakingIncome = 0;
          console.log(`[CRON] Releasing lockedStakingIncome of ${lockedAmt} to user ${user.userId}`);
        }

        // 4. Update user available balance
        if (pkg.paymentMethod === 'INR') {
          const totalReleaseINR = totalRelease * inrRate;
          user.availableBalanceINR = round6((user.availableBalanceINR || 0) + totalReleaseINR);
        } else {
          user.availableBalance = round6(user.availableBalance + totalRelease);
        }
        await user.save();

        // 5. Reset package compounding balance to the principal amount (compounding stops)
        pkg.compoundingBalance = pkg.amount;
        pkg.stakingEnabled = false;
        pkg.autoCompounding = false;
        pkg.isStaked = false;
        await pkg.save();

        if (totalRelease > 0) {
          await Transaction.create({
            userId: user.userId,
            user: user._id,
            type: 'release',
            amount: pkg.paymentMethod === 'INR' ? totalRelease * inrRate : totalRelease,
            status: 'success',
            description: pkg.paymentMethod === 'INR' ? 'Staking ROI released in INR' : 'Staking ROI released in USDT'
          });
        }

        await AuditLog.create({
          action: 'STAKING_COMPLETED',
          userId: user._id,
          packageId: pkg._id,
          amount: accumulatedROI,
          details: { reason: 'Staking duration completed, ROI and locked income released', period: pkg.stakingPeriod, totalRelease }
        });
        console.log(`[CRON] Staking completed for active package ${pkg._id} of user ${user.userId}. Released ROI: ${accumulatedROI}, Compounding turned OFF.`);
      }

      // STRICT ACTIVE USER VALIDATION
      const isActive = await isStrictlyActiveUser(user, pkg);
      const { getUserMultiplier } = require('../utils/userValidation');
      const maxCapMultiplier = await getUserMultiplier(user, pkg);
      if (!isActive) {
        // Double ensure flags are flipped if they reached cap mathematically but flags aren't updated yet
        if (user && user.totalEarning >= user.totalInvestment * maxCapMultiplier && user.isActive) {
          user.isActive = false;
          await user.save();
 
          await AuditLog.create({
            action: 'CAP_COMPLETED',
            userId: user._id,
            packageId: pkg._id,
            details: { reason: `${maxCapMultiplier}x cap reached during mining cron pre-check` }
          });
        }
        if (pkg.totalEarned >= pkg.amount * maxCapMultiplier && pkg.status === 'active') {
          pkg.status = 'completed';
          await pkg.save();
        }
        continue;
      }

      // let currentMarginBonus = marginBonusMap[user.rank] || 0;
      let totalDailyPercent = pkg.dailyProfitPercent; // + currentMarginBonus; // Temporarily commented out rank margin bonus

      // Auto-Compounding Base: Calculate profit on the GROWING compounded balance
      let baseAmount = pkg.compoundingBalance || pkg.amount;
      let profitAmount = (baseAmount * (totalDailyPercent / 100)) / 2; // 2 cycles a day

      // Fastrack Bonus (Double profit)
      if (user.fastrackQualified) {
        profitAmount *= 2;
      }

      // -------------------------------------------------------------
      // PRECISION OVERSHOOT PROTECTION
      // Calculate exact remaining capacity across BOTH package and user
      // -------------------------------------------------------------
      const pkgRemainingCap = (pkg.amount * maxCapMultiplier) - pkg.totalEarned;
      const userRemainingCap = (user.totalInvestment * maxCapMultiplier) - user.totalEarning;
 
      const maxAllowedProfit = Math.min(pkgRemainingCap, userRemainingCap);
 
      if (profitAmount > maxAllowedProfit) {
        profitAmount = maxAllowedProfit; // Truncate exactly to the limit
      }
 
      if (profitAmount <= 0) {
        pkg.status = 'completed';
        user.isActive = false; // By definition if capacity is 0, they are inactive
        await pkg.save();
        await user.save();
        continue;
      }
 
      profitAmount = round6(profitAmount);
 
      // We use a transaction if possible, otherwise we save sequentially (production robust)
      // Mongoose transactions require Replica Sets. Assuming standard mongo setup without guarantee, we save safely.
 
      await MiningIncome.create({
        userId: user.userId,
        user: user._id,
        packageId: pkg.packageId,
        userPackageId: pkg._id,
        amount: profitAmount,
        percentage: user.fastrackQualified ? totalDailyPercent * 2 : totalDailyPercent,
        triggerType: force ? 'Manual' : 'Auto',
        isManual: !!force
      });
 
      // Determine if staking is active for compounding decision
      const isStakingActive = pkg.stakingEnabled || (pkg.isStaked && !pkg.stakingEndDate);

      // Profit always goes to availableBalance as requested
      const withdrawableAmount = profitAmount;
 
      user.miningIncome = round6(user.miningIncome + profitAmount);
      user.totalEarning = round6(user.totalEarning + profitAmount); // 100% of profit counts towards the cap!
      
      if (withdrawableAmount > 0 && !isStakingActive) {
        if (pkg.paymentMethod === 'INR') {
          const withdrawableAmountINR = withdrawableAmount * inrRate;
          user.availableBalanceINR = round6((user.availableBalanceINR || 0) + withdrawableAmountINR);
        } else {
          user.availableBalance = round6(user.availableBalance + withdrawableAmount); // 100% is withdrawable instantly
        }
      }
 
      pkg.totalEarned = round6(pkg.totalEarned + profitAmount);
 
      if (isStakingActive) {
        pkg.compoundingBalance = round6(baseAmount + profitAmount); // Compounding: Add profit to the principal balance
      } else {
        pkg.compoundingBalance = Math.max(pkg.amount, pkg.compoundingBalance || pkg.amount); // Preserve compounded balance, prevent downward reset
      }
 
      let capHit = false;
      // Final precision check after adding profit
      if (pkg.totalEarned >= pkg.amount * maxCapMultiplier || user.totalEarning >= user.totalInvestment * maxCapMultiplier) {
        pkg.status = 'completed';
        user.isActive = false;
        capHit = true;
      }
 
      await pkg.save();
      await user.save();
 
      // AUDIT LOG
      await AuditLog.create({
        action: 'ROI_GENERATION',
        userId: user._id,
        packageId: pkg._id,
        amount: profitAmount,
        details: { cycleId, capHit }
      });
      if (capHit) {
        await AuditLog.create({
          action: 'CAP_COMPLETED',
          userId: user._id,
          packageId: pkg._id,
          details: { cycleId, reason: `${maxCapMultiplier}x cap reached EXACTLY during ROI generation` }
        });
      }
 
      // Level Bonus Distribution based on Profit amount
      // Since level bonus also increases user totalEarning, it must also be cap-protected
      if (user.pins && user.pins > 0) {
        await distributeLevelIncome(user._id, profitAmount, user.userId);
      }
    }

    // Unlock and record success
    await CronState.updateOne(
      { cronName },
      { $set: { isRunning: false, lockAcquiredAt: null, lastCycleId: cycleId, lastRunAt: new Date(), errorLog: null } }
    );
    console.log('============================================');
    console.log('[CRON] ✅ CRON JOB FINISHED SUCCESSFULLY');
    console.log(`[CRON] Cycle: ${cycleId} completed at ${new Date().toUTCString()}`);
    console.log('============================================');
    return { success: true };
  } catch (error) {
    console.error('============================================');
    console.error('[CRON] ❌ CRON JOB ERROR — FAILED TO RUN');
    console.error(`[CRON] Error: ${error.message}`);
    console.error(`[CRON] Time: ${new Date().toUTCString()}`);
    console.error('============================================');
    await CronState.updateOne({ cronName }, { $set: { isRunning: false, lockAcquiredAt: null, errorLog: error.message } });
    return { success: false, error: error.message };
  }
};
// ==========================================
// LOCAL DEVELOPMENT CRON ONLY
// ==========================================

// if (process.env.NODE_ENV !== 'production') {

//   console.log('[CRON] Local node-cron started');

//   // TESTING EVERY 1 MINUTE
//   cron.schedule("*/30 * * * * *", async () => {
//     console.log('[CRON] Local test cron triggered');

//     // await runMiningCronCycle(true);
//     await runMiningCronCycle(false);

//   }, {
//     scheduled: true,
//     timezone: "UTC"
//   });

// }

module.exports = { runMiningCronCycle };
