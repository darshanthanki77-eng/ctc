const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');
const Package = require('../models/Package');
const KYC = require('../models/KYC');
const SystemSettings = require('../models/SystemSettings');
const AuditLog = require('../models/AuditLog');
const UserPackage = require('../models/UserPackage');
const ManualPackageBuy = require('../models/ManualPackageBuy');
const CronState = require('../models/CronState');
const ReferralIncome = require('../models/ReferralIncome');
const LevelIncome = require('../models/LevelIncome');
const MiningIncome = require('../models/MiningIncome');
const { verifyWithdrawalTransaction } = require('../services/blockchainService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateAdminToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// @desc    Authenticate an admin user only
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res, next) => {
  try {
    const { userId, password } = req.body;
    if (!userId || !password) {
      return res.status(400).json({ message: 'Please provide User ID and password.' });
    }

    const searchId = userId.trim().toUpperCase();
    const user = await User.findOne({ userId: searchId });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (user.role !== 'admin' && user.role !== 'subadmin') {
      return res.status(403).json({ message: 'Access Denied: Not authorized as Administrator.' });
    }

    return res.json({
      _id: user.id,
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      accessiblePages: user.accessiblePages,
      token: generateAdminToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    
    const deposits = await UserPackage.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const withdrawals = await Withdrawal.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const activePackages = await Package.countDocuments({ status: true });

    // Aggregate last 7 days of daily trends
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyDeposits = await Transaction.aggregate([
      { $match: { type: 'deposit', status: 'success', createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailyWithdrawals = await Withdrawal.aggregate([
      { $match: { status: 'approved', createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dailyRoi = await MiningIncome.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];

      const depositObj = dailyDeposits.find(x => x._id === dateString);
      const withdrawalObj = dailyWithdrawals.find(x => x._id === dateString);
      const roiObj = dailyRoi.find(x => x._id === dateString);

      chartData.push({
        name: dateString.split('-').slice(1).join('/'),
        deposits: depositObj ? depositObj.total : 0,
        withdrawals: withdrawalObj ? withdrawalObj.total : 0,
        roi: roiObj ? roiObj.total : 0
      });
    }

    res.json({
      totalUsers,
      activeUsers,
      totalDeposits: deposits[0] ? deposits[0].total : 0,
      totalWithdrawals: withdrawals[0] ? withdrawals[0].total : 0,
      activePackages,
      chartData
    });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    
    const withdrawalsData = await Withdrawal.aggregate([
      { $match: { status: { $in: ['approved', 'completed', 'success'] } } },
      { $group: { _id: '$user', totalWithdrawn: { $sum: '$amount' } } }
    ]);
    
    const withdrawalMap = {};
    withdrawalsData.forEach(w => {
      if (w._id) {
        withdrawalMap[w._id.toString()] = w.totalWithdrawn;
      }
    });
    
    const usersWithWithdrawn = users.map(user => {
      const userObj = user.toObject();
      userObj.totalWithdrawn = withdrawalMap[user._id.toString()] || 0;
      return userObj;
    });

    res.json(usersWithWithdrawn);
  } catch (error) {
    next(error);
  }
};

const approveKYC = async (req, res, next) => {
  try {
    const kyc = await KYC.findById(req.params.id);
    if (!kyc) return res.status(404).json({ message: 'KYC not found' });

    kyc.status = 'approved';
    kyc.verifiedBy = req.user._id;
    await kyc.save();

    const user = await User.findById(kyc.user);
    if (user) {
      user.isKYCVerified = true;
      await user.save();
    }

    res.json({ message: 'KYC Approved', kyc });
  } catch (error) {
    next(error);
  }
};

const approveWithdrawal = async (req, res, next) => {
  try {
    const { txHash } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id).populate('user');
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });

    // Auto-generate transaction hash if not provided (for instant manual admin approval)
    const effectiveTxHash = txHash?.trim() || `manual_${withdrawal._id}_${Date.now()}`;

    // Check for duplicate transaction (only for real on-chain hashes)
    if (txHash && !txHash.startsWith('mock_') && !txHash.startsWith('manual_')) {
      const existingTx = await Transaction.findOne({ txHash: effectiveTxHash });
      if (existingTx) {
        return res.status(400).json({ message: 'This transaction hash has already been used. Duplicate transactions are not allowed.' });
      }
    }

    // Verify withdrawal payout transaction on blockchain (bypasses for mock/manual)
    const verification = await verifyWithdrawalTransaction(effectiveTxHash, withdrawal.finalAmount, withdrawal.walletAddress);
    if (!verification.status) {
      return res.status(400).json({ message: verification.message });
    }

    withdrawal.status = 'approved';
    withdrawal.approvedBy = req.user._id;
    withdrawal.approvedAt = Date.now();
    withdrawal.txHash = effectiveTxHash;
    await withdrawal.save();

    await Transaction.create({
      userId: withdrawal.userId,
      user: withdrawal.user ? withdrawal.user._id : null,
      type: 'withdrawal',
      amount: withdrawal.amount,
      status: 'success',
      walletAddress: withdrawal.walletAddress,
      txHash: effectiveTxHash,
      chainId: verification.chainId || '56',
      tokenContract: verification.tokenContract,
      blockNumber: verification.blockNumber || 0,
      confirmationCount: verification.confirmationCount || 1
    });

    const io = req.app.get('io');
    if (io && withdrawal.user) {
      io.to(withdrawal.user._id.toString()).emit('notification', `Your withdrawal of $${withdrawal.amount} has been approved.`);
    }

    // Send withdrawal approval email
    if (withdrawal.user && withdrawal.user.email) {
      const { sendWithdrawalApprovedEmail } = require('../services/emailService');
      sendWithdrawalApprovedEmail(
        withdrawal.user.email,
        withdrawal.user.fullName || 'User',
        withdrawal.amount,
        effectiveTxHash
      );
    }

    res.json({ message: 'Withdrawal Approved Successfully', withdrawal });
  } catch (error) {
    next(error);
  }
};

const createPackage = async (req, res, next) => {
  try {
    if (req.body.dailyProfitPercent !== undefined) {
      req.body.dailyProfit = Number(req.body.dailyProfitPercent);
    }
    if (req.body.validity === undefined) {
      req.body.validity = 36500; // Default to lifetime
    }
    const pkg = await Package.create(req.body);
    res.status(201).json({ message: 'Package created', pkg: { ...pkg.toObject(), dailyProfitPercent: pkg.dailyProfit } });
  } catch (error) {
    next(error);
  }
};

const getTreasuryStats = async (req, res, next) => {
  try {
    const settings = await SystemSettings.findOne() || await SystemSettings.create({});
    
    // Active liabilities: total pending ROI remaining across all active packages
    const activePackages = await UserPackage.find({ status: 'active' });
    let activeLiabilities = 0;
    activePackages.forEach(pkg => {
      const remainingCap = (pkg.amount * 4) - pkg.totalEarned;
      if (remainingCap > 0) activeLiabilities += remainingCap;
    });

    const pendingWithdrawals = await Withdrawal.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const todaysWithdrawals = await Withdrawal.aggregate([
      { $match: { status: { $in: ['approved', 'completed'] }, createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      settings,
      activeLiabilities,
      pendingPayouts: pendingWithdrawals[0] ? pendingWithdrawals[0].total : 0,
      dailyWithdrawals: todaysWithdrawals[0] ? todaysWithdrawals[0].total : 0,
      treasuryReserves: settings.treasuryReserves,
      riskAlerts: settings.treasuryReserves < settings.emergencyThreshold ? ['RESERVES_CRITICAL'] : []
    });
  } catch (error) {
    next(error);
  }
};

const updateTreasurySettings = async (req, res, next) => {
  try {
    const updates = req.body;
    let settings = await SystemSettings.findOne();
    if (!settings) settings = await SystemSettings.create({});
    
    const allowedFields = [
      'maintenanceMode', 'payoutPause', 'withdrawalFreeze', 'treasuryProtectionMode',
      'globalRoiMultiplier', 'minWithdrawalAmount', 'maxDailyWithdrawalAmount',
      'withdrawalCooldownHours', 'manualWithdrawalApproval', 'treasuryReserves', 
      'emergencyThreshold', 'announcementImage', 'announcementImages', 'announcementContent',
      'depositAddressMetaMask', 'depositAddressBep20', 'depositAddressTrc20',
      'depositAddressINR', 'upiIdINR',
      'transparencyProfitsThisWeek', 'transparencyProfitsLastWeek', 'transparencyProfitsLast30Days',
      'transparencyPerformanceOverview', 'transparencyChartData', 'liveTradingFeed'
    ];
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        settings[field] = updates[field];
      }
    });

    await settings.save();
    
    await AuditLog.create({
      action: 'TREASURY_MODE_CHANGE',
      adminId: req.user._id,
      details: { updates }
    });

    res.json({ message: 'Treasury settings updated successfully', settings });
  } catch (error) {
    next(error);
  }
};

const rejectKYC = async (req, res, next) => {
  try {
    const kyc = await KYC.findById(req.params.id);
    if (!kyc) return res.status(404).json({ message: 'KYC not found' });

    kyc.status = 'rejected';
    kyc.verifiedBy = req.user._id;
    await kyc.save();

    const user = await User.findById(kyc.user);
    if (user) {
      user.isKYCVerified = false;
      await user.save();
    }

    res.json({ message: 'KYC Rejected', kyc });
  } catch (error) {
    next(error);
  }
};

const rejectWithdrawal = async (req, res, next) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });

    withdrawal.status = 'rejected';
    withdrawal.approvedBy = req.user._id;
    withdrawal.approvedAt = Date.now();
    await withdrawal.save();

    // Revert available balance back to the user
    const user = await User.findById(withdrawal.user);
    if (user) {
      if (withdrawal.currency === 'INR') {
        user.availableBalanceINR = Math.round(((user.availableBalanceINR || 0) + withdrawal.amount) * 1000000) / 1000000;
      } else {
        user.availableBalance = Math.round((user.availableBalance + withdrawal.amount) * 1000000) / 1000000;
      }
      await user.save();
    }

    await Transaction.create({
      userId: withdrawal.userId,
      user: withdrawal.user,
      type: 'bonus', // Revert transactions
      amount: withdrawal.amount,
      status: 'failed',
      description: 'Withdrawal rejected & refunded'
    });

    res.json({ message: 'Withdrawal Rejected', withdrawal });
  } catch (error) {
    next(error);
  }
};

const toggleBlockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBlocked = !user.isBlocked;
    await user.save();

    await AuditLog.create({
      action: user.isBlocked ? 'BLOCK_USER' : 'UNBLOCK_USER',
      adminId: req.user._id,
      details: { targetUser: user.userId }
    });

    res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, user });
  } catch (error) {
    next(error);
  }
};

const togglePrincipalWithdrawal = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.principalWithdrawalDisabled = !user.principalWithdrawalDisabled;
    await user.save();

    await AuditLog.create({
      action: user.principalWithdrawalDisabled ? 'DISABLE_PRINCIPAL_WITHDRAWAL' : 'ENABLE_PRINCIPAL_WITHDRAWAL',
      adminId: req.user._id,
      details: { targetUser: user.userId }
    });

    res.json({ message: `Principal withdrawal ${user.principalWithdrawalDisabled ? 'disabled' : 'enabled'} successfully`, user });
  } catch (error) {
    next(error);
  }
};

const getAllWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await Withdrawal.find().populate('user', 'email fullName userId');
    res.json(withdrawals);
  } catch (error) {
    next(error);
  }
};

const getAllKYCs = async (req, res, next) => {
  try {
    const kycs = await KYC.find().populate('user', 'email fullName userId phone mobile profilePic');
    res.json(kycs);
  } catch (error) {
    next(error);
  }
};

const getAllPackages = async (req, res, next) => {
  try {
    const packages = await Package.find();
    const formatted = packages.map(pkg => ({
      ...pkg.toObject(),
      dailyProfitPercent: pkg.dailyProfit
    }));
    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

const getUserPackages = async (req, res, next) => {
  try {
    const userPackages = await UserPackage.find()
      .populate('user', 'email fullName userId')
      .populate('packageId')
      .sort({ createdAt: -1 });
    res.json(userPackages);
  } catch (error) {
    next(error);
  }
};

const updatePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (req.body.dailyProfitPercent !== undefined) {
      req.body.dailyProfit = Number(req.body.dailyProfitPercent);
    }
    const pkg = await Package.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ message: 'Package updated', pkg: pkg ? { ...pkg.toObject(), dailyProfitPercent: pkg.dailyProfit } : null });
  } catch (error) {
    next(error);
  }
};

const getCronStatus = async (req, res, next) => {
  try {
    const states = await CronState.find();
    const MiningIncome = require('../models/MiningIncome');
    
    
    // Aggregate daily ROI workflow runs by date and 12-hour cycle window (UTC 0 / UTC 12)
    const aggregatedRuns = await MiningIncome.aggregate([
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            hourGroup: { $cond: [{ $lt: [{ $hour: '$createdAt' }, 12] }, '0', '12'] },
            triggerType: { $ifNull: ['$triggerType', 'Manual'] }
          },
          accountsProcessed: { $sum: 1 },
          totalAmountDistributed: { $sum: '$amount' },
          firstExecutedAt: { $min: '$createdAt' },
          lastExecutedAt: { $max: '$createdAt' }
        }
      },
      { $sort: { lastExecutedAt: -1 } },
      { $limit: 500 }
    ]);

    const totalRuns = aggregatedRuns.length;

    // Transform into GitHub Action workflow run objects
    const workflowRuns = aggregatedRuns.map((run, index) => {
      const runNumber = totalRuns - index;
      const isManual = run._id.triggerType === 'Manual';
      const cycleHour = run._id.hourGroup;
      const cycleId = `MINING_${run._id.date}_${cycleHour}`;

      return {
        id: `${run._id.date}_${cycleHour}_${run._id.triggerType}`,
        runNumber: runNumber,
        name: 'Mining Cron (Direct)',
        cycleId: cycleId,
        event: isManual ? 'workflow_dispatch' : 'scheduled',
        triggerType: isManual ? 'Manual Trigger' : 'Scheduled',
        status: 'success',
        branch: 'main',
        accountsProcessed: run.accountsProcessed,
        totalAmountDistributed: run.totalAmountDistributed,
        timestamp: run.lastExecutedAt,
        dateStr: run._id.date,
        hourGroup: cycleHour
      };
    });

    const totalDistributed = await MiningIncome.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalCount = await MiningIncome.countDocuments();

    res.json({
      states,
      workflowRuns,
      summary: {
        totalAmount: totalDistributed[0]?.total || 0,
        totalLogsCount: totalCount,
        totalRunsCount: totalRuns
      }
    });
  } catch (error) {
    next(error);
  }
};

