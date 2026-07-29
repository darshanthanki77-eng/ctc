const User = require('../models/User');
const ReferralIncome = require('../models/ReferralIncome');
const UserPackage = require('../models/UserPackage');

const distributeDirectReferral = async (sponsorId, packageAmount, fromUserId, fromUserObjId) => {
  try {
    const fromUser = await User.findById(fromUserObjId);
    if (!fromUser || fromUser.pins === 0) return;

    const sponsor = await User.findById(sponsorId);
    if (!sponsor || !sponsor.isActive) return;

    const percentage = 15;
    const income = (packageAmount * percentage) / 100;

    await ReferralIncome.create({
      userId: sponsor.userId,
      user: sponsor._id,
      fromUser: fromUserObjId,
      fromUserId: fromUserId,
      packageAmount,
      percentage,
      income,
      level: 1
    });

    const activeStakedPkg = await UserPackage.findOne({
      user: sponsor._id,
      status: 'active',
      $or: [
        { isStaked: true },
        { stakingEnabled: true }
      ],
      stakingEndDate: { $gt: new Date() }
    });

    sponsor.referralIncome += income;
    sponsor.totalEarning += income;
    if (activeStakedPkg) {
      sponsor.lockedStakingIncome = (sponsor.lockedStakingIncome || 0) + income;
    } else {
      sponsor.availableBalance += income;
    }
    await sponsor.save();

  } catch (error) {
    console.error('Referral distribution error:', error);
  }
};

module.exports = { distributeDirectReferral };
