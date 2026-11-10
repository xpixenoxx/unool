import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/admin', async () => {
  const { fakeSupabase } = await import('./fakePostsDb');
  return { supabaseAdmin: fakeSupabase };
});

import { SupabasePostRepository } from '../SupabasePostRepository';
import { fakePostsDb, resetFakePostsDb, postRow } from './fakePostsDb';

describe('SupabasePostRepository.claimForPublishing (BUG-026 compare-and-set)', () => {
  const repo = new SupabasePostRepository();

  beforeEach(() => {
    resetFakePostsDb([postRow()]);
  });

  it('first claim wins and second concurrent claim loses', async () => {
    const [a, b] = await Promise.all([
      repo.claimForPublishing('post-1'),
      repo.claimForPublishing('post-1'),
    ]);
    const winners = [a, b].filter(Boolean);
    expect(winners).toHaveLength(1);
    expect(winners[0]!.status).toBe('publishing');
    expect(fakePostsDb.rows[0].status).toBe('publishing');
  });

  it('returns null (does not throw) when the post is no longer scheduled', async () => {
    resetFakePostsDb([postRow({ status: 'published' })]);
    await expect(repo.claimForPublishing('post-1')).resolves.toBeNull();
    expect(fakePostsDb.rows[0].status).toBe('published');
  });

  it('returns null for an unknown id', async () => {
    await expect(repo.claimForPublishing('nope')).resolves.toBeNull();
  });

  it('recovers a stale publishing post exactly once', async () => {
    const stale = new Date(Date.now() - 10 * 60_000).toISOString();
    resetFakePostsDb([postRow({ status: 'publishing', updated_at: stale })]);
    const threshold = new Date(Date.now() - 5 * 60_000);
    const [a, b] = await Promise.all([
      repo.claimForPublishing('post-1', 'publishing', threshold),
      repo.claimForPublishing('post-1', 'publishing', threshold),
    ]);
    expect([a, b].filter(Boolean)).toHaveLength(1);
  });

  it('does not steal a fresh (actively publishing) post', async () => {
    resetFakePostsDb([postRow({ status: 'publishing', updated_at: new Date().toISOString() })]);
    const threshold = new Date(Date.now() - 5 * 60_000);
    await expect(repo.claimForPublishing('post-1', 'publishing', threshold)).resolves.toBeNull();
  });
});
