import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DollarSign, Unlock, AlertTriangle, CheckCircle, Lock, Clock } from 'lucide-react';
import { fetchProfile } from '../redux/slices/authSlice';
import api from '../api';

const LEVEL_PERCENTAGES = [
  15, 8, 7, 4, 4, 3, 3, 3, 3, 4, 
  5, 7, 8, 8, 12, 15, 8, 7, 4, 4, 
  3, 3, 3, 3, 4, 5, 7, 8, 8, 12
];

const LEVEL_REQUIREMENTS = [
  { staking: 20, directs: 2 }, { staking: 40, directs: 3 }, { staking: 60, directs: 4 }, { staking: 80, directs: 5 }, { staking: 120, directs: 6 },
  { staking: 200, directs: 7 }, { staking: 300, directs: 8 }, { staking: 400, directs: 9 }, { staking: 400, directs: 10 }, { staking: 500, directs: 11 },
  { staking: 600, directs: 12 }, { staking: 700, directs: 13 }, { staking: 900, directs: 14 }, { staking: 900, directs: 15 }, { staking: 1000, directs: 16 },
  { staking: 1100, directs: 17 }, { staking: 1200, directs: 18 }, { staking: 1300, directs: 19 }, { staking: 1400, directs: 20 }, { staking: 1500, directs: 21 },
  { staking: 1600, directs: 22 }, { staking: 1700, directs: 23 }, { staking: 1800, directs: 24 }, { staking: 1900, directs: 25 }, { staking: 2000, directs: 26 },
  { staking: 2200, directs: 27 }, { staking: 2400, directs: 28 }, { staking: 2700, directs: 29 }, { staking: 3000, directs: 30 }, { staking: 3000, directs: 30 }
];

const STATUS = {
  Qualified: { badge: 'badge-green',  icon: CheckCircle, color: '#22C55E', bar: 'var(--green)' },
  Pending:   { badge: 'badge-amber',  icon: Clock,       color: '#F59E0B', bar: 'var(--amber)' },
  Locked:    { badge: 'badge-gray',   icon: Lock,        color: '#9CA3AF', bar: 'rgba(0,0,0,0.1)' },
};

