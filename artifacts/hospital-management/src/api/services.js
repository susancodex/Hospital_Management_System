import apiClient from './client.js';

const toQueryParams = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value);
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
};

const unwrapList = (response) => {
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.results)) return response.data.results;
  return [];
};

const postWithFallback = async (primaryUrl, fallbackUrl, payload) => {
  try {
    return await apiClient.post(primaryUrl, payload);
  } catch (error) {
    if (error?.response?.status === 404 && fallbackUrl) {
      return apiClient.post(fallbackUrl, payload);
    }
    throw error;
  }
};

const getWithFallback = async (primaryUrl, fallbackUrl) => {
  try {
    return await apiClient.get(primaryUrl);
  } catch (error) {
    if (error?.response?.status === 404 && fallbackUrl) {
      return apiClient.get(fallbackUrl);
    }
    throw error;
  }
};

const patchWithFallback = async (primaryUrl, fallbackUrl, payload, config) => {
  try {
    return await apiClient.patch(primaryUrl, payload, config);
  } catch (error) {
    if (error?.response?.status === 404 && fallbackUrl) {
      return apiClient.patch(fallbackUrl, payload, config);
    }
    throw error;
  }
};

export const authAPI = {
  getAuthConfig: () => apiClient.get('/auth-config/'),
  login: (username, password) => postWithFallback('/token/', null, { username, password }),
  register: (data) => postWithFallback('/register/', null, data),
  googleLogin: (credential) => apiClient.post('/google-login/', { credential }),
  refreshToken: (refresh) => apiClient.post('/token/refresh/', { refresh }),
  forgotPassword: (data) => apiClient.post('/forgot-password/', data),
  changePassword: (data) => apiClient.post('/change-password/', data),
  getProfile: () => getWithFallback('/profile/', null),
  me: () => apiClient.get('/users/me/'),
  updateProfile: (data) =>
    patchWithFallback('/profile/', null, data),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
};

export const doctorsAPI = {
  list: async (params) => {
    const response = await apiClient.get(`/doctors/${toQueryParams(params)}`);
    return { ...response, items: unwrapList(response) };
  },
  create: (data) => apiClient.post('/doctors/', data),
  retrieve: (id) => apiClient.get(`/doctors/${id}/`),
  update: (id, data) => apiClient.put(`/doctors/${id}/`, data),
  delete: (id) => apiClient.delete(`/doctors/${id}/`),
};

export const patientsAPI = {
  list: async (params) => {
    const response = await apiClient.get(`/patients/${toQueryParams(params)}`);
    return { ...response, items: unwrapList(response) };
  },
  create: (data) => apiClient.post('/patients/', data),
  retrieve: (id) => apiClient.get(`/patients/${id}/`),
  update: (id, data) => apiClient.put(`/patients/${id}/`, data),
  delete: (id) => apiClient.delete(`/patients/${id}/`),
};

export const appointmentsAPI = {
  list: async (params) => {
    const response = await apiClient.get(`/appointments/${toQueryParams(params)}`);
    return { ...response, items: unwrapList(response) };
  },
  create: (data) => apiClient.post('/appointments/', data),
  retrieve: (id) => apiClient.get(`/appointments/${id}/`),
  update: (id, data) => apiClient.put(`/appointments/${id}/`, data),
  delete: (id) => apiClient.delete(`/appointments/${id}/`),
};

export const medicalRecordsAPI = {
  list: async (params) => {
    const response = await apiClient.get(`/medical-records/${toQueryParams(params)}`);
    return { ...response, items: unwrapList(response) };
  },
  create: (data) => apiClient.post('/medical-records/', data),
  retrieve: (id) => apiClient.get(`/medical-records/${id}/`),
  update: (id, data) => apiClient.put(`/medical-records/${id}/`, data),
  delete: (id) => apiClient.delete(`/medical-records/${id}/`),
};

export const billingAPI = {
  list: async (params) => {
    const response = await apiClient.get(`/billing/${toQueryParams(params)}`);
    return { ...response, items: unwrapList(response) };
  },
  create: (data) => apiClient.post('/billing/', data),
  retrieve: (id) => apiClient.get(`/billing/${id}/`),
  update: (id, data) => apiClient.put(`/billing/${id}/`, data),
  delete: (id) => apiClient.delete(`/billing/${id}/`),
  initiateEsewaPayment: (id, payload = {}) => apiClient.post(`/billing/${id}/esewa/initiate/`, payload),
  initiateBankTransfer: (id, payload = {}) => apiClient.post(`/billing/${id}/bank-transfer/initiate/`, payload),
};

export const medicalReportsAPI = {
  list: async (params) => {
    const response = await apiClient.get(`/medical-reports/${toQueryParams(params)}`);
    return { ...response, items: unwrapList(response) };
  },
  create: (data) => apiClient.post('/medical-reports/', data),
  retrieve: (id) => apiClient.get(`/medical-reports/${id}/`),
  update: (id, data) => apiClient.put(`/medical-reports/${id}/`, data),
  delete: (id) => apiClient.delete(`/medical-reports/${id}/`),
};

