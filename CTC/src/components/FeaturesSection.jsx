import React from 'react';
import { Cpu, ShieldCheck, Zap, BarChart3, RefreshCw, Layers } from 'lucide-react';

const FeaturesSection = () => {
  const features = [
    { icon: <Cpu size={22} color="#7C3AED" />, title: 'Quantum Neural Engine', desc: 'Autonomous AI agents adjust routing parameters based on real-time orderbook depth and gas fluctuations.' },
    { icon: <Zap size={22} color="#7C3AED" />, title: 'Sub-Millisecond Speed', desc: 'FPGA hardware acceleration guarantees standard execution latency under 0.002ms.' },
    { icon: <ShieldCheck size={22} color="#7C3AED" />, title: 'Zero-Trust Encryption', desc: 'Formally verified smart contracts backed by zk-SNARK cryptographic proofs and non-custodial key ownership.' },
    { icon: <BarChart3 size={22} color="#7C3AED" />, title: 'Institutional Telemetry', desc: 'Real-time reporting dashboards with live PnL analytics, yield heatmaps, and latency metrics.' },
    { icon: <RefreshCw size={22} color="#7C3AED" />, title: 'Automated Yield Harvest', desc: 'Continuously compounds and re-invests staking rewards across optimal pools.' },
    { icon: <Layers size={22} color="#7C3AED" />, title: 'Universal Multi-Chain', desc: 'Native interoperability across Ethereum, Solana, Arbitrum, Sui, and custom L2/L3 rollups.' },
  ];

  return (
    <section id="features" className="section-padding section-white">
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 52px auto' }}>
          <div className="glass-pill" style={{ marginBottom: '14px' }}>Platform Capabilities</div>
          <h2 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.9rem)', marginBottom: '14px' }}>
            Built for <span className="text-gradient">Unlimited Scale</span>
          </h2>
          <p style={{ color: '#6B7280', fontSize: '1.05rem' }}>
            Every component is engineered for institutional capital, high performance, and uncompromising reliability.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {features.map((item, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.icon}
              </div>
              <h3 style={{ fontSize: '1.15rem', color: '#111827' }}>{item.title}</h3>
              <p style={{ color: '#6B7280', fontSize: '0.9rem', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
