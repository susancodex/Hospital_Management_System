import { Camera, Lock, Save, User, X, Shield, Activity, Clock, CheckCircle2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { authAPI } from '../api/services.js';
import PageHeader from '../components/common/PageHeader.jsx';
import { useAuthStore } from '../store/authStore.js';

const profileSchema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  old_password: z.string().min(1),
  new_password: z.string().min(8),
  confirm_password: z.string().min(8),
}).refine((v) => v.new_password === v.confirm_password, { message: 'Passwords do not match', path: ['confirm_password'] });

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const profileForm = useForm({ resolver: zodResolver(profileSchema), defaultValues: { first_name: user?.first_name || '', last_name: user?.last_name || '', email: user?.email || '', phone: user?.phone || '' } });
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    if (user) profileForm.reset({ first_name: user.first_name || '', last_name: user.last_name || '', email: user.email || '', phone: user.phone || '' });
  }, [user]);

  const onProfileSubmit = async (values) => {
    setSaving(true);
    try {
      const form = new FormData();
      Object.entries(values).forEach(([k, v]) => form.append(k, v || ''));
      if (avatarFile) form.append('profile_picture', avatarFile);
      await authAPI.updateProfile(form);
      await refreshProfile();
      setAvatarFile(null);
      setPreviewUrl(null);
      toast.success('Profile updated successfully');
    } catch { toast.error('Unable to update profile'); }
    finally { setSaving(false); }
  };

  const onPasswordSubmit = async (values) => {
    try { await authAPI.changePassword({ old_password: values.old_password, new_password: values.new_password }); passwordForm.reset(); toast.success('Password changed successfully'); }
    catch (e) { toast.error(e.response?.data?.old_password || 'Unable to change password'); }
  };

  const accountStats = [
    { label: 'Member Since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Active', icon: Clock, color: 'emerald' },
    { label: 'Account Status', value: 'Verified', icon: CheckCircle2, color: 'green' },
    { label: 'Role', value: user?.role?.toUpperCase() || 'USER', icon: Shield, color: 'blue' },
  ];

  return (
    <motion.div 
      className="space-y-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <PageHeader title="My Profile" subtitle="Manage account details and settings" icon={User} />

      <motion.section variants={item} className="grid gap-6 xl:grid-cols-3">
        <article className="group relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/60 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/80 border border-slate-100">
          <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/10 blur-3xl" />
          
          <div className="p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 text-indigo-600"><User size={19} /></div>
              <p className="text-xs uppercase tracking-[0.18em] font-bold text-slate-400">Account Overview</p>
            </div>
            
            <div className="flex flex-col items-center text-center gap-6">
              <div className="relative group/avatar h-32 w-32 shrink-0 overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 text-4xl font-bold text-white shadow-2xl shadow-indigo-500/30 ring-4 ring-white ring-offset-2 ring-offset-slate-50">
                {previewUrl || user?.profile_picture ? 
                  <img src={previewUrl || user.profile_picture} alt="avatar" className="h-full w-full object-cover transition-transform duration-500 group-hover/avatar:scale-110" /> : 
                  user?.username?.charAt(0)?.toUpperCase()
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300" />
              </div>
              
              <div>
                <h2 className="font-heading text-3xl font-bold text-slate-900">{user?.first_name} {user?.last_name}</h2>
                <p className="text-lg text-slate-500 mt-1">@{user?.username}</p>
                <p className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold capitalize bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-600 border border-indigo-100">{user?.role}</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {accountStats.map((stat, idx) => (
                <motion.div 
                  key={stat.label} 
                  whileHover={{ y: -3 }}
                  className="rounded-2xl bg-slate-50 p-4 text-center"
                >
                  <stat.icon size={18} className={`mx-auto mb-2 text-${stat.color}-500`} />
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{stat.label}</p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">{stat.value}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-7 space-y-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">Email Address</span>
                <span className="font-semibold text-slate-900">{user?.email || 'N/A'}</span>
              </div>
              <div className="h-px bg-slate-200/50" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">Phone Number</span>
                <span className="font-semibold text-slate-900">{user?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>
        </article>

        <motion.article variants={item} className="group relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/60 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/80 border border-slate-100 xl:col-span-2">
          <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -right-20 -bottom-20 h-52 w-52 rounded-full bg-gradient-to-br from-blue-500/5 to-indigo-500/5 blur-3xl" />
          
          <div className="p-8">
            <h3 className="mb-7 flex items-center gap-3 font-heading text-xl font-bold text-slate-900">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                <Save size={18} className="text-indigo-600" />
              </div>
              Personal Information
            </h3>
            
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="grid gap-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 tracking-wide">First name</label>
                  <input {...profileForm.register('first_name')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm transition-all duration-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none placeholder:text-slate-400 hover:border-slate-300" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 tracking-wide">Last name</label>
                  <input {...profileForm.register('last_name')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm transition-all duration-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none placeholder:text-slate-400 hover:border-slate-300" />
                </div>
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 tracking-wide">Email</label>
                  <input type="email" {...profileForm.register('email')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm transition-all duration-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none placeholder:text-slate-400 hover:border-slate-300" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 tracking-wide">Phone</label>
                  <input {...profileForm.register('phone')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm transition-all duration-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none placeholder:text-slate-400 hover:border-slate-300" />
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-600 tracking-wide">Profile Photo</label>
                <div className="flex flex-wrap items-center gap-6">
                  <motion.div 
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()} 
                    className="group relative flex h-32 w-32 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 transition-all duration-300 hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-lg"
                  >
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAvatarFile(f); setPreviewUrl(URL.createObjectURL(f)); } }} className="hidden" />
                    {previewUrl || user?.profile_picture ? 
                      <img src={previewUrl || user.profile_picture} alt="Profile" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : 
                      <div className="flex flex-col items-center gap-2 text-slate-400 transition-colors duration-300 group-hover:text-indigo-500">
                        <Camera className="h-8 w-8" />
                        <span className="text-xs font-bold">Upload Photo</span>
                      </div>
                    }
                  </motion.div>
                  <div className="flex flex-col gap-3">
                    {avatarFile && 
                      <motion.button 
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button" 
                        onClick={() => { setAvatarFile(null); setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} 
                        className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm"
                      >
                        <X size={14} />Remove Photo
                      </motion.button>
                    }
                    <motion.button 
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      type="button" 
                      onClick={() => fileInputRef.current?.click()} 
                      className="rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 px-5 py-2.5 text-xs font-bold text-indigo-600 transition-all duration-300 hover:bg-gradient-to-r from-indigo-100 to-blue-100 hover:shadow-md"
                    >
                      {avatarFile ? 'Change Photo' : 'Select Photo'}
                    </motion.button>
                  </div>
                </div>
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                disabled={saving} 
                className="mt-4 inline-flex w-fit items-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/40 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-xl"
              >
                {saving ? 'Saving Changes...' : 'Save Profile'}
              </motion.button>
            </form>
          </div>
        </motion.article>
      </motion.section>

      <motion.section variants={item} className="group relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/60 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/80 border border-slate-100">
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute -left-20 -bottom-20 h-52 w-52 rounded-full bg-gradient-to-br from-amber-500/5 to-orange-500/5 blur-3xl" />
        
        <div className="p-8">
          <h3 className="mb-7 flex items-center gap-3 font-heading text-xl font-bold text-slate-900">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-50 to-orange-50">
              <Lock size={18} className="text-orange-600" />
            </div>
            Security Settings
          </h3>
          
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 tracking-wide">Current password</label>
              <input type="password" {...passwordForm.register('old_password')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm transition-all duration-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50 outline-none placeholder:text-slate-400 hover:border-slate-300" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 tracking-wide">New password</label>
              <input type="password" {...passwordForm.register('new_password')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm transition-all duration-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50 outline-none placeholder:text-slate-400 hover:border-slate-300" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 tracking-wide">Confirm password</label>
              <input type="password" {...passwordForm.register('confirm_password')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-sm transition-all duration-300 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-50 outline-none placeholder:text-slate-400 hover:border-slate-300" placeholder="••••••••" />
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="mt-2 inline-flex w-fit items-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-orange-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/40 active:translate-y-0 sm:col-span-3"
            >
              Update Password
            </motion.button>
          </form>
        </div>
      </motion.section>
    </motion.div>
  );
}
