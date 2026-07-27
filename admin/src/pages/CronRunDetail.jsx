import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, Cpu, Calendar, Search, Users, 
  TrendingUp, CheckCircle, Clock, Database, Layers 
} from 'lucide-react';

const CronRunDetail = () => {
  const { date } = useParams();
  const [searchParams] = useSearchParams();
  const triggerType = searchParams.get('triggerType') || '';
  const hourGroup = searchParams.get('hourGroup') || '';
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const fetchRunDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/cron/run-details', {
          params: { date, triggerType, hourGroup }
        });
        setData(res.data);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load run detail breakdown');
      } finally {
        setLoading(false);
      }
    };

    if (date) {
      fetchRunDetails();
    }
  }, [date, triggerType, hourGroup]);

  const records = data?.records || [];
  const runInfo = data?.runInfo || {};
  const isManual = (triggerType || '').toLowerCase().includes('manual');

  // Filter records by search query
  const filteredRecords = records.filter((r) => {
    const q = searchQuery.toLowerCase();
    const userId = (r.userId || r.user?.userId || '').toLowerCase();
    const name = (r.user?.fullName || r.user?.email || '').toLowerCase();
    const pkgName = (r.userPackageId?.packageName || r.packageId?.name || '').toLowerCase();
    return userId.includes(q) || name.includes(q) || pkgName.includes(q);
  });

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const displayedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formattedDate = date ? new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }) : date;

  return (
    <div className="space-y-6">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/cron')}
          className="flex items-center gap-2 px-4 py-2 bg-[#161B2A] hover:bg-[#1F293D] border border-gray-800 text-gray-300 hover:text-white text-xs font-bold rounded-xl transition-all"
        >
          <ArrowLeft size={16} />
          Back to Cron Dashboard
        </button>

        <span className="text-xs font-mono text-gray-500">
          Run Inspection ID: <strong className="text-white">{date}_{isManual ? 'Manual' : 'Scheduled'}</strong>
        </span>
      </div>

      {/* Overview Banner Card */}
      <div className="bg-[#0B0F1A] border border-gray-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-transparent to-[#A020F0]/10 pointer-events-none rounded-full blur-2xl"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${
                isManual
                  ? 'bg-[#A020F0]/15 text-[#A020F0] border-[#A020F0]/30'
                  : 'bg-[#00C6FF]/15 text-[#00C6FF] border-[#00C6FF]/30'
              }`}>
                {isManual ? 'Manual Execution Run' : 'Scheduled Auto Run'}
              </span>
              <span className="text-xs text-gray-500 font-mono">Mining Cron (Direct)</span>
            </div>

            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Calendar className="text-[#A020F0]" size={26} />
              ROI Execution Run Breakdown ({formattedDate})
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Formatted audit list of all user packages and ROI profits credited during this specific workflow execution.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 shrink-0 w-full md:w-auto">
            <div className="bg-[#161B2A] border border-gray-800 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block mb-0.5">Total Accounts</span>
              <span className="text-xl font-black text-white font-mono">{runInfo.totalAccounts || records.length} Pkgs</span>
            </div>

            <div className="bg-[#161B2A] border border-gray-800 rounded-2xl p-4 text-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block mb-0.5">Total ROI Distributed</span>
              <span className="text-xl font-black text-emerald-400 font-mono">+{Number(runInfo.totalDistributed || 0).toFixed(4)} CTC</span>
            </div>

            <div className="bg-[#161B2A] border border-gray-800 rounded-2xl p-4 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block mb-0.5">Execution Status</span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full inline-block mt-1">
                Completed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Breakdown Section */}
      <div className="bg-[#0B0F1A] border border-gray-800 rounded-3xl p-6 space-y-5">
        
        {/* Search Bar & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-800/60 pb-5">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <Users size={18} className="text-[#00C6FF]" />
              User Package Payout Breakdown
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              Detailed inspectable record of users and packages included in this execution
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search User ID, Name or Package..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#161B2A] border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#A020F0] transition-all"
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto min-h-[450px]">
          {loading ? (
            <div className="flex items-center justify-center h-80">
              <div className="w-10 h-10 border-4 border-[#A020F0] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : displayedRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 text-gray-500 space-y-2">
              <Database size={36} className="text-gray-700 stroke-1" />
              <p className="text-xs">No user package payout records match your search filter.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-3">User Details</th>
                  <th className="py-3.5 px-3">Package Name</th>
                  <th className="py-3.5 px-3 text-right">Investment Principal</th>
                  <th className="py-3.5 px-3 text-right">Compounding Base</th>
                  <th className="py-3.5 px-3 text-right">Profit Credited (Run)</th>
                  <th className="py-3.5 px-3 text-center">ROI Rate</th>
                  <th className="py-3.5 px-3 text-right">Execution Time</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {displayedRecords.map((r) => {
                  const u = r.user || {};
                  const pkg = r.userPackageId || {};
                  const userId = r.userId || u.userId || 'N/A';
                  const userName = u.fullName || u.email || 'N/A';
                  const pkgName = pkg.packageName || r.packageId?.name || 'Standard Package';
                  const principal = pkg.amount || 0;
                  const compounding = pkg.compoundingBalance || principal;

                  const formattedTime = new Date(r.createdAt || r.date).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });

                  return (
                    <tr key={r._id} className="hover:bg-[#161B2A]/40 transition-colors">
                      {/* User Details */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#161B2A] border border-gray-800 px-2 py-0.5 rounded text-[11px] font-mono font-extrabold text-[#00C6FF]">
                            {userId}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-semibold text-white truncate max-w-[140px]" title={userName}>
                              {userName}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              Bal: ${Number(u.availableBalance || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Package Name */}
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-gray-200">
                          {pkgName}
                        </span>
                      </td>

                      {/* Principal Amount */}
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-gray-300">
                        ${Number(principal).toFixed(2)}
                      </td>

                      {/* Compounding Balance */}
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-[#00C6FF]">
                        ${Number(compounding).toFixed(2)}
                      </td>

                      {/* Profit Credited */}
                      <td className="py-3.5 px-3 text-right font-extrabold font-mono text-emerald-400 text-sm">
                        +{Number(r.amount).toFixed(4)} CTC
                      </td>

                      {/* Daily Rate */}
                      <td className="py-3.5 px-3 text-center font-bold text-gray-400">
                        {r.percentage}%
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-3 text-right font-mono text-gray-400 text-[11px]">
                        {formattedTime}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle size={10} />
                          Credited
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {filteredRecords.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-800/60 text-xs text-gray-400">
            <div>
              Showing <span className="font-bold text-white">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
              <span className="font-bold text-white">{Math.min(currentPage * itemsPerPage, filteredRecords.length)}</span> of{' '}
              <span className="font-bold text-white">{filteredRecords.length}</span> package accounts
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-[#161B2A] border border-gray-800 text-white rounded-lg disabled:opacity-40 hover:bg-gray-800 transition-all font-semibold"
              >
                Previous
              </button>
              <span className="px-2 font-mono font-bold text-white">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-[#161B2A] border border-gray-800 text-white rounded-lg disabled:opacity-40 hover:bg-gray-800 transition-all font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CronRunDetail;
