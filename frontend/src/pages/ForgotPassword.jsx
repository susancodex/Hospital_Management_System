import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore.js';

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
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

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
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl md:p-8">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Account recovery</p>
        <h1 className="font-heading mt-1 text-2xl font-semibold text-slate-900">Reset your password</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
            <input {...register('username')} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input type="email" {...register('email')} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">New Password</label>
            <input type="password" {...register('new_password')} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            {errors.new_password && <p className="mt-1 text-xs text-red-500">{errors.new_password.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
            Reset Password
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Remembered it? <Link to="/login" className="text-blue-700 hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
