import { Client } from '@upstash/qstash';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

export interface EnqueuePublishParams {
  postId: string;
  workspaceId: string;
}

export interface SchedulePublishParams {
  postId: string;
  workspaceId: string;
  variantId?: string;          // If set, only publish this one variant (cascading mode)
  scheduledAt: Date;
  autoFirstComment?: string;   // Fire a first-comment 90s after publishing
}

export interface InstagramOutboundJobParams {
  jobId: string;
  jobType: 'comment_reply' | 'dm_reply';
  workspaceId: string;
  connectionId: string;
  // Comment fields
  commentId?: string;
  mediaId?: string;
  commentText?: string;
  commenterUsername?: string;
  commentTimestamp?: string;
  // DM fields
  messageId?: string;
  senderId?: string;
  senderUsername?: string;
  dmText?: string;
  // Optional delay in seconds (used when deferring velocity-throttled jobs to next hour bucket)
  delaySeconds?: number;
}

class QueueService {
  private client: Client | null = null;

  constructor() {
    if (config.QSTASH_TOKEN) {
      this.client = new Client({ token: config.QSTASH_TOKEN });
    } else {
      logger.warn('QSTASH_TOKEN is not configured. QueueService will not work.');
    }
  }

  private get webhookUrl(): string {
    return `${config.NEXT_PUBLIC_APP_URL}/api/webhooks/qstash/publish`;
  }

  private get instagramOutboundWebhookUrl(): string {
    return `${config.NEXT_PUBLIC_APP_URL}/api/webhooks/qstash/instagram-outbound`;
  }

  /**
   * Returns true if QStash is configured and available for background queuing.
   */
  isAvailable(): boolean {
    return !!this.client && !!config.NEXT_PUBLIC_APP_URL;
  }

  /**
   * Enqueues an immediate (no delay) task to publish all variants of a post.
   * Used by the direct broadcast flow and the existing publish pipeline.
   */
  async enqueuePublishTask(postId: string, workspaceId: string): Promise<string | null> {
    if (!this.client) {
      logger.error('Cannot enqueue publish task: QStash client is not initialized');
      return null;
    }

    try {
      const res = await this.client.publishJSON({
        url: this.webhookUrl,
        body: { postId, workspaceId, isScheduled: false },
        retries: 3,
        headers: {
          'Upstash-Timeout': '300s',
        },
      });

      logger.info('Enqueued immediate publish task', { messageId: res.messageId, postId });
      return res.messageId;
    } catch (error) {
      logger.error('Failed to enqueue immediate publish task', {
        error: new Error(error instanceof Error ? error.message : String(error)),
        postId,
      });
      return null;
    }
  }

