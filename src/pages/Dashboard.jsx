import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { Card, Button } from '../components/UIComponents.jsx';
import '../styles/dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    totalDoctors: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    // Simulate API call to fetch stats
    setStats({
      totalPatients: 1254,
      totalAppointments: 89,
      totalDoctors: 24,
      totalRevenue: 45230,
    });
  }, []);

  const roleGreeting = {
    admin: 'Welcome, Administrator',
    doctor: 'Welcome, Doctor',
    reception: 'Welcome, Reception Staff',
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>{roleGreeting[user?.role]}</h1>
          <p>Here&apos;s what&apos;s happening in your hospital today</p>
        </div>
      </div>

      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <div className="stat-label">Total Patients</div>
              <div className="stat-value">{stats.totalPatients}</div>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <div className="stat-label">Today's Appointments</div>
              <div className="stat-value">{stats.totalAppointments}</div>
            </div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon">👨‍⚕️</div>
          <div className="stat-info">
            <div className="stat-label">Active Doctors</div>
            <div className="stat-value">{stats.totalDoctors}</div>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <div className="stat-label">Monthly Revenue</div>
              <div className="stat-value">${stats.totalRevenue.toLocaleString()}</div>
            </div>
          </div>
        </Card>
      </div>

      <div className="dashboard-actions">
        <Card>
          <h2>Quick Actions</h2>
          <div className="action-grid">
            <Button variant="primary">+ New Patient</Button>
            <Button variant="primary">+ New Appointment</Button>
            {user?.role === 'admin' && <Button variant="primary">+ Add Doctor</Button>}
            <Button variant="secondary">View Reports</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
