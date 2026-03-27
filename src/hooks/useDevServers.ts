'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DevServer } from '@/types/dev-server';

const LOCAL_SCANNER_URL = 'http://localhost:9111';

function getBaseUrl() {
  if (typeof window === 'undefined') return '';
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  // In production, talk to the local scanner; locally, use the Next.js API routes
  return isLocal ? '' : LOCAL_SCANNER_URL;
}

function apiUrl(path: string) {
  const base = getBaseUrl();
  // Local: /api/admin/dev-servers, Production: http://localhost:9111/api/dev-servers
  return base ? `${base}/api/dev-servers${path}` : `/api/admin/dev-servers${path}`;
}

interface DevServersState {
  servers: DevServer[];
  loading: boolean;
  error: string | null;
  scannerConnected: boolean;
}

export function useDevServers(pollInterval = 5000) {
  const [state, setState] = useState<DevServersState>({
    servers: [],
    loading: true,
    error: null,
    scannerConnected: true,
  });
  const pauseRef = useRef(false);

  const fetchServers = useCallback(async () => {
    if (pauseRef.current) return;

    try {
      const res = await fetch(apiUrl(''));
      const data = await res.json();
      if (data.success) {
        setState({ servers: data.servers, loading: false, error: null, scannerConnected: true });
      } else {
        setState((prev) => ({ ...prev, loading: false, error: data.error, scannerConnected: true }));
      }
    } catch (err) {
      const base = getBaseUrl();
      if (base) {
        // Production mode — scanner not running
        setState((prev) => ({
          ...prev,
          loading: false,
          error: null,
          scannerConnected: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          scannerConnected: true,
          error: err instanceof Error ? err.message : 'Failed to fetch servers',
        }));
      }
    }
  }, []);

  const pausePolling = useCallback(() => {
    pauseRef.current = true;
  }, []);

  const resumePolling = useCallback(() => {
    pauseRef.current = false;
  }, []);

  const stopServer = useCallback(async (pid: number, port: number) => {
    try {
      const res = await fetch(apiUrl('/stop'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid, port }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchServers();
      }
      return data;
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to stop server' };
    }
  }, [fetchServers]);

  const startServer = useCallback(async (name: string, cwd: string, script: string, port: number) => {
    try {
      const res = await fetch(apiUrl('/start'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, cwd, script, port }),
      });
      const data = await res.json();
      if (data.success) {
        // Give the server a moment to start before refreshing
        setTimeout(fetchServers, 2000);
      }
      return data;
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to start server' };
    }
  }, [fetchServers]);

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, pollInterval);
    return () => clearInterval(interval);
  }, [fetchServers, pollInterval]);

  return {
    ...state,
    stopServer,
    startServer,
    pausePolling,
    resumePolling,
    refresh: fetchServers,
    isRemote: getBaseUrl() !== '',
  };
}

export default useDevServers;
