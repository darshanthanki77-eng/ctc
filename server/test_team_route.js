const mongoose = require('mongoose');
const User = require('./models/User');
const UserPackage = require('./models/UserPackage');
const Package = require('./models/Package');
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
    const targetUser = await User.findOne({ userId: 'CTC43214' });
    if (!targetUser) {
      console.log('User CTC43214 not found');
      process.exit();
    }

    console.log(`Testing getTeam for user: ${targetUser.userId} (${targetUser.fullName})`);

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

    console.log('Directs count:', directTeam.length);
    console.log('First Direct Member details:', directTeam[0] ? {
      userId: directTeam[0].userId,
      fullName: directTeam[0].fullName,
      totalInvestment: directTeam[0].totalInvestment
    } : 'none');

    console.log('Levels count:', levels.length);
    if (levels.length > 0) {
      console.log('Level 1 members count:', levels[0].members.length);
      console.log('Level 2 members count:', levels[1] ? levels[1].members.length : 0);
    }

  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
});