const triggerMiningCron = async (req, res, next) => {
  try {
    const { runMiningCronCycle } = require('../cron/miningCron');
    const result = await runMiningCronCycle(true); // force = true
    res.json({ message: 'Mining cron manually executed', result });
  } catch (error) {
    next(error);
  }
};

const getCronRunDetails = async (req, res, next) => {
  try {
    const { date, triggerType, hourGroup } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    const MiningIncome = require('../models/MiningIncome');

    let startDate = new Date(`${date}T00:00:00.000Z`);
    let endDate = new Date(`${date}T23:59:59.999Z`);

    if (hourGroup === '0') {
      endDate = new Date(`${date}T11:59:59.999Z`);
    } else if (hourGroup === '12') {
      startDate = new Date(`${date}T12:00:00.000Z`);
    }

    const query = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (triggerType) {
      const lowerType = triggerType.toLowerCase();
      if (lowerType.includes('manual')) {
        query.$or = [
          { triggerType: { $in: ['Manual', 'Manual Trigger'] } },
          { isManual: true }
        ];
      } else if (lowerType.includes('auto') || lowerType.includes('schedul')) {
        query.$or = [
          { triggerType: { $in: ['Auto', 'Scheduled'] } },
          { isManual: { $ne: true } }
        ];
      }
    }

    const records = await MiningIncome.find(query)
      .populate('user', 'userId fullName email availableBalance totalEarning totalInvestment')
      .populate('userPackageId')
      .sort({ createdAt: -1 });

    const totalDistributed = records.reduce((sum, r) => sum + (r.amount || 0), 0);

    res.json({
      runInfo: {
        date,
        triggerType: triggerType || 'All',
        totalAccounts: records.length,
        totalDistributed,
        timestamp: records[0]?.createdAt || startDate
      },
      records
    });
  } catch (error) {
    next(error);
  }
};

const impersonateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    res.json({
      _id: user._id,
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isKYCVerified: user.isKYCVerified,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const getAllTransactions = async (req, res, next) => {
  try {
    const txsPromise = Transaction.find().populate('user', 'email fullName userId');
    const pkgsPromise = UserPackage.find().populate('user', 'email fullName userId').populate('packageId');
    const referralsPromise = ReferralIncome.find().populate('user', 'email fullName userId');

    const [txs, pkgs, referrals] = await Promise.all([txsPromise, pkgsPromise, referralsPromise]);

    const investmentHistory = pkgs.map(pkg => ({
      _id: pkg._id,
      userId: pkg.user?.userId || 'N/A',
      user: pkg.user,
      type: 'investment',
      description: `Purchased ${pkg.packageId?.name || 'Standard Package'}`,
      amount: pkg.amount,
      txHash: pkg.txHash || 'System',
      status: pkg.status === 'cancelled' ? 'failed' : 'success',
      createdAt: pkg.startDate || pkg.createdAt
    }));

    const referralHistory = referrals.map(ref => ({
      _id: ref._id,
      userId: ref.user?.userId || 'N/A',
      user: ref.user,
      type: 'referral',
      description: `Direct Referral Commission from ${ref.fromUserId}`,
      amount: ref.income,
      txHash: 'System',
      status: 'success',
      createdAt: ref.createdAt
    }));

    const formattedTxs = txs.map(tx => {
      const txObj = tx.toObject();
      if (!txObj.description) {
        if (txObj.type === 'deposit') txObj.description = 'Account Funding';
        else if (txObj.type === 'withdrawal') txObj.description = 'Funds Withdrawal';
        else if (txObj.type === 'bonus') txObj.description = 'Rank Achievement Bonus';
        else if (txObj.type === 'salary') txObj.description = 'Leadership Salary';
        else txObj.description = 'Platform Activity';
      }
      return {
        ...txObj,
        userId: txObj.user?.userId || txObj.userId || 'N/A'
      };
    });

    const combinedHistory = [...formattedTxs, ...investmentHistory, ...referralHistory]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(combinedHistory);
  } catch (error) {
    next(error);
  }
};

const getAllDownlineIds = async (parentUserId) => {
  let downlineIds = [];
  let currentLevelIds = [parentUserId];
  while (currentLevelIds.length > 0) {
    const nextLevelUsers = await User.find({ sponsor: { $in: currentLevelIds } }, { _id: 1 });
    const nextLevelIds = nextLevelUsers.map(u => u._id);
    downlineIds.push(...nextLevelIds);
    currentLevelIds = nextLevelIds;
  }
  return downlineIds;
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      email,
      isActive,
      availableBalance,
      availableBalanceINR,
      miningIncome,
      referralIncome,
      levelIncome,
      promotionalIncome,
      sponsorId,
      rank,
      pins,
      manualLevelQualified,
      withdrawalWallet,
      withdrawalPin,
      achieverBadge,
      password,
      role,
      accessiblePages
    } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (fullName !== undefined) user.fullName = fullName;
    if (email !== undefined) user.email = email;
    if (isActive !== undefined) user.isActive = isActive;
    if (availableBalance !== undefined) user.availableBalance = Number(availableBalance);
    if (availableBalanceINR !== undefined) user.availableBalanceINR = Number(availableBalanceINR);
    if (miningIncome !== undefined) user.miningIncome = Number(miningIncome);
    if (referralIncome !== undefined) user.referralIncome = Number(referralIncome);
    if (levelIncome !== undefined) user.levelIncome = Number(levelIncome);
    if (promotionalIncome !== undefined) user.promotionalIncome = Number(promotionalIncome);
    if (rank !== undefined) {
      user.rank = rank;
      user.isRankManuallySet = (rank !== 'None');
    }
    if (pins !== undefined) user.pins = Number(pins);
    if (manualLevelQualified !== undefined) user.manualLevelQualified = Number(manualLevelQualified);
    if (withdrawalWallet !== undefined) user.withdrawalWallet = withdrawalWallet;
    if (withdrawalPin !== undefined) user.withdrawalPin = withdrawalPin;
    if (achieverBadge !== undefined) user.achieverBadge = achieverBadge;
    if (role !== undefined) user.role = role;
    if (accessiblePages !== undefined) user.accessiblePages = accessiblePages;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      user.plainPassword = password;
    }

    if (sponsorId !== undefined && sponsorId !== user.sponsorId) {
      const cleanSponsorId = sponsorId ? sponsorId.trim().toUpperCase() : '';
      if (!cleanSponsorId) {
        return res.status(400).json({ message: 'Sponsor ID cannot be empty.' });
      }
      if (cleanSponsorId === user.userId) {
        return res.status(400).json({ message: 'A user cannot be their own sponsor.' });
      }

      const sponsorUser = await User.findOne({ userId: cleanSponsorId });
      if (!sponsorUser) {
        return res.status(400).json({ message: `Sponsor ID ${sponsorId} does not exist.` });
      }

      const downlineIds = await getAllDownlineIds(user._id);
      if (downlineIds.some(id => id.toString() === sponsorUser._id.toString())) {
        return res.status(400).json({ message: 'Circular sponsoring detected: Sponsor cannot be one of the user\'s downlines.' });
      }

      const oldSponsorIdObj = user.sponsor;
      let oldSponsor = null;
      if (oldSponsorIdObj) {
        oldSponsor = await User.findById(oldSponsorIdObj);
      }

      const subtreeSize = 1 + (user.totalTeam || 0);

      // 1. Decrement old sponsor & ancestors team stats
      if (oldSponsor) {
        oldSponsor.directTeam = Math.max(0, (oldSponsor.directTeam || 0) - 1);
        oldSponsor.totalTeam = Math.max(0, (oldSponsor.totalTeam || 0) - subtreeSize);
        await oldSponsor.save();

        let currentSponsorId = oldSponsor.sponsor;
        let levelsChecked = 1;
        while (currentSponsorId && levelsChecked < 30) {
          const ancestor = await User.findById(currentSponsorId);
          if (ancestor) {
            ancestor.totalTeam = Math.max(0, (ancestor.totalTeam || 0) - subtreeSize);
            await ancestor.save();
            currentSponsorId = ancestor.sponsor;
          } else {
            break;
          }
          levelsChecked++;
        }
      }

      // 2. Increment new sponsor & ancestors team stats
      sponsorUser.directTeam = (sponsorUser.directTeam || 0) + 1;
      sponsorUser.totalTeam = (sponsorUser.totalTeam || 0) + subtreeSize;
      await sponsorUser.save();

      let currentSponsorId = sponsorUser.sponsor;
      let levelsChecked = 1;
      while (currentSponsorId && levelsChecked < 30) {
        const ancestor = await User.findById(currentSponsorId);
        if (ancestor) {
          ancestor.totalTeam = (ancestor.totalTeam || 0) + subtreeSize;
          await ancestor.save();
          currentSponsorId = ancestor.sponsor;
        } else {
          break;
        }
        levelsChecked++;
      }

      // 3. Update level stats for user and their downline tree
      const oldLevel = user.level || 0;
      const newLevel = (sponsorUser.level || 0) + 1;
      const levelDiff = newLevel - oldLevel;
      
      user.sponsorId = cleanSponsorId;
      user.sponsor = sponsorUser._id;
      user.level = newLevel;

      if (levelDiff !== 0 && downlineIds.length > 0) {
        await User.updateMany({ _id: { $in: downlineIds } }, { $inc: { level: levelDiff } });
      }

      // 4. Shift direct referral and level incomes (Level 1) from old sponsor to new sponsor
      if (oldSponsor) {
        const referralIncomes = await ReferralIncome.find({
          fromUser: user._id,
          user: oldSponsor._id
        });

        const levelIncomes = await LevelIncome.find({
          fromUser: user._id,
          user: oldSponsor._id,
          level: 1
        });

        const totalReferralShift = referralIncomes.reduce((sum, r) => sum + r.income, 0);
        const totalLevelShift = levelIncomes.reduce((sum, l) => sum + l.amount, 0);
        const totalIncomeShift = totalReferralShift + totalLevelShift;

        if (totalIncomeShift > 0) {
          // Deduct from old sponsor
          if (totalReferralShift > 0) {
            oldSponsor.referralIncome = Math.max(0, (oldSponsor.referralIncome || 0) - totalReferralShift);
          }
          if (totalLevelShift > 0) {
            oldSponsor.levelIncome = Math.max(0, (oldSponsor.levelIncome || 0) - totalLevelShift);
          }
          oldSponsor.totalEarning = Math.max(0, (oldSponsor.totalEarning || 0) - totalIncomeShift);

          let remainingDeduction = totalIncomeShift;
          if (oldSponsor.lockedStakingIncome && oldSponsor.lockedStakingIncome > 0) {
            const lockedDeduct = Math.min(oldSponsor.lockedStakingIncome, remainingDeduction);
            oldSponsor.lockedStakingIncome -= lockedDeduct;
            remainingDeduction -= lockedDeduct;
          }
          if (remainingDeduction > 0) {
            oldSponsor.availableBalance = Math.max(0, (oldSponsor.availableBalance || 0) - remainingDeduction);
          }
          await oldSponsor.save();

          // Add to new sponsor
          if (totalReferralShift > 0) {
            sponsorUser.referralIncome = (sponsorUser.referralIncome || 0) + totalReferralShift;
          }
          if (totalLevelShift > 0) {
            sponsorUser.levelIncome = (sponsorUser.levelIncome || 0) + totalLevelShift;
          }
          sponsorUser.totalEarning = (sponsorUser.totalEarning || 0) + totalIncomeShift;

          // Check if new sponsor has active staked package
          const newSponsorStakedPkg = await UserPackage.findOne({
            user: sponsorUser._id,
            status: 'active',
            $or: [
              { isStaked: true },
              { stakingEnabled: true }
            ],
            stakingEndDate: { $gt: new Date() }
          });

          if (newSponsorStakedPkg) {
            sponsorUser.lockedStakingIncome = (sponsorUser.lockedStakingIncome || 0) + totalIncomeShift;
          } else {
            sponsorUser.availableBalance = (sponsorUser.availableBalance || 0) + totalIncomeShift;
          }
          await sponsorUser.save();

          // Update database records
          if (referralIncomes.length > 0) {
            await ReferralIncome.updateMany(
              { fromUser: user._id, user: oldSponsor._id },
              { $set: { user: sponsorUser._id, userId: sponsorUser.userId } }
            );
          }
          if (levelIncomes.length > 0) {
            await LevelIncome.updateMany(
              { fromUser: user._id, user: oldSponsor._id, level: 1 },
              { $set: { user: sponsorUser._id, userId: sponsorUser.userId } }
            );
          }
        }
      }
    }

    await user.save();

    await AuditLog.create({
      action: 'ADMIN_UPDATE_USER',
      adminId: req.user._id,
      details: { targetUser: user.userId, updates: req.body }
    });

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    next(error);
  }
};

