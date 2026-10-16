import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { decryptToken } from '@/lib/crypto/encryption';
import { InstagramCommentAutomation } from '@/lib/services/InstagramCommentAutomation';
import { logger } from '@/lib/logger';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';

export const dynamic = 'force-dynamic';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// POST /api/instagram/flagged/[id]/action
// Body: { action: 'approve' | 'reject' | 'reply', ownerReply?: string, workspaceId: string }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { action, ownerReply, workspaceId } = body as {
      action: 'approve' | 'reject' | 'reply';
      ownerReply?: string;
      workspaceId: string;
    };

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    if (!action) return NextResponse.json({ error: 'action required' }, { status: 400 });
    if (!['approve', 'reject', 'reply'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Verify user has access to this workspace
    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Fetch from flagged comments first
    const { data: flaggedComment } = await supabase
      .from('instagram_flagged_comments')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single();

    let flaggedDm: any = null;
    if (!flaggedComment) {
      // Check flagged DMs table
      try {
        const { data: dmRow } = await supabase
          .from('instagram_flagged_dms')
          .select('*')
          .eq('id', id)
          .eq('workspace_id', workspaceId)
          .single();
        flaggedDm = dmRow;
      } catch (dmErr) {
        logger.debug('instagram_flagged_dms query failed', { error: dmErr });
      }
    }

    if (!flaggedComment && !flaggedDm) {
      return NextResponse.json({ error: 'Flagged item not found' }, { status: 404 });
    }

    const item = flaggedComment || flaggedDm;
    const isDm = !!flaggedDm;

    if (item.status !== 'pending') {
      return NextResponse.json({ error: `Item already ${item.status}` }, { status: 409 });
    }

    if (action === 'reject') {
      if (isDm) {
        await supabase
          .from('instagram_flagged_dms')
          .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
          .eq('id', id);
      } else {
        await supabase
          .from('instagram_flagged_comments')
          .update({ status: 'rejected', resolved_at: new Date().toISOString() })
          .eq('id', id);
      }
      return NextResponse.json({ success: true, status: isDm ? 'dismissed' : 'rejected' });
    }

    // For approve or reply — need to post to Instagram
    const replyText = action === 'reply' ? ownerReply : (isDm ? item.ai_suggested_reply : item.suggested_reply);

    if (!replyText || replyText === 'SKIP') {
      return NextResponse.json({ error: 'No reply text provided' }, { status: 400 });
    }

    // Get platform connection
    const { data: connections } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'instagram')
      .eq('status', 'connected')
      .limit(1);

    if (!connections || connections.length === 0) {
      return NextResponse.json({ error: 'No active Instagram connection' }, { status: 400 });
    }

    const connection = connections[0];
    let accessToken: string;
    try {
      accessToken = await decryptToken(connection.access_token_encrypted);
    } catch {
      return NextResponse.json({ error: 'Failed to decrypt access token' }, { status: 500 });
    }

    const groqApiKey = config.GROQ_API_KEY || process.env.GROQ_API_KEY;
    const automation = new InstagramCommentAutomation(groqApiKey || '');

    if (isDm) {
      // Send DM reply
      const dmResult = await automation.sendPrivateMessage(
        accessToken,
        connection.platform_user_id,
        item.sender_id,
        replyText
      );

      if (!dmResult) {
        return NextResponse.json({ error: 'Failed to send DM reply to Instagram' }, { status: 500 });
      }

      await supabase
        .from('instagram_flagged_dms')
        .update({
          status: 'replied',
          owner_reply: action === 'reply' ? ownerReply : null,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id);

      logger.info('Flagged DM resolved', { id, action, workspaceId });
      return NextResponse.json({ success: true, status: 'replied', messageId: dmResult.messageId });
    } else {
      // Post comment reply
      const result = await automation.postPublicReply(
        accessToken,
        item.media_id || '',
        item.comment_id,
        replyText
      );

      if (!result) {
        return NextResponse.json({ error: 'Failed to post reply to Instagram' }, { status: 500 });
      }

      // Update the flagged comment status
      await supabase
        .from('instagram_flagged_comments')
        .update({
          status: 'replied',
          owner_reply: action === 'reply' ? ownerReply : null,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id);

      logger.info('Flagged comment resolved', { id, action, workspaceId });
      return NextResponse.json({ success: true, status: 'replied', replyId: result.replyId });
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('POST /api/instagram/flagged/[id]/action error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
