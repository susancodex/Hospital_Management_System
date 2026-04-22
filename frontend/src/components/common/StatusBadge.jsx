const classMap = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  inactive: 'bg-slate-100 text-slate-600 ring-slate-200',
  scheduled: 'bg-blue-50 text-blue-700 ring-blue-100',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  cancelled: 'bg-red-50 text-red-700 ring-red-100',
  pending: 'bg-amber-50 text-amber-700 ring-amber-100',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  unpaid: 'bg-red-50 text-red-700 ring-red-100',
  partial: 'bg-amber-50 text-amber-700 ring-amber-100',
};

export default function StatusBadge({ value }) {
  const key = (value || '').toString().toLowerCase();
  const cls = classMap[key] || 'bg-slate-100 text-slate-700 ring-slate-200';
  const label = value ? `${value}`.replace(/\b\w/g, (m) => m.toUpperCase()) : 'Unknown';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {label}
    </span>
  );
}
