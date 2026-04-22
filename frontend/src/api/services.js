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
  login: (username, password) =>
    postWithFallback('/token/', null, { username, password }),

  register: (data) => postWithFallback('/register/', null, data),

  refreshToken: (refresh) =>
    apiClient.post('/token/refresh/', { refresh }),

  forgotPassword: (data) => apiClient.post('/forgot-password/', data),

  changePassword: (data) => apiClient.post('/change-password/', data),

  getProfile: () => getWithFallback('/profile/', null),

  me: () => apiClient.get('/users/me/'),

  updateProfile: (formData) =>
    patchWithFallback('/profile/', null, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

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
};
