const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const userIds = [
  'CTC14507',
  'CTC83462',
  'CTC40102',
  'CTC20610',
  'CTC71132',
  'CTC64659',
  'CTC79734',
  'CTC33197'
];

const migrateUsersToINR = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    console.log('Connecting to database:', mongoUri);
    await mongoose.connect(mongoUri);

    const User = require('./models/User');
    const UserPackage = require('./models/UserPackage');
    const SystemSettings = require('./models/SystemSettings');

    const settings = await SystemSettings.findOne() || { inrExchangeRate: 90 };
    const inrRate = settings.inrExchangeRate || 90;
    console.log(`Using INR Exchange Rate: ${inrRate}`);

    for (const userId of userIds) {
      const user = await User.findOne({ userId: userId.trim() });
      if (!user) {
        console.log(`⚠️ User not found: ${userId}`);
        continue;
      }

      console.log(`\nMigrating User: ${user.userId} (${user.fullName})`);

      // 1. Convert current available balance in USD to INR
      const usdBalance = user.availableBalance || 0;
      if (usdBalance > 0) {
        const inrEquivalent = Math.round(usdBalance * inrRate * 100) / 100;
        user.availableBalanceINR = (user.availableBalanceINR || 0) + inrEquivalent;
        user.availableBalance = 0;
        console.log(`- Converted USD Balance $${usdBalance} to ₹${inrEquivalent} INR`);
      }

      await user.save();

      // 2. Update all packages to paymentMethod: 'INR'
      const pkgResult = await UserPackage.updateMany(
        { user: user._id },
        { $set: { paymentMethod: 'INR' } }
      );
      console.log(`- Updated ${pkgResult.modifiedCount} packages to INR payment method.`);
    }

    console.log('\nMigration to INR completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateUsersToINR();
