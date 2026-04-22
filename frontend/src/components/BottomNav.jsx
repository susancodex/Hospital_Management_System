import { CalendarDays, CreditCard, FileText, LayoutDashboard, MoreHorizontal, Stethoscope, UserCircle2, Users, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth.js';
import { hasPermission } from '../lib/permissions.js';
import { useTheme } from '../context/ThemeContext.jsx';

const allItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { label: 'Doctors', path: '/doctors', icon: Stethoscope, permission: 'doctors.view' },
  { label: 'Patients', path: '/patients', icon: Users, permission: 'patients.view' },
  { label: 'Appointments', path: '/appointments', icon: CalendarDays, permission: 'appointments.view' },
  { label: 'Records', path: '/medical-records', icon: FileText, permission: 'medicalRecords.view' },
  { label: 'Reports', path: '/medical-reports', icon: FileText, permission: 'medicalReports.view' },
  { label: 'Billing', path: '/billing', icon: CreditCard, permission: 'billing.view' },
  { label: 'Profile', path: '/profile', icon: UserCircle2, permission: 'profile.view' },
];

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);

  const allowed = allItems.filter((i) => hasPermission(user?.role, i.permission));
  const primary = allowed.slice(0, 4);
  const overflow = allowed.slice(4);

  const isActive = (path) => location.pathname === path;
  const moreActive = overflow.some((i) => isActive(i.path));

  return (
    <>
      <nav
        className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t backdrop-blur-xl transition-colors ${
          isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-1.5">
          {primary.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-indicator"
                    className="absolute inset-0 rounded-xl bg-blue-600/10 dark:bg-blue-500/15"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <Icon
                  size={20}
                  className={`relative z-10 transition-colors ${
                    active ? 'text-blue-600 dark:text-blue-400' : isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                />
                <span
                  className={`relative z-10 truncate transition-colors ${
                    active ? 'text-blue-600 dark:text-blue-400' : isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {overflow.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="relative flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium"
            >
              <MoreHorizontal
                size={20}
                className={`transition-colors ${
                  moreActive ? 'text-blue-600 dark:text-blue-400' : isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              />
              <span className={moreActive ? 'text-blue-600 dark:text-blue-400' : isDark ? 'text-slate-400' : 'text-slate-600'}>
                More
              </span>
            </button>
          )}
        </div>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden bg-black/40 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className={`absolute bottom-0 left-0 right-0 rounded-t-3xl p-5 pb-8 ${
                isDark ? 'bg-slate-900' : 'bg-white'
              }`}
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)' }}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
              <div className="mb-3 flex items-center justify-between">
                <h3 className={`font-heading text-base font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  More options
                </h3>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className={`grid h-8 w-8 place-items-center rounded-lg ${
                    isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {overflow.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMoreOpen(false)}
                      className={`flex flex-col items-center justify-center gap-2 rounded-2xl px-2 py-4 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-700/30'
                          : isDark
                          ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Icon size={22} />
                      <span className="text-center leading-tight">{item.label}</span>
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
