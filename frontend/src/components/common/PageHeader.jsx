import { useTheme } from '../../context/ThemeContext.jsx';

export default function PageHeader({ title, subtitle, actions, icon: Icon }) {
  const { isDark } = useTheme();
  
  return (
    <div className={`relative overflow-hidden rounded-2xl border p-6 shadow-sm backdrop-blur-sm transition-colors duration-300 ${
      isDark
        ? 'border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900'
        : 'border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50'
    }`}>
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-50 ${isDark ? 'bg-blue-900' : 'bg-blue-50'}`} />
      <div className={`absolute -bottom-4 -right-4 h-16 w-16 rounded-full opacity-30 ${isDark ? 'bg-blue-900' : 'bg-blue-100'}`} />
      
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
              <Icon size={24} className="text-white" />
            </div>
          )}
          <div>
            <p className={`text-xs font-medium uppercase tracking-[0.2em] ${isDark ? 'text-blue-400/70' : 'text-blue-500/70'}`}>Hospital Management</p>
            <h2 className={`font-heading mt-0.5 text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{title}</h2>
            {subtitle && <p className={`mt-1.5 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}