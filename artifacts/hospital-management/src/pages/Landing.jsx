import { Activity, CalendarCheck2, ChartBar, ShieldCheck, Stethoscope, Users, ArrowRight } from 'lucide-react';
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
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-teal-700 text-white">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              AetherCare
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Sign in
            </Link>
            <Link 
              to={isAuthenticated ? '/dashboard' : '/register'} 
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-50"
            >
              {isAuthenticated ? 'Open Dashboard' : 'Get started'}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-24 lg:pt-32 lg:pb-32 overflow-hidden">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8 text-center">
            <h1 className="mx-auto max-w-4xl text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl lg:text-6xl">
              A modern operating system <br className="hidden sm:block" />
              for modern hospitals.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Manage patients, doctors, appointments, and billing from one unified, secure platform. Built for clarity, speed, and reliability.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to={isAuthenticated ? '/dashboard' : '/register'} 
                className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-teal-700 px-8 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-800"
              >
                {isAuthenticated ? 'Open Workspace' : 'Start your free trial'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link 
                to="/login" 
                className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-8 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Sign in to your account
              </Link>
            </div>

            {/* Product Mockup */}
            <div className="mt-20 mx-auto max-w-5xl rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden hidden sm:block relative">
              <div className="h-12 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                </div>
              </div>
              {/* Abstract grid pattern representing the app */}
              <div className="aspect-[16/9] w-full bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] flex items-center justify-center">
                 <div className="text-center space-y-4 max-w-sm px-6">
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-xl mx-auto flex items-center justify-center">
                       <Activity className="w-8 h-8 text-teal-600" />
                    </div>
                    <div className="space-y-2">
                       <div className="h-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md w-3/4 mx-auto"></div>
                       <div className="h-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md w-full mx-auto"></div>
                       <div className="h-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md w-5/6 mx-auto"></div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trusted By */}
        <section className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-10">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8 text-center">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Trusted by forward-thinking healthcare teams</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
              {['Mayo Cloud', 'Apex Health', 'BlueRidge', 'NorthBay'].map(brand => (
                <div key={brand} className="text-xl font-semibold tracking-tight text-slate-400 dark:text-slate-600 grayscale opacity-60">
                  {brand}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-slate-50 dark:bg-slate-950">
          <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Everything you need to run your hospital
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                AetherCare provides a complete suite of tools to manage every aspect of patient care and administrative workflow.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all hover:shadow-md">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300">
                      <Icon size={20} />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{feature.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-teal-900"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:40px_40px] opacity-10"></div>
          <div className="relative mx-auto max-w-3xl px-6 lg:px-8 text-center text-white">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">Ready to modernize your operations?</h2>
            <p className="mt-4 text-lg text-teal-100 max-w-xl mx-auto">
              Join hundreds of hospitals already using AetherCare to deliver better care, faster.
            </p>
            <div className="mt-10">
              <Link 
                to="/register" 
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-8 text-sm font-semibold text-teal-900 shadow-sm transition-colors hover:bg-slate-100"
              >
                Start your free trial today
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-10">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal-700 dark:text-teal-500" />
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">AetherCare</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-right">
            AetherCare HMS &copy; {new Date().getFullYear()} &middot; Secure & HIPAA-aware &middot; System status: <span className="text-emerald-600 dark:text-emerald-500 font-medium">All systems operational</span>
            <span className="block mt-1">Created by Susan Acharya</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
