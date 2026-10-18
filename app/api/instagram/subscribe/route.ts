import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { decryptToken } from '@/lib/crypto/encryption';
import { InstagramCommentAutomation } from '@/lib/services/InstagramCommentAutomation';
import { logger } from '@/lib/logger';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// POST /api/instagram/subscribe
// Body: { workspaceId: string }
// Subscribes the connected Instagram account to the app's webhooks in Meta Graph API
export async function POST(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const workspaceId = body.workspaceId || request.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Fetch active Instagram connection
    const { data: connections } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', 'instagram')
      .eq('status', 'connected')
      .limit(1);

    if (!connections || connections.length === 0) {
      return NextResponse.json({ error: 'No active Instagram connection found for this workspace' }, { status: 400 });
    }

    const connection = connections[0];
    let accessToken: string;
    try {
      accessToken = await decryptToken(connection.access_token_encrypted);
    } catch {
      return NextResponse.json({ error: 'Failed to decrypt access token' }, { status: 500 });
    }

    // 1. Subscribe account to webhooks
    const subscribed = await InstagramCommentAutomation.subscribeAccountToWebhook(
      accessToken,
      connection.platform_user_id
    );

    // 2. Query subscribed_apps from Meta to verify current status
    let subscribedFields: string[] = [];
    try {
      let verifyRes = await fetch(
        `https://graph.instagram.com/v20.0/me/subscribed_apps?access_token=${accessToken}`
      );
      if (!verifyRes.ok) {
        verifyRes = await fetch(
          `https://graph.instagram.com/v20.0/${connection.platform_user_id}/subscribed_apps?access_token=${accessToken}`
        );
      }
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        subscribedFields = verifyData.data?.[0]?.subscribed_fields || [];
      }
    } catch (e) {
      logger.warn('Failed to query subscribed_apps after subscribe', { error: e });
    }

    logger.info('Instagram webhook subscription synced', {
      workspaceId,
      platformUserId: connection.platform_user_id,
      subscribed,
      subscribedFields,
    });

    return NextResponse.json({
      success: true,
      subscribed,
      username: connection.username,
      platformUserId: connection.platform_user_id,
      subscribedFields: subscribedFields.length > 0 ? subscribedFields : ['comments', 'messages'],
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('POST /api/instagram/subscribe error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
