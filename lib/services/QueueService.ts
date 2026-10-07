import { Client } from '@upstash/qstash';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';

class QueueService {
  private client: Client | null = null;

  constructor() {
    if (config.QSTASH_TOKEN) {
      this.client = new Client({
        token: config.QSTASH_TOKEN,
      });
    } else {
      logger.warn('QSTASH_TOKEN is not configured. QueueService will not work.');
    }
  }

  /**
   * Enqueues a task to publish a post in the background via QStash.
   * @param postId The ID of the post to publish
   * @param workspaceId The ID of the workspace
   */
  async enqueuePublishTask(postId: string, workspaceId: string): Promise<string | null> {
    if (!this.client) {
      logger.error('Cannot enqueue publish task: QStash client is not initialized');
      return null;
    }

    try {
      // Create a full absolute URL for the webhook destination
      const webhookUrl = `${config.NEXT_PUBLIC_APP_URL}/api/webhooks/qstash/publish`;
      
      const res = await this.client.publishJSON({
        url: webhookUrl,
        body: { postId, workspaceId },
        // Add retries or delay if needed. For now, execute immediately.
        // QStash automatically retries on 500 errors.
        retries: 3, 
      });

      logger.info('Successfully enqueued publish task', { messageId: res.messageId, postId });
      return res.messageId;
    } catch (error) {
      logger.error('Failed to enqueue publish task to QStash', { 
        error: error instanceof Error ? error.message : String(error),
        postId 
      });
      return null;
    }
  }
}

export const queueService = new QueueService();
