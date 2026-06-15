import { useEffect, useMemo, useState } from 'react';
import { BellRing, CalendarClock, CheckCircle2, BrainCircuit } from 'lucide-react';
import { toast } from 'sonner';
import { appointmentsAPI, insightsAPI } from '../api/services.js';
import AppModal from '../components/common/AppModal.jsx';
import { EmptyState, TableSkeleton } from '../components/common/LoadingState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';

export default function AiTriage() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [remindedIds, setRemindedIds] = useState(new Set());
  const [followUpIds, setFollowUpIds] = useState(new Set());
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [submittingReschedule, setSubmittingReschedule] = useState(false);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const response = await insightsAPI.getAiInsights();
      setInsights(response.data || null);
    } catch {
      toast.error('Unable to load AI triage insights');
      setInsights(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const noShowPredictions = useMemo(() => insights?.no_show_predictions || [], [insights]);
  const patientRisks = useMemo(() => insights?.top_patient_risks || [], [insights]);

  const sendReminder = (prediction) => {
    setRemindedIds((current) => new Set([...current, prediction.appointment_id]));
    toast.success(`Reminder sent to ${prediction.patient_name}`);
  };

  const markFollowUp = async (prediction) => {
    try {
      const current = await appointmentsAPI.retrieve(prediction.appointment_id);
      const payload = {
        ...current.data,
        status: 'pending',
        notes: `${current.data.notes || ''}${current.data.notes ? '\n' : ''}[AI TRIAGE] Follow-up required due to high no-show risk.`,
      };
      await appointmentsAPI.update(prediction.appointment_id, payload);
      setFollowUpIds((currentIds) => new Set([...currentIds, prediction.appointment_id]));
      toast.success(`Follow-up marked for ${prediction.patient_name}`);
    } catch {
      toast.error('Unable to mark follow-up right now');
    }
  };

  const openReschedule = (prediction) => {
    setRescheduleTarget(prediction);
    setRescheduleDate(prediction.appointment_date || '');
    setRescheduleTime(prediction.appointment_time || '');
  };

  const submitReschedule = async () => {
    if (!rescheduleTarget || !rescheduleDate || !rescheduleTime) {
      toast.error('Select both date and time for rescheduling');
      return;
    }

    setSubmittingReschedule(true);
    try {
      const current = await appointmentsAPI.retrieve(rescheduleTarget.appointment_id);
      const payload = {
        ...current.data,
        appointment_date: rescheduleDate,
        appointment_time: rescheduleTime,
        status: 'scheduled',
        notes: `${current.data.notes || ''}${current.data.notes ? '\n' : ''}[AI TRIAGE] Appointment rescheduled proactively to reduce no-show risk.`,
      };
      await appointmentsAPI.update(rescheduleTarget.appointment_id, payload);
      toast.success(`Appointment rescheduled for ${rescheduleTarget.patient_name}`);
      setRescheduleTarget(null);
      await loadInsights();
    } catch {
      toast.error('Unable to reschedule appointment');
    } finally {
      setSubmittingReschedule(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full">
      <PageHeader
        title="AI Triage"
        subtitle="Operational intelligence for no-show prevention and patient risk prioritization"
        kicker="AI/ML"
      />

      {loading ? (
        <TableSkeleton rows={6} />
      ) : !insights ? (
        <EmptyState icon={BrainCircuit} title="No AI insights available" description="Try refreshing after backend data loads." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="High Risk Patients" value={insights.risk_summary?.high_risk_patients || 0} tone="rose" />
            <StatCard title="Medium Risk Patients" value={insights.risk_summary?.medium_risk_patients || 0} tone="amber" />
            <StatCard title="No-show Alerts" value={insights.risk_summary?.high_no_show_risk_appointments || 0} tone="indigo" />
            <StatCard title="Overdue Balance" value={`$${Number(insights.risk_summary?.overdue_balance || 0).toFixed(2)}`} tone="teal" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">No-show Prediction Queue</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Actionable appointments for the next 7 days</p>
              </div>

              {noShowPredictions.length === 0 ? (
                <div className="p-6">
                  <EmptyState title="No prediction alerts" description="No elevated no-show risk detected right now." />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-sm">
                    <thead className="bg-slate-50/60 dark:bg-slate-900/40">
                      <tr>
                        <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Appointment</th>
                        <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Patient</th>
                        <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Doctor</th>
                        <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Risk</th>
                        <th className="h-10 px-5 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {noShowPredictions.map((item) => {
                        const riskPct = Math.round(Number(item.no_show_probability || 0) * 100);
                        const highRisk = riskPct >= 50;
                        return (
                          <tr key={item.appointment_id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="px-5 py-3">
                              <p className="font-medium text-slate-900 dark:text-slate-100">#{item.appointment_id}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.appointment_date} • {item.appointment_time}</p>
                            </td>
                            <td className="px-5 py-3 text-slate-700 dark:text-slate-200">{item.patient_name}</td>
                            <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{item.doctor_name}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${highRisk ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                                {riskPct}%
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <div className="flex justify-end items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => sendReminder(item)}
                                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                  <BellRing className="w-3.5 h-3.5" />
                                  {remindedIds.has(item.appointment_id) ? 'Reminded' : 'Reminder'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openReschedule(item)}
                                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                  <CalendarClock className="w-3.5 h-3.5" /> Reschedule
                                </button>
                                <button
                                  type="button"
                                  onClick={() => markFollowUp(item)}
                                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-teal-700 text-white text-xs font-medium hover:bg-teal-800"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> {followUpIds.has(item.appointment_id) ? 'Follow-up set' : 'Follow-up'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Top Patient Risks</h2>
              </div>
              <div className="p-4 space-y-3">
                {patientRisks.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No high-risk patients identified.</p>
                ) : patientRisks.map((risk) => (
                  <div key={risk.patient_id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/40">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{risk.patient_name}</p>
                      <StatusBadge value={risk.risk_level} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Score: {risk.risk_score} • Balance: ${Number(risk.outstanding_balance || 0).toFixed(2)}</p>
                    <ul className="mt-2 space-y-1">
                      {(risk.reasons || []).slice(0, 3).map((reason, idx) => (
                        <li key={`${risk.patient_id}-${idx}`} className="text-xs text-slate-600 dark:text-slate-300">• {reason}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <AppModal
        open={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        title={rescheduleTarget ? `Reschedule #${rescheduleTarget.appointment_id}` : 'Reschedule'}
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setRescheduleTarget(null)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitReschedule}
              disabled={submittingReschedule}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium disabled:opacity-50"
            >
              Save
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">New Date</label>
            <input
              type="date"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">New Time</label>
            <input
              type="time"
              value={rescheduleTime}
              onChange={(e) => setRescheduleTime(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
            />
          </div>
        </div>
      </AppModal>
    </div>
  );
}

function StatCard({ title, value, tone }) {
  const toneClass = {
    rose: 'border-rose-200 bg-rose-50/70 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300',
    amber: 'border-amber-200 bg-amber-50/70 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300',
    indigo: 'border-indigo-200 bg-indigo-50/70 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-300',
    teal: 'border-teal-200 bg-teal-50/70 text-teal-700 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-300',
  };

  return (
    <div className={`rounded-lg border p-4 ${toneClass[tone] || toneClass.teal}`}>
      <p className="text-[11px] uppercase tracking-wide">{title}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
