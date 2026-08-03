require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const UserPackage = require('./models/UserPackage');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const AuditLog = require('./models/AuditLog');

const round6 = (num) => Math.round(num * 1000000) / 1000000;

async function run() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`=========================================`);
  console.log(`🛡️  STAKING PRINCIPAL DEDUCTION SCRIPT`);
  console.log(`Dry Run Mode: ${dryRun ? 'ON (No database changes will be saved)' : 'OFF (Changes WILL be written)'}`);
  console.log(`=========================================\n`);

  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI environment variable is missing.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Find all packages that completed staking and released principal (isStaked=true, isStakingReleased=true)
  const completedStakingPackages = await UserPackage.find({
    isStaked: true,
    isStakingReleased: true
  });

  console.log(`Found ${completedStakingPackages.length} packages that completed staking.`);

  let totalDeductions = 0;
  let affectedUsersCount = 0;

  for (const pkg of completedStakingPackages) {
    const user = await User.findById(pkg.user);
    if (!user) {
      console.warn(`⚠️ User not found for package ${pkg._id} (User ID in pkg: ${pkg.userId})`);
      continue;
    }

    const deductAmount = pkg.amount;
    const oldBalance = user.availableBalance || 0;
    const newBalance = round6(oldBalance - deductAmount);

    console.log(`\n-----------------------------------------`);
    console.log(`👤 User: ${user.userId} (${user.fullName})`);
    console.log(`📦 Package ID: ${pkg._id} (Amount: $${pkg.amount})`);
    console.log(`💵 Balance before: $${oldBalance}`);
    console.log(`💵 Balance after deduction: $${newBalance}`);

    totalDeductions += deductAmount;
    affectedUsersCount++;

    if (!dryRun) {
      // 1. Deduct from availableBalance
      user.availableBalance = newBalance;
      await user.save();

      // 2. Create corrective Transaction record
      await Transaction.create({
        userId: user.userId,
        user: user._id,
        type: 'withdrawal',
        amount: deductAmount,
        status: 'success',
        txHash: `CORRECTION_STAKING_PRINCIPAL_DEDUCTION_${pkg._id}`
      });

      // 3. Create AuditLog entry
      await AuditLog.create({
        action: 'STAKING_PRINCIPAL_CORRECTION',
        userId: user._id,
        packageId: pkg._id,
        amount: deductAmount,
        details: {
          reason: 'Deducting incorrectly released staking principal',
          originalPrincipal: pkg.amount,
          newBalance: newBalance,
          oldBalance: oldBalance
        }
      });

      console.log(`✅ Deduction successfully saved for user ${user.userId}`);
    }
  }

  console.log(`\n=========================================`);
  console.log(`SUMMARY:`);
  console.log(`Total packages processed: ${completedStakingPackages.length}`);
  console.log(`Total users affected: ${affectedUsersCount}`);
  console.log(`Total amount to deduct: $${totalDeductions}`);
  console.log(`=========================================`);

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Script failed with error:', err);
  process.exit(1);
});
