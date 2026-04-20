import React from 'react';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import '../styles/components.css';

export const Button = ({ children, variant = 'primary', size = 'md', disabled = false, ...props }) => (
  <button className={`btn btn-${variant} btn-${size}`} disabled={disabled} {...props}>
    {children}
  </button>
);

export const Card = ({ children, className = '' }) => (
  <div className={`card ${className}`}>{children}</div>
);

export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  React.useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export const Toast = ({ message, type = 'info', onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle2 size={16} />,
    danger: <XCircle size={16} />,
    warning: <AlertCircle size={16} />,
    info: <Info size={16} />,
  };

  return (
    <div className={`toast toast-${type}`}>
      {icons[type]}
      <span>{message}</span>
    </div>
  );
};

export const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: { label: 'Active', color: 'success' },
    inactive: { label: 'Inactive', color: 'danger' },
    pending: { label: 'Pending', color: 'warning' },
    scheduled: { label: 'Scheduled', color: 'info' },
    completed: { label: 'Completed', color: 'success' },
    cancelled: { label: 'Cancelled', color: 'danger' },
    paid: { label: 'Paid', color: 'success' },
    unpaid: { label: 'Unpaid', color: 'danger' },
    partial: { label: 'Partial', color: 'warning' },
  };

  const config = statusConfig[status?.toLowerCase()] || { label: status, color: 'info' };
  return <span className={`badge badge-${config.color}`}>{config.label}</span>;
};

export const DataTable = ({ columns, data, actions, loading = false }) => {
  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <Loader2 size={28} className="spin" style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        <span style={{ fontSize: 14 }}>Loading data...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>📋</div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>No records found</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>Start by adding a new record</div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            {actions && <th style={{ textAlign: 'right' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              {columns.map((col) => (
                <td key={col.key}>{col.render ? col.render(row[col.key], row) : row[col.key]}</td>
              ))}
              {actions && (
                <td style={{ textAlign: 'right' }}>
                  <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                    {actions(row).map((action, i) => (
                      <button
                        key={i}
                        className={`action-btn action-btn-${action.variant || 'primary'}`}
                        onClick={action.onClick}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const Form = ({ onSubmit, children }) => (
  <form onSubmit={onSubmit} className="form">
    {children}
  </form>
);

export const FormGroup = ({ label, error, children }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    {children}
    {error && <div className="form-error">{error}</div>}
  </div>
);

export const Input = React.forwardRef(({ label, error, ...props }, ref) => (
  <FormGroup label={label} error={error}>
    <input ref={ref} className={`form-input ${error ? 'error' : ''}`} {...props} />
  </FormGroup>
));

export const Select = React.forwardRef(({ label, error, options, ...props }, ref) => (
  <FormGroup label={label} error={error}>
    <select ref={ref} className={`form-input ${error ? 'error' : ''}`} {...props}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </FormGroup>
));

export const Textarea = React.forwardRef(({ label, error, ...props }, ref) => (
  <FormGroup label={label} error={error}>
    <textarea ref={ref} className={`form-input ${error ? 'error' : ''}`} {...props} />
  </FormGroup>
));
