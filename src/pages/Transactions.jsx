import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Calendar, ArrowUpRight, CheckCircle2, 
  ExternalLink, FileText, Download, Filter, HelpCircle,
  Clock, XCircle
} from 'lucide-react';
import api from '../api';
import { toast } from 'react-toastify';

const filters = ['All', 'Deposit', 'Withdrawal', 'Investment', 'Level Income', 'Bonus'];

const Transactions = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get('/transaction/history');
        setTransactions(res.data);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(txn => {
    const txnType = txn.type ? txn.type.toLowerCase() : '';
    const filterLower = activeFilter.toLowerCase();

    const matchesFilter = activeFilter === 'All' ||
      txnType === filterLower ||
      (activeFilter === 'Bonus' && (txnType === 'bonus' || txnType === 'salary')) ||
      (activeFilter === 'Investment' && txnType === 'deposit');

    const matchesSearch =
      (txn._id && txn._id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (txn.description && txn.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (txn.txHash && txn.txHash.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const getOperationBadge = (type) => {
    const lower = type?.toLowerCase() || '';
    switch (lower) {
      case 'deposit':
        return <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'rgba(243,16,253,0.08)', color: 'var(--pink)' }}>Package Buy</span>;
      case 'withdrawal':
        return <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>Withdrawal</span>;
      case 'investment':
        return <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'rgba(243,16,253,0.08)', color: 'var(--pink)' }}>Package Buy</span>;
      case 'mining':
      case 'copy trade':
      case 'roi':
        return <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'rgba(34,197,94,0.08)', color: '#22C55E' }}>Copy Trade Income</span>;
      case 'level income':
      case 'level':
        return <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', color: '#3B82F6' }}>Level Income</span>;
      case 'bonus':
      case 'salary':
      default:
        return <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: 'rgba(124,58,237,0.08)', color: 'var(--purple)' }}>Referral Income</span>;
    }
  };

  const getStatusBadge = (status) => {
    const lower = status?.toLowerCase() || '';
    if (lower === 'completed' || lower === 'approved' || lower === 'success') {
      return (
        <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 10 }}>
          <CheckCircle2 size={11} /> Success
        </span>
      );
    } else if (lower === 'pending') {
      return (
        <span className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 10 }}>
          <Clock size={11} /> Pending
        </span>
      );
    } else {
      return (
        <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', fontSize: 10 }}>
          <XCircle size={11} /> Failed
        </span>
      );
    }
  };

  // CSV Exporter
  const downloadCSV = (data, filename) => {
    const csvRows = [];
    csvRows.push(['Type', 'Description', 'Amount (USDT)', 'Date', 'Status', 'Hash / ID'].join(','));
    
    data.forEach(row => {
      const type = row.type || '';
      const desc = (row.description || 'System Transaction').replace(/,/g, ' ');
      const amt = `${row.type?.toLowerCase() === 'withdrawal' ? '-' : '+'}${row.amount}`;
      const date = new Date(row.createdAt).toLocaleDateString();
      const status = row.status || '';
      const hash = row.txHash || row._id || '';
      
      csvRows.push([type, desc, amt, date, status, hash].join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel Exporter
  const downloadExcel = (data, filename) => {
    const rows = [];
    rows.push(['Type', 'Description', 'Amount (USDT)', 'Date', 'Status', 'Hash / ID'].join('\t'));
    
    data.forEach(row => {
      const type = row.type || '';
      const desc = row.description || 'System Transaction';
      const amt = `${row.type?.toLowerCase() === 'withdrawal' ? '-' : '+'}${row.amount}`;
      const date = new Date(row.createdAt).toLocaleDateString();
      const status = row.status || '';
      const hash = row.txHash || row._id || '';
      
      rows.push([type, desc, amt, date, status, hash].join('\t'));
    });
    
    const blob = new Blob([rows.join('\n')], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Exporter (Print Preview Window)
  const downloadPDF = (data) => {
    const printWindow = window.open('', '_blank');
    const html = `
      <html>
        <head>
          <title>Ledger Logs Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #333; }
            h2 { color: #A020F0; margin-bottom: 5px; }
            p { font-size: 12px; color: #666; margin-top: 0; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 10px; font-size: 12px; text-align: left; }
            th { background-color: #f8f9fa; font-weight: bold; }
            tr:nth-child(even) { background-color: #fdfdfd; }
            .amount { font-family: monospace; font-weight: bold; }
            .credit { color: #21C55E; }
            .debit { color: #EF4444; }
          </style>
        </head>
        <body>
          <h2>Ledger Logs Report</h2>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Description</th>
                <th>Amount (USDT)</th>
                <th>Date</th>
                <th>Status</th>
                <th>Hash / ID</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(row => {
                const isDebit = row.type?.toLowerCase() === 'withdrawal';
                return `
                  <tr>
                    <td style="text-transform: capitalize;">${row.type || 'N/A'}</td>
                    <td>${row.description || 'System Transaction'}</td>
                    <td class="amount ${isDebit ? 'debit' : 'credit'}">
                      ${isDebit ? '-' : '+'}$${row.amount.toFixed(2)}
                    </td>
                    <td>${new Date(row.createdAt).toLocaleDateString()}</td>
                    <td>${row.status || 'Success'}</td>
                    <td style="font-family: monospace; font-size: 11px;">${row.txHash || row._id || 'System'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleExport = (type) => {
    if (filteredTransactions.length === 0) {
      return toast.warn('No transaction data to export.');
    }
    if (type === 'csv') {
      downloadCSV(filteredTransactions, 'ledger_logs.csv');
      toast.success('CSV downloaded successfully.');
    } else if (type === 'excel') {
      downloadExcel(filteredTransactions, 'ledger_logs.xls');
      toast.success('Excel file downloaded successfully.');
    } else if (type === 'pdf') {
      downloadPDF(filteredTransactions);
      toast.success('Print dialog opened.');
    }
  };

  return (
    <div className="fade-up" style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 20px 48px', textAlign: 'left' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--near-black)', margin: 0 }}>Ledger Logs</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>
            Master transaction registry recorded on the blockchain network
          </p>
        </div>

        {/* Action Export Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={() => handleExport('pdf')}
            style={{
              padding: '8px 14px', borderRadius: 10, border: 'none', background: 'rgba(239,68,68,0.08)',
              color: '#EF4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
            }}
          >
            <FileText size={14} /> PDF
          </button>
          <button 
            onClick={() => handleExport('excel')}
            style={{
              padding: '8px 14px', borderRadius: 10, border: 'none', background: 'rgba(34,197,94,0.08)',
              color: '#22C55E', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
            }}
          >
            <Download size={14} /> Excel
          </button>
          <button 
            onClick={() => handleExport('csv')}
            style={{
              padding: '8px 14px', borderRadius: 10, border: 'none', background: 'rgba(124,58,237,0.08)',
              color: 'var(--purple)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
            }}
          >
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Main Logs Table Container Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(243, 16, 253, 0.15)', borderRadius: 24,
        padding: '24px 0', boxShadow: '0 8px 32px rgba(243, 16, 253, 0.05)',
      }}>
        
        {/* Filter Selection and Search */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12,
                padding: '10px 14px 10px 38px', fontSize: 13, color: 'var(--near-black)', width: '100%'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} style={{ color: 'var(--muted)' }} />
            <select
              value={activeFilter}
              onChange={e => setActiveFilter(e.target.value)}
              style={{
                background: 'white', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12,
                padding: '10px 24px 10px 14px', fontSize: 13, color: 'var(--near-black)', minWidth: 140, cursor: 'pointer'
              }}
            >
              {filters.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Logs Table Area */}
        <div className="table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.01)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <th className="p-4 pl-6" style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textAlign: 'left' }}>Type</th>
                <th className="p-4" style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textAlign: 'left' }}>Description</th>
                <th className="p-4 text-center" style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>Amount</th>
                <th className="p-4 text-center" style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>Date</th>
                <th className="p-4 text-center" style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>Status</th>
                <th className="p-4 pr-6 text-right" style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>Hash / ID</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
                    Loading transaction registry...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
                    No transactions matched search criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((row, idx) => {
                  const dateObj = new Date(row.createdAt);
                  const day = String(dateObj.getDate()).padStart(2, '0');
                  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                  const year = dateObj.getFullYear();
                  const dateStr = `${day}/${month}/${year}`;

                  const isDebit = row.type?.toLowerCase() === 'withdrawal';

                  return (
                    <tr key={row._id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }} className="table-row-hover">
                      
                      {/* Type Badge */}
                      <td className="p-4 pl-6">
                        {getOperationBadge(row.type)}
                      </td>

                      {/* Description */}
                      <td className="p-4" style={{ fontSize: 13, color: 'var(--near-black)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.description || 'System Transaction'}
                      </td>

                      {/* Amount with custom positive emerald color */}
                      <td className="p-4 text-center" style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: isDebit ? '#EF4444' : '#21C55E' }}>
                        {isDebit ? '-' : '+'}${row.amount.toFixed(2)}
                      </td>

                      {/* Date */}
                      <td className="p-4 text-center" style={{ fontSize: 13, color: 'var(--muted)' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={13} style={{ color: 'var(--muted)' }} />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="p-4 text-center">
                        {getStatusBadge(row.status)}
                      </td>

                      {/* Hash / ID Reference */}
                      <td className="p-4 pr-6 text-right" style={{ fontSize: 12 }}>
                        {row.txHash && row.txHash !== 'System' ? (
                          <a 
                            href={`https://bscscan.com/tx/${row.txHash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: 'var(--pink)', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 600 }}
                          >
                            <span style={{ fontFamily: 'monospace' }}>
                              {`${row.txHash.substring(0, 6)}...${row.txHash.substring(row.txHash.length - 4)}`}
                            </span>
                            <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontFamily: 'monospace' }}>
                            {row._id ? `${row._id.substring(0, 8)}...` : 'System'}
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

export default Transactions;
