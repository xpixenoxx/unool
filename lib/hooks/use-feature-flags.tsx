'use client';

import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';

interface FeatureFlags {
  automationEnabled: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  automationEnabled: true, // safe default: always show until we know otherwise
};

// In-memory cache shared across hook instances within the same page
let memCache: FeatureFlags | null = null;
let memCacheTime = 0;
const CACHE_TTL_MS = 30_000;

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface FeatureFlagsContextValue {
  flags: FeatureFlags;
  loading: boolean;
  refetch: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  flags: DEFAULT_FLAGS,
  loading: false,
  refetch: async () => {},
});

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>(memCache ?? DEFAULT_FLAGS);
  const [loading, setLoading] = useState(!memCache);

  const fetchFlags = useCallback(async () => {
    const now = Date.now();
    if (memCache && now - memCacheTime < CACHE_TTL_MS) {
      setFlags(memCache);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/feature-flags', { credentials: 'include' });
      if (res.ok) {
        const raw = await res.json();
        const parsed: FeatureFlags = {
          automationEnabled: raw['automation_enabled'] !== false, // treat missing as true
        };
        memCache = parsed;
        memCacheTime = now;
        setFlags(parsed);
      }
    } catch (err) {
      console.warn('[useFeatureFlags] Could not fetch flags, using defaults', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading, refetch: fetchFlags }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFeatureFlags(): FeatureFlagsContextValue {
  return useContext(FeatureFlagsContext);
}

// ---------------------------------------------------------------------------
// Standalone fetch (for server components / outside provider)
// ---------------------------------------------------------------------------

export async function fetchFeatureFlags(): Promise<FeatureFlags> {
  const now = Date.now();
  if (memCache && now - memCacheTime < CACHE_TTL_MS) {
    return memCache;
  }
  try {
    const res = await fetch('/api/feature-flags', { cache: 'no-store' });
    if (res.ok) {
      const raw = await res.json();
      const parsed: FeatureFlags = {
        automationEnabled: raw['automation_enabled'] !== false,
      };
      memCache = parsed;
      memCacheTime = now;
      return parsed;
    }
  } catch {
    // Fall through to default
  }
  return DEFAULT_FLAGS;
}

