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
    clientId: config.FACEBOOK_CLIENT_ID || config.INSTAGRAM_CLIENT_ID || '',
    clientSecret: config.FACEBOOK_CLIENT_SECRET || config.INSTAGRAM_CLIENT_SECRET || '',
    redirectUri: config.INSTAGRAM_REDIRECT_URI || `${config.NEXT_PUBLIC_APP_URL}/api/auth/platform/callback`,
    scopes: [
      'public_profile',
      'email',
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
      grant_type: 'fb_exchange_token',
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
      fb_exchange_token: refreshToken,
    });

    return platformFetch('instagram', async () => {
      const response = await fetchWithRetry(
        `${META_TOKEN_URL}?${params.toString()}`,
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
      const profileResponse = await fetchWithRetry(
        `https://graph.instagram.com/v20.0/me?fields=id,username,name,profile_picture_url&access_token=${accessToken}`,
        {}
      );

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
      };
    });
  }

  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    return platformFetch('instagram', async () => {
      // Find the Instagram Business Account ID attached to the native user token
      const profileResponse = await fetchWithRetry(
        `https://graph.instagram.com/v20.0/me?fields=id&access_token=${accessToken}`,
        {}
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

        const containerRes = await fetchWithRetry(`https://graph.instagram.com/v20.0/${igAccountId}/media`, {
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
        const itemIds: string[] = [];
        for (const url of mediaUrls) {
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

          const itemRes = await fetchWithRetry(`https://graph.instagram.com/v20.0/${igAccountId}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: itemParams.toString(),
          });

          if (itemRes.ok) {
            itemIds.push((await itemRes.json()).id);
          } else {
            logger.warn('Failed to upload Instagram carousel item', { url, error: await itemRes.text() });
          }
        }

        if (itemIds.length === 0) {
          throw new Error('Failed to create any carousel items for Instagram');
        }

        // Wait for all individual carousel items to be ready before bundling them
        for (const itemId of itemIds) {
           await this.waitForMediaReady(accessToken, itemId);
        }

        // Create carousel container
        const carouselParams = new URLSearchParams({
          access_token: accessToken,
          caption: input.content || '',
          media_type: 'CAROUSEL',
          children: itemIds.join(','),
        });

        const carouselRes = await fetchWithRetry(`https://graph.instagram.com/v20.0/${igAccountId}/media`, {
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
        `https://graph.instagram.com/v20.0/${igAccountId}/media_publish`,
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
          `https://graph.instagram.com/v20.0/${platformPostId}?fields=permalink&access_token=${accessToken}`,
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
  
  private async waitForMediaReady(accessToken: string, containerId: string, maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        let statusRes;
        
        try {
          statusRes = await fetchWithRetry(
            `https://graph.instagram.com/v20.0/${containerId}?fields=status_code&access_token=${accessToken}`,
            {}
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
      const response = await fetchWithRetry(
        `https://graph.instagram.com/v20.0/${platformPostId}?fields=like_count,comments_count,views_count,shares_count&access_token=${accessToken}`,
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
