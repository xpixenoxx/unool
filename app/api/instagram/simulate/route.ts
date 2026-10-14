import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  InstagramCommentAutomation,
  DEFAULT_AUTOMATION_CONFIG,
  type CommentEvent,
  type AutomationConfig,
} from '@/lib/services/InstagramCommentAutomation';
import { ContentGuard } from '@/lib/ai/ContentGuard';
import { logger } from '@/lib/logger';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

// POST /api/instagram/simulate
// Body: { workspaceId, commentText, postCaption?, isDmSimulation?, dmText? }
// Runs the full classification pipeline WITHOUT posting anything.
// This is the "Live Simulator" feature — creators test AI behavior before going live.
export async function POST(request: NextRequest) {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { workspaceId, commentText, postCaption, isDmSimulation, dmText } = body as {
      workspaceId: string;
      commentText?: string;
      postCaption?: string;
      isDmSimulation?: boolean;
      dmText?: string;
    };

    if (!workspaceId) return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });

    const inputText = isDmSimulation ? dmText : commentText;
    if (!inputText) {
      return NextResponse.json({ error: isDmSimulation ? 'dmText required' : 'commentText required' }, { status: 400 });
    }

    // Verify membership
    const { data: membership } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single();

    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
    }

    // ContentGuard check first
    const guardResult = ContentGuard.validateComment(inputText);
    if (!guardResult.safe && guardResult.violation.level === 'blocked') {
      return NextResponse.json({
        blocked: true,
        reason: guardResult.violation.message,
        code: guardResult.violation.code,
      });
    }

    // Load actual automation config for this workspace
    let automationConfig: AutomationConfig = DEFAULT_AUTOMATION_CONFIG;
    try {
      const { data } = await supabase
        .from('instagram_automation_config')
        .select('*')
        .eq('workspace_id', workspaceId)
        .single();

      if (data) {
        automationConfig = {
          enabled: true, // Force enabled for simulation
          autoReplyPositive: data.auto_reply_positive ?? true,
          autoReplyQuestions: data.auto_reply_questions ?? true,
          autoReplyLinkRequests: data.auto_reply_link_requests ?? true,
          autoReplyPurchaseIntent: data.auto_reply_purchase_intent ?? true,
          linkUrl: data.link_url || undefined,
          customInstructions: data.custom_instructions || undefined,
          brandPersona: data.brand_persona || undefined,
          flagNegative: data.flag_negative ?? true,
          flagSpam: data.flag_spam ?? true,
          maxRepliesPerHour: data.max_replies_per_hour ?? 30,
          threadChainingEnabled: data.thread_chaining_enabled ?? true,
          dmAutoReplyEnabled: true,
          dmWelcomeMessage: data.dm_welcome_message || undefined,
          dmKnowledgeBase: data.dm_knowledge_base || undefined,
          dmEscalationEnabled: data.dm_escalation_enabled ?? true,
        };
      }
    } catch {
      // Use defaults
    }

    const automation = new InstagramCommentAutomation(groqApiKey);

    if (isDmSimulation) {
      // Simulate inbound DM classification
      const dmEvent = {
        messageId: 'sim_' + Date.now(),
        senderId: 'simulated_user',
        senderUsername: 'simulated_user',
        text: dmText!,
        timestamp: new Date().toISOString(),
      };

      const result = await automation.classifyAndReplyDM(dmEvent, {
        ...automationConfig,
        dmAutoReplyEnabled: true,
      });

      return NextResponse.json({
        type: 'dm',
        classification: result.classification,
        confidence: result.confidence,
        suggestedReply: result.suggestedReply,
        leadScore: result.leadScore,
        wouldAutoReply: result.shouldAutoReply,
        wouldEscalate: result.shouldEscalate,
        reasoning: result.reasoning,
        _simulated: true,
      });
    }

    // Simulate comment classification
    const mockComment: CommentEvent = {
      commentId: 'sim_' + Date.now(),
      mediaId: 'sim_media',
      text: commentText!,
      username: 'simulated_user',
      timestamp: new Date().toISOString(),
    };

    const result = await automation.classifyAndGenerateReply(
      mockComment,
      postCaption || '',
      automationConfig,
      [] // No recent replies in simulation
    );

    return NextResponse.json({
      type: 'comment',
      classification: result.classification,
      confidence: result.confidence,
      suggestedReply: result.suggestedReply !== 'SKIP' ? result.suggestedReply : null,
      suggestedDM: result.suggestedDM,
      threadHook: result.threadHook,
      leadScore: result.leadScore,
      wouldAutoReply: result.shouldAutoReply,
      wouldSendDM: result.shouldSendDM,
      wouldFlag: result.shouldFlagForReview,
      reasoning: result.reasoning,
      _simulated: true,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('POST /api/instagram/simulate error', { error: err });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
