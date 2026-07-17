import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Check, Info, Megaphone, TrendingUp, AlertTriangle, 
  Wallet, ShieldAlert, Clock, XCircle, CheckCircle2
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProfile } from '../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';

const filters = ['All', 'System', 'Income', 'KYC', 'Withdrawal', 'Announcement'];

const Notifications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile, user, walletAddress } = useSelector((state) => state.auth);
  const currentUser = profile || user;

  const [announcement, setAnnouncement] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem('read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    dispatch(fetchProfile());
    fetchData();
  }, [dispatch]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const annRes = await api.get('/user/announcement');
      if (annRes.data && annRes.data.announcementContent) {
        setAnnouncement(annRes.data.announcementContent);
      }
      
      const txRes = await api.get('/transaction/history');
      setTransactions(txRes.data || []);
    } catch (err) {
      console.error('Error fetching notifications data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const assembledNotifications = [];

  // 1. Wallet Status
  if (walletAddress) {
    assembledNotifications.push({
      id: `wallet-connected`,
      title: 'Wallet Connected',
      type: 'System',
      message: `BEP-20 address: ${walletAddress}`,
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now()
    });
  } else {
    assembledNotifications.push({
      id: `wallet-disconnected`,
      title: 'Wallet Disconnected',
      type: 'System',
      message: 'Your Web3 wallet has been disconnected. Connect to enable transactions.',
      date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now() - 5000
    });
  }

  // 2. KYC Status
  if (currentUser?.isKYCVerified) {
    assembledNotifications.push({
      id: 'kyc-verified',
      title: 'Account Verified',
      type: 'KYC',
      message: 'Congratulations! Your identity has been successfully verified with Level 1 clearance.',
      date: currentUser.updatedAt ? new Date(currentUser.updatedAt).toLocaleDateString() : new Date().toLocaleDateString(),
      timestamp: currentUser.updatedAt ? new Date(currentUser.updatedAt).getTime() : Date.now() - 10000
    });
  } else {
    assembledNotifications.push({
      id: 'kyc-reminder',
      title: 'KYC Reminder',
      type: 'KYC',
      message: 'Complete your KYC identity verification to unlock higher withdrawal limits.',
      date: new Date().toLocaleDateString(),
      timestamp: Date.now() - 15000
    });
  }

  // 3. System Announcement
  if (announcement) {
    assembledNotifications.push({
      id: 'announcement-db',
      title: 'System Announcement',
      type: 'Announcement',
      message: announcement,
      date: new Date().toLocaleDateString(),
      timestamp: Date.now() - 20000
    });
  } else {
    assembledNotifications.push({
      id: 'announcement-fallback',
      title: 'New Package Available',
      type: 'Announcement',
      message: 'Land Security Package is now available with stable premium returns.',
      date: '27/06/2026',
      timestamp: 1782528000000
    });
  }

  // 4. Real transactions mapping
  transactions.forEach((tx, index) => {
    const txType = tx.type?.toLowerCase() || '';
    let notificationType = 'System';
    let title = 'Transaction Logged';
    let message = tx.description || `Transaction of $${tx.amount.toFixed(2)} USDT processed.`;

    if (txType === 'deposit' || txType === 'investment') {
      notificationType = 'System';
      title = 'Package Buy / Funding';
      message = `Account Funding: +$${tx.amount.toFixed(2)} USDT processed.`;
    } else if (txType === 'withdrawal') {
      notificationType = 'Withdrawal';
      title = 'Withdrawal request';
      message = `Withdrawal request of $${tx.amount.toFixed(2)} USDT initiated.`;
    } else if (txType === 'level income' || txType === 'level') {
      notificationType = 'Income';
      title = 'Level Income Credited';
      message = `Daily Level Income dividend credited to available balance: +$${tx.amount.toFixed(2)} USDT.`;
    } else if (txType === 'mining' || txType === 'copy trade' || txType === 'roi') {
      notificationType = 'Income';
      title = 'Copy Trade Income Credited';
      message = `Copy Trade yield dividend successfully credited: +$${tx.amount.toFixed(2)} USDT.`;
    } else if (txType === 'bonus' || txType === 'salary') {
      notificationType = 'Income';
      title = 'Promo Bonus Received';
      message = `Career promotion rank bonus credited to available balance: +$${tx.amount.toFixed(2)} USDT.`;
    }

    const txDate = new Date(tx.createdAt);
    const dateStr = txDate.toLocaleDateString() + ' ' + txDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    assembledNotifications.push({
      id: `tx-${tx._id || index}`,
      title,
      type: notificationType,
      message,
      date: dateStr,
      timestamp: txDate.getTime()
    });
  });

  assembledNotifications.sort((a, b) => b.timestamp - a.timestamp);

  const finalFeed = assembledNotifications.map(n => ({
    ...n,
    unread: !readIds.includes(n.id)
  }));

  const handleMarkAllRead = () => {
    const allIds = finalFeed.map(n => n.id);
    setReadIds(allIds);
    localStorage.setItem('read_notifications', JSON.stringify(allIds));
    toast.success('All notifications marked as read.');
  };

  const handleToggleRead = (id) => {
    let nextIds;
    if (readIds.includes(id)) {
      nextIds = readIds.filter(x => x !== id);
    } else {
      nextIds = [...readIds, id];
    }
    setReadIds(nextIds);
    localStorage.setItem('read_notifications', JSON.stringify(nextIds));
  };

  // Redirect mappings depending on type and title keywords
  const getRedirectRoute = (item) => {
    const type = item.type.toLowerCase();
    const title = item.title.toLowerCase();

    if (type === 'kyc') return '/kyc';
    if (type === 'withdrawal') return '/withdrawal';
    if (type === 'announcement') return '/products';
    
    if (type === 'income') {
      if (title.includes('level')) return '/level-income';
      if (title.includes('promo') || title.includes('bonus')) return '/promotional-bonus';
      if (title.includes('copy trade') || title.includes('mining')) return '/mining';
      return '/transactions';
    }

    if (type === 'system') {
      if (title.includes('package') || title.includes('funding')) return '/package-history';
      return '/profile';
    }

    return '/dashboard';
  };

  const [activeFilter, setActiveFilter] = useState('All');
  const filtered = finalFeed.filter(n => {
    if (activeFilter === 'All') return true;
    return n.type.toLowerCase() === activeFilter.toLowerCase();
  });

  const totalUnread = finalFeed.filter(n => n.unread).length;

  const getLeftBorderColor = (type) => {
    switch (type.toLowerCase()) {
      case 'system': return '#6B7280';
      case 'income': return '#22C55E';
      case 'kyc': return '#3B82F6';
      case 'withdrawal': return '#EF4444';
      case 'announcement': return '#F59E0B';
      default: return 'var(--pink)';
    }
  };

  const getIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'system': return <Info size={16} style={{ color: '#6B7280' }} />;
      case 'income': return <TrendingUp size={16} style={{ color: '#22C55E' }} />;
      case 'kyc': return <ShieldAlert size={16} style={{ color: '#3B82F6' }} />;
      case 'withdrawal': return <Wallet size={16} style={{ color: '#EF4444' }} />;
      case 'announcement': return <Megaphone size={16} style={{ color: '#F59E0B' }} />;
      default: return <Bell size={16} style={{ color: 'var(--pink)' }} />;
    }
  };

  const getTypeBadge = (type) => {
    switch (type.toLowerCase()) {
      case 'system':
        return <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(107,114,128,0.08)', color: '#6B7280', textTransform: 'uppercase' }}>System</span>;
      case 'income':
        return <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.08)', color: '#22C55E', textTransform: 'uppercase' }}>Income</span>;
      case 'kyc':
        return <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(59,130,246,0.08)', color: '#3B82F6', textTransform: 'uppercase' }}>KYC</span>;
      case 'withdrawal':
        return <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.08)', color: '#EF4444', textTransform: 'uppercase' }}>Withdrawal</span>;
      case 'announcement':
        return <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(245,158,11,0.08)', color: '#F59E0B', textTransform: 'uppercase' }}>Announcement</span>;
      default:
        return <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(243,16,253,0.08)', color: 'var(--pink)', textTransform: 'uppercase' }}>General</span>;
    }
  };

  return (
    <div className="fade-up" style={{ maxWidth: 960, margin: '0 auto', padding: '16px 20px 48px', textAlign: 'left' }}>
      
      {/* Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(243,16,253,0.03) 100%)',
        backdropFilter: 'blur(16px)', border: '1px solid rgba(243,16,253,0.15)',
        borderRadius: 20, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16,
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: 'rgba(243,16,253,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--pink)'
          }}>
            <Bell size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--near-black)' }}>Notification Feed</h2>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--muted)' }}>
              {totalUnread} unread events · {finalFeed.length} total records
            </p>
          </div>
        </div>

        <button 
          onClick={handleMarkAllRead}
          style={{
            padding: '8px 16px', borderRadius: 10, border: '1px solid var(--pink)',
            background: 'white', color: 'var(--pink)', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
            transition: 'all 0.25s'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--gradient)'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = 'var(--pink)'; }}
        >
          <Check size={14} /> Mark All Read
        </button>
      </div>

      {/* Category tabs */}
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 16, marginBottom: 16
      }}>
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              border: activeFilter === filter ? 'none' : '1px solid rgba(0,0,0,0.06)',
              background: activeFilter === filter ? 'var(--gradient)' : 'white',
              color: activeFilter === filter ? 'white' : 'var(--muted)',
              cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s'
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Feed list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
              Loading real notification feed...
            </div>
          ) : filtered.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                background: 'white', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 16,
                padding: '48px 24px', textAlign: 'center', color: 'var(--muted)'
              }}
            >
              No notifications found matching filter.
            </motion.div>
          ) : (
            filtered.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  background: 'white',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderLeft: `4px solid ${getLeftBorderColor(item.type)}`,
                  borderRadius: 12, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onClick={() => {
                  if (item.unread) {
                    handleToggleRead(item.id);
                  }
                  navigate(getRedirectRoute(item));
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.04)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.01)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                  {/* Icon circle */}
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: 'rgba(0,0,0,0.02)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {getIcon(item.type)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--near-black)' }}>{item.title}</h4>
                      {getTypeBadge(item.type)}
                      {item.unread && (
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%', background: 'var(--pink)',
                          boxShadow: '0 0 6px var(--pink-glow)'
                        }} />
                      )}
                    </div>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.message}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>
                    {item.date}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default Notifications;
