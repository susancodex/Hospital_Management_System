import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '../../store/authStore.js';
import { authAPI } from '../../api/services.js';

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const FALLBACK_GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const loadGoogleScript = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve(window.google);
      return;
    }

    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google), { once: true });
      existing.addEventListener('error', () => reject(new Error('Unable to load Google Identity Services.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Unable to load Google Identity Services.'));
    document.head.appendChild(script);
  });

export default function GoogleSignInButton({ onSuccess }) {
  const buttonRef = useRef(null);
  const googleLogin = useAuthStore((state) => state.googleLogin);
  const loading = useAuthStore((state) => state.loading);
  const [googleClientId, setGoogleClientId] = useState('');
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    authAPI.getAuthConfig()
      .then(({ data }) => {
        if (!isMounted) return;
        setGoogleClientId(data.google_client_id || FALLBACK_GOOGLE_CLIENT_ID);
      })
      .catch(() => {
        if (!isMounted) return;
        setGoogleClientId(FALLBACK_GOOGLE_CLIENT_ID);
      })
      .finally(() => {
        if (isMounted) setConfigLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!googleClientId || !buttonRef.current) return;

    let isMounted = true;

    loadGoogleScript()
      .then((google) => {
        if (!isMounted || !google?.accounts?.id || !buttonRef.current) return;

        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async ({ credential }) => {
            if (!credential) {
              toast.error('Google did not return a valid credential.');
              return;
            }

            const result = await googleLogin(credential);
            if (result.ok) {
              onSuccess?.();
              return;
            }

            toast.error(result.message);
          },
        });

        buttonRef.current.innerHTML = '';
        google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 320,
        });
      })
      .catch((error) => {
        toast.error(error.message || 'Google sign-in is temporarily unavailable.');
      });

    return () => {
      isMounted = false;
    };
  }, [googleClientId, googleLogin, onSuccess]);

  if (!configLoaded) {
    return (
      <div className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 animate-pulse" />
    );
  }

  if (!googleClientId) {
    return (
      <button
        type="button"
        disabled
        className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 text-sm font-medium cursor-not-allowed"
        title="Set GOOGLE_OAUTH_CLIENT_ID (or GOOGLE_CLIENT_ID) on the backend to enable Google sign-in."
      >
        Google sign-in not configured
      </button>
    );
  }

  return (
    <div className={loading ? 'pointer-events-none opacity-80' : ''}>
      <div ref={buttonRef} className="flex justify-center" />
    </div>
  );
}
