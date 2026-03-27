'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DevServer } from '@/types/dev-server';

interface DevServersState {
  servers: DevServer[];
  loading: boolean;
  error: string | null;
}

export function useDevServers(pollInterval = 5000) {
  const [state, setState] = useState<DevServersState>({
    servers: [],
    loading: true,
    error: null,
  });
  const pauseRef = useRef(false);

  const fetchServers = useCallback(async () => {
    if (pauseRef.current) return;

    try {
      const res = await fetch('/api/admin/dev-servers');
      const data = await res.json();
      if (data.success) {
        setState({ servers: data.servers, loading: false, error: null });
      } else {
        setState((prev) => ({ ...prev, loading: false, error: data.error }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch servers',
      }));
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
      const res = await fetch('/api/admin/dev-servers/stop', {
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
      const res = await fetch('/api/admin/dev-servers/start', {
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
  };
}

export default useDevServers;
