import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * Create axios instance with default configuration
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - adds auth token
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor - handles common errors
 */
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      toast.error('Session expired. Please log in again.');
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    }

    if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

/**
 * Wrapper function for API calls with consistent error handling
 */
export const apiCall = async (endpoint, method = 'GET', data = null, config = {}) => {
  try {
    const response = await apiClient({
      url: endpoint,
      method,
      data,
      ...config,
    });
    return { ok: true, data: response };
  } catch (error) {
    const message = error.response?.data?.detail || error.message || 'An error occurred';
    return {
      ok: false,
      error: message,
      status: error.response?.status,
      data: error.response?.data,
    };
  }
};

export default apiClient;
