import { logger } from '@/lib/logger';
import {
  PlatformAdapter,
  PlatformAuthConfig,
  TokenResponse,
  UserProfile,
  PublishInput,
  PublishResult,
} from './adapter';

export interface HashnodeTokenData {
  personalAccessToken: string;
  publicationId: string;
  publicationTitle?: string;
  publicationUrl?: string;
  username?: string;
}

export interface HashnodePublication {
  id: string;
  title: string;
  url: string;
}

const HASHNODE_GQL_ENDPOINT = 'https://gql.hashnode.com';

/**
 * HashnodeAdapter
 *
 * Handles technical blog & article publishing to Hashnode publications via
 * Hashnode's public GraphQL API (https://gql.hashnode.com).
 * Uses Personal Access Tokens (PAT) generated from Hashnode Developer Settings.
 */
export class HashnodeAdapter implements PlatformAdapter {
  readonly platform = 'hashnode' as const;

  readonly authConfig: PlatformAuthConfig = {
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: [],
  };

  getAuthUrl(_state: string): string {
    throw new Error('Hashnode uses Personal Access Tokens (PAT). Generate one at https://hashnode.com/settings/developer');
  }

  async exchangeCodeForToken(_code: string): Promise<TokenResponse> {
    throw new Error('Hashnode uses Personal Access Tokens directly.');
  }

  async refreshAccessToken(_refreshToken: string): Promise<TokenResponse> {
    throw new Error('Hashnode Personal Access Tokens do not expire periodically like OAuth tokens.');
  }

  /**
   * Helper to clean token string (strip Bearer if accidentally provided)
   */
  cleanToken(token: string): string {
    return token.replace(/^Bearer\s+/i, '').trim();
  }

  /**
   * Helper to execute GraphQL queries/mutations against Hashnode
   */
  async executeGraphQL<T = any>(
    token: string,
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    const rawToken = this.cleanToken(token);
    const res = await fetch(HASHNODE_GQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': rawToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Hashnode API HTTP error (${res.status}): ${errText}`);
    }

    const json = await res.json();
    if (json.errors && json.errors.length > 0) {
      const firstError = json.errors[0]?.message || 'Unknown GraphQL error';
      throw new Error(`Hashnode API error: ${firstError}`);
    }

    return json.data as T;
  }

  /**
   * Parse stored token string into structured HashnodeTokenData
   */
  parseToken(tokenData: string): HashnodeTokenData {
    try {
      if (tokenData.trim().startsWith('{')) {
        const parsed = JSON.parse(tokenData) as HashnodeTokenData;
        return {
          ...parsed,
          personalAccessToken: this.cleanToken(parsed.personalAccessToken),
        };
      }
    } catch {
      // Not JSON, assume raw token string
    }

    return {
      personalAccessToken: this.cleanToken(tokenData),
      publicationId: '',
    };
  }

