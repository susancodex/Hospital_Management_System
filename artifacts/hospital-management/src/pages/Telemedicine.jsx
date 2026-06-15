import { useState, useEffect, useCallback } from 'react';
import { Video, VideoOff, Plus, ExternalLink, Clock, CheckCircle2, XCircle, Calendar, Search, Loader2, User, Stethoscope, Copy, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || '/api';

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  in_progress: { label: 'In Progress', color: 'text-green-600 bg-green-50 dark:bg-green-950/40 dark:text-green-400 border-green-200 dark:border-green-800' },
  completed: { label: 'Completed', color: 'text-slate-600 bg-slate-50 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700' },
  cancelled: { label: 'Cancelled', color: 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800' },
};

function Badge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function SessionCard({ session, onJoin, onUpdateStatus, role }) {
  const [copying, setCopying] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(session.join_url || session.room_url || '');
    setCopying(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopying(false), 2000);
  };

  const canJoin = session.status === 'scheduled' || session.status === 'in_progress';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-teal-300 dark:hover:border-teal-700 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-950/50 grid place-items-center shrink-0">
            <Video className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm">
              {session.doctor_name || `Session #${session.id}`}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" />
              {session.scheduled_at ? new Date(session.scheduled_at).toLocaleString() : 'Unscheduled'}
            </p>
          </div>
        </div>
        <Badge status={session.status} />
      </div>

      {session.notes && (
        <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2 mb-3 line-clamp-2">
          {session.notes}
        </p>
      )}

      {session.duration_minutes > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Duration: {session.duration_minutes} min
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {canJoin && (
          <a
            href={session.join_url || session.room_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onJoin(session.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Join Video Call
          </a>
        )}
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
        >
          <Copy className="h-3.5 w-3.5" />
          {copying ? 'Copied!' : 'Copy Link'}
        </button>
        {(role === 'doctor' || role === 'admin') && session.status === 'in_progress' && (
          <button
            type="button"
            onClick={() => onUpdateStatus(session.id, 'completed')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 text-xs font-medium transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            End Session
          </button>
        )}
        {(role === 'doctor' || role === 'admin') && session.status === 'scheduled' && (
          <button
            type="button"
            onClick={() => onUpdateStatus(session.id, 'cancelled')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-medium transition-colors"
          >
            <XCircle className="h-3.5 w-3.5" />
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default function Telemedicine() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const role = user?.role || 'patient';

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ doctor_id: '', patient_id: '', scheduled_at: '', notes: '' });
  const [creating, setCreating] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const qs = statusFilter ? `?status=${statusFilter}` : '';
      const r = await fetch(`${API}/telemedicine-sessions/${qs}`, { headers });
      const data = await r.json();
      setSessions(data.results || []);
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  const fetchDoctors = useCallback(async () => {
    try {
      const r = await fetch(`${API}/doctors/`, { headers });
      const data = await r.json();
      setDoctors(data.results || []);
    } catch {}
  }, [token]);

  const fetchPatients = useCallback(async () => {
    try {
      const r = await fetch(`${API}/patients/`, { headers });
      const data = await r.json();
      setPatients(data.results || []);
    } catch {}
  }, [token]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);
  useEffect(() => {
    if (showCreate) { fetchDoctors(); fetchPatients(); }
  }, [showCreate, fetchDoctors, fetchPatients]);

  const handleJoin = async (id) => {
    try {
      await fetch(`${API}/telemedicine-sessions/${id}/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'in_progress' }),
      });
      fetchSessions();
    } catch {}
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await fetch(`${API}/telemedicine-sessions/${id}/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      });
      toast.success(`Session ${status === 'completed' ? 'ended' : 'cancelled'}`);
      fetchSessions();
    } catch {
      toast.error('Failed to update session');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.doctor_id || !form.patient_id) {
      toast.error('Doctor and patient are required');
      return;
    }
    setCreating(true);
    try {
      const r = await fetch(`${API}/telemedicine-sessions/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          doctor_id: form.doctor_id,
          patient_id: form.patient_id,
          scheduled_at: form.scheduled_at || null,
          notes: form.notes,
        }),
      });
      if (!r.ok) throw new Error();
      toast.success('Video session created');
      setShowCreate(false);
      setForm({ doctor_id: '', patient_id: '', scheduled_at: '', notes: '' });
      fetchSessions();
    } catch {
      toast.error('Failed to create session');
    } finally {
      setCreating(false);
    }
  };

  const active = sessions.filter((s) => s.status === 'scheduled' || s.status === 'in_progress');
  const past = sessions.filter((s) => s.status === 'completed' || s.status === 'cancelled');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Video className="h-5 w-5 text-teal-600" />
            Telemedicine
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Video consultations via secure Jitsi rooms</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300"
          >
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            type="button"
            onClick={fetchSessions}
            className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 grid place-items-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {(role === 'admin' || role === 'doctor' || role === 'reception') && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="h-9 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Session
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions', value: sessions.length, icon: Video, color: 'teal' },
          { label: 'Scheduled', value: sessions.filter(s => s.status === 'scheduled').length, icon: Calendar, color: 'blue' },
          { label: 'In Progress', value: sessions.filter(s => s.status === 'in_progress').length, icon: VideoOff, color: 'green' },
          { label: 'Completed', value: sessions.filter(s => s.status === 'completed').length, icon: CheckCircle2, color: 'slate' },
        ].map((stat) => {
          const Icon = stat.icon;
          const colors = {
            teal: 'from-teal-50 to-teal-100/50 dark:from-teal-950/40 dark:to-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300',
            blue: 'from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
            green: 'from-green-50 to-green-100/50 dark:from-green-950/40 dark:to-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
            slate: 'from-slate-50 to-slate-100/50 dark:from-slate-800/40 dark:to-slate-700/20 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
          };
          return (
            <div key={stat.label} className={`rounded-xl border bg-gradient-to-br p-4 ${colors[stat.color]}`}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 opacity-70" />
                <span className="text-xs font-medium opacity-70">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Video className="h-5 w-5 text-teal-600" /> Schedule Video Session
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Doctor *</label>
                <select
                  value={form.doctor_id}
                  onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200"
                  required
                >
                  <option value="">Select doctor…</option>
                  {doctors.map((d) => (
                    <option key={d.user_id || d.id} value={d.user_id || d.id}>
                      Dr. {d.first_name || ''} {d.last_name || ''} — {d.specialization || d.department}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Patient *</label>
                <select
                  value={form.patient_id}
                  onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200"
                  required
                >
                  <option value="">Select patient…</option>
                  {patients.map((p) => (
                    <option key={p.user_id || p.id} value={p.user_id || p.id}>
                      {p.first_name || ''} {p.last_name || ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Notes / Reason</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Consultation reason…"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 resize-none"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-100 dark:border-blue-900">
                A secure Jitsi room link will be generated and shared with both doctor and patient.
              </p>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
                <button type="submit" disabled={creating} className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-60">
                  {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400">
          <Video className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No sessions found</p>
          <p className="text-sm mt-1">Create your first video consultation session</p>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Active & Scheduled ({active.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((s) => (
                  <SessionCard key={s.id} session={s} onJoin={handleJoin} onUpdateStatus={handleUpdateStatus} role={role} />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Past Sessions ({past.length})</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {past.map((s) => (
                  <SessionCard key={s.id} session={s} onJoin={handleJoin} onUpdateStatus={handleUpdateStatus} role={role} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
