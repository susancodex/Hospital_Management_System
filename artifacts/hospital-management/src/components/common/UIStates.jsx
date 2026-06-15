import { AlertTriangle, Search } from 'lucide-react';

export const EmptyState = ({ icon: Icon = Search, title = 'No data yet', description = 'Try adjusting your search or filters.', action = null }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
      <Icon size={22} />
    </div>
    <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</p>
    <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const SkeletonLoader = ({ count = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="h-11 rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse" />
    ))}
  </div>
);

export const ErrorState = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 px-6 py-10 text-center">
    <AlertTriangle size={28} className="text-rose-600" />
    <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Couldn't load data</p>
    <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">{error}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium"
      >
        Try again
      </button>
    )}
  </div>
);

export const LoadingSpinner = ({ fullPage = false, label = 'Loading…' }) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-teal-700 border-t-transparent" />
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
  if (fullPage) return <div className="fixed inset-0 grid place-items-center bg-slate-50 dark:bg-slate-950">{spinner}</div>;
  return spinner;
};

export const FormError = ({ error }) => {
  if (!error) return null;
  return <p className="mt-1 text-xs text-rose-600 inline-flex items-center gap-1"><AlertTriangle size={12}/> {error}</p>;
};

export const FormField = ({
  label, name, type = 'text', value, error, touched, onChange, onBlur, placeholder,
  required = false, options = null, rows = null, autoComplete, register,
}) => {
  const registration = typeof register === 'function' && name ? register(name) : null;
  const mergedOnChange = (event) => {
    registration?.onChange?.(event);
    onChange?.(event);
  };
  const mergedOnBlur = (event) => {
    registration?.onBlur?.(event);
    onBlur?.(event);
  };
  const inputProps = {
    ...(registration || {}),
    name: registration?.name || name,
    onChange: mergedOnChange,
    onBlur: mergedOnBlur,
  };
  if (value !== undefined) {
    inputProps.value = value;
  }

  const baseClasses = `w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-colors ${
    error && touched ? 'border-rose-400 dark:border-rose-700 focus:ring-rose-500/20 focus:border-rose-500' : ''
  }`;
  const sizing = type === 'textarea' ? 'py-2.5' : 'h-10';

  return (
    <div>
      {label && (
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
          {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          {...inputProps}
          placeholder={placeholder}
          rows={rows || 3} className={`${baseClasses} ${sizing}`}
        />
      ) : type === 'select' ? (
        <select {...inputProps} className={`${baseClasses} ${sizing}`}>
          <option value="">Select {(label || name || '').toLowerCase()}…</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          {...inputProps}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`${baseClasses} ${sizing}`}
        />
      )}
      {error && touched && <FormError error={error} />}
    </div>
  );
};

export const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, isLoading = false, isDangerous = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{message}</p>
        <div className="mt-5 flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium disabled:opacity-50"
          >Cancel</button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 h-9 px-4 rounded-md text-white text-sm font-medium disabled:opacity-50 ${isDangerous ? 'bg-rose-600 hover:bg-rose-700' : 'bg-teal-700 hover:bg-teal-800'}`}
          >{isLoading ? 'Working…' : 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
};

export const DataTable = ({ columns, data, loading, error, onRetry }) => {
  if (loading) return <SkeletonLoader count={6} />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (!data || data.length === 0) return <EmptyState />;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/60 dark:bg-slate-900/40">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="h-10 px-5 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-3 text-slate-700 dark:text-slate-300">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
