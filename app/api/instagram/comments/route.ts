import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// GET /api/instagram/comments?workspaceId=xxx&page=1&limit=20&classification=positive
export async function GET(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const params = request.nextUrl.searchParams;
    const workspaceId = params.get('workspaceId');
    const page = parseInt(params.get('page') || '1', 10);
    const limit = Math.min(parseInt(params.get('limit') || '20', 10), 100);
    const classification = params.get('classification');
    const search = params.get('search');

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    // Verify user has access to this workspace
    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const offset = (page - 1) * limit;

    // Build query - exclude simulation test artifacts so feed displays real Instagram comments
    let query = supabase
      .from('instagram_comment_logs')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .not('comment_id', 'like', 'test_%')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (classification && classification !== 'all') {
      query = query.eq('classification', classification);
    }

    if (search) {
      query = query.ilike('comment_text', `%${search}%`);
    }

    const { data: comments, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch comment logs', { error, workspaceId });
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    // Aggregate stats - exclude simulation test artifacts
    const { data: statsData } = await supabase
      .from('instagram_comment_logs')
      .select('classification, auto_replied, dm_sent, flagged_for_review')
      .eq('workspace_id', workspaceId)
      .not('comment_id', 'like', 'test_%');

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
      dmsSent: 0,
      flagged: 0,
    };

    for (const row of statsData || []) {
      if (row.classification in stats.byClassification) {
        stats.byClassification[row.classification]++;
      }
      if (row.auto_replied) stats.autoReplied++;
      if (row.dm_sent) stats.dmsSent++;
      if (row.flagged_for_review) stats.flagged++;
    }

    return NextResponse.json({
      comments: comments || [],
      stats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('GET /api/instagram/comments error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
