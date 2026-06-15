import { useState, useEffect, useCallback } from 'react';
import { FlaskConical, Plus, RefreshCw, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Clock, Loader2, BrainCircuit, FileText, X, Search, Filter } from 'lucide-react';
import { labOrdersAPI, aiAPI, patientsAPI, appointmentsAPI } from '../api/services.js';
import { useAuth } from '../hooks/useAuth.js';
import { hasPermission } from '../lib/permissions.js';

const TESTS_CATALOG = [
  { name: 'Complete Blood Count (CBC)', code: 'CBC', category: 'Hematology' },
  { name: 'Basic Metabolic Panel (BMP)', code: 'BMP', category: 'Chemistry' },
  { name: 'Comprehensive Metabolic Panel (CMP)', code: 'CMP', category: 'Chemistry' },
  { name: 'Lipid Panel', code: 'LIPID', category: 'Chemistry' },
  { name: 'Thyroid Stimulating Hormone (TSH)', code: 'TSH', category: 'Endocrinology' },
  { name: 'Hemoglobin A1c (HbA1c)', code: 'HBA1C', category: 'Endocrinology' },
  { name: 'Liver Function Tests (LFT)', code: 'LFT', category: 'Chemistry' },
  { name: 'Kidney Function Tests (KFT)', code: 'KFT', category: 'Chemistry' },
  { name: 'Urinalysis (UA)', code: 'UA', category: 'Urinalysis' },
  { name: 'Blood Glucose (Fasting)', code: 'FBS', category: 'Chemistry' },
  { name: 'Prothrombin Time (PT/INR)', code: 'PT', category: 'Coagulation' },
  { name: 'C-Reactive Protein (CRP)', code: 'CRP', category: 'Immunology' },
  { name: 'Erythrocyte Sedimentation Rate (ESR)', code: 'ESR', category: 'Hematology' },
  { name: 'HIV Test (ELISA)', code: 'HIV', category: 'Serology' },
  { name: 'Hepatitis B Surface Antigen (HBsAg)', code: 'HBSAG', category: 'Serology' },
  { name: 'Blood Culture & Sensitivity', code: 'BC', category: 'Microbiology' },
  { name: 'Urine Culture & Sensitivity', code: 'UC', category: 'Microbiology' },
  { name: 'Chest X-Ray', code: 'CXR', category: 'Radiology' },
  { name: 'Electrocardiogram (ECG)', code: 'ECG', category: 'Cardiology' },
  { name: 'Troponin I', code: 'TROP', category: 'Cardiology' },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300', icon: Clock },
  collected: { label: 'Collected', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300', icon: FlaskConical },
  processing: { label: 'Processing', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300', icon: Loader2 },
  completed: { label: 'Completed', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300', icon: X },
};

const PRIORITY_CONFIG = {
  routine: { label: 'Routine', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  urgent: { label: 'Urgent', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300' },
  stat: { label: 'STAT', color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' },
};

function Badge({ config, value }) {
  const cfg = config[value] || { label: value, color: 'bg-slate-100 text-slate-600' };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {Icon && <Icon size={10} />}
      {cfg.label}
    </span>
  );
}

function ResultRow({ result }) {
  const isAbnormal = result.abnormal_flag && result.abnormal_flag !== 'N';
  const isCritical = ['C', 'CH', 'CL'].includes(result.abnormal_flag);
  return (
    <tr className={`border-b border-slate-100 dark:border-slate-800 text-sm ${isCritical ? 'bg-red-50 dark:bg-red-950/20' : isAbnormal ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}>
      <td className="px-3 py-2 font-medium">{result.test_name}</td>
      <td className="px-3 py-2">{result.result_value} {result.unit}</td>
      <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{result.reference_range || '—'}</td>
      <td className="px-3 py-2">
        {isCritical ? (
          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold"><AlertTriangle size={12} /> CRITICAL</span>
        ) : isAbnormal ? (
          <span className="text-amber-600 dark:text-amber-400 font-medium">Abnormal {result.abnormal_flag}</span>
        ) : (
          <span className="text-emerald-600 dark:text-emerald-400">Normal</span>
        )}
      </td>
    </tr>
  );
}

function CreateOrderModal({ onClose, onSuccess }) {
  const [patients, setPatients] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [form, setForm] = useState({ patient_id: '', priority: 'routine', clinical_notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [testSearch, setTestSearch] = useState('');

  useEffect(() => {
    patientsAPI.list({ limit: 200 }).then(r => setPatients(r.items || r)).catch(() => {});
  }, []);

  const filteredTests = TESTS_CATALOG.filter(t =>
    t.name.toLowerCase().includes(testSearch.toLowerCase()) || t.category.toLowerCase().includes(testSearch.toLowerCase())
  );

  const toggleTest = (test) => {
    setSelectedTests(prev =>
      prev.find(t => t.code === test.code) ? prev.filter(t => t.code !== test.code) : [...prev, test]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient_id) { setError('Please select a patient.'); return; }
    if (selectedTests.length === 0) { setError('Please select at least one test.'); return; }
    setSaving(true);
    setError('');
    try {
      await labOrdersAPI.create({ ...form, tests: selectedTests });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to create order.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">New Lab Order</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-4 py-2 rounded-lg">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Patient *</label>
              <select value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                <option value="">Select patient…</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Clinical Notes</label>
            <textarea value={form.clinical_notes} onChange={e => setForm(f => ({ ...f, clinical_notes: e.target.value }))} rows={2}
              placeholder="Reason for tests, relevant history…"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Tests *</label>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={testSearch} onChange={e => setTestSearch(e.target.value)} placeholder="Search tests…"
                className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
            </div>
            <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTests.map(test => {
                const checked = selectedTests.some(t => t.code === test.code);
                return (
                  <label key={test.code} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 ${checked ? 'bg-teal-50 dark:bg-teal-950/30' : ''}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleTest(test)} className="accent-teal-600" />
                    <span className="flex-1 text-sm text-slate-800 dark:text-slate-200">{test.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{test.category}</span>
                  </label>
                );
              })}
            </div>
            {selectedTests.length > 0 && (
              <p className="mt-1.5 text-xs text-teal-600 dark:text-teal-400">{selectedTests.length} test{selectedTests.length > 1 ? 's' : ''} selected</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Create Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddResultsModal({ order, onClose, onSuccess }) {
  const [results, setResults] = useState(
    (order.tests || []).map(t => ({ test_name: t.name, test_code: t.code, result_value: '', unit: '', reference_range: '', status: 'pending', abnormal_flag: '' }))
  );
  const [saving, setSaving] = useState(false);

  const updateResult = (i, field, value) => {
    setResults(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await labOrdersAPI.addResults(order.id, { results: results.filter(r => r.result_value) });
      onSuccess();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Enter Results — {order.order_number}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {results.map((r, i) => (
            <div key={i} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{r.test_name}</p>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs text-slate-500 mb-1">Result Value</label>
                  <input value={r.result_value} onChange={e => updateResult(i, 'result_value', e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100" placeholder="e.g. 5.2" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Unit</label>
                  <input value={r.unit} onChange={e => updateResult(i, 'unit', e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100" placeholder="mmol/L" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Reference Range</label>
                  <input value={r.reference_range} onChange={e => updateResult(i, 'reference_range', e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100" placeholder="3.5–5.1" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Flag</label>
                  <select value={r.abnormal_flag} onChange={e => updateResult(i, 'abnormal_flag', e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100">
                    <option value="">Normal</option>
                    <option value="H">High (H)</option>
                    <option value="L">Low (L)</option>
                    <option value="CH">Critical High</option>
                    <option value="CL">Critical Low</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save Results
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrderCard({ order, canManage, canResults, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [showAddResults, setShowAddResults] = useState(false);
  const [interpreting, setInterpreting] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState(null);
  const [detail, setDetail] = useState(null);

  const handleExpand = async () => {
    if (!expanded && !detail) {
      const data = await labOrdersAPI.retrieve(order.id).catch(() => null);
      setDetail(data);
    }
    setExpanded(!expanded);
  };

  const handleStatusUpdate = async (status) => {
    await labOrdersAPI.update(order.id, { status }).catch(() => {});
    onRefresh();
  };

  const handleInterpret = async () => {
    const results = detail?.results || [];
    if (results.length === 0) return;
    setInterpreting(true);
    try {
      const data = await aiAPI.labInterpret({ lab_order_id: order.id, results: results.map(r => ({ test_name: r.test_name, result_value: r.result_value, unit: r.unit, reference_range: r.reference_range })) });
      setAiInterpretation(data);
    } finally {
      setInterpreting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <button type="button" onClick={handleExpand} className="w-full flex items-center gap-4 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center shrink-0">
          <FlaskConical size={18} className="text-teal-600 dark:text-teal-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{order.order_number}</span>
            <Badge config={STATUS_CONFIG} value={order.status} />
            <Badge config={PRIORITY_CONFIG} value={order.priority} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {order.patient_name && <span className="font-medium text-slate-700 dark:text-slate-300 mr-2">{order.patient_name}</span>}
            {Array.isArray(order.tests) ? order.tests.map(t => t.name || t).join(', ') : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 hidden sm:block">{order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}</span>
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          <div className="p-4 space-y-4">
            {order.clinical_notes && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Clinical Notes</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{order.clinical_notes}</p>
              </div>
            )}

            {detail?.results?.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Results</p>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">Test</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">Value</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">Reference</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.results.map((r) => <ResultRow key={r.id} result={r} />)}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {aiInterpretation && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <BrainCircuit size={16} className="text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">AI Lab Interpretation</p>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200">{aiInterpretation.overall_summary}</p>
                {aiInterpretation.critical_alerts?.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1 uppercase tracking-wide flex items-center gap-1"><AlertTriangle size={11} /> Critical Alerts</p>
                    <ul className="space-y-1">
                      {aiInterpretation.critical_alerts.map((a, i) => <li key={i} className="text-sm text-red-700 dark:text-red-300">• {a}</li>)}
                    </ul>
                  </div>
                )}
                {aiInterpretation.clinical_recommendations?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-1">Recommendations</p>
                    <ul className="space-y-0.5">
                      {aiInterpretation.clinical_recommendations.map((r, i) => <li key={i} className="text-sm text-blue-700 dark:text-blue-200">• {r}</li>)}
                    </ul>
                  </div>
                )}
                <p className="text-xs text-slate-400 dark:text-slate-500">{aiInterpretation.disclaimer}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {canResults && order.status !== 'cancelled' && order.status !== 'completed' && (
                <button onClick={() => handleStatusUpdate('collected')} className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium">
                  Mark Collected
                </button>
              )}
              {canResults && order.status === 'collected' && (
                <button onClick={() => setShowAddResults(true)} className="px-3 py-1.5 text-xs rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium flex items-center gap-1">
                  <Plus size={12} /> Enter Results
                </button>
              )}
              {canManage && detail?.results?.length > 0 && (
                <button onClick={handleInterpret} disabled={interpreting} className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1 disabled:opacity-50">
                  {interpreting ? <Loader2 size={12} className="animate-spin" /> : <BrainCircuit size={12} />}
                  AI Interpret
                </button>
              )}
              {canManage && order.status !== 'cancelled' && order.status !== 'completed' && (
                <button onClick={() => handleStatusUpdate('cancelled')} className="px-3 py-1.5 text-xs rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-medium">
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddResults && (
        <AddResultsModal order={order} onClose={() => setShowAddResults(false)} onSuccess={() => { setShowAddResults(false); setDetail(null); setExpanded(false); onRefresh(); }} />
      )}
    </div>
  );
}

export default function LabOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');

  const canCreate = hasPermission(user?.role, 'labOrders.manage');
  const canManage = hasPermission(user?.role, 'labOrders.manage');
  const canResults = hasPermission(user?.role, 'labOrders.results') || hasPermission(user?.role, 'labOrders.update');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await labOrdersAPI.list({ status: statusFilter || undefined, priority: priorityFilter || undefined });
      setOrders(data.items || data || []);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  }, [statusFilter, priorityFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter(o =>
    !search || o.order_number?.toLowerCase().includes(search.toLowerCase()) || o.patient_name?.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FlaskConical size={24} className="text-teal-600" /> Lab Orders
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage laboratory investigations and results</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          {canCreate && (
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium">
              <Plus size={16} /> New Order
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Orders', value: counts.all, color: 'text-slate-900 dark:text-slate-100' },
          { label: 'Pending', value: counts.pending, color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Completed', value: counts.completed, color: 'text-emerald-600 dark:text-emerald-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
            <p className="text-2xl font-bold {stat.color}" style={{}}><span className={stat.color}>{stat.value}</span></p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders or patients…"
            className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500">
          <option value="">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500">
          <option value="">All Priorities</option>
          {Object.entries(PRIORITY_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-teal-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <FlaskConical size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No lab orders found</p>
          {canCreate && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Click "New Order" to create the first one</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <OrderCard key={order.id} order={order} canManage={canManage} canResults={canResults} onRefresh={load} />
          ))}
        </div>
      )}

      {showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); load(); }} />}
    </div>
  );
}
