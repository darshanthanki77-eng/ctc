import React, { useState } from 'react';
import { Wallet, Cpu, TrendingUp } from 'lucide-react';

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { num: '01', icon: <Wallet size={22} color="#7C3AED" />, title: 'Connect Wallet', desc: 'Link your Web3 wallet (MetaMask, Phantom, Ledger) in one click with zero setup friction.', detail: 'Supports multi-sig institutional vaults and Hardware Security Modules.' },
    { num: '02', icon: <Cpu size={22} color="#7C3AED" />, title: 'Deploy AI Strategy', desc: 'Select pre-configured neural yield strategies or customize algorithmic leverage bounds.', detail: 'Real-time simulations validate risk profiles prior to deployment.' },
    { num: '03', icon: <TrendingUp size={22} color="#7C3AED" />, title: 'Stream Real-Time Yield', desc: 'Watch high-frequency returns stream directly into your secure vault every second.', detail: 'Compound automatically or withdraw with zero exit penalty at any time.' },
  ];

  return (
    <section className="lp-section-padding lp-section-white">
      <div className="lp-container">
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 52px auto' }}>
          <div className="lp-glass-pill" style={{ marginBottom: '14px' }}>3-Step Execution</div>
          <h2 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.9rem)', marginBottom: '14px' }}>
            How <span className="lp-text-gradient">CTC Works</span>
          </h2>
          <p style={{ color: '#6B7280', fontSize: '1.05rem' }}>Start generating autonomous yield in under 60 seconds.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {steps.map((step, idx) => (
            <div key={idx} className="lp-glass-card" onClick={() => setActiveStep(idx)} style={{
              padding: '32px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '14px',
              borderColor: activeStep === idx ? '#7C3AED' : '#E5E7EB',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--lp-font-display)', color: activeStep === idx ? '#7C3AED' : '#D1D5DB' }}>{step.num}</span>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: activeStep === idx ? '#EDE9FE' : '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {step.icon}
                </div>
              </div>
              <h3 style={{ fontSize: '1.2rem', color: '#111827' }}>{step.title}</h3>
              <p style={{ color: '#6B7280', fontSize: '0.9rem', lineHeight: 1.6 }}>{step.desc}</p>
              <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#F9FAFB', border: '1px solid #F3F4F6', fontSize: '0.8rem', color: '#9CA3AF' }}>
                💡 {step.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
