const User = require('../models/User');
const ReferralIncome = require('../models/ReferralIncome');
const UserPackage = require('../models/UserPackage');

const distributeDirectReferral = async (sponsorId, packageAmount, fromUserId, fromUserObjId, paymentMethod = 'Crypto') => {
  try {
    const fromUser = await User.findById(fromUserObjId);
    if (!fromUser || fromUser.pins === 0) return;

    const sponsor = await User.findById(sponsorId);
    if (!sponsor || !sponsor.isActive) return;

    const SystemSettings = require('../models/SystemSettings');
    const settings = await SystemSettings.findOne() || { inrExchangeRate: 90 };
    const inrRate = settings.inrExchangeRate || 90;
    const round6 = (num) => Math.round(num * 1000000) / 1000000;

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

    sponsor.referralIncome = round6(sponsor.referralIncome + income);
    sponsor.totalEarning = round6(sponsor.totalEarning + income);
    if (activeStakedPkg) {
      sponsor.lockedStakingIncome = round6((sponsor.lockedStakingIncome || 0) + income);
    } else {
      if (paymentMethod === 'INR') {
        const incomeINR = income * inrRate;
        sponsor.availableBalanceINR = round6((sponsor.availableBalanceINR || 0) + incomeINR);
      } else {
        sponsor.availableBalance = round6(sponsor.availableBalance + income);
      }
    }
    await sponsor.save();

  } catch (error) {
    console.error('Referral distribution error:', error);
  }
};

module.exports = { distributeDirectReferral };
