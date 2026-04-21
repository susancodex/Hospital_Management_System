import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/services.js';
import { useToast } from '../hooks/useToast.js';
import { Activity, User, Mail, Lock, AlertCircle, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import '../styles/login.css';

export default function ForgotPassword() {
  const [form, setForm] = useState({ username: '', email: '', new_password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.new_password !== form.confirm) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPassword({
        username: form.username,
        email: form.email,
        new_password: form.new_password,
      });
      addToast('Password reset! You can now sign in with your new password.', 'success');
      navigate('/login');
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.detail || (data && Object.values(data).flat().join(' ')) || 'Reset failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-branding">
          <div className="login-logo">
            <div className="login-logo-icon"><Activity size={24} /></div>
            <div>
              <div className="login-logo-name">MedCare HMS</div>
              <div className="login-logo-sub">Hospital Management</div>
            </div>
          </div>
          <h1 className="login-headline">
            Reset your <span className="login-headline-accent">password</span>
          </h1>
          <p className="login-subtext">
            Verify your username and email to set a new password and regain access to your dashboard.
          </p>
          <div className="login-features">
            <div className="login-feature">
              <span className="login-feature-icon"><ShieldCheck size={16} /></span>
              <span>Secure account recovery</span>
            </div>
          </div>
          <Link to="/login" className="login-back-link">
            <ArrowLeft size={16} /> Back to sign in
          </Link>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-wrap">
          <h2 className="login-form-title">Forgot password</h2>
          <p className="login-form-sub">Enter your details to set a new password</p>

          {error && (
            <div className="login-error">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label>Username</label>
              <div className="login-input-wrap">
                <User size={15} className="login-input-icon" />
                <input value={form.username} onChange={update('username')} placeholder="Your username" required />
              </div>
            </div>

            <div className="login-field">
              <label>Email</label>
              <div className="login-input-wrap">
                <Mail size={15} className="login-input-icon" />
                <input type="email" value={form.email} onChange={update('email')} placeholder="Email on file" required />
              </div>
            </div>

            <div className="login-field">
              <label>New password</label>
              <div className="login-input-wrap">
                <Lock size={15} className="login-input-icon" />
                <input type="password" value={form.new_password} onChange={update('new_password')} placeholder="At least 8 characters" required />
              </div>
            </div>

            <div className="login-field">
              <label>Confirm new password</label>
              <div className="login-input-wrap">
                <Lock size={15} className="login-input-icon" />
                <input type="password" value={form.confirm} onChange={update('confirm')} placeholder="Re-enter password" required />
              </div>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? 'Resetting...' : <>Reset password <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="login-switch">
            Remember it? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