const assignPackage = async (req, res, next) => {
  try {
    const { userId, packageId, amount, stakingDuration, paymentMethod = 'INR' } = req.body;

    if (!userId || !packageId || !amount) {
      return res.status(400).json({ message: 'User ID, Package, and Amount are required.' });
    }

    // Find the user by custom userId or email
    const user = await User.findOne({
      $or: [
        { userId: userId.trim().toUpperCase() },
        { email: userId.trim() }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' });
    }

    const numericAmount = Number(amount);
    if (numericAmount < pkg.minAmount || numericAmount > pkg.maxAmount) {
      return res.status(400).json({ message: `Amount must be between $${pkg.minAmount} and $${pkg.maxAmount} for this package.` });
    }

    // Zero-pin restriction checks
    if (user.pins === 0) {
      if (!pkg.isZeroPin) {
        return res.status(400).json({ message: 'Only the standard $100-$500 Zero Pin Package is available for 0-Pin users.' });
      }
    } else {
      if (pkg.isZeroPin) {
        return res.status(400).json({ message: 'This package is only available for 0-Pin users.' });
      }
    }

    const stakingDurationNum = Number(stakingDuration || 0);
    if (![0, 30, 90, 180, 360].includes(stakingDurationNum)) {
      return res.status(400).json({ message: 'Invalid staking duration. Must be 30, 90, 180, or 360 days.' });
    }

    // No upgrades: multiple packages can be active simultaneously

    const isStaked = stakingDurationNum > 0;
    const durationDays = isStaked ? stakingDurationNum : pkg.validity;

    const userPackage = await UserPackage.create({
      userId: user.userId,
      user: user._id,
      packageId: pkg._id,
      amount: numericAmount,
      compoundingBalance: numericAmount,
      dailyProfitPercent: pkg.dailyProfit,
      endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      isBVEligible: true,
      isStaked,
      stakingDuration: stakingDurationNum,
      isZeroPin: pkg.isZeroPin,
      stakingEnabled: isStaked,
      stakingPeriod: stakingDurationNum,
      stakingStartDate: isStaked ? new Date() : undefined,
      stakingEndDate: isStaked ? new Date(Date.now() + stakingDurationNum * 24 * 60 * 60 * 1000) : undefined,
      autoCompounding: isStaked,
      paymentMethod: paymentMethod === 'INR' ? 'INR' : 'Crypto'
    });

    // Note: user.isActive is NOT set to true here. Admin must manually activate the user ID.
    user.activePackage = pkg._id;
    user.totalInvestment += numericAmount; // Expands their 4x global cap
    await user.save();

    await AuditLog.create({
      action: 'PACKAGE_ACTIVATION',
      userId: user._id,
      adminId: req.user._id,
      packageId: userPackage._id,
      amount: numericAmount,
      details: {
        isManualAssignment: true,
        targetUser: user.userId,
        isUpgrade: false
      }
    });

    await Transaction.create({
      userId: user.userId,
      user: user._id,
      type: 'deposit',
      amount: numericAmount,
      txHash: 'ADMIN_MANUAL_ASSIGN',
      status: 'success',
      description: `Manual package assignment by Admin: ${pkg.name} (Payment: ${paymentMethod})`
    });

    if (user.sponsor) {
      // Direct referral income is disabled in this project
      // const { distributeDirectReferral } = require('../services/referralService');
      // await distributeDirectReferral(user.sponsor, numericAmount, user.userId, user._id);
      
      // Check Fastrack Bonus for Sponsor
      const sponsor = await User.findById(user.sponsor);
      if (sponsor && !sponsor.fastrackQualified) {
        const sponsorPkg = await UserPackage.findOne({ user: sponsor._id, status: 'active' }).sort({ createdAt: -1 });
        if (sponsorPkg) {
          const tenDaysAgo = new Date();
          tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
          
          if (sponsorPkg.createdAt >= tenDaysAgo) {
            // Count unique directs with same or qualifying package (excluding 0-pin users)
            const qualifyingDirects = await UserPackage.distinct('user', {
              user: { $in: await User.find({ sponsor: sponsor._id, pins: { $gt: 0 } }).distinct('_id') },
              amount: { $gte: sponsorPkg.amount },
              status: 'active'
            });

            if (qualifyingDirects.length >= 5) {
              sponsor.fastrackQualified = true;
              await sponsor.save();
            }
          }
        }
      }
    }

    res.json({ message: 'Package manually assigned and activated successfully', userPackage });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userToDelete.role === 'admin') {
      return res.status(400).json({ message: 'Admin accounts cannot be deleted.' });
    }

    const userIdStr = userToDelete.userId;

    // 1. Update direct referrals' sponsor pointers to bypass this user
    const parentSponsor = userToDelete.sponsor || null;
    const parentSponsorId = userToDelete.sponsorId || '';
    
    await User.updateMany(
      { sponsor: userToDelete._id },
      { $set: { sponsor: parentSponsor, sponsorId: parentSponsorId } }
    );

    // 2. Cascade delete all associated records
    const LevelIncome = require('../models/LevelIncome');
    const Reward = require('../models/Reward');

    await UserPackage.deleteMany({ user: userToDelete._id });
    await Transaction.deleteMany({ user: userToDelete._id });
    await MiningIncome.deleteMany({ user: userToDelete._id });
    await LevelIncome.deleteMany({ $or: [{ user: userToDelete._id }, { fromUser: userToDelete._id }] });
    await ReferralIncome.deleteMany({ $or: [{ user: userToDelete._id }, { fromUser: userToDelete._id }] });
    await Withdrawal.deleteMany({ user: userToDelete._id });
    await KYC.deleteMany({ user: userToDelete._id });
    await Reward.deleteMany({ user: userToDelete._id });
    await AuditLog.deleteMany({ userId: userToDelete._id });

    // 3. Delete the User itself
    await User.deleteOne({ _id: userToDelete._id });

    // 4. Log the admin action
    await AuditLog.create({
      action: 'ADMIN_ACTION',
      adminId: req.user._id,
      details: { reason: 'User Deleted by Admin', targetUserId: userIdStr, targetUserObjId: id }
    });

    res.json({ message: `User ${userIdStr} and all associated records have been successfully deleted.` });
  } catch (error) {
    next(error);
  }
};

const getAllManualBuys = async (req, res, next) => {
  try {
    const requests = await ManualPackageBuy.find()
      .populate('user', 'email fullName userId')
      .populate('targetUser', 'email fullName userId')
      .populate('packageId')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    next(error);
  }
};

const approveManualBuy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const manualRequest = await ManualPackageBuy.findById(id);
    if (!manualRequest) {
      return res.status(404).json({ message: 'Manual package buy request not found.' });
    }

    if (manualRequest.status !== 'pending') {
      return res.status(400).json({ message: `This request is already ${manualRequest.status}.` });
    }

    const buyer = await User.findById(manualRequest.user);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer user not found.' });
    }

    // Retrieve target user (if topped up another ID, else default to buyer)
    const targetUserIdObj = manualRequest.targetUser || manualRequest.user;
    const targetUser = await User.findById(targetUserIdObj);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found.' });
    }

    const pkg = await Package.findById(manualRequest.packageId);
    if (!pkg) {
      return res.status(404).json({ message: 'Package not found.' });
    }

    const amount = manualRequest.amount;
    const txHash = manualRequest.txHash;
    const senderAddress = manualRequest.senderAddress;
    const networkType = manualRequest.networkType;

    const durationDays = pkg.validity;
    const userPackage = await UserPackage.create({
      userId: targetUser.userId,
      user: targetUser._id,
      packageId: pkg._id,
      amount,
      compoundingBalance: amount,
      dailyProfitPercent: pkg.dailyProfit,
      endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      isBVEligible: true,
      isStaked: false,
      stakingDuration: 0,
      isZeroPin: pkg.isZeroPin,
      stakingEnabled: false,
      stakingPeriod: 0,
      autoCompounding: false,
      paymentMethod: manualRequest.networkType === 'INR' ? 'INR' : 'Crypto'
    });

    targetUser.activePackage = pkg._id;
    targetUser.totalInvestment += amount;
    await targetUser.save();

    await AuditLog.create({
      action: 'PACKAGE_ACTIVATION',
      userId: targetUser._id,
      adminId: req.user._id,
      packageId: userPackage._id,
      amount,
      details: {
        txHash,
        networkType,
        isManualBuyApproval: true,
        buyerId: buyer.userId,
        isUpgrade: false
      }
    });

    await Transaction.create({
      userId: targetUser.userId,
      user: targetUser._id,
      type: 'deposit',
      amount,
      txHash,
      walletAddress: senderAddress || 'System Manual Approve',
      status: 'success',
      description: `Manual package buy approved by Admin (Network: ${networkType})`
    });

    // Check Fastrack Bonus for Sponsor
    if (targetUser.sponsor) {
      const sponsor = await User.findById(targetUser.sponsor);
      if (sponsor && !sponsor.fastrackQualified) {
        const sponsorPkg = await UserPackage.findOne({ user: sponsor._id, status: 'active' }).sort({ createdAt: -1 });
        if (sponsorPkg) {
          const tenDaysAgo = new Date();
          tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

          if (sponsorPkg.createdAt >= tenDaysAgo) {
            const qualifyingDirects = await UserPackage.distinct('user', {
              user: { $in: await User.find({ sponsor: sponsor._id, pins: { $gt: 0 } }).distinct('_id') },
              amount: { $gte: sponsorPkg.amount },
              status: 'active'
            });

            if (qualifyingDirects.length >= 5) {
              sponsor.fastrackQualified = true;
              await sponsor.save();
            }
          }
        }
      }
    }

    // Update ManualPackageBuy request status
    manualRequest.status = 'approved';
    manualRequest.approvedBy = req.user._id;
    manualRequest.approvedAt = new Date();
    await manualRequest.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('new_deposit', { user: targetUser.userId, amount });
      io.to(targetUser._id.toString()).emit('notification', `Manual purchase of package ${pkg.name} has been approved.`);
      if (buyer._id.toString() !== targetUser._id.toString()) {
        io.to(buyer._id.toString()).emit('notification', `Manual top-up of User ID ${targetUser.userId} has been approved.`);
      }
    }

    res.json({ message: 'Manual package buy request approved and activated successfully.', manualRequest });
  } catch (error) {
    next(error);
  }
};

