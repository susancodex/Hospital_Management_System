import { create } from 'zustand';
import { authAPI } from '../api/services.js';

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create((set, get) => ({
  user: null,
  loading: false,
  hydrated: false,
  isAuthenticated: false,

  hydrate: async () => {
    const token = localStorage.getItem('access_token');
    const stored = getStoredUser();
    if (!token) {
      set({ user: null, isAuthenticated: false, hydrated: true });
      return;
    }
    set({ user: stored, isAuthenticated: true });
    try {
      const profile = await authAPI.getProfile();
      localStorage.setItem('user', JSON.stringify(profile.data));
      set({ user: profile.data, isAuthenticated: true, hydrated: true });
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
      get().logout(false);
      set({ hydrated: true });
    }
  },

  login: async (username, password) => {
    set({ loading: true });
    try {
      const response = await authAPI.login(username, password);
      const { access, refresh, user } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true, loading: false, hydrated: true });
      return { ok: true };
    } catch (error) {
      set({ loading: false, hydrated: true });
      return {
        ok: false,
        message: error.response?.data?.detail || 'Unable to login with provided credentials.',
      };
    }
  },

  register: async (payload) => {
    set({ loading: true });
    try {
      const response = await authAPI.register(payload);
      const { access, refresh, user } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true, loading: false, hydrated: true });
      return { ok: true };
    } catch (error) {
      console.error('Register error:', error.response?.data || error);
      set({ loading: false, hydrated: true });
      const apiError = error.response?.data;
      let message = 'Registration failed.';
      
      if (apiError?.detail) {
        message = apiError.detail;
      } else if (apiError && typeof apiError === 'object') {
        const errors = [];
        for (const [field, msg] of Object.entries(apiError)) {
          errors.push(`${field}: ${Array.isArray(msg) ? msg[0] : msg}`);
        }
        message = errors.join(' | ');
      }
      
      return { ok: false, message };
    }
  },

  forgotPassword: async (payload) => {
    try {
      await authAPI.forgotPassword(payload);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message: error.response?.data?.detail || 'Password reset failed.',
      };
    }
  },

  refreshProfile: async () => {
    try {
      const response = await authAPI.getProfile();
      localStorage.setItem('user', JSON.stringify(response.data));
      set({ user: response.data, isAuthenticated: true });
      return response.data;
    } catch {
      return null;
    }
  },

  logout: (clearStorage = true) => {
    if (clearStorage) authAPI.logout();
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, hydrated: true });
  },
}));
