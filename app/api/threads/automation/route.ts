import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { isAutomationEnabledServer } from '@/lib/feature-flags-server';
import { resolveCreatorDeliveryLink } from '@/lib/services/automation/linkResolver';

export const dynamic = 'force-dynamic';

const DEFAULT_THREADS_CONFIG = {
  enabled: false,
  autoReplyReplies: true,
  autoReplyMentions: true,
  autoReplyPositive: true,
  autoReplyQuestions: true,
  autoReplyLinkRequests: true,
  autoReplyPurchaseIntent: true,
  autoHideSpam: true,
  linkUrl: null as string | null,
  customInstructions: 'Never mention competitor platforms. Keep replies concise and under 500 characters. Direct technical queries to our documentation.',
  brandPersona: 'Sharp, modern, punchy founder tone. Direct and engaging. Reflects high standards without corporate fluff.',
  flagNegative: true,
  flagSpam: true,
  maxRepliesPerHour: 20,
  jitterMinSeconds: 20,
  jitterMaxSeconds: 90,
};

// GET /api/threads/automation?workspaceId=xxx
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
        ...DEFAULT_THREADS_CONFIG,
        enabled: false,
        disabledByAdmin: true,
      });
    }

    const resolvedDefaultLink = await resolveCreatorDeliveryLink(workspaceId, { userId: user.id });

    const { data: configRow } = await supabaseAdmin
      .from('threads_automation_config')
      .select('*')
      .eq('workspace_id', workspaceId)
      .limit(1)
      .maybeSingle();

    if (!configRow) {
      return NextResponse.json({
        ...DEFAULT_THREADS_CONFIG,
        linkUrl: resolvedDefaultLink || null,
      });
    }

    return NextResponse.json({
      ...DEFAULT_THREADS_CONFIG,
      enabled: configRow.enabled ?? false,
      autoReplyReplies: configRow.auto_reply_replies ?? true,
      autoReplyMentions: configRow.auto_reply_mentions ?? true,
      autoReplyPositive: configRow.auto_reply_positive ?? true,
      autoReplyQuestions: configRow.auto_reply_questions ?? true,
      autoReplyLinkRequests: configRow.auto_reply_link_requests ?? true,
      autoReplyPurchaseIntent: configRow.auto_reply_purchase_intent ?? true,
      autoHideSpam: configRow.auto_hide_spam ?? true,
      linkUrl: configRow.link_url || resolvedDefaultLink || null,
      customInstructions: configRow.custom_instructions || DEFAULT_THREADS_CONFIG.customInstructions,
      brandPersona: configRow.brand_persona || DEFAULT_THREADS_CONFIG.brandPersona,
      flagNegative: configRow.flag_negative ?? true,
      flagSpam: configRow.flag_spam ?? true,
      maxRepliesPerHour: configRow.max_replies_per_hour ?? 20,
      jitterMinSeconds: configRow.jitter_min_seconds ?? 20,
      jitterMaxSeconds: configRow.jitter_max_seconds ?? 90,
      threadsUserId: configRow.threads_user_id,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('GET /api/threads/automation error', { error: err });
    return NextResponse.json(DEFAULT_THREADS_CONFIG);
  }
}

// PUT /api/threads/automation
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

    let threadsUserId = rest.threadsUserId;
    if (!threadsUserId) {
      const { data: conn } = await supabaseAdmin
        .from('platform_connections')
        .select('platform_user_id')
        .eq('workspace_id', workspaceId)
        .eq('platform', 'threads')
        .eq('status', 'connected')
        .limit(1)
        .maybeSingle();

      threadsUserId = conn?.platform_user_id || 'default_threads_user';
    }

    const payload = {
      workspace_id: workspaceId,
      threads_user_id: String(threadsUserId),
      enabled: rest.enabled ?? true,
      auto_reply_replies: rest.autoReplyReplies ?? true,
      auto_reply_mentions: rest.autoReplyMentions ?? true,
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
      .from('threads_automation_config')
      .upsert(payload, { onConflict: 'workspace_id,threads_user_id' });

    if (error) {
      logger.error('Failed to update Threads automation config', { error, workspaceId });
      return NextResponse.json({ error: error.message || 'Failed to save config' }, { status: 500 });
    }

    logger.info('Threads automation config saved', { workspaceId, enabled: payload.enabled });
    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('PUT /api/threads/automation error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

