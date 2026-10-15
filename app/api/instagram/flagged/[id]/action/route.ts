import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { decryptToken } from '@/lib/crypto/encryption';
import { InstagramCommentAutomation } from '@/lib/services/InstagramCommentAutomation';
import { logger } from '@/lib/logger';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';

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

    // Fetch the flagged comment
    const { data: flagged, error: fetchError } = await supabase
      .from('instagram_flagged_comments')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single();

    if (fetchError || !flagged) {
      return NextResponse.json({ error: 'Flagged comment not found' }, { status: 404 });
    }

    if (flagged.status !== 'pending') {
      return NextResponse.json({ error: `Comment already ${flagged.status}` }, { status: 409 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;

    if (action === 'reject') {
      await supabase
        .from('instagram_flagged_comments')
        .update({ status: 'rejected', resolved_at: new Date().toISOString() })
        .eq('id', id);

      return NextResponse.json({ success: true, status: 'rejected' });
    }

    // For approve or reply — need to post to Instagram
    const replyText = action === 'reply' ? ownerReply : flagged.suggested_reply;

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

    let accessToken: string;
    try {
      accessToken = await decryptToken(connections[0].access_token_encrypted);
    } catch {
      return NextResponse.json({ error: 'Failed to decrypt access token' }, { status: 500 });
    }

    // Post the reply
    const automation = new InstagramCommentAutomation(groqApiKey || '');
    const result = await automation.postPublicReply(
      accessToken,
      flagged.media_id || '',
      flagged.comment_id,
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
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('POST /api/instagram/flagged/[id]/action error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
