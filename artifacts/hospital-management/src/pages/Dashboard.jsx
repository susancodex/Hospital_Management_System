import { useEffect, useMemo, useState } from 'react';
import {
  FileText, Plus, ArrowUpRight, ArrowDownRight, MoreHorizontal,
  Calendar as CalendarIcon, Users, Stethoscope, CreditCard,
  ClipboardList, Activity, Clock, CheckCircle2, AlertCircle, XCircle, Inbox,
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { appointmentsAPI, insightsAPI, statsAPI, patientsAPI } from '../api/services.js';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { useAuthStore } from '../store/authStore.js';
import AiProviderStatus from '../components/AiProviderStatus.jsx';

const fmtShortDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(5);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function KpiCard({ title, value, trend, trendUp, neutral = false, icon: Icon, iconColor = 'text-teal-600' }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          {Icon && (
            <div className={`w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${iconColor}`}>
              <Icon size={16} />
            </div>
          )}
        </div>
        <div className="flex items-end justify-between">
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {value}
          </h3>
          {trend && (
            <div className={`flex items-center text-xs font-medium ${neutral ? 'text-slate-500 dark:text-slate-400' : trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
              {neutral ? null : trendUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
              {trend}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── ADMIN DASHBOARD ───────────────────────────────────────────────────────── */
function AdminDashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          statsAPI.get(),
          appointmentsAPI.list(),
          patientsAPI.list(),
          insightsAPI.getAiInsights(),
        ]);
        setStats(results[0].status === 'fulfilled' ? results[0].value.data : null);
        setAppointments(results[1].status === 'fulfilled' ? results[1].value.items : []);
        setPatients(results[2].status === 'fulfilled' ? results[2].value.items : []);
        setAiInsights(results[3].status === 'fulfilled' ? results[3].value.data : null);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todaysAppointments = appointments.filter((a) => a.date === today);

  const trend = useMemo(() => {
    const map = new Map();
    appointments.forEach((a) => { if (!a.date) return; map.set(a.date, (map.get(a.date) || 0) + 1); });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-7).map(([date, count]) => ({ date: fmtShortDate(date), count }));
  }, [appointments]);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  };

  const handleGenerateReport = () => {
    try {
      const lines = [
        'AetherCare HMS — Admin Dashboard Report',
        `Generated: ${new Date().toLocaleString()}`,
        '',
        `Total Patients: ${stats?.total_patients ?? '—'}`,
        `Total Doctors: ${stats?.total_doctors ?? '—'}`,
        `Today's Appointments: ${stats?.today_appointments ?? '—'}`,
        `Pending Appointments: ${stats?.pending_appointments ?? '—'}`,
        `Revenue Collected: $${Number(stats?.total_revenue || 0).toFixed(2)}`,
        `Outstanding: $${Number(stats?.outstanding_revenue || 0).toFixed(2)}`,
      ];
      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `admin-report-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast.success('Report generated');
    } catch { toast.error('Unable to generate report'); }
  };

  const userName = user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username || 'Admin';

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full pb-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{greeting()}, {userName}</h1>
          <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-1 uppercase tracking-wide">Administrator</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button onClick={handleGenerateReport} className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium shadow-sm transition-colors">
            <FileText className="w-4 h-4" /> Export Report
          </button>
          <Link to="/appointments" className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors">
            <Plus className="w-4 h-4" /> New Appointment
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Patients" value={loading ? '…' : (stats?.total_patients ?? 0).toLocaleString()} trend="+4.2%" trendUp icon={Users} iconColor="text-emerald-600" />
        <KpiCard title="Active Doctors" value={loading ? '…' : (stats?.total_doctors ?? 0).toLocaleString()} trend="0%" trendUp neutral icon={Stethoscope} iconColor="text-blue-600" />
        <KpiCard title="Today's Appointments" value={loading ? '…' : (stats?.today_appointments ?? 0).toLocaleString()} trend="+12%" trendUp icon={CalendarIcon} iconColor="text-amber-600" />
        <KpiCard title="Outstanding Revenue" value={loading ? '…' : `$${Number(stats?.outstanding_revenue || 0).toLocaleString()}`} trend="-2.4%" trendUp={false} icon={CreditCard} iconColor="text-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Appointment Trend</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Last 7 days</p>
              </div>
            </div>
            <div className="p-5 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: 'none' }} itemStyle={{ color: '#0f766e', fontSize: '14px', fontWeight: 500 }} />
                  <Area type="monotone" dataKey="count" stroke="#0f766e" strokeWidth={2} fillOpacity={1} fill="url(#colorAdmissions)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Recent Patients</h3>
              <Link to="/patients" className="text-sm font-medium text-teal-700 dark:text-teal-400 hover:underline">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-slate-50/60 dark:bg-slate-900/40">
                  <tr>
                    {['Patient Name', 'Email', 'Blood Group', 'Status'].map((h) => (
                      <th key={h} className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {patients.slice(0, 6).map((p) => (
                    <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{p.first_name} {p.last_name}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400 text-xs">{p.email || '—'}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{p.blood_group || '—'}</td>
                      <td className="px-5 py-3"><StatusBadge value="active" /></td>
                    </tr>
                  ))}
                  {patients.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No patients yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Today's Schedule</h3>
            </div>
            {todaysAppointments.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {todaysAppointments.slice(0, 5).map((a) => {
                  const initials = (a.patient_name || '?').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
                  return (
                    <div key={a.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-t border-slate-100 dark:border-slate-800 first:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300">{initials}</div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{a.patient_name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{a.time || '—'}</p>
                        </div>
                      </div>
                      <StatusBadge value={a.status} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No appointments today.</div>
            )}
          </div>

          {aiInsights && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">AI Insights</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-rose-100 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-rose-600 dark:text-rose-400">High Risk</p>
                    <p className="mt-1 text-xl font-semibold text-rose-700 dark:text-rose-300">{aiInsights.risk_summary?.high_risk_patients || 0}</p>
                  </div>
                  <div className="rounded-lg border border-amber-100 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-amber-600 dark:text-amber-400">No-show Risk</p>
                    <p className="mt-1 text-xl font-semibold text-amber-700 dark:text-amber-300">{aiInsights.risk_summary?.high_no_show_risk_appointments || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <AiProviderStatus />

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Admin Quick Links</h3>
            {[
              { label: 'Manage User Accounts', path: '/admin/users', color: 'text-violet-700 dark:text-violet-400' },
              { label: 'View Departments', path: '/departments', color: 'text-blue-700 dark:text-blue-400' },
              { label: 'Audit Logs', path: '/audit-logs', color: 'text-slate-700 dark:text-slate-300' },
              { label: 'AI Centre', path: '/ai-triage', color: 'text-teal-700 dark:text-teal-400' },
            ].map(({ label, path, color }) => (
              <Link key={path} to={path} className={`flex items-center justify-between text-sm font-medium ${color} hover:underline`}>
                {label} <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <footer className="pt-6 pb-2 text-center text-xs text-slate-400 dark:text-slate-500">
        AetherCare HMS · Secure & HIPAA-aware · System status:{' '}
        <span className="text-emerald-600 dark:text-emerald-500 font-medium">All systems operational</span>
        <span className="block mt-1">Created by Susan Acharya</span>
      </footer>
    </div>
  );
}

/* ─── DOCTOR DASHBOARD ──────────────────────────────────────────────────────── */
function DoctorDashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  const loadAppointments = async () => {
    setApptLoading(true);
    try {
      const result = await appointmentsAPI.list();
      setAppointments(result.items || []);
    } catch {
      // silent
    } finally {
      setApptLoading(false);
    }
  };

  useEffect(() => {
    statsAPI.get()
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
    loadAppointments();
  }, []);

  const handleStatusUpdate = async (apptId, status) => {
    setActioningId(apptId);
    try {
      await appointmentsAPI.update(apptId, { status });
      const labels = { confirmed: 'confirmed', rejected: 'rejected', completed: 'completed', cancelled: 'cancelled' };
      toast.success(`Appointment ${labels[status] || status}`);
      await loadAppointments();
      statsAPI.get().then((r) => setStats(r.data)).catch(() => {});
    } catch {
      toast.error('Unable to update appointment');
    } finally {
      setActioningId(null);
    }
  };

  const pendingRequests = appointments.filter((a) => a.status === 'pending');
  const upcomingConfirmed = (stats?.upcoming_appointments || []).filter((a) => a.status !== 'pending');

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  };

  const doctorName = user?.first_name ? `Dr. ${user.first_name} ${user.last_name}` : user?.username || 'Doctor';

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto w-full pb-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{greeting()}, {doctorName}</h1>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1 uppercase tracking-wide">Doctor</p>
        </div>
        <div className="flex gap-3">
          <Link to="/availability" className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium shadow-sm">
            <Clock className="w-4 h-4" /> My Availability
          </Link>
          <Link to="/medical-records" className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm">
            <Plus className="w-4 h-4" /> New Record
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Appointments" value={loading ? '…' : (stats?.total_appointments ?? 0)} icon={CalendarIcon} iconColor="text-blue-600" />
        <KpiCard title="Today's Appointments" value={loading ? '…' : (stats?.today_appointments ?? 0)} icon={Clock} iconColor="text-amber-600" />
        <KpiCard title="Pending Requests" value={apptLoading ? '…' : pendingRequests.length} icon={AlertCircle} iconColor="text-rose-600" />
        <KpiCard title="My Patients" value={loading ? '…' : (stats?.total_patients ?? 0)} icon={Users} iconColor="text-emerald-600" />
      </div>

      {/* ── Pending Appointment Requests ── */}
      <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-amber-100 dark:border-amber-900/40 flex items-center justify-between bg-amber-50/60 dark:bg-amber-950/20">
          <div className="flex items-center gap-2.5">
            <Inbox className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Appointment Requests</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pending requests awaiting your decision</p>
            </div>
          </div>
          {pendingRequests.length > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold">
              {pendingRequests.length}
            </span>
          )}
        </div>
        {apptLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 dark:text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">All caught up!</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No pending appointment requests.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pendingRequests.map((appt) => {
              const isActioning = actioningId === appt.id;
              const initials = (appt.patient_name || '?').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
              return (
                <div key={appt.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-xs font-semibold text-amber-700 dark:text-amber-300 shrink-0">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{appt.patient_name || 'Unknown Patient'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {appt.date} at {appt.time || 'TBD'}
                        {appt.reason ? <span className="ml-2 text-slate-400">· {appt.reason}</span> : null}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
                    <button
                      type="button"
                      disabled={isActioning}
                      onClick={() => handleStatusUpdate(appt.id, 'confirmed')}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirm
                    </button>
                    <button
                      type="button"
                      disabled={isActioning}
                      onClick={() => handleStatusUpdate(appt.id, 'completed')}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-950/60 disabled:opacity-50 transition-colors"
                    >
                      Complete
                    </button>
                    <button
                      type="button"
                      disabled={isActioning}
                      onClick={() => handleStatusUpdate(appt.id, 'rejected')}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Upcoming Appointments</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your confirmed & scheduled appointments</p>
              </div>
              <Link to="/appointments" className="text-sm font-medium text-teal-700 dark:text-teal-400 hover:underline">View all</Link>
            </div>
            {loading ? (
              <div className="p-8 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (stats?.upcoming_appointments || []).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/60 dark:bg-slate-900/40">
                    <tr>
                      {['Date & Time', 'Patient', 'Reason', 'Status'].map((h) => (
                        <th key={h} className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.upcoming_appointments.map((a) => (
                      <tr key={a.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{a.date}</p>
                          <p className="text-xs text-slate-500">{a.time}</p>
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{a.patient_name}</td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300 text-xs max-w-[200px] truncate">{a.reason || '—'}</td>
                        <td className="px-5 py-3"><StatusBadge value={a.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No upcoming appointments.</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-5">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'View My Patients', path: '/patients', icon: Users },
                { label: 'All Appointments', path: '/appointments', icon: CalendarIcon },
                { label: 'Write Prescription', path: '/prescriptions', icon: ClipboardList },
                { label: 'Medical Records', path: '/medical-records', icon: FileText },
                { label: 'AI Assistant', path: '/ai-triage', icon: Activity },
              ].map(({ label, path, icon: Icon }) => (
                <Link key={path} to={path} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/60 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-900 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300 border border-blue-100/60 dark:border-blue-900/30">
                  <Icon size={15} className="text-blue-600 dark:text-blue-400" /> {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Performance</h3>
            <div className="space-y-3">
              {[
                { label: 'Completed Appointments', value: stats?.completed_appointments ?? '—' },
                { label: 'Medical Records Created', value: stats?.medical_records_created ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">{label}</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── PATIENT DASHBOARD ─────────────────────────────────────────────────────── */
function PatientDashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    statsAPI.get()
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  };

  const patientName = user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username || 'there';

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto w-full pb-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{greeting()}, {patientName}</h1>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 uppercase tracking-wide">Patient Portal</p>
        </div>
        <Link to="/appointments" className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm">
          <Plus className="w-4 h-4" /> Book Appointment
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Total Appointments" value={loading ? '…' : (stats?.total_appointments ?? 0)} icon={CalendarIcon} iconColor="text-teal-600" />
        <KpiCard title="Upcoming" value={loading ? '…' : (stats?.upcoming_appointments_count ?? 0)} icon={Clock} iconColor="text-amber-600" />
        <KpiCard title="Medical Records" value={loading ? '…' : (stats?.medical_records ?? 0)} icon={FileText} iconColor="text-blue-600" />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Upcoming Appointments</h3>
          <Link to="/appointments" className="text-sm font-medium text-teal-700 dark:text-teal-400 hover:underline">View all</Link>
        </div>
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (stats?.upcoming_appointments || []).length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats.upcoming_appointments.map((a) => (
              <div key={a.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/40 flex flex-col items-center justify-center shrink-0">
                    <p className="text-sm font-bold text-teal-700 dark:text-teal-400 leading-none">{new Date(a.date + 'T00:00:00').getDate()}</p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-500 uppercase">{new Date(a.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Dr. {a.doctor_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{a.time} · {a.reason || 'Consultation'}</p>
                  </div>
                </div>
                <StatusBadge value={a.status} />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-8 text-center">
            <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming appointments.</p>
            <Link to="/appointments" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 dark:text-teal-400 hover:underline">
              <Plus className="w-3.5 h-3.5" /> Book one now
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">My Health</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'My Records', path: '/medical-records', icon: FileText, color: 'text-blue-600' },
              { label: 'Prescriptions', path: '/prescriptions', icon: ClipboardList, color: 'text-purple-600' },
              { label: 'Reports', path: '/medical-reports', icon: Activity, color: 'text-rose-600' },
              { label: 'Billing', path: '/billing', icon: CreditCard, color: 'text-amber-600' },
            ].map(({ label, path, icon: Icon, color }) => (
              <Link key={path} to={path} className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-teal-200 dark:hover:border-teal-900/50 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 transition-colors text-center">
                <Icon size={20} className={color} />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-5">
          <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 mb-2">Health Assistant</h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-4">Get answers to health questions, check symptoms, and find general wellness guidance.</p>
          <div className="space-y-2 mb-4">
            <div className="rounded-lg bg-white/60 dark:bg-slate-900/60 border border-emerald-100/60 dark:border-emerald-900/30 px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
              💊 How do I manage my prescription?
            </div>
            <div className="rounded-lg bg-white/60 dark:bg-slate-900/60 border border-emerald-100/60 dark:border-emerald-900/30 px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
              🩺 I have a headache and fever, what should I do?
            </div>
          </div>
          <Link to="/ai-triage" className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium w-full justify-center">
            Open Health Assistant
          </Link>
        </div>
      </div>

      {stats?.outstanding_balance > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-5 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Outstanding Balance</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              You have an outstanding balance of <strong>${Number(stats.outstanding_balance).toFixed(2)}</strong>.
            </p>
            <Link to="/billing" className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline">View billing details →</Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── MAIN DASHBOARD (role router) ─────────────────────────────────────────── */
export default function Dashboard() {
  const user = useAuthStore((state) => state.user);

  if (user?.role === 'doctor') return <DoctorDashboard user={user} />;
  if (user?.role === 'patient') return <PatientDashboard user={user} />;
  return <AdminDashboard user={user} />;
}
