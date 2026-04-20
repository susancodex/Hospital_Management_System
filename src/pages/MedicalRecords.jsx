import React, { useState, useEffect } from 'react';
import { medicalRecordsAPI } from '../api/services.js';
import { Card, Button, DataTable, Modal, Input, Form, Textarea, Toast } from '../components/UIComponents.jsx';
import '../styles/crud.css';
import '../styles/records.css';

export default function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ isOpen: false, type: 'add', record: null });
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    record_date: '',
    diagnosis: '',
    treatment: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await medicalRecordsAPI.list();
      setRecords(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load medical records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type, record = null) => {
    if (type === 'add') {
      setFormData({
        patient_id: '',
        doctor_id: '',
        record_date: new Date().toISOString().split('T')[0],
        diagnosis: '',
        treatment: '',
        notes: '',
      });
    } else {
      setFormData(record);
    }
    setFormErrors({});
    setModal({ isOpen: true, type, record });
  };

  const handleCloseModal = () => {
    setModal({ isOpen: false, type: 'add', record: null });
    setFormData({});
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.patient_id) errors.patient_id = 'Patient is required';
    if (!formData.doctor_id) errors.doctor_id = 'Doctor is required';
    if (!formData.diagnosis) errors.diagnosis = 'Diagnosis is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (modal.type === 'add') {
        await medicalRecordsAPI.create(formData);
        setToast({ message: 'Record created successfully!', type: 'success' });
      } else {
        await medicalRecordsAPI.update(modal.record.id, formData);
        setToast({ message: 'Record updated successfully!', type: 'success' });
      }
      handleCloseModal();
      fetchRecords();
    } catch (err) {
      setToast({ message: 'Failed to save record', type: 'danger' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;

    try {
      await medicalRecordsAPI.delete(id);
      setToast({ message: 'Record deleted successfully!', type: 'success' });
      fetchRecords();
    } catch (err) {
      setToast({ message: 'Failed to delete record', type: 'danger' });
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'patient_id', label: 'Patient' },
    { key: 'doctor_id', label: 'Doctor' },
    { key: 'record_date', label: 'Date' },
    { key: 'diagnosis', label: 'Diagnosis' },
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

      <Card>
        <DataTable columns={columns} data={records} actions={actions} loading={loading} />
      </Card>

      <Modal
        isOpen={modal.isOpen}
        onClose={handleCloseModal}
        title={modal.type === 'add' ? 'Create Medical Record' : 'Medical Record Details'}
      >
        <Form onSubmit={handleSubmit}>
          <Input
            label="Patient ID"
            value={formData.patient_id}
            onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
            error={formErrors.patient_id}
          />
          <Input
            label="Doctor ID"
            value={formData.doctor_id}
            onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
            error={formErrors.doctor_id}
          />
          <Input
            label="Record Date"
            type="date"
            value={formData.record_date}
            onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
          />
          <Textarea
            label="Diagnosis"
            value={formData.diagnosis}
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            error={formErrors.diagnosis}
            rows="3"
          />
          <Textarea
            label="Treatment"
            value={formData.treatment}
            onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
            rows="3"
          />
          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows="3"
          />
          <div className="modal-actions">
            <Button variant="secondary" onClick={handleCloseModal}>
              Close
            </Button>
            {modal.type !== 'view' && (
              <Button variant="primary" type="submit">
                {modal.type === 'add' ? 'Create Record' : 'Update Record'}
              </Button>
            )}
          </div>
        </Form>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