const rejectManualBuy = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    const manualRequest = await ManualPackageBuy.findById(id);
    if (!manualRequest) {
      return res.status(404).json({ message: 'Manual package buy request not found.' });
    }

    if (manualRequest.status !== 'pending') {
      return res.status(400).json({ message: `This request is already ${manualRequest.status}.` });
    }

    // Refund locked wallet amount if present
    if (manualRequest.walletAmountPaid && manualRequest.walletAmountPaid > 0) {
      const buyer = await User.findById(manualRequest.user);
      if (buyer) {
        buyer.availableBalance = Math.round((buyer.availableBalance + manualRequest.walletAmountPaid) * 1000000) / 1000000;
        await buyer.save();

        await Transaction.create({
          userId: buyer.userId,
          user: buyer._id,
          type: 'deposit',
          amount: manualRequest.walletAmountPaid,
          status: 'success',
          txHash: `REFUND_TOPUP_${manualRequest._id}`,
          description: `Refund for rejected manual top-up request (ID: ${manualRequest._id})`
        });
      }
    }

    manualRequest.status = 'rejected';
    manualRequest.rejectedBy = req.user._id;
    manualRequest.rejectedAt = new Date();
    manualRequest.rejectionReason = rejectionReason || 'Payment details incorrect or unverified.';
    await manualRequest.save();

    const io = req.app.get('io');
    if (io) {
      io.to(manualRequest.user.toString()).emit('notification', `Manual purchase request of amount $${manualRequest.amount} was rejected: ${manualRequest.rejectionReason}`);
    }

    res.json({ message: 'Manual package buy request rejected successfully.', manualRequest });
  } catch (error) {
    next(error);
  }
};

