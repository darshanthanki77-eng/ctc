import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Unlock, AlertTriangle, CheckCircle, Lock, Clock, Calendar } from 'lucide-react';
import { fetchProfile } from '../redux/slices/authSlice';
import api from '../api';

const ranksList = [
  { key: 'L1', display: 'L1',  self: 300,  main: 1500,  other: 0,        salary: 60,       total: 100 },
  { key: 'L2', display: 'L2',  self: 300,  main: 1500,  other: 3500,     salary: 300,      total: 300 },
  { key: 'L3', display: 'L3',  self: 300,  main: 4500,  other: 10500,    salary: 1000,     total: 800 },
  { key: 'L4', display: 'L4',  self: 300,  main: 15750, other: 36750,    salary: 2400,     total: 2000 },
  { key: 'L5', display: 'L5',  self: 300,  main: 31500, other: 73500,    salary: 4800,     total: 5000 },
  { key: 'L6', display: 'L6',  self: 300,  main: 54000, other: 126000,   salary: 10000,    total: 10000 },
  { key: 'L7', display: 'L7',  self: 300,  main: 180000,other: 420000,   salary: 20000,    total: 15000 },
  { key: 'L8', display: 'L8',  self: 300,  main: 450000,other: 1050000,  salary: 35000,    total: 25000 },
  { key: 'L9', display: 'L9',  self: 300,  main: 1080000,other:2520000,  salary: 50000,    total: 50000 },
  { key: 'L10',display: 'L10', self: 300,  main: 4500000,other:10500000, salary: 100000,   total: 100000 },
  { key: 'L11',display: 'L11', self: 300,  main: 9000000,other:21000000, salary: 200000,   total: 200000 },
  { key: 'L12',display: 'L12', self: 300,  main: 18000000,other:42000000,salary: 500000,   total: 500000 },
];

const rankBonusMap = {
  'L1': 100, 'L2': 300, 'L3': 800, 'L4': 2000, 'L5': 5000, 'L6': 10000,
  'L7': 15000, 'L8': 25000, 'L9': 50000, 'L10': 100000, 'L11': 200000, 'L12': 500000
};

