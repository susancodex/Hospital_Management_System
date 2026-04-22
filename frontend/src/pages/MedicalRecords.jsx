import { zodResolver } from '@hookform/resolvers/zod';
import { FilePlus2, FileText, Pencil, Trash2, Eye, ChevronDown, ChevronUp, Stethoscope, Pill, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { doctorsAPI, medicalRecordsAPI, patientsAPI } from '../api/services.js';
import AppModal from '../components/common/AppModal.jsx';
import { EmptyState, TableSkeleton } from '../components/common/LoadingState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';

const schema = z.object({
  patient: z.coerce.number().min(1),
  doctor: z.coerce.number().optional(),
  record_date: z.string().min(1),
  diagnosis: z.string().min(3),
  treatment: z.string().optional(),
  notes: z.string().optional(),
});

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } }
};

export default function MedicalRecords() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientFilter, setPatientFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const load = async () => {
    setLoading(true);
    try {
      const [records, p, d] = await Promise.all([
        medicalRecordsAPI.list(patientFilter ? { patient: patientFilter } : {}),
        patientsAPI.list(),
        doctorsAPI.list(),
      ]);
      setRows(records.items);
      setPatients(p.items);
      setDoctors(d.items);
    } catch {
      toast.error('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [patientFilter]);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.record_date.localeCompare(a.record_date)),
    [rows],
  );

  const openCreate = () => {
    setEditing(null);
    reset({ patient: '', doctor: '', record_date: '', diagnosis: '', treatment: '', notes: '' });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    reset({
      patient: row.patient,
      doctor: row.doctor || '',
      record_date: row.record_date,
      diagnosis: row.diagnosis,
      treatment: row.treatment || '',
      notes: row.notes || '',
    });
    setOpen(true);
  };

  const onSubmit = async (values) => {
    const payload = { ...values, doctor: values.doctor || null };
    try {
      if (editing) {
        await medicalRecordsAPI.update(editing.id, payload);
        toast.success('Medical record updated');
      } else {
        await medicalRecordsAPI.create(payload);
        toast.success('Medical record created');
      }
      setOpen(false);
      await load();
    } catch {
      toast.error('Unable to save medical record');
    }
  };

  const onDelete = async (id) => {
    try {
      await medicalRecordsAPI.delete(id);
      toast.success('Medical record deleted');
      await load();
    } catch {
      toast.error('Unable to delete medical record');
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <motion.div 
      className="space-y-7"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <PageHeader
        title="Medical Records"
        subtitle="Clinical timeline for diagnoses, treatment plans, and physician notes."
        actions={
          <motion.button 
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreate} 
            className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            <FilePlus2 size={17} /> Add New Record
          </motion.button>
        }
      />

      <motion.div variants={item} className="group relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/60 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/80 border border-slate-100">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-blue-500/8 to-indigo-500/8 blur-3xl" />
        <div className="p-6">
          <label className="mb-2 block text-xs font-bold text-slate-500 tracking-wide">Filter by patient</label>
          <select 
            value={patientFilter} 
            onChange={(event) => setPatientFilter(event.target.value)} 
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm transition-all duration-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none md:max-w-sm hover:border-slate-300"
          >
            <option value="">All patients</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>{patient.full_name || `${patient.first_name} ${patient.last_name}`}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {loading ? (
        <TableSkeleton />
      ) : sorted.length === 0 ? (
        <EmptyState title="No medical records" description="Create clinical records to build a complete patient timeline." />
      ) : (
        <motion.div variants={container} className="space-y-5">
          <AnimatePresence mode="popLayout">
            {sorted.map((row) => (
              <motion.article 
                key={row.id} 
                variants={item}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/60 transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/80 border border-slate-100"
              >
                <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-blue-500/5 to-indigo-500/5 blur-2xl" />
                
                <div className="p-7">
                  <div className="flex flex-wrap items-start justify-between gap-5">
                    <div className="flex items-start gap-5">
                      <motion.div 
                        whileHover={{ rotate: 5, scale: 1.05 }}
                        className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-indigo-600 shadow-md"
                      >
                        <FileText size={22} />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-slate-400">{row.record_date}</p>
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <Stethoscope size={10} />
                            {row.doctor_name || 'Unassigned'}
                          </span>
                        </div>
                        <h3 className="font-heading text-xl font-bold text-slate-900 truncate">{row.patient_name}</h3>
                        <p className="text-sm text-slate-600 mt-1 line-clamp-1">{row.diagnosis}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <motion.button 
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleExpand(row.id)} 
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm"
                      >
                        <Eye size={14} /> 
                        {expandedId === row.id ? 'Collapse' : 'View'}
                        {expandedId === row.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openEdit(row)} 
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition-all duration-300 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm"
                      >
                        <Pencil size={14} /> Edit
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onDelete(row.id)} 
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600 transition-all duration-300 hover:bg-red-50 hover:border-red-300 hover:shadow-sm"
                      >
                        <Trash2 size={14} /> Delete
                      </motion.button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === row.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-7 pt-6 border-t border-slate-100">
                          <div className="grid gap-5 md:grid-cols-2">
                            <div className="rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 p-5 transition-all duration-300 hover:bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-md">
                              <div className="flex items-center gap-2 mb-2">
                                <Stethoscope size={14} className="text-indigo-500" />
                                <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-indigo-500">Diagnosis</p>
                              </div>
                              <p className="text-sm text-slate-700 font-semibold leading-relaxed">{row.diagnosis}</p>
                            </div>
                            
                            <div className="rounded-2xl bg-gradient-to-br from-emerald-50/80 to-green-50/80 p-5 transition-all duration-300 hover:bg-gradient-to-br from-emerald-50 to-green-50 hover:shadow-md">
                              <div className="flex items-center gap-2 mb-2">
                                <Pill size={14} className="text-emerald-600" />
                                <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-emerald-600">Treatment Plan</p>
                              </div>
                              <p className="text-sm text-slate-700 font-semibold leading-relaxed">{row.treatment || 'No treatment plan specified'}</p>
                            </div>
                          </div>
                          
                          {row.notes && (
                            <div className="mt-5 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/80 p-5 transition-all duration-300 hover:bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-md">
                              <div className="flex items-center gap-2 mb-2">
                                <ClipboardList size={14} className="text-amber-600" />
                                <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-amber-600">Physician Notes</p>
                              </div>
                              <p className="text-sm text-slate-700 font-medium leading-relaxed">{row.notes}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AppModal open={open} onClose={() => setOpen(false)} title={editing ? 'Update Medical Record' : 'Create Medical Record'}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 tracking-wide">Patient</label>
            <select {...register('patient')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm transition-all duration-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none hover:border-slate-300">
              <option value="">Select patient</option>
              {patients.map((item) => (
                <option key={item.id} value={item.id}>{item.full_name || `${item.first_name} ${item.last_name}`}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 tracking-wide">Doctor (optional)</label>
            <select {...register('doctor')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm transition-all duration-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none hover:border-slate-300">
              <option value="">Select doctor</option>
              {doctors.map((item) => (
                <option key={item.id} value={item.id}>{item.full_name || `Dr. ${item.first_name} ${item.last_name}`}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 tracking-wide">Record date</label>
            <input type="date" {...register('record_date')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm transition-all duration-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none hover:border-slate-300" />
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-600 tracking-wide">Diagnosis</label>
            <textarea {...register('diagnosis')} rows={2} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm transition-all duration-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none resize-none hover:border-slate-300" />
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-600 tracking-wide">Treatment Plan</label>
            <textarea {...register('treatment')} rows={2} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm transition-all duration-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none resize-none hover:border-slate-300" />
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-600 tracking-wide">Physician Notes</label>
            <textarea {...register('notes')} rows={3} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm transition-all duration-300 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none resize-none hover:border-slate-300" />
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting} 
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-xl md:col-span-2"
          >
            {editing ? 'Update Medical Record' : 'Create Medical Record'}
          </motion.button>
        </form>
      </AppModal>
    </motion.div>
  );
}
