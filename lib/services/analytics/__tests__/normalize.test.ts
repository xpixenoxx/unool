import { describe, it, expect } from 'vitest';
import { extractNormalizedEngagement } from '../normalize';

describe('Universal Social Engagement Normalizer', () => {
  it('returns default zeroed engagement for null, undefined, or empty input', () => {
    expect(extractNormalizedEngagement(null)).toEqual({
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      totalInteractions: 0,
      engagementRate: 0,
      hasRealData: false,
    });

    expect(extractNormalizedEngagement(undefined)).toEqual({
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      totalInteractions: 0,
      engagementRate: 0,
      hasRealData: false,
    });

    expect(extractNormalizedEngagement({})).toEqual({
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      totalInteractions: 0,
      engagementRate: 0,
      hasRealData: false,
    });
  });

  it('normalizes Threads engagement metrics accurately', () => {
    const rawThreadsData = {
      likes: 42,
      replies: 8,
      comments: 8,
      reposts: 5,
      quotes: 3,
      shares: 8,
      views: 500,
      syncedAt: '2026-11-07T10:00:00.000Z',
    };

    const normalized = extractNormalizedEngagement(rawThreadsData);

    expect(normalized.likes).toBe(42);
    expect(normalized.comments).toBe(8);
    expect(normalized.shares).toBe(8);
    expect(normalized.views).toBe(500);
    expect(normalized.totalInteractions).toBe(58); // 42 + 8 + 8
    expect(normalized.engagementRate).toBe(11.6); // (58 / 500) * 100 = 11.6%
    expect(normalized.hasRealData).toBe(true);
    expect(normalized.syncedAt).toBe('2026-11-07T10:00:00.000Z');
  });

  it('sums distinct reposts and quotes accurately when explicit shares is 0 or absent', () => {
    const rawWithZeroShares = {
      likes: 10,
      replies: 2,
      shares: 0,
      reposts: 4,
      quotes: 2,
      views: 200,
    };

    const normalizedZeroShares = extractNormalizedEngagement(rawWithZeroShares);
    expect(normalizedZeroShares.shares).toBe(6); // 4 reposts + 2 quotes
    expect(normalizedZeroShares.totalInteractions).toBe(18); // 10 + 2 + 6

    const rawWithoutShares = {
      likes: 5,
      replies: 1,
      reposts: 3,
      quotes: 2,
    };

    const normalizedNoShares = extractNormalizedEngagement(rawWithoutShares);
    expect(normalizedNoShares.shares).toBe(5); // 3 + 2
    expect(normalizedNoShares.totalInteractions).toBe(11); // 5 + 1 + 5
  });

  it('sets hasRealData=true when views exist even if interactions are zero', () => {
    const rawOnlyViews = {
      likes: 0,
      comments: 0,
      shares: 0,
      views: 120,
    };

    const normalized = extractNormalizedEngagement(rawOnlyViews);
    expect(normalized.views).toBe(120);
    expect(normalized.totalInteractions).toBe(0);
    expect(normalized.hasRealData).toBe(true);
  });

  it('sets hasRealData=false when all counts are 0 even with syncedAt', () => {
    const rawZeroSynced = {
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      syncedAt: '2026-11-07T10:00:00.000Z',
    };

    const normalized = extractNormalizedEngagement(rawZeroSynced);
    expect(normalized.hasRealData).toBe(false);
  });

  it('supports reach, plays, and pageViews under views', () => {
    expect(extractNormalizedEngagement({ reach: 350 }).views).toBe(350);
    expect(extractNormalizedEngagement({ plays: 480 }).views).toBe(480);
    expect(extractNormalizedEngagement({ pageViews: 1200 }).views).toBe(1200);
  });
});
