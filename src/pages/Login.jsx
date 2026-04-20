import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { Activity, Lock, User, AlertCircle, ArrowRight, Shield, Clock, BarChart2 } from 'lucide-react';
import '../styles/login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      addToast('Welcome back!', 'success');
      navigate('/dashboard');
    } else {
      setError(result.error || 'Invalid username or password');
    }

    setLoading(false);
  };

  const demoCredentials = [
    { role: 'Admin', user: 'admin', pass: 'admin' },
    { role: 'Doctor', user: 'doctor1', pass: 'doctor123' },
    { role: 'Reception', user: 'reception1', pass: 'reception123' },
  ];

  const features = [
    { icon: Shield, label: 'Secure & HIPAA compliant patient records' },
    { icon: BarChart2, label: 'Real-time analytics and reporting' },
    { icon: Clock, label: '24/7 appointment management' },
  ];

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-branding">
          <div className="login-logo">
            <div className="login-logo-icon">
              <Activity size={26} color="white" />
            </div>
            <div>
              <div className="login-logo-name">MedCare HMS</div>
              <div className="login-logo-tag">Hospital Management</div>
            </div>
          </div>

          <h1 className="login-headline">
            Modern healthcare<br />
            <span>management platform</span>
          </h1>

          <p className="login-desc">
            A complete hospital management solution trusted by healthcare professionals. Manage patients, doctors, appointments, and billing in one unified platform.
          </p>

          <div className="login-features">
            {features.map(({ icon: Icon, label }, i) => (
              <div key={i} className="login-feature">
                <div className="login-feature-icon"><Icon size={16} /></div>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-container">
          <div className="login-form-header">
            <h2>Sign in to your account</h2>
            <p>Enter your credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <div className="login-field">
              <label htmlFor="username">Username</label>
              <div className="login-input-wrap">
                <span className="login-input-icon"><User size={15} /></span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  disabled={loading}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>
              <div className="login-input-wrap">
                <span className="login-input-icon"><Lock size={15} /></span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="login-submit">
              {loading ? (
                <>Signing in...</>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="login-demo">
            <div className="login-demo-title">Demo Credentials</div>
            <ul className="login-demo-list">
              {demoCredentials.map(({ role, user, pass }) => (
                <li key={role} className="login-demo-item">
                  <span className="login-demo-badge">{role}</span>
                  <span className="demo-creds">{user} / {pass}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
