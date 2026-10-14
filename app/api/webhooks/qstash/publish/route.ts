import { NextRequest, NextResponse } from 'next/server';
import { publishService } from '@/lib/services/PublishService';
import { logger } from '@/lib/logger';
import { Receiver } from '@upstash/qstash';
import { SupabasePostRepository } from '@/lib/repositories/supabase/SupabasePostRepository';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import { postFirstComment } from '@/lib/platforms/firstComment';
import { decryptToken } from '@/lib/crypto/encryption';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

export const maxDuration = 300; // 5 minutes max for background publishing

const postRepository = new SupabasePostRepository();

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
      const isValid = await receiver.verify({
        signature,
        body: rawBody,
        url: config.NEXT_PUBLIC_APP_URL + '/api/webhooks/qstash/publish',
      });
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
  const { data: workspace } = await supabase
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
    const { data: connections } = await supabase
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

    const result = await publishService.publishPost({
      postVariantId: variantId,
      platform: variant.platform,
      workspaceId,
    });

    // ── Auto first-comment dispatch ────────────────────────────────────────
    if (result.ok && result.value.success && autoFirstComment && result.value.platformPostId) {
      const { queueService } = await import('@/lib/services/QueueService');
      await queueService.enqueueScheduledPublishTask({
        postId,
        workspaceId,
        variantId: `first-comment:${variantId}:${result.value.platformPostId}`,
        scheduledAt: new Date(Date.now() + 90_000),
        autoFirstComment,
      });
    }

    return NextResponse.json({ success: result.ok ? result.value.success : false });
  }

  // ── Standard: publish all variants for this post ───────────────────────
  logger.info('QStash background publish executing', { postId, workspaceId, isScheduled });
  await publishService.publishToAllPlatforms(postId, workspaceId);

  return NextResponse.json({ success: true });
}

export const POST = handler;
