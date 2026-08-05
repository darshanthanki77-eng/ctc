const express = require('express');
const { 
  getUserProfile, 
  getTeam, 
  getMiningHistory, 
  getLevelIncomeHistory, 
  updateUserProfile, 
  changePassword,
  getAnnouncement,
  getDepositAddresses,
  claimRankBonus,
  getDashboardSettings,
  getTreeChildren,
  lookupUserByUserId
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);
router.route('/change-password').put(protect, changePassword);
router.route('/team').get(protect, getTeam);
router.route('/tree-children').get(protect, getTreeChildren);
router.route('/mining-history').get(protect, getMiningHistory);
router.route('/level-income').get(protect, getLevelIncomeHistory);
router.route('/announcement').get(protect, getAnnouncement);
router.route('/deposit-addresses').get(protect, getDepositAddresses);
router.route('/claim-bonus').post(protect, claimRankBonus);
router.route('/dashboard-settings').get(protect, getDashboardSettings);
router.route('/lookup-user/:userId').get(protect, lookupUserByUserId);
module.exports = router;

