import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { verifyWebhookSignature, extractWebhookSignature } from '@/lib/webhooks/verify';
import { Platform } from '@/lib/repositories/interfaces/IPlatformRepository';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { config } from '@/lib/config/schema';
import { queueService, type FacebookOutboundJobParams, type ThreadsOutboundJobParams } from '@/lib/services/QueueService';

const platformRepository = new SupabasePlatformRepository();

// ── GET: Meta hub.challenge verification for Facebook and Threads webhooks ──
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');
  const platform = request.nextUrl.searchParams.get('platform');

  if (mode !== 'subscribe' || !challenge) {
    return NextResponse.json({ error: 'Invalid verification request' }, { status: 400 });
  }

  const expectedToken =
    platform === 'facebook'
      ? (config.FACEBOOK_WEBHOOK_SECRET || config.META_WEBHOOK_SECRET || config.META_WEBHOOK_VERIFY_TOKEN || '')
      : (config.THREADS_WEBHOOK_SECRET || config.META_WEBHOOK_SECRET || config.META_WEBHOOK_VERIFY_TOKEN || '');

  if (token === expectedToken) {
    logger.info('Meta webhook hub.challenge verified', { platform });
    return new Response(challenge, { status: 200 });
  }

  logger.warn('Meta webhook hub.challenge token mismatch', { platform });
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const platformParam = request.nextUrl.searchParams.get('platform');
    const body = await request.text();

    if (!platformParam) {
      return NextResponse.json({ error: 'Platform parameter required' }, { status: 400 });
    }

    const platform = platformParam.toLowerCase() as Platform;
    const validPlatforms: Platform[] = ['linkedin', 'x', 'threads', 'facebook'];

    if (!validPlatforms.includes(platform)) {
      return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
    }

    // Extract and verify webhook signature
    const signature = extractWebhookSignature(request, platform);
    if (!signature) {
      logger.warn('Missing webhook signature', { platform });
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const isValid = await verifyWebhookSignature(body, signature, platform);
    if (!isValid) {
      logger.warn('Invalid webhook signature', { platform });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(body);
    } catch {
      logger.warn('Invalid webhook payload JSON', { platform });
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Handle different platform webhook payloads
    try {
      switch (platform) {
        case 'linkedin':
          await handleLinkedInWebhook(data);
          break;
        case 'x':
          await handleXWebhook(data);
          break;
        case 'threads':
          await handleThreadsWebhook(data);
          break;
        case 'facebook':
          await handleFacebookWebhook(data);
          break;
      }
    } catch (handlerError) {
      const err = handlerError instanceof Error ? handlerError : new Error(String(handlerError));
      logger.error('Webhook handler error', { platform, error: err });
      // Still return 200 to avoid webhook retries for handler errors
      // but log the error for investigation
      return NextResponse.json({ success: true, warning: 'Handler error logged' });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Webhook processing error', { error: err });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleLinkedInWebhook(data: Record<string, unknown>): Promise<void> {
  logger.info('LinkedIn webhook received', { data });

  // LinkedIn webhook format for post events:
  // { value: { object: 'post' | 'comment', elementId: 'urn:li:share:...', ... } }
  const value = data.value as Record<string, unknown> | undefined;
  if (!value) {
    logger.warn('LinkedIn webhook missing value object');
    return;
  }

  const objectType = value.object as string;
  const elementId = value.elementId as string;

  if (objectType === 'post' && elementId) {
    // Extract the post ID from the URN
    // Format: urn:li:share:123456789 (for UGC posts) or urn:li:ugcPost:123456789
    const postId = extractLinkedInPostId(elementId);
    if (postId) {
      await updateEngagementFromLinkedIn(postId, value);
      logger.info('LinkedIn post engagement updated', { platformPostId: postId });
    }
  } else if (objectType === 'comment' && elementId) {
    // Handle comment events if needed
    logger.debug('LinkedIn comment event received', { elementId });
  }
}

/**
 * Extracts the numeric post ID from LinkedIn URN
 * URN formats: urn:li:share:123456789, urn:li:ugcPost:123456789
 */
function extractLinkedInPostId(urn: string): string | null {
  const match = urn.match(/urn:li:(?:share|ugcPost):(\d+)/);
  return match ? match[1] : null;
}

async function updateEngagementFromLinkedIn(platformPostId: string, linkedInData: Record<string, unknown>): Promise<void> {
  try {
    // Find the platform post by platform_post_id
    const post = await platformRepository.findPlatformPostByPlatformPostId(platformPostId);
    if (!post) {
      logger.warn('Platform post not found for LinkedIn engagement update', { platformPostId });
      return;
    }

    // Extract engagement data from LinkedIn webhook payload
    // LinkedIn sends: likeSummary, commentSummary, shareSummary, etc.
    const engagement: Record<string, unknown> = {};

    if (linkedInData.likeSummary) {
      engagement.likes = (linkedInData.likeSummary as Record<string, unknown>).totalLikes || 0;
    }
    if (linkedInData.commentSummary) {
      engagement.comments = (linkedInData.commentSummary as Record<string, unknown>).totalComments || 0;
    }
    if (linkedInData.shareSummary) {
      engagement.shares = (linkedInData.shareSummary as Record<string, unknown>).totalShares || 0;
    }

    // Merge with existing engagement
    const mergedEngagement = { ...post.engagement, ...engagement };
    await platformRepository.updateEngagement(post.id, mergedEngagement);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update LinkedIn engagement', { platformPostId, error: err });
    throw err; // Re-throw to trigger webhook error handling
  }
}

async function handleXWebhook(data: Record<string, unknown>): Promise<void> {
  logger.info('X webhook received', { data });

  // Twitter Account Activity API (AAAPI) webhook format:
  // { tweet_create_events: [...], direct_message_events: [...], ... }

  // Handle tweet create events
  if (data.tweet_create_events && Array.isArray(data.tweet_create_events)) {
    for (const tweet of data.tweet_create_events) {
      await processXTweetCreate(tweet as Record<string, unknown>);
    }
  }

  // Handle tweet update events (for engagement updates)
  if (data.tweet_update_events && Array.isArray(data.tweet_update_events)) {
    for (const update of data.tweet_update_events) {
      await processXTweetUpdate(update as Record<string, unknown>);
    }
  }
}

async function processXTweetCreate(tweet: Record<string, unknown>): Promise<void> {
  const tweetId = tweet.id_str as string;
  if (!tweetId) return;

  try {
    const post = await platformRepository.findPlatformPostByPlatformPostId(tweetId);
    if (!post) {
      logger.debug('Platform post not found for X tweet create (may be new post)', { tweetId });
      return;
    }

    // New tweet posted - store initial engagement (usually 0)
    const engagement: Record<string, unknown> = {
      tweets: (post.engagement.tweets as number || 0) + 1,
      likes: 0,
      retweets: 0,
      replies: 0,
      quotes: 0,
    };
    await platformRepository.updateEngagement(post.id, engagement);
    logger.info('X tweet create processed', { tweetId, platformPostId: post.id });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error processing X tweet create', { tweetId, error: err });
  }
}

async function processXTweetUpdate(tweet: Record<string, unknown>): Promise<void> {
  const tweetId = tweet.id_str as string;
  if (!tweetId) return;

  try {
    const post = await platformRepository.findPlatformPostByPlatformPostId(tweetId);
    if (!post) {
      logger.debug('Platform post not found for X tweet update', { tweetId });
      return;
    }

    // Extract public_metrics for engagement
    const metrics = tweet.public_metrics as Record<string, unknown>;
    if (!metrics) return;

    const engagement: Record<string, unknown> = {
      likes: metrics.like_count || 0,
      retweets: metrics.retweet_count || 0,
      replies: metrics.reply_count || 0,
      quotes: metrics.quote_count || 0,
    };

    await platformRepository.updateEngagement(post.id, engagement);
    logger.info('X tweet engagement updated', { tweetId, platformPostId: post.id, engagement });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error processing X tweet update', { tweetId, error: err });
  }
}

async function handleThreadsWebhook(data: Record<string, unknown>): Promise<void> {
  logger.info('Threads webhook received', { object: data.object });

  // Real Threads webhook shape:
  // { object: 'threads', entry: [{ id: '<threadsUserId>', changes: [{ field: 'replies'|'mentions', value: { id, text, from: {id}, media: {id}, timestamp } }] }] }
  const entries = data.entry as Array<Record<string, unknown>> | undefined;
  if (!entries || !Array.isArray(entries)) return;

  for (const entry of entries) {
    const changes = entry.changes as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(changes)) continue;

    for (const change of changes) {
      if (change.field === 'replies' || change.field === 'mentions') {
        await processThreadsReplyEvent(
          entry.id as string,
          change.value as Record<string, unknown>,
          change.field as 'replies' | 'mentions'
        );
      } else if (change.field === 'messages' || change.field === 'dm') {
        logger.warn('Threads webhook: DM/messaging event received but Threads has no messaging API — discarding', {
          field: change.field,
        });
      } else {
        // Legacy engagement update path (field === 'thread')
        const value = change.value as Record<string, unknown> | undefined;
        if (value && change.field === 'thread') {
          await processThreadsPost(value);
        }
      }
    }
  }
}

async function processThreadsReplyEvent(
  threadsUserId: string,
  value: Record<string, unknown>,
  field: 'replies' | 'mentions'
): Promise<void> {
  const replyId = value?.id as string | undefined;
  const replyText = value?.text as string | undefined;
  const replierId = (value?.from as Record<string, unknown> | undefined)?.id as string | undefined;
  const postId = (value?.media as Record<string, unknown> | undefined)?.id as string | undefined;

  if (!replyId || !threadsUserId) {
    logger.debug('Threads reply event missing id or threadsUserId — skipping', { replyId, threadsUserId });
    return;
  }

  try {
    // Load threads automation config by threadsUserId
    const { data: cfg } = await supabaseAdmin
      .from('threads_automation_config')
      .select('*')
      .eq('threads_user_id', threadsUserId)
      .eq('enabled', true)
      .maybeSingle();

    if (!cfg) {
      logger.debug('Threads automation not configured or disabled for user', { threadsUserId });
      return;
    }

    // Dedup check
    const { data: existing } = await supabaseAdmin
      .from('threads_reply_logs')
      .select('id')
      .eq('reply_id', replyId)
      .maybeSingle();

    if (existing) {
      logger.debug('Threads reply already processed (dedup)', { replyId });
      return;
    }

    // Load platform connection
    const { data: connections } = await supabaseAdmin
      .from('platform_connections')
      .select('id')
      .eq('workspace_id', cfg.workspace_id)
      .eq('platform', 'threads')
      .eq('status', 'connected')
      .limit(1);

    const connectionId = connections?.[0]?.id;
    if (!connectionId) {
      logger.warn('No active Threads connection for workspace', { workspaceId: cfg.workspace_id });
      return;
    }

    const jobParams: ThreadsOutboundJobParams = {
      jobId: `threads-${replyId}-${Date.now()}`,
      jobType: 'reply',
      workspaceId: cfg.workspace_id,
      connectionId,
      threadsUserId,
      replyId,
      postId: postId || undefined,
      replyText: replyText || undefined,
      replierId: replierId || undefined,
      eventType: field === 'mentions' ? 'mention' : 'reply',
    };

    await queueService.enqueueThreadsOutboundTask(jobParams);
    logger.info('Threads reply event enqueued', { replyId, threadsUserId, field });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error processing Threads reply event', { replyId, threadsUserId, error: err });
  }
}

async function handleFacebookWebhook(data: Record<string, unknown>): Promise<void> {
  logger.info('Facebook webhook received', { object: data.object });

  const entries = data.entry as Array<Record<string, unknown>> | undefined;
  if (!entries || !Array.isArray(entries)) return;

  for (const entry of entries) {
    const pageId = entry.id as string | undefined;
    if (!pageId) continue;

    // ── Feed (comment) events ──
    const changes = entry.changes as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(changes)) {
      for (const change of changes) {
        if (change.field === 'feed') {
          const value = change.value as Record<string, unknown> | undefined;
          if (value?.item === 'comment' && value?.verb === 'add') {
            await processFacebookCommentEvent(pageId, value);
          }
        }
      }
    }

    // ── Messenger events ──
    const messaging = entry.messaging as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(messaging)) {
      for (const msg of messaging) {
        const msgObj = msg.message as Record<string, unknown> | undefined;
        const sender = msg.sender as Record<string, unknown> | undefined;
        if (msgObj?.mid && sender?.id) {
          await processFacebookMessengerEvent(pageId, msg);
        }
      }
    }
  }
}

