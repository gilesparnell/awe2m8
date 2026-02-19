'use client';

import { useEffect, useRef, useCallback } from 'react';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export function useHeartbeat(agentId: string | null) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendHeartbeat = useCallback(async () => {
    if (!agentId) return;

    try {
      const response = await fetch('/api/agents/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId }),
      });

      if (!response.ok) {
        console.warn('Heartbeat failed:', response.status);
      }
    } catch (error) {
      console.warn('Heartbeat error:', error);
    }
  }, [agentId]);

  useEffect(() => {
    if (!agentId) return;

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [agentId, sendHeartbeat]);

  return { sendHeartbeat };
}
