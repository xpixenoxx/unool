import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { verifyWebhookSignature, extractWebhookSignature } from '@/lib/webhooks/verify';
import { Platform } from '@/lib/repositories/interfaces/IPlatformRepository';
import { SupabasePlatformRepository } from '@/lib/repositories/supabase/SupabasePlatformRepository';

const platformRepository = new SupabasePlatformRepository();

export async function POST(request: NextRequest) {
  try {
    const platformParam = request.nextUrl.searchParams.get('platform');
    const body = await request.text();

    if (!platformParam) {
      return NextResponse.json({ error: 'Platform parameter required' }, { status: 400 });
    }

    const platform = platformParam.toLowerCase() as Platform;
    const validPlatforms: Platform[] = ['linkedin', 'x', 'threads'];

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
  logger.info('Threads webhook received', { data });

  // Threads webhook via Meta Graph API subscriptions
  // Format: { object: 'thread', entry: [{ id: '...', changes: [{ field: 'thread', value: { ... } }] }] }

  const objectType = data.object as string;
  if (objectType !== 'thread') {
    logger.debug('Threads webhook: not a thread object', { objectType });
    return;
  }

  const entries = data.entry as Array<Record<string, unknown>> | undefined;
  if (!entries || !Array.isArray(entries)) return;

  for (const entry of entries) {
    const changes = entry.changes as Array<Record<string, unknown>> | undefined;
    if (!changes || !Array.isArray(changes)) continue;

    for (const change of changes) {
      if (change.field === 'thread') {
        const value = change.value as Record<string, unknown> | undefined;
        if (value) {
          await processThreadsPost(value);
        }
      }
    }
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