function GlassProgressRow({ label, current, required, pct, color }) {
  const remaining = Math.max(0, required - current);
  return (
    <div style={{
      background: `${color}06`, border: `1px solid ${color}20`,
      borderRadius: 14, padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: 'var(--near-black)' }}>
            ${current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>/ ${required.toLocaleString()}</span>
          {pct >= 100 && <CheckCircle size={14} style={{ color: 'var(--green)' }} />}
        </div>
      </div>
      <div style={{ height: 7, background: 'rgba(0,0,0,0.06)', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: pct >= 100 ? 'var(--green)' : `linear-gradient(90deg, ${color}, ${color}cc)`,
          borderRadius: 100, transition: 'width 1s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
        <span style={{ fontSize: 10, color: remaining > 0 ? 'var(--muted)' : 'var(--green)', fontWeight: 600 }}>
          {remaining > 0 ? `Need: $${remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Completed'}
        </span>
        <span style={{ fontSize: 10, color: color, fontWeight: 700 }}>{pct}% complete</span>
      </div>
    </div>
  );
}

const PromotionalBonusHistory = () => {
  const dispatch = useDispatch();
  const { user, profile } = useSelector((state) => state.auth);
  const currentUser = profile || user;

  const [directTeam, setDirectTeam] = useState([]);
  const [allLevels, setAllLevels] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimLoading, setClaimLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 10;
  const totalPages = Math.ceil(bonuses.length / itemsPerPage);
  const paginatedBonuses = bonuses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    dispatch(fetchProfile());
    const fetchData = async () => {
      try {
        const [teamRes, txRes] = await Promise.all([
          api.get('/user/team'),
          api.get('/transaction/history')
        ]);
        setDirectTeam(teamRes.data.directTeam || []);
        setAllLevels(teamRes.data.allLevels || []);

        const promoData = txRes.data.filter(tx => tx.type === 'bonus' || tx.type === 'salary');
        const ranks = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10', 'L11', 'L12'];
        const userRank = currentUser?.rank || 'None';
        const currentRankIndex = ranks.indexOf(userRank);
        const virtualRankBonuses = [];

        if (currentRankIndex !== -1) {
          for (let i = 0; i <= currentRankIndex; i++) {
            const rank = ranks[i];
            const bonusAmount = rankBonusMap[rank];
            const existingApprovedTx = promoData.find(
              tx => tx.type === 'bonus' && 
                    tx.amount === bonusAmount && 
                    (tx.status?.toLowerCase() === 'success' || tx.status?.toLowerCase() === 'approved')
            );
            const existingPendingTx = promoData.find(
              tx => tx.type === 'bonus' && 
                    tx.amount === bonusAmount && 
                    tx.status?.toLowerCase() === 'pending'
            );

            if (existingApprovedTx) {
              existingApprovedTx.status = 'Approved';
            } else if (existingPendingTx) {
              existingPendingTx.status = 'Pending';
            } else {
              const isUnclaimed = currentUser?.unclaimedRankBonuses && currentUser.unclaimedRankBonuses.includes(rank);
              if (!isUnclaimed) {
                virtualRankBonuses.push({
                  _id: `virtual_bonus_${rank}`,
                  type: 'bonus',
                  amount: bonusAmount,
                  status: 'Pending',
                  createdAt: currentUser?.createdAt || new Date().toISOString(),
                  level: rank
                });
              }
            }
          }
        }

        const processedPromoData = promoData.map(tx => {
          const lowerStatus = tx.status?.toLowerCase();
          let statusText = tx.status;
          if (lowerStatus === 'success' || lowerStatus === 'approved') {
            statusText = 'Approved';
          } else if (lowerStatus === 'pending') {
            statusText = 'Pending';
          } else if (lowerStatus === 'failed' || lowerStatus === 'rejected') {
            statusText = 'Failed';
          }
          return { ...tx, status: statusText };
        });

        const combined = [...processedPromoData, ...virtualRankBonuses].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setBonuses(combined);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch, currentUser?.rank, currentUser?.unclaimedRankBonuses]);

  // Leg Business calculations (identical to salaryCron.js rules)
  const getTeamBusinessVal = (member) => {
    let sum = 0;
    allLevels.forEach(lvl => {
      lvl.members.forEach(m => {
        if (m.sponsor === member._id && m.isActive && (m.pins === undefined || m.pins > 0)) {
          sum += (m.totalInvestment || 0) + getTeamBusinessVal(m);
        }
      });
    });
    return sum;
  };

  const legBusinesses = directTeam.map(dir => {
    const business = getTeamBusinessVal(dir);
    return { id: dir._id, business };
  });

  const totalTeamBusiness = legBusinesses.reduce((acc, leg) => acc + leg.business, 0);

  let strongLegBusiness = 0;
  let otherLegsBusiness = 0;
  if (legBusinesses.length > 0) {
    const sortedLegs = [...legBusinesses].sort((a, b) => b.business - a.business);
    strongLegBusiness = sortedLegs[0].business;
    otherLegsBusiness = totalTeamBusiness - strongLegBusiness;
  }

  const userRankKey = currentUser?.rank || 'None';
  const userRankIndex = ranksList.findIndex(r => r.key === userRankKey);
  const nextRankData = ranksList[userRankIndex + 1] || ranksList[0];

  const selfPct  = Math.min(100, Math.round(((currentUser?.totalInvestment || 0) / nextRankData.self) * 100)) || 0;
  const mainPct  = Math.min(100, Math.round((strongLegBusiness / (nextRankData.main || 1)) * 100)) || 0;
  const otherPct = nextRankData.other === 0 ? 100 : (Math.min(100, Math.round((otherLegsBusiness / nextRankData.other) * 100)) || 0);

  const handleClaimBonus = async (rank) => {
    try {
      setClaimLoading(true);
      const res = await api.post('/user/claim-bonus', { rank });
      alert(`Successfully claimed Rank ${rank} Bonus of $${res.data.amount}!`);
      dispatch(fetchProfile());
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to claim bonus.');
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <div className="fade-up">
      
      {/* ── Rank Hero Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(243,16,253,0.06) 100%)',
        backdropFilter: 'blur(16px)', border: '1px solid rgba(243,16,253,0.2)',
        borderRadius: 20, padding: '28px 28px', marginBottom: 24,
        boxShadow: '0 8px 32px rgba(243,16,253,0.1)',
        display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'var(--gradient)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px var(--pink-glow)', flexShrink: 0,
        }}>
          <Trophy size={34} style={{ color: 'white' }} />
        </div>

        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 6 }}>Current Rank</div>
          <h2 style={{
            margin: 0, fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em',
            ...(userRankKey !== 'None'
              ? { background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }
              : { color: 'var(--muted)' }),
          }}>
            {userRankKey === 'None' ? 'Unranked' : ranksList[userRankIndex]?.display}
          </h2>
          {userRankKey !== 'None' && (
            <div style={{ display: 'flex', gap: 18, fontSize: 13, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--muted)' }}>Monthly Salary: <strong style={{ color: 'var(--green)', fontFamily: 'monospace' }}>${ranksList[userRankIndex]?.salary}/month</strong></span>
              <span style={{ color: 'var(--muted)' }}>Target: <strong style={{ color: 'var(--near-black)', fontFamily: 'monospace' }}>${ranksList[userRankIndex]?.total.toLocaleString()}</strong></span>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Next Target</div>
          <div style={{
            fontSize: 28, fontWeight: 900,
            background: 'var(--gradient-text)', WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>{nextRankData.display}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>Rank target</div>
        </div>
      </div>

      {/* ── Real-Time Business Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { title: 'Total Team Business', value: totalTeamBusiness, color: '#A020F0', bg: 'rgba(160, 32, 240, 0.08)' },
          { title: 'Main Leg (Strongest)', value: strongLegBusiness, color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.08)' },
          { title: 'Other Legs (Weaker)', value: otherLegsBusiness, color: '#0D9488', bg: 'rgba(13, 148, 136, 0.08)' }
        ].map((item, idx) => (
          <div key={idx} style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.85) 0%, ${item.color}05 100%)`,
            backdropFilter: 'blur(12px)', border: `1px solid ${item.color}20`,
            borderRadius: 16, padding: '16px 18px',
            boxShadow: `0 4px 20px ${item.color}08`,
            textAlign: 'left'
          }}>
            <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>{item.title}</span>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--near-black)', fontFamily: 'monospace' }}>
              ${Number(item.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        ))}
      </div>

      {/* ── Progress Card */}
      <div style={{
        background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.6)', borderRadius: 18,
        padding: 24, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        textAlign: 'left'
      }}>
        <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: 'var(--near-black)' }}>Progress to {nextRankData.display}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <GlassProgressRow label="Self Stake"         current={currentUser?.totalInvestment || 0}      required={nextRankData.self}  pct={selfPct}  color="#F310FD" />
          <GlassProgressRow label="Main Leg Volume"    current={strongLegBusiness}                       required={nextRankData.main}  pct={mainPct}  color="#7C3AED" />
          <GlassProgressRow label="Other Legs Volume"  current={otherLegsBusiness}                      required={nextRankData.other} pct={otherPct} color="#0D9488" />
        </div>
      </div>

      {/* ── Direct Legs Business Breakdown */}
      <div style={{
        background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.6)', borderRadius: 18,
        padding: 24, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        textAlign: 'left'
      }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--near-black)' }}>Direct Legs Business Breakdown</h3>
        <p style={{ margin: '0 0 16px', fontSize: 11, color: 'var(--muted)' }}>Identify which direct leg counts as your Main Leg and track their individual business volume contributions</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {directTeam.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '12px 0' }}>No direct referrals found.</div>
          ) : (
            (() => {
              const mappedLegs = directTeam.map(dir => {
                const business = getTeamBusinessVal(dir);
                return {
                  _id: dir._id,
                  userId: dir.userId,
                  fullName: dir.fullName,
                  ownInvestment: dir.totalInvestment || 0,
                  business
                };
              });

              const sortedMappedLegs = [...mappedLegs].sort((a, b) => b.business - a.business);
              const maxBusiness = sortedMappedLegs.length > 0 ? sortedMappedLegs[0].business : 0;
              const hasMultipleOrOne = sortedMappedLegs.length > 0;

              return mappedLegs.map((leg, idx) => {
                const isMainLeg = hasMultipleOrOne && leg._id === sortedMappedLegs[0]._id && leg.business > 0;
                
                return (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(0, 0, 0, 0.02)',
                    border: isMainLeg ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid rgba(255, 255, 255, 0.5)',
                    borderRadius: 14,
                    padding: '12px 16px',
                    gap: 12,
                    flexWrap: 'wrap'
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--near-black)' }}>
                        {leg.fullName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        ID: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{leg.userId}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, display: 'block' }}>OWN BV</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--near-black)', fontFamily: 'monospace' }}>
                          ${leg.ownInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, display: 'block' }}>DOWNLINE BV</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--near-black)', fontFamily: 'monospace' }}>
                          ${leg.business.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '4px 8px',
                        borderRadius: 8,
                        textTransform: 'uppercase',
                        background: isMainLeg ? 'rgba(124, 58, 237, 0.1)' : 'rgba(13, 148, 136, 0.1)',
                        color: isMainLeg ? '#7C3AED' : '#0D9488',
                        border: isMainLeg ? '1px solid rgba(124, 58, 237, 0.2)' : '1px solid rgba(13, 148, 136, 0.2)'
                      }}>
                        {isMainLeg ? 'Main Leg' : 'Weaker Leg'}
                      </span>
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>
      </div>

      {/* ── Salary Condition Alert Banner */}
      <div style={{
        background: 'rgba(243, 16, 253, 0.05)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(243, 16, 253, 0.15)',
        borderRadius: 18,
        padding: '16px 20px',
        marginBottom: 24,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        textAlign: 'left'
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(243, 16, 253, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <AlertTriangle size={18} style={{ color: 'var(--pink)' }} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--near-black)' }}>Salary Maintenance Condition</h4>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)', lineHeight: '1.5' }}>
            To qualify for the next month's salary payout, you must increase your weaker leg business volume by at least 10%.
          </p>
        </div>
      </div>

      {/* ── Claimable Rank Bonuses */}
      {currentUser?.unclaimedRankBonuses && currentUser.unclaimedRankBonuses.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(234,179,8,0.3)', borderRadius: 20,
          padding: 24, marginBottom: 24, boxShadow: '0 8px 32px rgba(234,179,8,0.05)',
          textAlign: 'left'
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--near-black)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Trophy className="text-yellow-500 animate-bounce" size={20} />
            Claimable Rank Bonuses
          </h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
            You have qualified for new leadership ranks! Click "Claim Bonus" to transfer the reward to your withdrawable balance.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            {currentUser.unclaimedRankBonuses.map((rank) => (
              <div key={rank} style={{
                background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(234,179,8,0.2)',
                borderRadius: 16, padding: 18, textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
              }}>
                <span className="badge badge-amber">{ranksList.find(r => r.key === rank)?.display || rank} Upgrade</span>
                <h3 style={{ fontSize: 24, fontWeight: 900, margin: '8px 0 12px', color: 'var(--near-black)' }}>
                  ${rankBonusMap[rank]}
                </h3>
                <button
                  onClick={() => handleClaimBonus(rank)}
                  disabled={claimLoading}
                  style={{
                    width: '100%', background: 'linear-gradient(135deg, #FBBF24, #D97706)',
                    color: 'white', border: 'none', borderRadius: 10, padding: '10px 14px',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {claimLoading ? 'Claiming...' : 'Claim Bonus'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Career Salary Table */}
      <div className="table-card" style={{ marginBottom: 24 }}>
        <div className="table-header">
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--near-black)' }}>Career Salary Table</h3>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--muted)' }}>Unlock higher ranks to earn monthly USDT salary rewards</p>
          </div>
          <span className="badge badge-pink">
            <TrendingUp size={10} /> Monthly Salary
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Self Stake</th>
                <th>Main Leg</th>
                <th>Other Legs</th>
                <th>Monthly Salary</th>
                <th>Total Target</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ranksList.map((row, idx) => {
                const isCurrent = row.key === userRankKey;
                const isUnlocked = userRankIndex >= idx;

                return (
                  <tr key={row.key} style={{
                    background: isCurrent ? 'linear-gradient(90deg, rgba(243,16,253,0.05), transparent)' : undefined,
                    borderLeft: isCurrent ? '3px solid var(--pink)' : '3px solid transparent',
                  }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isCurrent && <Trophy size={13} style={{ color: 'var(--pink)' }} />}
                        <span style={{ fontWeight: 800, fontSize: 14, color: isCurrent ? 'var(--pink)' : 'var(--near-black)' }}>{row.display}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>${row.self.toLocaleString()}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>${row.main.toLocaleString()}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>${row.other.toLocaleString()}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: isUnlocked ? 'var(--green)' : 'var(--muted)', fontFamily: 'monospace', fontSize: 13 }}>
                        ${row.salary}/month
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>${row.total.toLocaleString()}</td>
                    <td>
                      {isUnlocked
                        ? <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={10} /> Unlocked</span>
                        : <span className="badge badge-gray" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Lock size={10} /> Locked</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Transaction History Logs */}
      <div className="table-card" style={{ marginBottom: 40 }}>
        <div className="table-header">
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--near-black)' }}>Promotion History Logs</h3>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--muted)' }}>Track all your rank bonuses and monthly salary payouts</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
          </div>
        ) : bonuses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Trophy style={{ width: 44, height: 44, color: 'var(--muted)', margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>No promotion bonuses achieved yet.</p>
          </div>
        ) : (
          <div style={{ padding: '0 18px 18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {paginatedBonuses.map((tx) => {
                const dateObj = new Date(tx.createdAt);
                const day = String(dateObj.getDate()).padStart(2, '0');
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const year = dateObj.getFullYear();
                const dateStr = `${day}/${month}/${year}`;

                const hours = String(dateObj.getHours()).padStart(2, '0');
                const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                const timeStr = `${hours}:${minutes}`;

                return (
                  <div key={tx._id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px', background: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(0,0,0,0.04)', borderRadius: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: tx.type === 'bonus' ? 'rgba(234,179,8,0.1)' : 'rgba(34,197,94,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <Trophy size={16} style={{ color: tx.type === 'bonus' ? '#EAB308' : '#22C55E' }} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--near-black)' }}>
                          {tx.type === 'bonus' ? 'Rank Upgrade Reward' : 'Monthly Leadership Salary'}
                        </h4>
                        <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                          <span>{dateStr}</span>
                          <span>{timeStr}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--near-black)', fontFamily: 'monospace' }}>
                        +${tx.amount.toFixed(2)}
                      </span>
                      <div style={{ marginTop: 2 }}>
                        <span className={`badge ${tx.status === 'Approved' ? 'badge-green' : tx.status === 'Pending' ? 'badge-amber' : 'badge-red'}`} style={{ fontSize: 9 }}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 14 }}>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{ border: '1px solid rgba(0,0,0,0.08)', background: 'white', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    style={{ border: '1px solid rgba(0,0,0,0.08)', background: 'white', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionalBonusHistory;
