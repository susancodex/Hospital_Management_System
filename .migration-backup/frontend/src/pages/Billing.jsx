import { zodResolver } from '@hookform/resolvers/zod';
import { Download, Plus, Wallet, Pencil, Trash2, ReceiptText, ArrowUpRight, ArrowDownRight, Eye, Landmark, Smartphone } from 'lucide-react';
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
import { FormField, ConfirmDialog } from '../components/common/UIStates.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { hasPermission } from '../lib/permissions.js';

const schema = z.object({
  patient: z.coerce.number().min(1, 'Patient is required'),
  appointment: z.coerce.number().optional(),
  amount: z.coerce.number().min(0, 'Amount must be 0 or more'),
  status: z.enum(['paid', 'unpaid', 'partial', 'insurance_pending', 'written_off']),
  due_date: z.string().optional(),
  insurance_provider: z.string().optional(),
  insurance_claim_number: z.string().optional(),
  description: z.string().optional(),
});

const paymentSchema = z.object({
  billing: z.coerce.number().min(1, 'Bill is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  payment_method: z.enum(['cash', 'card', 'bank', 'upi', 'esewa', 'insurance']),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});

function KpiCard({ title, value, trend, trendUp, neutral = false }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <div className="mt-2 flex items-end justify-between">
        <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">{value}</h3>
        <span className={`text-xs font-medium inline-flex items-center ${neutral ? "text-slate-500" : trendUp ? "text-emerald-600" : "text-rose-600"}`}>
          {neutral ? null : trendUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
          {trend}
        </span>
      </div>
    </div>
  );
}

export default function Billing() {
  const { user } = useAuth();
  const canManageBilling = hasPermission(user?.role, 'billing.manage');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [paymentsByBill, setPaymentsByBill] = useState({});
  const [open, setOpen] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [bankTransferInfo, setBankTransferInfo] = useState(null);
  const [editing, setEditing] = useState(null);
  const [verifyingPaymentId, setVerifyingPaymentId] = useState(null);
  const [paymentAuditFilter, setPaymentAuditFilter] = useState({
    status: 'all',
    method: 'all',
    gateway: 'all',
    search: '',
  });
  
  // Delete confirm
  const [deleteId, setDeleteId] = useState(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { status: 'unpaid' },
  });

  const {
    register: registerPayment,
    handleSubmit: handlePaymentSubmit,
    reset: resetPayment,
    formState: { errors: paymentErrors, isSubmitting: isSubmittingPayment },
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
    
    // Derived dummy KPIs for mockup
    const overdue = outstanding * 0.15; // Mock overdue
    const avgInvoice = rows.length ? total / rows.length : 0;
    
    return { outstanding, paid, overdue, avgInvoice, count: rows.length };
  }, [rows]);

  const allPayments = useMemo(() => {
    return Object.values(paymentsByBill).flat().sort((a, b) => b.id - a.id).slice(0, 5);
  }, [paymentsByBill]);

  const paymentAuditRows = useMemo(() => {
    const query = paymentAuditFilter.search.trim().toLowerCase();

    return Object.values(paymentsByBill)
      .flat()
      .sort((a, b) => b.id - a.id)
      .filter((item) => {
        if (paymentAuditFilter.status !== 'all' && item.transaction_status !== paymentAuditFilter.status) {
          return false;
        }
        if (paymentAuditFilter.method !== 'all' && item.payment_method !== paymentAuditFilter.method) {
          return false;
        }
        if (paymentAuditFilter.gateway !== 'all' && (item.gateway || 'manual') !== paymentAuditFilter.gateway) {
          return false;
        }
        if (!query) return true;

        const haystack = [
          item.reference_number,
          item.gateway_transaction_id,
          item.notes,
          item.billing_patient_name,
          `INV-${String(item.billing).padStart(5, '0')}`,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(query);
      });
  }, [paymentsByBill, paymentAuditFilter]);

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

  const onDelete = async () => {
    if (!deleteId) return;
    try {
      await billingAPI.delete(deleteId);
      toast.success('Billing entry deleted');
      setDeleteId(null);
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

  const handleEsewaPay = async (row) => {
    try {
      const response = await billingAPI.initiateEsewaPayment(row.id, {
        amount: Number(row.balance_due || 0),
      });
      const paymentUrl = response?.data?.payment_url;
      if (!paymentUrl) {
        toast.error('Unable to start eSewa payment right now');
        return;
      }
      window.open(paymentUrl, '_blank', 'noopener,noreferrer');
      toast.success('eSewa window opened');
      await load();
    } catch {
      toast.error('Failed to initiate eSewa payment');
    }
  };

  const handleBankTransfer = async (row) => {
    try {
      const response = await billingAPI.initiateBankTransfer(row.id, {
        amount: Number(row.balance_due || 0),
      });
      setBankTransferInfo(response.data);
      toast.success('Bank transfer instructions generated');
      await load();
    } catch {
      toast.error('Failed to start bank transfer');
    }
  };

  const verifyBankTransfer = async () => {
    if (!bankTransferInfo?.payment_id) return;
    try {
      await billingPaymentsAPI.verify(bankTransferInfo.payment_id, {
        notes: 'Verified from billing dashboard',
      });
      toast.success('Bank transfer verified');
      setBankTransferInfo(null);
      await load();
    } catch {
      toast.error('Unable to verify bank transfer');
    }
  };

  const verifyAuditPayment = async (paymentId) => {
    setVerifyingPaymentId(paymentId);
    try {
      await billingPaymentsAPI.verify(paymentId, {
        notes: 'Verified from payment audit',
      });
      toast.success('Payment verified');
      await load();
    } catch {
      toast.error('Unable to verify this payment');
    } finally {
      setVerifyingPaymentId(null);
    }
  };

  const escapeCsv = (value) => {
    const text = value == null ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const handleExport = () => {
    if (!rows.length) {
      toast.error('No billing rows to export');
      return;
    }

    const header = [
      'Invoice',
      'Patient',
      'Status',
      'Amount',
      'Paid Amount',
      'Balance Due',
      'Due Date',
      'Insurance Provider',
      'Claim Number',
      'Description',
      'Created At',
    ];

    const lines = rows.map((row) => [
      `INV-${String(row.id).padStart(5, '0')}`,
      row.patient_name || '',
      row.status || '',
      Number(row.amount || 0).toFixed(2),
      Number(row.paid_amount || 0).toFixed(2),
      Number(row.balance_due || 0).toFixed(2),
      row.due_date || '',
      row.insurance_provider || '',
      row.insurance_claim_number || '',
      row.description || '',
      row.created_at || '',
    ]);

    const csv = [header, ...lines].map((cols) => cols.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `billing-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast.success('Billing export downloaded');
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full">
      <PageHeader
        title="Billing & Invoices"
        subtitle={`$${summary.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} outstanding across ${summary.count} invoices`}
        actions={(
          <>
            <button onClick={handleExport} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Export
            </button>
            {canManageBilling ? (
              <button onClick={openCreate} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors">
                <Plus className="w-4 h-4" /> New invoice
              </button>
            ) : null}
          </>
        )}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Outstanding" 
          value={`$${summary.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          trend="-2.4%" 
          trendUp={false} 
        />
        <KpiCard 
          title="Collected this month" 
          value={`$${summary.paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          trend="+12%" 
          trendUp={true} 
        />
        <KpiCard 
          title="Overdue" 
          value={`$${summary.overdue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          trend="+1.2%" 
          trendUp={false} 
        />
        <KpiCard 
          title="Avg invoice" 
          value={`$${summary.avgInvoice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          trend="0%" 
          trendUp={true} 
          neutral={true}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Invoices Table */}
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Invoices</h2>
            </div>
            <div className="p-0 overflow-x-auto">
              {loading ? (
                <div className="p-5"><TableSkeleton rows={5} /></div>
              ) : rows.length === 0 ? (
                <EmptyState title="No invoices found" description={canManageBilling ? 'Create an invoice to start billing.' : 'Billing entries will appear here once available.'} />
              ) : (
                <table className="w-full min-w-[840px] text-sm whitespace-nowrap">
                  <thead className="bg-slate-50/60 dark:bg-slate-900/40">
                    <tr>
                      <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Invoice #</th>
                      <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Patient</th>
                      <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date</th>
                      <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                      <th className="h-10 px-5 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Amount</th>
                      <th className="h-10 px-5 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-slate-500">INV-{String(row.id).padStart(5, '0')}</td>
                        <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{row.patient_name}</td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-5 py-3"><StatusBadge value={row.status} /></td>
                        <td className="px-5 py-3 text-right font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                          ${Number(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setViewInvoice(row)} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" title="View">
                              <Eye className="w-4 h-4" />
                            </button>
                            {canManageBilling ? (
                              <button type="button" onClick={() => openPaymentCreate(row)} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40" title="Record Payment">
                                <Wallet className="w-4 h-4" />
                              </button>
                            ) : null}
                            {canManageBilling && Number(row.balance_due || 0) > 0 ? (
                              <button
                                type="button"
                                onClick={() => handleEsewaPay(row)}
                                className="inline-flex items-center justify-center h-8 w-8 rounded-md text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                                title="Pay with eSewa"
                              >
                                <Smartphone className="w-4 h-4" />
                              </button>
                            ) : null}
                            {canManageBilling && Number(row.balance_due || 0) > 0 ? (
                              <button
                                type="button"
                                onClick={() => handleBankTransfer(row)}
                                className="inline-flex items-center justify-center h-8 w-8 rounded-md text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                title="Bank transfer details"
                              >
                                <Landmark className="w-4 h-4" />
                              </button>
                            ) : null}
                            <button onClick={() => downloadInvoice(row)} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40" title="Print/Download">
                              <ReceiptText className="w-4 h-4" />
                            </button>
                            {canManageBilling ? (
                              <>
                                <button type="button" onClick={() => openEdit(row)} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" title="Edit">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => setDeleteId(row.id)} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40" title="Delete">
                                  <Trash2 className="w-4 h-4" />
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
        </div>

        {/* Recent Payments */}
        <div className="xl:col-span-1 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Recent Payments</h2>
            </div>
            <div className="p-0 overflow-x-auto">
              {loading ? (
                <div className="p-5"><TableSkeleton rows={3} /></div>
              ) : allPayments.length === 0 ? (
                <EmptyState title="No payments" description="No recent payments recorded." />
              ) : (
                <table className="w-full min-w-[540px] text-sm">
                  <thead className="bg-slate-50/60 dark:bg-slate-900/40">
                    <tr>
                      <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Method</th>
                      <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date</th>
                      <th className="h-10 px-5 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPayments.map((p) => (
                      <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3">
                          <span className="capitalize text-slate-900 dark:text-slate-100 font-medium">{p.payment_method}</span>
                          {p.transaction_status && p.transaction_status !== 'verified' ? (
                            <div className="text-[11px] uppercase tracking-wide text-amber-600 mt-0.5">{p.transaction_status}</div>
                          ) : null}
                          <div className="text-xs text-slate-500 font-mono mt-0.5">INV-{String(p.billing).padStart(5, '0')}</div>
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300 text-xs">
                          {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +${Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Payment Audit</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Track pending and verified gateway transactions.</p>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-b border-slate-100 dark:border-slate-800">
              <select
                value={paymentAuditFilter.status}
                onChange={(e) => setPaymentAuditFilter((prev) => ({ ...prev, status: e.target.value }))}
                className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="failed">Failed</option>
              </select>

              <select
                value={paymentAuditFilter.gateway}
                onChange={(e) => setPaymentAuditFilter((prev) => ({ ...prev, gateway: e.target.value }))}
                className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
              >
                <option value="all">All Gateways</option>
                <option value="manual">Manual</option>
                <option value="esewa">eSewa</option>
                <option value="bank">Bank</option>
              </select>

              <select
                value={paymentAuditFilter.method}
                onChange={(e) => setPaymentAuditFilter((prev) => ({ ...prev, method: e.target.value }))}
                className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="esewa">eSewa</option>
                <option value="insurance">Insurance</option>
              </select>

              <input
                type="text"
                value={paymentAuditFilter.search}
                onChange={(e) => setPaymentAuditFilter((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Search ref / invoice / patient"
                className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
              />
            </div>

            <div className="overflow-x-auto">
              {paymentAuditRows.length === 0 ? (
                <EmptyState title="No payments matched" description="Try changing your audit filters." />
              ) : (
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-slate-50/60 dark:bg-slate-900/40">
                    <tr>
                      <th className="h-10 px-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Reference</th>
                      <th className="h-10 px-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Invoice</th>
                      <th className="h-10 px-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Method</th>
                      <th className="h-10 px-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Gateway</th>
                      <th className="h-10 px-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                      <th className="h-10 px-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Amount</th>
                      <th className="h-10 px-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentAuditRows.slice(0, 15).map((item) => (
                      <tr key={item.id} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-300">{item.reference_number || '-'}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">INV-{String(item.billing).padStart(5, '0')}</td>
                        <td className="px-4 py-3 text-xs capitalize text-slate-700 dark:text-slate-200">{item.payment_method}</td>
                        <td className="px-4 py-3 text-xs uppercase text-slate-500 dark:text-slate-400">{item.gateway || 'manual'}</td>
                        <td className="px-4 py-3 text-xs uppercase tracking-wide text-slate-700 dark:text-slate-200">{item.transaction_status || 'verified'}</td>
                        <td className="px-4 py-3 text-right text-xs font-medium tabular-nums text-slate-900 dark:text-slate-100">${Number(item.amount || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">
                          {canManageBilling && item.transaction_status !== 'verified' ? (
                            <button
                              type="button"
                              onClick={() => verifyAuditPayment(item.id)}
                              disabled={verifyingPaymentId === item.id}
                              className="h-7 px-2 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium disabled:opacity-50"
                            >
                              {verifyingPaymentId === item.id ? 'Verifying...' : 'Verify'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Create/Edit Modal */}
      <AppModal 
        open={open && canManageBilling} 
        onClose={() => setOpen(false)} 
        title={editing ? 'Edit Invoice' : 'New Invoice'} 
        size="md"
        footer={(
          <>
            <button type="button" onClick={() => setOpen(false)} className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium">
              Cancel
            </button>
            <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50">
              {editing ? 'Update invoice' : 'Create invoice'}
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField 
              label="Patient" 
              name="patient" 
              type="select" 
              register={register} 
              error={errors.patient?.message} 
              touched={true}
              options={patients.map(p => ({ value: p.id, label: p.full_name || `${p.first_name} ${p.last_name}` }))} 
              required
            />
            <FormField 
              label="Appointment (Optional)" 
              name="appointment" 
              type="select" 
              register={register} 
              options={appointments.map(a => ({ value: a.id, label: `${a.patient_name} - ${a.appointment_date}` }))} 
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <FormField label="Amount ($)" name="amount" type="number" register={register} error={errors.amount?.message} touched={true} required />
            <FormField 
              label="Status" 
              name="status" 
              type="select" 
              register={register} 
              options={[
                { value: 'paid', label: 'Paid' },
                { value: 'unpaid', label: 'Unpaid' },
                { value: 'partial', label: 'Partial' },
                { value: 'insurance_pending', label: 'Insurance Pending' },
                { value: 'written_off', label: 'Written Off' },
              ]} 
            />
            <FormField label="Due Date" name="due_date" type="date" register={register} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Insurance Provider" name="insurance_provider" register={register} />
            <FormField label="Claim Number" name="insurance_claim_number" register={register} />
          </div>
          <FormField label="Description/Notes" name="description" type="textarea" rows={3} register={register} />
        </div>
      </AppModal>

      {/* Payment Modal */}
      <AppModal 
        open={openPayment && canManageBilling} 
        onClose={() => setOpenPayment(false)} 
        title="Record Payment" 
        size="md"
        footer={(
          <>
            <button type="button" onClick={() => setOpenPayment(false)} className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium">
              Cancel
            </button>
            <button onClick={handlePaymentSubmit(onSubmitPayment)} disabled={isSubmittingPayment} className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50">
              Record payment
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField 
              label="Invoice" 
              name="billing" 
              type="select" 
              register={registerPayment} 
              error={paymentErrors.billing?.message} 
              touched={true}
              options={rows.map(item => ({ value: item.id, label: `INV-${String(item.id).padStart(5, '0')} - $${Number(item.balance_due || 0).toFixed(2)} due` }))} 
              required
            />
            <FormField label="Amount ($)" name="amount" type="number" register={registerPayment} error={paymentErrors.amount?.message} touched={true} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField 
              label="Payment Method" 
              name="payment_method" 
              type="select" 
              register={registerPayment} 
              options={[
                { value: 'cash', label: 'Cash' },
                { value: 'card', label: 'Card' },
                { value: 'bank', label: 'Bank Transfer' },
                { value: 'upi', label: 'UPI' },
                { value: 'esewa', label: 'eSewa' },
                { value: 'insurance', label: 'Insurance' },
              ]} 
            />
            <FormField label="Reference Number" name="reference_number" register={registerPayment} />
          </div>
          <FormField label="Internal Notes" name="notes" type="textarea" rows={2} register={registerPayment} />
        </div>
      </AppModal>

      {/* View Invoice Detail Modal */}
      <AppModal 
        open={!!viewInvoice} 
        onClose={() => setViewInvoice(null)} 
        title={`Invoice #INV-${String(viewInvoice?.id).padStart(5, '0')}`} 
        size="lg"
        footer={(
          <>
            <button type="button" onClick={() => setViewInvoice(null)} className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium">
              Close
            </button>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium">
              Print
            </button>
            <button onClick={() => downloadInvoice(viewInvoice)} className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors">
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </>
        )}
      >
        {viewInvoice && (
          <div className="bg-white dark:bg-slate-900 p-8 border border-slate-200 dark:border-slate-800 rounded-lg print:border-none print:shadow-none print:p-0">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-teal-700">AetherCare Hospital</h1>
                <p className="text-sm text-slate-500 mt-1">123 Health Avenue, Medical District<br/>New York, NY 10001</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-1">INVOICE</p>
                <p className="font-mono text-slate-600 dark:text-slate-400">#INV-{String(viewInvoice.id).padStart(5, '0')}</p>
                <div className="mt-2"><StatusBadge value={viewInvoice.status} /></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Billed To:</p>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{viewInvoice.patient_name}</p>
              </div>
              <div className="text-right text-sm space-y-1">
                <p><span className="text-slate-500 mr-2">Invoice Date:</span> <span className="font-medium text-slate-900 dark:text-slate-100">{viewInvoice.created_at ? new Date(viewInvoice.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</span></p>
                <p><span className="text-slate-500 mr-2">Due Date:</span> <span className="font-medium text-slate-900 dark:text-slate-100">{viewInvoice.due_date || 'Upon receipt'}</span></p>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden mb-8">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-slate-700 dark:text-slate-300">Description</th>
                    <th className="px-4 py-2 text-right font-medium text-slate-700 dark:text-slate-300">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="px-4 py-4 text-slate-800 dark:text-slate-200">
                      {viewInvoice.description || 'Medical Services'}
                    </td>
                    <td className="px-4 py-4 text-right font-medium tabular-nums text-slate-800 dark:text-slate-200">
                      ${Number(viewInvoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-64 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="font-medium tabular-nums">${Number(viewInvoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Paid to date</span>
                  <span className="font-medium text-emerald-600 tabular-nums">-${Number(viewInvoice.paid_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Balance Due</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">${Number(viewInvoice.balance_due || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
            
            {viewInvoice.insurance_provider && (
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Insurance Information:</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">Provider: <span className="font-medium">{viewInvoice.insurance_provider}</span></p>
                <p className="text-sm text-slate-700 dark:text-slate-300">Claim #: <span className="font-medium">{viewInvoice.insurance_claim_number || 'N/A'}</span></p>
              </div>
            )}
          </div>
        )}
      </AppModal>

      {/* Delete Confirmation */}
      <ConfirmDialog 
        isOpen={!!deleteId && canManageBilling} 
        title="Delete Invoice" 
        message="Are you sure you want to delete this invoice? This action cannot be undone and will remove all associated payments." 
        onConfirm={onDelete} 
        onCancel={() => setDeleteId(null)} 
        isDangerous={true} 
      />

      <AppModal
        open={!!bankTransferInfo}
        onClose={() => setBankTransferInfo(null)}
        title="Bank Transfer Details"
        size="md"
        footer={(
          <>
            <button
              type="button"
              onClick={() => setBankTransferInfo(null)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium"
            >
              Close
            </button>
            {canManageBilling ? (
              <button
                type="button"
                onClick={verifyBankTransfer}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors"
              >
                Mark as Verified
              </button>
            ) : null}
          </>
        )}
      >
        {bankTransferInfo ? (
          <div className="space-y-4 text-sm">
            <p className="text-slate-600 dark:text-slate-300">
              Share these details with the payer and use the same reference in transfer remarks.
            </p>
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 p-4 space-y-2">
              <div><span className="font-medium">Account Name:</span> {bankTransferInfo.bank_details?.account_name}</div>
              <div><span className="font-medium">Bank:</span> {bankTransferInfo.bank_details?.bank_name}</div>
              <div><span className="font-medium">Branch:</span> {bankTransferInfo.bank_details?.branch}</div>
              <div><span className="font-medium">Account No:</span> {bankTransferInfo.bank_details?.account_number}</div>
              <div><span className="font-medium">Amount:</span> ${Number(bankTransferInfo.amount || 0).toFixed(2)}</div>
              <div><span className="font-medium">Reference:</span> {bankTransferInfo.reference_number}</div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{bankTransferInfo.instructions}</p>
          </div>
        ) : null}
      </AppModal>
    </div>
  );
}
