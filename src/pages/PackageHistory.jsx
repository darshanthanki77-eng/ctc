import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle, Shield, AlertTriangle, Clock, X, Info } from 'lucide-react';
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
                                padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                border: 'none', background: 'var(--gradient)',
                                color: 'white', cursor: 'pointer', transition: 'all 0.15s',
                                boxShadow: '0 2px 8px rgba(243,16,253,0.2)'
                              }}
                              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
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

      {/* ── Staking Lock Selection Modal */}
      <AnimatePresence>
        {activeStakingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveStakingModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#0B0F1A] border border-[#A020F0]/50 rounded-3xl p-6 shadow-[0_0_50px_rgba(160,32,240,0.2)] relative z-10 text-white"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <button
                onClick={() => setActiveStakingModal(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white bg-[#161B2A] p-2 rounded-full border border-gray-800"
              >
                <X size={16} />
              </button>
              
              <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                ⚡ Enable Staking
              </h3>
              <p className="text-gray-400 text-xs mb-6 leading-relaxed">
                Choose a locking duration for auto-compounding returns. Lock-up balances will accrue daily compound returns at standard contract yields.
              </p>
              
              <div className="mb-6">
                <label className="text-[10px] text-gray-500 font-bold uppercase block mb-2.5">Staking Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 90, 180, 360].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedPeriod(d)}
                      className={`py-2.5 rounded-xl font-bold text-xs transition-all ${
                        selectedPeriod === d
                          ? 'bg-gradient-to-r from-[#00C6FF] to-[#A020F0] text-white shadow-md'
                          : 'bg-[#161B2A] text-gray-450 hover:text-white border border-gray-800'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#161B2A]/50 border border-gray-800 rounded-2xl p-4 mb-6">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-400">Lock Balance:</span>
                  <span className="font-bold text-white">${activeStakingModal.amount.toLocaleString()} USDT</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Locking Period:</span>
                  <span className="font-bold text-[#00C6FF]">{selectedPeriod} Days (Compounded)</span>
                </div>
              </div>

              <button
                onClick={handleStartStaking}
                disabled={stakingActionLoading}
                className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#00C6FF] to-[#A020F0] text-white shadow-lg hover:shadow-cyan-500/20"
              >
                {stakingActionLoading ? 'Activating Compound...' : 'Enable Auto-Compounding Staking'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Manual Deposit Info Details Modal */}
      <AnimatePresence>
        {activeManualModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveManualModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#0B0F1A] border border-[#A020F0]/50 rounded-3xl p-6 shadow-[0_0_50px_rgba(160,32,240,0.2)] relative z-10 text-white"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <button
                onClick={() => setActiveManualModal(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white bg-[#161B2A] p-2 rounded-full border border-gray-800"
              >
                <X size={16} />
              </button>
              
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
                📋 Manual Deposit Info
              </h3>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-gray-800/80 pb-2">
                  <span className="text-gray-400">Network Type</span>
                  <span className="font-bold text-[#00C6FF]">{activeManualModal.networkType}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-gray-800/80 pb-3">
                  <span className="text-xs text-gray-400 mb-1">Transaction Hash</span>
                  <span className="font-mono text-gray-300 select-all break-all bg-[#0B0F1A] border border-gray-800 p-2.5 rounded-lg text-xs leading-relaxed text-center">
                    {activeManualModal.txHash}
                  </span>
                </div>
                {activeManualModal.status === 'rejected' && (
                  <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-3.5 mt-2">
                    <span className="text-red-400 font-bold text-xs block mb-1">REJECTION REASON:</span>
                    <p className="text-gray-400 italic text-xs leading-relaxed">
                      "{activeManualModal.rejectionReason || 'Details incorrect or not matching deposit wallet.'}"
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
