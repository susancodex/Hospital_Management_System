import { zodResolver } from '@hookform/resolvers/zod';
import { Activity, CheckCircle2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore.js';
import { FormField } from '../components/common/UIStates.jsx';

const schema = z
  .object({
    first_name: z.string().min(2, 'First name is required'),
    last_name: z.string().min(2, 'Last name is required'),
    username: z.string().min(3, 'Username is required'),
    email: z.string().email('Valid email is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password2: z.string().min(8, 'Confirm your password'),
  })
  .refine((values) => values.password === values.password2, {
    message: 'Passwords must match',
    path: ['password2'],
  });

export default function Register() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm({ resolver: zodResolver(schema), mode: 'onBlur' });

  const onSubmit = async (values) => {
    try {
      const result = await registerUser(values);
      if (result.ok) {
        toast.success('Account created successfully');
        navigate('/dashboard');
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      console.error('Registration error:', e);
      toast.error('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Left Pane - Hero */}
      <div className="hidden lg:flex w-1/2 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-12 flex-col justify-between fixed inset-y-0 left-0">
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
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 lg:ml-[50%] min-h-[100dvh]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 bg-teal-700 rounded flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight text-slate-900 dark:text-slate-100">AetherCare</span>
          </div>
          
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Create account</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Start your hospital workspace</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <FormField
                  label="First Name"
                  {...register('first_name')}
                  error={errors.first_name?.message}
                  touched={touchedFields.first_name}
                />
              </div>
              <div className="sm:col-span-1">
                <FormField
                  label="Last Name"
                  {...register('last_name')}
                  error={errors.last_name?.message}
                  touched={touchedFields.last_name}
                />
              </div>
              <div className="sm:col-span-2">
                <FormField
                  label="Username"
                  {...register('username')}
                  error={errors.username?.message}
                  touched={touchedFields.username}
                />
              </div>
              <div className="sm:col-span-2">
                <FormField
                  label="Email"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  touched={touchedFields.email}
                />
              </div>
              <div className="sm:col-span-2">
                <FormField
                  label="Password"
                  type="password"
                  {...register('password')}
                  error={errors.password?.message}
                  touched={touchedFields.password}
                />
              </div>
              <div className="sm:col-span-2">
                <FormField
                  label="Confirm Password"
                  type="password"
                  {...register('password2')}
                  error={errors.password2?.message}
                  touched={touchedFields.password2}
                />
              </div>

              <div className="sm:col-span-2 mt-2">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Create account
                </button>
              </div>
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
              <button 
                type="button"
                onClick={() => {}}
                className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </button>
            </div>

            <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
