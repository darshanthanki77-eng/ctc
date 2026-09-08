import React, { useState, useEffect } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import { 
  Zap, TrendingUp, DollarSign, Calendar, Clock, 
  CheckCircle2, RefreshCw, Layers, ShieldCheck, AlertCircle, Users, ExternalLink, ArrowRight
} from 'lucide-react';

const LiveTrading = () => {
  const [monthYear, setMonthYear] = useState(() => new Date().toISOString().substring(0, 7));
  const [tier1Percent, setTier1Percent] = useState(12.0);
  const [tier2Percent, setTier2Percent] = useState(12.0);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [force, setForce] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const fetchPreview = async () => {
    try {
      setLoadingPreview(true);
      const res = await api.get(`/admin/live-trading/preview?monthYear=${monthYear}&tier1RoiPercent=${tier1Percent}&tier2RoiPercent=${tier2Percent}`);
      setPreview(res.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to fetch live trading preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/admin/live-trading/history');
      setHistory(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load distribution history');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [monthYear, tier1Percent, tier2Percent]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDistribute = async () => {
    if (tier1Percent < 10 || tier1Percent > 15 || tier2Percent < 10 || tier2Percent > 15) {
      return toast.error('ROI percentages must be between 10% and 15%');
    }

    const confirmMsg = `Are you sure you want to update & distribute Monthly Live Trading ROI for ${monthYear}?\n\n` +
      `• Tier 1 ($1,100 - $5,000): ${tier1Percent}%\n` +
      `• Tier 2 ($10,000 - $25,000): ${tier2Percent}%\n` +
      `• Split: 50% to Investor, 30% to Level Network.\n\n` +
      (force ? '⚠️ FORCE FLAG ENABLED: This will override the month lock and re-execute.' : '');

    if (!window.confirm(confirmMsg)) return;

    setDistributing(true);
    try {
      const res = await api.post('/admin/live-trading/distribute', {
        monthYear,
        tier1RoiPercent: tier1Percent,
        tier2RoiPercent: tier2Percent,
        force,
        notes: `Admin manual distribution on ${new Date().toISOString()}`
      });

      toast.success(res.data.message || 'Live Trading Monthly ROI distributed successfully!');
      fetchPreview();
      fetchHistory();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to distribute Live Trading ROI');
    } finally {
      setDistributing(false);
    }
  };

  // Filter accounts
  const filteredAccounts = (preview?.packages || []).filter(p => {
    const q = searchFilter.toLowerCase();
    return p.userId?.toLowerCase().includes(q) || p.userName?.toLowerCase().includes(q) || p.packageTier?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#170E2B] via-[#221340] to-[#120B20] border border-[#A020F0]/30 rounded-3xl p-8 relative overflow-hidden shadow-[0_0_30px_rgba(160,32,240,0.15)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#A020F0]/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-black text-[#FF00FF] uppercase tracking-widest mb-3">
              <Zap size={16} className="animate-pulse" />
              <span>Dedicated Live Trading ROI Controller</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Live Trading Monthly ROI Control
            </h1>
            <p className="text-xs text-gray-400 mt-2 max-w-2xl leading-relaxed">
              Configure dynamic monthly ROI (<strong>10% to 15%</strong>) for <strong>Tier 1 ($1,100–$5,000)</strong> and <strong>Tier 2 ($10,000–$25,000)</strong> packages.
              ROI is credited once per month upon admin update: <strong>50% to Investor</strong> and <strong>30% to Level Network</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {preview?.isAlreadyDistributed ? (
              <div className="px-5 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <div>
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">
                    {monthYear} Distributed
                  </span>
                  <span className="text-[10px] text-emerald-500 font-mono">Status: Completed</span>
                </div>
              </div>
            ) : (
              <div className="px-5 py-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2.5 shadow-lg shadow-amber-500/10">
                <Clock size={18} className="text-amber-400 animate-pulse" />
                <div>
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                    {monthYear} Pending
                  </span>
                  <span className="text-[10px] text-amber-500 font-mono">Awaiting Execution</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Controls & Right Real-Time Financial Projections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: Configuration & Triggers (5 cols on lg) */}
        <div className="lg:col-span-5 bg-[#0B0F1A] border border-gray-800 rounded-3xl p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-gray-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-[#A020F0]" />
              Monthly Rate Configuration
            </h2>
            <button
              onClick={fetchPreview}
              className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              title="Recalculate Projections"
            >
              <RefreshCw size={14} className={loadingPreview ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Target Month */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
              Target Month (YYYY-MM)
            </label>
            <input
              type="month"
              value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              className="w-full bg-[#161B2A] border border-gray-700/80 rounded-xl px-4 py-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-[#A020F0]"
            />
          </div>

          {/* Tier 1 Slider & Input ($1,100 – $5,000) */}
          <div className="bg-[#121624] border border-gray-800 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-white block">Tier 1 Live Package</span>
                <span className="text-[10px] text-gray-400 font-mono">$1,100 – $5,000 Range</span>
              </div>
              <div className="flex items-center gap-1 bg-[#1A2035] border border-gray-700 px-3 py-1 rounded-xl">
                <input
                  type="number"
                  step="0.1"
                  min="10"
                  max="15"
                  value={tier1Percent}
                  onChange={(e) => setTier1Percent(Number(e.target.value))}
                  className="w-14 bg-transparent text-sm font-black text-emerald-400 font-mono text-right focus:outline-none"
                />
                <span className="text-xs font-bold text-emerald-400">%</span>
              </div>
            </div>

            <input
              type="range"
              min="10"
              max="15"
              step="0.1"
              value={tier1Percent}
              onChange={(e) => setTier1Percent(Number(e.target.value))}
              className="w-full accent-[#A020F0] cursor-pointer"
            />

            <div className="flex justify-between items-center text-[10px] font-mono text-gray-500">
              <span>Min: 10.0%</span>
              <span className="text-emerald-400 font-bold">Current: {tier1Percent}%</span>
              <span>Max: 15.0%</span>
            </div>
          </div>

          {/* Tier 2 Slider & Input ($10,000 – $25,000) */}
          <div className="bg-[#121624] border border-gray-800 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-white block">Tier 2 Live Package</span>
                <span className="text-[10px] text-gray-400 font-mono">$10,000 – $25,000 Range</span>
              </div>
              <div className="flex items-center gap-1 bg-[#1A2035] border border-gray-700 px-3 py-1 rounded-xl">
                <input
                  type="number"
                  step="0.1"
                  min="10"
                  max="15"
                  value={tier2Percent}
                  onChange={(e) => setTier2Percent(Number(e.target.value))}
                  className="w-14 bg-transparent text-sm font-black text-emerald-400 font-mono text-right focus:outline-none"
                />
                <span className="text-xs font-bold text-emerald-400">%</span>
              </div>
            </div>

            <input
              type="range"
              min="10"
              max="15"
              step="0.1"
              value={tier2Percent}
              onChange={(e) => setTier2Percent(Number(e.target.value))}
              className="w-full accent-[#FF00FF] cursor-pointer"
            />

            <div className="flex justify-between items-center text-[10px] font-mono text-gray-500">
              <span>Min: 10.0%</span>
              <span className="text-emerald-400 font-bold">Current: {tier2Percent}%</span>
              <span>Max: 15.0%</span>
            </div>
          </div>

          {/* Force Override Toggle */}
          {preview?.isAlreadyDistributed && (
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
              <input
                type="checkbox"
                id="forceLive"
                checked={force}
                onChange={(e) => setForce(e.target.checked)}
                className="w-4 h-4 text-[#A020F0] rounded"
              />
              <label htmlFor="forceLive" className="text-xs font-bold text-amber-400 cursor-pointer">
                Force Re-distribution (Override month lock)
              </label>
            </div>
          )}

          {/* Execute Button */}
          <button
            onClick={handleDistribute}
            disabled={distributing || (preview?.isAlreadyDistributed && !force) || preview?.packages?.length === 0}
            className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-[#A020F0] to-[#FF00FF] hover:from-[#B026FF] disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-xl shadow-[#A020F0]/30 transition-all active:scale-95"
          >
            {distributing ? (
              <>
                <RefreshCw className="animate-spin" size={18} />
                <span>Distributing ROI...</span>
              </>
            ) : (
              <>
                <Zap size={18} fill="currentColor" />
                <span>Distribute Monthly Live Trading ROI</span>
              </>
            )}
          </button>
        </div>

        {/* RIGHT: Real-Time Financial Projections (7 cols on lg) */}
        <div className="lg:col-span-7 bg-[#0B0F1A] border border-gray-800 rounded-3xl p-6 space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-gray-800">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" />
                Real-Time Calculation Summary ({monthYear})
              </h2>
              <span className="text-[11px] text-gray-500">
                Calculated on active Live Trading packages • INR Rate: ₹{preview?.inrRate || 90}/$
              </span>
            </div>
          </div>

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-[#121624] border border-gray-800 rounded-2xl p-4">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Packages</span>
              <span className="text-2xl font-black text-white font-mono mt-1 block">
                {preview?.summary?.totalPackages || 0}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                Tier 1: {preview?.tier1?.count || 0} | Tier 2: {preview?.tier2?.count || 0}
              </span>
            </div>

            <div className="bg-[#121624] border border-gray-800 rounded-2xl p-4">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Trading Capital</span>
              <span className="text-2xl font-black text-white font-mono mt-1 block">
                ${(preview?.summary?.totalCapitalUSD || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Live Deposited Base</span>
            </div>

            <div className="bg-[#121624] border border-emerald-500/20 rounded-2xl p-4 col-span-2 sm:col-span-1">
              <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider">50% Investor Payout</span>
              <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
                ${(preview?.summary?.totalInvestorPayoutUSD || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-500/80 font-mono block">
                ₹{(preview?.summary?.totalInvestorPayoutINR || 0).toLocaleString()} INR
              </span>
            </div>

            <div className="bg-[#121624] border border-[#A020F0]/30 rounded-2xl p-4">
              <span className="block text-[10px] font-bold text-[#FF00FF] uppercase tracking-wider">30% Level Network Base</span>
              <span className="text-xl font-black text-[#FF00FF] font-mono mt-1 block">
                ${(preview?.summary?.totalLevelPayoutUSD || 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-gray-400">MLM Upline Pool</span>
            </div>

            <div className="bg-[#121624] border border-gray-800 rounded-2xl p-4 col-span-2">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">20% Company Reserve</span>
              <span className="text-xl font-black text-white font-mono mt-1 block">
                ${((preview?.summary?.totalCapitalUSD || 0) * (tier1Percent / 100) * 0.2).toFixed(2)}
              </span>
              <span className="text-[10px] text-gray-500">Retained for trading operations & liquidity</span>
            </div>
          </div>

          {/* Account Breakdown List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Active Live Trading Accounts ({preview?.packages?.length || 0})
              </h3>
              {preview?.packages?.length > 0 && (
                <input
                  type="text"
                  placeholder="Filter accounts..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="bg-[#161B2A] border border-gray-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#A020F0]"
                />
              )}
            </div>

            {loadingPreview ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-3 border-[#A020F0] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs border border-gray-800/60 rounded-2xl bg-[#121624]/40">
                No active Live Trading packages found matching current criteria.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto space-y-2 hide-scrollbar">
                {filteredAccounts.map((p, i) => (
                  <div
                    key={p.userPackageId || i}
                    className="flex justify-between items-center p-3.5 bg-[#121624] border border-gray-800 rounded-xl text-xs hover:border-[#A020F0]/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-mono">{p.userId}</span>
                        <span className="text-gray-400">({p.userName})</span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5 font-mono">
                        {p.packageTier} • Deposit: ${p.amount.toLocaleString()} ({p.paymentMethod})
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="font-bold text-emerald-400 text-sm">
                        +${p.investorPayoutUSD.toFixed(2)}
                        {p.paymentMethod === 'INR' && (
                          <span className="text-[10px] text-gray-400 font-normal ml-1">
                            (₹{p.investorPayoutINR.toLocaleString()} INR)
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#FF00FF]">
                        Level Pool: ${p.levelBaseAmountUSD.toFixed(2)} (30%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Executions Table */}
      <div className="bg-[#0B0F1A] border border-gray-800 rounded-3xl p-6 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-gray-800">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock size={16} className="text-[#A020F0]" />
            Past Monthly Distribution Records
          </h2>
          <button
            onClick={fetchHistory}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 p-1 rounded hover:bg-gray-800 transition-colors"
          >
            <RefreshCw size={12} className={loadingHistory ? 'animate-spin' : ''} />
            <span>Refresh History</span>
          </button>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs">
            No past live trading distribution records logged in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121624] text-gray-400 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">Month</th>
                  <th className="p-3">Tier 1 ROI</th>
                  <th className="p-3">Tier 2 ROI</th>
                  <th className="p-3">Accounts</th>
                  <th className="p-3">Total Capital</th>
                  <th className="p-3">Investor Payout</th>
                  <th className="p-3">Level Pool</th>
                  <th className="p-3">Executed By</th>
                  <th className="p-3 rounded-r-xl">Executed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-300">
                {history.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-800/30">
                    <td className="p-3 font-bold text-white font-mono">{item.monthYear}</td>
                    <td className="p-3 font-mono text-emerald-400 font-bold">{item.tier1RoiPercent}%</td>
                    <td className="p-3 font-mono text-emerald-400 font-bold">{item.tier2RoiPercent}%</td>
                    <td className="p-3 font-mono">{item.totalPackagesProcessed}</td>
                    <td className="p-3 font-mono">${item.totalCapitalUSD?.toLocaleString() || 0}</td>
                    <td className="p-3 font-mono text-emerald-400 font-bold">
                      ${item.totalInvestorPayoutUSD?.toFixed(2) || 0}
                      {item.totalInvestorPayoutINR > 0 && (
                        <span className="block text-[10px] text-gray-400 font-normal">
                          ₹{item.totalInvestorPayoutINR.toLocaleString()} INR
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-[#FF00FF] font-bold">
                      ${item.totalLevelPayoutUSD?.toFixed(2) || 0}
                    </td>
                    <td className="p-3 text-gray-400">{item.executedByName || 'Admin'}</td>
                    <td className="p-3 text-gray-400">{new Date(item.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTrading;
