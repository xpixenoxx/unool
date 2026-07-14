'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface SyncEvent<T = unknown> {
  type: string;
  data: T;
  traceId?: string;
  timestamp: string;
}

interface SyncPayload {
  traceId?: string;
  timestamp: string;
  payload: unknown;
}

interface UseSyncOptions {
  workspaceId?: string;
  profileId?: string;
  onProfileUpdate?: (data: unknown) => void;
  onPostUpdate?: (data: unknown) => void;
  onVariantUpdate?: (data: unknown) => void;
  onEngagementUpdate?: (data: unknown) => void;
  enabled?: boolean;
}

export function useSync({
  workspaceId,
  profileId,
  onProfileUpdate,
  onPostUpdate,
  onVariantUpdate,
  onEngagementUpdate,
  enabled = true,
}: UseSyncOptions) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SyncEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    if (!enabled || (!workspaceId && !profileId)) {
      return;
    }

    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const params = new URLSearchParams();
    if (workspaceId) params.set('workspaceId', workspaceId);
    if (profileId) params.set('profileId', profileId);
    params.set('events', 'profile,posts,variants,engagement');

    const url = `/api/sync?${params.toString()}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
    };

    es.onerror = () => {
      setConnected(false);
      setError('Connection lost. Reconnecting...');

      // Exponential backoff
      const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000);
      reconnectAttempts.current += 1;

      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    // Handle specific event types
    // SSE sends { traceId, timestamp, payload } directly, so use data.payload
    es.addEventListener('profile:updated', (event) => {
      const data = JSON.parse(event.data) as SyncPayload;
      setLastEvent({ type: 'profile:updated', data, traceId: data.traceId, timestamp: data.timestamp });
      onProfileUpdate?.(data.payload);
    });

    es.addEventListener('post:updated', (event) => {
      const data = JSON.parse(event.data) as SyncPayload;
      setLastEvent({ type: 'post:updated', data, traceId: data.traceId, timestamp: data.timestamp });
      onPostUpdate?.(data.payload);
    });

    es.addEventListener('variant:updated', (event) => {
      const data = JSON.parse(event.data) as SyncPayload;
      setLastEvent({ type: 'variant:updated', data, traceId: data.traceId, timestamp: data.timestamp });
      onVariantUpdate?.(data.payload);
    });

    es.addEventListener('engagement:updated', (event) => {
      const data = JSON.parse(event.data) as SyncPayload;
      setLastEvent({ type: 'engagement:updated', data, traceId: data.traceId, timestamp: data.timestamp });
      onEngagementUpdate?.(data.payload);
    });

    es.addEventListener('heartbeat', (event) => {
      const data = JSON.parse(event.data);
      setLastEvent({ type: 'heartbeat', data, timestamp: data.timestamp });
    });

    es.addEventListener('connected', (event) => {
      const data = JSON.parse(event.data);
      setLastEvent({ type: 'connected', data, timestamp: data.timestamp });
    });
  }, [enabled, workspaceId, profileId, onProfileUpdate, onPostUpdate, onVariantUpdate, onEngagementUpdate]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    setConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    connected,
    lastEvent,
    error,
    reconnect: connect,
    disconnect,
  };
}

// Hook for triggering sync updates
export function useSyncTrigger() {
  const triggerUpdate = useCallback(async (type: string, payload: unknown, workspaceId: string) => {
    try {
      await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload, workspaceId }),
      });
    } catch (error) {
      console.error('Failed to trigger sync:', error);
    }
  }, []);

  return { triggerUpdate };
}