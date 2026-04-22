export default function PageHeader({ title, subtitle, actions, kicker }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {kicker && (
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 mb-1">
            {kicker}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
