import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, CheckCircle, Shield, AlertTriangle, Clock, X, Info,
  Zap, Wallet, TrendingUp, Check, CheckCircle2, Loader2, Gem, XCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api';

const STATUS_BADGES = {
  active: 'badge-green',
  completed: 'badge-gray',
  cancelled: 'badge-red',
  rejected: 'badge-red',
  pending: 'badge-yellow',
};

const STATUS_ICONS = {
  active: CheckCircle,
  completed: Shield,
  cancelled: AlertTriangle,
  rejected: AlertTriangle,
  pending: Clock,
};

export default function PackageHistory() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [filter, setFilter] = useState('All');
  const filters = ['All', 'Active', 'Completed', 'Cancelled'];

  // Modal states for details/staking
  const [activeStakingModal, setActiveStakingModal] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [stakingActionLoading, setStakingActionLoading] = useState(false);

  const [activeManualModal, setActiveManualModal] = useState(null);

  const fetchPackages = async () => {
    try {
      const res = await api.get('/package/my-packages');
      setPackages(res.data);
    } catch (err) {
      console.error('Error fetching package history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // ESC key listener for modal accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveStakingModal(null);
        setActiveManualModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleStartStaking = async () => {
    if (!activeStakingModal) return;
    try {
      setStakingActionLoading(true);
      const res = await api.post('/package/start-staking', { 
        userPackageId: activeStakingModal._id, 
        period: selectedPeriod 
      });
      toast.success(res.data.message || 'Staking activated successfully!');
      setActiveStakingModal(null);
      fetchPackages();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to activate staking.');
    } finally {
      setStakingActionLoading(false);
    }
  };

  // Filter logic
  const filtered = packages.filter(p => {
    const statusLower = (p.status || '').toLowerCase();
    if (filter === 'All') return true;
    if (filter === 'Active') return statusLower === 'active';
    if (filter === 'Completed') return statusLower === 'completed';
    if (filter === 'Cancelled') return ['cancelled', 'rejected'].includes(statusLower);
    return true;
  });

  return (
    <div className="fade-up">
      {/* ── Page Header & Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
            Monitor your nodes and their remaining ROI accrual ceilings
          </p>
        </div>
        <div style={{
          display: 'flex', gap: 4, 
          background: 'rgba(255, 255, 255, 0.5)', border: '1px solid rgba(243, 16, 253, 0.15)',
          borderRadius: 12, padding: '4px 6px', backdropFilter: 'blur(10px)'
        }}>
          {filters.map(f => (
            <button 
              key={f} 
              className={`filter-tab${filter === f ? ' active' : ''}`} 
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: filter === f ? 'var(--pink)' : 'transparent',
                color: filter === f ? 'white' : 'var(--muted)'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Package History Table Card */}
      <div className="table-card">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Package ID</th>
                  <th>Name</th>
                  <th>Amount (USDT)</th>
                  <th>Date Activated</th>
                  <th>ROI Earned</th>
                  <th>Ceiling</th>
                  <th>Accrual Progress</th>
                  <th>Staking / Info</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
                      No packages found matching this filter state.
                    </td>
                  </tr>
                ) : filtered.map((p, idx) => {
                  const statusLower = (p.status || '').toLowerCase();
                  
                  // Compute dynamic ceiling multiplier
                  const isZeroPin = p.isZeroPin || p.packageId?.isZeroPin;
                  const multiplier = isZeroPin ? 1 : 4;
                  const ceilingVal = p.amount * multiplier;
                  
                  const pct = Math.min(100, Math.round((p.totalEarned / ceilingVal) * 100));
                  const StatusIcon = STATUS_ICONS[statusLower] || CheckCircle;

                  // Format activation date
                  const dateStr = p.startDate 
                    ? new Date(p.startDate).toLocaleDateString('en-CA') 
                    : new Date(p.createdAt).toLocaleDateString('en-CA');

                  return (
                    <tr key={p._id || idx} style={{
                      borderLeft: `3px solid ${
                        statusLower === 'active' ? 'var(--green)' : 
                        ['cancelled', 'rejected'].includes(statusLower) ? 'var(--red)' : 'var(--gray)'
                      }`
                    }}>
                      {/* ID Badge */}
                      <td>
                        <span style={{ 
                          fontFamily: 'monospace', 
                          fontSize: 11, 
                          background: 'rgba(243, 16, 253, 0.06)', 
                          border: '1px solid rgba(243, 16, 253, 0.15)',
                          padding: '3px 8px', 
                          borderRadius: 6,
                          color: 'var(--pink)',
                          fontWeight: 600
                        }}>
                          PH-{String(idx + 1).padStart(3, '0')}
                        </span>
                      </td>

                      {/* Name */}
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--near-black)', fontSize: 13.5 }}>
                          {p.packageId?.name || 'Standard Package'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--near-black)' }}>
                        ${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Date */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                          <Calendar size={12} />
                          <span style={{ fontFamily: 'monospace' }}>{dateStr}</span>
                        </div>
                      </td>

                      {/* ROI Earned */}
                      <td>
                        <span style={{ color: 'var(--green)', fontWeight: 800, fontFamily: 'monospace', fontSize: 13.5 }}>
                          ${(p.totalEarned || 0).toFixed(2)}
                        </span>
                      </td>

                      {/* Ceiling */}
                      <td style={{ fontFamily: 'monospace', color: 'var(--muted)', fontSize: 13 }}>
                        ${ceilingVal.toFixed(2)} <span style={{ fontSize: 9, opacity: 0.8 }}>({multiplier}x)</span>
                      </td>

                      {/* Accrual Progress */}
                      <td style={{ minWidth: 120 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ 
                            flex: 1, 
                            height: 6, 
                            background: 'rgba(0, 0, 0, 0.05)', 
                            borderRadius: 100, 
                            overflow: 'hidden' 
                          }}>
                            <div style={{ 
                              width: `${pct}%`, 
                              height: '100%', 
                              background: statusLower === 'active' ? 'var(--gradient)' : 'var(--muted)', 
                              borderRadius: 100,
                              transition: 'width 0.8s ease'
                            }} />
                          </div>
                          <span style={{ 
                            fontSize: 11, 
                            fontWeight: 700, 
                            color: 'var(--pink)', 
                            width: 34, 
                            textAlign: 'right',
                            fontFamily: 'monospace' 
                          }}>
                            {pct}%
                          </span>
                        </div>
                      </td>

                      {/* Staking / Info Action */}
                      <td>
                        {p.isManual ? (
                          <button
                            onClick={() => setActiveManualModal(p)}
                            style={{
                              padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                              border: '1px solid rgba(243, 16, 253, 0.25)', background: 'rgba(243, 16, 253, 0.04)',
                              color: 'var(--pink)', cursor: 'pointer', transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(243, 16, 253, 0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(243, 16, 253, 0.04)'}
                          >
                            Manual Info
                          </button>
                        ) : (
                          (p.stakingEnabled || p.isStaked) ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 10.5, fontWeight: 700, color: 'var(--pink)',
                              background: 'rgba(243, 16, 253, 0.07)', border: '1px solid rgba(243, 16, 253, 0.15)',
                              padding: '3px 8px', borderRadius: 8
                            }}>
                              Compounded ({p.stakingPeriod || p.stakingDuration}d)
                            </span>
                          ) : statusLower === 'active' ? (
                            <button
                              onClick={() => {
                                setSelectedPeriod(30);
                                setActiveStakingModal(p);
                              }}
                              style={{
                                padding: '5px 12px', borderRadius: 10, fontSize: 11.5, fontWeight: 700,
                                border: 'none', background: 'linear-gradient(135deg, #7B2FF7 0%, #D946EF 100%)',
                                color: 'white', cursor: 'pointer', transition: 'all 0.2s ease',
                                boxShadow: '0 4px 14px rgba(217, 70, 239, 0.35)',
                                display: 'inline-flex', alignItems: 'center', gap: 5
                              }}
                              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                            >
                              <Zap size={13} />
                              Enable Staking
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--muted)' }}>—</span>
                          )
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`badge ${STATUS_BADGES[statusLower] || 'badge-gray'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <StatusIcon size={10} />
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Premium Web3 Auto-Staking Modal (Exact Design Spec Match) */}
      {createPortal(
        <AnimatePresence>
          {activeStakingModal && (
            <div className="fixed inset-0 z-[99999] overflow-y-auto p-4 sm:p-6 flex items-center justify-center min-h-screen">
              {/* Dark Blurred Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => setActiveStakingModal(null)}
                className="fixed inset-0 bg-[#0C0C18]/60 backdrop-blur-[20px]"
              />

              {/* Dark Glass Staking Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[560px] my-auto relative z-10 rounded-[24px] overflow-hidden text-white shadow-[0_24px_64px_rgba(0,0,0,0.65)]"
                style={{
                  background: '#17172A',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '28px 28px 24px'
                }}
              >
                {/* ── Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Primary Purple -> Neon Pink Gradient Lightning Badge */}
                    <div style={{
                      width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                      boxShadow: '0 6px 20px rgba(139,92,246,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#FFFFFF'
                    }}>
                      <Zap size={22} className="fill-white/20" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                        Enable Auto-Staking
                      </h3>
                      <p style={{ color: '#A1A1AA', fontSize: 12.5, margin: '3px 0 0', lineHeight: 1.45 }}>
                        Automatically compound your staking rewards by locking your package for a selected duration.
                      </p>
                    </div>
                  </div>

                  {/* Circular Close Button */}
                  <button
                    onClick={() => setActiveStakingModal(null)}
                    style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#9CA3AF', cursor: 'pointer', transition: 'all 0.2s ease',
                      marginLeft: 12
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.transform = 'scale(1.08) rotate(90deg)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* ── Lock Duration Segmented Cards */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: 10 }}>
                    Choose Lock Duration
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[30, 90, 180, 360].map((d) => {
                      const isSelected = selectedPeriod === d;
                      return (
                        <div
                          key={d}
                          onClick={() => setSelectedPeriod(d)}
                          style={{
                            height: 64,
                            borderRadius: 14,
                            padding: '10px 8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            border: isSelected ? '1.5px solid transparent' : '1px solid rgba(255, 255, 255, 0.08)',
                            background: isSelected ? 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)' : '#1F1F35',
                            color: '#FFFFFF',
                            boxShadow: isSelected
                              ? '0 8px 24px rgba(236, 72, 153, 0.4)'
                              : 'none',
                            transform: isSelected ? 'scale(1.0)' : 'none'
                          }}
                          onMouseEnter={e => {
                            if (!isSelected) {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isSelected) {
                              e.currentTarget.style.transform = 'none';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                            }
                          }}
                        >
                          {isSelected && (
                            <div style={{ position: 'absolute', top: 5, right: 5, width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={10} style={{ color: '#FFFFFF' }} />
                            </div>
                          )}
                          <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.15 }}>{d} Days</span>
                          <span style={{ fontSize: 11, fontWeight: 500, color: isSelected ? 'rgba(255,255,255,0.85)' : '#6B7280', marginTop: 3 }}>
                            {d === 30 ? 'Standard' : d === 90 ? 'Silver' : d === 180 ? 'Gold' : 'Platinum'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Information Card */}
                <div style={{
                  background: '#1F1F35',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 16,
                  padding: '14px 18px',
                  marginBottom: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0
                }}>
                  {/* Row 1: Lock Balance */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#9CA3AF', fontSize: 13.5, fontWeight: 500 }}>
                      <Wallet size={15} style={{ color: '#8B5CF6' }} />
                      Lock Balance
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#FFFFFF', fontFamily: 'monospace', letterSpacing: '-0.01em' }}>
                      ${activeStakingModal.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT
                    </span>
                  </div>

                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

                  {/* Row 2: Lock Period */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#9CA3AF', fontSize: 13.5, fontWeight: 500 }}>
                      <Clock size={15} style={{ color: '#EC4899' }} />
                      Lock Period
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 13.5, color: '#A78BFA' }}>
                      {selectedPeriod} Days (Compounded)
                    </span>
                  </div>

                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

                  {/* Row 3: Yield Acceleration */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#9CA3AF', fontSize: 13.5, fontWeight: 500 }}>
                      <TrendingUp size={15} style={{ color: '#22C55E' }} />
                      Yield Acceleration
                    </div>
                    <span style={{
                      fontSize: 11.5, fontWeight: 600, color: '#22C55E',
                      background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.2)',
                      padding: '3px 10px', borderRadius: 20
                    }}>
                      Daily Compound Enabled
                    </span>
                  </div>

                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

                  {/* Row 4: Auto Unlock */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: '#9CA3AF', fontSize: 13.5, fontWeight: 500 }}>
                      <Shield size={15} style={{ color: '#6B7280' }} />
                      Auto Unlock
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#6B7280' }}>
                      On Maturity ({selectedPeriod}d)
                    </span>
                  </div>
                </div>

                {/* ── Staking Benefits Box */}
                <div style={{
                  background: 'rgba(34, 197, 94, 0.05)',
                  border: '1px solid rgba(34, 197, 94, 0.15)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  marginBottom: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4ADE80', marginBottom: 10 }}>
                    <Gem size={14} style={{ color: '#4ADE80' }} />
                    STAKING BENEFITS
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px 12px', fontSize: 13, fontWeight: 400, color: '#D1FAE5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <CheckCircle2 size={14} style={{ color: '#22C55E', flexShrink: 0 }} />
                      Daily Auto Compounding
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <CheckCircle2 size={14} style={{ color: '#22C55E', flexShrink: 0 }} />
                      No Manual Claim Required
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <CheckCircle2 size={14} style={{ color: '#22C55E', flexShrink: 0 }} />
                      Locked Until Expiry
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <CheckCircle2 size={14} style={{ color: '#22C55E', flexShrink: 0 }} />
                      Higher Yield Stability
                    </div>
                  </div>
                </div>

                {/* ── Warning Info Box */}
                <div style={{
                  background: 'rgba(245, 158, 11, 0.05)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                  borderRadius: 14,
                  padding: '12px 16px',
                  marginBottom: 22,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10
                }}>
                  <AlertTriangle size={16} style={{ color: '#FBBF24', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong style={{ color: '#FBBF24', fontSize: 12.5, display: 'block', marginBottom: 2 }}>Important Notice</strong>
                    <span style={{ color: '#9CA3AF', fontSize: 12.5, lineHeight: 1.5 }}>
                      Your package cannot be withdrawn before the selected {selectedPeriod}-day locking period ends.
                    </span>
                  </div>
                </div>

                {/* ── Footer Action Buttons */}
                <div style={{ display: 'flex', gap: 12 }}>
                  {/* Cancel Button */}
                  <button
                    type="button"
                    onClick={() => setActiveStakingModal(null)}
                    style={{
                      flex: 1,
                      height: 46,
                      borderRadius: 12,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#9CA3AF',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#FFFFFF'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = '#9CA3AF'; }}
                  >
                    <XCircle size={16} />
                    Cancel
                  </button>

                  {/* Enable Staking Gradient Button */}
                  <button
                    type="button"
                    onClick={handleStartStaking}
                    disabled={stakingActionLoading}
                    style={{
                      flex: 2,
                      height: 46,
                      borderRadius: 12,
                      border: 'none',
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(236, 72, 153, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'all 0.2s ease',
                      opacity: stakingActionLoading ? 0.7 : 1
                    }}
                    onMouseEnter={e => {
                      if (!stakingActionLoading) {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 12px 28px rgba(236, 72, 153, 0.5)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!stakingActionLoading) {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(236, 72, 153, 0.35)';
                      }
                    }}
                  >
                    {stakingActionLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Activating...
                      </>
                    ) : (
                      <>
                        <Zap size={18} />
                        Enable Auto-Staking
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── Manual Deposit Info Details Modal */}
      {createPortal(
        <AnimatePresence>
          {activeManualModal && (
            <div className="fixed inset-0 z-[99999] overflow-y-auto p-4 sm:p-6 flex items-center justify-center min-h-screen">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveManualModal(null)}
                className="fixed inset-0 bg-[#050814]/75 backdrop-blur-[24px]"
              ></motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="w-full max-w-[480px] my-auto relative z-10 p-6 sm:p-7 rounded-[28px] border border-[rgba(243,16,253,0.22)] bg-white shadow-[0_25px_80px_rgba(0,0,0,0.25)] text-slate-900"
                style={{ background: '#FFFFFF' }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 14, flexShrink: 0,
                      background: 'rgba(243, 16, 253, 0.1)', border: '1px solid rgba(243, 16, 253, 0.22)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
                    }}>
                      📋
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: 'var(--near-black)', lineHeight: 1.2 }}>
                        Manual Deposit Info
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveManualModal(null)}
                    style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: '#F1F5F9', border: '1px solid #E2E8F0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#64748B', cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#E2E8F0'; e.currentTarget.style.color = '#0F172A'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B'; }}
                  >
                    <X size={16} />
                  </button>
                </div>
                
                {/* Details Body */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(243,16,253,0.1)', paddingBottom: 12 }}>
                    <span style={{ color: 'var(--muted)', fontWeight: 500 }}>Network Type</span>
                    <span style={{ fontWeight: 800, color: 'var(--pink)' }}>{activeManualModal.networkType}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1px solid rgba(243,16,253,0.1)', paddingBottom: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Transaction Hash</span>
                    <span style={{ fontFamily: 'monospace', color: 'var(--near-black)', userSelect: 'all', wordBreak: 'break-all', background: 'rgba(243,16,253,0.04)', border: '1px solid rgba(243,16,253,0.15)', padding: '12px 14px', borderRadius: 12, fontSize: 12, textAlign: 'center', lineHeight: 1.45 }}>
                      {activeManualModal.txHash}
                    </span>
                  </div>
                  {activeManualModal.status === 'rejected' && (
                    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '14px 16px', marginTop: 4 }}>
                      <span style={{ color: 'var(--red)', fontWeight: 800, fontSize: 11, display: 'block', marginBottom: 4, letterSpacing: '0.06em' }}>REJECTION REASON:</span>
                      <p style={{ color: 'var(--body-text)', fontStyle: 'italic', fontSize: 12.5, margin: 0, lineHeight: 1.45 }}>
                        "{activeManualModal.rejectionReason || 'Details incorrect or not matching deposit wallet.'}"
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
