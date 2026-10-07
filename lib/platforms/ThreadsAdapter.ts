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

const META_AUTH_URL = 'https://threads.net/oauth/authorize';
const META_TOKEN_URL = 'https://graph.threads.net/oauth/access_token';
const THREADS_API_BASE = 'https://graph.threads.net/v1.0';

export class ThreadsAdapter implements PlatformAdapter {
  readonly platform = 'threads' as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: config.THREADS_CLIENT_ID || '',
    clientSecret: config.THREADS_CLIENT_SECRET || '',
    redirectUri: config.THREADS_REDIRECT_URI || `${config.NEXT_PUBLIC_APP_URL}/api/auth/platform/callback`,
    scopes: ['threads_basic', 'threads_content_publish', 'threads_manage_replies', 'threads_manage_insights'],
  };

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      redirect_uri: this.authConfig.redirectUri,
      scope: this.authConfig.scopes.join(','),
      response_type: 'code',
      state,
    });
    return `${META_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
      redirect_uri: this.authConfig.redirectUri,
      grant_type: 'authorization_code',
      code,
    });

    return platformFetch('threads', async () => {
      // Step 1: Exchange code for short-lived token (POST body, not query params)
      const response = await fetchWithRetry(META_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Threads token exchange failed', { errorMessage: error, status: response.status });
        throw new Error(`Token exchange failed: ${error}`);
      }

      const shortLivedData = await response.json();
      logger.info('Threads short-lived token obtained', { expiresIn: shortLivedData.expires_in });

      // Step 2: Exchange short-lived token for a long-lived token (60 days)
      try {
        const longLivedParams = new URLSearchParams({
          grant_type: 'th_exchange_token',
          client_secret: this.authConfig.clientSecret,
          access_token: shortLivedData.access_token,
        });
        const longLivedResponse = await fetchWithRetry(
          `${THREADS_API_BASE}/access_token?${longLivedParams.toString()}`,
          { method: 'GET' }
        );

        if (longLivedResponse.ok) {
          const longLivedData = await longLivedResponse.json();
          logger.info('Threads long-lived token obtained', { expiresIn: longLivedData.expires_in });
          return {
            accessToken: longLivedData.access_token,
            expiresIn: longLivedData.expires_in,
            scope: shortLivedData.scope,
          };
        } else {
          const errText = await longLivedResponse.text();
          logger.warn('Threads long-lived token exchange failed, using short-lived', { error: errText });
        }
      } catch (longLivedErr) {
        logger.warn('Threads long-lived token exchange error, using short-lived', {
          errorMessage: longLivedErr instanceof Error ? longLivedErr.message : String(longLivedErr),
        });
      }

      // Fallback: return the short-lived token
      return {
        accessToken: shortLivedData.access_token,
        refreshToken: shortLivedData.refresh_token,
        expiresIn: shortLivedData.expires_in,
        scope: shortLivedData.scope,
      };
    });
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    // Threads uses long-lived tokens; refresh them via the refresh_access_token endpoint
    const params = new URLSearchParams({
      grant_type: 'th_refresh_token',
      access_token: refreshToken,
    });

    return platformFetch('threads', async () => {
      const response = await fetchWithRetry(`https://graph.threads.net/refresh_access_token?${params.toString()}`, {
        method: 'GET'
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Threads token refresh failed', { errorMessage: error, status: response.status });
        throw new Error(`Token refresh failed: ${error}`);
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
      };
    });
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    return platformFetch('threads', async () => {
      const response = await fetchWithRetry(
        `${THREADS_API_BASE}/me?fields=id,username,name,threads_profile_picture_url,threads_biography&access_token=${accessToken}`,
        {}
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error('Threads profile fetch failed', { errorMessage: error, status: response.status });

        if (response.status === 401 || response.status === 403) {
          throw new TokenExpiredError('Token expired or invalid', 'threads');
        }
        if (response.status >= 500) {
          throw new Error(`Profile fetch 500 error: ${error}`);
        }
        throw new Error(`Profile fetch failed: ${error}`);
      }

      const data = await response.json();
      return {
        platformUserId: data.id,
        username: data.username,
        displayName: data.name,
        profileUrl: `https://www.threads.net/@${data.username}`,
        avatarUrl: data.threads_profile_picture_url,
      };
    });
  }

  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    return platformFetch('threads', async () => {
      let mediaType = 'TEXT';
      let isVideo = false;
      const mediaUrl = input.mediaUrls?.[0];

      if (mediaUrl) {
        isVideo = /\.(mp4|mov|webm|avi|mkv)(?:\?.*)?$/i.test(mediaUrl);
        mediaType = isVideo ? 'VIDEO' : 'IMAGE';
      }

      const containerParams = new URLSearchParams({
        media_type: mediaType,
        access_token: accessToken,
      });

      if (input.content) {
        containerParams.set('text', input.content);
      }

      if (mediaUrl) {
        if (isVideo) {
          containerParams.set('video_url', mediaUrl);
        } else {
          containerParams.set('image_url', mediaUrl);
        }
      }

      // Add reply control if first comment is provided
      if (input.firstComment) {
        containerParams.set('reply_control', 'ALL');
      }

      const containerResponse = await fetchWithRetry(`${THREADS_API_BASE}/me/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: containerParams.toString(),
      });

      if (!containerResponse.ok) {
        const error = await containerResponse.text();
        logger.error('Threads container creation failed', { errorMessage: error, status: containerResponse.status });
        throw new Error(`Container creation failed: ${error}`);
      }

      const containerData = await containerResponse.json();
      const creationId = containerData.id;

      // Wait for container to be ready (poll)
      await this.waitForContainerReady(accessToken, creationId);

      const publishParams = new URLSearchParams({
        creation_id: creationId,
        access_token: accessToken,
      });

      // Publish the container
      const publishResponse = await fetchWithRetry(`${THREADS_API_BASE}/me/threads_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: publishParams.toString(),
      });

      if (!publishResponse.ok) {
        const error = await publishResponse.text();
        logger.error('Threads publish failed', { errorMessage: error, status: publishResponse.status });
        throw new Error(`Publish failed: ${error}`);
      }

      const publishData = await publishResponse.json();
      const platformPostId = publishData.id;

      // If first comment was provided, post it as a reply (fire-and-forget)
      if (input.firstComment) {
        this.postReply(accessToken, platformPostId, input.firstComment).catch((replyError) => {
          const err = replyError instanceof Error ? replyError : new Error(String(replyError));
          logger.warn('Threads first comment reply failed', { error: err });
        });
      }

      // The numeric ID doesn't work directly in URLs. We must fetch the actual permalink (which uses a shortcode)
      let platformUrl = `https://www.threads.net/@${input.username || 'unknown'}/post/${platformPostId}`;
      
      try {
        const permalinkRes = await fetchWithRetry(
          `${THREADS_API_BASE}/${platformPostId}?fields=permalink&access_token=${accessToken}`,
          { method: 'GET' }
        );
        if (permalinkRes.ok) {
          const data = await permalinkRes.json();
          if (data.permalink) {
            platformUrl = data.permalink;
          }
        }
      } catch (err) {
        logger.warn('Failed to fetch permalink for Threads post', { 
          error: err instanceof Error ? err.message : String(err) 
        });
      }

      return {
        platformPostId,
        platformUrl,
        publishedAt: new Date(),
      };
    });
  }

  private async waitForContainerReady(accessToken: string, creationId: string, maxAttempts = 10): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const response = await fetchWithRetry(
        `${THREADS_API_BASE}/${creationId}?fields=status&access_token=${accessToken}`,
        {}
      );

      if (!response.ok) continue;

      const data = await response.json();
      if (data.status === 'FINISHED') return;
      if (data.status === 'ERROR') throw new Error('Container processing failed');
    }
    throw new Error('Container processing timeout');
  }

  private async postReply(accessToken: string, parentId: string, content: string): Promise<void> {
    const replyParams = new URLSearchParams({
      text: content,
      access_token: accessToken,
    });
    const response = await fetchWithRetry(`${THREADS_API_BASE}/${parentId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: replyParams.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Threads reply failed', { errorMessage: error, status: response.status });
      throw new Error(`Reply failed: ${error}`);
    }
  }

  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    return platformFetch('threads', async () => {
      const response = await fetchWithRetry(`${THREADS_API_BASE}/${platformPostId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Threads delete failed', { errorMessage: error, status: response.status });
        throw new Error(`Delete failed: ${error}`);
      }
    });
  }

  async getEngagement(accessToken: string, platformPostId: string): Promise<Record<string, unknown>> {
    return platformFetch('threads', async () => {
      const response = await fetchWithRetry(
        `${THREADS_API_BASE}/${platformPostId}?fields=like_count,replies_count,reposts_count,quotes_count&access_token=${accessToken}`,
        {}
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error('Threads engagement fetch failed', { errorMessage: error, status: response.status });
        return {};
      }

      const data = await response.json();
      return {
        likes: data.like_count || 0,
        replies: data.replies_count || 0,
        reposts: data.reposts_count || 0,
        quotes: data.quotes_count || 0,
      };
    });
  }
}

export const threadsAdapter = new ThreadsAdapter();