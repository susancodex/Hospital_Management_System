import { zodResolver } from '@hookform/resolvers/zod';
import { Activity, CheckCircle2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore.js';
import { FormField } from '../components/common/UIStates.jsx';
import GoogleSignInButton from '../components/auth/GoogleSignInButton.jsx';

const schema = z
  .object({
    role: z.enum(['doctor', 'patient']),
    first_name: z.string().min(2, 'First name is required'),
    last_name: z.string().min(2, 'Last name is required'),
    username: z.string().min(3, 'Username is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(6, 'Phone number is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password2: z.string().min(8, 'Confirm your password'),
    specialization: z.string().optional(),
    license_number: z.string().optional(),
    date_of_birth: z.string().optional(),
    gender: z.enum(['M', 'F', 'O']).optional(),
    address: z.string().optional(),
  })
  .refine((values) => values.password === values.password2, {
    message: 'Passwords must match',
    path: ['password2'],
  })
  .superRefine((values, ctx) => {
    if (values.role === 'doctor' && !values.specialization?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['specialization'], message: 'Specialization is required for doctors' });
    }
    if (values.role === 'patient') {
      if (!values.date_of_birth) {
        ctx.addIssue({ code: 'custom', path: ['date_of_birth'], message: 'Date of birth is required for patients' });
      }
      if (!values.gender) {
        ctx.addIssue({ code: 'custom', path: ['gender'], message: 'Gender is required for patients' });
      }
    }
  });

export default function Register() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      role: 'patient',
      gender: 'M',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (values) => {
    try {
      const payload = { ...values };

      // Avoid sending empty date strings that DRF DateField rejects.
      if (!payload.date_of_birth) {
        delete payload.date_of_birth;
      }

      // Keep doctor registration payload focused on doctor fields.
      if (payload.role === 'doctor') {
        delete payload.gender;
        delete payload.address;
      }

      const result = await registerUser(payload);
      if (result.ok) {
        toast.success('Account created successfully');
        const user = useAuthStore.getState().user;
        navigate(user?.role === 'patient' ? '/profile' : '/dashboard');
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
              <div className="sm:col-span-2">
                <FormField
                  label="Register As"
                  name="role"
                  type="select"
                  register={register}
                  options={[
                    { value: 'patient', label: 'Patient' },
                    { value: 'doctor', label: 'Doctor' },
                  ]}
                  error={errors.role?.message}
                  touched={touchedFields.role}
                  required
                />
              </div>
              <div className="sm:col-span-1">
                <FormField
                  label="First Name"
                  name="first_name"
                  register={register}
                  error={errors.first_name?.message}
                  touched={touchedFields.first_name}
                />
              </div>
              <div className="sm:col-span-1">
                <FormField
                  label="Last Name"
                  name="last_name"
                  register={register}
                  error={errors.last_name?.message}
                  touched={touchedFields.last_name}
                />
              </div>
              <div className="sm:col-span-2">
                <FormField
                  label="Username"
                  name="username"
                  register={register}
                  error={errors.username?.message}
                  touched={touchedFields.username}
                />
              </div>
              <div className="sm:col-span-2">
                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  register={register}
                  error={errors.email?.message}
                  touched={touchedFields.email}
                />
              </div>
              <div className="sm:col-span-2">
                <FormField
                  label="Phone"
                  name="phone"
                  register={register}
                  error={errors.phone?.message}
                  touched={touchedFields.phone}
                />
              </div>
              {selectedRole === 'doctor' ? (
                <>
                  <div className="sm:col-span-2">
                    <FormField
                      label="Date of Birth (Optional)"
                      name="date_of_birth"
                      type="date"
                      register={register}
                      error={errors.date_of_birth?.message}
                      touched={touchedFields.date_of_birth}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FormField
                      label="Specialization"
                      name="specialization"
                      register={register}
                      error={errors.specialization?.message}
                      touched={touchedFields.specialization}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FormField
                      label="License Number"
                      name="license_number"
                      register={register}
                      error={errors.license_number?.message}
                      touched={touchedFields.license_number}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="sm:col-span-1">
                    <FormField
                      label="Date of Birth"
                      name="date_of_birth"
                      type="date"
                      register={register}
                      error={errors.date_of_birth?.message}
                      touched={touchedFields.date_of_birth}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <FormField
                      label="Gender"
                      name="gender"
                      type="select"
                      register={register}
                      options={[
                        { value: 'M', label: 'Male' },
                        { value: 'F', label: 'Female' },
                        { value: 'O', label: 'Other' },
                      ]}
                      error={errors.gender?.message}
                      touched={touchedFields.gender}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FormField
                      label="Address"
                      name="address"
                      type="textarea"
                      rows={2}
                      register={register}
                      error={errors.address?.message}
                      touched={touchedFields.address}
                    />
                  </div>
                </>
              )}
              <div className="sm:col-span-2">
                <FormField
                  label="Password"
                  name="password"
                  type="password"
                  register={register}
                  error={errors.password?.message}
                  touched={touchedFields.password}
                />
              </div>
              <div className="sm:col-span-2">
                <FormField
                  label="Confirm Password"
                  name="password2"
                  type="password"
                  register={register}
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
              <GoogleSignInButton onSuccess={() => {
                const user = useAuthStore.getState().user;
                navigate(user?.role === 'patient' ? '/profile' : '/dashboard');
              }} />
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
