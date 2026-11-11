import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { isAutomationEnabledServer } from '@/lib/feature-flags-server';
import { resolveCreatorDeliveryLink } from '@/lib/services/automation/linkResolver';
import { getPlanContext } from '@/lib/middleware/plan-enforcement-middleware';


// GET /api/instagram/automation?workspaceId=xxx
export async function GET(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceId = request.nextUrl.searchParams.get('workspaceId');
    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    // Verify user has access to this workspace
    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const globalAutomationEnabled = await isAutomationEnabledServer();
    if (!globalAutomationEnabled) {
      return NextResponse.json({
        enabled: false,
        disabledByAdmin: true,
        autoReplyPositive: false,
        autoReplyQuestions: false,
        autoReplyLinkRequests: false,
        autoReplyPurchaseIntent: false,
        linkUrl: null,
        customInstructions: null,
        brandPersona: null,
        flagNegative: false,
        flagSpam: false,
        maxRepliesPerHour: 0,
        jitterMinSeconds: 0,
        jitterMaxSeconds: 0,
        threadChainingEnabled: false,
        dmTemplate: null,
        autoHideSpam: false,
        dmAutoReplyEnabled: false,
        dmWelcomeMessage: null,
        dmKnowledgeBase: null,
        dmEscalationEnabled: false,
        dmMaxRepliesPerHour: 0,
        requireFollowForDm: false,
        followAskMessage: null,
        followVerifiedMessage: null,
      });
    }

    const { data } = await supabaseAdmin
      .from('instagram_automation_config')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    // ── Phase 12.3: Bio-link / Brand Materials Subdomain+Slug default ────────
    // When linkUrl is not explicitly set, resolve from creator's UNOOL subdomain
    // and published brand materials page slug (e.g. https://subdomain.unool.co/slug).
    const resolvedDefaultLink = await resolveCreatorDeliveryLink(workspaceId, {
      userId: user.id,
    });
    const defaultLinkUrl: string | null = resolvedDefaultLink || null;

    // Return defaults if not configured yet
    if (!data) {
      return NextResponse.json({
        enabled: false,
        autoReplyPositive: true,
        autoReplyQuestions: true,
        autoReplyLinkRequests: true,
        autoReplyPurchaseIntent: true,
        linkUrl: defaultLinkUrl,
        customInstructions: null,
        brandPersona: null,
        flagNegative: true,
        flagSpam: true,
        maxRepliesPerHour: 30,
        jitterMinSeconds: 25,
        jitterMaxSeconds: 120,
        threadChainingEnabled: true,
        dmTemplate: null,
        autoHideSpam: false,
        dmAutoReplyEnabled: false,
        dmWelcomeMessage: null,
        dmKnowledgeBase: null,
        dmEscalationEnabled: true,
        dmMaxRepliesPerHour: 20,
        requireFollowForDm: false,
        followAskMessage: null,
        followVerifiedMessage: null,
      });
    }

    return NextResponse.json({
      enabled: data.enabled,
      autoReplyPositive: data.auto_reply_positive,
      autoReplyQuestions: data.auto_reply_questions,
      autoReplyLinkRequests: data.auto_reply_link_requests,
      autoReplyPurchaseIntent: data.auto_reply_purchase_intent ?? true,
      // Use stored linkUrl or fall back to creator subdomain/slug URL if not set
      linkUrl: data.link_url || defaultLinkUrl,
      customInstructions: data.custom_instructions,
      brandPersona: data.brand_persona,
      flagNegative: data.flag_negative,
      flagSpam: data.flag_spam,
      maxRepliesPerHour: data.max_replies_per_hour ?? 30,
      jitterMinSeconds: data.jitter_min_seconds ?? 25,
      jitterMaxSeconds: data.jitter_max_seconds ?? 120,
      threadChainingEnabled: data.thread_chaining_enabled ?? true,
      dmTemplate: data.dm_template,
      autoHideSpam: data.auto_hide_spam ?? false,
      dmAutoReplyEnabled: data.dm_auto_reply_enabled ?? false,
      dmWelcomeMessage: data.dm_welcome_message,
      dmKnowledgeBase: data.dm_knowledge_base,
      dmEscalationEnabled: data.dm_escalation_enabled ?? true,
      dmMaxRepliesPerHour: data.dm_max_replies_per_hour ?? 20,
      requireFollowForDm: data.require_follow_for_dm ?? false,
      followAskMessage: data.follow_ask_message || null,
      followVerifiedMessage: data.follow_verified_message || null,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('GET /api/instagram/automation error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/instagram/automation
export async function PUT(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { workspaceId, ...rest } = body;

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    // Verify user has access to this workspace
    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Enforce subscription feature entitlements for paid-only automation capabilities
    const planCtx = await getPlanContext(user.id, workspaceId);
    if (planCtx) {
      if (rest.dmAutoReplyEnabled === true && !planCtx.features.dm_concierge) {
        return NextResponse.json(
          {
            error: 'Instagram DM Concierge requires Creator, Pro, or Studio plan.',
            code: 'PLAN_LIMIT_EXCEEDED',
            plan: planCtx.plan,
            feature: 'dm_concierge',
          },
          { status: 403 }
        );
      }

      if (
        typeof rest.dmKnowledgeBase === 'string' &&
        rest.dmKnowledgeBase.trim().length > 0 &&
        !planCtx.features.dm_concierge_full
      ) {
        return NextResponse.json(
          {
            error: 'Full DM Concierge with Knowledge Base requires Pro or Studio plan.',
            code: 'PLAN_LIMIT_EXCEEDED',
            plan: planCtx.plan,
            feature: 'dm_concierge_full',
          },
          { status: 403 }
        );
      }

      if (rest.autoHideSpam === true && !planCtx.features.auto_hide_spam) {
        return NextResponse.json(
          {
            error: 'Auto-Hide Spam requires Creator, Pro, or Studio plan.',
            code: 'PLAN_LIMIT_EXCEEDED',
            plan: planCtx.plan,
            feature: 'auto_hide_spam',
          },
          { status: 403 }
        );
      }
    }

    const globalAutomationEnabled = await isAutomationEnabledServer();
    if (!globalAutomationEnabled) {
      return NextResponse.json({
        enabled: false,
        disabledByAdmin: true,
        autoReplyPositive: false,
        autoReplyQuestions: false,
        autoReplyLinkRequests: false,
        autoReplyPurchaseIntent: false,
        linkUrl: null,
        customInstructions: null,
        brandPersona: null,
        flagNegative: false,
        flagSpam: false,
        maxRepliesPerHour: 0,
        jitterMinSeconds: 0,
        jitterMaxSeconds: 0,
        threadChainingEnabled: false,
        dmTemplate: null,
        autoHideSpam: false,
        dmAutoReplyEnabled: false,
        dmWelcomeMessage: null,
        dmKnowledgeBase: null,
        dmEscalationEnabled: false,
        dmMaxRepliesPerHour: 0,
        requireFollowForDm: false,
        followAskMessage: null,
        followVerifiedMessage: null,
      });
    }

    const upsertData = {
      workspace_id: workspaceId,
      enabled: rest.enabled ?? false,
      auto_reply_positive: rest.autoReplyPositive ?? true,
      auto_reply_questions: rest.autoReplyQuestions ?? true,
      auto_reply_link_requests: rest.autoReplyLinkRequests ?? true,
      auto_reply_purchase_intent: rest.autoReplyPurchaseIntent ?? true,
      link_url: rest.linkUrl || null,
      custom_instructions: rest.customInstructions || null,
      brand_persona: rest.brandPersona || null,
      flag_negative: rest.flagNegative ?? true,
      flag_spam: rest.flagSpam ?? true,
      max_replies_per_hour: rest.maxRepliesPerHour ?? 30,
      jitter_min_seconds: rest.jitterMinSeconds ?? 25,
      jitter_max_seconds: rest.jitterMaxSeconds ?? 120,
      thread_chaining_enabled: rest.threadChainingEnabled ?? true,
      dm_template: rest.dmTemplate || null,
      auto_hide_spam: rest.autoHideSpam ?? false,
      dm_auto_reply_enabled: rest.dmAutoReplyEnabled ?? false,
      dm_welcome_message: rest.dmWelcomeMessage || null,
      dm_knowledge_base: rest.dmKnowledgeBase || null,
      dm_escalation_enabled: rest.dmEscalationEnabled ?? true,
      dm_max_replies_per_hour: rest.dmMaxRepliesPerHour ?? 20,
      require_follow_for_dm: Boolean(rest.requireFollowForDm ?? false),
      follow_ask_message:
        typeof rest.followAskMessage === 'string' ? rest.followAskMessage.trim() || null : null,
      follow_verified_message:
        typeof rest.followVerifiedMessage === 'string' ? rest.followVerifiedMessage.trim() || null : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('instagram_automation_config')
      .upsert(upsertData, { onConflict: 'workspace_id' })
      .select()
      .single();

    if (error) {
      logger.error('Failed to upsert automation config', { error, workspaceId });
      return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
    }

    logger.info('Automation config updated', { workspaceId, enabled: rest.enabled });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('PUT /api/instagram/automation error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
