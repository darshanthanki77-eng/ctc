// CTC App - Production Route Setup
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setWalletAddress } from './redux/slices/authSlice';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Kyc from './pages/Kyc';
import Withdrawal from './pages/Withdrawal';
import Downline from './pages/Downline';
import ReferralIncome from './pages/ReferralIncome';
import Transactions from './pages/Transactions';
import Profile from './pages/Profile';
import LevelIncome from './pages/LevelIncome';
import MiningHistory from './pages/MiningHistory';
import Login from './pages/Login';
import Register from './pages/Register';
import PackageHistory from './pages/PackageHistory';
import PromotionalBonusHistory from './pages/PromotionalBonusHistory';
import Notifications from './pages/Notifications';
import Landing from './pages/Landing';

const ProtectedLayout = () => {
  const { user } = useSelector((state) => state.auth);
  if (!user) {
    return <Navigate to="/landing" replace />;
  }
  return <Layout />;
};

// Add a public layout wrapper for landing/auth pages
const PublicLayout = () => {
  const { user } = useSelector((state) => state.auth);
  // If user is already authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
};

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    if (window.ethereum) {
      const handleAccounts = (accounts) => {
        if (accounts && accounts.length > 0) {
          dispatch(setWalletAddress(accounts[0]));
        } else {
          dispatch(setWalletAddress(null));
        }
      };

      window.ethereum.on('accountsChanged', handleAccounts);

      // Check initial connection
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts) => {
          if (accounts && accounts.length > 0) {
            dispatch(setWalletAddress(accounts[0]));
          }
        })
        .catch((err) => {
          console.error('Ethereum connection error:', err);
          dispatch(setWalletAddress(null));
        });
    } else {
      dispatch(setWalletAddress(null));
    }
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - Redirect to dashboard if already logged in */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected Dashboard Layout Routes */}
        <Route element={<ProtectedLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="packages" element={<Products />} />
          <Route path="kyc" element={<Kyc />} />
          <Route path="withdrawal" element={<Withdrawal />} />
          <Route path="downline" element={<Downline />} />
          <Route path="network" element={<Downline />} />
          <Route path="referral-income" element={<ReferralIncome />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="profile" element={<Profile />} />
          <Route path="level-income" element={<LevelIncome />} />
          <Route path="mining" element={<MiningHistory />} />
          <Route path="copy-trade" element={<MiningHistory />} />
          <Route path="package-history" element={<PackageHistory />} />
          <Route path="promotional-bonus" element={<PromotionalBonusHistory />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* Support Legacy /app routes */}
        <Route path="/app" element={<ProtectedLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="packages" element={<Products />} />
          <Route path="kyc" element={<Kyc />} />
          <Route path="withdrawal" element={<Withdrawal />} />
          <Route path="downline" element={<Downline />} />
          <Route path="network" element={<Downline />} />
          <Route path="referral-income" element={<ReferralIncome />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="profile" element={<Profile />} />
          <Route path="level-income" element={<LevelIncome />} />
          <Route path="mining" element={<MiningHistory />} />
          <Route path="copy-trade" element={<MiningHistory />} />
          <Route path="package-history" element={<PackageHistory />} />
          <Route path="promotional-bonus" element={<PromotionalBonusHistory />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* Fallback Catch-All - Redirect to landing for unauthenticated, dashboard for authenticated */}
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
