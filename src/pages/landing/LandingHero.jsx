import React, { useState, useEffect } from 'react';
import AntiGravityHeroCanvas from './AntiGravityHeroCanvas';
import { ArrowRight, Play, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingHero = () => {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      setMouseOffset({
        x: (e.clientX - innerWidth / 2) / (innerWidth / 2),
        y: (e.clientY - innerHeight / 2) / (innerHeight / 2),
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section style={{
      position: 'relative', minHeight: '100vh', width: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      paddingTop: '110px', paddingBottom: '70px', overflow: 'hidden',
      background: 'linear-gradient(160deg, #FAFAFA 0%, #F5F3FF 60%, #EDE9FE 100%)',
    }}>
      {/* Subtle particles */}
      <AntiGravityHeroCanvas />

      <div className="lp-container" style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: '860px', margin: '0 auto' }}>

          {/* Badge */}
          <div className="lp-glass-pill lp-animate-float" style={{ marginBottom: '24px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#7C3AED', display: 'inline-block' }} />
            AI-Powered Copy Trade Compare Platform
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2.4rem, 5.5vw, 4.5rem)', lineHeight: 1.1,
            fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '20px', color: '#111827',
          }}>
            Autonomous Finance{' '}<br />
            <span className="lp-text-gradient">Powered by AI</span>
          </h1>

          {/* Subtext */}
          <p style={{
            fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', lineHeight: 1.65,
            color: '#6B7280', maxWidth: '660px', marginBottom: '36px',
          }}>
            Sub-millisecond liquidity routing, decentralized multi-chain compute, and algorithmic yield optimization — built for institutions on BSC.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '56px' }}>
            <Link to="/login" className="lp-btn-primary" style={{ textDecoration: 'none' }}>
              Start Trading <ArrowRight size={18} />
            </Link>
            <a href="#market" className="lp-btn-secondary">
              <Play size={16} fill="#374151" color="#374151" /> Watch Demo
            </a>
          </div>

          {/* Stat Cards */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px', width: '100%',
          }}>
            {[
              { icon: <TrendingUp size={20} color="#7C3AED" />, label: 'Total Liquidity', value: '$14.82B+', badge: '+24.8% APY', badgeColor: '#059669', badgeBg: '#ECFDF5' },
              { icon: <Zap size={20} color="#7C3AED" />, label: 'Execution Speed', value: '0.002 ms', badge: 'Sub-ms', badgeColor: '#7C3AED', badgeBg: '#EDE9FE' },
              { icon: <ShieldCheck size={20} color="#7C3AED" />, label: 'Security Uptime', value: '99.999%', badge: 'Audited v4', badgeColor: '#2563EB', badgeBg: '#EFF6FF' },
            ].map((item, idx) => (
              <div key={idx} className="lp-glass-card" style={{ padding: '22px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: '999px', background: item.badgeBg, color: item.badgeColor, fontWeight: 700 }}>
                    {item.badge}
                  </span>
                </div>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--lp-font-display)', color: '#111827' }}>
                  {item.value}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#9CA3AF', marginTop: '4px' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
