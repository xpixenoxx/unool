import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { InstagramCommentAutomation, DEFAULT_AUTOMATION_CONFIG, type AutomationConfig } from '@/lib/services/InstagramCommentAutomation';
import { ContentGuard } from '@/lib/ai/ContentGuard';
import { logger } from '@/lib/logger';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { resolveCreatorDeliveryLink } from '@/lib/services/automation/linkResolver';

export const dynamic = 'force-dynamic';

// POST /api/facebook/simulate
export async function POST(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { workspaceId, commentText, postCaption } = body as {
      workspaceId: string;
      commentText?: string;
      postCaption?: string;
    };

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    if (!commentText) return NextResponse.json({ error: 'commentText required' }, { status: 400 });

    const hasAccess = await verifyWorkspaceAccess(user.id, workspaceId);
    if (!hasAccess) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 503 });

    // ContentGuard check
    const guardResult = ContentGuard.validateComment(commentText);
    if (!guardResult.safe && guardResult.violation.level === 'blocked') {
      return NextResponse.json({
        blocked: true,
        reason: guardResult.violation.message,
        code: guardResult.violation.code,
      });
    }

    // Load actual config (table first, then workspaces.settings fallback)
    let configRow: Record<string, any> | null = null;
    try {
      const { data } = await supabaseAdmin
        .from('facebook_automation_config')
        .select('*')
        .eq('workspace_id', workspaceId)
        .limit(1)
        .maybeSingle();
      if (data) configRow = data;
    } catch {}

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
      } catch {}
    }

    const resolvedLinkUrl = await resolveCreatorDeliveryLink(workspaceId, {
      configuredLinkUrl: configRow?.link_url || configRow?.linkUrl || undefined,
      userId: user.id,
    });

    const automationConfig: AutomationConfig = configRow
      ? {
          enabled: true,
          autoReplyPositive: configRow.auto_reply_positive ?? configRow.autoReplyPositive ?? true,
          autoReplyQuestions: configRow.auto_reply_questions ?? configRow.autoReplyQuestions ?? true,
          autoReplyLinkRequests: configRow.auto_reply_link_requests ?? configRow.autoReplyLinkRequests ?? true,
          autoReplyPurchaseIntent: configRow.auto_reply_purchase_intent ?? configRow.autoReplyPurchaseIntent ?? true,
          linkUrl: resolvedLinkUrl,
          customInstructions: configRow.custom_instructions || configRow.customInstructions || undefined,
          brandPersona: configRow.brand_persona || configRow.brandPersona || undefined,
          flagNegative: configRow.flag_negative ?? configRow.flagNegative ?? true,
          flagSpam: configRow.flag_spam ?? configRow.flagSpam ?? true,
          maxRepliesPerHour: configRow.max_replies_per_hour ?? configRow.maxRepliesPerHour ?? 20,
          jitterMinSeconds: configRow.jitter_min_seconds ?? configRow.jitterMinSeconds ?? 20,
          jitterMaxSeconds: configRow.jitter_max_seconds ?? configRow.jitterMaxSeconds ?? 90,
          threadChainingEnabled: false,
          requireFollowForDm: false,
        }
      : {
          ...DEFAULT_AUTOMATION_CONFIG,
          linkUrl: resolvedLinkUrl,
        };

    const automation = new InstagramCommentAutomation(groqApiKey);
    const result = await automation.classifyAndGenerateReply(
      {
        commentId: `sim_${Date.now()}`,
        mediaId: 'facebook_sim_post',
        text: commentText,
        username: 'Facebook Community Member',
        timestamp: new Date().toISOString(),
      },
      postCaption || '',
      automationConfig,
      []
    );

    let finalReply = result.suggestedReply || '';
    if (finalReply && finalReply !== 'SKIP') {
      finalReply = ContentGuard.sanitizeOutput(finalReply);
    }

    return NextResponse.json({
      classification: result.classification,
      confidence: result.confidence,
      leadScore: result.leadScore,
      shouldAutoReply: result.shouldAutoReply,
      suggestedReply: finalReply,
      shouldSendDM: result.shouldSendDM,
      suggestedDM: result.suggestedDM ? ContentGuard.sanitizeOutput(result.suggestedDM) : null,
      shouldFlagForReview: result.shouldFlagForReview,
      reasoning: result.reasoning,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('POST /api/facebook/simulate error', { error: err });
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 });
  }
}

