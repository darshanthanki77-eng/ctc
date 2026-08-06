const UserPackage = require('../models/UserPackage');

/**
 * Checks if a user qualifies as a networker:
 * Has at least 2 direct referrals whose active package amount is same or above the user's max active package amount.
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>}
 */
const checkIsNetworker = async (userId) => {
  const User = require('../models/User');

  // Find the user's active packages
  const userActivePkgs = await UserPackage.find({ user: userId, status: 'active' });
  if (userActivePkgs.length === 0) return false;

  // User's own max active package size to compare against
  const userMaxPkgAmount = Math.max(...userActivePkgs.map(p => p.amount), 0);

  // Find direct referrals of this user
  const directs = await User.find({ sponsor: userId });
  if (directs.length < 2) return false;

  // Find active packages of these directs
  const directsActivePkgs = await UserPackage.find({
    user: { $in: directs.map(d => d._id) },
    status: 'active'
  });

  // Count how many unique direct referrals have an active package >= userMaxPkgAmount
  const qualifiedReferrals = new Set();
  for (const pkg of directsActivePkgs) {
    if (pkg.amount >= userMaxPkgAmount) {
      qualifiedReferrals.add(pkg.user.toString());
    }
  }

  return qualifiedReferrals.size >= 2;
};

/**
 * Calculates the dynamic cap multiplier for a user (1x, 3x, or 4x).
 * @param {Object} user - The User document
 * @param {Object} [activePackage=null] - Optional pre-fetched active package
 * @returns {Promise<number>}
 */
const getUserMultiplier = async (user, activePackage = null) => {
  let hasLandSecurity = false;
  let isZeroPin = user.pins === 0;

  if (activePackage) {
    hasLandSecurity = (activePackage.packageId && activePackage.packageId.name && activePackage.packageId.name.toLowerCase().includes('land')) || 
                      (activePackage.name && activePackage.name.toLowerCase().includes('land'));
    if (activePackage.isZeroPin) isZeroPin = true;
  } else {
    const userPackages = await UserPackage.find({ user: user._id, status: 'active' }).populate('packageId');
    hasLandSecurity = userPackages.some(up => 
      up.packageId && up.packageId.name && up.packageId.name.toLowerCase().includes('land')
    );
    if (userPackages.some(up => up.isZeroPin)) isZeroPin = true;
  }

  if (hasLandSecurity) return 1;
  if (isZeroPin) return 1;

  const isNet = await checkIsNetworker(user._id);
  return isNet ? 4 : 3;
};

/**
 * Validates if a user is truly ACTIVE based on strict production rules.
 * @param {Object} user - The User document
 * @param {Object} [activePackage=null] - Optional pre-fetched active package
 * @returns {Promise<boolean>}
 */
const isStrictlyActiveUser = async (user, activePackage = null) => {
  if (!user) return false;
  
  // 1. Account not blocked/suspended
  if (user.isBlocked || user.isActive === false) return false;

  // 2. If a specific package is provided, evaluate that package
  if (activePackage) {
    const multiplier = await getUserMultiplier(user, activePackage);
    
    // Global cap check using this package's multiplier
    if (user.totalInvestment && user.totalInvestment > 0) {
      if (user.totalEarning >= user.totalInvestment * multiplier) {
        return false;
      }
    }
    
    if (activePackage.status !== 'active') return false;
    if (activePackage.endDate && activePackage.endDate < new Date()) return false;
    if (activePackage.amount && activePackage.amount > 0) {
      if (activePackage.totalEarned >= activePackage.amount * multiplier) {
        return false;
      }
    }
    return true;
  }

  // 3. If no specific package is provided, check if the user has AT LEAST ONE active, non-expired, non-capped package
  const activePkgs = await UserPackage.find({ user: user._id, status: 'active' }).populate('packageId');
  if (activePkgs.length === 0) return false;

  // Check if user has at least one valid active package
  let hasValidPackage = false;
  for (const pkg of activePkgs) {
    const multiplier = await getUserMultiplier(user, pkg);
    
    // Check global cap
    if (user.totalInvestment && user.totalInvestment > 0) {
      if (user.totalEarning >= user.totalInvestment * multiplier) {
        continue; // Try next package
      }
    }
    
    // Check package expiration
    if (pkg.endDate && pkg.endDate < new Date()) {
      continue;
    }
    
    // Check package cap
    if (pkg.amount && pkg.amount > 0) {
      if (pkg.totalEarned >= pkg.amount * multiplier) {
        continue;
      }
    }
    
    hasValidPackage = true;
    break;
  }

  return hasValidPackage;
};

const getUserPromoInvestment = async (userId) => {
  const activePkgs = await UserPackage.find({ user: userId, status: 'active' }).populate('packageId');
  let total = 0;
  for (const pkg of activePkgs) {
    const isLand = (pkg.packageId && pkg.packageId.name && pkg.packageId.name.toLowerCase().includes('land')) || 
                   (pkg.name && pkg.name.toLowerCase().includes('land'));
    if (isLand) {
      total += pkg.amount * 0.5;
    } else {
      total += pkg.amount;
    }
  }
  return total;
};

module.exports = {
  isStrictlyActiveUser,
  getUserPromoInvestment,
  checkIsNetworker,
  getUserMultiplier
};

