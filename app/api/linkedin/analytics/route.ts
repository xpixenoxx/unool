import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { decryptToken } from '@/lib/crypto/encryption';
import { logger } from '@/lib/logger';
import { fetchWithRetry } from '@/lib/utils/retry';

export const dynamic = 'force-dynamic';

const LINKEDIN_V1_API_BASE = 'https://api.linkedin.com/rest';

/**
 * GET /api/linkedin/analytics
 * 
 * Fetches real-time LinkedIn analytics:
 * - User's recent posts
 * - Engagement stats per post (reactions, comments, shares)
 * - Comments with commenter details
 * - Mentions (notifications where the user is tagged)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

    // 1. Find the LinkedIn connection for this user
    let { data: rows } = await adminSupabase
      .from('platform_connections')
      .select('*')
      .eq('workspace_id', auth.workspaceId)
      .eq('platform', 'linkedin');

    // Fallback: try userId as workspace_id
    if ((!rows || rows.length === 0) && auth.userId !== auth.workspaceId) {
      const s2 = await adminSupabase
        .from('platform_connections')
        .select('*')
        .eq('workspace_id', auth.userId)
        .eq('platform', 'linkedin');
      if (s2.data && s2.data.length > 0) rows = s2.data;
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'LinkedIn not connected' }, { status: 404 });
    }

    const connection = rows[0];
    let accessToken: string;
    try {
      accessToken = await decryptToken(connection.access_token_encrypted);
    } catch {
      return NextResponse.json({ error: 'Failed to decrypt access token. Please reconnect LinkedIn.' }, { status: 401 });
    }

    // 2. Get author URN
    const profileRes = await fetchWithRetry('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      const errText = await profileRes.text();
      logger.error('LinkedIn userinfo failed', { error: new Error(errText), status: profileRes.status });
      if (profileRes.status === 401) {
        return NextResponse.json({ error: 'LinkedIn token expired. Please reconnect.' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Failed to fetch LinkedIn profile' }, { status: 500 });
    }

    const profileData = await profileRes.json();
    const authorUrn = `urn:li:person:${profileData.sub}`;
    const displayName = profileData.name || `${profileData.given_name || ''} ${profileData.family_name || ''}`.trim();

    // 3. Fetch user's recent posts
    const postsRes = await fetchWithRetry(
      `${LINKEDIN_V1_API_BASE}/posts?author=${encodeURIComponent(authorUrn)}&q=author&count=10&sortBy=LAST_MODIFIED`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202606',
        },
      }
    );

    let posts: any[] = [];
    if (postsRes.ok) {
      const postsData = await postsRes.json();
      posts = postsData.elements || [];
    } else {
      const errText = await postsRes.text();
      logger.warn('LinkedIn posts fetch failed', { error: errText, status: postsRes.status });
    }

    // 4. For each post, fetch engagement (reactions, comments, shares)
    const enrichedPosts = await Promise.all(
      posts.slice(0, 10).map(async (post: any) => {
        const postId = post.id;
        const postUrn = postId.startsWith('urn:') ? postId : `urn:li:share:${postId}`;

        // Fetch social actions (reactions count)
        let reactions = 0;
        let commentsCount = 0;
        let shares = 0;

        try {
          const socialRes = await fetchWithRetry(
            `${LINKEDIN_V1_API_BASE}/socialActions/${encodeURIComponent(postUrn)}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0',
                'LinkedIn-Version': '202606',
              },
            }
          );

          if (socialRes.ok) {
            const socialData = await socialRes.json();
            reactions = socialData.likesSummary?.totalLikes || 0;
            commentsCount = socialData.commentsSummary?.totalFirstLevelComments || socialData.commentsSummary?.totalComments || 0;
            shares = socialData.sharesSummary?.totalShares || 0;
          }
        } catch (e) {
          logger.warn('Failed to fetch social actions for post', { postId });
        }

        // Fetch comments
        let comments: any[] = [];
        try {
          const commentsRes = await fetchWithRetry(
            `${LINKEDIN_V1_API_BASE}/socialActions/${encodeURIComponent(postUrn)}/comments?count=10`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0',
                'LinkedIn-Version': '202606',
              },
            }
          );

          if (commentsRes.ok) {
            const commentsData = await commentsRes.json();
            const rawComments = commentsData.elements || [];

            comments = rawComments.map((c: any) => ({
              id: c['$URN'] || c.id || '',
              text: c.message?.text || c.comment || '',
              authorName: c.actor?.['com.linkedin.voyager.feed.MiniProfile']?.firstName
                ? `${c.actor['com.linkedin.voyager.feed.MiniProfile'].firstName} ${c.actor['com.linkedin.voyager.feed.MiniProfile'].lastName}`
                : c.actor?.name || 'LinkedIn User',
              authorHeadline: c.actor?.['com.linkedin.voyager.feed.MiniProfile']?.occupation || '',
              likes: c.likesSummary?.totalLikes || 0,
              createdAt: c.created?.time ? new Date(c.created.time).toISOString() : null,
            }));
          }
        } catch (e) {
          logger.warn('Failed to fetch comments for post', { postId });
        }

        // Extract post text
        const postText = post.commentary || post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '';

        return {
          id: postId,
          text: postText,
          createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : post.created?.time ? new Date(post.created.time).toISOString() : null,
          reactions,
          comments: commentsCount,
          shares,
          commentsList: comments,
          url: `https://www.linkedin.com/feed/update/${postId}`,
        };
      })
    );

    // 5. Return the analytics data
    return NextResponse.json({
      profile: {
        name: displayName,
        avatarUrl: profileData.picture || null,
        linkedinUrl: `https://www.linkedin.com/in/${profileData.sub}`,
      },
      posts: enrichedPosts,
      totalPosts: posts.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('LinkedIn analytics fetch failed', { error: err });
    return NextResponse.json({ error: 'Failed to fetch LinkedIn analytics' }, { status: 500 });
  }
}
