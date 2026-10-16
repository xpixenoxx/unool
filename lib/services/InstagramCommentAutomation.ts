import { z } from 'zod';
import { logger } from '@/lib/logger';
import { GroqProvider } from '@/lib/ai/providers/GroqProvider';
import { fetchWithRetry } from '@/lib/utils/retry';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CommentClassification =
  | 'positive'
  | 'question'
  | 'link_request'
  | 'purchase_intent'
  | 'negative'
  | 'spam'
  | 'harmful'
  | 'unrelated';

export type DmClassification =
  | 'question'
  | 'link_request'
  | 'purchase_intent'
  | 'support'
  | 'spam'
  | 'harmful'
  | 'unrelated';

export interface ClassifiedComment {
  classification: CommentClassification;
  confidence: number;
  suggestedReply: string;
  suggestedDM: string | null;
  threadHook: string | null;
  leadScore: number;
  shouldAutoReply: boolean;
  shouldSendDM: boolean;
  shouldFlagForReview: boolean;
  reasoning: string;
}

export interface ClassifiedDM {
  classification: DmClassification;
  confidence: number;
  suggestedReply: string;
  leadScore: number;
  shouldAutoReply: boolean;
  shouldEscalate: boolean;
  reasoning: string;
}

export interface CommentEvent {
  commentId: string;
  mediaId: string;
  text: string;
  username: string;
  timestamp: string;
  parentId?: string; // set if this is a reply to another comment
}

export interface DmEvent {
  messageId: string;
  senderId: string;
  senderUsername?: string;
  text: string;
  timestamp: string;
  threadId?: string;
}

export interface AutomationConfig {
  enabled: boolean;
  autoReplyPositive: boolean;
  autoReplyQuestions: boolean;
  autoReplyLinkRequests: boolean;
  autoReplyPurchaseIntent?: boolean;
  linkUrl?: string;
  customInstructions?: string;
  brandPersona?: string;
  flagNegative: boolean;
  flagSpam: boolean;
  autoHideSpam?: boolean;
  maxRepliesPerHour?: number;
  jitterMinSeconds?: number;
  jitterMaxSeconds?: number;
  threadChainingEnabled?: boolean;
  dmTemplate?: string;
  // Inbound DM automation
  dmAutoReplyEnabled?: boolean;
  dmWelcomeMessage?: string;
  dmKnowledgeBase?: string;
  dmEscalationEnabled?: boolean;
  dmMaxRepliesPerHour?: number;
}

// Default config — safe defaults with owner review for risky categories
export const DEFAULT_AUTOMATION_CONFIG: AutomationConfig = {
  enabled: false,
  autoReplyPositive: true,
  autoReplyQuestions: true,
  autoReplyLinkRequests: true,
  autoReplyPurchaseIntent: true,
  flagNegative: true,
  flagSpam: true,
  autoHideSpam: false,
  maxRepliesPerHour: 30,
  jitterMinSeconds: 25,
  jitterMaxSeconds: 120,
  threadChainingEnabled: true,
  dmAutoReplyEnabled: false,
  dmEscalationEnabled: true,
  dmMaxRepliesPerHour: 20,
};

// ─── Upgraded Classification Schema ─────────────────────────────────────────

const classificationSchema = z.object({
  classification: z.enum([
    'positive',
    'question',
    'link_request',
    'purchase_intent',
    'negative',
    'spam',
    'harmful',
    'unrelated',
  ]),
  confidence: z.number().min(0).max(1),
  suggestedReply: z.string(),
  suggestedDM: z.string().nullable().default(null),
  threadHook: z.string().nullable().default(null),
  leadScore: z.number().min(0).max(3),
  shouldAutoReply: z.boolean(),
  shouldSendDM: z.boolean(),
  shouldFlagForReview: z.boolean(),
  reasoning: z.string(),
});

const dmClassificationSchema = z.object({
  classification: z.enum([
    'question',
    'link_request',
    'purchase_intent',
    'support',
    'spam',
    'harmful',
    'unrelated',
  ]),
  confidence: z.number().min(0).max(1),
  suggestedReply: z.string(),
  leadScore: z.number().min(0).max(3),
  shouldAutoReply: z.boolean(),
  shouldEscalate: z.boolean(),
  reasoning: z.string(),
});

// ─── Comment Classifier ─────────────────────────────────────────────────────

export class InstagramCommentAutomation {
  private groq: GroqProvider;

  constructor(groqApiKey: string) {
    this.groq = new GroqProvider(groqApiKey);
  }

