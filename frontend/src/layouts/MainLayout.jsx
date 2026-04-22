import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import BottomNav from '../components/BottomNav.jsx';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 pb-28 lg:pb-10">
            <Outlet />
          </main>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
