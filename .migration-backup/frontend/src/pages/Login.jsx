import { zodResolver } from '@hookform/resolvers/zod';
import { Activity, CheckCircle2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore.js';
import { FormField } from '../components/common/UIStates.jsx';
import GoogleSignInButton from '../components/auth/GoogleSignInButton.jsx';

const schema = z.object({
  username: z.string().min(3, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm({ resolver: zodResolver(schema), mode: 'onBlur' });

  const onSubmit = async (values) => {
    const result = await login(values.username, values.password);
    if (result.ok) {
      const user = useAuthStore.getState().user;
      const roleLabel = { admin: 'Administrator', doctor: 'Doctor', patient: 'Patient', reception: 'Receptionist' }[user?.role] || user?.role;
      toast.success(
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-teal-700 text-white">
            <Activity size={20} />
          </div>
          <div>
            <p className="font-semibold text-slate-900">Welcome back, {user?.username}!</p>
            <p className="text-xs text-slate-500">Logged in as {roleLabel}</p>
          </div>
        </div>,
        { duration: 4000 }
      );
      navigate(user?.role === 'patient' ? '/profile' : '/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Left Pane - Hero */}
      <div className="hidden lg:flex w-1/2 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-teal-700 rounded flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-slate-900 dark:text-slate-100">AetherCare</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 max-w-md">
            Modern hospital operations for modern teams.
          </h1>
          <div className="mt-8 space-y-4">
            {[
              "Unified patient records",
              "Real-time scheduling",
              "HIPAA-aware billing"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                {feature}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          AetherCare HMS &copy; {new Date().getFullYear()}
        </p>
      </div>

      {/* Right Pane - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 bg-teal-700 rounded flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-slate-900 dark:text-slate-100">AetherCare</span>
          </div>
          
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Sign in</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Welcome back to your workspace</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                label="Username"
                name="username"
                register={register}
                error={errors.username?.message}
                touched={touchedFields.username}
                placeholder="Enter your username"
              />

              <FormField
                label="Password"
                name="password"
                type="password"
                register={register}
                error={errors.password?.message}
                touched={touchedFields.password}
                placeholder="Enter your password"
              />

              <div className="flex items-center justify-between mt-2 mb-4">
                <Link to="/forgot-password" className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300">
                  Forgot password?
                </Link>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Sign in
              </button>
            </form>

            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <GoogleSignInButton onSuccess={() => {
                const user = useAuthStore.getState().user;
                navigate(user?.role === 'patient' ? '/profile' : '/dashboard');
              }} />
            </div>

            <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
