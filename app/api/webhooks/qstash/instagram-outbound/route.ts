import { NextRequest, NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { decryptToken } from '@/lib/crypto/encryption';
import { InstagramCommentAutomation } from '@/lib/services/InstagramCommentAutomation';
import { ContentHumanizer } from '@/lib/ai/engines/ContentHumanizer';
import { velocityThrottle } from '@/lib/services/automation/velocity';
import { lexicalEntropyGuard } from '@/lib/services/automation/lexical';
import type { InstagramOutboundJobParams } from '@/lib/services/QueueService';

export const maxDuration = 60;

function getReceiver(): Receiver | null {
  if (!config.QSTASH_CURRENT_SIGNING_KEY || !config.QSTASH_NEXT_SIGNING_KEY) {
    return null;
  }
  return new Receiver({
    currentSigningKey: config.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: config.QSTASH_NEXT_SIGNING_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    // ── Signature verification (skip if keys not configured, e.g. dev/test) ──
    const receiver = getReceiver();
    let body: InstagramOutboundJobParams;

    if (receiver) {
      const signature = request.headers.get('upstash-signature');
      if (!signature) {
        logger.warn('QStash instagram-outbound: missing signature header');
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }
      const rawBody = await request.text();
      const configuredUrl = `${config.NEXT_PUBLIC_APP_URL}/api/webhooks/qstash/instagram-outbound`;
      let isValid = false;
      try {
        isValid = await receiver.verify({
          signature,
          body: rawBody,
          url: configuredUrl,
          clockTolerance: 300,
        });
      } catch {
        isValid = false;
      }

      if (!isValid && request.url && request.url !== configuredUrl) {
        try {
          isValid = await receiver.verify({
            signature,
            body: rawBody,
            url: request.url,
            clockTolerance: 300,
          });
        } catch {
          isValid = false;
        }
      }

      if (!isValid) {
        logger.warn('QStash instagram-outbound: invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      body = JSON.parse(rawBody);
    } else {
      body = await request.json();
    }

    return await handleJob(body);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('QStash instagram-outbound handler error', { error: err });
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

async function handleJob(params: InstagramOutboundJobParams) {
  const { jobId, jobType, workspaceId, connectionId, commentId, mediaId, commentText, commenterUsername, messageId, senderId, dmText } = params;
  const targetId = commentId || messageId;

  if (!workspaceId || !jobType || !targetId) {
    logger.error('Invalid QStash payload: missing required fields', { params });
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  // ── Idempotency Check: query job state ──
  const { data: existingJob } = await supabaseAdmin
    .from('instagram_outbound_jobs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('job_type', jobType)
    .eq('target_id', targetId)
    .maybeSingle();

  if (existingJob?.status === 'sent') {
    logger.info('QStash outbound worker: job already sent (idempotent skip)', { jobId, targetId });
    return NextResponse.json({ success: true, message: 'Already sent' }, { status: 200 });
  }

  // Update status to processing and increment retry_count
  const currentRetry = (existingJob?.retry_count || 0) + 1;
  const maxRetries = existingJob?.max_retries || 3;

  await supabaseAdmin
    .from('instagram_outbound_jobs')
    .upsert({
      workspace_id: workspaceId,
      job_type: jobType,
      target_id: targetId,
      status: 'processing',
      retry_count: currentRetry,
      max_retries: maxRetries,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,job_type,target_id' });

  // ── Resolve Platform Connection & Decrypt Token ──
  let connQuery = supabaseAdmin
    .from('platform_connections')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('platform', 'instagram')
    .eq('status', 'connected');

  if (connectionId) {
    connQuery = connQuery.eq('id', connectionId);
  }

  const { data: connections } = await connQuery.limit(1);
  const connection = connections?.[0];

  if (!connection) {
    const errorMsg = 'No active connected Instagram connection found for workspace';
    logger.error(errorMsg, { workspaceId, connectionId });
    await markDeadLetter(workspaceId, jobType, targetId, errorMsg, params);
    return NextResponse.json({ error: errorMsg, deadLetter: true }, { status: 200 });
  }

  let accessToken: string;
  try {
    accessToken = await decryptToken(connection.access_token_encrypted);
  } catch (decErr) {
    const errorMsg = 'Failed to decrypt access token for connection';
    logger.error(errorMsg, { connectionId: connection.id, error: decErr });
    await markDeadLetter(workspaceId, jobType, targetId, errorMsg, params);
    return NextResponse.json({ error: errorMsg, deadLetter: true }, { status: 200 });
  }

  const groqApiKey = config.GROQ_API_KEY || process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    const errorMsg = 'GROQ_API_KEY not configured';
    logger.error(errorMsg);
    await markDeadLetter(workspaceId, jobType, targetId, errorMsg, params);
    return NextResponse.json({ error: errorMsg, deadLetter: true }, { status: 200 });
  }

  const automation = new InstagramCommentAutomation(groqApiKey);

  // ── Execute Outbound Job by Type ──
  try {
    if (jobType === 'comment_reply') {
      if (!commentId || !commentText) {
        throw new Error('Missing commentId or commentText for comment_reply');
      }

      // Check if comment was already replied in logs
      const { data: commentLogs } = await supabaseAdmin
        .from('instagram_comment_logs')
        .select('auto_replied')
        .eq('comment_id', commentId)
        .limit(1);

      if (commentLogs?.[0]?.auto_replied === true) {
        logger.info('Comment already replied in comment_logs (skip)', { commentId });
        await markJobSent(workspaceId, jobType, targetId);
        return NextResponse.json({ success: true, message: 'Already replied' }, { status: 200 });
      }

      // Load config & check rate limit
      const { data: cfg } = await supabaseAdmin
        .from('instagram_automation_config')
        .select('*')
        .eq('workspace_id', workspaceId)
        .single();

      const canReply = await velocityThrottle.canReply(workspaceId, cfg?.max_replies_per_hour || 30);
      if (!canReply) {
        const errorMsg = 'Velocity limit reached for comments — deferred';
        logger.warn(errorMsg, { workspaceId, commentId });
        await markDeadLetter(workspaceId, jobType, targetId, errorMsg, params);
        return NextResponse.json({ error: errorMsg, deferred: true }, { status: 200 });
      }

      // Generate AI response
      const recentReplies = await lexicalEntropyGuard.getRecentReplies(workspaceId, 15);
      const classified = await automation.classifyAndGenerateReply(
        {
          commentId,
          mediaId: mediaId || '',
          text: commentText,
          username: commenterUsername || '',
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
          jitterMinSeconds: cfg?.jitter_min_seconds ?? 25,
          jitterMaxSeconds: cfg?.jitter_max_seconds ?? 120,
          threadChainingEnabled: cfg?.thread_chaining_enabled ?? true,
        },
        recentReplies
      );

      if (!classified.shouldAutoReply || !classified.suggestedReply || classified.suggestedReply === 'SKIP') {
        logger.info('AI classified comment as not needing auto-reply', { commentId, classification: classified.classification });
        if (classified.shouldFlagForReview) {
          await flagCommentForDeadLetter(workspaceId, params, classified.reasoning, classified.suggestedReply);
        }
        await supabaseAdmin
          .from('instagram_comment_logs')
          .update({
            classification: classified.classification,
            confidence: classified.confidence,
            delivery_status: classified.shouldFlagForReview ? 'needs_review' : 'sent',
            flagged_for_review: classified.shouldFlagForReview,
            suggested_reply: classified.suggestedReply || '',
            reasoning: classified.reasoning,
          })
          .eq('comment_id', commentId);
        await markJobSent(workspaceId, jobType, targetId);
        return NextResponse.json({ success: true, action: 'skipped_by_policy' }, { status: 200 });
      }

      // Humanize & Anti-duplication check
      let finalReply = classified.suggestedReply;
      try {
        const humanized = ContentHumanizer.humanize(finalReply, 'instagram');
        finalReply = humanized.humanized || finalReply;
      } catch {
        // use raw
      }

      if (lexicalEntropyGuard.isTooSimilar(finalReply, recentReplies)) {
        const errorMsg = 'Generated reply too similar to recent replies — flagged for review';
        await flagCommentForDeadLetter(workspaceId, params, errorMsg, finalReply);
        await markDeadLetter(workspaceId, jobType, targetId, errorMsg, params);
        return NextResponse.json({ success: true, flagged: true }, { status: 200 });
      }

      // Post public reply via Graph API (threaded under specific comment)
      const replyResult = await automation.postPublicReply(
        accessToken,
        mediaId || '',
        commentId,
        finalReply,
        commenterUsername
      );

      if (!replyResult) {
        throw new Error('Meta API rejected comment reply or returned null');
      }

      // CONFIRMED SUCCESS: Update all tables
      await markJobSent(workspaceId, jobType, targetId);

      let didSendDm = false;
      let sentDmText = '';
      if (classified.shouldSendDM && classified.suggestedDM) {
        try {
          const brandHandle = connection.username ? `@${connection.username}` : 'our profile';
          const dmTextToSend = cfg?.require_follow_for_dm
            ? `Hey ${commenterUsername ? `@${commenterUsername}` : 'there'}! 👋 Make sure to follow ${brandHandle} and reply "link" here to unlock your access! 🚀`
            : classified.suggestedDM;
          const dmRes = await automation.sendDmForComment(
            accessToken,
            connection.platform_user_id,
            commentId,
            undefined,
            dmTextToSend
          );
          if (dmRes) {
            didSendDm = true;
            sentDmText = dmTextToSend;
            logger.info('Comment-triggered private reply sent via outbound worker', { commentId, msgId: dmRes.messageId });
          }
        } catch (dmErr) {
          logger.warn('Failed to send comment-triggered private reply', { commentId, error: dmErr });
        }
      }

      await supabaseAdmin
        .from('instagram_comment_logs')
        .update({
          classification: classified.classification,
          confidence: classified.confidence,
          auto_replied: true,
          delivery_status: 'sent',
          reply_sent_at: new Date().toISOString(),
          suggested_reply: finalReply,
          reasoning: classified.reasoning,
          dm_sent: didSendDm,
          dm_message: didSendDm ? sentDmText : null,
        })
        .eq('comment_id', commentId);

      await velocityThrottle.recordReply(workspaceId);
      lexicalEntropyGuard.recordReply(workspaceId, finalReply);

      logger.info('QStash outbound worker: comment reply confirmed sent', { commentId, replyId: replyResult.replyId });
      return NextResponse.json({ success: true, replyId: replyResult.replyId }, { status: 200 });
    }

    if (jobType === 'dm_reply') {
      if (!messageId || !senderId || !dmText) {
        throw new Error('Missing messageId, senderId, or dmText for dm_reply');
      }

      // Check if DM was already replied in logs
      const { data: dmLogs } = await supabaseAdmin
        .from('instagram_dm_logs')
        .select('auto_replied')
        .eq('message_id', messageId)
        .limit(1);

      if (dmLogs?.[0]?.auto_replied === true) {
        logger.info('DM already replied in dm_logs (skip)', { messageId });
        await markJobSent(workspaceId, jobType, targetId);
        return NextResponse.json({ success: true, message: 'Already replied' }, { status: 200 });
      }

      // Load config & check rate limit
      const { data: cfg } = await supabaseAdmin
        .from('instagram_automation_config')
        .select('*')
        .eq('workspace_id', workspaceId)
        .single();

      const canReply = await velocityThrottle.canReply(`dm:${workspaceId}`, cfg?.dm_max_replies_per_hour || 20);
      if (!canReply) {
        const errorMsg = 'Velocity limit reached for DMs — deferred';
        logger.warn(errorMsg, { workspaceId, messageId });
        await markDeadLetter(workspaceId, jobType, targetId, errorMsg, params);
        return NextResponse.json({ error: errorMsg, deferred: true }, { status: 200 });
      }

      // Multi-turn conversation history
      const { data: previousLogs } = await supabaseAdmin
        .from('instagram_dm_logs')
        .select('message_text, ai_reply, created_at')
        .eq('workspace_id', workspaceId)
        .eq('sender_id', senderId)
        .order('created_at', { ascending: true })
        .limit(30);

      // Count prior AI turns for ceiling check (prevents endless DM loops)
      const priorTurnCount = (previousLogs || []).filter(l => l.ai_reply && l.ai_reply !== 'SKIP').length;
      const DM_TURN_LIMIT = 15;
      if (priorTurnCount >= DM_TURN_LIMIT) {
        logger.info('QStash outbound worker: DM conversation turn limit reached — skipping reply', {
          workspaceId,
          senderId,
          priorTurnCount,
        });
        await markJobSent(workspaceId, jobType, targetId);
        return NextResponse.json(
          { success: true, skipped: true, reason: 'turn_limit_reached', priorTurnCount },
          { status: 200 }
        );
      }

      const conversationHistory = (previousLogs || [])
        .filter(l => l.message_text)
        .map(l => ({ role: 'user' as const, text: l.message_text }));

      // ── Follow-to-Unlock Gate Enforcement ──────────────────────────────────
      if (cfg?.require_follow_for_dm) {
        const followGateResult = await automation.processDmFollowGate({
          dmEvent: {
            messageId,
            senderId,
            senderUsername: params.senderUsername,
            text: dmText,
            timestamp: new Date().toISOString(),
          },
          config: {
            enabled: cfg?.enabled ?? true,
            autoReplyPositive: cfg?.auto_reply_positive ?? true,
            autoReplyQuestions: cfg?.auto_reply_questions ?? true,
            autoReplyLinkRequests: cfg?.auto_reply_link_requests ?? true,
            autoReplyPurchaseIntent: cfg?.auto_reply_purchase_intent ?? true,
            flagNegative: cfg?.flag_negative ?? true,
            flagSpam: cfg?.flag_spam ?? true,
            requireFollowForDm: true,
            followAskMessage: cfg?.follow_ask_message || undefined,
            followVerifiedMessage: cfg?.follow_verified_message || undefined,
            linkUrl: cfg?.link_url || undefined,
          },
          accessToken,
          igUserId: connection.platform_user_id,
          brandUsername: connection.username || 'creator',
          previousLogs: previousLogs || [],
        });

        if (followGateResult.handled) {
          await markJobSent(workspaceId, jobType, targetId);
          await supabaseAdmin
            .from('instagram_dm_logs')
            .update({
              classification: followGateResult.action === 'follow_confirmed' ? 'positive' : 'question',
              confidence: 1.0,
              auto_replied: true,
              delivery_status: 'sent',
              reply_sent_at: new Date().toISOString(),
              ai_reply: followGateResult.replyText,
              reasoning: `Follow gate ${followGateResult.action}: isFollowing=${followGateResult.isFollowing}`,
              follow_verified: followGateResult.isFollowing,
              follow_status: followGateResult.isFollowing ? 'following' : 'not_following',
            })
            .eq('message_id', messageId);

          await velocityThrottle.recordReply(`dm:${workspaceId}`);
          logger.info('QStash outbound worker: follow gate handled DM', {
            messageId,
            action: followGateResult.action,
            isFollowing: followGateResult.isFollowing,
          });
          return NextResponse.json({ success: true, followGateAction: followGateResult.action }, { status: 200 });
        }
      }

      const classified = await automation.classifyAndReplyDM(
        {
          messageId,
          senderId,
          senderUsername: params.senderUsername,
          text: dmText,
          timestamp: new Date().toISOString(),
        },
        {
          enabled: cfg?.enabled ?? true,
          autoReplyPositive: cfg?.auto_reply_positive ?? true,
          autoReplyQuestions: cfg?.auto_reply_questions ?? true,
          autoReplyLinkRequests: cfg?.auto_reply_link_requests ?? true,
          autoReplyPurchaseIntent: cfg?.auto_reply_purchase_intent ?? true,
          flagNegative: cfg?.flag_negative ?? true,
          flagSpam: cfg?.flag_spam ?? true,
          maxRepliesPerHour: cfg?.max_replies_per_hour ?? 30,
          jitterMinSeconds: 2,
          jitterMaxSeconds: 4,
          threadChainingEnabled: true,
          dmAutoReplyEnabled: cfg?.dm_auto_reply_enabled ?? true,
          dmTemplate: cfg?.dm_template || undefined,
          dmWelcomeMessage: cfg?.dm_welcome_message || undefined,
          dmKnowledgeBase: cfg?.dm_knowledge_base || undefined,
          dmEscalationEnabled: cfg?.dm_escalation_enabled ?? true,
          dmMaxRepliesPerHour: cfg?.dm_max_replies_per_hour ?? 20,
          requireFollowForDm: cfg?.require_follow_for_dm ?? false,
          followAskMessage: cfg?.follow_ask_message || undefined,
          followVerifiedMessage: cfg?.follow_verified_message || undefined,
        },
        conversationHistory,
        conversationHistory.length + 1,
        connection.username ? `@${connection.username}` : 'our product',
        true
      );

      if (!classified.shouldAutoReply || !classified.suggestedReply || classified.suggestedReply === 'SKIP') {
        logger.info('AI classified DM as not needing auto-reply', { messageId, classification: classified.classification });
        if (classified.shouldEscalate) {
          await flagDmForDeadLetter(workspaceId, params, classified.reasoning, classified.suggestedReply);
        }
        await supabaseAdmin
          .from('instagram_dm_logs')
          .update({
            classification: classified.classification,
            confidence: classified.confidence,
            delivery_status: classified.shouldEscalate ? 'needs_review' : 'sent',
            escalated: classified.shouldEscalate,
            ai_reply: classified.suggestedReply || '',
            reasoning: classified.reasoning,
          })
          .eq('message_id', messageId);
        await markJobSent(workspaceId, jobType, targetId);
        return NextResponse.json({ success: true, action: 'skipped_by_policy' }, { status: 200 });
      }

      let finalReply = classified.suggestedReply;
      try {
        const humanized = ContentHumanizer.humanize(finalReply, 'instagram');
        finalReply = humanized.humanized || finalReply;
      } catch {
        // use raw
      }

      // Send private message via Graph API
      const sendRes = await automation.sendPrivateMessage(
        accessToken,
        connection.platform_user_id,
        senderId,
        finalReply
      );

      if (!sendRes) {
        throw new Error('Meta API rejected DM send or returned null');
      }

      // CONFIRMED SUCCESS: Update all tables
      await markJobSent(workspaceId, jobType, targetId);
      await supabaseAdmin
        .from('instagram_dm_logs')
        .update({
          classification: classified.classification,
          confidence: classified.confidence,
          auto_replied: true,
          delivery_status: 'sent',
          reply_sent_at: new Date().toISOString(),
          ai_reply: finalReply,
          reasoning: classified.reasoning,
        })
        .eq('message_id', messageId);

      await velocityThrottle.recordReply(`dm:${workspaceId}`);
      logger.info('QStash outbound worker: DM confirmed sent', { messageId, sentMsgId: sendRes.messageId });
      return NextResponse.json({ success: true, messageId: sendRes.messageId }, { status: 200 });
    }

    return NextResponse.json({ error: `Unknown jobType: ${jobType}` }, { status: 400 });
  } catch (sendError) {
    const err = sendError instanceof Error ? sendError : new Error(String(sendError));
    logger.error('QStash outbound worker send failure', {
      jobType,
      targetId,
      retry: currentRetry,
      error: err.message,
    });

    // Check if error is permanent or retries exhausted
    const isPermanent = isPermanentMetaError(err.message);
    if (isPermanent || currentRetry >= maxRetries) {
      const errorMsg = `Outbound dispatch failed permanently (${err.message}) after ${currentRetry} attempts`;
      await markDeadLetter(workspaceId, jobType, targetId, errorMsg, params);
      if (jobType === 'comment_reply') {
        await flagCommentForDeadLetter(workspaceId, params, errorMsg);
      } else {
        await flagDmForDeadLetter(workspaceId, params, errorMsg);
      }
      // Return 200 to QStash so it stops retrying dead-lettered job
      return NextResponse.json({ success: false, deadLetter: true, error: errorMsg }, { status: 200 });
    }

    // Retryable failure — return 500 so QStash retries with exponential backoff
    await supabaseAdmin
      .from('instagram_outbound_jobs')
      .update({
        status: 'queued',
        last_error: err.message,
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId)
      .eq('job_type', jobType)
      .eq('target_id', targetId);

    return NextResponse.json({ error: err.message, retryable: true }, { status: 500 });
  }
}

function isPermanentMetaError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes('token') ||
    lower.includes('expired') ||
    lower.includes('permission') ||
    lower.includes('window') ||
    lower.includes('policy') ||
    lower.includes('invalid recipient') ||
    lower.includes('user not found') ||
    lower.includes('190') || // OAuthException
    lower.includes('200') || // Permissions error
    lower.includes('10')     // Application does not have permission
  );
}

async function markJobSent(workspaceId: string, jobType: string, targetId: string) {
  await supabaseAdmin
    .from('instagram_outbound_jobs')
    .update({
      status: 'sent',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('workspace_id', workspaceId)
    .eq('job_type', jobType)
    .eq('target_id', targetId);
}

async function markDeadLetter(
  workspaceId: string,
  jobType: string,
  targetId: string,
  lastError: string,
  _params: InstagramOutboundJobParams
) {
  await supabaseAdmin
    .from('instagram_outbound_jobs')
    .update({
      status: 'needs_review',
      last_error: lastError,
      updated_at: new Date().toISOString(),
    })
    .eq('workspace_id', workspaceId)
    .eq('job_type', jobType)
    .eq('target_id', targetId);

  // Update underlying logs table to needs_review/failed
  if (jobType === 'comment_reply') {
    await supabaseAdmin
      .from('instagram_comment_logs')
      .update({
        delivery_status: 'needs_review',
        flagged_for_review: true,
        last_error: lastError,
      })
      .eq('comment_id', targetId);
  } else {
    await supabaseAdmin
      .from('instagram_dm_logs')
      .update({
        delivery_status: 'needs_review',
        escalated: true,
        last_error: lastError,
      })
      .eq('message_id', targetId);
  }
}

async function flagCommentForDeadLetter(
  workspaceId: string,
  params: InstagramOutboundJobParams,
  reasoning: string,
  suggestedReply?: string
) {
  if (!params.commentId) return;
  try {
    await supabaseAdmin.from('instagram_flagged_comments').upsert({
      workspace_id: workspaceId,
      comment_id: params.commentId,
      media_id: params.mediaId || '',
      comment_text: params.commentText || '',
      commenter_username: params.commenterUsername || '',
      classification: 'question',
      suggested_reply: suggestedReply || '',
      reasoning,
      status: 'pending',
      priority: 'high',
      lead_score: 1,
    }, { onConflict: 'comment_id', ignoreDuplicates: false });
  } catch (err) {
    logger.warn('Failed to insert dead-letter comment into flagged_comments', { error: err });
  }
}

async function flagDmForDeadLetter(
  workspaceId: string,
  params: InstagramOutboundJobParams,
  reasoning: string,
  suggestedReply?: string
) {
  if (!params.messageId || !params.senderId) return;
  try {
    await supabaseAdmin.from('instagram_flagged_dms').upsert({
      workspace_id: workspaceId,
      message_id: params.messageId,
      sender_id: params.senderId,
      sender_username: params.senderUsername || '',
      message_text: params.dmText || '',
      classification: 'question',
      ai_suggested_reply: suggestedReply || null,
      lead_score: 1,
      reasoning,
      status: 'pending',
    }, { onConflict: 'workspace_id,message_id', ignoreDuplicates: false });
  } catch (err) {
    logger.warn('Failed to insert dead-letter DM into flagged_dms', { error: err });
  }
}
