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

export class InstagramAdapter implements PlatformAdapter {
  readonly platform = 'instagram' as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: config.FACEBOOK_CLIENT_ID || '',
    clientSecret: config.FACEBOOK_CLIENT_SECRET || '',
    redirectUri: config.FACEBOOK_REDIRECT_URI || `${config.NEXT_PUBLIC_APP_URL}/api/auth/platform/callback`,
    scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list', 'pages_read_engagement'],
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

    return platformFetch('instagram', async () => {
      const response = await fetchWithRetry(`${META_TOKEN_URL}?${params.toString()}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('Instagram token exchange failed', { errorMessage: error, status: response.status });
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
    const params = new URLSearchParams({
      grant_type: 'th_exchange_token', // Using same extension pattern as Threads/Facebook
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
      access_token: refreshToken,
    });

    return platformFetch('instagram', async () => {
      const response = await fetchWithRetry(`${META_TOKEN_URL}?${params.toString()}`, {});

      if (!response.ok) {
        const error = await response.text();
        logger.error('Instagram token refresh failed', { errorMessage: error, status: response.status });
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
    return platformFetch('instagram', async () => {
      // 1. Fetch user's pages
      const pagesResponse = await fetchWithRetry(
        `${FACEBOOK_API_BASE}/me/accounts?fields=id,name,instagram_business_account&access_token=${accessToken}`,
        {}
      );

      if (!pagesResponse.ok) {
        if (pagesResponse.status === 401 || pagesResponse.status === 403) {
          throw new TokenExpiredError('Token expired or invalid', 'instagram');
        }
        const error = await pagesResponse.text();
        throw new Error(`Failed to fetch Facebook pages: ${error}`);
      }

      const pagesData = await pagesResponse.json();
      const pages = pagesData.data || [];

      // Find first page with an associated Instagram business account
      let igBusinessAccountId: string | null = null;
      for (const page of pages) {
        if (page.instagram_business_account?.id) {
          igBusinessAccountId = page.instagram_business_account.id;
          break;
        }
      }

      if (!igBusinessAccountId) {
        throw new Error('No Instagram Business or Creator account found linked to your Facebook pages.');
      }

      // 2. Fetch IG account profile details
      const profileResponse = await fetchWithRetry(
        `${FACEBOOK_API_BASE}/${igBusinessAccountId}?fields=id,username,name,profile_picture_url&access_token=${accessToken}`,
        {}
      );

      if (!profileResponse.ok) {
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
      };
    });
  }

  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    return platformFetch('instagram', async () => {
      // Find the Instagram Business Account ID attached to the user token
      const pagesResponse = await fetchWithRetry(
        `${FACEBOOK_API_BASE}/me/accounts?fields=instagram_business_account&access_token=${accessToken}`,
        {}
      );
      if (!pagesResponse.ok) {
        throw new Error('Could not fetch pages for publishing');
      }
      const pagesData = await pagesResponse.json();
      const page = pagesData.data?.find((p: any) => p.instagram_business_account?.id);
      
      if (!page) {
        throw new Error('No linked Instagram Business account found.');
      }
      
      const igAccountId = page.instagram_business_account.id;

      if (!input.mediaUrls || input.mediaUrls.length === 0) {
        throw new Error('Instagram requires at least one image or video to publish.');
      }

      const mediaUrl = input.mediaUrls[0];
      const isVideo = this.isVideoUrl(mediaUrl);
      
      // 1. Create Media Container
      const containerParams = new URLSearchParams({
        access_token: accessToken,
        caption: input.content || '',
      });
      
      if (isVideo) {
        containerParams.append('media_type', 'REELS'); // Publish as Reel
        containerParams.append('video_url', mediaUrl);
      } else {
        containerParams.append('image_url', mediaUrl);
      }

      const containerRes = await fetchWithRetry(
        `${FACEBOOK_API_BASE}/${igAccountId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: containerParams.toString(),
        }
      );

      if (!containerRes.ok) {
        const error = await containerRes.text();
        throw new Error(`Instagram media container creation failed: ${error}`);
      }

      const containerData = await containerRes.json();
      const creationId = containerData.id;

      // 2. Publish the Container (Wait for video processing if applicable)
      if (isVideo) {
        await this.waitForVideoReady(accessToken, creationId);
      }

      const publishParams = new URLSearchParams({
        creation_id: creationId,
        access_token: accessToken,
      });

      const publishRes = await fetchWithRetry(
        `${FACEBOOK_API_BASE}/${igAccountId}/media_publish`,
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
          `${FACEBOOK_API_BASE}/${platformPostId}?fields=permalink&access_token=${accessToken}`,
          {}
        );
        if (mediaRes.ok) {
          const mediaData = await mediaRes.json();
          permalink = mediaData.permalink;
        }
      } catch (err) {
        logger.warn('Could not fetch Instagram permalink', { error: err });
      }

      return {
        platformPostId,
        platformUrl: permalink || `https://instagram.com/`,
        publishedAt: new Date(),
      };
    });
  }
  
  private async waitForVideoReady(accessToken: string, containerId: string, maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const statusRes = await fetchWithRetry(
          `${FACEBOOK_API_BASE}/${containerId}?fields=status_code&access_token=${accessToken}`,
          {}
        );
        
        if (!statusRes.ok) continue;
        const statusData = await statusRes.json();
        
        if (statusData.status_code === 'FINISHED') return;
        if (statusData.status_code === 'ERROR') throw new Error('Instagram video processing failed.');
    }
    throw new Error('Instagram video processing timeout.');
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
      const response = await fetchWithRetry(
        `${FACEBOOK_API_BASE}/${platformPostId}?fields=like_count,comments_count,views_count,shares_count&access_token=${accessToken}`,
        {}
      );

      if (!response.ok) {
        return {};
      }

      const data = await response.json();
      return {
        likes: data.like_count || 0,
        comments: data.comments_count || 0,
        views: data.views_count || 0,
        shares: data.shares_count || 0,
      };
    });
  }
}

export const instagramAdapter = new InstagramAdapter();
