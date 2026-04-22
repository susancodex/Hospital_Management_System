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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${sizes[size]} max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200/50 bg-white shadow-2xl animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
          <h3 className="font-heading text-lg font-semibold text-slate-900">{title}</h3>
          <button 
            onClick={onClose} 
            className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200 text-slate-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto p-6 max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}