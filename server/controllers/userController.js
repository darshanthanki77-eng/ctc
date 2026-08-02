const User = require('../models/User');
const MiningIncome = require('../models/MiningIncome');
const LevelIncome = require('../models/LevelIncome');
const Transaction = require('../models/Transaction');
const { rankBonusMap } = require('../cron/salaryCron');
const bcrypt = require('bcryptjs');
const UserPackage = require('../models/UserPackage');
const { getUserPromoInvestment } = require('../utils/userValidation');

const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('activePackage');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const getTeam = async (req, res, next) => {
  try {
    const directTeamRaw = await User.find({ sponsor: req.user._id }).select('-password');
    const directTeam = [];
    for (const member of directTeamRaw) {
      const promoInvestment = await getUserPromoInvestment(member._id);
      directTeam.push({
        ...member.toObject(),
        totalInvestment: promoInvestment
      });
    }
    
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
      const nextLevelMembers = [];
      for (const member of nextLevelMembersRaw) {
        const promoInvestment = await getUserPromoInvestment(member._id);
        nextLevelMembers.push({
          ...member.toObject(),
          totalInvestment: promoInvestment
        });
      }
      currentLevelMembers = nextLevelMembers;
      currentLevel++;
    }

    res.json({ directTeam, allLevels: levels });
  } catch (error) {
    next(error);
  }
};
const getMiningHistory = async (req, res, next) => {
  try {
    const history = await MiningIncome.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    next(error);
  }
};

