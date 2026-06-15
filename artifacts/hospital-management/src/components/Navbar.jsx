import { Bell, ChevronDown, Globe, LogOut, Menu, Search, User } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { setLanguage, getCurrentLanguage } from '../i18n/index.js';
import { useWsEvent, useWebSocket } from '../hooks/useWebSocket.js';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { patientsAPI, notificationsAPI } from '../api/services.js';
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
  '/ai-triage': 'AI Centre',
  '/prescriptions': 'Prescriptions',
  '/audit-logs': 'Audit Logs',
  '/admin/users': 'User Management',
  '/availability': 'My Availability',
  '/departments': 'Departments',
  '/book-appointment': 'Book an Appointment',
};

const roleLabels = { admin: 'Administrator', doctor: 'Doctor', patient: 'Patient', reception: 'Receptionist' };

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { openMobileSidebar, search, setSearch } = useUIStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const notificationsRef = useRef(null);
  const debounced = useDebounce(search, 300);

  const pageTitle = useMemo(() => pageTitles[location.pathname] || 'AetherCare', [location.pathname]);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setNotifLoading(true);
    try {
      const res = await notificationsAPI.list();
      setNotifications(res.data?.results || []);
    } catch {
      // graceful failure — don't show error for notification refresh
    } finally {
      setNotifLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
    // Refresh every 60 seconds while page is open
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

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

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markRead();
      setNotifications((items) => items.map((n) => ({ ...n, is_read: true })));
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleMarkOneRead = async (notif) => {
    if (notif.is_read) return;
    try {
      await notificationsAPI.markRead([notif.id]);
      setNotifications((items) => items.map((n) => n.id === notif.id ? { ...n, is_read: true } : n));
    } catch {}
  };

  // Language switcher state
  const [lang, setLang] = useState(getCurrentLanguage());
  const toggleLanguage = () => {
    const next = lang === 'en' ? 'ne' : 'en';
    setLanguage(next);
    setLang(next);
  };

  // WebSocket: receive real-time notifications
  useWebSocket({});
  useWsEvent('notification', (data) => {
    const notif = { id: Date.now(), title: data.title || 'New notification', message: data.message || '', is_read: false, created_at: new Date().toISOString() };
    setNotifications((prev) => [notif, ...prev]);
    toast.info(notif.title, { description: notif.message?.slice(0, 80), duration: 4000 });
  });

  const initials = (user?.username || 'U').slice(0, 2).toUpperCase();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

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

        <h1 className="lg:hidden text-base font-semibold text-slate-900 dark:text-slate-100 truncate">{pageTitle}</h1>

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
            placeholder="Search patients, doctors…"
            className="h-9 w-full pl-9 pr-3 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
          />
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-11 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden z-50">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    navigate(`/patients?q=${encodeURIComponent(`${p.first_name} ${p.last_name}`)}`);
                    setSearchResults([]);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="text-slate-700 dark:text-slate-200">{p.first_name} {p.last_name}</span>
                  <span className="text-xs text-slate-400 font-mono">{p.email || ''}</span>
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

          {/* Language switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="hidden sm:inline-flex items-center justify-center h-9 px-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold gap-1"
            title={lang === 'en' ? 'Switch to Nepali (नेपाली)' : 'Switch to English'}
          >
            <Globe size={14} />
            <span>{lang === 'en' ? 'EN' : 'ने'}</span>
          </button>

          <ThemeToggle />

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => { setNotificationsOpen((o) => !o); if (!notificationsOpen) loadNotifications(); }}
              className="relative inline-flex items-center justify-center h-9 w-9 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] leading-4 text-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-11 w-72 sm:w-80 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} unread</p>
                  </div>
                  {unreadCount > 0 && (
                    <button type="button" onClick={handleMarkAllRead} className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifLoading ? (
                    <div className="px-4 py-8 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No notifications right now.</div>
                  ) : notifications.map((notif) => (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleMarkOneRead(notif)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${!notif.is_read ? 'bg-teal-50/30 dark:bg-teal-950/20' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${!notif.is_read ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{notif.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{notif.message}</p>
                          <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                            {notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}
                          </p>
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
              <div className="absolute right-0 mt-2 w-56 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg p-1 z-50">
                <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-slate-500">@{user?.username} · {roleLabels[user?.role] || user?.role}</p>
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

      {/* Mobile search */}
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
