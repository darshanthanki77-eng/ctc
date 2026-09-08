import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';
import { 
  Play, Cpu, RefreshCw, Search, CheckCircle2, XCircle, 
  Clock, Calendar, GitBranch, Database, TrendingUp, ExternalLink,
  Zap, DollarSign, Layers, ShieldCheck, ArrowRight, AlertCircle, Award
} from 'lucide-react';

const Cron = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('mining'); // 'mining' or 'live_trading'
  
  // Mining Cron States
  const [crons, setCrons] = useState([]);
  const [workflowRuns, setWorkflowRuns] = useState([]);
  const [summary, setSummary] = useState({ totalAmount: 0, totalLogsCount: 0, totalRunsCount: 0 });
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [migrating, setMigrating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [extending, setExtending] = useState(false);
  const itemsPerPage = 10;

  // Live Trading Monthly ROI States
  const [liveMonthYear, setLiveMonthYear] = useState(() => new Date().toISOString().substring(0, 7));
  const [tier1Percent, setTier1Percent] = useState(12.0);
  const [tier2Percent, setTier2Percent] = useState(12.0);
  const [livePreview, setLivePreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [distributingLive, setDistributingLive] = useState(false);
  const [forceLive, setForceLive] = useState(false);
  const [liveHistory, setLiveHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchCronData = async () => {
    try {
      const res = await api.get('/admin/cron/status');
      if (Array.isArray(res.data)) {
        setCrons(res.data);
      } else {
        setCrons(res.data.states || []);
        setWorkflowRuns(res.data.workflowRuns || []);
        setSummary(res.data.summary || { totalAmount: 0, totalLogsCount: 0, totalRunsCount: 0 });
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load cron & ROI status');
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveTradingPreview = async () => {
    try {
      setLoadingPreview(true);
      const res = await api.get(`/admin/live-trading/preview?monthYear=${liveMonthYear}&tier1RoiPercent=${tier1Percent}&tier2RoiPercent=${tier2Percent}`);
      setLivePreview(res.data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to calculate live trading preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const fetchLiveTradingHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await api.get('/admin/live-trading/history');
      setLiveHistory(res.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load live trading history');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchCronData();
  }, []);

  useEffect(() => {
    if (activeTab === 'live_trading') {
      fetchLiveTradingPreview();
      fetchLiveTradingHistory();
    }
  }, [activeTab, liveMonthYear, tier1Percent, tier2Percent]);

  const handleTriggerRoi = async () => {
    if (!window.confirm('Are you sure you want to manually trigger standard Mining ROI distribution right now?')) {
      return;
    }

    setTriggering(true);
    try {
      const res = await api.post('/admin/cron/trigger');
      if (res.data?.result?.success) {
        toast.success('Mining ROI Distribution executed successfully!');
      } else if (res.data?.result?.reason) {
        toast.info(`Mining ROI Distribution completed. Status: ${res.data.result.reason}`);
      } else {
        toast.success('Mining ROI Distribution triggered successfully!');
      }
      await fetchCronData();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to trigger ROI distribution');
    } finally {
      setTriggering(false);
    }
  };

  const handleDistributeLiveTrading = async () => {
    if (tier1Percent < 10 || tier1Percent > 15 || tier2Percent < 10 || tier2Percent > 15) {
      return toast.error('ROI percentages must be between 10% and 15%');
    }

    const confirmMsg = `Are you sure you want to update & distribute Monthly Live Trading ROI for ${liveMonthYear}?\n\n` +
      `• Tier 1 ($1,100 - $5,000): ${tier1Percent}%\n` +
      `• Tier 2 ($10,000 - $25,000): ${tier2Percent}%\n` +
      `• Split: 50% to Investor, 30% to Level Network.\n\n` +
      (forceLive ? '⚠️ FORCE FLAG ENABLED: This will re-distribute even if already executed for this month.' : '');

    if (!window.confirm(confirmMsg)) return;

    setDistributingLive(true);
    try {
      const res = await api.post('/admin/live-trading/distribute', {
        monthYear: liveMonthYear,
        tier1RoiPercent: tier1Percent,
        tier2RoiPercent: tier2Percent,
        force: forceLive,
        notes: `Admin triggered distribution for ${liveMonthYear}`
      });

      toast.success(res.data.message || 'Live Trading Monthly ROI distributed successfully!');
      fetchLiveTradingPreview();
      fetchLiveTradingHistory();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to distribute Live Trading ROI');
    } finally {
      setDistributingLive(false);
    }
  };

  const handleMigrateInr = async () => {
    if (!window.confirm('Are you sure you want to migrate selected users to INR mode?')) {
      return;
    }
    setMigrating(true);
    try {
      const res = await api.post('/admin/migrate-users-inr');
      toast.success(res.data.message || 'Users successfully migrated to INR!');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to migrate users to INR');
    } finally {
      setMigrating(false);
    }
  };

  const handleSyncBalances = async () => {
    if (!window.confirm('Are you sure you want to sync all user available balances?')) {
      return;
    }
    setSyncing(true);
    try {
      const res = await api.post('/admin/sync-balances');
      toast.success(res.data.message || 'Balances successfully synced!');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to sync balances');
    } finally {
      setSyncing(false);
    }
  };

  const handleExtendStaking = async () => {
    if (!window.confirm('Are you sure you want to extend staking by 20 days for completed packages of CTC11893 and CTC33482?')) {
      return;
    }
    setExtending(true);
    try {
      const res = await api.post('/admin/extend-staking');
      toast.success(res.data.message || 'Staking extended successfully!');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to extend staking');
    } finally {
      setExtending(false);
    }
  };

  // Filter workflow runs based on search
  const filteredRuns = workflowRuns.filter((run) => {
    const q = searchQuery.toLowerCase();
    const name = run.name.toLowerCase();
    const runNum = `#${run.runNumber}`;
    const dateStr = run.dateStr.toLowerCase();
    const event = run.event.toLowerCase();
    return name.includes(q) || runNum.includes(q) || dateStr.includes(q) || event.includes(q);
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRuns.length / itemsPerPage) || 1;
  const displayedRuns = filteredRuns.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Top Tab Bar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0B0F1A] border border-gray-800 p-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('mining')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'mining'
                ? 'bg-gradient-to-r from-[#58A6FF] to-[#1F6FEB] text-white shadow-lg shadow-[#1F6FEB]/25'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <Cpu size={15} />
            <span>Daily Mining Cron (12h Cycle)</span>
          </button>

          <button
            onClick={() => setActiveTab('live_trading')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'live_trading'
                ? 'bg-gradient-to-r from-[#A020F0] to-[#FF00FF] text-white shadow-lg shadow-[#A020F0]/25'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <Zap size={15} />
            <span>Monthly Live Trading ROI (10%-15%)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-gray-400 pr-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Engine Active</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: DAILY MINING CRON VIEW */}
      {/* ======================================================== */}
      {activeTab === 'mining' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Cron Engine & Monitors (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0D1117] border border-[#30363D] rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Cpu className="text-[#58A6FF]" size={20} />
                    Mining Cron Control
                  </h2>
                  <p className="text-xs text-[#8B949E] mt-1">
                    Trigger twice-daily automated mining cycle manually or monitor status.
                  </p>
                </div>
              </div>

              <button
                onClick={handleTriggerRoi}
                disabled={triggering}
                className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-[#238636] hover:bg-[#2EA043] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#238636]/20"
              >
                {triggering ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    Running Mining Cron...
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    Run Workflow Now
                  </>
                )}
              </button>
            </div>

            {/* Cron Monitor Card */}
            <div className="bg-[#0D1117] border border-[#30363D] rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider flex items-center gap-2">
                  <Database size={15} className="text-[#58A6FF]" />
                  Active Cron Engine
                </h3>
                <button 
                  onClick={fetchCronData} 
                  className="text-[#8B949E] hover:text-white p-1.5 rounded-lg bg-[#161B22] hover:bg-[#21262D] transition-all"
                  title="Refresh Status"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-7 h-7 border-3 border-[#58A6FF] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : crons.length === 0 ? (
                <div className="p-6 text-center text-[#8B949E] text-xs">
                  No active cron states logged in DB.
                </div>
              ) : (
                crons.map((c) => (
                  <div key={c._id} className="space-y-3.5 text-xs text-[#C9D1D9]">
                    <div className="flex justify-between items-center pb-2.5 border-b border-[#21262D]">
                      <span className="text-[#8B949E]">Engine ID</span>
                      <span className="font-mono font-bold text-white text-xs">{c.cronName}</span>
                    </div>

                    <div className="flex justify-between items-center pb-2.5 border-b border-[#21262D]">
                      <span className="text-[#8B949E]">Status</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        c.isRunning 
                          ? 'bg-[#F85149]/10 text-[#F85149] border-[#F85149]/30 animate-pulse' 
                          : 'bg-[#238636]/10 text-[#3FB950] border-[#238636]/30'
                      }`}>
                        {c.isRunning ? 'Executing' : 'Idle / Ready'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-2.5 border-b border-[#21262D]">
                      <span className="text-[#8B949E]">Last Executed Cycle</span>
                      <span className="font-mono font-semibold text-white text-xs">{c.lastCycleId || 'None'}</span>
                    </div>

                    <div className="flex justify-between items-center pb-2.5 border-b border-[#21262D]">
                      <span className="text-[#8B949E]">Last Executed Time</span>
                      <span className="font-medium text-white">{c.lastRunAt ? new Date(c.lastRunAt).toLocaleString() : 'N/A'}</span>
                    </div>

                    <div className="flex justify-between items-center pb-1">
                      <span className="text-[#8B949E]">Schedule</span>
                      <span className="font-semibold text-[#A5D6FF]">Twice-Daily (UTC 0 / 12)</span>
                    </div>

                    {c.errorLog && (
                      <div className="bg-[#F85149]/10 border border-[#F85149]/30 rounded-xl p-3 text-[#F85149] space-y-1">
                        <span className="block text-[9px] font-bold uppercase tracking-wide">Last Exception:</span>
                        <p className="font-mono text-[10px] leading-relaxed select-all">{c.errorLog}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Quick Lifetime Summary Card */}
            <div className="bg-[#0D1117] border border-[#30363D] rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#58A6FF]/10 text-[#58A6FF] flex items-center justify-center">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <span className="text-[10px] text-[#8B949E] uppercase tracking-widest font-bold block">Total ROI Distributed</span>
                  <span className="text-lg font-black text-white">{summary.totalAmount?.toFixed(4) || '0'} CTC</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-[#8B949E] border-t border-[#21262D] pt-2.5">
                <span>Total Workflow Executions:</span>
                <span className="font-bold text-white">{summary.totalRunsCount || workflowRuns.length} Runs</span>
              </div>
            </div>

            {/* INR Migration Patch Card */}
            <div className="bg-[#0D1117] border border-[#30363D] rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={15} className="text-[#E3B341]" />
                INR Payout Migration
              </h3>
              <p className="text-[11px] text-[#8B949E] leading-relaxed">
                Convert USD balances to INR and switch package payouts to INR mode for migrated users.
              </p>
              <button
                onClick={handleMigrateInr}
                disabled={migrating}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-[#E3B341] hover:bg-[#C2932E] disabled:opacity-50 text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md font-bold"
              >
                {migrating ? 'Migrating to INR...' : 'Migrate Users to INR'}
              </button>
            </div>

            {/* Sync Balances Card */}
            <div className="bg-[#0D1117] border border-[#30363D] rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider flex items-center gap-2">
                <Cpu size={15} className="text-[#3FB950]" />
                Sync Available Balances
              </h3>
              <p className="text-[11px] text-[#8B949E] leading-relaxed">
                Recalculate and correct all user available balances based on earnings minus withdrawals.
              </p>
              <button
                onClick={handleSyncBalances}
                disabled={syncing}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-[#238636] hover:bg-[#2EA043] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md font-bold"
              >
                {syncing ? 'Syncing Balances...' : 'Sync Balances Now'}
              </button>
            </div>

            {/* Extend Staking Card */}
            <div className="bg-[#0D1117] border border-[#30363D] rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider flex items-center gap-2">
                <Calendar size={15} className="text-[#8B2FF7]" />
                Extend Staking (20 Days)
              </h3>
              <p className="text-[11px] text-[#8B949E] leading-relaxed">
                Extend staking period by 20 days for completed packages of CTC11893 and CTC33482.
              </p>
              <button
                onClick={handleExtendStaking}
                disabled={extending}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-[#8B2FF7] hover:bg-[#7116DD] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md font-bold"
              >
                {extending ? 'Extending Staking...' : 'Extend Staking now'}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: GitHub Actions Style Workflow Runs List (8 cols on lg) */}
          <div className="lg:col-span-8 bg-[#0D1117] border border-[#30363D] rounded-2xl p-6 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#21262D] pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Workflow runs</span>
                  <span className="px-2 py-0.5 bg-[#21262D] text-[#8B949E] rounded-full text-xs font-semibold">
                    {filteredRuns.length}
                  </span>
                </h3>
                <p className="text-xs text-[#8B949E] mt-0.5">
                  All scheduled & manual mining cron workflow executions from database
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" />
                <input
                  type="text"
                  placeholder="Filter workflow runs..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#161B22] border border-[#30363D] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#8B949E] focus:outline-none focus:border-[#58A6FF] transition-all"
                />
              </div>
            </div>

            {/* List */}
            <div className="space-y-2 min-h-[460px]">
              {loading ? (
                <div className="flex items-center justify-center h-80">
                  <div className="w-8 h-8 border-3 border-[#58A6FF] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : displayedRuns.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-80 text-[#8B949E] space-y-2">
                  <Clock size={36} className="text-[#30363D]" />
                  <p className="text-xs">No workflow runs match your query.</p>
                </div>
              ) : (
                displayedRuns.map((run) => {
                  const formattedDate = new Date(run.timestamp).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short'
                  });

                  return (
                    <div
                      key={run.id}
                      onClick={() => navigate(`/cron/run/${run.dateStr}?triggerType=${run.triggerType}&hourGroup=${run.hourGroup}`)}
                      className="bg-[#0D1117] hover:bg-[#161B22] border border-[#21262D] hover:border-[#58A6FF]/40 rounded-xl p-4 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 group cursor-pointer"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 shrink-0">
                          {run.status === 'success' ? (
                            <div className="w-5 h-5 rounded-full bg-[#238636]/20 flex items-center justify-center text-[#3FB950]">
                              <CheckCircle2 size={16} />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-[#F85149]/20 flex items-center justify-center text-[#F85149]">
                              <XCircle size={16} />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[#58A6FF] group-hover:underline truncate">
                              {run.name}
                            </h4>
                            <span className="text-[11px] font-mono text-[#8B949E] shrink-0">
                              #{run.runNumber}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-[#8B949E] mt-1 flex-wrap">
                            <span>
                              Mining Cron (#{run.runNumber}): {run.event === 'scheduled' ? 'Scheduled' : 'manual'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="hidden md:flex items-center gap-1 px-2.5 py-0.5 bg-[#1F6FEB]/15 text-[#58A6FF] rounded-md text-[11px] font-mono font-semibold border border-[#1F6FEB]/30 shrink-0">
                        <GitBranch size={12} />
                        {run.branch}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 text-xs text-[#8B949E] shrink-0 border-t sm:border-t-0 border-[#21262D] pt-2 sm:pt-0">
                        <div className="flex items-center gap-1.5" title="Execution timestamp">
                          <Calendar size={13} className="text-[#8B949E]" />
                          <span>{formattedDate}</span>
                        </div>

                        <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold bg-[#161B22] border border-[#30363D] px-2.5 py-1 rounded-md" title="Accounts processed">
                          <Clock size={12} className="text-[#8B949E]" />
                          <span>{run.accountsProcessed} Pkgs</span>
                          <span className="text-[#8B949E]">|</span>
                          <span>+{Number(run.totalAmountDistributed).toFixed(2)} CTC</span>
                        </div>

                        <div className="text-[#58A6FF] font-semibold text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform" title="Inspect Run Details">
                          <ExternalLink size={14} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {filteredRuns.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-[#21262D] text-xs text-[#8B949E]">
                <div>
                  Showing <span className="font-bold text-white">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                  <span className="font-bold text-white">{Math.min(currentPage * itemsPerPage, filteredRuns.length)}</span> of{' '}
                  <span className="font-bold text-white">{filteredRuns.length}</span> workflow runs
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-[#161B22] border border-[#30363D] text-white rounded-lg disabled:opacity-40 hover:bg-[#21262D] transition-all font-semibold"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-mono font-bold text-white">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-[#161B22] border border-[#30363D] text-white rounded-lg disabled:opacity-40 hover:bg-[#21262D] transition-all font-semibold"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MONTHLY LIVE TRADING ROI ENGINE */}
      {/* ======================================================== */}
      {activeTab === 'live_trading' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-[#161026] via-[#1F143A] to-[#120B20] border border-[#A020F0]/30 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#FF00FF] uppercase tracking-wider mb-2">
                  <Zap size={16} />
                  <span>Dynamic 1st-of-the-Month Live Trading ROI Engine</span>
                </div>
                <h2 className="text-2xl font-black text-white">
                  Monthly Live Trading ROI Distribution
                </h2>
                <p className="text-xs text-gray-400 mt-1 max-w-2xl">
                  Live Trading packages receive ROI <strong>once per month</strong> when set by Admin (bypassing daily mining cron).
                  Payout is automatically split: <strong>50% to Investor</strong> and <strong>30% to Level Network</strong> according to MLM percentages.
                </p>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-3">
                {livePreview?.isAlreadyDistributed ? (
                  <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      {liveMonthYear} Completed
                    </span>
                  </div>
                ) : (
                  <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2">
                    <Clock size={16} className="text-amber-400" />
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      {liveMonthYear} Pending Execution
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Config & Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Input Form (5 cols on lg) */}
            <div className="lg:col-span-5 bg-[#0B0F1A] border border-gray-800 rounded-3xl p-6 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers size={16} className="text-[#A020F0]" />
                  Configure Monthly Rates
                </h3>
                <button
                  onClick={fetchLiveTradingPreview}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
                  title="Recalculate Preview"
                >
                  <RefreshCw size={14} className={loadingPreview ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Month Picker */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                  Target Month (YYYY-MM)
                </label>
                <input
                  type="month"
                  value={liveMonthYear}
                  onChange={(e) => setLiveMonthYear(e.target.value)}
                  className="w-full bg-[#161B2A] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-[#A020F0]"
                />
              </div>

              {/* Tier 1 Percentage */}
              <div className="bg-[#121624] border border-gray-800/80 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-white">Tier 1 Package</span>
                    <span className="block text-[10px] text-gray-400">$1,100 – $5,000</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#1A2035] border border-gray-700 px-2.5 py-1 rounded-lg">
                    <input
                      type="number"
                      step="0.1"
                      min="10"
                      max="15"
                      value={tier1Percent}
                      onChange={(e) => setTier1Percent(Number(e.target.value))}
                      className="w-16 bg-transparent text-sm font-black text-emerald-400 font-mono text-right focus:outline-none"
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
                  className="w-full accent-[#A020F0]"
                />
                <div className="flex justify-between text-[10px] font-mono text-gray-500">
                  <span>Min 10.0%</span>
                  <span>Max 15.0%</span>
                </div>
              </div>

              {/* Tier 2 Percentage */}
              <div className="bg-[#121624] border border-gray-800/80 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-white">Tier 2 Package</span>
                    <span className="block text-[10px] text-gray-400">$10,000 – $25,000</span>
                  </div>
                  <div className="flex items-center gap-1 bg-[#1A2035] border border-gray-700 px-2.5 py-1 rounded-lg">
                    <input
                      type="number"
                      step="0.1"
                      min="10"
                      max="15"
                      value={tier2Percent}
                      onChange={(e) => setTier2Percent(Number(e.target.value))}
                      className="w-16 bg-transparent text-sm font-black text-emerald-400 font-mono text-right focus:outline-none"
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
                  className="w-full accent-[#FF00FF]"
                />
                <div className="flex justify-between text-[10px] font-mono text-gray-500">
                  <span>Min 10.0%</span>
                  <span>Max 15.0%</span>
                </div>
              </div>

              {/* Force re-distribution checkbox */}
              {livePreview?.isAlreadyDistributed && (
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <input
                    type="checkbox"
                    id="forceLive"
                    checked={forceLive}
                    onChange={(e) => setForceLive(e.target.checked)}
                    className="w-4 h-4 text-[#A020F0] rounded"
                  />
                  <label htmlFor="forceLive" className="text-xs font-bold text-amber-400 cursor-pointer">
                    Force Re-distribution (Override month lock)
                  </label>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleDistributeLiveTrading}
                disabled={distributingLive || (livePreview?.isAlreadyDistributed && !forceLive) || livePreview?.packages?.length === 0}
                className="w-full flex items-center justify-center gap-2.5 py-4 bg-gradient-to-r from-[#A020F0] to-[#FF00FF] hover:from-[#B026FF] disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-[#A020F0]/30 transition-all active:scale-95"
              >
                {distributingLive ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    <span>Distributing ROI...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} fill="currentColor" />
                    <span>Update & Distribute Monthly ROI</span>
                  </>
                )}
              </button>
            </div>

            {/* Right: Real-time Dynamic Projection (7 cols on lg) */}
            <div className="lg:col-span-7 bg-[#0B0F1A] border border-gray-800 rounded-3xl p-6 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-400" />
                    Projected Monthly Payout Summary ({liveMonthYear})
                  </h3>
                  <span className="text-[11px] text-gray-500">Live preview based on active packages & current INR rate (₹{livePreview?.inrRate || 90}/$)</span>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-[#121624] border border-gray-800 rounded-2xl p-4">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Live Packages</span>
                  <span className="text-xl font-black text-white font-mono mt-1 block">
                    {livePreview?.summary?.totalPackages || 0}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    T1: {livePreview?.tier1?.count || 0} | T2: {livePreview?.tier2?.count || 0}
                  </span>
                </div>

                <div className="bg-[#121624] border border-gray-800 rounded-2xl p-4">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Trading Capital</span>
                  <span className="text-xl font-black text-white font-mono mt-1 block">
                    ${(livePreview?.summary?.totalCapitalUSD || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">USD Deposit Base</span>
                </div>

                <div className="bg-[#121624] border border-emerald-500/20 rounded-2xl p-4 col-span-2 sm:col-span-1">
                  <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider">50% Investor Payout</span>
                  <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">
                    ${(livePreview?.summary?.totalInvestorPayoutUSD || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-500/80 font-mono block">
                    ₹{(livePreview?.summary?.totalInvestorPayoutINR || 0).toLocaleString()} INR
                  </span>
                </div>

                <div className="bg-[#121624] border border-[#A020F0]/30 rounded-2xl p-4">
                  <span className="block text-[10px] font-bold text-[#FF00FF] uppercase tracking-wider">30% Level Network Base</span>
                  <span className="text-lg font-black text-[#FF00FF] font-mono mt-1 block">
                    ${(livePreview?.summary?.totalLevelPayoutUSD || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-gray-400">MLM upline distribution</span>
                </div>

                <div className="bg-[#121624] border border-gray-800 rounded-2xl p-4 col-span-2">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">20% Company Reserve</span>
                  <span className="text-lg font-black text-white font-mono mt-1 block">
                    ${((livePreview?.summary?.totalCapitalUSD || 0) * (tier1Percent / 100) * 0.2).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-gray-500">Retained for trading operations & platform liquidity</span>
                </div>
              </div>

              {/* Eligible Accounts List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Eligible Live Trading Packages ({livePreview?.packages?.length || 0})
                </h4>

                {livePreview?.packages?.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-xs border border-gray-800/60 rounded-2xl bg-[#121624]/40">
                    No active Live Trading packages currently in the database.
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2 hide-scrollbar">
                    {livePreview?.packages?.map((p, i) => (
                      <div
                        key={p.userPackageId || i}
                        className="flex justify-between items-center p-3 bg-[#121624] border border-gray-800/80 rounded-xl text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">{p.userId}</span>
                          <span className="text-gray-500 ml-2">({p.userName})</span>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            {p.packageTier} • Deposit: ${p.amount.toLocaleString()} ({p.paymentMethod})
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <div className="font-bold text-emerald-400">
                            +${p.investorPayoutUSD.toFixed(2)} (50% Investor)
                          </div>
                          <div className="text-[10px] text-[#FF00FF]">
                            Level Base: ${p.levelBaseAmountUSD.toFixed(2)} (30%)
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Past Distribution History Table */}
          <div className="bg-[#0B0F1A] border border-gray-800 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} className="text-[#A020F0]" />
                Past Monthly Distribution Records
              </h3>
              <button
                onClick={fetchLiveTradingHistory}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw size={12} className={loadingHistory ? 'animate-spin' : ''} />
                Refresh History
              </button>
            </div>

            {liveHistory.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs">
                No past live trading distribution records found.
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
                    {liveHistory.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-800/30">
                        <td className="p-3 font-bold text-white font-mono">{item.monthYear}</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">{item.tier1RoiPercent}%</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">{item.tier2RoiPercent}%</td>
                        <td className="p-3 font-mono">{item.totalPackagesProcessed}</td>
                        <td className="p-3 font-mono">${item.totalCapitalUSD?.toLocaleString() || 0}</td>
                        <td className="p-3 font-mono text-emerald-400 font-bold">
                          ${item.totalInvestorPayoutUSD?.toFixed(2) || 0}
                          {item.totalInvestorPayoutINR > 0 && (
                            <span className="block text-[10px] text-gray-400 font-normal">₹{item.totalInvestorPayoutINR.toLocaleString()} INR</span>
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
      )}
    </div>
  );
};

export default Cron;
