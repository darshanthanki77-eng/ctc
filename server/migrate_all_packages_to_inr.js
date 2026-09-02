require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

async function migrateAllPackagesToINR() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    console.log('[MIGRATION] Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log(`[MIGRATION] Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);

    const UserPackage = require('./models/UserPackage');

    // Count current crypto vs inr packages
    const cryptoCount = await UserPackage.countDocuments({ paymentMethod: { $ne: 'INR' } });
    console.log(`[MIGRATION] Found ${cryptoCount} packages not set to INR.`);

    const result = await UserPackage.updateMany(
      {},
      { $set: { paymentMethod: 'INR' } }
    );

    console.log(`[MIGRATION] Updated ${result.modifiedCount} UserPackage documents to paymentMethod = 'INR'.`);

    // Verify
    const remainingCrypto = await UserPackage.countDocuments({ paymentMethod: { $ne: 'INR' } });
    const inrCount = await UserPackage.countDocuments({ paymentMethod: 'INR' });
    console.log(`[MIGRATION] Verification:`);
    console.log(`  - Packages with paymentMethod = 'INR': ${inrCount}`);
    console.log(`  - Packages with paymentMethod != 'INR': ${remainingCrypto}`);

    if (remainingCrypto === 0) {
      console.log('\n[MIGRATION] ✅ 100% of packages successfully migrated to INR payment method.');
    } else {
      console.warn(`\n[MIGRATION] ⚠️ ${remainingCrypto} packages still not in INR.`);
    }

    process.exit(0);
  } catch (error) {
    console.error('[MIGRATION ERROR]', error);
    process.exit(1);
  }
}

migrateAllPackagesToINR();
