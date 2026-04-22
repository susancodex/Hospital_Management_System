import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Search, Users, Phone, Mail, Calendar, MoreHorizontal, Eye, Edit, Trash2, Download } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { appointmentsAPI, patientsAPI } from '../api/services.js';
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
  email: z.string().email().or(z.literal('')),
  phone: z.string().min(6, "Phone number is required"),
  gender: z.enum(['M', 'F', 'O']),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
});

const PAGE_SIZE = 12;

export default function Patients() {
  const { user } = useAuth();
  const canManagePatients = hasPermission(user?.role, 'patients.manage');
  const [searchParams] = useSearchParams();
  const queryFromUrl = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(queryFromUrl);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  
  const [viewPatient, setViewPatient] = useState(null);
  const [viewAppointments, setViewAppointments] = useState([]);
  
  const [deleteId, setDeleteId] = useState(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting, touchedFields } } = useForm({ 
    resolver: zodResolver(schema), 
    defaultValues: { gender: 'M' } 
  });

  const load = async (search = query) => {
    setLoading(true);
    try { 
      const response = await patientsAPI.list({ search }); 
      setRows(response.items || []); 
    }
    catch { 
      toast.error('Failed to load patients'); 
    }
    finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { load(queryFromUrl); }, [queryFromUrl]);

  const filtered = useMemo(() => rows, [rows]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => { 
    setEditing(null); 
    reset({ first_name: '', last_name: '', email: '', phone: '', gender: 'M', date_of_birth: '', address: '' }); 
    setOpen(true); 
  };
  
  const openEdit = (row) => { 
    setEditing(row); 
    reset({ 
      first_name: row.first_name, 
      last_name: row.last_name, 
      email: row.email || '', 
      phone: row.phone, 
      gender: row.gender || 'M', 
      date_of_birth: row.date_of_birth || '', 
      address: row.address || '' 
    }); 
    setOpen(true); 
  };

  const onSubmit = async (values) => {
    try { 
      if (editing) { 
        await patientsAPI.update(editing.id, values); 
        toast.success('Patient updated successfully'); 
      } else { 
        await patientsAPI.create(values); 
        toast.success('Patient created successfully'); 
      } 
      setOpen(false); 
      await load(); 
    }
    catch { 
      toast.error(editing ? 'Unable to update patient' : 'Unable to create patient'); 
    }
  };

  const confirmDelete = (id) => setDeleteId(id);
  const onDelete = async () => { 
    if (!deleteId) return;
    try { 
      await patientsAPI.delete(deleteId); 
      toast.success('Patient deleted successfully'); 
      await load(); 
    } catch { 
      toast.error('Unable to delete patient'); 
    } finally {
      setDeleteId(null);
    }
  };

  const viewPatientDetails = async (patient) => { 
    setViewPatient(patient); 
    try { 
      const response = await appointmentsAPI.list({ patient: patient.id }); 
      setViewAppointments((response.items || []).filter(a => a.patient === patient.id)); 
    } catch { 
      setViewAppointments([]); 
    } 
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto w-full">
      <PageHeader 
        title="Patients" 
        subtitle={`Showing ${filtered.length} total patients`}
        actions={
          <>
            <button className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors">
              <Download size={16} /> Export
            </button>
            {canManagePatients && (
              <button 
                onClick={openCreate} 
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors"
              >
                <Plus size={16} /> Add patient
              </button>
            )}
          </>
        } 
      />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4">
        <form 
          className="flex flex-col sm:flex-row items-center gap-3" 
          onSubmit={(e) => { e.preventDefault(); setPage(1); load(query); }}
        >
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Search patients, MRN..." 
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

      {loading ? <TableSkeleton rows={8} /> : filtered.length === 0 ? (
        <EmptyState title="No patients found" description="Try adjusting your search or filters." />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/60 dark:bg-slate-900/40">
                <tr>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Patient</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Age/Sex</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Contact</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Last Visit</th>
                  <th className="h-10 px-5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="h-10 px-5 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide w-16"></th>
                </tr>
              </thead>
              <tbody>
                {paged.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-medium shrink-0">
                          {row.first_name?.charAt(0)}{row.last_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">{row.full_name}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">PT-{row.id.toString().padStart(4, '0')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      <div className="text-sm">{row.date_of_birth ? new Date().getFullYear() - new Date(row.date_of_birth).getFullYear() + ' yrs' : '-'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{row.gender === 'M' ? 'Male' : row.gender === 'F' ? 'Female' : 'Other'}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      <div className="text-sm truncate max-w-[150px]">{row.phone || '-'}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[150px]">{row.email || '-'}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      <div className="text-sm">-</div>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge value="Discharged" />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => viewPatientDetails(row)} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-100" title="View details">
                          <Eye size={16} />
                        </button>
                        {canManagePatients && (
                          <>
                            <button onClick={() => openEdit(row)} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-100" title="Edit patient">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => confirmDelete(row.id)} className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400" title="Delete patient">
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
          
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <p className="text-sm text-slate-500 dark:text-slate-400">Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
              <div className="flex items-center gap-2">
                <button 
                  disabled={page === 1} 
                  onClick={() => setPage(v => Math.max(1, v - 1))} 
                  className="inline-flex items-center gap-2 h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                <button 
                  disabled={page === totalPages} 
                  onClick={() => setPage(v => Math.min(totalPages, v + 1))} 
                  className="inline-flex items-center gap-2 h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AppModal 
        open={open && canManagePatients} 
        onClose={() => setOpen(false)} 
        title={editing ? 'Edit Patient' : 'Add New Patient'}
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
              {editing ? 'Save changes' : 'Add patient'}
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
              label="Gender" 
              name="gender"
              type="select" 
              register={register}
              required 
              error={errors.gender?.message} 
              touched={touchedFields.gender}
              options={[
                { value: 'M', label: 'Male' },
                { value: 'F', label: 'Female' },
                { value: 'O', label: 'Other' },
              ]}
            />
            <FormField 
              label="Date of Birth" 
              name="date_of_birth"
              type="date" 
              register={register}
              error={errors.date_of_birth?.message} 
              touched={touchedFields.date_of_birth}
            />
          </div>
          <FormField 
            label="Address" 
            name="address"
            type="textarea" 
            rows={3} 
            register={register}
            error={errors.address?.message} 
            touched={touchedFields.address}
          />
        </div>
      </AppModal>

      {/* View Details Modal */}
      <AppModal 
        open={!!viewPatient} 
        onClose={() => setViewPatient(null)} 
        title="Patient Record" 
        size="lg"
        footer={
          <button 
            onClick={() => setViewPatient(null)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium shadow-sm transition-colors"
          >
            Close
          </button>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-medium text-slate-600 dark:text-slate-300 shrink-0">
              {viewPatient?.first_name?.charAt(0)}{viewPatient?.last_name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{viewPatient?.full_name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">PT-{viewPatient?.id?.toString().padStart(4, '0')} • {viewPatient?.gender === 'M' ? 'Male' : viewPatient?.gender === 'F' ? 'Female' : 'Other'}</p>
            </div>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4 rounded-xl border border-slate-100 dark:border-slate-800 p-5 bg-slate-50/50 dark:bg-slate-900/40">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Contact Details</p>
              <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <Phone size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>{viewPatient?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Mail size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>{viewPatient?.email || 'N/A'}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Personal Details</p>
              <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <Calendar size={16} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>DOB: {viewPatient?.date_of_birth || 'N/A'}</span>
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-xs text-slate-500">Address</span>
                  <span>{viewPatient?.address || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Recent Appointments</h3>
            {viewAppointments.length === 0 ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No appointments found for this patient.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {viewAppointments.slice(0, 5).map((apt) => (
                  <div key={apt.id} className="p-4 bg-white dark:bg-slate-900 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{apt.doctor_name || 'Unassigned Doctor'}</p>
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
        title="Delete Patient"
        message="Are you sure you want to delete this patient record? This action cannot be undone."
        onConfirm={onDelete}
        onCancel={() => setDeleteId(null)}
        isDangerous={true}
      />
    </div>
  );
}
