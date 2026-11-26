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
        'pages_show_list',
        'pages_read_engagement',
        'pages_read_user_content',
        'pages_manage_posts',
        'pages_manage_engagement',
        'pages_messaging',
        'pages_manage_metadata',
        'read_insights',
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

  async exchangeCodeForToken(code: string, codeVerifierOrRedirectUri?: string, redirectUri?: string): Promise<TokenResponse> {
    const effectiveRedirectUri =
      redirectUri ||
      (codeVerifierOrRedirectUri && codeVerifierOrRedirectUri.startsWith('http')
        ? codeVerifierOrRedirectUri
        : undefined) ||
      this.authConfig.redirectUri;
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
        `${FACEBOOK_API_BASE}/me?fields=id,name,picture&access_token=${accessToken}`,
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
        username: data.email || data.name || data.id,
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
      return (data.data || []).map((p: Record<string, unknown>) => ({
        id: String(p.id || ''),
        name: String(p.name || ''),
        category: String(p.category || ''),
        accessToken: String(p.access_token || p.accessToken || ''),
        tasks: Array.isArray(p.tasks) ? (p.tasks as string[]) : [],
      }));
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

      if (response.ok) {
        const data = (await response.json()) as { access_token?: string } | null;
        if (typeof data?.access_token === 'string' && data.access_token.length > 0) {
          return data.access_token;
        }
      } else {
        const error = await response.text();
        logger.warn('Direct Facebook page token fetch failed, falling back to /me/accounts', {
          errorMessage: error,
          status: response.status,
          pageId,
        });
      }

      const pages = await this.getUserPages(userAccessToken);
      const matched = pages.find((p) => p.id === pageId && p.accessToken);
      if (matched) {
        return matched.accessToken;
      }

      throw new Error(`Page token fetch failed for page ${pageId}`);
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

  private async waitForVideoReady(accessToken: string, videoId: string): Promise<void> {
    const delays = [3000, 4000, 5000, 6000, 8000, 10000, 10000, 10000, 10000, 10000];
    for (const delayMs of delays) {
      await new Promise(resolve => setTimeout(resolve, delayMs));

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

  private async resolveTokenForPost(accessToken: string, platformPostId: string): Promise<string> {
    const match = platformPostId.match(/^(\d+)_/);
    try {
      if (match) {
        const pageToken = await this.getPageAccessToken(accessToken, match[1]);
        return pageToken || accessToken;
      }
      // Video/photo posts may use a bare numeric ID without `{pageId}_`; resolve the Page token.
      if (/^\d+$/.test(platformPostId)) {
        const pages = await this.getUserPages(accessToken);
        return pages.find((p) => p.accessToken)?.accessToken || accessToken;
      }
    } catch {
      // Fall through to original token when Page lookup fails or token is already a Page token.
    }
    return accessToken;
  }

  private parseInsightValue(rawValue: unknown): number {
    if (typeof rawValue === 'number') {
      return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 0;
    }
    if (rawValue && typeof rawValue === 'object') {
      return Object.values(rawValue as Record<string, unknown>).reduce<number>((sum, v) => {
        return sum + (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);
      }, 0);
    }
    const num = Number(rawValue ?? 0);
    return Number.isFinite(num) && num > 0 ? num : 0;
  }

  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    return platformFetch('facebook', async () => {
      const token = await this.resolveTokenForPost(accessToken, platformPostId);
      const response = await fetchWithRetry(`${FACEBOOK_API_BASE}/${platformPostId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
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
      const token = await this.resolveTokenForPost(accessToken, platformPostId);
      let likes = 0;
      let comments = 0;
      let shares = 0;
      let mediaViews = 0;
      let uniqueMediaViews = 0;
      let legacyImpressions = 0;
      let engagedUsers = 0;
      let clicks = 0;
      const videoViews = 0;

      // Step 1: Standard Graph API post fields (reactions, comments, shares) — no read_insights required.
      const basicPromise = fetchWithRetry(
        `${FACEBOOK_API_BASE}/${platformPostId}?fields=shares,reactions.summary(total_count),comments.summary(total_count)&access_token=${token}`,
        { method: 'GET' },
        { maxRetries: 1 }
      )
        .then(async (basicRes) => {
          if (basicRes.ok) {
            const basicData = await basicRes.json().catch(() => ({}));
            likes = Number(basicData.reactions?.summary?.total_count ?? 0);
            comments = Number(basicData.comments?.summary?.total_count ?? 0);
            shares = Number(basicData.shares?.count ?? 0);
          } else {
            const errText = await basicRes.text().catch(() => '');
            logger.warn('Facebook basic post engagement fetch returned non-OK', {
              platformPostId,
              status: basicRes.status,
              errorMessage: errText.slice(0, 300),
            });
          }
        })
        .catch((basicErr) => {
          logger.warn('Facebook basic post engagement fetch threw', { platformPostId, error: basicErr });
        });

      // Step 2: Query each Insights metric independently so one deprecated or unsupported metric
      // (e.g. Meta retiring post_impressions / post_engaged_users with #100) does not fail the batch.
      const insightMetrics = [
        'post_media_view',
        'post_total_media_view_unique',
        'post_impressions',
        'post_clicks',
        'post_reactions_like_total',
      ] as const;

      const insightsPromise = Promise.allSettled(
        insightMetrics.map(async (metricName) => {
          const insightRes = await fetchWithRetry(
            `${FACEBOOK_API_BASE}/${platformPostId}/insights?metric=${metricName}&access_token=${token}`,
            { method: 'GET' },
            { maxRetries: 0 }
          );

          if (!insightRes.ok) {
            const errText = await insightRes.text().catch(() => '');
            logger.warn('Facebook insights metric request failed', {
              platformPostId,
              metric: metricName,
              status: insightRes.status,
              errorMessage: errText.slice(0, 300),
            });
            return;
          }

          const insightData = await insightRes.json().catch(() => ({}));
          for (const metric of insightData.data || []) {
            const values = metric.values || [];
            const latest = values[values.length - 1];
            const val = this.parseInsightValue(latest?.value);
            if (metric.name === 'post_media_view' && val > 0) mediaViews = val;
            if (metric.name === 'post_total_media_view_unique' && val > 0) uniqueMediaViews = val;
            if (metric.name === 'post_impressions' && val > 0) legacyImpressions = val;
            if (metric.name === 'post_engaged_users' && val > 0) engagedUsers = val;
            if ((metric.name === 'post_clicks' || metric.name === 'post_clicks_total') && val > 0) clicks = val;
            if (metric.name === 'post_reactions_like_total' && val > 0 && likes === 0) likes = val;
          }
        })
      );

      await Promise.all([basicPromise, insightsPromise]);

      const resolvedViews = mediaViews || uniqueMediaViews || legacyImpressions;

      return {
        impressions: resolvedViews,
        views: resolvedViews,
        reach: uniqueMediaViews,
        engagedUsers,
        likes,
        comments,
        clicks,
        shares,
        videoViews,
        hasRealData: (likes + comments + shares + resolvedViews) > 0,
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

      let fullSubscribed = false;
      try {
        const response = await fetchWithRetry(
          `${FACEBOOK_API_BASE}/${pageId}/subscribed_apps`,
          { method: 'POST', body: params }
        );
        fullSubscribed = Boolean(response.ok);
      } catch (err) {
        // fetchWithRetry throws AuthenticationError (403) / ValidationError (400) on non-2xx responses;
        // fall through to subscribe 'feed' only when 'pages_messaging' is not granted.
        logger.warn('Facebook page feed+messages subscription failed, falling back to feed only', {
          pageId,
          error: err instanceof Error ? err.message : String(err),
        });
      }

      if (fullSubscribed) {
        logger.info('Facebook page webhook subscribed', { pageId });
        return;
      }

      // Fallback: if 'messages' scope (pages_messaging) was not granted, still subscribe 'feed' for comment automation
      const feedOnlyParams = new URLSearchParams({
        subscribed_fields: 'feed',
        access_token: pageAccessToken,
      });
      const feedResponse = await fetchWithRetry(
        `${FACEBOOK_API_BASE}/${pageId}/subscribed_apps`,
        { method: 'POST', body: feedOnlyParams }
      );
      if (!feedResponse.ok) {
        const error = await feedResponse.text();
        logger.error('Facebook page webhook subscription failed', { errorMessage: error, pageId });
        throw new Error(`Page webhook subscription failed: ${error}`);
      }
      logger.info('Facebook page webhook subscribed (feed only)', { pageId });
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