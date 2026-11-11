import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { extractSignedRequestFromBody, verifyMetaSignedRequest } from '@/lib/webhooks/metaSignedRequest';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/meta/deauthorize
 *
 * Meta Platform Terms Deauthorize Callback.
 * Triggered when a user removes the Unool app from their Instagram/Facebook account settings.
 * Immediately revokes stored OAuth tokens and disables automation for that connection.
 */
export async function POST(request: NextRequest) {
  try {
    const signedRequest = await extractSignedRequestFromBody(request);
    if (!signedRequest) {
      return NextResponse.json({ error: 'Missing signed_request parameter' }, { status: 400 });
    }

    const payload = verifyMetaSignedRequest(signedRequest);
    if (!payload) {
      logger.warn('Meta deauthorize webhook: invalid signed_request signature');
      return NextResponse.json({ error: 'Invalid signed_request signature' }, { status: 403 });
    }

    const metaUserId = payload.user_id;

    const { data: connections } = await supabaseAdmin
      .from('platform_connections')
      .select('id, workspace_id')
      .in('platform', ['instagram', 'facebook', 'threads'])
      .or(`platform_user_id.eq.${metaUserId},scopes.cs.{ig_business_id:${metaUserId}}`);

    if (connections && connections.length > 0) {
      const connIds = connections.map((c: any) => c.id);
      const workspaceIds = Array.from(
        new Set(connections.map((c: any) => c.workspace_id).filter(Boolean))
      );

      await supabaseAdmin
        .from('platform_connections')
        .update({
          status: 'revoked',
          access_token_encrypted: '',
          refresh_token_encrypted: null,
          updated_at: new Date().toISOString(),
        })
        .in('id', connIds);

      if (workspaceIds.length > 0) {
        await supabaseAdmin
          .from('instagram_automation_config')
          .update({
            enabled: false,
            dm_auto_reply_enabled: false,
            updated_at: new Date().toISOString(),
          })
          .in('workspace_id', workspaceIds);
      }
    }

    logger.info('Processed Meta deauthorize callback', {
      metaUserId,
      revokedConnections: connections?.length || 0,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Meta deauthorize webhook failed', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

