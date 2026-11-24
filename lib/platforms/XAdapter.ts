import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { createPKCECookie } from '@/lib/auth/oauth-state';
import {
  PlatformAdapter,
  PlatformAuthConfig,
  TokenResponse,
  UserProfile,
  PublishInput,
  PublishResult,
} from './adapter';
import { platformFetch, fetchWithRetry, TokenExpiredError } from '@/lib/utils/retry';

const X_AUTH_URL = 'https://twitter.com/i/oauth2/authorize';
const X_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';
const X_API_BASE = 'https://api.twitter.com/2';

/**
 * Generates a PKCE code verifier and challenge per RFC 7636
 */
async function generatePKCEAsync(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const codeVerifier = base64urlEncode(verifierBytes);

  const encoder = new TextEncoder();
  const challengeHash = await crypto.subtle.digest('SHA-256', encoder.encode(codeVerifier));
  const codeChallenge = base64urlEncode(new Uint8Array(challengeHash));

  return { codeVerifier, codeChallenge };
}

function base64urlEncode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * XAdapter with proper PKCE (S256) and retry logic
 */
export class XAdapter implements PlatformAdapter {
  readonly platform = 'x' as const;

  get authConfig(): PlatformAuthConfig {
    return {
      clientId: config.X_CLIENT_ID || process.env.X_CLIENT_ID || '',
      clientSecret: config.X_CLIENT_SECRET || process.env.X_CLIENT_SECRET || '',
      redirectUri:
        config.X_REDIRECT_URI ||
        process.env.X_REDIRECT_URI ||
        `${(config.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '')}/api/auth/platform/callback`,
      scopes: ['tweet.read', 'tweet.write', 'users.read', 'media.write', 'offline.access'],
    };
  }

  /**
   * Generates auth URL with PKCE S256 challenge
   * Stores code_verifier in HttpOnly cookie AND returns it for Redis OAuth state storage
   */
  async getAuthUrl(state: string, redirectUri?: string): Promise<{ url: string; pkceCookie: string; codeVerifier: string }> {
    const effectiveRedirectUri = redirectUri || this.authConfig.redirectUri;
    const { codeVerifier, codeChallenge } = await generatePKCEAsync();

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.authConfig.clientId,
      redirect_uri: effectiveRedirectUri,
      scope: this.authConfig.scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const pkceCookie = createPKCECookie(state, codeVerifier);

    return {
      url: `${X_AUTH_URL}?${params.toString()}`,
      pkceCookie,
      codeVerifier,
    };
  }

