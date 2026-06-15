import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { BrainCircuit, MessageSquare, Stethoscope, FileSearch, Activity, Send, AlertTriangle, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { aiAPI, insightsAPI, appointmentsAPI } from '../api/services.js';
import { useAuth } from '../hooks/useAuth.js';
import AppModal from '../components/common/AppModal.jsx';
import { EmptyState, TableSkeleton } from '../components/common/LoadingState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';

const DISCLAIMER = '⚠️ This is for informational purposes only — not a substitute for professional medical advice.';

const TAB_PATIENT = [
  { id: 'chat', label: 'Health Assistant', icon: MessageSquare },
  { id: 'symptoms', label: 'Symptom Check', icon: Stethoscope },
  { id: 'insights', label: 'My Overview', icon: Activity },
];

const TAB_DOCTOR = [
  { id: 'assistant', label: 'AI Assistant', icon: BrainCircuit },
  { id: 'insights', label: 'Operational', icon: Activity },
  { id: 'symptoms', label: 'Symptom Tool', icon: Stethoscope },
];

const TAB_ADMIN = [
  { id: 'insights', label: 'Operational', icon: Activity },
  { id: 'assistant', label: 'AI Assistant', icon: BrainCircuit },
  { id: 'symptoms', label: 'Symptom Tool', icon: Stethoscope },
];

export default function AiTriage() {
  const { user } = useAuth();
  const role = user?.role || 'patient';
  const tabs = role === 'patient' ? TAB_PATIENT : role === 'doctor' ? TAB_DOCTOR : TAB_ADMIN;
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto w-full">
      <PageHeader
        title={role === 'patient' ? 'Health Centre' : 'AI Centre'}
        subtitle={role === 'patient' ? 'Your personal health assistant and symptom checker' : 'AI-powered clinical intelligence and operational insights'}
        kicker="AI"
      />

      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 rounded-lg p-1 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <div className="animate-rise">
        {activeTab === 'chat' && <HealthChat />}
        {activeTab === 'symptoms' && <SymptomAnalyzer />}
        {activeTab === 'assistant' && <DoctorAssistant />}
        {activeTab === 'insights' && <OperationalInsights />}
      </div>
    </div>
  );
}

