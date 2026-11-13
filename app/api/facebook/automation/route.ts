import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { isAutomationEnabledServer } from '@/lib/feature-flags-server';
import { resolveCreatorDeliveryLink } from '@/lib/services/automation/linkResolver';

export const dynamic = 'force-dynamic';

export const DEFAULT_FACEBOOK_CONFIG = {
  enabled: false,
  autoReplyComments: true,
  autoReplyPositive: true,
  autoReplyQuestions: true,
  autoReplyLinkRequests: true,
  autoReplyPurchaseIntent: true,
  autoHideSpam: true,
  autoReplyDm: true,
  linkUrl: null as string | null,
  customInstructions: 'Never mention competitor platforms. Keep replies under 2 sentences. Direct technical queries to our documentation.',
  brandPersona: 'Thoughtful, consultative founder tone. Direct, insightful, and authoritative. Never corporate jargon or sycophantic. Reflects high standards.',
  flagNegative: true,
  flagSpam: true,
  maxRepliesPerHour: 20,
  dmMaxRepliesPerHour: 20,
  jitterMinSeconds: 20,
  jitterMaxSeconds: 90,
};

// GET /api/facebook/automation?workspaceId=xxx
export async function GET(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const globalAutomationEnabled = await isAutomationEnabledServer();
    if (!globalAutomationEnabled) {
      return NextResponse.json({
        ...DEFAULT_FACEBOOK_CONFIG,
        enabled: false,
        disabledByAdmin: true,
      });
    }

    // Resolve default canonical link
    const resolvedDefaultLink = await resolveCreatorDeliveryLink(workspaceId, { userId: user.id });

    // Fetch config from table
    const { data: configRow } = await supabaseAdmin
      .from('facebook_automation_config')
      .select('*')
      .eq('workspace_id', workspaceId)
      .limit(1)
      .maybeSingle();

    if (!configRow) {
      return NextResponse.json({
        ...DEFAULT_FACEBOOK_CONFIG,
        linkUrl: resolvedDefaultLink || null,
      });
    }

    return NextResponse.json({
      ...DEFAULT_FACEBOOK_CONFIG,
      enabled: configRow.enabled ?? false,
      autoReplyComments: configRow.auto_reply_comments ?? true,
      autoReplyPositive: configRow.auto_reply_positive ?? true,
      autoReplyQuestions: configRow.auto_reply_questions ?? true,
      autoReplyLinkRequests: configRow.auto_reply_link_requests ?? true,
      autoReplyPurchaseIntent: configRow.auto_reply_purchase_intent ?? true,
      autoHideSpam: configRow.auto_hide_spam ?? true,
      autoReplyDm: configRow.auto_reply_dm ?? true,
      linkUrl: configRow.link_url || resolvedDefaultLink || null,
      customInstructions: configRow.custom_instructions || DEFAULT_FACEBOOK_CONFIG.customInstructions,
      brandPersona: configRow.brand_persona || DEFAULT_FACEBOOK_CONFIG.brandPersona,
      flagNegative: configRow.flag_negative ?? true,
      flagSpam: configRow.flag_spam ?? true,
      maxRepliesPerHour: configRow.max_replies_per_hour ?? 20,
      dmMaxRepliesPerHour: configRow.dm_max_replies_per_hour ?? 20,
      jitterMinSeconds: configRow.jitter_min_seconds ?? 20,
      jitterMaxSeconds: configRow.jitter_max_seconds ?? 90,
      pageId: configRow.page_id,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('GET /api/facebook/automation error', { error: err });
    return NextResponse.json(DEFAULT_FACEBOOK_CONFIG);
  }
}

// PUT /api/facebook/automation
export async function PUT(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { workspaceId, ...rest } = body;

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Find connected pageId if not passed in body
    let pageId = rest.pageId;
    if (!pageId) {
      const { data: conn } = await supabaseAdmin
        .from('platform_connections')
        .select('platform_user_id, metadata')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'facebook')
        .eq('status', 'connected')
        .limit(1)
        .maybeSingle();

      pageId = conn?.platform_user_id || (conn?.metadata as Record<string, unknown>)?.page_id || 'default_page';
    }

    const payload = {
      workspace_id: workspaceId,
      page_id: String(pageId),
      enabled: rest.enabled ?? true,
      auto_reply_comments: rest.autoReplyComments ?? true,
      auto_hide_spam: rest.autoHideSpam ?? true,
      custom_instructions: rest.customInstructions || null,
      brand_persona: rest.brandPersona || null,
      link_url: rest.linkUrl || null,
      max_replies_per_hour: rest.maxRepliesPerHour ?? 20,
      jitter_min_seconds: rest.jitterMinSeconds ?? 20,
      jitter_max_seconds: rest.jitterMaxSeconds ?? 90,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from('facebook_automation_config')
      .upsert(payload, { onConflict: 'workspace_id,page_id' });

    if (error) {
      logger.error('Failed to update Facebook automation config', { error, workspaceId });
      return NextResponse.json({ error: error.message || 'Failed to save config' }, { status: 500 });
    }

    logger.info('Facebook automation config saved', { workspaceId, enabled: payload.enabled });
    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('PUT /api/facebook/automation error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

