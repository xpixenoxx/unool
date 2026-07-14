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

const META_AUTH_URL = 'https://www.facebook.com/v19.0/dialog/oauth';
const META_TOKEN_URL = 'https://graph.facebook.com/v19.0/oauth/access_token';
const THREADS_API_BASE = 'https://graph.threads.net/v1.0';

export class ThreadsAdapter implements PlatformAdapter {
  readonly platform = 'threads' as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: config.META_CLIENT_ID || '',
    clientSecret: config.META_CLIENT_SECRET || '',
    redirectUri: config.META_REDIRECT_URI || '',
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
      code,
    });

    const response = await fetch(`${META_TOKEN_URL}?${params.toString()}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Threads token exchange failed', { errorMessage: error, status: response.status });
      throw new Error(`Token exchange failed: ${error}`);
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
    // Threads uses long-lived tokens; refresh via Facebook OAuth
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
      fb_exchange_token: refreshToken,
    });

    const response = await fetch(`${META_TOKEN_URL}?${params.toString()}`);

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
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    const response = await fetch(
      `${THREADS_API_BASE}/me?fields=id,username,name,profile_picture_url,threads_biography&access_token=${accessToken}`
    );

    if (!response.ok) {
      const error = await response.text();
      logger.error('Threads profile fetch failed', { errorMessage: error, status: response.status });
      throw new Error(`Profile fetch failed: ${error}`);
    }

    const data = await response.json();
    return {
      platformUserId: data.id,
      username: data.username,
      displayName: data.name,
      profileUrl: `https://www.threads.net/@${data.username}`,
      avatarUrl: data.profile_picture_url,
    };
  }

  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    // First, create a media container
    const mediaType = input.mediaUrls && input.mediaUrls.length > 0 ? 'IMAGE' : 'TEXT';
    const mediaUrl = input.mediaUrls?.[0];

    const containerParams = new URLSearchParams({
      media_type: mediaType,
      access_token: accessToken,
    });

    if (mediaType === 'TEXT') {
      containerParams.set('text', input.content);
    } else if (mediaUrl) {
      containerParams.set('image_url', mediaUrl);
      containerParams.set('text', input.content);
    }

    // Add reply control if first comment is provided
    if (input.firstComment) {
      containerParams.set('reply_control', 'ALL');
    }

    const containerResponse = await fetch(`${THREADS_API_BASE}/me/threads?${containerParams.toString()}`, {
      method: 'POST',
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

    // Publish the container
    const publishResponse = await fetch(`${THREADS_API_BASE}/me/threads_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken,
      }),
    });

    if (!publishResponse.ok) {
      const error = await publishResponse.text();
      logger.error('Threads publish failed', { errorMessage: error, status: publishResponse.status });
      throw new Error(`Publish failed: ${error}`);
    }

    const publishData = await publishResponse.json();
    const platformPostId = publishData.id;

    // If first comment was provided, post it as a reply
    if (input.firstComment) {
      try {
        await this.postReply(accessToken, platformPostId, input.firstComment);
      } catch (replyError) {
        const err = replyError instanceof Error ? replyError : new Error(String(replyError));
        logger.warn('Threads first comment reply failed', { error: err });
        // Don't fail the main post if reply fails
      }
    }

    const platformUrl = `https://www.threads.net/@${(await this.getUserProfile(accessToken)).username}/post/${platformPostId}`;

    return {
      platformPostId,
      platformUrl,
      publishedAt: new Date(),
    };
  }

  private async waitForContainerReady(accessToken: string, creationId: string, maxAttempts = 10): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await fetch(
        `${THREADS_API_BASE}/${creationId}?fields=status&access_token=${accessToken}`
      );

      if (!response.ok) continue;

      const data = await response.json();
      if (data.status === 'FINISHED') return;
      if (data.status === 'ERROR') throw new Error('Container processing failed');
    }
    throw new Error('Container processing timeout');
  }

  private async postReply(accessToken: string, parentId: string, content: string): Promise<void> {
    const response = await fetch(`${THREADS_API_BASE}/${parentId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: content,
        access_token: accessToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Threads reply failed', { errorMessage: error, status: response.status });
      throw new Error(`Reply failed: ${error}`);
    }
  }

  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    const response = await fetch(`${THREADS_API_BASE}/${platformPostId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Threads delete failed', { errorMessage: error, status: response.status });
      throw new Error(`Delete failed: ${error}`);
    }
  }

  async getEngagement(accessToken: string, platformPostId: string): Promise<Record<string, unknown>> {
    const response = await fetch(
      `${THREADS_API_BASE}/${platformPostId}?fields=like_count,replies_count,reposts_count,quotes_count&access_token=${accessToken}`
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
  }
}

export const threadsAdapter = new ThreadsAdapter();