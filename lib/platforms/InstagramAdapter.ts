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

const META_AUTH_URL = 'https://www.instagram.com/oauth/authorize';
const META_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const FACEBOOK_API_BASE = `https://graph.facebook.com/${API_VERSIONS.facebook}`;

export class InstagramAdapter implements PlatformAdapter {
  readonly platform = 'instagram' as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: config.INSTAGRAM_CLIENT_ID || '',
    clientSecret: config.INSTAGRAM_CLIENT_SECRET || '',
    redirectUri: config.INSTAGRAM_REDIRECT_URI || `${config.NEXT_PUBLIC_APP_URL}/api/auth/platform/callback`,
    scopes: [
      'instagram_business_basic',
      'instagram_business_manage_messages',
      'instagram_business_manage_comments',
      'instagram_business_content_publish',
      'instagram_business_manage_insights'
    ],
  };

  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      redirect_uri: this.authConfig.redirectUri,
      scope: this.authConfig.scopes.join(','),
      response_type: 'code',
      auth_type: 'rerequest',
      force_reauth: 'true',
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

    return platformFetch('instagram', async () => {
      // Step 1: Exchange code for short-lived token (valid ~1 hour)
      const response = await fetchWithRetry(META_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Instagram token exchange failed', { errorMessage: error, status: response.status });
        throw new Error(`Token exchange failed: ${error}`);
      }

      const shortLivedData = await response.json();
      const shortLivedToken = shortLivedData.access_token;

      // Step 2: Exchange short-lived token for long-lived token (valid ~60 days)
      const longLivedParams = new URLSearchParams({
        grant_type: 'ig_exchange_token',
        client_secret: this.authConfig.clientSecret,
        access_token: shortLivedToken,
      });

      const longLivedResponse = await fetchWithRetry(
        `https://graph.instagram.com/access_token?${longLivedParams.toString()}`,
        {}
      );

      if (!longLivedResponse.ok) {
        const error = await longLivedResponse.text();
        logger.warn('Instagram long-lived token exchange failed, using short-lived token', { errorMessage: error });
        // Fall back to short-lived token
        return {
          accessToken: shortLivedToken,
          refreshToken: shortLivedToken,
          expiresIn: shortLivedData.expires_in || 3600,
          scope: shortLivedData.scope,
        };
      }

      const longLivedData = await longLivedResponse.json();
      
      return {
        accessToken: longLivedData.access_token,
        refreshToken: longLivedData.access_token,
        expiresIn: longLivedData.expires_in || 5184000,
        scope: shortLivedData.scope,
      };
    });
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'ig_refresh_token',
      access_token: refreshToken,
    });

    return platformFetch('instagram', async () => {
      const response = await fetchWithRetry(
        `https://graph.instagram.com/refresh_access_token?${params.toString()}`,
        {}
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error('Instagram token refresh failed', { errorMessage: error, status: response.status });
        throw new Error(`Token refresh failed: ${error}`);
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.access_token,
        expiresIn: data.expires_in,
      };
    });
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    return platformFetch('instagram', async () => {
      let profileResponse = await fetchWithRetry(
        `https://graph.instagram.com/${API_VERSIONS.instagram}/me?fields=id,username,name,profile_picture_url,user_id,account_type`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      // If full field query fails (e.g. unknown field for personal/creator accounts), fallback to core fields
      if (!profileResponse.ok) {
        logger.warn('Instagram full profile fetch failed, falling back to core fields (id,username)');
        profileResponse = await fetchWithRetry(
          `https://graph.instagram.com/${API_VERSIONS.instagram}/me?fields=id,username`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      }

      if (!profileResponse.ok) {
        if (profileResponse.status === 401 || profileResponse.status === 403) {
          throw new TokenExpiredError('Token expired or invalid', 'instagram');
        }
        const error = await profileResponse.text();
        throw new Error(`Failed to fetch Instagram profile: ${error}`);
      }

      const profileData = await profileResponse.json();

      return {
        platformUserId: profileData.id,
        username: profileData.username,
        displayName: profileData.name || profileData.username,
        profileUrl: `https://instagram.com/${profileData.username}`,
        avatarUrl: profileData.profile_picture_url,
        instagramBusinessAccountId: profileData.user_id || undefined,
        accountType: profileData.account_type || undefined,
      };
    });
  }

  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    return platformFetch('instagram', async () => {
      // Find the Instagram Business Account ID attached to the native user token
      const profileResponse = await fetchWithRetry(
        `https://graph.instagram.com/${API_VERSIONS.instagram}/me?fields=id`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        // Check for token expiry — Instagram returns 400 with code 190 for expired tokens
        if (profileResponse.status === 400 && (errorText.includes('190') || errorText.includes('OAuthException') || errorText.includes('Session has expired'))) {
          throw new TokenExpiredError('Instagram access token expired', 'instagram');
        }
        if (profileResponse.status === 401 || profileResponse.status === 403) {
          throw new TokenExpiredError('Instagram access token expired', 'instagram');
        }
        throw new Error(`Could not fetch instagram profile for publishing: ${errorText}`);
      }
      const profileData = await profileResponse.json();
      const igAccountId = profileData.id;

      if (!igAccountId) {
        throw new Error('No Instagram account ID found.');
      }

      if (!input.mediaUrls || input.mediaUrls.length === 0) {
        throw new Error('Instagram requires at least one image or video to publish.');
      }

      const mediaUrls = input.mediaUrls.slice(0, 10); // Instagram max 10 for carousel
      let creationId: string;

      if (mediaUrls.length === 1) {
        // Single media
        const mediaUrl = mediaUrls[0];
        const isVideo = this.isVideoUrl(mediaUrl);

        const containerParams = new URLSearchParams({
          access_token: accessToken,
          caption: input.content || '',
        });

        if (isVideo) {
          containerParams.append('media_type', 'REELS');
          containerParams.append('video_url', mediaUrl);
        } else {
          containerParams.append('image_url', mediaUrl);
        }

        const containerRes = await fetchWithRetry(`https://graph.instagram.com/${API_VERSIONS.instagram}/${igAccountId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: containerParams.toString(),
        });

        if (!containerRes.ok) {
          const error = await containerRes.text();
          throw new Error(`Instagram media container creation failed: ${error}`);
        }
        creationId = (await containerRes.json()).id;

        // Always wait for the media container to be ready (Instagram processes both images and videos asynchronously)
        await this.waitForMediaReady(accessToken, creationId);
      } else {
        // Carousel
        // Process carousel items in batches of 3 to avoid Instagram rate limiting / connection drops
        const itemIds: string[] = [];
        const batchSize = 3;
        
        for (let i = 0; i < mediaUrls.length; i += batchSize) {
          const batch = mediaUrls.slice(i, i + batchSize);
          const itemPromises = batch.map(async (url) => {
            const isVid = this.isVideoUrl(url);
            const itemParams = new URLSearchParams({
              access_token: accessToken,
              is_carousel_item: 'true',
            });

            if (isVid) {
              itemParams.append('media_type', 'VIDEO');
              itemParams.append('video_url', url);
            } else {
              itemParams.append('image_url', url);
            }

            const itemRes = await fetchWithRetry(`https://graph.instagram.com/${API_VERSIONS.instagram}/${igAccountId}/media`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: itemParams.toString(),
            });

            if (itemRes.ok) {
              return (await itemRes.json()).id as string;
            } else {
              logger.warn('Failed to upload Instagram carousel item', { url, error: await itemRes.text() });
              return null;
            }
          });

          const createdIds = await Promise.all(itemPromises);
          itemIds.push(...createdIds.filter((id): id is string => id !== null));
        }

        if (itemIds.length === 0) {
          throw new Error('Failed to create any carousel items for Instagram');
        }

        // Wait for all individual carousel items to be ready concurrently before bundling them
        await Promise.all(itemIds.map(itemId => this.waitForMediaReady(accessToken, itemId)));

        // Create carousel container
        const carouselParams = new URLSearchParams({
          access_token: accessToken,
          caption: input.content || '',
          media_type: 'CAROUSEL',
          children: itemIds.join(','),
        });

        const carouselRes = await fetchWithRetry(`https://graph.instagram.com/${API_VERSIONS.instagram}/${igAccountId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: carouselParams.toString(),
        });

        if (!carouselRes.ok) {
          const error = await carouselRes.text();
          throw new Error(`Instagram carousel container creation failed: ${error}`);
        }
        creationId = (await carouselRes.json()).id;

        // Wait for the carousel container itself to be ready
        await this.waitForMediaReady(accessToken, creationId);
      }

      // 2. Publish the Container
      const publishParams = new URLSearchParams({
        creation_id: creationId,
        access_token: accessToken,
      });

      const publishRes = await fetchWithRetry(
        `https://graph.instagram.com/${API_VERSIONS.instagram}/${igAccountId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: publishParams.toString(),
        }
      );

      if (!publishRes.ok) {
        const error = await publishRes.text();
        throw new Error(`Instagram publishing failed: ${error}`);
      }

      const publishData = await publishRes.json();
      const platformPostId = publishData.id;

      let permalink = '';
      try {
        const mediaRes = await fetchWithRetry(
          `https://graph.instagram.com/${API_VERSIONS.instagram}/${platformPostId}?fields=permalink`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (mediaRes.ok) {
          const mediaData = await mediaRes.json();
          permalink = mediaData.permalink;
        }
      } catch (err) {
        logger.warn('Could not fetch Instagram permalink', { error: err });
      }

      // If firstComment is provided, post it to the newly created media
      if (input.firstComment && input.firstComment.trim()) {
        try {
          const commentParams = new URLSearchParams({
            message: input.firstComment.trim(),
            access_token: accessToken,
          });
          const commentRes = await fetchWithRetry(
            `https://graph.instagram.com/${API_VERSIONS.instagram}/${platformPostId}/comments`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: commentParams.toString(),
            }
          );
          if (!commentRes.ok) {
            const commentErr = await commentRes.text();
            logger.warn('Failed to post first comment on Instagram', { platformPostId, error: commentErr });
          } else {
            logger.info('First comment posted on Instagram', { platformPostId });
          }
        } catch (err) {
          logger.warn('Error posting first comment on Instagram', { platformPostId, error: err });
        }
      }

      return {
        platformPostId,
        platformUrl: permalink || `https://instagram.com/`,
        publishedAt: new Date(),
      };
    });
  }

  private async waitForMediaReady(accessToken: string, containerId: string, maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      let statusRes;

      try {
        statusRes = await fetchWithRetry(
          `https://graph.instagram.com/${API_VERSIONS.instagram}/${containerId}?fields=status_code`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      } catch (err) {
        // fetch network error, skip attempt
        continue;
      }

      if (!statusRes.ok) continue;
      const statusData = await statusRes.json();

      if (statusData.status_code === 'FINISHED') return;
      if (statusData.status_code === 'ERROR') throw new Error('Instagram media processing failed or timed out on Meta servers.');
    }
    throw new Error('Instagram media processing timeout.');
  }

  private isVideoUrl(url: string): boolean {
    const videoExtensions = ['.mp4', '.mov'];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes('video/');
  }

  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    throw new Error('Instagram API does not currently support deleting posts via public API.');
  }

  async getEngagement(accessToken: string, platformPostId: string): Promise<Record<string, unknown>> {
    return platformFetch('instagram', async () => {
      // Step 1: Fetch basic engagement — like_count and comments_count are always
      // available on Business/Creator accounts. views_count and shares_count do NOT
      // exist on the Instagram Graph API Media object (they cause a #100 error that
      // rejects the entire request), so we fetch them separately via the Insights API.
      const response = await fetchWithRetry(
        `https://graph.instagram.com/${API_VERSIONS.instagram}/${platformPostId}?fields=like_count,comments_count,media_type`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        logger.error('Instagram getEngagement basic fetch failed', { platformPostId, status: response.status, body: errText });
        return {};
      }

      const data = await response.json();
      const baseEngagement: Record<string, unknown> = {
        likes: data.like_count ?? 0,
        comments: data.comments_count ?? 0,
        shares: 0,
        views: 0,
      };

      // Step 2: Fetch reach/views via Insights API.
      // Requires instagram_business_manage_insights scope (already in authConfig.scopes).
      // Meta Graph API v20+ supports 'views' and 'reach'.
      const isVideo = data.media_type === 'VIDEO' || data.media_type === 'REELS';
      const insightMetrics = isVideo ? 'views,reach,plays' : 'views,reach';

      try {
        let insightsResponse = await fetchWithRetry(
          `https://graph.instagram.com/${API_VERSIONS.instagram}/${platformPostId}/insights?metric=${insightMetrics}&access_token=${accessToken}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        // Fallback: If compound metric query failed (e.g. 'views' or 'plays' unsupported for this media),
        // query universal 'reach' alone
        if (!insightsResponse.ok) {
          insightsResponse = await fetchWithRetry(
            `https://graph.instagram.com/${API_VERSIONS.instagram}/${platformPostId}/insights?metric=reach&access_token=${accessToken}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
        }

        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json();
          const metrics: Array<{ name: string; values: Array<{ value: number }> }> = insightsData.data || [];
          for (const metric of metrics) {
            const val = metric.values?.[0]?.value ?? 0;
            if (metric.name === 'views' && val > 0) baseEngagement.views = val;
            if (metric.name === 'reach' && (!baseEngagement.views || Number(baseEngagement.views) === 0)) baseEngagement.views = val;
            if (metric.name === 'plays' && (!baseEngagement.views || Number(baseEngagement.views) === 0)) baseEngagement.views = val;
            if (metric.name === 'impressions') baseEngagement.impressions = val;
            if (metric.name === 'saved') baseEngagement.saved = val;
          }
        } else {
          const insightsErr = await insightsResponse.text().catch(() => '');
          logger.warn('Instagram insights fetch non-ok (non-critical)', { platformPostId, status: insightsResponse.status, body: insightsErr });
        }
      } catch (insightsError) {
        // Insights are non-critical — basic like/comment engagement is still returned
        logger.warn('Instagram insights fetch threw (non-critical)', { platformPostId, error: insightsError });
      }

      return baseEngagement;
    });
  }
}

export const instagramAdapter = new InstagramAdapter();
