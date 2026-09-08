require('dotenv').config();
const mongoose = require('mongoose');
const Package = require('./models/Package');

const liveTradingPackages = [
  {
    name: 'Live Trading Tier 1',
    minAmount: 1100,
    maxAmount: 5000,
    dailyProfit: 0,
    validity: 36500,
    packageType: 'live_trading',
    roiFrequency: 'monthly',
    monthlyRoiMin: 10,
    monthlyRoiMax: 15,
    isReferralOnly: false,
    isZeroPin: false,
    status: true
  },
  {
    name: 'Live Trading Tier 2',
    minAmount: 10000,
    maxAmount: 25000,
    dailyProfit: 0,
    validity: 36500,
    packageType: 'live_trading',
    roiFrequency: 'monthly',
    monthlyRoiMin: 10,
    monthlyRoiMax: 15,
    isReferralOnly: false,
    isZeroPin: false,
    status: true
  }
];

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ctc').then(async () => {
  console.log('Connected to MongoDB.');
  
  for (const pkgData of liveTradingPackages) {
    const updatedPkg = await Package.findOneAndUpdate(
      { name: pkgData.name },
      { $set: pkgData },
      { new: true, upsert: true }
    );
    console.log(`Package "${updatedPkg.name}" upserted successfully: min=$${updatedPkg.minAmount}, max=$${updatedPkg.maxAmount}, monthlyRoi=${updatedPkg.monthlyRoiMin}%-${updatedPkg.monthlyRoiMax}%, type=${updatedPkg.packageType}`);
  }
  
  console.log('Live Trading packages seeding complete.');
  process.exit(0);
}).catch(err => {
  console.error('Error seeding live trading packages:', err);
  process.exit(1);
});
