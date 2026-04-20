import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import '../styles/navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <div className="navbar-logo">
            <span className="logo-icon">🏥</span>
            <span className="logo-text">HMS</span>
          </div>
        </div>

        <div className="navbar-right">
          <div className="user-menu">
            <button
              className="user-button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="user-avatar">{user?.username?.charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <div className="user-name">{user?.username}</div>
                <div className="user-role">{user?.role}</div>
              </div>
            </button>

            {dropdownOpen && (
              <div className="dropdown-menu">
                <button className="dropdown-item" onClick={() => navigate('/profile')}>
                  Profile
                </button>
                <button className="dropdown-item" onClick={() => navigate('/settings')}>
                  Settings
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
