import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile } from '../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { 
  Coins, TrendingUp, Wallet, Users, Copy, CheckCircle,
  Zap, Clock, ArrowUpRight, BarChart2, Activity, Shield, ArrowDownRight,
  Cpu, Briefcase, ShieldCheck, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import api from '../api';
import { toast } from 'react-toastify';

// ── helper for server image URLs
const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  if (apiUrl) {
    const serverUrl = apiUrl.replace(/\/api$/, '');
    return `${serverUrl}${cleanPath}`;
  }
  return cleanPath;
};

// ── Progress Ring
function ProgressRing({ pct, label, sublabel, size = 100, color = '#F310FD' }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0, 0, 0, 0.05)" strokeWidth="6" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--near-black)', lineHeight: 1 }}>{pct}%</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--near-black)' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1, fontFamily: 'monospace' }}>{sublabel}</div>}
      </div>
    </div>
  );
}

// ── Mini Stat Chip
function StatChip({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.6)',
      borderRadius: 12, padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: color + '15',
        border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={14} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--near-black)', lineHeight: 1.2 }}>{value}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, profile, walletAddress } = useSelector((state) => state.auth);

  const [miningProgress, setMiningProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');
  const [activePackages, setActivePackages] = useState([]);
  const [announcementImages, setAnnouncementImages] = useState([]);
  const [announcementContent, setAnnouncementContent] = useState('');
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [kycStatus, setKycStatus] = useState('none');
  const [copied, setCopied] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const [dashboardSettings, setDashboardSettings] = useState({
    transparencyProfitsThisWeek: '+0.82%',
    transparencyProfitsLastWeek: '+5.28%',
    transparencyProfitsLast30Days: '+16.10%',
    transparencyPerformanceOverview: '17.33%',
    transparencyChartData: [],
    liveTradingFeed: []
  });

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // Fetch Dashboard Settings
  useEffect(() => {
    const fetchDashboardSettings = async () => {
      try {
        const res = await api.get('/user/dashboard-settings');
        if (res.data) {
          setDashboardSettings(res.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard settings:', err);
      }
    };
    fetchDashboardSettings();
  }, []);

  // Fetch KYC Status
  useEffect(() => {
    const fetchKycStatus = async () => {
      try {
        const res = await api.get('/kyc/status');
        if (res.data) {
          setKycStatus(res.data.status);
        }
      } catch (err) {
        console.error('Error fetching KYC status:', err);
      }
    };
    fetchKycStatus();
  }, []);

  // Fetch Recent Transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get('/transaction/history');
        if (res.data) {
          setTransactions(res.data);
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
      }
    };
    fetchTransactions();
  }, []);

  // Fetch Packages & Update Progress Bar
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await api.get('/package/my-packages');
        setActivePackages(res.data.filter(p => p.status === 'active'));
      } catch (err) {
        console.error('Error fetching packages:', err);
      }
    };
    fetchPackages();

    const updateProgress = () => {
      const today = new Date();
      const day = today.getDay(); // 0 = Sunday, 6 = Saturday
      if (day === 0 || day === 6) {
        setMiningProgress(0);
        setTimeLeft('Resumes Monday');
        return;
      }

      const now = today.getTime();
      const cycleMs = 12 * 60 * 60 * 1000;
      const elapsed = now % cycleMs;
      const progress = (elapsed / cycleMs) * 100;
      setMiningProgress(progress);

      const remainingMs = cycleMs - elapsed;
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };
    
    updateProgress();
    const interval = setInterval(updateProgress, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Announcements
  useEffect(() => {
    const checkAnnouncement = async () => {
      try {
        const res = await api.get('/user/announcement');
        if (res.data) {
          const images = res.data.announcementImages && res.data.announcementImages.length > 0
            ? res.data.announcementImages
            : (res.data.announcementImage ? [res.data.announcementImage] : []);
          const content = res.data.announcementContent || '';
          if (images.length > 0 || content) {
            const announcementKey = `${images.join(',')}||${content}`;
            const lastSeen = localStorage.getItem('last_seen_announcement');
            if (lastSeen !== announcementKey) {
              setAnnouncementImages(images);
              setAnnouncementContent(content);
              setShowAnnouncement(true);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching announcement:', err);
      }
    };
    checkAnnouncement();
  }, []);

  const currentUser = profile || user;
  const balance = currentUser?.availableBalance || 0;
  const totalEarning = currentUser?.totalEarning || 0;
  const miningIncome = currentUser?.miningIncome || 0;
  const referralIncome = currentUser?.referralIncome || 0;
  const directTeam = currentUser?.directTeam || 0;
  const isActive = currentUser?.isActive || false;

  const referralLink = `${window.location.origin}/register?ref=${currentUser?.userId || ''}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseAnnouncement = () => {
    const announcementKey = `${announcementImages.join(',')}||${announcementContent}`;
    localStorage.setItem('last_seen_announcement', announcementKey);
    setShowAnnouncement(false);
  };

  const handleCarouselScroll = (e) => {
    const width = e.target.offsetWidth;
    const scrollLeft = e.target.scrollLeft;
    const index = Math.round(scrollLeft / width);
    setActiveCarouselIndex(index);
  };

  const getPackageProfit = () => {
    if (activePackages.length === 0) {
      if (currentUser?.totalInvestment >= 20) return '0.25%';
      return '0%';
    }
    const totalProfit = activePackages.reduce((sum, p) => sum + (p.dailyProfitPercent || 0), 0);
    return `${totalProfit.toFixed(1)}%`;
  };

  const filteredChartData = (dashboardSettings.transparencyChartData || []).filter(
    item => item.period === selectedPeriod
  );

  return (
    <div className="fade-up">
      {/* ── Live Banner */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 10,
        background: 'linear-gradient(135deg, rgba(243,16,253,0.06) 0%, rgba(124,58,237,0.04) 100%)',
        border: '1px solid rgba(243,16,253,0.14)',
        borderRadius: 14, padding: '10px 18px', marginBottom: 22,
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="live-dot" />
          <span style={{ fontSize: 12, color: 'var(--near-black)', fontWeight: 600 }}>
            BSC Node #{currentUser?.userId || 'N/A'} — Connected
          </span>
        </div>
        <div style={{
          fontSize: 13, fontWeight: 700,
          background: 'var(--gradient-text)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          CTC Price: $0.1351 USDT ↑
        </div>
      </div>

      {/* ── Top Section: 4 Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        {/* Card 1 ── Wallet Balance */}
        <div className="card-glass-primary" style={{ padding: '20px', borderRadius: '20px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block' }}>Wallet Balance</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--near-black)', display: 'block', margin: '4px 0 2px' }}>
                ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span style={{ fontSize: 11, color: 'var(--muted-light)', fontWeight: 500 }}>Available USDT balance</span>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(243, 16, 253, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={18} style={{ color: 'var(--pink)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>
            <ArrowUpRight size={14} /> +5.2% vs Last Week
          </div>
        </div>

        {/* Card 2 ── Total Earnings */}
        <div className="card-glass-success" style={{ padding: '20px', borderRadius: '20px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block' }}>Total Earnings</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--near-black)', display: 'block', margin: '4px 0 2px' }}>
                ${totalEarning.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span style={{ fontSize: 11, color: 'var(--muted-light)', fontWeight: 500 }}>All income sources</span>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} style={{ color: 'var(--green)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>
            <ArrowUpRight size={14} /> +12.8% ROI
          </div>
        </div>

        {/* Card 3 ── Copy Trade ROI */}
        <div className="card-glass-success" style={{ padding: '20px', borderRadius: '20px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block' }}>Copy Trade ROI</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--near-black)', display: 'block', margin: '4px 0 2px' }}>
                ${miningIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span style={{ fontSize: 11, color: 'var(--muted-light)', fontWeight: 500 }}>Accrued ROI capacity</span>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} style={{ color: 'var(--green)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>
            <ArrowUpRight size={14} /> +8.1% vs Mon
          </div>
        </div>

        {/* Card 4 ── Network Size */}
        <div className="card-glass-primary" style={{ padding: '20px', borderRadius: '20px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block' }}>Network Size</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--near-black)', display: 'block', margin: '4px 0 2px' }}>
                {directTeam} members
              </span>
              <span style={{ fontSize: 11, color: 'var(--muted-light)', fontWeight: 500 }}>{directTeam} directs</span>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(243, 16, 253, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} style={{ color: 'var(--pink)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: 11, color: 'var(--pink)', fontWeight: 700 }}>
            <ArrowUpRight size={14} /> Direct referrals
          </div>
        </div>
      </div>

      {/* ── Two-col body */}
      <div className="two-col">
        {/* ── Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Copy Trading Engine */}
          <div className="card-glass-primary" style={{ padding: '24px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--gradient)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px var(--pink-glow)',
                }}>
                  <Zap size={18} style={{ color: 'white' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Copy Trading Engine</h3>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>AI-powered algorithmic trading · Mon–Fri cycle</p>
                </div>
              </div>
              <span className={`badge badge-${isActive ? 'green' : 'pink'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span className="live-dot" style={{ width: 6, height: 6 }} />
                {isActive ? 'Live' : 'Inactive'}
              </span>
            </div>

            {/* Mini stat grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
              <StatChip icon={Activity} label="Staked" value={`$${currentUser?.totalInvestment || 0}`} color="var(--pink)" />
              <StatChip icon={TrendingUp} label="Total ROI" value={`$${miningIncome.toFixed(2)}`} color="var(--green)" />
              <StatChip icon={Clock} label="Yield Rate" value={`${getPackageProfit()} / 12H`} color="#7c3aed" />
              <StatChip icon={Shield} label="Security Check" value="Audited ✓" color="var(--amber)" />
            </div>

            {/* Next sync progress */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>
                <span>NEXT PROFIT SYNC</span>
                <span style={{ color: 'var(--pink)', fontWeight: 700, fontFamily: 'monospace' }}>{timeLeft.toUpperCase()}</span>
              </div>
              <div style={{ height: 6, background: 'rgba(0,0,0,0.05)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ width: `${miningProgress}%`, height: '100%', background: 'var(--gradient)', borderRadius: 100, transition: 'width 1s linear' }} />
              </div>
            </div>

            {/* Glass footer status bar */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(243,16,253,0.05)', border: '1px solid rgba(243,16,253,0.15)',
              padding: '10px 16px', borderRadius: 10, color: 'var(--near-black)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={13} style={{ color: 'var(--pink)' }} />
                <span style={{ fontSize: 11, fontWeight: 600 }}>
                  Status: <strong style={{ color: 'var(--pink)' }}>{isActive ? 'Operational' : 'Awaiting Activation'}</strong>
                </span>
              </div>
              <span className="badge badge-green" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--green)', border: '1px solid var(--green)', fontSize: 10 }}>
                SYNCED
              </span>
            </div>
          </div>

          {/* Chart card */}
          <div className="card-glass-secondary" style={{ padding: '24px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 700 }}>CTC Value Trend</div>
                <h3 style={{ margin: '3px 0 0', fontSize: 16, fontWeight: 800, color: 'var(--near-black)' }}>Performance Trend</h3>
              </div>
              
              {/* Period selection */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(0, 0, 0, 0.03)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                padding: '4px',
                borderRadius: '12px',
                backdropFilter: 'blur(8px)'
              }}>
                {[
                  { id: 'week', label: 'Week' },
                  { id: 'month', label: 'Month' },
                  { id: '3m', label: '3M' },
                  { id: '6m', label: '6M' },
                  { id: 'year', label: 'Year' },
                  { id: 'all', label: 'All' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedPeriod(tab.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      transition: 'all 0.2s',
                      background: selectedPeriod === tab.id ? 'var(--gradient)' : 'none',
                      color: selectedPeriod === tab.id ? 'white' : 'var(--muted)',
                      boxShadow: selectedPeriod === tab.id ? '0 2px 6px rgba(243,16,253,0.2)' : 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ width: '100%', height: 135, position: 'relative' }}>
              {filteredChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredChartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--pink)" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="var(--pink)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="var(--pink)" />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="label" 
                      stroke="rgba(0,0,0,0.15)" 
                      fontSize={9}
                      fontWeight={700}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="rgba(0,0,0,0.15)" 
                      fontSize={9}
                      fontWeight={700}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        backdropFilter: 'blur(12px)',
                        borderColor: 'rgba(243, 16, 253, 0.3)', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 16px rgba(243, 16, 253, 0.15)',
                        color: 'var(--near-black)',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}
                      labelStyle={{ color: 'var(--muted)', fontSize: '9px', textTransform: 'uppercase' }}
                      itemStyle={{ color: 'var(--pink)', fontWeight: '800' }}
                      formatter={(v) => [`${v}%`, 'Return']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="url(#lineGrad)" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#chartGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 12 }}>
                  No performance data points
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="table-card">
            <div className="table-header">
              <h3 style={{ margin: 0, fontSize: 14 }}>Recent Transactions</h3>
              <button className="btn-ghost" onClick={() => navigate('/transactions')} style={{ fontSize: 12, color: 'var(--pink)', cursor: 'pointer', border: 'none', background: 'none', fontWeight: 600 }}>
                View All <ArrowUpRight size={12} style={{ display: 'inline' }} />
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>TX ID</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 4).map((tx, i) => {
                    const isCompleted = tx.status?.toLowerCase() === 'completed' || tx.status?.toLowerCase() === 'approved' || tx.status?.toLowerCase() === 'success';
                    return (
                      <tr key={tx._id || i}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, background: 'rgba(243,16,253,0.06)', padding: '2px 7px', borderRadius: 5, color: 'var(--pink)' }}>
                            {tx._id ? `${tx._id.substring(0, 8)}...` : 'N/A'}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--muted)' }}>
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ fontWeight: 500, fontSize: 12, textTransform: 'capitalize' }}>{tx.type}</td>
                        <td style={{ fontWeight: 700, fontSize: 13 }}>${Number(tx.amount || 0).toFixed(2)}</td>
                        <td>
                          <span className={`badge badge-${isCompleted ? 'green' : 'pink'}`}>
                            {tx.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '16px 0', color: 'var(--muted)', fontSize: 12 }}>
                        No transactions recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Profit Sync Rings */}
          <div className="card-glass-success" style={{ padding: '20px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Profit Sync Monitor</h3>
              <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span className="live-dot" style={{ width: 6, height: 6 }} /> Active
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: 16, paddingTop: 4 }}>
              <ProgressRing
                pct={Math.min(100, Math.round(((currentUser?.totalInvestment || 0) / 500) * 100))}
                label="Cap Sync"
                sublabel={`$${currentUser?.totalInvestment || 0} / $500`}
                color="var(--pink)"
              />
              <ProgressRing
                pct={Math.min(100, Math.round((miningIncome / 200) * 100))}
                label="ROI Sync"
                sublabel={`$${miningIncome.toFixed(0)} / $200`}
                color="#7c3aed"
              />
            </div>
          </div>

          {/* KYC Status */}
          <div className={`card-glass-${kycStatus === 'approved' ? 'success' : kycStatus === 'pending' ? 'secondary' : 'warning'}`} style={{ padding: '16px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={18} style={{ color: kycStatus === 'approved' ? 'var(--green)' : kycStatus === 'pending' ? 'var(--pink)' : 'var(--amber)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--near-black)' }}>
                  Compliance: KYC {kycStatus === 'approved' ? 'Verified ✓' : kycStatus === 'pending' ? 'Under Review' : 'Required'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {kycStatus === 'approved'
                    ? 'Full withdrawal access unlocked'
                    : kycStatus === 'pending'
                    ? 'KYC submitted and under verification'
                    : 'Complete verification to withdraw'}
                </div>
              </div>
              {kycStatus !== 'approved' && kycStatus !== 'pending' && (
                <button 
                  className="btn-primary btn-sm" 
                  style={{ 
                    marginLeft: 'auto', 
                    flexShrink: 0, 
                    fontSize: 11, 
                    padding: '6px 16px',
                    height: '32px',
                    width: 'auto',
                    borderRadius: 8
                  }}
                  onClick={() => navigate('/kyc')}
                >
                  Verify
                </button>
              )}
            </div>
          </div>

          {/* Referral Link */}
          <div className="card-glass-primary">
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 700 }}>
              Your Referral Link
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(243,16,253,0.04)', border: '1px solid rgba(243,16,253,0.12)',
              borderRadius: 10, padding: '9px 12px',
            }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {referralLink}
              </span>
              <button
                onClick={handleCopy}
                style={{
                  flexShrink: 0, borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                  background: copied ? 'var(--green)' : 'var(--gradient)',
                  color: 'white', border: 'none', transition: 'all 0.2s',
                }}
              >
                {copied ? <><CheckCircle size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
              </button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, fontWeight: 500 }}>
              {directTeam} direct referrals · ${referralIncome.toFixed(2)} earned
            </div>
          </div>

          {/* Quick Actions 2x2 Grid */}
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, paddingLeft: 2 }}>Quick Actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Buy Package', page: '/products', icon: Coins, color: 'var(--pink)' },
                { label: 'Withdraw', page: '/withdrawal', icon: Wallet, color: 'var(--purple)' },
                { label: 'Copy Trade', page: '/mining', icon: TrendingUp, color: 'var(--green)' },
                { label: 'Network', page: '/downline', icon: Users, color: '#3B82F6' },
              ].map((btn, idx) => {
                const BIcon = btn.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => navigate(btn.page)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '16px 12px',
                      borderRadius: 16,
                      background: 'rgba(255, 255, 255, 0.85)',
                      backdropFilter: 'blur(12px)',
                      border: '1.5px solid rgba(243, 16, 253, 0.12)',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(243, 16, 253, 0.45)';
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(243,16,253,0.06) 100%)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 18px rgba(243, 16, 253, 0.12)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(243, 16, 253, 0.12)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: btn.color + '15',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: 2
                    }}>
                      <BIcon size={16} style={{ color: btn.color }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--near-black)' }}>
                      {btn.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Announcement Popup Modal */}
      <AnimatePresence>
        {showAnnouncement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseAnnouncement}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-[#0B0F1A] border border-gray-800/80 rounded-3xl overflow-hidden max-w-lg w-full shadow-[0_0_50px_rgba(160,32,240,0.35)] relative z-10"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800/50">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#A020F0] animate-pulse"></div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Important Announcement</span>
                </div>
                <button
                  onClick={handleCloseAnnouncement}
                  className="text-gray-400 hover:text-white bg-gray-805 hover:bg-gray-800 p-1.5 rounded-xl transition-all border border-gray-700/30"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto hide-scrollbar bg-[#05000a]">
                {announcementImages.length > 0 && (
                  <div className="relative group/carousel">
                    {/* Carousel Scroll */}
                    <div
                      id="announcement-carousel"
                      onScroll={handleCarouselScroll}
                      className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 w-full rounded-2xl"
                      style={{ scrollSnapType: 'x mandatory' }}
                    >
                      {announcementImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="snap-center shrink-0 w-full flex items-center justify-center bg-[#05000a] min-h-[200px]"
                        >
                          <img
                            src={getImageUrl(imgUrl)}
                            alt={`Announcement ${idx + 1}`}
                            className="w-full max-h-[50vh] object-contain rounded-2xl border border-gray-800/60 shadow-inner"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://placehold.co/600x400/161B2A/A020F0?text=Announcement+Image';
                            }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Navigation Arrows */}
                    {announcementImages.length > 1 && (
                      <>
                        <button
                          onClick={() => {
                            const container = document.getElementById('announcement-carousel');
                            if (container) {
                              container.scrollBy({ left: -container.offsetWidth, behavior: 'smooth' });
                            }
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/85 text-white p-2 rounded-full border border-gray-800/40 hover:scale-105 transition-all z-10 cursor-pointer"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          onClick={() => {
                            const container = document.getElementById('announcement-carousel');
                            if (container) {
                              container.scrollBy({ left: container.offsetWidth, behavior: 'smooth' });
                            }
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/85 text-white p-2 rounded-full border border-gray-800/40 hover:scale-105 transition-all z-10 cursor-pointer"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </>
                    )}

                    {/* Indicator Dots */}
                    {announcementImages.length > 1 && (
                      <div className="flex justify-center gap-1.5 mt-3">
                        {announcementImages.map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              activeCarouselIndex === idx ? 'bg-[#A020F0] w-4' : 'bg-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {announcementContent && (
                  <div className="bg-[#161B2A]/40 border border-gray-800/40 rounded-2xl p-5 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap select-text">
                    {announcementContent}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-800/50 flex justify-end bg-[#0B0F1A]">
                <button
                  onClick={handleCloseAnnouncement}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#A020F0] to-[#6A0DAD] hover:from-[#B026FF] text-white px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide uppercase transition-all shadow-[0_0_15px_rgba(160,32,240,0.2)]"
                >
                  Acknowledge & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
