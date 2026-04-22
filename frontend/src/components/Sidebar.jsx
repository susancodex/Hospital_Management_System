import { Activity, CalendarDays, CreditCard, FileText, LayoutDashboard, Stethoscope, UserCircle2, Users, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { hasPermission } from '../lib/permissions.js';
import { useUIStore } from '../store/uiStore.js';

const menuConfig = {
  admin: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
    { label: 'Doctors', path: '/doctors', icon: Stethoscope, permission: 'doctors.view' },
    { label: 'Patients', path: '/patients', icon: Users, permission: 'patients.view' },
    { label: 'Appointments', path: '/appointments', icon: CalendarDays, permission: 'appointments.view' },
    { label: 'Medical Records', path: '/medical-records', icon: FileText, permission: 'medicalRecords.view' },
    { label: 'Billing', path: '/billing', icon: CreditCard, permission: 'billing.view' },
    { label: 'Profile', path: '/profile', icon: UserCircle2, permission: 'profile.view' },
  ],
  doctor: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
    { label: 'Doctors', path: '/doctors', icon: Stethoscope, permission: 'doctors.view' },
    { label: 'My Appointments', path: '/appointments', icon: CalendarDays, permission: 'appointments.view' },
    { label: 'Patients', path: '/patients', icon: Users, permission: 'patients.view' },
    { label: 'Medical Records', path: '/medical-records', icon: FileText, permission: 'medicalRecords.view' },
    { label: 'Billing', path: '/billing', icon: CreditCard, permission: 'billing.view' },
    { label: 'Profile', path: '/profile', icon: UserCircle2, permission: 'profile.view' },
  ],
  reception: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
    { label: 'Doctors', path: '/doctors', icon: Stethoscope, permission: 'doctors.view' },
    { label: 'Appointments', path: '/appointments', icon: CalendarDays, permission: 'appointments.view' },
    { label: 'Patients', path: '/patients', icon: Users, permission: 'patients.view' },
    { label: 'Profile', path: '/profile', icon: UserCircle2, permission: 'profile.view' },
  ],
};

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, closeMobileSidebar } = useUIStore();

  const items = (menuConfig[user?.role] || menuConfig.admin).filter((item) => hasPermission(user?.role, item.permission));
  const baseClass = sidebarCollapsed ? 'w-[86px]' : 'w-[272px]';

  const content = (
    <>
      <div className="mb-6 flex items-center gap-3 px-4 pt-5">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-700/30">
          <Activity size={20} />
        </div>
        {!sidebarCollapsed && (
          <div>
            <p className="font-heading text-base font-semibold text-white">AetherCare</p>
            <p className="text-xs text-slate-400">Hospital OS</p>
          </div>
        )}
      </div>

      <div className="px-3">
        {!sidebarCollapsed && <p className="mb-3 px-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">Navigation</p>}
        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobileSidebar}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-700/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon size={18} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 transition hover:border-slate-500"
        >
          {sidebarCollapsed ? 'Expand' : 'Collapse sidebar'}
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className={`sticky top-[88px] hidden h-[calc(100vh-104px)] shrink-0 rounded-3xl bg-[#0f172a] shadow-xl lg:flex lg:flex-col ${baseClass}`}>
        {content}
      </aside>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 p-4 lg:hidden">
          <aside className="flex h-full w-[86%] max-w-[320px] flex-col rounded-3xl bg-[#0f172a]">
            <div className="flex justify-end p-3">
              <button type="button" onClick={closeMobileSidebar} className="rounded-lg p-2 text-slate-200 hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
