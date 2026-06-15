import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Search, ChevronLeft, ChevronRight, CheckCircle2,
  Calendar, Clock, Stethoscope, User, ArrowLeft, AlertCircle,
} from 'lucide-react';
import { doctorsAPI, availabilityAPI, appointmentsAPI } from '../api/services.js';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function fmt12(time) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2,'0')} ${period}`;
}

function calDays(year, month) {
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < first; i++) days.push(null);
  for (let d = 1; d <= total; d++) days.push(d);
  return days;
}

function isoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

/* ─── Step indicator ─────────────────────────────────────────────────────── */
function StepBar({ step }) {
  const steps = ['Choose Doctor', 'Pick Date & Time', 'Confirm'];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = step > idx;
        const active = step === idx;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                done ? 'bg-teal-600 border-teal-600 text-white' :
                active ? 'bg-white dark:bg-slate-900 border-teal-600 text-teal-700 dark:text-teal-400' :
                'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : idx}
              </div>
              <span className={`text-[11px] font-medium hidden sm:block ${
                active ? 'text-teal-700 dark:text-teal-400' :
                done ? 'text-slate-600 dark:text-slate-300' :
                'text-slate-400'
              }`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-2 transition-colors ${done ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Step 1: Doctor picker ──────────────────────────────────────────────── */
function StepDoctor({ onSelect }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    doctorsAPI.list().then((r) => setDoctors(r.items || [])).catch(() => toast.error('Failed to load doctors')).finally(() => setLoading(false));
  }, []);

  const specializations = [...new Set(doctors.map((d) => d.specialization).filter(Boolean))].sort();

  const filtered = doctors.filter((d) => {
    const name = `${d.first_name || ''} ${d.last_name || ''} ${d.name || ''}`.toLowerCase();
    const matchQ = !query || name.includes(query.toLowerCase()) || (d.specialization || '').toLowerCase().includes(query.toLowerCase());
    const matchF = !filter || d.specialization === filter;
    return matchQ && matchF;
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Choose a Doctor</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Select the doctor you'd like to see</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or specialty…"
            className="h-9 w-full pl-9 pr-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
        >
          <option value="">All specialties</option>
          {specializations.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map((i) => <div key={i} className="h-28 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Stethoscope className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No doctors match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((doc) => {
            const name = doc.name || `${doc.first_name || ''} ${doc.last_name || ''}`.trim() || `Doctor #${doc.id}`;
            const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => onSelect(doc)}
                className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-teal-500 dark:hover:border-teal-600 hover:shadow-md transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 flex items-center justify-center text-sm font-bold border border-slate-200 dark:border-slate-700 shrink-0 group-hover:bg-teal-100 dark:group-hover:bg-teal-950/60 transition-colors">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">Dr. {name}</p>
                  {doc.specialization && (
                    <p className="text-xs text-teal-700 dark:text-teal-400 font-medium mt-0.5">{doc.specialization}</p>
                  )}
                  {doc.department && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{doc.department}</p>
                  )}
                  {doc.experience && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{doc.experience} yrs experience</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-teal-500 transition-colors shrink-0 mt-1 ml-auto" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Step 2: Date + Slot picker ─────────────────────────────────────────── */
function StepDateTime({ doctor, onSelect, onBack }) {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [noAvailability, setNoAvailability] = useState(false);

  const days = calDays(calYear, calMonth);
  const todayStr = isoDate(today.getFullYear(), today.getMonth(), today.getDate());

  const name = doctor.name || `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();

  const loadSlots = async (dateStr) => {
    setSlotsLoading(true);
    setNoAvailability(false);
    setSlots([]);
    try {
      const res = await availabilityAPI.getSlots(doctor.id, dateStr);
      if (res.data?.slots?.length === 0) {
        setNoAvailability(true);
      } else {
        setSlots(res.data?.slots || []);
      }
    } catch {
      toast.error('Failed to load time slots');
    } finally {
      setSlotsLoading(false);
    }
  };

  const selectDate = (day) => {
    if (!day) return;
    const dateStr = isoDate(calYear, calMonth, day);
    if (dateStr < todayStr) return;
    setSelectedDate(dateStr);
    loadSlots(dateStr);
  };

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
    setSelectedDate(null); setSlots([]);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
    setSelectedDate(null); setSlots([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mt-0.5">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Pick Date & Time</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Appointment with <span className="font-medium text-teal-700 dark:text-teal-400">Dr. {name}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={prevMonth} className="h-8 w-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{MONTHS[calMonth]} {calYear}</p>
            <button type="button" onClick={nextMonth} className="h-8 w-8 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {DAYS_SHORT.map((d) => (
              <div key={d} className="h-8 flex items-center justify-center text-[11px] font-medium text-slate-400 uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {days.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const dateStr = isoDate(calYear, calMonth, day);
              const isPast = dateStr < todayStr;
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === todayStr;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDate(day)}
                  disabled={isPast}
                  className={`h-9 w-full rounded-lg text-sm font-medium transition-all flex items-center justify-center
                    ${isSelected ? 'bg-teal-600 text-white shadow-sm' :
                      isToday ? 'ring-2 ring-teal-500 ring-offset-1 dark:ring-offset-slate-900 text-teal-700 dark:text-teal-400' :
                      isPast ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' :
                      'text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:text-teal-700 dark:hover:text-teal-400'
                    }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slots */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {selectedDate
                ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                : 'Available Slots'}
            </p>
          </div>

          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Select a date to see available times</p>
            </div>
          ) : slotsLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : noAvailability ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Not available this day</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Dr. {name} doesn't have working hours set for this day. Try another date.</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-64 pr-1">
              <div className="grid grid-cols-2 gap-2">
                {slots.map(({ time, available }) => (
                  <button
                    key={time}
                    type="button"
                    disabled={!available}
                    onClick={() => onSelect({ date: selectedDate, time })}
                    className={`h-10 rounded-lg text-sm font-medium border transition-all ${
                      available
                        ? 'border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 bg-teal-50/60 dark:bg-teal-950/30 hover:bg-teal-600 hover:text-white hover:border-teal-600 hover:shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400 bg-slate-100 dark:bg-slate-800 cursor-not-allowed line-through'
                    }`}
                  >
                    {fmt12(time)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-teal-100 border border-teal-200" />
                  <span className="text-[11px] text-slate-500">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700" />
                  <span className="text-[11px] text-slate-500">Booked</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Step 3: Confirm ────────────────────────────────────────────────────── */
function StepConfirm({ doctor, date, time, onBack, onConfirm, isSubmitting }) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const name = doctor.name || `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mt-0.5">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Confirm Appointment</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Review details and provide visit information</p>
        </div>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-teal-100 dark:border-teal-900/50 bg-teal-50/50 dark:bg-teal-950/20 p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 flex items-center justify-center text-sm font-bold">
            {name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">Dr. {name}</p>
            {doctor.specialization && <p className="text-xs text-teal-700 dark:text-teal-400">{doctor.specialization}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-teal-100/60 dark:border-teal-900/30 p-3">
            <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wide">Date</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{formattedDate}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-teal-100/60 dark:border-teal-900/30 p-3">
            <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wide">Time</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{fmt12(time)}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-teal-700 dark:text-teal-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>This slot is available — your booking is not confirmed until you click "Book Appointment"</span>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Reason for Visit <span className="text-rose-500">*</span>
          </label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Annual checkup, follow-up, new symptoms…"
            className="h-10 w-full px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Additional Notes <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any additional info the doctor should know beforehand…"
            className="w-full px-3 py-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => onConfirm({ reason, notes })}
          disabled={isSubmitting || !reason.trim()}
          className="inline-flex items-center gap-2 h-10 px-6 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Booking…</>
          ) : (
            <><Calendar className="w-4 h-4" /> Book Appointment</>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Success screen ─────────────────────────────────────────────────────── */
function SuccessScreen({ doctor, date, time, onBookAnother }) {
  const navigate = useNavigate();
  const name = doctor.name || `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  return (
    <div className="flex flex-col items-center text-center py-8 space-y-6">
      <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center">
        <CheckCircle2 className="w-9 h-9 text-teal-600 dark:text-teal-400" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Appointment Booked!</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Your appointment request has been sent. You'll be notified when confirmed.</p>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-teal-100 dark:border-teal-900/40 bg-teal-50/50 dark:bg-teal-950/20 p-5 space-y-3 text-left">
        <div className="flex items-center gap-3">
          <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <div>
            <p className="text-xs text-slate-500">Doctor</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Dr. {name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <div>
            <p className="text-xs text-slate-500">Date</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <div>
            <p className="text-xs text-slate-500">Time</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{fmt12(time)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => navigate('/appointments')}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium"
        >
          View My Appointments
        </button>
        <button
          type="button"
          onClick={onBookAnother}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium"
        >
          Book Another
        </button>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function BookAppointment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [doctor, setDoctor] = useState(null);
  const [dateTime, setDateTime] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleDoctorSelect = (doc) => {
    setDoctor(doc);
    setStep(2);
  };

  const handleDateTimeSelect = ({ date, time }) => {
    setDateTime({ date, time });
    setStep(3);
  };

  const handleConfirm = async ({ reason, notes }) => {
    setIsSubmitting(true);
    try {
      await appointmentsAPI.create({
        doctor_id: doctor.id,
        date: dateTime.date,
        time: dateTime.time,
        reason,
        notes,
      });
      setDone(true);
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to book appointment. Please try again.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookAnother = () => {
    setStep(1);
    setDoctor(null);
    setDateTime(null);
    setDone(false);
  };

  return (
    <div className="max-w-[860px] mx-auto w-full space-y-2 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Book an Appointment</h1>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 sm:p-8">
        {done ? (
          <SuccessScreen doctor={doctor} date={dateTime.date} time={dateTime.time} onBookAnother={handleBookAnother} />
        ) : (
          <>
            <StepBar step={step} />
            {step === 1 && <StepDoctor onSelect={handleDoctorSelect} />}
            {step === 2 && <StepDateTime doctor={doctor} onSelect={handleDateTimeSelect} onBack={() => setStep(1)} />}
            {step === 3 && (
              <StepConfirm
                doctor={doctor}
                date={dateTime.date}
                time={dateTime.time}
                onBack={() => setStep(2)}
                onConfirm={handleConfirm}
                isSubmitting={isSubmitting}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
