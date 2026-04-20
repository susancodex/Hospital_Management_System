import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Users, UserRound, CalendarDays, DollarSign, TrendingUp, ArrowUpRight } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { patientsAPI, doctorsAPI, appointmentsAPI, billingAPI } from '../api/services.js';
import '../styles/dashboard.css';

const patientTrend = [
  { month: 'Jan', patients: 62, appointments: 41 },
  { month: 'Feb', patients: 74, appointments: 52 },
  { month: 'Mar', patients: 68, appointments: 48 },
  { month: 'Apr', patients: 89, appointments: 61 },
  { month: 'May', patients: 102, appointments: 72 },
  { month: 'Jun', patients: 96, appointments: 69 },
  { month: 'Jul', patients: 110, appointments: 80 },
  { month: 'Aug', patients: 105, appointments: 75 },
  { month: 'Sep', patients: 118, appointments: 86 },
  { month: 'Oct', patients: 125, appointments: 91 },
];

const revenueData = [
  { month: 'Jan', revenue: 2800 },
  { month: 'Feb', revenue: 3400 },
  { month: 'Mar', revenue: 3000 },
  { month: 'Apr', revenue: 4100 },
  { month: 'May', revenue: 4500 },
  { month: 'Jun', revenue: 3800 },
  { month: 'Jul', revenue: 5200 },
  { month: 'Aug', revenue: 4800 },
  { month: 'Sep', revenue: 5600 },
  { month: 'Oct', revenue: 4523 },
];

const APPT_COLORS = {
  completed: '#22C55E',
  scheduled: '#2563EB',
  pending: '#f59e0b',
  cancelled: '#ef4444',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color }}>
            {p.name}: {p.name === 'revenue' ? `$${p.value.toLocaleString()}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalPatients: 0, totalDoctors: 0, todayAppointments: 0, monthlyRevenue: 0 });
  const [todayAppts, setTodayAppts] = useState([]);
  const [apptStatusData, setApptStatusData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [patientsRes, doctorsRes, apptsRes, billsRes] = await Promise.all([
        patientsAPI.list(),
        doctorsAPI.list(),
        appointmentsAPI.list(),
        billingAPI.list(),
      ]);

      const allAppts = apptsRes.data;
      const today = new Date().toISOString().split('T')[0];
      const todayList = allAppts.filter((a) => a.appointment_date === today);

      const statusCounts = allAppts.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {});
      const statusData = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: APPT_COLORS[name] || '#94a3b8',
      }));

      const monthlyRevenue = billsRes.data
        .filter((b) => b.status === 'paid')
        .reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);

      setStats({
        totalPatients: patientsRes.data.length,
        totalDoctors: doctorsRes.data.length,
        todayAppointments: todayList.length,
        monthlyRevenue,
      });
      setTodayAppts(todayList.slice(0, 5));
      setApptStatusData(statusData);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const greeting = user?.role === 'doctor'
    ? `Good ${getTimeOfDay()}, Dr. ${user.last_name || user.username}`
    : `Good ${getTimeOfDay()}, ${user?.first_name || user?.username || 'there'}`;

  const avatarColors = ['#2563EB', '#8b5cf6', '#22C55E', '#f97316', '#ec4899'];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-text">
          <h1>{greeting}</h1>
          <p>Here's what's happening in your hospital today</p>
        </div>
        <span className="dashboard-header-date">{today}</span>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-icon blue"><Users size={22} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Total Patients</div>
            <div className="kpi-value">{loading ? '—' : stats.totalPatients.toLocaleString()}</div>
            <div className="kpi-trend neutral">Registered patients</div>
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-icon green"><CalendarDays size={22} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Appointments Today</div>
            <div className="kpi-value">{loading ? '—' : stats.todayAppointments}</div>
            <div className="kpi-trend neutral">Scheduled for today</div>
          </div>
        </div>

        <div className="kpi-card orange">
          <div className="kpi-icon orange"><UserRound size={22} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Active Doctors</div>
            <div className="kpi-value">{loading ? '—' : stats.totalDoctors}</div>
            <div className="kpi-trend neutral">Available staff</div>
          </div>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-icon purple"><DollarSign size={22} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Revenue Collected</div>
            <div className="kpi-value">${loading ? '—' : stats.monthlyRevenue.toFixed(0)}</div>
            <div className="kpi-trend up"><TrendingUp size={13} /> Paid invoices</div>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Patient & Appointment Trends</div>
              <div className="chart-subtitle">Monthly overview</div>
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#2563EB' }} />Patients
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#22C55E' }} />Appointments
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={patientTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="patientGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="apptGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="patients" stroke="#2563EB" strokeWidth={2} fill="url(#patientGrad)" dot={false} />
              <Area type="monotone" dataKey="appointments" stroke="#22C55E" strokeWidth={2} fill="url(#apptGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Appointment Status</div>
              <div className="chart-subtitle">All-time distribution</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={apptStatusData.length ? apptStatusData : [{ name: 'No data', value: 1, color: '#e2e8f0' }]}
                cx="50%" cy="45%" innerRadius={55} outerRadius={85}
                dataKey="value" paddingAngle={3}
              >
                {(apptStatusData.length ? apptStatusData : [{ color: '#e2e8f0' }]).map((entry, index) => (
                  <Cell key={index} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip formatter={(val) => [val, 'appointments']} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bottom-row">
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Revenue Overview</div>
              <div className="chart-subtitle">Monthly revenue in USD</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Today's Appointments</div>
              <div className="chart-subtitle">{todayAppts.length} scheduled for today</div>
            </div>
            <button
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => navigate('/appointments')}
            >
              View all <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="recent-list">
            {todayAppts.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                No appointments scheduled for today
              </div>
            ) : (
              todayAppts.map((appt, i) => {
                const initials = (appt.patient_name || 'P').charAt(0);
                const color = avatarColors[i % avatarColors.length];
                return (
                  <div key={appt.id} className="recent-item">
                    <div className="recent-avatar" style={{ background: color + '18', color }}>
                      {initials}
                    </div>
                    <div className="recent-info">
                      <div className="recent-name">{appt.patient_name}</div>
                      <div className="recent-meta">{appt.doctor_name} · {appt.notes || 'General'}</div>
                    </div>
                    <div className="recent-time">{appt.appointment_time || '—'}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