  /**
   * Exchanges authorization code for tokens using stored PKCE verifier
   */
  async exchangeCodeForToken(code: string, codeVerifier?: string, redirectUri?: string): Promise<TokenResponse> {
    if (!codeVerifier) {
      throw new Error('X OAuth PKCE code_verifier missing or expired. Please try connecting again.');
    }
    const effectiveRedirectUri = redirectUri || this.authConfig.redirectUri;
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: effectiveRedirectUri,
      client_id: this.authConfig.clientId,
      code_verifier: codeVerifier,
    });

    const credentials = Buffer.from(`${this.authConfig.clientId}:${this.authConfig.clientSecret}`).toString('base64');

    return platformFetch('x', async () => {
      const response = await fetchWithRetry(X_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('X token exchange failed', { errorMessage: error, status: response.status });
        throw new Error(`X token exchange failed: ${error}`);
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
    });

    const credentials = Buffer.from(`${this.authConfig.clientId}:${this.authConfig.clientSecret}`).toString('base64');

    return platformFetch('x', async () => {
      const response = await fetchWithRetry(X_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('X token refresh failed', { errorMessage: error, status: response.status });
        throw new Error(`X token refresh failed: ${error}`);
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

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    return platformFetch('x', async () => {
      const response = await fetchWithRetry(`${X_API_BASE}/users/me?user.fields=profile_image_url,username,name`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('X profile fetch failed', { errorMessage: error, status: response.status });

        if (response.status === 401 || response.status === 403) {
          throw new TokenExpiredError('Token expired or invalid', 'x');
        }
        throw new Error(`X profile fetch failed: ${error}`);
      }

      const data = await response.json();
      return {
        platformUserId: data.data.id,
        username: data.data.username,
        displayName: data.data.name,
        profileUrl: `https://x.com/${data.data.username}`,
        avatarUrl: data.data.profile_image_url,
      };
    });
  }

  private inferMediaTypeAndCategory(
    url: string,
    headerContentType: string | null
  ): { mediaType: string; mediaCategory: 'tweet_image' | 'tweet_gif' | 'tweet_video'; isVideoOrGif: boolean } {
    const rawType = (headerContentType || '').split(';')[0].trim().toLowerCase();
    const cleanUrl = url.split('?')[0].toLowerCase();

    if (rawType === 'image/gif' || cleanUrl.endsWith('.gif')) {
      return { mediaType: 'image/gif', mediaCategory: 'tweet_gif', isVideoOrGif: true };
    }
    if (rawType.startsWith('video/') || /\.(mp4|mov|m4v|webm)$/i.test(cleanUrl)) {
      const videoMime = rawType.startsWith('video/') ? rawType : cleanUrl.endsWith('.mov') ? 'video/quicktime' : 'video/mp4';
      return { mediaType: videoMime, mediaCategory: 'tweet_video', isVideoOrGif: true };
    }
    if (rawType === 'image/png' || cleanUrl.endsWith('.png')) {
      return { mediaType: 'image/png', mediaCategory: 'tweet_image', isVideoOrGif: false };
    }
    if (rawType === 'image/webp' || cleanUrl.endsWith('.webp')) {
      return { mediaType: 'image/webp', mediaCategory: 'tweet_image', isVideoOrGif: false };
    }
    return { mediaType: 'image/jpeg', mediaCategory: 'tweet_image', isVideoOrGif: false };
  }

  /**
   * Uploads a single media asset to X via X API v2 chunked media upload
   * (`/2/media/upload/initialize` -> `/append` -> `/finalize` -> optional STATUS polling).
   */
  private async uploadSingleMedia(accessToken: string, mediaUrl: string): Promise<string> {
    const MAX_MEDIA_BYTES = 80 * 1024 * 1024; // 80MB safety ceiling for Cloudflare Workers memory
    const CHUNK_BYTES = 4 * 1024 * 1024; // 4MB chunks (X limit is 5MB per APPEND chunk)

    const downloadRes = await fetchWithRetry(
      mediaUrl,
      {},
      {
        maxRetries: 2,
        baseDelayMs: 1000,
        maxDelayMs: 5000,
        retryableStatuses: [408, 429, 500, 502, 503, 504],
        isRetryableError: (e) => e instanceof TypeError,
      }
    );

    if (!downloadRes.ok) {
      throw new Error(`Failed to fetch media for X upload (${downloadRes.status})`);
    }

    const declaredLen = Number(downloadRes.headers.get('content-length') || 0);
    if (declaredLen > MAX_MEDIA_BYTES) {
      throw new Error(
        `Media file too large for X upload (${Math.round(declaredLen / 1024 / 1024)}MB). Maximum supported size is 80MB.`
      );
    }

    const buffer = await downloadRes.arrayBuffer();
    if (buffer.byteLength === 0) {
      throw new Error('Downloaded media file for X is empty');
    }
    if (buffer.byteLength > MAX_MEDIA_BYTES) {
      throw new Error(
        `Media file too large for X upload (${Math.round(buffer.byteLength / 1024 / 1024)}MB). Maximum supported size is 80MB.`
      );
    }

    const { mediaType, mediaCategory } = this.inferMediaTypeAndCategory(
      mediaUrl,
      downloadRes.headers.get('content-type')
    );

    // 1. INITIALIZE via X API v2
    const initRes = await fetchWithRetry(`${X_API_BASE}/media/upload/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        total_bytes: buffer.byteLength,
        media_type: mediaType,
        media_category: mediaCategory,
      }),
    });

    if (!initRes.ok) {
      const errBody = await initRes.text().catch(() => '');
      if (initRes.status === 401 || initRes.status === 403) {
        if (/scope|media\.write|forbidden|unauthorized/i.test(errBody)) {
          throw new Error(
            'X media upload requires reconnecting your X account in Settings to grant media upload permissions (media.write).'
          );
        }
        throw new TokenExpiredError('Token expired or invalid during X media upload', 'x');
      }
      throw new Error(`X media initialize failed (${initRes.status}): ${errBody}`);
    }

    const initJson = await initRes.json();
    const mediaId: string | undefined = initJson?.data?.id || initJson?.media_id_string;
    if (!mediaId) {
      throw new Error('X media initialize did not return a media ID');
    }

    // 2. APPEND chunks
    let segmentIndex = 0;
    for (let offset = 0; offset < buffer.byteLength; offset += CHUNK_BYTES) {
      const slice = buffer.slice(offset, Math.min(offset + CHUNK_BYTES, buffer.byteLength));
      const form = new FormData();
      form.append('segment_index', String(segmentIndex));
      form.append('media', new Blob([slice], { type: mediaType }), `chunk-${segmentIndex}`);

      const appendRes = await fetchWithRetry(`${X_API_BASE}/media/upload/${mediaId}/append`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      });

      if (!appendRes.ok) {
        const errBody = await appendRes.text().catch(() => '');
        throw new Error(`X media append failed on segment ${segmentIndex} (${appendRes.status}): ${errBody}`);
      }
      segmentIndex++;
    }

    // 3. FINALIZE
    const finalizeRes = await fetchWithRetry(`${X_API_BASE}/media/upload/${mediaId}/finalize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!finalizeRes.ok) {
      const errBody = await finalizeRes.text().catch(() => '');
      throw new Error(`X media finalize failed (${finalizeRes.status}): ${errBody}`);
    }

    const finalizeJson = await finalizeRes.json().catch(() => ({}));
    let processingInfo = finalizeJson?.data?.processing_info || finalizeJson?.processing_info;

    // 4. Poll STATUS if X is asynchronously transcoding video/GIF
    let attempts = 0;
    while (
      processingInfo &&
      (processingInfo.state === 'pending' || processingInfo.state === 'in_progress') &&
      attempts < 8
    ) {
      const waitSec = Math.min(Math.max(Number(processingInfo.check_after_secs) || 2, 1), 10);
      await new Promise((resolve) => setTimeout(resolve, waitSec * 1000));
      attempts++;

      const statusRes = await fetchWithRetry(
        `${X_API_BASE}/media/upload?media_id=${encodeURIComponent(mediaId)}&command=STATUS`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!statusRes.ok) break;
      const statusJson = await statusRes.json().catch(() => ({}));
      processingInfo = statusJson?.data?.processing_info || statusJson?.processing_info;

      if (processingInfo?.state === 'failed') {
        const reason = processingInfo?.error?.message || 'Media transcoding failed on X';
        throw new Error(`X media processing failed: ${reason}`);
      }
    }

    return mediaId;
  }

  async postReply(accessToken: string, inReplyToTweetId: string, text: string): Promise<{ id?: string }> {
    return platformFetch('x', async () => {
      const response = await fetchWithRetry(`${X_API_BASE}/tweets`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          reply: { in_reply_to_tweet_id: inReplyToTweetId },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('X reply failed', { errorMessage: error, inReplyToTweetId, status: response.status });
        throw new Error(`X reply failed (${response.status}): ${error}`);
      }

      const data = await response.json();
      return { id: data?.data?.id };
    });
  }

  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    return platformFetch('x', async () => {
      const body: Record<string, unknown> = { text: input.content };

      if (input.mediaUrls && input.mediaUrls.length > 0) {
        // X allows either 1 video/GIF OR up to 4 images per post
        const firstMeta = this.inferMediaTypeAndCategory(input.mediaUrls[0], null);
        const urlsToUpload = firstMeta.isVideoOrGif
          ? input.mediaUrls.slice(0, 1)
          : input.mediaUrls.slice(0, 4);

        const mediaIds: string[] = [];
        for (const url of urlsToUpload) {
          const uploadedId = await this.uploadSingleMedia(accessToken, url);
          mediaIds.push(uploadedId);
        }

        if (mediaIds.length > 0) {
          body.media = { media_ids: mediaIds };
        }
      }

      const response = await fetchWithRetry(`${X_API_BASE}/tweets`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('X publish failed', { errorMessage: error, status: response.status });

        // Check for token expiry
        if (response.status === 401 || response.status === 403) {
          throw new TokenExpiredError('Token expired or invalid', 'x');
        }
        throw new Error(`X publish failed: ${error}`);
      }

      const data = await response.json();
      const platformPostId = data.data.id;
      const platformUrl = `https://x.com/i/web/status/${platformPostId}`;

      if (input.firstComment && input.firstComment.trim()) {
        try {
          await this.postReply(accessToken, platformPostId, input.firstComment);
        } catch (replyErr) {
          logger.warn('X first comment reply failed', {
            platformPostId,
            error: replyErr instanceof Error ? replyErr : new Error(String(replyErr)),
          });
        }
      }

      return {
        platformPostId,
        platformUrl,
        publishedAt: new Date(),
      };
    });
  }

  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    return platformFetch('x', async () => {
      const response = await fetchWithRetry(`${X_API_BASE}/tweets/${platformPostId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error('X delete failed', { errorMessage: error, status: response.status });
        throw new Error(`X delete failed: ${error}`);
      }
    });
  }

  async getEngagement(accessToken: string, platformPostId: string): Promise<Record<string, unknown>> {
    return platformFetch('x', async () => {
      const response = await fetchWithRetry(
        `${X_API_BASE}/tweets/${platformPostId}?tweet.fields=public_metrics`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error('X engagement fetch failed', { errorMessage: error, status: response.status });
        return {};
      }

      const data = await response.json();
      const metrics = data.data?.public_metrics || {};
      const views = Number(metrics.impression_count || 0);
      const likes = Number(metrics.like_count || 0);
      const retweets = Number(metrics.retweet_count || 0);
      const replies = Number(metrics.reply_count || 0);
      const quotes = Number(metrics.quote_count || 0);

      return {
        likes,
        retweets,
        replies,
        quotes,
        views,
        impressions: views,
        hasRealData: (likes + retweets + replies + quotes + views) > 0,
      };
    });
  }
}

export const xAdapter = new XAdapter();