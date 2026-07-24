import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Cpu, Calendar, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';

const MiningHistory = () => {
  const { user, profile } = useSelector((state) => state.auth);
  const currentUser = profile || user;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/user/mining-history');
        setHistory(res.data);
      } catch (err) {
        console.error('Error fetching mining history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="fade-up" style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 20px 48px' }}>
      
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 28, 
        flexWrap: 'wrap', 
        gap: 16 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'rgba(0, 198, 255, 0.1)', border: '1px solid rgba(0, 198, 255, 0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px rgba(0, 198, 255, 0.15)', flexShrink: 0
          }}>
            <Cpu size={22} style={{ color: '#00C6FF' }} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--near-black)', margin: 0, letterSpacing: '-0.02em' }}>
              Copy Trade History
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 13, margin: '3px 0 0' }}>
              Detailed logs of all your copy trading sessions
            </p>
          </div>
        </div>

        <Link
          to="/package-history"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600,
            textDecoration: 'none', background: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(243,16,253,0.15)', color: 'var(--muted)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)', transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(243,16,253,0.3)';
            e.currentTarget.style.color = 'var(--pink)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(243,16,253,0.15)';
            e.currentTarget.style.color = 'var(--muted)';
          }}
        >
          <History size={15} />
          View Package History
        </Link>
      </div>

      {/* ── Daily Dividend Table Card */}
      <div className="table-card">
        <div className="table-header">
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--near-black)' }}>Daily Dividend Log</h3>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--muted)' }}>Real-time BSC node accrual records</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span className="live-dot" style={{ width: 6, height: 6 }} />
              Live Accrual
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-500"></div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="p-4 pl-6">Date</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Yield %</th>
                  <th className="p-4 pr-6">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
                      No copy trade logs found in your account.
                    </td>
                  </tr>
                ) : (
                  history.map((d, i) => {
                    const dateObj = new Date(d.createdAt);
                    
                    // Format Date to DD/MM/YYYY
                    const day = String(dateObj.getDate()).padStart(2, '0');
                    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                    const year = dateObj.getFullYear();
                    const dateStr = `${day}/${month}/${year}`;
                    
                    // Format Time to HH:MM:SS
                    const hours = String(dateObj.getHours()).padStart(2, '0');
                    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
                    const timeStr = `${hours}:${minutes}:${seconds}`;
                    
                    // Yield rate is record.percentage / 2 for the 12H cycle
                    const yieldVal = d.percentage ? (d.percentage / 2).toFixed(2) : '0.50';

                    return (
                      <tr key={d._id || i} className="border-b border-gray-800/40 hover:bg-[#161B2A]/40 transition-colors">
                        {/* Date & Time */}
                        <td className="p-4 pl-6 text-sm text-gray-300">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Calendar size={14} className="text-[#00C6FF]" style={{ flexShrink: 0 }} />
                            <span>{dateStr}</span>
                            <span className="text-xs text-gray-500 font-mono ml-1">{timeStr}</span>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="p-4">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: '#21C55E' }}>
                            <span>$</span>
                            <span>{d.amount.toFixed(2)}</span>
                          </div>
                        </td>

                        {/* Yield % */}
                        <td className="p-4">
                          <span className="badge badge-purple" style={{ fontFamily: 'monospace' }}>
                            {yieldVal}%
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-4 pr-6">
                          <span className="badge badge-green">Success</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiningHistory;
