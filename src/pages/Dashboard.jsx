import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Users, UserRound, CalendarDays, DollarSign, TrendingUp, Plus, ArrowUpRight } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import '../styles/dashboard.css';

const patientData = [
  { month: 'Jan', patients: 620, appointments: 410 },
  { month: 'Feb', patients: 740, appointments: 520 },
  { month: 'Mar', patients: 680, appointments: 480 },
  { month: 'Apr', patients: 890, appointments: 610 },
  { month: 'May', patients: 1020, appointments: 720 },
  { month: 'Jun', patients: 960, appointments: 690 },
  { month: 'Jul', patients: 1100, appointments: 800 },
  { month: 'Aug', patients: 1050, appointments: 750 },
  { month: 'Sep', patients: 1180, appointments: 860 },
  { month: 'Oct', patients: 1254, appointments: 910 },
];

const revenueData = [
  { month: 'Jan', revenue: 28000 },
  { month: 'Feb', revenue: 34000 },
  { month: 'Mar', revenue: 30000 },
  { month: 'Apr', revenue: 41000 },
  { month: 'May', revenue: 45000 },
  { month: 'Jun', revenue: 38000 },
  { month: 'Jul', revenue: 52000 },
  { month: 'Aug', revenue: 48000 },
  { month: 'Sep', revenue: 56000 },
  { month: 'Oct', revenue: 45230 },
];

const appointmentStatus = [
  { name: 'Completed', value: 58, color: '#22C55E' },
  { name: 'Scheduled', value: 27, color: '#2563EB' },
  { name: 'Pending', value: 10, color: '#f59e0b' },
  { name: 'Cancelled', value: 5, color: '#ef4444' },
];

const recentAppointments = [
  { name: 'Sarah Johnson', doctor: 'Dr. Williams', time: '09:00 AM', type: 'Cardiology', color: '#2563EB' },
  { name: 'Mark Thompson', doctor: 'Dr. Chen', time: '10:30 AM', type: 'Neurology', color: '#8b5cf6' },
  { name: 'Emily Davis', doctor: 'Dr. Patel', time: '11:15 AM', type: 'Pediatrics', color: '#22C55E' },
  { name: 'Robert Wilson', doctor: 'Dr. Kim', time: '02:00 PM', type: 'Orthopedics', color: '#f97316' },
  { name: 'Lisa Martinez', doctor: 'Dr. Brown', time: '03:30 PM', type: 'Dermatology', color: '#ec4899' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ fontSize: 13, fontWeight: 600, color: p.color }}>
            {p.name}: {p.name === 'revenue' ? `$${p.value.toLocaleString()}` : p.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats] = useState({
    totalPatients: 1254,
    totalAppointments: 89,
    totalDoctors: 24,
    totalRevenue: 45230,
  });

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const roleGreeting = {
    admin: `Good ${getTimeOfDay()}, Admin`,
    doctor: `Good ${getTimeOfDay()}, Doctor`,
    reception: `Good ${getTimeOfDay()}`,
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="dashboard-header-text">
          <h1>{roleGreeting[user?.role] || `Good ${getTimeOfDay()}`}</h1>
          <p>Here's what's happening in your hospital today</p>
        </div>
        <span className="dashboard-header-date">{today}</span>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card blue">
          <div className="kpi-icon blue"><Users size={22} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Total Patients</div>
            <div className="kpi-value">{stats.totalPatients.toLocaleString()}</div>
            <div className="kpi-trend up"><TrendingUp size={13} /> +8.2% this month</div>
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-icon green"><CalendarDays size={22} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Appointments Today</div>
            <div className="kpi-value">{stats.totalAppointments}</div>
            <div className="kpi-trend up"><TrendingUp size={13} /> +12% vs yesterday</div>
          </div>
        </div>

        <div className="kpi-card orange">
          <div className="kpi-icon orange"><UserRound size={22} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Active Doctors</div>
            <div className="kpi-value">{stats.totalDoctors}</div>
            <div className="kpi-trend neutral">Across 8 departments</div>
          </div>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-icon purple"><DollarSign size={22} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Monthly Revenue</div>
            <div className="kpi-value">${stats.totalRevenue.toLocaleString()}</div>
            <div className="kpi-trend up"><TrendingUp size={13} /> +5.4% this month</div>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">Patient & Appointment Trends</div>
              <div className="chart-subtitle">Monthly overview for the current year</div>
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#2563EB' }} />
                Patients
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#22C55E' }} />
                Appointments
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={patientData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
              <div className="chart-subtitle">Distribution this month</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={appointmentStatus} cx="50%" cy="45%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                {appointmentStatus.map((entry, index) => (
                  <Cell key={index} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip formatter={(val) => [`${val}%`, '']} />
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
              <div className="chart-subtitle">{recentAppointments.length} scheduled</div>
            </div>
            <button
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => navigate('/appointments')}
            >
              View all <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="recent-list">
            {recentAppointments.map((appt, i) => (
              <div key={i} className="recent-item">
                <div className="recent-avatar" style={{ background: appt.color + '18', color: appt.color }}>
                  {appt.name.charAt(0)}
                </div>
                <div className="recent-info">
                  <div className="recent-name">{appt.name}</div>
                  <div className="recent-meta">{appt.doctor} · {appt.type}</div>
                </div>
                <div className="recent-time">{appt.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
