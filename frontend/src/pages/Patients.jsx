import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Users, Phone, Mail, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { appointmentsAPI, patientsAPI } from '../api/services.js';
import AppModal from '../components/common/AppModal.jsx';
import { EmptyState, TableSkeleton } from '../components/common/LoadingState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { hasPermission } from '../lib/permissions.js';

const schema = z.object({
  first_name: z.string().min(2),
  last_name: z.string().min(2),
  email: z.string().email().or(z.literal('')),
  phone: z.string().min(6),
  gender: z.enum(['M', 'F', 'O']),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
});

const PAGE_SIZE = 12;
const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.06 } } };

export default function Patients() {
  const { user } = useAuth();
  const canManagePatients = hasPermission(user?.role, 'patients.manage');
  const [searchParams] = useSearchParams();
  const queryFromUrl = searchParams.get('q') || '';
  const [query, setQuery] = useState(queryFromUrl);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewPatient, setViewPatient] = useState(null);
  const [viewAppointments, setViewAppointments] = useState([]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: { gender: 'M' } });

  const load = async (search = query) => {
    setLoading(true);
    try { const response = await patientsAPI.list({ search }); setRows(response.items); }
    catch { toast.error('Failed to load patients'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(queryFromUrl); }, [queryFromUrl]);

  const filtered = useMemo(() => rows, [rows]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => { setEditing(null); reset({ first_name: '', last_name: '', email: '', phone: '', gender: 'M', date_of_birth: '', address: '' }); setOpen(true); };
  const openEdit = (row) => { setEditing(row); reset({ first_name: row.first_name, last_name: row.last_name, email: row.email || '', phone: row.phone, gender: row.gender || 'M', date_of_birth: row.date_of_birth || '', address: row.address || '' }); setOpen(true); };
  const onSubmit = async (values) => {
    try { if (editing) { await patientsAPI.update(editing.id, values); toast.success('Patient updated'); } else { await patientsAPI.create(values); toast.success('Patient created'); } setOpen(false); await load(); }
    catch { toast.error('Unable to save patient'); }
  };
  const onDelete = async (id) => { try { await patientsAPI.delete(id); toast.success('Patient deleted'); await load(); } catch { toast.error('Unable to delete patient'); } };
  const viewPatientDetails = async (patient) => { setViewPatient(patient); try { const response = await appointmentsAPI.list({ patient: patient.id }); setViewAppointments(response.items.filter(a => a.patient === patient.id)); } catch { setViewAppointments([]); } };

  return (
    <motion.div className="space-y-6" initial="initial" animate="animate" variants={stagger}>
      <PageHeader title="Patients" subtitle="Manage patient records" icon={Users} actions={canManagePatients && (
        <motion.button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Plus size={16} /> New Patient
        </motion.button>
      )} />

      <motion.div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm" variants={fadeIn}>
        <form className="flex flex-wrap items-center gap-3" onSubmit={(e) => { e.preventDefault(); setPage(1); load(query); }}>
          <motion.div className="flex h-12 flex-1 min-w-[200px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4" whileFocus={{ scale: 1.01 }}>
            <Search size={18} className="text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search patients..." className="w-full border-none bg-transparent text-sm outline-none" />
          </motion.div>
          <motion.button type="submit" className="rounded-xl border border-slate-300 bg-slate-900 px-5 py-2.5 text-sm font-medium text-white" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            Search
          </motion.button>
        </form>
      </motion.div>

      {loading ? <TableSkeleton /> : filtered.length === 0 ? <EmptyState title="No patients found" description="Try a different search" /> : (
        <motion.div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" variants={stagger}>
          <AnimatePresence>
            {paged.map((row, idx) => (
              <motion.article key={row.id} className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: idx * 0.04 }} whileHover={{ y: -4 }}>
                <motion.div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 opacity-0 group-hover:opacity-100" animate={{ opacity: [0, 0.5, 0] }} transition={{ duration: 2, repeat: Infinity }} />
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <motion.div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 text-lg font-bold text-white shadow" whileHover={{ rotate: 5 }}>
                      {row.first_name?.charAt(0)}{row.last_name?.charAt(0)}
                    </motion.div>
                    <div className="min-w-0">
                      <p className="font-heading truncate font-semibold text-slate-900">{row.full_name}</p>
                      <p className="truncate text-xs text-slate-500">{row.gender === 'M' ? 'Male' : row.gender === 'F' ? 'Female' : 'Other'}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-2 truncate"><Phone size={12} className="shrink-0" /><span className="truncate">{row.phone}</span></div>
                    <div className="flex items-center gap-2 truncate"><Mail size={12} className="shrink-0" /><span className="truncate">{row.email || 'No email'}</span></div>
                    <div className="flex items-center gap-2"><Calendar size={12} className="shrink-0" /><span>{row.date_of_birth || 'No DOB'}</span></div>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-1.5">
                    <motion.button onClick={() => viewPatientDetails(row)} className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-600" whileHover={{ scale: 1.1 }}>View</motion.button>
                    {canManagePatients && (
                      <motion.button onClick={() => openEdit(row)} className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600" whileHover={{ scale: 1.1 }}>Edit</motion.button>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <motion.button disabled={page === 1} onClick={() => setPage(v => Math.max(1, v - 1))} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm disabled:opacity-50" whileHover={{ scale: page === 1 ? 1 : 1.02 }}>Previous</motion.button>
            <motion.button disabled={page === totalPages} onClick={() => setPage(v => Math.min(totalPages, v + 1))} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm disabled:opacity-50" whileHover={{ scale: page === totalPages ? 1 : 1.02 }}>Next</motion.button>
          </div>
        </div>
      )}

      <AppModal open={open && canManagePatients} onClose={() => setOpen(false)} title={editing ? 'Update Patient' : 'Add New Patient'}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1.5 block text-xs font-medium text-slate-600">First Name *</label><input {...register('first_name')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-300" /></div>
            <div><label className="mb-1.5 block text-xs font-medium text-slate-600">Last Name *</label><input {...register('last_name')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-300" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1.5 block text-xs font-medium text-slate-600">Email</label><input type="email" {...register('email')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-300" /></div>
            <div><label className="mb-1.5 block text-xs font-medium text-slate-600">Phone *</label><input {...register('phone')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-300" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1.5 block text-xs font-medium text-slate-600">Gender *</label><select {...register('gender')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-300"><option value="M">Male</option><option value="F">Female</option><option value="O">Other</option></select></div>
            <div><label className="mb-1.5 block text-xs font-medium text-slate-600">Date of Birth</label><input type="date" {...register('date_of_birth')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-300" /></div>
          </div>
          <div><label className="mb-1.5 block text-xs font-medium text-slate-600">Address</label><textarea {...register('address')} rows={2} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:border-blue-300" /></div>
          <motion.button disabled={isSubmitting} className="mt-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>{editing ? 'Update Patient' : 'Create Patient'}</motion.button>
        </form>
      </AppModal>

      <AppModal open={!!viewPatient} onClose={() => setViewPatient(null)} title={viewPatient?.full_name} size="lg">
        <motion.div className="space-y-6" initial="initial" animate="animate" variants={stagger}>
          <motion.div className="flex items-center gap-4" variants={fadeIn}>
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 text-xl font-bold text-white shadow">{viewPatient?.first_name?.charAt(0)}{viewPatient?.last_name?.charAt(0)}</div>
            <div><p className="font-heading text-xl font-semibold">{viewPatient?.full_name}</p><p className="text-sm text-slate-500">{viewPatient?.gender === 'M' ? 'Male' : viewPatient?.gender === 'F' ? 'Female' : 'Other'}</p></div>
          </motion.div>
          <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
            <div><p className="text-xs text-slate-400">Phone</p><p className="font-medium">{viewPatient?.phone}</p></div>
            <div><p className="text-xs text-slate-400">Email</p><p className="font-medium">{viewPatient?.email || 'N/A'}</p></div>
            <div><p className="text-xs text-slate-400">DOB</p><p className="font-medium">{viewPatient?.date_of_birth || 'N/A'}</p></div>
            <div className="col-span-2"><p className="text-xs text-slate-400">Address</p><p className="font-medium">{viewPatient?.address || 'N/A'}</p></div>
          </div>
          <div><p className="mb-3 text-sm font-semibold">Appointments ({viewAppointments.length})</p>
            {viewAppointments.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No appointments</p> : (
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-2">
                {viewAppointments.slice(0, 5).map((apt) => (
                  <motion.div key={apt.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3" whileHover={{ scale: 1.01 }}>
                    <div><p className="font-medium">{apt.doctor_name}</p><p className="text-xs text-slate-500">{apt.appointment_date}</p></div>
                    <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${apt.status === 'completed' ? 'bg-green-100 text-green-700' : apt.status === 'cancelled' ? 'bg-red-100 text-red-700' : apt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{apt.status}</span>
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