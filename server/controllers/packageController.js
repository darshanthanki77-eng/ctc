const Package = require('../models/Package');
const UserPackage = require('../models/UserPackage');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const ManualPackageBuy = require('../models/ManualPackageBuy');
const { verifyTransaction } = require('../services/blockchainService');
const { distributeDirectReferral } = require('../services/referralService');
const { sendAdminDepositNotification } = require('../services/emailService');

const isDownline = async (buyerId, targetUserObjId) => {
  let currentUser = await User.findById(targetUserObjId);
  while (currentUser && currentUser.sponsor) {
    if (currentUser.sponsor.toString() === buyerId.toString()) {
      return true;
    }
    currentUser = await User.findById(currentUser.sponsor);
  }
  return false;
};

const getAllPackages = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id || req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    let filter = { status: true };

    if (user.pins === 0) {
      // 0-Pin users can ONLY see/purchase Zero Pin packages
      filter.isZeroPin = true;
    } else {
      // Normal users can ONLY see/purchase non-Zero Pin packages
      filter.isZeroPin = { $ne: true };
      
      // If user has no sponsor, hide referral-only packages
      if (!user.sponsor) {
        filter.isReferralOnly = { $ne: true };
      }
    }

    const packages = await Package.find(filter).sort({ minAmount: 1 });
    res.json(packages);
  } catch (error) {
    next(error);
  }
};

const buyPackage = async (req, res, next) => {
  try {
    const { packageId, amount, txHash, senderAddress, targetUserId, useWalletBalance } = req.body;

    if (!senderAddress) {
      return res.status(400).json({ message: 'Sender wallet address is required for verification.' });
    }

    const pkg = await Package.findById(packageId);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    if (pkg.name.toLowerCase().includes('land')) {
      return res.status(400).json({ message: 'Land package can only be purchased using INR manual deposit.' });
    }

    if (amount < pkg.minAmount || amount > pkg.maxAmount) {
      return res.status(400).json({ message: 'Invalid amount for this package' });
    }

    const isSplit = useWalletBalance === true || useWalletBalance === 'true';
    const usdtAmount = isSplit ? amount / 2 : amount;
    const walletAmount = isSplit ? amount / 2 : 0;

    const buyer = await User.findById(req.user._id);
    if (!buyer) return res.status(404).json({ message: 'Buyer user not found' });
    
    if (isSplit && buyer.availableBalance < walletAmount) {
      return res.status(400).json({ message: 'Insufficient wallet balance for 50:50 top-up.' });
    }

    let targetUser = buyer;
    if (targetUserId) {
      const cleanTargetId = targetUserId.trim().toUpperCase();
      if (cleanTargetId !== buyer.userId) {
        targetUser = await User.findOne({ userId: cleanTargetId });
        if (!targetUser) {
          return res.status(404).json({ message: `Target User ID ${targetUserId} does not exist.` });
        }

        // Verify targetUser is in buyer's downline (team)
        const isMember = await isDownline(buyer._id, targetUser._id);
        if (!isMember) {
          return res.status(400).json({ message: 'You can only top up packages for users in your team (downline).' });
        }

        // Available balance limit of 50% max when topping up others
        if (isSplit && walletAmount > (amount * 0.5)) {
          return res.status(400).json({ message: 'Only up to 50% of the package amount can be paid using available balance when topping up other team members.' });
        }
      }
    }

    // Check for duplicate transaction
    const existingTx = await Transaction.findOne({ txHash });
    if (existingTx) {
      return res.status(400).json({ message: 'This transaction hash has already been used. Duplicate transactions are not allowed.' });
    }

    // Verify correct USDT amount (either 50% split or 100% full amount)
    const verification = await verifyTransaction(txHash, usdtAmount, senderAddress);
    if (!verification.status) {
      return res.status(400).json({ message: verification.message });
    }

    // Zero-pin restriction checks for targetUser
    if (targetUser.pins === 0) {
      if (!pkg.isZeroPin) {
        return res.status(400).json({ message: 'Only the standard $100-$500 Package is available for 0-Pin users.' });
      }
    } else {
      if (pkg.isZeroPin) {
        return res.status(400).json({ message: 'This package is only available for 0-Pin users.' });
      }
    }

    if (targetUser.role === 'user' && (targetUser.totalInvestment + amount) > 60000) {
      return res.status(400).json({ message: 'Standard users are limited to a maximum investment of $60,000.' });
    }

    // Deduct wallet amount from buyer if using split payment
    if (isSplit) {
      buyer.availableBalance = Math.round((buyer.availableBalance - walletAmount) * 1000000) / 1000000;
      await buyer.save();
    }

    const isBVEligible = true;
    const durationDays = pkg.validity;

    const userPackage = await UserPackage.create({
      userId: targetUser.userId,
      user: targetUser._id,
      packageId: pkg._id,
      amount,
      compoundingBalance: amount,
      dailyProfitPercent: pkg.dailyProfit,
      endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
      isBVEligible,
      isStaked: false,
      stakingDuration: 0,
      isZeroPin: pkg.isZeroPin,
      stakingEnabled: false,
      stakingPeriod: 0,
      autoCompounding: false
    });

    targetUser.activePackage = pkg._id;
    targetUser.totalInvestment += amount;
    await targetUser.save();

    await AuditLog.create({
      action: 'PACKAGE_ACTIVATION',
      userId: targetUser._id,
      packageId: userPackage._id,
      amount: amount,
      details: {
        txHash,
        walletAmountPaid: walletAmount,
        useWalletBalance: isSplit,
        buyerId: buyer.userId,
        isUpgrade: false
      }
    });

    // Create wallet payment deduction log under buyer if split used
    if (isSplit) {
      await Transaction.create({
        userId: buyer.userId,
        user: buyer._id,
        type: 'withdrawal',
        amount: walletAmount,
        status: 'success',
        txHash: `WALLET_TOPUP_${targetUser.userId}`
      });
    }

    // Create deposit/activation log under targetUser
    await Transaction.create({
      userId: targetUser.userId,
      user: targetUser._id,
      type: 'deposit',
      amount,
      txHash,
      walletAddress: senderAddress,
      chainId: verification.chainId,
      tokenContract: verification.tokenContract,
      blockNumber: verification.blockNumber,
      confirmationCount: verification.confirmationCount,
      status: 'success'
    });

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

    const io = req.app.get('io');
    if (io) {
      io.emit('new_deposit', { user: targetUser.userId, amount });
      io.to(targetUser._id.toString()).emit('notification', `Package ${pkg.name} activated successfully!`);
      if (buyer._id.toString() !== targetUser._id.toString()) {
        io.to(buyer._id.toString()).emit('notification', `Successfully topped up User ID ${targetUser.userId} with ${pkg.name}!`);
      }
    }

    res.status(200).json({ message: 'Package activated successfully', userPackage });
  } catch (error) {
    next(error);
  }
};

