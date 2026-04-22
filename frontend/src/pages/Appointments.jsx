import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, CalendarDays, Clock, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { appointmentsAPI, doctorsAPI, patientsAPI } from '../api/services.js';
import AppModal from '../components/common/AppModal.jsx';
import { EmptyState, TableSkeleton } from '../components/common/LoadingState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';

const schema = z.object({
  patient: z.coerce.number().min(1),
  doctor: z.coerce.number().min(1),
  appointment_date: z.string().min(1),
  appointment_time: z.string().optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'pending']),
  notes: z.string().optional(),
});

const fadeIn = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
const stagger = { animate: { transition: { staggerChildren: 0.05 } } };

export default function Appointments() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterPatient, setFilterPatient] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({ resolver: zodResolver(schema), defaultValues: { status: 'scheduled' } });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterPatient) params.patient = filterPatient;
      if (filterDoctor) params.doctor = filterDoctor;
      const [a, p, d] = await Promise.all([appointmentsAPI.list(params), patientsAPI.list(), doctorsAPI.list()]);
      setRows(a.items);
      setPatients(p.items);
      setDoctors(d.items);
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); reset({ patient: '', doctor: '', appointment_date: '', appointment_time: '', status: 'scheduled', notes: '' }); setOpen(true); };
  const openEdit = (row) => { setEditing(row); reset({ patient: row.patient, doctor: row.doctor, appointment_date: row.appointment_date, appointment_time: row.appointment_time || '', status: row.status, notes: row.notes || '' }); setOpen(true); };
  const onSubmit = async (values) => {
    try {
      if (editing) { await appointmentsAPI.update(editing.id, values); toast.success('Appointment updated'); }
      else { await appointmentsAPI.create(values); toast.success('Appointment created'); }
      setOpen(false);
      await load();
    } catch { toast.error('Unable to save appointment'); }
  };
  const onDelete = async (id) => { try { await appointmentsAPI.delete(id); toast.success('Appointment deleted'); await load(); } catch { toast.error('Unable to delete appointment'); } };

  return (
    <motion.div className="space-y-6" initial="initial" animate="animate" variants={stagger}>
      <PageHeader title="Appointments" subtitle="Manage consultations and schedules" icon={CalendarDays} actions={
        <motion.button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Plus size={16} /> New Appointment
        </motion.button>
      } />

      <motion.div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm" variants={fadeIn}>
        <div className="flex items-center gap-2"><Filter size={16} className="text-slate-400" /><span className="text-sm font-medium text-slate-600">Filters:</span></div>
        <motion.select value={filterPatient} onChange={(e) => setFilterPatient(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" whileFocus={{ scale: 1.02 }}>
          <option value="">All patients</option>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </motion.select>
        <motion.select value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" whileFocus={{ scale: 1.02 }}>
          <option value="">All doctors</option>
          {doctors.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
        </motion.select>
        <motion.button onClick={load} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Apply</motion.button>
        {(filterPatient || filterDoctor) && <motion.button onClick={() => { setFilterPatient(''); setFilterDoctor(''); }} className="text-sm text-blue-600 hover:underline" whileHover={{ scale: 1.05 }}>Clear</motion.button>}
      </motion.div>

      {loading ? <TableSkeleton /> : rows.length === 0 ? <EmptyState title="No appointments" description="Create new appointments" /> : (
        <motion.div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden" variants={fadeIn}>
          <AnimatePresence>
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                  <th className="px-5 py-4 text-xs font-medium text-slate-500">Patient</th>
                  <th className="px-5 py-4 text-xs font-medium text-slate-500">Doctor</th>
                  <th className="px-5 py-4 text-xs font-medium text-slate-500">Date & Time</th>
                  <th className="px-5 py-4 text-xs font-medium text-slate-500">Status</th>
                  <th className="px-5 py-4 text-xs font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <motion.tr key={row.id} className="border-b border-slate-100 transition hover:bg-slate-50/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: idx * 0.03 }} whileHover={{ x: 4 }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <motion.div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-600" whileHover={{ rotate: 5 }}>
                          {row.patient_name?.charAt(0)}
                        </motion.div>
                        <span className="font-medium text-slate-900">{row.patient_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{row.doctor_name}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-slate-600"><Clock size={14} className="text-slate-400" /><span>{row.appointment_date}</span><span className="text-slate-400">|</span><span>{row.appointment_time || 'N/A'}</span></div>
                    </td>
                    <td className="px-5 py-4"><StatusBadge value={row.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <motion.button onClick={() => openEdit(row)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600" whileHover={{ scale: 1.1 }}>Edit</motion.button>
                        <motion.button onClick={() => onDelete(row.id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600" whileHover={{ scale: 1.1 }}>Delete</motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </AnimatePresence>
        </motion.div>
      )}

      <AppModal open={open} onClose={() => setOpen(false)} title={editing ? 'Update Appointment' : 'Create Appointment'}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1.5 block text-xs font-medium text-slate-600">Patient *</label><select {...register('patient')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"><option value="">Select patient</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></div>
            <div><label className="mb-1.5 block text-xs font-medium text-slate-600">Doctor *</label><select {...register('doctor')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"><option value="">Select doctor</option>{doctors.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}</select></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1.5 block text-xs font-medium text-slate-600">Date *</label><input type="date" {...register('appointment_date')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm" /></div>
            <div><label className="mb-1.5 block text-xs font-medium text-slate-600">Time</label><input type="time" {...register('appointment_time')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm" /></div>
          </div>
          <div><label className="mb-1.5 block text-xs font-medium text-slate-600">Status</label><select {...register('status')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option></select></div>
          <div><label className="mb-1.5 block text-xs font-medium text-slate-600">Notes</label><textarea {...register('notes')} rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm" placeholder="Add notes..." /></div>
          <motion.button disabled={isSubmitting} className="mt-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>{editing ? 'Update Appointment' : 'Create Appointment'}</motion.button>
        </form>
      </AppModal>
    </motion.div>
  );
}