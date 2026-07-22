import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowRight, Shield, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const LandingFinalCTA = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, colors: ['#7C3AED', '#9333EA', '#A855F7', '#FFFFFF'] });
    setSubmitted(true);
  };

  return (
    <section id="cta" className="lp-section-padding lp-section-white">
      <div className="lp-container">
        <div className="lp-glass-card" style={{
          padding: 'clamp(40px, 6vw, 70px) 32px', textAlign: 'center',
          background: 'linear-gradient(135deg, #FAFAFA 0%, #F5F3FF 100%)',
        }}>
          <div className="lp-glass-pill lp-animate-float" style={{ marginBottom: '18px' }}>Instant Access</div>

          <h2 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', color: '#111827', marginBottom: '16px', lineHeight: 1.1 }}>
            Enter the Future of<br />
            <span className="lp-text-gradient">Autonomous Capital</span>
          </h2>

          <p style={{ color: '#6B7280', fontSize: '1.1rem', marginBottom: '36px', maxWidth: '600px', margin: '0 auto 36px auto', lineHeight: 1.6 }}>
            Join thousands of institutional traders harnessing sub-millisecond AI liquidity routing on CTC.
          </p>

          {submitted ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 28px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', fontWeight: 700, fontSize: '1rem' }}>
              <CheckCircle2 size={22} color="#059669" /> Priority Access Granted! Welcome to CTC.
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', maxWidth: '500px', margin: '0 auto', flexWrap: 'wrap' }}>
              <input
                type="email" placeholder="Enter your email address..." value={email}
                onChange={e => setEmail(e.target.value)} required
                style={{
                  flex: 1, minWidth: '240px', padding: '12px 20px', borderRadius: '10px',
                  border: '1px solid #E5E7EB', background: '#FFFFFF', color: '#111827',
                  fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#7C3AED'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              />
              <button type="submit" className="lp-btn-primary">
                Claim Access <ArrowRight size={16} />
              </button>
            </form>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '24px', color: '#9CA3AF', fontSize: '0.825rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Shield size={14} /> Non-Custodial</span>
            <span>•</span>
            <span>Zero Protocol Fees</span>
            <span>•</span>
            <span>24/7 Support</span>
          </div>

          <div style={{ marginTop: '28px' }}>
            <Link to="/register" className="lp-btn-primary" style={{ textDecoration: 'none', marginRight: '12px' }}>
              Register Now <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="lp-btn-secondary" style={{ textDecoration: 'none' }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingFinalCTA;