export const billingPaymentsAPI = {
  list: async (params) => {
    const response = await apiClient.get(`/billing-payments/${toQueryParams(params)}`);
    return { ...response, items: unwrapList(response) };
  },
  create: (data) => apiClient.post('/billing-payments/', data),
  retrieve: (id) => apiClient.get(`/billing-payments/${id}/`),
  update: (id, data) => apiClient.put(`/billing-payments/${id}/`, data),
  delete: (id) => apiClient.delete(`/billing-payments/${id}/`),
  verify: (id, payload = {}) => apiClient.post(`/billing-payments/${id}/verify/`, payload),
};

export const prescriptionsAPI = {
  list: async (params) => {
    const response = await apiClient.get(`/prescriptions/${toQueryParams(params)}`);
    return { ...response, items: unwrapList(response) };
  },
  create: (data) => apiClient.post('/prescriptions/', data),
  retrieve: (id) => apiClient.get(`/prescriptions/${id}/`),
  update: (id, data) => apiClient.put(`/prescriptions/${id}/`, data),
  delete: (id) => apiClient.delete(`/prescriptions/${id}/`),
};

export const notificationsAPI = {
  list: () => apiClient.get('/notifications/'),
  markRead: (ids) => apiClient.post('/notifications/mark-read/', ids ? { ids } : {}),
  delete: (id) => apiClient.delete(`/notifications/${id}/`),
};

export const auditAPI = {
  list: (params) => apiClient.get(`/audit-logs/${toQueryParams(params)}`),
};

export const insightsAPI = {
  getAiInsights: () => apiClient.get('/ai/insights/'),
};

export const aiAPI = {
  chat: (message, history = []) => apiClient.post('/ai/chat/', { message, history }),
  analyzeSymptoms: (data) => apiClient.post('/ai/symptom-analyzer/', data),
  doctorAssistant: (data) => apiClient.post('/ai/doctor-assistant/', data),
  summarizeReport: (data) => apiClient.post('/ai/summarize-report/', data),
  icdSuggest: (data) => apiClient.post('/ai/icd-suggest/', data),
  labInterpret: (data) => apiClient.post('/ai/lab-interpret/', data),
  soapGenerate: (data) => apiClient.post('/ai/soap-generate/', data),
};

export const labOrdersAPI = {
  list: async (params) => {
    const response = await apiClient.get(`/lab-orders/${toQueryParams(params)}`);
    return { ...response, items: unwrapList(response) };
  },
  create: (data) => apiClient.post('/lab-orders/', data),
  retrieve: (id) => apiClient.get(`/lab-orders/${id}/`),
  update: (id, data) => apiClient.put(`/lab-orders/${id}/`, data),
  addResults: (id, data) => apiClient.post(`/lab-orders/${id}/results/`, data),
  delete: (id) => apiClient.delete(`/lab-orders/${id}/`),
};

export const pharmacyAPI = {
  listInventory: async (params) => {
    const response = await apiClient.get(`/pharmacy/inventory/${toQueryParams(params)}`);
    return { ...response, items: unwrapList(response) };
  },
  createInventory: (data) => apiClient.post('/pharmacy/inventory/', data),
  retrieveInventory: (id) => apiClient.get(`/pharmacy/inventory/${id}/`),
  updateInventory: (id, data) => apiClient.put(`/pharmacy/inventory/${id}/`, data),
  deleteInventory: (id) => apiClient.delete(`/pharmacy/inventory/${id}/`),
  getLowStock: () => apiClient.get('/pharmacy/low-stock/'),
  listDispensing: async (params) => {
    const response = await apiClient.get(`/pharmacy/dispense/${toQueryParams(params)}`);
    return { ...response, items: unwrapList(response) };
  },
  dispense: (data) => apiClient.post('/pharmacy/dispense/', data),
};

export const usersAdminAPI = {
  list: (params) => apiClient.get(`/users/${toQueryParams(params)}`),
  create: (data) => apiClient.post('/users/', data),
  retrieve: (id) => apiClient.get(`/users/${id}/`),
  update: (id, data) => apiClient.patch(`/users/${id}/`, data),
  toggleActive: (id) => apiClient.post(`/users/${id}/toggle-active/`),
  resetPassword: (id, new_password) => apiClient.post(`/users/${id}/reset-password/`, { new_password }),
  delete: (id) => apiClient.delete(`/users/${id}/`),
};

export const availabilityAPI = {
  list: (params) => apiClient.get(`/availability/${toQueryParams(params)}`),
  create: (data) => apiClient.post('/availability/', data),
  delete: (id) => apiClient.delete(`/availability/${id}/`),
  getSlots: (doctor_id, date) => apiClient.get(`/availability/slots/?doctor_id=${doctor_id}&date=${date}`),
};

export const statsAPI = {
  get: () => apiClient.get('/stats/'),
};
