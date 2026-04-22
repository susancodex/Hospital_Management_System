import { zodResolver } from '@hookform/resolvers/zod';
import { Download, Plus, Wallet, Pencil, Trash2, ReceiptText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import apiClient from '../api/client.js';
import { appointmentsAPI, billingAPI, billingPaymentsAPI, patientsAPI } from '../api/services.js';
import AppModal from '../components/common/AppModal.jsx';
import { EmptyState, TableSkeleton } from '../components/common/LoadingState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const schema = z.object({
  patient: z.coerce.number().min(1),
  appointment: z.coerce.number().optional(),
  amount: z.coerce.number().min(0),
  status: z.enum(['paid', 'unpaid', 'partial', 'insurance_pending', 'written_off']),
  due_date: z.string().optional(),
  insurance_provider: z.string().optional(),
  insurance_claim_number: z.string().optional(),
  description: z.string().optional(),
});

const paymentSchema = z.object({
  billing: z.coerce.number().min(1),
  amount: z.coerce.number().positive(),
  payment_method: z.enum(['cash', 'card', 'bank', 'upi', 'insurance']),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});

const fieldBase = (isDark) =>
  `w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${isDark ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-900/30' : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100'}`;

const actionButton = (isDark, tone = 'neutral') => {
  if (tone === 'success') return isDark ? 'border-emerald-800 bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100';
  if (tone === 'danger') return isDark ? 'border-red-800 bg-red-900/30 text-red-300 hover:bg-red-900/50' : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100';
  if (tone === 'primary') return isDark ? 'border-blue-800 bg-blue-900/30 text-blue-300 hover:bg-blue-900/50' : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100';
  return isDark ? 'border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
};

