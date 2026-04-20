import React, { useState, useEffect } from 'react';
import { appointmentsAPI } from '../api/services.js';
import { Card, Button, DataTable, Modal, Input, Form, Select, Textarea, Toast, StatusBadge } from '../components/UIComponents.jsx';
import '../styles/crud.css';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ isOpen: false, type: 'add', appointment: null });
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    status: 'scheduled',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentsAPI.list();
      setAppointments(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load appointments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type, appointment = null) => {
    if (type === 'add') {
      setFormData({
        patient_id: '',
        doctor_id: '',
        appointment_date: '',
        appointment_time: '',
        status: 'scheduled',
        notes: '',
      });
    } else {
      setFormData(appointment);
    }
    setFormErrors({});
    setModal({ isOpen: true, type, appointment });
  };

  const handleCloseModal = () => {
    setModal({ isOpen: false, type: 'add', appointment: null });
    setFormData({});
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.patient_id) errors.patient_id = 'Patient is required';
    if (!formData.doctor_id) errors.doctor_id = 'Doctor is required';
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
      fetchAppointments();
    } catch (err) {
      setToast({ message: 'Failed to save appointment', type: 'danger' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      await appointmentsAPI.delete(id);
      setToast({ message: 'Appointment cancelled successfully!', type: 'success' });
      fetchAppointments();
    } catch (err) {
      setToast({ message: 'Failed to cancel appointment', type: 'danger' });
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'patient_id', label: 'Patient' },
    { key: 'doctor_id', label: 'Doctor' },
    { key: 'appointment_date', label: 'Date' },
    { key: 'appointment_time', label: 'Time' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
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
          <p>Manage appointments</p>
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
          <div className="form-grid">
            <Input
              label="Date"
              type="date"
              value={formData.appointment_date}
              onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
              error={formErrors.appointment_date}
            />
            <Input
              label="Time"
              type="time"
              value={formData.appointment_time}
              onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
              error={formErrors.appointment_time}
            />
          </div>
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
          <Textarea
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows="4"
          />
          <div className="modal-actions">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {modal.type === 'add' ? 'Schedule Appointment' : 'Update Appointment'}
            </Button>
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
