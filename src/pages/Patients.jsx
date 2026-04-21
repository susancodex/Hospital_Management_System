import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { patientsAPI } from '../api/services.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { Card, Button, DataTable, Modal, Input, Form, Textarea, Toast } from '../components/UIComponents.jsx';
import '../styles/crud.css';

export default function Patients() {
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(initialQ);
  const debouncedSearch = useDebounce(search, 300);
  const [modal, setModal] = useState({ isOpen: false, type: 'add', patient: null });
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'M',
    address: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const params = debouncedSearch ? { search: debouncedSearch } : {};
      const response = await patientsAPI.list(params);
      setPatients(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load patients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleOpenModal = (type, patient = null) => {
    if (type === 'add') {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: 'M',
        address: '',
      });
    } else {
      setFormData(patient);
    }
    setFormErrors({});
    setModal({ isOpen: true, type, patient });
  };

  const handleCloseModal = () => {
    setModal({ isOpen: false, type: 'add', patient: null });
    setFormData({});
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.first_name) errors.first_name = 'First name is required';
    if (!formData.last_name) errors.last_name = 'Last name is required';
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.phone) errors.phone = 'Phone is required';
    if (!formData.date_of_birth) errors.date_of_birth = 'Date of birth is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (modal.type === 'add') {
        await patientsAPI.create(formData);
        setToast({ message: 'Patient added successfully!', type: 'success' });
      } else {
        await patientsAPI.update(modal.patient.id, formData);
        setToast({ message: 'Patient updated successfully!', type: 'success' });
      }
      handleCloseModal();
      fetchPatients();
    } catch (err) {
      setToast({ message: 'Failed to save patient', type: 'danger' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return;

    try {
      await patientsAPI.delete(id);
      setToast({ message: 'Patient deleted successfully!', type: 'success' });
      fetchPatients();
    } catch (err) {
      setToast({ message: 'Failed to delete patient', type: 'danger' });
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'first_name',
      label: 'Name',
      render: (value, row) => `${row.first_name} ${row.last_name}`,
    },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'date_of_birth', label: 'DOB' },
    { key: 'gender', label: 'Gender' },
  ];

  const actions = (row) => [
    { label: 'Edit', variant: 'secondary', onClick: () => handleOpenModal('edit', row) },
    { label: 'Delete', variant: 'danger', onClick: () => handleDelete(row.id) },
  ];

  return (
    <div className="crud-page">
      <div className="crud-header">
        <div>
          <h1>Patients</h1>
          <p>Manage patient records</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal('add')}>
          + Add Patient
        </Button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="page-search-row">
        <div className="page-search">
          <Search size={16} className="page-search-icon" />
          <input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="page-search-count">
          {loading ? 'Loading...' : `${patients.length} patient${patients.length === 1 ? '' : 's'}`}
        </span>
      </div>

      <Card>
        <DataTable columns={columns} data={patients} actions={actions} loading={loading} />
      </Card>

      <Modal
        isOpen={modal.isOpen}
        onClose={handleCloseModal}
        title={modal.type === 'add' ? 'Add Patient' : 'Edit Patient'}
      >
        <Form onSubmit={handleSubmit}>
          <div className="form-grid">
            <Input
              label="First Name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              error={formErrors.first_name}
            />
            <Input
              label="Last Name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              error={formErrors.last_name}
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            error={formErrors.phone}
          />
          <Input
            label="Date of Birth"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            error={formErrors.date_of_birth}
          />
          <select
            className="form-input"
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
          >
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
          </select>
          <Textarea
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows="4"
          />
          <div className="modal-actions">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {modal.type === 'add' ? 'Add Patient' : 'Update Patient'}
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
