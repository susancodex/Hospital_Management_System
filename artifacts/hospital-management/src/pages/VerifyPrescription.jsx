import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, Pill, AlertTriangle, QrCode } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '/api';

export default function VerifyPrescription() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setError('No verification token provided.'); setLoading(false); return; }
    fetch(`${API}/prescriptions/verify/${token}/`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Verification failed.');
        }
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const validUntil = data?.valid_until ? new Date(data.valid_until) : null;
  const isExpired = validUntil && validUntil < new Date();
  const medicines = Array.isArray(data?.medicines) ? data.medicines : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 dark:from-slate-950 dark:to-teal-950 grid place-items-center p-4">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900/40 mb-4">
            <QrCode className="h-6 w-6 text-teal-600 animate-pulse" />
          </div>
          <p className="text-slate-600 dark:text-slate-300">Verifying prescription…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 dark:from-slate-950 dark:to-red-950 grid place-items-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 p-8 shadow-lg text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 mb-4">
            <XCircle className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Verification Failed</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{error}</p>
          <div className="mt-6 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Do not accept this prescription. It may be invalid, tampered, or expired.
            </p>
          </div>
          <Link to="/" className="mt-4 inline-block text-sm text-teal-600 hover:underline">Return to AetherCare</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 dark:from-slate-950 dark:to-teal-950 p-4 flex items-start justify-center pt-12">
      <div className="w-full max-w-lg space-y-4">
        {/* Verification Banner */}
        <div className={`rounded-2xl border p-5 text-center ${isExpired ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'}`}>
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/80 dark:bg-white/10 mb-3">
            {isExpired ? <Clock className="h-7 w-7 text-amber-500" /> : <CheckCircle2 className="h-7 w-7 text-green-500" />}
          </div>
          <h1 className={`text-xl font-bold ${isExpired ? 'text-amber-900 dark:text-amber-100' : 'text-green-900 dark:text-green-100'}`}>
            {isExpired ? 'Prescription Expired' : 'Prescription Verified'}
          </h1>
          <p className={`mt-1 text-sm ${isExpired ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300'}`}>
            {isExpired ? 'This prescription is past its validity date.' : 'This prescription is authentic and valid.'}
          </p>
          <div className="mt-2 text-xs opacity-60">
            Verified at {new Date(data?.verified_at || Date.now()).toLocaleString()} · {data?.hospital}
          </div>
        </div>

        {/* Patient Info */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Patient Information</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">Patient Name</p>
              <p className="font-medium text-slate-800 dark:text-slate-100">{data?.patient_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Prescription ID</p>
              <p className="font-medium text-slate-800 dark:text-slate-100 font-mono">RX-{data?.id}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Issued On</p>
              <p className="font-medium text-slate-800 dark:text-slate-100">
                {data?.issued_at ? new Date(data.issued_at).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Valid Until</p>
              <p className={`font-medium ${isExpired ? 'text-amber-600' : 'text-slate-800 dark:text-slate-100'}`}>
                {validUntil ? validUntil.toLocaleDateString() : '—'}
                {isExpired && ' (Expired)'}
              </p>
            </div>
          </div>
        </div>

        {/* Medicines */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Pill className="h-4 w-4 text-teal-600" /> Prescribed Medicines ({medicines.length})
          </h2>
          {medicines.length === 0 ? (
            <p className="text-sm text-slate-400">No medicines found</p>
          ) : (
            <div className="space-y-2">
              {medicines.map((med, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="h-6 w-6 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 text-xs font-bold grid place-items-center shrink-0">{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{med.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {[med.dosage, med.frequency, med.duration].filter(Boolean).join(' · ')}
                    </p>
                    {med.instructions && <p className="text-xs text-slate-400 italic mt-0.5">{med.instructions}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {data?.instructions && (
          <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Doctor's Instructions</p>
            <p className="text-sm text-blue-800 dark:text-blue-200">{data.instructions}</p>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-slate-400">Powered by AetherCare HMS · For medical professional use only</p>
          <Link to="/login" className="mt-1 inline-block text-xs text-teal-600 hover:underline">Healthcare Portal →</Link>
        </div>
      </div>
    </div>
  );
}
