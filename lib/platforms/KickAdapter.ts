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
import { fetchWithRetry } from '@/lib/utils/retry';

const KICK_AUTH_URL = 'https://id.kick.com/oauth/authorize';
const KICK_TOKEN_URL = 'https://id.kick.com/oauth/token';
const KICK_API_BASE = 'https://api.kick.com/public/v1';

function base64urlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function generatePKCEAsync(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const codeVerifier = base64urlEncode(verifierBytes);

  const encoder = new TextEncoder();
  const challengeHash = await crypto.subtle.digest('SHA-256', encoder.encode(codeVerifier));
  const codeChallenge = base64urlEncode(new Uint8Array(challengeHash));

  return { codeVerifier, codeChallenge };
}

export class KickAdapter implements PlatformAdapter {
  readonly platform = 'kick' as const;

  get authConfig(): PlatformAuthConfig {
    return {
      clientId: config.KICK_CLIENT_ID || '',
      clientSecret: config.KICK_CLIENT_SECRET || '',
      redirectUri: config.KICK_REDIRECT_URI || `${config.NEXT_PUBLIC_APP_URL}/api/auth/platform/callback`,
      scopes: ['user:read', 'channel:read', 'chat:write'],
    };
  }

  async getAuthUrl(state: string): Promise<{ url: string; pkceCookie: string }> {
    const { codeVerifier, codeChallenge } = await generatePKCEAsync();

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.authConfig.clientId,
      redirect_uri: this.authConfig.redirectUri,
      scope: this.authConfig.scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const pkceCookie = `pkce_${state}=${codeVerifier}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`;

    return {
      url: `${KICK_AUTH_URL}?${params.toString()}`,
      pkceCookie,
    };
  }

  async exchangeCodeForToken(code: string, codeVerifier?: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.authConfig.clientId,
      code,
      redirect_uri: this.authConfig.redirectUri,
    });

    if (this.authConfig.clientSecret) {
      params.set('client_secret', this.authConfig.clientSecret);
    }

    if (codeVerifier) {
      params.set('code_verifier', codeVerifier);
    }

    const response = await fetchWithRetry(KICK_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Kick token exchange failed', { errorMessage: error, status: response.status });
      throw new Error(`Kick token exchange failed: ${error}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in || 3600,
      scope: data.scope,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.authConfig.clientId,
      refresh_token: refreshToken,
    });

    if (this.authConfig.clientSecret) {
      params.set('client_secret', this.authConfig.clientSecret);
    }

    const response = await fetchWithRetry(KICK_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Kick token refresh failed', { errorMessage: error, status: response.status });
      throw new Error(`Kick token refresh failed: ${error}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in || 3600,
      scope: data.scope,
    };
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    const response = await fetchWithRetry(`${KICK_API_BASE}/users`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Kick getUserProfile failed', { errorMessage: error, status: response.status });
      throw new Error(`Kick user fetch failed: ${error}`);
    }

    const json = await response.json();
    const user = Array.isArray(json.data) ? json.data[0] : (json.data || json);
    if (!user) {
      throw new Error('Kick user profile not found');
    }

    const userId = String(user.user_id || user.id || '');
    const username = user.name || user.username || user.slug || 'kick_user';
    const slug = user.slug || user.name || username;

    return {
      platformUserId: userId,
      username,
      displayName: user.name || user.username || slug,
      profileUrl: `https://kick.com/${slug}`,
      avatarUrl: user.profile_picture || user.profile_pic || user.avatar_url || '',
    };
  }

  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    let broadcasterId = input.platformUserId;
    if (!broadcasterId || isNaN(parseInt(broadcasterId, 10))) {
      const profile = await this.getUserProfile(accessToken);
      broadcasterId = profile.platformUserId;
    }

    const numericBroadcasterId = parseInt(broadcasterId, 10);
    if (!numericBroadcasterId || isNaN(numericBroadcasterId)) {
      throw new Error('Invalid Kick broadcaster ID. Please reconnect your Kick account.');
    }

    let text = (input.content || '').trim();
    if (input.mediaUrls && input.mediaUrls.length > 0) {
      text = text ? `${text} ${input.mediaUrls.join(' ')}` : input.mediaUrls.join(' ');
    }

    if (!text) {
      text = 'Live update';
    }

    // Kick chat messages cannot exceed 500 characters
    if (text.length > 500) {
      text = text.substring(0, 497) + '...';
    }

    const response = await fetchWithRetry(`${KICK_API_BASE}/chat`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        broadcaster_user_id: numericBroadcasterId,
        content: text,
        type: 'user',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Kick publish failed', { errorMessage: errorText, status: response.status });
      throw new Error(`Kick publish failed: ${errorText}`);
    }

    const data = await response.json().catch(() => ({}));
    const messageId = data?.data?.message_id || data?.message_id || `kick-${Date.now()}`;

    return {
      platformPostId: String(messageId),
      platformUrl: input.username ? `https://kick.com/${input.username}` : `https://kick.com`,
      publishedAt: new Date(),
    };
  }

  async deletePost(_accessToken: string, platformPostId: string): Promise<void> {
    logger.info('Kick delete post requested', { platformPostId });
  }

  async getEngagement(_accessToken: string, _platformPostId: string): Promise<Record<string, unknown>> {
    return {};
  }
}

export const kickAdapter = new KickAdapter();
