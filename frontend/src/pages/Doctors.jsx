import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Phone, Mail, Eye, Edit, Trash2, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { appointmentsAPI, doctorsAPI } from '../api/services.js';
import AppModal from '../components/common/AppModal.jsx';
import { FormField, ConfirmDialog } from '../components/common/UIStates.jsx';
import { EmptyState, TableSkeleton } from '../components/common/LoadingState.jsx';
import PageHeader from '../components/common/PageHeader.jsx';
import StatusBadge from '../components/common/StatusBadge.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { hasPermission } from '../lib/permissions.js';

const schema = z.object({
  first_name: z.string().min(2, "First name is required"),
  last_name: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(6, "Phone number is required"),
  specialization: z.string().min(2, "Specialization is required"),
  license_number: z.string().optional(),
  is_available: z.boolean(),
});

export default function Doctors() {
  const { user } = useAuth();
  const canManageDoctors = hasPermission(user?.role, 'doctors.manage');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState('');
  
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  
  const [viewDoctor, setViewDoctor] = useState(null);
  const [viewAppointments, setViewAppointments] = useState([]);
  
  const [deleteId, setDeleteId] = useState(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting, touchedFields } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { is_available: true },
  });

  const load = async (search = query) => {
    setLoading(true);
    try {
      const response = await doctorsAPI.list({ search });
      setRows(response.items || []);
    } catch {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ first_name: '', last_name: '', email: '', phone: '', specialization: '', license_number: '', is_available: true });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    reset({ 
      first_name: row.first_name, 
      last_name: row.last_name, 
      email: row.email, 
      phone: row.phone, 
      specialization: row.specialization, 
      license_number: row.license_number || '', 
      is_available: !!row.is_available 
    });
    setOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      if (editing) { 
        await doctorsAPI.update(editing.id, values); 
        toast.success('Doctor updated successfully'); 
      } else { 
        await doctorsAPI.create(values); 
        toast.success('Doctor created successfully'); 
      }
      setOpen(false);
      await load();
    } catch { 
      toast.error(editing ? 'Unable to update doctor' : 'Unable to create doctor'); 
    }
  };

  const confirmDelete = (id) => setDeleteId(id);
  const onDelete = async () => {
    if (!deleteId) return;
    try { 
      await doctorsAPI.delete(deleteId); 
      toast.success('Doctor deleted successfully'); 
      await load(); 
    } catch { 
      toast.error('Unable to delete doctor'); 
    } finally {
      setDeleteId(null);
    }
  };

  const viewDoctorDetails = async (doctor) => {
    setViewDoctor(doctor);
    try { 
      const response = await appointmentsAPI.list({ doctor: doctor.id }); 
      setViewAppointments((response.items || []).filter(a => a.doctor === doctor.id)); 
    } catch { 
      setViewAppointments([]); 
    }
  };

  const escapeCsv = (value) => {
    const text = value == null ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const handleExport = () => {
    if (!rows.length) {
      toast.error('No doctors to export');
      return;
    }

    const header = [
      'Doctor ID',
      'First Name',
      'Last Name',
      'Full Name',
      'Email',
      'Phone',
      'Specialization',
      'License Number',
      'Available',
      'Created At',
    ];

    const lines = rows.map((row) => [
      row.id,
      row.first_name || '',
      row.last_name || '',
      row.full_name || '',
      row.email || '',
      row.phone || '',
      row.specialization || '',
      row.license_number || '',
      row.is_available ? 'Yes' : 'No',
      row.created_at || '',
    ]);

    const csv = [header, ...lines].map((cols) => cols.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `doctors-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast.success('Doctors export downloaded');
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full">
      <PageHeader 
        title="Doctors" 
        subtitle={`Showing ${rows.length} active practitioners`}
        actions={
          <>
            <button onClick={handleExport} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors">
              <Download size={16} /> Export
            </button>
            {canManageDoctors && (
              <button 
                onClick={openCreate} 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors"
              >
                <Plus size={16} /> Add doctor
              </button>
            )}
          </>
        } 
      />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4">
        <form 
          className="flex flex-col sm:flex-row items-center gap-3" 
          onSubmit={(e) => { e.preventDefault(); load(query); }}
        >
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Search doctors, specialty..." 
              className="h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600" 
            />
          </div>
          <button 
            type="submit" 
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {loading ? <TableSkeleton rows={8} /> : rows.length === 0 ? (
        <EmptyState title="No doctors found" description="Add doctors to populate the directory." />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50/60 dark:bg-slate-900/40">
                <tr>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Doctor</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Contact</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Patients</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="h-10 px-5 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide w-16"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-medium shrink-0">
                          {row.first_name?.charAt(0)}{row.last_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">{row.full_name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{row.specialization}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      <div className="text-sm truncate max-w-[180px]">{row.phone || '-'}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[180px]">{row.email || '-'}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      <div className="text-sm">-</div>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge value={row.is_available ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => viewDoctorDetails(row)} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-100" title="View details">
                          <Eye size={16} />
                        </button>
                        {canManageDoctors && (
                          <>
                            <button onClick={() => openEdit(row)} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-100" title="Edit doctor">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => confirmDelete(row.id)} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400" title="Delete doctor">
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AppModal 
        open={open && canManageDoctors} 
        onClose={() => setOpen(false)} 
        title={editing ? 'Edit Doctor' : 'Add New Doctor'}
        size="lg"
        footer={
          <>
            <button 
              type="button" 
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {editing ? 'Save changes' : 'Add doctor'}
            </button>
          </>
        }
      >
        <div className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField 
              label="First Name" 
              name="first_name"
              register={register}
              required 
              error={errors.first_name?.message} 
              touched={touchedFields.first_name}
            />
            <FormField 
              label="Last Name" 
              name="last_name"
              register={register}
              required 
              error={errors.last_name?.message} 
              touched={touchedFields.last_name}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField 
              label="Email" 
              name="email"
              type="email" 
              register={register}
              required 
              error={errors.email?.message} 
              touched={touchedFields.email}
            />
            <FormField 
              label="Phone" 
              name="phone"
              register={register}
              required 
              error={errors.phone?.message} 
              touched={touchedFields.phone}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField 
              label="Specialization" 
              name="specialization"
              register={register}
              required 
              error={errors.specialization?.message} 
              touched={touchedFields.specialization}
            />
            <FormField 
              label="License Number" 
              name="license_number"
              register={register}
              error={errors.license_number?.message} 
              touched={touchedFields.license_number}
            />
          </div>
          <div>
            <FormField 
              label="Availability" 
              name="is_available"
              type="select" 
              register={register}
              options={[
                { value: true, label: 'Available' },
                { value: false, label: 'Not available' },
              ]}
              onChange={(e) => setValue('is_available', e.target.value === 'true')}
            />
          </div>
        </div>
      </AppModal>

      {/* View Details Modal */}
      <AppModal 
        open={!!viewDoctor} 
        onClose={() => setViewDoctor(null)} 
        title="Doctor Profile" 
        size="lg"
        footer={
          <button 
            onClick={() => setViewDoctor(null)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors"
          >
            Close
          </button>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-medium text-slate-600 dark:text-slate-300 shrink-0">
              {viewDoctor?.first_name?.charAt(0)}{viewDoctor?.last_name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{viewDoctor?.full_name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-slate-500 dark:text-slate-400">{viewDoctor?.specialization}</p>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <StatusBadge value={viewDoctor?.is_available ? 'active' : 'inactive'} />
              </div>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4 rounded-xl border border-slate-100 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-900/40">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Contact Info</p>
              <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <Phone size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>{viewDoctor?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Mail size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>{viewDoctor?.email || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Professional Details</p>
              <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500">License Number</span>
                  <span className="font-mono text-xs">{viewDoctor?.license_number || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Today's Schedule</h3>
            {viewAppointments.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No appointments scheduled.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {viewAppointments.slice(0, 5).map((apt) => (
                  <div key={apt.id} className="p-4 bg-white dark:bg-slate-900 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{apt.patient_name || 'Unknown Patient'}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(apt.appointment_date).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge value={apt.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppModal>

      {/* Delete Confirmation */}
      <ConfirmDialog 
        isOpen={!!deleteId}
        title="Delete Doctor"
        message="Are you sure you want to delete this doctor's profile? This action cannot be undone."
        onConfirm={onDelete}
        onCancel={() => setDeleteId(null)}
        isDangerous={true}
      />
    </div>
  );
}
