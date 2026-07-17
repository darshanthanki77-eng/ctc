import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setWalletAddress, fetchProfile } from '../redux/slices/authSlice';
import Sidebar from './Sidebar';
import { Menu, X, Bell, Globe, Wallet } from 'lucide-react';
import { toast } from 'react-toastify';
import logo from '../assets/logo.png';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showBell, setShowBell] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, profile, walletAddress } = useSelector((state) => state.auth);

  const currentUser = profile || user;
  const balance = currentUser?.availableBalance || 0;

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Platform Launch', message: 'CTC Copy Trade Compare is now live! Start your journey today.', read: false },
    { id: 2, title: 'New Package Available', message: 'Elite package now available with VIP node access and dedicated manager.', read: false },
  ]);

  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const getPageTitle = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('products') || path.includes('packages')) return 'Packages';
    if (path.includes('kyc')) return 'KYC';
    if (path.includes('withdrawal')) return 'Withdrawal';
    if (path.includes('downline')) return 'Network';
    if (path.includes('referral-income')) return 'Referrals';
    if (path.includes('level-income')) return 'Level Income';
    if (path.includes('mining')) return 'Trade History';
    if (path.includes('package-history')) return 'Pkg History';
    if (path.includes('transactions')) return 'Transactions';
    if (path.includes('profile')) return 'Profile';
    return 'Dashboard';
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          dispatch(setWalletAddress(accounts[0]));
          toast.success("Wallet connected successfully!");
        } else {
          toast.error("No active wallet found. Please unlock your wallet.");
        }
      } catch (error) {
        console.error("Wallet connection error:", error);
        toast.error(error?.message || "Failed to connect wallet. Please check your extension.");
      }
    } else {
      toast.error("Please install MetaMask to use this feature!");
    }
  };

  const disconnectWallet = () => {
    dispatch(setWalletAddress(null));
    toast.success("Wallet disconnected.");
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="app-shell">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />

      {/* Content Area */}
      <div className="content-area">
        {/* Sticky Topbar Header */}
        <header className="topbar">
          <div className="topbar-left">
            <button 
              onClick={toggleSidebar}
              className="mobile-menu-btn"
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>
            <h1 className="topbar-title">{getPageTitle()}</h1>
          </div>

          <div className="topbar-right">
            {/* Connect Wallet */}
            <button
              className="btn-outline btn-sm"
              onClick={walletAddress ? disconnectWallet : connectWallet}
              aria-label={walletAddress ? 'Disconnect wallet' : 'Connect wallet'}
            >
              {walletAddress ? (
                <>
                  <span className="live-dot" style={{ width: 6, height: 6 }} aria-hidden="true" />
                  <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                </>
              ) : (
                <>
                  <Globe size={13} />
                  <span className="connect-text">Connect</span>
                </>
              )}
            </button>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowBell(!showBell)}
                style={{
                  width: 38, height: 38,
                  border: '1px solid var(--glass-border)', borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyItems: 'center',
                  alignContent: 'center', justifyContent: 'center',
                  color: 'var(--gray)', background: 'var(--glass-bg)',
                  backdropFilter: 'blur(8px)',
                  position: 'relative', cursor: 'pointer', transition: 'var(--transition-fast)',
                }}
                aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
                aria-expanded={showBell}
              >
                <Bell size={16} />
                {unread > 0 && (
                  <span style={{
                    position: 'absolute', top: 7, right: 7, width: 7, height: 7,
                    background: 'var(--pink)', borderRadius: '50%',
                    border: '1.5px solid white',
                  }} aria-hidden="true" />
                )}
              </button>

              {showBell && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setShowBell(false)} />
                  <div style={{
                    position: 'absolute', right: 0, top: 44,
                    width: 320, background: 'var(--glass-bg-strong)',
                    backdropFilter: 'var(--glass-blur)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 14, padding: 18, zIndex: 50,
                    boxShadow: 'var(--glass-shadow-lg)',
                    animation: 'fadeUp 0.2s ease',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--near-black)', marginBottom: 14, display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Notifications</span>
                      {unread > 0 && (
                        <button onClick={markAllAsRead} className="text-xs text-[var(--pink)] hover:underline">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {notifications.map(n => (
                        <div key={n.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 10 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: n.read ? 'var(--gray-light)' : 'var(--pink)', marginTop: 6, flexShrink: 0, boxShadow: n.read ? 'none' : '0 0 6px var(--pink-glow)' }} aria-hidden="true" />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--near-black)' }}>{n.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, lineHeight: 1.5 }}>{n.message}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
