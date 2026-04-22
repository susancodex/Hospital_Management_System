export function TableSkeleton({ isDark = false }) {
  return (
    <div className={`space-y-2 rounded-2xl border p-4 transition-colors ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
      {Array.from({ length: 8 }).map((_, idx) => (
        <div key={idx} className={`h-10 animate-pulse rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`} />
      ))}
    </div>
  );
}

export function EmptyState({ title, description, isDark = false }) {
  return (
    <div className={`rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-300 bg-white'}`}>
      <p className={`font-heading text-lg font-semibold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{title}</p>
      <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{description}</p>
    </div>
  );
}
