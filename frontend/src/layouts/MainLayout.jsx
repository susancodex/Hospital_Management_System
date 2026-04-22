import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import BottomNav from '../components/BottomNav.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export default function MainLayout() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <Navbar />
      <div className="mx-auto flex max-w-[1600px]">
        <Sidebar />
        <main
          className={`w-full p-3 sm:p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 transition-colors duration-300 ${
            isDark ? 'bg-slate-950' : 'bg-slate-50'
          }`}
        >
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
