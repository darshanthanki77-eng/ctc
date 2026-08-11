const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI;

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema, 'users');

const PackageSchema = new mongoose.Schema({}, { strict: false });
const Package = mongoose.model('Package', PackageSchema, 'packages');

const UserPackageSchema = new mongoose.Schema({}, { strict: false });
const UserPackage = mongoose.model('UserPackage', UserPackageSchema, 'userpackages');

const MiningIncomeSchema = new mongoose.Schema({}, { strict: false });
const MiningIncome = mongoose.model('MiningIncome', MiningIncomeSchema, 'miningincomes');

const SystemSettingsSchema = new mongoose.Schema({}, { strict: false });
const SystemSettings = mongoose.model('SystemSettings', SystemSettingsSchema, 'systemsettings');

const round6 = (num) => Math.round(num * 1000000) / 1000000;

async function run() {
  if (!mongoUri) {
    console.error('MONGO_URI is not defined in the environment.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  const settings = await SystemSettings.findOne() || { inrExchangeRate: 90 };
  const inrRate = settings.inrExchangeRate || 90;

  // 1. Find and delete package definitions with amount 125
  const packagesDefToRemove = await Package.find({
    $or: [
      { minAmount: 125 },
      { maxAmount: 125 }
    ]
  });
  console.log(`Found ${packagesDefToRemove.length} package definitions with amount $125 to remove.`);
  for (const p of packagesDefToRemove) {
    await Package.deleteOne({ _id: p._id });
    console.log(`- Deleted package definition: ${p.name} (ID: ${p._id})`);
  }

  // 2. Find all user packages with amount 125
  const packagesToRemove = await UserPackage.find({ amount: 125 });
  console.log(`Found ${packagesToRemove.length} user packages with amount $125 to remove.`);

  for (const pkg of packagesToRemove) {
    console.log(`\nProcessing UserPackage ID: ${pkg._id} for User: ${pkg.userId}`);

    // Find all mining incomes (ROI) associated with this package
    const associatedROI = await MiningIncome.find({ userPackageId: pkg._id });
    const totalRoiEarned = associatedROI.reduce((sum, item) => sum + (item.amount || 0), 0);
    console.log(`- Found ${associatedROI.length} ROI logs totaling $${totalRoiEarned} ($${totalRoiEarned * inrRate} INR)`);

    const user = await User.findById(pkg.user);
    if (user) {
      console.log(`- User balance before update:
        totalInvestment: $${user.totalInvestment}
        miningIncome: $${user.miningIncome}
        totalEarning: $${user.totalEarning}
        availableBalance: $${user.availableBalance}
        availableBalanceINR: ₹${user.availableBalanceINR || 0}`);

      // Adjust user fields
      user.totalInvestment = Math.max(0, round6(user.totalInvestment - pkg.amount));
      user.miningIncome = Math.max(0, round6(user.miningIncome - totalRoiEarned));
      user.totalEarning = Math.max(0, round6(user.totalEarning - totalRoiEarned));

      if (pkg.paymentMethod === 'INR') {
        const roiINR = totalRoiEarned * inrRate;
        user.availableBalanceINR = Math.max(0, round6((user.availableBalanceINR || 0) - roiINR));
      } else {
        user.availableBalance = Math.max(0, round6(user.availableBalance - totalRoiEarned));
      }

      await user.save();
      console.log(`- User balance updated successfully.`);
    } else {
      console.log(`- User ${pkg.userId} not found in database. Skipping user balance updates.`);
    }

    // Delete ROI logs
    const roiDeleteResult = await MiningIncome.deleteMany({ userPackageId: pkg._id });
    console.log(`- Deleted ${roiDeleteResult.deletedCount} MiningIncome (ROI) documents.`);

    // Delete UserPackage
    await UserPackage.deleteOne({ _id: pkg._id });
    console.log(`- Deleted UserPackage document.`);
  }

  console.log('\nMigration complete.');
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
