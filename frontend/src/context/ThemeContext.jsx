import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onMediaChange = (event) => {
      const saved = localStorage.getItem('theme');
      if (!saved) setIsDark(event.matches);
    };
    const onStorageChange = (event) => {
      if (event.key === 'theme' && event.newValue) {
        setIsDark(event.newValue === 'dark');
      }
    };
    media.addEventListener('change', onMediaChange);
    window.addEventListener('storage', onStorageChange);
    return () => {
      media.removeEventListener('change', onMediaChange);
      window.removeEventListener('storage', onStorageChange);
    };
  }, []);

  const setTheme = (theme) => setIsDark(theme === 'dark');
  const toggleTheme = () => setIsDark((current) => !current);
  const value = useMemo(() => ({ isDark, setTheme, toggleTheme }), [isDark]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
