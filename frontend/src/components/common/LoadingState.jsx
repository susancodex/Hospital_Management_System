export function TableSkeleton() {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div key={idx} className="h-10 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <p className="font-heading text-lg font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}
