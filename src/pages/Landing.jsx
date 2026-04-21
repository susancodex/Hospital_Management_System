import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity, Shield, Clock, BarChart2, Users, FileText, CreditCard,
  CalendarDays, ArrowRight, CheckCircle2, Stethoscope, HeartPulse, Award,
} from 'lucide-react';
import '../styles/landing.css';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    { icon: Users, title: 'Patient Management', desc: 'Centralized records, demographics, and history with instant search across the database.' },
    { icon: CalendarDays, title: 'Smart Scheduling', desc: 'Book, reschedule, and track appointments across doctors and departments in one calendar.' },
    { icon: FileText, title: 'Medical Records', desc: 'Secure clinical notes, diagnoses, and treatment plans linked to every patient visit.' },
    { icon: CreditCard, title: 'Billing & Invoices', desc: 'Generate invoices, track unpaid balances, and reconcile revenue with one dashboard.' },
    { icon: Shield, title: 'Role-based Access', desc: 'Admins, doctors, and reception each get a tailored workspace with the right permissions.' },
    { icon: BarChart2, title: 'Real-time Analytics', desc: 'Live KPIs for patients, appointments, and revenue updated as your team works.' },
  ];

  const stats = [
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '2 min', label: 'To onboard a doctor' },
    { value: '500+', label: 'Hospitals trust us' },
    { value: 'HIPAA', label: 'Compliant' },
  ];

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <div className="landing-brand">
            <div className="landing-brand-icon"><Activity size={20} /></div>
            <div>
              <div className="landing-brand-name">MedCare HMS</div>
              <div className="landing-brand-sub">Hospital Management</div>
            </div>
          </div>
          <nav className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#stats">Why us</a>
            <a href="#cta">Get started</a>
          </nav>
          <div className="landing-nav-actions">
            <Link to="/login" className="landing-btn-ghost">Sign in</Link>
            <Link to="/register" className="landing-btn-primary">
              Get started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-container landing-hero-inner">
          <div className="landing-hero-text">
            <span className="landing-pill">
              <CheckCircle2 size={14} /> Built for modern healthcare teams
            </span>
            <h1>
              The complete operating system for your <span className="landing-accent">hospital</span>.
            </h1>
            <p>
              Manage patients, schedule appointments, capture medical records, and run billing —
              all from a single, beautifully designed platform your whole team will love using.
            </p>
            <div className="landing-hero-cta">
              <button className="landing-btn-primary lg" onClick={() => navigate('/register')}>
                Create free account <ArrowRight size={18} />
              </button>
              <button className="landing-btn-ghost lg" onClick={() => navigate('/login')}>
                Sign in
              </button>
            </div>
            <div className="landing-trust">
              <div className="landing-trust-item"><Shield size={16} /> HIPAA-ready</div>
              <div className="landing-trust-item"><Clock size={16} /> 24/7 access</div>
              <div className="landing-trust-item"><Award size={16} /> Enterprise grade</div>
            </div>
          </div>

          <div className="landing-hero-visual">
            <div className="landing-card landing-card-main">
              <div className="lc-header">
                <div className="lc-dot lc-dot-r" /><div className="lc-dot lc-dot-y" /><div className="lc-dot lc-dot-g" />
                <span className="lc-title">MedCare Dashboard</span>
              </div>
              <div className="lc-stats">
                <div className="lc-stat"><div className="lc-stat-icon p"><Users size={18} /></div><div><div className="lc-stat-val">1,284</div><div className="lc-stat-lbl">Patients</div></div></div>
                <div className="lc-stat"><div className="lc-stat-icon b"><Stethoscope size={18} /></div><div><div className="lc-stat-val">42</div><div className="lc-stat-lbl">Doctors</div></div></div>
                <div className="lc-stat"><div className="lc-stat-icon g"><CalendarDays size={18} /></div><div><div className="lc-stat-val">87</div><div className="lc-stat-lbl">Today</div></div></div>
                <div className="lc-stat"><div className="lc-stat-icon o"><CreditCard size={18} /></div><div><div className="lc-stat-val">$94K</div><div className="lc-stat-lbl">Revenue</div></div></div>
              </div>
              <div className="lc-chart">
                {[40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100].map((h, i) => (
                  <div key={i} className="lc-bar" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="landing-floating-card landing-fc-1">
              <HeartPulse size={18} className="lc-mini-icon" />
              <div>
                <div className="lc-mini-title">Patient admitted</div>
                <div className="lc-mini-sub">Room 204 • 2m ago</div>
              </div>
            </div>
            <div className="landing-floating-card landing-fc-2">
              <CheckCircle2 size={18} className="lc-mini-icon green" />
              <div>
                <div className="lc-mini-title">Invoice paid</div>
                <div className="lc-mini-sub">$2,450 • 5m ago</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="stats" className="landing-stats">
        <div className="landing-container landing-stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="landing-stat-block">
              <div className="landing-stat-value">{s.value}</div>
              <div className="landing-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="landing-features">
        <div className="landing-container">
          <div className="landing-section-head">
            <span className="landing-pill">Everything in one place</span>
            <h2>One platform. Every workflow your hospital runs on.</h2>
            <p>
              Stop juggling spreadsheets, clipboards, and disconnected tools. MedCare brings every
              part of your operation into a single, unified workspace.
            </p>
          </div>
          <div className="landing-features-grid">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="landing-feature">
                  <div className="landing-feature-icon"><Icon size={22} /></div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="cta" className="landing-cta">
        <div className="landing-container">
          <div className="landing-cta-card">
            <h2>Ready to modernize your hospital?</h2>
            <p>Set up your team in minutes. No credit card required.</p>
            <div className="landing-cta-actions">
              <button className="landing-btn-primary lg" onClick={() => navigate('/register')}>
                Create your account <ArrowRight size={18} />
              </button>
              <button className="landing-btn-ghost lg light" onClick={() => navigate('/login')}>
                Sign in instead
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div className="landing-brand">
            <div className="landing-brand-icon"><Activity size={18} /></div>
            <div>
              <div className="landing-brand-name">MedCare HMS</div>
              <div className="landing-brand-sub">© {new Date().getFullYear()} All rights reserved</div>
            </div>
          </div>
          <div className="landing-footer-links">
            <Link to="/login">Sign in</Link>
            <Link to="/register">Sign up</Link>
            <Link to="/forgot-password">Forgot password</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
