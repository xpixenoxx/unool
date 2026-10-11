import { logger } from '@/lib/logger';
import {
  PlatformAdapter,
  PlatformAuthConfig,
  TokenResponse,
  UserProfile,
  PublishInput,
  PublishResult,
} from './adapter';

export interface LemmyTokenData {
  instanceUrl: string;
  jwt: string;
  community?: string;
  communityId?: number;
}

/**
 * LemmyAdapter
 *
 * Handles federation publishing to Lemmy instances using the Lemmy v3 REST API.
 * Users authenticate with their Lemmy instance via username/password or direct JWT,
 * and publish posts to their designated Lemmy community.
 */
export class LemmyAdapter implements PlatformAdapter {
  readonly platform = 'lemmy' as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: [],
  };

  getAuthUrl(_state: string): string {
    return '';
  }

  async exchangeCodeForToken(_code: string): Promise<TokenResponse> {
    throw new Error('Lemmy uses credentials / JWT connection in this integration');
  }

  async refreshAccessToken(_refreshToken: string): Promise<TokenResponse> {
    return {
      accessToken: _refreshToken,
      expiresIn: 0,
    };
  }

  async getUserProfile(tokenData: string): Promise<UserProfile> {
    const { instanceUrl, jwt } = this.parseToken(tokenData);

    try {
      // Lemmy v3: GET /api/v3/site?auth=<jwt> returns authenticated user info in my_user
      const res = await fetch(`https://${instanceUrl}/api/v3/site?auth=${encodeURIComponent(jwt)}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Lemmy profile fetch failed (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      const person = data.my_user?.local_user_view?.person;

      if (person) {
        return {
          platformUserId: String(person.id),
          username: person.name,
          displayName: person.display_name || person.name,
          avatarUrl: person.avatar || '',
          profileUrl: person.actor_id || `https://${instanceUrl}/u/${person.name}`,
        };
      }

      // Fallback: try GET /api/v3/user
      const userRes = await fetch(`https://${instanceUrl}/api/v3/user?auth=${encodeURIComponent(jwt)}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
      });

      if (userRes.ok) {
        const userData = await userRes.json();
        const userPerson = userData.person_view?.person;
        if (userPerson) {
          return {
            platformUserId: String(userPerson.id),
            username: userPerson.name,
            displayName: userPerson.display_name || userPerson.name,
            avatarUrl: userPerson.avatar || '',
            profileUrl: userPerson.actor_id || `https://${instanceUrl}/u/${userPerson.name}`,
          };
        }
      }

      throw new Error('Authenticated user profile not found in Lemmy response');
    } catch (err) {
      logger.error('Lemmy: Failed to fetch user profile', {
        instanceUrl,
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }

  async publish(tokenData: string, input: PublishInput): Promise<PublishResult> {
    const parsed = this.parseToken(tokenData);
    const { instanceUrl, jwt } = parsed;

    // Resolve target community ID
    let communityId = parsed.communityId;

    if (!communityId && parsed.community) {
      try {
        const cleanCommunity = parsed.community.trim().replace(/^c\//i, '').replace(/@.*$/, '');
        const commRes = await fetch(
          `https://${instanceUrl}/api/v3/community?name=${encodeURIComponent(cleanCommunity)}&auth=${encodeURIComponent(jwt)}`,
          {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${jwt}`,
            },
          }
        );

        if (commRes.ok) {
          const commData = await commRes.json();
          communityId = commData.community_view?.community?.id;
        }
      } catch (e) {
        logger.warn('Lemmy: Could not lookup community by name', { community: parsed.community });
      }
    }

    // If still no community ID, fallback to finding one of the user's subscribed or local communities
    if (!communityId) {
      try {
        const listRes = await fetch(
          `https://${instanceUrl}/api/v3/community/list?type_=Subscribed&limit=5&auth=${encodeURIComponent(jwt)}`,
          {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${jwt}`,
            },
          }
        );

        if (listRes.ok) {
          const listData = await listRes.json();
          if (listData.communities && listData.communities.length > 0) {
            communityId = listData.communities[0].community?.id;
          }
        }
      } catch (e) {
        logger.warn('Lemmy: Could not fetch subscribed communities', { error: e });
      }
    }

    if (!communityId) {
      throw new Error(
        'No Lemmy community specified. Please enter or select a default community (e.g. general) in your Lemmy connection settings.'
      );
    }

    // Extract title from first line of content
    const lines = input.content.trim().split('\n');
    let title = lines[0]?.trim() || 'New Post';
    if (title.length > 200) {
      title = title.substring(0, 197) + '...';
    }

    // Body contains the full content
    let body = input.content;

    // Optional media URL (Lemmy allows link posts with an image/media URL)
    let mediaUrl: string | undefined = undefined;
    if (input.mediaUrls && input.mediaUrls.length > 0) {
      mediaUrl = input.mediaUrls[0];
    }

    const payload: Record<string, unknown> = {
      auth: jwt,
      name: title,
      body,
      community_id: communityId,
    };

    if (mediaUrl) {
      payload.url = mediaUrl;
    }

    logger.info('Lemmy publishing post', {
      instanceUrl,
      communityId,
      title,
      hasMedia: Boolean(mediaUrl),
    });

    const postRes = await fetch(`https://${instanceUrl}/api/v3/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify(payload),
    });

    if (!postRes.ok) {
      const errBody = await postRes.text();
      logger.error('Lemmy publish failed', { status: postRes.status, errBody });
      throw new Error(`Lemmy publish failed (${postRes.status}): ${errBody}`);
    }

    const postData = await postRes.json();
    const post = postData.post_view?.post;

    if (!post || !post.id) {
      throw new Error('Invalid response structure received from Lemmy after publish');
    }

    const platformPostId = String(post.id);
    const platformUrl = post.ap_id || `https://${instanceUrl}/post/${platformPostId}`;

    return {
      platformPostId,
      platformUrl,
      publishedAt: new Date(post.published || Date.now()),
    };
  }

  async deletePost(tokenData: string, platformPostId: string): Promise<void> {
    const { instanceUrl, jwt } = this.parseToken(tokenData);
    const postId = parseInt(platformPostId, 10);

    if (isNaN(postId)) {
      throw new Error(`Invalid Lemmy post ID: ${platformPostId}`);
    }

    const res = await fetch(`https://${instanceUrl}/api/v3/post/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        auth: jwt,
        post_id: postId,
        deleted: true,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      logger.warn('Lemmy: delete post failed', { postId, errorText });
    }
  }

  async getEngagement(tokenData: string, platformPostId: string): Promise<Record<string, unknown>> {
    const { instanceUrl, jwt } = this.parseToken(tokenData);
    const postId = parseInt(platformPostId, 10);

    if (isNaN(postId)) {
      return {};
    }

    try {
      const res = await fetch(`https://${instanceUrl}/api/v3/post?id=${postId}&auth=${encodeURIComponent(jwt)}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${jwt}`,
        },
      });

      if (!res.ok) {
        return {};
      }

      const data = await res.json();
      const counts = data.post_view?.counts;

      return {
        likes: counts?.upvotes || counts?.score || 0,
        upvotes: counts?.upvotes || 0,
        downvotes: counts?.downvotes || 0,
        score: counts?.score || 0,
        comments: counts?.comments || 0,
      };
    } catch (e) {
      logger.warn('Lemmy: Failed to fetch engagement', { postId, error: e });
      return {};
    }
  }

  private parseToken(tokenData: string): LemmyTokenData {
    try {
      return JSON.parse(tokenData);
    } catch {
      throw new Error('Invalid Lemmy token format — expected JSON containing instanceUrl and jwt');
    }
  }
}

export const lemmyAdapter = new LemmyAdapter();
