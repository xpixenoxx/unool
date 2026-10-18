import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { decryptToken } from '@/lib/crypto/encryption';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export interface PublishedInstagramPost {
  id: string;
  caption?: string;
  media_type?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  comments_count?: number;
  source: 'instagram_live' | 'unool_published';
}

/**
 * GET /api/instagram/posts?workspaceId=xxx
 * Retrieves published Instagram posts for a workspace:
 * 1. Queries Meta Graph API for active published posts on the connected Instagram account
 * 2. Augments with any platform_posts published from UNOOL
 * 3. Returns clean, unified list of posts ready for linking to brand materials pages
 */
export async function GET(request: NextRequest) {
  try {
    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    // Verify authentication
    try {
      const userClient = await createSupabaseServerClient();
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
        if (!hasAccess) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    } catch {
      // Continue if internal/diagnostic
    }

    // 1. Fetch connected Instagram account
    const { data: connections } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'instagram')
      .eq('status', 'connected');

    const connection = connections && connections.length > 0 ? connections[0] : null;
    let instagramLivePosts: PublishedInstagramPost[] = [];
    let isConnected = false;
    let username = connection?.username || '';

    if (connection && connection.access_token_encrypted) {
      isConnected = true;
      try {
        const accessToken = await decryptToken(connection.access_token_encrypted);
        
        // Fetch recent media from Instagram Graph API
        const igRes = await fetch(
          `https://graph.instagram.com/v20.0/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,comments_count&limit=50&access_token=${accessToken}`
        );

        if (igRes.ok) {
          const igData = await igRes.json();
          const items = igData.data || [];
          instagramLivePosts = items.map((m: any) => ({
            id: m.id,
            caption: m.caption || '',
            media_type: m.media_type || 'IMAGE',
            media_url: m.media_url || m.thumbnail_url,
            thumbnail_url: m.thumbnail_url || m.media_url,
            permalink: m.permalink || `https://www.instagram.com/p/${m.id}/`,
            timestamp: m.timestamp,
            comments_count: m.comments_count || 0,
            source: 'instagram_live',
          }));
        } else {
          // Fallback to platform user ID endpoint if me/media fails
          if (connection.platform_user_id) {
            const fallbackRes = await fetch(
              `https://graph.facebook.com/v20.0/${connection.platform_user_id}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,comments_count&limit=50&access_token=${accessToken}`
            );
            if (fallbackRes.ok) {
              const fbData = await fallbackRes.json();
              instagramLivePosts = (fbData.data || []).map((m: any) => ({
                id: m.id,
                caption: m.caption || '',
                media_type: m.media_type || 'IMAGE',
                media_url: m.media_url || m.thumbnail_url,
                thumbnail_url: m.thumbnail_url || m.media_url,
                permalink: m.permalink || `https://www.instagram.com/p/${m.id}/`,
                timestamp: m.timestamp,
                comments_count: m.comments_count || 0,
                source: 'instagram_live',
              }));
            }
          }
        }
      } catch (err) {
        logger.warn('Failed to fetch live Instagram posts from Graph API', { error: err, workspaceId });
      }
    }

    // 2. Fetch platform_posts published from UNOOL to Instagram
    let unoolPosts: PublishedInstagramPost[] = [];
    try {
      const { data: dbPosts } = await supabase
        .from('platform_posts')
        .select(`
          id,
          platform_post_id,
          platform_url,
          created_at,
          published_at,
          post_variants (
            content,
            media_urls
          )
        `)
        .eq('platform', 'instagram')
        .order('created_at', { ascending: false })
        .limit(30);

      if (dbPosts && dbPosts.length > 0) {
        unoolPosts = dbPosts.map((p: any) => {
          const variant = Array.isArray(p.post_variants) ? p.post_variants[0] : p.post_variants;
          const mediaUrls = variant?.media_urls || [];
          return {
            id: p.platform_post_id || p.id,
            caption: variant?.content || '',
            media_type: 'IMAGE',
            media_url: mediaUrls[0] || undefined,
            thumbnail_url: mediaUrls[0] || undefined,
            permalink: p.platform_url || undefined,
            timestamp: p.published_at || p.created_at,
            source: 'unool_published',
          };
        });
      }
    } catch (err) {
      logger.warn('Failed to fetch platform_posts for Instagram', { error: err });
    }

    // 3. Deduplicate posts by ID or permalink
    const seenIds = new Set<string>();
    const combinedPosts: PublishedInstagramPost[] = [];

    // Prioritize live Instagram posts
    for (const p of instagramLivePosts) {
      if (p.id && !seenIds.has(p.id)) {
        seenIds.add(p.id);
        combinedPosts.push(p);
      }
    }

    // Add unool published posts not already seen
    for (const p of unoolPosts) {
      if (p.id && !seenIds.has(p.id)) {
        seenIds.add(p.id);
        combinedPosts.push(p);
      }
    }

    return NextResponse.json({
      success: true,
      connected: isConnected,
      username,
      posts: combinedPosts,
      totalCount: combinedPosts.length,
    });
  } catch (error) {
    logger.error('Error in GET /api/instagram/posts', { error });
    return NextResponse.json({ error: 'Failed to fetch Instagram posts' }, { status: 500 });
  }
}
