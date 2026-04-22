import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function AppModal({ open, title, onClose, children, size = 'lg' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${sizes[size]} max-h-[92vh] overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-700 dark:bg-slate-900`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-4 sm:px-6 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-500/80 dark:text-blue-400/70">Form workflow</p>
            <h3 className="mt-1 font-heading text-base font-semibold text-slate-900 sm:text-lg dark:text-slate-100">{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close modal"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-300"
          >
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[calc(92vh-72px)] overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          {children}
        </div>
      </div>
    </div>
  );
}