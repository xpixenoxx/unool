/**
 * Fast in-memory cache for dashboard overview data.
 * Speeds up route transitions (e.g. Overview <-> Studio) while allowing
 * instant invalidation when connections or posts change.
 */

const overviewMemoryCache = new Map<string, { data: any; expiry: number }>();

export function getOverviewCache<T = any>(workspaceId: string): T | null {
  const cached = overviewMemoryCache.get(workspaceId);
  if (cached && Date.now() < cached.expiry) {
    return cached.data as T;
  }
  return null;
}

export function setOverviewCache<T = any>(workspaceId: string, data: T, ttlMs: number = 15_000): void {
  overviewMemoryCache.set(workspaceId, { data, expiry: Date.now() + ttlMs });
}

export function invalidateOverviewCache(workspaceId?: string): void {
  if (workspaceId) {
    overviewMemoryCache.delete(workspaceId);
  } else {
    overviewMemoryCache.clear();
  }
}

