const mongoose = require('mongoose');

const mongoUri = 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/CTC';
const clusterUri = mongoUri.split('.net/')[0] + '.net/';

async function fixDatabase(dbName) {
  console.log(`\n========================================`);
  console.log(`Starting fix on database: ${dbName}`);
  console.log(`========================================`);

  const connection = mongoose.connection.useDb(dbName);

  const UserSchema = new mongoose.Schema({}, { strict: false });
  const User = connection.models[`User_${dbName}`] || connection.model(`User_${dbName}`, UserSchema, 'users');

  const UserPackageSchema = new mongoose.Schema({}, { strict: false });
  const UserPackage = connection.models[`UserPackage_${dbName}`] || connection.model(`UserPackage_${dbName}`, UserPackageSchema, 'userpackages');

  const users = await User.find({});
  let fixCount = 0;

  for (const user of users) {
    // Avoid schema validation error with _id
    if (!mongoose.Types.ObjectId.isValid(user._id)) {
      console.log(`Skipping user with invalid ObjectId _id: ${user._id}`);
      continue;
    }

    const pkgs = await UserPackage.find({ user: user._id });
    const sumNotCancelled = pkgs.filter(p => p.status !== 'cancelled').reduce((s, p) => s + p.amount, 0);

    if (user.totalInvestment !== sumNotCancelled) {
      console.log(`Mismatch found for User ID: ${user.userId} (${user.fullName})`);
      console.log(`  Stored totalInvestment: $${user.totalInvestment}`);
      console.log(`  Calculated (non-cancelled): $${sumNotCancelled}`);
      
      user.totalInvestment = sumNotCancelled;
      user.isActive = sumNotCancelled > 0;
      
      await User.updateOne(
        { _id: user._id },
        { $set: { totalInvestment: sumNotCancelled, isActive: sumNotCancelled > 0 } }
      );
      console.log(`  -> Updated totalInvestment to $${sumNotCancelled} and isActive to ${user.isActive}`);
      fixCount++;
    }
  }

  console.log(`Finished database: ${dbName}. Fixed ${fixCount} users.\n`);
}

async function run() {
  console.log('Connecting to MongoDB Cluster...');
  await mongoose.connect(clusterUri);
  console.log('Connected.');

  const adminDb = mongoose.connection.client.db().admin();
  const dbsList = await adminDb.listDatabases();
  const targetDbs = [];

  for (const dbInfo of dbsList.databases) {
    if (['admin', 'local'].includes(dbInfo.name)) continue;
    try {
      const db = mongoose.connection.client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      if (collections.some(c => c.name === 'userpackages')) {
        targetDbs.push(dbInfo.name);
      }
    } catch (e) {
      // Skip unauthorized databases
    }
  }

  console.log('Detected target databases:', targetDbs);

  for (const dbName of targetDbs) {
    await fixDatabase(dbName);
  }

  console.log('All updates complete.');
  process.exit(0);
}

run().catch(err => {
  console.error('Fix script failed:', err);
  process.exit(1);
});
