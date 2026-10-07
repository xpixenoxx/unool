import { z } from 'zod';
import { logger } from '@/lib/logger';
import { GroqProvider } from '@/lib/ai/providers/GroqProvider';
import { fetchWithRetry } from '@/lib/utils/retry';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CommentClassification = 'positive' | 'question' | 'link_request' | 'negative' | 'spam' | 'unrelated';

export interface ClassifiedComment {
  classification: CommentClassification;
  confidence: number;
  suggestedReply: string;
  shouldAutoReply: boolean;
  shouldFlagForReview: boolean;
  reasoning: string;
}

export interface CommentEvent {
  commentId: string;
  mediaId: string;
  text: string;
  username: string;
  timestamp: string;
  parentId?: string;         // set if this is a reply to another comment
}

export interface AutomationConfig {
  enabled: boolean;
  autoReplyPositive: boolean;
  autoReplyQuestions: boolean;
  autoReplyLinkRequests: boolean;
  linkUrl?: string;          // URL to send via DM for link_request comments
  customInstructions?: string;
  flagNegative: boolean;
  flagSpam: boolean;
}

// Default config — safe defaults with owner review for risky categories
export const DEFAULT_AUTOMATION_CONFIG: AutomationConfig = {
  enabled: false,
  autoReplyPositive: true,
  autoReplyQuestions: true,
  autoReplyLinkRequests: true,
  flagNegative: true,
  flagSpam: true,
};

// ─── Classification Schema ──────────────────────────────────────────────────

const classificationSchema = z.object({
  classification: z.enum(['positive', 'question', 'link_request', 'negative', 'spam', 'unrelated']),
  confidence: z.number().min(0).max(1),
  suggestedReply: z.string(),
  shouldAutoReply: z.boolean(),
  shouldFlagForReview: z.boolean(),
  reasoning: z.string(),
});

// ─── Comment Classifier ─────────────────────────────────────────────────────

export class InstagramCommentAutomation {
  private groq: GroqProvider;

  constructor(groqApiKey: string) {
    this.groq = new GroqProvider(groqApiKey);
  }

  /**
   * Classifies a comment and generates a suggested reply.
   */
  async classifyAndGenerateReply(
    comment: CommentEvent,
    postCaption: string,
    config: AutomationConfig
  ): Promise<ClassifiedComment> {
    const prompt = `You are an intelligent Instagram comment classifier and reply generator.

CONTEXT:
- Post caption: "${postCaption}"
- Comment by @${comment.username}: "${comment.text}"
${config.customInstructions ? `- Owner instructions: "${config.customInstructions}"` : ''}

TASK:
Classify this comment into one of these categories:
- "positive": Compliments, praise, positive reactions, emojis only (❤️🔥👏 etc.)
- "question": Genuine questions about the post content, product, or topic
- "link_request": Asking for a link, URL, "where to buy", "send me the link", "link please", etc.
- "negative": Criticism, complaints, hate, trolling
- "spam": Promotional content, bot-like messages, irrelevant links
- "unrelated": Comments that don't fit any category above

REPLY RULES:
- For "positive": Write a warm, genuine thank-you reply. Keep it short (1-2 sentences). Use 1-2 emojis max.
- For "question": Write a helpful answer based on the post caption. Be concise and friendly.
- For "link_request": Write a short public reply saying you'll DM them the link. Example: "Just sent it to your DMs! 🔗"
- For "negative": Write a professional, empathetic response. Don't be defensive.
- For "spam" or "unrelated": Write "SKIP" as the reply.

Auto-reply rules:
- Auto-reply positive: ${config.autoReplyPositive}
- Auto-reply questions: ${config.autoReplyQuestions}
- Auto-reply link requests: ${config.autoReplyLinkRequests}
- Flag negative for owner review: ${config.flagNegative}
- Flag spam for owner review: ${config.flagSpam}

Return ONLY valid JSON matching this exact structure:
{
  "classification": "positive|question|link_request|negative|spam|unrelated",
  "confidence": 0.0-1.0,
  "suggestedReply": "the reply text",
  "shouldAutoReply": true/false,
  "shouldFlagForReview": true/false,
  "reasoning": "brief explanation of classification"
}`;

    const result = await this.groq.generateObject(prompt, classificationSchema, {
      temperature: 0.2,
      maxTokens: 500,
    });

    if (!result.ok) {
      logger.error('Comment classification failed', { error: result.error, commentId: comment.commentId });
      // Safe fallback: flag for review
      return {
        classification: 'unrelated',
        confidence: 0,
        suggestedReply: '',
        shouldAutoReply: false,
        shouldFlagForReview: true,
        reasoning: `Classification failed: ${result.error.message}`,
      };
    }

    return result.value;
  }

  /**
   * Posts a public reply to an Instagram comment.
   */
  async postPublicReply(
    accessToken: string,
    mediaId: string,
    commentId: string,
    message: string
  ): Promise<{ replyId: string } | null> {
    try {
      const params = new URLSearchParams({
        message,
        access_token: accessToken,
      });

      const response = await fetchWithRetry(
        `https://graph.instagram.com/v20.0/${commentId}/replies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Failed to post Instagram comment reply', {
          commentId,
          error: errorText,
          status: response.status,
        });
        return null;
      }

      const data = await response.json();
      logger.info('Instagram comment reply posted', { commentId, replyId: data.id });
      return { replyId: data.id };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error posting Instagram reply', { commentId, error: err });
      return null;
    }
  }

  /**
   * Sends a private DM to the commenter (e.g., for link requests).
   * Uses the Instagram Messaging API.
   */
  async sendPrivateMessage(
    accessToken: string,
    igUserId: string,
    recipientIgScopedId: string,
    message: string
  ): Promise<{ messageId: string } | null> {
    try {
      const response = await fetchWithRetry(
        `https://graph.instagram.com/v20.0/${igUserId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            recipient: { id: recipientIgScopedId },
            message: { text: message },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Failed to send Instagram DM', {
          recipientIgScopedId,
          error: errorText,
          status: response.status,
        });
        return null;
      }

      const data = await response.json();
      logger.info('Instagram DM sent', { recipientIgScopedId, messageId: data.message_id });
      return { messageId: data.message_id };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error sending Instagram DM', { recipientIgScopedId, error: err });
      return null;
    }
  }

  /**
   * Subscribes a user's Instagram account to the app's webhook fields.
   * Must be called after OAuth to ensure comments arrive for real users.
   */
  static async subscribeAccountToWebhook(
    accessToken: string,
    igUserId: string
  ): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        subscribed_fields: 'comments,messages',
        access_token: accessToken,
      });

      const response = await fetchWithRetry(
        `https://graph.instagram.com/v20.0/${igUserId}/subscribed_apps`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Failed to subscribe Instagram account to webhook', {
          igUserId,
          error: errorText,
          status: response.status,
        });
        return false;
      }

      const data = await response.json();
      logger.info('Instagram account subscribed to webhook', { igUserId, success: data.success });
      return data.success === true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error subscribing Instagram account to webhook', { igUserId, error: err });
      return false;
    }
  }
}
