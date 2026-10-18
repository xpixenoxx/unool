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
  | 'negative'
  | 'spam'
  | 'harmful'
  | 'unrelated';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  text: string;
}

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
    'negative',
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
   * Classifies an inbound DM and generates a dynamic, crunchy, mildly flirty reply
   * powered by Groq. Strictly adheres to the product scope; sarcastically deflects
   * off-topic questions back to the product; supports up to 10-15 conversation turns.
   */
  async classifyAndReplyDM(
    dm: DmEvent,
    config: AutomationConfig,
    conversationHistory: ConversationMessage[] = [],
    conversationTurn = 1,
    productName = 'UNOOL'
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

    const brandName = config.brandPersona?.trim() || productName || 'our product';
    const targetLink = config.linkUrl || 'https://unool.co';
    const currentTurn = Math.max(1, conversationTurn);

    // Format previous conversation turns so Groq maintains memory and avoids repetition
    const formattedHistory =
      conversationHistory && conversationHistory.length > 0
        ? conversationHistory
            .slice(-10)
            .map((msg) => `${msg.role === 'user' ? 'Follower' : 'You'}: "${msg.text}"`)
            .join('\n')
        : '(No previous messages — this is the first turn in this DM interaction)';

    const productKnowledge = config.dmKnowledgeBase?.trim()
      ? config.dmKnowledgeBase
      : `Product Overview & Value:
- Unified social growth platform, cross-posting scheduler, AI engagement automation, and viral analytics.
- Helps founders, creators, and agencies schedule content, auto-reply to comments/DMs, and convert engagement into customers.
- Link: ${targetLink}`;

    const prompt = `You are the official AI representative for "${brandName}" in Instagram Direct Messages (DMs).
Your mission is to build a magnetic connection with the follower, answer questions strictly about our product, and turn curious followers into passionate product users.

═══════════════════════════════════════════════════════════
CONVERSATION CONTEXT & PROGRESSION
═══════════════════════════════════════════════════════════
Current Turn: Turn ${currentTurn} of 15
Product Name: ${brandName}
Product Link / Call to Action: ${targetLink}
${config.customInstructions ? `Custom Owner Instructions: "${config.customInstructions}"` : ''}

Recent Conversation History:
${formattedHistory}

New Inbound DM from @${dm.senderUsername || dm.senderId}: "${dm.text}"

Knowledge Repository (Product Facts & FAQs):
${productKnowledge}

═══════════════════════════════════════════════════════════
PERSONALITY & TONE RULES (CRITICAL)
═══════════════════════════════════════════════════════════
1. CRUNCHY & MAGNETIC:
   - Punchy, crisp, engaging, modern internet cadence.
   - ZERO corporate robotic boilerplate (never say: "I hope you are having a wonderful day", "Thank you for reaching out to us", "We are pleased to assist you").
   - Strip all AI buzzword slop: "delve", "leverage", "seamlessly", "game-changer", "robust", "transformative", "tapestry", "elevate".
   - Keep replies tight and mobile-friendly: 1 to 3 punchy sentences max. Use 1 or 2 natural emojis (😉, ✨, 👀, 🔥).

2. MILDLY FLIRTY & PLAYFUL BANTER (NOT OVERBOARD):
   - Flirtatious warmth, playful compliments, charismatic teasing, high-chemistry banter, and wink energy 😉.
   - Make the follower smile, feel seen and valued, and excited to chat.
   - STRICT SAFETY BOUNDARY: Keep it tasteful, classy, and professional. NEVER be creepy, sexually suggestive, overly romantic, or inappropriate.

3. HIGH-RETENTION CONVERSATIONAL HOOK:
   - Unless it is the final 15th turn or spam/harmful, every reply MUST end with an irresistible question or hook that naturally compels them to reply back and stay in contact.

═══════════════════════════════════════════════════════════
STRICT PRODUCT FOCUS & SARCASTIC OFF-TOPIC REDIRECTION
═══════════════════════════════════════════════════════════
1. STRICT PRODUCT SCOPE:
   - Your world revolves strictly around ${brandName}.
   - You only talk about our product features, benefits, how it saves time, how it gets results, pricing, and how to get started (${targetLink}).
   - You do NOT answer general trivia, homework, coding questions, weather, dating advice, politics, sports, or random topics outside our product.

2. SARCASTIC DEFLECTION RULE FOR OUT-OF-THE-BOX QUESTIONS:
   - If the follower asks anything off-topic or out-of-the-box (e.g. weather, homework, politics, personal questions, random trivia):
   - DO NOT answer the off-topic question!
   - Reply with a witty, playful, SARCASTIC deflection! Make it clear in a teasing, sarcastic way that you only know and care about this product and won't talk about outside stuff, then playfully steer back to ${brandName}.
   - Examples of Sarcastic Redirections:
     * User: "What's the weather in New York?" -> "I literally live inside this DM box obsessing over ${brandName} 24/7—you really think I check the New York weather? 😜 Tell me what you're working on with us instead!"
     * User: "Help me with my math homework" -> "As deeply flattered as I am that you think I'm a math genius, my brain is 100% hardwired for ${brandName}. No calculus here, darling—only product wins 😉 What can I show you about our features?"
     * User: "Who's winning the elections?" -> "Nice try diverting my attention! I have eyes only for ${brandName}. Let's keep our focus on what really matters—what can I help you unlock today?"

═══════════════════════════════════════════════════════════
10 TO 15 REPLIES MULTI-TURN ROADMAP
═══════════════════════════════════════════════════════════
- Turns 1–3 (Opening): Warm, charming first impression, spark curiosity, ask what they're looking to build or achieve with the product.
- Turns 4–9 (Engagement): Answer questions with crunchy value drops, showcase features, keep the banter lively and engaging.
- Turns 10–14 (Conversion Nudge): Flirtatiously steer toward testing the product: "You ask all the right questions—honestly, you just need to experience it for yourself. Want me to send your link? 😉"
- Turn 15 (Final Wrap-up): Charming finale! Celebrate the conversation, let them know you've reached the DM limit for today, deliver the product link (${targetLink}), and invite them to hop into the app or connect with the human team.

═══════════════════════════════════════════════════════════
CLASSIFICATION CATEGORIES
═══════════════════════════════════════════════════════════
- "question": Question about the product, features, pricing, or getting started.
- "link_request": Asking for the link, URL, access, or how to buy/sign up. (Include ${targetLink} in the reply).
- "purchase_intent": Inquiring about plans, pricing, enterprise, buying now. (Include ${targetLink}).
- "support": Legitimate technical complaint or issue with their account.
- "negative": Angry criticism, frustration, or complaint. (Respond with empathy and offer human escalation).
- "unrelated": Off-topic or out-of-the-box question. (Generate the witty sarcastic deflection reply!).
- "spam": Bot links, scams, crypto spam. (Set suggestedReply to "SKIP" and shouldAutoReply to false).
- "harmful": Harassment, threats, abuse. (Set suggestedReply to "SKIP", shouldAutoReply to false, shouldEscalate to true).

LEAD SCORING:
- 0: Casual chat or unrelated off-topic
- 1: Warm — asked a genuine product question
- 2: Hot — requested link, asked about pricing, mentioned team/business
- 3: Ready to buy — asked for checkout, invoice, or how to pay

Return ONLY valid JSON:
{
  "classification": "question|link_request|purchase_intent|support|negative|spam|harmful|unrelated",
  "confidence": 0.0-1.0,
  "suggestedReply": "the DM reply text (or SKIP)",
  "leadScore": 0-3,
  "shouldAutoReply": true/false,
  "shouldEscalate": true/false,
  "reasoning": "1-sentence explanation"
}`;

    const result = await this.groq.generateObject(prompt, dmClassificationSchema, {
      temperature: 0.75,
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
   *
   * For inbound DMs (user already in conversation), this works directly.
   * For comment-triggered DMs, this may fail if the user hasn't messaged
   * the account before (24-hour window rule). In that case, the caller
   * should use sendPrivateReplyToComment() instead.
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
        logger.error('Failed to send Instagram DM via Messaging API', {
          recipientIgScopedId,
          error: new Error(errorText),
          status: response.status,
        });
        return null;
      }

      const data = await response.json();
      logger.info('Instagram DM sent via Messaging API', { recipientIgScopedId, messageId: data.message_id });
      return { messageId: data.message_id };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error sending Instagram DM', { recipientIgScopedId, error: err });
      return null;
    }
  }

  /**
   * Checks if an Instagram user (IGSID) follows the business account.
   * Queries Meta's `is_user_follow_business` field on the user node.
   */
  async checkUserFollowsBusiness(
    accessToken: string,
    recipientIgScopedId: string
  ): Promise<boolean> {
    try {
      // 1. Try graph.instagram.com first
      let res = await fetch(
        `https://graph.instagram.com/v20.0/${recipientIgScopedId}?fields=name,username,is_user_follow_business&access_token=${accessToken}`
      );
      if (res.ok) {
        const data = await res.json();
        logger.info('Follow verification result from graph.instagram.com', {
          recipientIgScopedId,
          isFollowing: data.is_user_follow_business,
        });
        return !!data.is_user_follow_business;
      }

      // 2. Fall back to graph.facebook.com
      res = await fetch(
        `https://graph.facebook.com/v20.0/${recipientIgScopedId}?fields=name,username,is_user_follow_business&access_token=${accessToken}`
      );
      if (res.ok) {
        const data = await res.json();
        logger.info('Follow verification result from graph.facebook.com', {
          recipientIgScopedId,
          isFollowing: data.is_user_follow_business,
        });
        return !!data.is_user_follow_business;
      }

      const errText = await res.text();
      logger.warn('Could not query is_user_follow_business from Meta', { recipientIgScopedId, error: errText });
      return false;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.warn('Error verifying follow status via Meta Graph API', { recipientIgScopedId, error: errorMsg });
      return false;
    }
  }

  /**
   * Sends an interactive DM with Instagram Quick Reply buttons.
   */
  async sendQuickReplyMessage(
    accessToken: string,
    igUserId: string,
    recipientIgScopedId: string,
    text: string,
    quickReplies: Array<{ title: string; payload: string }>
  ): Promise<{ messageId: string } | null> {
    try {
      const payload = {
        recipient: { id: recipientIgScopedId },
        message: {
          text,
          quick_replies: quickReplies.map(qr => ({
            content_type: 'text',
            title: qr.title,
            payload: qr.payload,
          })),
        },
        access_token: accessToken,
      };

      // Try graph.facebook.com first
      let response = await fetchWithRetry(
        `https://graph.facebook.com/v20.0/${igUserId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      // Fall back to graph.instagram.com
      if (!response.ok) {
        response = await fetchWithRetry(
          `https://graph.instagram.com/v20.0/${igUserId}/messages`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
      }

      if (response.ok) {
        const data = await response.json();
        logger.info('Instagram Quick Reply DM sent successfully', { recipientIgScopedId, messageId: data.message_id });
        return { messageId: data.message_id || 'sent' };
      }

      const errText = await response.text();
      logger.warn('Quick reply API call failed, falling back to plain text DM', { error: errText });
      return await this.sendPrivateMessage(accessToken, igUserId, recipientIgScopedId, text);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      logger.error('Error sending quick reply DM', { error: errorObj });
      return await this.sendPrivateMessage(accessToken, igUserId, recipientIgScopedId, text);
    }
  }

  /**
   * Sends a private DM reply to a specific comment using Meta's Private Replies API.
   *
   * This is the CORRECT way to DM someone who left a public comment but has
   * never messaged the brand's account. The standard messaging endpoint
   * (/{igUserId}/messages) requires the recipient to be inside the 24-hour
   * conversation window, which doesn't exist for random commenters.
   *
   * Meta Private Replies API: POST /{comment_id}/private_replies
   * - Works for comments made within the last 7 days.
   * - Only one private reply per comment is allowed by Meta.
   * - Requires `instagram_business_manage_messages` permission.
   */
  async sendPrivateReplyToComment(
    accessToken: string,
    commentId: string,
    message: string
  ): Promise<{ messageId: string } | null> {
    if (!commentId || commentId.startsWith('test_')) {
      logger.debug('Skipping private reply for test/empty comment ID', { commentId });
      return null;
    }

    try {
      // Try graph.facebook.com first (standard for Business API)
      let response = await fetchWithRetry(
        `https://graph.facebook.com/v20.0/${commentId}/private_replies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            message,
            access_token: accessToken,
          }).toString(),
        }
      );

      // Fall back to graph.instagram.com
      if (!response.ok) {
        const fbErr = await response.text();
        logger.warn('Private reply via graph.facebook.com failed, trying graph.instagram.com', {
          commentId,
          error: fbErr,
          status: response.status,
        });

        response = await fetchWithRetry(
          `https://graph.instagram.com/v20.0/${commentId}/private_replies`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              message,
              access_token: accessToken,
            }).toString(),
          }
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Failed to send private reply to comment', {
          commentId,
          error: new Error(errorText),
          status: response.status,
        });
        return null;
      }

      const data = await response.json();
      const messageId = data.id || data.message_id || 'sent';
      logger.info('Private reply sent to comment', { commentId, messageId });
      return { messageId };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error sending private reply to comment', { commentId, error: err });
      return null;
    }
  }

  /**
   * Smart DM dispatcher: attempts the Private Replies API first (for comment-
   * triggered DMs), then falls back to the standard Messaging API.
   *
   * This is the method callers should use for comment-triggered DMs to ensure
   * DMs get delivered regardless of the 24-hour messaging window.
   */
  async sendDmForComment(
    accessToken: string,
    igUserId: string,
    commentId: string,
    recipientIgScopedId: string | undefined,
    message: string
  ): Promise<{ messageId: string } | null> {
    // 1. Try Private Replies API first (works for any commenter within 7 days)
    const privateResult = await this.sendPrivateReplyToComment(accessToken, commentId, message);
    if (privateResult) return privateResult;

    // 2. Fall back to standard Messaging API (works if user is in 24h window)
    if (recipientIgScopedId) {
      const msgResult = await this.sendPrivateMessage(accessToken, igUserId, recipientIgScopedId, message);
      if (msgResult) return msgResult;
    }

    logger.warn('All DM delivery methods failed for comment', { commentId, recipientIgScopedId });
    return null;
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

      // Priority list of subscription endpoints:
      // Instagram Login tokens (IG...) work on graph.instagram.com.
      // Facebook Page tokens (EA...) work on graph.facebook.com.
      const endpointsToTry = [
        `https://graph.instagram.com/v20.0/me/subscribed_apps?${params.toString()}`,
        `https://graph.instagram.com/v20.0/${igUserId}/subscribed_apps?${params.toString()}`,
        `https://graph.facebook.com/v20.0/${igUserId}/subscribed_apps?${params.toString()}`,
        `https://graph.facebook.com/v20.0/me/subscribed_apps?${params.toString()}`,
      ];

      for (const endpoint of endpointsToTry) {
        try {
          const response = await fetchWithRetry(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
          });

          const respText = await response.text();
          let data: any = null;
          try { data = JSON.parse(respText); } catch {}

          if (response.ok && (data?.success === true || respText.includes('"success":true'))) {
            logger.info('Instagram account subscribed to webhook successfully', {
              igUserId,
              endpoint: endpoint.split('?')[0],
              success: true,
            });
            return true;
          } else {
            logger.warn('Webhook subscription attempt returned non-success', {
              igUserId,
              endpoint: endpoint.split('?')[0],
              status: response.status,
              body: respText.substring(0, 300),
            });
          }
        } catch (attemptErr) {
          logger.warn('Webhook subscription attempt failed with network error', {
            igUserId,
            endpoint: endpoint.split('?')[0],
            error: attemptErr instanceof Error ? attemptErr.message : String(attemptErr),
          });
        }
      }

      logger.error('All Instagram webhook subscription endpoints failed', { igUserId });
      return false;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error subscribing Instagram account to webhook', { igUserId, error: err });
      return false;
    }
  }
}
