import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { isAutomationEnabledServer } from '@/lib/feature-flags-server';
import { resolveCreatorDeliveryLink } from '@/lib/services/automation/linkResolver';

export const dynamic = 'force-dynamic';

const DEFAULT_FACEBOOK_CONFIG = {
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

    let configRow: Record<string, any> | null = null;
    try {
      const { data, error } = await supabaseAdmin
        .from('facebook_automation_config')
        .select('*')
        .eq('workspace_id', workspaceId)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        configRow = data;
      }
    } catch {
      configRow = null;
    }

    // Fallback: check workspaces.settings if dedicated table not populated or not created yet
    if (!configRow) {
      try {
        const { data: ws } = await supabaseAdmin
          .from('workspaces')
          .select('settings')
          .eq('id', workspaceId)
          .maybeSingle();

        const wsSettings = (ws?.settings as Record<string, any>) || {};
        if (wsSettings.facebook_automation) {
          configRow = wsSettings.facebook_automation;
        }
      } catch {
        // Ignore fallback error
      }
    }

    if (!configRow) {
      return NextResponse.json({
        ...DEFAULT_FACEBOOK_CONFIG,
        linkUrl: resolvedDefaultLink || null,
      });
    }

    return NextResponse.json({
      ...DEFAULT_FACEBOOK_CONFIG,
      enabled: configRow.enabled ?? false,
      autoReplyComments: configRow.auto_reply_comments ?? configRow.autoReplyComments ?? true,
      autoReplyPositive: configRow.auto_reply_positive ?? configRow.autoReplyPositive ?? true,
      autoReplyQuestions: configRow.auto_reply_questions ?? configRow.autoReplyQuestions ?? true,
      autoReplyLinkRequests: configRow.auto_reply_link_requests ?? configRow.autoReplyLinkRequests ?? true,
      autoReplyPurchaseIntent: configRow.auto_reply_purchase_intent ?? configRow.autoReplyPurchaseIntent ?? true,
      autoHideSpam: configRow.auto_hide_spam ?? configRow.autoHideSpam ?? true,
      autoReplyDm: configRow.auto_reply_dm ?? configRow.autoReplyDm ?? true,
      linkUrl: configRow.link_url || configRow.linkUrl || resolvedDefaultLink || null,
      customInstructions: configRow.custom_instructions || configRow.customInstructions || DEFAULT_FACEBOOK_CONFIG.customInstructions,
      brandPersona: configRow.brand_persona || configRow.brandPersona || DEFAULT_FACEBOOK_CONFIG.brandPersona,
      flagNegative: configRow.flag_negative ?? configRow.flagNegative ?? true,
      flagSpam: configRow.flag_spam ?? configRow.flagSpam ?? true,
      maxRepliesPerHour: configRow.max_replies_per_hour ?? configRow.maxRepliesPerHour ?? 20,
      dmMaxRepliesPerHour: configRow.dm_max_replies_per_hour ?? configRow.dmMaxRepliesPerHour ?? 20,
      jitterMinSeconds: configRow.jitter_min_seconds ?? configRow.jitterMinSeconds ?? 20,
      jitterMaxSeconds: configRow.jitter_max_seconds ?? configRow.jitterMaxSeconds ?? 90,
      pageId: configRow.page_id || configRow.pageId,
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

    const fullPayload: Record<string, any> = {
      workspace_id: workspaceId,
      page_id: String(pageId),
      enabled: rest.enabled ?? true,
      auto_reply_comments: rest.autoReplyComments ?? true,
      auto_reply_positive: rest.autoReplyPositive ?? true,
      auto_reply_questions: rest.autoReplyQuestions ?? true,
      auto_reply_link_requests: rest.autoReplyLinkRequests ?? true,
      auto_reply_purchase_intent: rest.autoReplyPurchaseIntent ?? true,
      auto_hide_spam: rest.autoHideSpam ?? true,
      auto_reply_dm: rest.autoReplyDm ?? true,
      flag_negative: rest.flagNegative ?? true,
      flag_spam: rest.flagSpam ?? true,
      custom_instructions: rest.customInstructions || null,
      brand_persona: rest.brandPersona || null,
      link_url: rest.linkUrl || null,
      max_replies_per_hour: rest.maxRepliesPerHour ?? 20,
      dm_max_replies_per_hour: rest.dmMaxRepliesPerHour ?? 20,
      jitter_min_seconds: rest.jitterMinSeconds ?? 20,
      jitter_max_seconds: rest.jitterMaxSeconds ?? 90,
      updated_at: new Date().toISOString(),
    };

    const corePayload: Record<string, any> = {
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

    let tableSaveSuccess = false;
    let tableError: any = null;

    try {
      const { data: existingRow, error: checkError } = await supabaseAdmin
        .from('facebook_automation_config')
        .select('id, page_id')
        .eq('workspace_id', workspaceId)
        .limit(1)
        .maybeSingle();

      const tableExists = !checkError || (checkError.code !== '42P01' && checkError.code !== 'PGRST205');

      if (tableExists) {
        let attempt = existingRow?.id
          ? await supabaseAdmin.from('facebook_automation_config').update(fullPayload).eq('id', existingRow.id).select().maybeSingle()
          : await supabaseAdmin.from('facebook_automation_config').insert(fullPayload).select().maybeSingle();

        if (attempt.error && attempt.error.code === '23505') {
          attempt = await supabaseAdmin.from('facebook_automation_config').update(fullPayload).eq('workspace_id', workspaceId).select().maybeSingle();
        }

        if (attempt.error && (attempt.error.code === 'PGRST204' || attempt.error.message?.includes('column'))) {
          logger.warn('facebook_automation_config column mismatch, retrying with core columns', { error: attempt.error });
          attempt = existingRow?.id
            ? await supabaseAdmin.from('facebook_automation_config').update(corePayload).eq('id', existingRow.id).select().maybeSingle()
            : await supabaseAdmin.from('facebook_automation_config').insert(corePayload).select().maybeSingle();

          if (attempt.error && attempt.error.code === '23505') {
            attempt = await supabaseAdmin.from('facebook_automation_config').update(corePayload).eq('workspace_id', workspaceId).select().maybeSingle();
          }
        }

        if (!attempt.error) {
          tableSaveSuccess = true;
        } else {
          tableError = attempt.error;
        }
      } else {
        tableError = checkError;
      }
    } catch (err: any) {
      tableError = err;
    }

    // Always mirror to workspaces.settings as backup
    try {
      const { data: ws } = await supabaseAdmin
        .from('workspaces')
        .select('settings')
        .eq('id', workspaceId)
        .maybeSingle();

      const currentSettings = (ws?.settings as Record<string, any>) || {};
      const updatedSettings = {
        ...currentSettings,
        facebook_automation: fullPayload,
      };

      await supabaseAdmin
        .from('workspaces')
        .update({ settings: updatedSettings })
        .eq('id', workspaceId);
    } catch (wsErr) {
      logger.warn('Failed to mirror facebook_automation in workspaces.settings', { error: wsErr });
      if (!tableSaveSuccess && tableError) {
        return NextResponse.json({ error: tableError.message || 'Failed to save settings' }, { status: 500 });
      }
    }

    logger.info('Facebook automation config saved successfully', { workspaceId, enabled: fullPayload.enabled, tableSaveSuccess });
    return NextResponse.json({ success: true, data: fullPayload, savedToTable: tableSaveSuccess });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('PUT /api/facebook/automation error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