/* ─── Health Chat ───────────────────────────────────────────────────────────── */
function HealthChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm MedAssist, your AI health assistant. I can help with general wellness questions, explain medical terms, assist with appointment info, or guide you on when to see a doctor. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const history = messages.slice(-8);
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await aiAPI.chat(text, history);
      setMessages((m) => [...m, { role: 'assistant', content: res.data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, I encountered an issue. Please try again or contact the front desk.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col" style={{ height: '520px' }}>
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950/40 grid place-items-center">
          <MessageSquare size={15} className="text-teal-700 dark:text-teal-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">MedAssist Chat</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">AI health assistant · Not a substitute for medical advice</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-teal-700 text-white rounded-tr-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask about symptoms, appointments, wellness…"
            className="flex-1 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm outline-none focus:border-teal-500"
          />
          <button
            type="button"
            onClick={send}
            disabled={loading || !input.trim()}
            className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-teal-700 hover:bg-teal-800 text-white disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 text-center">{DISCLAIMER}</p>
      </div>
    </div>
  );
}

/* ─── Symptom Analyzer ──────────────────────────────────────────────────────── */
function SymptomAnalyzer() {
  const [form, setForm] = useState({ symptoms: '', age: '', gender: '', duration: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!form.symptoms.trim()) { toast.error('Please describe your symptoms'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await aiAPI.analyzeSymptoms(form);
      setResult(res.data);
    } catch {
      toast.error('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const riskColors = {
    low: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900/50 dark:text-emerald-300',
    medium: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-300',
    high: 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/50 dark:text-rose-300',
    emergency: 'bg-rose-100 border-rose-400 text-rose-800 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-200',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Symptom Checker</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Describe your symptoms for an AI-powered triage assessment</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Describe your symptoms *</label>
          <textarea
            value={form.symptoms}
            onChange={(e) => setForm((f) => ({ ...f, symptoms: e.target.value }))}
            rows={4}
            placeholder="e.g. Persistent headache for 3 days, mild fever, sore throat, fatigue…"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm resize-none outline-none focus:border-teal-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Age</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
              placeholder="Years"
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm outline-none focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm outline-none"
            >
              <option value="">Any</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Duration</label>
            <input
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
              placeholder="e.g. 3 days"
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={analyze}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium disabled:opacity-50"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Analyzing…</> : <><Stethoscope size={16} /> Analyze Symptoms</>}
        </button>

        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">{DISCLAIMER}</p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5">
        {!result ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <Stethoscope size={40} className="text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Results will appear here</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Enter your symptoms and click Analyze</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`rounded-lg border p-4 ${riskColors[result.risk_level] || riskColors.medium}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase tracking-wide">Risk Level: {result.risk_level}</p>
                {result.risk_level === 'emergency' && <AlertTriangle size={18} />}
              </div>
              <p className="text-sm mt-1">{result.recommendation}</p>
              <p className="text-xs mt-1 opacity-80">See a doctor: {result.urgency}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Possible Conditions</p>
              <div className="flex flex-wrap gap-2">
                {(result.possible_conditions || []).map((c, i) => (
                  <span key={i} className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {result.specialist && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Recommended Specialist</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{result.specialist}</p>
              </div>
            )}

            {(result.warning_signs || []).length > 0 && (
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 p-3">
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1.5">⚠️ Seek emergency care if you experience:</p>
                <ul className="space-y-1">
                  {result.warning_signs.map((w, i) => (
                    <li key={i} className="text-xs text-rose-700 dark:text-rose-400">• {w}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-[10px] text-slate-400 dark:text-slate-500">{result.disclaimer}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Doctor AI Assistant ───────────────────────────────────────────────────── */
function DoctorAssistant() {
  const { user } = useAuth();
  const [form, setForm] = useState({ task: '', context: '', patient_id: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const TASKS = [
    'Summarize patient history',
    'Generate clinical notes',
    'Suggest differential diagnoses',
    'Recommend treatment approach',
    'Review prescription interactions',
    'Draft patient-friendly explanation',
  ];

  const run = async () => {
    if (!form.task.trim()) { toast.error('Please select or enter a task'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await aiAPI.doctorAssistant(form);
      setResult(res.data);
    } catch {
      toast.error('Assistant unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-teal-200 dark:border-teal-900/50 bg-teal-50/60 dark:bg-teal-950/20 p-4">
        <div className="flex items-start gap-3">
          <BrainCircuit size={18} className="text-teal-700 dark:text-teal-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-teal-800 dark:text-teal-300">AI Clinical Co-Pilot</p>
            <p className="text-xs text-teal-700/80 dark:text-teal-400/80 mt-0.5">AI suggestions are for reference only. All clinical decisions require your professional judgment and approval.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Quick tasks</label>
            <div className="flex flex-wrap gap-2">
              {TASKS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, task: t }))}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    form.task === t
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Task / Question *</label>
            <textarea
              value={form.task}
              onChange={(e) => setForm((f) => ({ ...f, task: e.target.value }))}
              rows={3}
              placeholder="What do you need the AI to help with?"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm resize-none outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Clinical context (optional)</label>
            <textarea
              value={form.context}
              onChange={(e) => setForm((f) => ({ ...f, context: e.target.value }))}
              rows={3}
              placeholder="Patient's presenting symptoms, chief complaint, relevant history…"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm resize-none outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Patient ID (for history lookup)</label>
            <input
              value={form.patient_id}
              onChange={(e) => setForm((f) => ({ ...f, patient_id: e.target.value }))}
              placeholder="Enter patient ID to pull their records"
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 text-sm outline-none focus:border-teal-500"
            />
          </div>

          <button
            type="button"
            onClick={run}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium disabled:opacity-50"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Processing…</> : <><BrainCircuit size={16} /> Run AI Assistant</>}
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5">
          {!result ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <BrainCircuit size={40} className="text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">AI output will appear here</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Select a task and run the assistant</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">AI Suggestion</p>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                {result.result}
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-3">
                <p className="text-xs text-amber-700 dark:text-amber-400">⚠️ {result.disclaimer}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Operational Insights ──────────────────────────────────────────────────── */
function OperationalInsights() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [remindedIds, setRemindedIds] = useState(new Set());
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await insightsAPI.getAiInsights();
      setInsights(res.data || null);
    } catch {
      toast.error('Unable to load insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = insights?.stats || {};
  const predictions = insights?.no_show_predictions || [];

  const submitReschedule = async () => {
    if (!rescheduleTarget || !rescheduleDate || !rescheduleTime) {
      toast.error('Select both date and time');
      return;
    }
    setSubmittingReschedule(true);
    try {
      const current = await appointmentsAPI.retrieve(rescheduleTarget.id);
      await appointmentsAPI.update(rescheduleTarget.id, {
        ...current.data,
        date: rescheduleDate,
        time: rescheduleTime,
        notes: `${current.data.notes || ''}${current.data.notes ? '\n' : ''}[AI] Rescheduled proactively.`,
      });
      toast.success('Appointment rescheduled');
      setRescheduleTarget(null);
      load();
    } catch {
      toast.error('Unable to reschedule');
    } finally {
      setSubmittingReschedule(false);
    }
  };

  if (loading) return <TableSkeleton rows={6} />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Patients" value={stats.total_patients ?? '—'} tone="teal" />
        <StatCard label="Total Doctors" value={stats.total_doctors ?? '—'} tone="indigo" />
        <StatCard label="Total Appointments" value={stats.total_appointments ?? '—'} tone="sky" />
        <StatCard label="Today" value={stats.today_appointments ?? '—'} tone="amber" />
        <StatCard label="Pending" value={stats.pending_appointments ?? '—'} tone="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Upcoming Appointments</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pending appointments requiring attention</p>
            </div>
            <button type="button" onClick={load} className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
              <RefreshCw size={13} />
            </button>
          </div>
          {predictions.length === 0 ? (
            <div className="p-6"><EmptyState title="No pending appointments" description="All clear for now." /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead className="bg-slate-50/60 dark:bg-slate-800/40">
                  <tr>
                    <th className="h-9 px-5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Patient</th>
                    <th className="h-9 px-5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Date/Time</th>
                    <th className="h-9 px-5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Risk</th>
                    <th className="h-9 px-5 text-right text-xs font-medium text-slate-500 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((p) => (
                    <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{p.patient_name}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{p.date} · {p.time}</td>
                      <td className="px-5 py-3"><StatusBadge value={p.risk} /></td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => { setRescheduleTarget(p); setRescheduleDate(p.date || ''); setRescheduleTime(p.time || ''); }}
                          className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md bg-teal-700 text-white text-xs font-medium hover:bg-teal-800"
                        >
                          Reschedule
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">AI Insights</h2>
          <div className="space-y-3">
            {(insights?.insights || []).map((ins) => (
              <div key={ins.id} className={`rounded-lg border p-3 ${
                ins.priority === 'high' ? 'border-rose-200 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-950/20' :
                ins.priority === 'medium' ? 'border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20' :
                'border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/30'
              }`}>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1">{ins.title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{ins.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AppModal
        open={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        title="Reschedule Appointment"
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setRescheduleTarget(null)} className="inline-flex h-9 items-center px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-medium">Cancel</button>
            <button type="button" onClick={submitReschedule} disabled={submittingReschedule} className="inline-flex h-9 items-center px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium disabled:opacity-50">
              {submittingReschedule ? 'Saving…' : 'Reschedule'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">New Date</label>
            <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">New Time</label>
            <input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} className="h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm" />
          </div>
        </div>
      </AppModal>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  const tones = {
    teal: 'border-teal-200 bg-teal-50/70 text-teal-700 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-300',
    indigo: 'border-indigo-200 bg-indigo-50/70 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300',
    sky: 'border-sky-200 bg-sky-50/70 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300',
    amber: 'border-amber-200 bg-amber-50/70 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300',
    rose: 'border-rose-200 bg-rose-50/70 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300',
  };
  return (
    <div className={`rounded-lg border p-4 ${tones[tone] || tones.teal}`}>
      <p className="text-[10px] uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
