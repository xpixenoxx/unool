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
import { platformFetch, fetchWithRetry, TokenExpiredError } from '@/lib/utils/retry';

const X_AUTH_URL = 'https://twitter.com/i/oauth2/authorize';
const X_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';
const X_API_BASE = 'https://api.twitter.com/2';

/**
 * Generates a PKCE code verifier and challenge per RFC 7636
 */
async function generatePKCEAsync(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const codeVerifier = base64urlEncode(verifierBytes);

  const encoder = new TextEncoder();
  const challengeHash = await crypto.subtle.digest('SHA-256', encoder.encode(codeVerifier));
  const codeChallenge = base64urlEncode(new Uint8Array(challengeHash));

  return { codeVerifier, codeChallenge };
}

function base64urlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * XAdapter with proper PKCE (S256) and retry logic
 */
export class XAdapter implements PlatformAdapter {
  readonly platform = 'x' as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: config.X_CLIENT_ID || '',
    clientSecret: config.X_CLIENT_SECRET || '',
    redirectUri: config.X_REDIRECT_URI || '',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
  };

  /**
   * Generates auth URL with PKCE S256 challenge
   * Stores code_verifier in HttpOnly cookie for callback retrieval
   */
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

    // Cookie value: state|codeVerifier (we'll split on callback)
    const pkceCookie = `pkce_${state}=${codeVerifier}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`;

    return {
      url: `${X_AUTH_URL}?${params.toString()}`,
      pkceCookie,
    };
  }

  /**
   * Exchanges authorization code for tokens using stored PKCE verifier
   */
  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.authConfig.redirectUri,
      client_id: this.authConfig.clientId,
      code_verifier: codeVerifier,
    });

    const credentials = Buffer.from(`${this.authConfig.clientId}:${this.authConfig.clientSecret}`).toString('base64');

    return platformFetch('x', async () => {
      const response = await fetchWithRetry(X_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('X token exchange failed', { errorMessage: error, status: response.status });
        throw new Error(`X token exchange failed: ${error}`);
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        scope: data.scope,
      };
    });
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.authConfig.clientId,
    });

    const credentials = Buffer.from(`${this.authConfig.clientId}:${this.authConfig.clientSecret}`).toString('base64');

    return platformFetch('x', async () => {
      const response = await fetchWithRetry(X_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('X token refresh failed', { errorMessage: error, status: response.status });
        throw new Error(`X token refresh failed: ${error}`);
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        scope: data.scope,
      };
    });
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    return platformFetch('x', async () => {
      const response = await fetchWithRetry(`${X_API_BASE}/users/me?user.fields=profile_image_url,username,name`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('X profile fetch failed', { errorMessage: error, status: response.status });

        if (response.status === 401 || response.status === 403) {
          throw new TokenExpiredError('Token expired or invalid', 'x');
        }
        throw new Error(`X profile fetch failed: ${error}`);
      }

      const data = await response.json();
      return {
        platformUserId: data.data.id,
        username: data.data.username,
        displayName: data.data.name,
        profileUrl: `https://x.com/${data.data.username}`,
        avatarUrl: data.data.profile_image_url,
      };
    });
  }

  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    return platformFetch('x', async () => {
      const body: Record<string, unknown> = { text: input.content };

      if (input.mediaUrls && input.mediaUrls.length > 0) {
        logger.warn('Media upload for X not fully implemented', { mediaUrls: input.mediaUrls });
      }

      if (input.firstComment) {
        body.text = `${input.content}\n\n${input.firstComment}`;
      }

      const response = await fetchWithRetry(`${X_API_BASE}/tweets`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('X publish failed', { errorMessage: error, status: response.status });

        // Check for token expiry
        if (response.status === 401 || response.status === 403) {
          throw new TokenExpiredError('Token expired or invalid', 'x');
        }
        throw new Error(`X publish failed: ${error}`);
      }

      const data = await response.json();
      const platformPostId = data.data.id;
      const platformUrl = `https://x.com/i/web/status/${platformPostId}`;

      return {
        platformPostId,
        platformUrl,
        publishedAt: new Date(),
      };
    });
  }

  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    return platformFetch('x', async () => {
      const response = await fetchWithRetry(`${X_API_BASE}/tweets/${platformPostId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('X delete failed', { errorMessage: error, status: response.status });
        throw new Error(`X delete failed: ${error}`);
      }
    });
  }

  async getEngagement(accessToken: string, platformPostId: string): Promise<Record<string, unknown>> {
    return platformFetch('x', async () => {
      const response = await fetchWithRetry(
        `${X_API_BASE}/tweets/${platformPostId}?tweet.fields=public_metrics`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error('X engagement fetch failed', { errorMessage: error, status: response.status });
        return {};
      }

      const data = await response.json();
      const metrics = data.data?.public_metrics || {};
      return {
        likes: metrics.like_count || 0,
        retweets: metrics.retweet_count || 0,
        replies: metrics.reply_count || 0,
        quotes: metrics.quote_count || 0,
      };
    });
  }
}

export const xAdapter = new XAdapter();