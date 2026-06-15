import { useEffect, useState, useCallback, useRef } from 'react';
import { Activity, Cpu, Globe, Server, Shield, Users, Wifi, Zap, Clock, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { useWsEvent, useWebSocket } from '../hooks/useWebSocket.js';
import { useAuthStore } from '../store/authStore.js';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || '/api';

const ACTION_COLORS = {
  LOGIN: '#10b981', LOGOUT: '#64748b', CREATE: '#3b82f6', UPDATE: '#f59e0b',
  DELETE: '#ef4444', SOAP_GENERATE: '#8b5cf6', VOICE_TRANSCRIBE: '#ec4899',
  VIEW: '#06b6d4', APPROVE: '#22c55e', REJECT: '#f43f5e',
};

function StatCard({ icon: Icon, label, value, sub, color = 'teal', live = false }) {
  const colors = {
    teal: 'from-teal-50 to-teal-100/50 dark:from-teal-950/40 dark:to-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300',
    blue: 'from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    violet: 'from-violet-50 to-violet-100/50 dark:from-violet-950/40 dark:to-violet-900/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300',
    amber: 'from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
  };
  return (
    <div className={`relative rounded-xl border bg-gradient-to-br p-4 ${colors[color]}`}>
      {live && <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Live" />}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-white/60 dark:bg-white/5 grid place-items-center">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-medium opacity-70">{label}</p>
          <p className="text-xl font-bold leading-tight">{value ?? '—'}</p>
          {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function LiveBadge({ action }) {
  const color = ACTION_COLORS[action] || '#94a3b8';
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: color + '22', color }}>
      {action}
    </span>
  );
}

export default function Monitoring() {
  const token = useAuthStore((s) => s.token);
  const [stats, setStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const liveCountRef = useRef(0);

  const { connected } = useWebSocket({});

  useEffect(() => { setWsConnected(connected); }, [connected]);

  useWsEvent('audit', (data) => {
    liveCountRef.current++;
    setLiveEvents((prev) => [{ ...data, id: Date.now(), live: true }, ...prev].slice(0, 100));
    toast.info(`[${data.action}] ${data.resource_type || ''}`, { duration: 2000 });
  });

  useWsEvent('notification', (data) => {
    setLiveEvents((prev) => [{ ...data, id: Date.now(), live: true, action: 'NOTIFICATION' }, ...prev].slice(0, 100));
  });

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, logsRes] = await Promise.all([
        fetch(`${API}/system/stats/`, { headers }),
        fetch(`${API}/audit-logs/?limit=50`, { headers }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (logsRes.ok) {
        const data = await logsRes.json();
        const logs = data.results || data || [];
        setAuditLogs(logs);

        // Build hourly chart data from logs
        const hourly = {};
        for (let i = 23; i >= 0; i--) {
          const h = new Date(); h.setHours(h.getHours() - i, 0, 0, 0);
          const key = h.getHours();
          hourly[key] = { hour: `${key}:00`, events: 0 };
        }
        for (const log of logs) {
          if (!log.created_at) continue;
          const h = new Date(log.created_at).getHours();
          if (hourly[h]) hourly[h].events++;
        }
        setChartData(Object.values(hourly));
      }
    } catch {
      // graceful
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const allEvents = [...liveEvents, ...auditLogs].slice(0, 80);

  const actionCounts = allEvents.reduce((acc, e) => {
    acc[e.action] = (acc[e.action] || 0) + 1; return acc;
  }, {});

  const actionBarData = Object.entries(actionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([action, count]) => ({ action, count }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500">Loading monitoring data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-teal-600" />
            System Monitoring
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Real-time activity and health dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${wsConnected ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
            {wsConnected ? 'Live' : 'Reconnecting…'}
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Server Uptime" value={stats?.uptime_human || '—'} color="teal" />
        <StatCard icon={Wifi} label="WS Connections" value={stats?.ws_connections?.totalConnections ?? 0} sub={`${stats?.ws_connections?.activeUsers ?? 0} users`} color="blue" live />
        <StatCard icon={Users} label="Live Events" value={liveEvents.length} sub="since page load" color="violet" live />
        <StatCard icon={Cpu} label="Memory RSS" value={stats?.memory ? `${Math.round(stats.memory.rss / 1024 / 1024)} MB` : '—'} sub={stats?.node_version} color="amber" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Hourly Activity Chart */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" /> Events per Hour (last 24h)
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Line type="monotone" dataKey="events" stroke="#0f766e" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] grid place-items-center text-sm text-slate-400">No data yet</div>
          )}
        </div>

        {/* Top Actions Chart */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-violet-500" /> Top Actions
          </h2>
          {actionBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={actionBarData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} />
                <YAxis dataKey="action" type="category" tick={{ fontSize: 10 }} tickLine={false} width={100} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" fill="#0f766e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] grid place-items-center text-sm text-slate-400">No data yet</div>
          )}
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Globe className="h-4 w-4 text-teal-600" /> Live Activity Feed
          </h2>
          <span className="text-xs text-slate-400">{allEvents.length} events</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-slate-500 dark:text-slate-400">
                <th className="px-4 py-2 font-medium">Time</th>
                <th className="px-4 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium">Resource</th>
                <th className="px-4 py-2 font-medium">User</th>
                <th className="px-4 py-2 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {allEvents.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No events yet. Activity will appear here in real-time.</td></tr>
              ) : allEvents.map((event, i) => (
                <tr
                  key={event.id || i}
                  className={`border-b border-slate-50 dark:border-slate-800/50 last:border-0 transition-colors ${event.live ? 'bg-teal-50/50 dark:bg-teal-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                >
                  <td className="px-4 py-2 text-slate-400 font-mono">
                    {event.created_at ? new Date(event.created_at).toLocaleTimeString() : 'now'}
                    {event.live && <span className="ml-1 text-teal-500">●</span>}
                  </td>
                  <td className="px-4 py-2"><LiveBadge action={event.action} /></td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{event.resource_type || event.message || '—'}</td>
                  <td className="px-4 py-2 text-slate-500">{event.user_id || event.userId || '—'}</td>
                  <td className="px-4 py-2 font-mono text-slate-400">{event.ip_address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