const getUserPackages = async (req, res, next) => {
  try {
    const packages = await UserPackage.find({ user: req.user._id }).populate('packageId');
    
    // Fetch pending and rejected manual buys
    const manualBuys = await ManualPackageBuy.find({ user: req.user._id, status: { $ne: 'approved' } }).populate('packageId');
    
    // Format manual buys to match user package shape
    const formattedManual = manualBuys.map(mb => ({
      _id: mb._id,
      userId: mb.userId,
      user: mb.user,
      packageId: mb.packageId,
      amount: mb.amount,
      compoundingBalance: mb.amount,
      dailyProfitPercent: mb.packageId?.dailyProfit || 0,
      totalEarned: 0,
      startDate: mb.createdAt,
      status: mb.status === 'pending' ? 'pending' : 'rejected',
      isManual: true,
      networkType: mb.networkType,
      txHash: mb.txHash,
      rejectionReason: mb.rejectionReason
    }));

    // Sort combined packages by creation date descending
    const combined = [...packages, ...formattedManual].sort((a, b) => new Date(b.startDate || b.createdAt) - new Date(a.startDate || a.createdAt));

    res.json(combined);
  } catch (error) {
    next(error);
  }
};

const startStaking = async (req, res, next) => {
  try {
    const { userPackageId, period } = req.body;

    if (!userPackageId || !period) {
      return res.status(400).json({ message: 'Package ID and Staking Period are required.' });
    }

    const periodNum = Number(period);
    if (![30, 90, 180, 360].includes(periodNum)) {
      return res.status(400).json({ message: 'Invalid staking duration. Must be 30, 90, 180, or 360 days.' });
    }

    const userPkg = await UserPackage.findOne({ _id: userPackageId, user: req.user._id });
    if (!userPkg) {
      return res.status(404).json({ message: 'Active package not found.' });
    }

    if (userPkg.status !== 'active') {
      return res.status(400).json({ message: 'Staking can only be enabled on active packages.' });
    }

    if (userPkg.stakingEnabled) {
      return res.status(400).json({ message: 'Staking is already enabled on this package.' });
    }

    userPkg.stakingEnabled = true;
    userPkg.stakingPeriod = periodNum;
    userPkg.stakingStartDate = new Date();
    userPkg.stakingEndDate = new Date(Date.now() + periodNum * 24 * 60 * 60 * 1000);
    userPkg.autoCompounding = true;
    
    // Maintain backward compatibility with old fields
    userPkg.isStaked = true;
    userPkg.stakingDuration = periodNum;

    await userPkg.save();

    await AuditLog.create({
      action: 'STAKING_ACTIVATION',
      userId: req.user._id,
      packageId: userPkg._id,
      amount: userPkg.amount,
      details: { period: periodNum, stakingEndDate: userPkg.stakingEndDate }
    });

    res.status(200).json({ 
      message: `Staking enabled successfully for ${periodNum} days.`, 
      userPackage: userPkg 
    });
  } catch (error) {
    next(error);
  }
};

