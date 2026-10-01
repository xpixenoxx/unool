import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { decryptToken } from '@/lib/crypto/encryption';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const LINKEDIN_REST = 'https://api.linkedin.com/rest';
const LI_HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'X-Restli-Protocol-Version': '2.0.0',
  'LinkedIn-Version': '202606',
});

/**
 * GET /api/linkedin/analytics
 *
 * Fetches real-time LinkedIn analytics using the stored access token.
 * Returns detailed debug info on failure so we can pinpoint issues.
 */
export async function GET(request: NextRequest) {
  const debug: string[] = [];

  try {
    // ── Auth ───────────────────────────────────────────────
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized', debug: ['auth_null'] }, { status: 401 });
    }
    debug.push(`auth:uid=${auth.userId.slice(0, 8)},wid=${auth.workspaceId.slice(0, 8)}`);

    // ── Find LinkedIn connection ──────────────────────────
    const adminSupabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    let { data: rows } = await adminSupabase
      .from('platform_connections')
      .select('*')
      .eq('workspace_id', auth.workspaceId)
      .eq('platform', 'linkedin');

    if ((!rows || rows.length === 0) && auth.userId !== auth.workspaceId) {
      const s2 = await adminSupabase
        .from('platform_connections')
        .select('*')
        .eq('workspace_id', auth.userId)
        .eq('platform', 'linkedin');
      if (s2.data && s2.data.length > 0) rows = s2.data;
    }

    // Strategy 3: check all workspaces the user belongs to
    if (!rows || rows.length === 0) {
      const { data: memberships } = await adminSupabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', auth.userId);

      if (memberships && memberships.length > 0) {
        for (const m of memberships) {
          const s3 = await adminSupabase
            .from('platform_connections')
            .select('*')
            .eq('workspace_id', m.workspace_id)
            .eq('platform', 'linkedin');
          if (s3.data && s3.data.length > 0) {
            rows = s3.data;
            debug.push(`found_in_member_ws=${m.workspace_id.slice(0, 8)}`);
            break;
          }
        }
      }
    }

    if (!rows || rows.length === 0) {
      debug.push('no_linkedin_connection_found');
      return NextResponse.json({ error: 'LinkedIn not connected. Please connect LinkedIn from the dashboard first.', debug }, { status: 404 });
    }

    debug.push(`connection_id=${rows[0].id.slice(0, 8)},status=${rows[0].status}`);

    const connection = rows[0];
    let accessToken: string;
    try {
      accessToken = await decryptToken(connection.access_token_encrypted);
      debug.push('token_decrypted');
    } catch (e) {
      debug.push(`decrypt_failed:${e instanceof Error ? e.message : String(e)}`);
      return NextResponse.json({ error: 'Failed to decrypt access token. Please reconnect LinkedIn.', debug }, { status: 401 });
    }

    // ── Get author profile ────────────────────────────────
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      const errText = await profileRes.text();
      debug.push(`profile_failed:${profileRes.status}:${errText.slice(0, 200)}`);
      if (profileRes.status === 401) {
        return NextResponse.json({ error: 'LinkedIn token expired. Please reconnect your LinkedIn account.', debug }, { status: 401 });
      }
      return NextResponse.json({ error: `LinkedIn profile fetch failed (${profileRes.status})`, debug }, { status: 500 });
    }

    const profileData = await profileRes.json();
    const authorUrn = `urn:li:person:${profileData.sub}`;
    const displayName = profileData.name || `${profileData.given_name || ''} ${profileData.family_name || ''}`.trim();
    debug.push(`profile_ok:${displayName}:urn=${authorUrn}`);

    // ── Fetch user's posts ────────────────────────────────
    const postsUrl = `${LINKEDIN_REST}/posts?q=author&author=${encodeURIComponent(authorUrn)}&count=10&sortBy=LAST_MODIFIED`;
    debug.push(`posts_url=${postsUrl}`);

    const postsRes = await fetch(postsUrl, { headers: LI_HEADERS(accessToken) });

    let posts: any[] = [];
    if (postsRes.ok) {
      const postsData = await postsRes.json();
      posts = postsData.elements || [];
      debug.push(`posts_ok:count=${posts.length}`);
    } else {
      const errText = await postsRes.text();
      debug.push(`posts_failed:${postsRes.status}:${errText.slice(0, 300)}`);
      
      // If posts fetch fails, still return profile with empty posts
      // (might be a scope issue — w_member_social may not allow reading posts on some apps)
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
        postsError: `LinkedIn returned ${postsRes.status}. ${errText.slice(0, 200)}`,
      });
    }

    // ── Enrich each post with engagement data ─────────────
    const enrichedPosts = await Promise.all(
      posts.slice(0, 10).map(async (post: any) => {
        const postId = post.id || '';
        const postUrn = postId.startsWith('urn:') ? postId : `urn:li:share:${postId}`;

        let reactions = 0;
        let commentsCount = 0;
        let shares = 0;

        // Fetch social actions
        try {
          const socialRes = await fetch(
            `${LINKEDIN_REST}/socialActions/${encodeURIComponent(postUrn)}`,
            { headers: LI_HEADERS(accessToken) }
          );
          if (socialRes.ok) {
            const d = await socialRes.json();
            reactions = d.likesSummary?.totalLikes || 0;
            commentsCount = d.commentsSummary?.totalFirstLevelComments || d.commentsSummary?.totalComments || 0;
            shares = d.sharesSummary?.totalShares || 0;
          }
        } catch { /* skip */ }

        // Fetch comments
        let commentsList: any[] = [];
        try {
          const commentsRes = await fetch(
            `${LINKEDIN_REST}/socialActions/${encodeURIComponent(postUrn)}/comments?count=10`,
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

        const postText = post.commentary || post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '';

        return {
          id: postId,
          text: postText,
          createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : post.created?.time ? new Date(post.created.time).toISOString() : null,
          reactions,
          comments: commentsCount,
          shares,
          commentsList,
          url: `https://www.linkedin.com/feed/update/${postId}`,
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
      totalPosts: posts.length,
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
