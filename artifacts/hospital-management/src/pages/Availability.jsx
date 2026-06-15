import { useEffect, useState } from 'react';
import { Calendar, Clock, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { availabilityAPI } from '../api/services.js';
import PageHeader from '../components/common/PageHeader.jsx';
import { useAuth } from '../hooks/useAuth.js';

const DAYS = [
  { id: 0, name: 'Sunday', short: 'Sun' },
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
];

const TIME_OPTIONS = [];
for (let h = 6; h <= 22; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    TIME_OPTIONS.push(`${hh}:${mm}`);
  }
}

export default function Availability() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [availability, setAvailability] = useState({});
  const [editing, setEditing] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await availabilityAPI.list();
      const map = {};
      (res.data?.results || []).forEach((slot) => {
        map[slot.day_of_week] = slot;
      });
      setAvailability(map);
    } catch {
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDayToggle = (dayId) => {
    setEditing((prev) => {
      if (prev[dayId]) {
        const next = { ...prev };
        delete next[dayId];
        return next;
      }
      return {
        ...prev,
        [dayId]: {
          start_time: '09:00',
          end_time: '17:00',
          slot_duration: 30,
        },
      };
    });
  };

  const handleFieldChange = (dayId, field, value) => {
    setEditing((prev) => ({
      ...prev,
      [dayId]: { ...prev[dayId], [field]: value },
    }));
  };

  const handleSave = async (dayId) => {
    const slot = editing[dayId];
    if (!slot) return;
    setSaving(dayId);
    try {
      await availabilityAPI.create({
        day_of_week: dayId,
        start_time: slot.start_time,
        end_time: slot.end_time,
        slot_duration: slot.slot_duration,
      });
      toast.success(`${DAYS.find((d) => d.id === dayId)?.name} availability saved`);
      setEditing((prev) => {
        const next = { ...prev };
        delete next[dayId];
        return next;
      });
      await load();
    } catch {
      toast.error('Failed to save availability');
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (dayId) => {
    const slot = availability[dayId];
    if (!slot) return;
    setDeleting(dayId);
    try {
      await availabilityAPI.delete(slot.id);
      toast.success('Availability removed');
      await load();
    } catch {
      toast.error('Failed to remove availability');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6 max-w-[900px] mx-auto w-full">
      <PageHeader
        title="My Availability"
        subtitle="Set your working hours and appointment slot durations"
        kicker="Schedule"
      />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Weekly Schedule</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Click a day to add or edit your working hours for that day.</p>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {DAYS.map((day) => {
              const saved = availability[day.id];
              const isEditing = !!editing[day.id];
              const editSlot = editing[day.id];

              return (
                <div key={day.id} className="px-5 py-4">
                  <div className="flex items-start gap-4">
                    {/* Day label + toggle */}
                    <div className="w-28 shrink-0 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleDayToggle(day.id)}
                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                          saved || isEditing
                            ? 'text-teal-700 dark:text-teal-400'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          saved || isEditing
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {(saved || isEditing) && <CheckCircle2 className="w-3 h-3" />}
                        </div>
                        {day.name}
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {saved && !isEditing ? (
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{saved.start_time} — {saved.end_time}</span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                              {saved.slot_duration} min slots
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDayToggle(day.id)}
                              className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(day.id)}
                              disabled={deleting === day.id}
                              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : isEditing ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <div>
                              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Start Time</label>
                              <select
                                value={editSlot.start_time}
                                onChange={(e) => handleFieldChange(day.id, 'start_time', e.target.value)}
                                className="h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                              >
                                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">End Time</label>
                              <select
                                value={editSlot.end_time}
                                onChange={(e) => handleFieldChange(day.id, 'end_time', e.target.value)}
                                className="h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                              >
                                {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Slot Duration</label>
                              <select
                                value={editSlot.slot_duration}
                                onChange={(e) => handleFieldChange(day.id, 'slot_duration', Number(e.target.value))}
                                className="h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                              >
                                <option value={15}>15 min</option>
                                <option value={20}>20 min</option>
                                <option value={30}>30 min</option>
                                <option value={45}>45 min</option>
                                <option value={60}>60 min</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSave(day.id)}
                              disabled={saving === day.id}
                              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium disabled:opacity-50"
                            >
                              {saving === day.id ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              onClick={() => handleDayToggle(day.id)}
                              className="h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDayToggle(day.id)}
                          className="text-xs text-slate-400 dark:text-slate-500 hover:text-teal-700 dark:hover:text-teal-400 transition-colors flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add hours
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="rounded-xl border border-teal-100 dark:border-teal-900/40 bg-teal-50/50 dark:bg-teal-950/20 p-5">
        <div className="flex gap-3">
          <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-teal-800 dark:text-teal-200">How availability works</p>
            <ul className="mt-2 space-y-1 text-xs text-teal-700 dark:text-teal-300 list-disc list-inside">
              <li>Patients can only book appointments during your available slots</li>
              <li>Slot duration determines how long each appointment can be</li>
              <li>Booked slots are automatically marked as unavailable</li>
              <li>You can update your schedule at any time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
