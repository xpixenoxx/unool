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
import { platformFetch, fetchWithRetry } from '@/lib/utils/retry';

const REDDIT_AUTH_URL = 'https://www.reddit.com/api/v1/authorize';
const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
const REDDIT_OAUTH_API = 'https://oauth.reddit.com';

export class RedditAdapter implements PlatformAdapter {
  readonly platform = 'reddit' as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: config.REDDIT_CLIENT_ID || '',
    clientSecret: config.REDDIT_CLIENT_SECRET || '',
    redirectUri: config.REDDIT_REDIRECT_URI || `${config.NEXT_PUBLIC_APP_URL}/api/auth/platform/callback`,
    scopes: ['identity', 'submit', 'read'],
  };

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      response_type: 'code',
      state: state,
      redirect_uri: this.authConfig.redirectUri,
      duration: 'permanent',
      scope: this.authConfig.scopes.join(' '),
    });
    return `${REDDIT_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    return platformFetch('reddit', async () => {
      const basicAuth = Buffer.from(`${this.authConfig.clientId}:${this.authConfig.clientSecret}`).toString('base64');
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.authConfig.redirectUri,
      });

      const response = await fetchWithRetry(REDDIT_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`,
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Reddit token exchange failed: ${error}`);
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
    return platformFetch('reddit', async () => {
      const basicAuth = Buffer.from(`${this.authConfig.clientId}:${this.authConfig.clientSecret}`).toString('base64');
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });

      const response = await fetchWithRetry(REDDIT_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`,
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Reddit token refresh failed: ${error}`);
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresIn: data.expires_in,
      };
    });
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    return platformFetch('reddit', async () => {
      const response = await fetchWithRetry(`${REDDIT_OAUTH_API}/api/v1/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'Unool/1.0.0',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch Reddit profile: ${error}`);
      }

      const data = await response.json();
      return {
        platformUserId: data.id,
        username: data.name,
        displayName: data.subreddit?.title || data.name,
        avatarUrl: data.icon_img?.split('?')[0] || '',
        profileUrl: `https://reddit.com/user/${data.name}`,
      };
    });
  }

  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    return platformFetch('reddit', async () => {
      // For now, post to user's own profile subreddit "u_username"
      if (!input.username) {
        throw new Error("Username required for Reddit publish");
      }
      
      const sr = `u_${input.username}`;
      const params = new URLSearchParams({
        sr,
        kind: 'self',
        title: input.content.substring(0, 300) || 'Post', // Reddit requires a title
        text: input.content,
      });

      const response = await fetchWithRetry(`${REDDIT_OAUTH_API}/api/submit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'Unool/1.0.0',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Reddit publish failed: ${error}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(`Reddit publish failed: ${JSON.stringify(data.errors)}`);
      }

      const platformPostId = data.jquery[data.jquery.length - 1][3][0].data.id;
      const permalink = data.jquery[data.jquery.length - 1][3][0].data.url;

      return {
        platformPostId,
        platformUrl: permalink || `https://reddit.com/user/${input.username}/comments/${platformPostId}/`,
        publishedAt: new Date(),
      };
    });
  }

  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    return platformFetch('reddit', async () => {
      const params = new URLSearchParams({
        id: `t3_${platformPostId}`, // Link fullname
      });

      const response = await fetchWithRetry(`${REDDIT_OAUTH_API}/api/del`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'Unool/1.0.0',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Reddit delete failed: ${error}`);
      }
    });
  }

  async getEngagement(accessToken: string, platformPostId: string): Promise<Record<string, unknown>> {
    return platformFetch('reddit', async () => {
      const response = await fetchWithRetry(`${REDDIT_OAUTH_API}/by_id/t3_${platformPostId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'Unool/1.0.0',
        },
      });

      if (!response.ok) {
         return {};
      }

      const data = await response.json();
      const postData = data.data?.children?.[0]?.data;
      if (!postData) return {};

      return {
        likes: postData.ups || 0,
        comments: postData.num_comments || 0,
        upvoteRatio: postData.upvote_ratio || 0,
      };
    });
  }
}

export const redditAdapter = new RedditAdapter();
