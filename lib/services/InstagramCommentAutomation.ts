import { z } from 'zod';
import { logger } from '@/lib/logger';
import { GroqProvider } from '@/lib/ai/providers/GroqProvider';
import { fetchWithRetry } from '@/lib/utils/retry';
import { API_VERSIONS, resolveInstagramApiHost } from '@/lib/platforms/apiVersions';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * The media comments edge always lives on graph.instagram.com regardless of auth method.
 * This is used as the fallback when the comment-level reply endpoint fails.
 */
const INSTAGRAM_MEDIA_HOST = 'https://graph.instagram.com';

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
  | 'greeting'
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
  // Follow-to-unlock gate automation
  requireFollowForDm?: boolean;
  followAskMessage?: string;
  followVerifiedMessage?: string;
}

export interface DmFollowGateInput {
  dmEvent: DmEvent;
  config: AutomationConfig;
  accessToken: string;
  igUserId: string;
  brandUsername: string;
  previousLogs?: Array<{
    message_text?: string | null;
    ai_reply?: string | null;
    auto_replied?: boolean | null;
    follow_verified?: boolean | null;
    follow_status?: string | null;
    reasoning?: string | null;
  }>;
}

export type DmFollowGateResult =
  | {
      handled: true;
      action: 'prompt_follow' | 'remind_follow' | 'follow_confirmed';
      replyText: string;
      isFollowing: boolean;
      messageId?: string;
      resolvedUsername?: string;
    }
  | {
      handled: false;
      isFollowing: boolean;
      resolvedUsername?: string;
    };

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
  requireFollowForDm: false,
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
    'greeting',
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
  private fetchedUsernames = new Map<string, string>();

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

RULE 4: For "negative" — write a professional, empathetic, non-defensive response. Acknowledge frustration, offer to resolve in DMs. Never argue. NEVER skip negative comments — a thoughtful de-escalation reply is always better than silence.

RULE 5: PSYCHOLOGICAL ENGAGEMENT (CIALDINI PRINCIPLES):
- Social Proof: Reference success/community ("Tons of creators are using this for exactly that—")
- Reciprocity: Offer something first without asking ("Here’s a quick tip for you—")
- Curiosity Gap: Leave one hook deliberately unanswered to pull them into DMs ("The answer to that one’s a bit wild—DM us and I’ll show you exactly how.")
- Scarcity/Urgency (use sparingly): Only when genuinely relevant, never fake.

RULE 6: EMOTION MIRRORING:
- If the comment is excited/enthusiastic — match that energy with an energetic reply.
- If the comment is calm/curious — match with a thoughtful, measured tone.
- If the comment is frustrated/negative — open with empathy, lower the temperature, never escalate.
- Never reply with generic enthusiasm to a frustrated commenter.

