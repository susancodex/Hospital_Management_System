import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Stethoscope, Phone, Mail, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useTheme } from '../context/ThemeContext.jsx';
import { appointmentsAPI, doctorsAPI } from '../api/services.js';
import AppModal from '../components/common/AppModal.jsx';
import { EmptyState, TableSkeleton } from '../components/common/LoadingState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { hasPermission } from '../lib/permissions.js';

const schema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  specialization: z.string().min(2),
  license_number: z.string().optional(),
  is_available: z.boolean(),
});

const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.08 } } };

export default function Doctors() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const canManageDoctors = hasPermission(user?.role, 'doctors.manage');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewDoctor, setViewDoctor] = useState(null);
  const [viewAppointments, setViewAppointments] = useState([]);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { is_available: true },
  });

  const load = async (search = query) => {
    setLoading(true);
    try {
      const response = await doctorsAPI.list({ search });
      setRows(response.items);
    } catch {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ first_name: '', last_name: '', email: '', phone: '', specialization: '', license_number: '', is_available: true });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    reset({ first_name: row.first_name, last_name: row.last_name, email: row.email, phone: row.phone, specialization: row.specialization, license_number: row.license_number || '', is_available: !!row.is_available });
    setOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      if (editing) { await doctorsAPI.update(editing.id, values); toast.success('Doctor updated'); }
      else { await doctorsAPI.create(values); toast.success('Doctor created'); }
      setOpen(false);
      await load();
    } catch { toast.error('Unable to save doctor'); }
  };

  const onDelete = async (id) => {
    try { await doctorsAPI.delete(id); toast.success('Doctor deleted'); await load(); }
    catch { toast.error('Unable to delete doctor'); }
  };

  const viewDoctorDetails = async (doctor) => {
    setViewDoctor(doctor);
    try { const response = await appointmentsAPI.list({ doctor: doctor.id }); setViewAppointments(response.items.filter(a => a.doctor === doctor.id)); }
    catch { setViewAppointments([]); }
  };

  return (
    <motion.div className="space-y-6" initial="initial" animate="animate" variants={stagger}>
      <PageHeader title="Doctors" subtitle="Manage doctor directory and availability" icon={Stethoscope} actions={canManageDoctors && (
        <motion.button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Plus size={16} /> New Doctor
        </motion.button>
      )} />

      <motion.div className={`rounded-2xl border p-4 shadow-sm transition-colors ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200/80 bg-white'}`} variants={fadeIn}>
        <form className="flex flex-wrap items-center gap-3" onSubmit={(e) => { e.preventDefault(); load(query); }}>
          <motion.div className={`flex h-12 flex-1 min-w-[200px] items-center gap-2 rounded-xl border px-4 transition-colors ${isDark ? 'border-slate-600 bg-slate-700' : 'border-slate-200 bg-slate-50'}`} whileFocus={{ scale: 1.01 }}>
            <Search size={18} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search doctors..." className={`w-full border-none bg-transparent text-sm outline-none ${isDark ? 'text-slate-100 placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'}`} />
          </motion.div>
          <motion.button type="submit" className={`rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100 hover:bg-slate-600' : 'border-slate-300 bg-slate-900 text-white hover:bg-slate-800'}`} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            Search
          </motion.button>
        </form>
      </motion.div>

      {loading ? <TableSkeleton isDark={isDark} /> : rows.length === 0 ? <EmptyState title="No doctors found" description="Add doctors to get started" isDark={isDark} /> : (
        <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" variants={stagger}>
          <AnimatePresence>
            {rows.map((row, idx) => (
              <motion.article key={row.id} className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all ${isDark ? 'border-slate-700 bg-slate-800 hover:bg-slate-700/50 hover:shadow-slate-900/50' : 'border-slate-200/80 bg-white hover:shadow-lg'}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: idx * 0.05 }} whileHover={{ y: -4 }}>
                <motion.div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 group-hover:opacity-100 ${isDark ? 'bg-gradient-to-br from-slate-700 to-slate-600' : 'bg-gradient-to-br from-blue-50 to-blue-100'}`} animate={{ opacity: [0, 0.5, 0] }} transition={{ duration: 2, repeat: Infinity }} />
                <div className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-xl font-bold text-white shadow-lg" whileHover={{ rotate: 5 }}>
                        {row.first_name?.charAt(0)}{row.last_name?.charAt(0)}
                      </motion.div>
                      <div>
                        <p className={`font-heading text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{row.full_name}</p>
                          <p className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{row.specialization}</p>
                      </div>
                    </div>
                  </div>
                  <div className={`mt-4 space-y-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <div className="flex items-center gap-2"><Phone size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} /><span>{row.phone}</span></div>
                    <div className="flex items-center gap-2"><Mail size={14} className={isDark ? 'text-slate-500' : 'text-slate-400'} /><span className="truncate">{row.email}</span></div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <StatusBadge value={row.is_available ? 'active' : 'inactive'} />
                    <div className="flex items-center gap-2">
                      {canManageDoctors ? (
                        <motion.div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <motion.button onClick={() => viewDoctorDetails(row)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${isDark ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`} whileHover={{ scale: 1.1 }}>View</motion.button>
                          <motion.button onClick={() => openEdit(row)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`} whileHover={{ scale: 1.1 }}>Edit</motion.button>
                          <motion.button onClick={() => onDelete(row.id)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${isDark ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'}`} whileHover={{ scale: 1.1 }}>Delete</motion.button>
                        </motion.div>
                      ) : (
                        <motion.button onClick={() => viewDoctorDetails(row)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${isDark ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`} whileHover={{ scale: 1.1 }}>View Profile</motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AppModal open={open && canManageDoctors} onClose={() => setOpen(false)} title={editing ? 'Update Doctor' : 'Add New Doctor'}>
        <motion.form onSubmit={handleSubmit(onSubmit)} className="grid gap-5" initial="initial" animate="animate">
          <div className="grid gap-4 sm:grid-cols-2">
            <motion.div variants={fadeIn}>
              <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>First Name *</label>
              <input {...register('first_name')} className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-900/30' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100'}`} />
            </motion.div>
            <motion.div variants={fadeIn}>
              <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Last Name *</label>
              <input {...register('last_name')} className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-900/30' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100'}`} />
            </motion.div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Email *</label>
              <input type="email" {...register('email')} className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-900/30' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100'}`} />
            </div>
            <div>
              <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Phone *</label>
              <input {...register('phone')} className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-900/30' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100'}`} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Specialization *</label>
              <input {...register('specialization')} className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-900/30' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100'}`} />
            </div>
            <div>
              <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>License Number</label>
              <input {...register('license_number')} className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-900/30' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100'}`} />
            </div>
          </div>
          <div>
            <label className={`mb-1.5 block text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Availability</label>
            <select {...register('is_available')} className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-900/30' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100'}`}>
              <option value={true}>Available</option>
              <option value={false}>Not available</option>
            </select>
          </div>
          <motion.button disabled={isSubmitting} className="mt-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} disabled={isSubmitting}>
            {editing ? 'Update Doctor' : 'Create Doctor'}
          </motion.button>
        </motion.form>
      </AppModal>

      <AppModal open={!!viewDoctor} onClose={() => setViewDoctor(null)} title={`Dr. ${viewDoctor?.full_name?.replace('Dr. ', '')}`} size="lg">
        <motion.div className="space-y-6" initial="initial" animate="animate" variants={stagger}>
          <motion.div className="flex items-start gap-5" variants={fadeIn}>
            <motion.div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-2xl font-bold text-white shadow-lg" whileHover={{ rotate: 5 }}>
              {viewDoctor?.first_name?.charAt(0)}{viewDoctor?.last_name?.charAt(0)}
            </motion.div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-slate-400">Specialization</p><p className="font-semibold">{viewDoctor?.specialization}</p></div>
              <div><p className="text-xs text-slate-400">Status</p><StatusBadge value={viewDoctor?.is_available ? 'active' : 'inactive'} /></div>
              <div><p className="text-xs text-slate-400">Phone</p><p>{viewDoctor?.phone}</p></div>
              <div><p className="text-xs text-slate-400">Email</p><p>{viewDoctor?.email}</p></div>
            </div>
          </motion.div>
          <div>
            <p className="mb-3 text-sm font-semibold">Appointments ({viewAppointments.length})</p>
            {viewAppointments.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No appointments</p> : (
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-2">
                {viewAppointments.slice(0, 5).map((apt) => (
                  <motion.div key={apt.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3" whileHover={{ scale: 1.01 }}>
                    <div><p className="font-medium">{apt.patient_name}</p><p className="text-xs text-slate-500">{apt.appointment_date}</p></div>
                    <StatusBadge value={apt.status} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </AppModal>
    </motion.div>
  );
}