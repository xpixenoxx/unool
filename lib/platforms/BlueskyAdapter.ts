import { logger } from '@/lib/logger';
import {
  PlatformAdapter,
  PlatformAuthConfig,
  TokenResponse,
  UserProfile,
  PublishInput,
  PublishResult,
} from './adapter';
import { AtpAgent } from '@atproto/api';

const BSKY_SERVICE = 'https://bsky.social';

/**
 * BlueskyAdapter
 *
 * Bluesky uses the AT Protocol (atproto) — NOT OAuth.
 * The user connects once with their handle + App Password.
 * We store the App Password as the "access token" (encrypted).
 * On every publish, we create a short-lived session silently.
 *
 * The "accessToken" stored in the DB is a JSON string:
 * { handle: string, appPassword: string }
 */
export class BlueskyAdapter implements PlatformAdapter {
  readonly platform = 'bluesky' as const;

  // No OAuth — these are unused but required by the interface
  readonly authConfig: PlatformAuthConfig = {
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: [],
  };

  /**
   * Not used for Bluesky (no OAuth redirect flow)
   */
  getAuthUrl(_state: string): string {
    return '';
  }

  /**
   * Not used for Bluesky
   */
  async exchangeCodeForToken(_code: string): Promise<TokenResponse> {
    throw new Error('Bluesky does not use OAuth code exchange');
  }

  /**
   * Not used for Bluesky — app passwords don't expire
   */
  async refreshAccessToken(_refreshToken: string): Promise<TokenResponse> {
    return {
      accessToken: _refreshToken,
      expiresIn: 0,
    };
  }

  /**
   * Validate handle + app password by attempting login,
   * then return the user's profile info.
   * accessToken here is JSON: { handle, appPassword }
   */
  async getUserProfile(accessToken: string): Promise<UserProfile> {
    const { handle, appPassword } = this.parseToken(accessToken);
    const agent = new AtpAgent({ service: BSKY_SERVICE });

    const session = await agent.login({
      identifier: handle,
      password: appPassword,
    });

    if (!session.success) {
      throw new Error('Bluesky login failed — check handle and app password');
    }

    const profile = await agent.getProfile({ actor: session.data.did });

    return {
      platformUserId: session.data.did,
      username: session.data.handle,
      displayName: profile.data.displayName ?? session.data.handle,
      avatarUrl: profile.data.avatar,
      profileUrl: `https://bsky.app/profile/${session.data.handle}`,
    };
  }

