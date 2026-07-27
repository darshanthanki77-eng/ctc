const pageMapping = {
  '/dashboard': 'dashboard',
  '/users': 'users',
  '/packages': 'packages',
  '/package/create': 'packages',
  '/user-packages': 'package-history',
  '/withdrawals': 'withdrawals',
  '/kycs': 'kyc',
  '/cron/status': 'cron',
  '/cron/trigger': 'cron',
  '/transactions': 'transactions',
  '/manual-buys': 'manual-buys',
  '/package/assign': 'users',
  '/upload-announcement': 'settings',
  '/treasury/stats': 'settings',
  '/treasury/settings': 'settings',
};

const getPageForPath = (path) => {
  if (pageMapping[path]) return pageMapping[path];
  if (path.startsWith('/user/')) return 'users';
  if (path.startsWith('/kyc/')) return 'kyc';
  if (path.startsWith('/withdrawal/')) return 'withdrawals';
  if (path.startsWith('/package/')) return 'packages';
  if (path.startsWith('/manual-buys/')) return 'manual-buys';
  return null;
};

const admin = (req, res, next) => {
  if (req.user) {
    if (req.user.role === 'admin') {
      return next();
    }
    if (req.user.role === 'subadmin') {
      const pageKey = getPageForPath(req.path);
      if (!pageKey || (req.user.accessiblePages && req.user.accessiblePages.includes(pageKey))) {
        return next();
      } else {
        res.status(403);
        throw new Error('Access denied: You do not have permission to access this page');
      }
    }
  }
  res.status(401);
  throw new Error('Not authorized as an admin');
};

module.exports = { admin };
