import { Activity, CalendarCheck2, ChartBar, ShieldCheck, Stethoscope, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';

const features = [
  { title: 'Patient Lifecycle', description: 'Unified records, visits, and treatment context in one secure workspace.', icon: Users },
  { title: 'Doctor Operations', description: 'Manage schedules, specializations, and availability with realtime visibility.', icon: Stethoscope },
  { title: 'Smart Appointments', description: 'Coordinate bookings with status automation and daily workload balancing.', icon: CalendarCheck2 },
  { title: 'Revenue Intelligence', description: 'Billing insights with paid/unpaid pipelines and service-level tracking.', icon: ChartBar },
  { title: 'Compliance-Ready', description: 'Role-aware access and secure token-based authentication built-in.', icon: ShieldCheck },
  { title: 'Operational Pulse', description: 'KPI dashboard for bedrock decisions in high-volume care operations.', icon: Activity },
];

export default function Landing() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div className="min-h-screen bg-transparent">
      <header className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-6 md:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-700/30">
            <Activity size={20} />
          </div>
          <div>
            <p className="font-heading text-lg font-semibold text-slate-900">AetherCare HMS</p>
            <p className="text-xs text-slate-500">Enterprise hospital platform</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/login" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">Sign in</Link>
          <Link to={isAuthenticated ? '/dashboard' : '/register'} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-blue-700/30 transition hover:bg-blue-700">
            {isAuthenticated ? 'Open Dashboard' : 'Start Free'}
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-20 pt-8 md:grid-cols-2 md:px-6 lg:px-8">
        <div className="animate-rise">
          <p className="mb-3 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Healthcare SaaS Platform</p>
          <h1 className="font-heading text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">Smart Hospital Management System</h1>
          <p className="mt-4 max-w-xl text-base text-slate-600">
            A modern platform to streamline hospital operations, improve patient care, and enhance efficiency.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={isAuthenticated ? '/dashboard' : '/login'} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-700/30 transition hover:translate-y-[-1px] hover:bg-blue-700">
              Launch Workspace
            </Link>
            <Link to="/register" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              Create Account
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-heading text-lg font-semibold text-slate-900">Live Operations Snapshot</p>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">System healthy</span>
          </div>
          <div className="space-y-3">
            {[
              ['Today appointments', '48'],
              ['Active doctors', '31'],
              ['In-patient occupancy', '72%'],
              ['Collections this week', '$24,560'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">{label}</span>
                <span className="font-semibold text-slate-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pb-16 md:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <Icon size={18} />
                </div>
                <h3 className="font-heading text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 pb-20 md:px-6 lg:px-8">
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 md:grid-cols-4">
          {[
            ['99.95%', 'Platform uptime'],
            ['180+', 'Daily care workflows'],
            ['12k+', 'Patient records managed'],
            ['4.8/5', 'Staff satisfaction'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-4 text-center">
              <p className="font-heading text-2xl font-semibold text-slate-900">{value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white/80">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-5 text-sm text-slate-500 md:px-6 lg:px-8">
          <span>Built for modern care teams</span>
          <span className="font-medium text-slate-700">Created by Susan Acharya</span>
        </div>
      </footer>
    </div>
  );
}
