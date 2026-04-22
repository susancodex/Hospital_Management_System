const classMap = {
  active:           'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  inactive:         'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  scheduled:        'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  confirmed:        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  in_consultation:  'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  waiting:          'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  completed:        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  cancelled:        'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  pending:          'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  paid:             'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  unpaid:           'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  partial:          'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  insurance_pending:'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  written_off:      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  draft:            'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  final:            'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  amended:          'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  admitted:         'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  discharged:       'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  critical:         'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  outpatient:       'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  inpatient:        'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
};

export default function StatusBadge({ value }) {
  const key = (value || '').toString().toLowerCase().replace(/[\s-]/g, '_');
  const cls = classMap[key] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  const label = value
    ? `${value}`.replace(/[_-]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
    : 'Unknown';
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {label}
    </span>
  );
}
