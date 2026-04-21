import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import { Activity, User, Mail, Lock, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import '../styles/login.css';

export default function Register() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', username: '', email: '', password: '', password2: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();
  const { addToast } = useToast();

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.password2) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    const result = await register(form);
    setLoading(false);
    if (result.success) {
      addToast('Account created! Welcome aboard.', 'success');
      navigate('/dashboard');
    } else {
      setError(result.error);
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
            Join the <span className="login-headline-accent">healthcare revolution</span>
          </h1>
          <p className="login-subtext">
            Create your account in seconds and start managing patients, doctors, appointments,
            and billing on one unified platform.
          </p>
          <Link to="/" className="login-back-link">
            <ArrowLeft size={16} /> Back to home
          </Link>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-wrap">
          <h2 className="login-form-title">Create your account</h2>
          <p className="login-form-sub">Get started with MedCare in just a few clicks</p>

          {error && (
            <div className="login-error">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-form-row">
              <div className="login-field">
                <label>First name</label>
                <div className="login-input-wrap">
                  <User size={15} className="login-input-icon" />
                  <input value={form.first_name} onChange={update('first_name')} placeholder="Jane" required />
                </div>
              </div>
              <div className="login-field">
                <label>Last name</label>
                <div className="login-input-wrap">
                  <User size={15} className="login-input-icon" />
                  <input value={form.last_name} onChange={update('last_name')} placeholder="Doe" required />
                </div>
              </div>
            </div>

            <div className="login-field">
              <label>Username</label>
              <div className="login-input-wrap">
                <User size={15} className="login-input-icon" />
                <input value={form.username} onChange={update('username')} placeholder="janedoe" required />
              </div>
            </div>

            <div className="login-field">
              <label>Email</label>
              <div className="login-input-wrap">
                <Mail size={15} className="login-input-icon" />
                <input type="email" value={form.email} onChange={update('email')} placeholder="jane@hospital.com" required />
              </div>
            </div>

            <div className="login-field">
              <label>Password</label>
              <div className="login-input-wrap">
                <Lock size={15} className="login-input-icon" />
                <input type="password" value={form.password} onChange={update('password')} placeholder="At least 8 characters" required />
              </div>
            </div>

            <div className="login-field">
              <label>Confirm password</label>
              <div className="login-input-wrap">
                <Lock size={15} className="login-input-icon" />
                <input type="password" value={form.password2} onChange={update('password2')} placeholder="Re-enter password" required />
              </div>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? 'Creating account...' : <>Create account <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="login-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
