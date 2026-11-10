import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getOverviewCache,
  setOverviewCache,
  invalidateOverviewCache,
} from '../overviewCache';

describe('overviewCache', () => {
  const ws1 = 'ws-test-111';
  const ws2 = 'ws-test-222';

  beforeEach(() => {
    invalidateOverviewCache();
  });

  it('returns null when cache is empty', () => {
    expect(getOverviewCache(ws1)).toBeNull();
  });

  it('stores and retrieves cached data before expiry', () => {
    const dummyData = { connections: { instagram: { status: 'connected' } } };
    setOverviewCache(ws1, dummyData, 10_000);

    expect(getOverviewCache(ws1)).toEqual(dummyData);
  });

  it('returns null when cache item has expired', () => {
    const dummyData = { connections: {} };
    setOverviewCache(ws1, dummyData, -1000); // already expired

    expect(getOverviewCache(ws1)).toBeNull();
  });

  it('invalidates cache for a specific workspace without affecting others', () => {
    const data1 = { workspace: 1 };
    const data2 = { workspace: 2 };
    setOverviewCache(ws1, data1, 10_000);
    setOverviewCache(ws2, data2, 10_000);

    invalidateOverviewCache(ws1);

    expect(getOverviewCache(ws1)).toBeNull();
    expect(getOverviewCache(ws2)).toEqual(data2);
  });

  it('invalidates all cache entries when called with no arguments', () => {
    setOverviewCache(ws1, { a: 1 }, 10_000);
    setOverviewCache(ws2, { b: 2 }, 10_000);

    invalidateOverviewCache();

    expect(getOverviewCache(ws1)).toBeNull();
    expect(getOverviewCache(ws2)).toBeNull();
  });
});

