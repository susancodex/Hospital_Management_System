import React, { useState, useEffect } from 'react';
import { appointmentsAPI, patientsAPI, doctorsAPI } from '../api/services.js';
import { Card, Button, DataTable, Modal, Input, Form, Textarea, Toast, StatusBadge } from '../components/UIComponents.jsx';
import '../styles/crud.css';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ isOpen: false, type: 'add', appointment: null });
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    patient: '',
    doctor: '',
    appointment_date: '',
    appointment_time: '',
    status: 'scheduled',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [apptRes, patientsRes, doctorsRes] = await Promise.all([
        appointmentsAPI.list(),
        patientsAPI.list(),
        doctorsAPI.list(),
      ]);
      setAppointments(apptRes.data);
      setPatients(patientsRes.data);
      setDoctors(doctorsRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load data. Please check your connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const emptyForm = () => ({
    patient: '', doctor: '', appointment_date: '',
    appointment_time: '', status: 'scheduled', notes: '',
  });

  const handleOpenModal = (type, appointment = null) => {
    if (type === 'add') {
      setFormData(emptyForm());
    } else {
      setFormData({
        patient: appointment.patient,
        doctor: appointment.doctor,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time || '',
        status: appointment.status,
        notes: appointment.notes || '',
      });
    }
    setFormErrors({});
    setModal({ isOpen: true, type, appointment });
  };

  const handleCloseModal = () => {
    setModal({ isOpen: false, type: 'add', appointment: null });
    setFormData(emptyForm());
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.patient) errors.patient = 'Patient is required';
    if (!formData.doctor) errors.doctor = 'Doctor is required';
    if (!formData.appointment_date) errors.appointment_date = 'Date is required';
    if (!formData.appointment_time) errors.appointment_time = 'Time is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      if (modal.type === 'add') {
        await appointmentsAPI.create(formData);
        setToast({ message: 'Appointment created successfully!', type: 'success' });
      } else {
        await appointmentsAPI.update(modal.appointment.id, formData);
        setToast({ message: 'Appointment updated successfully!', type: 'success' });
      }
      handleCloseModal();
      fetchAll();
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to save appointment';
      setToast({ message: msg, type: 'danger' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await appointmentsAPI.delete(id);
      setToast({ message: 'Appointment cancelled!', type: 'success' });
      fetchAll();
    } catch (err) {
      setToast({ message: 'Failed to cancel appointment', type: 'danger' });
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'patient_name', label: 'Patient' },
    { key: 'doctor_name', label: 'Doctor' },
    { key: 'appointment_date', label: 'Date' },
    { key: 'appointment_time', label: 'Time' },
    { key: 'status', label: 'Status', render: (value) => <StatusBadge status={value} /> },
    {
      key: 'notes', label: 'Notes',
      render: (val) => val ? (val.length > 40 ? val.substring(0, 40) + '…' : val) : '—',
    },
  ];

  const actions = (row) => [
    { label: 'Edit', variant: 'secondary', onClick: () => handleOpenModal('edit', row) },
    { label: 'Cancel', variant: 'danger', onClick: () => handleDelete(row.id) },
  ];

  return (
    <div className="crud-page">
      <div className="crud-header">
        <div>
          <h1>Appointments</h1>
          <p>Schedule and manage patient appointments</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal('add')}>
          + New Appointment
        </Button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <Card>
        <DataTable columns={columns} data={appointments} actions={actions} loading={loading} />
      </Card>

      <Modal
        isOpen={modal.isOpen}
        onClose={handleCloseModal}
        title={modal.type === 'add' ? 'New Appointment' : 'Edit Appointment'}
      >
        <Form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Patient *</label>
            <select
              className={`form-input${formErrors.patient ? ' input-error' : ''}`}
              value={formData.patient}
              onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
            >
              <option value="">Select patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
              ))}
            </select>
            {formErrors.patient && <span className="error-text">{formErrors.patient}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Doctor *</label>
            <select
              className={`form-input${formErrors.doctor ? ' input-error' : ''}`}
              value={formData.doctor}
              onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
            >
              <option value="">Select doctor…</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>Dr. {d.first_name} {d.last_name} — {d.specialization}</option>
              ))}
            </select>
            {formErrors.doctor && <span className="error-text">{formErrors.doctor}</span>}
          </div>

          <div className="form-grid">
            <Input
              label="Date *"
              type="date"
              value={formData.appointment_date}
              onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
              error={formErrors.appointment_date}
            />
            <Input
              label="Time *"
              type="time"
              value={formData.appointment_time}
              onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
              error={formErrors.appointment_time}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-input"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows="3"
          />

          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={handleCloseModal}>Cancel</Button>
            <Button variant="primary" type="submit">
              {modal.type === 'add' ? 'Schedule Appointment' : 'Update Appointment'}
            </Button>
          </div>
        </Form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
