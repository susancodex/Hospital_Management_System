import { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { appointmentsAPI, billingAPI, doctorsAPI, patientsAPI } from '../api/services.js';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { useAuthStore } from '../store/authStore.js';

const fmtShortDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(5);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function KpiCard({ title, value, trend, trendUp, neutral = false }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="p-5">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">{title}</p>
        <div className="flex items-end justify-between">
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {value}
          </h3>
          <div
            className={`flex items-center text-xs font-medium ${
              neutral ? 'text-slate-500 dark:text-slate-400' : trendUp ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {neutral ? null : trendUp ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
            )}
            {trend}
          </div>
        </div>
      </div>
    </div>
  );
}

function AppointmentRow({ time, patient, initials, dept, status }) {
  return (
    <div className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-t border-slate-100 dark:border-slate-800 first:border-0 cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className="w-10 text-right shrink-0">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block leading-tight">
            {time.split(' ')[0]}
          </span>
          {time.split(' ')[1] && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">
              {time.split(' ')[1]}
            </span>
          )}
        </div>
        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 shrink-0 mx-1"></div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
            <span className="text-slate-600 dark:text-slate-300 text-xs font-medium">
              {initials}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-none group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors truncate">
              {patient}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{dept}</p>
          </div>
        </div>
      </div>
      <StatusBadge value={status} />
    </div>
  );
}

function OccupancyBar({ dept, used, total }) {
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
  const isHigh = percentage > 85;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium text-slate-700 dark:text-slate-300">{dept}</span>
        <span className="text-slate-500 dark:text-slate-400 text-xs">
          {used} / {total} beds
        </span>
      </div>
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isHigh ? 'bg-rose-500' : 'bg-teal-600'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user);
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

  const revenue = billing
    .filter((item) => item.status === 'paid')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const outstanding = billing.reduce(
    (sum, item) => sum + Number(item.balance_due ?? item.amount ?? 0),
    0
  );

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

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const todayDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const userName = user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username || 'Dr.';

  const recentPatients = patients.slice(0, 5);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{todayDateString}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {greeting()}, {userName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium shadow-sm transition-colors">
            <FileText className="w-4 h-4" />
            Generate Report
          </button>
          <button className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50">
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Patients"
          value={loading ? '...' : patients.length.toLocaleString()}
          trend="+4.2%"
          trendUp={true}
        />
        <KpiCard
          title="Today's Appointments"
          value={loading ? '...' : todaysAppointments.length.toLocaleString()}
          trend="+12%"
          trendUp={true}
        />
        <KpiCard
          title="Active Doctors"
          value={loading ? '...' : doctors.length.toLocaleString()}
          trend="0%"
          trendUp={true}
          neutral={true}
        />
        <KpiCard
          title="Outstanding Revenue"
          value={loading ? '...' : `$${outstanding.toLocaleString()}`}
          trend="-2.4%"
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (Chart + Table) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Patient Admissions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Last 7 days vs previous period
                </p>
              </div>
              <button className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '6px',
                      border: '1px solid var(--tw-colors-slate-200)',
                      boxShadow: 'none',
                    }}
                    itemStyle={{ color: '#0f766e', fontSize: '14px', fontWeight: 500 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#0f766e"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAdmissions)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Patients Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Recent Patients
              </h3>
              <button className="text-sm font-medium text-teal-700 dark:text-teal-400 hover:underline">
                View all
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/60 dark:bg-slate-900/40">
                  <tr>
                    <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Patient Name
                    </th>
                    <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      MRN
                    </th>
                    <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Date of Birth
                    </th>
                    <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Gender
                    </th>
                    <th className="h-10 px-5 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentPatients.length > 0 ? (
                    recentPatients.map((patient) => (
                      <tr
                        key={patient.id}
                        className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                          {patient.first_name} {patient.last_name}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                          {patient.mrn || '—'}
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                          {patient.date_of_birth ? fmtShortDate(patient.date_of_birth) : '—'}
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300 capitalize">
                          {patient.gender || '—'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <StatusBadge value={patient.is_active ? 'active' : 'inactive'} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                      >
                        No recent patients found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Today's Schedule */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Today's Schedule
              </h3>
              <button className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <CalendarIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="p-0">
              {todaysAppointments.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {todaysAppointments.slice(0, 5).map((appt) => {
                    const initials =
                      appt.patient_name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .substring(0, 2)
                        .toUpperCase() || '?';
                    return (
                      <AppointmentRow
                        key={appt.id}
                        time={appt.appointment_time || '—'}
                        patient={appt.patient_name || 'Unknown Patient'}
                        initials={initials}
                        dept={appt.doctor_name || 'General'}
                        status={appt.status || 'Scheduled'}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No appointments scheduled for today.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Department Occupancy */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Department Occupancy
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <OccupancyBar dept="ICU" used={18} total={20} />
              <OccupancyBar dept="ER" used={32} total={45} />
              <OccupancyBar dept="Cardiology" used={12} total={30} />
              <OccupancyBar dept="Pediatrics" used={24} total={40} />
            </div>
          </div>
        </div>
      </div>

      <footer className="pt-6 pb-2 text-center text-xs text-slate-400 dark:text-slate-500">
        AetherCare HMS · Secure & HIPAA-aware · System status:{' '}
        <span className="text-emerald-600 dark:text-emerald-500 font-medium">
          All systems operational
        </span>
      </footer>
    </div>
  );
}
