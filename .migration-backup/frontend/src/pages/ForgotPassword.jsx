import { zodResolver } from '@hookform/resolvers/zod';
import { Activity, CheckCircle2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore.js';
import { FormField } from '../components/common/UIStates.jsx';

const schema = z.object({
  username: z.string().min(3, 'Username is required'),
  email: z.string().email('Valid email is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
});

export default function ForgotPassword() {
  const navigate = useNavigate();
  const forgotPassword = useAuthStore((state) => state.forgotPassword);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm({ resolver: zodResolver(schema), mode: 'onBlur' });

  const onSubmit = async (values) => {
    const result = await forgotPassword(values);
    if (result.ok) {
      toast.success('Password reset successful. Please login.');
      navigate('/login');
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
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Reset password</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Recover access to your account</p>
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
                label="Email"
                name="email"
                type="email"
                register={register}
                error={errors.email?.message}
                touched={touchedFields.email}
                placeholder="Enter your email address"
              />

              <FormField
                label="New Password"
                name="new_password"
                type="password"
                register={register}
                error={errors.new_password?.message}
                touched={touchedFields.new_password}
                placeholder="Enter new password"
              />

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Reset Password
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
              Remembered it?{' '}
              <Link to="/login" className="font-medium text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300">
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
