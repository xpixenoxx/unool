import { NextResponse } from 'next/server';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { decryptToken } from '@/lib/crypto/encryption';
import { InstagramCommentAutomation } from '@/lib/services/InstagramCommentAutomation';
import { ContentGuard } from '@/lib/ai/ContentGuard';
import { velocityThrottle } from '@/lib/services/automation/velocity';
import { lexicalEntropyGuard } from '@/lib/services/automation/lexical';
import { resolveCommentReviewFlag } from '@/lib/services/automation/reviewPolicy';
import { queueService, type ThreadsOutboundJobParams } from '@/lib/services/QueueService';
import { threadsAdapter, clampThreadsText } from '@/lib/platforms/ThreadsAdapter';

export async function processThreadsOutboundJob(params: ThreadsOutboundJobParams) {
  const { jobId, jobType, workspaceId, connectionId, threadsUserId, replyId, replyText, eventType } = params;

  if (!workspaceId || !replyId || !threadsUserId) {
    logger.error('Invalid Threads outbound payload: missing required fields', { params });
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  // ── Idempotency check ──
  const { data: existingJob } = await supabaseAdmin
    .from('threads_outbound_jobs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('job_type', jobType)
    .eq('target_id', replyId)
    .maybeSingle();

  if (existingJob?.status === 'sent') {
    logger.info('Threads outbound: job already sent (idempotent skip)', { jobId, replyId });
    return NextResponse.json({ success: true, message: 'Already sent' });
  }

  const currentRetry = (existingJob?.retry_count || 0) + 1;

  await supabaseAdmin.from('threads_outbound_jobs').upsert({
    workspace_id: workspaceId,
    job_type: jobType,
    target_id: replyId,
    status: 'processing',
    retry_count: currentRetry,
    max_retries: existingJob?.max_retries || 3,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'workspace_id,job_type,target_id' });

  // ── Load automation config ──
  const { data: cfg } = await supabaseAdmin
    .from('threads_automation_config')
    .select('*')
    .eq('workspace_id', workspaceId)
    .limit(1)
    .maybeSingle();

  if (cfg?.enabled === false) {
    logger.info('Threads automation disabled — skipping job', { workspaceId, threadsUserId });
    await markJobSent(workspaceId, jobType, replyId);
    return NextResponse.json({ success: true, action: 'automation_disabled' });
  }

  // ── Respect per-type toggle flags ──
  if (eventType === 'reply' && cfg?.auto_reply_replies === false) {
    logger.info('Threads auto_reply_replies disabled — skipping reply job', { workspaceId, threadsUserId });
    await markJobSent(workspaceId, jobType, replyId);
    return NextResponse.json({ success: true, action: 'auto_reply_replies_disabled' });
  }
  if (eventType === 'mention' && cfg?.auto_reply_mentions === false) {
    logger.info('Threads auto_reply_mentions disabled — skipping mention job', { workspaceId, threadsUserId });
    await markJobSent(workspaceId, jobType, replyId);
    return NextResponse.json({ success: true, action: 'auto_reply_mentions_disabled' });
  }

  // ── Dedup check in reply logs ──
  const { data: existingLog } = await supabaseAdmin
    .from('threads_reply_logs')
    .select('id, auto_replied')
    .eq('reply_id', replyId)
    .maybeSingle();

  if (existingLog?.auto_replied === true) {
    logger.info('Threads reply already processed (dedup skip)', { replyId });
    await markJobSent(workspaceId, jobType, replyId);
    return NextResponse.json({ success: true, message: 'Already replied' });
  }

  // ── Self-reply guard ──
  if (params.replierId && params.replierId === threadsUserId) {
    logger.info('Threads outbound: skipping self-authored reply (infinite loop prevention)', { replyId, threadsUserId });
    await markJobSent(workspaceId, jobType, replyId);
    return NextResponse.json({ success: true, action: 'self_reply_skipped' });
  }

  // ── Load platform connection & decrypt token ──
  let connQuery = supabaseAdmin
    .from('platform_connections')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('platform', 'threads')
    .eq('status', 'connected');

  if (connectionId) connQuery = connQuery.eq('id', connectionId);

  const { data: connections } = await connQuery.limit(1);
  const connection = connections?.[0];

  if (!connection) {
    const errorMsg = 'No active Threads connection found for workspace';
    await markDeadLetter(workspaceId, jobType, replyId, errorMsg, params);
    return NextResponse.json({ error: errorMsg, deadLetter: true });
  }

  let accessToken: string;
  try {
    accessToken = await decryptToken(connection.access_token_encrypted);
  } catch (decErr) {
    const errorMsg = 'Failed to decrypt Threads access token';
    logger.error(errorMsg, { connectionId: connection.id, error: decErr });
    await markDeadLetter(workspaceId, jobType, replyId, errorMsg, params);
    return NextResponse.json({ error: errorMsg, deadLetter: true });
  }

  const groqApiKey =
    config.GROQ_API_KEY ||
    process.env.GROQ_API_KEY ||
    config.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY;
  if (!groqApiKey) {
    const errorMsg = 'GROQ_API_KEY not configured';
    await markDeadLetter(workspaceId, jobType, replyId, errorMsg, params);
    return NextResponse.json({ error: errorMsg, deadLetter: true });
  }

  const automation = new InstagramCommentAutomation(groqApiKey, config.AI_GROQ_MODEL || 'openai/gpt-oss-120b');

  let pendingClassified: { classification?: string; confidence?: number; reasoning?: string; suggestedReply?: string; shouldFlagForReview?: boolean } | null = null;
  let pendingFinalReply: string | null = null;

  try {
    if (!replyText) {
      logger.info('Threads reply event has no text — skipping', { replyId });
      await markJobSent(workspaceId, jobType, replyId);
      return NextResponse.json({ success: true, action: 'no_text' });
    }

    // Velocity throttle
    const canReply = await velocityThrottle.canReply(`threads:${workspaceId}`, cfg?.max_replies_per_hour || 30);
    if (!canReply) {
      const delaySeconds = velocityThrottle.getSecondsUntilNextHourBucket(30, 180);
      logger.info('Threads velocity limit reached — deferring', { workspaceId, replyId, delaySeconds });
      await supabaseAdmin.from('threads_outbound_jobs')
        .update({ status: 'queued', last_error: `deferred +${delaySeconds}s`, updated_at: new Date().toISOString() })
        .eq('workspace_id', workspaceId).eq('job_type', jobType).eq('target_id', replyId);
      if (queueService.isAvailable()) {
        await queueService.enqueueThreadsOutboundTask({ ...params, delaySeconds });
      }
      return NextResponse.json({ success: true, deferred: true, delaySeconds });
    }

    // AI classification
    const recentReplies = await lexicalEntropyGuard.getRecentReplies(`threads:${workspaceId}`, 15);
    const classified = await automation.classifyAndGenerateReply(
      {
        commentId: replyId,
        mediaId: params.postId || '',
        text: replyText,
        username: params.replierId || '',
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

    const autoHideSpam = cfg?.auto_hide_spam ?? cfg?.autoHideSpam ?? true;
    const flagNegative = cfg?.flag_negative ?? cfg?.flagNegative ?? true;
    const flagSpam = cfg?.flag_spam ?? cfg?.flagSpam ?? true;

    classified.shouldFlagForReview = resolveCommentReviewFlag(classified, {
      flagNegative,
      flagSpam,
    });

    // Spam → hide and skip (must run BEFORE !shouldAutoReply early return because spam always has shouldAutoReply=false)
    if (classified.classification === 'spam' && autoHideSpam) {
      try {
        await threadsAdapter.hideReply(accessToken, replyId, true);
        logger.info('Threads spam reply hidden', { replyId });
      } catch (hideErr) {
        logger.warn('Failed to hide Threads spam reply', { replyId, error: hideErr });
      }
      await upsertReplyLog(workspaceId, params, classified, null, false);
      await markJobSent(workspaceId, jobType, replyId);
      return NextResponse.json({ success: true, action: 'spam_hidden' });
    }

    if (!classified.shouldAutoReply || !classified.suggestedReply || classified.suggestedReply === 'SKIP') {
      logger.info('Threads AI: reply does not need auto-reply', { replyId, classification: classified.classification });
      await upsertReplyLog(workspaceId, params, classified, null, false);
      await markJobSent(workspaceId, jobType, replyId);
      return NextResponse.json({ success: true, action: 'skipped_by_policy' });
    }

    // Clamp to 500 chars (Threads hard limit) then sanitize
    let finalReply = clampThreadsText(classified.suggestedReply);
    finalReply = ContentGuard.sanitizeOutput(finalReply);
    finalReply = clampThreadsText(finalReply);
    pendingClassified = classified;
    pendingFinalReply = finalReply;

    if (lexicalEntropyGuard.isTooSimilar(finalReply, recentReplies)) {
      const errorMsg = 'Generated reply too similar to recent replies — flagged for review';
      await markDeadLetter(workspaceId, jobType, replyId, errorMsg, params);
      return NextResponse.json({ success: true, flagged: true });
    }

    // Post reply — reply to the inbound replyId (the comment/mention targeting us)
    await threadsAdapter.postReply(accessToken, replyId, finalReply);

    await markJobSent(workspaceId, jobType, replyId);
    await upsertReplyLog(workspaceId, params, classified, finalReply, true);
    await velocityThrottle.recordReply(`threads:${workspaceId}`);
    lexicalEntropyGuard.recordReply(`threads:${workspaceId}`, finalReply);

    logger.info('Threads reply sent', { replyId, eventType });
    return NextResponse.json({ success: true });
  } catch (jobErr) {
    const errorMsg = jobErr instanceof Error ? jobErr.message : String(jobErr);
    logger.error('Threads outbound job failed', { jobId, jobType, replyId, error: errorMsg });
    if (pendingClassified) {
      await upsertReplyLog(
        workspaceId,
        params,
        {
          ...pendingClassified,
          shouldFlagForReview: true,
          reasoning: `Reply delivery failed: ${errorMsg}`,
        },
        pendingFinalReply,
        false,
        'failed'
      );
    }
    if (currentRetry >= (existingJob?.max_retries || 3)) {
      await markDeadLetter(workspaceId, jobType, replyId, errorMsg, params);
    } else {
      await supabaseAdmin.from('threads_outbound_jobs')
        .update({ status: 'queued', last_error: errorMsg, updated_at: new Date().toISOString() })
        .eq('workspace_id', workspaceId).eq('job_type', jobType).eq('target_id', replyId);
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

async function markJobSent(workspaceId: string, jobType: string, targetId: string) {
  await supabaseAdmin.from('threads_outbound_jobs')
    .update({ status: 'sent', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('workspace_id', workspaceId).eq('job_type', jobType).eq('target_id', targetId);
}

async function markDeadLetter(
  workspaceId: string,
  jobType: string,
  targetId: string,
  reason: string,
  params: ThreadsOutboundJobParams
) {
  await supabaseAdmin.from('threads_outbound_jobs').upsert({
    workspace_id: workspaceId,
    job_type: jobType,
    target_id: targetId,
    status: 'needs_review',
    last_error: reason,
    payload: params as unknown as Record<string, unknown>,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'workspace_id,job_type,target_id' });
  logger.error('Threads outbound job dead-lettered', { workspaceId, jobType, targetId, reason });
}

async function upsertReplyLog(
  workspaceId: string,
  params: ThreadsOutboundJobParams,
  classified: { classification?: string; confidence?: number; reasoning?: string; suggestedReply?: string; shouldFlagForReview?: boolean },
  finalReply: string | null,
  autoReplied: boolean,
  deliveryStatusOverride?: 'sent' | 'skipped' | 'failed'
) {
  const now = new Date().toISOString();
  const corePayload = {
    workspace_id: workspaceId,
    threads_user_id: params.threadsUserId,
    reply_id: params.replyId,
    post_id: params.postId || null,
    replier_id: params.replierId || null,
    reply_text: params.replyText || null,
    event_type: params.eventType,
    classification: classified.classification || null,
    confidence: classified.confidence || null,
    suggested_reply: finalReply || classified.suggestedReply || null,
    reasoning: classified.reasoning || null,
    auto_replied: autoReplied,
    delivery_status: deliveryStatusOverride || (autoReplied ? 'sent' : 'skipped'),
    reply_sent_at: autoReplied ? now : null,
    created_at: now,
  };

  let { error } = await supabaseAdmin.from('threads_reply_logs').upsert(
    {
      ...corePayload,
      flagged_for_review: classified.shouldFlagForReview ?? false,
      updated_at: now,
    },
    { onConflict: 'reply_id' }
  );

  if (error && (error.code === 'PGRST204' || error.code === '42703' || error.message?.includes('column'))) {
    const retry = await supabaseAdmin
      .from('threads_reply_logs')
      .upsert(corePayload, { onConflict: 'reply_id' });
    error = retry.error;
  }

  if (error) {
    logger.error('Failed to upsert threads_reply_logs', {
      replyId: params.replyId,
      errorMessage: error.message || String(error),
    });
  }
}
