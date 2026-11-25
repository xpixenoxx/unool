import { NextResponse } from 'next/server';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { decryptToken } from '@/lib/crypto/encryption';
import { InstagramCommentAutomation, type ConversationMessage } from '@/lib/services/InstagramCommentAutomation';
import { ContentGuard } from '@/lib/ai/ContentGuard';
import { velocityThrottle } from '@/lib/services/automation/velocity';
import { lexicalEntropyGuard } from '@/lib/services/automation/lexical';
import { resolveCreatorDeliveryLink } from '@/lib/services/automation/linkResolver';
import { queueService, type FacebookOutboundJobParams } from '@/lib/services/QueueService';
import { facebookAdapter } from '@/lib/platforms/FacebookAdapter';
import { isAutomationEnabledServer } from '@/lib/feature-flags-server';

async function loadFacebookConfig(workspaceId: string): Promise<Record<string, any> | null> {
  const { data: tableCfg, error: tableErr } = await supabaseAdmin
    .from('facebook_automation_config')
    .select('*')
    .eq('workspace_id', workspaceId)
    .limit(1)
    .maybeSingle();

  if (!tableErr && tableCfg) {
    return tableCfg;
  }

  try {
    const { data: ws } = await supabaseAdmin
      .from('workspaces')
      .select('settings')
      .eq('id', workspaceId)
      .maybeSingle();
    const wsSettings = (ws?.settings as Record<string, any>) || {};
    if (wsSettings.facebook_automation) {
      return wsSettings.facebook_automation as Record<string, any>;
    }
  } catch {
    // Non-fatal fallback lookup
  }

  return null;
}

