const mongoose = require('mongoose');
const User = require('./models/User');
const Package = require('./models/Package');
const UserPackage = require('./models/UserPackage');
const MiningIncome = require('./models/MiningIncome');
const LevelIncome = require('./models/LevelIncome');
const ReferralIncome = require('./models/ReferralIncome');

const prodURI = 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/CTC';

mongoose.connect(prodURI).then(async () => {
  console.log('Connected to DB.');
  const user = await User.findOne({ userId: 'CTC18052' });
  if (!user) {
    console.log('User CTC18052 not found.');
    process.exit(1);
  }
  console.log(`User ObjectId: ${user._id}`);
  
  // Find all packages for CTC18052
  const pkgs = await UserPackage.find({ user: user._id }).populate('packageId');
  console.log('\n--- Packages ---');
  for (const pkg of pkgs) {
    console.log(`ID: ${pkg._id}, Amount: $${pkg.amount}, CreatedAt: ${pkg.createdAt.toISOString()}, Status: ${pkg.status}`);
    
    // Find MiningIncomes (ROI) for this package
    const rois = await MiningIncome.find({ userPackageId: pkg._id });
    console.log(`  -> MiningIncomes (ROI) count: ${rois.length}, Total sum: $${rois.reduce((s, r) => s + r.amount, 0)}`);
    rois.forEach(r => {
      console.log(`     - ROI: $${r.amount}, Date: ${r.createdAt.toISOString()}`);
    });
  }

  // Find Level Incomes from CTC18052 to uplines
  const levels = await LevelIncome.find({ fromUser: user._id });
  console.log('\n--- Level Incomes from CTC18052 ---');
  console.log(`Count: ${levels.length}`);
  for (const l of levels) {
    const upUser = await User.findById(l.user);
    console.log(`  To Upline User ID: ${upUser?.userId} (${upUser?.fullName}), Level: ${l.level}, Amount: $${l.amount}, CreatedAt: ${l.createdAt.toISOString()}`);
  }

  // Find Referral Incomes from CTC18052 to uplines
  const referrals = await ReferralIncome.find({ fromUser: user._id });
  console.log('\n--- Referral Incomes from CTC18052 ---');
  console.log(`Count: ${referrals.length}`);
  for (const r of referrals) {
    const upUser = await User.findById(r.user);
    console.log(`  To Upline User ID: ${upUser?.userId} (${upUser?.fullName}), Level: ${r.level}, Income: $${r.income}, CreatedAt: ${r.createdAt.toISOString()}`);
  }

  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