  /**
   * Classifies a comment and generates a highly varied, brand-aligned reply.
   * Includes thread-chaining hook, DM message, and lead scoring.
   */
  async classifyAndGenerateReply(
    comment: CommentEvent,
    postCaption: string,
    config: AutomationConfig,
    recentReplies: string[] = []
  ): Promise<ClassifiedComment> {
    const linkInstruction = config.linkUrl
      ? `The link/resource URL to DM is: ${config.linkUrl}`
      : 'No link URL configured — do not promise to send a link.';

    const prompt = `You are an autonomous Instagram engagement engine for a brand account.

═══════════════════════════════════════════════════════════
CONTEXT
═══════════════════════════════════════════════════════════
Post caption: "${postCaption}"
Comment by @${comment.username}: "${comment.text}"
${config.brandPersona ? `Brand voice: "${config.brandPersona}"` : ''}
${config.customInstructions ? `Custom rules: "${config.customInstructions}"` : ''}
${linkInstruction}
Recent replies already sent (DO NOT repeat these patterns):
${recentReplies.slice(-10).map((r, i) => `  ${i + 1}. "${r}"`).join('\n') || '  (none yet)'}

═══════════════════════════════════════════════════════════
CLASSIFICATION RULES
═══════════════════════════════════════════════════════════
Classify into ONE category:
- "positive": Friendly greetings (e.g. "Hi", "Hey", "Hello", "GM"), compliments, praise, friendly reactions, emoji reactions (❤️🔥👏)
- "question": Genuine questions about the content, product, process
- "link_request": ANY form of asking for a link, resource, template, file — even implicit ones like "Where can I get this?", "Send it to me", "Need this"
- "purchase_intent": Price inquiries, buying signals ("How much?", "Shut up and take my money", "Need this for my agency")
- "negative": Criticism, complaints, anger, disappointment
- "spam": Bot comments, self-promotion, crypto/forex scams, irrelevant links
- "harmful": Terrorism, hate speech, doxxing, CSAM references, threats
- "unrelated": Comments that don't fit any category

═══════════════════════════════════════════════════════════
REPLY GENERATION RULES (CRITICAL — READ CAREFULLY)
═══════════════════════════════════════════════════════════

RULE 1: NEVER write a generic reply. Every reply MUST reference something specific from either the comment text or the post caption. Bad: "Thanks!" Good: "That sprint workflow shift is a real unlock—"

RULE 2: Every public reply for positive/question/link_request MUST end with a SHORT conversational question (the "thread hook") to drive a second reply. Bad: "Sent it to your DMs!" Good: "Just sent it over! Are you building this for personal use or a client project?"

RULE 3: NEVER start with the same opening word as any of the recent replies listed above. NEVER use the same emoji placement pattern. Vary sentence length and tone.

RULE 4: For "negative" — write a professional, empathetic, non-defensive response. Acknowledge frustration, offer to resolve in DMs. Never argue.

RULE 5: For "spam" or "harmful" — set suggestedReply to "SKIP" and shouldFlagForReview to true.

RULE 6: For "link_request" or "purchase_intent" — write a short public reply saying you'll DM them, then provide a separate suggestedDM with the link (if configured) and a personal greeting.

RULE 7: Strip ALL AI slop: "delve", "tapestry", "leverage", "seamlessly", "game-changer", "robust", "innovative", "transformative". Write like a real human running this account.

RULE 8: Maximum 2 emojis per reply. No emoji walls. No 🙏🙏🙏.

RULE 9: threadHook should be ONLY the question portion (no full reply), or null for harmful/spam/unrelated.

LEAD SCORING:
- 0: Not a lead (positive emoji, spam, unrelated)
- 1: Warm — asked a question, showed interest
- 2: Hot — link request, purchase question, mentioned budget/agency/clients
- 3: Ready to buy — explicit "how do I pay", "send invoice", "how much for X"

═══════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════
Return ONLY valid JSON (no markdown, no explanation):
{
  "classification": "positive|question|link_request|purchase_intent|negative|spam|harmful|unrelated",
  "confidence": 0.0-1.0,
  "suggestedReply": "the public comment reply text (or SKIP)",
  "suggestedDM": "the private DM text or null",
  "threadHook": "the conversational question embedded in the reply, or null",
  "leadScore": 0-3,
  "shouldAutoReply": true/false,
  "shouldSendDM": true/false,
  "shouldFlagForReview": true/false,
  "reasoning": "1-sentence explanation"
}`;

    const result = await this.groq.generateObject(prompt, classificationSchema, {
      temperature: 0.65,
      maxTokens: 600,
    });

    if (!result.ok) {
      logger.error('Comment classification failed', { error: result.error, commentId: comment.commentId });
      return {
        classification: 'unrelated',
        confidence: 0,
        suggestedReply: '',
        suggestedDM: null,
        threadHook: null,
        leadScore: 0,
        shouldAutoReply: false,
        shouldSendDM: false,
        shouldFlagForReview: true,
        reasoning: `Classification failed: ${result.error.message}`,
      };
    }

    // Apply auto-reply flags based on automation config
    const classified = result.value;
    classified.shouldAutoReply = this.resolveAutoReplyFlag(classified, config);
    classified.shouldSendDM = classified.shouldSendDM && !!config.linkUrl;

    return classified;
  }

