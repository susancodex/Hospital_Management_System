import { Bell, ChevronDown, LogOut, Menu, Search, User } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { patientsAPI } from '../api/services.js';
import { useAuth } from '../hooks/useAuth.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useUIStore } from '../store/uiStore.js';
import { ThemeToggle } from './ThemeToggle.jsx';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/doctors': 'Doctors',
  '/patients': 'Patients',
  '/appointments': 'Appointments',
  '/medical-records': 'Medical Records',
  '/medical-reports': 'Medical Reports',
  '/billing': 'Billing',
  '/profile': 'Profile',
};

const roleLabels = { admin: 'Administrator', doctor: 'Doctor', patient: 'Patient', reception: 'Receptionist' };

const buildNotifications = (user) => [
  { id: 1, title: 'Profile synced', detail: `Signed in as ${roleLabels[user?.role] || 'User'}.`, unread: true },
  { id: 2, title: 'Theme preferences', detail: 'Your appearance settings now persist across pages.', unread: true },
  { id: 3, title: 'System status', detail: 'Hospital dashboard services are online.', unread: false },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { openMobileSidebar, search, setSearch } = useUIStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => buildNotifications(user));
  const [searchResults, setSearchResults] = useState([]);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const notificationsRef = useRef(null);
  const debounced = useDebounce(search, 300);

  const pageTitle = useMemo(() => pageTitles[location.pathname] || 'AetherCare', [location.pathname]);

  useEffect(() => {
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchResults([]);
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) setNotificationsOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    setNotifications(buildNotifications(user));
  }, [user]);

  useEffect(() => {
    setDropdownOpen(false);
    setNotificationsOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!debounced.trim()) { setSearchResults([]); return; }
      try {
        const r = await patientsAPI.list({ search: debounced });
        if (!cancelled) setSearchResults((r.items || []).slice(0, 5));
      } catch { if (!cancelled) setSearchResults([]); }
    };
    run();
    return () => { cancelled = true; };
  }, [debounced]);

  const handleLogout = () => {
    logout();
    toast.success('Signed out');
    navigate('/login');
  };

  const initials = (user?.username || 'U').slice(0, 2).toUpperCase();
  const unreadCount = notifications.filter((item) => item.unread).length;

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="h-full flex items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu */}
        <button
          onClick={openMobileSidebar}
          className="inline-flex items-center justify-center h-9 w-9 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        {/* Page title (mobile) / Search (desktop) */}
        <h1 className="lg:hidden text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
          {pageTitle}
        </h1>

        <div className="hidden lg:block relative w-96 max-w-md" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && search.trim()) {
                navigate(`/patients?q=${encodeURIComponent(search.trim())}`);
                setSearchResults([]);
              }
            }}
            placeholder="Search patients, MRN, doctors…"
            className="h-9 w-full pl-9 pr-3 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
          />
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-11 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    navigate(`/patients?q=${encodeURIComponent(p.full_name || `${p.first_name} ${p.last_name}`)}`);
                    setSearchResults([]);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="text-slate-700 dark:text-slate-200">{p.full_name || `${p.first_name} ${p.last_name}`}</span>
                  <span className="text-xs text-slate-400 font-mono">{p.phone || ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setMobileSearchOpen((v) => !v)}
            className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          <ThemeToggle />

          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen((open) => !open)}
              className="relative inline-flex items-center justify-center h-9 w-9 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] leading-4 text-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-11 w-72 sm:w-80 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} unread</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications((items) => items.map((item) => ({ ...item, unread: false })))}
                    className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      No notifications right now.
                    </div>
                  ) : notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setNotifications((items) => items.map((entry) => entry.id === item.id ? { ...entry, unread: false } : entry))}
                      className="w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${item.unread ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{item.detail}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 pl-1 pr-2 h-9 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="h-7 w-7 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 grid place-items-center text-xs font-semibold border border-slate-200 dark:border-slate-700 overflow-hidden">
                {user?.profile_picture
                  ? <img src={user.profile_picture} alt="" className="h-7 w-7 object-cover" />
                  : initials}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <p className="text-xs font-medium text-slate-900 dark:text-slate-100">{user?.username || 'User'}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{roleLabels[user?.role] || user?.role}</p>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-1 animate-rise">
                <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user?.username}</p>
                  <p className="text-xs text-slate-500">{roleLabels[user?.role] || user?.role}</p>
                </div>
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
                >
                  <User size={14} className="text-slate-400" /> Profile
                </button>
                <Link
                  to="/"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
                >
                  Home
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
                >
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search drawer */}
      {mobileSearchOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && search.trim()) {
                  navigate(`/patients?q=${encodeURIComponent(search.trim())}`);
                  setMobileSearchOpen(false);
                }
              }}
              placeholder="Search patients…"
              className="h-10 w-full pl-9 pr-3 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>
        </div>
      )}
    </header>
  );
}
