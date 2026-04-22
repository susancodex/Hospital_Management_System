const classMap = {
  active: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-800',
  inactive: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-slate-200 dark:ring-slate-600',
  scheduled: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-blue-100 dark:ring-blue-800',
  completed: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-800',
  cancelled: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 ring-red-100 dark:ring-red-800',
  pending: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-amber-100 dark:ring-amber-800',
  paid: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-800',
  unpaid: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 ring-red-100 dark:ring-red-800',
  partial: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-amber-100 dark:ring-amber-800',
  insurance_pending: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 ring-indigo-100 dark:ring-indigo-800',
  written_off: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 ring-slate-200 dark:ring-slate-600',
  draft: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-amber-100 dark:ring-amber-800',
  final: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-800',
  amended: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 ring-orange-100 dark:ring-orange-800',
};

export default function StatusBadge({ value }) {
  const key = (value || '').toString().toLowerCase();
  const cls = classMap[key] || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 ring-slate-200 dark:ring-slate-600';
  const label = value ? `${value}`.replace(/\b\w/g, (m) => m.toUpperCase()) : 'Unknown';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${cls}`}>
      {label}
    </span>
  );
}
