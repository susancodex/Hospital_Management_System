import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore.js';

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
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

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
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl md:p-8">
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Create account</p>
        <h1 className="font-heading mt-1 text-3xl font-semibold text-slate-900">Start your hospital workspace</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">First Name</label>
            <input {...register('first_name')} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            {errors.first_name && <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Last Name</label>
            <input {...register('last_name')} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            {errors.last_name && <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>}
          </div>
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
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input type="password" {...register('password')} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Confirm Password</label>
            <input type="password" {...register('password2')} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
            {errors.password2 && <p className="mt-1 text-xs text-red-500">{errors.password2.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white md:col-span-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create account
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Already have an account? <Link to="/login" className="text-blue-700 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
