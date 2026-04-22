import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { appointmentsAPI, billingAPI, patientsAPI } from '../api/services.js';
import AppModal from '../components/common/AppModal.jsx';
import { EmptyState, TableSkeleton } from '../components/common/LoadingState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';

const schema = z.object({
  patient: z.coerce.number().min(1),
  appointment: z.coerce.number().optional(),
  amount: z.coerce.number().min(0),
  status: z.enum(['paid', 'unpaid', 'partial']),
  description: z.string().optional(),
});

export default function Billing() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { status: 'unpaid' },
  });

  const load = async () => {
    setLoading(true);
    try {
      const [b, p, a] = await Promise.all([
        billingAPI.list(),
        patientsAPI.list(),
        appointmentsAPI.list(),
      ]);
      setRows(b.items);
      setPatients(p.items);
      setAppointments(a.items);
    } catch {
      toast.error('Failed to load billing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const paid = rows.filter((row) => row.status === 'paid').reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const unpaid = rows.filter((row) => row.status === 'unpaid').reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const partial = rows.filter((row) => row.status === 'partial').reduce((sum, row) => sum + Number(row.amount || 0), 0);
    return { total, paid, unpaid, partial };
  }, [rows]);

  const openCreate = () => {
    setEditing(null);
    reset({ patient: '', appointment: '', amount: 0, status: 'unpaid', description: '' });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    reset({
      patient: row.patient,
      appointment: row.appointment || '',
      amount: Number(row.amount),
      status: row.status,
      description: row.description || '',
    });
    setOpen(true);
  };

  const onSubmit = async (values) => {
    const payload = { ...values, appointment: values.appointment || null };
    try {
      if (editing) {
        await billingAPI.update(editing.id, payload);
        toast.success('Billing entry updated');
      } else {
        await billingAPI.create(payload);
        toast.success('Billing entry created');
      }
      setOpen(false);
      await load();
    } catch {
      toast.error('Unable to save billing entry');
    }
  };

  const onDelete = async (id) => {
    try {
      await billingAPI.delete(id);
      toast.success('Billing entry deleted');
      await load();
    } catch {
      toast.error('Unable to delete billing entry');
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Billing"
        subtitle="Track patient invoices and payment status in one revenue hub."
        actions={<button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"><Plus size={15} /> New bill</button>}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total billed', summary.total],
          ['Paid', summary.paid],
          ['Unpaid', summary.unpaid],
          ['Partial', summary.partial],
        ].map(([label, amount]) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">${Number(amount).toFixed(2)}</p>
          </article>
        ))}
      </section>

      {loading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState title="No billing entries" description="Create invoices to start tracking collections." />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2">Patient</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Description</th>
                  <th className="py-2">Created</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="py-3 text-slate-800">{row.patient_name}</td>
                    <td className="py-3 text-slate-800">${Number(row.amount).toFixed(2)}</td>
                    <td className="py-3"><StatusBadge value={row.status} /></td>
                    <td className="py-3 text-slate-600">{row.description || 'N/A'}</td>
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

      <AppModal open={open} onClose={() => setOpen(false)} title={editing ? 'Update Billing Entry' : 'Create Billing Entry'}>
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
            <label className="mb-1 block text-xs text-slate-500">Appointment (optional)</label>
            <select {...register('appointment')} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">Select appointment</option>
              {appointments.map((item) => (
                <option key={item.id} value={item.id}>{item.patient_name} - {item.appointment_date}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Amount</label>
            <input type="number" step="0.01" {...register('amount')} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Status</label>
            <select {...register('status')} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-slate-500">Description</label>
            <textarea {...register('description')} rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <button disabled={isSubmitting} className="mt-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white md:col-span-2">
            {editing ? 'Update entry' : 'Create entry'}
          </button>
        </form>
      </AppModal>
    </div>
  );
}
