import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// GET /api/instagram/flagged?workspaceId=xxx&status=pending
export async function GET(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const params = request.nextUrl.searchParams;
    const workspaceId = params.get('workspaceId');
    const status = params.get('status') || 'pending';
    const page = parseInt(params.get('page') || '1', 10);
    const limit = Math.min(parseInt(params.get('limit') || '20', 10), 100);

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const offset = (page - 1) * limit;

    let query = supabase
      .from('instagram_flagged_comments')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceId)
      .order('lead_score', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: flagged, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch flagged comments', { error, workspaceId });
      return NextResponse.json({ error: 'Failed to fetch flagged comments' }, { status: 500 });
    }

    // Count by status
    const { data: countData } = await supabase
      .from('instagram_flagged_comments')
      .select('status')
      .eq('workspace_id', workspaceId);

    const statusCounts = { pending: 0, approved: 0, rejected: 0, replied: 0 };
    for (const row of countData || []) {
      if (row.status in statusCounts) {
        statusCounts[row.status as keyof typeof statusCounts]++;
      }
    }

    return NextResponse.json({
      flagged: flagged || [],
      statusCounts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('GET /api/instagram/flagged error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
