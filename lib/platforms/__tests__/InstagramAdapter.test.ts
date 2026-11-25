import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InstagramAdapter } from '../InstagramAdapter';

describe('InstagramAdapter OAuth fallbacks and error handling', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('falls back to shortLivedToken when ig_exchange_token returns HTTP 400', async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('api.instagram.com/oauth/access_token')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'IG_SHORT_TOKEN',
            expires_in: 3600,
            scope: 'instagram_business_basic',
          }),
          text: async () => '',
          headers: new Headers(),
        };
      }
      if (url.includes('graph.instagram.com/access_token')) {
        return {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({}),
          text: async () =>
            JSON.stringify({
              error: {
                message: 'Unsupported request - method type: get',
                type: 'IGApiException',
                code: 100,
              },
            }),
          headers: new Headers(),
        };
      }
      return { ok: true, status: 200, json: async () => ({}), text: async () => '', headers: new Headers() };
    });
    globalThis.fetch = fetchMock as any;

    const adapter = new InstagramAdapter();
    const result = await adapter.exchangeCodeForToken('code-123', undefined, 'https://unool.co/api/auth/platform/callback');

    expect(result).toEqual({
      accessToken: 'IG_SHORT_TOKEN',
      refreshToken: 'IG_SHORT_TOKEN',
      expiresIn: 3600,
      scope: 'instagram_business_basic',
    });
  });

  it('falls back to core fields (id,username) when full-field /me query returns HTTP 400', async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('profile_picture_url')) {
        return {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          json: async () => ({}),
          text: async () =>
            JSON.stringify({
              error: {
                message: 'Unsupported request - method type: get',
                type: 'IGApiException',
                code: 100,
              },
            }),
          headers: new Headers(),
        };
      }
      if (url.includes('/me?fields=id,username')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: '17841400000000001',
            username: 'creator_handle',
          }),
          text: async () => '',
          headers: new Headers(),
        };
      }
      return { ok: true, status: 200, json: async () => ({}), text: async () => '', headers: new Headers() };
    });
    globalThis.fetch = fetchMock as any;

    const adapter = new InstagramAdapter();
    const profile = await adapter.getUserProfile('IG_ACCESS_TOKEN');

    expect(profile).toEqual({
      platformUserId: '17841400000000001',
      username: 'creator_handle',
      displayName: 'creator_handle',
      profileUrl: 'https://instagram.com/creator_handle',
      avatarUrl: undefined,
      instagramBusinessAccountId: undefined,
      accountType: undefined,
    });
  });

  it('throws readable Meta API code 100 guidance when both /me queries fail with IGApiException code 100', async () => {
    const errorPayload = JSON.stringify({
      error: {
        message: 'Unsupported request - method type: get',
        type: 'IGApiException',
        code: 100,
        fbtrace_id: 'AW1Y6qhSH1SIG7AQRxvU6Z0',
      },
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({}),
      text: async () => errorPayload,
      headers: new Headers(),
    });
    globalThis.fetch = fetchMock as any;

    const adapter = new InstagramAdapter();
    await expect(adapter.getUserProfile('IG_ACCESS_TOKEN')).rejects.toThrow(
      /Instagram could not complete this connection \(Meta API code 100\)\. Make sure this Instagram account is a Professional \(Creator or Business\) account/
    );
    await expect(adapter.getUserProfile('IG_ACCESS_TOKEN')).rejects.not.toThrow(/IGApiException/);
  });
});
