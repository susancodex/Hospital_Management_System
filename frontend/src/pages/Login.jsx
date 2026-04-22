import { zodResolver } from '@hookform/resolvers/zod';
import { Activity, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore.js';
import { useTheme } from '../context/ThemeContext.jsx';

const schema = z.object({
  username: z.string().min(3, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    const result = await login(values.username, values.password);
    if (result.ok) {
      const user = useAuthStore.getState().user;
      const roleLabel = { admin: 'Administrator', doctor: 'Doctor', reception: 'Receptionist' }[user?.role] || user?.role;
      toast.success(
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <Activity size={20} />
          </div>
          <div>
            <p className="font-semibold">Welcome back, {user?.username}!</p>
            <p className="text-xs text-blue-600/80">Logged in as {roleLabel}</p>
          </div>
        </div>,
        { duration: 4000 }
      );
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className={`min-h-screen px-4 py-10 transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className={`mx-auto grid max-w-5xl overflow-hidden rounded-3xl shadow-xl md:grid-cols-2 border transition-colors duration-300 ${
        isDark
          ? 'border-slate-700 bg-slate-900'
          : 'border-slate-200 bg-white'
      }`}>
        <div className="hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#2563eb] p-8 text-white md:block">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-100">AetherCare HMS</p>
          <h1 className="font-heading mt-4 text-4xl font-semibold">Operational clarity for every hospital team.</h1>
          <p className="mt-4 text-sm text-slate-100/80">Manage patients, doctors, records, appointments, and billing from one secure control plane.</p>
        </div>

        <div className={`p-6 md:p-8 transition-colors duration-300 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
          <p className={`text-xs uppercase tracking-[0.16em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Sign in</p>
          <h2 className={`font-heading mt-1 text-2xl font-semibold transition-colors duration-300 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Welcome back</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <label className={`mb-1 block text-sm font-medium transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Username</label>
              <input {...register('username')} className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ring-blue-500/40 transition ${
                isDark
                  ? 'border-slate-700 bg-slate-800 text-slate-100 focus:ring'
                  : 'border-slate-200 bg-white text-slate-900 focus:ring'
              }`} />
              {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>}
            </div>

            <div>
              <label className={`mb-1 block text-sm font-medium transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
              <input type="password" {...register('password')} className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none ring-blue-500/40 transition ${
                isDark
                  ? 'border-slate-700 bg-slate-800 text-slate-100 focus:ring'
                  : 'border-slate-200 bg-white text-slate-900 focus:ring'
              }`} />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-700/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Login
            </button>
          </form>

          <div className={`mt-4 flex items-center justify-between text-sm transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <Link to="/forgot-password" className={`${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-700 hover:underline'}`}>Forgot password?</Link>
            <Link to="/register" className={`${isDark ? 'text-slate-300 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'}`}>Create account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