const runInrMigration = async (req, res, next) => {
  try {
    const userIds = [
      'CTC14507',
      'CTC83462',
      'CTC40102',
      'CTC20610',
      'CTC71132',
      'CTC64659',
      'CTC79734',
      'CTC33197'
    ];

    const UserPackage = require('../models/UserPackage');
    const User = require('../models/User');
    const SystemSettings = require('../models/SystemSettings');

    const settings = await SystemSettings.findOne() || { inrExchangeRate: 90 };
    const inrRate = settings.inrExchangeRate || 90;
    
    const report = [];

    for (const userId of userIds) {
      const user = await User.findOne({ userId: userId.trim() });
      if (!user) {
        report.push({ userId, status: 'Not Found' });
        continue;
      }

      // 1. Convert current available balance in USD to INR
      const usdBalance = user.availableBalance || 0;
      let inrEquivalent = 0;
      if (usdBalance > 0) {
        inrEquivalent = Math.round(usdBalance * inrRate * 100) / 100;
        user.availableBalanceINR = (user.availableBalanceINR || 0) + inrEquivalent;
        user.availableBalance = 0;
        await user.save();
      }

      // 2. Update all packages to paymentMethod: 'INR'
      const pkgResult = await UserPackage.updateMany(
        { user: user._id },
        { $set: { paymentMethod: 'INR' } }
      );

      report.push({
        userId,
        fullName: user.fullName,
        convertedUSDBalance: usdBalance,
        addedINRBalance: inrEquivalent,
        updatedPackagesCount: pkgResult.modifiedCount
      });
    }

    res.json({ message: 'Migration to INR completed successfully', report });
  } catch (error) {
    next(error);
  }
};

const syncAllUserBalances = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const UserPackage = require('../models/UserPackage');
    const Withdrawal = require('../models/Withdrawal');
    const SystemSettings = require('../models/SystemSettings');

    const settings = await SystemSettings.findOne() || { inrExchangeRate: 90 };
    const inrRate = settings.inrExchangeRate || 90;

    const users = await User.find();
    const report = [];

    for (const u of users) {
      const userPackages = await UserPackage.find({ user: u._id });
      let activeStakedROI_INR = 0;
      let activeStakedROI_USDT = 0;
      let hasINR = false;
      let hasCrypto = false;
      
      for (const p of userPackages) {
        const isStakedPkg = p.isStaked || p.stakingEnabled;
        const isINR = p.paymentMethod === 'INR';
        if (isINR) hasINR = true;
        else hasCrypto = true;

        if (isStakedPkg && p.status === 'active') {
          const compROI = Math.max(0, (p.compoundingBalance || 0) - (p.amount || 0));
          if (isINR) {
            activeStakedROI_INR += compROI * inrRate;
          } else {
            activeStakedROI_USDT += compROI;
          }
        }
      }

      const inrWithdrawals = await Withdrawal.find({ user: u._id, currency: 'INR', status: { $ne: 'rejected' } });
      const totalWithdrawnINR = inrWithdrawals.reduce((sum, w) => sum + w.amount, 0);

      const usdtWithdrawals = await Withdrawal.find({ user: u._id, currency: { $ne: 'INR' }, status: { $ne: 'rejected' } });
      const totalWithdrawnUSDT = usdtWithdrawals.reduce((sum, w) => sum + w.amount, 0);

      let expectedINR = 0;
      let expectedUSDT = 0;

      if (hasINR && !hasCrypto) {
        const totalIncomeUSD = (u.miningIncome || 0) + (u.referralIncome || 0) + (u.levelIncome || 0) + (u.promotionalIncome || 0);
        expectedINR = Math.max(0, Math.round((totalIncomeUSD * inrRate - activeStakedROI_INR - totalWithdrawnINR) * 100) / 100);
        expectedUSDT = 0;
      } else if (!hasINR && hasCrypto) {
        const totalIncomeUSD = (u.miningIncome || 0) + (u.referralIncome || 0) + (u.levelIncome || 0) + (u.promotionalIncome || 0);
        expectedUSDT = Math.max(0, Math.round((totalIncomeUSD - activeStakedROI_USDT - (u.lockedStakingIncome || 0) - totalWithdrawnUSDT) * 100) / 100);
        expectedINR = 0;
      } else {
        expectedINR = Math.max(0, u.availableBalanceINR || 0);
        expectedUSDT = Math.max(0, u.availableBalance || 0);
      }

      const oldINR = u.availableBalanceINR || 0;
      const oldUSDT = u.availableBalance || 0;

      if (Math.abs(oldINR - expectedINR) > 0.05 || Math.abs(oldUSDT - expectedUSDT) > 0.05) {
        u.availableBalanceINR = expectedINR;
        u.availableBalance = expectedUSDT;
        await u.save();
        report.push({
          userId: u.userId,
          fullName: u.fullName,
          oldINR,
          newINR: expectedINR,
          oldUSDT,
          newUSDT: expectedUSDT
        });
      }
    }

    res.json({ message: 'User balances synced successfully', updatedUsersCount: report.length, report });
  } catch (error) {
    next(error);
  }
};

