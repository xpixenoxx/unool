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

const META_AUTH_URL = 'https://www.facebook.com/v20.0/dialog/oauth';
const META_TOKEN_URL = 'https://graph.facebook.com/v20.0/oauth/access_token';
const FACEBOOK_API_BASE = 'https://graph.facebook.com/v20.0';

export class FacebookAdapter implements PlatformAdapter {
  readonly platform = 'facebook' as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: config.META_CLIENT_ID || '',
    clientSecret: config.META_CLIENT_SECRET || '',
    redirectUri: config.META_REDIRECT_URI || '',
    scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
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

    return platformFetch('facebook', async () => {
      const response = await fetchWithRetry(`${META_TOKEN_URL}?${params.toString()}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Facebook token exchange failed', { errorMessage: error, status: response.status });
        throw new Error(`Token exchange failed: ${error}`);
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
    // Facebook uses th_exchange_token same as Threads
    const params = new URLSearchParams({
      grant_type: 'th_exchange_token',
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
      access_token: refreshToken,
    });

    return platformFetch('facebook', async () => {
      const response = await fetchWithRetry(`${META_TOKEN_URL}?${params.toString()}`, {});

      if (!response.ok) {
        const error = await response.text();
        logger.error('Facebook token refresh failed', { errorMessage: error, status: response.status });
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
    return platformFetch('facebook', async () => {
      const response = await fetchWithRetry(
        `${FACEBOOK_API_BASE}/me?fields=id,name,email,picture&access_token=${accessToken}`,
        {}
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error('Facebook profile fetch failed', { errorMessage: error, status: response.status });

        if (response.status === 401 || response.status === 403) {
          throw new TokenExpiredError('Token expired or invalid', 'facebook');
        }
        throw new Error(`Profile fetch failed: ${error}`);
      }

      const data = await response.json();
      return {
        platformUserId: data.id,
        username: data.email || data.id,
        displayName: data.name,
        profileUrl: `https://www.facebook.com/${data.id}`,
        avatarUrl: data.picture?.data?.url,
      };
    });
  }

  /**
   * Get user's Facebook Pages with their access tokens
   * Used during onboarding to let user select a page
   */
  async getUserPages(accessToken: string): Promise<Array<{
    id: string;
    name: string;
    category: string;
    accessToken: string;
    tasks: string[];
  }>> {
    return platformFetch('facebook', async () => {
      const response = await fetchWithRetry(
        `${FACEBOOK_API_BASE}/me/accounts?fields=id,name,category,access_token,tasks&access_token=${accessToken}`,
        {}
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error('Facebook pages fetch failed', { errorMessage: error, status: response.status });
        throw new Error(`Pages fetch failed: ${error}`);
      }

      const data = await response.json();
      return data.data || [];
    });
  }

  /**
   * Get page access token for a specific page
   */
  async getPageAccessToken(userAccessToken: string, pageId: string): Promise<string> {
    return platformFetch('facebook', async () => {
      const response = await fetchWithRetry(
        `${FACEBOOK_API_BASE}/${pageId}?fields=access_token&access_token=${userAccessToken}`,
        {}
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error('Facebook page token fetch failed', { errorMessage: error, status: response.status });
        throw new Error(`Page token fetch failed: ${error}`);
      }

      const data = await response.json();
      return data.access_token;
    });
  }

  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    return platformFetch('facebook', async () => {
      const mediaUrls = input.mediaUrls || [];
      let platformPostId: string;
      let platformUrl: string;

      if (mediaUrls.length === 0) {
        // Text post
        const result = await this.publishTextPost(accessToken, input.content);
        platformPostId = result.id;
        platformUrl = `https://www.facebook.com/${platformPostId}`;
      } else if (mediaUrls.length === 1) {
        const mediaUrl = mediaUrls[0];
        const isVideo = this.isVideoUrl(mediaUrl);

        if (isVideo) {
          // Video post
          const result = await this.publishVideoPost(accessToken, mediaUrl, input.content);
          platformPostId = result.id;
          platformUrl = `https://www.facebook.com/${platformPostId}`;
        } else {
          // Image post
          const result = await this.publishImagePost(accessToken, mediaUrl, input.content);
          platformPostId = result.id;
          platformUrl = `https://www.facebook.com/${platformPostId}`;
        }
      } else {
        // Multiple images - use multi-photo post
        const result = await this.publishMultiImagePost(accessToken, mediaUrls, input.content);
        platformPostId = result.id;
        platformUrl = `https://www.facebook.com/${platformPostId}`;
      }

      // If firstComment is provided, add it as a comment
      if (input.firstComment) {
        try {
          await this.addComment(accessToken, platformPostId, input.firstComment);
        } catch (commentError) {
          const err = commentError instanceof Error ? commentError : new Error(String(commentError));
          logger.warn('Facebook first comment failed', { error: err });
          // Don't fail the main post if comment fails
        }
      }

      return {
        platformPostId,
        platformUrl,
        publishedAt: new Date(),
      };
    });
  }

  private async publishTextPost(accessToken: string, message: string): Promise<{ id: string }> {
    const params = new URLSearchParams({
      message,
      access_token: accessToken,
    });

    const response = await fetchWithRetry(`${FACEBOOK_API_BASE}/me/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Facebook text post failed', { errorMessage: error, status: response.status });
      throw new Error(`Text post failed: ${error}`);
    }

    return response.json();
  }

  private async publishImagePost(accessToken: string, imageUrl: string, message: string): Promise<{ id: string }> {
    // First, upload photo as unpublished
    const uploadParams = new URLSearchParams({
      url: imageUrl,
      published: 'false',
      access_token: accessToken,
    });

    const uploadResponse = await fetchWithRetry(`${FACEBOOK_API_BASE}/me/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: uploadParams.toString(),
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      logger.error('Facebook photo upload failed', { errorMessage: error, status: uploadResponse.status });
      throw new Error(`Photo upload failed: ${error}`);
    }

    const uploadData = await uploadResponse.json();
    const mediaId = uploadData.id;

    // Now publish post with attached media
    const postParams = new URLSearchParams({
      message,
      attached_media: JSON.stringify([{ media_fbid: mediaId }]),
      access_token: accessToken,
    });

    const postResponse = await fetchWithRetry(`${FACEBOOK_API_BASE}/me/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: postParams.toString(),
    });

    if (!postResponse.ok) {
      const error = await postResponse.text();
      logger.error('Facebook image post failed', { errorMessage: error, status: postResponse.status });
      throw new Error(`Image post failed: ${error}`);
    }

    return postResponse.json();
  }

  private async publishMultiImagePost(accessToken: string, imageUrls: string[], message: string): Promise<{ id: string }> {
    // Upload all photos as unpublished
    const mediaIds: string[] = [];

    for (const imageUrl of imageUrls) {
      const uploadParams = new URLSearchParams({
        url: imageUrl,
        published: 'false',
        access_token: accessToken,
      });

      const uploadResponse = await fetchWithRetry(`${FACEBOOK_API_BASE}/me/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: uploadParams.toString(),
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.text();
        throw new Error(`Photo upload failed: ${error}`);
      }

      const uploadData = await uploadResponse.json();
      mediaIds.push(uploadData.id);
    }

    // Publish post with all attached media
    const postParams = new URLSearchParams({
      message,
      attached_media: JSON.stringify(mediaIds.map(id => ({ media_fbid: id }))),
      access_token: accessToken,
    });

    const postResponse = await fetchWithRetry(`${FACEBOOK_API_BASE}/me/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: postParams.toString(),
    });

    if (!postResponse.ok) {
      const error = await postResponse.text();
      throw new Error(`Multi-image post failed: ${error}`);
    }

    return postResponse.json();
  }

  private async publishVideoPost(accessToken: string, videoUrl: string, description: string): Promise<{ id: string }> {
    // Facebook video upload is async - upload then poll for status
    const uploadParams = new URLSearchParams({
      file_url: videoUrl,
      description,
      access_token: accessToken,
    });

    const uploadResponse = await fetchWithRetry(`${FACEBOOK_API_BASE}/me/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: uploadParams.toString(),
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      logger.error('Facebook video upload failed', { errorMessage: error, status: uploadResponse.status });
      throw new Error(`Video upload failed: ${error}`);
    }

    const uploadData = await uploadResponse.json();
    const videoId = uploadData.id;

    // Poll for video processing status
    await this.waitForVideoReady(accessToken, videoId);

    return { id: videoId };
  }

  private async waitForVideoReady(accessToken: string, videoId: string, maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetchWithRetry(
        `${FACEBOOK_API_BASE}/${videoId}?fields=status&access_token=${accessToken}`,
        {}
      );

      if (!response.ok) continue;

      const data = await response.json();
      if (data.status?.video_status === 'ready') return;
      if (data.status?.video_status === 'error') throw new Error('Video processing failed');
    }
    throw new Error('Video processing timeout');
  }

  private async addComment(accessToken: string, postId: string, message: string): Promise<void> {
    const params = new URLSearchParams({
      message,
      access_token: accessToken,
    });

    const response = await fetchWithRetry(`${FACEBOOK_API_BASE}/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Facebook comment failed', { errorMessage: error, status: response.status });
      throw new Error(`Comment failed: ${error}`);
    }
  }

  private isVideoUrl(url: string): boolean {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes('video/');
  }

  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    return platformFetch('facebook', async () => {
      const response = await fetchWithRetry(`${FACEBOOK_API_BASE}/${platformPostId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Facebook delete failed', { errorMessage: error, status: response.status });
        throw new Error(`Delete failed: ${error}`);
      }
    });
  }

  async getEngagement(accessToken: string, platformPostId: string): Promise<Record<string, unknown>> {
    return platformFetch('facebook', async () => {
      const metrics = [
        'post_impressions',
        'post_engaged_users',
        'post_reactions_like_total',
        'post_clicks_total',
        'post_shares',
        'post_video_views',
      ];

      const response = await fetchWithRetry(
        `${FACEBOOK_API_BASE}/${platformPostId}/insights?metric=${metrics.join(',')}&access_token=${accessToken}`,
        {}
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error('Facebook engagement fetch failed', { errorMessage: error, status: response.status });
        return {};
      }

      const data = await response.json();
      const results: Record<string, unknown> = {};

      for (const metric of data.data || []) {
        const values = metric.values || [];
        const latest = values[values.length - 1];
        if (latest?.value !== undefined) {
          results[metric.name] = latest.value;
        }
      }

      // Map to friendly names
      return {
        impressions: results.post_impressions || 0,
        engagedUsers: results.post_engaged_users || 0,
        likes: results.post_reactions_like_total || 0,
        clicks: results.post_clicks_total || 0,
        shares: results.post_shares || 0,
        videoViews: results.post_video_views || 0,
      };
    });
  }
}

export const facebookAdapter = new FacebookAdapter();