const mongoose = require('mongoose');
const User = require('./models/User');
const UserPackage = require('./models/UserPackage');
const Package = require('./models/Package'); // Ensure registered
const LevelIncome = require('./models/LevelIncome');
const Transaction = require('./models/Transaction');

const prodURI = 'mongodb+srv://fanqie:fanqie123@cluster0.f8acy45.mongodb.net/CTC';

const getPromoInvestmentsForUsers = async (userIds) => {
  if (!userIds || userIds.length === 0) return {};
  const activePkgs = await UserPackage.find({ user: { $in: userIds }, status: 'active' }).populate('packageId');
  const investmentMap = {};
  
  for (const id of userIds) {
    investmentMap[id.toString()] = 0;
  }
  
  for (const pkg of activePkgs) {
    const userIdStr = pkg.user.toString();
    const isLand = (pkg.packageId && pkg.packageId.name && pkg.packageId.name.toLowerCase().includes('land')) || 
                   (pkg.name && pkg.name.toLowerCase().includes('land'));
    const amount = pkg.amount || 0;
    const value = isLand ? (amount * 0.5) : amount;
    investmentMap[userIdStr] = (investmentMap[userIdStr] || 0) + value;
  }
  return investmentMap;
};

mongoose.connect(prodURI).then(async () => {
  try {
    // Find a user who has a team
    const users = await User.find();
    console.log(`Connected to database. Total users: ${users.length}`);

    // Let's find a user who has at least one direct sponsor
    let targetUser = null;
    const allUsers = await User.find();
    for (const u of allUsers) {
      const directsCount = await User.countDocuments({ sponsor: u._id });
      if (directsCount > 0) {
        targetUser = u;
        break;
      }
    }

    if (!targetUser) {
      console.log('No user with directs found');
      process.exit();
    }

    console.log(`Testing getTeam for user: ${targetUser.userId}`);

    const directTeamRaw = await User.find({ sponsor: targetUser._id }).select('-password');
    const directTeamIds = directTeamRaw.map(m => m._id);
    const directInvestments = await getPromoInvestmentsForUsers(directTeamIds);
    
    const directTeam = directTeamRaw.map(member => ({
      ...member.toObject(),
      totalInvestment: directInvestments[member._id.toString()] || 0
    }));
    
    let levels = [];
    let currentLevelMembers = directTeam;
    let currentLevel = 1;
    const maxLevels = 1000;

    while (currentLevelMembers.length > 0 && currentLevel <= maxLevels) {
      levels.push({
        level: currentLevel,
        members: currentLevelMembers
      });

      const memberIds = currentLevelMembers.map(m => m._id);
      const nextLevelMembersRaw = await User.find({ sponsor: { $in: memberIds } }).select('-password');
      
      const nextLevelIds = nextLevelMembersRaw.map(m => m._id);
      const nextInvestments = await getPromoInvestmentsForUsers(nextLevelIds);
      
      const nextLevelMembers = nextLevelMembersRaw.map(member => ({
        ...member.toObject(),
        totalInvestment: nextInvestments[member._id.toString()] || 0
      }));
      
      currentLevelMembers = nextLevelMembers;
      currentLevel++;
    }

    console.log('✅ getTeam ran successfully!');
    console.log(`Direct Team count: ${directTeam.length}`);
    console.log(`Levels count: ${levels.length}`);
    
  } catch (err) {
    console.error('❌ Error running getTeam:', err);
  } finally {
    process.exit();
  }
});
