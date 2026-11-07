import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { threadsAdapter } from '../ThreadsAdapter';
import { TokenExpiredError } from '@/lib/utils/retry';

describe('ThreadsAdapter - getEngagement', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('fetches and aggregates Threads post insights accurately', async () => {
    const mockApiResponse = {
      data: [
        { name: 'likes', values: [{ value: 35 }] },
        { name: 'replies', values: [{ value: 7 }] },
        { name: 'reposts', values: [{ value: 4 }] },
        { name: 'quotes', values: [{ value: 2 }] },
        { name: 'views', values: [{ value: 620 }] },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
      headers: new Headers(),
    } as unknown as Response);

    const result = await threadsAdapter.getEngagement('mock_token', '178912345678901');

    expect(result.likes).toBe(35);
    expect(result.comments).toBe(7);
    expect(result.replies).toBe(7);
    expect(result.reposts).toBe(4);
    expect(result.quotes).toBe(2);
    expect(result.shares).toBe(6); // 4 reposts + 2 quotes
    expect(result.views).toBe(620);
    expect(result.totalInteractions).toBe(48); // 35 + 7 + 6
  });

  it('handles fallback gracefully when first candidate returns 400 (e.g. shares in-development)', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      callCount++;
      // First attempt with 'shares' metric fails with 400
      if (url.includes('shares')) {
        return {
          ok: false,
          status: 400,
          text: async () => '{"error":{"message":"Invalid metric: shares"}}',
          headers: new Headers(),
        } as unknown as Response;
      }

      // Second candidate (without shares) succeeds
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            { name: 'likes', values: [{ value: 12 }] },
            { name: 'replies', values: [{ value: 3 }] },
            { name: 'reposts', values: [{ value: 2 }] },
            { name: 'quotes', values: [{ value: 1 }] },
            { name: 'views', values: [{ value: 180 }] },
          ],
        }),
        headers: new Headers(),
      } as unknown as Response;
    });

    const result = await threadsAdapter.getEngagement('mock_token', '178912345678902');

    expect(callCount).toBeGreaterThanOrEqual(2);
    expect(result.likes).toBe(12);
    expect(result.comments).toBe(3);
    expect(result.shares).toBe(3); // 2 reposts + 1 quote
    expect(result.views).toBe(180);
    expect(result.totalInteractions).toBe(18);
  });

  it('throws TokenExpiredError when response status is 401 or 403', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => '{"error":{"message":"Error validating access token"}}',
      headers: new Headers(),
    } as unknown as Response);

    await expect(
      threadsAdapter.getEngagement('expired_token', '178912345678903')
    ).rejects.toThrow(TokenExpiredError);
  });

  it('handles empty data array (repost facade or no metrics) safely', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
      headers: new Headers(),
    } as unknown as Response);

    const result = await threadsAdapter.getEngagement('mock_token', '178912345678904');

    expect(result.likes).toBe(0);
    expect(result.comments).toBe(0);
    expect(result.shares).toBe(0);
    expect(result.views).toBe(0);
    expect(result.totalInteractions).toBe(0);
  });
});