  /**
   * Publish a post to Bluesky.
   * accessToken is JSON: { handle, appPassword }
   */
  async publish(accessToken: string, input: PublishInput): Promise<PublishResult> {
    const { handle, appPassword } = this.parseToken(accessToken);
    const agent = new AtpAgent({ service: BSKY_SERVICE });

    logger.info('Bluesky: logging in for publish', { handle });
    const session = await agent.login({ identifier: handle, password: appPassword });

    if (!session.success) {
      throw new Error('Bluesky login failed during publish');
    }

    // Build post record
    // Truncate to Bluesky's 300 grapheme limit
    const text = this.truncate(input.content, 300);

    let embed: any;
    if (input.mediaUrls && input.mediaUrls.length > 0) {
      // Check if it's a video (only 1 video is supported by Bluesky)
      const firstMediaUrl = input.mediaUrls[0];
      const isVideo = firstMediaUrl.toLowerCase().match(/\.(mp4|mov|webm|mpeg)$/i) || firstMediaUrl.includes('video/');

      if (isVideo) {
        logger.info('Bluesky: uploading video', { url: firstMediaUrl.substring(0, 80) });
        try {
          const response = await fetch(firstMediaUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch video: ${response.statusText}`);
          }
          const buffer = await response.arrayBuffer();
          
          if (!agent.session?.did) {
             throw new Error('Bluesky session missing DID');
          }

          // 1. Get service auth token
          logger.info('Bluesky: getting video service auth token');
          const { data: serviceAuth } = await agent.com.atproto.server.getServiceAuth({
            aud: 'did:web:video.bsky.app',
            lxm: 'com.atproto.repo.uploadBlob',
            exp: Math.floor(Date.now() / 1000) + 60 * 30, // 30 mins
          });

          // 2. Upload to the video service
          logger.info('Bluesky: uploading to video.bsky.app');
          const uploadUrl = new URL('https://video.bsky.app/xrpc/app.bsky.video.uploadVideo');
          uploadUrl.searchParams.append('did', agent.session.did);
          uploadUrl.searchParams.append('name', 'video.mp4');

          const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${serviceAuth.token}`,
              'Content-Type': 'video/mp4',
            },
            body: buffer,
          });
          
          if (!uploadResponse.ok) {
             const errorText = await uploadResponse.text();
             throw new Error(`Video upload failed: ${uploadResponse.status} ${errorText}`);
          }

          const jobStatus = await uploadResponse.json();
          logger.info('Bluesky: video upload initiated, job ID:', { jobId: jobStatus.jobId });

          // 3. Poll for processing status
          const videoAgent = new AtpAgent({ service: 'https://video.bsky.app' });
          let blob = jobStatus.jobStatus?.blob || jobStatus.blob;
          let attempts = 0;
          while (!blob && attempts < 90) { // Max 3 minutes
            await new Promise((r) => setTimeout(r, 2000));
            try {
              const { data } = await videoAgent.app.bsky.video.getJobStatus({ 
                jobId: jobStatus.jobId 
              });
              blob = data.jobStatus.blob;
              if (data.jobStatus.state === 'JOB_STATE_FAILED' || data.jobStatus.state === 'FAILED') {
                 throw new Error(`Video processing failed: ${data.jobStatus.error}`);
              }
            } catch (err) {
               logger.warn('Bluesky: error polling video status, retrying...', { err: err instanceof Error ? err.message : String(err) });
            }
            attempts++;
          }
          
          if (!blob) {
             throw new Error('Video processing timed out after 3 minutes');
          }

          embed = {
            $type: 'app.bsky.embed.video',
            video: blob,
            aspectRatio: { width: 1920, height: 1080 }, // Provide a default aspect ratio
          };
          logger.info('Bluesky: video embed ready');
        } catch (vidErr) {
          logger.error('Bluesky: video upload failed', { error: vidErr instanceof Error ? vidErr.message : String(vidErr) });
          throw new Error(`Bluesky video upload failed: ${vidErr instanceof Error ? vidErr.message : String(vidErr)}`);
        }
      } else {
        // Handle images (max 4)
        const imageUrls = input.mediaUrls.slice(0, 4);
        logger.info('Bluesky: uploading images', { count: imageUrls.length, urls: imageUrls.map(u => u.substring(0, 80)) });

        const blobResults = await Promise.all(
          imageUrls.map(async (url, idx) => {
            try {
              const response = await fetch(url);
              if (!response.ok) {
                logger.error(`Bluesky: failed to fetch image ${idx}`, { url: url.substring(0, 100), status: response.status });
                return null;
              }
              const buffer = await response.arrayBuffer();
              if (buffer.byteLength === 0) {
                logger.error(`Bluesky: image ${idx} has zero bytes`, { url: url.substring(0, 100) });
                return null;
              }
              
              let mimeType = response.headers.get('content-type') || 'image/jpeg';
              // Bluesky strictly requires image/jpeg, image/png, or image/webp
              if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
                const lowerUrl = url.toLowerCase();
                if (lowerUrl.includes('.png')) mimeType = 'image/png';
                else if (lowerUrl.includes('.webp')) mimeType = 'image/webp';
                else mimeType = 'image/jpeg';
              }
              
              if (buffer.byteLength > 1999999) {
                logger.error(`Bluesky: image ${idx} exceeds 2MB limit`, { url: url.substring(0, 100), size: buffer.byteLength });
                throw new Error('Image exceeds Bluesky\'s strict 2MB limit. Please compress it before uploading.');
              }
              
              logger.info(`Bluesky: uploading blob ${idx}`, { size: buffer.byteLength, mimeType });
              const upload = await agent.uploadBlob(new Uint8Array(buffer), { encoding: mimeType });
              return {
                image: upload.data.blob,
                alt: '',
              };
            } catch (imgErr) {
              logger.error(`Bluesky: image upload ${idx} failed`, { error: imgErr instanceof Error ? imgErr.message : String(imgErr), url: url.substring(0, 100) });
              return null;
            }
          })
        );

        const blobs = blobResults.filter(Boolean);
        if (blobs.length > 0) {
          embed = {
            $type: 'app.bsky.embed.images',
            images: blobs,
          } as any;
          logger.info('Bluesky: image embed ready', { imageCount: blobs.length });
        } else {
          logger.warn('Bluesky: all image uploads failed, posting text-only');
        }
      }
    }

    const record = await agent.post({ text, embed });

    // Extract post ID from the AT URI (at://did:plc:.../app.bsky.feed.post/RKEY)
    const atUri = record.uri;
    const rkey = atUri.split('/').pop() ?? atUri;
    const postUrl = `https://bsky.app/profile/${session.data.handle}/post/${rkey}`;

    logger.info('Bluesky: post published', { atUri, postUrl });

    return {
      platformPostId: atUri,
      platformUrl: postUrl,
      publishedAt: new Date(),
    };
  }

  /**
   * Delete a post from Bluesky.
   */
  async deletePost(accessToken: string, platformPostId: string): Promise<void> {
    const { handle, appPassword } = this.parseToken(accessToken);
    const agent = new AtpAgent({ service: BSKY_SERVICE });

    await agent.login({ identifier: handle, password: appPassword });
    await agent.deletePost(platformPostId);
  }

  /**
   * Bluesky doesn't have a simple engagement API in the same way,
   * so we return an empty record for now.
   */
  async getEngagement(_accessToken: string, _platformPostId: string): Promise<Record<string, unknown>> {
    return {};
  }

  // ─── Helpers ────────────────────────────────────────────────

  /**
   * Parse the stored token JSON: { handle, appPassword }
   */
  private parseToken(accessToken: string): { handle: string; appPassword: string } {
    try {
      return JSON.parse(accessToken);
    } catch {
      throw new Error('Invalid Bluesky token format — expected JSON with handle and appPassword');
    }
  }

  /**
   * Truncate text to a max character count, respecting word boundaries
   */
  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 1).trimEnd() + '…';
  }
}

export const blueskyAdapter = new BlueskyAdapter();