async function processFacebookCommentEvent(pageId: string, value: Record<string, unknown>): Promise<void> {
  const commentId = value.comment_id as string | undefined;
  const postId = value.post_id as string | undefined;
  const commentText = value.message as string | undefined;
  const from = value.from as Record<string, unknown> | undefined;
  const commenterId = from?.id as string | undefined;
  const commenterName = from?.name as string | undefined;

  if (!commentId || !pageId) return;

  // Skip self-authored comments (page replying to itself)
  if (commenterId === pageId) {
    logger.debug('Facebook webhook: skipping self-authored comment', { commentId, pageId });
    return;
  }

  try {
    // Load facebook automation config
    const { data: cfg } = await supabaseAdmin
      .from('facebook_automation_config')
      .select('*')
      .eq('page_id', pageId)
      .eq('enabled', true)
      .maybeSingle();

    if (!cfg) {
      logger.debug('Facebook automation not configured or disabled for page', { pageId });
      return;
    }

    // Dedup check
    const { data: existing } = await supabaseAdmin
      .from('facebook_comment_logs')
      .select('id')
      .eq('comment_id', commentId)
      .maybeSingle();

    if (existing) {
      logger.debug('Facebook comment already processed (dedup)', { commentId });
      return;
    }

    // Load platform connection
    const { data: connections } = await supabaseAdmin
      .from('platform_connections')
      .select('id')
      .eq('workspace_id', cfg.workspace_id)
      .eq('platform', 'facebook')
      .eq('status', 'connected')
      .limit(1);

    const connectionId = connections?.[0]?.id;
    if (!connectionId) {
      logger.warn('No active Facebook connection for workspace', { workspaceId: cfg.workspace_id });
      return;
    }

    const jobParams: FacebookOutboundJobParams = {
      jobId: `fb-comment-${commentId}-${Date.now()}`,
      jobType: 'comment_reply',
      workspaceId: cfg.workspace_id,
      connectionId,
      pageId,
      commentId,
      postId: postId || undefined,
      commentText: commentText || undefined,
      commenterName: commenterName || undefined,
      commenterId: commenterId || undefined,
      commentTimestamp: new Date().toISOString(),
    };

    await queueService.enqueueFacebookOutboundTask(jobParams);
    logger.info('Facebook comment event enqueued', { commentId, pageId });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error processing Facebook comment event', { commentId, pageId, error: err });
  }
}

