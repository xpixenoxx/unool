import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { verifyMetaSignature } from '@/lib/webhooks/verify';
import { config } from '@/lib/config/schema';
import { decryptToken } from '@/lib/crypto/encryption';

import {
  InstagramCommentAutomation,
  DEFAULT_AUTOMATION_CONFIG,
  type CommentEvent,
  type DmEvent,
  type AutomationConfig,
  type ClassifiedComment,
} from '@/lib/services/InstagramCommentAutomation';
import { ContentGuard } from '@/lib/ai/ContentGuard';
import { ContentHumanizer } from '@/lib/ai/engines/ContentHumanizer';
import { humanizedSleep } from '@/lib/services/automation/jitter';
import { velocityThrottle } from '@/lib/services/automation/velocity';
import { lexicalEntropyGuard } from '@/lib/services/automation/lexical';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);


// ─── GET: Meta Webhook Verification ─────────────────────────────────────────

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === config.META_WEBHOOK_VERIFY_TOKEN) {
    logger.info('Instagram webhook verified successfully');
    return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  logger.warn('Instagram webhook verification failed', { mode, tokenMatch: token === config.META_WEBHOOK_VERIFY_TOKEN });
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// ─── POST: Receive Instagram Webhook Events ──────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Verify the signature from Meta
    const signature = request.headers.get('x-hub-signature-256') || request.headers.get('x-hub-signature');
    if (!signature) {
      logger.warn('Instagram webhook: missing signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const secret = config.META_WEBHOOK_SECRET;
    if (secret) {
      const isValid = await verifyMetaSignature(body, signature, secret);
      if (!isValid) {
        logger.warn('Instagram webhook: invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else if (config.NODE_ENV === 'production') {
      logger.error('Instagram webhook: META_WEBHOOK_SECRET not configured in production');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(body);
    } catch {
      logger.warn('Instagram webhook: invalid JSON');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (payload.object !== 'instagram') {
      logger.debug('Instagram webhook: not an instagram object', { object: payload.object });
      return NextResponse.json({ received: true });
    }

    const entries = payload.entry as Array<Record<string, unknown>> | undefined;
    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json({ received: true });
    }

    // Process each entry asynchronously — return 200 immediately to Meta
    for (const entry of entries) {
      const igUserId = entry.id as string;
      const changes = entry.changes as Array<Record<string, unknown>> | undefined;
      const messaging = entry.messaging as Array<Record<string, unknown>> | undefined;

      // Handle comment events
      if (changes && Array.isArray(changes)) {
        for (const change of changes) {
          if (change.field === 'comments') {
            const value = change.value as Record<string, unknown>;
            if (value) {
              processCommentEvent(igUserId, value).catch((err) => {
                logger.error('Error processing Instagram comment event', {
                  igUserId,
                  error: err instanceof Error ? err : new Error(String(err)),
                });
              });
            }
          }
        }
      }

      // Handle inbound DM events (messages field)
      if (messaging && Array.isArray(messaging)) {
        for (const msg of messaging) {
          processDmEvent(igUserId, msg).catch((err) => {
            logger.error('Error processing Instagram DM event', {
              igUserId,
              error: err instanceof Error ? err : new Error(String(err)),
            });
          });
        }
      }
    }

    // Always return 200 quickly to Meta to avoid retries
    return NextResponse.json({ received: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Instagram webhook processing error', { error: err });
    return NextResponse.json({ received: true });
  }
}

// ─── Comment Processing Logic ─────────────────────────────────────────────────

async function processCommentEvent(igUserId: string, value: Record<string, unknown>): Promise<void> {
  const commentEvent: CommentEvent = {
    commentId: value.id as string,
    mediaId: (value.media as any)?.id as string || value.media_id as string || '',
    text: value.text as string || '',
    username: (value.from as any)?.username as string || '',
    timestamp: value.created_time as string || new Date().toISOString(),
    parentId: value.parent_id as string || undefined,
  };

  // Anti-loop guard: skip reply-to-reply comments
  if (commentEvent.parentId) {
    logger.debug('Skipping reply-to-reply comment', { commentId: commentEvent.commentId });
    return;
  }

  if (!commentEvent.text || !commentEvent.commentId) {
    logger.debug('Skipping empty comment event', { value });
    return;
  }

  // ── ContentGuard: pre-filter harmful incoming content ──────────────────
  const guardResult = ContentGuard.validateComment(commentEvent.text);
  if (!guardResult.safe && guardResult.violation.level === 'blocked') {
    logger.info('ContentGuard blocked incoming comment', {
      code: guardResult.violation.code,
      commentId: commentEvent.commentId,
    });
    // Flag internally without engaging
    await flagCommentForReview(
      await getWorkspaceIdForIgUser(igUserId),
      commentEvent,
      { classification: 'harmful', suggestedReply: 'SKIP', reasoning: guardResult.violation.internal || guardResult.violation.message },
      0
    );
    return;
  }

  // Find the platform connection
  const { data: connections } = await supabase
    .from('platform_connections')
    .select('*')
    .eq('platform', 'instagram')
    .eq('platform_user_id', igUserId)
    .eq('status', 'connected');

  if (!connections || connections.length === 0) {
    logger.warn('No active Instagram connection found for webhook', { igUserId });
    return;
  }

  const connection = connections[0];
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    logger.warn('GROQ_API_KEY not configured, skipping comment automation');
    return;
  }

  let accessToken: string;
  try {
    accessToken = await decryptToken(connection.access_token_encrypted);
  } catch (error) {
    logger.error('Failed to decrypt Instagram access token', { connectionId: connection.id });
    return;
  }

  const automationConfig = await loadAutomationConfig(connection.workspace_id);

  if (!automationConfig.enabled) {
    logger.debug('Instagram comment automation disabled for workspace', { workspaceId: connection.workspace_id });
    return;
  }

  // ── Velocity check: enforce hourly rate limits ──────────────────────────
  const canReply = await velocityThrottle.canReply(
    connection.workspace_id,
    automationConfig.maxRepliesPerHour || 30
  );
  if (!canReply) {
    logger.info('Velocity limit reached — queuing comment for later', {
      workspaceId: connection.workspace_id,
      commentId: commentEvent.commentId,
    });
    // Flag for human review instead of dropping
    await flagCommentForReview(connection.workspace_id, commentEvent, {
      classification: 'unrelated',
      suggestedReply: '',
      reasoning: 'Rate limit reached — deferred for human review',
    }, 0);
    return;
  }

  // Get the post caption for AI context (best-effort)
  let postCaption = '';
  if (commentEvent.mediaId) {
    try {
      const mediaRes = await fetch(
        `https://graph.instagram.com/v20.0/${commentEvent.mediaId}?fields=caption&access_token=${accessToken}`
      );
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        postCaption = mediaData.caption || '';
      }
    } catch {
      logger.debug('Could not fetch post caption for comment context');
    }
  }

  // ── Fetch recent replies for anti-duplication ───────────────────────────
  const recentReplies = await lexicalEntropyGuard.getRecentReplies(connection.workspace_id, 15);

  // ── Classify and generate reply ─────────────────────────────────────────
  const automation = new InstagramCommentAutomation(groqApiKey);
  const result = await automation.classifyAndGenerateReply(commentEvent, postCaption, automationConfig, recentReplies);

  // Log the comment and classification
  await logCommentEvent(connection.workspace_id, commentEvent, result);

  // Act on the classification
  if (result.shouldAutoReply && result.suggestedReply && result.suggestedReply !== 'SKIP') {
    // ── Humanize the reply through ContentHumanizer ─────────────────────
    let finalReply = result.suggestedReply;
    try {
      const humanized = ContentHumanizer.humanize(finalReply, 'instagram');
      finalReply = humanized.humanized || finalReply;
    } catch {
      logger.debug('ContentHumanizer failed — using raw reply');
    }

    // ── Anti-duplication check ─────────────────────────────────────────
    if (lexicalEntropyGuard.isTooSimilar(finalReply, recentReplies)) {
      logger.info('Reply too similar to recent replies — flagging for review', {
        commentId: commentEvent.commentId,
      });
      result.shouldFlagForReview = true;
    } else {
      // ── Poisson jitter delay before posting ────────────────────────────
      await humanizedSleep(
        automationConfig.jitterMinSeconds || 25,
        automationConfig.jitterMaxSeconds || 120
      );

      // Post the public reply
      const replyResult = await automation.postPublicReply(
        accessToken,
        commentEvent.mediaId,
        commentEvent.commentId,
        finalReply
      );

      if (replyResult) {
        // Record in velocity tracker and lexical guard
        await velocityThrottle.recordReply(connection.workspace_id);
        lexicalEntropyGuard.recordReply(connection.workspace_id, finalReply);
      }
    }

    // ── Send DM for link_request / purchase_intent ──────────────────────
    if (result.shouldSendDM && automationConfig.linkUrl) {
      const commenterIgScopedId = (value as any)?.from?.id as string;
      if (commenterIgScopedId) {
        const dmText = result.suggestedDM ||
          `Hey @${commentEvent.username}! Here's the link you asked for: ${automationConfig.linkUrl}`;
        await automation.sendPrivateMessage(accessToken, igUserId, commenterIgScopedId, dmText);
      }
    }
  }

  if (result.shouldFlagForReview) {
    await flagCommentForReview(connection.workspace_id, commentEvent, result, result.leadScore);
  }
}

// ─── Inbound DM Processing Logic ─────────────────────────────────────────────

async function processDmEvent(igUserId: string, messaging: Record<string, unknown>): Promise<void> {
  const message = messaging.message as Record<string, unknown> | undefined;
  const sender = messaging.sender as Record<string, unknown> | undefined;
  const recipient = messaging.recipient as Record<string, unknown> | undefined;

  if (!message || !sender) return;

  // Don't process our own outbound messages (echo)
  if (sender.id === igUserId || (recipient && recipient.id !== igUserId)) {
    logger.debug('Skipping echo/outbound DM', { senderId: sender.id, igUserId });
    return;
  }

  const dmEvent: DmEvent = {
    messageId: messaging.mid as string || message.mid as string || String(Date.now()),
    senderId: sender.id as string,
    senderUsername: (sender as any).username,
    text: message.text as string || '',
    timestamp: messaging.timestamp as string || new Date().toISOString(),
  };

  if (!dmEvent.text || !dmEvent.senderId) {
    logger.debug('Skipping empty DM event');
    return;
  }

  // ContentGuard check on DM text
  const guardResult = ContentGuard.validateComment(dmEvent.text);
  if (!guardResult.safe && guardResult.violation.level === 'blocked') {
    logger.info('ContentGuard blocked incoming DM', { code: guardResult.violation.code });
    return;
  }

  // Find the platform connection
  const { data: connections } = await supabase
    .from('platform_connections')
    .select('*')
    .eq('platform', 'instagram')
    .eq('platform_user_id', igUserId)
    .eq('status', 'connected');

  if (!connections || connections.length === 0) {
    logger.warn('No active Instagram connection for DM webhook', { igUserId });
    return;
  }

  const connection = connections[0];
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) return;

  const automationConfig = await loadAutomationConfig(connection.workspace_id);

  if (!automationConfig.enabled || !automationConfig.dmAutoReplyEnabled) {
    logger.debug('DM automation disabled for workspace', { workspaceId: connection.workspace_id });
    return;
  }

  // Velocity check for DMs
  const canReply = await velocityThrottle.canReply(
    `dm:${connection.workspace_id}`,
    automationConfig.dmMaxRepliesPerHour || 20
  );
  if (!canReply) {
    logger.info('DM velocity limit reached', { workspaceId: connection.workspace_id });
    return;
  }

  let accessToken: string;
  try {
    accessToken = await decryptToken(connection.access_token_encrypted);
  } catch {
    logger.error('Failed to decrypt token for DM automation', { connectionId: connection.id });
    return;
  }

  const automation = new InstagramCommentAutomation(groqApiKey);
  const result = await automation.classifyAndReplyDM(dmEvent, automationConfig);

  // Log the DM
  await logDmEvent(connection.workspace_id, dmEvent, result);

  if (result.shouldAutoReply && result.suggestedReply && result.suggestedReply !== 'SKIP') {
    // Humanize the reply
    let finalReply = result.suggestedReply;
    try {
      const humanized = ContentHumanizer.humanize(finalReply, 'instagram');
      finalReply = humanized.humanized || finalReply;
    } catch {
      logger.debug('ContentHumanizer failed for DM — using raw reply');
    }

    // Jitter delay
    await humanizedSleep(10, 45); // Shorter delay for DMs (10–45s)

    // Send the DM reply
    await automation.sendPrivateMessage(accessToken, igUserId, dmEvent.senderId, finalReply);
    await velocityThrottle.recordReply(`dm:${connection.workspace_id}`);
  }

  if (result.shouldEscalate) {
    logger.info('DM escalated for human review', {
      workspaceId: connection.workspace_id,
      senderId: dmEvent.senderId,
      classification: result.classification,
    });
    // Future: push to flagged_inbox or send notification to workspace owner
  }
}

// ─── Helper: Load automation config ──────────────────────────────────────────

async function loadAutomationConfig(workspaceId: string): Promise<AutomationConfig> {
  try {
    const { data } = await supabase
      .from('instagram_automation_config')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (data) {
      return {
        enabled: data.enabled ?? false,
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
        jitterMinSeconds: data.jitter_min_seconds ?? 25,
        jitterMaxSeconds: data.jitter_max_seconds ?? 120,
        threadChainingEnabled: data.thread_chaining_enabled ?? true,
        dmTemplate: data.dm_template || undefined,
        dmAutoReplyEnabled: data.dm_auto_reply_enabled ?? false,
        dmWelcomeMessage: data.dm_welcome_message || undefined,
        dmKnowledgeBase: data.dm_knowledge_base || undefined,
        dmEscalationEnabled: data.dm_escalation_enabled ?? true,
        dmMaxRepliesPerHour: data.dm_max_replies_per_hour ?? 20,
      };
    }
  } catch {
    // Table may not exist yet — fall back to defaults
  }

  return DEFAULT_AUTOMATION_CONFIG;
}

async function getWorkspaceIdForIgUser(igUserId: string): Promise<string> {
  const { data } = await supabase
    .from('platform_connections')
    .select('workspace_id')
    .eq('platform', 'instagram')
    .eq('platform_user_id', igUserId)
    .eq('status', 'connected')
    .single();
  return data?.workspace_id || '';
}

// ─── Helper: Log comment event ────────────────────────────────────────────────

async function logCommentEvent(
  workspaceId: string,
  comment: CommentEvent,
  classification: ClassifiedComment
): Promise<void> {
  try {
    await supabase.from('instagram_comment_logs').insert({
      workspace_id: workspaceId,
      comment_id: comment.commentId,
      media_id: comment.mediaId,
      comment_text: comment.text,
      commenter_username: comment.username,
      classification: classification.classification,
      confidence: classification.confidence,
      suggested_reply: classification.suggestedReply,
      auto_replied: classification.shouldAutoReply,
      flagged_for_review: classification.shouldFlagForReview,
      reasoning: classification.reasoning,
      lead_score: classification.leadScore,
      dm_sent: classification.shouldSendDM,
      dm_message: classification.suggestedDM,
      thread_hook: classification.threadHook,
    });
  } catch (error) {
    logger.warn('Failed to log Instagram comment event', { error });
  }
}

// ─── Helper: Log DM event ─────────────────────────────────────────────────────

async function logDmEvent(
  workspaceId: string,
  dm: DmEvent,
  classification: { classification: string; confidence: number; suggestedReply: string; leadScore: number; shouldAutoReply: boolean; shouldEscalate: boolean; reasoning: string }
): Promise<void> {
  try {
    await supabase.from('instagram_dm_logs').insert({
      workspace_id: workspaceId,
      message_id: dm.messageId,
      sender_id: dm.senderId,
      sender_username: dm.senderUsername,
      message_text: dm.text,
      classification: classification.classification,
      confidence: classification.confidence,
      ai_reply: classification.suggestedReply,
      auto_replied: classification.shouldAutoReply,
      escalated: classification.shouldEscalate,
      lead_score: classification.leadScore,
      reasoning: classification.reasoning,
    });
  } catch (error) {
    logger.warn('Failed to log Instagram DM event', { error });
  }
}

// ─── Helper: Flag comment for review ─────────────────────────────────────────

async function flagCommentForReview(
  workspaceId: string,
  comment: CommentEvent,
  classification: { classification: string; suggestedReply: string; reasoning: string },
  leadScore = 0
): Promise<void> {
  if (!workspaceId) return;
  try {
    await supabase.from('instagram_flagged_comments').insert({
      workspace_id: workspaceId,
      comment_id: comment.commentId,
      media_id: comment.mediaId,
      comment_text: comment.text,
      commenter_username: comment.username,
      classification: classification.classification,
      suggested_reply: classification.suggestedReply,
      reasoning: classification.reasoning,
      status: 'pending',
      lead_score: leadScore,
      priority: leadScore >= 2 ? 'high' : 'normal',
    });
  } catch (error) {
    logger.warn('Failed to flag Instagram comment for review', { error });
  }
}
