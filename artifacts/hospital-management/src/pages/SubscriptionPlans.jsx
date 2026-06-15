import { useEffect, useState, useCallback } from 'react';
import { Building2, CheckCircle2, Crown, Plus, Zap, Shield, Star, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || '/api';

const PLAN_ICONS = { BASIC: Zap, PROFESSIONAL: Shield, ENTERPRISE: Crown, STARTER: Star };
const PLAN_COLORS = {
  BASIC: 'border-slate-200 dark:border-slate-700',
  STARTER: 'border-blue-200 dark:border-blue-800',
  PROFESSIONAL: 'border-teal-200 dark:border-teal-800',
  ENTERPRISE: 'border-amber-200 dark:border-amber-800',
};
const PLAN_HEADER = {
  BASIC: 'bg-slate-50 dark:bg-slate-800/60',
  STARTER: 'bg-blue-50 dark:bg-blue-950/30',
  PROFESSIONAL: 'bg-teal-50 dark:bg-teal-950/30',
  ENTERPRISE: 'bg-amber-50 dark:bg-amber-950/30',
};

function fmt(n) { return Number(n || 0).toLocaleString(); }
function limit(v) { return v === -1 ? 'Unlimited' : v; }

export default function SubscriptionPlans() {
  const token = useAuthStore((s) => s.token);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');
  const [billing, setBilling] = useState('monthly');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', price_monthly: '', price_yearly: '', max_doctors: '', max_patients: '', max_branches: '1' });

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, subsRes] = await Promise.all([
        fetch(`${API}/subscription-plans/`, { headers }),
        fetch(`${API}/hospital-subscriptions/`, { headers }),
      ]);
      if (plansRes.ok) setPlans((await plansRes.json()).results || []);
      if (subsRes.ok) setSubscriptions((await subsRes.json()).results || []);
    } catch { toast.error('Failed to load subscription data'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const submitPlan = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/subscription-plans/`, {
        method: 'POST', headers,
        body: JSON.stringify({
          ...form,
          max_doctors: form.max_doctors ? Number(form.max_doctors) : -1,
          max_patients: form.max_patients ? Number(form.max_patients) : -1,
          max_branches: Number(form.max_branches || 1),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      toast.success(`Plan "${data.name}" created`);
      setShowForm(false);
      setForm({ name: '', code: '', description: '', price_monthly: '', price_yearly: '', max_doctors: '', max_patients: '', max_branches: '1' });
      load();
    } catch (err) { toast.error(err.message); }
  };

  const defaultPlans = [
    { code: 'STARTER', name: 'Starter', description: 'Perfect for small clinics', priceMonthly: '4999', priceYearly: '47990', maxDoctors: 3, maxPatients: 500, maxBranches: 1, features: ['Patient Records', 'Appointments', 'Basic Billing', 'Lab Orders'] },
    { code: 'PROFESSIONAL', name: 'Professional', description: 'For growing hospitals', priceMonthly: '14999', priceYearly: '143990', maxDoctors: 20, maxPatients: 5000, maxBranches: 3, features: ['All Starter features', 'AI Triage', 'Telemedicine', 'Insurance', 'Advanced Reports', 'QR Prescriptions'] },
    { code: 'ENTERPRISE', name: 'Enterprise', description: 'Full-scale hospital system', priceMonthly: '39999', priceYearly: '383990', maxDoctors: -1, maxPatients: -1, maxBranches: -1, features: ['All Professional features', 'Unlimited branches', 'Voice AI Notes', 'Custom integrations', 'SLA support', 'Data export', 'White labeling'] },
  ];

  const displayPlans = plans.length > 0 ? plans : defaultPlans;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" /> Subscription Plans
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">AetherCare HMS SaaS plans and hospital subscriptions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => load()} className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium shadow-sm">
            <Plus className="h-4 w-4" /> New Plan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 w-fit">
        {['plans', 'subscriptions'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            {tab === 'plans' ? 'Plans' : 'Hospital Subscriptions'}
          </button>
        ))}
      </div>

      {activeTab === 'plans' && (
        <>
          {/* Billing toggle */}
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>Monthly</span>
            <button
              onClick={() => setBilling((b) => b === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${billing === 'yearly' ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${billing === 'yearly' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${billing === 'yearly' ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
              Yearly <span className="text-xs text-green-600 font-semibold">Save 20%</span>
            </span>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 animate-pulse h-96 bg-slate-50 dark:bg-slate-800" />
              ))
            ) : displayPlans.map((plan) => {
              const planCode = plan.code || 'BASIC';
              const Icon = PLAN_ICONS[planCode] || Star;
              const price = billing === 'yearly' ? plan.priceYearly || plan.price_yearly : plan.priceMonthly || plan.price_monthly;
              const isFeatured = planCode === 'PROFESSIONAL';

              return (
                <div
                  key={plan.id || plan.code}
                  className={`rounded-2xl border-2 overflow-hidden relative ${PLAN_COLORS[planCode] || 'border-slate-200 dark:border-slate-700'} ${isFeatured ? 'shadow-xl scale-105' : 'shadow-sm'}`}
                >
                  {isFeatured && (
                    <div className="absolute top-3 right-3 bg-teal-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Popular</div>
                  )}
                  <div className={`px-5 py-5 ${PLAN_HEADER[planCode] || 'bg-slate-50 dark:bg-slate-800/60'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className={`h-5 w-5 ${planCode === 'ENTERPRISE' ? 'text-amber-500' : planCode === 'PROFESSIONAL' ? 'text-teal-600' : planCode === 'STARTER' ? 'text-blue-500' : 'text-slate-500'}`} />
                      <h3 className="font-bold text-slate-900 dark:text-slate-100">{plan.name}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">{plan.description}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">NPR {fmt(price)}</span>
                      <span className="text-slate-400 text-sm mb-1">/{billing === 'yearly' ? 'yr' : 'mo'}</span>
                    </div>
                    {billing === 'yearly' && plan.priceMonthly && (
                      <p className="text-xs text-green-600 mt-1">
                        Saves NPR {fmt(Number(plan.priceMonthly || 0) * 12 - Number(plan.priceYearly || 0))} annually
                      </p>
                    )}
                  </div>
                  <div className="px-5 py-5 space-y-4 bg-white dark:bg-slate-900">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: 'Doctors', value: limit(plan.maxDoctors ?? plan.max_doctors) },
                        { label: 'Patients', value: limit(plan.maxPatients ?? plan.max_patients) },
                        { label: 'Branches', value: limit(plan.maxBranches ?? plan.max_branches) },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                          <p className="text-base font-bold text-slate-900 dark:text-slate-100">{value}</p>
                          <p className="text-[10px] text-slate-400">{label}</p>
                        </div>
                      ))}
                    </div>
                    <ul className="space-y-2">
                      {(plan.features || []).map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button className={`w-full h-10 rounded-xl text-sm font-semibold transition-colors ${isFeatured ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20' : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                      Get Started
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'subscriptions' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-medium text-sm text-slate-800 dark:text-slate-100">Hospital Subscriptions</h3>
            <span className="text-xs text-slate-400">{subscriptions.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Hospital</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Cycle</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Start Date</th>
                  <th className="px-4 py-3 font-medium">End Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
                ) : subscriptions.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="h-8 w-8 text-slate-200" />
                      <p className="text-slate-400 text-sm">No subscriptions yet</p>
                    </div>
                  </td></tr>
                ) : subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">Hospital #{sub.hospital_id || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                        {sub.plan_name || `Plan #${sub.plan_id}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 capitalize">{sub.billing_cycle}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${sub.status === 'active' ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{sub.start_date || '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{sub.end_date || 'Ongoing'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Plan Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Create Subscription Plan</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>
            <form onSubmit={submitPlan} className="p-6 grid grid-cols-2 gap-4">
              {[
                { label: 'Plan Name *', key: 'name', col: 2, required: true },
                { label: 'Code *', key: 'code', placeholder: 'BASIC', required: true },
                { label: 'Monthly Price (NPR)', key: 'price_monthly', type: 'number' },
                { label: 'Yearly Price (NPR)', key: 'price_yearly', type: 'number' },
                { label: 'Max Doctors (-1 = unlimited)', key: 'max_doctors', type: 'number', placeholder: '-1' },
                { label: 'Max Patients (-1 = unlimited)', key: 'max_patients', type: 'number', placeholder: '-1' },
                { label: 'Max Branches (-1 = unlimited)', key: 'max_branches', type: 'number', placeholder: '1' },
              ].map(({ label, key, col, required, type = 'text', placeholder }) => (
                <div key={key} className={col === 2 ? 'col-span-2' : ''}>
                  <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                  <input
                    type={type} value={form[key]} placeholder={placeholder} required={required}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="h-9 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2 flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 h-9 rounded-md border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300">Cancel</button>
                <button type="submit" className="flex-1 h-9 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium">Create Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
