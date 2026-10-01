import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { decryptToken } from '@/lib/crypto/encryption';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const LI_HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'X-Restli-Protocol-Version': '2.0.0',
  'LinkedIn-Version': '202606',
});

/**
 * GET /api/linkedin/analytics
 *
 * Fetches LinkedIn analytics by:
 * 1. Reading posts published through Unool from our database
 * 2. Fetching real-time engagement data from LinkedIn's socialActions API
 *    (which works with w_member_social scope)
 */
export async function GET(request: NextRequest) {
  const debug: string[] = [];

  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized', debug: ['auth_null'] }, { status: 401 });
    }
    debug.push(`auth:uid=${auth.userId.slice(0, 8)},wid=${auth.workspaceId.slice(0, 8)}`);

    const adminSupabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    // ── Find LinkedIn connection ──────────────────────────
    let { data: connRows } = await adminSupabase
      .from('platform_connections')
      .select('*')
      .eq('workspace_id', auth.workspaceId)
      .eq('platform', 'linkedin');

    if ((!connRows || connRows.length === 0) && auth.userId !== auth.workspaceId) {
      const s2 = await adminSupabase
        .from('platform_connections')
        .select('*')
        .eq('workspace_id', auth.userId)
        .eq('platform', 'linkedin');
      if (s2.data && s2.data.length > 0) connRows = s2.data;
    }

    // Strategy 3: check all workspaces
    if (!connRows || connRows.length === 0) {
      const { data: memberships } = await adminSupabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', auth.userId);
      if (memberships) {
        for (const m of memberships) {
          const s3 = await adminSupabase
            .from('platform_connections')
            .select('*')
            .eq('workspace_id', m.workspace_id)
            .eq('platform', 'linkedin');
          if (s3.data && s3.data.length > 0) {
            connRows = s3.data;
            break;
          }
        }
      }
    }

    if (!connRows || connRows.length === 0) {
      return NextResponse.json({ error: 'LinkedIn not connected. Please connect LinkedIn from the dashboard first.', debug }, { status: 404 });
    }

    const connection = connRows[0];
    debug.push(`conn:${connection.id.slice(0, 8)},status=${connection.status}`);

    let accessToken: string;
    try {
      accessToken = await decryptToken(connection.access_token_encrypted);
      debug.push('token_ok');
    } catch (e) {
      return NextResponse.json({ error: 'Failed to decrypt access token. Please reconnect LinkedIn.', debug }, { status: 401 });
    }

    // ── Get profile ───────────────────────────────────────
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      const errText = await profileRes.text();
      debug.push(`profile_err:${profileRes.status}`);
      return NextResponse.json({
        error: profileRes.status === 401
          ? 'LinkedIn token expired. Please reconnect your LinkedIn account.'
          : `LinkedIn profile fetch failed (${profileRes.status})`,
        debug,
      }, { status: profileRes.status === 401 ? 401 : 500 });
    }

    const profileData = await profileRes.json();
    const displayName = profileData.name || `${profileData.given_name || ''} ${profileData.family_name || ''}`.trim();
    debug.push(`profile:${displayName}`);

    // ── Fetch posts published through Unool from our DB ───
    // Get all LinkedIn platform_posts for this connection
    const { data: platformPosts, error: ppErr } = await adminSupabase
      .from('platform_posts')
      .select('*, post_variant:post_variant_id(*, post:post_id(*))')
      .eq('platform_connection_id', connection.id)
      .order('created_at', { ascending: false })
      .limit(20);

    debug.push(`db_posts:${platformPosts?.length || 0},err=${ppErr?.message || 'none'}`);

    // If no posts found via connection id, try finding via workspace posts
    let allPosts = platformPosts || [];

    if (allPosts.length === 0) {
      // Broader search: find all posts for this workspace that have linkedin variants
      const { data: wsPosts } = await adminSupabase
        .from('posts')
        .select('id, content, created_at')
        .eq('workspace_id', auth.workspaceId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(20);

      if (wsPosts && wsPosts.length > 0) {
        const postIds = wsPosts.map((p: any) => p.id);
        const { data: variants } = await adminSupabase
          .from('post_variants')
          .select('id, post_id, adapted_content, platform, status, platform_post_id, created_at')
          .in('post_id', postIds)
          .eq('platform', 'linkedin')
          .eq('status', 'published');

        if (variants && variants.length > 0) {
          const variantIds = variants.map((v: any) => v.id);
          const { data: pPosts } = await adminSupabase
            .from('platform_posts')
            .select('*')
            .in('post_variant_id', variantIds)
            .order('created_at', { ascending: false });

          if (pPosts && pPosts.length > 0) {
            // Enrich with variant/post data
            allPosts = pPosts.map((pp: any) => {
              const variant = variants.find((v: any) => v.id === pp.post_variant_id);
              const post = wsPosts.find((p: any) => p.id === variant?.post_id);
              return {
                ...pp,
                post_variant: variant ? {
                  ...variant,
                  post: post || null,
                } : null,
              };
            });
          }
        }
        debug.push(`ws_posts_search:variants=${allPosts.length}`);
      }
    }

    if (allPosts.length === 0) {
      return NextResponse.json({
        profile: {
          name: displayName,
          avatarUrl: profileData.picture || null,
          linkedinUrl: `https://www.linkedin.com/in/${profileData.sub}`,
        },
        posts: [],
        totalPosts: 0,
        fetchedAt: new Date().toISOString(),
        debug,
        postsError: 'No posts published through Unool were found. Publish a post via the Studio to see analytics here.',
      });
    }

    // ── Enrich each post with real-time engagement from LinkedIn ──
    const enrichedPosts = await Promise.all(
      allPosts.slice(0, 10).map(async (pp: any) => {
        const platformPostId = pp.platform_post_id || '';
        const postUrn = platformPostId.startsWith('urn:') ? platformPostId : `urn:li:share:${platformPostId}`;
        const variant = pp.post_variant;
        const postText = variant?.adapted_content || variant?.post?.content || '';

        let reactions = 0;
        let commentsCount = 0;
        let shares = 0;
        let engagementDebug = '';

        // Fetch real-time engagement via socialActions
        try {
          const socialUrl = `https://api.linkedin.com/rest/socialActions/${encodeURIComponent(postUrn)}`;
          const socialRes = await fetch(socialUrl, {
            headers: LI_HEADERS(accessToken),
          });
          if (socialRes.ok) {
            const d = await socialRes.json();
            reactions = d.likesSummary?.totalLikes || 0;
            commentsCount = d.commentsSummary?.totalFirstLevelComments || d.commentsSummary?.totalComments || 0;
            shares = d.sharesSummary?.totalShares || 0;
            engagementDebug = `ok:r=${reactions},c=${commentsCount},s=${shares}`;
          } else {
            const errText = await socialRes.text();
            engagementDebug = `err:${socialRes.status}:${errText.slice(0, 100)}`;
            // Use stored engagement as fallback
            const stored = pp.engagement || {};
            reactions = stored.likes || 0;
            commentsCount = stored.comments || 0;
            shares = stored.shares || 0;
          }
        } catch (e) {
          engagementDebug = `catch:${e instanceof Error ? e.message : String(e)}`;
          const stored = pp.engagement || {};
          reactions = stored.likes || 0;
          commentsCount = stored.comments || 0;
          shares = stored.shares || 0;
        }

        debug.push(`post:${platformPostId.slice(0, 20)}:${engagementDebug}`);

        // Fetch comments
        let commentsList: any[] = [];
        try {
          const commentsRes = await fetch(
            `https://api.linkedin.com/rest/socialActions/${encodeURIComponent(postUrn)}/comments?count=10`,
            { headers: LI_HEADERS(accessToken) }
          );
          if (commentsRes.ok) {
            const cd = await commentsRes.json();
            commentsList = (cd.elements || []).map((c: any) => ({
              id: c['$URN'] || c.id || '',
              text: c.message?.text || c.comment || '',
              authorName: c.actor?.name || 'LinkedIn User',
              authorHeadline: c.actor?.headline || '',
              likes: c.likesSummary?.totalLikes || 0,
              createdAt: c.created?.time ? new Date(c.created.time).toISOString() : null,
            }));
          }
        } catch { /* skip */ }

        return {
          id: platformPostId,
          text: postText,
          createdAt: pp.created_at || null,
          reactions,
          comments: commentsCount,
          shares,
          commentsList,
          url: pp.platform_url || `https://www.linkedin.com/feed/update/${platformPostId}`,
        };
      })
    );

    debug.push(`enriched:${enrichedPosts.length}`);

    return NextResponse.json({
      profile: {
        name: displayName,
        avatarUrl: profileData.picture || null,
        linkedinUrl: `https://www.linkedin.com/in/${profileData.sub}`,
      },
      posts: enrichedPosts,
      totalPosts: enrichedPosts.length,
      fetchedAt: new Date().toISOString(),
      debug,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    debug.push(`catch:${err.message}`);
    logger.error('LinkedIn analytics fetch failed', { error: err });
    return NextResponse.json({ error: `Failed to fetch LinkedIn analytics: ${err.message}`, debug }, { status: 500 });
  }
}
