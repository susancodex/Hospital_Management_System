import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Eye, Download, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { doctorsAPI, medicalRecordsAPI, patientsAPI } from '../api/services.js';
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
  diagnosis: z.string().min(3, 'Diagnosis is required'),
  treatment: z.string().optional(),
  notes: z.string().optional(),
});

export default function MedicalRecords() {
  const { user } = useAuth();
  const canManageRecords = hasPermission(user?.role, 'medicalRecords.manage');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  
  const [patientFilter, setPatientFilter] = useState('');
  
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  
  const [viewRecord, setViewRecord] = useState(null);
  
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { patient: '', doctor: '', diagnosis: '', treatment: '', notes: '' }
  });

  const load = async () => {
    setLoading(true);
    try {
      const [records, p, d] = await Promise.all([
        medicalRecordsAPI.list(patientFilter ? { patient: patientFilter } : {}),
        patientsAPI.list(),
        doctorsAPI.list(),
      ]);
      setRows(records.items || []);
      setPatients(p.items || []);
      setDoctors(d.items || []);
    } catch {
      toast.error('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [patientFilter]);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.record_date.localeCompare(a.record_date)),
    [rows],
  );

  const openCreate = () => {
    setEditing(null);
    reset({ patient: '', doctor: '', diagnosis: '', treatment: '', notes: '' });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    reset({
      patient: row.patient,
      doctor: row.doctor || '',
      diagnosis: row.diagnosis,
      treatment: row.treatment || '',
      notes: row.notes || '',
    });
    setOpen(true);
  };

  const onSubmit = async (values) => {
    const payload = { ...values, doctor: values.doctor || null };
    try {
      if (editing) {
        await medicalRecordsAPI.update(editing.id, payload);
        toast.success('Medical record updated');
      } else {
        await medicalRecordsAPI.create(payload);
        toast.success('Medical record created');
      }
      setOpen(false);
      await load();
    } catch {
      toast.error('Unable to save medical record');
    }
  };

  const confirmDelete = (id) => setDeleteId(id);
  
  const onDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await medicalRecordsAPI.delete(deleteId);
      toast.success('Medical record deleted');
      await load();
    } catch {
      toast.error('Unable to delete medical record');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full">
      <PageHeader
        title="Medical Records"
        subtitle="Clinical timeline for diagnoses, treatment plans, and physician notes."
        actions={
          canManageRecords ? (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Record
            </button>
          ) : null
        }
      />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter:</span>
            <select
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
              className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 w-64"
            >
              <option value="">All patients</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-5"><TableSkeleton rows={6} /></div>
          ) : sorted.length === 0 ? (
            <EmptyState icon={FileText} title="No records found" description="No medical records exist for the selected filters." />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60 dark:bg-slate-900/40">
                <tr>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Patient</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Doctor</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Diagnosis</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="h-10 px-5 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-5 py-3 font-mono text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {row.record_date}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {row.patient_name}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {row.doctor_name || 'Unassigned'}
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={row.diagnosis}>
                      {row.diagnosis}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <StatusBadge value={row.is_signed ? 'final' : 'draft'} />
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewRecord(row)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canManageRecords ? (
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
        open={open && canManageRecords}
        onClose={() => setOpen(false)}
        title={editing ? 'Update Medical Record' : 'New Medical Record'}
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
          <FormField
            label="Diagnosis"
            name="diagnosis"
            type="textarea"
            rows={2}
            register={register}
            error={errors.diagnosis?.message}
            touched={!!errors.diagnosis}
            required
          />
          <FormField
            label="Treatment Plan"
            name="treatment"
            type="textarea"
            rows={3}
            register={register}
            error={errors.treatment?.message}
            touched={!!errors.treatment}
          />
          <FormField
            label="Physician Notes"
            name="notes"
            type="textarea"
            rows={3}
            register={register}
            error={errors.notes?.message}
            touched={!!errors.notes}
          />
        </form>
      </AppModal>

      <AppModal
        open={!!viewRecord}
        onClose={() => setViewRecord(null)}
        title="Clinical Record Details"
        subtitle={`Record for ${viewRecord?.patient_name} on ${viewRecord?.record_date}`}
        size="md"
        footer={
          <button
            onClick={() => setViewRecord(null)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium"
          >
            Close
          </button>
        }
      >
        {viewRecord && (
          <dl className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Record State</dt>
                <dd><StatusBadge value={viewRecord.is_signed ? 'final' : 'draft'} /></dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Attending Physician</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100">{viewRecord.doctor_name || 'N/A'}</dd>
              </div>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Diagnosis</dt>
              <dd className="text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border border-slate-100 dark:border-slate-800">{viewRecord.diagnosis}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Treatment Plan</dt>
              <dd className="text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">{viewRecord.treatment || 'No treatment plan specified.'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Physician Notes</dt>
              <dd className="text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">{viewRecord.notes || 'No notes.'}</dd>
            </div>
          </dl>
        )}
      </AppModal>

      <ConfirmDialog
        isOpen={!!deleteId && canManageRecords}
        title="Delete Medical Record"
        message="Are you sure you want to delete this record? This action cannot be undone."
        onConfirm={onDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={isDeleting}
        isDangerous={true}
      />
    </div>
  );
}
