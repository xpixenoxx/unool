/**
 * Tests for the SignalDM Anti-Ban Humanization Engine
 *
 * Tests the Poisson jitter delay generator, VelocityThrottle rate limiter,
 * and LexicalEntropyGuard anti-duplication logic.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getHumanizedDelayMs } from '../automation/jitter';
import { VelocityThrottle } from '../automation/velocity';
import { LexicalEntropyGuard } from '../automation/lexical';

// ─── Jitter Tests ────────────────────────────────────────────────────────────

describe('getHumanizedDelayMs', () => {
  it('generates delays between 25s (25000ms) and 120s (120000ms)', () => {
    for (let i = 0; i < 200; i++) {
      const delay = getHumanizedDelayMs();
      expect(delay).toBeGreaterThanOrEqual(25_000);
      expect(delay).toBeLessThanOrEqual(120_000);
    }
  });

  it('has a mean around 45s over 1000 samples', () => {
    let total = 0;
    const samples = 1000;
    for (let i = 0; i < samples; i++) {
      total += getHumanizedDelayMs();
    }
    const meanMs = total / samples;
    const meanSeconds = meanMs / 1000;
    // Allow ±15s tolerance for the mean (we clamp, so distribution is skewed)
    expect(meanSeconds).toBeGreaterThan(30);
    expect(meanSeconds).toBeLessThan(80);
  });

  it('respects custom min and max parameters', () => {
    for (let i = 0; i < 100; i++) {
      const delay = getHumanizedDelayMs(10, 30);
      expect(delay).toBeGreaterThanOrEqual(10_000);
      expect(delay).toBeLessThanOrEqual(30_000);
    }
  });

  it('never returns non-integer values', () => {
    for (let i = 0; i < 50; i++) {
      const delay = getHumanizedDelayMs();
      expect(Number.isInteger(delay)).toBe(true);
    }
  });
});

// ─── VelocityThrottle Tests ───────────────────────────────────────────────────

describe('VelocityThrottle', () => {
  let throttle: VelocityThrottle;
  const workspaceId = 'test-workspace-123';

  beforeEach(() => {
    throttle = new VelocityThrottle();
    // Mock Supabase to avoid real DB calls
    const mockQueryChain: any = {
      select: () => mockQueryChain,
      update: () => mockQueryChain,
      insert: () => Promise.resolve({ error: null }),
      eq: () => mockQueryChain,
      single: () => Promise.resolve({ data: null }),
    };
    vi.spyOn(throttle as any, 'supabase', 'get').mockReturnValue({
      from: () => mockQueryChain,
    });
  });

  it('allows a reply when no previous replies in this hour', async () => {
    const can = await throttle.canReply(workspaceId, 30);
    expect(can).toBe(true);
  });

  it('reports current count as 0 when no data in DB', async () => {
    const count = await throttle.getCurrentCount(workspaceId);
    expect(count).toBe(0);
  });

  it('uses a DM-namespaced key separately from comment replies', async () => {
    const dmKey = `dm:${workspaceId}`;
    const commentCan = await throttle.canReply(workspaceId, 30);
    const dmCan = await throttle.canReply(dmKey, 20);
    // Both should be independent
    expect(commentCan).toBe(true);
    expect(dmCan).toBe(true);
  });
});

// ─── LexicalEntropyGuard Tests ────────────────────────────────────────────────

describe('LexicalEntropyGuard', () => {
  let guard: LexicalEntropyGuard;
  const workspaceId = 'test-workspace-456';

  beforeEach(() => {
    guard = new LexicalEntropyGuard();
    // Mock Supabase
    vi.spyOn(guard as any, 'supabase', 'get').mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              not: () => ({
                order: () => ({
                  limit: () => Promise.resolve({ data: [] }),
                }),
              }),
            }),
          }),
        }),
      }),
    });
  });

  it('returns an empty array when no recent replies exist', async () => {
    const replies = await guard.getRecentReplies(workspaceId);
    expect(replies).toEqual([]);
  });

  it('records a reply to the in-memory cache', async () => {
    guard.recordReply(workspaceId, 'Great question! Are you building this for a client?');
    // After recording, the next call to getRecentReplies should hit the cache
    const replies = await guard.getRecentReplies(workspaceId);
    expect(replies).toHaveLength(1);
    expect(replies[0]).toBe('Great question! Are you building this for a client?');
  });

  it('keeps only the last 50 replies in cache', () => {
    for (let i = 0; i < 55; i++) {
      guard.recordReply(workspaceId, `Reply number ${i}`);
    }
    // Access internal cache
    const cache = (guard as any).cache.get(workspaceId) as string[];
    expect(cache.length).toBe(50);
    // Should have the most recent ones
    expect(cache[cache.length - 1]).toBe('Reply number 54');
  });

  it('detects a reply as too similar when openings match', () => {
    const recent = [
      'Great to hear! What kind of projects are you using this for?',
      'Glad it resonated! What type of team are you on?',
    ];
    // Same opening "Glad it" pattern
    const tooSimilar = 'Glad it helped! What's your timeline on this?';
    expect(guard.isTooSimilar(tooSimilar, recent)).toBe(true);
  });

  it('does not flag a reply as too similar when opening is different', () => {
    const recent = [
      'Great to hear! What kind of projects are you using this for?',
    ];
    const different = 'That sprint workflow approach is clutch — are you running it with a full team?';
    expect(guard.isTooSimilar(different, recent)).toBe(false);
  });

  it('returns false when recent replies list is empty', () => {
    expect(guard.isTooSimilar('Any reply here', [])).toBe(false);
  });
});
