import { Activity, CalendarDays, CreditCard, FileText, LayoutDashboard, Stethoscope, UserCircle2, Users, X, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { hasPermission } from '../lib/permissions.js';
import { useUIStore } from '../store/uiStore.js';

const menuConfig = {
  admin: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
    { label: 'Patients', path: '/patients', icon: Users, permission: 'patients.view' },
    { label: 'Doctors', path: '/doctors', icon: Stethoscope, permission: 'doctors.view' },
    { label: 'Appointments', path: '/appointments', icon: CalendarDays, permission: 'appointments.view' },
    { label: 'Medical Records', path: '/medical-records', icon: FileText, permission: 'medicalRecords.view' },
    { label: 'Medical Reports', path: '/medical-reports', icon: Activity, permission: 'medicalReports.view' },
    { label: 'Billing', path: '/billing', icon: CreditCard, permission: 'billing.view' },
  ],
  doctor: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
    { label: 'Patients', path: '/patients', icon: Users, permission: 'patients.view' },
    { label: 'Doctors', path: '/doctors', icon: Stethoscope, permission: 'doctors.view' },
    { label: 'My Appointments', path: '/appointments', icon: CalendarDays, permission: 'appointments.view' },
    { label: 'Medical Records', path: '/medical-records', icon: FileText, permission: 'medicalRecords.view' },
    { label: 'Medical Reports', path: '/medical-reports', icon: Activity, permission: 'medicalReports.view' },
    { label: 'Billing', path: '/billing', icon: CreditCard, permission: 'billing.view' },
  ],
  reception: [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
    { label: 'Patients', path: '/patients', icon: Users, permission: 'patients.view' },
    { label: 'Doctors', path: '/doctors', icon: Stethoscope, permission: 'doctors.view' },
    { label: 'Appointments', path: '/appointments', icon: CalendarDays, permission: 'appointments.view' },
    { label: 'Medical Reports', path: '/medical-reports', icon: Activity, permission: 'medicalReports.view' },
    { label: 'Billing', path: '/billing', icon: CreditCard, permission: 'billing.view' },
  ],
};

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, closeMobileSidebar } = useUIStore();

  const items = (menuConfig[user?.role] || menuConfig.admin).filter((item) => hasPermission(user?.role, item.permission));
  const widthClass = sidebarCollapsed ? 'w-[72px]' : 'w-[248px]';

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const content = (
    <>
      <div className="h-16 flex items-center px-5 border-b border-slate-100 dark:border-slate-800">
        <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-teal-700 rounded-md grid place-items-center shrink-0">
            <Activity className="w-4.5 h-4.5 text-white" size={18} />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100 truncate">AetherCare</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5 truncate">Hospital OS</p>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {!sidebarCollapsed && (
          <p className="px-3 pb-2 pt-1 text-[10px] uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Workspace</p>
        )}
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeMobileSidebar}
              title={sidebarCollapsed ? item.label : undefined}
              className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <Icon size={18} className={active ? 'text-teal-700 dark:text-teal-300' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'} />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
        <Link
          to="/profile"
          onClick={closeMobileSidebar}
          title={sidebarCollapsed ? 'Profile' : undefined}
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 ${sidebarCollapsed ? 'justify-center' : ''}`}
        >
          <UserCircle2 size={18} className="text-slate-400 dark:text-slate-500" />
          {!sidebarCollapsed && <span>Profile</span>}
        </Link>
        <button
          type="button"
          onClick={toggleSidebar}
          className={`hidden lg:flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 ${sidebarCollapsed ? 'justify-center' : ''}`}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`sticky top-0 hidden h-screen shrink-0 lg:flex lg:flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-[width] duration-200 ${widthClass}`}>
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={closeMobileSidebar}>
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <aside
            onClick={(e) => e.stopPropagation()}
            className="absolute left-0 top-0 h-full w-[82%] max-w-[300px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col"
          >
            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                onClick={closeMobileSidebar}
                className="inline-flex items-center justify-center h-9 w-9 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close menu"
              >
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
