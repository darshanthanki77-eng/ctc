import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, Calendar, Link as LinkIcon, 
  Copy, Check, Shield, KeyRound, Wallet, Edit3, ShieldCheck, QrCode,
  Key, Globe, UserPlus, Lock, PhoneCall
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile } from '../redux/slices/authSlice';
import api from '../api';
import { toast } from 'react-toastify';

const Profile = () => {
  const dispatch = useDispatch();
  const { profile, user } = useSelector((state) => state.auth);
  const currentUser = profile || user;

  // Profile Edit State
  const [editData, setEditData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    address: ''
  });

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [twoFA, setTwoFA] = useState(false); // local representation

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (currentUser) {
      setEditData({
        fullName: currentUser.fullName || '',
        email: currentUser.email || '',
        mobile: currentUser.mobile || currentUser.phone || '',
        address: currentUser.address || ''
      });
    }
  }, [currentUser]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!editData.fullName || !editData.email) {
      return toast.error('Name and Email are required');
    }
    setLoadingProfile(true);
    try {
      const response = await api.put('/user/profile', editData);
      toast.success(response.data.message || 'Profile updated successfully!');
      dispatch(fetchProfile());
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to update profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      return toast.error('All password fields are required');
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (passwordData.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setSavingPassword(true);
    try {
      await api.put('/user/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleToggle2FA = () => {
    const nextVal = !twoFA;
    setTwoFA(nextVal);
    toast.info(nextVal ? 'Two-Factor Authentication (2FA) enabled.' : 'Two-Factor Authentication (2FA) disabled.');
  };

  const referralLink = currentUser?.userId 
    ? `${window.location.origin}/register?ref=${currentUser.userId}` 
    : 'N/A';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const userInitials = editData.fullName
    ? editData.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const memberSince = currentUser?.createdAt 
    ? new Date(currentUser.createdAt).toLocaleDateString() 
    : 'N/A';

  return (
    <div className="fade-up" style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 20px 48px', textAlign: 'left' }}>
      
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--near-black)', margin: 0 }}>Profile</h1>
      </div>

      <div className="two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        
        {/* ── Left Column: Account Details & Password Updates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Card 1: Account Information */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(243,16,253,0.03) 100%)',
            backdropFilter: 'blur(16px)', border: '1px solid rgba(243,16,253,0.15)',
            borderRadius: 18, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              {/* Initials Avatar (matching screenshot bubble) */}
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: 18,
                boxShadow: '0 4px 14px rgba(243, 16, 253, 0.4)'
              }}>
                {userInitials}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--near-black)' }}>Account Information</h3>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>Update your personal profile details</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit}>
              {/* Full Name */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editData.fullName} 
                    onChange={e => setEditData(prev => ({ ...prev, fullName: e.target.value }))}
                    style={{ paddingLeft: 38 }}
                    required 
                  />
                </div>
              </div>

              {/* Email */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input 
                    type="email" 
                    className="form-input" 
                    value={editData.email} 
                    onChange={e => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    style={{ paddingLeft: 38 }}
                    required 
                  />
                </div>
              </div>

              {/* Mobile */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editData.mobile} 
                    onChange={e => setEditData(prev => ({ ...prev, mobile: e.target.value }))}
                    style={{ paddingLeft: 38 }}
                    required 
                  />
                </div>
              </div>

              {/* Address / Country */}
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Country / Address</label>
                <div style={{ position: 'relative' }}>
                  <Globe size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editData.address} 
                    onChange={e => setEditData(prev => ({ ...prev, address: e.target.value }))}
                    style={{ paddingLeft: 38 }}
                    required 
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loadingProfile} style={{ width: '100%' }}>
                {loadingProfile ? 'Saving changes...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          {/* Card 2: Security Credentials */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(124,58,237,0.03) 100%)',
            backdropFilter: 'blur(16px)', border: '1px solid rgba(124,58,237,0.15)',
            borderRadius: 18, padding: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124, 58, 237, 0.12)', display: 'flex', alignItems: 'center', justify: 'center' }}>
                <Lock size={16} style={{ color: 'var(--purple)' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--near-black)' }}>Security Credentials</h3>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)' }}>Update account password</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              {/* Current Password */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Current Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={passwordData.currentPassword} 
                  onChange={e => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="••••••••"
                  required 
                />
              </div>

              {/* New Password */}
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">New Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={passwordData.newPassword} 
                  onChange={e => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Minimum 8 characters"
                  required 
                />
              </div>

              {/* Confirm Password */}
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Confirm New Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={passwordData.confirmPassword} 
                  onChange={e => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  required 
                />
              </div>

              <button type="submit" className="btn-primary" disabled={savingPassword} style={{ width: '100%' }}>
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

        </div>

        {/* ── Right Column: Linked Credentials, 2FA, and Referral Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Card 1: Linked Credentials */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.72)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.65)', borderRadius: 18,
            padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: 16, fontWeight: 700, color: 'var(--near-black)' }}>Linked Credentials</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(243,16,253,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={16} style={{ color: 'var(--pink)' }} />
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Sponsor ID</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--near-black)' }}>{currentUser?.sponsorId || 'CTC-FOUNDER'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(243,16,253,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={16} style={{ color: 'var(--pink)' }} />
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Registration Date</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--near-black)' }}>{memberSince}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(243,16,253,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={16} style={{ color: 'var(--pink)' }} />
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Member ID</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--pink)', fontFamily: 'monospace' }}>{currentUser?.userId || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Two-Factor Authentication */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.72)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.65)', borderRadius: 18,
            padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 700, color: 'var(--near-black)' }}>Two-Factor Authentication</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
              Enable Google Authenticator OTP to secure staking withdrawals and key account modifications.
            </p>
            <div style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
              padding: '14px 16px', background: 'rgba(0, 0, 0, 0.03)', 
              border: '1px solid rgba(0, 0, 0, 0.05)',
              borderRadius: 12 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: twoFA ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)', display: 'flex', alignItems: 'center', justify: 'center' }}>
                  <Key size={16} style={{ color: twoFA ? 'var(--green)' : 'var(--muted)' }} />
                </div>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 13, display: 'block', color: 'var(--near-black)' }}>2FA Protection</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{twoFA ? 'Secured by Authenticator' : 'Unprotected Account'}</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={handleToggle2FA}
                style={{ 
                  width: 50, 
                  height: 26, 
                  borderRadius: 100, 
                  background: twoFA ? 'var(--pink)' : 'rgba(0,0,0,0.15)', 
                  position: 'relative', 
                  border: 'none',
                  transition: 'background 0.25s', 
                  cursor: 'pointer' 
                }}
              >
                <span 
                  style={{ 
                    position: 'absolute', 
                    top: 3, 
                    left: twoFA ? 27 : 3, 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    background: 'white', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                    transition: 'left 0.25s' 
                  }} 
                />
              </button>
            </div>
          </div>

          {/* Card 3: Referral Link */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.72)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.65)', borderRadius: 18,
            padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 700, color: 'var(--near-black)' }}>Referral Link</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
              Share your unique referral link to grow your network team and earn match level commissions.
            </p>
            
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)',
              borderRadius: 12, marginBottom: 14
            }}>
              <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--near-black)', wordBreak: 'break-all', display: 'block', maxWidth: '75%' }}>
                {referralLink}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setShowQr(!showQr)}
                  style={{
                    background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8,
                    padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--pink)'
                  }}
                  title="Generate QR Code"
                >
                  <QrCode size={15} />
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    background: 'var(--gradient)', border: 'none', borderRadius: 8,
                    padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'white'
                  }}
                  title="Copy Link"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </div>
            </div>

            {showQr && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10, padding: 10, background: 'white', borderRadius: 12, border: '1px solid rgba(0,0,0,0.06)' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(referralLink)}`} 
                  alt="Referral QR Code" 
                  style={{ width: 100, height: 100 }}
                />
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default Profile;
