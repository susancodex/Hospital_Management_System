import React, { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { medicalRecordsAPI, patientsAPI, doctorsAPI } from '../api/services.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { Card, Button, DataTable, Modal, Input, Form, Textarea, Toast } from '../components/UIComponents.jsx';
import '../styles/crud.css';
import '../styles/records.css';

export default function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [modal, setModal] = useState({ isOpen: false, type: 'add', record: null });
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    patient: '',
    doctor: '',
    record_date: '',
    diagnosis: '',
    treatment: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const params = debouncedSearch ? { search: debouncedSearch } : {};
      const [recRes, patientsRes, doctorsRes] = await Promise.all([
        medicalRecordsAPI.list(params),
        patientsAPI.list(),
        doctorsAPI.list(),
      ]);
      setRecords(recRes.data);
      setPatients(patientsRes.data);
      setDoctors(doctorsRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load medical records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const emptyForm = () => ({
    patient: '', doctor: '',
    record_date: new Date().toISOString().split('T')[0],
    diagnosis: '', treatment: '', notes: '',
  });

  const handleOpenModal = (type, record = null) => {
    if (type === 'add') {
      setFormData(emptyForm());
    } else {
      setFormData({
        patient: record.patient,
        doctor: record.doctor || '',
        record_date: record.record_date,
        diagnosis: record.diagnosis,
        treatment: record.treatment || '',
        notes: record.notes || '',
      });
    }
    setFormErrors({});
    setModal({ isOpen: true, type, record });
  };

  const handleCloseModal = () => {
    setModal({ isOpen: false, type: 'add', record: null });
    setFormData(emptyForm());
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.patient) errors.patient = 'Patient is required';
    if (!formData.diagnosis) errors.diagnosis = 'Diagnosis is required';
    if (!formData.record_date) errors.record_date = 'Date is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload = { ...formData, doctor: formData.doctor || null };
    try {
      if (modal.type === 'add') {
        await medicalRecordsAPI.create(payload);
        setToast({ message: 'Record created successfully!', type: 'success' });
      } else {
        await medicalRecordsAPI.update(modal.record.id, payload);
        setToast({ message: 'Record updated successfully!', type: 'success' });
      }
      handleCloseModal();
      fetchAll();
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to save record';
      setToast({ message: msg, type: 'danger' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await medicalRecordsAPI.delete(id);
      setToast({ message: 'Record deleted!', type: 'success' });
      fetchAll();
    } catch (err) {
      setToast({ message: 'Failed to delete record', type: 'danger' });
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'patient_name', label: 'Patient' },
    { key: 'doctor_name', label: 'Doctor' },
    { key: 'record_date', label: 'Date' },
    {
      key: 'diagnosis', label: 'Diagnosis',
      render: (val) => val.length > 50 ? val.substring(0, 50) + '…' : val,
    },
  ];

  const actions = (row) => [
    { label: 'View', variant: 'secondary', onClick: () => handleOpenModal('view', row) },
    { label: 'Edit', variant: 'secondary', onClick: () => handleOpenModal('edit', row) },
    { label: 'Delete', variant: 'danger', onClick: () => handleDelete(row.id) },
  ];

  return (
    <div className="crud-page">
      <div className="crud-header">
        <div>
          <h1>Medical Records</h1>
          <p>View and manage patient medical records</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal('add')}>
          + New Record
        </Button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="page-search-row">
        <div className="page-search">
          <Search size={16} className="page-search-icon" />
          <input
            placeholder="Search by patient, diagnosis, or treatment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="page-search-count">
          {loading ? 'Loading...' : `${records.length} record${records.length === 1 ? '' : 's'}`}
        </span>
      </div>

      <Card>
        <DataTable columns={columns} data={records} actions={actions} loading={loading} />
      </Card>

      <Modal
        isOpen={modal.isOpen}
        onClose={handleCloseModal}
        title={
          modal.type === 'add' ? 'Create Medical Record'
          : modal.type === 'view' ? 'Medical Record Details'
          : 'Edit Medical Record'
        }
      >
        <Form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Patient *</label>
            <select
              className={`form-input${formErrors.patient ? ' input-error' : ''}`}
              value={formData.patient}
              onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
              disabled={modal.type === 'view'}
            >
              <option value="">Select patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
              ))}
            </select>
            {formErrors.patient && <span className="error-text">{formErrors.patient}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Doctor</label>
            <select
              className="form-input"
              value={formData.doctor}
              onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
              disabled={modal.type === 'view'}
            >
              <option value="">No specific doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name} — {d.specialization}</option>
              ))}
            </select>
          </div>

          <Input
            label="Record Date *"
            type="date"
            value={formData.record_date}
            onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
            error={formErrors.record_date}
            disabled={modal.type === 'view'}
          />

          <Textarea
            label="Diagnosis *"
            value={formData.diagnosis}
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            error={formErrors.diagnosis}
            rows="3"
            disabled={modal.type === 'view'}
          />

          <Textarea
            label="Treatment"
            value={formData.treatment}
            onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
            rows="3"
            disabled={modal.type === 'view'}
          />

          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows="3"
            disabled={modal.type === 'view'}
          />

          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={handleCloseModal}>Close</Button>
            {modal.type !== 'view' && (
              <Button variant="primary" type="submit">
                {modal.type === 'add' ? 'Create Record' : 'Update Record'}
              </Button>
            )}
          </div>
        </Form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