  /**
   * Enqueues a delayed task to publish a post at a future time.
   * Uses QStash notBefore to delay delivery up to 7 days.
   * Supports per-variant cascading mode and auto-first-comment dispatch.
   */
  async enqueueScheduledPublishTask(params: SchedulePublishParams): Promise<string | null> {
    if (!this.client) {
      logger.error('Cannot schedule task: QStash client not initialized');
      return null;
    }

    const nowMs = Date.now();
    if (params.scheduledAt.getTime() <= nowMs) {
      logger.warn('Scheduled time is in the past — publishing immediately', { postId: params.postId });
      return this.enqueuePublishTask(params.postId, params.workspaceId);
    }

    const maxScheduleMs = 365 * 24 * 60 * 60 * 1000; // Up to 1 year
    if (params.scheduledAt.getTime() - nowMs > maxScheduleMs) {
      logger.error('Scheduled time is more than 1 year in the future — rejected', {
        postId: params.postId,
        scheduledAt: params.scheduledAt.toISOString(),
      });
      return null;
    }

    // QStash free/standard tier limits `notBefore` delay to 7 days.
    // For posts scheduled >7 days out, return null gracefully so the post remains
    // `status = 'scheduled'` in PostgreSQL and is picked up by `/api/cron/publish-scheduled`.
    const qstashMaxDelayMs = 7 * 24 * 60 * 60 * 1000;
    if (params.scheduledAt.getTime() - nowMs > qstashMaxDelayMs) {
      logger.info('Scheduled time is >7 days in the future — stored in DB for cron pickup', {
        postId: params.postId,
        scheduledAt: params.scheduledAt.toISOString(),
      });
      return null;
    }

    try {
      // QStash API expects notBefore as a Unix timestamp in seconds
      const notBeforeSeconds = Math.floor(params.scheduledAt.getTime() / 1000);
      const dedupeKey = `schedule-${params.postId}-${params.variantId ?? 'all'}-${notBeforeSeconds}`;

      const res = await this.client.publishJSON({
        url: this.webhookUrl,
        body: {
          postId: params.postId,
          workspaceId: params.workspaceId,
          variantId: params.variantId ?? null,
          autoFirstComment: params.autoFirstComment ?? null,
          isScheduled: true,
        },
        notBefore: notBeforeSeconds,
        retries: 3,
        headers: {
          'Upstash-Timeout': '300s',
        },
        deduplicationId: dedupeKey,
      });

      logger.info('Scheduled publish task enqueued via QStash', {
        messageId: res.messageId,
        postId: params.postId,
        variantId: params.variantId,
        scheduledAt: params.scheduledAt.toISOString(),
      });
      return res.messageId;
    } catch (error) {
      logger.error('Failed to schedule publish task via QStash', {
        error: new Error(error instanceof Error ? error.message : String(error)),
        postId: params.postId,
      });
      return null;
    }
  }

  /**
   * Enqueues an asynchronous durable task for Instagram outbound comment reply or DM.
   * Utilizes QStash retry limit (3 retries), exponential backoff, and idempotency deduplicationId.
   * Supports `delaySeconds` for rate-limit deferral to the next hourly velocity bucket.
   */
  async enqueueInstagramOutboundTask(params: InstagramOutboundJobParams): Promise<string | null> {
    if (!this.client) {
      logger.error('Cannot enqueue Instagram outbound task: QStash client is not initialized');
      return null;
    }

    try {
      const targetId = params.commentId || params.messageId;
      const delaySec = params.delaySeconds && params.delaySeconds > 0 ? Math.floor(params.delaySeconds) : 0;
      const notBeforeSeconds = delaySec > 0 ? Math.floor(Date.now() / 1000) + delaySec : undefined;
      const bucketSuffix = notBeforeSeconds ? `-defer-${Math.floor(notBeforeSeconds / 3600)}` : '';
      const dedupeKey = `ig-outbound-${params.jobType}-${targetId}${bucketSuffix}`;

      const publishOptions: Parameters<Client['publishJSON']>[0] = {
        url: this.instagramOutboundWebhookUrl,
        body: params,
        retries: 3,
        headers: {
          'Upstash-Timeout': '60s',
        },
        deduplicationId: dedupeKey,
        ...(notBeforeSeconds ? { notBefore: notBeforeSeconds } : {}),
      };

      const res = await this.client.publishJSON(publishOptions);

      logger.info('Enqueued Instagram outbound task via QStash', {
        messageId: res.messageId,
        jobId: params.jobId,
        jobType: params.jobType,
        targetId,
        delaySeconds: delaySec,
      });
      return res.messageId;
    } catch (error) {
      logger.error('Failed to enqueue Instagram outbound task via QStash', {
        error: new Error(error instanceof Error ? error.message : String(error)),
        jobId: params.jobId,
      });
      return null;
    }
  }

  /**
   * Cancels a scheduled QStash message by its messageId.
   * Called when a user cancels or reschedules a post.
   */
  async cancelScheduledTask(messageId: string): Promise<boolean> {
    if (!this.client) {
      logger.warn('Cannot cancel task: QStash client not initialized');
      return false;
    }
    try {
      await this.client.messages.delete(messageId);
      logger.info('Cancelled scheduled QStash message', { messageId });
      return true;
    } catch (error) {
      // QStash returns 404 if the message already fired or was already cancelled.
      // That's fine — the DB status check in the webhook will catch it.
      logger.warn('Could not delete QStash message (may have already fired)', {
        messageId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}

export const queueService = new QueueService();
