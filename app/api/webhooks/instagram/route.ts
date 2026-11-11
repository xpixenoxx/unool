import { NextRequest, NextResponse } from 'next/server';
import { API_VERSIONS } from '@/lib/platforms/apiVersions';
import { logger } from '@/lib/logger';
import { verifyMetaSignature } from '@/lib/webhooks/verify';
import { config } from '@/lib/config/schema';
import { decryptToken } from '@/lib/crypto/encryption';
import { isAutomationEnabledServer } from '@/lib/feature-flags-server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import {
  InstagramCommentAutomation,
  DEFAULT_AUTOMATION_CONFIG,
  type CommentEvent,
  type DmEvent,
  type AutomationConfig,
  type ClassifiedComment,
  type ConversationMessage,
} from '@/lib/services/InstagramCommentAutomation';
import { ContentGuard } from '@/lib/ai/ContentGuard';
import { ContentHumanizer } from '@/lib/ai/engines/ContentHumanizer';
import { humanizedSleep } from '@/lib/services/automation/jitter';
import { velocityThrottle } from '@/lib/services/automation/velocity';
import { lexicalEntropyGuard } from '@/lib/services/automation/lexical';
import { handleFollowWebhookEvent } from '@/lib/follow-gate/service';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { resolveInstagramConnection } from '@/lib/platforms/instagram/identityResolver';
import { queueService } from '@/lib/services/QueueService';
import { resolveCreatorDeliveryLink } from '@/lib/services/automation/linkResolver';




