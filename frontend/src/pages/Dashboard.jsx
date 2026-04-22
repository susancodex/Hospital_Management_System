import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CalendarCheck,
  CircleDollarSign,
  Clock,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { appointmentsAPI, billingAPI, doctorsAPI, patientsAPI } from '../api/services.js';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuthStore } from '../store/authStore.js';

const STAT_COLORS = ['#2563EB', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6', '#14B8A6'];

const roleLabels = {
  admin: 'Administrator',
  doctor: 'Doctor',
  reception: 'Receptionist',
};

const roleStyles = {
  admin: 'bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-500/20',
  doctor: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/20',
  reception: 'bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/20',
};

const fmtShortDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(5);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [billing, setBilling] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          patientsAPI.list(),
          doctorsAPI.list(),
          appointmentsAPI.list(),
          billingAPI.list(),
        ]);

        setPatients(results[0].status === 'fulfilled' ? results[0].value.items : []);
        setDoctors(results[1].status === 'fulfilled' ? results[1].value.items : []);
        setAppointments(results[2].status === 'fulfilled' ? results[2].value.items : []);
        setBilling(results[3].status === 'fulfilled' ? results[3].value.items : []);
      } catch (error) {
        console.error('Dashboard loading error:', error);
        setPatients([]);
        setDoctors([]);
        setAppointments([]);
        setBilling([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todaysAppointments = appointments.filter((item) => item.appointment_date === today);
  const upcomingAppointments = [...appointments]
    .filter((item) => item.appointment_date >= today)
    .sort((a, b) => `${a.appointment_date || ''} ${a.appointment_time || ''}`.localeCompare(`${b.appointment_date || ''} ${b.appointment_time || ''}`))
    .slice(0, 6);

  const revenue = billing.filter((item) => item.status === 'paid').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const outstanding = billing.reduce((sum, item) => sum + Number(item.balance_due ?? item.amount ?? 0), 0);
  const collectionRate = billing.length ? Math.round((billing.filter((item) => item.status === 'paid').length / billing.length) * 100) : 0;

  const trend = useMemo(() => {
    const map = new Map();
    appointments.forEach((item) => {
      if (!item.appointment_date) return;
      map.set(item.appointment_date, (map.get(item.appointment_date) || 0) + 1);
    });

    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7)
      .map(([date, count]) => ({ date: fmtShortDate(date), count }));
  }, [appointments]);

  const apptStatus = useMemo(() => {
    const counts = appointments.reduce((acc, row) => {
      const key = row.status || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      fill: STAT_COLORS[index % STAT_COLORS.length],
    }));
  }, [appointments]);

  const kpis = [
    { label: 'Total Patients', value: patients.length, icon: Users, gradient: 'from-blue-500 to-blue-600', note: 'Registered patient profiles' },
    { label: 'Active Doctors', value: doctors.length, icon: Stethoscope, gradient: 'from-emerald-500 to-emerald-600', note: 'Available care providers' },
    { label: 'Today’s Appointments', value: todaysAppointments.length, icon: CalendarCheck, gradient: 'from-amber-500 to-amber-600', note: 'Scheduled for today' },
    { label: 'Total Revenue', value: `$${revenue.toLocaleString()}`, icon: CircleDollarSign, gradient: 'from-indigo-500 to-indigo-600', note: `${collectionRate}% collection rate` },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className={`overflow-hidden rounded-3xl border shadow-sm transition-colors duration-300 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200/80 bg-white'}`}>
        <div className="grid gap-0 xl:grid-cols-[1.6fr_0.9fr]">
          <div className={`relative p-5 sm:p-6 lg:p-8 ${isDark ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950' : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800'} text-white`}>
            <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_top_right,rgba(59,130,246,0.35),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.16),transparent_28%)]" />
            <div className="relative flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-inset ring-white/15 backdrop-blur">
                    <Activity size={24} />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.3em] text-blue-200/80">Hospital Management</p>
                      <h1 className="font-heading mt-2 text-2xl font-bold sm:text-3xl lg:text-4xl">
                        {greeting()}, {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username}
                      </h1>
                    </div>
                    <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                      Track patient flow, clinical operations, and revenue performance from a single responsive command center.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${roleStyles[user?.role] || 'bg-slate-500/15 text-slate-200 ring-1 ring-inset ring-slate-500/20'}`}>
                        <Sparkles size={12} />
                        {roleLabels[user?.role] || user?.role || 'User'}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-100 ring-1 ring-inset ring-white/10">
                        <Clock size={12} />
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:max-w-md xl:grid-cols-1 xl:min-w-[220px]">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <p className="text-xs text-slate-300">Today</p>
                    <p className="mt-1 text-2xl font-bold">{todaysAppointments.length}</p>
                    <p className="mt-1 text-xs text-slate-300">Appointments</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <p className="text-xs text-slate-300">Pending</p>
                    <p className="mt-1 text-2xl font-bold">{outstanding.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-slate-300">Outstanding</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <p className="text-xs text-slate-300">Coverage</p>
                    <p className="mt-1 text-2xl font-bold">{collectionRate}%</p>
                    <p className="mt-1 text-xs text-slate-300">Collected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`grid gap-4 p-5 sm:grid-cols-3 xl:grid-cols-1 xl:p-6 ${isDark ? 'bg-slate-900' : 'bg-slate-50/70'}`}>
            <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
              <p className={`text-xs font-medium uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Patients</p>
              <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{patients.length}</p>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total registered</p>
            </div>
            <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
              <p className={`text-xs font-medium uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Doctors</p>
              <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{doctors.length}</p>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>In directory</p>
            </div>
            <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
              <p className={`text-xs font-medium uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Revenue</p>
              <p className={`mt-2 text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>${revenue.toLocaleString()}</p>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{collectionRate}% collected</p>
            </div>
          </div>
        </div>
      </section>

      <PageHeader title="Executive Dashboard" subtitle="A structured overview of operations, finance, and clinical flow" icon={Activity} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;

          return (
            <article key={kpi.label} className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200/80 bg-white'}`}>
              <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${kpi.gradient} opacity-10`} />
              <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${kpi.gradient} shadow-lg shadow-black/10`}>
                <Icon size={20} className="text-white" />
              </div>
              <p className={`mt-4 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{kpi.label}</p>
              <p className={`mt-2 text-3xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{loading ? '...' : kpi.value}</p>
              <p className={`mt-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{kpi.note}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.6fr_0.9fr]">
        <article className={`rounded-2xl border p-5 shadow-sm transition-colors duration-300 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200/80 bg-white'}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className={`font-heading text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Appointments Trend</h3>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Weekly activity in a compact mobile-friendly view</p>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'}`}>
              <TrendingUp size={14} />
              <span>{appointments.length} total</span>
            </div>
          </div>

          <div className="mt-5 h-[260px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashboardTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.24} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                <Tooltip
                  cursor={{ stroke: isDark ? '#475569' : '#cbd5e1', strokeDasharray: '4 4' }}
                  contentStyle={{
                    borderRadius: 14,
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    boxShadow: '0 18px 30px -16px rgb(15 23 42 / 0.25)',
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="#2563EB" fill="url(#dashboardTrend)" strokeWidth={3} dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className={`rounded-2xl border p-5 shadow-sm transition-colors duration-300 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200/80 bg-white'}`}>
          <div>
            <h3 className={`font-heading text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Status Distribution</h3>
            <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Appointment breakdown by state</p>
          </div>

          <div className="mt-4 h-[220px] sm:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={apptStatus.length ? apptStatus : [{ name: 'none', value: 1, fill: '#cbd5e1' }]} dataKey="value" nameKey="name" outerRadius="80%" innerRadius="55%" paddingAngle={4} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 14,
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    boxShadow: '0 18px 30px -16px rgb(15 23 42 / 0.25)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {apptStatus.map((item) => (
              <div key={item.name} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${isDark ? 'border-slate-700 bg-slate-700/40' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className={`text-xs font-medium capitalize ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.name}</span>
                </div>
                <span className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <article className={`rounded-2xl border p-5 shadow-sm transition-colors duration-300 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200/80 bg-white'}`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className={`font-heading text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Today’s Schedule</h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{todaysAppointments.length} appointments today</p>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <Clock size={14} />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>

          {todaysAppointments.length === 0 ? (
            <div className={`mt-5 flex flex-col items-center justify-center rounded-2xl px-6 py-12 text-center ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
              <CalendarCheck size={48} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
              <p className={`mt-4 font-medium ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>No appointments scheduled</p>
              <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>New bookings will appear here automatically</p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {todaysAppointments.slice(0, 6).map((row) => (
                <div key={row.id} className={`rounded-2xl border p-4 transition-all duration-300 ${isDark ? 'border-slate-700 bg-slate-700/40 hover:border-blue-600/60 hover:bg-slate-700' : 'border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-white hover:shadow-sm'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`truncate font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{row.patient_name}</p>
                      <p className={`mt-1 truncate text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{row.doctor_name}</p>
                    </div>
                    <StatusBadge value={row.status} />
                  </div>
                  <div className={`mt-3 flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Clock size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                    <span>{row.appointment_time || 'Not scheduled'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <aside className="grid gap-5">
          <article className={`rounded-2xl border p-5 shadow-sm transition-colors duration-300 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200/80 bg-white'}`}>
            <h3 className={`font-heading text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Operations Snapshot</h3>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Appointments today', value: todaysAppointments.length },
                { label: 'Upcoming queue', value: upcomingAppointments.length },
                { label: 'Outstanding balance', value: `$${outstanding.toLocaleString()}` },
              ].map((item) => (
                <div key={item.label} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${isDark ? 'border-slate-700 bg-slate-700/30' : 'border-slate-200 bg-slate-50'}`}>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</p>
                  <p className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </article>

          <article className={`rounded-2xl border p-5 shadow-sm transition-colors duration-300 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200/80 bg-white'}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className={`font-heading text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Next Appointments</h3>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Next 6 in the schedule</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {upcomingAppointments.length === 0 ? (
                <div className={`rounded-xl px-4 py-5 text-sm ${isDark ? 'bg-slate-700/40 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                  No upcoming appointments.
                </div>
              ) : (
                upcomingAppointments.map((item) => (
                  <div key={item.id} className={`rounded-xl border px-4 py-3 ${isDark ? 'border-slate-700 bg-slate-700/30' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`truncate text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{item.patient_name}</p>
                        <p className={`truncate text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.doctor_name}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${isDark ? 'bg-slate-600/50 text-slate-200' : 'bg-white text-slate-600'}`}>{item.status}</span>
                    </div>
                    <div className={`mt-3 flex items-center justify-between text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <span>{fmtShortDate(item.appointment_date)}</span>
                      <span>{item.appointment_time || 'No time'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}