import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Search, Bell, Settings, LogOut, User, ChevronDown } from 'lucide-react';
import '../styles/navbar.css';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/doctors': 'Doctors',
  '/patients': 'Patients',
  '/appointments': 'Appointments',
  '/medical-records': 'Medical Records',
  '/billing': 'Billing',
  '/settings': 'Settings',
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const pageTitle = pageTitles[location.pathname] || 'Hospital Management';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel = {
    admin: 'Administrator',
    doctor: 'Doctor',
    reception: 'Receptionist',
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-left">
          <span className="navbar-page-title">{pageTitle}</span>
        </div>

        <div className="navbar-search">
          <Search size={15} className="navbar-search-icon" />
          <input placeholder="Search patients, doctors..." />
        </div>

        <div className="navbar-right">
          <button className="navbar-icon-btn" title="Notifications">
            <Bell size={18} />
            <span className="notif-badge" />
          </button>

          <button className="navbar-icon-btn" title="Settings" onClick={() => navigate('/settings')}>
            <Settings size={18} />
          </button>

          <div className="navbar-divider" />

          <div className="user-menu" ref={dropdownRef}>
            <button
              className="user-button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="user-avatar">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <div className="user-name">{user?.username}</div>
                <div className="user-role">{roleLabel[user?.role] || user?.role}</div>
              </div>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)', marginLeft: 2 }} />
            </button>

            {dropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-user-section">
                  <div className="dropdown-user-name">{user?.username}</div>
                  <div className="dropdown-user-role">{roleLabel[user?.role] || user?.role}</div>
                </div>

                <button className="dropdown-item" onClick={() => { setDropdownOpen(false); }}>
                  <User size={15} /> Profile
                </button>
                <button className="dropdown-item" onClick={() => { setDropdownOpen(false); navigate('/settings'); }}>
                  <Settings size={15} /> Settings
                </button>
                <div className="dropdown-divider" />
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
