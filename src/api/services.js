import apiClient from './client.js';

export const authAPI = {
  login: (username, password) =>
    apiClient.post('/token/', { username, password }),

  refreshToken: (refresh) =>
    apiClient.post('/token/refresh/', { refresh }),

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

export const doctorsAPI = {
  list: () => apiClient.get('/doctors/'),
  create: (data) => apiClient.post('/doctors/', data),
  retrieve: (id) => apiClient.get(`/doctors/${id}/`),
  update: (id, data) => apiClient.put(`/doctors/${id}/`, data),
  delete: (id) => apiClient.delete(`/doctors/${id}/`),
};

export const patientsAPI = {
  list: () => apiClient.get('/patients/'),
  create: (data) => apiClient.post('/patients/', data),
  retrieve: (id) => apiClient.get(`/patients/${id}/`),
  update: (id, data) => apiClient.put(`/patients/${id}/`, data),
  delete: (id) => apiClient.delete(`/patients/${id}/`),
};

export const appointmentsAPI = {
  list: () => apiClient.get('/appointments/'),
  create: (data) => apiClient.post('/appointments/', data),
  retrieve: (id) => apiClient.get(`/appointments/${id}/`),
  update: (id, data) => apiClient.put(`/appointments/${id}/`, data),
  delete: (id) => apiClient.delete(`/appointments/${id}/`),
};

export const medicalRecordsAPI = {
  list: () => apiClient.get('/medical-records/'),
  create: (data) => apiClient.post('/medical-records/', data),
  retrieve: (id) => apiClient.get(`/medical-records/${id}/`),
  update: (id, data) => apiClient.put(`/medical-records/${id}/`, data),
  delete: (id) => apiClient.delete(`/medical-records/${id}/`),
};

export const billingAPI = {
  list: () => apiClient.get('/billing/'),
  create: (data) => apiClient.post('/billing/', data),
  retrieve: (id) => apiClient.get(`/billing/${id}/`),
  update: (id, data) => apiClient.put(`/billing/${id}/`, data),
  delete: (id) => apiClient.delete(`/billing/${id}/`),
};
