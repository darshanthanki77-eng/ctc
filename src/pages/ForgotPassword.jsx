import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import api from '../api';
import logo from '../assets/logo.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your registered email address.');
      return;
    }
    
    try {
      setIsLoading(true);
      const res = await api.post('/auth/forgot-password', { email });
      toast.success(res.data.message || 'Reset link sent successfully!');
      setIsSent(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
          <div style={{ marginBottom: 28 }}>
            <Link to="/">
              <img src={logo} alt="CTC Logo" style={{ height: 68, width: 'auto', maxWidth: '240px', objectFit: 'contain', cursor: 'pointer' }} />
            </Link>
          </div>
          <h1 style={{
            fontSize: 40,
            fontWeight: 700,
            color: '#111111',
            lineHeight: 1.2,
            marginBottom: 8,
          }}>
            Forgot your<br />
            <span style={{
              background: 'linear-gradient(135deg, #F310FD, #7C3AED)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Password?
            </span>
          </h1>
          <p style={{
            fontSize: 18,
            color: '#4B4B6B',
            lineHeight: 1.6,
            marginBottom: 32,
            maxWidth: 420,
          }}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>
      </div>

      {/* ── Right Column: Form */}
      <div style={{
        flex: '1 1 500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        background: '#F8F7FC',
        minHeight: '100vh',
      }}>
        <div className="auth-card fade-up" style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#111111', margin: '0 0 4px' }}>Reset Password</h2>
            <p style={{ fontSize: 16, color: '#8B8BA8', margin: 0 }}>Request email reset link</p>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(0, 0, 0, 0.06)', marginBottom: 24 }} />

          {isSent ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Send size={24} style={{ color: '#22C55E' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111111', margin: '0 0 8px' }}>Email Sent Successfully</h3>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.5, marginBottom: 24 }}>
                A password reset link has been sent to <strong>{email}</strong>. Please check your inbox and spam folder.
              </p>
              <Link to="/login" className="btn-primary" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'var(--gradient)', color: 'white', fontWeight: 700, textDecoration: 'none'
              }}>
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#4B4B6B', marginBottom: 6 }}>Email Address</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, color: '#8B8BA8', opacity: 0.8 }} />
                  <input 
                    placeholder="Enter your registered email" 
                    type="email" 
                    required
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
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
                  />
                </div>
              </div>

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
                {isLoading ? 'Sending Request...' : 'Send Reset Link'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 24, fontSize: 15, color: '#8B8BA8' }}>
                <Link to="/login" style={{ color: '#7C3AED', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ArrowLeft size={16} /> Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
