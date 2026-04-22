import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Download, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { appointmentsAPI, doctorsAPI, medicalReportsAPI, patientsAPI } from '../api/services.js';
import AppModal from '../components/common/AppModal.jsx';
import { EmptyState, TableSkeleton } from '../components/common/LoadingState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { FormField, ConfirmDialog } from '../components/common/UIStates.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { hasPermission } from '../lib/permissions.js';

const schema = z.object({
  patient: z.coerce.number().min(1, 'Patient is required'),
  doctor: z.coerce.number().optional(),
  appointment: z.coerce.number().optional(),
  report_type: z.enum(['consultation', 'lab', 'radiology', 'discharge', 'surgery', 'follow_up']),
  status: z.enum(['draft', 'final', 'amended']),
  title: z.string().min(3, 'Title is required'),
  summary: z.string().optional(),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
});

export default function MedicalReports() {
  const { user } = useAuth();
  const canManageReports = hasPermission(user?.role, 'medicalReports.manage');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  
  const [patientFilter, setPatientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
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
      setRows(reports.items || []);
      setPatients(p.items || []);
      setDoctors(d.items || []);
      setAppointments(a.items || []);
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

  const confirmDelete = (id) => setDeleteId(id);
  
  const onDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await medicalReportsAPI.delete(deleteId);
      toast.success('Medical report deleted');
      await load();
    } catch {
      toast.error('Unable to delete medical report');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleDownload = (e, row) => {
    e.stopPropagation();
    toast.success(`Downloading ${row.title}...`);
    // Stub for actual download
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full">
      <PageHeader
        title="Medical Reports"
        subtitle="Create and track structured clinical reports across consultations and diagnostics."
        actions={
          canManageReports ? (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> New Report
            </button>
          ) : null
        }
      />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Patient:</label>
            <select
              value={patientFilter}
              onChange={(event) => setPatientFilter(event.target.value)}
              className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 flex-1 sm:w-48"
            >
              <option value="">All patients</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>{patient.full_name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Status:</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 flex-1 sm:w-40"
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="final">Final</option>
              <option value="amended">Amended</option>
            </select>
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-5"><TableSkeleton rows={6} /></div>
          ) : rows.length === 0 ? (
            <EmptyState icon={FileText} title="No medical reports" description="Create your first report to start documenting structured clinical summaries." />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60 dark:bg-slate-900/40">
                <tr>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Report</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Patient</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Doctor</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Type</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="h-10 px-5 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">{row.title}</div>
                          <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">{row.created_at?.slice(0, 10) || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{row.patient_name}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{row.doctor_name || 'Unassigned'}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300 capitalize">{row.report_type.replace('_', ' ')}</td>
                    <td className="px-5 py-3">
                      <StatusBadge value={row.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => handleDownload(e, row)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {canManageReports ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(row)}
                              className="inline-flex items-center gap-2 h-8 px-3 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDelete(row.id)}
                              className="inline-flex items-center gap-2 h-8 px-3 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        ) : null}
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
        open={open && canManageReports}
        onClose={() => setOpen(false)}
        title={editing ? 'Update Medical Report' : 'New Medical Report'}
        size="lg"
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
              {editing ? 'Save Changes' : 'Create Report'}
            </button>
          </>
        }
      >
        <div className="mb-4 rounded-md bg-blue-50 dark:bg-blue-950/40 p-3 flex items-start gap-3 border border-blue-100 dark:border-blue-900/50">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium">PDF Generation</p>
            <p className="mt-0.5 opacity-90">Saving this report as 'Final' will automatically generate a PDF available for download.</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Patient"
              name="patient"
              type="select"
              register={register}
              options={patients.map(p => ({ value: p.id, label: p.full_name }))}
              error={errors.patient?.message}
              touched={!!errors.patient}
              required
            />
            <FormField
              label="Doctor"
              name="doctor"
              type="select"
              register={register}
              options={doctors.map(d => ({ value: d.id, label: d.full_name }))}
              error={errors.doctor?.message}
              touched={!!errors.doctor}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              label="Report Type"
              name="report_type"
              type="select"
              register={register}
              options={[
                { value: 'consultation', label: 'Consultation' },
                { value: 'lab', label: 'Lab Report' },
                { value: 'radiology', label: 'Radiology' },
                { value: 'discharge', label: 'Discharge Summary' },
                { value: 'surgery', label: 'Surgery Note' },
                { value: 'follow_up', label: 'Follow Up' },
              ]}
              error={errors.report_type?.message}
              touched={!!errors.report_type}
            />
            <FormField
              label="Status"
              name="status"
              type="select"
              register={register}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'final', label: 'Final' },
                { value: 'amended', label: 'Amended' },
              ]}
              error={errors.status?.message}
              touched={!!errors.status}
            />
            <FormField
              label="Related Appt (Optional)"
              name="appointment"
              type="select"
              register={register}
              options={appointments.map(a => ({ value: a.id, label: `${a.appointment_date} - ${a.patient_name}` }))}
              error={errors.appointment?.message}
              touched={!!errors.appointment}
            />
          </div>

          <FormField
            label="Report Title"
            name="title"
            register={register}
            error={errors.title?.message}
            touched={!!errors.title}
            required
          />

          <FormField
            label="Summary"
            name="summary"
            type="textarea"
            rows={2}
            register={register}
            error={errors.summary?.message}
            touched={!!errors.summary}
          />
          
          <FormField
            label="Findings"
            name="findings"
            type="textarea"
            rows={4}
            register={register}
            error={errors.findings?.message}
            touched={!!errors.findings}
          />
          
          <FormField
            label="Recommendations"
            name="recommendations"
            type="textarea"
            rows={3}
            register={register}
            error={errors.recommendations?.message}
            touched={!!errors.recommendations}
          />
        </form>
      </AppModal>

      <ConfirmDialog
        isOpen={!!deleteId && canManageReports}
        title="Delete Medical Report"
        message="Are you sure you want to delete this report? This action cannot be undone."
        onConfirm={onDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={isDeleting}
        isDangerous={true}
      />
    </div>
  );
}
