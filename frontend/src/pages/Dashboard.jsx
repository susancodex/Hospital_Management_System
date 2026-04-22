import { CalendarCheck, CircleDollarSign, Stethoscope, Users, TrendingUp, Clock, Activity, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { useAuthStore } from '../store/authStore.js';
import { appointmentsAPI, billingAPI, doctorsAPI, patientsAPI } from '../api/services.js';

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
  const todaysAppointments = appointments.filter((a) => a.appointment_date === today);
  const revenue = billing.filter((e) => e.status === 'paid').reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const trend = useMemo(() => {
    const map = new Map();
    appointments.forEach((e) => map.set(e.appointment_date, (map.get(e.appointment_date) || 0) + 1));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-7).map(([date, count]) => ({ date: date.slice(5), count }));
  }, [appointments]);

  const apptStatus = useMemo(() => {
    const counts = appointments.reduce((acc, r) => ({ ...acc, [r.status || 'unknown']: (acc[r.status] || 0) + 1 }), {});
    return Object.entries(counts).map(([name, value], idx) => ({ name, value, fill: ['#2563EB', '#22C55E', '#EF4444', '#f59e0b'][idx % 4] }));
  }, [appointments]);

  const kpis = [
    { label: 'Total Patients', value: patients.length, icon: Users, color: 'blue', gradient: 'from-blue-500 to-blue-600' },
    { label: 'Active Doctors', value: doctors.length, icon: Stethoscope, color: 'emerald', gradient: 'from-emerald-500 to-emerald-600' },
    { label: "Today's Appointments", value: todaysAppointments.length, icon: CalendarCheck, color: 'amber', gradient: 'from-amber-500 to-amber-600' },
    { label: 'Total Revenue', value: `$${revenue.toLocaleString()}`, icon: CircleDollarSign, color: 'indigo', gradient: 'from-indigo-500 to-indigo-600' },
  ];

  const roleColors = { admin: 'text-blue-600 bg-blue-50', doctor: 'text-emerald-600 bg-emerald-50', reception: 'text-amber-600 bg-amber-50' };
  const roleLabels = { admin: 'Administrator', doctor: 'Doctor', reception: 'Receptionist' };
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">{greeting()},</p>
              <p className="font-heading text-2xl font-bold">
                {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username}
              </p>
              <div className={`mt-1 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${roleColors[user?.role]}`}>
                <Sparkles size={12} />
                {roleLabels[user?.role] || user?.role}
              </div>
            </div>
          </div>
          <p className="hidden text-right text-sm text-slate-400 md:block">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      <PageHeader title="Executive Dashboard" subtitle="Monitor patient flow, appointments, and revenue performance" icon={Activity} />

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <article key={kpi.label} className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:scale-[1.02]">
              <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${kpi.gradient} opacity-10`} />
              <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${kpi.gradient} shadow-lg`}>
                <Icon size={20} className="text-white" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-500">{kpi.label}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{loading ? '...' : kpi.value}</p>
              <div className={`mt-2 h-1 w-12 rounded-full bg-gradient-to-r ${kpi.gradient}`} />
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-heading text-lg font-semibold text-slate-900">Appointments Trend</h3>
              <p className="text-sm text-slate-500">Last 7 days performance</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600">
              <TrendingUp size={14} />
              <span>+{appointments.length} this week</span>
            </div>
          </div>
          <div className="mt-4 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="count" stroke="#2563EB" fill="url(#colorCount)" strokeWidth={3} dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="font-heading text-lg font-semibold text-slate-900">Status Distribution</h3>
            <p className="text-sm text-slate-500">Appointment breakdown</p>
          </div>
          <div className="mt-4 h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={apptStatus.length ? apptStatus : [{ name: 'none', value: 1, fill: '#cbd5e1' }]} dataKey="value" nameKey="name" outerRadius={85} innerRadius={50} paddingAngle={3}>
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {apptStatus.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-xs capitalize text-slate-600">{item.name}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-heading text-lg font-semibold text-slate-900">Today's Schedule</h3>
            <p className="text-sm text-slate-500">{todaysAppointments.length} appointments</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600">
            <Clock size={14} />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        {todaysAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 py-12">
            <CalendarCheck size={48} className="text-slate-300" />
            <p className="mt-4 font-medium text-slate-500">No appointments scheduled</p>
            <p className="mt-1 text-sm text-slate-400">Create new appointments to see them here</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {todaysAppointments.slice(0, 6).map((row, idx) => (
              <div key={row.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 transition-all hover:border-blue-200 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{row.patient_name}</p>
                    <p className="mt-1 text-sm text-slate-500">{row.doctor_name}</p>
                  </div>
                  <StatusBadge value={row.status} />
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                  <Clock size={14} />
                  <span>{row.appointment_time || 'Not scheduled'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}