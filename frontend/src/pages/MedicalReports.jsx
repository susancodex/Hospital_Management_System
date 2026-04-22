import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { appointmentsAPI, doctorsAPI, medicalReportsAPI, patientsAPI } from '../api/services.js';
import AppModal from '../components/common/AppModal.jsx';
import { EmptyState, TableSkeleton } from '../components/common/LoadingState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';

const schema = z.object({
  patient: z.coerce.number().min(1),
  doctor: z.coerce.number().optional(),
  appointment: z.coerce.number().optional(),
  report_type: z.enum(['consultation', 'lab', 'radiology', 'discharge', 'surgery', 'follow_up']),
  status: z.enum(['draft', 'final', 'amended']),
  title: z.string().min(3),
  summary: z.string().optional(),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
});

export default function MedicalReports() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patientFilter, setPatientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { report_type: 'consultation', status: 'draft' },
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (patientFilter) params.patient = patientFilter;
      if (statusFilter) params.status = statusFilter;

      const [reports, p, d, a] = await Promise.all([
        medicalReportsAPI.list(params),
        patientsAPI.list(),
        doctorsAPI.list(),
        appointmentsAPI.list(),
      ]);
      setRows(reports.items);
      setPatients(p.items);
      setDoctors(d.items);
      setAppointments(a.items);
    } catch {
      toast.error('Failed to load medical reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [patientFilter, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    reset({
      patient: '',
      doctor: '',
      appointment: '',
      report_type: 'consultation',
      status: 'draft',
      title: '',
      summary: '',
      findings: '',
      recommendations: '',
    });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    reset({
      patient: row.patient,
      doctor: row.doctor || '',
      appointment: row.appointment || '',
      report_type: row.report_type,
      status: row.status,
      title: row.title,
      summary: row.summary || '',
      findings: row.findings || '',
      recommendations: row.recommendations || '',
    });
    setOpen(true);
  };

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      doctor: values.doctor || null,
      appointment: values.appointment || null,
    };

    try {
      if (editing) {
        await medicalReportsAPI.update(editing.id, payload);
        toast.success('Medical report updated');
      } else {
        await medicalReportsAPI.create(payload);
        toast.success('Medical report created');
      }
      setOpen(false);
      await load();
    } catch {
      toast.error('Unable to save medical report');
    }
  };

  const onDelete = async (id) => {
    try {
      await medicalReportsAPI.delete(id);
      toast.success('Medical report deleted');
      await load();
    } catch {
      toast.error('Unable to delete medical report');
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Medical Reports"
        subtitle="Create and track structured clinical reports across consultations and diagnostics."
        actions={
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
            <Plus size={15} /> New report
          </button>
        }
      />

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs text-slate-500">Filter by patient</label>
          <select value={patientFilter} onChange={(event) => setPatientFilter(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="">All patients</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>{patient.full_name || `${patient.first_name} ${patient.last_name}`}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Filter by status</label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="final">Final</option>
            <option value="amended">Amended</option>
          </select>
        </div>
      </section>

      {loading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState title="No medical reports" description="Create your first report to start documenting structured clinical summaries." />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2">Title</th>
                  <th className="py-2">Patient</th>
                  <th className="py-2">Doctor</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Created</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 align-top">
                    <td className="py-3">
                      <div className="flex items-start gap-2">
                        <FileText size={15} className="mt-0.5 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">{row.title}</p>
                          <p className="text-xs text-slate-500">{row.summary || 'No summary'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-slate-800">{row.patient_name}</td>
                    <td className="py-3 text-slate-700">{row.doctor_name || 'Unassigned'}</td>
                    <td className="py-3 text-slate-700">{row.report_type.replace('_', ' ')}</td>
                    <td className="py-3"><StatusBadge value={row.status} /></td>
                    <td className="py-3 text-slate-600">{row.created_at?.slice(0, 10) || 'N/A'}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(row)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs">Edit</button>
                        <button onClick={() => onDelete(row.id)} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-600">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AppModal open={open} onClose={() => setOpen(false)} title={editing ? 'Update Medical Report' : 'Create Medical Report'}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Patient</label>
            <select {...register('patient')} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">Select patient</option>
              {patients.map((item) => (
                <option key={item.id} value={item.id}>{item.full_name || `${item.first_name} ${item.last_name}`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Doctor (optional)</label>
            <select {...register('doctor')} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">Select doctor</option>
              {doctors.map((item) => (
                <option key={item.id} value={item.id}>{item.full_name || `Dr. ${item.first_name} ${item.last_name}`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Appointment (optional)</label>
            <select {...register('appointment')} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">Select appointment</option>
              {appointments.map((item) => (
                <option key={item.id} value={item.id}>{item.patient_name} - {item.appointment_date}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Report type</label>
            <select {...register('report_type')} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="consultation">Consultation</option>
              <option value="lab">Lab Report</option>
              <option value="radiology">Radiology</option>
              <option value="discharge">Discharge Summary</option>
              <option value="surgery">Surgery Note</option>
              <option value="follow_up">Follow Up</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Status</label>
            <select {...register('status')} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="draft">Draft</option>
              <option value="final">Final</option>
              <option value="amended">Amended</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-slate-500">Title</label>
            <input {...register('title')} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-slate-500">Summary</label>
            <textarea {...register('summary')} rows={2} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-slate-500">Findings</label>
            <textarea {...register('findings')} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-slate-500">Recommendations</label>
            <textarea {...register('recommendations')} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <button disabled={isSubmitting} className="mt-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white md:col-span-2">
            {editing ? 'Update report' : 'Create report'}
          </button>
        </form>
      </AppModal>
    </div>
  );
}
