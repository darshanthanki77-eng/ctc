const mongoose = require('mongoose');

const prodURI = 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/CTC';
const round6 = (num) => Math.round(num * 1000000) / 1000000;

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(prodURI);
  console.log('Connected.');

  const User = require('./models/User');
  const MiningIncome = require('./models/MiningIncome');

  const users = await User.find({});
  let updateCount = 0;

  for (const user of users) {
    const rois = await MiningIncome.find({ user: user._id });
    const calculatedRoi = rois.reduce((s, r) => s + r.amount, 0);

    const diff = user.miningIncome - calculatedRoi;

    if (diff > 0.01) {
      console.log(`\nUser ID: ${user.userId} (${user.fullName})`);
      console.log(`  Stored ROI: $${user.miningIncome} | Actual ROI: $${calculatedRoi} | Diff (to deduct): $${diff}`);
      console.log(`  Current availableBalance: $${user.availableBalance} -> New: $${Math.max(0, round6(user.availableBalance - diff))}`);
      console.log(`  Current totalEarning: $${user.totalEarning} -> New: $${Math.max(0, round6(user.totalEarning - diff))}`);

      user.miningIncome = calculatedRoi;
      user.totalEarning = Math.max(0, round6(user.totalEarning - diff));
      user.availableBalance = Math.max(0, round6(user.availableBalance - diff));

      // Avoid trigger model overwrite / pre-save schema issues by using updateOne directly
      await User.updateOne(
        { _id: user._id },
        { 
          $set: { 
            miningIncome: user.miningIncome, 
            totalEarning: user.totalEarning,
            availableBalance: user.availableBalance
          } 
        }
      );
      
      updateCount++;
    }
  }

  console.log(`\nSuccessfully corrected ROI balance for ${updateCount} users.`);
  process.exit(0);
}

run().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
