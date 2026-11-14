import { NextResponse } from 'next/server';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { decryptToken } from '@/lib/crypto/encryption';
import { InstagramCommentAutomation } from '@/lib/services/InstagramCommentAutomation';
import { ContentGuard } from '@/lib/ai/ContentGuard';
import { velocityThrottle } from '@/lib/services/automation/velocity';
import { lexicalEntropyGuard } from '@/lib/services/automation/lexical';
import { queueService, type FacebookOutboundJobParams } from '@/lib/services/QueueService';
import { facebookAdapter } from '@/lib/platforms/FacebookAdapter';

export async function processFacebookOutboundJob(params: FacebookOutboundJobParams) {
  const { jobId, jobType, workspaceId, connectionId, pageId, commentId, messageId, commentText, dmText, senderId } = params;
  const targetId = commentId || messageId;

  if (!workspaceId || !jobType || !targetId || !pageId) {
    logger.error('Invalid Facebook outbound payload: missing required fields', { params });
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
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

  // ── Load automation config ──
  const { data: cfg } = await supabaseAdmin
    .from('facebook_automation_config')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('page_id', pageId)
    .maybeSingle();

  if (cfg?.enabled === false) {
    logger.info('Facebook automation disabled — skipping job', { workspaceId, pageId });
    await markJobSent(workspaceId, jobType, targetId);
    return NextResponse.json({ success: true, action: 'automation_disabled' });
  }

  // ── Respect per-type toggle flags ──
  if (jobType === 'comment_reply' && cfg?.auto_reply_comments === false) {
    logger.info('Facebook auto_reply_comments disabled — skipping comment_reply job', { workspaceId, pageId });
    await markJobSent(workspaceId, jobType, targetId);
    return NextResponse.json({ success: true, action: 'auto_reply_comments_disabled' });
  }
  if (jobType === 'messenger_reply' && cfg?.auto_reply_dm === false) {
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

  const groqApiKey = config.GROQ_API_KEY || process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    const errorMsg = 'GROQ_API_KEY not configured';
    await markDeadLetter(workspaceId, jobType, targetId, errorMsg, params);
    return NextResponse.json({ error: errorMsg, deadLetter: true });
  }

  const automation = new InstagramCommentAutomation(groqApiKey);

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
      const canReply = await velocityThrottle.canReply(`fb:${workspaceId}`, cfg?.max_replies_per_hour || 30);
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

      // AI classification
      const recentReplies = await lexicalEntropyGuard.getRecentReplies(`fb:${workspaceId}`, 15);
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
          enabled: cfg?.enabled ?? true,
          autoReplyPositive: cfg?.auto_reply_positive ?? true,
          autoReplyQuestions: cfg?.auto_reply_questions ?? true,
          autoReplyLinkRequests: cfg?.auto_reply_link_requests ?? true,
          autoReplyPurchaseIntent: cfg?.auto_reply_purchase_intent ?? true,
          linkUrl: cfg?.link_url || undefined,
          customInstructions: cfg?.custom_instructions || undefined,
          brandPersona: cfg?.brand_persona || undefined,
          flagNegative: cfg?.flag_negative ?? true,
          flagSpam: cfg?.flag_spam ?? true,
          maxRepliesPerHour: cfg?.max_replies_per_hour ?? 30,
          jitterMinSeconds: 25,
          jitterMaxSeconds: 120,
          threadChainingEnabled: false,
          requireFollowForDm: false,
        },
        recentReplies
      );

      if (!classified.shouldAutoReply || !classified.suggestedReply || classified.suggestedReply === 'SKIP') {
        logger.info('Facebook AI: comment does not need auto-reply', { commentId, classification: classified.classification });
        await upsertCommentLog(workspaceId, commentId, params, classified, null, false);
        await markJobSent(workspaceId, jobType, targetId);
        return NextResponse.json({ success: true, action: 'skipped_by_policy' });
      }

      // Spam → hide and skip
      if (classified.classification === 'spam' && cfg?.auto_hide_spam) {
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

      // Sanitize & entropy check
      let finalReply = ContentGuard.sanitizeOutput(classified.suggestedReply);

      if (lexicalEntropyGuard.isTooSimilar(finalReply, recentReplies)) {
        const errorMsg = 'Generated reply too similar to recent replies — flagged for review';
        await markDeadLetter(workspaceId, jobType, targetId, errorMsg, params);
        return NextResponse.json({ success: true, flagged: true });
      }

      // Post public comment reply
      const replyResult = await facebookAdapter.postCommentReply(pageAccessToken, commentId, finalReply);

      // Post private DM if shouldSendDM and link configured
      let didSendDm = false;
      if (classified.shouldSendDM && cfg?.link_url) {
        try {
          const dmMsg = classified.suggestedDM || `Here's the link: ${cfg.link_url}`;
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
      lexicalEntropyGuard.recordReply(`fb:${workspaceId}`, finalReply);

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

      const { data: dmLog } = await supabaseAdmin
        .from('facebook_dm_logs')
        .select('auto_replied')
        .eq('message_id', messageId)
        .maybeSingle();

      if (dmLog?.auto_replied === true) {
        await markJobSent(workspaceId, jobType, targetId);
        return NextResponse.json({ success: true, message: 'Already replied' });
      }

      const canReply = await velocityThrottle.canReply(`fb-dm:${workspaceId}`, cfg?.dm_max_replies_per_hour || 20);
      if (!canReply) {
        const delaySeconds = velocityThrottle.getSecondsUntilNextHourBucket(30, 180);
        if (queueService.isAvailable()) {
          await queueService.enqueueFacebookOutboundTask({ ...params, delaySeconds });
        }
        return NextResponse.json({ success: true, deferred: true, delaySeconds });
      }

      // AI classify DM
      const classified = await automation.classifyAndGenerateReply(
        { commentId: messageId, mediaId: '', text: dmText, username: params.senderName || '', timestamp: new Date().toISOString() },
        '',
        {
          enabled: cfg?.enabled ?? true,
          autoReplyPositive: cfg?.auto_reply_dm ?? true,
          autoReplyQuestions: true,
          autoReplyLinkRequests: true,
          autoReplyPurchaseIntent: true,
          linkUrl: cfg?.link_url || undefined,
          customInstructions: cfg?.custom_instructions || undefined,
          brandPersona: cfg?.brand_persona || undefined,
          flagNegative: false,
          flagSpam: true,
          maxRepliesPerHour: cfg?.dm_max_replies_per_hour ?? 20,
          jitterMinSeconds: 10,
          jitterMaxSeconds: 60,
          threadChainingEnabled: false,
          requireFollowForDm: false,
        },
        []
      );

      if (!classified.shouldAutoReply || !classified.suggestedReply || classified.suggestedReply === 'SKIP') {
        await markJobSent(workspaceId, jobType, targetId);
        return NextResponse.json({ success: true, action: 'skipped_by_policy' });
      }

      const finalReply = ContentGuard.sanitizeOutput(classified.suggestedReply);
      await facebookAdapter.sendMessengerMessage(pageAccessToken, pageId, senderId, finalReply);

      await supabaseAdmin.from('facebook_dm_logs').upsert({
        workspace_id: workspaceId,
        page_id: pageId,
        message_id: messageId,
        sender_id: senderId,
        message_text: dmText,
        ai_reply: finalReply,
        auto_replied: true,
        delivery_status: 'sent',
        reply_sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'message_id' });

      await markJobSent(workspaceId, jobType, targetId);
      await velocityThrottle.recordReply(`fb-dm:${workspaceId}`);

      logger.info('Facebook Messenger reply sent', { messageId });
      return NextResponse.json({ success: true });
    }

    throw new Error(`Unknown jobType: ${jobType}`);
  } catch (jobErr) {
    const errorMsg = jobErr instanceof Error ? jobErr.message : String(jobErr);
    logger.error('Facebook outbound job failed', { jobId, jobType, targetId, error: errorMsg });
    if (currentRetry >= (existingJob?.max_retries || 3)) {
      await markDeadLetter(workspaceId, jobType, targetId, errorMsg, params);
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

async function upsertCommentLog(
  workspaceId: string,
  commentId: string,
  params: FacebookOutboundJobParams,
  classified: { classification?: string; confidence?: number; reasoning?: string; suggestedReply?: string; shouldFlagForReview?: boolean },
  finalReply: string | null,
  autoReplied: boolean,
  dmSent: boolean = false
) {
  await supabaseAdmin.from('facebook_comment_logs').upsert({
    workspace_id: workspaceId,
    page_id: params.pageId,
    comment_id: commentId,
    post_id: params.postId || null,
    commenter_id: params.commenterId || null,
    commenter_name: params.commenterName || null,
    comment_text: params.commentText || null,
    classification: classified.classification || null,
    confidence: classified.confidence || null,
    suggested_reply: finalReply || classified.suggestedReply || null,
    reasoning: classified.reasoning || null,
    auto_replied: autoReplied,
    delivery_status: autoReplied ? 'sent' : 'skipped',
    flagged_for_review: classified.shouldFlagForReview ?? false,
    reply_sent_at: autoReplied ? new Date().toISOString() : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'comment_id' });
}

