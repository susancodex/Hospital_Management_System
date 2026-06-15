import { useEffect, useState } from 'react';
import { Building2, Users, Stethoscope, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { doctorsAPI } from '../api/services.js';
import PageHeader from '../components/common/PageHeader.jsx';
import { TableSkeleton } from '../components/common/LoadingState.jsx';

const DEPARTMENTS = [
  { name: 'Cardiology', description: 'Heart and cardiovascular system', icon: '❤️', color: 'rose' },
  { name: 'Neurology', description: 'Brain and nervous system', icon: '🧠', color: 'violet' },
  { name: 'Orthopedics', description: 'Bones, joints and musculature', icon: '🦴', color: 'amber' },
  { name: 'Pediatrics', description: 'Child health and development', icon: '👶', color: 'blue' },
  { name: 'Oncology', description: 'Cancer diagnosis and treatment', icon: '🔬', color: 'purple' },
  { name: 'Dermatology', description: 'Skin, hair and nail disorders', icon: '🩺', color: 'green' },
  { name: 'Gastroenterology', description: 'Digestive system disorders', icon: '🫁', color: 'orange' },
  { name: 'Psychiatry', description: 'Mental health and behavioral disorders', icon: '🧘', color: 'teal' },
  { name: 'Ophthalmology', description: 'Eye health and vision care', icon: '👁️', color: 'sky' },
  { name: 'General Practice', description: 'Primary care and general medicine', icon: '🏥', color: 'slate' },
  { name: 'Emergency Medicine', description: 'Acute and emergency care', icon: '🚨', color: 'red' },
  { name: 'Radiology', description: 'Medical imaging and diagnostics', icon: '📡', color: 'indigo' },
];

const COLOR_CLASSES = {
  rose: 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50',
  violet: 'bg-violet-50 dark:bg-violet-950/30 border-violet-100 dark:border-violet-900/50',
  amber: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50',
  blue: 'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50',
  purple: 'bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/50',
  green: 'bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900/50',
  orange: 'bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900/50',
  teal: 'bg-teal-50 dark:bg-teal-950/30 border-teal-100 dark:border-teal-900/50',
  sky: 'bg-sky-50 dark:bg-sky-950/30 border-sky-100 dark:border-sky-900/50',
  slate: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700',
  red: 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/50',
  indigo: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/50',
};

export default function Departments() {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await doctorsAPI.list();
        setDoctors(res.items || []);
      } catch {
        toast.error('Failed to load department data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const doctorsByDept = {};
  doctors.forEach((doc) => {
    const dept = doc.department || 'General Practice';
    if (!doctorsByDept[dept]) doctorsByDept[dept] = [];
    doctorsByDept[dept].push(doc);
  });

  const filtered = DEPARTMENTS.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase()) ||
    d.description.toLowerCase().includes(query.toLowerCase())
  );

  const totalDoctors = doctors.length;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full">
      <PageHeader
        title="Departments"
        subtitle="Overview of hospital departments and medical staff"
        kicker="Hospital"
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Departments</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{DEPARTMENTS.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Doctors</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{totalDoctors}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-700 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Active Departments</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {Object.keys(doctorsByDept).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search departments…"
          className="h-9 w-full pl-9 pr-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 h-36 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dept) => {
            const deptDoctors = doctorsByDept[dept.name] || [];
            return (
              <div
                key={dept.name}
                className={`rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow ${COLOR_CLASSES[dept.color]}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl leading-none mt-0.5">{dept.icon}</span>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{dept.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{dept.description}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold bg-white/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-full border border-white/80 dark:border-slate-700/60">
                    {deptDoctors.length} {deptDoctors.length === 1 ? 'doctor' : 'doctors'}
                  </span>
                </div>

                {deptDoctors.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {deptDoctors.slice(0, 3).map((doc) => (
                      <div key={doc.id} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold border border-white/80 dark:border-slate-700/50">
                          {(doc.name || 'D').slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">Dr. {doc.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{doc.specialization}</p>
                        </div>
                      </div>
                    ))}
                    {deptDoctors.length > 3 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">+{deptDoctors.length - 3} more</p>
                    )}
                  </div>
                )}

                {deptDoctors.length === 0 && (
                  <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 italic">No doctors assigned yet</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
