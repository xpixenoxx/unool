import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';

export const dynamic = 'force-dynamic';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

interface UnifiedFlaggedItem {
  id: string;
  item_type: 'comment' | 'dm';
  comment_id: string;
  media_id?: string;
  comment_text: string;
  commenter_username: string;
  classification: string;
  suggested_reply: string;
  reasoning: string;
  status: string;
  lead_score: number;
  priority: string;
  owner_reply?: string;
  created_at: string;
}

// GET /api/instagram/flagged?workspaceId=xxx&status=pending&type=all|comments|dms
export async function GET(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const params = request.nextUrl.searchParams;
    const workspaceId = params.get('workspaceId');
    const status = params.get('status') || 'pending';
    const type = params.get('type') || 'all'; // 'all' | 'comments' | 'dms'
    const page = parseInt(params.get('page') || '1', 10);
    const limit = Math.min(parseInt(params.get('limit') || '20', 10), 100);

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const items: UnifiedFlaggedItem[] = [];
    const statusCounts = { pending: 0, approved: 0, rejected: 0, replied: 0 };

    // 1. Fetch flagged comments (unless type === 'dms')
    if (type !== 'dms') {
      let commentQuery = supabase
        .from('instagram_flagged_comments')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('lead_score', { ascending: false })
        .order('created_at', { ascending: false });

      if (status !== 'all') {
        commentQuery = commentQuery.eq('status', status);
      }

      const { data: comments, error: commentErr } = await commentQuery;
      if (commentErr) {
        logger.warn('Failed to fetch flagged comments', { error: commentErr, workspaceId });
      } else if (comments) {
        for (const row of comments) {
          items.push({
            id: row.id,
            item_type: 'comment',
            comment_id: row.comment_id,
            media_id: row.media_id,
            comment_text: row.comment_text,
            commenter_username: row.commenter_username,
            classification: row.classification,
            suggested_reply: row.suggested_reply,
            reasoning: row.reasoning,
            status: row.status,
            lead_score: row.lead_score || 0,
            priority: row.priority || (row.lead_score >= 2 ? 'high' : 'normal'),
            owner_reply: row.owner_reply,
            created_at: row.created_at,
          });
        }
      }

      // Counts for comments
      const { data: commentCounts } = await supabase
        .from('instagram_flagged_comments')
        .select('status')
        .eq('workspace_id', workspaceId);

      for (const row of commentCounts || []) {
        if (row.status in statusCounts) {
          statusCounts[row.status as keyof typeof statusCounts]++;
        }
      }
    }

    // 2. Fetch flagged DMs (unless type === 'comments')
    if (type !== 'comments') {
      try {
        let dmQuery = supabase
          .from('instagram_flagged_dms')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('lead_score', { ascending: false })
          .order('created_at', { ascending: false });

        if (status !== 'all') {
          // Note: for DMs, status can be 'pending', 'replied', 'dismissed' (normalize dismissed -> rejected)
          const dbStatus = status === 'rejected' ? 'dismissed' : status;
          dmQuery = dmQuery.eq('status', dbStatus);
        }

        const { data: dms, error: dmErr } = await dmQuery;
        if (!dmErr && dms) {
          for (const row of dms) {
            const normalizedStatus = row.status === 'dismissed' ? 'rejected' : row.status;
            items.push({
              id: row.id,
              item_type: 'dm',
              comment_id: row.message_id,
              comment_text: row.message_text,
              commenter_username: row.sender_username || row.sender_id,
              classification: row.classification,
              suggested_reply: row.ai_suggested_reply || '',
              reasoning: row.reasoning,
              status: normalizedStatus,
              lead_score: row.lead_score || 0,
              priority: row.lead_score >= 2 ? 'high' : 'normal',
              owner_reply: row.owner_reply,
              created_at: row.created_at,
            });
          }
        }

        // Counts for DMs
        const { data: dmCounts } = await supabase
          .from('instagram_flagged_dms')
          .select('status')
          .eq('workspace_id', workspaceId);

        for (const row of dmCounts || []) {
          const s = row.status === 'dismissed' ? 'rejected' : row.status;
          if (s in statusCounts) {
            statusCounts[s as keyof typeof statusCounts]++;
          }
        }
      } catch (dmFetchErr) {
        // Table might not exist yet if migration hasn't been applied
        logger.debug('instagram_flagged_dms table query skipped or failed', { error: dmFetchErr });
      }
    }

    // Sort unified items: highest lead_score first, then newest
    items.sort((a, b) => {
      if (b.lead_score !== a.lead_score) {
        return b.lead_score - a.lead_score;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const total = items.length;
    const offset = (page - 1) * limit;
    const paginatedItems = items.slice(offset, offset + limit);

    return NextResponse.json({
      flagged: paginatedItems,
      statusCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('GET /api/instagram/flagged error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
