import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RedditAdapter } from '../RedditAdapter';
import { SlackAdapter } from '../SlackAdapter';
import { SkoolAdapter } from '../SkoolAdapter';
import { WarpcastAdapter } from '../WarpcastAdapter';
import { NostrAdapter } from '../NostrAdapter';
import {
  createOAuthCookie,
  parseOAuthCookie,
  createPKCECookie,
  parseAndConsumePKCECookie,
} from '@/lib/auth/oauth-state';

describe('platform connection hardening', () => {
  const originalFetch = globalThis.fetch;
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('Reddit sends a User-Agent on token exchange', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access_token: 'a', refresh_token: 'r', expires_in: 3600 }),
      text: async () => '',
      headers: new Headers(),
    });
    globalThis.fetch = fetchMock as any;
    const adapter = new RedditAdapter();
    const out = await adapter.exchangeCodeForToken('code', undefined, 'https://unool.co/cb');
    expect(out.accessToken).toBe('a');
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers['User-Agent']).toContain('unool');
  });

  it('Reddit publish sends api_type=json and rejects json.errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ json: { errors: [['RATELIMIT', 'slow down', 'ratelimit']] } }),
      text: async () => '',
      headers: new Headers(),
    });
    globalThis.fetch = fetchMock as any;
    const adapter = new RedditAdapter();
    await expect(
      adapter.publish('tok', { content: 'hi', username: 'bob' } as any)
    ).rejects.toThrow(/Reddit publish failed/);
    expect(String(fetchMock.mock.calls[0][1].body)).toContain('api_type=json');
  });

  it('Slack does not double-prefix https:// in profileUrl', async () => {
    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () =>
        String(url).includes('auth.test')
          ? { ok: true, user: 'bob', user_id: 'U1', url: 'https://team.slack.com/' }
          : { ok: false },
    })) as any;
    const adapter = new SlackAdapter();
    const profile = await adapter.getUserProfile(JSON.stringify({ accessToken: 'x' }));
    expect(profile.profileUrl).toBe('https://team.slack.com/');
  });

  it.each([
    ['skool', () => new SkoolAdapter(), { webhookUrl: 'http://127.0.0.1/hook' }],
    ['warpcast', () => new WarpcastAdapter(), { webhookUrl: 'https://169.254.169.254/x' }],
    ['nostr', () => new NostrAdapter(), { webhookUrl: 'http://example.com/hook' }],
  ])('%s rejects disallowed webhook URLs before fetching', async (_n, make, token) => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as any;
    const adapter: any = make();
    await expect(adapter.publish(JSON.stringify(token), { content: 'hello' })).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('oauth cookie preserves extras', () => {
    const cookie = createOAuthCookie('st', 'ws', 'u', 'x', '/dashboard', 'https://unool.co/cb', 600, {
      codeVerifier: 'cv',
      reconnectConnectionId: 'conn1',
      addAccount: true,
    });
    const parsed = parseOAuthCookie(cookie.split(';')[0]);
    expect(parsed?.data.codeVerifier).toBe('cv');
    expect(parsed?.data.reconnectConnectionId).toBe('conn1');
    expect(parsed?.data.addAccount).toBe(true);
  });

  it('PKCE cookie values containing "=" are preserved', () => {
    const header = createPKCECookie('abc', 'ver=ifier==').split(';')[0];
    expect(parseAndConsumePKCECookie(header, 'abc')).toBe('ver=ifier==');
  });
});
