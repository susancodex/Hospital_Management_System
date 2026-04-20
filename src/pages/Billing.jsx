import React, { useState, useEffect } from 'react';
import { billingAPI, patientsAPI, appointmentsAPI } from '../api/services.js';
import { Card, Button, DataTable, Modal, Input, Form, Textarea, Toast, StatusBadge } from '../components/UIComponents.jsx';
import '../styles/crud.css';
import '../styles/billing.css';

export default function Billing() {
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ isOpen: false, type: 'add', bill: null });
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    patient: '',
    appointment: '',
    amount: '',
    status: 'unpaid',
    description: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [billRes, patientsRes, apptRes] = await Promise.all([
        billingAPI.list(),
        patientsAPI.list(),
        appointmentsAPI.list(),
      ]);
      setBills(billRes.data);
      setPatients(patientsRes.data);
      setAppointments(apptRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load billing records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const emptyForm = () => ({
    patient: '', appointment: '', amount: '', status: 'unpaid', description: '',
  });

  const handleOpenModal = (type, bill = null) => {
    if (type === 'add') {
      setFormData(emptyForm());
    } else {
      setFormData({
        patient: bill.patient,
        appointment: bill.appointment || '',
        amount: bill.amount,
        status: bill.status,
        description: bill.description || '',
      });
    }
    setFormErrors({});
    setModal({ isOpen: true, type, bill });
  };

  const handleCloseModal = () => {
    setModal({ isOpen: false, type: 'add', bill: null });
    setFormData(emptyForm());
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.patient) errors.patient = 'Patient is required';
    if (!formData.amount) errors.amount = 'Amount is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload = { ...formData, appointment: formData.appointment || null };
    try {
      if (modal.type === 'add') {
        await billingAPI.create(payload);
        setToast({ message: 'Invoice created successfully!', type: 'success' });
      } else {
        await billingAPI.update(modal.bill.id, payload);
        setToast({ message: 'Invoice updated successfully!', type: 'success' });
      }
      handleCloseModal();
      fetchAll();
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to save invoice';
      setToast({ message: msg, type: 'danger' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await billingAPI.delete(id);
      setToast({ message: 'Invoice deleted!', type: 'success' });
      fetchAll();
    } catch (err) {
      setToast({ message: 'Failed to delete invoice', type: 'danger' });
    }
  };

  const totalAmount = bills.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
  const paidAmount = bills.filter((b) => b.status === 'paid').reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
  const outstanding = totalAmount - paidAmount;

  const patientAppts = (patientId) =>
    appointments.filter((a) => String(a.patient) === String(patientId));

  const columns = [
    { key: 'id', label: 'Invoice #' },
    { key: 'patient_name', label: 'Patient' },
    { key: 'amount', label: 'Amount', render: (val) => `$${parseFloat(val).toFixed(2)}` },
    { key: 'status', label: 'Status', render: (value) => <StatusBadge status={value} /> },
    {
      key: 'description', label: 'Description',
      render: (val) => val ? (val.length > 40 ? val.substring(0, 40) + '…' : val) : '—',
    },
    { key: 'created_at', label: 'Date', render: (val) => val ? new Date(val).toLocaleDateString() : '—' },
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
          <h1>Billing</h1>
          <p>Manage patient billing and invoices</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal('add')}>
          + Create Invoice
        </Button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="billing-summary">
        <Card>
          <div className="summary-item">
            <div className="summary-label">Total Invoiced</div>
            <div className="summary-value">${totalAmount.toFixed(2)}</div>
          </div>
        </Card>
        <Card>
          <div className="summary-item">
            <div className="summary-label">Paid Amount</div>
            <div className="summary-value" style={{ color: 'var(--success)' }}>${paidAmount.toFixed(2)}</div>
          </div>
        </Card>
        <Card>
          <div className="summary-item">
            <div className="summary-label">Outstanding</div>
            <div className="summary-value" style={{ color: 'var(--danger)' }}>${outstanding.toFixed(2)}</div>
          </div>
        </Card>
      </div>

      <Card>
        <DataTable columns={columns} data={bills} actions={actions} loading={loading} />
      </Card>

      <Modal
        isOpen={modal.isOpen}
        onClose={handleCloseModal}
        title={
          modal.type === 'add' ? 'Create Invoice'
          : modal.type === 'view' ? 'Invoice Details'
          : 'Edit Invoice'
        }
      >
        <Form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Patient *</label>
            <select
              className={`form-input${formErrors.patient ? ' input-error' : ''}`}
              value={formData.patient}
              onChange={(e) => setFormData({ ...formData, patient: e.target.value, appointment: '' })}
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
            <label className="form-label">Related Appointment (optional)</label>
            <select
              className="form-input"
              value={formData.appointment}
              onChange={(e) => setFormData({ ...formData, appointment: e.target.value })}
              disabled={modal.type === 'view' || !formData.patient}
            >
              <option value="">No appointment</option>
              {patientAppts(formData.patient).map((a) => (
                <option key={a.id} value={a.id}>
                  #{a.id} — {a.appointment_date} {a.appointment_time || ''} ({a.doctor_name})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Amount *"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            error={formErrors.amount}
            disabled={modal.type === 'view'}
          />

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-input"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              disabled={modal.type === 'view'}
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
            </select>
          </div>

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="3"
            disabled={modal.type === 'view'}
          />

          <div className="modal-actions">
            <Button variant="secondary" type="button" onClick={handleCloseModal}>Close</Button>
            {modal.type !== 'view' && (
              <Button variant="primary" type="submit">
                {modal.type === 'add' ? 'Create Invoice' : 'Update Invoice'}
              </Button>
            )}
          </div>
        </Form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
