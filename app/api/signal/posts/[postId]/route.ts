import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { loadWorkspaceSignalAnalytics } from '@/lib/analytics/signalDataLoader';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  const auth = await getCurrentAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { postId } = await context.params;
  if (!postId) {
    return NextResponse.json({ error: 'Missing postId' }, { status: 400 });
  }

  try {
    const tz = request.nextUrl.searchParams.get('tz') || 'UTC';
    const { analytics } = await loadWorkspaceSignalAnalytics(auth.workspaceId, {
      range: 'all',
      timezone: tz,
    }, 300);

    const post = analytics.posts.find(p => p.id === postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Best-effort snapshot trajectory lookup (handles environments before migration cleanly)
    let snapshots: Array<{
      id: string;
      platform: string;
      capturedAt: string;
      likes: number;
      comments: number;
      shares: number;
      saves: number;
      clicks: number;
      views: number | null;
      totalEngagements: number;
    }> = [];

    try {
      const { data: snapRows, error: snapErr } = await supabaseAdmin
        .from('post_engagement_snapshots')
        .select('id, platform, captured_at, likes, comments, shares, saves, clicks, views, total_engagements')
        .eq('workspace_id', auth.workspaceId)
        .eq('post_id', postId)
        .order('captured_at', { ascending: true })
        .limit(100);

      if (!snapErr && Array.isArray(snapRows)) {
        snapshots = snapRows.map((s: any) => ({
          id: s.id,
          platform: s.platform,
          capturedAt: s.captured_at,
          likes: Number(s.likes || 0),
          comments: Number(s.comments || 0),
          shares: Number(s.shares || 0),
          saves: Number(s.saves || 0),
          clicks: Number(s.clicks || 0),
          views: s.views === null || s.views === undefined ? null : Number(s.views),
          totalEngagements: Number(s.total_engagements || 0),
        }));
      }
    } catch {
      // Optional table not yet migrated
    }

    return NextResponse.json({
      post,
      snapshots,
    });
  } catch (err) {
    logger.error('Failed to fetch Signal post inspector detail', {
      postId,
      workspaceId: auth.workspaceId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Failed to load post detail' },
      { status: 500 }
    );
  }
}
