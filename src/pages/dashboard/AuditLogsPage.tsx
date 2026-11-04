import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { AuditLog } from '../../types';
import { ExportControls } from '../../components/common/ExportControls';
import { FileClock, Search, ShieldCheck, Filter } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/audit', {
        params: {
          action: actionFilter,
          search: search || undefined,
        },
      });
      setLogs(res.data?.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const exportColumns = [
    { header: 'Log ID', key: 'id' },
    { header: 'Action', key: 'action' },
    { header: 'User Name', key: 'user_name' },
    { header: 'Role', key: 'user_role' },
    { header: 'Target Type', key: 'record_type' },
    { header: 'Record Ref', key: 'record_id' },
    { header: 'Details', key: 'details' },
    { header: 'IP Address', key: 'ip_address' },
    { header: 'Timestamp', key: 'created_at' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#252B33]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-[#F0F3F6] tracking-tight">
              Security Audit & Activity Logs
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FCD535]/15 text-[#B37800] dark:text-[#FCD535] border border-[#FCD535]/30">
              IMMUTABLE JOURNAL
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A0AAB8] mt-1">
            Tamper-resistant audit trails tracking user logins, admissions verdicts, stock issues, and permission updates.
          </p>
        </div>

        <ExportControls
          title="IBB System Security & Operational Audit Trail"
          data={logs}
          columns={exportColumns}
          fileNamePrefix="IBB_Audit_Logs"
        />
      </div>

      {/* Filter and Search (Level 3 Surface) */}
      <div className="bg-white dark:bg-[#181D24] rounded-xl p-3.5 border border-slate-200 dark:border-[#2B3139] shadow-xs flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 dark:text-[#707A8A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, staff member, or metadata details..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-900 dark:text-[#F0F3F6] placeholder-slate-400 dark:placeholder-[#707A8A] focus:outline-none focus:border-[#FCD535]"
          />
        </form>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-500 dark:text-[#707A8A] text-[11px] font-mono font-medium">Filter Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#11151B] border border-slate-200 dark:border-[#2B3139] text-slate-800 dark:text-[#F0F3F6] focus:outline-none focus:border-[#FCD535]"
          >
            <option value="all">All Actions</option>
            <option value="LOGIN_SUCCESS">Logins</option>
            <option value="ADMISSION_APPROVED">Admission Approvals</option>
            <option value="ADMISSION_REJECTED">Admission Rejections</option>
            <option value="STOCK_IN">Stock In Deliveries</option>
            <option value="STOCK_OUT">Stock Out Issues</option>
            <option value="STOCK_OUT_EMERGENCY_OVERRIDE">Emergency Overrides</option>
            <option value="CREATE_STAFF_ACCOUNT">Staff Accounts</option>
          </select>
        </div>
      </div>

      {/* Logs Table (Level 3 Surface) */}
      <div className="bg-white dark:bg-[#181D24] rounded-xl border border-slate-200 dark:border-[#2B3139] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-[#A0AAB8] font-mono">
            Querying audit trail records...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-[#707A8A] space-y-2">
            <FileClock className="w-8 h-8 mx-auto text-slate-400 dark:text-[#707A8A]" />
            <p className="text-xs">No audit logs matching query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-slate-50 dark:bg-[#11151B] text-slate-500 dark:text-[#707A8A] uppercase font-mono tracking-wider text-[10px] border-b border-slate-200 dark:border-[#252B33]">
                <tr>
                  <th className="py-3 px-4 font-bold">Timestamp (CAT)</th>
                  <th className="py-3 px-4 font-bold">Action</th>
                  <th className="py-3 px-4 font-bold">Staff Member</th>
                  <th className="py-3 px-4 font-bold">Target</th>
                  <th className="py-3 px-4 font-bold">Details / Notes</th>
                  <th className="py-3 px-4 font-bold text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#252B33]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-[#202630]/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-[#707A8A] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-xs">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        log.action.includes('APPROVED') || log.action.includes('SUCCESS')
                          ? 'bg-[#0ECB81]/15 text-[#0ECB81] border border-[#0ECB81]/30'
                          : log.action.includes('REJECTED') || log.action.includes('OVERRIDE') || log.action.includes('FAILED')
                          ? 'bg-[#F6465D]/15 text-[#F6465D] border border-[#F6465D]/30'
                          : 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-[#F0F3F6] block">{log.user_name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-[#707A8A] font-mono">{log.user_role}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-[#A0AAB8] font-mono text-[11px]">
                      {log.record_type} {log.record_id ? `#${log.record_id}` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-[#A0AAB8] max-w-xs truncate" title={log.details}>
                      {log.details || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400 dark:text-[#707A8A] text-[11px]">
                      {log.ip_address || '127.0.0.1'}
                    </td>
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
