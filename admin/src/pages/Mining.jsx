import React, { useState, useEffect } from 'react';
import { Cpu, Play, Pause, AlertTriangle, ShieldCheck, Database, Calendar, RefreshCw } from 'lucide-react';
import api from '../api';
import { toast } from 'react-toastify';

const Mining = () => {
  const [treasury, setTreasury] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const fetchTreasury = async () => {
    try {
      const res = await api.get('/admin/treasury/stats');
      setTreasury(res.data);
    } catch (error) {
      toast.error('Failed to load system stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreasury();
  }, []);

  const handleTogglePause = async (field, currentValue) => {
    const action = currentValue ? 'resume' : 'pause';
    if (!window.confirm(`Are you sure you want to ${action} this functionality?`)) return;
    try {
      const res = await api.put('/admin/treasury/settings', {
        [field]: !currentValue
      });
      setTreasury(prev => ({ ...prev, settings: res.data.settings }));
      toast.success(`System successfully ${action}d!`);
    } catch (error) {
      toast.error('Failed to update system functionality');
    }
  };

  const handleTriggerRoi = async () => {
    if (!window.confirm('Are you sure you want to manually trigger ROI distribution right now?')) return;
    setTriggering(true);
    try {
      const res = await api.post('/admin/cron/trigger');
      if (res.data?.result?.success) {
        toast.success('ROI Distribution executed successfully!');
      } else if (res.data?.result?.reason) {
        toast.info(`ROI Distribution status: ${res.data.result.reason}`);
      } else {
        toast.success('ROI Distribution triggered successfully!');
      }
      await fetchTreasury();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to trigger ROI distribution');
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <div className="w-10 h-10 border-4 border-[#A020F0] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isPaused = treasury?.settings?.payoutPause;
  const isWithdrawFreeze = treasury?.settings?.withdrawalFreeze;

  return (
    <div className="space-y-6">
      {/* Overview stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0B0F1A] border border-gray-800 rounded-3xl p-6">
          <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Accumulated ROI Liabilities</span>
          <span className="text-2xl font-black text-white">${Number(treasury?.activeLiabilities || 0).toLocaleString()}</span>
          <p className="text-[10px] text-gray-500 mt-2 font-medium">Pending 4x cap payouts across active packages</p>
        </div>

        <div className="bg-[#0B0F1A] border border-gray-800 rounded-3xl p-6">
          <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Distributed ROI (Today)</span>
          <span className="text-2xl font-black text-emerald-400">${Number(treasury?.dailyWithdrawals || 0).toLocaleString()}</span>
          <p className="text-[10px] text-gray-500 mt-2 font-medium">Paid out in the current 12-hour cron window</p>
        </div>

        <div className="bg-[#0B0F1A] border border-gray-800 rounded-3xl p-6">
          <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Active Compounding Pool</span>
          <span className="text-2xl font-black text-[#00C6FF]">${Number(treasury?.treasuryReserves || 0).toLocaleString()}</span>
          <p className="text-[10px] text-gray-500 mt-2 font-medium">Current aggregated user principal stakes</p>
        </div>
      </div>

      {/* Manual Actions & Emergency Controls */}
      <div className="bg-[#0B0F1A] border border-gray-800 p-6 rounded-3xl space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white">ROI Distribution & System Controls</h3>
          <p className="text-xs text-gray-500 mt-1">Manually trigger daily ROI distributions or control global payout gates</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Manual Trigger Button Card */}
          <div className="bg-[#161B2A]/80 border border-[#A020F0]/30 p-5 rounded-2xl flex flex-col justify-between h-48 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#A020F0]/10 rounded-full blur-xl pointer-events-none"></div>
            <div>
              <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border bg-[#A020F0]/10 text-[#A020F0] border-[#A020F0]/20 mb-3.5">
                Manual Execution
              </span>
              <h4 className="text-sm font-bold text-white">Trigger ROI Payout Now</h4>
              <p className="text-xs text-gray-400 mt-1">Executes mining cycle for all active pending user accounts immediately.</p>
            </div>
            <button
              onClick={handleTriggerRoi}
              disabled={triggering}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all bg-gradient-to-r from-[#A020F0] to-[#00C6FF] text-white hover:opacity-90 disabled:opacity-50 shadow-md shadow-[#A020F0]/20"
            >
              {triggering ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
              {triggering ? 'Distributing...' : 'Trigger ROI Distribution'}
            </button>
          </div>

          {/* Pause ROI */}
          <div className="bg-[#161B2A]/50 border border-gray-800 p-5 rounded-2xl flex flex-col justify-between h-48">
            <div>
              <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border mb-3.5 ${
                isPaused ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                {isPaused ? 'Halted' : 'Operational'}
              </span>
              <h4 className="text-sm font-bold text-white">Daily ROI mining cron</h4>
              <p className="text-xs text-gray-500 mt-1">Pauses the twice-daily mining payouts without altering compound histories.</p>
            </div>
            <button
              onClick={() => handleTogglePause('payoutPause', isPaused)}
              className={`w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors ${
                isPaused 
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
              {isPaused ? 'Resume ROI payouts' : 'Emergency Pause ROI'}
            </button>
          </div>

          {/* Freeze Withdrawals */}
          <div className="bg-[#161B2A]/50 border border-gray-800 p-5 rounded-2xl flex flex-col justify-between h-48">
            <div>
              <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border mb-3.5 ${
                isWithdrawFreeze ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                {isWithdrawFreeze ? 'Frozen' : 'Operational'}
              </span>
              <h4 className="text-sm font-bold text-white">Withdrawal gate locks</h4>
              <p className="text-xs text-gray-500 mt-1">Prevents standard profit and SOS withdrawals from being created or processed.</p>
            </div>
            <button
              onClick={() => handleTogglePause('withdrawalFreeze', isWithdrawFreeze)}
              className={`w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors ${
                isWithdrawFreeze 
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                  : 'bg-red-500 text-white hover:bg-red-600'
              }`}
            >
              {isWithdrawFreeze ? <Play size={14} /> : <Pause size={14} />}
              {isWithdrawFreeze ? 'Thaw withdrawals' : 'Freeze withdrawals'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mining;
