import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { decryptToken } from '@/lib/crypto/encryption';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { API_VERSIONS } from '@/lib/platforms/apiVersions';
import { facebookAdapter, formatFacebookPostUrl } from '@/lib/platforms/FacebookAdapter';

export const dynamic = 'force-dynamic';

export interface PublishedFacebookPost {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  source: 'facebook_live' | 'unool_published';
}

/**
 * GET /api/facebook/posts?workspaceId=xxx
 * Retrieves published Facebook Page posts for a workspace:
 * 1. Queries Meta Graph API for active published posts on the connected Facebook Page
 * 2. Augments with any platform_posts published from UNOOL
 * 3. Returns unified list of posts ready for linking to Brand & Materials pages
 */
export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isCronAuthorized = Boolean(cronSecret && authHeader === `Bearer ${cronSecret}`);

    if (!isCronAuthorized) {
      let authorized = false;
      try {
        const userClient = await createSupabaseServerClient();
        const { data: { user } } = await userClient.auth.getUser();
        if (user) {
          const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
          if (!hasAccess) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
          authorized = true;
        }
      } catch {
        authorized = false;
      }
      if (!authorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { data: connections } = await supabaseAdmin
      .from('platform_connections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'facebook')
      .eq('status', 'connected')
      .order('updated_at', { ascending: false })
      .limit(1);

    const connection = connections && connections.length > 0 ? connections[0] : null;
    let facebookLivePosts: PublishedFacebookPost[] = [];
    let isConnected = false;
    let displayPageName = connection?.display_name || connection?.username || '';

    if (connection && connection.access_token_encrypted) {
      isConnected = true;
      try {
        const meta = (connection.metadata as Record<string, unknown> | null) || {};
        if (typeof meta.page_name === 'string' && meta.page_name.trim()) {
          displayPageName = meta.page_name.trim();
        }

        const scopes = Array.isArray(connection.scopes) ? (connection.scopes as string[]) : [];
        const scopePageTag = scopes.find((s) => typeof s === 'string' && s.startsWith('fb_page_id:'));
        let pageId =
          (typeof meta.page_id === 'string' && meta.page_id) ||
          (scopePageTag ? scopePageTag.slice('fb_page_id:'.length) : '');

        const userToken = await decryptToken(connection.access_token_encrypted);

        if (!pageId) {
          const pages = await facebookAdapter.getUserPages(userToken);
          if (pages.length > 0) {
            pageId = pages[0].id;
            if (!displayPageName && pages[0].name) displayPageName = pages[0].name;
          }
        }

        if (pageId) {
          const pageToken = await facebookAdapter.getPageAccessToken(userToken, pageId);
          const fields = 'id,message,full_picture,permalink_url,created_time,attachments{type,media_type,url,media}';
          let postsRes = await fetch(
            `https://graph.facebook.com/${API_VERSIONS.facebook}/${pageId}/posts?fields=${encodeURIComponent(fields)}&limit=50&access_token=${encodeURIComponent(pageToken)}`
          );

          if (!postsRes.ok) {
            postsRes = await fetch(
              `https://graph.facebook.com/${API_VERSIONS.facebook}/${pageId}/feed?fields=${encodeURIComponent(fields)}&limit=50&access_token=${encodeURIComponent(pageToken)}`
            );
          }

          if (postsRes.ok) {
            const postsJson = await postsRes.json();
            const items = Array.isArray(postsJson?.data) ? postsJson.data : [];
            facebookLivePosts = items.map((p: any) => {
              const firstAtt = p.attachments?.data?.[0];
              const mediaTypeRaw = String(firstAtt?.media_type || firstAtt?.type || '').toUpperCase();
              const mediaUrl = p.full_picture || firstAtt?.media?.image?.src || undefined;
              return {
                id: String(p.id),
                caption: p.message || '',
                media_type: mediaTypeRaw || (mediaUrl ? 'IMAGE' : 'POST'),
                media_url: mediaUrl,
                thumbnail_url: mediaUrl,
                permalink: p.permalink_url || formatFacebookPostUrl(String(p.id)),
                timestamp: p.created_time,
                source: 'facebook_live' as const,
              };
            });
          }
        }
      } catch (err) {
        logger.warn('Failed to fetch live Facebook Page posts from Graph API', {
          error: err instanceof Error ? err.message : String(err),
          workspaceId,
        });
      }
    }

    let unoolPosts: PublishedFacebookPost[] = [];
    try {
      const { data: dbPosts } = await supabaseAdmin
        .from('platform_posts')
        .select(`
          id,
          platform_post_id,
          platform_url,
          created_at,
          post_variants!inner (
            platform,
            adapted_content,
            media_urls,
            posts!inner (
              workspace_id
            )
          )
        `)
        .eq('post_variants.platform', 'facebook')
        .eq('post_variants.posts.workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (dbPosts && dbPosts.length > 0) {
        unoolPosts = dbPosts.map((p: any) => {
          const variant = Array.isArray(p.post_variants) ? p.post_variants[0] : p.post_variants;
          const mediaUrls = variant?.media_urls || [];
          return {
            id: p.platform_post_id || p.id,
            caption: variant?.adapted_content || variant?.content || '',
            media_type: mediaUrls.length > 0 ? 'IMAGE' : 'POST',
            media_url: mediaUrls[0] || undefined,
            thumbnail_url: mediaUrls[0] || undefined,
            permalink: p.platform_url || undefined,
            timestamp: p.created_at,
            source: 'unool_published' as const,
          };
        });
      }
    } catch (err) {
      logger.warn('Failed to fetch platform_posts for Facebook', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    const seenIds = new Set<string>();
    const combinedPosts: PublishedFacebookPost[] = [];
    for (const p of [...facebookLivePosts, ...unoolPosts]) {
      if (p.id && !seenIds.has(p.id)) {
        seenIds.add(p.id);
        combinedPosts.push(p);
      }
    }

    return NextResponse.json({
      success: true,
      connected: isConnected,
      username: displayPageName,
      posts: combinedPosts,
      totalCount: combinedPosts.length,
    });
  } catch (error) {
    logger.error('Error in GET /api/facebook/posts', {
      error: error instanceof Error ? error : new Error(String(error)),
    });
    return NextResponse.json({ error: 'Failed to fetch Facebook posts' }, { status: 500 });
  }
}
