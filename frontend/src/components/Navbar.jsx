import { Bell, ChevronDown, LogOut, Menu, Search, User } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  '/billing': 'Billing',
  '/profile': 'My Profile',
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { openMobileSidebar, search, setSearch } = useUIStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const debounced = useDebounce(search, 350);

  const pageTitle = useMemo(() => pageTitles[location.pathname] || 'Hospital Management', [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSearch = async () => {
      if (!debounced.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        const response = await patientsAPI.list({ search: debounced });
        setSearchResults(response.items.slice(0, 5));
      } catch {
        setSearchResults([]);
      }
    };
    fetchSearch();
  }, [debounced]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const roleLabel = {
    admin: 'Administrator',
    doctor: 'Doctor',
    reception: 'Receptionist',
  };

  const roleColors = { admin: 'from-blue-600 to-indigo-600', doctor: 'from-emerald-600 to-teal-600', reception: 'from-amber-600 to-orange-600' };
  const roleLabels = { admin: 'Administrator', doctor: 'Doctor', reception: 'Receptionist' };

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/95 backdrop-blur-xl shadow-sm dark:shadow-lg transition-colors duration-300">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 md:px-6 lg:px-8">
        <button onClick={openMobileSidebar} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden">
          <Menu size={18} />
        </button>

        <div className="min-w-[180px]">
          <p className="text-[10px] uppercase tracking-[0.2em] text-blue-500">AetherCare</p>
          <h1 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100">{pageTitle}</h1>
        </div>

        <div className="ml-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 dark:from-slate-800 to-slate-800 dark:to-slate-900 px-4 py-2 text-white">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            <span className="text-xs font-medium text-slate-400">Welcome back,</span>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold">{user?.username}</span>
              <span className={`rounded-full bg-gradient-to-r px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${roleColors[user?.role] || 'from-slate-500 to-slate-600'}`}>
                {roleLabels[user?.role] || user?.role}
              </span>
            </div>
          </motion.div>
        </div>

        <div className="relative ml-auto max-w-xl flex-1" ref={searchRef}>
          <form
            className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 shadow-sm transition-colors"
            onSubmit={(e) => {
              e.preventDefault();
              if (search.trim()) navigate(`/patients?q=${encodeURIComponent(search.trim())}`);
            }}
          >
            <Search size={16} className="text-slate-400 dark:text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Global search patients"
              className="w-full border-none bg-transparent text-sm text-slate-700 dark:text-slate-300 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </form>
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-[52px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 shadow-lg">
              {searchResults.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  onClick={() => {
                    navigate(`/patients?q=${encodeURIComponent(patient.full_name || `${patient.first_name} ${patient.last_name}`)}`);
                    setSearchResults([]);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="text-slate-700 dark:text-slate-300">{patient.full_name || `${patient.first_name} ${patient.last_name}`}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{patient.phone}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-700" title="Notifications">
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-600" />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 transition hover:bg-slate-100 dark:hover:bg-slate-700"
              onClick={() => setDropdownOpen((v) => !v)}
            >
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 dark:bg-blue-900 text-sm font-semibold text-blue-700 dark:text-blue-300">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="profile" className="h-8 w-8 rounded-lg object-cover" />
                ) : (
                  user?.username?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="hidden text-left md:block">
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{user?.username}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{roleLabel[user?.role] || user?.role}</div>
              </div>
              <ChevronDown size={14} className="text-slate-500 dark:text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 shadow-lg">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-700 p-3">
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{user?.username}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{roleLabel[user?.role] || user?.role}</div>
                </div>

                <button className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" onClick={() => { setDropdownOpen(false); navigate('/profile'); }}>
                  <User size={15} />
                  Profile
                </button>
                <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Home
                </Link>
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" onClick={handleLogout}>
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
