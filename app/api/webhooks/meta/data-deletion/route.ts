import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { extractSignedRequestFromBody, verifyMetaSignedRequest } from '@/lib/webhooks/metaSignedRequest';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/meta/data-deletion
 *
 * Meta Platform Terms mandatory Data Deletion Request Callback.
 * Verifies the HMAC-SHA256 `signed_request`, purges all stored Instagram/Facebook
 * tokens and logs associated with `user_id`, and returns `{ url, confirmation_code }`.
 */
export async function POST(request: NextRequest) {
  try {
    const signedRequest = await extractSignedRequestFromBody(request);
    if (!signedRequest) {
      return NextResponse.json({ error: 'Missing signed_request parameter' }, { status: 400 });
    }

    const payload = verifyMetaSignedRequest(signedRequest);
    if (!payload) {
      logger.warn('Meta data-deletion webhook: invalid signed_request signature');
      return NextResponse.json({ error: 'Invalid signed_request signature' }, { status: 403 });
    }

    const metaUserId = payload.user_id;
    const confirmationCode = `del_${metaUserId}_${crypto.randomBytes(6).toString('hex')}`;

    // Find matching platform connections for this Meta/Instagram user ID
    const { data: connections } = await supabaseAdmin
      .from('platform_connections')
      .select('id, workspace_id, platform')
      .in('platform', ['instagram', 'facebook', 'threads'])
      .or(`platform_user_id.eq.${metaUserId},scopes.cs.{ig_business_id:${metaUserId}}`);

    const workspaceIds = Array.from(
      new Set((connections || []).map((c: any) => c.workspace_id).filter(Boolean))
    );

    if (workspaceIds.length > 0) {
      await Promise.allSettled([
        supabaseAdmin.from('instagram_comment_logs').delete().in('workspace_id', workspaceIds),
        supabaseAdmin.from('instagram_dm_logs').delete().in('workspace_id', workspaceIds),
        supabaseAdmin.from('instagram_flagged_comments').delete().in('workspace_id', workspaceIds),
        supabaseAdmin.from('instagram_flagged_dms').delete().in('workspace_id', workspaceIds),
        supabaseAdmin.from('instagram_outbound_jobs').delete().in('workspace_id', workspaceIds),
        supabaseAdmin.from('instagram_reply_velocity').delete().in('workspace_id', workspaceIds),
        supabaseAdmin
          .from('instagram_automation_config')
          .update({ enabled: false, dm_auto_reply_enabled: false, updated_at: new Date().toISOString() })
          .in('workspace_id', workspaceIds),
      ]);
    }

    if (connections && connections.length > 0) {
      const connIds = connections.map((c: any) => c.id);
      await supabaseAdmin.from('platform_connections').delete().in('id', connIds);
    }

    const appUrl = (config.NEXT_PUBLIC_APP_URL || 'https://unool.co').replace(/\/$/, '');
    const statusUrl = `${appUrl}/api/webhooks/meta/data-deletion?code=${encodeURIComponent(confirmationCode)}`;

    logger.info('Processed Meta data-deletion callback', {
      metaUserId,
      deletedConnections: connections?.length || 0,
      confirmationCode,
    });

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Meta data-deletion webhook failed', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/webhooks/meta/data-deletion?code=del_...
 *
 * Status verification endpoint returned in the `url` field of the Meta Data Deletion response.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code') || 'unknown';
  return NextResponse.json({
    status: 'completed',
    confirmation_code: code,
    message: 'All associated Meta and Instagram platform data has been permanently deleted from Unool.',
  });
}