const extendStakingPeriod = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const UserPackage = require('../models/UserPackage');

    const targetUserIds = ['CTC11893', 'CTC33482'];
    const report = [];

    // Calculate end date for 20 days from now
    const twentyDaysFromNow = new Date();
    twentyDaysFromNow.setDate(twentyDaysFromNow.getDate() + 20);

    for (const userId of targetUserIds) {
      const user = await User.findOne({ userId });
      if (!user) {
        report.push({ userId, status: 'User not found' });
        continue;
      }

      // Find all packages of the user that are staked, compounding, or completed
      const packages = await UserPackage.find({ 
        user: user._id,
        $or: [
          { isStaked: true },
          { stakingEnabled: true },
          { isStakingReleased: true },
          { stakingEndDate: { $lte: new Date() } }
        ]
      });

      const updatedPkgs = [];
      let totalDeduction = 0;

      for (const p of packages) {
        const isAlreadyExtended = p.stakingEndDate && p.stakingEndDate > new Date() && !p.isStakingReleased;

        if (isAlreadyExtended) {
          // If it was already extended but the compoundingBalance was reset incorrectly, correct it
          const correctBalance = p.amount + (p.totalEarned || 0);
          if (p.compoundingBalance < correctBalance) {
            const diff = correctBalance - p.compoundingBalance;
            p.compoundingBalance = correctBalance;
            await p.save();
            updatedPkgs.push(p._id);
            totalDeduction += diff;
          }
        } else {
          // This package completed its period and needs to be extended now
          const releasedROI = p.totalEarned || 0;
          p.compoundingBalance = p.amount + releasedROI;
          p.stakingEndDate = twentyDaysFromNow;
          p.stakingPeriod = 20;
          p.isStaked = true;
          p.stakingEnabled = true;
          p.autoCompounding = true;
          p.isStakingReleased = false;

          await p.save();
          updatedPkgs.push(p._id);
          totalDeduction += releasedROI;
        }
      }

      // Deduct the correction/released amount from user's available balance
      if (totalDeduction > 0) {
        user.availableBalance = Math.max(0, Math.round(((user.availableBalance || 0) - totalDeduction) * 100) / 100);
        await user.save();
      }

      report.push({
        userId,
        fullName: user.fullName,
        deductedFromBalance: totalDeduction,
        newAvailableBalance: user.availableBalance,
        updatedPackagesCount: updatedPkgs.length,
        updatedPackages: updatedPkgs
      });
    }

    res.json({ message: 'Staking periods extended successfully', report });
  } catch (error) {
    next(error);
  }
};

const MonthlyRoiDistribution = require('../models/MonthlyRoiDistribution');

const previewMonthlyLiveTradingRoi = async (req, res, next) => {
  try {
    const { monthYear = new Date().toISOString().substring(0, 7), tier1RoiPercent = 12, tier2RoiPercent = 12 } = req.query;
    
    const t1Percent = Number(tier1RoiPercent) || 12;
    const t2Percent = Number(tier2RoiPercent) || 12;

    const round6 = (num) => Math.round(num * 1000000) / 1000000;
    const settings = await SystemSettings.findOne() || { inrExchangeRate: 90 };
    const inrRate = settings.inrExchangeRate || 90;

    const livePackages = await UserPackage.find({
      status: 'active',
      endDate: { $gt: new Date() }
    }).populate('packageId').populate('user', 'userId fullName email availableBalance availableBalanceINR totalInvestment totalEarning');

    const filtered = livePackages.filter(p => p.packageId && p.packageId.packageType === 'live_trading');

    const existingDistribution = await MonthlyRoiDistribution.findOne({ monthYear, status: 'success' });

    let tier1Count = 0;
    let tier1Capital = 0;
    let tier1InvestorPayoutUSD = 0;
    let tier1LevelPayoutUSD = 0;

    let tier2Count = 0;
    let tier2Capital = 0;
    let tier2InvestorPayoutUSD = 0;
    let tier2LevelPayoutUSD = 0;

    const details = filtered.map(pkg => {
      const isTier2 = pkg.amount >= 10000 || (pkg.packageId && pkg.packageId.minAmount >= 10000);
      const tierName = isTier2 ? 'Tier 2 ($10,000 - $25,000)' : 'Tier 1 ($1,100 - $5,000)';
      const roiRate = isTier2 ? t2Percent : t1Percent;

      const grossRoiUSD = round6(pkg.amount * (roiRate / 100));
      const investorPayoutUSD = round6(grossRoiUSD * 0.50);
      const levelBaseAmountUSD = round6(grossRoiUSD * 0.30);
      const investorPayoutINR = round6(investorPayoutUSD * inrRate);

      if (isTier2) {
        tier2Count++;
        tier2Capital += pkg.amount;
        tier2InvestorPayoutUSD += investorPayoutUSD;
        tier2LevelPayoutUSD += levelBaseAmountUSD;
      } else {
        tier1Count++;
        tier1Capital += pkg.amount;
        tier1InvestorPayoutUSD += investorPayoutUSD;
        tier1LevelPayoutUSD += levelBaseAmountUSD;
      }

      return {
        userPackageId: pkg._id,
        userId: pkg.user?.userId || pkg.userId,
        userName: pkg.user?.fullName || 'N/A',
        packageTier: tierName,
        amount: pkg.amount,
        paymentMethod: pkg.paymentMethod || 'INR',
        roiPercent: roiRate,
        grossRoiUSD,
        investorPayoutUSD,
        investorPayoutINR,
        levelBaseAmountUSD
      };
    });

    const totalCapitalUSD = tier1Capital + tier2Capital;
    const totalInvestorPayoutUSD = tier1InvestorPayoutUSD + tier2InvestorPayoutUSD;
    const totalLevelPayoutUSD = tier1LevelPayoutUSD + tier2LevelPayoutUSD;

    res.json({
      monthYear,
      isAlreadyDistributed: !!existingDistribution,
      existingDistribution,
      inrRate,
      tier1: {
        percent: t1Percent,
        count: tier1Count,
        capitalUSD: tier1Capital,
        investorPayoutUSD: tier1InvestorPayoutUSD,
        levelPayoutUSD: tier1LevelPayoutUSD
      },
      tier2: {
        percent: t2Percent,
        count: tier2Count,
        capitalUSD: tier2Capital,
        investorPayoutUSD: tier2InvestorPayoutUSD,
        levelPayoutUSD: tier2LevelPayoutUSD
      },
      summary: {
        totalPackages: filtered.length,
        totalCapitalUSD,
        totalInvestorPayoutUSD,
        totalInvestorPayoutINR: round6(totalInvestorPayoutUSD * inrRate),
        totalLevelPayoutUSD
      },
      packages: details
    });
  } catch (error) {
    next(error);
  }
};

