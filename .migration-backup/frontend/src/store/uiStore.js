import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  search: '',

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  openMobileSidebar: () => set({ mobileSidebarOpen: true }),
  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
  setSearch: (search) => set({ search }),
}));
