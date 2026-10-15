import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// GET /api/instagram/dms?workspaceId=xxx&page=1&limit=20
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

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const offset = (page - 1) * limit;

    let query = supabase
      .from('instagram_dm_logs')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (classification && classification !== 'all') {
      query = query.eq('classification', classification);
    }

    const { data: dms, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch DM logs', { error, workspaceId });
      return NextResponse.json({ error: 'Failed to fetch DMs' }, { status: 500 });
    }

    // Stats
    const { data: statsData } = await supabase
      .from('instagram_dm_logs')
      .select('classification, auto_replied, escalated, lead_score')
      .eq('workspace_id', workspaceId);

    const stats = {
      total: count || 0,
      autoReplied: 0,
      escalated: 0,
      hotLeads: 0,
    };

    for (const row of statsData || []) {
      if (row.auto_replied) stats.autoReplied++;
      if (row.escalated) stats.escalated++;
      if ((row.lead_score || 0) >= 2) stats.hotLeads++;
    }

    return NextResponse.json({
      dms: dms || [],
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
    logger.error('GET /api/instagram/dms error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
