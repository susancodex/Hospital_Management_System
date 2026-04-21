import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import {
  LayoutDashboard, UserRound, Users, CalendarDays,
  FileText, CreditCard, ChevronLeft, ChevronRight, Activity, User as UserIcon
} from 'lucide-react';
import '../styles/sidebar.css';

const menuConfig = {
  admin: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Doctors', path: '/doctors', icon: UserRound },
    { label: 'Patients', path: '/patients', icon: Users },
    { label: 'Appointments', path: '/appointments', icon: CalendarDays },
    { label: 'Medical Records', path: '/medical-records', icon: FileText },
    { label: 'Billing', path: '/billing', icon: CreditCard },
    { label: 'Profile', path: '/profile', icon: UserIcon },
  ],
  doctor: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Appointments', path: '/appointments', icon: CalendarDays },
    { label: 'Patients', path: '/patients', icon: Users },
    { label: 'Medical Records', path: '/medical-records', icon: FileText },
    { label: 'Profile', path: '/profile', icon: UserIcon },
  ],
  reception: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Appointments', path: '/appointments', icon: CalendarDays },
    { label: 'Patients', path: '/patients', icon: Users },
    { label: 'Billing', path: '/billing', icon: CreditCard },
    { label: 'Profile', path: '/profile', icon: UserIcon },
  ],
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const items = menuConfig[user?.role] || menuConfig.admin;
  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Activity size={20} />
        </div>
        {!collapsed && (
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">MedCare HMS</div>
            <div className="sidebar-brand-sub">Hospital System</div>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {!collapsed && <div className="nav-section-label">Main Menu</div>}
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              className={`menu-item${isActive(item.path) ? ' active' : ''}`}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
            >
              <span className="menu-icon">
                <Icon size={18} strokeWidth={2} />
              </span>
              {!collapsed && <span className="menu-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="menu-icon">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </span>
          {!collapsed && <span className="menu-label">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
