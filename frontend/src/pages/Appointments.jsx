import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, CalendarDays, Clock, Filter, X, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { appointmentsAPI, doctorsAPI, patientsAPI } from '../api/services.js';
import AppModal from '../components/common/AppModal.jsx';
import { EmptyState, TableSkeleton } from '../components/common/LoadingState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { FormField, ConfirmDialog } from '../components/common/UIStates.jsx';

const schema = z.object({
  patient: z.coerce.number().min(1, 'Patient is required'),
  doctor: z.coerce.number().min(1, 'Doctor is required'),
  appointment_date: z.string().min(1, 'Date is required'),
  appointment_time: z.string().optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'pending']),
  notes: z.string().optional(),
});

export default function Appointments() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [filterPatient, setFilterPatient] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { status: 'scheduled' },
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterPatient) params.patient = filterPatient;
      if (filterDoctor) params.doctor = filterDoctor;
      
      // Simple client-side date filtering below since API might not support these exact text params
      // but we will fetch all matching patient/doctor and filter in memory if needed for 'dateFilter'
      
      const [a, p, d] = await Promise.all([
        appointmentsAPI.list(params),
        patientsAPI.list(),
        doctorsAPI.list()
      ]);
      setRows(a.items || []);
      setPatients(p.items || []);
      setDoctors(d.items || []);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterPatient, filterDoctor]);

  const openCreate = () => {
    setEditing(null);
    reset({ patient: '', doctor: '', appointment_date: '', appointment_time: '', status: 'scheduled', notes: '' });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    reset({
      patient: row.patient,
      doctor: row.doctor,
      appointment_date: row.appointment_date,
      appointment_time: row.appointment_time || '',
      status: row.status,
      notes: row.notes || ''
    });
    setOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      if (editing) {
        await appointmentsAPI.update(editing.id, values);
        toast.success('Appointment updated');
      } else {
        await appointmentsAPI.create(values);
        toast.success('Appointment created');
      }
      setOpen(false);
      await load();
    } catch {
      toast.error('Unable to save appointment');
    }
  };

  const confirmDelete = (id) => setDeleteId(id);
  
  const onDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await appointmentsAPI.delete(deleteId);
      toast.success('Appointment deleted');
      await load();
    } catch {
      toast.error('Unable to delete appointment');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const filteredRows = rows.filter(row => {
    if (dateFilter === 'all') return true;
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    if (dateFilter === 'today') return row.appointment_date === today;
    if (dateFilter === 'tomorrow') return row.appointment_date === tomorrow;
    if (dateFilter === 'week') {
      const rowDate = new Date(row.appointment_date);
      const now = new Date();
      const diffTime = Math.abs(rowDate - now);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && rowDate >= new Date(today);
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full">
      <PageHeader
        title="Appointments"
        subtitle="Manage consultations and schedules"
        actions={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> New Appointment
          </button>
        }
      />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${dateFilter === 'all' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              All
            </button>
            <button
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${dateFilter === 'today' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              Today
            </button>
            <button
              onClick={() => setDateFilter('tomorrow')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${dateFilter === 'tomorrow' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              Tomorrow
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${dateFilter === 'week' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              This week
            </button>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterPatient}
              onChange={(e) => setFilterPatient(e.target.value)}
              className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            >
              <option value="">All patients</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
            <select
              value={filterDoctor}
              onChange={(e) => setFilterDoctor(e.target.value)}
              className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            >
              <option value="">All doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.full_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-5"><TableSkeleton rows={5} /></div>
          ) : filteredRows.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No appointments found" description="Adjust your filters or create a new appointment." />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60 dark:bg-slate-900/40">
                <tr>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date & Time</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Patient</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Doctor</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="h-10 px-5 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{row.appointment_date}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{row.appointment_time || 'Time TBD'}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-medium shrink-0">
                          {row.patient_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">{row.patient_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{row.doctor_name || 'Unassigned'}</td>
                    <td className="px-5 py-3">
                      <StatusBadge value={row.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(row)}
                          className="inline-flex items-center gap-2 h-8 px-3 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(row.id)}
                          className="inline-flex items-center gap-2 h-8 px-3 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AppModal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Update Appointment' : 'New Appointment'}
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium disabled:opacity-50"
            >
              {editing ? 'Save Changes' : 'Create'}
            </button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Patient"
              name="patient"
              type="select"
              options={patients.map(p => ({ value: p.id, label: p.full_name }))}
              value={register('patient').value}
              {...register('patient')}
              error={errors.patient?.message}
              touched={!!errors.patient}
              required
            />
            <FormField
              label="Doctor"
              name="doctor"
              type="select"
              options={doctors.map(d => ({ value: d.id, label: d.full_name }))}
              value={register('doctor').value}
              {...register('doctor')}
              error={errors.doctor?.message}
              touched={!!errors.doctor}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Date"
              name="appointment_date"
              type="date"
              {...register('appointment_date')}
              error={errors.appointment_date?.message}
              touched={!!errors.appointment_date}
              required
            />
            <FormField
              label="Time"
              name="appointment_time"
              type="time"
              {...register('appointment_time')}
              error={errors.appointment_time?.message}
              touched={!!errors.appointment_time}
            />
          </div>
          <FormField
            label="Status"
            name="status"
            type="select"
            options={[
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'pending', label: 'Pending' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            {...register('status')}
            error={errors.status?.message}
            touched={!!errors.status}
          />
          <FormField
            label="Notes"
            name="notes"
            type="textarea"
            placeholder="Add any notes..."
            rows={3}
            {...register('notes')}
            error={errors.notes?.message}
            touched={!!errors.notes}
          />
        </form>
      </AppModal>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Appointment"
        message="Are you sure you want to delete this appointment? This action cannot be undone."
        onConfirm={onDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={isDeleting}
        isDangerous={true}
      />
    </div>
  );
}