  /**
   * Fetch all publications accessible by the user's PAT
   */
  async fetchPublications(token: string): Promise<HashnodePublication[]> {
    const query = `
      query MePublications {
        me {
          id
          username
          publications(first: 20) {
            edges {
              node {
                id
                title
                url
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.executeGraphQL(token, query);
      const edges = data?.me?.publications?.edges || [];
      return edges.map((e: any) => ({
        id: e.node.id,
        title: e.node.title,
        url: e.node.url,
      })) as HashnodePublication[];
    } catch (err) {
      logger.error('Hashnode: fetchPublications failed', {
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }

  /**
   * Look up publication by custom domain/host or ID
   */
  async resolvePublicationByHost(token: string, hostOrDomain: string): Promise<HashnodePublication | null> {
    const cleanHost = hostOrDomain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    const query = `
      query GetPublication($host: String!) {
        publication(host: $host) {
          id
          title
          url
        }
      }
    `;

    try {
      const data = await this.executeGraphQL(token, query, { host: cleanHost });
      if (data?.publication) {
        return {
          id: data.publication.id,
          title: data.publication.title,
          url: data.publication.url,
        };
      }
    } catch (e) {
      logger.warn('Hashnode: Could not find publication by host', { host: cleanHost });
    }

    return null;
  }

  async getUserProfile(tokenData: string): Promise<UserProfile> {
    const { personalAccessToken } = this.parseToken(tokenData);

    const query = `
      query MeProfile {
        me {
          id
          username
          name
          profilePicture
          publications(first: 5) {
            edges {
              node {
                id
                title
                url
              }
            }
          }
        }
      }
    `;

    try {
      const data = await this.executeGraphQL(personalAccessToken, query);
      const me = data?.me;

      if (!me) {
        throw new Error('Hashnode user profile not found. Please verify your Personal Access Token.');
      }

      return {
        platformUserId: me.id,
        username: me.username,
        displayName: me.name || me.username,
        profileUrl: `https://hashnode.com/@${me.username}`,
        avatarUrl: me.profilePicture || undefined,
      };
    } catch (err) {
      logger.error('Hashnode: getUserProfile failed', {
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }

  async publish(tokenData: string, input: PublishInput): Promise<PublishResult> {
    const parsed = this.parseToken(tokenData);
    let publicationId = parsed.publicationId;

    // If publicationId is missing, auto-discover first publication
    if (!publicationId) {
      const pubs = await this.fetchPublications(parsed.personalAccessToken);
      if (pubs.length === 0) {
        throw new Error('No Hashnode publications found on your account. Please create a publication on Hashnode first.');
      }
      publicationId = pubs[0].id;
    }

    // Extract title from first line of content
    const lines = input.content.trim().split('\n');
    const firstLine = lines[0]?.trim() || 'New Article';
    let title = firstLine.replace(/^#+\s*/, '').trim() || 'New Article';
    if (title.length > 250) {
      title = title.substring(0, 247) + '...';
    }

    // Extract hashtags from content for Hashnode tags, or provide default
    const hashMatches = input.content.match(/#([a-zA-Z0-9_-]+)/g);
    let tags = [{ name: 'Technology', slug: 'technology' }];

    if (hashMatches && hashMatches.length > 0) {
      const parsedTags = hashMatches.slice(0, 5).map((h) => {
        const clean = h.replace(/^#/, '');
        return {
          name: clean,
          slug: clean.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
        };
      }).filter((t) => t.slug.length > 0);

      if (parsedTags.length > 0) {
        tags = parsedTags;
      }
    }

    const mutationInput: Record<string, unknown> = {
      publicationId,
      title,
      contentMarkdown: input.content,
      tags,
    };

    // Attach cover image if provided
    if (input.mediaUrls && input.mediaUrls.length > 0) {
      mutationInput.coverImageOptions = {
        coverImageURL: input.mediaUrls[0],
      };
    }

    const mutation = `
      mutation PublishPost($input: PublishPostInput!) {
        publishPost(input: $input) {
          post {
            id
            title
            slug
            url
            publishedAt
          }
        }
      }
    `;

    logger.info('Hashnode: Publishing post', {
      publicationId,
      title,
      tagsCount: tags.length,
      hasMedia: Boolean(input.mediaUrls && input.mediaUrls.length > 0),
    });

    try {
      const data = await this.executeGraphQL(parsed.personalAccessToken, mutation, {
        input: mutationInput,
      });

      const post = data?.publishPost?.post;
      if (!post || !post.id) {
        throw new Error('Invalid response structure received from Hashnode after publishing.');
      }

      return {
        platformPostId: String(post.id),
        platformUrl: post.url || `https://hashnode.com`,
        publishedAt: new Date(post.publishedAt || Date.now()),
      };
    } catch (err) {
      logger.error('Hashnode: publish failed', {
        publicationId,
        error: err instanceof Error ? err : new Error(String(err)),
      });
      throw err;
    }
  }

  async deletePost(tokenData: string, platformPostId: string): Promise<void> {
    const { personalAccessToken } = this.parseToken(tokenData);

    const mutation = `
      mutation RemovePost($input: RemovePostInput!) {
        removePost(input: $input) {
          post {
            id
          }
        }
      }
    `;

    try {
      await this.executeGraphQL(personalAccessToken, mutation, {
        input: { id: platformPostId },
      });
      logger.info('Hashnode: post removed successfully', { platformPostId });
    } catch (err) {
      logger.warn('Hashnode: removePost failed or unsupported for this tier', {
        platformPostId,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }

  async getEngagement(tokenData: string, platformPostId: string): Promise<Record<string, unknown>> {
    const { personalAccessToken } = this.parseToken(tokenData);

    const query = `
      query GetPostEngagement($id: ID!) {
        post(id: $id) {
          id
          views
          reactionCount
          responseCount
        }
      }
    `;

    try {
      const data = await this.executeGraphQL(personalAccessToken, query, {
        id: platformPostId,
      });

      const post = data?.post;
      if (!post) return {};

      return {
        views: post.views || 0,
        reactions: post.reactionCount || 0,
        responses: post.responseCount || 0,
        comments: post.responseCount || 0,
      };
    } catch (e) {
      logger.warn('Hashnode: Failed to fetch post engagement', {
        platformPostId,
        error: e instanceof Error ? e.message : String(e),
      });
      return {};
    }
  }
}

export const hashnodeAdapter = new HashnodeAdapter();
