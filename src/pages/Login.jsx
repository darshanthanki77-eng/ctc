import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { login, reset } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';
import { Key, Lock, Eye, EyeOff, ShieldCheck, LogIn } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Login() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      const userData = {
        _id: params.get('_id'),
        userId: params.get('userId'),
        fullName: params.get('fullName'),
        email: params.get('email'),
        role: params.get('role'),
        isKYCVerified: params.get('isKYCVerified') === 'true',
        token: token
      };
      localStorage.setItem('user', JSON.stringify(userData));
      window.location.href = '/dashboard';
    }
  }, []);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    if (isSuccess || user) {
      navigate('/dashboard');
    }
    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userId || !password) {
      toast.error('Please enter your User ID and password.');
      return;
    }
    dispatch(login({ userId: userId.toUpperCase(), password }));
  };

  return (
    <div style={{
      minHeight: '100vh', 
      display: 'flex', 
      background: '#F8F7FC',
      fontFamily: 'Inter, sans-serif',
      flexDirection: 'row',
      flexWrap: 'wrap',
    }}>
      {/* Background Blobs */}
      <div style={{
        position: 'absolute', top: '-30%', right: '-30%', width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(243,16,253,0.06), transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: -80, width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(124,58,237,0.04), transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      {/* ── Left Column: Brand / Hero Section */}
      <div className="auth-left-panel" style={{
        flex: '1 1 500px',
        padding: '60px 48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F8F7FC 0%, #F0EEFF 100%)',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
      }}>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
          {/* Logo Image */}
          <div style={{ marginBottom: 28 }}>
            <Link to="/">
              <img src={logo} alt="CTC Logo" style={{ height: 68, width: 'auto', maxWidth: '240px', objectFit: 'contain', cursor: 'pointer' }} />
            </Link>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 40,
            fontWeight: 700,
            color: '#111111',
            lineHeight: 1.2,
            marginBottom: 8,
          }}>
            Trade Smart.<br />
            <span style={{
              background: 'linear-gradient(135deg, #F310FD, #7C3AED)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Earn Daily
            </span>
          </h1>

          {/* Description */}
          <p style={{
            fontSize: 18,
            color: '#4B4B6B',
            lineHeight: 1.6,
            marginBottom: 32,
            maxWidth: 420,
          }}>
            Decentralized copy trading platform on Binance Smart Chain.
          </p>

          {/* Benefit Cards (3 small glass cards grid) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            marginBottom: 40,
          }}>
            {[
              { icon: '📈', text: '12,400+ Active Traders' },
              { icon: '🛡️', text: 'Audited Smart Contracts' },
              { icon: '⚡', text: 'Passive daily yields paid out' },
            ].map((b, i) => (
              <div key={i} style={{
                background: 'rgba(255, 255, 255, 0.72)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.80)',
                borderRadius: 12,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              }}>
                <span style={{ fontSize: 20 }}>{b.icon}</span>
                <span style={{ fontSize: 12, color: '#4B4B6B', fontWeight: 600, lineHeight: 1.3 }}>{b.text}</span>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.72)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(243, 16, 253, 0.15)',
              borderRadius: 20,
              padding: '6px 16px',
              fontSize: 12,
              fontWeight: 600,
              color: '#F310FD',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F310FD' }} />
              Secured DeFi Platform
            </div>
            <span style={{ fontSize: 13, color: '#8B8BA8', fontWeight: 500 }}>
              Trusted by 10,000+ investors
            </span>
          </div>
        </div>
      </div>

      {/* ── Right Column: Login Form */}
      <div style={{
        flex: '1 1 500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        background: '#F8F7FC',
        minHeight: '100vh',
      }}>
        <div className="auth-card fade-up">
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#111111', margin: '0 0 4px' }}>Welcome back</h2>
            <p style={{ fontSize: 16, color: '#8B8BA8', margin: 0 }}>Sign in to access your node dashboard</p>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(0, 0, 0, 0.06)', marginBottom: 24 }} />

          <form onSubmit={handleSubmit}>
            {/* CTC User ID */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#4B4B6B', marginBottom: 6 }}>CTC User ID</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Key size={16} style={{ position: 'absolute', left: 14, color: '#8B8BA8', opacity: 0.8 }} />
                <input 
                  className="form-input" 
                  placeholder="e.g. CTC-10001" 
                  type="text" 
                  required
                  value={userId} 
                  onChange={e => setUserId(e.target.value.toUpperCase())}
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px 14px 44px', 
                    background: '#F5F3FF', 
                    border: '1px solid rgba(0, 0, 0, 0.06)', 
                    borderRadius: 12, 
                    fontSize: 15, 
                    color: '#111111',
                    transition: 'all 0.3s ease'
                  }} 
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#4B4B6B', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, color: '#8B8BA8', opacity: 0.8 }} />
                <input 
                  className="form-input" 
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••" 
                  required
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '14px 44px 14px 44px', 
                    background: '#F5F3FF', 
                    border: '1px solid rgba(0, 0, 0, 0.06)', 
                    borderRadius: 12, 
                    fontSize: 15, 
                    color: '#111111',
                    transition: 'all 0.3s ease'
                  }} 
                  autoComplete="current-password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPwd(!showPwd)}
                  style={{ 
                    position: 'absolute', 
                    right: 14, 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer',
                    color: '#8B8BA8',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={isLoading}
              style={{ 
                width: '100%', 
                height: 48, 
                borderRadius: 12, 
                color: 'white', 
                fontSize: 16, 
                fontWeight: 700, 
                boxShadow: '0 4px 12px var(--pink-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: 'var(--gradient)',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              <LogIn size={18} />
              {isLoading ? 'Signing In...' : 'Sign In →'}
            </button>
          </form>

          {/* Account Creation Link */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 24, fontSize: 15, color: '#8B8BA8' }}>
            Don't have an account?{' '}
            <Link 
              to="/register" 
              style={{ 
                color: '#F310FD', 
                fontWeight: 600, 
                textDecoration: 'none'
              }}
            >
              Create Account
            </Link>
          </div>

          {/* Access Admin Portal */}
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <a href="/admin" style={{ fontSize: 12, fontWeight: 600, color: '#8B8BA8', textDecoration: 'none' }}>
              Access Admin Portal →
            </a>
          </div>

          {/* Security Badge */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            marginTop: 20,
            paddingTop: 20,
            borderTop: '1px solid rgba(0, 0, 0, 0.06)',
            fontSize: 13,
            color: '#8B8BA8',
          }}>
            <span className="live-dot" style={{ background: '#22C55E' }} />
            <span>Secured on BSC Mainnet</span>
          </div>
        </div>
      </div>
    </div>
  );
}
