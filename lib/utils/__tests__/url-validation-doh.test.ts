import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('dns', () => {
  const reject = () => Promise.reject(new Error('dns unavailable'));
  const promises = { resolve4: reject, resolve6: reject };
  return { default: { promises }, promises };
});

import { validateUrlForFetch } from '@/lib/utils/url-validation';

function mockDoh(answers: Record<string, Array<{ type: number; data: string }>>) {
  globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
    const u = new URL(url);
    const type = u.searchParams.get('type');
    const list = answers[type || ''] || [];
    return { ok: true, json: async () => ({ Answer: list }) } as Response;
  }) as any;
}

describe('validateUrlForFetch DNS-over-HTTPS fallback', () => {
  const originalFetch = globalThis.fetch;
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('allows hosts that resolve to a public IP via DoH', async () => {
    mockDoh({ A: [{ type: 1, data: '93.184.216.34' }] });
    const res = await validateUrlForFetch('https://doh-public-1.example.com/hook');
    expect(res.allowed).toBe(true);
  });

  it('blocks hosts that resolve to private IPs via DoH', async () => {
    mockDoh({ A: [{ type: 1, data: '10.0.0.5' }] });
    const res = await validateUrlForFetch('https://doh-private-1.example.com/hook');
    expect(res.allowed).toBe(false);
  });

  it('fails closed when DoH returns no answers', async () => {
    mockDoh({});
    const res = await validateUrlForFetch('https://doh-empty-1.example.com/hook');
    expect(res.allowed).toBe(false);
  });
});
