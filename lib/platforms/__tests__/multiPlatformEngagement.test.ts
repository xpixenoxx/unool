import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { blueskyAdapter } from '../BlueskyAdapter';
import { facebookAdapter } from '../FacebookAdapter';
import { linkedInAdapter } from '../LinkedInAdapter';
import { xAdapter } from '../XAdapter';

describe('Multi-Platform Engagement Normalization & Adapters', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('BlueskyAdapter - getEngagement', () => {
    it('fetches real engagement from public AppView for AT URI', async () => {
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('app.bsky.feed.getPosts')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              posts: [
                {
                  uri: 'at://did:plc:123/app.bsky.feed.post/456',
                  likeCount: 42,
                  replyCount: 8,
                  repostCount: 5,
                  quoteCount: 2,
                },
              ],
            }),
          } as unknown as Response;
        }
        return { ok: false, status: 404 } as unknown as Response;
      });

      const res = await blueskyAdapter.getEngagement(
        JSON.stringify({ handle: 'test.bsky.social', appPassword: 'pass' }),
        'at://did:plc:123/app.bsky.feed.post/456'
      );

      expect(res.likes).toBe(42);
      expect(res.comments).toBe(8);
      expect(res.shares).toBe(7); // 5 reposts + 2 quotes
      expect(res.hasRealData).toBe(true);
      expect(res.views).toBe(0); // AT Protocol does not have views
    });

    it('returns empty object when post is not found or API fails', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      } as unknown as Response);

      const res = await blueskyAdapter.getEngagement('', 'at://did:plc:123/app.bsky.feed.post/unknown');
      expect(res).toEqual({});
    });
  });

  describe('FacebookAdapter - getEngagement', () => {
    it('extracts reactions, comments, and shares even when insights API metric fails', async () => {
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('fields=shares,reactions.summary')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              reactions: { summary: { total_count: 28 } },
              comments: { summary: { total_count: 5 } },
              shares: { count: 3 },
            }),
            headers: new Headers(),
          } as unknown as Response;
        }
        if (url.includes('/insights')) {
          // Insights fail (e.g. #100 unsupported metric on standard post)
          return {
            ok: false,
            status: 400,
            text: async () => 'Param metric error',
            headers: new Headers(),
          } as unknown as Response;
        }
        return { ok: false, status: 404, headers: new Headers() } as unknown as Response;
      });

      const res = await facebookAdapter.getEngagement('token_xyz', 'page_123_456');

      expect(res.likes).toBe(28);
      expect(res.comments).toBe(5);
      expect(res.shares).toBe(3);
      expect(res.hasRealData).toBe(true);
    });

    it('merges impressions when insights API succeeds', async () => {
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('fields=shares,reactions.summary')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              reactions: { summary: { total_count: 14 } },
              comments: { summary: { total_count: 2 } },
              shares: { count: 1 },
            }),
            headers: new Headers(),
          } as unknown as Response;
        }
        if (url.includes('/insights')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              data: [
                { name: 'post_impressions', values: [{ value: 350 }] },
                { name: 'post_engaged_users', values: [{ value: 45 }] },
              ],
            }),
            headers: new Headers(),
          } as unknown as Response;
        }
        return { ok: false, status: 404, headers: new Headers() } as unknown as Response;
      });

      const res = await facebookAdapter.getEngagement('token_xyz', 'page_123_456');

      expect(res.likes).toBe(14);
      expect(res.comments).toBe(2);
      expect(res.shares).toBe(1);
      expect(res.views).toBe(350);
      expect(res.impressions).toBe(350);
      expect(res.hasRealData).toBe(true);
    });

    it('uses post_media_view and post_total_media_view_unique even when legacy metrics fail with #100', async () => {
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('fields=shares,reactions.summary')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              reactions: { summary: { total_count: 2 } },
              comments: { summary: { total_count: 0 } },
              shares: { count: 0 },
            }),
            headers: new Headers(),
          } as unknown as Response;
        }
        if (url.includes('metric=post_media_view')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              data: [{ name: 'post_media_view', values: [{ value: 420 }] }],
            }),
            headers: new Headers(),
          } as unknown as Response;
        }
        if (url.includes('metric=post_total_media_view_unique')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              data: [{ name: 'post_total_media_view_unique', values: [{ value: 310 }] }],
            }),
            headers: new Headers(),
          } as unknown as Response;
        }
        if (url.includes('/insights')) {
          return {
            ok: false,
            status: 400,
            text: async () => '{"error":{"message":"(#100) The value must be a valid insights metric","code":100}}',
            headers: new Headers(),
          } as unknown as Response;
        }
        return { ok: false, status: 404, headers: new Headers() } as unknown as Response;
      });

      const res = await facebookAdapter.getEngagement('token_xyz', 'page_123_456');

      expect(res.likes).toBe(2);
      expect(res.views).toBe(420);
      expect(res.impressions).toBe(420);
      expect(res.reach).toBe(310);
      expect(res.hasRealData).toBe(true);
    });

    it('falls back to post_total_media_view_unique when post_media_view is zero and resolves numeric video Page token', async () => {
      let seenInsightsToken = '';
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('/me/accounts')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              data: [{ id: '999888', name: 'Page', category: 'Brand', access_token: 'page_tok_video', tasks: ['ANALYZE'] }],
            }),
            headers: new Headers(),
          } as unknown as Response;
        }
        if (url.includes('fields=shares,reactions.summary')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ reactions: { summary: { total_count: 1 } } }),
            headers: new Headers(),
          } as unknown as Response;
        }
        if (url.includes('metric=post_total_media_view_unique')) {
          seenInsightsToken = new URL(url).searchParams.get('access_token') || '';
          return {
            ok: true,
            status: 200,
            json: async () => ({
              data: [{ name: 'post_total_media_view_unique', values: [{ value: 95 }] }],
            }),
            headers: new Headers(),
          } as unknown as Response;
        }
        if (url.includes('/insights')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({ data: [] }),
            headers: new Headers(),
          } as unknown as Response;
        }
        return { ok: false, status: 404, headers: new Headers() } as unknown as Response;
      });

      const res = await facebookAdapter.getEngagement('user_tok_123', '555666777');

      expect(seenInsightsToken).toBe('page_tok_video');
      expect(res.views).toBe(95);
      expect(res.impressions).toBe(95);
      expect(res.reach).toBe(95);
    });
  });

  describe('LinkedInAdapter - getEngagement', () => {
    it('encodes URN and parses socialActions summary', async () => {
      let calledUrl = '';
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        calledUrl = url;
        if (url.includes('/socialActions/')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              likesSummary: { totalLikes: 19 },
              commentsSummary: { totalFirstLevelComments: 7 },
              sharesSummary: { totalShares: 4 },
            }),
            headers: new Headers(),
          } as unknown as Response;
        }
        return { ok: false, status: 404, headers: new Headers() } as unknown as Response;
      });

      const res = await linkedInAdapter.getEngagement('token_li', 'urn:li:share:987654321');

      expect(calledUrl).toContain(encodeURIComponent('urn:li:share:987654321'));
      expect(res.likes).toBe(19);
      expect(res.comments).toBe(7);
      expect(res.shares).toBe(4);
      expect(res.hasRealData).toBe(true);
    });
  });

  describe('XAdapter - getEngagement', () => {
    it('captures impression_count as views along with social metrics', async () => {
      globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('/tweets/')) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              data: {
                public_metrics: {
                  like_count: 55,
                  retweet_count: 12,
                  reply_count: 6,
                  quote_count: 3,
                  impression_count: 1420,
                },
              },
            }),
            headers: new Headers(),
          } as unknown as Response;
        }
        return { ok: false, status: 404, headers: new Headers() } as unknown as Response;
      });

      const res = await xAdapter.getEngagement('token_x', 'tweet_123456');

      expect(res.likes).toBe(55);
      expect(res.retweets).toBe(12);
      expect(res.replies).toBe(6);
      expect(res.views).toBe(1420);
      expect(res.hasRealData).toBe(true);
    });
  });
});
