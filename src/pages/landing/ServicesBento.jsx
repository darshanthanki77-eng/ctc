import React, { useState } from 'react';
import { Cpu, Globe, Zap, Shield, Layers, Lock, RefreshCcw, Activity } from 'lucide-react';

const ServicesBento = () => {
  const [tilt, setTilt] = useState({ cardId: null, rx: 0, ry: 0 });

  const handleMouseMove = (e, id) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rx = -((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * 6;
    const ry = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 6;
    setTilt({ cardId: id, rx, ry });
  };
  const handleMouseLeave = () => setTilt({ cardId: null, rx: 0, ry: 0 });

  const cards = [
    {
      id: 1,
      icon: <Globe size={22} color="#7C3AED" />,
      title: 'Autonomous Liquidity Routing',
      desc: 'Routes trades across 40+ liquid chains with zero slippage and smart order splitting.',
      tag: '0.002ms',
    },
    {
      id: 2,
      icon: <Zap size={22} color="#7C3AED" />,
      title: 'Neural Predictive Alpha',
      desc: 'Deep learning models forecast yield anomalies and execute microsecond hedging.',
      tag: 'AI Alpha',
    },
    {
      id: 3,
      icon: <Shield size={22} color="#7C3AED" />,
      title: 'zk-SNARK Encryption Vault',
      desc: 'Institutional-grade privacy with zero-knowledge cryptographic proof verification.',
      tag: '100% Private',
    },
    {
      id: 4,
      icon: <Layers size={22} color="#7C3AED" />,
      title: 'Atomic Multi-Chain Bridge',
      desc: 'Cross-chain transfers without bridging risks, wrapped tokens, or delays.',
      tag: 'Multi-Chain',
    },
    {
      id: 5,
      icon: <Cpu size={22} color="#7C3AED" />,
      title: 'Quantum Order Matching',
      desc: 'Direct memory access FPGA kernel processing millions of orders per second.',
      tag: 'FPGA Speed',
    },
    {
      id: 6,
      icon: <Lock size={22} color="#7C3AED" />,
      title: 'Real-Time MEV Shield',
      desc: 'Protects trades against front-running and sandwich attacks via private mempools.',
      tag: 'MEV Protected',
    },
    {
      id: 7,
      icon: <RefreshCcw size={22} color="#7C3AED" />,
      title: 'Cross-Chain Yield Optimizer',
      desc: 'Automatically harvests and compounds staking returns across optimal pools.',
      tag: 'Auto-Harvest',
    },
    {
      id: 8,
      icon: <Activity size={22} color="#7C3AED" />,
      title: 'Automated Rebalancing',
      desc: 'Self-balancing capital allocation nodes maintaining user-defined risk limits.',
      tag: 'Autonomous',
    },
  ];

  return (
    <section id="services" className="lp-section-padding lp-section-alt">
      <div className="lp-container">
        {/* Heading */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 52px auto' }}>
          <div className="lp-glass-pill" style={{ marginBottom: '14px' }}>
            <Cpu size={14} /> Next-Gen Architecture
          </div>
          <h2 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.9rem)', marginBottom: '14px' }}>
            Autonomous <span className="lp-text-gradient">Services Fabric</span>
          </h2>
          <p style={{ color: '#6B7280', fontSize: '1.05rem' }}>
            A modular 8-engine suite engineered for high-frequency liquidity routing, privacy, and AI compute execution.
          </p>
        </div>

        {/* 4 Columns x 2 Rows Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
          }}
        >
          {cards.map((card) => (
            <div
              key={card.id}
              className="lp-glass-card"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '210px',
                transform:
                  tilt.cardId === card.id
                    ? `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`
                    : 'perspective(800px) rotateX(0) rotateY(0)',
                transition:
                  tilt.cardId === card.id
                    ? 'none'
                    : 'transform 0.4s ease, box-shadow 0.25s ease, border-color 0.25s ease',
              }}
              onMouseMove={(e) => handleMouseMove(e, card.id)}
              onMouseLeave={handleMouseLeave}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#F5F3FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {card.icon}
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '3px 9px',
                      borderRadius: '999px',
                      background: '#EDE9FE',
                      color: '#7C3AED',
                      fontWeight: 700,
                    }}
                  >
                    {card.tag}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', color: '#111827', marginBottom: '8px', fontWeight: 700 }}>
                  {card.title}
                </h3>
                <p style={{ color: '#6B7280', fontSize: '0.875rem', lineHeight: 1.55 }}>
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          #services .container > div:last-child {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
};

export default ServicesBento;
