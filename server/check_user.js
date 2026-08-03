const mongoose = require('mongoose');
const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Withdrawal = require('./models/Withdrawal');
const Package = require('./models/Package');
require('dotenv').config({path: './.env'});

const prodURI = 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/CTC';

mongoose.connect(prodURI).then(async () => {
  const UserPackage = require('./models/UserPackage');
  const user = await User.findOne({ userId: 'CTC18052' });
  if (!user) {
    console.log('User CTC18052 not found on production database');
    process.exit();
  }
  
  console.log('=========================================');
  console.log('👤 USER PROFILE:');
  console.log('=========================================');
  console.log(`User ID: ${user.userId}`);
  console.log(`Full Name: ${user.fullName}`);
  console.log(`Available Balance: $${user.availableBalance}`);
  console.log(`Total Earning: $${user.totalEarning}`);
  console.log(`Mining Income: $${user.miningIncome}`);
  console.log(`Referral Income: $${user.referralIncome}`);
  console.log(`Level Income: $${user.levelIncome}`);
  console.log(`Promotional Income: $${user.promotionalIncome}`);
  console.log(`Locked Staking Income: $${user.lockedStakingIncome}`);
  
  console.log('\n=========================================');
  console.log('📦 USER PACKAGES:');
  console.log('=========================================');
  const pkgs = await UserPackage.find({ user: user._id }).populate('packageId');
  pkgs.forEach((p, idx) => {
    console.log(`${idx + 1}. Pkg: ${p.packageId?.name || p.name || 'N/A'}`);
    console.log(`   Amount: $${p.amount}`);
    console.log(`   Compounding Balance: $${p.compoundingBalance}`);
    console.log(`   Total Earned: $${p.totalEarned}`);
    console.log(`   Status: ${p.status}`);
    console.log(`   isStaked: ${p.isStaked}`);
    console.log(`   stakingEnabled: ${p.stakingEnabled}`);
    console.log(`   isStakingReleased: ${p.isStakingReleased}`);
    console.log(`   stakingDuration: ${p.stakingDuration} days`);
    console.log(`   stakingEndDate: ${p.stakingEndDate ? p.stakingEndDate.toISOString() : 'N/A'}`);
  });

  console.log('\n=========================================');
  console.log('💵 TRANSACTIONS:');
  console.log('=========================================');
  const txs = await Transaction.find({ user: user._id }).sort({ createdAt: 1 });
  txs.forEach(t => {
    console.log(`  Tx: type=${t.type}, amount=$${t.amount}, status=${t.status}, hash=${t.txHash || 'N/A'}, date=${t.createdAt.toISOString()}`);
  });

  console.log('\n=========================================');
  console.log('📤 WITHDRAWALS:');
  console.log('=========================================');
  const withdrawals = await Withdrawal.find({ user: user._id });
  withdrawals.forEach(w => {
    console.log(`  Withdrawal: amount=$${w.amount}, status=${w.status}, date=${w.createdAt.toISOString()}`);
  });

  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
