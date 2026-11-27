import { config } from '@/lib/config/schema';
import { API_VERSIONS, resolveInstagramApiHost } from '@/lib/platforms/apiVersions';
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

  get authConfig(): PlatformAuthConfig {
    return {
      clientId: config.INSTAGRAM_CLIENT_ID || process.env.INSTAGRAM_CLIENT_ID || '',
      clientSecret: config.INSTAGRAM_CLIENT_SECRET || process.env.INSTAGRAM_CLIENT_SECRET || '',
      redirectUri:
        config.INSTAGRAM_REDIRECT_URI ||
        process.env.INSTAGRAM_REDIRECT_URI ||
        `${(config.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '')}/api/auth/platform/callback`,
      scopes: [
        'instagram_business_basic',
        'instagram_business_manage_messages',
        'instagram_business_manage_comments',
        'instagram_business_content_publish',
        'instagram_business_manage_insights',
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
      force_reauth: 'true',
      state,
    });
    return `${META_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, _codeVerifier?: string, redirectUri?: string): Promise<TokenResponse> {
    const effectiveRedirectUri = redirectUri || this.authConfig.redirectUri;
    const params = new URLSearchParams({
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
      redirect_uri: effectiveRedirectUri,
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

      const shortLivedFallback = {
        accessToken: shortLivedToken,
        refreshToken: shortLivedToken,
        expiresIn: shortLivedData.expires_in || 3600,
        scope: shortLivedData.scope,
      };

      try {
        const longLivedResponse = await fetchWithRetry(
          `https://graph.instagram.com/access_token?${longLivedParams.toString()}`,
          {}
        );

        if (!longLivedResponse.ok) {
          const error = await longLivedResponse.text();
          logger.warn('Instagram long-lived token exchange failed, using short-lived token', { errorMessage: error });
          return shortLivedFallback;
        }

        const longLivedData = await longLivedResponse.json();
        return {
          accessToken: longLivedData.access_token,
          refreshToken: longLivedData.access_token,
          expiresIn: longLivedData.expires_in || 5184000,
          scope: shortLivedData.scope,
        };
      } catch (err) {
        if (err instanceof TokenExpiredError) {
          throw err;
        }
        logger.warn('Instagram long-lived token exchange threw error, using short-lived token', {
          errorMessage: err instanceof Error ? err.message : String(err),
        });
        return shortLivedFallback;
      }
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
      const encodedToken = encodeURIComponent(accessToken);
      const headers = { Authorization: `Bearer ${accessToken}` };
      let profileResponse: Response | null = null;

      try {
        const fullRes = await fetchWithRetry(
          `https://graph.instagram.com/${API_VERSIONS.instagram}/me?fields=id,username,name,profile_picture_url,user_id,account_type&access_token=${encodedToken}`,
          { headers }
        );
        if (fullRes.ok) {
          profileResponse = fullRes;
        } else {
          logger.warn('Instagram full profile fetch failed, falling back to core fields (id,username)');
        }
      } catch (err) {
        if (err instanceof TokenExpiredError) {
          throw err;
        }
        logger.warn('Instagram full profile fetch threw error, falling back to core fields (id,username)', {
          errorMessage: err instanceof Error ? err.message : String(err),
        });
      }

      if (!profileResponse) {
        try {
          const fallbackRes = await fetchWithRetry(
            `https://graph.instagram.com/${API_VERSIONS.instagram}/me?fields=id,username&access_token=${encodedToken}`,
            { headers }
          );
          if (!fallbackRes.ok) {
            if (fallbackRes.status === 401 || fallbackRes.status === 403) {
              throw new TokenExpiredError('Token expired or invalid', 'instagram');
            }
            const error = await fallbackRes.text();
            if (this.isMetaCode100UnsupportedGetError(error)) {
              throw new Error(InstagramAdapter.META_CODE_100_GUIDANCE);
            }
            throw new Error(`Failed to fetch Instagram profile: ${error}`);
          }
          profileResponse = fallbackRes;
        } catch (err) {
          if (err instanceof TokenExpiredError) {
            throw err;
          }
          const msg = err instanceof Error ? err.message : String(err);
          if (msg === InstagramAdapter.META_CODE_100_GUIDANCE) {
            throw err;
          }
          if (this.isMetaCode100UnsupportedGetError(msg)) {
            throw new Error(InstagramAdapter.META_CODE_100_GUIDANCE);
          }
          throw err;
        }
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

  private static readonly META_CODE_100_GUIDANCE =
    'Instagram could not complete this connection (Meta API code 100). Make sure this Instagram account is a Professional (Creator or Business) account, all requested permissions were approved, and—if the Meta app is not yet approved for Advanced Access—this account has accepted an Instagram Tester invite.';

  private isMetaCode100UnsupportedGetError(text: string): boolean {
    return (
      text.includes('IGApiException') &&
      (text.includes('"code":100') ||
        text.includes('"code": 100') ||
        text.includes('Unsupported request - method type: get'))
    );
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

        // Brief wait once, then poll carousel items with capped attempts to stay within Workers 50-subrequest limit
        await new Promise(resolve => setTimeout(resolve, 2500));
        await Promise.all(itemIds.map(itemId => this.waitForMediaReady(accessToken, itemId, 4, true)));

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

  private async waitForMediaReady(
    accessToken: string,
    containerId: string,
    maxAttempts = 8,
    skipInitialDelay = false
  ): Promise<void> {
    const backoffMs = [2000, 3000, 4000, 5000, 6000, 8000, 10000, 10000];
    const limit = Math.min(maxAttempts, backoffMs.length);
    for (let i = 0; i < limit; i++) {
      if (!(skipInitialDelay && i === 0)) {
        await new Promise(resolve => setTimeout(resolve, backoffMs[i]));
      }
      let statusRes;

      try {
        statusRes = await fetchWithRetry(
          `https://graph.instagram.com/${API_VERSIONS.instagram}/${containerId}?fields=status_code`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      } catch {
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

  async getEngagement(accessToken: string, platformPostId: string): Promise<Record<string, unknown>> {
    return platformFetch('instagram', async () => {
      const apiHost = resolveInstagramApiHost(accessToken);
      const authHeaders = { Authorization: `Bearer ${accessToken}` };

      // Step 1: Fetch basic engagement — like_count and comments_count are always
      // available on Business/Creator accounts. views/reach/saved/shares live on /insights.
      const response = await fetchWithRetry(
        `${apiHost}/${API_VERSIONS.instagram}/${platformPostId}?fields=like_count,comments_count,media_type`,
        { headers: authHeaders }
      );

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        logger.error('Instagram getEngagement basic fetch failed', { platformPostId, status: response.status, body: errText });
        return {};
      }

      const data = await response.json();
      const likes = Number(data.like_count ?? 0) || 0;
      const comments = Number(data.comments_count ?? 0) || 0;
      const isVideo = data.media_type === 'VIDEO' || data.media_type === 'REELS';

      // Step 2: Query each Insights metric individually in parallel so an unsupported
      // metric (e.g. Meta #100 on `plays` or `shares` for an older/specific media type)
      // never fails `views`, `reach`, or `saved`.
      const metricValues = new Map<string, number>();
      const candidateMetrics = isVideo
        ? ['views', 'reach', 'saved', 'shares', 'plays']
        : ['views', 'reach', 'saved', 'shares'];

      await Promise.allSettled(
        candidateMetrics.map(async (metricName) => {
          try {
            const insightsRes = await fetchWithRetry(
              `${apiHost}/${API_VERSIONS.instagram}/${platformPostId}/insights?metric=${metricName}&access_token=${encodeURIComponent(accessToken)}`,
              { headers: authHeaders },
              { maxRetries: 1 }
            );
            if (!insightsRes.ok) return;
            const insightsData = await insightsRes.json().catch(() => ({}));
            const entries: Array<{ name?: string; values?: Array<{ value?: unknown }>; total_value?: { value?: unknown } }> =
              insightsData.data || [];
            for (const entry of entries) {
              const name = entry.name || metricName;
              const rawVal = entry.total_value?.value ?? entry.values?.[0]?.value ?? 0;
              metricValues.set(name, this.parseInsightValue(rawVal));
            }
          } catch (insightErr) {
            logger.debug('Instagram single insight metric unavailable (non-critical)', {
              platformPostId,
              metricName,
              error: insightErr instanceof Error ? insightErr.message : String(insightErr),
            });
          }
        })
      );

      const viewsVal = metricValues.get('views') ?? 0;
      const reachVal = metricValues.get('reach') ?? 0;
      const playsVal = metricValues.get('plays') ?? 0;
      const savedVal = metricValues.get('saved') ?? 0;
      const sharesVal = metricValues.get('shares') ?? 0;
      const resolvedViews = viewsVal > 0 ? viewsVal : reachVal > 0 ? reachVal : playsVal;

      return {
        likes,
        comments,
        shares: sharesVal,
        saves: savedVal,
        saved: savedVal,
        views: resolvedViews,
        reach: reachVal,
        hasRealData: likes + comments + sharesVal + savedVal + resolvedViews > 0,
      };
    });
  }
}

export const instagramAdapter = new InstagramAdapter();
