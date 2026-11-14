import { config } from '@/lib/config/schema';
import { API_VERSIONS } from '@/lib/platforms/apiVersions';
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
import { formatFacebookPostUrl, normalizeFacebookUrl } from './facebookUrl';

const META_AUTH_URL = `https://www.facebook.com/${API_VERSIONS.facebook}/dialog/oauth`;
const META_TOKEN_URL = `https://graph.facebook.com/${API_VERSIONS.facebook}/oauth/access_token`;
const FACEBOOK_API_BASE = `https://graph.facebook.com/${API_VERSIONS.facebook}`;

export class FacebookAdapter implements PlatformAdapter {
  readonly platform = 'facebook' as const;

  get authConfig(): PlatformAuthConfig {
    const clientId =
      config.FACEBOOK_CLIENT_ID ||
      process.env.FACEBOOK_CLIENT_ID ||
      process.env.FACEBOOK_APP_ID ||
      process.env.META_CLIENT_ID ||
      process.env.META_APP_ID ||
      '';
    const clientSecret =
      config.FACEBOOK_CLIENT_SECRET ||
      process.env.FACEBOOK_CLIENT_SECRET ||
      process.env.FACEBOOK_APP_SECRET ||
      process.env.META_CLIENT_SECRET ||
      process.env.META_APP_SECRET ||
      '';
    const redirectUri =
      config.FACEBOOK_REDIRECT_URI ||
      process.env.FACEBOOK_REDIRECT_URI ||
      process.env.META_REDIRECT_URI ||
      `${config.NEXT_PUBLIC_APP_URL}/api/auth/platform/callback`;

    return {
      clientId,
      clientSecret,
      redirectUri,
      scopes: [
        'public_profile',
        'email',
        'pages_show_list',
        'pages_read_engagement',
        'pages_manage_posts',
        'pages_manage_engagement',
        'pages_messaging',
        'pages_manage_metadata',
      ],
    };
  }

