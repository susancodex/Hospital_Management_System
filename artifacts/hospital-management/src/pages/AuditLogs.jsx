import { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { auditAPI } from '../api/services.js';
import { TableSkeleton, EmptyState } from '../components/common/LoadingState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';

const ACTION_COLORS = {
  CREATE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  UPDATE: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  DELETE: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  LOGIN: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
  LOGOUT: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  AI_CHAT: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
  SYMPTOM_ANALYSIS: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
  DOCTOR_AI_ASSIST: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
  REPORT_SUMMARIZE: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
};

function ActionBadge({ action }) {
  const colorClass = ACTION_COLORS[action] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${colorClass}`}>
      {action}
    </span>
  );
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditAPI.list({ limit: 200 });
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full">
      <PageHeader
        title="Audit Logs"
        subtitle="Complete record of all system activity for security and compliance"
        kicker="Security"
        actions={
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} />
        ) : logs.length === 0 ? (
          <div className="p-8">
            <EmptyState icon={ShieldCheck} title="No audit logs yet" description="Activity will be recorded here as users interact with the system." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Time</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">User</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Action</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Resource</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Details</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      {log.user ? (
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{log.user.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{log.user.role}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">System</span>
                      )}
                    </td>
                    <td className="px-5 py-3"><ActionBadge action={log.action} /></td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {log.resource ? (
                        <span>{log.resource}{log.resource_id ? ` #${log.resource_id}` : ''}</span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">{log.details || '—'}</td>
                    <td className="px-5 py-3 text-slate-400 dark:text-slate-500 font-mono text-xs">{log.ip_address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
