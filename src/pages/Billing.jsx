import React, { useState, useEffect } from 'react';
import { billingAPI } from '../api/services.js';
import { Card, Button, DataTable, Modal, Input, Form, Textarea, Toast, StatusBadge } from '../components/UIComponents.jsx';
import '../styles/crud.css';
import '../styles/billing.css';

export default function Billing() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ isOpen: false, type: 'add', bill: null });
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_id: '',
    amount: '',
    status: 'unpaid',
    description: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await billingAPI.list();
      setBills(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load billing records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type, bill = null) => {
    if (type === 'add') {
      setFormData({
        patient_id: '',
        appointment_id: '',
        amount: '',
        status: 'unpaid',
        description: '',
      });
    } else {
      setFormData(bill);
    }
    setFormErrors({});
    setModal({ isOpen: true, type, bill });
  };

  const handleCloseModal = () => {
    setModal({ isOpen: false, type: 'add', bill: null });
    setFormData({});
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.patient_id) errors.patient_id = 'Patient is required';
    if (!formData.amount) errors.amount = 'Amount is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (modal.type === 'add') {
        await billingAPI.create(formData);
        setToast({ message: 'Bill created successfully!', type: 'success' });
      } else {
        await billingAPI.update(modal.bill.id, formData);
        setToast({ message: 'Bill updated successfully!', type: 'success' });
      }
      handleCloseModal();
      fetchBills();
    } catch (err) {
      setToast({ message: 'Failed to save bill', type: 'danger' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;

    try {
      await billingAPI.delete(id);
      setToast({ message: 'Bill deleted successfully!', type: 'success' });
      fetchBills();
    } catch (err) {
      setToast({ message: 'Failed to delete bill', type: 'danger' });
    }
  };

  const totalAmount = bills.reduce((sum, bill) => sum + (parseFloat(bill.amount) || 0), 0);
  const paidAmount = bills
    .filter((b) => b.status === 'paid')
    .reduce((sum, bill) => sum + (parseFloat(bill.amount) || 0), 0);

  const columns = [
    { key: 'id', label: 'Invoice #' },
    { key: 'patient_id', label: 'Patient' },
    { key: 'amount', label: 'Amount', render: (val) => `$${parseFloat(val).toFixed(2)}` },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
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
            <div className="summary-value" style={{ color: 'var(--success)' }}>
              ${paidAmount.toFixed(2)}
            </div>
          </div>
        </Card>
        <Card>
          <div className="summary-item">
            <div className="summary-label">Outstanding</div>
            <div className="summary-value" style={{ color: 'var(--danger)' }}>
              ${(totalAmount - paidAmount).toFixed(2)}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <DataTable columns={columns} data={bills} actions={actions} loading={loading} />
      </Card>

      <Modal
        isOpen={modal.isOpen}
        onClose={handleCloseModal}
        title={modal.type === 'add' ? 'Create Invoice' : 'Invoice Details'}
      >
        <Form onSubmit={handleSubmit}>
          <Input
            label="Patient ID"
            value={formData.patient_id}
            onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
            error={formErrors.patient_id}
          />
          <Input
            label="Appointment ID (Optional)"
            value={formData.appointment_id}
            onChange={(e) => setFormData({ ...formData, appointment_id: e.target.value })}
          />
          <Input
            label="Amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            error={formErrors.amount}
          />
          <select
            className="form-input"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
          </select>
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="4"
          />
          <div className="modal-actions">
            <Button variant="secondary" onClick={handleCloseModal}>
              Close
            </Button>
            {modal.type !== 'view' && (
              <Button variant="primary" type="submit">
                {modal.type === 'add' ? 'Create Invoice' : 'Update Invoice'}
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