export default function LevelIncome() {
  const dispatch = useDispatch();
  const { user, profile } = useSelector((state) => state.auth);
  const currentUser = profile || user;

  const [directTeam, setDirectTeam] = useState([]);
  const [levelIncomeData, setLevelIncomeData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchProfile());
    const fetchData = async () => {
      try {
        const [teamRes, incomeRes] = await Promise.all([
          api.get('/user/team'),
          api.get('/user/level-income')
        ]);
        setDirectTeam(teamRes.data.directTeam || []);
        setLevelIncomeData(incomeRes.data || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const activeDirectsCount = directTeam.filter(d => d.isActive && (d.pins === undefined || d.pins > 0)).length;
  
  // Map rows
  const levelsData = LEVEL_REQUIREMENTS.map((reqs, idx) => {
    const lvlNum = idx + 1;
    const isUnlocked = (currentUser?.manualLevelQualified && lvlNum <= currentUser.manualLevelQualified) ||
                       ((currentUser?.totalInvestment || 0) >= reqs.staking && 
                       activeDirectsCount >= reqs.directs);

    const commEarned = levelIncomeData
      .filter(inc => inc.level === lvlNum)
      .reduce((sum, item) => sum + item.amount, 0);

    let status = 'Locked';
    if (isUnlocked) {
      status = 'Qualified';
    } else if (lvlNum <= 5 || (currentUser?.totalInvestment || 0) >= reqs.staking * 0.5) {
      status = 'Pending';
    } else {
      status = 'Locked';
    }

    return {
      lvl: lvlNum,
      rate: `${LEVEL_PERCENTAGES[idx]}%`,
      selfReq: reqs.staking,
      teamReq: reqs.staking * 5,
      earned: commEarned,
      status
    };
  });

  const totalEarned = currentUser?.levelIncome || 0;
  const unlockedLevels = levelsData.filter(l => l.status === 'Qualified').length;
  const nextReq = levelsData.find(l => l.status === 'Pending' || l.status === 'Locked')?.selfReq || 0;

  const summaryCards = [
    { label: 'Total Level Earned',  value: `$${totalEarned.toFixed(2)}`, gradient: true, icon: DollarSign, color: '#F310FD' },
    { label: 'Unlocked Levels',     value: `${unlockedLevels} / 30`,                  icon: Unlock,    color: '#22C55E' },
    { label: 'Next Unlock Req.',    value: `$${nextReq.toLocaleString()}`,             icon: AlertTriangle, color: '#F59E0B', sub: 'Self stake needed' },
  ];

  return (
    <div className="fade-up">
      {/* ── Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {summaryCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className={`fade-up-delay-${i + 1}`} style={{
              background: `linear-gradient(135deg, rgba(255,255,255,0.88) 0%, ${c.color}08 100%)`,
              backdropFilter: 'blur(12px)', border: `1px solid ${c.color}22`,
              borderRadius: 16, padding: '20px', boxShadow: `0 4px 20px ${c.color}10`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.label}</span>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: `${c.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={15} style={{ color: c.color }} />
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', ...(c.gradient ? { background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' } : { color: 'var(--near-black)' }) }}>
                {c.value}
              </div>
              {c.sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{c.sub}</div>}
            </div>
          );
        })}
      </div>

      {/* ── Level Income Matrix */}
      <div className="table-card" style={{ marginBottom: 40 }}>
        <div className="table-header">
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--near-black)' }}>30-Level Income Matrix</h3>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--muted)' }}>Each level unlocks a match rate on your downline's ROI</p>
          </div>
          <span className="badge badge-pink">{unlockedLevels} Active Levels</span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
          </div>
        ) : (
          <div style={{ padding: '0 18px 18px' }}>
            {levelsData.map((row) => {
              const cfg = STATUS[row.status] || STATUS.Locked;
              const Icon = cfg.icon;

              return (
                <div key={row.lvl} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 14px', marginBottom: 6,
                  background: row.status === 'Qualified'
                    ? 'rgba(34,197,94,0.05)'
                    : row.status === 'Locked'
                    ? 'rgba(0,0,0,0.02)'
                    : 'rgba(245,158,11,0.04)',
                  border: `1px solid ${cfg.color}20`,
                  borderLeft: `3px solid ${cfg.color}`,
                  borderRadius: 12,
                  opacity: row.status === 'Locked' ? 0.55 : 1,
                  transition: 'all 0.2s ease',
                }}>
                  {/* Level badge */}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: `${cfg.color}15`, border: `1.5px solid ${cfg.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: cfg.color,
                  }}>
                    {row.lvl}
                  </div>

                  {/* Rate + match */}
                  <div style={{ width: 48, flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--near-black)' }}>{row.rate}</div>
                    <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>match</div>
                  </div>

                  {/* Progress bar + reqs */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginBottom: 5 }}>
                      <span>Self: ${row.selfReq.toLocaleString()}</span>
                      <span>Team: ${row.teamReq.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(0,0,0,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{
                        width: row.status === 'Qualified' ? '100%' : row.status === 'Pending' ? '35%' : '0%',
                        height: '100%', background: cfg.bar, borderRadius: 100,
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                  </div>

                  {/* Earned */}
                  <div style={{ width: 70, textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: row.earned > 0 ? 'var(--green)' : 'var(--muted)', fontFamily: 'monospace' }}>
                      {row.earned > 0 ? `+$${row.earned.toFixed(2)}` : '—'}
                    </div>
                  </div>

                  {/* Status badge */}
                  <div style={{ flexShrink: 0 }}>
                    <span className={`badge ${cfg.badge}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon size={10} />
                      {row.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
