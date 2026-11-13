import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { InstagramCommentAutomation, DEFAULT_AUTOMATION_CONFIG, type AutomationConfig } from '@/lib/services/InstagramCommentAutomation';
import { ContentGuard } from '@/lib/ai/ContentGuard';
import { logger } from '@/lib/logger';
import { verifyWorkspaceAccess } from '@/lib/auth/workspaceAccess';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

    // Load actual config
    let automationConfig: AutomationConfig = DEFAULT_AUTOMATION_CONFIG;
    try {
      const { data } = await supabaseAdmin
        .from('facebook_automation_config')
        .select('*')
        .eq('workspace_id', workspaceId)
        .limit(1)
        .maybeSingle();

      if (data) {
        automationConfig = {
          enabled: true,
          autoReplyPositive: data.auto_reply_positive ?? true,
          autoReplyQuestions: data.auto_reply_questions ?? true,
          autoReplyLinkRequests: data.auto_reply_link_requests ?? true,
          autoReplyPurchaseIntent: data.auto_reply_purchase_intent ?? true,
          linkUrl: data.link_url || undefined,
          customInstructions: data.custom_instructions || undefined,
          brandPersona: data.brand_persona || undefined,
          flagNegative: data.flag_negative ?? true,
          flagSpam: data.flag_spam ?? true,
          maxRepliesPerHour: data.max_replies_per_hour ?? 20,
          jitterMinSeconds: 20,
          jitterMaxSeconds: 90,
          threadChainingEnabled: false,
          requireFollowForDm: false,
        };
      }
    } catch {}

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