export default function Billing() {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [paymentsByBill, setPaymentsByBill] = useState({});
  const [open, setOpen] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [editing, setEditing] = useState(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { status: 'unpaid' },
  });

  const {
    register: registerPayment,
    handleSubmit: handlePaymentSubmit,
    reset: resetPayment,
    formState: { isSubmitting: isSubmittingPayment },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: { payment_method: 'cash' },
  });

  const load = async () => {
    setLoading(true);
    try {
      const [b, p, a, payments] = await Promise.all([
        billingAPI.list(),
        patientsAPI.list(),
        appointmentsAPI.list(),
        billingPaymentsAPI.list(),
      ]);

      setRows(b.items);
      setPatients(p.items);
      setAppointments(a.items);

      const grouped = payments.items.reduce((acc, item) => {
        if (!acc[item.billing]) acc[item.billing] = [];
        acc[item.billing].push(item);
        return acc;
      }, {});
      setPaymentsByBill(grouped);
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
    const paid = rows.reduce((sum, row) => sum + Number(row.paid_amount || 0), 0);
    const outstanding = rows.reduce((sum, row) => sum + Number(row.balance_due || 0), 0);
    const insurancePending = rows
      .filter((row) => row.status === 'insurance_pending')
      .reduce((sum, row) => sum + Number(row.balance_due || 0), 0);
    return { total, paid, outstanding, insurancePending };
  }, [rows]);

  const openCreate = () => {
    setEditing(null);
    reset({
      patient: '',
      appointment: '',
      amount: 0,
      status: 'unpaid',
      due_date: '',
      insurance_provider: '',
      insurance_claim_number: '',
      description: '',
    });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    reset({
      patient: row.patient,
      appointment: row.appointment || '',
      amount: Number(row.amount),
      status: row.status,
      due_date: row.due_date || '',
      insurance_provider: row.insurance_provider || '',
      insurance_claim_number: row.insurance_claim_number || '',
      description: row.description || '',
    });
    setOpen(true);
  };

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      appointment: values.appointment || null,
      due_date: values.due_date || null,
      insurance_provider: values.insurance_provider || '',
      insurance_claim_number: values.insurance_claim_number || '',
    };

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

  const onDelete = async (row) => {
    const confirmed = window.confirm(`Delete billing entry #${row.id}? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await billingAPI.delete(row.id);
      toast.success('Billing entry deleted');
      await load();
    } catch {
      toast.error('Unable to delete billing entry');
    }
  };

  const openPaymentCreate = (row) => {
    resetPayment({
      billing: row.id,
      amount: Number(row.balance_due || row.amount || 0),
      payment_method: 'cash',
      reference_number: '',
      notes: '',
    });
    setOpenPayment(true);
  };

  const onSubmitPayment = async (values) => {
    try {
      await billingPaymentsAPI.create(values);
      toast.success('Payment recorded');
      setOpenPayment(false);
      await load();
    } catch {
      toast.error('Unable to record payment');
    }
  };

  const downloadInvoice = (row) => {
    const baseUrl = apiClient.defaults.baseURL || '/api';
    window.open(`${baseUrl}/billing/${row.id}/download-invoice/`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      <PageHeader
        title="Billing"
        subtitle="Track invoices, collections, insurance cases, and payment progress in a responsive workflow."
        actions={(
          <button onClick={openCreate} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${isDark ? 'border-blue-800 bg-blue-900/30 text-blue-300 hover:bg-blue-900/50' : 'border-blue-200 bg-blue-600 text-white hover:bg-blue-700'}`}>
            <Plus size={15} /> New bill
          </button>
        )}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total billed', amount: summary.total, tone: 'blue' },
          { label: 'Collected', amount: summary.paid, tone: 'success' },
          { label: 'Outstanding', amount: summary.outstanding, tone: 'amber' },
          { label: 'Insurance pending', amount: summary.insurancePending, tone: 'neutral' },
        ].map((item) => (
          <article key={item.label} className={`rounded-2xl border p-4 shadow-sm transition-colors ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200/80 bg-white'}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</p>
            <p className={`mt-2 text-2xl font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>${Number(item.amount).toFixed(2)}</p>
            <p className={`mt-2 h-1.5 w-14 rounded-full ${item.tone === 'blue' ? 'bg-blue-500' : item.tone === 'success' ? 'bg-emerald-500' : item.tone === 'amber' ? 'bg-amber-500' : 'bg-slate-500'}`} />
          </article>
        ))}
      </section>

      {loading ? (
        <TableSkeleton isDark={isDark} />
      ) : rows.length === 0 ? (
        <EmptyState title="No billing entries" description="Create invoices to start tracking collections." isDark={isDark} />
      ) : (
        <>
          <section className="space-y-3 lg:hidden">
            {rows.map((row) => (
              <article key={row.id} className={`rounded-2xl border p-4 shadow-sm transition-colors ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200/80 bg-white'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{row.patient_name}</p>
                    <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Invoice #{row.id}</p>
                  </div>
                  <StatusBadge value={row.status} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Amount</p>
                    <p className={`mt-1 font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>${Number(row.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Balance</p>
                    <p className={`mt-1 font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>${Number(row.balance_due || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Paid</p>
                    <p className={`mt-1 font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>${Number(row.paid_amount || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Due date</p>
                    <p className={`mt-1 font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{row.due_date || 'N/A'}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => openPaymentCreate(row)} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${actionButton(isDark, 'success')}`}>
                    <Wallet size={13} /> Payment
                  </button>
                  <button onClick={() => openEdit(row)} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${actionButton(isDark)}`}>
                    <Pencil size={13} /> Edit
                  </button>
                  <button onClick={() => downloadInvoice(row)} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${actionButton(isDark, 'primary')}`}>
                    <Download size={13} /> Invoice
                  </button>
                  <button onClick={() => onDelete(row)} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${actionButton(isDark, 'danger')}`}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>

                {(paymentsByBill[row.id] || []).length > 0 && (
                  <p className={`mt-3 text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    {paymentsByBill[row.id].length} payment(s) posted
                  </p>
                )}
              </article>
            ))}
          </section>

          <section className={`hidden rounded-2xl border shadow-sm lg:block ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className={isDark ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-50 text-slate-500'}>
                  <tr>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Paid</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Due date</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Payments</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className={`border-t transition-colors ${isDark ? 'border-slate-700 hover:bg-slate-700/30' : 'border-slate-100 hover:bg-slate-50'}`}>
                      <td className={`px-4 py-4 font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{row.patient_name}</td>
                      <td className={`px-4 py-4 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>${Number(row.amount).toFixed(2)}</td>
                      <td className={`px-4 py-4 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>${Number(row.paid_amount || 0).toFixed(2)}</td>
                      <td className={`px-4 py-4 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>${Number(row.balance_due || 0).toFixed(2)}</td>
                      <td className="px-4 py-4"><StatusBadge value={row.status} /></td>
                      <td className={`px-4 py-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{row.due_date || 'N/A'}</td>
                      <td className={`px-4 py-4 max-w-[260px] truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{row.description || 'N/A'}</td>
                      <td className={`px-4 py-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{(paymentsByBill[row.id] || []).length} posted</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button onClick={() => openPaymentCreate(row)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${actionButton(isDark, 'success')}`}>
                            <Wallet size={13} /> Payment
                          </button>
                          <button onClick={() => openEdit(row)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${actionButton(isDark)}`}>
                            <Pencil size={13} /> Edit
                          </button>
                          <button onClick={() => downloadInvoice(row)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${actionButton(isDark, 'primary')}`}>
                            <ReceiptText size={13} /> Invoice
                          </button>
                          <button onClick={() => onDelete(row)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${actionButton(isDark, 'danger')}`}>
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <AppModal open={open} onClose={() => setOpen(false)} title={editing ? 'Update Billing Entry' : 'Create Billing Entry'} size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Patient</label>
              <select {...register('patient')} className={fieldBase(isDark)}>
                <option value="">Select patient</option>
                {patients.map((item) => (
                  <option key={item.id} value={item.id}>{item.full_name || `${item.first_name} ${item.last_name}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Appointment (optional)</label>
              <select {...register('appointment')} className={fieldBase(isDark)}>
                <option value="">Select appointment</option>
                {appointments.map((item) => (
                  <option key={item.id} value={item.id}>{item.patient_name} - {item.appointment_date}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Amount</label>
              <input type="number" step="0.01" {...register('amount')} className={fieldBase(isDark)} />
            </div>
            <div>
              <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</label>
              <select {...register('status')} className={fieldBase(isDark)}>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="insurance_pending">Insurance Pending</option>
                <option value="written_off">Written Off</option>
              </select>
            </div>
            <div>
              <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Due date</label>
              <input type="date" {...register('due_date')} className={fieldBase(isDark)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Insurance provider</label>
              <input {...register('insurance_provider')} className={fieldBase(isDark)} />
            </div>
            <div>
              <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Insurance claim number</label>
              <input {...register('insurance_claim_number')} className={fieldBase(isDark)} />
            </div>
          </div>

          <div>
            <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Description</label>
            <textarea {...register('description')} rows={4} className={fieldBase(isDark)} />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setOpen(false)} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${actionButton(isDark)}`}>
              Cancel
            </button>
            <button disabled={isSubmitting} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors ${isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {editing ? 'Update entry' : 'Create entry'}
            </button>
          </div>
        </form>
      </AppModal>

      <AppModal open={openPayment} onClose={() => setOpenPayment(false)} title="Record Payment" size="lg">
        <form onSubmit={handlePaymentSubmit(onSubmitPayment)} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bill</label>
              <select {...registerPayment('billing')} className={fieldBase(isDark)}>
                <option value="">Select bill</option>
                {rows.map((item) => (
                  <option key={item.id} value={item.id}>#{item.id} - {item.patient_name} (${Number(item.balance_due || 0).toFixed(2)} due)</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Amount</label>
              <input type="number" step="0.01" {...registerPayment('amount')} className={fieldBase(isDark)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Payment method</label>
              <select {...registerPayment('payment_method')} className={fieldBase(isDark)}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="insurance">Insurance</option>
              </select>
            </div>
            <div>
              <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Reference number</label>
              <input {...registerPayment('reference_number')} className={fieldBase(isDark)} />
            </div>
          </div>

          <div>
            <label className={`mb-1.5 block text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Notes</label>
            <textarea {...registerPayment('notes')} rows={4} className={fieldBase(isDark)} />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setOpenPayment(false)} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${actionButton(isDark)}`}>
              Cancel
            </button>
            <button disabled={isSubmittingPayment} className={`inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500`}>
              Record payment
            </button>
          </div>
        </form>
      </AppModal>
    </div>
  );
}
