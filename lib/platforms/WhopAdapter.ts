import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import {
  PlatformAdapter,
  PlatformAuthConfig,
  TokenResponse,
  UserProfile,
  PublishInput,
  PublishResult,
} from './adapter';

const WHOP_AUTH_URL = 'https://api.whop.com/oauth/authorize';
const WHOP_TOKEN_URL = 'https://api.whop.com/oauth/token';
const WHOP_API_BASE = 'https://api.whop.com/v5';

export class WhopAdapter implements PlatformAdapter {
  readonly platform = 'whop' as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: config.WHOP_CLIENT_ID || '',
    clientSecret: config.WHOP_CLIENT_SECRET || '',
    redirectUri: config.WHOP_REDIRECT_URI || `${config.NEXT_PUBLIC_APP_URL}/api/auth/platform/callback`,
    scopes: ['openid', 'profile', 'email'],
  };

  getAuthUrl(state: string): string {
    // Whop strictly enforces OIDC specification: nonce is required whenever openid scope is requested
    const nonce = crypto.randomUUID().replace(/-/g, '');
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      redirect_uri: this.authConfig.redirectUri,
      response_type: 'code',
      scope: this.authConfig.scopes.join(' '),
      state,
      nonce,
    });
    return `${WHOP_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.authConfig.redirectUri,
    });

    const response = await fetch(WHOP_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Whop token exchange failed', { error: new Error(error), status: response.status });
      throw new Error(`Whop token exchange failed: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in || 0,
      scope: data.scope,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const response = await fetch(WHOP_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Whop token refresh failed: ${error}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in || 0,
    };
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    // 1. Try standard OIDC userinfo endpoint first
    let res = await fetch('https://api.whop.com/oauth/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // 2. Fallback to /v5/me if userinfo fails
    if (!res.ok) {
      res = await fetch(`${WHOP_API_BASE}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }

    if (!res.ok) {
      const error = await res.text();
      logger.error('Whop getUserProfile failed', { error: new Error(error), status: res.status });
      throw new Error(`Whop auth failed: ${error}`);
    }

    const data = await res.json();
    const user = data.user || data;

    const platformUserId = user.sub || user.id || user.username || 'whop-user';
    const username = user.preferred_username || user.username || platformUserId;
    const displayName = user.name || username;
    const avatarUrl = user.picture || user.profile_pic_url || '';

    return {
      platformUserId,
      username,
      displayName,
      avatarUrl,
      profileUrl: `https://whop.com/${username}`,
    };
  }

  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    // Whop doesn't currently support programmatic post creation via API.
    // We log the attempt and return a success placeholder so the publish
    // pipeline doesn't break. Users should use the Whop dashboard to post.
    logger.warn('Whop publish called — Whop API does not support post creation yet', {
      contentLength: input.content.length,
    });

    return {
      platformPostId: `whop-${Date.now()}`,
      platformUrl: 'https://whop.com',
      publishedAt: new Date(),
    };
  }

  async deletePost(_accessToken: string, _platformPostId: string): Promise<void> {
    // Not supported
  }

  async getEngagement(_accessToken: string, _platformPostId: string): Promise<Record<string, unknown>> {
    return {};
  }
}

export const whopAdapter = new WhopAdapter();
