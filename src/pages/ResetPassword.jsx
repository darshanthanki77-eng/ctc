import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';
import api from '../api';
import logo from '../assets/logo.png';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error('Invalid or missing password reset token.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.post('/auth/reset-password', { token, newPassword: password });
      toast.success(res.data.message || 'Password reset successfully!');
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to reset password. Token may have expired.');
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

      {/* ── Left Column */}
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
            Set your new<br />
            <span style={{
              background: 'linear-gradient(135deg, #F310FD, #7C3AED)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Password
            </span>
          </h1>
          <p style={{
            fontSize: 18,
            color: '#4B4B6B',
            lineHeight: 1.6,
            marginBottom: 32,
            maxWidth: 420,
          }}>
            Enter your new secure password below to complete the reset process.
          </p>
        </div>
      </div>

      {/* ── Right Column */}
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
            <h2 style={{ fontSize: 28, fontWeight: 700, color: '#111111', margin: '0 0 4px' }}>New Password</h2>
            <p style={{ fontSize: 16, color: '#8B8BA8', margin: 0 }}>Create a new password for your account</p>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(0, 0, 0, 0.06)', marginBottom: 24 }} />

          {isSuccess ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle2 size={24} style={{ color: '#22C55E' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111111', margin: '0 0 8px' }}>Password Reset Success</h3>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.5, marginBottom: 24 }}>
                Your password has been successfully updated. You can now log in using your new password.
              </p>
              <Link to="/login" className="btn-primary" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'var(--gradient)', color: 'white', fontWeight: 700, textDecoration: 'none'
              }}>
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* New Password */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#4B4B6B', marginBottom: 6 }}>New Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, color: '#8B8BA8', opacity: 0.8 }} />
                  <input 
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Min 6 characters" 
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
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#4B4B6B', marginBottom: 6 }}>Confirm New Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, color: '#8B8BA8', opacity: 0.8 }} />
                  <input 
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Confirm password" 
                    required
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)}
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
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isLoading || !token}
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
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
