import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Shield, UserCheck, UserX, KeyRound, Eye, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { usersAdminAPI } from '../api/services.js';
import AppModal from '../components/common/AppModal.jsx';
import { EmptyState, TableSkeleton } from '../components/common/LoadingState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { FormField, ConfirmDialog } from '../components/common/UIStates.jsx';
import { useAuth } from '../hooks/useAuth.js';

const createSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'doctor', 'reception', 'patient']),
  specialization: z.string().optional(),
  department: z.string().optional(),
  license_number: z.string().optional(),
  experience: z.coerce.number().optional(),
});

const resetSchema = z.object({
  new_password: z.string().min(6, 'Password must be at least 6 characters'),
});

const ROLE_COLORS = {
  admin: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  doctor: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  patient: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  reception: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
};

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(null);
  const [viewUser, setViewUser] = useState(null);
  const [toggleId, setToggleId] = useState(null);
  const [isToggling, setIsToggling] = useState(false);

  const {
    register: createReg,
    handleSubmit: handleCreate,
    reset: resetCreate,
    watch: watchCreate,
    formState: { errors: createErrors, isSubmitting: isCreating },
  } = useForm({ resolver: zodResolver(createSchema), defaultValues: { role: 'doctor' } });

  const {
    register: resetReg,
    handleSubmit: handleReset,
    reset: resetPwd,
    formState: { errors: resetErrors, isSubmitting: isResetting },
  } = useForm({ resolver: zodResolver(resetSchema) });

  const selectedRole = watchCreate('role');

  const load = async () => {
    setLoading(true);
    try {
      const res = await usersAdminAPI.list({ search: query, role: roleFilter });
      setUsers(res.data?.results || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [query, roleFilter]);

  const onCreateSubmit = async (values) => {
    try {
      await usersAdminAPI.create(values);
      toast.success(`${values.role.charAt(0).toUpperCase() + values.role.slice(1)} account created`);
      setCreateOpen(false);
      resetCreate();
      await load();
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.username?.[0] || err.response?.data?.email?.[0] || 'Failed to create user';
      toast.error(detail);
    }
  };

  const onResetSubmit = async (values) => {
    try {
      await usersAdminAPI.resetPassword(resetOpen.id, values.new_password);
      toast.success('Password reset successfully');
      setResetOpen(null);
      resetPwd();
    } catch {
      toast.error('Failed to reset password');
    }
  };

  const confirmToggle = async () => {
    if (!toggleId) return;
    setIsToggling(true);
    try {
      const res = await usersAdminAPI.toggleActive(toggleId);
      const status = res.data?.is_active;
      toast.success(`User ${status ? 'activated' : 'deactivated'}`);
      await load();
    } catch {
      toast.error('Failed to toggle user status');
    } finally {
      setIsToggling(false);
      setToggleId(null);
    }
  };

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(query.toLowerCase()) ||
    u.email?.toLowerCase().includes(query.toLowerCase()) ||
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(query.toLowerCase())
  );

  const counts = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    doctor: users.filter(u => u.role === 'doctor').length,
    patient: users.filter(u => u.role === 'patient').length,
    reception: users.filter(u => u.role === 'reception').length,
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full">
      <PageHeader
        title="User Management"
        subtitle="Manage system accounts, roles, and access"
        kicker="Admin"
        actions={
          <button
            onClick={() => { setCreateOpen(true); resetCreate({ role: 'doctor' }); }}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Account
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: counts.total, color: 'text-slate-700 dark:text-slate-300' },
          { label: 'Admins', value: counts.admin, color: 'text-violet-700 dark:text-violet-300' },
          { label: 'Doctors', value: counts.doctor, color: 'text-blue-700 dark:text-blue-300' },
          { label: 'Patients', value: counts.patient, color: 'text-emerald-700 dark:text-emerald-300' },
          { label: 'Reception', value: counts.reception, color: 'text-amber-700 dark:text-amber-300' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* Filters */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users…"
              className="h-9 w-full pl-9 pr-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="doctor">Doctor</option>
            <option value="patient">Patient</option>
            <option value="reception">Reception</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-5"><TableSkeleton rows={6} /></div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState icon={Shield} title="No users found" description="Adjust filters or create a new account." />
          ) : (
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-slate-50/60 dark:bg-slate-900/40">
                <tr>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">User</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Role</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Contact</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="h-10 px-5 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 flex items-center justify-center text-xs font-semibold border border-slate-200 dark:border-slate-700 shrink-0">
                          {(u.username || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{u.first_name} {u.last_name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-full ${ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{u.email}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{u.phone || '—'}</p>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge value={u.is_active ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewUser(u)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setResetOpen(u); resetPwd(); }}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          title="Reset password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => setToggleId(u.id)}
                            className={`inline-flex items-center justify-center h-8 w-8 rounded-md ${u.is_active ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'}`}
                            title={u.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      <AppModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create User Account"
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setCreateOpen(false)} className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium">Cancel</button>
            <button onClick={handleCreate(onCreateSubmit)} disabled={isCreating} className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium disabled:opacity-50">
              {isCreating ? 'Creating…' : 'Create Account'}
            </button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="First Name" name="first_name" register={createReg} error={createErrors.first_name?.message} touched={!!createErrors.first_name} required />
            <FormField label="Last Name" name="last_name" register={createReg} error={createErrors.last_name?.message} touched={!!createErrors.last_name} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Username" name="username" register={createReg} error={createErrors.username?.message} touched={!!createErrors.username} required />
            <FormField label="Email" name="email" type="email" register={createReg} error={createErrors.email?.message} touched={!!createErrors.email} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Password" name="password" type="password" register={createReg} error={createErrors.password?.message} touched={!!createErrors.password} required />
            <FormField label="Phone" name="phone" register={createReg} error={createErrors.phone?.message} touched={!!createErrors.phone} />
          </div>
          <FormField
            label="Role"
            name="role"
            type="select"
            register={createReg}
            options={[
              { value: 'doctor', label: 'Doctor' },
              { value: 'admin', label: 'Admin' },
              { value: 'reception', label: 'Receptionist' },
              { value: 'patient', label: 'Patient' },
            ]}
            error={createErrors.role?.message}
            touched={!!createErrors.role}
            required
          />
          {selectedRole === 'doctor' && (
            <div className="rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-4">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Doctor Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Specialization" name="specialization" register={createReg} error={createErrors.specialization?.message} touched={!!createErrors.specialization} />
                <FormField label="Department" name="department" register={createReg} error={createErrors.department?.message} touched={!!createErrors.department} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="License Number" name="license_number" register={createReg} error={createErrors.license_number?.message} touched={!!createErrors.license_number} />
                <FormField label="Years of Experience" name="experience" type="number" register={createReg} error={createErrors.experience?.message} touched={!!createErrors.experience} />
              </div>
            </div>
          )}
        </form>
      </AppModal>

      {/* Reset Password Modal */}
      <AppModal
        open={!!resetOpen}
        onClose={() => { setResetOpen(null); resetPwd(); }}
        title={`Reset Password — ${resetOpen?.username}`}
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => { setResetOpen(null); resetPwd(); }} className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium">Cancel</button>
            <button onClick={handleReset(onResetSubmit)} disabled={isResetting} className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium disabled:opacity-50">
              {isResetting ? 'Resetting…' : 'Reset Password'}
            </button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <p className="text-sm text-slate-600 dark:text-slate-400">Set a new password for <span className="font-medium text-slate-900 dark:text-slate-100">@{resetOpen?.username}</span>.</p>
          <FormField label="New Password" name="new_password" type="password" register={resetReg} error={resetErrors.new_password?.message} touched={!!resetErrors.new_password} required />
        </form>
      </AppModal>

      {/* View User Modal */}
      <AppModal open={!!viewUser} onClose={() => setViewUser(null)} title="User Details" size="sm"
        footer={<button type="button" onClick={() => setViewUser(null)} className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium">Close</button>}
      >
        {viewUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 flex items-center justify-center text-lg font-bold border border-slate-200 dark:border-slate-700">
                {(viewUser.username || 'U').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{viewUser.first_name} {viewUser.last_name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">@{viewUser.username}</p>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              {[
                { label: 'Email', value: viewUser.email },
                { label: 'Phone', value: viewUser.phone || '—' },
                { label: 'Role', value: viewUser.role },
                { label: 'Status', value: viewUser.is_active ? 'Active' : 'Inactive' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </AppModal>

      {/* Toggle Active Confirm */}
      <ConfirmDialog
        isOpen={!!toggleId}
        title="Change Account Status"
        message={`Are you sure you want to ${users.find(u => u.id === toggleId)?.is_active ? 'deactivate' : 'activate'} this account?`}
        onConfirm={confirmToggle}
        onCancel={() => setToggleId(null)}
        isLoading={isToggling}
        isDangerous={users.find(u => u.id === toggleId)?.is_active}
      />
    </div>
  );
}
