require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

async function migrateAllInrBalances() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    console.log('====================================================');
    console.log('[MIGRATION] Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log(`[MIGRATION] Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);
    console.log('====================================================');

    const User = require('./models/User');
    const UserPackage = require('./models/UserPackage');
    const SystemSettings = require('./models/SystemSettings');

    const settings = await SystemSettings.findOne() || { inrExchangeRate: 90 };
    const inrRate = settings.inrExchangeRate || 90;
    console.log(`[MIGRATION] Using INR Exchange Rate: ₹${inrRate} / USD\n`);

    const users = await User.find();
    console.log(`[MIGRATION] Total users in system: ${users.length}`);

    let convertedCount = 0;
    let packagesUpdatedCount = 0;

    for (const user of users) {
      const userPkgs = await UserPackage.find({ user: user._id });

      // Check if user has INR packages or non-INR packages
      const inrPkgs = userPkgs.filter(p => p.paymentMethod === 'INR');
      const cryptoPkgs = userPkgs.filter(p => p.paymentMethod !== 'INR');

      // If all packages are INR (or user has INR packages and no crypto packages)
      // Ensure all packages explicitly set paymentMethod: 'INR'
      if (inrPkgs.length > 0 || userPkgs.length > 0) {
        // Convert existing availableBalance in USD to availableBalanceINR
        const usdBalance = user.availableBalance || 0;
        
        if (usdBalance > 0 && cryptoPkgs.length === 0) {
          const inrEquivalent = Math.round(usdBalance * inrRate * 100) / 100;
          const oldINR = user.availableBalanceINR || 0;
          user.availableBalanceINR = oldINR + inrEquivalent;
          user.availableBalance = 0;
          await user.save();

          console.log(`[CONVERTED] User ${user.userId} (${user.fullName}): Converted $${usdBalance} USD -> ₹${inrEquivalent} INR (New Total INR: ₹${user.availableBalanceINR})`);
          convertedCount++;
        } else if (usdBalance < 0) {
          // Fix negative USD balances
          user.availableBalance = 0;
          await user.save();
        }

        // Ensure user's packages have paymentMethod 'INR' if not set
        const res = await UserPackage.updateMany(
          { user: user._id, paymentMethod: { $exists: false } },
          { $set: { paymentMethod: 'INR' } }
        );
        if (res.modifiedCount > 0) {
          packagesUpdatedCount += res.modifiedCount;
        }
      }
    }

    console.log('\n====================================================');
    console.log(`[MIGRATION SUMMARY]`);
    console.log(`- Users with USD balances converted to INR: ${convertedCount}`);
    console.log(`- Missing package paymentMethod updated: ${packagesUpdatedCount}`);
    console.log('====================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[MIGRATION ERROR]', error);
    process.exit(1);
  }
}

migrateAllInrBalances();