const distributeMonthlyLiveTradingRoi = async (req, res, next) => {
  try {
    const { monthYear, tier1RoiPercent, tier2RoiPercent, force = false, notes = '' } = req.body;

    if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
      return res.status(400).json({ message: 'Valid month format (YYYY-MM) is required.' });
    }

    const t1Percent = Number(tier1RoiPercent);
    const t2Percent = Number(tier2RoiPercent);

    if (isNaN(t1Percent) || t1Percent < 10 || t1Percent > 15) {
      return res.status(400).json({ message: 'Tier 1 ROI percentage must be between 10% and 15%.' });
    }

    if (isNaN(t2Percent) || t2Percent < 10 || t2Percent > 15) {
      return res.status(400).json({ message: 'Tier 2 ROI percentage must be between 10% and 15%.' });
    }

    const existing = await MonthlyRoiDistribution.findOne({ monthYear, status: 'success' });
    if (existing && !force) {
      return res.status(400).json({ 
        message: `Monthly Live Trading ROI for ${monthYear} was already distributed on ${new Date(existing.createdAt).toLocaleString()}. Use force flag to re-run.` 
      });
    }

    const round6 = (num) => Math.round(num * 1000000) / 1000000;
    const settings = await SystemSettings.findOne() || { inrExchangeRate: 90 };
    const inrRate = settings.inrExchangeRate || 90;

    const livePackages = await UserPackage.find({
      status: 'active',
      endDate: { $gt: new Date() }
    }).populate('packageId');

    const eligiblePkgs = livePackages.filter(p => p.packageId && p.packageId.packageType === 'live_trading');

    if (eligiblePkgs.length === 0) {
      return res.status(400).json({ message: 'No active Live Trading packages found to distribute ROI.' });
    }

    const { getUserMultiplier, isStrictlyActiveUser } = require('../utils/userValidation');
    const { distributeLevelIncome } = require('../services/levelService');
    const MiningIncome = require('../models/MiningIncome');

    let totalCapitalUSD = 0;
    let totalInvestorPayoutUSD = 0;
    let totalInvestorPayoutINR = 0;
    let totalLevelPayoutUSD = 0;
    let totalLevelPayoutINR = 0;
    const payoutDetails = [];

    for (const pkg of eligiblePkgs) {
      const user = await User.findById(pkg.user);
      if (!user) continue;

      const isTier2 = pkg.amount >= 10000 || (pkg.packageId && pkg.packageId.minAmount >= 10000);
      const tierName = isTier2 ? 'Tier 2' : 'Tier 1';
      const roiRate = isTier2 ? t2Percent : t1Percent;

      const grossRoiUSD = round6(pkg.amount * (roiRate / 100));
      const investorShareUSD = round6(grossRoiUSD * 0.50); // 50% to investor
      const levelBaseAmountUSD = round6(grossRoiUSD * 0.30); // 30% to level pool

      // Check user cap
      const isActive = await isStrictlyActiveUser(user, pkg);
      const maxCapMultiplier = await getUserMultiplier(user, pkg);
      const pkgRemainingCap = (pkg.amount * maxCapMultiplier) - pkg.totalEarned;
      const userRemainingCap = (user.totalInvestment * maxCapMultiplier) - user.totalEarning;
      const maxAllowedProfit = Math.min(pkgRemainingCap, userRemainingCap);

      let actualInvestorPayout = Math.min(investorShareUSD, maxAllowedProfit);
      if (actualInvestorPayout < 0) actualInvestorPayout = 0;
      actualInvestorPayout = round6(actualInvestorPayout);

      let investorPayoutINR = 0;
      if (actualInvestorPayout > 0) {
        if (pkg.paymentMethod === 'INR') {
          investorPayoutINR = round6(actualInvestorPayout * inrRate);
          user.availableBalanceINR = round6((user.availableBalanceINR || 0) + investorPayoutINR);
          totalInvestorPayoutINR += investorPayoutINR;
        } else {
          user.availableBalance = round6(user.availableBalance + actualInvestorPayout);
        }

        user.miningIncome = round6(user.miningIncome + actualInvestorPayout);
        user.totalEarning = round6(user.totalEarning + actualInvestorPayout);
        pkg.totalEarned = round6(pkg.totalEarned + actualInvestorPayout);

        // Cap check
        let capHit = false;
        if (pkg.totalEarned >= pkg.amount * maxCapMultiplier || user.totalEarning >= user.totalInvestment * maxCapMultiplier) {
          pkg.status = 'completed';
          user.isActive = false;
          capHit = true;
        }

        await user.save();
        await pkg.save();

        // Create MiningIncome record
        await MiningIncome.create({
          userId: user.userId,
          user: user._id,
          packageId: pkg.packageId._id,
          userPackageId: pkg._id,
          amount: actualInvestorPayout,
          percentage: roiRate * 0.50,
          triggerType: `Monthly Live Trading (${monthYear})`,
          isManual: true
        });

        // Audit Log
        await AuditLog.create({
          action: 'LIVE_TRADING_MONTHLY_ROI',
          userId: user._id,
          packageId: pkg._id,
          amount: actualInvestorPayout,
          details: { 
            monthYear, 
            roiRate, 
            grossRoiUSD, 
            investorSharePercent: 50, 
            paymentMethod: pkg.paymentMethod,
            investorPayoutINR: pkg.paymentMethod === 'INR' ? investorPayoutINR : 0,
            capHit 
          }
        });
      }

      // Distribute 30% Level Income
      if (user.pins && user.pins > 0 && levelBaseAmountUSD > 0) {
        await distributeLevelIncome(user._id, levelBaseAmountUSD, user.userId, pkg.paymentMethod || 'INR');
        if (pkg.paymentMethod === 'INR') {
          totalLevelPayoutINR += round6(levelBaseAmountUSD * inrRate);
        } else {
          totalLevelPayoutUSD += levelBaseAmountUSD;
        }
      }

      totalCapitalUSD += pkg.amount;
      totalInvestorPayoutUSD += actualInvestorPayout;

      payoutDetails.push({
        userPackageId: pkg._id,
        userId: user.userId,
        packageTier: tierName,
        amount: pkg.amount,
        roiPercent: roiRate,
        grossRoiUSD,
        investorPayoutUSD: actualInvestorPayout,
        investorPayoutINR: pkg.paymentMethod === 'INR' ? investorPayoutINR : 0,
        levelBaseAmountUSD,
        paymentMethod: pkg.paymentMethod || 'INR'
      });
    }

    // Record distribution
    const distributionRecord = await MonthlyRoiDistribution.create({
      monthYear,
      tier1RoiPercent: t1Percent,
      tier2RoiPercent: t2Percent,
      totalPackagesProcessed: payoutDetails.length,
      totalCapitalUSD: round6(totalCapitalUSD),
      totalInvestorPayoutUSD: round6(totalInvestorPayoutUSD),
      totalInvestorPayoutINR: round6(totalInvestorPayoutINR),
      totalLevelPayoutUSD: round6(totalLevelPayoutUSD),
      totalLevelPayoutINR: round6(totalLevelPayoutINR),
      executedBy: req.user?._id,
      executedByName: req.user?.fullName || req.user?.userId || 'Admin',
      status: 'success',
      payoutDetails,
      notes
    });

    res.json({
      message: `Monthly Live Trading ROI for ${monthYear} distributed successfully!`,
      distribution: distributionRecord
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyLiveTradingHistory = async (req, res, next) => {
  try {
    const history = await MonthlyRoiDistribution.find().sort({ createdAt: -1 });
    res.json(history);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  deleteUser,
  adminLogin,
  getDashboardStats,
  getAllUsers,
  approveKYC,
  rejectKYC,
  approveWithdrawal,
  rejectWithdrawal,
  createPackage,
  getTreasuryStats,
  updateTreasurySettings,
  toggleBlockUser,
  togglePrincipalWithdrawal,
  getAllWithdrawals,
  getAllKYCs,
  getAllPackages,
  getUserPackages,
  updatePackage,
  getCronStatus,
  getCronRunDetails,
  triggerMiningCron,
  getAllTransactions,
  updateUser,
  impersonateUser,
  assignPackage,
  getAllManualBuys,
  approveManualBuy,
  rejectManualBuy,
  runInrMigration,
  syncAllUserBalances,
  extendStakingPeriod,
  previewMonthlyLiveTradingRoi,
  distributeMonthlyLiveTradingRoi,
  getMonthlyLiveTradingHistory
};
