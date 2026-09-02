const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const fixStakingRelease = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    console.log('Connecting to database:', mongoUri);
    await mongoose.connect(mongoUri);

    const UserPackage = require('./models/UserPackage');
    const User = require('./models/User');
    const Transaction = require('./models/Transaction');

    // Find packages where staking has ended (stakingEndDate in the past) but compounding balance hasn't been reset or isStakingReleased is not true
    // We check for any packages with isStaked: true or stakingEnabled: true where stakingEndDate <= now
    const expiredPkgs = await UserPackage.find({
      $or: [
        { stakingEnabled: true },
        { isStaked: true }
      ],
      stakingEndDate: { $lte: new Date() }
    });

    console.log(`Found ${expiredPkgs.length} expired staking packages to release.`);

    for (let pkg of expiredPkgs) {
      const user = await User.findById(pkg.user);
      if (!user) {
        console.log(`User not found for package ${pkg._id}`);
        continue;
      }

      const accumulatedROI = Math.max(0, (pkg.compoundingBalance || pkg.amount) - pkg.amount);
      if (accumulatedROI > 0) {
        // Credit to user balance
        if (pkg.paymentMethod === 'INR') {
          const exchangeRate = 90; // Default or fetch
          user.availableBalanceINR = (user.availableBalanceINR || 0) + (accumulatedROI * exchangeRate);
        } else {
          user.availableBalance = (user.availableBalance || 0) + accumulatedROI;
        }
        await user.save();

        await Transaction.create({
          userId: user.userId,
          user: user._id,
          type: 'release',
          amount: pkg.paymentMethod === 'INR' ? accumulatedROI * 90 : accumulatedROI,
          status: 'success',
          description: pkg.paymentMethod === 'INR' ? 'Staking ROI released in INR (Auto-fix)' : 'Staking ROI released in USDT (Auto-fix)'
        });

        console.log(`Released $${accumulatedROI} to user ${user.userId} for package ${pkg._id}`);
      }

      // Reset package staking states
      pkg.compoundingBalance = pkg.amount;
      pkg.stakingEnabled = false;
      pkg.autoCompounding = false;
      pkg.isStaked = false;
      pkg.isStakingReleased = true;
      await pkg.save();

      console.log(`Package ${pkg._id} compounding balance reset and staking deactivated.`);
    }

    console.log('Staking auto-fix completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error during staking auto-fix:', error);
    process.exit(1);
  }
};

fixStakingRelease();