  /**
   * Classifies an inbound DM and generates a reply.
   * Used for the inbound DM automation channel.
   */
  async classifyAndReplyDM(
    dm: DmEvent,
    config: AutomationConfig
  ): Promise<ClassifiedDM> {
    if (!config.dmAutoReplyEnabled) {
      return {
        classification: 'unrelated',
        confidence: 1,
        suggestedReply: '',
        leadScore: 0,
        shouldAutoReply: false,
        shouldEscalate: false,
        reasoning: 'DM automation disabled',
      };
    }

    const prompt = `You are an AI customer service agent for an Instagram account.
Your job is to respond to inbound DMs professionally and helpfully.

═══════════════════════════════════════════════════════════
CONTEXT
═══════════════════════════════════════════════════════════
DM from @${dm.senderUsername || dm.senderId}: "${dm.text}"
${config.brandPersona ? `Brand voice: "${config.brandPersona}"` : ''}
${config.customInstructions ? `Custom rules: "${config.customInstructions}"` : ''}
${config.dmKnowledgeBase ? `Knowledge base:\n${config.dmKnowledgeBase}` : ''}
${config.linkUrl ? `Main resource URL: ${config.linkUrl}` : ''}
${config.dmWelcomeMessage ? `Default welcome message: "${config.dmWelcomeMessage}"` : ''}

═══════════════════════════════════════════════════════════
CLASSIFICATION RULES
═══════════════════════════════════════════════════════════
- "question": Asking about the product, service, content, or process
- "link_request": Asking for a link, resource, file, template
- "purchase_intent": Pricing, buying, invoice, payment inquiries
- "support": Account issues, complaints, requests for help
- "spam": Bot messages, promotional spam, scam links
- "harmful": Threats, hate speech, harassment
- "unrelated": Off-topic or unclear messages

═══════════════════════════════════════════════════════════
REPLY RULES
═══════════════════════════════════════════════════════════
- Be warm, concise, and human. Not robotic.
- Answer what you can from the knowledge base. If unsure, offer to connect them with the team.
- For "purchase_intent": acknowledge interest and provide the link or next step.
- For "spam"/"harmful": set suggestedReply to "SKIP" and shouldEscalate to true.
- For complex "support": shouldEscalate to true so a human can follow up.
- Maximum 3 sentences per reply. No emoji walls. Max 1 emoji.
- Strip AI slop words: delve, leverage, seamlessly, robust, game-changer.

LEAD SCORING:
- 0: Not a lead
- 1: Warm — asked a question
- 2: Hot — link/resource request, mentioned work/clients
- 3: Ready to buy — pricing, invoice, payment

Return ONLY valid JSON:
{
  "classification": "question|link_request|purchase_intent|support|spam|harmful|unrelated",
  "confidence": 0.0-1.0,
  "suggestedReply": "the DM reply text (or SKIP)",
  "leadScore": 0-3,
  "shouldAutoReply": true/false,
  "shouldEscalate": true/false,
  "reasoning": "1-sentence explanation"
}`;

    const result = await this.groq.generateObject(prompt, dmClassificationSchema, {
      temperature: 0.5,
      maxTokens: 400,
    });

    if (!result.ok) {
      logger.error('DM classification failed', { error: result.error, messageId: dm.messageId });
      return {
        classification: 'unrelated',
        confidence: 0,
        suggestedReply: '',
        leadScore: 0,
        shouldAutoReply: false,
        shouldEscalate: config.dmEscalationEnabled ?? true,
        reasoning: `DM classification failed: ${result.error.message}`,
      };
    }

    return result.value;
  }

