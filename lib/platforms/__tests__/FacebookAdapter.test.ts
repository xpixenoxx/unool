import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FacebookAdapter, facebookAdapter } from '../FacebookAdapter';
import { generateOAuthState, storeOAuthState, verifyAndConsumeOAuthState, createOAuthCookie, parseOAuthCookie } from '@/lib/auth/oauth-state';

describe('FacebookAdapter', () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = originalEnv;
  });

  it('reads authConfig with environment variables and fallback aliases', () => {
    process.env.FACEBOOK_APP_ID = 'meta_test_id_123';
    process.env.FACEBOOK_APP_SECRET = 'meta_test_secret_456';
    process.env.FACEBOOK_REDIRECT_URI = 'http://localhost:3000/api/auth/platform/callback';

    const adapter = new FacebookAdapter();
    expect(adapter.authConfig.clientId).toBe('meta_test_id_123');
    expect(adapter.authConfig.clientSecret).toBe('meta_test_secret_456');
    expect(adapter.authConfig.redirectUri).toBe('http://localhost:3000/api/auth/platform/callback');
    expect(adapter.authConfig.scopes).toContain('pages_show_list');
    expect(adapter.authConfig.scopes).toContain('pages_messaging');
  });

  it('builds getAuthUrl with state and effective redirectUri', () => {
    process.env.FACEBOOK_CLIENT_ID = 'fb_app_789';
    process.env.FACEBOOK_CLIENT_SECRET = 'fb_secret_999';

    const adapter = new FacebookAdapter();
    const url = adapter.getAuthUrl('test_state_123', 'http://localhost:3000/api/auth/platform/callback');
    const parsed = new URL(url);

    expect(parsed.hostname).toBe('www.facebook.com');
    expect(parsed.pathname).toContain('/dialog/oauth');
    expect(parsed.searchParams.get('client_id')).toBe('fb_app_789');
    expect(parsed.searchParams.get('state')).toBe('test_state_123');
    expect(parsed.searchParams.get('redirect_uri')).toBe('http://localhost:3000/api/auth/platform/callback');
    expect(parsed.searchParams.get('scope')).toContain('pages_show_list');
  });

  it('exchanges code for short-lived and long-lived tokens using effective redirectUri', async () => {
    process.env.FACEBOOK_CLIENT_ID = 'fb_app_789';
    process.env.FACEBOOK_CLIENT_SECRET = 'fb_secret_999';

    let fetchCount = 0;
    let exchangeRedirectUri: string | null = null;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string) => {
      fetchCount++;
      const parsedUrl = new URL(url);
      if (fetchCount === 1) {
        // Step 1: code exchange
        exchangeRedirectUri = parsedUrl.searchParams.get('redirect_uri');
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'short_lived_token_123',
            token_type: 'bearer',
            expires_in: 3600,
          }),
          headers: new Headers(),
        } as unknown as Response;
      } else {
        // Step 2: long-lived exchange
        return {
          ok: true,
          status: 200,
          json: async () => ({
            access_token: 'long_lived_token_456',
            token_type: 'bearer',
            expires_in: 5184000,
          }),
          headers: new Headers(),
        } as unknown as Response;
      }
    });

    const adapter = new FacebookAdapter();
    const result = await adapter.exchangeCodeForToken('auth_code_xyz', 'http://localhost:3000/api/auth/platform/callback');

    expect(exchangeRedirectUri).toBe('http://localhost:3000/api/auth/platform/callback');
    expect(result.accessToken).toBe('long_lived_token_456');
    expect(result.expiresIn).toBe(5184000);
  });

  it('fetches user profile successfully', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'fb_user_1001',
        name: 'Jane Doe',
        email: 'jane@example.com',
        picture: { data: { url: 'https://cdn.facebook.com/avatar.png' } },
      }),
      headers: new Headers(),
    } as unknown as Response);

    const adapter = new FacebookAdapter();
    const profile = await adapter.getUserProfile('test_access_token');

    expect(profile.platformUserId).toBe('fb_user_1001');
    expect(profile.displayName).toBe('Jane Doe');
    expect(profile.username).toBe('jane@example.com');
    expect(profile.avatarUrl).toBe('https://cdn.facebook.com/avatar.png');
  });

  it('fetches user pages and subscribes page webhook', async () => {
    let subscribedAppCalled = false;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes('/me/accounts')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              {
                id: 'page_999',
                name: 'My Store Page',
                category: 'Retail',
                access_token: 'page_token_abc',
                tasks: ['MANAGE', 'CREATE_CONTENT'],
              },
            ],
          }),
          headers: new Headers(),
        } as unknown as Response;
      }
      if (url.includes('/page_999/subscribed_apps')) {
        subscribedAppCalled = true;
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
          headers: new Headers(),
        } as unknown as Response;
      }
      return { ok: false, status: 404 } as unknown as Response;
    });

    const adapter = new FacebookAdapter();
    const pages = await adapter.getUserPages('user_access_token');
    expect(pages).toHaveLength(1);
    expect(pages[0].id).toBe('page_999');
    expect(pages[0].name).toBe('My Store Page');

    await adapter.subscribePageWebhook(pages[0].accessToken, pages[0].id);
    expect(subscribedAppCalled).toBe(true);
  });
});

describe('OAuth State redirectUri persistence', () => {
  it('stores and restores redirectUri in cookie state', async () => {
    const state = generateOAuthState('ws_123', 'facebook');
    const cookie = createOAuthCookie(
      state,
      'ws_123',
      'user_456',
      'facebook',
      '/dashboard/automation?platform=facebook',
      'http://localhost:3000/api/auth/platform/callback'
    );

    expect(cookie).toContain('oauth_state=');

    const cookieHeader = cookie.split(';')[0];
    const verified = await verifyAndConsumeOAuthState(state, cookieHeader);

    expect(verified).not.toBeNull();
    expect(verified?.workspaceId).toBe('ws_123');
    expect(verified?.userId).toBe('user_456');
    expect(verified?.platform).toBe('facebook');
    expect(verified?.returnUrl).toBe('/dashboard/automation?platform=facebook');
    expect(verified?.redirectUri).toBe('http://localhost:3000/api/auth/platform/callback');
  });
});

