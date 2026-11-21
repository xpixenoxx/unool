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

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3/videos';

export class YoutubeAdapter implements PlatformAdapter {
  readonly platform = 'youtube' as const;

  get authConfig(): PlatformAuthConfig {
    return {
      clientId: config.YOUTUBE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID || '',
      clientSecret: config.YOUTUBE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET || '',
      redirectUri:
        config.YOUTUBE_REDIRECT_URI ||
        process.env.YOUTUBE_REDIRECT_URI ||
        `${(config.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '')}/api/auth/platform/callback`,
      scopes: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.readonly',
        'openid',
        'email',
        'profile',
      ],
    };
  }

  getAuthUrl(state: string, redirectUri?: string): string {
    const effectiveRedirectUri = redirectUri || this.authConfig.redirectUri;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.authConfig.clientId,
      redirect_uri: effectiveRedirectUri,
      state,
      scope: this.authConfig.scopes.join(' '),
      access_type: 'offline', // Need offline access to get a refresh token
      prompt: 'consent', // Force consent screen to guarantee refresh token
    });
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, _codeVerifier?: string, redirectUri?: string): Promise<TokenResponse> {
    const effectiveRedirectUri = redirectUri || this.authConfig.redirectUri;
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: effectiveRedirectUri,
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
    });

    return platformFetch('youtube', async () => {
      const response = await fetchWithRetry(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('YouTube token exchange failed', { errorMessage: error, status: response.status });
        throw new Error(`YouTube token exchange failed: ${error}`);
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
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: this.authConfig.clientId,
      client_secret: this.authConfig.clientSecret,
    });

    return platformFetch('youtube', async () => {
      const response = await fetchWithRetry(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('YouTube token refresh failed', { errorMessage: error, status: response.status });
        throw new Error(`YouTube token refresh failed: ${error}`);
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken, // Google normally doesn't return a new refresh token here
        expiresIn: data.expires_in,
        scope: data.scope,
      };
    });
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    return platformFetch('youtube', async () => {
      const profileResponse = await fetchWithRetry(`${YOUTUBE_API_BASE}/channels?part=snippet&mine=true`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!profileResponse.ok) {
        const error = await profileResponse.text();
        logger.error('YouTube channel fetch failed', { errorMessage: error, status: profileResponse.status });
        if (profileResponse.status === 401) {
          throw new TokenExpiredError('YouTube access token expired or invalid', 'youtube');
        }
        throw new Error(`YouTube channel fetch failed: ${error}`);
      }

      const channelsData = await profileResponse.json();

      if (!channelsData.items || channelsData.items.length === 0) {
        throw new Error('No YouTube channel found for the authenticated user.');
      }

      const channel = channelsData.items[0];

      return {
        platformUserId: channel.id,
        username: channel.snippet.customUrl || channel.snippet.title,
        displayName: channel.snippet.title,
        profileUrl: `https://www.youtube.com/channel/${channel.id}`,
        avatarUrl: channel.snippet.thumbnails?.default?.url,
      };
    });
  }

  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    return platformFetch('youtube', async () => {
      if (!input.mediaUrls || input.mediaUrls.length === 0) {
        throw new Error('YouTube requires a video media URL to publish.');
      }

      // YouTube only supports video - find the first video URL from the media list
      const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.wmv', '.flv'];
      const videoUrl = input.mediaUrls.find(url => {
        const lowerUrl = url.toLowerCase();
        return videoExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes('video/');
      });

      if (!videoUrl) {
        throw new Error('YouTube requires video content. No video file found among attached media (only images were attached). YouTube does not support image-only posts.');
      }

      try {
        // 1. Fetch video stream (stream directly to YouTube when Content-Length is known so we stay inside Workers 128MB RAM)
        const videoRes = await fetch(videoUrl);
        if (!videoRes.ok) throw new Error(`Failed to fetch video: ${videoRes.statusText}`);
        const contentType = videoRes.headers.get('content-type') || 'video/mp4';

        if (!contentType.startsWith('video/')) {
          throw new Error('Given URL is not a recognized video format.');
        }

        const rawContentLength = videoRes.headers.get('content-length');
        const parsedContentLength = rawContentLength ? Number(rawContentLength) : NaN;
        let uploadLength: number;
        let uploadBody: BodyInit;
        let isStream = false;

        if (Number.isFinite(parsedContentLength) && parsedContentLength > 0 && videoRes.body) {
          const MAX_STREAM_BYTES = 500 * 1024 * 1024;
          if (parsedContentLength > MAX_STREAM_BYTES) {
            throw new Error(
              `Video file too large (${Math.round(parsedContentLength / 1024 / 1024)}MB). Maximum supported upload size is 500MB.`
            );
          }
          uploadLength = parsedContentLength;
          uploadBody = videoRes.body;
          isStream = true;
        } else {
          const videoBuffer = await videoRes.arrayBuffer();
          const MAX_BUFFERED_BYTES = 80 * 1024 * 1024;
          if (videoBuffer.byteLength > MAX_BUFFERED_BYTES) {
            throw new Error(
              `Video file too large for un-sized upload (${Math.round(videoBuffer.byteLength / 1024 / 1024)}MB). Please compress the video below 80MB.`
            );
          }
          uploadLength = videoBuffer.byteLength;
          uploadBody = videoBuffer;
        }

        // 2. Metadata (snippet, status)
        const metadata = {
          snippet: {
            title: input.content.substring(0, 100) || 'Uploaded via Unool',
            description: input.content,
          },
          status: {
            privacyStatus: 'public', // Set as required. Can be unlisted, private, etc.
          }
        };

        // 3. Initiate resumable upload session
        const initRes = await fetchWithRetry(`${YOUTUBE_UPLOAD_URL}?uploadType=resumable&part=snippet,status`, {
           method: 'POST',
           headers: {
             Authorization: `Bearer ${accessToken}`,
             'Content-Type': 'application/json',
             'X-Upload-Content-Length': uploadLength.toString(),
             'X-Upload-Content-Type': contentType
           },
           body: JSON.stringify(metadata)
        });

        if (!initRes.ok) {
           const initErr = await initRes.text();
           if (initRes.status === 401) {
             throw new TokenExpiredError('YouTube access token expired or invalid', 'youtube');
           }
           throw new Error(`Failed to initialize upload: ${initErr}`);
        }

        const uploadLocation = initRes.headers.get('location');
        if (!uploadLocation) {
           throw new Error('Did not receive upload URL location from YouTube.');
        }

        const uploadInit: RequestInit & { duplex?: 'half' } = {
           method: 'PUT',
           headers: {
             Authorization: `Bearer ${accessToken}`,
             'Content-Type': contentType,
             'Content-Length': uploadLength.toString(),
           },
           body: uploadBody,
           ...(isStream ? { duplex: 'half' as const } : {}),
        };
        const uploadRes = await fetchWithRetry(uploadLocation, uploadInit, isStream ? { maxRetries: 0 } : undefined);

        if (!uploadRes.ok) {
          const errText = await uploadRes.text();
          if (uploadRes.status === 401) {
            throw new TokenExpiredError('YouTube access token expired or invalid', 'youtube');
          }
          throw new Error(`Failed to upload chunk: ${errText}`);
        }

        const videoData = await uploadRes.json();
        
        return {
          platformPostId: videoData.id,
          platformUrl: `https://www.youtube.com/watch?v=${videoData.id}`,
          publishedAt: new Date(),
        };

      } catch (error: any) {
        logger.error('YouTube publish failed', { error });
        // Re-throw TokenExpiredError so PublishService can auto-refresh
        if (error instanceof TokenExpiredError) {
          throw error;
        }
        if (error.message && (error.message.includes('401') || error.message.includes('Token expired'))) {
           throw new TokenExpiredError('Token expired or invalid', 'youtube');
        }
        throw new Error(error.message);
      }
    });
  }

  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    return platformFetch('youtube', async () => {
      const response = await fetchWithRetry(`${YOUTUBE_API_BASE}/videos?id=${platformPostId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('YouTube video delete failed', { errorMessage: error, status: response.status });
        throw new Error(`YouTube video delete failed: ${error}`);
      }
    });
  }

  async getEngagement(accessToken: string, platformPostId: string): Promise<Record<string, unknown>> {
    return platformFetch('youtube', async () => {
      const response = await fetchWithRetry(`${YOUTUBE_API_BASE}/videos?part=statistics&id=${platformPostId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('YouTube engagement fetch failed', { errorMessage: error, status: response.status });
        return {};
      }

      const data = await response.json();
      if (!data.items || data.items.length === 0) {
        return {};
      }

      const stats = data.items[0].statistics || {};
      
      return {
        likes: parseInt(stats.likeCount || '0', 10),
        views: parseInt(stats.viewCount || '0', 10),
        comments: parseInt(stats.commentCount || '0', 10),
      };
    });
  }
}

export const youtubeAdapter = new YoutubeAdapter();
