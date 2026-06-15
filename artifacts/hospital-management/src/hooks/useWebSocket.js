import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '../store/authStore.js';

const WS_BASE = typeof window !== 'undefined'
  ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
  : 'ws://localhost/ws';

const listeners = new Map();
let globalWS = null;
let reconnectTimer = null;
let isConnecting = false;

function getToken() {
  return useAuthStore.getState().token;
}

function notifyListeners(event, data) {
  const eventListeners = listeners.get(event) || new Set();
  const wildcardListeners = listeners.get('*') || new Set();
  for (const cb of [...eventListeners, ...wildcardListeners]) {
    try { cb(data, event); } catch {}
  }
}

function connect() {
  if (isConnecting || (globalWS && globalWS.readyState === WebSocket.OPEN)) return;
  const token = getToken();
  if (!token) return;

  isConnecting = true;
  try {
    const ws = new WebSocket(`${WS_BASE}?token=${encodeURIComponent(token)}`);

    ws.onopen = () => {
      isConnecting = false;
      globalWS = ws;
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    };

    ws.onmessage = (event) => {
      try {
        const { event: evtName, data } = JSON.parse(event.data);
        notifyListeners(evtName, data);
      } catch {}
    };

    ws.onclose = () => {
      isConnecting = false;
      globalWS = null;
      // Reconnect after 3s
      reconnectTimer = setTimeout(() => { if (getToken()) connect(); }, 3000);
    };

    ws.onerror = () => {
      isConnecting = false;
      ws.close();
    };
  } catch {
    isConnecting = false;
  }
}

export function useWebSocket(eventHandlers = {}) {
  const token = useAuthStore((state) => state.token);
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  useEffect(() => {
    if (!token) return;
    connect();

    const registeredEvents = Object.keys(handlersRef.current);
    const cleanups = registeredEvents.map((event) => {
      const cb = (data, evtName) => handlersRef.current[evtName]?.(data);
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(cb);
      return () => listeners.get(event)?.delete(cb);
    });

    return () => { cleanups.forEach((fn) => fn()); };
  }, [token]);

  const disconnect = useCallback(() => {
    if (globalWS) { globalWS.close(); globalWS = null; }
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  }, []);

  return { connected: globalWS?.readyState === WebSocket.OPEN, disconnect };
}

export function useWsEvent(event, callback) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const cb = (data) => cbRef.current(data);
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(cb);
    return () => listeners.get(event)?.delete(cb);
  }, [event]);
}
