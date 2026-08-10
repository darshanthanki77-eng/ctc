import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';
import { 
  Play, Cpu, RefreshCw, Search, CheckCircle2, XCircle, 
  Clock, Calendar, MoreHorizontal, GitBranch, Database, TrendingUp, ExternalLink 
} from 'lucide-react';

const Cron = () => {
  const navigate = useNavigate();
  const [crons, setCrons] = useState([]);
  const [workflowRuns, setWorkflowRuns] = useState([]);
  const [summary, setSummary] = useState({ totalAmount: 0, totalLogsCount: 0, totalRunsCount: 0 });
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [migrating, setMigrating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const itemsPerPage = 10;

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

  useEffect(() => {
    fetchCronData();
  }, []);

  const handleTriggerRoi = async () => {
    if (!window.confirm('Are you sure you want to manually trigger ROI distribution right now? This will process pending active packages.')) {
      return;
    }

    setTriggering(true);
    try {
      const res = await api.post('/admin/cron/trigger');
      if (res.data?.result?.success) {
        toast.success('ROI Distribution executed successfully!');
      } else if (res.data?.result?.reason) {
        toast.info(`ROI Distribution completed. Status: ${res.data.result.reason}`);
      } else {
        toast.success('ROI Distribution triggered successfully!');
      }
      await fetchCronData();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to trigger ROI distribution');
    } finally {
      setTriggering(false);
    }
  };

  const handleMigrateInr = async () => {
    if (!window.confirm('Are you sure you want to migrate selected users to INR mode? This will convert their available USD balances to INR and change their packages to INR payment method.')) {
      return;
    }

    setMigrating(true);
    try {
      const res = await api.post('/admin/migrate-users-inr');
      toast.success(res.data.message || 'Users successfully migrated to INR!');
      console.log('Migration Report:', res.data.report);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to migrate users to INR');
    } finally {
      setMigrating(false);
    }
  };

  const handleSyncBalances = async () => {
    if (!window.confirm('Are you sure you want to sync all user available balances? This will recalculate the correct available balance for every user based on their earnings, active compounding packages, and withdrawals.')) {
      return;
    }

    setSyncing(true);
    try {
      const res = await api.post('/admin/sync-balances');
      toast.success(res.data.message || 'Balances successfully synced!');
      console.log('Sync Report:', res.data.report);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to sync balances');
    } finally {
      setSyncing(false);
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
      {/* Main Grid: Left Side (Cron Monitor) & Right Side (GitHub Actions Style Workflow Runs) */}
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
              Convert USD balances to INR and switch package payouts to INR mode for specific users (CTC14507, CTC83462, etc.).
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
              Recalculate and correct all user available balances based on earnings minus withdrawals. Fixes any double-credited compound releases.
            </p>
            <button
              onClick={handleSyncBalances}
              disabled={syncing}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 bg-[#238636] hover:bg-[#2EA043] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md font-bold"
            >
              {syncing ? 'Syncing Balances...' : 'Sync Balances Now'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: GitHub Actions Style Workflow Runs List (8 cols on lg) */}
        <div className="lg:col-span-8 bg-[#0D1117] border border-[#30363D] rounded-2xl p-6 space-y-5">
          
          {/* Header Bar like GitHub Actions */}
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

            {/* Filter Search Input */}
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

          {/* GitHub Actions Style Workflow Runs List */}
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
                    {/* Left: Status Icon + Title + Subtitle */}
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

                    {/* Middle: Branch Badge */}
                    <div className="hidden md:flex items-center gap-1 px-2.5 py-0.5 bg-[#1F6FEB]/15 text-[#58A6FF] rounded-md text-[11px] font-mono font-semibold border border-[#1F6FEB]/30 shrink-0">
                      <GitBranch size={12} />
                      {run.branch}
                    </div>

                    {/* Right: Date, Duration / Accounts & Inspection Link */}
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

          {/* GitHub Actions Style Pagination */}
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
    </div>
  );
};

export default Cron;
