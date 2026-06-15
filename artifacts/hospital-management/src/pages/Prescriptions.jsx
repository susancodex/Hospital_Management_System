import { useEffect, useState, useCallback } from 'react';
import { Plus, Pill, Trash2, Eye, Edit3, CheckCircle, XCircle, Download, QrCode, X } from 'lucide-react';
import { toast } from 'sonner';
import { prescriptionsAPI, patientsAPI, appointmentsAPI } from '../api/services.js';
import { useAuth } from '../hooks/useAuth.js';
import { useAuthStore } from '../store/authStore.js';
import AppModal from '../components/common/AppModal.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { TableSkeleton, EmptyState } from '../components/common/LoadingState.jsx';

const API = import.meta.env.VITE_API_URL || '/api';

const EMPTY_MED = { name: '', dosage: '', frequency: '', duration: '' };

export default function Prescriptions() {
  const { user } = useAuth();
  const token = useAuthStore((s) => s.token);
  const isDoctor = user?.role === 'doctor' || user?.role === 'admin';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [qrItem, setQrItem] = useState(null);

  const [form, setForm] = useState({
    patient_id: '',
    appointment_id: '',
    medicines: [{ ...EMPTY_MED }],
    instructions: '',
    status: 'active',
    valid_until: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await prescriptionsAPI.list();
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    if (isDoctor) {
      patientsAPI.list().then((r) => setPatients(r.items || [])).catch(() => {});
      appointmentsAPI.list().then((r) => setAppointments(r.items || [])).catch(() => {});
    }
  }, [load, isDoctor]);

  const openCreate = () => {
    setForm({ patient_id: '', appointment_id: '', medicines: [{ ...EMPTY_MED }], instructions: '', status: 'active', valid_until: '' });
    setShowCreate(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      patient_id: item.patient_id ?? '',
      appointment_id: item.appointment_id ?? '',
      medicines: item.medicines?.length ? item.medicines : [{ ...EMPTY_MED }],
      instructions: item.instructions ?? '',
      status: item.status ?? 'active',
      valid_until: item.valid_until ?? '',
    });
  };

  const addMedicine = () => setForm((f) => ({ ...f, medicines: [...f.medicines, { ...EMPTY_MED }] }));
  const removeMedicine = (i) => setForm((f) => ({ ...f, medicines: f.medicines.filter((_, idx) => idx !== i) }));
  const updateMedicine = (i, field, value) =>
    setForm((f) => ({ ...f, medicines: f.medicines.map((m, idx) => idx === i ? { ...m, [field]: value } : m) }));

  const handleSubmit = async () => {
    if (!form.patient_id) { toast.error('Patient is required'); return; }
    if (!form.medicines.some((m) => m.name.trim())) { toast.error('At least one medicine is required'); return; }
    setSubmitting(true);
    try {
      if (editItem) {
        await prescriptionsAPI.update(editItem.id, form);
        toast.success('Prescription updated');
        setEditItem(null);
      } else {
        await prescriptionsAPI.create(form);
        toast.success('Prescription created');
        setShowCreate(false);
      }
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save prescription');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSubmitting(true);
    try {
      await prescriptionsAPI.delete(deleteItem.id);
      toast.success('Prescription deleted');
      setDeleteItem(null);
      load();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadPrescription = async (item) => {
    try {
      toast.loading('Generating PDF…', { id: 'rx-pdf' });
      const res = await fetch(`${API}/export/prescription/${item.id}/?format=pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription-${item.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Prescription PDF downloaded', { id: 'rx-pdf' });
    } catch {
      toast.error('Failed to download PDF', { id: 'rx-pdf' });
    }
  };

  const handleShowQR = async (item) => {
    try {
      const res = await fetch(`${API}/prescriptions/${item.id}/qr/?format=svg`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('QR generation failed');
      const svg = await res.text();
      setQrItem({ ...item, svg });
    } catch {
      toast.error('Failed to generate QR code');
    }
  };

  const formModal = (
    <div className="space-y-4">
      {isDoctor && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Patient *</label>
            <select
              value={form.patient_id}
              onChange={(e) => setForm((f) => ({ ...f, patient_id: e.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
            >
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.user_id || p.id} value={p.user_id || p.id}>
                  {p.first_name} {p.last_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Linked Appointment</label>
            <select
              value={form.appointment_id}
              onChange={(e) => setForm((f) => ({ ...f, appointment_id: e.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
            >
              <option value="">None</option>
              {appointments.map((a) => (
                <option key={a.id} value={a.id}>#{a.id} — {a.date}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Medicines *</label>
          <button type="button" onClick={addMedicine} className="text-xs text-teal-700 dark:text-teal-400 hover:underline">+ Add medicine</button>
        </div>
        <div className="space-y-2">
          {form.medicines.map((med, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 items-start p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
              <input
                placeholder="Medicine name *"
                value={med.name}
                onChange={(e) => updateMedicine(i, 'name', e.target.value)}
                className="h-9 col-span-4 sm:col-span-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm"
              />
              <input
                placeholder="Dosage"
                value={med.dosage}
                onChange={(e) => updateMedicine(i, 'dosage', e.target.value)}
                className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm"
              />
              <input
                placeholder="Frequency"
                value={med.frequency}
                onChange={(e) => updateMedicine(i, 'frequency', e.target.value)}
                className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm"
              />
              <input
                placeholder="Duration"
                value={med.duration}
                onChange={(e) => updateMedicine(i, 'duration', e.target.value)}
                className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm"
              />
              {form.medicines.length > 1 && (
                <button type="button" onClick={() => removeMedicine(i)} className="text-rose-500 hover:text-rose-700 text-xs">Remove</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Instructions</label>
        <textarea
          value={form.instructions}
          onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
          rows={3}
          placeholder="Take with food, avoid alcohol, etc."
          className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Valid Until</label>
          <input
            type="date"
            value={form.valid_until}
            onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
            className="h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
          />
        </div>
      </div>
    </div>
  );

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={() => { setShowCreate(false); setEditItem(null); }}
        className="inline-flex h-9 items-center px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="inline-flex h-9 items-center gap-2 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium disabled:opacity-50"
      >
        {submitting ? 'Saving…' : editItem ? 'Update' : 'Create Prescription'}
      </button>
    </>
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full">
      <PageHeader
        title="Prescriptions"
        subtitle={isDoctor ? 'Create and manage patient prescriptions' : 'View your active prescriptions'}
        kicker="Clinical"
        actions={isDoctor ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium"
          >
            <Plus size={16} /> New Prescription
          </button>
        ) : null}
      />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} />
        ) : items.length === 0 ? (
          <div className="p-8">
            <EmptyState icon={Pill} title="No prescriptions found" description={isDoctor ? 'Create your first prescription.' : 'No prescriptions issued yet.'} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">ID</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Patient</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Doctor</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Medicines</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Valid Until</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="h-10 px-5 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">#{item.id}</td>
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{item.patient_name || `Patient #${item.patient_id}`}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{item.doctor_name || `Dr. #${item.doctor_id}`}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <Pill size={13} className="text-teal-600" />
                        {(item.medicines || []).length} medicine{(item.medicines || []).length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{item.valid_until || '—'}</td>
                    <td className="px-5 py-3"><StatusBadge value={item.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewItem(item)}
                          title="View"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadPrescription(item)}
                          title="Download PDF"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShowQR(item)}
                          title="Show QR Code"
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-slate-200 dark:border-slate-700 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                        >
                          <QrCode size={14} />
                        </button>
                        {isDoctor && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              title="Edit"
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteItem(item)}
                              title="Delete"
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-rose-200 dark:border-rose-900/50 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View modal */}
      <AppModal open={!!viewItem} onClose={() => setViewItem(null)} title={`Prescription #${viewItem?.id}`} size="md">
        {viewItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-slate-500 text-xs mb-0.5">Patient</p><p className="font-medium">{viewItem.patient_name || `#${viewItem.patient_id}`}</p></div>
              <div><p className="text-slate-500 text-xs mb-0.5">Doctor</p><p className="font-medium">{viewItem.doctor_name || `#${viewItem.doctor_id}`}</p></div>
              <div><p className="text-slate-500 text-xs mb-0.5">Valid Until</p><p>{viewItem.valid_until || '—'}</p></div>
              <div><p className="text-slate-500 text-xs mb-0.5">Status</p><StatusBadge value={viewItem.status} /></div>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Medicines</p>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/60">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Medicine</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Dosage</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Frequency</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(viewItem.medicines || []).map((m, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 font-medium">{m.name}</td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{m.dosage || '—'}</td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{m.frequency || '—'}</td>
                        <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{m.duration || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {viewItem.instructions && (
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Instructions</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3">{viewItem.instructions}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleShowQR(viewItem)}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-teal-600 text-teal-700 dark:text-teal-300 text-sm font-medium hover:bg-teal-50 dark:hover:bg-teal-950/30"
              >
                <QrCode size={14} /> QR Code
              </button>
              <button
                type="button"
                onClick={() => downloadPrescription(viewItem)}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium"
              >
                <Download size={14} /> Download PDF
              </button>
            </div>
          </div>
        )}
      </AppModal>

      {/* Create modal */}
      {/* QR Code Modal */}
      {qrItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Prescription QR Code</p>
                <p className="text-xs text-slate-400">Scan to verify authenticity</p>
              </div>
              <button onClick={() => setQrItem(null)} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 flex flex-col items-center gap-3">
              <div
                className="w-48 h-48 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: qrItem.svg }}
              />
              <p className="text-xs text-center text-slate-500">
                Patient: <strong>{qrItem.patient_name || `#${qrItem.patient_id}`}</strong>
                <br />Prescription #{qrItem.id} · {qrItem.status}
              </p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 text-center bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                ⚠️ For authorized medical & pharmacist use only
              </p>
            </div>
          </div>
        </div>
      )}

      <AppModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Prescription"
        size="lg"
        footer={modalFooter}
      >
        {formModal}
      </AppModal>

      {/* Edit modal */}
      <AppModal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        title={`Edit Prescription #${editItem?.id}`}
        size="lg"
        footer={modalFooter}
      >
        {formModal}
      </AppModal>

      {/* Delete confirm */}
      <AppModal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="Delete Prescription"
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setDeleteItem(null)} className="inline-flex h-9 items-center px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50">
              Cancel
            </button>
            <button type="button" onClick={handleDelete} disabled={submitting} className="inline-flex h-9 items-center px-4 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium disabled:opacity-50">
              {submitting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">Are you sure you want to delete Prescription <strong>#{deleteItem?.id}</strong>? This action cannot be undone.</p>
      </AppModal>
    </div>
  );
}
