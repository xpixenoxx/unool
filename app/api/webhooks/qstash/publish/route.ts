import { NextRequest, NextResponse } from 'next/server';
import { publishService } from '@/lib/services/PublishService';
import { logger } from '@/lib/logger';
import { Receiver } from '@upstash/qstash';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import { config } from '@/lib/config/schema';
import { postFirstComment } from '@/lib/platforms/firstComment';
import { decryptToken } from '@/lib/crypto/encryption';
import { supabaseAdmin } from '@/lib/supabase/admin';



export const maxDuration = 300; // 5 minutes max for background publishing

const postRepository = new SupabasePostRepository();

function isPermanentPublishError(errorMsg?: string): boolean {
  if (!errorMsg) return false;
  return /unsupported platform|no active connection|requires an image|monthly x .* cap reached|failed to decrypt|marked as failed prior to publishing/i.test(
    errorMsg
  );
}

// QStash v2 Receiver for signature verification
function getReceiver(): Receiver | null {
  if (!config.QSTASH_CURRENT_SIGNING_KEY || !config.QSTASH_NEXT_SIGNING_KEY) {
    return null;
  }
  return new Receiver({
    currentSigningKey: config.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: config.QSTASH_NEXT_SIGNING_KEY,
  });
}

async function handler(request: NextRequest) {
  try {
    // ── Signature verification (skip in dev if keys not configured) ────────
    const receiver = getReceiver();
    if (receiver) {
      const signature = request.headers.get('upstash-signature');
      if (!signature) {
        logger.warn('QStash webhook: missing signature header');
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }
      const rawBody = await request.text();
      const configuredUrl = config.NEXT_PUBLIC_APP_URL + '/api/webhooks/qstash/publish';
      let isValid = false;
      try {
        isValid = await receiver.verify({
          signature,
          body: rawBody,
          url: configuredUrl,
          clockTolerance: 300, // 5 minutes tolerance for delayed dispatches / clock drift
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
        logger.warn('QStash webhook: invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      // Parse body after verification
      const body = JSON.parse(rawBody);
      return handlePublish(body, request);
    }

    // Dev mode: no signature keys configured — parse body directly
    const body = await request.json();
    return handlePublish(body, request);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('QStash webhook: handler error', { error: err });
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

async function handlePublish(body: Record<string, unknown>, _request: NextRequest) {
  const { postId, workspaceId, variantId, autoFirstComment, isScheduled } = body as {
    postId: string;
    workspaceId: string;
    variantId?: string | null;
    autoFirstComment?: string | null;
    isScheduled?: boolean;
  };

  if (!postId || !workspaceId) {
    logger.error('Invalid QStash payload: missing postId or workspaceId');
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // ── Safety check: verify post still exists and is schedulable ──────────
  const post = await postRepository.findById(postId);
  if (!post) {
    logger.warn('QStash publish: post not found — skipping', { postId });
    return NextResponse.json({ skipped: true, reason: 'post_not_found' });
  }

  // ── Check if queue is held for this workspace ──────────────────────────
  const { data: workspace } = await supabaseAdmin
    .from('workspaces')
    .select('settings')
    .eq('id', workspaceId)
    .single();

  const heldUntil = (workspace?.settings as Record<string, unknown> | null)?.queue_held_until;
  if (heldUntil && new Date(heldUntil as string) > new Date()) {
    logger.info('QStash publish: queue is held — skipping', { postId, heldUntil });
    return NextResponse.json({ skipped: true, reason: 'queue_held', heldUntil });
  }

  if (isScheduled && post.status === 'draft') {
    // Post was cancelled or reset to draft — skip without retrying
    logger.info('QStash scheduled publish: post reverted to draft — skipping', { postId });
    return NextResponse.json({ skipped: true, reason: 'post_cancelled' });
  }

  if (isScheduled && post.status === 'published') {
    // Self-healing or previous dispatch already published this post — skip to prevent duplicate dispatches
    logger.info('QStash scheduled publish: post already published — skipping duplicate', { postId });
    return NextResponse.json({ skipped: true, reason: 'already_published' });
  }

  // ── First-comment dispatch ─────────────────────────────────────────────
  // Format: "first-comment:{originalVariantId}:{platformPostId}"
  if (variantId && variantId.startsWith('first-comment:')) {
    const parts = variantId.split(':');
    const originalVariantId = parts[1];
    const platformPostId = parts[2];

    if (!platformPostId || !autoFirstComment) {
      logger.info('QStash first-comment: missing data — skipping', { variantId });
      return NextResponse.json({ skipped: true, reason: 'missing_first_comment_data' });
    }

    const variant = await postRepository.findVariantById(originalVariantId);
    if (!variant) {
      logger.warn('QStash first-comment: variant not found', { originalVariantId });
      return NextResponse.json({ skipped: true, reason: 'variant_not_found' });
    }

    // Find the platform connection for this variant's workspace
    const { data: connections } = await supabaseAdmin
      .from('platform_connections')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('platform', variant.platform)
      .eq('status', 'connected')
      .limit(1);

    if (!connections || connections.length === 0) {
      logger.warn('QStash first-comment: no active platform connection', { workspaceId, platform: variant.platform });
      return NextResponse.json({ skipped: true, reason: 'no_connection' });
    }

    try {
      const accessToken = await decryptToken(connections[0].access_token_encrypted);
      await postFirstComment(accessToken, platformPostId, autoFirstComment, variant.platform);
      logger.info('QStash first-comment: posted successfully', { platformPostId, platform: variant.platform });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('QStash first-comment: failed to post', { error, platformPostId });
      // Don't throw — return success so QStash doesn't retry and double-post
    }

    return NextResponse.json({ success: true, firstComment: true });
  }

  // ── Cascading single-variant mode ──────────────────────────────────────
  if (variantId && !variantId.startsWith('first-comment:')) {
    logger.info('QStash cascading publish: single variant', { postId, variantId });

    const variant = await postRepository.findVariantById(variantId);
    if (!variant) {
      logger.warn('QStash cascading: variant not found — skipping', { variantId });
      return NextResponse.json({ skipped: true, reason: 'variant_not_found' });
    }

    if (variant.status === 'published') {
      logger.info('QStash cascading: variant already published — skipping', { variantId });
      return NextResponse.json({ skipped: true, reason: 'already_published' });
    }

    if (variant.status === 'draft') {
      logger.info('QStash cascading: variant reverted to draft — skipping', { variantId });
      return NextResponse.json({ skipped: true, reason: 'variant_cancelled' });
    }

    if (typeof postRepository.claimVariantForPublishing === 'function') {
      const fromStatus =
        variant.status === 'publishing'
          ? 'publishing'
          : variant.status === 'failed'
            ? 'failed'
            : 'scheduled';
      const claimedVariant = await postRepository.claimVariantForPublishing(
        variantId,
        fromStatus,
        fromStatus === 'publishing' ? new Date(Date.now() - 5 * 60 * 1000) : undefined
      );
      if (!claimedVariant) {
        logger.info('QStash cascading: variant claim lost to concurrent worker — skipping', { variantId });
        return NextResponse.json({ skipped: true, reason: 'already_claimed' });
      }
    }

    const result = await publishService.publishPost({
      postVariantId: variantId,
      platform: variant.platform,
      workspaceId,
    });

    const succeeded = result.ok && result.value.success;

    // ── Auto first-comment dispatch (only when explicitly enabled) ─────────
    const approvedComment = variant.autoFirstComment || autoFirstComment;
    if (succeeded && approvedComment && result.value.platformPostId) {
      const { queueService } = await import('@/lib/services/QueueService');
      await queueService.enqueueScheduledPublishTask({
        postId,
        workspaceId,
        variantId: `first-comment:${variantId}:${result.value.platformPostId}`,
        scheduledAt: new Date(Date.now() + 90_000),
        autoFirstComment: approvedComment,
      });
    }

    // Reconcile parent post status when cascading variants finish
    try {
      const siblingVariants = await postRepository.findVariantsByPostId(postId);
      if (siblingVariants.length > 0 && typeof postRepository.updateStatus === 'function') {
        const anyScheduledOrPublishing = siblingVariants.some(
          v => v.status === 'scheduled' || v.status === 'publishing'
        );
        const anyPublished = siblingVariants.some(v => v.status === 'published');
        if (!anyScheduledOrPublishing) {
          await postRepository.updateStatus(postId, anyPublished ? 'published' : 'failed');
        } else if (anyPublished && post.status === 'scheduled') {
          await postRepository.updateStatus(postId, 'published');
        }
      }
    } catch (reconcileErr) {
      logger.warn('Failed to reconcile parent post status after cascading variant publish', {
        postId,
        variantId,
        error: reconcileErr,
      });
    }

    if (!succeeded) {
      const errMsg = result.ok ? result.value.error : result.error?.message;
      if (!isPermanentPublishError(errMsg)) {
        return NextResponse.json(
          { success: false, retryable: true, error: errMsg || 'Transient variant publish failure' },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ success: succeeded });
  }

  // ── Standard: publish all variants for this post ───────────────────────
  if (isScheduled && typeof postRepository.claimForPublishing === 'function') {
    const fromStatus =
      post.status === 'publishing'
        ? 'publishing'
        : post.status === 'failed'
          ? 'failed'
          : 'scheduled';
    const claimed = await postRepository.claimForPublishing(
      postId,
      fromStatus,
      fromStatus === 'publishing' ? new Date(Date.now() - 5 * 60 * 1000) : undefined
    );
    if (!claimed) {
      logger.info('QStash scheduled publish: post claim lost to concurrent worker — skipping', { postId });
      return NextResponse.json({ skipped: true, reason: 'already_claimed' });
    }
  }

  logger.info('QStash background publish executing', { postId, workspaceId, isScheduled });
  const publishResults = await publishService.publishToAllPlatforms(postId, workspaceId);

  // ── Auto first-comment dispatch for Flight Plan / simultaneous variants ──
  // Only dispatch when `v.autoFirstComment` was explicitly persisted (never `firstCommentHint`).
  try {
    const postVariants = await postRepository.findVariantsByPostId(postId);
    const { queueService } = await import('@/lib/services/QueueService');
    for (const v of postVariants) {
      const comment = v.autoFirstComment;
      if (v.status === 'published' && comment && v.platformPostId) {
        await queueService.enqueueScheduledPublishTask({
          postId,
          workspaceId,
          variantId: `first-comment:${v.id}:${v.platformPostId}`,
          scheduledAt: new Date(Date.now() + 90_000),
          autoFirstComment: comment,
        });
        logger.info('Dispatched first-comment task for variant', {
          postId,
          variantId: v.id,
          platform: v.platform,
        });
      }
    }
  } catch (err) {
    logger.warn('Failed to enqueue auto first-comments after batch publish', { postId, error: err });
  }

  const resultEntries = Object.values(publishResults || {});
  const anySucceeded = resultEntries.some((r: any) => r?.success);
  if (resultEntries.length > 0 && !anySucceeded) {
    const hasTransientFailure = resultEntries.some((r: any) => !isPermanentPublishError(r?.error));
    if (hasTransientFailure) {
      logger.warn('All platform publishes failed with transient error — returning 502 for QStash retry', {
        postId,
        results: publishResults,
      });
      return NextResponse.json(
        { success: false, retryable: true, results: publishResults },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({ success: anySucceeded || resultEntries.length === 0, results: publishResults });
}

export const POST = handler;