  getAuthUrl(state: string, redirectUri?: string): string {
    const effectiveRedirectUri = redirectUri || this.authConfig.redirectUri;
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      redirect_uri: effectiveRedirectUri,
      scope: this.authConfig.scopes.join(','),
      response_type: 'code',
      auth_type: 'rerequest',
      state,
    });
    return `${META_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri?: string): Promise<TokenResponse> {
    const effectiveRedirectUri = redirectUri || this.authConfig.redirectUri;
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
      redirect_uri: effectiveRedirectUri,
      grant_type: 'authorization_code',
      code,
    });

    return platformFetch('facebook', async () => {
      // Step 1: Exchange code for user access token
      const response = await fetchWithRetry(`${META_TOKEN_URL}?${params.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Facebook token exchange failed', { errorMessage: error, status: response.status });
        throw new Error(`Token exchange failed: ${error}`);
      }

      const shortLivedData = await response.json();
      const shortLivedToken = shortLivedData.access_token;

      // Step 2: Exchange for long-lived (60 days) token using fb_exchange_token
      try {
        const longLivedParams = new URLSearchParams({
          grant_type: 'fb_exchange_token',
          client_id: this.authConfig.clientId,
          client_secret: this.authConfig.clientSecret,
          fb_exchange_token: shortLivedToken,
        });

        const longLivedResponse = await fetchWithRetry(
          `${META_TOKEN_URL}?${longLivedParams.toString()}`,
          { method: 'GET' }
        );

        if (longLivedResponse.ok) {
          const longLivedData = await longLivedResponse.json();
          logger.info('Facebook long-lived token obtained', { expiresIn: longLivedData.expires_in });
          return {
            accessToken: longLivedData.access_token,
            refreshToken: longLivedData.access_token,
            expiresIn: longLivedData.expires_in || 5184000,
            scope: shortLivedData.scope,
          };
        } else {
          const errText = await longLivedResponse.text();
          logger.warn('Facebook long-lived token exchange non-ok, using short-lived', { error: errText });
        }
      } catch (err) {
        logger.warn('Facebook long-lived token exchange failed, using short-lived', { error: err });
      }

      return {
        accessToken: shortLivedToken,
        refreshToken: shortLivedToken,
        expiresIn: shortLivedData.expires_in || 3600,
        scope: shortLivedData.scope,
      };
    });
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    // Facebook uses fb_exchange_token to extend/refresh access tokens
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
      fb_exchange_token: refreshToken,
    });

    return platformFetch('facebook', async () => {
      const response = await fetchWithRetry(`${META_TOKEN_URL}?${params.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Facebook token refresh failed', { errorMessage: error, status: response.status });
        throw new Error(`Token refresh failed: ${error}`);
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.access_token,
        expiresIn: data.expires_in || 5184000,
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
      // 1. Fetch user's pages to implicitly get a Page Access Token and Page ID
      const pagesRes = await fetchWithRetry(
        `${FACEBOOK_API_BASE}/me/accounts?fields=id,access_token&access_token=${accessToken}`,
        {}
      );
      if (!pagesRes.ok) {
        const errText = await pagesRes.text();
        throw new Error(`Failed to fetch Facebook Pages: ${errText}`);
      }
      const pagesData = await pagesRes.json();
      if (!pagesData.data || pagesData.data.length === 0) {
        throw new Error('No Facebook Pages found. You must create at least one Facebook Page to publish.');
      }

      const page = pagesData.data[0];
      const pageAccessToken = page.access_token;
      const pageId = page.id;

      const mediaUrls = input.mediaUrls || [];
      let platformPostId: string;
      let platformUrl: string;

      if (mediaUrls.length === 0) {
        // Text post
        const result = await this.publishTextPost(pageAccessToken, pageId, input.content);
        platformPostId = result.id;
        platformUrl = await this.resolvePostPermalink(pageAccessToken, platformPostId, pageId);
      } else if (mediaUrls.length === 1) {
        const mediaUrl = mediaUrls[0];
        const isVideo = this.isVideoUrl(mediaUrl);

        if (isVideo) {
          // Video post
          const result = await this.publishVideoPost(pageAccessToken, pageId, mediaUrl, input.content);
          platformPostId = result.id;
          platformUrl = await this.resolvePostPermalink(pageAccessToken, platformPostId, pageId, true);
        } else {
          // Image post
          const result = await this.publishImagePost(pageAccessToken, pageId, mediaUrl, input.content);
          platformPostId = result.id;
          platformUrl = await this.resolvePostPermalink(pageAccessToken, platformPostId, pageId);
        }
      } else {
        // Multiple images - use multi-photo post
        const result = await this.publishMultiImagePost(pageAccessToken, pageId, mediaUrls, input.content);
        platformPostId = result.id;
        platformUrl = await this.resolvePostPermalink(pageAccessToken, platformPostId, pageId);
      }

      // If firstComment is provided, add it as a comment using the Page Access Token
      if (input.firstComment) {
        try {
          await this.addComment(pageAccessToken, platformPostId, input.firstComment);
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

  private async publishTextPost(pageAccessToken: string, pageId: string, message: string): Promise<{ id: string }> {
    const params = new URLSearchParams({
      message,
      access_token: pageAccessToken,
    });

    const response = await fetchWithRetry(`${FACEBOOK_API_BASE}/${pageId}/feed`, {
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

  private async publishImagePost(pageAccessToken: string, pageId: string, imageUrl: string, message: string): Promise<{ id: string }> {
    // First, upload photo as unpublished
    const uploadParams = new URLSearchParams({
      url: imageUrl,
      published: 'false',
      access_token: pageAccessToken,
    });

    const uploadResponse = await fetchWithRetry(`${FACEBOOK_API_BASE}/${pageId}/photos`, {
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
      access_token: pageAccessToken,
    });

    const postResponse = await fetchWithRetry(`${FACEBOOK_API_BASE}/${pageId}/feed`, {
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

  private async publishMultiImagePost(pageAccessToken: string, pageId: string, imageUrls: string[], message: string): Promise<{ id: string }> {
    // Upload all photos as unpublished
    const mediaIds: string[] = [];

    for (const imageUrl of imageUrls) {
      const uploadParams = new URLSearchParams({
        url: imageUrl,
        published: 'false',
        access_token: pageAccessToken,
      });

      const uploadResponse = await fetchWithRetry(`${FACEBOOK_API_BASE}/${pageId}/photos`, {
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
      access_token: pageAccessToken,
    });

    const postResponse = await fetchWithRetry(`${FACEBOOK_API_BASE}/${pageId}/feed`, {
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

  private async publishVideoPost(pageAccessToken: string, pageId: string, videoUrl: string, description: string): Promise<{ id: string }> {
    // Facebook video upload is async - upload then poll for status
    const uploadParams = new URLSearchParams({
      file_url: videoUrl,
      description,
      access_token: pageAccessToken,
    });

    const uploadResponse = await fetchWithRetry(`${FACEBOOK_API_BASE}/${pageId}/videos`, {
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
    await this.waitForVideoReady(pageAccessToken, videoId);

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

  /**
   * Resolves the canonical live URL for a published Facebook post or video.
   * Queries the Graph API for the post's permalink_url using the Page Access Token.
   * If Graph API returns permalink_url, returns it directly.
   * Otherwise, falls back to the deterministic canonical post URL (facebook.com/{pageId}/posts/{postId}).
   */
  async resolvePostPermalink(
    pageAccessToken: string,
    platformPostId: string,
    pageId?: string,
    isVideo = false
  ): Promise<string> {
    const fallbackUrl = formatFacebookPostUrl(platformPostId, pageId, isVideo);

    try {
      const response = await fetchWithRetry(
        `${FACEBOOK_API_BASE}/${platformPostId}?fields=permalink_url&access_token=${pageAccessToken}`,
        { method: 'GET' },
        { maxRetries: 0 }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && typeof data.permalink_url === 'string' && data.permalink_url.trim().length > 0) {
          return data.permalink_url.trim();
        }
      } else {
        const errText = await response.text();
        logger.warn('Facebook permalink_url query returned non-ok status, using canonical fallback', {
          status: response.status,
          error: errText,
          platformPostId,
        });
      }
    } catch (err) {
      logger.warn('Facebook permalink_url query failed, using canonical fallback', {
        error: err instanceof Error ? err.message : String(err),
        platformPostId,
      });
    }

    return fallbackUrl;
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
      let likes = 0;
      let comments = 0;
      let shares = 0;
      let impressions = 0;
      let engagedUsers = 0;
      let clicks = 0;
      let videoViews = 0;

      // Step 1: Query standard Graph API post object fields (reactions, comments, shares)
      // This is supported on all Facebook Page posts without requiring read_insights permission.
      try {
        const basicRes = await fetchWithRetry(
          `${FACEBOOK_API_BASE}/${platformPostId}?fields=shares,reactions.summary(total_count),comments.summary(total_count)&access_token=${accessToken}`,
          { method: 'GET' },
          { maxRetries: 1 }
        );

        if (basicRes.ok) {
          const basicData = await basicRes.json().catch(() => ({}));
          likes = Number(basicData.reactions?.summary?.total_count ?? 0);
          comments = Number(basicData.comments?.summary?.total_count ?? 0);
          shares = Number(basicData.shares?.count ?? 0);
        }
      } catch (basicErr) {
        logger.warn('Facebook basic post engagement fetch threw', { platformPostId, error: basicErr });
      }

      // Step 2: Query Page Post Insights for reach/impressions and engaged users.
      // Metrics are separated so that an unsupported video metric on a text/image post
      // does not cause Meta API #100 error and fail the entire request.
      try {
        const insightRes = await fetchWithRetry(
          `${FACEBOOK_API_BASE}/${platformPostId}/insights?metric=post_impressions,post_engaged_users,post_clicks_total,post_reactions_like_total&access_token=${accessToken}`,
          { method: 'GET' },
          { maxRetries: 1 }
        );

        if (insightRes.ok) {
          const insightData = await insightRes.json().catch(() => ({}));
          for (const metric of insightData.data || []) {
            const values = metric.values || [];
            const latest = values[values.length - 1];
            const val = Number(latest?.value ?? 0);
            if (metric.name === 'post_impressions' && val > 0) impressions = val;
            if (metric.name === 'post_engaged_users' && val > 0) engagedUsers = val;
            if (metric.name === 'post_clicks_total' && val > 0) clicks = val;
            if (metric.name === 'post_reactions_like_total' && val > 0 && likes === 0) likes = val;
          }
        }
      } catch (insightErr) {
        logger.warn('Facebook insights fetch threw (non-critical)', { platformPostId, error: insightErr });
      }

      return {
        impressions,
        views: impressions,
        engagedUsers,
        likes,
        comments,
        clicks,
        shares,
        videoViews,
        hasRealData: (likes + comments + shares + impressions) > 0,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Comment & Messenger automation methods (B-11)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Subscribe a Facebook Page to webhook fields (feed + messages).
   * Must be called after OAuth with the Page Access Token.
   */
  async subscribePageWebhook(pageAccessToken: string, pageId: string): Promise<void> {
    return platformFetch('facebook', async () => {
      const params = new URLSearchParams({
        subscribed_fields: 'feed,messages',
        access_token: pageAccessToken,
      });
      const response = await fetchWithRetry(
        `${FACEBOOK_API_BASE}/${pageId}/subscribed_apps`,
        { method: 'POST', body: params }
      );
      if (!response.ok) {
        const error = await response.text();
        logger.error('Facebook page webhook subscription failed', { errorMessage: error, pageId });
        throw new Error(`Page webhook subscription failed: ${error}`);
      }
      logger.info('Facebook page webhook subscribed', { pageId });
    });
  }

  /**
   * Post a public reply to a comment on a Facebook Page post.
   * Requires Page Access Token and pages_manage_engagement scope.
   */
  async postCommentReply(pageAccessToken: string, commentId: string, message: string): Promise<{ id: string }> {
    return platformFetch('facebook', async () => {
      const params = new URLSearchParams({ message, access_token: pageAccessToken });
      const response = await fetchWithRetry(
        `${FACEBOOK_API_BASE}/${commentId}/comments`,
        { method: 'POST', body: params }
      );
      if (!response.ok) {
        const error = await response.text();
        logger.error('Facebook comment reply failed', { errorMessage: error, commentId });
        throw new Error(`Comment reply failed: ${error}`);
      }
      return response.json() as Promise<{ id: string }>;
    });
  }

  /**
   * Send a Messenger private reply initiated from a Page comment.
   * Requires Page Access Token and pages_messaging scope.
   * Meta allows this within 7 days of the original comment.
   */
  async sendPrivateReplyFromComment(
    pageAccessToken: string,
    pageId: string,
    commentId: string,
    message: string
  ): Promise<{ message_id: string }> {
    return platformFetch('facebook', async () => {
      const body = JSON.stringify({
        recipient: { comment_id: commentId },
        message: { text: message },
        messaging_type: 'RESPONSE',
        access_token: pageAccessToken,
      });
      const response = await fetchWithRetry(
        `${FACEBOOK_API_BASE}/${pageId}/messages`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }
      );
      if (!response.ok) {
        const error = await response.text();
        logger.error('Facebook private reply from comment failed', { errorMessage: error, commentId, pageId });
        throw new Error(`Private reply failed: ${error}`);
      }
      return response.json() as Promise<{ message_id: string }>;
    });
  }

  /**
   * Send a Messenger message to a user (24-hour window after last user message).
   */
  async sendMessengerMessage(
    pageAccessToken: string,
    pageId: string,
    recipientId: string,
    message: string
  ): Promise<{ message_id: string }> {
    return platformFetch('facebook', async () => {
      const body = JSON.stringify({
        recipient: { id: recipientId },
        message: { text: message },
        messaging_type: 'RESPONSE',
        access_token: pageAccessToken,
      });
      const response = await fetchWithRetry(
        `${FACEBOOK_API_BASE}/${pageId}/messages`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }
      );
      if (!response.ok) {
        const error = await response.text();
        logger.error('Facebook Messenger message failed', { errorMessage: error, recipientId, pageId });
        throw new Error(`Messenger message failed: ${error}`);
      }
      return response.json() as Promise<{ message_id: string }>;
    });
  }

  /**
   * Hide or unhide a comment on a Facebook Page post.
   * Requires Page Access Token and pages_manage_engagement scope.
   */
  async hideComment(pageAccessToken: string, commentId: string, hide: boolean): Promise<void> {
    return platformFetch('facebook', async () => {
      const params = new URLSearchParams({
        is_hidden: String(hide),
        access_token: pageAccessToken,
      });
      const response = await fetchWithRetry(
        `${FACEBOOK_API_BASE}/${commentId}`,
        { method: 'POST', body: params }
      );
      if (!response.ok) {
        const error = await response.text();
        logger.error('Facebook hide comment failed', { errorMessage: error, commentId, hide });
        throw new Error(`Hide comment failed: ${error}`);
      }
    });
  }
}

export const facebookAdapter = new FacebookAdapter();
export { formatFacebookPostUrl, normalizeFacebookUrl } from './facebookUrl';