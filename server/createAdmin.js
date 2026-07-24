
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL    = 'admin@ctc.com';
const ADMIN_PASSWORD = 'Admin@1234';
const ADMIN_USER_ID  = 'CTC0001';
const ADMIN_NAME     = 'Super Admin';

async function createAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB connected');

  const User = require('./models/User');

  const existing = await User.findOne({ $or: [{ email: ADMIN_EMAIL }, { userId: ADMIN_USER_ID }] });
  if (existing) {
    // Update role to admin if already exists
    existing.role = 'admin';
    existing.isActive = true;
    await existing.save();
    console.log('⚠️  User already exists — updated role to admin');
    console.log('──────────────────────────────────────');
    console.log('  User ID  :', existing.userId);
    console.log('  Email    :', existing.email);
    console.log('  Role     :', existing.role);
    console.log('──────────────────────────────────────');
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await User.create({
    userId:        ADMIN_USER_ID,
    fullName:      ADMIN_NAME,
    email:         ADMIN_EMAIL,
    password:      hashedPassword,
    plainPassword: ADMIN_PASSWORD,
    role:          'admin',
    isActive:      true,
    isKYCVerified: true,
    pins:          99,
  });

  console.log('');
  console.log('🎉 Admin created successfully!');
  console.log('══════════════════════════════════════');
  console.log('  User ID   :', admin.userId);
  console.log('  Email     :', admin.email);
  console.log('  Password  :', ADMIN_PASSWORD);
  console.log('  Role      :', admin.role);
  console.log('══════════════════════════════════════');
  process.exit(0);
}

createAdmin().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
