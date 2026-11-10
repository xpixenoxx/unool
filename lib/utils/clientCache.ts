/**
 * Client-side identity-scoped memory cache registry.
 * Ensures module-level SWR caches in dashboard views are wiped immediately
 * upon sign-out, 401 session expiration, or account/workspace switching.
 */

type CacheResetCallback = () => void;

const resetCallbacks = new Set<CacheResetCallback>();
let activeScopeKey: string | null = null;

export function registerClientCacheReset(callback: CacheResetCallback): () => void {
  resetCallbacks.add(callback);
  return () => {
    resetCallbacks.delete(callback);
  };
}

export function clearAllClientCaches(): void {
  activeScopeKey = null;
  for (const cb of resetCallbacks) {
    try {
      cb();
    } catch {
      // Ignore individual callback errors
    }
  }
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('unool_active_checkout');
    } catch {
      // Ignore storage access errors
    }
  }
}

export function syncClientCacheScope(userId?: string | null, workspaceId?: string | null): void {
  const nextScope = userId ? `${userId}:${workspaceId || ''}` : null;
  if (activeScopeKey !== null && activeScopeKey !== nextScope) {
    clearAllClientCaches();
  }
  activeScopeKey = nextScope;
}

