import { CalendarDays, CreditCard, FileText, LayoutDashboard, MoreHorizontal, Stethoscope, UserCircle2, Users, X, Activity, BrainCircuit } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth.js';
import { hasPermission } from '../lib/permissions.js';

const allItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { label: 'Patients', path: '/patients', icon: Users, permission: 'patients.view' },
  { label: 'Doctors', path: '/doctors', icon: Stethoscope, permission: 'doctors.view' },
  { label: 'Schedule', path: '/appointments', icon: CalendarDays, permission: 'appointments.view' },
  { label: 'Records', path: '/medical-records', icon: FileText, permission: 'medicalRecords.view' },
  { label: 'Reports', path: '/medical-reports', icon: Activity, permission: 'medicalReports.view' },
  { label: 'AI', path: '/ai-triage', icon: BrainCircuit, permission: 'aiInsights.view' },
  { label: 'Billing', path: '/billing', icon: CreditCard, permission: 'billing.view' },
  { label: 'Profile', path: '/profile', icon: UserCircle2, permission: 'profile.view' },
];

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const allowed = allItems.filter((i) => hasPermission(user?.role, i.permission));
  const primary = allowed.slice(0, 4);
  const overflow = allowed.slice(4);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const moreActive = overflow.some((i) => isActive(i.path));

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md safe-pb"
      >
        <div className="mx-auto max-w-lg px-2 pt-1.5 pb-1">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${overflow.length > 0 ? 5 : Math.max(primary.length, 1)}, minmax(0, 1fr))` }}
          >
          {primary.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium"
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-pill"
                    className="absolute inset-0 rounded-xl bg-teal-50 dark:bg-teal-950/50"
                    transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                  />
                )}
                <Icon
                  size={18}
                  className={`relative z-10 ${active ? 'text-teal-700 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400'}`}
                />
                <span className={`relative z-10 ${active ? 'text-teal-700 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {overflow.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="relative flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium"
            >
              {moreActive && <span className="absolute inset-0 rounded-xl bg-teal-50 dark:bg-teal-950/50" />}
              <MoreHorizontal size={18} className={`relative z-10 ${moreActive ? 'text-teal-700 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400'}`} />
              <span className={moreActive ? 'text-teal-700 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400'}>More</span>
            </button>
          )}
          </div>
        </div>
      </nav>

      <nav className="hidden lg:block fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 xl:px-8 py-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            {allowed.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-5 pt-4 pb-8 safe-pb"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">More</h3>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {overflow.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMoreOpen(false)}
                      className={`flex flex-col items-center justify-center gap-2 rounded-xl px-2 py-4 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300'
                          : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
