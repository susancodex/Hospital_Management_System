import { useAuthStore } from '../store/authStore.js';

export const useAuth = () => {
  return useAuthStore();
};