const buyPackageManual = async (req, res, next) => {
  try {
    const { packageId, amount, txHash, networkType, senderAddress, targetUserId, useWalletBalance } = req.body;

    if (!packageId || !amount || !txHash || !networkType) {
      return res.status(400).json({ message: 'Package ID, amount, transaction hash, and network type are required.' });
    }

    const pkg = await Package.findById(packageId);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    const isLandPkg = pkg.name.toLowerCase().includes('land');

    if (isLandPkg) {
      if (networkType !== 'INR') {
        return res.status(400).json({ message: 'Land package deposits must be made in INR only.' });
      }
      if (useWalletBalance === true || useWalletBalance === 'true') {
        return res.status(400).json({ message: 'Wallet balance split is not allowed for Land package.' });
      }
    } else {
      if (!['Bep20', 'TRC 20'].includes(networkType)) {
        return res.status(400).json({ message: 'Invalid network type. Must be Bep20 or TRC 20.' });
      }
    }

    const numericAmount = Number(amount);
    if (numericAmount < pkg.minAmount || numericAmount > pkg.maxAmount) {
      return res.status(400).json({ message: 'Invalid amount for this package' });
    }

    const isSplit = useWalletBalance === true || useWalletBalance === 'true';
    const usdtAmount = isSplit ? numericAmount / 2 : numericAmount;
    const walletAmount = isSplit ? numericAmount / 2 : 0;

    const buyer = await User.findById(req.user._id);
    if (!buyer) return res.status(404).json({ message: 'Buyer user not found' });
    
    if (isSplit && buyer.availableBalance < walletAmount) {
      return res.status(400).json({ message: 'Insufficient wallet balance for 50:50 top-up.' });
    }

    let targetUser = buyer;
    if (targetUserId) {
      const cleanTargetId = targetUserId.trim().toUpperCase();
      if (cleanTargetId !== buyer.userId) {
        targetUser = await User.findOne({ userId: cleanTargetId });
        if (!targetUser) {
          return res.status(404).json({ message: `Target User ID ${targetUserId} does not exist.` });
        }

        // Verify targetUser is in buyer's downline (team)
        const isMember = await isDownline(buyer._id, targetUser._id);
        if (!isMember) {
          return res.status(400).json({ message: 'You can only top up packages for users in your team (downline).' });
        }

        // Available balance limit of 50% max when topping up others
        if (isSplit && walletAmount > (numericAmount * 0.5)) {
          return res.status(400).json({ message: 'Only up to 50% of the package amount can be paid using available balance when topping up other team members.' });
        }
      }
    }

    // Check for duplicate transaction hash in Transactions
    const existingTx = await Transaction.findOne({ txHash });
    if (existingTx) {
      return res.status(400).json({ message: 'This transaction hash has already been used. Duplicate transactions are not allowed.' });
    }

    // Check for duplicate transaction hash in pending/approved ManualPackageBuy requests
    const existingManual = await ManualPackageBuy.findOne({ txHash, status: { $ne: 'rejected' } });
    if (existingManual) {
      return res.status(400).json({ message: 'A manual buy request with this transaction hash already exists.' });
    }

    // Zero-pin restriction checks for targetUser
    if (targetUser.pins === 0) {
      if (!pkg.isZeroPin) {
        return res.status(400).json({ message: 'Only the standard $100-$500 Package is available for 0-Pin users.' });
      }
    } else {
      if (pkg.isZeroPin) {
        return res.status(400).json({ message: 'This package is only available for 0-Pin users.' });
      }
    }

    if (targetUser.role === 'user' && (targetUser.totalInvestment + numericAmount) > 60000) {
      return res.status(400).json({ message: 'Standard users are limited to a maximum investment of $60,000.' });
    }

    // Deduct wallet amount from buyer immediately to lock it if split payment is used
    if (isSplit) {
      buyer.availableBalance = Math.round((buyer.availableBalance - walletAmount) * 1000000) / 1000000;
      await buyer.save();
    }

    // Create Manual Package Buy Request with target user & locked wallet amount
    const manualRequest = await ManualPackageBuy.create({
      userId: buyer.userId,
      user: buyer._id,
      packageId: pkg._id,
      amount: numericAmount,
      networkType,
      txHash,
      senderAddress: senderAddress || '',
      targetUserId: targetUser.userId,
      targetUser: targetUser._id,
      walletAmountPaid: walletAmount,
      status: 'pending'
    });

    // Notify admin
    sendAdminDepositNotification(manualRequest, buyer, pkg);

    res.status(200).json({
      message: isSplit
        ? 'Your manual package purchase request (50:50 split) has been submitted successfully and is pending admin approval.'
        : 'Your manual package purchase request (100% USDT) has been submitted successfully and is pending admin approval.',
      manualRequest
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllPackages, buyPackage, buyPackageManual, getUserPackages, startStaking };

