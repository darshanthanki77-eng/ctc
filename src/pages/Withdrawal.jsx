import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Users, AlertTriangle, CheckCircle2, 
  DollarSign, Lock, Coins, ArrowRight,
  Info, ShieldCheck, Database, XCircle, Clock,
  Wallet, Cpu, Layers, Gift, Eye, EyeOff, ExternalLink
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile } from '../redux/slices/authSlice';
import api from '../api';
import { toast } from 'react-toastify';

const Withdrawal = () => {
  const dispatch = useDispatch();
  const { profile, user, walletAddress: connectedWallet } = useSelector(state => state.auth);
  const currentUser = profile || user;

  // Tabs: 'claim' | 'sos'
  const [activeTab, setActiveTab] = useState('claim');

  // Backend state
  const [activePackages, setActivePackages] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [selectedSourceId, setSelectedSourceId] = useState('balance');
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [withdrawalPin, setWithdrawalPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // SOS Form states
  const [selectedStakeId, setSelectedStakeId] = useState('');
  const [sosPin, setSosPin] = useState('');
  const [showSosPin, setShowSosPin] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile());
    fetchHistory();
    fetchPackages();
  }, [dispatch]);

  useEffect(() => {
    if (currentUser?.withdrawalWallet) {
      setWalletAddress(currentUser.withdrawalWallet);
    }
  }, [currentUser]);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/withdrawal/history');
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await api.get('/package/my-packages');
      setActivePackages(res.data.filter(p => p.status === 'active'));
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Regular Claim balances mapping
  const sourceBalances = {
    balance: currentUser?.availableBalance || 0,
    mining: currentUser?.miningIncome || 0,
    level: currentUser?.levelIncome || 0,
    promotional: currentUser?.promotionalIncome || 0
  };

  const selectedBalance = sourceBalances[selectedSourceId] || 0;

  // Regular Claim calculations
  const grossAmount = Number(amount) || 0;
  const stabilityFee = grossAmount * 0.10;
  const allocationFee = grossAmount * 0.10;
  const netPayout = Math.max(0, grossAmount - stabilityFee - allocationFee);

  // SOS Emergency Calculations
  const activeStakes = activePackages;
  const selectedStake = activeStakes.find(s => s._id === selectedStakeId);
  const stakePrincipal = selectedStake ? selectedStake.amount : 0;
  // Earned ROI in this context is the user's current mining income or pkg specific earnings if tracked
  // We can default to estimating 10% earned or 0 if not tracked specifically per pkg
  const stakeEarned = selectedStake ? (selectedStake.earnedRoi || 0) : 0;
  const penaltyFee = stakePrincipal * 0.30;
  const netRefund = Math.max(0, stakePrincipal - penaltyFee - stakeEarned);

  // Quick fill chips
  const handleQuickFill = (pct) => {
    const val = (selectedBalance * pct).toFixed(2);
    setAmount(val);
  };

  // regular claim submission
  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!amount || amount < 10) return toast.error('Minimum withdrawal is 10');
    if (Number(amount) % 10 !== 0) return toast.error('Withdrawal amount must be a multiple of 10');
    if (Number(amount) > selectedBalance) return toast.error('Amount exceeds selected wallet balance');
    if (!walletAddress) return toast.error('Please enter your receiving wallet address');
    if (!withdrawalPin || !/^\d{6}$/.test(withdrawalPin)) {
      return toast.error('Please enter a 6-digit withdrawal PIN');
    }

    setLoading(true);
    try {
      const payload = { 
        amount: Number(amount), 
        walletAddress,
        withdrawalPin,
        type: 'profit', // maps to profit withdrawal in controller
      };
      await api.post('/withdrawal/request', payload);
      toast.success('Withdrawal requested successfully!');
      setAmount('');
      setWithdrawalPin('');
      dispatch(fetchProfile());
      fetchHistory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  // SOS Submission
  const handleSOSWithdraw = async (e) => {
    e.preventDefault();
    if (!selectedStakeId) return toast.error('Please select a staking package');
    if (!sosPin || !/^\d{6}$/.test(sosPin)) {
      return toast.error('Please enter your 6-digit PIN');
    }

    setLoading(true);
    try {
      const payload = { 
        amount: Number(stakePrincipal), 
        walletAddress: walletAddress || currentUser?.withdrawalWallet || '0x...',
        withdrawalPin: sosPin,
        type: 'principal', 
        userPackageId: selectedStakeId
      };
      await api.post('/withdrawal/request', payload);
      toast.success('Emergency Stake Release processed successfully!');
      setSelectedStakeId('');
      setSosPin('');
      dispatch(fetchProfile());
      fetchHistory();
      fetchPackages();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Emergency release failed');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending':
        return <span className="badge badge-amber"><Clock size={10} style={{ marginRight: 3 }} />Pending</span>;
      case 'approved':
      case 'completed':
      case 'success':
        return <span className="badge badge-green"><CheckCircle2 size={10} style={{ marginRight: 3 }} />Success</span>;
      default:
        return <span className="badge badge-gray"><XCircle size={10} style={{ marginRight: 3 }} />Rejected</span>;
    }
  };

  // Stats definition (Image 2 cards grid)
  const stats = [
    { title: 'Available Balance', value: currentUser?.availableBalance || 0, icon: Wallet, color: '#A020F0', bg: 'rgba(160, 32, 240, 0.08)' },
    { title: 'Total Earnings', value: currentUser?.totalEarning || 0, icon: TrendingUp, color: '#22C55E', bg: 'rgba(34, 197, 94, 0.08)' },
    { title: 'Copy Trade ROI', value: currentUser?.miningIncome || 0, icon: Cpu, color: '#00C6FF', bg: 'rgba(0, 198, 255, 0.08)' },
    { title: 'Principal Withdrawal', value: activePackages.reduce((acc, p) => acc + p.amount, 0), icon: Lock, color: '#FF00FF', bg: 'rgba(255, 0, 255, 0.08)' },
    { title: 'Level Income', value: currentUser?.levelIncome || 0, icon: Layers, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)' },
    { title: 'Promotional Income', value: currentUser?.promotionalIncome || 0, icon: Gift, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.08)' }
  ];

  return (
    <div className="fade-up" style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 20px 48px' }}>
      
      {/* ── Visual Stats Cards (6 Grid Layout from Image 2) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} style={{
              background: `linear-gradient(135deg, rgba(255,255,255,0.85) 0%, ${item.color}05 100%)`,
              backdropFilter: 'blur(12px)', border: `1px solid ${item.color}20`,
              borderRadius: 16, padding: '16px 18px',
              boxShadow: `0 4px 20px ${item.color}08`,
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.title}</span>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} style={{ color: item.color }} />
                </div>
              </div>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--near-black)', fontFamily: 'monospace' }}>
                ${Number(item.value).toFixed(2)}
              </h3>
            </div>
          );
        })}
      </div>

      {/* ── Tab Selectors (Design from Image 1) */}
      <div style={{
        display: 'inline-flex',
        gap: 6,
        marginBottom: 24,
        background: 'rgba(255, 255, 255, 0.5)',
        border: '1px solid rgba(243, 16, 253, 0.15)',
        borderRadius: 12,
        padding: 4,
        backdropFilter: 'blur(8px)',
      }}>
        <button
          onClick={() => setActiveTab('claim')}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.25s ease',
            background: activeTab === 'claim' ? 'var(--gradient)' : 'transparent',
            color: activeTab === 'claim' ? 'white' : 'var(--muted)',
          }}
        >
          Regular Claim
        </button>
        <button
          onClick={() => setActiveTab('sos')}
          style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.25s ease',
            background: activeTab === 'sos' ? 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)' : 'transparent',
            color: activeTab === 'sos' ? 'white' : 'var(--muted)',
            display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          <AlertTriangle size={14} style={{ color: activeTab === 'sos' ? 'white' : 'var(--red)' }} />
          SOS Emergency Release
        </button>
      </div>

      {/* ── Two-Column Layout (Form on Left, Fees/Rules on Right) */}
      {activeTab === 'claim' ? (
        <div className="two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          
          {/* Left Panel: Regular Claim Form */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(243,16,253,0.04) 100%)',
            backdropFilter: 'blur(12px)', border: '1px solid rgba(243,16,253,0.15)',
            borderRadius: 18, padding: 24, boxShadow: '0 4px 24px rgba(243,16,253,0.08)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', itemsCenter: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Claim Rewards</h3>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--muted)' }}>Transfer to your BEP-20 wallet</p>
              </div>
              {!connectedWallet && <span className="badge badge-red">Wallet Disconnected</span>}
            </div>

            <form onSubmit={handleWithdraw}>
              {/* Select Source Option List (Image 2 style inside form) */}
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label">Select Withdrawal Source</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                  {[
                    { id: 'balance', name: 'Available Balance', value: sourceBalances.balance },
                    { id: 'mining', name: 'Copy Trade ROI', value: sourceBalances.mining },
                    { id: 'level', name: 'Level Income', value: sourceBalances.level },
                    { id: 'promotional', name: 'Promo Income', value: sourceBalances.promotional }
                  ].map(src => {
                    const isSel = selectedSourceId === src.id;
                    return (
                      <button
                        key={src.id}
                        type="button"
                        onClick={() => { setSelectedSourceId(src.id); setAmount(''); }}
                        style={{
                          background: isSel ? 'rgba(243, 16, 253, 0.05)' : 'white',
                          border: isSel ? '2px solid var(--pink)' : '1px solid rgba(0,0,0,0.08)',
                          borderRadius: 10, padding: '10px 12px', cursor: 'pointer', textAlign: 'left',
                          transition: 'all 0.2s'
                        }}
                      >
                        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: isSel ? 'var(--pink)' : 'var(--muted)' }}>
                          {src.name}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 800, color: 'var(--near-black)', fontFamily: 'monospace' }}>
                          ${src.value.toFixed(2)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Input */}
              <div className="form-group" style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label">Claim Amount (USDT)</label>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                    Wallet Available: <strong style={{ color: 'var(--near-black)', fontFamily: 'monospace' }}>${selectedBalance.toFixed(2)}</strong>
                  </span>
                </div>
                <div className="form-input-prefix" style={{ position: 'relative' }}>
                  <span className="form-prefix-label">$</span>
                  <input 
                    type="number" 
                    step="10" 
                    value={amount}
                    onChange={e => setAmount(e.target.value)} 
                    placeholder="0.00" 
                  />
                </div>
                <div className="quick-fill" style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <button type="button" className="chip" onClick={() => handleQuickFill(0.25)}>25%</button>
                  <button type="button" className="chip" onClick={() => handleQuickFill(0.50)}>50%</button>
                  <button type="button" className="chip" onClick={() => handleQuickFill(0.75)}>75%</button>
                  <button type="button" className="chip" onClick={() => handleQuickFill(1.00)}>MAX</button>
                </div>
              </div>

              {/* BEP-20 Wallet Address */}
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label">BEP-20 Wallet Address</label>
                <input 
                  className="form-input" 
                  type="text"
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  readOnly={!!currentUser?.withdrawalWallet}
                  style={{ fontFamily: 'monospace', fontSize: 12, color: currentUser?.withdrawalWallet ? 'var(--muted)' : 'var(--near-black)' }} 
                />
                <span style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                  {currentUser?.withdrawalWallet 
                    ? "★ Address locked. Contact support to modify." 
                    : "★ Address will lock to your account upon first withdrawal."
                  }
                </span>
              </div>

              {/* 6-Digit PIN */}
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">
                  {currentUser?.withdrawalPin ? "Enter 6-digit Withdrawal PIN" : "Set 6-digit Withdrawal PIN (First-time setup)"}
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    className="form-input" 
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    placeholder="******"
                    value={withdrawalPin}
                    onChange={e => setWithdrawalPin(e.target.value.replace(/\D/g, ''))}
                    style={{ paddingRight: 44, fontFamily: 'monospace', tracking: '0.15em' }} 
                  />
                  <button type="button" onClick={() => setShowPin(!showPin)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
                <Wallet size={16} style={{ marginRight: 6 }} />
                {loading ? 'Processing transfer...' : `Initiate Transfer — $${netPayout.toFixed(2)} USDT net`}
              </button>
            </form>
          </div>

          {/* Right Panel: Fee Breakdown (Image 1 style) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(124,58,237,0.04) 100%)',
              backdropFilter: 'blur(12px)', border: '1px solid rgba(124,58,237,0.15)',
              borderRadius: 18, padding: 24, boxShadow: '0 4px 24px rgba(124,58,237,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={17} style={{ color: 'var(--purple)' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Fee Structure</h3>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>Net payout breakdown</p>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>
                  <span>Invoice Ref</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--pink)' }}>REC-{Math.floor(9000 + Math.random() * 999)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)' }}>
                  <span>Destination Wallet</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 11 }}>
                    {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not connected'}
                  </span>
                </div>
              </div>

              {[
                { label: 'Gross Amount',         value: `$${grossAmount.toFixed(2)} USDT`,    color: 'var(--near-black)', badge: null },
                { label: 'Price Stability Fee',  value: `-$${stabilityFee.toFixed(2)}`,       color: 'var(--red)',        badge: '10%' },
                { label: 'Allocation Fee',       value: `-$${allocationFee.toFixed(2)}`,      color: 'var(--red)',        badge: '10%' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--muted)' }}>{r.label}</span>
                    {r.badge && <span className="badge badge-amber" style={{ fontSize: 9, padding: '1px 5px' }}>{r.badge}</span>}
                  </div>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: r.color }}>{r.value}</span>
                </div>
              ))}

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 14, paddingTop: 14, borderTop: '2px solid rgba(243,16,253,0.15)',
              }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Net Payout Received</span>
                <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  ${netPayout.toFixed(2)} USDT
                </span>
              </div>
            </div>

            <div style={{
              background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <AlertTriangle size={16} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12, color: '#92400E', lineHeight: 1.6 }}>
                The 10% allocation fee is distributed to node operators maintaining BSC liquidity. Minimum <strong>$10 USDT</strong> per claim.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          
          {/* SOS Form Left */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(239,68,68,0.04) 100%)',
            backdropFilter: 'blur(12px)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 18, padding: 24, boxShadow: '0 4px 24px rgba(239,68,68,0.08)',
            textAlign: 'left'
          }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--near-black)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={18} style={{ color: 'var(--red)' }} />
              Emergency principal release
            </h3>
            <p style={{ margin: '3px 0 16px', fontSize: 11, color: 'var(--muted)' }}>Cancel package & reclaim staking principal immediately</p>

            <form onSubmit={handleSOSWithdraw}>
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label">Select Active Staking Package</label>
                {activeStakes.length === 0 ? (
                  <div style={{
                    padding: '24px', background: 'rgba(0,0,0,0.02)', border: '1px dashed rgba(0,0,0,0.08)',
                    borderRadius: 10, fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 8
                  }}>
                    No active packages found for emergency release.
                  </div>
                ) : (
                  <select
                    className="form-input"
                    value={selectedStakeId}
                    onChange={e => setSelectedStakeId(e.target.value)}
                    style={{ width: '100%', height: 46, background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, padding: '0 12px', marginTop: 8 }}
                    required
                  >
                    <option value="">-- Choose package to cancel --</option>
                    {activeStakes.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.packageId?.name || 'Staking Package'} — Staked: ${s.amount}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedStake && (
                <div style={{ background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 10, padding: 14, marginBottom: 18 }}>
                  <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--red)', letterSpacing: '0.04em', marginBottom: 10 }}>Refund Preview</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                    <div style={{ display: 'flex', justify: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>Staking Principal</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>${stakePrincipal.toFixed(2)} USDT</span>
                    </div>
                    <div style={{ display: 'flex', justify: 'space-between', color: 'var(--red)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        SOS Penalty Fee <span className="badge badge-red" style={{ fontSize: 9, padding: '0px 4px' }}>30%</span>
                      </span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>-${penaltyFee.toFixed(2)} USDT</span>
                    </div>
                    <div style={{ display: 'flex', justify: 'space-between', color: 'var(--red)' }}>
                      <span>ROI Already Received (deducted)</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>-${stakeEarned.toFixed(2)} USDT</span>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid rgba(239,68,68,0.12)', margin: '6px 0' }} />
                    <div style={{ display: 'flex', justify: 'space-between', fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>
                      <span>Net Refund Amount</span>
                      <span style={{ fontFamily: 'monospace' }}>${netRefund.toFixed(2)} USDT</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Transaction Password / PIN</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    className="form-input" 
                    type={showSosPin ? 'text' : 'password'}
                    maxLength={6}
                    placeholder="******"
                    value={sosPin}
                    onChange={e => setSosPin(e.target.value.replace(/\D/g, ''))}
                    style={{ paddingRight: 44, fontFamily: 'monospace', tracking: '0.15em' }}
                    required
                    disabled={activeStakes.length === 0}
                  />
                  <button type="button" onClick={() => setShowSosPin(!showSosPin)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showSosPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                className="btn-primary"
                type="submit"
                disabled={loading || activeStakes.length === 0 || !selectedStakeId}
                style={{ width: '100%', background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)', border: 'none', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)' }}
              >
                <AlertTriangle size={16} style={{ marginRight: 6 }} />
                {loading ? 'Processing release...' : `Cancel Stake & Refund $${netRefund.toFixed(2)} USDT`}
              </button>
            </form>
          </div>

          {/* SOS Policy Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(239,68,68,0.03) 100%)',
              backdropFilter: 'blur(12px)', border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: 18, padding: 24, boxShadow: '0 4px 24px rgba(239,68,68,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={17} style={{ color: 'var(--red)' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>SOS Protocol Rules</h3>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>Principal Liquidation Policy</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12, color: 'var(--body-text)' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--red)', fontWeight: 'bold' }}>•</span>
                  <span><strong>No Future Yields:</strong> The cancelled package stops producing passive returns instantly.</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--red)', fontWeight: 'bold' }}>•</span>
                  <span><strong>Penalty Fee:</strong> A fixed 30% penalty is deducted from the principal to maintain BSC pool liquidity bounds.</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--red)', fontWeight: 'bold' }}>•</span>
                  <span><strong>ROI Offset:</strong> Any ROI previously earned on the package is subtracted from the refundable amount.</span>
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <AlertTriangle size={16} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12, color: '#991B1B', lineHeight: 1.6 }}>
                SOS Release is intended for emergency cashouts. Action cannot be undone.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Withdrawal History Table Logs (Image 2 style, full width at the bottom) */}
      <div className="table-card" style={{ marginTop: 28, marginBottom: 40 }}>
        <div className="table-header">
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--near-black)' }}>Withdrawal History</h3>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--muted)' }}>Track all your withdrawals and status logs</p>
          </div>
          <span className="badge badge-pink">{history.length} Records</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="p-4 pl-6">Date</th>
                <th className="p-4">Wallet Address</th>
                <th className="p-4 text-center">Amount</th>
                <th className="p-4 text-center">Method</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 pr-6 text-right">Deduction</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
                    No withdrawal requests found.
                  </td>
                </tr>
              ) : (
                history.map((row, idx) => {
                  const dateObj = new Date(row.createdAt);
                  const day = String(dateObj.getDate()).padStart(2, '0');
                  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                  const year = dateObj.getFullYear();
                  const dateStr = `${day}/${month}/${year}`;

                  return (
                    <tr key={row._id || idx}>
                      {/* Date */}
                      <td className="p-4 pl-6 text-sm text-gray-300">
                        {dateStr}
                      </td>

                      {/* Wallet */}
                      <td className="p-4" style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--muted)' }}>
                        {row.walletAddress 
                          ? `${row.walletAddress.substring(0, 6)}...${row.walletAddress.substring(row.walletAddress.length - 4)}` 
                          : 'N/A'
                        }
                      </td>

                      {/* Amount */}
                      <td className="p-4 text-center text-sm font-bold text-white">
                        ${row.amount.toFixed(2)}
                      </td>

                      {/* Method */}
                      <td className="p-4 text-center">
                        <span className="badge badge-purple" style={{ fontSize: 10 }}>USDT</span>
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        {getStatusBadge(row.status)}
                      </td>

                      {/* Deduction */}
                      <td className="p-4 pr-6 text-right text-xs text-red-500 font-mono">
                        -${row.deduction.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Withdrawal;