const getLevelIncomeHistory = async (req, res, next) => {
  try {
    const history = await LevelIncome.find({ user: req.user._id })
      .populate('fromUser', 'userId fullName totalInvestment')
      .sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    const { fullName, email, mobile, address } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (email !== undefined) user.email = email;
    if (mobile !== undefined) user.mobile = mobile;
    if (address !== undefined) user.address = address;

    await user.save();

    const updatedUser = await User.findById(req.user._id).select('-password').populate('activePackage');
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new passwords' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

const getAnnouncement = async (req, res, next) => {
  try {
    const SystemSettings = require('../models/SystemSettings');
    const settings = await SystemSettings.findOne();
    res.json({ 
      announcementImage: settings ? settings.announcementImage : '',
      announcementImages: settings ? (settings.announcementImages || []) : [],
      announcementContent: settings ? settings.announcementContent : ''
    });
  } catch (error) {
    next(error);
  }
};

const getDepositAddresses = async (req, res, next) => {
  try {
    const SystemSettings = require('../models/SystemSettings');
    const settings = await SystemSettings.findOne();
    res.json({
      depositAddressMetaMask: settings && settings.depositAddressMetaMask ? settings.depositAddressMetaMask : '0x185018c5f26B2cE105e0B80b231178CE5913b621',
      depositAddressBep20: settings && settings.depositAddressBep20 ? settings.depositAddressBep20 : '0x8e4143b46eb1e1a6cbd71b5d57da95b985219f0b',
      depositAddressTrc20: settings && settings.depositAddressTrc20 ? settings.depositAddressTrc20 : 'TWJjGZJ73Q9x2hWpLRRreaxyvR9Eveoiv5',
      depositAddressINR: settings && settings.depositAddressINR ? settings.depositAddressINR : 'CTC Corp Bank - A/C: 1234567890, IFSC: UTIB00001234, Branch: Mumbai',
      upiIdINR: settings && settings.upiIdINR ? settings.upiIdINR : 'ctc@upi'
    });
  } catch (error) {
    next(error);
  }
};

const claimRankBonus = async (req, res, next) => {
  try {
    const { rank } = req.body;
    if (!rank) {
      return res.status(400).json({ message: 'Rank is required to claim bonus.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: 'User must be active to claim bonuses.' });
    }

    if (!user.unclaimedRankBonuses || !user.unclaimedRankBonuses.includes(rank)) {
      return res.status(400).json({ message: `Rank ${rank} bonus is not available to claim or has already been claimed.` });
    }

    // Double check if already in claimed
    if (!user.claimedRankBonuses) {
      user.claimedRankBonuses = [];
    }

    if (user.claimedRankBonuses.includes(rank)) {
      return res.status(400).json({ message: `Rank ${rank} bonus has already been claimed.` });
    }

    const bonusAmount = rankBonusMap[rank];
    if (!bonusAmount) {
      return res.status(400).json({ message: `No bonus config found for Rank ${rank}.` });
    }

    // Enforce dynamic cap before payout
    const userPackages = await UserPackage.find({ user: user._id, status: 'active' }).populate('packageId');
    const hasLandSecurity = userPackages.some(up => 
      up.packageId && up.packageId.name && up.packageId.name.toLowerCase().includes('land')
    );
    const multiplier = hasLandSecurity ? 1 : ((user.pins === 0) ? 1 : ((user.totalTeam > 0) ? 4 : 2));
    if (user.totalEarning >= user.totalInvestment * multiplier) {
      user.isActive = false;
      await user.save();
      return res.status(400).json({ message: `Cannot claim bonus: ${multiplier}x earning cap reached. User account deactivated.` });
    }

    // Move from unclaimed to claimed
    user.unclaimedRankBonuses = user.unclaimedRankBonuses.filter(r => r !== rank);
    user.claimedRankBonuses.push(rank);

    // Credit balance
    const activeStakedPkg = await UserPackage.findOne({
      user: user._id,
      status: 'active',
      $or: [
        { isStaked: true },
        { stakingEnabled: true }
      ],
      stakingEndDate: { $gt: new Date() }
    });

    if (activeStakedPkg) {
      user.lockedStakingIncome = (user.lockedStakingIncome || 0) + bonusAmount;
    } else {
      user.availableBalance += bonusAmount;
    }
    user.totalEarning += bonusAmount;
    user.promotionalIncome += bonusAmount;

    await user.save();

    // Create bonus transaction
    await Transaction.create({
      userId: user.userId,
      user: user._id,
      type: 'bonus',
      amount: bonusAmount,
      status: 'success'
    });

    console.log(`[BONUS CLAIMED] User ID: ${user.userId} manually claimed bonus for Rank ${rank}: $${bonusAmount}`);
    res.json({ success: true, rank, amount: bonusAmount });
  } catch (error) {
    next(error);
  }
};

const getDashboardSettings = async (req, res, next) => {
  try {
    const SystemSettings = require('../models/SystemSettings');
    const settings = await SystemSettings.findOne() || await SystemSettings.create({});
    res.json({
      transparencyProfitsThisWeek: settings.transparencyProfitsThisWeek || "+0.00%",
      transparencyProfitsLastWeek: settings.transparencyProfitsLastWeek || "+0.00%",
      transparencyProfitsLast30Days: settings.transparencyProfitsLast30Days || "+0.00%",
      transparencyPerformanceOverview: settings.transparencyPerformanceOverview || "0.00%",
      transparencyChartData: settings.transparencyChartData || [],
      liveTradingFeed: settings.liveTradingFeed || []
    });
  } catch (error) {
    next(error);
  }
};

const getTreeChildren = async (req, res, next) => {
  try {
    const { userId } = req.query;
    // Find the target user — either by DB _id or CTC userId string
    const targetUser = userId
      ? await User.findOne({ userId }).select('_id userId fullName totalInvestment isActive sponsor')
      : await User.findById(req.user._id).select('_id userId fullName totalInvestment isActive sponsor');

    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    // Direct children (users whose sponsor === targetUser._id)
    const children = await User.find({ sponsor: targetUser._id })
      .select('_id userId fullName totalInvestment isActive sponsor')
      .lean();

    // For each child, count how many direct children they have
    // so the frontend knows whether to show a "+" button
    const childrenWithMeta = await Promise.all(
      children.map(async (child) => {
        const childCount = await User.countDocuments({ sponsor: child._id });
        return { ...child, childrenCount: childCount };
      })
    );

    res.json({
      node: {
        _id: targetUser._id,
        userId: targetUser.userId,
        fullName: targetUser.fullName,
        totalInvestment: targetUser.totalInvestment,
        isActive: targetUser.isActive,
      },
      children: childrenWithMeta,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUserProfile, getTeam, getMiningHistory, getLevelIncomeHistory, updateUserProfile, changePassword, getAnnouncement, getDepositAddresses, claimRankBonus, getDashboardSettings, getTreeChildren };

