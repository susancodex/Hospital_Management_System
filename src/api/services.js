import apiClient from './client.js';

export const authAPI = {
  login: (username, password) =>
    apiClient.post('/token/', { username, password }),

  register: (data) => apiClient.post('/register/', data),

  refreshToken: (refresh) =>
    apiClient.post('/token/refresh/', { refresh }),

  forgotPassword: (data) => apiClient.post('/forgot-password/', data),

  changePassword: (data) => apiClient.post('/change-password/', data),

  getProfile: () => apiClient.get('/profile/'),

  updateProfile: (formData) =>
    apiClient.patch('/profile/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
};

const buildListUrl = (base, params) => {
  if (!params || Object.keys(params).length === 0) return base;
  const qs = new URLSearchParams(params).toString();
  return `${base}?${qs}`;
};

export const doctorsAPI = {
  list: (params) => apiClient.get(buildListUrl('/doctors/', params)),
  create: (data) => apiClient.post('/doctors/', data),
  retrieve: (id) => apiClient.get(`/doctors/${id}/`),
  update: (id, data) => apiClient.put(`/doctors/${id}/`, data),
  delete: (id) => apiClient.delete(`/doctors/${id}/`),
};

export const patientsAPI = {
  list: (params) => apiClient.get(buildListUrl('/patients/', params)),
  create: (data) => apiClient.post('/patients/', data),
  retrieve: (id) => apiClient.get(`/patients/${id}/`),
  update: (id, data) => apiClient.put(`/patients/${id}/`, data),
  delete: (id) => apiClient.delete(`/patients/${id}/`),
};

export const appointmentsAPI = {
  list: (params) => apiClient.get(buildListUrl('/appointments/', params)),
  create: (data) => apiClient.post('/appointments/', data),
  retrieve: (id) => apiClient.get(`/appointments/${id}/`),
  update: (id, data) => apiClient.put(`/appointments/${id}/`, data),
  delete: (id) => apiClient.delete(`/appointments/${id}/`),
};

export const medicalRecordsAPI = {
  list: (params) => apiClient.get(buildListUrl('/medical-records/', params)),
  create: (data) => apiClient.post('/medical-records/', data),
  retrieve: (id) => apiClient.get(`/medical-records/${id}/`),
  update: (id, data) => apiClient.put(`/medical-records/${id}/`, data),
  delete: (id) => apiClient.delete(`/medical-records/${id}/`),
};

export const billingAPI = {
  list: (params) => apiClient.get(buildListUrl('/billing/', params)),
  create: (data) => apiClient.post('/billing/', data),
  retrieve: (id) => apiClient.get(`/billing/${id}/`),
  update: (id, data) => apiClient.put(`/billing/${id}/`, data),
  delete: (id) => apiClient.delete(`/billing/${id}/`),
};
