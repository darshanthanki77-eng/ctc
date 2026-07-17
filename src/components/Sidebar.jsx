import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import {
  Home,
  Package,
  Cpu,
  Users,
  BarChart2,
  Trophy,
  Wallet,
  ShieldCheck,
  User,
  FileText,
  LogOut,
  X,
  Layers,
  DollarSign,
  Bell
} from 'lucide-react';
import logo from '../assets/logo.png';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: Home },
    ],
  },
  {
    label: 'Packages',
    items: [
      { path: '/products',        label: 'Buy Package',     icon: Package },
      { path: '/package-history', label: 'Package History', icon: Package },
      { path: '/mining',          label: 'Copy Trade',      icon: Cpu },
    ],
  },
  {
    label: 'Network',
    items: [
      { path: '/downline',        label: 'Downline / Network', icon: Layers },
      { path: '/level-income',    label: 'Level Income',       icon: BarChart2 },
      { path: '/promotional-bonus', label: 'Promo Bonus',       icon: Trophy },
    ],
  },
  {
    label: 'Wallet',
    items: [
      { path: '/withdrawal',      label: 'Withdrawal',      icon: Wallet },
    ],
  },
  {
    label: 'Account',
    items: [
      { path: '/kyc',             label: 'KYC Verification', icon: ShieldCheck },
      { path: '/profile',         label: 'Profile',          icon: User },
    ],
  },
  {
    label: 'History',
    items: [
      { path: '/transactions',    label: 'Ledger Logs',      icon: FileText },
      { path: '/notifications',   label: 'Notifications',    icon: Bell, badge: true },
    ],
  },
];

const Sidebar = ({ isOpen, closeSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, profile } = useSelector((state) => state.auth);

  const currentUser = profile || user;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`} role="navigation" aria-label="Main navigation">
      {/* Mobile Close Button */}
      <div className="sidebar-logo">
        <Link to="/" className="flex items-center" style={{ height: '100%' }}>
          <img src={logo} alt="CTC Logo" style={{ height: 48, width: 'auto', maxWidth: '170px', objectFit: 'contain' }} />
        </Link>
        <button
          onClick={closeSidebar}
          style={{ color: 'var(--gray)', background: 'none', border: 'none', cursor: 'pointer', display: 'none', padding: 4 }}
          className="sidebar-close-btn"
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="sidebar-nav" aria-label="Site navigation">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <span className="sidebar-section-header">{section.label}</span>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) closeSidebar();
                  }}
                  className={({ isActive }) =>
                    `sidebar-nav-item${isActive ? ' active' : ''}`
                  }
                >
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{
                      background: 'var(--gradient)',
                      color: 'white',
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: '50%',
                      width: 18,
                      height: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(243,16,253,0.3)',
                    }}>
                      5
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Info & Sign Out */}
      <div className="sidebar-footer">
        {/* BSC live status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 2px' }}>
          <div className="live-dot" aria-hidden="true" />
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>BSC Mainnet · Live</span>
        </div>

        {/* User profile details */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(243,16,253,0.05)', border: '1px solid rgba(243,16,253,0.1)',
          borderRadius: 10, padding: '8px 12px',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--gradient)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 700, flexShrink: 0,
          }}>
            {currentUser?.fullName?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--near-black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser?.fullName || 'User'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>
              {currentUser?.userId || 'N/A'}
            </div>
          </div>
        </div>

        {/* Logout action */}
        <button className="sidebar-signout" onClick={handleLogout}>
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