// ─── GET: Meta Webhook Verification ─────────────────────────────────────────

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');

  const verifyToken = config.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
  if (!verifyToken) {
    logger.error('INSTAGRAM_WEBHOOK_VERIFY_TOKEN not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }
  if (mode === 'subscribe' && token === verifyToken) {
    logger.info('Instagram webhook verified successfully');
    return new NextResponse(challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }
  logger.warn('Instagram webhook verification failed', { mode, tokenProvided: !!token });
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// ─── POST: Receive Instagram Webhook Events ──────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Verify the signature from Meta
    const signature = request.headers.get('x-hub-signature-256') || request.headers.get('x-hub-signature');

    // Try all possible webhook secrets (Instagram client secret, webhook secrets, Meta app secret)
    const secretsToTry = [
      config.INSTAGRAM_WEBHOOK_SECRET,
      config.INSTAGRAM_CLIENT_SECRET,
      config.FACEBOOK_WEBHOOK_SECRET,
      config.META_WEBHOOK_SECRET,
      process.env.INSTAGRAM_WEBHOOK_SECRET,
      process.env.INSTAGRAM_CLIENT_SECRET,
      process.env.FACEBOOK_WEBHOOK_SECRET,
      process.env.META_WEBHOOK_SECRET,
      process.env.META_APP_SECRET,
    ].filter(Boolean) as string[];

    let isValid = false;
    if (signature && secretsToTry.length > 0) {
      for (const secret of secretsToTry) {
        if (await verifyMetaSignature(body, signature, secret)) {
          isValid = true;
          break;
        }
      }
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(body);
    } catch {
      logger.warn('Instagram webhook: invalid JSON');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    if (!isValid) {
      logger.warn('Instagram webhook: HMAC signature verification failed — rejecting', {
        hasSignature: !!signature,
        secretsTriedCount: secretsToTry.length,
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    if (payload.object !== 'instagram' && payload.object !== 'page') {
      logger.debug('Instagram webhook: unhandled object type', { object: payload.object });
      return NextResponse.json({ received: true });
    }

    const entries = payload.entry as Array<Record<string, unknown>> | undefined;
    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json({ received: true });
    }

    const tasks: Promise<void>[] = [];

    // Process each entry
    for (const entry of entries) {
      const igUserId = entry.id as string;
      const changes = entry.changes as Array<Record<string, unknown>> | undefined;
      const messaging = entry.messaging as Array<Record<string, unknown>> | undefined;

      // Handle comment events (both 'comments' field and 'feed' comments)
      if (changes && Array.isArray(changes)) {
        for (const change of changes) {
          if (change.field === 'comments') {
            const value = change.value as Record<string, unknown>;
            if (value) {
              tasks.push(
                processCommentEvent(igUserId, value).catch((err) => {
                  logger.error('Error processing Instagram comment event', {
                    igUserId,
                    error: err instanceof Error ? err : new Error(String(err)),
                  });
                })
              );
            }
          } else if (change.field === 'feed') {
            const value = change.value as Record<string, unknown>;
            if (value && (value.item === 'comment' || value.verb === 'add')) {
              tasks.push(
                processCommentEvent(igUserId, {
                  id: value.comment_id || value.id,
                  text: value.message || value.text,
                  from: { id: (value.from as any)?.id, username: (value.from as any)?.name || (value.from as any)?.username },
                  media: { id: value.post_id || value.media_id },
                  created_time: value.created_time,
                  parent_id: value.parent_id,
                }).catch((err) => {
                  logger.error('Error processing Instagram feed comment event', {
                    igUserId,
                    error: err instanceof Error ? err : new Error(String(err)),
                  });
                })
              );
            }
          } else if (change.field === 'follow' || change.field === 'follows') {
            // ── Follow-Gate: real-time follow detection ───────────────────────
            // Meta sends this when someone follows the creator's IG account.
            // field: "follow", value: { follower_id, follower_username }
            const value = change.value as Record<string, unknown>;
            if (value) {
              const followerIgUserId = (value.follower_id || value.from_id || (value.from as any)?.id) as string;
              const followerIgUsername = (value.follower_username || value.username || (value.from as any)?.username || '') as string;
              if (followerIgUserId) {
                tasks.push(
                  handleFollowWebhookEvent(igUserId, followerIgUserId, followerIgUsername).catch((err) => {
                    logger.error('Error processing Instagram follow event for FollowGate', {
                      igUserId,
                      followerIgUserId,
                      error: err instanceof Error ? err : new Error(String(err)),
                    });
                  })
                );
              }
            }
          }
        }
      }

      // Handle inbound DM events (messages field)
      if (messaging && Array.isArray(messaging)) {
        for (const msg of messaging) {
          tasks.push(
            processDmEvent(igUserId, msg).catch((err) => {
              logger.error('Error processing Instagram DM event', {
                igUserId,
                error: err instanceof Error ? err : new Error(String(err)),
              });
            })
          );
        }
      }
    }

    // Await all tasks to finish completely so Vercel never freezes before execution completes
    if (tasks.length > 0) {
      await Promise.allSettled(tasks);
    }

    // Return 200 to Meta
    return NextResponse.json({ received: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Instagram webhook processing error', { error: err });
    return NextResponse.json({ received: true });
  }
}

// ─── Connection & Token Helpers ──────────────────────────────────────────────



async function getOrRefreshAccessToken(connection: any): Promise<string | null> {
  let accessToken: string;
  try {
    accessToken = await decryptToken(connection.access_token_encrypted);
  } catch (error) {
    logger.error('Failed to decrypt Instagram access token', { connectionId: connection.id });
    return null;
  }

  // Proactive token refresh if token expires within 7 days
  const expiresAt = connection.expires_at ? new Date(connection.expires_at) : null;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  if (expiresAt && expiresAt.getTime() - Date.now() < sevenDaysMs) {
    try {
      const { InstagramAdapter } = await import('@/lib/platforms/InstagramAdapter');
      const { encryptToken } = await import('@/lib/crypto/encryption');
      const adapter = new InstagramAdapter();
      const refreshed = await adapter.refreshAccessToken(accessToken);
      accessToken = refreshed.accessToken;
      const newExpiresAt = refreshed.expiresIn
        ? new Date(Date.now() + refreshed.expiresIn * 1000)
        : null;
      await supabaseAdmin
        .from('platform_connections')
        .update({
          access_token_encrypted: await encryptToken(refreshed.accessToken),
          refresh_token_encrypted: await encryptToken(refreshed.accessToken),
          expires_at: newExpiresAt?.toISOString() ?? null,
          status: 'connected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id);
      logger.info('Instagram token refreshed proactively', { connectionId: connection.id });
    } catch (refreshErr) {
      const err = refreshErr instanceof Error ? refreshErr : new Error(String(refreshErr));
      logger.warn('Instagram token refresh failed — continuing with existing token', { connectionId: connection.id, error: err.message });
      if (expiresAt && expiresAt.getTime() < Date.now()) {
        await supabaseAdmin
          .from('platform_connections')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', connection.id);
        logger.error('Instagram token expired and refresh failed — connection marked expired', { connectionId: connection.id });
        return null;
      }
    }
  }

  return accessToken;
}

// ─── Comment Processing Logic ─────────────────────────────────────────────────

async function processCommentEvent(igUserId: string, value: Record<string, unknown>): Promise<void> {
  const commentEvent: CommentEvent = {
    commentId: (value.id || value.comment_id) as string,
    mediaId: ((value.media as any)?.id || value.media_id || value.post_id || '') as string,
    text: (value.text || value.message || '') as string,
    username: ((value.from as any)?.username || (value.from as any)?.name || value.username || '') as string,
    timestamp: (value.created_time || value.timestamp) as string || new Date().toISOString(),
    parentId: (value.parent_id || (value as any).parentId) as string || undefined,
  };

  // Note: Self-reply guard below prevents loops when the brand account replies.
  // Replies from external commenters are permitted so threaded interactions are processed.

  if (!commentEvent.text || !commentEvent.commentId) {
    logger.debug('Skipping empty comment event', { value });
    return;
  }

  // ── Deduplication guard: skip if this comment was already SUCCESSFULLY replied ──
  // We skip if auto_replied=true (success) to prevent duplicate replies.
  // We do NOT skip if auto_replied=false — that means a previous attempt failed and
  // this re-delivery is an opportunity to retry the outbound operation.
  const { data: existing } = await supabaseAdmin
    .from('instagram_comment_logs')
    .select('id, auto_replied')
    .eq('comment_id', commentEvent.commentId)
    .limit(1);
  if (existing && existing.length > 0) {
    if (existing[0].auto_replied === true) {
      logger.debug('Skipping already-replied comment (idempotency guard)', { commentId: commentEvent.commentId });
      return;
    }
    // auto_replied=false means prior attempt failed — allow processing to retry the send.
    logger.debug('Re-processing previously failed comment for retry', { commentId: commentEvent.commentId });
  }

  // Find the platform connection with multi-tenant isolation
  const connection = await resolveInstagramConnection(igUserId, {
    mediaId: commentEvent.mediaId,
    commentId: commentEvent.commentId,
  });

  if (!connection) {
    logger.warn('No active Instagram connection found for webhook — dropping event', {
      igUserId,
      commentId: commentEvent.commentId,
      mediaId: commentEvent.mediaId,
    });
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
      connection.workspace_id,
      commentEvent,
      { classification: 'harmful', suggestedReply: 'SKIP', reasoning: guardResult.violation.internal || guardResult.violation.message },
      0
    );
    return;
  }

  // Self-reply guard: never reply to comments made by the brand's own account!
  // Guard 1: username string match (case-insensitive)
  // Guard 2: numeric IG user ID match — catches cross-workspace loops and casing mismatches
  const commenterFromId = (value.from as any)?.id as string | undefined;
  const isSelfByUsername = connection?.username && commentEvent.username &&
    commentEvent.username.toLowerCase().trim() === connection.username.toLowerCase().trim();
  const isSelfByNumericId = commenterFromId && connection?.platform_user_id &&
    commenterFromId === connection.platform_user_id;
  if (isSelfByUsername || isSelfByNumericId) {
    logger.debug('Skipping comment made by the account itself (self-reply guard)', {
      username: commentEvent.username,
      commenterFromId,
      connectionPlatformUserId: connection?.platform_user_id,
      commentId: commentEvent.commentId,
    });
    return;
  }

  // ── Per-commenter flood protection ─────────────────────────────────────────────
  // If a single user sends >5 comments in the last 60 minutes, flag without replying.
  // Protects rate limits from troll floods and prevents unintended reply storms.
  if (commentEvent.username && connection.workspace_id) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCommentCount } = await supabaseAdmin
      .from('instagram_comment_logs')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', connection.workspace_id)
      .eq('commenter_username', commentEvent.username)
      .gte('created_at', oneHourAgo);

    const COMMENTER_HOURLY_CAP = 5;
    if ((recentCommentCount ?? 0) >= COMMENTER_HOURLY_CAP) {
      logger.info('Per-commenter rate limit reached — flagging without replying', {
        username: commentEvent.username,
        recentCommentCount,
        workspaceId: connection.workspace_id,
      });
      await flagCommentForReview(
        connection.workspace_id,
        commentEvent,
        {
          classification: 'spam',
          suggestedReply: 'SKIP',
          reasoning: `Commenter @${commentEvent.username} exceeded ${COMMENTER_HOURLY_CAP} comments/hour — flagged for human review`,
        },
        0
      );
      return;
    }
  }

  const groqApiKey = config.GROQ_API_KEY || process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    logger.warn('GROQ_API_KEY not configured, logging comment without AI reply');
    await logCommentEvent(connection.workspace_id, commentEvent, {
      classification: 'unrelated',
      confidence: 0,
      suggestedReply: '',
      suggestedDM: null,
      threadHook: null,
      leadScore: 0,
      shouldAutoReply: false,
      shouldSendDM: false,
      shouldFlagForReview: true,
      reasoning: 'GROQ_API_KEY not configured in environment variables',
    });
    return;
  }

  const accessToken = await getOrRefreshAccessToken(connection);
  if (!accessToken) {
    await logCommentEvent(connection.workspace_id, commentEvent, {
      classification: 'unrelated',
      confidence: 0,
      suggestedReply: '',
      suggestedDM: null,
      threadHook: null,
      leadScore: 0,
      shouldAutoReply: false,
      shouldSendDM: false,
      shouldFlagForReview: true,
      reasoning: 'Failed to decrypt or refresh access token',
    });
    return;
  }

  const automationConfig = await loadAutomationConfig(connection.workspace_id, {
    brandUsername: connection.username,
    mediaId: commentEvent.mediaId,
  });

  if (!automationConfig.enabled) {
    logger.debug('Instagram comment automation disabled for workspace', { workspaceId: connection.workspace_id });
    await logCommentEvent(connection.workspace_id, commentEvent, {
      classification: 'unrelated',
      confidence: 0,
      suggestedReply: '',
      suggestedDM: null,
      threadHook: null,
      leadScore: 0,
      shouldAutoReply: false,
      shouldSendDM: false,
      shouldFlagForReview: false,
      reasoning: 'Automation disabled in SignalDM settings',
    });
    return;
  }

  // ── Phase 4: Durable Outbound Queue Dispatch via QStash ──────────────────
  if (queueService.isAvailable()) {
    try {
      const jobId = `job_cmt_${commentEvent.commentId}`;
      await supabaseAdmin.from('instagram_outbound_jobs').upsert({
        workspace_id: connection.workspace_id,
        connection_id: connection.id,
        job_type: 'comment_reply',
        target_id: commentEvent.commentId,
        payload: { commentEvent },
        status: 'queued',
        retry_count: 0,
        max_retries: 3,
      }, { onConflict: 'workspace_id,job_type,target_id', ignoreDuplicates: true });

      // Persist comment in logs before dispatch
      await supabaseAdmin.from('instagram_comment_logs').upsert({
        workspace_id: connection.workspace_id,
        comment_id: commentEvent.commentId,
        media_id: commentEvent.mediaId,
        comment_text: commentEvent.text,
        commenter_username: commentEvent.username,
        classification: 'pending',
        confidence: 0,
        suggested_reply: '',
        auto_replied: false,
        delivery_status: 'queued',
        flagged_for_review: false,
        reasoning: 'Enqueued for durable background dispatch',
      }, { onConflict: 'comment_id', ignoreDuplicates: true });

      const msgId = await queueService.enqueueInstagramOutboundTask({
        jobId,
        jobType: 'comment_reply',
        workspaceId: connection.workspace_id,
        connectionId: connection.id,
        commentId: commentEvent.commentId,
        mediaId: commentEvent.mediaId,
        commentText: commentEvent.text,
        commenterUsername: commentEvent.username,
        commentTimestamp: commentEvent.timestamp,
      });

      if (msgId) {
        logger.info('Dispatched Instagram comment to QStash queue', { commentId: commentEvent.commentId, msgId });
        return; // Webhook acknowledged, processing continues asynchronously in worker
      }
    } catch (queueErr) {
      logger.warn('Failed to enqueue comment outbound task — continuing synchronously', { error: queueErr });
    }
  }

  // ── Enforce monthly ig_comments_per_month plan quota ────────────────────
  try {
    const { getPlanContext } = await import('@/lib/middleware/plan-enforcement-middleware');
    const planCtx = await getPlanContext(connection.user_id || '', connection.workspace_id);
    const monthlyIgLimit = planCtx?.limits?.ig_comments_per_month;
    if (typeof monthlyIgLimit === 'number' && monthlyIgLimit > 0) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const { count: monthlyUsed } = await supabaseAdmin
        .from('instagram_comment_logs')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', connection.workspace_id)
        .eq('auto_replied', true)
        .gte('created_at', monthStart.toISOString());

      if ((monthlyUsed || 0) >= monthlyIgLimit) {
        logger.warn('Monthly Instagram comment automation quota reached — skipping auto-reply', {
          workspaceId: connection.workspace_id,
          commentId: commentEvent.commentId,
          monthlyUsed,
          monthlyIgLimit,
          plan: planCtx?.plan,
        });
        return;
      }
    }
  } catch (planErr) {
    logger.warn('Failed to check monthly IG comment quota in webhook', { error: planErr });
  }

  // ── Velocity check: enforce hourly rate limits & queue for next hour ────
  const canReply = await velocityThrottle.canReply(
    connection.workspace_id,
    automationConfig.maxRepliesPerHour || 30
  );
  if (!canReply) {
    const delaySeconds = velocityThrottle.getSecondsUntilNextHourBucket(30, 180);
    logger.info('Velocity limit reached — queuing comment for next hour window', {
      workspaceId: connection.workspace_id,
      commentId: commentEvent.commentId,
      delaySeconds,
    });
    const fallbackJobId = `ig-comment-${commentEvent.commentId}`;
    await supabaseAdmin.from('instagram_outbound_jobs').upsert({
      workspace_id: connection.workspace_id,
      job_type: 'comment_reply',
      target_id: commentEvent.commentId,
      payload: {
        jobId: fallbackJobId,
        jobType: 'comment_reply',
        workspaceId: connection.workspace_id,
        connectionId: connection.id,
        commentId: commentEvent.commentId,
        mediaId: commentEvent.mediaId,
        commentText: commentEvent.text,
        commenterUsername: commentEvent.username,
        commentTimestamp: commentEvent.timestamp,
      },
      status: 'queued',
      retry_count: 0,
      max_retries: 3,
      last_error: `Deferred to next hour window (+${delaySeconds}s) due to velocity cap`,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,job_type,target_id' });

    if (queueService.isAvailable()) {
      await queueService.enqueueInstagramOutboundTask({
        jobId: fallbackJobId,
        jobType: 'comment_reply',
        workspaceId: connection.workspace_id,
        connectionId: connection.id,
        commentId: commentEvent.commentId,
        mediaId: commentEvent.mediaId,
        commentText: commentEvent.text,
        commenterUsername: commentEvent.username,
        commentTimestamp: commentEvent.timestamp,
        delaySeconds,
      });
    }
    return;
  }

  // Get the post caption for AI context (best-effort)
  let postCaption = '';
  if (commentEvent.mediaId) {
    try {
      const mediaRes = await fetch(
        `https://graph.instagram.com/${API_VERSIONS.instagram}/${commentEvent.mediaId}?fields=caption`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        postCaption = mediaData.caption || '';
      }
    } catch {
      logger.debug('Could not fetch post caption for comment context');
    }
  }

  // ── Fetch recent replies for thread-scoped anti-duplication ─────────────
  const recentReplies = await lexicalEntropyGuard.getRecentReplies(connection.workspace_id, 15, commentEvent.mediaId);

  // ── Classify and generate reply ─────────────────────────────────────────
  const automation = new InstagramCommentAutomation(groqApiKey);
  let result: ClassifiedComment;
  try {
    result = await automation.classifyAndGenerateReply(commentEvent, postCaption, automationConfig, recentReplies);
  } catch (aiErr) {
    const err = aiErr instanceof Error ? aiErr : new Error(String(aiErr));
    logger.error('Error during AI comment classification', { error: err, commentId: commentEvent.commentId });
    result = {
      classification: 'unrelated',
      confidence: 0,
      suggestedReply: '',
      suggestedDM: null,
      threadHook: null,
      leadScore: 0,
      shouldAutoReply: false,
      shouldSendDM: false,
      shouldFlagForReview: true,
      reasoning: `AI classification exception: ${err.message}`,
    };
  }

  // Log the comment and classification immediately
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
      // ── Fast jitter delay (1-2s) so response feels natural but runs well within serverless limits
      await humanizedSleep(1, 2);

      // Post the public reply (threaded under the specific comment with user tagging)
      const replyResult = await automation.postPublicReply(
        accessToken,
        commentEvent.mediaId,
        commentEvent.commentId,
        finalReply,
        commentEvent.username
      );

      if (replyResult) {
        // Mark the log row as actually replied
        await supabaseAdmin
          .from('instagram_comment_logs')
          .update({ auto_replied: true })
          .eq('comment_id', commentEvent.commentId);
        // Record in velocity tracker and lexical guard (thread-scoped)
        await velocityThrottle.recordReply(connection.workspace_id);
        lexicalEntropyGuard.recordReply(connection.workspace_id, finalReply, commentEvent.mediaId);
        logger.info('Auto-reply posted and logged', { commentId: commentEvent.commentId });
      } else {
        logger.error('Failed to post public reply via Instagram Graph API', { commentId: commentEvent.commentId });
        await supabaseAdmin
          .from('instagram_comment_logs')
          .update({
            auto_replied: false,
            flagged_for_review: true,
            reasoning: `${result.reasoning} (Failed to post reply via Graph API - check account permissions)`,
          })
          .eq('comment_id', commentEvent.commentId);

        // Ensure failed replies appear in the human review queue
        await flagCommentForReview(
          connection.workspace_id,
          commentEvent,
          {
            classification: result.classification,
            suggestedReply: finalReply,
            reasoning: `${result.reasoning} (Failed to post reply via Graph API - check account permissions)`,
          },
          result.leadScore
        );
      }
    }

    // Post-linked page + subdomain/slug URL was already resolved in loadAutomationConfig
    const activeLinkUrl = automationConfig.linkUrl;

    // ── Send DM for link_request / purchase_intent ──────────────────────
    if (result.shouldSendDM && activeLinkUrl) {
      const commenterIgScopedId = (value.from as any)?.id as string | undefined;
      const brandHandle = connection.username ? `@${connection.username}` : 'our profile';

      if (automationConfig.requireFollowForDm) {
        // Follow-gate is active: post a PUBLIC comment reply to preserve the private-reply
        // slot (Meta allows only ONE private reply per comment). The private reply slot is
        // saved for the actual link DM after the user confirms they followed.
        const followAskPublic = `👋 Follow ${brandHandle} then DM us "link" to unlock your access! 🚀`;
        const publicReplyPosted = await automation.postPublicReply(
          accessToken,
          commentEvent.mediaId,
          commentEvent.commentId,
          followAskPublic,
          commentEvent.username
        );
        if (publicReplyPosted) {
          await supabaseAdmin
            .from('instagram_comment_logs')
            .update({ auto_replied: true })
            .eq('comment_id', commentEvent.commentId);
          logger.info('Follow-gate public comment reply posted (DM slot preserved)', {
            commentId: commentEvent.commentId,
            username: commentEvent.username,
          });
        }
      } else {
        // No follow gate: send via private reply (DM) as usual
        const dmText = result.suggestedDM
          ? (automationConfig.linkUrl && activeLinkUrl !== automationConfig.linkUrl
              ? result.suggestedDM.replace(automationConfig.linkUrl, activeLinkUrl)
              : result.suggestedDM)
          : `Hey @${commentEvent.username}! Here's the link you asked for: ${activeLinkUrl}`;
        const dmRes = await automation.sendDmForComment(
          accessToken,
          connection.platform_user_id,
          commentEvent.commentId,
          commenterIgScopedId,
          dmText
        );
        if (dmRes) {
          await supabaseAdmin
            .from('instagram_comment_logs')
            .update({ dm_sent: true })
            .eq('comment_id', commentEvent.commentId);
        }
      }
    }
  }

  if (result.shouldFlagForReview) {
    await flagCommentForReview(connection.workspace_id, commentEvent, result, result.leadScore);
  }

  // ── autoHideSpam: hide spam comments via Graph API if enabled ──────────────
  if (
    result.classification === 'spam' &&
    automationConfig.autoHideSpam &&
    commentEvent.commentId &&
    !commentEvent.commentId.startsWith('test_')
  ) {
    try {
      const hideParams = new URLSearchParams({ hide: 'true', access_token: accessToken });
      const hideRes = await fetch(
        `https://graph.facebook.com/${API_VERSIONS.facebook}/${commentEvent.commentId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: hideParams.toString(),
        }
      );
      if (hideRes.ok) {
        logger.info('Spam comment hidden via Graph API', { commentId: commentEvent.commentId });
      } else {
        const hideErr = await hideRes.text();
        logger.warn('Failed to hide spam comment', { commentId: commentEvent.commentId, error: hideErr });
      }
    } catch (hideErr) {
      logger.warn('Error hiding spam comment', { commentId: commentEvent.commentId, error: hideErr });
    }
  }
}

// ─── Inbound DM Processing Logic ─────────────────────────────────────────────

async function processDmEvent(igUserId: string, messaging: Record<string, unknown>): Promise<void> {
  const message = messaging.message as Record<string, unknown> | undefined;
  const postback = messaging.postback as Record<string, unknown> | undefined;
  const sender = messaging.sender as Record<string, unknown> | undefined;

  if ((!message && !postback) || !sender) return;

  // Don't process our own outbound messages (echo)
  if ((message as any)?.is_echo === true || sender.id === igUserId) {
    logger.debug('Skipping echo/outbound DM', {
      senderId: sender.id,
      igUserId,
      isEcho: (message as any)?.is_echo,
    });
    return;
  }

  const quickReply = (message as any)?.quick_reply as Record<string, unknown> | undefined;
  const resolvedText =
    (message?.text as string | undefined) ||
    (quickReply?.payload as string | undefined) ||
    (postback?.title as string | undefined) ||
    (postback?.payload as string | undefined) ||
    '';

  const dmEvent: DmEvent = {
    messageId:
      (messaging.mid as string) ||
      (message?.mid as string) ||
      (postback?.mid as string) ||
      `dm_${sender.id}_${messaging.timestamp || Date.now()}`,
    senderId: sender.id as string,
    senderUsername: (sender as any).username,
    text: resolvedText,
    timestamp: (messaging.timestamp as string) || new Date().toISOString(),
  };

  if (!dmEvent.text || !dmEvent.senderId) {
    logger.debug('Skipping empty DM event');
    return;
  }

  // ── Idempotency guard: skip entirely if this message_id was already processed ──
  const { data: existingDm } = await supabaseAdmin
    .from('instagram_dm_logs')
    .select('id, auto_replied')
    .eq('message_id', dmEvent.messageId)
    .limit(1);
  if (existingDm && existingDm.length > 0) {
    logger.debug('Skipping already-processed DM (idempotency guard)', { messageId: dmEvent.messageId });
    return;
  }

  // ContentGuard check on DM text
  const guardResult = ContentGuard.validateComment(dmEvent.text);
  if (!guardResult.safe && guardResult.violation.level === 'blocked') {
    logger.info('ContentGuard blocked incoming DM', { code: guardResult.violation.code });
    return;
  }

  // Find the platform connection with multi-tenant isolation
  const connection = await resolveInstagramConnection(igUserId, {
    senderId: dmEvent.senderId,
  });

  if (!connection) {
    logger.warn('No active Instagram connection for DM webhook', { igUserId });
    return;
  }

  const automationConfig = await loadAutomationConfig(connection.workspace_id, {
    brandUsername: connection.username,
  });

  // ── ALWAYS record the inbound DM regardless of auto-reply setting ──────────
  // dmAutoReplyEnabled controls ONLY whether we send an automated reply,
  // NOT whether we record the message in the inbox for human review.
  const groqApiKey = config.GROQ_API_KEY || process.env.GROQ_API_KEY;

  // ── Follow-to-Unlock Gate: runs BEFORE dmAutoReplyEnabled bail-out ──────────
  // When require_follow_for_dm is enabled, every inbound DM must be intercepted
  // to check follow status — even if DM auto-reply is disabled. This ensures the
  // "please follow" prompt is always sent, independent of the AI reply setting.
  if (automationConfig.enabled && automationConfig.requireFollowForDm) {
    const followGateAccessToken = await getOrRefreshAccessToken(connection);
    if (!followGateAccessToken) {
      logger.warn('Could not obtain valid access token for DM follow gate', {
        connectionId: connection.id,
        messageId: dmEvent.messageId,
      });
    } else {
      const canReplyGate = await velocityThrottle.canReply(
        `dm:${connection.workspace_id}`,
        automationConfig.dmMaxRepliesPerHour || 20
      );

      const { data: followGateLogs } = await supabaseAdmin
        .from('instagram_dm_logs')
        .select('message_text, ai_reply, escalated, follow_verified, follow_status, reasoning, created_at')
        .eq('workspace_id', connection.workspace_id)
        .eq('sender_id', dmEvent.senderId)
        .order('created_at', { ascending: true })
        .limit(30);

      const priorGateTurns = (followGateLogs || []).filter(
        (l: any) => l?.ai_reply && l.ai_reply !== 'SKIP'
      ).length;

      if (canReplyGate && priorGateTurns < 15) {
        const followGateAutomation = new InstagramCommentAutomation(groqApiKey || '');
        const followGateResult = await followGateAutomation.processDmFollowGate({
          dmEvent,
          config: automationConfig,
          accessToken: followGateAccessToken,
          igUserId,
          brandUsername: connection.username || 'creator',
          previousLogs: followGateLogs || [],
        });

        if (followGateResult.handled) {
          const gateSendSucceeded = !!followGateResult.messageId;
          const resolvedSenderUsername = dmEvent.senderUsername || followGateResult.resolvedUsername;
          await supabaseAdmin.from('instagram_dm_logs').upsert(
            {
              workspace_id: connection.workspace_id,
              message_id: dmEvent.messageId,
              sender_id: dmEvent.senderId,
              sender_username: resolvedSenderUsername,
              message_text: dmEvent.text,
              classification: followGateResult.action === 'follow_confirmed' ? 'positive' : 'question',
              confidence: 1.0,
              ai_reply: followGateResult.replyText,
              auto_replied: gateSendSucceeded,
              escalated: !gateSendSucceeded,
              lead_score: followGateResult.isFollowing ? 2 : 1,
              reasoning: gateSendSucceeded
                ? `Follow gate ${followGateResult.action}: isFollowing=${followGateResult.isFollowing}`
                : `Follow gate ${followGateResult.action} DM send failed: isFollowing=${followGateResult.isFollowing}`,
              follow_verified: followGateResult.isFollowing,
              follow_status: followGateResult.isFollowing ? 'following' : 'not_following',
              ...(gateSendSucceeded ? { reply_sent_at: new Date().toISOString() } : {}),
              created_at: new Date().toISOString(),
            },
            { onConflict: 'message_id', ignoreDuplicates: false }
          );

          if (gateSendSucceeded) {
            await velocityThrottle.recordReply(`dm:${connection.workspace_id}`);
          } else {
            try {
              await supabaseAdmin.from('instagram_flagged_dms').upsert(
                {
                  workspace_id: connection.workspace_id,
                  message_id: dmEvent.messageId,
                  sender_id: dmEvent.senderId,
                  sender_username: resolvedSenderUsername,
                  message_text: dmEvent.text,
                  classification: 'question',
                  ai_suggested_reply: followGateResult.replyText,
                  lead_score: followGateResult.isFollowing ? 2 : 1,
                  reasoning: `Follow gate ${followGateResult.action} failed to deliver via Meta API — queued for retry`,
                  status: 'pending',
                },
                { onConflict: 'workspace_id,message_id', ignoreDuplicates: false }
              );
            } catch (flagErr) {
              logger.warn('Failed to flag failed follow-gate DM for review', { error: flagErr });
            }
          }

          logger.info('Instagram DM follow gate handled message (pre-filter path)', {
            messageId: dmEvent.messageId,
            action: followGateResult.action,
            isFollowing: followGateResult.isFollowing,
            gateSendSucceeded,
          });
          return;
        }
      }
    }
  }

  if (!automationConfig.enabled || !automationConfig.dmAutoReplyEnabled || !groqApiKey) {
    // Record the DM for human review without attempting to auto-reply.
    logger.debug('DM auto-reply disabled — recording for inbox only', {
      workspaceId: connection.workspace_id,
      enabled: automationConfig.enabled,
      dmAutoReplyEnabled: automationConfig.dmAutoReplyEnabled,
      hasGroqKey: !!groqApiKey,
    });

    await logDmEvent(connection.workspace_id, dmEvent, {
      classification: 'unrelated',
      confidence: 0,
      suggestedReply: '',
      leadScore: 0,
      shouldAutoReply: false,
      shouldEscalate: false,
      reasoning: !groqApiKey
        ? 'GROQ_API_KEY not configured'
        : !automationConfig.enabled
          ? 'Automation disabled in settings'
          : 'DM auto-reply disabled — recorded for human review',
    });

    // Insert into flagged DMs for human inbox review when auto-reply is off
    if (automationConfig.enabled && !automationConfig.dmAutoReplyEnabled) {
      try {
        await supabaseAdmin.from('instagram_flagged_dms').upsert(
          {
            workspace_id: connection.workspace_id,
            message_id: dmEvent.messageId,
            sender_id: dmEvent.senderId,
            sender_username: dmEvent.senderUsername,
            message_text: dmEvent.text,
            classification: 'unrelated',
            ai_suggested_reply: null,
            lead_score: 0,
            reasoning: 'DM auto-reply disabled — queued for human review',
            status: 'pending',
          },
          { onConflict: 'message_id', ignoreDuplicates: true }
        );
      } catch (flagErr) {
        logger.warn('Failed to flag incoming DM for inbox', { error: flagErr });
      }
    }
    return;
  }

  // ── Phase 4: Durable Outbound Queue Dispatch via QStash ──────────────────
  if (queueService.isAvailable()) {
    try {
      const jobId = `job_dm_${dmEvent.messageId}`;
      await supabaseAdmin.from('instagram_outbound_jobs').upsert({
        workspace_id: connection.workspace_id,
        connection_id: connection.id,
        job_type: 'dm_reply',
        target_id: dmEvent.messageId,
        payload: { dmEvent },
        status: 'queued',
        retry_count: 0,
        max_retries: 3,
      }, { onConflict: 'workspace_id,job_type,target_id', ignoreDuplicates: true });

      // Persist DM in logs before dispatch
      await supabaseAdmin.from('instagram_dm_logs').upsert({
        workspace_id: connection.workspace_id,
        message_id: dmEvent.messageId,
        sender_id: dmEvent.senderId,
        sender_username: dmEvent.senderUsername,
        message_text: dmEvent.text,
        classification: 'pending',
        confidence: 0,
        ai_reply: '',
        auto_replied: false,
        delivery_status: 'queued',
        escalated: false,
        reasoning: 'Enqueued for durable background dispatch',
      }, { onConflict: 'message_id', ignoreDuplicates: true });

      const msgId = await queueService.enqueueInstagramOutboundTask({
        jobId,
        jobType: 'dm_reply',
        workspaceId: connection.workspace_id,
        connectionId: connection.id,
        messageId: dmEvent.messageId,
        senderId: dmEvent.senderId,
        senderUsername: dmEvent.senderUsername,
        dmText: dmEvent.text,
      });

      if (msgId) {
        logger.info('Dispatched Instagram DM to QStash queue', { messageId: dmEvent.messageId, msgId });
        return; // Webhook acknowledged, processing continues asynchronously in worker
      }
    } catch (queueErr) {
      logger.warn('Failed to enqueue DM outbound task — continuing synchronously', { error: queueErr });
    }
  }

  // Velocity check for DMs — queue for next hour window instead of dropping
  const canReply = await velocityThrottle.canReply(
    `dm:${connection.workspace_id}`,
    automationConfig.dmMaxRepliesPerHour || 20
  );
  if (!canReply) {
    const delaySeconds = velocityThrottle.getSecondsUntilNextHourBucket(30, 180);
    logger.info('DM velocity limit reached — queuing DM for next hour window', {
      workspaceId: connection.workspace_id,
      messageId: dmEvent.messageId,
      delaySeconds,
    });
    const fallbackDmJobId = `ig-dm-${dmEvent.messageId}`;
    await supabaseAdmin.from('instagram_outbound_jobs').upsert({
      workspace_id: connection.workspace_id,
      job_type: 'dm_reply',
      target_id: dmEvent.messageId,
      payload: {
        jobId: fallbackDmJobId,
        jobType: 'dm_reply',
        workspaceId: connection.workspace_id,
        connectionId: connection.id,
        messageId: dmEvent.messageId,
        senderId: dmEvent.senderId,
        senderUsername: dmEvent.senderUsername,
        dmText: dmEvent.text,
      },
      status: 'queued',
      retry_count: 0,
      max_retries: 3,
      last_error: `Deferred to next hour window (+${delaySeconds}s) due to velocity cap`,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'workspace_id,job_type,target_id' });

    if (queueService.isAvailable()) {
      await queueService.enqueueInstagramOutboundTask({
        jobId: fallbackDmJobId,
        jobType: 'dm_reply',
        workspaceId: connection.workspace_id,
        connectionId: connection.id,
        messageId: dmEvent.messageId,
        senderId: dmEvent.senderId,
        senderUsername: dmEvent.senderUsername,
        dmText: dmEvent.text,
        delaySeconds,
      });
    }
    return;
  }

  const accessToken = await getOrRefreshAccessToken(connection);
  if (!accessToken) {
    logger.error('Failed to obtain valid access token for DM automation', { connectionId: connection.id });
    await logDmEvent(connection.workspace_id, dmEvent, {
      classification: 'unrelated',
      confidence: 0,
      suggestedReply: '',
      leadScore: 0,
      shouldAutoReply: false,
      shouldEscalate: false,
      reasoning: 'Failed to decrypt or refresh access token',
    });
    return;
  }

  const automation = new InstagramCommentAutomation(groqApiKey);

  // ── Multi-Turn Conversation Memory Engine (10 to 15 turns) ──────────
  // Fetch chronological conversation history for this sender in this workspace
  const { data: previousLogs } = await supabaseAdmin
    .from('instagram_dm_logs')
    .select('message_text, ai_reply, escalated, follow_verified, follow_status, reasoning, created_at')
    .eq('workspace_id', connection.workspace_id)
    .eq('sender_id', dmEvent.senderId)
    .order('created_at', { ascending: true })
    .limit(30);

  const conversationHistory: ConversationMessage[] = [];
  let conversationTurnCount = 0;
  let alreadyEscalated = false;

  if (previousLogs && previousLogs.length > 0) {
    for (const log of previousLogs) {
      if ((log as any).escalated === true) {
        alreadyEscalated = true;
      }
      if (log.message_text) {
        conversationHistory.push({ role: 'user', text: log.message_text });
      }
      if (log.ai_reply && log.ai_reply !== 'SKIP') {
        conversationHistory.push({ role: 'assistant', text: log.ai_reply });
        conversationTurnCount++;
      }
    }
  }

  // If conversation has already reached the 15-reply ceiling, stop auto-replying to prevent endless loops.
  // Send a single warm handoff notice on first breach (if not already escalated) so the user isn't ghosted.
  if (conversationTurnCount >= 15) {
    logger.info('DM conversation reached turn limit (15+ replies)', {
      workspaceId: connection.workspace_id,
      senderId: dmEvent.senderId,
      conversationTurnCount,
      alreadyEscalated,
    });

    const handoffText = !alreadyEscalated && (automationConfig.dmEscalationEnabled ?? true)
      ? "Hey! I'm passing your conversation directly over to our team so someone can give you a proper hand from here — they'll reply shortly 😊"
      : 'SKIP';

    let handoffSent = false;
    if (handoffText !== 'SKIP') {
      const sendRes = await automation.sendPrivateMessage(accessToken, igUserId, dmEvent.senderId, handoffText);
      handoffSent = !!sendRes;
    }

    await logDmEvent(connection.workspace_id, dmEvent, {
      classification: 'unrelated',
      confidence: 1.0,
      suggestedReply: handoffSent ? handoffText : 'SKIP',
      leadScore: 1,
      shouldAutoReply: false,
      shouldEscalate: true,
      reasoning: 'Conversation turn limit reached (15 replies); escalated for human handling.',
    });

    if (handoffSent || alreadyEscalated) {
      await supabaseAdmin
        .from('instagram_dm_logs')
        .update({ auto_replied: handoffSent, escalated: true })
        .eq('workspace_id', connection.workspace_id)
        .eq('message_id', dmEvent.messageId);
    }

    try {
      await supabaseAdmin.from('instagram_flagged_dms').upsert(
        {
          workspace_id: connection.workspace_id,
          message_id: dmEvent.messageId,
          sender_id: dmEvent.senderId,
          sender_username: dmEvent.senderUsername,
          message_text: dmEvent.text,
          classification: 'unrelated',
          ai_suggested_reply: handoffSent ? handoffText : null,
          lead_score: 1,
          reasoning: 'Conversation turn limit reached (15 replies); escalated for human handling.',
          status: 'pending',
        },
        { onConflict: 'workspace_id,message_id', ignoreDuplicates: false }
      );
    } catch (flagErr) {
      logger.warn('Failed to upsert turn-limit DM into flagged inbox', { error: flagErr });
    }
    return;
  }

  const currentTurn = conversationTurnCount + 1;
  const brandName = connection.username ? `@${connection.username}` : 'our product';

  const result = await automation.classifyAndReplyDM(
    dmEvent,
    automationConfig,
    conversationHistory,
    currentTurn,
    brandName,
    true
  );

  // Log the DM (auto_replied starts as false, updated to true only after confirmed send)
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

    // Jitter delay for DMs (2–4s for natural and fast response)
    await humanizedSleep(2, 4);

    // Send the DM reply
    const sendRes = await automation.sendPrivateMessage(accessToken, igUserId, dmEvent.senderId, finalReply);
    if (sendRes) {
      await supabaseAdmin
        .from('instagram_dm_logs')
        .update({ auto_replied: true, reply_sent_at: new Date().toISOString() })
        .eq('workspace_id', connection.workspace_id)
        .eq('message_id', dmEvent.messageId);
      await velocityThrottle.recordReply(`dm:${connection.workspace_id}`);
      logger.info('Auto DM reply sent and logged', { messageId: dmEvent.messageId });
    } else {
      // Mark as failed — do not mark auto_replied=true
      await supabaseAdmin
        .from('instagram_dm_logs')
        .update({
          auto_replied: false,
          reasoning: `${result.reasoning} (Send failed — check account permissions and messaging window)`,
        })
        .eq('workspace_id', connection.workspace_id)
        .eq('message_id', dmEvent.messageId);
      logger.error('Failed to send DM reply via Instagram Graph API', { messageId: dmEvent.messageId });

      // Ensure failed DMs appear in the human review queue
      try {
        await supabaseAdmin.from('instagram_flagged_dms').upsert(
          {
            workspace_id: connection.workspace_id,
            message_id: dmEvent.messageId,
            sender_id: dmEvent.senderId,
            sender_username: dmEvent.senderUsername,
            message_text: dmEvent.text,
            classification: result.classification,
            ai_suggested_reply: finalReply,
            lead_score: result.leadScore,
            reasoning: `${result.reasoning} (Send failed — check account permissions and messaging window)`,
            status: 'pending',
          },
          { onConflict: 'workspace_id,message_id', ignoreDuplicates: false }
        );
      } catch (flagErr) {
        logger.warn('Failed to insert failed DM into flagged inbox', { error: flagErr });
      }
    }
  }

  if (result.shouldEscalate) {
    logger.info('DM escalated for human review', {
      workspaceId: connection.workspace_id,
      senderId: dmEvent.senderId,
      classification: result.classification,
      alreadyEscalated,
    });

    // If AI turned off auto-reply for this escalation (e.g., deflection cap reached)
    // and provided a warm wind-down reply, send it ONCE so the follower isn't ghosted.
    if (
      !result.shouldAutoReply &&
      !alreadyEscalated &&
      result.suggestedReply &&
      result.suggestedReply !== 'SKIP' &&
      result.classification !== 'harmful' &&
      result.classification !== 'spam'
    ) {
      let handoffReply = result.suggestedReply;
      try {
        const humanized = ContentHumanizer.humanize(handoffReply, 'instagram');
        handoffReply = humanized.humanized || handoffReply;
      } catch {
        // use raw
      }
      const handoffRes = await automation.sendPrivateMessage(accessToken, igUserId, dmEvent.senderId, handoffReply);
      if (handoffRes) {
        await supabaseAdmin
          .from('instagram_dm_logs')
          .update({ auto_replied: true, escalated: true, reply_sent_at: new Date().toISOString() })
          .eq('workspace_id', connection.workspace_id)
          .eq('message_id', dmEvent.messageId);
        await velocityThrottle.recordReply(`dm:${connection.workspace_id}`);
      }
    }

    // Upsert into flagged DMs inbox for human review
    try {
      await supabaseAdmin.from('instagram_flagged_dms').upsert(
        {
          workspace_id: connection.workspace_id,
          message_id: dmEvent.messageId,
          sender_id: dmEvent.senderId,
          sender_username: dmEvent.senderUsername,
          message_text: dmEvent.text,
          classification: result.classification,
          ai_suggested_reply: result.suggestedReply !== 'SKIP' ? result.suggestedReply : null,
          lead_score: result.leadScore,
          reasoning: result.reasoning,
          status: 'pending',
        },
        { onConflict: 'workspace_id,message_id', ignoreDuplicates: false }
      );
    } catch (escalateErr) {
      logger.warn('Failed to upsert escalated DM into flagged inbox', { error: escalateErr });
    }
  }
}

// ─── Helper: Load automation config ──────────────────────────────────────────

async function loadAutomationConfig(
  workspaceId: string,
  options?: { brandUsername?: string | null; mediaId?: string | null }
): Promise<AutomationConfig> {
  const globalAutomationEnabled = await isAutomationEnabledServer();
  if (!globalAutomationEnabled) {
    return {
      enabled: false,
      autoReplyPositive: false,
      autoReplyQuestions: false,
      autoReplyLinkRequests: false,
      autoReplyPurchaseIntent: false,
      flagNegative: false,
      flagSpam: false,
      maxRepliesPerHour: 0,
      jitterMinSeconds: 0,
      jitterMaxSeconds: 0,
      threadChainingEnabled: false,
      autoHideSpam: false,
      dmAutoReplyEnabled: false,
      dmEscalationEnabled: false,
      dmMaxRepliesPerHour: 0,
    };
  }
  try {
    const { data } = await supabaseAdmin
      .from('instagram_automation_config')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (data) {
      const resolvedLinkUrl = await resolveCreatorDeliveryLink(workspaceId, {
        configuredLinkUrl: data.link_url || undefined,
        brandUsername: options?.brandUsername,
        mediaId: options?.mediaId,
      });

      return {
        enabled: data.enabled ?? false,
        autoReplyPositive: data.auto_reply_positive ?? true,
        autoReplyQuestions: data.auto_reply_questions ?? true,
        autoReplyLinkRequests: data.auto_reply_link_requests ?? true,
        autoReplyPurchaseIntent: data.auto_reply_purchase_intent ?? true,
        linkUrl: resolvedLinkUrl,
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
        requireFollowForDm: data.require_follow_for_dm ?? false,
        followAskMessage: data.follow_ask_message || undefined,
        followVerifiedMessage: data.follow_verified_message || undefined,
      };
    }
  } catch {
    // Table may not exist yet — fall back to defaults
  }

  return DEFAULT_AUTOMATION_CONFIG;
}

async function getWorkspaceIdForIgUser(igUserId: string): Promise<string> {
  const conn = await resolveInstagramConnection(igUserId);
  return conn?.workspace_id || '';
}

// ─── Helper: Log comment event ────────────────────────────────────────────────

async function logCommentEvent(
  workspaceId: string,
  comment: CommentEvent,
  classification: ClassifiedComment
): Promise<void> {
  try {
    await supabaseAdmin.from('instagram_comment_logs').upsert(
      {
        workspace_id: workspaceId,
        comment_id: comment.commentId,
        media_id: comment.mediaId,
        comment_text: comment.text,
        commenter_username: comment.username,
        classification: classification.classification,
        confidence: classification.confidence,
        suggested_reply: classification.suggestedReply,
        // Always insert false — updated to true only after confirmed API success
        auto_replied: false,
        flagged_for_review: classification.shouldFlagForReview,
        reasoning: classification.reasoning,
        lead_score: classification.leadScore,
        dm_sent: false,
        dm_message: classification.suggestedDM,
        thread_hook: classification.threadHook,
      },
      { onConflict: 'comment_id', ignoreDuplicates: true }
    );
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
    // Use upsert with ignoreDuplicates to prevent duplicate rows from webhook re-delivery.
    // auto_replied is always inserted as false here; it is updated to true only after a
    // confirmed successful send.  This prevents counting a generated reply as a sent reply.
    await supabaseAdmin.from('instagram_dm_logs').upsert(
      {
        workspace_id: workspaceId,
        message_id: dm.messageId,
        sender_id: dm.senderId,
        sender_username: dm.senderUsername,
        message_text: dm.text,
        classification: classification.classification,
        confidence: classification.confidence,
        ai_reply: classification.suggestedReply,
        auto_replied: false,
        escalated: classification.shouldEscalate,
        lead_score: classification.leadScore,
        reasoning: classification.reasoning,
      },
      { onConflict: 'message_id', ignoreDuplicates: true }
    );
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
    // Use upsert to avoid duplicate flagged rows from repeated webhook deliveries.
    await supabaseAdmin.from('instagram_flagged_comments').upsert(
      {
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
      },
      { onConflict: 'comment_id', ignoreDuplicates: true }
    );
  } catch (error) {
    logger.warn('Failed to flag Instagram comment for review', { error });
  }
}
