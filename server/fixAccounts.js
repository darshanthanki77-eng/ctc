require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function fixAccounts() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB connected');

  const User = require('./models/User');

  // 1. Reset Admin Password & Ensure Role
  const adminPassword = 'Admin@1234';
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  let admin = await User.findOne({ userId: 'CTC0001' });
  if (admin) {
    admin.password = hashedAdminPassword;
    admin.plainPassword = adminPassword;
    admin.role = 'admin';
    admin.isActive = true;
    await admin.save();
    console.log('✅ Admin account (CTC0001) password reset to Admin@1234');
  } else {
    admin = await User.create({
      userId: 'CTC0001',
      fullName: 'Super Admin',
      email: 'admin@ctc.com',
      password: hashedAdminPassword,
      plainPassword: adminPassword,
      role: 'admin',
      isActive: true,
      isKYCVerified: true,
      pins: 99,
    });
    console.log('✅ Admin account created (CTC0001)');
  }

  // 2. Create standard User account for logging into User Dashboard (localhost:5176)
  const userPassword = 'User@1234';
  const hashedUserPassword = await bcrypt.hash(userPassword, 10);

  let testUser = await User.findOne({ userId: 'CTC10001' });
  if (testUser) {
    testUser.password = hashedUserPassword;
    testUser.plainPassword = userPassword;
    testUser.role = 'user';
    testUser.isActive = true;
    await testUser.save();
    console.log('✅ Test user account (CTC10001) password set to User@1234');
  } else {
    testUser = await User.create({
      userId: 'CTC10001',
      fullName: 'Test User',
      email: 'testuser@ctc.com',
      password: hashedUserPassword,
      plainPassword: userPassword,
      role: 'user',
      sponsorId: 'CTC0001',
      isActive: true,
      isKYCVerified: true,
      pins: 1,
    });
    console.log('✅ Test user account created (CTC10001)');
  }

  console.log('\n======================================');
  console.log('🔑 CREDENTIALS DETAILS:');
  console.log('--------------------------------------');
  console.log('1️⃣ ADMIN PORTAL (http://localhost:5200/admin/)');
  console.log('   User ID : CTC0001');
  console.log('   Password: Admin@1234');
  console.log('--------------------------------------');
  console.log('2️⃣ USER DASHBOARD (http://localhost:5176/login)');
  console.log('   User ID : CTC10001');
  console.log('   Password: User@1234');
  console.log('======================================\n');

  process.exit(0);
}

fixAccounts().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
