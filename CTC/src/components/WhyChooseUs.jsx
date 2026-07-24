import React, { useState } from 'react';
import { Award, CheckCircle2 } from 'lucide-react';

const WhyChooseUs = () => {
  const [activeStep, setActiveStep] = useState(0);

  const milestones = [
    { year: 'Phase I', title: 'Neural Engine Core', desc: 'Launched core algorithmic order matching kernel with FPGA DPO.', metrics: '0.005ms' },
    { year: 'Phase II', title: 'Multi-Chain Liquidity', desc: 'Expanded cross-chain zero-slippage pools across 40+ networks.', metrics: '$8.4B' },
    { year: 'Phase III', title: 'zk-Proof Vaults', desc: 'Implemented zero-knowledge confidential trading and deposits.', metrics: '100% Private' },
    { year: 'Phase IV', title: 'Autonomous Consensus', desc: 'AI-driven yield optimization with self-rebalancing capital nodes.', metrics: '24.8% APY' },
  ];

  return (
    <section id="why-us" className="section-padding section-alt">
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 52px auto' }}>
          <div className="glass-pill" style={{ marginBottom: '14px' }}>
            <Award size={14} /> Why NEXUS AI?
          </div>
          <h2 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.9rem)', marginBottom: '14px' }}>
            The Protocol of <span className="text-gradient">Choice</span>
          </h2>
          <p style={{ color: '#6B7280', fontSize: '1.05rem' }}>High-frequency quantitative mechanics combined with cutting-edge AI.</p>
        </div>

        {/* Timeline */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '48px' }}>
          {milestones.map((item, idx) => (
            <div key={idx} className="glass-card" onClick={() => setActiveStep(idx)} style={{
              padding: '24px', cursor: 'pointer',
              borderColor: activeStep === idx ? '#7C3AED' : '#E5E7EB',
              background: activeStep === idx ? '#FAFAFA' : '#FFFFFF',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7C3AED' }}>{item.year}</span>
                <span style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: '999px', background: '#EDE9FE', color: '#7C3AED', fontWeight: 700 }}>{item.metrics}</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', color: '#111827', marginBottom: '8px' }}>{item.title}</h3>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Benchmark */}
        <div className="glass-card" style={{ padding: '36px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.6rem', color: '#111827', marginBottom: '14px' }}>100x Faster Than Legacy Platforms</h3>
              <p style={{ color: '#6B7280', lineHeight: 1.6, marginBottom: '20px' }}>
                Traditional DEX aggregators suffer high latency, front-running, and gas overhead. NEXUS eliminates all friction.
              </p>
              {['Zero Front-Running (MEV Shield)', 'Sub-Millisecond Execution', 'Automated Non-Custodial Staking'].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '9px', fontSize: '0.9rem', color: '#374151', marginBottom: '10px' }}>
                  <CheckCircle2 size={17} color="#7C3AED" /> {text}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {[
                { label: 'NEXUS AI Protocol', value: '0.002ms', pct: '98%' },
                { label: 'Traditional DEX Aggregators', value: '1,200ms', pct: '22%', muted: true },
                { label: 'Centralized Exchanges', value: '450ms', pct: '42%', muted: true },
              ].map((row, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                    <span style={{ color: row.muted ? '#9CA3AF' : '#111827', fontWeight: row.muted ? 400 : 600 }}>{row.label}</span>
                    <span style={{ color: row.muted ? '#9CA3AF' : '#7C3AED', fontWeight: 700 }}>{row.value}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', borderRadius: '999px', background: '#F3F4F6', overflow: 'hidden' }}>
                    <div style={{ width: row.pct, height: '100%', background: row.muted ? '#D1D5DB' : 'var(--brand-gradient)', borderRadius: '999px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