async function processFacebookMessengerEvent(pageId: string, msg: Record<string, unknown>): Promise<void> {
  const msgObj = msg.message as Record<string, unknown> | undefined;
  const sender = msg.sender as Record<string, unknown> | undefined;
  const messageId = msgObj?.mid as string | undefined;
  const senderId = sender?.id as string | undefined;
  const dmText = msgObj?.text as string | undefined;

  if (!messageId || !senderId || senderId === pageId) return;

  try {
    const { data: cfg } = await supabaseAdmin
      .from('facebook_automation_config')
      .select('*')
      .eq('page_id', pageId)
      .eq('enabled', true)
      .maybeSingle();

    if (!cfg) return;

    const { data: existing } = await supabaseAdmin
      .from('facebook_dm_logs')
      .select('id')
      .eq('message_id', messageId)
      .maybeSingle();

    if (existing) {
      logger.debug('Facebook Messenger DM already processed (dedup)', { messageId });
      return;
    }

    const { data: connections } = await supabaseAdmin
      .from('platform_connections')
      .select('id')
      .eq('workspace_id', cfg.workspace_id)
      .eq('platform', 'facebook')
      .eq('status', 'connected')
      .limit(1);

    const connectionId = connections?.[0]?.id;
    if (!connectionId) return;

    const jobParams: FacebookOutboundJobParams = {
      jobId: `fb-dm-${messageId}-${Date.now()}`,
      jobType: 'messenger_reply',
      workspaceId: cfg.workspace_id,
      connectionId,
      pageId,
      messageId,
      senderId,
      dmText: dmText || undefined,
    };

    await queueService.enqueueFacebookOutboundTask(jobParams);
    logger.info('Facebook Messenger event enqueued', { messageId, pageId });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error processing Facebook Messenger event', { messageId, pageId, error: err });
  }
}

async function processThreadsPost(value: Record<string, unknown>): Promise<void> {
  const postId = value.id as string;
  if (!postId) return;

  try {
    const post = await platformRepository.findPlatformPostByPlatformPostId(postId);
    if (!post) {
      logger.debug('Platform post not found for Threads post', { postId });
      return;
    }

    // Extract engagement metrics
    const engagement: Record<string, unknown> = {};

    if (typeof value.like_count === 'number') engagement.likes = value.like_count;
    if (typeof value.replies_count === 'number') engagement.replies = value.replies_count;
    if (typeof value.reposts_count === 'number') engagement.reposts = value.reposts_count;
    if (typeof value.quotes_count === 'number') engagement.quotes = value.quotes_count;

    if (Object.keys(engagement).length > 0) {
      await platformRepository.updateEngagement(post.id, engagement);
      logger.info('Threads post engagement updated', { postId, platformPostId: post.id, engagement });
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error processing Threads post', { postId, error: err });
  }
}