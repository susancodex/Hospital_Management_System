import React, { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { doctorsAPI } from '../api/services.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { Card, Button, DataTable, Modal, Input, Form, Select, Textarea, Toast } from '../components/UIComponents.jsx';
import '../styles/crud.css';

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [modal, setModal] = useState({ isOpen: false, type: 'add', doctor: null });
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    specialization: '',
    license_number: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      const params = debouncedSearch ? { search: debouncedSearch } : {};
      const response = await doctorsAPI.list(params);
      setDoctors(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load doctors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const handleOpenModal = (type, doctor = null) => {
    if (type === 'add') {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        specialization: '',
        license_number: '',
      });
    } else {
      setFormData(doctor);
    }
    setFormErrors({});
    setModal({ isOpen: true, type, doctor });
  };

  const handleCloseModal = () => {
    setModal({ isOpen: false, type: 'add', doctor: null });
    setFormData({});
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.first_name) errors.first_name = 'First name is required';
    if (!formData.last_name) errors.last_name = 'Last name is required';
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.phone) errors.phone = 'Phone is required';
    if (!formData.specialization) errors.specialization = 'Specialization is required';
    if (!formData.license_number) errors.license_number = 'License number is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (modal.type === 'add') {
        await doctorsAPI.create(formData);
        setToast({ message: 'Doctor added successfully!', type: 'success' });
      } else {
        await doctorsAPI.update(modal.doctor.id, formData);
        setToast({ message: 'Doctor updated successfully!', type: 'success' });
      }
      handleCloseModal();
      fetchDoctors();
    } catch (err) {
      setToast({ message: 'Failed to save doctor', type: 'danger' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) return;

    try {
      await doctorsAPI.delete(id);
      setToast({ message: 'Doctor deleted successfully!', type: 'success' });
      fetchDoctors();
    } catch (err) {
      setToast({ message: 'Failed to delete doctor', type: 'danger' });
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'first_name',
      label: 'Name',
      render: (value, row) => `${row.first_name} ${row.last_name}`,
    },
    { key: 'specialization', label: 'Specialization' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'license_number', label: 'License #' },
  ];

  const actions = (row) => [
    { label: 'Edit', variant: 'secondary', onClick: () => handleOpenModal('edit', row) },
    { label: 'Delete', variant: 'danger', onClick: () => handleDelete(row.id) },
  ];

  return (
    <div className="crud-page">
      <div className="crud-header">
        <div>
          <h1>Doctors</h1>
          <p>Manage doctor records</p>
        </div>
        <Button variant="primary" onClick={() => handleOpenModal('add')}>
          + Add Doctor
        </Button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="page-search-row">
        <div className="page-search">
          <Search size={16} className="page-search-icon" />
          <input
            placeholder="Search by name, specialization, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="page-search-count">
          {loading ? 'Loading...' : `${doctors.length} doctor${doctors.length === 1 ? '' : 's'}`}
        </span>
      </div>

      <Card>
        <DataTable columns={columns} data={doctors} actions={actions} loading={loading} />
      </Card>

      <Modal
        isOpen={modal.isOpen}
        onClose={handleCloseModal}
        title={modal.type === 'add' ? 'Add Doctor' : 'Edit Doctor'}
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
            label="Specialization"
            value={formData.specialization}
            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            error={formErrors.specialization}
            placeholder="e.g., Cardiology, Neurology"
          />
          <Input
            label="License Number"
            value={formData.license_number}
            onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
            error={formErrors.license_number}
          />
          <div className="modal-actions">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {modal.type === 'add' ? 'Add Doctor' : 'Update Doctor'}
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
