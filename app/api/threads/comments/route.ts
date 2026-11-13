import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// GET /api/threads/comments?workspaceId=xxx&page=1&limit=25&classification=all
export async function GET(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const params = request.nextUrl.searchParams;
    const workspaceId = params.get('workspaceId');
    const page = parseInt(params.get('page') || '1', 10);
    const limit = Math.min(parseInt(params.get('limit') || '25', 10), 100);
    const classification = params.get('classification');
    const search = params.get('search');
    const flagged = params.get('flagged') === 'true';

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('threads_reply_logs')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .not('reply_id', 'like', 'test_%')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (classification && classification !== 'all') {
      query = query.eq('classification', classification);
    }

    if (search) {
      query = query.ilike('reply_text', `%${search}%`);
    }

    if (flagged) {
      query = query.eq('flagged_for_review', true);
    }

    const { data: replies, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch Threads reply logs', { error, workspaceId });
      return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 });
    }

    // Aggregate stats
    const { data: statsData } = await supabaseAdmin
      .from('threads_reply_logs')
      .select('classification, auto_replied, event_type, flagged_for_review')
      .eq('workspace_id', workspaceId)
      .not('reply_id', 'like', 'test_%');

    const stats = {
      total: count || 0,
      byClassification: {
        positive: 0,
        question: 0,
        link_request: 0,
        purchase_intent: 0,
        negative: 0,
        spam: 0,
        harmful: 0,
        unrelated: 0,
      } as Record<string, number>,
      autoReplied: 0,
      repliesCount: 0,
      mentionsCount: 0,
      flagged: 0,
    };

    for (const row of statsData || []) {
      const cls = (row.classification || 'unrelated').toLowerCase();
      if (cls in stats.byClassification) {
        stats.byClassification[cls]++;
      }
      if (row.auto_replied) stats.autoReplied++;
      if (row.flagged_for_review) stats.flagged++;
      if (row.event_type === 'mention') {
        stats.mentionsCount++;
      } else {
        stats.repliesCount++;
      }
    }

    return NextResponse.json({
      comments: replies || [],
      stats,
      page,
      limit,
      total: count || 0,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('GET /api/threads/comments error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