RULE 7: PATTERN INTERRUPT OPENERS:
- Never start with "Hey!", "Great!", "Thanks!", "Absolutely!", or any single-word filler opener.
- Open with something that directly references what they said — make it feel like you read it, not templated it.
- Good: "That sprint workflow tip is real—" / "Okay this question hits different—" / "Real talk—"

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
   * Classifies an inbound DM and generates a natural, human-sounding reply
   * powered by Groq. The AI responds as the real person behind the brand — never
   * as a bot or "representative". Handles greetings naturally, answers product
   * questions authentically, and gently steers off-topic messages back to the product
   * without revealing AI involvement. Supports up to 10-15 conversation turns.
   */
  async classifyAndReplyDM(
    dm: DmEvent,
    config: AutomationConfig,
    conversationHistory: ConversationMessage[] = [],
    conversationTurn = 1,
    productName = 'UNOOL',
    isFollowing = true
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
    // Use only the creator's configured link. Never fall back to the UNOOL platform URL —
    // that would send followers to the wrong product entirely.
    const targetLink = config.linkUrl?.trim() || null;
    const hasLink = !!targetLink;
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
      : '(No product knowledge configured by the account owner. Do NOT invent products or links. Ask clarifying questions to understand what the follower is looking for.)';

    // dmTemplate: inject into prompt for Turn 1 or whenever set by workspace owner
    const dmTemplateInstruction = (config.dmTemplate && config.dmTemplate.trim())
      ? `TEMPLATE FOR FIRST MESSAGE (Turn 1): If this is the very first message (Turn 1), you MUST start your reply with this exact template text then continue naturally: "${config.dmTemplate.trim()}"`
      : '';

    const prompt = `You are ${brandName} — the real person behind this Instagram account — responding directly to a DM.
You are NOT an AI assistant, NOT a bot, NOT a "representative". You are the creator/owner themselves, typing this reply in real time.
NEVER say you are "hardwired", "an AI", a "representative", or anything that reveals automation.
Write exactly the way a real, busy, warm, and direct human would type in Instagram DMs.

═══════════════════════════════════════════════════════════
CONVERSATION CONTEXT & PROGRESSION
═══════════════════════════════════════════════════════════
Current Turn: Turn ${currentTurn} of 15
Brand / Account: ${brandName}
Follower Relationship: ${isFollowing ? 'Confirmed Follower (follows our account)' : 'Visitor (not yet following)'}
${hasLink ? `Creator's product link (share this when asked): ${targetLink}` : 'NO PRODUCT LINK CONFIGURED — do NOT share any URL. If asked for a link, ask a clarifying question instead (e.g. "which one are you looking for?" or "tell me more about what you need!").'}
${config.customInstructions ? `Owner's personal instructions: "${config.customInstructions}"` : ''}
${dmTemplateInstruction ? dmTemplateInstruction : ''}

Recent Conversation History:
${formattedHistory}

New DM from @${dm.senderUsername || dm.senderId}: "${dm.text}"

Product & Brand Knowledge:
${productKnowledge}

═══════════════════════════════════════════════════════════
HOW TO WRITE (CRITICAL — READ CAREFULLY)
═══════════════════════════════════════════════════════════
1. SOUND LIKE A REAL PERSON:
   - Casual, warm, direct — like a founder or creator who genuinely cares.
   - Short and mobile-native: 1 to 3 sentences max.
   - 1 or 2 natural emojis max. No emoji walls.
   - ZERO corporate boilerplate: never say "Thank you for reaching out", "I hope this helps", "I'm here to assist you".
   - Strip all AI slop: "delve", "leverage", "seamlessly", "game-changer", "robust", "transformative", "elevate", "tapestry".

2. GREETINGS — RESPOND LIKE A HUMAN:
   - If someone says "Hi", "Hey", "Hello", "What's up" or similar: reply with a warm, natural, brief greeting.
   - DO NOT immediately push product on a greeting. Just say hi back, be warm, and ask a natural question to get to know them.
   - Examples of a human greeting response:
     * "Hey! Good to hear from you 😊 What's on your mind?"
     * "Hey hey! What's up?"
     * "Hi! Great to connect — what are you working on these days?"

3. PRODUCT QUESTIONS — ANSWER NATURALLY WITH CURIOSITY LOOPS:
   - Answer questions about ${brandName} like you built it and love it.
   - ${hasLink ? `Share the link (${targetLink}) naturally when it makes sense: "here you go →"` : 'If asked for a link, DO NOT send any URL. Ask a warm clarifying question: "Which of my things are you after? Want to make sure I send you the right one!"'}
   - Curiosity Loop / Hook: Unless it is the final 15th turn or spam/harmful, every reply on product turns should end with an engaging question or curiosity gap to keep the conversation going naturally.

4. OFF-TOPIC QUESTIONS & ANTI-LOOP RULE:
   - If they ask about something completely off-topic (weather, homework, sports, politics, random trivia):
   - DO NOT answer the off-topic question.
   - Redirect casually and warmly — like a human who just doesn't know that stuff: "Ha, not my department! But hey, while I have you..."
   - NEVER say "I'm hardwired for", "I only know about", "I'm an AI", "my brain is for X", or anything that sounds robotic.
   - Examples of natural human redirections:
     * User: "What's the weather in New York?" → "Ha, I wish I had time to check the weather 😄 Been heads-down on [brandName] all day. What brought you here — something you're working on?"
     * User: "Help me with my homework" → "Ha not really my thing! I'm way more useful when it comes to [brandName] stuff 😄 What can I help you with there?"
     * User: "Who's winning the elections?" → "Honestly I've been so deep in building mode I'm the last person to ask 😅 What's going on with you though — something I can actually help with?"
   - ANTI-LOOP DEFLECTION CAP: Check conversation history above. If you have already redirected them away from off-topic subjects 2 or more times in this conversation, DO NOT keep deflecting in circles!
     After 2 redirections, warmly sign off: "Honestly, I'm heads-down focusing on [brandName] right now! If you ever have any questions on that, I'm here. Otherwise I'll let our team take it from here 😊"
     Return classification="unrelated", shouldAutoReply=false, shouldEscalate=true.

5. EMOTION MIRRORING (CRITICAL):
   - READ the energy of the follower's message before replying.
   - Excited/hype message → match with high energy, exclamation, enthusiasm.
   - Calm/curious message → match with measured, thoughtful, slightly warmer tone.
   - Frustrated/negative message → open with empathy first ("That sounds genuinely frustrating—"), lower temperature, never escalate.
   - Confused message → be clear and reassuring, no jargon.
   - NEVER reply with generic enthusiasm to a frustrated or confused user.

6. EMOTIONAL HOOK RULE (Turn 1 only):
   - On the VERY FIRST message (Turn 1), before anything else, acknowledge what the user is FEELING or trying to achieve, not just what they asked.
   - Example: If they ask "How does pricing work?", don't start with "Great question!"—start with "Sounds like you're evaluating if this fits your budget—totally fair." Then answer.

═══════════════════════════════════════════════════════════
MULTI-TURN CONVERSATION ROADMAP
═══════════════════════════════════════════════════════════
- Turns 1–3 (Opening): Warm, human, get to know them. For greetings, just say hi back and ask a genuine question. Don't push product yet.
- Turns 4–9 (Engagement): Naturally bring in product value. Answer questions with real insight, keep it conversational.
- Turns 10–14 (Conversion): Naturally steer toward trying the product: "Honestly you just need to see it — want me to send you the link?"
- Turn 15 (Wrap-up): Warm sign-off, ${hasLink ? `share the product link (${targetLink}),` : 'invite them to reach out for more info,'} invite them to explore or reach out to the team.

═══════════════════════════════════════════════════════════
CLASSIFICATION CATEGORIES
═══════════════════════════════════════════════════════════
- "greeting": Simple opener — "Hi", "Hey", "Hello", "What's up", emoji wave. Respond warmly as a person. No product push yet.
- "question": Genuine question about the product, features, pricing, or getting started.
- "link_request": Asking for the link, URL, access, or how to sign up.
  ${hasLink ? `Share the creator's link naturally: "${targetLink}"` : 'NO link configured — ask a friendly clarifying question instead (e.g. "Which of my things are you looking for? I want to make sure I send you the right one 😊"). NEVER send any URL.'}
- "purchase_intent": Inquiring about plans, pricing, or buying.
  ${hasLink ? `Share the creator's link naturally: "${targetLink}"` : 'NO link configured — ask what they are interested in and offer to share more details personally.'}
- "support": Legitimate technical issue or complaint about their account.
- "negative": Angry criticism or frustration. (Respond with empathy, offer to help personally).
- "unrelated": Off-topic question. (Redirect warmly and naturally — no robotic deflection).
- "spam": Bot links, scams, crypto spam. (Set suggestedReply to "SKIP" and shouldAutoReply to false).
- "harmful": Harassment, threats, abuse. (Set suggestedReply to "SKIP", shouldAutoReply to false, shouldEscalate to true).

LEAD SCORING:
- 0: Casual chat, greeting, or off-topic
- 1: Warm — asked a genuine product question
- 2: Hot — requested link, asked about pricing, mentioned team/business
- 3: Ready to buy — asked for checkout, invoice, or how to pay

Return ONLY valid JSON:
{
  "classification": "greeting|question|link_request|purchase_intent|support|negative|unrelated|spam|harmful",
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
   *
   * Selects the Graph API host based on the access token's authentication method:
   *   - Instagram Login tokens (IG...) → graph.instagram.com
   *   - Facebook Business Login tokens (EAA...) → graph.facebook.com
   *
   * Does NOT fall back across hosts — using the wrong host for a given token type
   * returns a persistent 400/OAuthException that retrying on the other host cannot fix.
   *
   * Endpoint for comment reply: POST /{commentId}/replies
   * IMPORTANT: When replying to a comment, this function NEVER falls back to /{mediaId}/comments.
   * Posting to /{mediaId}/comments creates a detached top-level comment on the root post
   * rather than a threaded reply to the commenter.
   *
   * If commenterUsername is provided, ensures the reply starts with `@{username} ` so
   * Instagram properly threads and notifies the commenter.
   *
   * fetchWithRetry() throws on 4xx/5xx — all calls are wrapped in try/catch so the
   * exception is converted to a structured log entry and null return, never a thrown error.
   */
  async postPublicReply(
    accessToken: string,
    mediaId: string,
    commentId: string,
    message: string,
    commenterUsername?: string
  ): Promise<{ replyId: string } | null> {
    if (!commentId && !mediaId) {
      logger.warn('postPublicReply: both commentId and mediaId are empty — cannot post reply');
      return null;
    }

    // Determine the correct API host from the token type (no cross-host fallback).
    const apiHost = resolveInstagramApiHost(accessToken);
    const apiVersion = API_VERSIONS.instagram;

    // Ensure the reply tags the user directly (e.g. "@username ...") so Instagram threads and notifies them properly
    let formattedMessage = message.trim();
    if (commenterUsername) {
      const cleanUsername = commenterUsername.replace(/^@/, '').trim();
      if (cleanUsername && !formattedMessage.toLowerCase().startsWith(`@${cleanUsername.toLowerCase()}`)) {
        formattedMessage = `@${cleanUsername} ${formattedMessage}`;
      }
    }

    // 1. Reply directly under the specific comment (nested reply).
    if (commentId && !commentId.startsWith('test_')) {
      const replyParams = new URLSearchParams({
        message: formattedMessage,
        access_token: accessToken,
      });

      try {
        // Pass access_token and message in both search params and form body for maximum gateway compatibility
        const replyUrl = new URL(`${apiHost}/${apiVersion}/${commentId}/replies`);
        replyUrl.searchParams.set('access_token', accessToken);
        replyUrl.searchParams.set('message', formattedMessage);

        const data = await fetchWithRetry(replyUrl.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: replyParams.toString(),
        });

        // fetchWithRetry returns the Response object only on 2xx — it throws on error codes.
        const responseData = await data.json();
        logger.info('Instagram comment reply posted successfully via replies edge', {
          commentId,
          replyId: responseData.id,
          apiHost,
          commenterUsername,
        });
        return { replyId: responseData.id };
      } catch (replyErr) {
        const err = replyErr instanceof Error ? replyErr : new Error(String(replyErr));
        // Extract structured Meta error info where possible.
        const metaCode = (replyErr as any)?.statusCode;
        logger.error('Failed to post nested comment reply to Instagram', {
          commentId,
          apiHost,
          errorType: err.name,
          errorMessage: err.message,
          httpStatus: metaCode,
        });
        // CRITICAL: Do NOT fall back to media comments edge (/{mediaId}/comments) when replying to a comment.
        // Posting to /{mediaId}/comments creates an unthreaded root comment on the media post, disconnected from the user.
        return null;
      }
    }

    // 2. Standalone media post comment (ONLY when NO commentId is provided).
    if (!commentId && mediaId && !mediaId.startsWith('test_')) {
      const mediaParams = new URLSearchParams({
        message: formattedMessage,
        access_token: accessToken,
      });
      const mediaUrl = new URL(`${INSTAGRAM_MEDIA_HOST}/${apiVersion}/${mediaId}/comments`);
      mediaUrl.searchParams.set('access_token', accessToken);
      mediaUrl.searchParams.set('message', formattedMessage);

      try {
        const mediaData = await fetchWithRetry(mediaUrl.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: mediaParams.toString(),
        });

        const responseData = await mediaData.json();
        logger.info('Instagram comment posted via media comments edge', {
          mediaId,
          replyId: responseData.id,
        });
        return { replyId: responseData.id };
      } catch (mediaErr) {
        const err = mediaErr instanceof Error ? mediaErr : new Error(String(mediaErr));
        const metaCode = (mediaErr as any)?.statusCode;
        logger.error('Failed to post comment via media comments edge', {
          mediaId,
          errorType: err.name,
          errorMessage: err.message,
          httpStatus: metaCode,
        });
        return null;
      }
    }

    logger.warn('No valid commentId or mediaId provided for public reply', { commentId, mediaId });
    return null;
  }

  /**
   * Sends a private DM to a user (commenter or inbound DM sender).
   *
   * Uses the correct Instagram Messaging API host based on the token's authentication method:
   *   - Instagram Login tokens → graph.instagram.com/{igUserId}/messages
   *   - Facebook Business Login tokens → graph.facebook.com/{igUserId}/messages
   *
   * The access_token is transported in the JSON body (not Authorization header) per Meta docs.
   *
   * IMPORTANT: This endpoint requires the recipient to be inside the 24-hour standard
   * messaging window (they must have messaged the account first).  For comment-triggered DMs
   * use sendPrivateReplyToComment() instead — that uses the Private Replies API which
   * covers any commenter within 7 days without a prior conversation.
   *
   * fetchWithRetry() throws on 4xx/5xx; the outer catch converts that to null + structured log.
   */
  async sendPrivateMessage(
    accessToken: string,
    igUserId: string,
    recipientIgScopedId: string,
    message: string
  ): Promise<{ messageId: string } | null> {
    const apiHost = resolveInstagramApiHost(accessToken);
    const apiVersion = API_VERSIONS.instagram;

    try {
      // access_token must be in the JSON body for the Messaging API (not Authorization header).
      const data = await (await fetchWithRetry(
        `${apiHost}/${apiVersion}/${igUserId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: recipientIgScopedId },
            message: { text: message },
            access_token: accessToken,
          }),
        }
      )).json();

      logger.info('Instagram DM sent via Messaging API', {
        recipientIgScopedId,
        messageId: data.message_id,
        apiHost,
      });
      return { messageId: data.message_id };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const metaCode = (error as any)?.statusCode;
      logger.error('Failed to send Instagram DM via Messaging API', {
        recipientIgScopedId,
        apiHost,
        errorType: err.name,
        errorMessage: err.message,
        httpStatus: metaCode,
      });
      return null;
    }
  }

  /**
   * Checks if an Instagram user (IGSID) follows the business account.
   * Uses the correct API host based on the token type.
   * Best-effort: returns false on any error rather than blocking the caller.
   */
  async checkUserFollowsBusiness(
    accessToken: string,
    recipientIgScopedId: string
  ): Promise<boolean> {
    const apiHost = resolveInstagramApiHost(accessToken);
    const apiVersion = API_VERSIONS.instagram;
    try {
      const res = await fetch(
        `${apiHost}/${apiVersion}/${recipientIgScopedId}?fields=name,username,is_user_follow_business&access_token=${accessToken}`
      );
      if (res.ok) {
        const data = await res.json();
        if (typeof data?.username === 'string' && data.username.trim()) {
          this.fetchedUsernames.set(
            recipientIgScopedId,
            data.username.replace(/^@/, '').trim()
          );
        }
        if (data?.is_user_follow_business === undefined) {
          logger.warn('Meta response missing is_user_follow_business field', {
            recipientIgScopedId,
            apiHost,
            responseKeys: Object.keys(data || {}),
          });
        }
        logger.info('Follow verification result', {
          recipientIgScopedId,
          apiHost,
          isFollowing: data.is_user_follow_business,
        });
        return !!data.is_user_follow_business;
      }

      const errText = await res.text();
      logger.warn('Could not query is_user_follow_business from Meta', {
        recipientIgScopedId,
        apiHost,
        status: res.status,
        error: errText.substring(0, 300),
      });
      return false;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      logger.warn('Error verifying follow status via Meta Graph API', { recipientIgScopedId, error: errorMsg });
      return false;
    }
  }

  /**
   * Sends an interactive DM with Instagram Quick Reply buttons.
   *
   * Uses the correct Messaging API host based on the token type.
   * Falls back to plain text DM via sendPrivateMessage() if Quick Replies are rejected
   * (e.g., account not eligible). Does NOT fall back across API hosts.
   */
  async sendQuickReplyMessage(
    accessToken: string,
    igUserId: string,
    recipientIgScopedId: string,
    text: string,
    quickReplies: Array<{ title: string; payload: string }>
  ): Promise<{ messageId: string } | null> {
    const apiHost = resolveInstagramApiHost(accessToken);
    const apiVersion = API_VERSIONS.instagram;

    const body = JSON.stringify({
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
    });

    try {
      const data = await (await fetchWithRetry(
        `${apiHost}/${apiVersion}/${igUserId}/messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        }
      )).json();

      logger.info('Instagram Quick Reply DM sent successfully', {
        recipientIgScopedId,
        messageId: data.message_id,
        apiHost,
      });
      return { messageId: data.message_id || 'sent' };
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      const metaCode = (err as any)?.statusCode;
      logger.warn('Quick reply send failed — falling back to plain text DM', {
        recipientIgScopedId,
        apiHost,
        errorType: errorObj.name,
        errorMessage: errorObj.message,
        httpStatus: metaCode,
      });
      return await this.sendPrivateMessage(accessToken, igUserId, recipientIgScopedId, text);
    }
  }

  /**
   * Verifies whether an incoming DM sender follows the creator/brand Instagram account.
   *
   * Flow:
   * 1. If requireFollowForDm is disabled, returns handled: false (bypass).
   * 2. Checks Meta Graph API for live follower status using checkUserFollowsBusiness().
   * 3. If NOT following:
   *    - If they tapped "I Followed! ✅" or replied saying they followed, sends a friendly retry reminder.
   *    - Otherwise sends the initial follow prompt with an "I Followed! ✅" Quick Reply button.
   * 4. If FOLLOWED:
   *    - If responding to a follow prompt / confirmation tap, delivers the celebratory unlocked message.
   *    - If already an existing follower, returns handled: false so the normal conversational AI proceeds.
   */
  async processDmFollowGate(input: DmFollowGateInput): Promise<DmFollowGateResult> {
    const { dmEvent, config, accessToken, igUserId, brandUsername, previousLogs } = input;

    if (!config.requireFollowForDm) {
      return { handled: false, isFollowing: true };
    }

    // Query Meta Graph API for live follow status
    const isFollowing = await this.checkUserFollowsBusiness(accessToken, dmEvent.senderId);

    // Enrich missing senderUsername from Meta profile lookup when available
    if (!dmEvent.senderUsername) {
      const cachedUsername = this.fetchedUsernames.get(dmEvent.senderId);
      if (cachedUsername) {
        dmEvent.senderUsername = cachedUsername;
      }
    }
    const resolvedUsername = dmEvent.senderUsername;

    const text = (dmEvent.text || '').trim();
    const isConfirmationText =
      /^(i\s*followed|confirm_follow|done\s*following|already\s*followed|followed\s*you|followed)/i.test(text) ||
      text.toLowerCase().includes('i followed') ||
      text === 'CONFIRM_FOLLOW';

    const logs = previousLogs || [];
    const lastLogWithReply = [...logs].reverse().find(l => l.ai_reply && l.ai_reply !== 'SKIP');
    const lastAiReply = lastLogWithReply?.ai_reply || '';

    const isVerifiedUnlockReply = (reply: string): boolean => {
      const lower = reply.toLowerCase();
      if (
        lower.includes('thanks for following') ||
        lower.includes("you're all set") ||
        lower.includes("you're officially in") ||
        lower.includes('welcome to the inner circle') ||
        lower.includes('verified!') ||
        lower.includes('exclusive access') ||
        lower.includes('vip link')
      ) {
        return true;
      }
      if (config.followVerifiedMessage?.trim()) {
        const staticChunks = config.followVerifiedMessage
          .trim()
          .split(/\{username\}|\{brand\}|\{link\}/)
          .map(s => s.trim().toLowerCase())
          .filter(s => s.length >= 6);
        if (staticChunks.some(chunk => lower.includes(chunk))) {
          return true;
        }
      }
      return false;
    };

    const isFollowAskReply = (reply: string): boolean => {
      if (!reply || isVerifiedUnlockReply(reply)) return false;
      const lower = reply.toLowerCase();
      if (config.followAskMessage?.trim()) {
        const customAskChunks = config.followAskMessage
          .trim()
          .split(/\{username\}|\{brand\}/)
          .map(s => s.trim().toLowerCase())
          .filter(s => s.length >= 6);
        if (customAskChunks.some(chunk => lower.includes(chunk))) {
          return true;
        }
      }
      return (
        lower.includes('make sure you hit "follow"') ||
        lower.includes("couldn't verify your follow") ||
        lower.includes('confirm_follow') ||
        reply.includes('I Followed') ||
        lower.includes('follow')
      );
    };

    const lastFollowStatus = lastLogWithReply?.follow_status;
    const lastReasoning = lastLogWithReply?.reasoning || '';

    const wasAwaitingFollow =
      !!lastLogWithReply &&
      (lastFollowStatus === 'not_following' ||
        lastReasoning.includes('Follow gate prompt_follow') ||
        lastReasoning.includes('Follow gate remind_follow') ||
        (!lastFollowStatus && isFollowAskReply(lastAiReply)));

    const alreadyUnlocked = logs.some(
      l =>
        l.reasoning?.includes('Follow gate follow_confirmed') ||
        (l.follow_verified === true && l.follow_status === 'following' && !!l.ai_reply) ||
        (!!l.ai_reply && isVerifiedUnlockReply(l.ai_reply))
    );

    const isLinkOrDetailsRequest =
      /(?:send|share|give|get|need|want|drop|dm|unlock|where|what(?:'s| is))\b.*\b(link|access|details|resource|template|slug|url|page|guide|pdf)\b|^\s*(?:send\s*(?:me\s*)?(?:the\s*)?)?(?:link|url|details|access|slug|info|template|guide|pdf|resource|send\s*it|send)(?:\s+(?:please|pls|plz|now))?\s*[?!.]*\s*$/i.test(
        text
      );

    const cleanBrand = brandUsername.startsWith('@') ? brandUsername : `@${brandUsername}`;

    // ── Case 1: User has NOT followed yet ──────────────────────────────────
    if (!isFollowing) {
      if (isConfirmationText || wasAwaitingFollow) {
        // User claimed they followed or clicked confirmation, or sent another DM while still not following
        const remindText =
          `We couldn't verify your follow yet! 🧐 Make sure you hit "Follow" on ${cleanBrand}, then tap "I Followed! ✅" below!`;
        const sendRes = await this.sendQuickReplyMessage(
          accessToken,
          igUserId,
          dmEvent.senderId,
          remindText,
          [{ title: 'I Followed! ✅', payload: 'CONFIRM_FOLLOW' }]
        );
        return {
          handled: true,
          action: 'remind_follow',
          replyText: remindText,
          isFollowing: false,
          messageId: sendRes?.messageId,
          resolvedUsername,
        };
      }

      // Initial follow prompt
      const promptTemplate =
        config.followAskMessage?.trim() ||
        `Hey ${dmEvent.senderUsername ? `@${dmEvent.senderUsername}` : 'there'}! 👋 To unlock this, make sure to follow ${cleanBrand}! Tap the button below once you've followed 👇`;
      const promptText = promptTemplate
        .replace(/{username}/g, dmEvent.senderUsername || 'friend')
        .replace(/@?{brand}/g, cleanBrand);

      const sendRes = await this.sendQuickReplyMessage(
        accessToken,
        igUserId,
        dmEvent.senderId,
        promptText,
        [{ title: 'I Followed! ✅', payload: 'CONFIRM_FOLLOW' }]
      );

      return {
        handled: true,
        action: 'prompt_follow',
        replyText: promptText,
        isFollowing: false,
        messageId: sendRes?.messageId,
        resolvedUsername,
      };
    }

    // ── Case 2: User IS following ──────────────────────────────────────────
    const shouldDeliverUnlock =
      isConfirmationText ||
      (wasAwaitingFollow && !alreadyUnlocked) ||
      (!alreadyUnlocked && (config.dmAutoReplyEnabled === false || isLinkOrDetailsRequest));

    if (shouldDeliverUnlock) {
      const targetLink = config.linkUrl?.trim() || '';
      const defaultVerified = targetLink
        ? `Thanks for following ${cleanBrand}! 🎉 You're all set! Here is your exclusive access: ${targetLink} ✨ Let me know if you need anything else!`
        : `Thanks for following ${cleanBrand}! 🎉 You're officially in! What can I help you with today?`;

      const customVerifiedTemplate = config.followVerifiedMessage?.trim();
      let verifiedText = (customVerifiedTemplate || defaultVerified)
        .replace(/{username}/g, dmEvent.senderUsername || 'friend')
        .replace(/@?{brand}/g, cleanBrand)
        .replace(/{link}/g, targetLink);

      // If creator set a custom verified message without a {link} placeholder, append the resolved link automatically
      if (
        customVerifiedTemplate &&
        targetLink &&
        !customVerifiedTemplate.includes('{link}') &&
        !verifiedText.includes(targetLink)
      ) {
        verifiedText = `${verifiedText.trim()}\n\n${targetLink}`;
      }

      const sendRes = await this.sendPrivateMessage(
        accessToken,
        igUserId,
        dmEvent.senderId,
        verifiedText
      );

      const confirmedMessageId = sendRes
        ? (typeof sendRes === 'object' && 'messageId' in sendRes && sendRes.messageId
            ? sendRes.messageId
            : 'sent')
        : undefined;

      return {
        handled: true,
        action: 'follow_confirmed',
        replyText: verifiedText,
        isFollowing: true,
        messageId: confirmedMessageId,
        resolvedUsername,
      };
    }

    // Existing verified follower sending a normal message — proceed with normal DM pipeline
    return { handled: false, isFollowing: true, resolvedUsername };
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
   *
   * Uses the correct API host based on the token type. Does NOT fall back
   * across hosts — a wrong-host error is a persistent OAuth mismatch.
   *
   * fetchWithRetry() throws on 4xx/5xx; the outer catch converts to null + log.
   */
  async sendPrivateReplyToComment(
    accessToken: string,
    commentId: string,
    message: string,
    igUserId?: string
  ): Promise<{ messageId: string } | null> {
    if (!commentId || commentId.startsWith('test_')) {
      logger.debug('Skipping private reply for test/empty comment ID', { commentId });
      return null;
    }

    const apiHost = resolveInstagramApiHost(accessToken);
    const apiVersion = API_VERSIONS.instagram;
    const targetEndpoint = `${apiHost}/${apiVersion}/${igUserId || 'me'}/messages`;

    try {
      const data = await (await fetchWithRetry(
        targetEndpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { comment_id: commentId },
            message: { text: message },
            access_token: accessToken,
          }),
        }
      )).json();

      const messageId = data.message_id || data.id || 'sent';
      logger.info('Private reply sent to comment via Instagram Messaging API', {
        commentId,
        messageId,
        apiHost,
        igUserId: igUserId || 'me',
      });
      return { messageId };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const metaCode = (error as any)?.statusCode;
      logger.error('Failed to send private reply to comment', {
        commentId,
        apiHost,
        errorType: err.name,
        errorMessage: err.message,
        httpStatus: metaCode,
      });
      return null;
    }
  }

  /**
   * DM dispatcher for comment-triggered private messages.
   *
   * Uses ONLY the Private Replies API (POST /{commentId}/private_replies).
   * This is the only Meta-supported way to DM a commenter who may not be
   * inside the 24-hour standard messaging window.
   *
   * Does NOT fall back to the ordinary Messaging API if the private reply is
   * rejected — that would violate Meta's messaging policies and produce
   * unexpected DMs outside the private-reply context.  Callers must handle
   * the null return and log/flag the failure.
   */
  async sendDmForComment(
    accessToken: string,
    igUserId: string,
    commentId: string,
    _recipientIgScopedId: string | undefined,
    message: string
  ): Promise<{ messageId: string } | null> {
    // Comment-triggered private reply via Instagram Messaging API (recipient: { comment_id }).
    // The 7-day eligibility window is enforced by Meta — if rejected, we do not
    // fall back to ordinary messaging which would bypass the window check.
    const result = await this.sendPrivateReplyToComment(accessToken, commentId, message, igUserId);
    if (!result) {
      logger.warn('Private reply rejected — not falling back to ordinary DM (policy)', {
        commentId,
      });
    }
    return result;
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

      // Priority list of subscription endpoints — ordered by token type likelihood.
      // Instagram Login tokens (IGqx…) work on graph.instagram.com.
      // Facebook Business Login tokens (EAA…) work on graph.facebook.com.
      const apiVersion = API_VERSIONS.instagram;
      const endpointsToTry = [
        `https://graph.instagram.com/${apiVersion}/me/subscribed_apps?${params.toString()}`,
        `https://graph.instagram.com/${apiVersion}/${igUserId}/subscribed_apps?${params.toString()}`,
        `https://graph.facebook.com/${apiVersion}/${igUserId}/subscribed_apps?${params.toString()}`,
        `https://graph.facebook.com/${apiVersion}/me/subscribed_apps?${params.toString()}`,
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
