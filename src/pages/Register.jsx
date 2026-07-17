import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { register, reset } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';
import { User, Mail, Lock, Eye, EyeOff, ShieldCheck, UserPlus, Link2 } from 'lucide-react';
import logo from '../assets/logo.png';

const extractSponsorId = (text) => {
  if (!text) return '';
  const cleanText = text.trim();
  try {
    if (cleanText.includes('?ref=') || cleanText.includes('&ref=')) {
      const urlParams = new URLSearchParams(cleanText.split('?')[1]);
      const ref = urlParams.get('ref');
      if (ref) return ref.toUpperCase();
    }
    if (cleanText.includes('?sponsor=') || cleanText.includes('&sponsor=')) {
      const urlParams = new URLSearchParams(cleanText.split('?')[1]);
      const sponsor = urlParams.get('sponsor');
      if (sponsor) return sponsor.toUpperCase();
    }
    if (cleanText.includes('?sponsorId=') || cleanText.includes('&sponsorId=')) {
      const urlParams = new URLSearchParams(cleanText.split('?')[1]);
      const sponsorId = urlParams.get('sponsorId');
      if (sponsorId) return sponsorId.toUpperCase();
    }
    if (cleanText.startsWith('http://') || cleanText.startsWith('https://')) {
      const url = new URL(cleanText);
      const ref = url.searchParams.get('ref') || url.searchParams.get('sponsor') || url.searchParams.get('sponsorId');
      if (ref) return ref.toUpperCase();
    }
  } catch (error) {
    console.error('Failed parsing referral link:', error);
  }
  return cleanText.toUpperCase();
};

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    sponsorId: '',
    password: '',
    confirmPassword: ''
  });
  const [showPwd, setShowPwd] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref') || params.get('sponsor') || params.get('sponsorId');
    if (ref) {
      setFormData((prev) => ({ ...prev, sponsorId: ref.toUpperCase() }));
    }
  }, [location.search]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    if (isSuccess || user) {
      navigate('/dashboard');
    }
    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const handleChange = (e) => {
    let value = e.target.value;
    if (e.target.name === 'sponsorId') {
      value = extractSponsorId(value);
    }
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handlePaste = (e) => {
    if (e.target.name === 'sponsorId') {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const extractedId = extractSponsorId(pastedText);
      setFormData((prev) => ({ ...prev, sponsorId: extractedId }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    const userData = {
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      sponsorId: formData.sponsorId
    };
    dispatch(register(userData));
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
            <img src={logo} alt="CTC Logo" style={{ height: 68, width: 'auto', maxWidth: '240px', objectFit: 'contain' }} />
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 40,
            fontWeight: 700,
            color: '#111111',
            lineHeight: 1.2,
            marginBottom: 8,
          }}>
            Build Your Downline.<br />
            <span style={{
              background: 'linear-gradient(135deg, #F310FD, #7C3AED)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Earn Pool Bonuses
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
            Join an expanding DeFi staking network and secure your financial nodes.
          </p>

          {/* Benefit Cards (3 small glass cards grid) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            marginBottom: 40,
          }}>
            {[
              { icon: '💰', text: '0.5%-0.8% ROI every 12 hours' },
              { icon: '👥', text: '5 Level network referral system' },
              { icon: '🏆', text: 'Booster dividends & Rank pools' },
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
              Fast Accruals (BSC)
            </div>
            <span style={{ fontSize: 13, color: '#8B8BA8', fontWeight: 500 }}>
              Join CTC global node structure
            </span>
          </div>
        </div>
      </div>

      {/* ── Right Column: Register Form */}
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
            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#111111', margin: '0 0 4px' }}>Create Your Account</h2>
            <p style={{ fontSize: 16, color: '#8B8BA8', margin: 0 }}>Start earning with CTC today</p>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(0, 0, 0, 0.06)', marginBottom: 24 }} />

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#4B4B6B', marginBottom: 6 }}>Full Name</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={16} style={{ position: 'absolute', left: 14, color: '#8B8BA8', opacity: 0.8 }} />
                <input 
                  className="form-input" 
                  name="fullName"
                  placeholder="Your full name" 
                  type="text" 
                  required
                  value={formData.fullName} 
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px 12px 44px', 
                    background: '#F5F3FF', 
                    border: '1px solid rgba(0, 0, 0, 0.06)', 
                    borderRadius: 12, 
                    fontSize: 15, 
                    color: '#111111',
                    transition: 'all 0.3s ease'
                  }} 
                />
              </div>
            </div>

            {/* Email Address */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#4B4B6B', marginBottom: 6 }}>Email Address</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, color: '#8B8BA8', opacity: 0.8 }} />
                <input 
                  className="form-input" 
                  name="email"
                  placeholder="you@example.com" 
                  type="email" 
                  required
                  value={formData.email} 
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px 12px 44px', 
                    background: '#F5F3FF', 
                    border: '1px solid rgba(0, 0, 0, 0.06)', 
                    borderRadius: 12, 
                    fontSize: 15, 
                    color: '#111111',
                    transition: 'all 0.3s ease'
                  }} 
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#4B4B6B', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, color: '#8B8BA8', opacity: 0.8 }} />
                <input 
                  className="form-input" 
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Create a strong password" 
                  required
                  value={formData.password} 
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    padding: '12px 44px 12px 44px', 
                    background: '#F5F3FF', 
                    border: '1px solid rgba(0, 0, 0, 0.06)', 
                    borderRadius: 12, 
                    fontSize: 15, 
                    color: '#111111',
                    transition: 'all 0.3s ease'
                  }} 
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#4B4B6B', marginBottom: 6 }}>Confirm Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, color: '#8B8BA8', opacity: 0.8 }} />
                <input 
                  className="form-input" 
                  name="confirmPassword"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Confirm your password" 
                  required
                  value={formData.confirmPassword} 
                  onChange={handleChange}
                  style={{ 
                    width: '100%', 
                    padding: '12px 44px 12px 44px', 
                    background: '#F5F3FF', 
                    border: '1px solid rgba(0, 0, 0, 0.06)', 
                    borderRadius: 12, 
                    fontSize: 15, 
                    color: '#111111',
                    transition: 'all 0.3s ease'
                  }} 
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Sponsor ID */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#4B4B6B', marginBottom: 6 }}>Sponsor ID <span style={{ fontSize: 11, color: '#8B8BA8', fontWeight: 500 }}>(Required)</span></label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Link2 size={16} style={{ position: 'absolute', left: 14, color: '#8B8BA8', opacity: 0.8 }} />
                <input 
                  className="form-input" 
                  name="sponsorId"
                  placeholder="e.g. CTC-10001" 
                  type="text" 
                  required
                  value={formData.sponsorId} 
                  onChange={handleChange}
                  onPaste={handlePaste}
                  style={{ 
                    width: '100%', 
                    padding: '12px 16px 12px 44px', 
                    background: '#F5F3FF', 
                    border: '1px solid rgba(0, 0, 0, 0.06)', 
                    borderRadius: 12, 
                    fontSize: 15, 
                    color: '#111111',
                    transition: 'all 0.3s ease'
                  }} 
                />
              </div>
              <span style={{ fontSize: 11, color: '#8B8BA8', marginTop: 4, display: 'block' }}>Enter your sponsor's referral ID or paste their link</span>
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
              <UserPlus size={18} />
              {isLoading ? 'Creating Account...' : 'Create Free Account →'}
            </button>
          </form>

          {/* Account Login Link */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 24, fontSize: 15, color: '#8B8BA8' }}>
            Already have an account?{' '}
            <Link 
              to="/login" 
              style={{ 
                color: '#F310FD', 
                fontWeight: 600, 
                textDecoration: 'none'
              }}
            >
              Sign In
            </Link>
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
