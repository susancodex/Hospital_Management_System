import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import '../styles/sidebar.css';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = {
    admin: [
      { label: 'Dashboard', path: '/dashboard', icon: '📊' },
      { label: 'Doctors', path: '/doctors', icon: '👨‍⚕️' },
      { label: 'Patients', path: '/patients', icon: '👥' },
      { label: 'Appointments', path: '/appointments', icon: '📅' },
      { label: 'Medical Records', path: '/medical-records', icon: '📋' },
      { label: 'Billing', path: '/billing', icon: '💰' },
    ],
    doctor: [
      { label: 'Dashboard', path: '/dashboard', icon: '📊' },
      { label: 'My Appointments', path: '/appointments', icon: '📅' },
      { label: 'Patients', path: '/patients', icon: '👥' },
      { label: 'Medical Records', path: '/medical-records', icon: '📋' },
    ],
    reception: [
      { label: 'Dashboard', path: '/dashboard', icon: '📊' },
      { label: 'Appointments', path: '/appointments', icon: '📅' },
      { label: 'Patients', path: '/patients', icon: '👥' },
      { label: 'Billing', path: '/billing', icon: '💰' },
    ],
  };

  const items = menuItems[user?.role] || [];
  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button
          className="toggle-button"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-menu">
        {items.map((item) => (
          <button
            key={item.path}
            className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            title={collapsed ? item.label : ''}
          >
            <span className="menu-icon">{item.icon}</span>
            {!collapsed && <span className="menu-label">{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
