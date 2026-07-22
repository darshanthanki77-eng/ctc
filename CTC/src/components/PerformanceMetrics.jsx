import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

const PerformanceMetrics = () => {
  const [tradeCount, setTradeCount] = useState(4821094);

  useEffect(() => {
    const interval = setInterval(() => {
      setTradeCount(prev => prev + Math.floor(Math.random() * 5) + 1);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const metrics = [
    { value: '0.002ms', label: 'Execution Latency', sub: 'FPGA Hardware Direct DMA', color: '#7C3AED' },
    { value: tradeCount.toLocaleString(), label: 'Trades Executed Today', sub: 'Streaming live', color: '#059669', live: true },
    { value: '99.999%', label: 'Uptime SLA', sub: 'Zero Downtime Consensus', color: '#7C3AED' },
    { value: '$14.82B', label: 'Total Value Locked', sub: 'Non-Custodial Vaults', color: '#7C3AED' },
  ];

  return (
    <section id="performance" className="section-padding section-alt">
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 52px auto' }}>
          <div className="glass-pill" style={{ marginBottom: '14px' }}>
            <Activity size={14} /> Live System Telemetry
          </div>
          <h2 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.9rem)', marginBottom: '14px' }}>
            Unmatched <span className="text-gradient">Performance</span>
          </h2>
          <p style={{ color: '#6B7280', fontSize: '1.05rem' }}>Continuous real-time verification across global node clusters.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {metrics.map((m, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.6rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#111827', marginBottom: '4px' }}>
                {m.value}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
                {m.live && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />}
                <span style={{ color: m.color, fontWeight: 600, fontSize: '0.875rem' }}>{m.label}</span>
              </div>
              <div style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PerformanceMetrics;
