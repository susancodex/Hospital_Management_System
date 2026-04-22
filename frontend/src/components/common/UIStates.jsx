import { AlertCircle, Search, Plus } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';

/**
 * Component for displaying empty state
 */
export const EmptyState = ({
  icon: Icon = Search,
  title = 'No data found',
  description = 'Try adjusting your search or filters',
  action = null,
  isDark = false,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl py-12 ${
      isDark ? 'bg-slate-800' : 'bg-slate-50'
    }`}>
      <Icon size={48} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
      <p className={`mt-4 font-medium ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>{title}</p>
      <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

/**
 * Component for displaying loading skeleton
 */
export const SkeletonLoader = ({ count = 5, isDark = false }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`h-12 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-200'} animate-pulse`}
        />
      ))}
    </div>
  );
};

/**
 * Component for displaying error state
 */
export const ErrorState = ({
  error,
  onRetry,
  isDark = false,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border-2 py-8 px-4 ${
      isDark
        ? 'border-red-900 bg-red-900/20'
        : 'border-red-100 bg-red-50'
    }`}>
      <AlertCircle size={48} className={isDark ? 'text-red-400' : 'text-red-600'} />
      <p className={`mt-4 font-medium ${isDark ? 'text-red-300' : 'text-red-900'}`}>Error Loading Data</p>
      <p className={`mt-2 text-center text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

/**
 * Component for displaying loading spinner
 */
export const LoadingSpinner = ({ fullPage = false, isDark = false }) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      <p className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Loading...</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className={`fixed inset-0 grid place-items-center ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        {spinner}
      </div>
    );
  }

  return spinner;
};

/**
 * Component for displaying table with empty state
 */
export const DataTable = ({
  columns,
  data,
  loading,
  error,
  onRetry,
  isDark = false,
}) => {
  if (loading) {
    return <SkeletonLoader count={5} isDark={isDark} />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} isDark={isDark} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState isDark={isDark} />;
  }

  return (
    <div className={`overflow-x-auto rounded-xl border ${
      isDark
        ? 'border-slate-700 bg-slate-800'
        : 'border-slate-200 bg-white'
    }`}>
      <table className="w-full text-sm">
        <thead className={isDark ? 'bg-slate-700' : 'bg-slate-50'}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-6 py-3 text-left font-semibold ${
                  isDark ? 'text-slate-300' : 'text-slate-900'
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className={`border-t ${
                isDark
                  ? 'border-slate-700 hover:bg-slate-700/50'
                  : 'border-slate-200 hover:bg-slate-50'
              } transition`}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-6 py-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Component for displaying confirmation dialog
 */
export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isDark = false,
  isLoading = false,
  isDangerous = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`w-full max-w-sm rounded-2xl p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          {title}
        </h3>
        <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {message}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              isDark
                ? 'border border-slate-600 text-slate-300 hover:bg-slate-700'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
            } disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } disabled:opacity-50`}
          >
            {isLoading ? 'Loading...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Component for displaying form error
 */
export const FormError = ({ error, isDark = false }) => {
  if (!error) return null;

  return (
    <div className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
      isDark
        ? 'bg-red-900/30 text-red-400'
        : 'bg-red-50 text-red-700'
    }`}>
      <AlertCircle size={14} />
      {error}
    </div>
  );
};

/**
 * Component for displaying form field
 */
export const FormField = ({
  label,
  name,
  type = 'text',
  value,
  error,
  touched,
  onChange,
  onBlur,
  placeholder,
  isDark = false,
  required = false,
  options = null, // For select fields
  rows = null, // For textarea
}) => {
  const baseClasses = `w-full rounded-lg px-3 py-2.5 text-sm outline-none ring-blue-500/40 transition ${
    isDark
      ? 'border-slate-600 bg-slate-700 text-slate-100 placeholder:text-slate-500'
      : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
  } ${error && touched ? (isDark ? 'border-red-600' : 'border-red-400') : 'border'}`;

  return (
    <div>
      <label className={`mb-1 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={rows || 4}
          className={baseClasses}
        />
      ) : type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={baseClasses}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={baseClasses}
        />
      )}
      {error && touched && <FormError error={error} isDark={isDark} />}
    </div>
  );
};
