import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Zap, AlertTriangle, XCircle, Clock, CheckCircle2 } from 'lucide-react';
import { aiAPI } from '../api/services.js';

const STATUS_META = {
  ok:          { label: 'Operational',   dot: 'bg-emerald-500',  text: 'text-emerald-700 dark:text-emerald-400',  bg: 'bg-emerald-50 dark:bg-emerald-950/30',  border: 'border-emerald-200 dark:border-emerald-900/50', Icon: CheckCircle2 },
  rate_limit:  { label: 'Rate Limited',  dot: 'bg-amber-500',    text: 'text-amber-700 dark:text-amber-400',      bg: 'bg-amber-50 dark:bg-amber-950/30',      border: 'border-amber-200 dark:border-amber-900/50',    Icon: AlertTriangle },
  auth:        { label: 'Auth Error',    dot: 'bg-red-500',      text: 'text-red-700 dark:text-red-400',          bg: 'bg-red-50 dark:bg-red-950/30',          border: 'border-red-200 dark:border-red-900/50',        Icon: XCircle },
  unavailable: { label: 'Unavailable',   dot: 'bg-red-400',      text: 'text-red-600 dark:text-red-400',          bg: 'bg-red-50 dark:bg-red-950/30',          border: 'border-red-200 dark:border-red-900/50',        Icon: XCircle },
  unknown:     { label: 'Error',         dot: 'bg-rose-400',     text: 'text-rose-600 dark:text-rose-400',        bg: 'bg-rose-50 dark:bg-rose-950/30',        border: 'border-rose-200 dark:border-rose-900/50',      Icon: XCircle },
  untested:    { label: 'Not tested',    dot: 'bg-slate-300 dark:bg-slate-600',  text: 'text-slate-500 dark:text-slate-400',  bg: 'bg-slate-50 dark:bg-slate-800/60',  border: 'border-slate-200 dark:border-slate-700',      Icon: Clock },
  not_configured: { label: 'No API key', dot: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-400 dark:text-slate-500',  bg: 'bg-slate-50 dark:bg-slate-800/40',  border: 'border-slate-100 dark:border-slate-800',      Icon: Clock },
};

function timeSince(iso) {
  if (!iso) return null;
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

export default function AiProviderStatus({ compact = false, autoRefreshSecs = 30 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pinging, setPinging] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchStatus = useCallback(async (withPing = false) => {
    try {
      const res = await aiAPI.getStatus(withPing);
      setData(res.data);
      setLastRefresh(new Date());
    } catch {
      // silently ignore — user may not have admin/doctor role
    } finally {
      setLoading(false);
      setPinging(false);
    }
  }, []);

  const handlePing = async () => {
    setPinging(true);
    await fetchStatus(true);
  };

  useEffect(() => {
    fetchStatus(false);
    const interval = setInterval(() => fetchStatus(false), autoRefreshSecs * 1000);
    return () => clearInterval(interval);
  }, [fetchStatus, autoRefreshSecs]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-teal-600" />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">AI Provider Status</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const overallHealthy = data.cascade_healthy;

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium
        border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <span className={`w-2 h-2 rounded-full ${overallHealthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <span className="text-slate-700 dark:text-slate-300">
          AI {overallHealthy ? `· ${data.active_provider ?? 'active'}` : '· degraded'}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-teal-600" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">AI Provider Status</h3>
          <span className={`ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide
            ${overallHealthy
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
              : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${overallHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
            {overallHealthy ? 'Healthy' : 'Degraded'}
          </span>
        </div>
        <button
          type="button"
          onClick={handlePing}
          disabled={pinging}
          title="Live ping all providers"
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={11} className={pinging ? 'animate-spin' : ''} />
          {pinging ? 'Pinging…' : 'Ping'}
        </button>
      </div>

      <div className="p-4 space-y-2.5">
        {data.providers.map((p) => {
          const effectiveStatus = !p.configured ? 'not_configured' : p.status;
          const meta = STATUS_META[effectiveStatus] ?? STATUS_META.unknown;
          const { Icon } = meta;
          const isActive = p.id === data.active_provider;

          return (
            <div
              key={p.id}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border ${meta.bg} ${meta.border} transition-all`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${meta.dot} ${effectiveStatus === 'ok' ? 'animate-pulse' : ''}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{p.label}</span>
                    {isActive && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{p.model}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-2">
                {p.latencyMs != null && effectiveStatus === 'ok' && (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">{p.latencyMs}ms</span>
                )}
                <div className={`flex items-center gap-1 ${meta.text}`}>
                  <Icon size={12} />
                  <span className="text-xs font-medium">{meta.label}</span>
                </div>
              </div>
            </div>
          );
        })}

        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span>Cascade: Gemini → Groq → OpenRouter</span>
          {lastRefresh && <span>Updated {timeSince(lastRefresh.toISOString())}</span>}
        </div>
      </div>
    </div>
  );
}