  /**
   * Resolves whether the comment should be auto-replied based on config toggles.
   */
  private resolveAutoReplyFlag(
    classified: ClassifiedComment,
    config: AutomationConfig
  ): boolean {
    if (classified.suggestedReply === 'SKIP') return false;
    if (classified.classification === 'harmful' || classified.classification === 'spam') return false;

    switch (classified.classification) {
      case 'positive':
        return config.autoReplyPositive && classified.shouldAutoReply;
      case 'question':
        return config.autoReplyQuestions && classified.shouldAutoReply;
      case 'link_request':
        return config.autoReplyLinkRequests && classified.shouldAutoReply;
      case 'purchase_intent':
        return (config.autoReplyPurchaseIntent ?? true) && classified.shouldAutoReply;
      case 'negative':
        return false; // Always flag negative for human review
      default:
        return false;
    }
  }

  /**
   * Posts a public reply to an Instagram comment.
   * Targets the comment's replies edge: POST /{commentId}/replies
   * Falls back to Facebook Graph API, and then to media comments edge.
   */
  async postPublicReply(
    accessToken: string,
    mediaId: string,
    commentId: string,
    message: string
  ): Promise<{ replyId: string } | null> {
    try {
      // 1. Reply directly under the specific comment (nested reply)
      if (commentId && !commentId.startsWith('test_')) {
        const replyParams = new URLSearchParams({
          message,
          access_token: accessToken,
        });

        // 1a: Try graph.facebook.com/{commentId}/replies first — required for Business API OAuth
        let response = await fetchWithRetry(
          `https://graph.facebook.com/v20.0/${commentId}/replies`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: replyParams.toString(),
          }
        );

        // 1b: Fall back to graph.instagram.com if Facebook endpoint fails
        if (!response.ok) {
          const fbError = await response.text();
          logger.warn('graph.facebook.com comment reply failed, trying graph.instagram.com', {
            commentId,
            error: fbError,
            status: response.status,
          });

          response = await fetchWithRetry(
            `https://graph.instagram.com/v20.0/${commentId}/replies`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: replyParams.toString(),
            }
          );
        }

        if (response.ok) {
          const data = await response.json();
          logger.info('Instagram comment reply posted successfully via replies edge', {
            commentId,
            replyId: data.id,
          });
          return { replyId: data.id };
        }

        const replyErr = await response.text();
        logger.warn('Direct reply to comment failed, attempting fallback to media comments', {
          commentId,
          error: replyErr,
        });
      }

      // 2. Fallback: post to media comments edge
      if (mediaId && !mediaId.startsWith('test_')) {
        const mediaParams = new URLSearchParams({
          message,
          access_token: accessToken,
        });

        const mediaResponse = await fetchWithRetry(
          `https://graph.instagram.com/v20.0/${mediaId}/comments`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: mediaParams.toString(),
          }
        );

        if (mediaResponse.ok) {
          const data = await mediaResponse.json();
          logger.info('Instagram comment posted via media fallback', {
            mediaId,
            commentId,
            replyId: data.id,
          });
          return { replyId: data.id };
        }

        const mediaErr = await mediaResponse.text();
        logger.error('Failed to post comment via media fallback', {
          mediaId,
          error: new Error(mediaErr),
        });
      }

      return null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error posting Instagram reply', { commentId, mediaId, error: err });
      return null;
    }
  }

  /**
   * Sends a private DM to a user (commenter or inbound DM sender).
   * Uses the Instagram Messaging API.
   */
  async sendPrivateMessage(
    accessToken: string,
    igUserId: string,
    recipientIgScopedId: string,
    message: string
  ): Promise<{ messageId: string } | null> {
    try {
      // Instagram Messaging API requires access_token in the body, not Authorization: Bearer
      const response = await fetchWithRetry(
        `https://graph.instagram.com/v20.0/${igUserId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: recipientIgScopedId },
            message: { text: message },
            access_token: accessToken,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Failed to send Instagram DM', {
          recipientIgScopedId,
          error: new Error(errorText),
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
   * Must be called after OAuth to ensure comments AND messages arrive.
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

      // Try graph.facebook.com first (standard for Business / Page-linked accounts)
      let response = await fetchWithRetry(
        `https://graph.facebook.com/v20.0/${igUserId}/subscribed_apps`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        }
      );

      // Fall back to graph.instagram.com if facebook endpoint returns error
      if (!response.ok) {
        response = await fetchWithRetry(
          `https://graph.instagram.com/v20.0/${igUserId}/subscribed_apps`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
          }
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Failed to subscribe Instagram account to webhook', {
          igUserId,
          error: new Error(errorText),
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
