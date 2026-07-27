import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Packages from './pages/Packages';
import Withdrawals from './pages/Withdrawals';
import Kyc from './pages/Kyc';
import Referrals from './pages/Referrals';
import Mining from './pages/Mining';
import Settings from './pages/Settings';
import Cron from './pages/Cron';
import CronRunDetail from './pages/CronRunDetail';
import Fraud from './pages/Fraud';
import Transactions from './pages/Transactions';
import PackageHistory from './pages/PackageHistory';
import ManualBuys from './pages/ManualBuys';
import Login from './pages/Login';

const ProtectedRoute = ({ children }) => {
  const adminUser = JSON.parse(localStorage.getItem('adminUser'));
  if (!adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'subadmin')) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PageProtectedRoute = ({ children, pageKey }) => {
  const adminUser = JSON.parse(localStorage.getItem('adminUser'));
  if (!adminUser) return <Navigate to="/login" replace />;
  if (adminUser.role === 'admin') return children;
  if (adminUser.role === 'subadmin') {
    if (adminUser.accessiblePages && adminUser.accessiblePages.includes(pageKey)) {
      return children;
    }
    const firstPage = adminUser.accessiblePages?.[0];
    if (firstPage) {
      return <Navigate to={`/${firstPage}`} replace />;
    }
  }
  return <Navigate to="/login" replace />;
};

const IndexRedirect = () => {
  const adminUser = JSON.parse(localStorage.getItem('adminUser'));
  if (!adminUser) return <Navigate to="/login" replace />;
  if (adminUser.role === 'admin' || (adminUser.accessiblePages && adminUser.accessiblePages.includes('dashboard'))) {
    return <Navigate to="/dashboard" replace />;
  }
  const firstPage = adminUser.accessiblePages?.[0];
  if (firstPage) {
    return <Navigate to={`/${firstPage}`} replace />;
  }
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<IndexRedirect />} />
          <Route path="dashboard" element={<PageProtectedRoute pageKey="dashboard"><Dashboard /></PageProtectedRoute>} />
          <Route path="users" element={<PageProtectedRoute pageKey="users"><Users /></PageProtectedRoute>} />
          <Route path="packages" element={<PageProtectedRoute pageKey="packages"><Packages /></PageProtectedRoute>} />
          <Route path="package-history" element={<PageProtectedRoute pageKey="package-history"><PackageHistory /></PageProtectedRoute>} />
          <Route path="manual-buys" element={<PageProtectedRoute pageKey="manual-buys"><ManualBuys /></PageProtectedRoute>} />
          <Route path="withdrawals" element={<PageProtectedRoute pageKey="withdrawals"><Withdrawals /></PageProtectedRoute>} />
          <Route path="kyc" element={<PageProtectedRoute pageKey="kyc"><Kyc /></PageProtectedRoute>} />
          <Route path="referrals" element={<PageProtectedRoute pageKey="referrals"><Referrals /></PageProtectedRoute>} />
          <Route path="mining" element={<PageProtectedRoute pageKey="mining"><Mining /></PageProtectedRoute>} />
          <Route path="settings" element={<PageProtectedRoute pageKey="settings"><Settings /></PageProtectedRoute>} />
          <Route path="cron" element={<PageProtectedRoute pageKey="cron"><Cron /></PageProtectedRoute>} />
          <Route path="cron/run/:date" element={<PageProtectedRoute pageKey="cron"><CronRunDetail /></PageProtectedRoute>} />
          <Route path="fraud" element={<PageProtectedRoute pageKey="fraud"><Fraud /></PageProtectedRoute>} />
          <Route path="transactions" element={<PageProtectedRoute pageKey="transactions"><Transactions /></PageProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
