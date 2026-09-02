require('dotenv').config();
const mongoose = require('mongoose');
const Package = require('./models/Package');
const UserPackage = require('./models/UserPackage');

async function migratePackages() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables.');
    }

    console.log('[MIGRATION] Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('[MIGRATION] Connected successfully.');

    // 1. Update all packages to 0.5% daily ROI
    const pkgResult = await Package.updateMany(
      {},
      { $set: { dailyProfit: 0.5 } }
    );
    console.log(`[MIGRATION] Updated ${pkgResult.modifiedCount} Package documents to dailyProfit = 0.5%`);

    // 2. Update all user packages to 0.5% daily profit percent
    const upResult = await UserPackage.updateMany(
      {},
      { $set: { dailyProfitPercent: 0.5 } }
    );
    console.log(`[MIGRATION] Updated ${upResult.modifiedCount} UserPackage documents to dailyProfitPercent = 0.5%`);

    // Verify all packages
    const allPkgs = await Package.find();
    console.log('\n--- Current Packages in Database ---');
    allPkgs.forEach(p => {
      console.log(`- ${p.name} ($${p.minAmount} - $${p.maxAmount}): dailyProfit = ${p.dailyProfit}%`);
    });

    console.log('\n[MIGRATION] ✅ All packages successfully migrated to 0.5% daily ROI.');
    process.exit(0);
  } catch (error) {
    console.error('[MIGRATION] ❌ Error running migration:', error);
    process.exit(1);
  }
}

migratePackages();