export async function processFacebookOutboundJob(params: FacebookOutboundJobParams) {
  const { jobId, jobType, workspaceId, connectionId, pageId, commentId, messageId, commentText, dmText, senderId } = params;
  const targetId = commentId || messageId;

  if (!workspaceId || !jobType || !targetId || !pageId) {
    logger.error('Invalid Facebook outbound payload: missing required fields', { params });
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const globalAutomationEnabled = await isAutomationEnabledServer();
  if (!globalAutomationEnabled) {
    logger.info('Facebook automation disabled globally by admin — skipping job', { workspaceId, pageId, targetId });
    await markJobSent(workspaceId, jobType, targetId);
    return NextResponse.json({ success: true, action: 'automation_disabled_by_admin' });
  }

  // ── Idempotency check ──
  const { data: existingJob } = await supabaseAdmin
    .from('facebook_outbound_jobs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('job_type', jobType)
    .eq('target_id', targetId)
    .maybeSingle();

  if (existingJob?.status === 'sent') {
    logger.info('Facebook outbound: job already sent (idempotent skip)', { jobId, targetId });
    return NextResponse.json({ success: true, message: 'Already sent' });
  }

  const currentRetry = (existingJob?.retry_count || 0) + 1;

  await supabaseAdmin.from('facebook_outbound_jobs').upsert({
    workspace_id: workspaceId,
    job_type: jobType,
    target_id: targetId,
    status: 'processing',
    retry_count: currentRetry,
    max_retries: existingJob?.max_retries || 3,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'workspace_id,job_type,target_id' });

  // ── Load automation config (fail closed if missing or disabled) ──
  const cfg = await loadFacebookConfig(workspaceId);

  if (!cfg || cfg.enabled === false) {
    logger.info('Facebook automation disabled — skipping job', { workspaceId, pageId });
    await markJobSent(workspaceId, jobType, targetId);
    return NextResponse.json({ success: true, action: 'automation_disabled' });
  }

  // ── Respect per-type toggle flags ──
  const autoReplyComments = cfg.auto_reply_comments ?? cfg.autoReplyComments ?? true;
  const autoReplyDm = cfg.auto_reply_dm ?? cfg.autoReplyDm ?? true;
  if (jobType === 'comment_reply' && autoReplyComments === false) {
    logger.info('Facebook auto_reply_comments disabled — skipping comment_reply job', { workspaceId, pageId });
    await markJobSent(workspaceId, jobType, targetId);
    return NextResponse.json({ success: true, action: 'auto_reply_comments_disabled' });
  }
  if (jobType === 'messenger_reply' && autoReplyDm === false) {
    logger.info('Facebook auto_reply_dm disabled — skipping messenger_reply job', { workspaceId, pageId });
    await markJobSent(workspaceId, jobType, targetId);
    return NextResponse.json({ success: true, action: 'auto_reply_dm_disabled' });
  }

  // ── Resolve platform connection & decrypt token ──
  let connQuery = supabaseAdmin
    .from('platform_connections')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('platform', 'facebook')
    .eq('status', 'connected');

  if (connectionId) connQuery = connQuery.eq('id', connectionId);

  const { data: connections } = await connQuery.limit(1);
  const connection = connections?.[0];

  if (!connection) {
    const errorMsg = 'No active Facebook connection found for workspace';
    await markDeadLetter(workspaceId, jobType, targetId, errorMsg, params);
    return NextResponse.json({ error: errorMsg, deadLetter: true });
  }

  let userAccessToken: string;
  try {
    userAccessToken = await decryptToken(connection.access_token_encrypted);
  } catch (decErr) {
    const errorMsg = 'Failed to decrypt Facebook access token';
    logger.error(errorMsg, { connectionId: connection.id, error: decErr });
    await markDeadLetter(workspaceId, jobType, targetId, errorMsg, params);
    return NextResponse.json({ error: errorMsg, deadLetter: true });
  }

  // ── Exchange user token → page token ──
  let pageAccessToken: string;
  try {
    pageAccessToken = await facebookAdapter.getPageAccessToken(userAccessToken, pageId);
  } catch (tokenErr) {
    const errorMsg = 'Failed to get Facebook page access token';
    logger.error(errorMsg, { pageId, error: tokenErr });
    await markDeadLetter(workspaceId, jobType, targetId, errorMsg, params);
    return NextResponse.json({ error: errorMsg, deadLetter: true });
  }

  const groqApiKey =
    config.GROQ_API_KEY ||
    process.env.GROQ_API_KEY ||
    config.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY;
  if (!groqApiKey) {
    const errorMsg = 'GROQ_API_KEY not configured';
    await markDeadLetter(workspaceId, jobType, targetId, errorMsg, params);
    return NextResponse.json({ error: errorMsg, deadLetter: true });
  }

  const automation = new InstagramCommentAutomation(groqApiKey, config.AI_GROQ_MODEL || 'openai/gpt-oss-120b');
  const configuredLink = cfg.link_url ?? cfg.linkUrl ?? undefined;
  const maxRepliesPerHour = cfg.max_replies_per_hour ?? cfg.maxRepliesPerHour ?? 20;
  const dmMaxRepliesPerHour = cfg.dm_max_replies_per_hour ?? cfg.dmMaxRepliesPerHour ?? 20;
  const jitterMinSeconds = cfg.jitter_min_seconds ?? cfg.jitterMinSeconds ?? 20;
  const jitterMaxSeconds = cfg.jitter_max_seconds ?? cfg.jitterMaxSeconds ?? 90;
  const autoHideSpam = cfg.auto_hide_spam ?? cfg.autoHideSpam ?? true;
  const flagNegative = cfg.flag_negative ?? cfg.flagNegative ?? true;
  const flagSpam = cfg.flag_spam ?? cfg.flagSpam ?? true;

  let pendingClassified: { classification?: string; confidence?: number; reasoning?: string; suggestedReply?: string; shouldFlagForReview?: boolean } | null = null;
  let pendingFinalReply: string | null = null;

  try {
    // ════════════════════════════════════════════════════════════
    // COMMENT_REPLY flow
    // ════════════════════════════════════════════════════════════
    if (jobType === 'comment_reply') {
      if (!commentId) {
        throw new Error('Missing commentId for comment_reply');
      }

      if (!commentText || !commentText.trim()) {
        logger.info('Facebook comment event has no text (sticker/GIF/photo attachment) — skipping reply', { commentId });
        await markJobSent(workspaceId, jobType, targetId);
        return NextResponse.json({ success: true, action: 'empty_comment_text' });
      }

      // ContentGuard pre-filter for harmful incoming comments
      const guardResult = ContentGuard.validateComment(commentText);
      if (!guardResult.safe && guardResult.violation.level === 'blocked') {
        logger.info('ContentGuard blocked incoming Facebook comment', {
          code: guardResult.violation.code,
          commentId,
        });
        await upsertCommentLog(
          workspaceId,
          commentId,
          params,
          {
            classification: 'harmful',
            confidence: 1,
            suggestedReply: 'SKIP',
            reasoning: guardResult.violation.internal || guardResult.violation.message,
            shouldFlagForReview: true,
          },
          null,
          false
        );
        await markJobSent(workspaceId, jobType, targetId);
        return NextResponse.json({ success: true, action: 'blocked_by_guard' });
      }

      // Dedup against comment logs
      const { data: logRow } = await supabaseAdmin
        .from('facebook_comment_logs')
        .select('auto_replied')
        .eq('comment_id', commentId)
        .maybeSingle();

      if (logRow?.auto_replied === true) {
        logger.info('Facebook comment already replied (dedup skip)', { commentId });
        await markJobSent(workspaceId, jobType, targetId);
        return NextResponse.json({ success: true, message: 'Already replied' });
      }

      // 7-day Meta window check
      const META_WINDOW_MS = (6 * 24 + 23) * 60 * 60 * 1000;
      const commentTimeIso = params.commentTimestamp || existingJob?.created_at;
      if (commentTimeIso) {
        const ageMs = Date.now() - new Date(commentTimeIso).getTime();
        if (Number.isFinite(ageMs) && ageMs > META_WINDOW_MS) {
          const expiredMsg = 'Meta 7-day comment reply window expired';
          logger.warn(expiredMsg, { workspaceId, commentId });
          await markDeadLetter(workspaceId, jobType, targetId, expiredMsg, params);
          return NextResponse.json({ error: expiredMsg, expired: true });
        }
      }

      // Velocity throttle
      const canReply = await velocityThrottle.canReply(`fb:${workspaceId}`, maxRepliesPerHour);
      if (!canReply) {
        const delaySeconds = velocityThrottle.getSecondsUntilNextHourBucket(30, 180);
        logger.info('Facebook velocity limit reached — deferring', { workspaceId, commentId, delaySeconds });
        await supabaseAdmin.from('facebook_outbound_jobs')
          .update({ status: 'queued', last_error: `deferred +${delaySeconds}s`, updated_at: new Date().toISOString() })
          .eq('workspace_id', workspaceId).eq('job_type', jobType).eq('target_id', targetId);
        if (queueService.isAvailable()) {
          await queueService.enqueueFacebookOutboundTask({ ...params, delaySeconds });
        }
        return NextResponse.json({ success: true, deferred: true, delaySeconds });
      }

      // Resolve canonical or post-linked delivery URL
      const activeLinkUrl = await resolveCreatorDeliveryLink(workspaceId, {
        configuredLinkUrl: configuredLink,
        brandUsername: connection.username,
        mediaId: params.postId,
        userId: connection.user_id,
      });

      // AI classification
      const recentReplies = await lexicalEntropyGuard.getRecentReplies(`fb:${workspaceId}`, 15, params.postId);
      const classified = await automation.classifyAndGenerateReply(
        {
          commentId,
          mediaId: params.postId || '',
          text: commentText,
          username: params.commenterName || '',
          timestamp: new Date().toISOString(),
        },
        '',
        {
          enabled: cfg.enabled ?? true,
          autoReplyPositive: cfg.auto_reply_positive ?? cfg.autoReplyPositive ?? true,
          autoReplyQuestions: cfg.auto_reply_questions ?? cfg.autoReplyQuestions ?? true,
          autoReplyLinkRequests: cfg.auto_reply_link_requests ?? cfg.autoReplyLinkRequests ?? true,
          autoReplyPurchaseIntent: cfg.auto_reply_purchase_intent ?? cfg.autoReplyPurchaseIntent ?? true,
          linkUrl: activeLinkUrl,
          customInstructions: cfg.custom_instructions ?? cfg.customInstructions ?? undefined,
          brandPersona: cfg.brand_persona ?? cfg.brandPersona ?? undefined,
          flagNegative,
          flagSpam,
          maxRepliesPerHour,
          jitterMinSeconds,
          jitterMaxSeconds,
          threadChainingEnabled: false,
          requireFollowForDm: false,
        },
        recentReplies
      );

      // Respect flag_negative and flag_spam toggles
      classified.shouldFlagForReview =
        classified.shouldFlagForReview &&
        !(classified.classification === 'negative' && flagNegative === false) &&
        !(classified.classification === 'spam' && flagSpam === false);

      // Spam → hide and skip (must run BEFORE !shouldAutoReply early return because spam always has shouldAutoReply=false)
      if (classified.classification === 'spam' && autoHideSpam) {
        try {
          await facebookAdapter.hideComment(pageAccessToken, commentId, true);
          logger.info('Facebook spam comment hidden', { commentId });
        } catch (hideErr) {
          logger.warn('Failed to hide Facebook spam comment', { commentId, error: hideErr });
        }
        await upsertCommentLog(workspaceId, commentId, params, classified, null, false);
        await markJobSent(workspaceId, jobType, targetId);
        return NextResponse.json({ success: true, action: 'spam_hidden' });
      }

      if (!classified.shouldAutoReply || !classified.suggestedReply || classified.suggestedReply === 'SKIP') {
        if (classified.reasoning?.startsWith('Classification failed:')) {
          logger.error('Facebook AI classification failed — logging comment for review', {
            commentId,
            reasoning: classified.reasoning,
          });
        } else {
          logger.info('Facebook AI: comment does not need auto-reply', { commentId, classification: classified.classification });
        }
        await upsertCommentLog(workspaceId, commentId, params, classified, null, false);
        await markJobSent(workspaceId, jobType, targetId);
        return NextResponse.json({ success: true, action: 'skipped_by_policy' });
      }

      // Sanitize & entropy check
      const finalReply = ContentGuard.sanitizeOutput(classified.suggestedReply);
      pendingClassified = classified;
      pendingFinalReply = finalReply;

      if (lexicalEntropyGuard.isTooSimilar(finalReply, recentReplies)) {
        const errorMsg = 'Generated reply too similar to recent replies — flagged for review';
        await upsertCommentLog(
          workspaceId,
          commentId,
          params,
          { ...classified, shouldFlagForReview: true, reasoning: errorMsg },
          finalReply,
          false
        );
        await markDeadLetter(workspaceId, jobType, targetId, errorMsg, params);
        return NextResponse.json({ success: true, flagged: true });
      }

      // Post public comment reply
      const replyResult = await facebookAdapter.postCommentReply(pageAccessToken, commentId, finalReply);

      // Post private DM only if auto_reply_dm is enabled, shouldSendDM, and a delivery link exists
      let didSendDm = false;
      if (autoReplyDm !== false && classified.shouldSendDM && activeLinkUrl) {
        try {
          const dmMsg = classified.suggestedDM || `Here's the link: ${activeLinkUrl}`;
          await facebookAdapter.sendPrivateReplyFromComment(pageAccessToken, pageId, commentId, ContentGuard.sanitizeOutput(dmMsg));
          didSendDm = true;
          logger.info('Facebook private reply from comment sent', { commentId });
        } catch (dmErr) {
          logger.warn('Failed to send Facebook private reply from comment', { commentId, error: dmErr });
        }
      }

      await markJobSent(workspaceId, jobType, targetId);
      await upsertCommentLog(workspaceId, commentId, params, classified, finalReply, true, didSendDm);
      await velocityThrottle.recordReply(`fb:${workspaceId}`);
      lexicalEntropyGuard.recordReply(`fb:${workspaceId}`, finalReply, params.postId);

      logger.info('Facebook comment reply sent', { commentId, replyId: replyResult.id });
      return NextResponse.json({ success: true, replyId: replyResult.id });
    }

    // ════════════════════════════════════════════════════════════
    // MESSENGER_REPLY flow
    // ════════════════════════════════════════════════════════════
    if (jobType === 'messenger_reply') {
      if (!messageId || !senderId) {
        throw new Error('Missing messageId or senderId for messenger_reply');
      }

      if (!dmText || !dmText.trim()) {
        logger.info('Facebook Messenger DM event has no text (attachment/sticker/audio) — skipping reply', { messageId });
        await markJobSent(workspaceId, jobType, targetId);
        return NextResponse.json({ success: true, action: 'empty_dm_text' });
      }

      const guardResult = ContentGuard.validateComment(dmText);
      if (!guardResult.safe && guardResult.violation.level === 'blocked') {
        logger.info('ContentGuard blocked incoming Facebook Messenger DM', { code: guardResult.violation.code, messageId });
        await markJobSent(workspaceId, jobType, targetId);
        return NextResponse.json({ success: true, action: 'blocked_by_guard' });
      }

      const { data: dmLog } = await supabaseAdmin
        .from('facebook_dm_logs')
        .select('auto_replied')
        .eq('message_id', messageId)
        .maybeSingle();

      if (dmLog?.auto_replied === true) {
        await markJobSent(workspaceId, jobType, targetId);
        return NextResponse.json({ success: true, message: 'Already replied' });
      }

      const canReply = await velocityThrottle.canReply(`fb-dm:${workspaceId}`, dmMaxRepliesPerHour);
      if (!canReply) {
        const delaySeconds = velocityThrottle.getSecondsUntilNextHourBucket(30, 180);
        if (queueService.isAvailable()) {
          await queueService.enqueueFacebookOutboundTask({ ...params, delaySeconds });
        }
        return NextResponse.json({ success: true, deferred: true, delaySeconds });
      }

      // Load multi-turn conversation history for this Messenger sender
      const { data: previousLogs } = await supabaseAdmin
        .from('facebook_dm_logs')
        .select('message_text, ai_reply, escalated, created_at')
        .eq('workspace_id', workspaceId)
        .eq('sender_id', senderId)
        .order('created_at', { ascending: true })
        .limit(30);

      const conversationHistory: ConversationMessage[] = [];
      let priorTurnCount = 0;
      let alreadyEscalated = false;

      if (Array.isArray(previousLogs)) {
        for (const l of previousLogs) {
          if (l.escalated === true) alreadyEscalated = true;
          if (l.message_text) conversationHistory.push({ role: 'user', text: l.message_text });
          if (l.ai_reply && l.ai_reply !== 'SKIP') {
            conversationHistory.push({ role: 'assistant', text: l.ai_reply });
            priorTurnCount++;
          }
        }
      }

      const DM_TURN_LIMIT = 15;
      if (priorTurnCount >= DM_TURN_LIMIT) {
        logger.info('Facebook Messenger DM reached 15-turn ceiling — skipping auto-reply', {
          workspaceId,
          senderId,
          priorTurnCount,
          alreadyEscalated,
        });
        await upsertDmLog(workspaceId, pageId, messageId, senderId, dmText, {
          classification: 'unrelated',
          confidence: 1,
          aiReply: 'SKIP',
          autoReplied: false,
          deliveryStatus: 'needs_review',
          escalated: true,
        });
        await markJobSent(workspaceId, jobType, targetId);
        return NextResponse.json({ success: true, action: 'turn_limit_reached', priorTurnCount });
      }

      const activeLinkUrl = await resolveCreatorDeliveryLink(workspaceId, {
        configuredLinkUrl: configuredLink,
        brandUsername: connection.username,
        userId: connection.user_id,
      });

      // AI classify DM using the multi-turn DM classifier
      const classified = await automation.classifyAndReplyDM(
        {
          messageId,
          senderId,
          senderUsername: params.senderName,
          text: dmText,
          timestamp: new Date().toISOString(),
        },
        {
          enabled: cfg.enabled ?? true,
          autoReplyPositive: autoReplyDm,
          autoReplyQuestions: true,
          autoReplyLinkRequests: true,
          autoReplyPurchaseIntent: true,
          linkUrl: activeLinkUrl,
          customInstructions: cfg.custom_instructions ?? cfg.customInstructions ?? undefined,
          brandPersona: cfg.brand_persona ?? cfg.brandPersona ?? undefined,
          flagNegative: false,
          flagSpam: true,
          dmAutoReplyEnabled: autoReplyDm,
          dmEscalationEnabled: true,
          dmMaxRepliesPerHour,
          jitterMinSeconds: 10,
          jitterMaxSeconds: 60,
          threadChainingEnabled: false,
          requireFollowForDm: false,
        },
        conversationHistory,
        priorTurnCount + 1,
        connection.display_name || connection.username || 'our team',
        true
      );

      if (!classified.shouldAutoReply || !classified.suggestedReply || classified.suggestedReply === 'SKIP') {
        await upsertDmLog(workspaceId, pageId, messageId, senderId, dmText, {
          classification: classified.classification,
          confidence: classified.confidence,
          aiReply: classified.suggestedReply || 'SKIP',
          autoReplied: false,
          deliveryStatus: classified.shouldEscalate ? 'needs_review' : 'skipped',
          escalated: classified.shouldEscalate,
        });
        await markJobSent(workspaceId, jobType, targetId);
        return NextResponse.json({ success: true, action: 'skipped_by_policy' });
      }

      const finalReply = ContentGuard.sanitizeOutput(classified.suggestedReply);
      await facebookAdapter.sendMessengerMessage(pageAccessToken, pageId, senderId, finalReply);

      await upsertDmLog(workspaceId, pageId, messageId, senderId, dmText, {
        classification: classified.classification,
        confidence: classified.confidence,
        aiReply: finalReply,
        autoReplied: true,
        deliveryStatus: 'sent',
        escalated: false,
        replySentAt: new Date().toISOString(),
      });

      await markJobSent(workspaceId, jobType, targetId);
      await velocityThrottle.recordReply(`fb-dm:${workspaceId}`);

      logger.info('Facebook Messenger reply sent', { messageId });
      return NextResponse.json({ success: true });
    }

    throw new Error(`Unknown jobType: ${jobType}`);
  } catch (jobErr) {
    const errorMsg = jobErr instanceof Error ? jobErr.message : String(jobErr);
    const isPermanentAuthOrPermissionError =
      (jobErr instanceof Error && (jobErr.name === 'AuthenticationError' || jobErr.name === 'ValidationError')) ||
      errorMsg.includes('OAuthException') ||
      errorMsg.includes('Permission denied (403)');

    logger.error('Facebook outbound job failed', { jobId, jobType, targetId, error: errorMsg, permanent: isPermanentAuthOrPermissionError });

    if (jobType === 'comment_reply' && commentId && pendingClassified) {
      await upsertCommentLog(
        workspaceId,
        commentId,
        params,
        {
          ...pendingClassified,
          shouldFlagForReview: true,
          reasoning: `Reply delivery failed: ${errorMsg}`,
        },
        pendingFinalReply,
        false,
        false,
        'failed'
      );
    }

    if (isPermanentAuthOrPermissionError || currentRetry >= (existingJob?.max_retries || 3)) {
      await markDeadLetter(workspaceId, jobType, targetId, errorMsg, params);
      if (isPermanentAuthOrPermissionError) {
        return NextResponse.json({ error: errorMsg, deadLetter: true });
      }
    } else {
      await supabaseAdmin.from('facebook_outbound_jobs')
        .update({ status: 'queued', last_error: errorMsg, updated_at: new Date().toISOString() })
        .eq('workspace_id', workspaceId).eq('job_type', jobType).eq('target_id', targetId);
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

async function markJobSent(workspaceId: string, jobType: string, targetId: string) {
  await supabaseAdmin.from('facebook_outbound_jobs')
    .update({ status: 'sent', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('workspace_id', workspaceId).eq('job_type', jobType).eq('target_id', targetId);
}

async function markDeadLetter(
  workspaceId: string,
  jobType: string,
  targetId: string,
  reason: string,
  params: FacebookOutboundJobParams
) {
  await supabaseAdmin.from('facebook_outbound_jobs').upsert({
    workspace_id: workspaceId,
    job_type: jobType,
    target_id: targetId,
    status: 'needs_review',
    last_error: reason,
    payload: params as unknown as Record<string, unknown>,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'workspace_id,job_type,target_id' });
  logger.error('Facebook outbound job dead-lettered', { workspaceId, jobType, targetId, reason });
}

function formatDbError(error: unknown): string {
  if (!error) return 'Unknown error';
  if (error instanceof Error) return error.message;
  if (typeof error === 'object') {
    const e = error as { message?: string; details?: string; code?: string };
    return [e.code, e.message, e.details].filter(Boolean).join(': ') || JSON.stringify(error);
  }
  return String(error);
}

async function upsertDmLog(
  workspaceId: string,
  pageId: string,
  messageId: string,
  senderId: string,
  dmText: string,
  fields: {
    classification: string;
    confidence: number;
    aiReply: string;
    autoReplied: boolean;
    deliveryStatus: string;
    escalated: boolean;
    replySentAt?: string;
  }
) {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from('facebook_dm_logs').upsert({
    workspace_id: workspaceId,
    page_id: pageId,
    message_id: messageId,
    sender_id: senderId,
    message_text: dmText,
    classification: fields.classification,
    confidence: fields.confidence,
    ai_reply: fields.aiReply,
    auto_replied: fields.autoReplied,
    delivery_status: fields.deliveryStatus,
    escalated: fields.escalated,
    reply_sent_at: fields.replySentAt || null,
    created_at: now,
  }, { onConflict: 'message_id' });

  if (error) {
    logger.warn('Failed to upsert facebook_dm_logs', { messageId, errorMessage: formatDbError(error) });
  }
}

async function upsertCommentLog(
  workspaceId: string,
  commentId: string,
  params: FacebookOutboundJobParams,
  classified: { classification?: string; confidence?: number; reasoning?: string; suggestedReply?: string; shouldFlagForReview?: boolean },
  finalReply: string | null,
  autoReplied: boolean,
  dmSent: boolean = false,
  deliveryStatusOverride?: 'sent' | 'skipped' | 'failed'
) {
  const now = new Date().toISOString();
  const corePayload = {
    workspace_id: workspaceId,
    page_id: params.pageId,
    comment_id: commentId,
    post_id: params.postId || '',
    commenter_id: params.commenterId || null,
    commenter_name: params.commenterName || null,
    comment_text: params.commentText || null,
    classification: classified.classification || null,
    confidence: classified.confidence || null,
    suggested_reply: finalReply || classified.suggestedReply || null,
    reasoning: classified.reasoning || null,
    auto_replied: autoReplied,
    delivery_status: deliveryStatusOverride || (autoReplied ? 'sent' : 'skipped'),
    flagged_for_review: classified.shouldFlagForReview ?? false,
    reply_sent_at: autoReplied ? now : null,
    created_at: now,
  };

  let { error } = await supabaseAdmin.from('facebook_comment_logs').upsert(
    {
      ...corePayload,
      dm_sent: dmSent,
      updated_at: now,
    },
    { onConflict: 'comment_id' }
  );

  // Resilient fallback if 20261113000003_fb_threads_schema_fixes.sql columns (dm_sent, updated_at) aren't applied yet
  if (error && (error.code === 'PGRST204' || error.code === '42703' || error.message?.includes('column'))) {
    logger.warn('facebook_comment_logs column mismatch, retrying upsert with core columns', {
      commentId,
      errorMessage: formatDbError(error),
    });
    const retry = await supabaseAdmin
      .from('facebook_comment_logs')
      .upsert(corePayload, { onConflict: 'comment_id' });
    error = retry.error;
  }

  if (error) {
    logger.error('Failed to upsert facebook_comment_logs', {
      commentId,
      errorMessage: formatDbError(error),
    });
  }
}

