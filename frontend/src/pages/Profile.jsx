import { zodResolver } from '@hookform/resolvers/zod';
import { Camera, Lock, Save, User, X, Shield, Activity, Clock, CheckCircle2, Moon, Sun, Smartphone, Monitor, HelpCircle, FileText, Calendar as CalendarIcon, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { authAPI } from '../api/services.js';
import PageHeader from '../components/common/PageHeader.jsx';
import { useAuthStore } from '../store/authStore.js';
import { FormField } from '../components/common/UIStates.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';

const profileSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  old_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'New password must be at least 8 characters'),
  confirm_password: z.string().min(8, 'Confirm your new password'),
}).refine((v) => v.new_password === v.confirm_password, { message: 'Passwords do not match', path: ['confirm_password'] });

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const { isDark, toggleTheme } = useTheme();
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('account');

  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors }, reset: resetProfile } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    }
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset: resetPassword } = useForm({
    resolver: zodResolver(passwordSchema)
  });

  useEffect(() => {
    if (user) {
      resetProfile({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user, resetProfile]);

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
    } catch {
      toast.error('Unable to update profile');
    } finally {
      setSaving(false);
    }
  };

  const onPasswordSubmit = async (values) => {
    try {
      await authAPI.changePassword({ old_password: values.old_password, new_password: values.new_password });
      resetPassword();
      toast.success('Password changed successfully');
    } catch (e) {
      toast.error(e.response?.data?.old_password || 'Unable to change password');
    }
  };

  const getInitials = () => {
    if (!user) return 'U';
    if (user.first_name && user.last_name) return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    return user.username?.charAt(0)?.toUpperCase() || 'U';
  };

  const tabs = [
    { id: 'account', label: 'Account' },
    { id: 'security', label: 'Security' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'sessions', label: 'Sessions' },
  ];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full">
      <PageHeader 
        title="My Profile" 
        subtitle="Manage your personal information, security, and preferences." 
      />

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Column - Main Content */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
            
            {/* Header Profile Block */}
            <div className="px-6 py-8 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start gap-6">
              <div className="relative group shrink-0">
                <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-600 dark:text-slate-300">
                  {previewUrl || user?.profile_picture ? (
                    <img src={previewUrl || user.profile_picture} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    getInitials()
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-teal-700 hover:border-teal-700 shadow-sm transition-colors"
                >
                  <Camera size={14} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setAvatarFile(f);
                      setPreviewUrl(URL.createObjectURL(f));
                    }
                  }}
                  className="hidden"
                />
              </div>

              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
                      {user?.first_name} {user?.last_name}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">@{user?.username}</p>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <StatusBadge value={user?.role} />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'recently'}
                    </p>
                  </div>
                </div>
                
                {avatarFile && (
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleProfileSubmit(onProfileSubmit)()}
                      disabled={saving}
                      className="inline-flex items-center gap-2 h-8 px-3 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium transition-colors"
                    >
                      {saving ? 'Uploading...' : 'Save new photo'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarFile(null);
                        setPreviewUrl(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="inline-flex items-center gap-2 h-8 px-3 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-100 dark:border-slate-800 px-2 overflow-x-auto no-scrollbar">
              <div className="flex space-x-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'border-teal-700 text-teal-700 dark:border-teal-400 dark:text-teal-400' 
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              
              {/* Account Tab */}
              {activeTab === 'account' && (
                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <FormField 
                      label="First name" 
                      name="first_name" 
                      register={registerProfile} 
                      error={profileErrors.first_name?.message} 
                      touched={true}
                    />
                    <FormField 
                      label="Last name" 
                      name="last_name" 
                      register={registerProfile} 
                      error={profileErrors.last_name?.message} 
                      touched={true}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <FormField 
                      label="Email address" 
                      name="email" 
                      type="email" 
                      register={registerProfile} 
                      error={profileErrors.email?.message} 
                      touched={true}
                    />
                    <FormField 
                      label="Phone number" 
                      name="phone" 
                      register={registerProfile} 
                      error={profileErrors.phone?.message} 
                      touched={true}
                    />
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save changes'}
                    </button>
                  </div>
                </form>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5 max-w-md">
                  <FormField 
                    label="Current password" 
                    name="old_password" 
                    type="password" 
                    register={registerPassword} 
                    error={passwordErrors.old_password?.message} 
                    touched={true}
                  />
                  <FormField 
                    label="New password" 
                    name="new_password" 
                    type="password" 
                    register={registerPassword} 
                    error={passwordErrors.new_password?.message} 
                    touched={true}
                  />
                  <FormField 
                    label="Confirm new password" 
                    name="confirm_password" 
                    type="password" 
                    register={registerPassword} 
                    error={passwordErrors.confirm_password?.message} 
                    touched={true}
                  />
                  <div className="pt-2">
                    <button 
                      type="submit"
                      className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors"
                    >
                      Update password
                    </button>
                  </div>
                </form>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-6 max-w-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Theme Preference</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Choose how the application looks to you.</p>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                      <button 
                        onClick={() => !isDark && toggleTheme()}
                        className={`inline-flex items-center justify-center w-10 h-8 rounded-md transition-colors ${!isDark ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        <Sun className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => isDark && toggleTheme()}
                        className={`inline-flex items-center justify-center w-10 h-8 rounded-md transition-colors ${isDark ? 'bg-slate-700 text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <Moon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-px bg-slate-100 dark:bg-slate-800" />
                  
                  <div className="flex items-center justify-between opacity-60 pointer-events-none">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Interface Density</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Control the spacing of lists and tables.</p>
                    </div>
                    <select className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100" defaultValue="compact">
                      <option value="comfortable">Comfortable</option>
                      <option value="compact">Compact</option>
                    </select>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-800" />

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Email Notifications</p>
                    
                    <label className="flex items-center justify-between py-1 opacity-60 cursor-not-allowed">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Appointment Reminders</span>
                      <input type="checkbox" className="w-4 h-4 text-teal-600 rounded border-slate-300" defaultChecked disabled />
                    </label>
                    <label className="flex items-center justify-between py-1 opacity-60 cursor-not-allowed">
                      <span className="text-sm text-slate-600 dark:text-slate-300">System Updates</span>
                      <input type="checkbox" className="w-4 h-4 text-teal-600 rounded border-slate-300" disabled />
                    </label>
                  </div>

                  <div className="pt-2">
                    <button disabled className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors opacity-50 cursor-not-allowed">
                      Save preferences
                    </button>
                  </div>
                </div>
              )}

              {/* Sessions Tab */}
              {activeTab === 'sessions' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Your recent login activity across devices.</p>
                  
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                    <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/40">
                      <div className="mt-1 text-teal-600 dark:text-teal-400"><Monitor size={20} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Mac OS • Chrome</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">New York, USA • 192.168.1.1</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Current</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="mt-1 text-slate-400"><Smartphone size={20} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">iOS • Safari</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">New York, USA • 10.0.0.45</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 dark:text-slate-400">2 hours ago</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <button className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium shadow-sm transition-colors">
                      Sign out of all other sessions
                    </button>
                  </div>
                </div>
              )}
              
            </div>
          </div>
        </div>

        {/* Right Column - Sidebars */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Stats */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Quick Stats</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                    <Users size={16} />
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">Patients Seen</span>
                </div>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">142</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                    <CalendarIcon size={16} />
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">Appointments this week</span>
                </div>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">28</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">Records authored</span>
                </div>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">84</span>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h3>
            </div>
            <div className="p-5">
              <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 space-y-6">
                {[
                  { time: 'Just now', text: 'Logged in to system' },
                  { time: '2 hours ago', text: 'Updated patient record for MRN-2026-0481' },
                  { time: 'Yesterday', text: 'Completed consultation with Priya Sharma' },
                  { time: 'Yesterday', text: 'Generated weekly medical report' },
                  { time: '2 days ago', text: 'Password was changed' },
                ].map((item, i) => (
                  <div key={i} className="relative pl-6">
                    <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 bg-teal-500" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{item.time}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Help & Support */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-5 text-center">
            <div className="mx-auto w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3 shadow-sm">
              <HelpCircle size={20} />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Need assistance?</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-[200px] mx-auto">
              Our support team is available 24/7 to help with any technical issues.
            </p>
            <button className="inline-flex items-center gap-2 h-8 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium shadow-sm transition-colors w-full justify-center">
              Contact Support
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
