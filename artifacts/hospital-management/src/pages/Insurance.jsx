import { useEffect, useState, useCallback } from 'react';
import { HeartHandshake, Plus, RefreshCw, CheckCircle2, XCircle, Clock, FileText, DollarSign, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useAuthStore } from '../store/authStore.js';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || '/api';

const STATUS_STYLES = {
  pending: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  approved: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  rejected: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  processing: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const icons = { pending: Clock, approved: CheckCircle2, rejected: XCircle, processing: RefreshCw };
  const Icon = icons[status] || Clock;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${s}`}>
      <Icon className="h-3 w-3" />{status}
    </span>
  );
}

export default function Insurance() {
  const { user } = useAuth();
  const token = useAuthStore((s) => s.token);
  const isAdmin = ['admin', 'accountant'].includes(user?.role);

  const [claims, setClaims] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('claims');
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const [claimForm, setClaimForm] = useState({ patient_id: '', provider_id: '', policy_number: '', membership_id: '', claim_amount: '', notes: '' });
  const [providerForm, setProviderForm] = useState({ name: '', code: '', type: 'health', contact_email: '', contact_phone: '', address: '' });

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [claimsRes, providersRes] = await Promise.all([
        fetch(`${API}/insurance-claims/`, { headers }),
        fetch(`${API}/insurance-providers/`, { headers }),
      ]);
      if (claimsRes.ok) setClaims((await claimsRes.json()).results || []);
      if (providersRes.ok) setProviders((await providersRes.json()).results || []);
    } catch { toast.error('Failed to load insurance data'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const submitClaim = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/insurance-claims/`, { method: 'POST', headers, body: JSON.stringify(claimForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to submit claim');
      toast.success(`Claim ${data.claim_number} submitted`);
      setShowClaimForm(false);
      setClaimForm({ patient_id: '', provider_id: '', policy_number: '', membership_id: '', claim_amount: '', notes: '' });
      load();
    } catch (err) { toast.error(err.message); }
  };

  const submitProvider = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/insurance-providers/`, { method: 'POST', headers, body: JSON.stringify(providerForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to add provider');
      toast.success(`Provider "${data.name}" added`);
      setShowProviderForm(false);
      setProviderForm({ name: '', code: '', type: 'health', contact_email: '', contact_phone: '', address: '' });
      load();
    } catch (err) { toast.error(err.message); }
  };

  const updateClaimStatus = async (id, status) => {
    setProcessingId(id);
    try {
      const approved_amount = status === 'approved' ? prompt('Approved amount:') : undefined;
      const rejection_reason = status === 'rejected' ? prompt('Rejection reason:') : undefined;
      const res = await fetch(`${API}/insurance-claims/${id}/`, {
        method: 'PATCH', headers,
        body: JSON.stringify({ status, ...(approved_amount ? { approved_amount } : {}), ...(rejection_reason ? { rejection_reason } : {}) }),
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success(`Claim ${status}`);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setProcessingId(null); }
  };

  const filteredClaims = claims.filter((c) =>
    !search || c.claim_number?.toLowerCase().includes(search.toLowerCase()) ||
    c.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.provider_name?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: claims.length,
    pending: claims.filter((c) => c.status === 'pending').length,
    approved: claims.filter((c) => c.status === 'approved').length,
    totalAmount: claims.reduce((s, c) => s + Number(c.claim_amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HeartHandshake className="h-5 w-5 text-teal-600" /> Insurance Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage insurance claims and providers</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setShowProviderForm(true)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-medium">
              <Plus className="h-4 w-4" /> Add Provider
            </button>
            <button onClick={() => setShowClaimForm(true)} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium shadow-sm">
              <Plus className="h-4 w-4" /> New Claim
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Claims', value: stats.total, color: 'teal' },
          { label: 'Pending', value: stats.pending, color: 'amber' },
          { label: 'Approved', value: stats.approved, color: 'green' },
          { label: 'Total Amount', value: `NPR ${stats.totalAmount.toLocaleString()}`, color: 'blue' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl border p-4 ${color === 'teal' ? 'border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/20' : color === 'amber' ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20' : color === 'green' ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20' : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20'}`}>
            <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 w-fit">
        {['claims', 'providers'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            {tab === 'claims' ? 'Claims' : 'Providers'}
          </button>
        ))}
      </div>

      {activeTab === 'claims' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search claims…" className="h-9 w-full pl-9 pr-3 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Claim #</th>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Provider</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  {isAdmin && <th className="px-4 py-3 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
                ) : filteredClaims.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No claims found</td></tr>
                ) : filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{claim.claim_number}</td>
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-200">{claim.patient_name || `ID ${claim.patient_id}`}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{claim.provider_name || '—'}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">NPR {Number(claim.claim_amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={claim.status} /></td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{claim.submitted_at ? new Date(claim.submitted_at).toLocaleDateString() : '—'}</td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        {claim.status === 'pending' && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateClaimStatus(claim.id, 'approved')} disabled={processingId === claim.id} className="h-7 px-2.5 rounded text-xs font-medium bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 hover:bg-green-100 disabled:opacity-50">Approve</button>
                            <button onClick={() => updateClaimStatus(claim.id, 'rejected')} disabled={processingId === claim.id} className="h-7 px-2.5 rounded text-xs font-medium bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:bg-red-100 disabled:opacity-50">Reject</button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'providers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? <p className="text-slate-400 text-sm col-span-3">Loading…</p> : providers.length === 0 ? (
            <p className="text-slate-400 text-sm col-span-3">No providers yet. Add one to get started.</p>
          ) : providers.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</p>
                  {p.code && <p className="text-xs font-mono text-slate-400">{p.code}</p>}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">{p.type}</span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                {p.contact_email && <p>✉ {p.contact_email}</p>}
                {p.contact_phone && <p>📞 {p.contact_phone}</p>}
                {p.address && <p>📍 {p.address}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Claim Modal */}
      {showClaimForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Submit Insurance Claim</h2>
              <button onClick={() => setShowClaimForm(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>
            <form onSubmit={submitClaim} className="p-6 space-y-4">
              {[
                { label: 'Patient ID *', key: 'patient_id', type: 'number', required: true },
                { label: 'Policy Number', key: 'policy_number', type: 'text' },
                { label: 'Membership ID', key: 'membership_id', type: 'text' },
                { label: 'Claim Amount (NPR)', key: 'claim_amount', type: 'number' },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                  <input type={type} value={claimForm[key]} onChange={(e) => setClaimForm((f) => ({ ...f, [key]: e.target.value }))} required={required} className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Insurance Provider *</label>
                <select value={claimForm.provider_id} onChange={(e) => setClaimForm((f) => ({ ...f, provider_id: e.target.value }))} required className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20">
                  <option value="">Select provider</option>
                  {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                <textarea value={claimForm.notes} onChange={(e) => setClaimForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowClaimForm(false)} className="flex-1 h-9 rounded-md border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 h-9 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium">Submit Claim</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Provider Modal */}
      {showProviderForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Add Insurance Provider</h2>
              <button onClick={() => setShowProviderForm(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>
            <form onSubmit={submitProvider} className="p-6 space-y-4">
              {[
                { label: 'Provider Name *', key: 'name', required: true },
                { label: 'Code', key: 'code' },
                { label: 'Contact Email', key: 'contact_email', type: 'email' },
                { label: 'Contact Phone', key: 'contact_phone' },
                { label: 'Address', key: 'address' },
              ].map(({ label, key, required, type = 'text' }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                  <input type={type} value={providerForm[key]} onChange={(e) => setProviderForm((f) => ({ ...f, [key]: e.target.value }))} required={required} className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                <select value={providerForm.type} onChange={(e) => setProviderForm((f) => ({ ...f, type: e.target.value }))} className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm">
                  {['health', 'life', 'accident', 'general'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowProviderForm(false)} className="flex-1 h-9 rounded-md border border-slate-200 dark:border-slate-700 text-sm text-slate-600">Cancel</button>
                <button type="submit" className="flex-1 h-9 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium">Add Provider</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
