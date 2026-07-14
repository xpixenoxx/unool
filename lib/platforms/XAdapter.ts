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

const X_AUTH_URL = 'https://twitter.com/i/oauth2/authorize';
const X_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';
const X_API_BASE = 'https://api.twitter.com/2';

export class XAdapter implements PlatformAdapter {
  readonly platform = 'x' as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: config.X_CLIENT_ID || '',
    clientSecret: config.X_CLIENT_SECRET || '',
    redirectUri: config.X_REDIRECT_URI || '',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
  };

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.authConfig.clientId,
      redirect_uri: this.authConfig.redirectUri,
      scope: this.authConfig.scopes.join(' '),
      state,
      code_challenge: 'challenge',
      code_challenge_method: 'plain',
    });
    return `${X_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.authConfig.redirectUri,
      client_id: this.authConfig.clientId,
      code_verifier: 'challenge',
    });

    const credentials = Buffer.from(`${this.authConfig.clientId}:${this.authConfig.clientSecret}`).toString('base64');

    const response = await fetch(X_TOKEN_URL, {
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
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.authConfig.clientId,
    });

    const credentials = Buffer.from(`${this.authConfig.clientId}:${this.authConfig.clientSecret}`).toString('base64');

    const response = await fetch(X_TOKEN_URL, {
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
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    const response = await fetch(`${X_API_BASE}/users/me?user.fields=profile_image_url,username,name`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('X profile fetch failed', { errorMessage: error, status: response.status });
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
  }

  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    const body: Record<string, unknown> = { text: input.content };

    // Handle media if provided (would need media upload first in production)
    if (input.mediaUrls && input.mediaUrls.length > 0) {
      logger.warn('Media upload for X not fully implemented', { mediaUrls: input.mediaUrls });
    }

    // Handle reply/thread if firstComment is provided
    if (input.firstComment) {
      // For now, just append to the main tweet
      body.text = `${input.content}\n\n${input.firstComment}`;
    }

    const response = await fetch(`${X_API_BASE}/tweets`, {
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
  }

  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    const response = await fetch(`${X_API_BASE}/tweets/${platformPostId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('X delete failed', { errorMessage: error, status: response.status });
      throw new Error(`X delete failed: ${error}`);
    }
  }

  async getEngagement(accessToken: string, platformPostId: string): Promise<Record<string, unknown>> {
    const response = await fetch(
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
  }
}

export const xAdapter = new XAdapter();