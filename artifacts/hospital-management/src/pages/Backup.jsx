import { useState, useEffect, useCallback } from 'react';
import { Database, Download, RefreshCw, CheckCircle2, AlertTriangle, Shield, HardDrive, Loader2, FileJson, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || '/api';

const TABLE_ICONS = {
  users: '👤', patients: '🏥', doctors: '⚕️', appointments: '📅',
  medical_records: '📋', prescriptions: '💊', billing: '💳',
  lab_orders: '🧪', pharmacy: '🧴', insurance: '🛡️', audit_logs: '🔍',
};

export default function Backup() {
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTables, setSelectedTables] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [lastExport, setLastExport] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/backup/stats/`, { headers });
      const data = await r.json();
      setStats(data);
      setSelectedTables((data.tables || []).map((t) => t.name));
    } catch {
      toast.error('Failed to load backup stats');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleExport = async () => {
    if (selectedTables.length === 0) { toast.error('Select at least one table'); return; }
    setExporting(true);
    try {
      const qs = selectedTables.length === (stats?.tables || []).length ? '' : `?tables=${selectedTables.join(',')}`;
      const r = await fetch(`${API}/backup/export/${qs}`, { headers });
      if (!r.ok) throw new Error('Export failed');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aethercare-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const now = new Date().toISOString();
      setLastExport(now);
      localStorage.setItem('aethercare_last_backup', now);
      toast.success('Backup downloaded successfully');
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const toggleTable = (name) => {
    setSelectedTables((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  };

  const toggleAll = () => {
    const all = (stats?.tables || []).map((t) => t.name);
    setSelectedTables(selectedTables.length === all.length ? [] : all);
  };

  useEffect(() => {
    const stored = localStorage.getItem('aethercare_last_backup');
    if (stored) setLastExport(stored);
  }, []);

  const totalRecords = stats?.total_records || 0;
  const allSelected = stats && selectedTables.length === (stats.tables || []).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-teal-600" />
            Backup & Disaster Recovery
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Export and safeguard your clinical data</p>
        </div>
        <button
          type="button"
          onClick={fetchStats}
          disabled={loading}
          className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 grid place-items-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/40 dark:to-green-900/20 p-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Database Status</span>
          </div>
          <p className="text-xl font-bold text-green-700 dark:text-green-300 mt-1">
            {stats?.db_status === 'healthy' ? 'Healthy' : 'Unknown'}
          </p>
          <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-0.5">PostgreSQL connected</p>
        </div>

        <div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50 to-teal-100/50 dark:from-teal-950/40 dark:to-teal-900/20 p-4">
          <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
            <Database className="h-4 w-4" />
            <span className="text-xs font-medium">Total Records</span>
          </div>
          <p className="text-xl font-bold text-teal-700 dark:text-teal-300 mt-1">
            {loading ? '—' : totalRecords.toLocaleString()}
          </p>
          <p className="text-xs text-teal-600/70 dark:text-teal-400/70 mt-0.5">Across all tables</p>
        </div>

        <div className={`rounded-xl border p-4 ${lastExport
          ? 'border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20'
          : 'border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20'}`}>
          <div className={`flex items-center gap-2 ${lastExport ? 'text-blue-700 dark:text-blue-400' : 'text-amber-700 dark:text-amber-400'}`}>
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Last Backup</span>
          </div>
          <p className={`text-sm font-bold mt-1 ${lastExport ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'}`}>
            {lastExport ? new Date(lastExport).toLocaleDateString() : 'Never'}
          </p>
          <p className={`text-xs mt-0.5 ${lastExport ? 'text-blue-600/70 dark:text-blue-400/70' : 'text-amber-600/70 dark:text-amber-400/70'}`}>
            {lastExport ? new Date(lastExport).toLocaleTimeString() : 'No backup recorded'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table selection */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Select Tables to Export</h2>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {loading ? (
            <div className="grid place-items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(stats?.tables || []).map((table) => {
                const selected = selectedTables.includes(table.name);
                return (
                  <label
                    key={table.name}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selected
                        ? 'border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleTable(table.name)}
                      className="accent-teal-600"
                    />
                    <span className="text-base">{TABLE_ICONS[table.name] || '📄'}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{table.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{table.count.toLocaleString()} records</p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Export panel */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <FileJson className="h-4 w-4 text-teal-600" />
              JSON Export
            </h2>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 mb-4">
              <div className="flex justify-between">
                <span>Format</span><span className="font-medium text-slate-800 dark:text-slate-200">JSON</span>
              </div>
              <div className="flex justify-between">
                <span>Tables selected</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{selectedTables.length} / {(stats?.tables || []).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Includes metadata</span>
                <span className="font-medium text-green-600 dark:text-green-400">Yes</span>
              </div>
              <div className="flex justify-between">
                <span>Passwords included</span>
                <span className="font-medium text-red-500">No (hashed only)</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || selectedTables.length === 0}
              className="w-full h-10 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {exporting ? 'Exporting…' : 'Download Backup'}
            </button>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">HIPAA Notice</p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Backup files contain PHI. Store them encrypted and in compliance with your organization's data retention policy.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">Recovery Checklist</h3>
            <div className="space-y-2">
              {[
                'Keep backups in a separate geographic location',
                'Test restore procedures quarterly',
                'Encrypt backup files at rest',
                'Document backup schedule and retention',
                'Verify integrity after each export',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-500 mt-0.5 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
