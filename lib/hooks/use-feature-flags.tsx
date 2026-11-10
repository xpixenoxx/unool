'use client';

import { useState, useEffect, createContext, useContext, useCallback, ReactNode } from 'react';

interface FeatureFlags {
  automationEnabled: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  automationEnabled: true,
};

let memCache: FeatureFlags | null = null;
let memCacheTime = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds cache with immediate CustomEvent/storage invalidation

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
  const [flags, setFlags] = useState<FeatureFlags>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('unool_automation_enabled');
      if (stored === 'false') return { automationEnabled: false };
      if (stored === 'true') return { automationEnabled: true };
    }
    return memCache ?? DEFAULT_FLAGS;
  });
  const [loading, setLoading] = useState(!memCache);

  const fetchFlags = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && memCache && now - memCacheTime < CACHE_TTL_MS) {
      setFlags(memCache);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/feature-flags', {
        cache: 'no-store',
        credentials: 'include',
      });
      if (res.ok) {
        const raw = await res.json();
        const parsed: FeatureFlags = {
          automationEnabled: raw['automation_enabled'] !== false,
        };
        memCache = parsed;
        memCacheTime = now;
        setFlags(parsed);
        if (typeof window !== 'undefined') {
          localStorage.setItem('unool_automation_enabled', String(parsed.automationEnabled));
        }
      }
    } catch (err) {
      console.warn('[useFeatureFlags] Could not fetch flags, using defaults', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();

    const handleUpdate = (e?: Event) => {
      if (e instanceof CustomEvent && e.detail && typeof e.detail.automation_enabled === 'boolean') {
        const directFlag: FeatureFlags = { automationEnabled: e.detail.automation_enabled };
        memCache = directFlag;
        memCacheTime = Date.now();
        setFlags(directFlag);
        if (typeof window !== 'undefined') {
          localStorage.setItem('unool_automation_enabled', String(directFlag.automationEnabled));
        }
      }
      fetchFlags(true);
    };

    const handleFocus = () => {
      fetchFlags(false);
    };

    window.addEventListener('unool-feature-flags-updated', handleUpdate);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('unool-feature-flags-updated', handleUpdate);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [fetchFlags]);

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading, refetch: () => fetchFlags(true) }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlagsContextValue {
  return useContext(FeatureFlagsContext);
}

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
    // fallback
  }
  return DEFAULT_FLAGS;
}
