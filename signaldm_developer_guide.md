# SignalDM — Complete Developer Guide

> **What is this?** A full implementation blueprint for building UNOOL's Instagram Automation Engine ("SignalDM") on top of existing codebase infrastructure. This document is written for a developer who has never seen the UNOOL repo before.

---

## Table of Contents

1. [The Story: What Already Exists](#1-the-story-what-already-exists)
2. [What's Broken Right Now](#2-whats-broken-right-now)
3. [The Product Vision: What We're Building](#3-the-product-vision-what-were-building)
4. [Competitive Landscape & Why We Win](#4-competitive-landscape--why-we-win)
5. [Environment Variables Required](#5-environment-variables-required)
6. [Architecture Overview](#6-architecture-overview)
7. [Phase 1: Fix Critical Bugs](#7-phase-1-fix-critical-bugs)
8. [Phase 2: Upgrade the AI Engine](#8-phase-2-upgrade-the-ai-engine)
9. [Phase 3: Build Management API Layer](#9-phase-3-build-management-api-layer)
10. [Phase 4: Database Migrations](#10-phase-4-database-migrations)
11. [Phase 5: Build the Dashboard UI](#11-phase-5-build-the-dashboard-ui)
12. [Phase 6: Integration with Existing UNOOL Features](#12-phase-6-integration-with-existing-unool-features)
13. [Testing Guide](#13-testing-guide)
14. [Meta App Review Checklist](#14-meta-app-review-checklist)
15. [File Map](#15-file-map)

---

## 1. The Story: What Already Exists

UNOOL's codebase already has **~60% of the backend plumbing** for Instagram automation written and functional. This is the hardest, most tedious infrastructure work — OAuth flows, webhook cryptography, database schemas, and AI classification. Here's exactly what exists today:

### 1.1 OAuth & Token Management (✅ Complete)

**File:** [lib/platforms/InstagramAdapter.ts](file:///d:/UNOOLNEW/lib/platforms/InstagramAdapter.ts)

The `InstagramAdapter` class implements the full `PlatformAdapter` interface:

- **OAuth Flow:** Redirects user to `https://www.instagram.com/oauth/authorize` with scopes:
  - `instagram_business_basic`
  - `instagram_business_manage_messages`
  - `instagram_business_manage_comments`
  - `instagram_business_content_publish`
  - `instagram_business_manage_insights`
- **Token Exchange:** Short-lived (1hr) → Long-lived (60 days) token upgrade via `ig_exchange_token`.
- **Token Refresh:** Refreshes long-lived tokens via `ig_refresh_token`.
- **Profile Fetching:** Gets `id`, `username`, `name`, `profile_picture_url` from the Graph API.
- **Publishing:** Supports single image, single video (Reels), and carousel (2–10 items). Uses container-based async upload with polling (`waitForMediaReady` — polls every 3s for up to 90s).
- **Engagement Metrics:** Fetches `like_count`, `comments_count`, `views_count`, `shares_count`.
- **Token Encryption:** All tokens are encrypted at rest using AES-256-GCM via [lib/crypto/encryption.ts](file:///d:/UNOOLNEW/lib/crypto/encryption.ts) before being stored in the database.

### 1.2 Webhook Infrastructure (✅ Complete)

**File:** [app/api/webhooks/instagram/route.ts](file:///d:/UNOOLNEW/app/api/webhooks/instagram/route.ts) (300 lines)

- **GET handler:** Returns the `hub.challenge` for Meta's webhook verification handshake.
- **POST handler:** Receives real-time comment events from Meta, validates HMAC-SHA256 signature using [lib/webhooks/verify.ts](file:///d:/UNOOLNEW/lib/webhooks/verify.ts), and processes each comment event asynchronously.
- **Anti-loop guard:** Skips reply-to-reply comments (`parentId` check) to prevent infinite bot loops.
- **Context fetching:** Fetches the original post's caption from Graph API for AI classification context.
- **Webhook auto-subscription:** When a user connects Instagram via OAuth, the callback route ([app/api/auth/platform/callback/route.ts](file:///d:/UNOOLNEW/app/api/auth/platform/callback/route.ts) lines 219–236) automatically subscribes the account to `comments,messages` webhook fields.

### 1.3 AI Comment Classification (✅ Partially Complete)

**File:** [lib/services/InstagramCommentAutomation.ts](file:///d:/UNOOLNEW/lib/services/InstagramCommentAutomation.ts) (271 lines)

The `InstagramCommentAutomation` class uses Groq's structured JSON generation:

- **6-way classifier:** `positive | question | link_request | negative | spam | unrelated`
- **Structured output:** Uses Zod schema validation on AI output to guarantee well-typed JSON responses.
- **Reply generation:** Generates a `suggestedReply` string alongside classification.
- **Action routing:** Returns `shouldAutoReply` and `shouldFlagForReview` booleans.
- **Public reply posting:** `postPublicReply()` — calls `POST /v20.0/{commentId}/replies`.
- **Private DM:** `sendPrivateMessage()` — calls `POST /v20.0/{igUserId}/messages` using the commenter's Instagram Scoped ID (IGSID).

### 1.4 Database Schema (✅ Complete)

**File:** [supabase/migrations/20261006000001_instagram_comment_automation.sql](file:///d:/UNOOLNEW/supabase/migrations/20261006000001_instagram_comment_automation.sql) (104 lines)

Three tables with RLS policies:

| Table | Purpose |
|---|---|
| `instagram_automation_config` | Per-workspace settings: `enabled`, `auto_reply_positive`, `auto_reply_questions`, `auto_reply_link_requests`, `link_url`, `custom_instructions`, `flag_negative`, `flag_spam` |
| `instagram_comment_logs` | Full audit trail: every processed comment, classification, confidence, suggested reply, whether auto-replied |
| `instagram_flagged_comments` | Review queue: `status` = `pending | approved | rejected | replied`, plus `owner_reply` field |

### 1.5 Existing AI Engines We Can Reuse

| Engine | File | Relevance to SignalDM |
|---|---|---|
| **ContentGuard** | [lib/ai/ContentGuard.ts](file:///d:/UNOOLNEW/lib/ai/ContentGuard.ts) | Already blocks terrorism, CSAM, doxxing, financial fraud, self-harm content. **Reuse this to filter incoming comments AND outgoing AI replies.** |
| **ContentHumanizer** | [lib/ai/engines/ContentHumanizer.ts](file:///d:/UNOOLNEW/lib/ai/engines/ContentHumanizer.ts) | Strips "AI slop" vocabulary (`delve`, `tapestry`, `leverage`, etc.) and removes invisible Unicode watermarks. **Run every AI-generated reply through this before posting.** |
| **HookScorer** | [lib/ai/engines/HookScorer.ts](file:///d:/UNOOLNEW/lib/ai/engines/HookScorer.ts) | Contains 26 hook formulas and Instagram's 125-char fold window. Can be used to score the quality of conversational reply hooks. |
| **FoldLinter** | [lib/ai/engines/FoldLinter.ts](file:///d:/UNOOLNEW/lib/ai/engines/FoldLinter.ts) | Instagram fold spec (125 chars, 5 hashtag cap, `first_comment` placement). |

### 1.6 Platform Connection UI (✅ Complete)

**File:** [components/dashboard/PlatformConnections.tsx](file:///d:/UNOOLNEW/components/dashboard/PlatformConnections.tsx)

Instagram appears as a connectable platform with gradient branding, OAuth redirect flow, and status display. But there is **zero UI** for automation settings, comment logs, or the flagged inbox.

---

## 2. What's Broken Right Now

### Bug #1: QStash First-Comment Causes Full Republish (CRITICAL)

**File:** [app/api/webhooks/qstash/publish/route.ts](file:///d:/UNOOLNEW/app/api/webhooks/qstash/publish/route.ts) lines 102–141

**The problem:** When a scheduled post publishes successfully, the system schedules a follow-up QStash task 90 seconds later with `variantId: "first-comment:{variantId}:{platformPostId}"`. When this task arrives at the webhook handler, the code checks:

```typescript
if (variantId && !variantId.startsWith('first-comment:')) {
  // publishes single variant
}
// Falls through to:
await publishService.publishToAllPlatforms(postId, workspaceId);
```

The `first-comment:` prefixed variantId **passes the guard check** (it does start with `first-comment:`) but then **falls through to the catch-all** which republishes the entire post to ALL platforms. This is a duplicate-post bug.

**The fix:** Add an explicit handler for `first-comment:` events that parses out the platform post ID and posts a comment via the Graph API instead of republishing.

### Bug #2: InstagramAdapter.publish() Ignores firstComment

**File:** [lib/platforms/InstagramAdapter.ts](file:///d:/UNOOLNEW/lib/platforms/InstagramAdapter.ts) lines 161–338

The `publish()` method receives `input: PublishInput` which has `firstComment?: string`, but it is completely ignored. The method never calls the comment creation endpoint.

**The fix:** After `media_publish` succeeds, if `input.firstComment` exists, call `POST /v20.0/{platformPostId}/comments` with the first comment text.

### Bug #3: No Frontend to Enable Automation

The `instagram_automation_config` table defaults `enabled = false`. There is:
- No API route to read or update this config
- No dashboard UI to toggle it
- No way for a user to set their `link_url` or `custom_instructions`

**Result:** The automation feature is literally dead code. A user cannot turn it on without direct SQL access to Supabase.

### Bug #4: Zero Reply Variance

The current AI prompt in `InstagramCommentAutomation.ts` generates a single reply pattern. If 50 people comment similar things on a viral Reel, the AI will produce near-identical replies like:
- "Thanks so much! 🙏"
- "Thank you! 🙏"
- "Thanks! Really appreciate it 🙏"

Meta's anti-spam system detects this and will **action-block** the account within hours.

---

## 3. The Product Vision: What We're Building

### SignalDM in One Sentence
> An AI-powered autonomous Instagram comment handler that classifies intent, generates human-quality conversational replies, delivers personalized DMs, and boosts algorithmic reach — without rigid keyword triggers, without getting banned, and without sounding like a robot.

### The 5 Intelligence Layers

#### Layer 1: Semantic Intent Classification (Not Keywords)
Traditional tools like ManyChat require exact keyword triggers ("Comment LINK to get the PDF"). If a user comments "Where can I get this?", "Can you send the template?", or "Take my money" — keyword bots fail.

SignalDM uses Groq LLM classification to understand **intent** regardless of phrasing:

| Comment | ManyChat Response | SignalDM Response |
|---|---|---|
| "LINK" | ✅ Sends DM | ✅ Sends DM |
| "Where can I buy this?" | ❌ Nothing | ✅ Detects `link_request` intent, sends DM |
| "Can you send the guide?" | ❌ Nothing | ✅ Detects `link_request` intent, sends DM |
| "Need this for my clients" | ❌ Nothing | ✅ Detects high-value lead intent |

#### Layer 2: Conversational Thread-Chaining (Algorithm Booster)
Instagram's 2025-2026 algorithm heavily rewards **multi-turn comment threads**. Instead of dead-end replies ("Sent! Check DMs"), SignalDM generates replies that end with a conversational question:

```
Comment: "This workflow changed how I organize sprints."
Dead-end reply: "Thanks! Glad you liked it! 🙏"  ← Algorithm ignores
SignalDM reply: "That's great to hear — are you running it solo or across a team right now?" ← User replies back, algorithm boosts
```

#### Layer 3: Anti-Ban Humanization Engine
Meta bans accounts that:
1. Reply instantly (bot signal)
2. Use identical phrasing repeatedly (spam signal)
3. Exceed hourly action limits during viral spikes

SignalDM implements:
- **Poisson jitter delays:** Random 25–120 second pause before each reply
- **Lexical entropy:** Ensures no two replies in a 24-hour window share identical sentence structure
- **Velocity throttling:** Automatically spreads replies during viral spikes to stay within Meta's rate limits (200 API actions/hour)
- **Slop filter:** Runs every reply through `ContentHumanizer` to strip AI fingerprints

#### Layer 4: Brand Safety Shield
- Passes all incoming comments through `ContentGuard` to detect terrorism, fraud, CSAM, doxxing
- Auto-flags negative/angry comments for human review instead of auto-replying
- De-escalation psychology for angry customers: empathetic, non-defensive responses

#### Layer 5: Brand Voice Persona
- Users configure their brand tone ("lowercase aesthetic, punchy, witty", or "professional, technical, academic")
- Custom rules ("Never use 'game-changer'. Write like a seasoned engineering founder.")
- Learning loop: when owners edit flagged reply suggestions, the system remembers corrections

---

## 4. Competitive Landscape & Why We Win

### Market Leaders Researched

| Tool | Type | Pricing | Trigger | Reply Quality |
|---|---|---|---|---|
| **ManyChat** | Flow builder | Per-contact (expensive at scale) | Exact keywords only | Static templates |
| **LinkDM** | Comment-to-DM | Flat $19/mo (25k DMs) | Exact keywords only | Static templates |
| **InstantDM** | Comment-to-DM | $10/mo | Keywords + basic AI | Generic templates |
| **SendDM** | Comment-to-DM | Low flat-rate | Keywords | Static templates |
| **Inrō** | AI knowledge base | Premium | AI but no first-comment | AI replies (generic) |
| **Chatfuel** | Omnichannel | Per-contact | Keywords + basic AI | Template-based |
| **Komently** | Marketing suite | Premium | Keywords | Template + competitor intel |

### Where UNOOL SignalDM Kills Them

1. **No keyword rigidity.** Semantic intent detection understands natural language.
2. **Not a separate tool.** Integrated directly with UNOOL's Composer, Scheduler, Flight Plan, and Bio Link — a complete content-to-conversion loop.
3. **Anti-ban by design.** Not an afterthought. Jitter, entropy, velocity control are core.
4. **No per-contact tax.** Part of the UNOOL workspace, not a separate SaaS billing you per subscriber.
5. **Replies that don't sound like a bot.** ContentHumanizer strips AI slop. Thread-chaining creates genuine conversations.

---

## 5. Environment Variables Required

These are the env vars needed. Most already exist in [lib/config/schema.ts](file:///d:/UNOOLNEW/lib/config/schema.ts). Verify all are set:

### Already Defined in schema.ts (Verify they're in .env)

```env
# ─── Instagram OAuth (Meta Developer Console → Your App → Settings → Basic) ───
INSTAGRAM_CLIENT_ID=your_instagram_app_id
INSTAGRAM_CLIENT_SECRET=your_instagram_app_secret
INSTAGRAM_REDIRECT_URI=https://yourdomain.com/api/auth/platform/callback

# ─── Meta Webhook (Meta Developer Console → Your App → Webhooks) ─────────────
META_WEBHOOK_SECRET=your_webhook_app_secret
META_WEBHOOK_VERIFY_TOKEN=your_custom_verify_string

# ─── AI Provider (Groq Console → API Keys) ───────────────────────────────────
GROQ_API_KEY=gsk_xxxxxxxxxxxx
AI_GROQ_MODEL=qwen/qwen3.8-27b

# ─── Supabase ─────────────────────────────────────────────────────────────────
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx

# ─── Token Encryption ────────────────────────────────────────────────────────
ENCRYPTION_KEY=your_32_char_encryption_key

# ─── QStash (Upstash Console → QStash) ────────────────────────────────────────
QSTASH_TOKEN=your_qstash_token
QSTASH_CURRENT_SIGNING_KEY=sig_xxxx
QSTASH_NEXT_SIGNING_KEY=sig_xxxx

# ─── App URL ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### How to Get Them

| Variable | Where to Get It |
|---|---|
| `INSTAGRAM_CLIENT_ID` / `SECRET` | [Meta Developer Console](https://developers.facebook.com) → Your App → Instagram → Basic Display → App ID and App Secret |
| `META_WEBHOOK_SECRET` | Same console → Your App → Settings → Basic → App Secret (this is the HMAC signing key) |
| `META_WEBHOOK_VERIFY_TOKEN` | You make this up — any random string. You enter the same string in Meta's webhook config UI. |
| `GROQ_API_KEY` | [Groq Console](https://console.groq.com) → API Keys → Create |
| `ENCRYPTION_KEY` | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `QSTASH_TOKEN` | [Upstash Console](https://console.upstash.com) → QStash → REST API → Token |

### Meta Developer Console: Webhook Configuration

In the Meta Developer Console, set:
- **Callback URL:** `https://yourdomain.com/api/webhooks/instagram`
- **Verify Token:** The same value as your `META_WEBHOOK_VERIFY_TOKEN` env var
- **Subscription Fields:** Check `comments` and `messages`

---

## 6. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SIGNALDM SYSTEM ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌──────────────────┐
                         │  Instagram User   │
                         │  Comments on Reel │
                         └────────┬─────────┘
                                  │
                         ┌────────▼─────────┐
                         │ Meta Webhook Push │
                         │ (x-hub-signature) │
                         └────────┬─────────┘
                                  │
            ┌─────────────────────▼──────────────────────┐
            │  app/api/webhooks/instagram/route.ts       │
            │                                             │
            │  1. Verify HMAC-SHA256 signature            │
            │  2. Return 200 immediately                  │
            │  3. processCommentEvent() async             │
            └─────────────────────┬──────────────────────┘
                                  │
            ┌─────────────────────▼──────────────────────┐
            │  processCommentEvent()                      │
            │                                             │
            │  1. Find platform_connection by igUserId    │
            │  2. Decrypt access token (AES-256-GCM)      │
            │  3. Load automation config from DB          │
            │  4. Check: enabled? Skip if disabled.       │
            │  5. Fetch post caption for context           │
            └─────────────────────┬──────────────────────┘
                                  │
       ┌──────────────────────────▼──────────────────────────┐
       │  lib/services/InstagramCommentAutomation.ts         │
       │                                                      │
       │  INPUT:                                               │
       │   - comment.text + comment.username                   │
       │   - postCaption (from Graph API)                      │
       │   - automationConfig (brand persona, rules)           │
       │                                                      │
       │  PROCESSING:                                          │
       │   1. ContentGuard.check(comment.text) → block harmful │
       │   2. Groq LLM classifies intent (6 categories)       │
       │   3. Generates conversational reply with thread hook  │
       │   4. ContentHumanizer.strip(reply) → remove AI slop  │
       │   5. LexicalEntropy.check(reply) → ensure uniqueness │
       │   6. PoissonJitter.delay() → humanized timing        │
       │                                                      │
       │  OUTPUT: ClassifiedComment                            │
       │   { classification, confidence, suggestedReply,       │
       │     shouldAutoReply, shouldFlagForReview, reasoning } │
       └──────────┬──────────────┬──────────────┬─────────────┘
                  │              │              │
    ┌─────────────▼──┐  ┌───────▼───────┐  ┌──▼─────────────┐
    │ AUTO-REPLY      │  │ AUTO-DM       │  │ FLAG FOR REVIEW│
    │                 │  │               │  │                │
    │ POST /replies   │  │ POST /messages│  │ INSERT INTO    │
    │ (public reply)  │  │ (private DM)  │  │ flagged_inbox  │
    └─────────────────┘  └───────────────┘  └────────────────┘
                  │              │              │
                  └──────────────┼──────────────┘
                                 │
                  ┌──────────────▼──────────────┐
                  │  instagram_comment_logs      │
                  │  (full audit trail)           │
                  └──────────────────────────────┘
```

---

## 7. Phase 1: Fix Critical Bugs

### Fix 1A: QStash First-Comment Handler

**File to edit:** [app/api/webhooks/qstash/publish/route.ts](file:///d:/UNOOLNEW/app/api/webhooks/qstash/publish/route.ts)

**Current broken code (line 102):**
```typescript
if (variantId && !variantId.startsWith('first-comment:')) {
  // ... publishes single variant ...
}
// Falls through to publishToAllPlatforms ← BUG: republishes everything
```

**Fix:** Add an explicit handler BEFORE the catch-all:

```typescript
// ── First-comment dispatch ──────────────────────────────────────────
if (variantId && variantId.startsWith('first-comment:')) {
  const parts = variantId.split(':');
  // Format: "first-comment:{originalVariantId}:{platformPostId}"
  const originalVariantId = parts[1];
  const platformPostId = parts[2];

  if (!platformPostId || !autoFirstComment) {
    return NextResponse.json({ skipped: true, reason: 'missing_first_comment_data' });
  }

  const variant = await postRepository.findVariantById(originalVariantId);
  if (!variant) {
    return NextResponse.json({ skipped: true, reason: 'variant_not_found' });
  }

  // Get the platform connection and decrypt token
  const connection = await getConnectionForVariant(variant, workspaceId);
  if (!connection) {
    return NextResponse.json({ skipped: true, reason: 'no_connection' });
  }

  const adapter = getPlatformAdapter(variant.platform);
  if (!adapter) {
    return NextResponse.json({ skipped: true, reason: 'no_adapter' });
  }

  // Post the first comment
  try {
    const accessToken = await decryptToken(connection.access_token_encrypted);
    await postFirstComment(accessToken, platformPostId, autoFirstComment, variant.platform);
    logger.info('First comment posted successfully', { platformPostId, platform: variant.platform });
  } catch (err) {
    logger.error('Failed to post first comment', { error: err, platformPostId });
  }

  return NextResponse.json({ success: true, firstComment: true });
}
```

### Fix 1B: Implement First-Comment in InstagramAdapter

**File to edit:** [lib/platforms/InstagramAdapter.ts](file:///d:/UNOOLNEW/lib/platforms/InstagramAdapter.ts)

After `media_publish` succeeds in the `publish()` method, add:

```typescript
// Post first comment if provided (delayed by the QStash 90s timer)
// This is called separately via the first-comment QStash handler
```

Create a standalone helper function (used by the QStash handler):

```typescript
// lib/platforms/firstComment.ts
export async function postFirstComment(
  accessToken: string,
  platformPostId: string,
  commentText: string,
  platform: string
): Promise<void> {
  if (platform !== 'instagram') {
    // Other platforms can be added later
    return;
  }

  const params = new URLSearchParams({
    message: commentText,
    access_token: accessToken,
  });

  const response = await fetchWithRetry(
    `https://graph.instagram.com/v20.0/${platformPostId}/comments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`First comment failed: ${error}`);
  }
}
```

---

## 8. Phase 2: Upgrade the AI Engine

### 8.1 New Classification Schema

**File:** [lib/services/InstagramCommentAutomation.ts](file:///d:/UNOOLNEW/lib/services/InstagramCommentAutomation.ts)

Replace the classification schema with an expanded version:

```typescript
const classificationSchema = z.object({
  // Primary classification
  classification: z.enum([
    'positive',       // Compliments, praise, emojis
    'question',       // Genuine questions about content
    'link_request',   // Explicit or implicit "send me the link"
    'purchase_intent',// "How much?", "Where to buy?", "Take my money"
    'negative',       // Criticism, complaints
    'spam',           // Bots, promo, scam links
    'harmful',        // Terrorism, hate speech, doxxing
    'unrelated',      // Off-topic
  ]),

  // How confident the model is (0.0 – 1.0)
  confidence: z.number().min(0).max(1),

  // The public comment reply (conversational, ends with a hook question)
  suggestedReply: z.string(),

  // Separate DM message (only for link_request / purchase_intent)
  suggestedDM: z.string().nullable(),

  // Conversation thread hook — a question to keep the thread going
  threadHook: z.string().nullable(),

  // Lead signal strength (0 = not a lead, 1 = warm, 2 = hot, 3 = ready to buy)
  leadScore: z.number().min(0).max(3),

  // Action flags
  shouldAutoReply: z.boolean(),
  shouldSendDM: z.boolean(),
  shouldFlagForReview: z.boolean(),

  // Brief reasoning for classification
  reasoning: z.string(),
});
```

### 8.2 The Upgraded Prompt

The prompt must be significantly more sophisticated than the current one. Key requirements:

1. **Never produce generic replies.** Every reply must reference something specific from the comment or post caption.
2. **Thread-chaining.** Every public reply that is auto-sent MUST end with a conversational question to drive a second reply from the user.
3. **Brand persona injection.** The `customInstructions` from the automation config must be deeply respected.
4. **Anti-duplication directive.** Explicitly instruct the model to vary vocabulary, sentence structure, emoji placement, and opening words for every single reply.

```typescript
const prompt = `You are an autonomous Instagram engagement engine for a brand account.

═══════════════════════════════════════════════════════════
CONTEXT
═══════════════════════════════════════════════════════════
Post caption: "${postCaption}"
Comment by @${comment.username}: "${comment.text}"
${config.customInstructions ? `Brand voice instructions: "${config.customInstructions}"` : ''}
Recent replies already sent (DO NOT repeat these patterns):
${recentReplies.map((r, i) => `  ${i+1}. "${r}"`).join('\n')}

═══════════════════════════════════════════════════════════
CLASSIFICATION RULES
═══════════════════════════════════════════════════════════
Classify into ONE category:
- "positive": Compliments, praise, emoji reactions (❤️🔥👏)
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

RULE 1: NEVER write a generic reply. Every reply MUST reference something
specific from either the comment text or the post caption. Bad: "Thanks!"
Good: "That sprint workflow shift is a real unlock—"

RULE 2: Every public reply for positive/question/link_request MUST end
with a SHORT conversational question (the "thread hook") to provoke the
user into replying back. This drives Instagram's algorithm. Bad: "Sent it
to your DMs!" Good: "Just sent it over! Are you building this for personal
use or a client project?"

RULE 3: NEVER start two consecutive replies with the same opening word.
NEVER use the same emoji placement pattern twice. Vary sentence length.
Vary tone slightly between replies.

RULE 4: For "negative" comments — write a professional, empathetic,
non-defensive response. Acknowledge their frustration. Offer to resolve
in DMs. Never argue publicly.

RULE 5: For "spam" or "harmful" — set suggestedReply to "SKIP" and set
shouldFlagForReview to true.

RULE 6: For "link_request" or "purchase_intent" — write a short public
reply confirming you'll DM the link, then provide a separate suggestedDM
message that includes the link and a personal greeting.

RULE 7: Strip ALL AI slop vocabulary: "delve", "tapestry", "leverage",
"seamlessly", "game-changer", "robust", "innovative". Write like a real
human who runs this account, not like ChatGPT.

RULE 8: Maximum 2 emojis per reply. No emoji walls. No 🙏🙏🙏.

═══════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════
Return ONLY valid JSON matching this structure (no markdown, no explanation):
{
  "classification": "positive|question|link_request|purchase_intent|negative|spam|harmful|unrelated",
  "confidence": 0.0-1.0,
  "suggestedReply": "the public comment reply text",
  "suggestedDM": "the private DM text or null",
  "threadHook": "the conversational question embedded in the reply",
  "leadScore": 0-3,
  "shouldAutoReply": true/false,
  "shouldSendDM": true/false,
  "shouldFlagForReview": true/false,
  "reasoning": "1-sentence explanation"
}`;
```

### 8.3 Anti-Ban Humanization Engine

Add these utilities to the automation service:

```typescript
// lib/services/automation/jitter.ts

/**
 * Poisson-distributed random delay to simulate human reaction time.
 * Mean: 45 seconds. Range: 25–120 seconds.
 */
export function getHumanizedDelayMs(): number {
  // Poisson-like distribution centered around 45s
  const lambda = 45;
  const u = Math.random();
  // Inverse CDF approximation clamped to [25, 120] seconds
  const raw = -lambda * Math.log(1 - u);
  const clamped = Math.max(25, Math.min(120, raw));
  return Math.round(clamped * 1000);
}

/**
 * Tracks recent replies to enforce lexical diversity.
 * Stores last 50 reply opening phrases per workspace.
 */
export class LexicalEntropyGuard {
  private recentOpenings: Map<string, string[]> = new Map();

  getRecentReplies(workspaceId: string): string[] {
    return this.recentOpenings.get(workspaceId) || [];
  }

  recordReply(workspaceId: string, reply: string): void {
    const list = this.recentOpenings.get(workspaceId) || [];
    list.push(reply);
    if (list.length > 50) list.shift();
    this.recentOpenings.set(workspaceId, list);
  }
}

/**
 * Velocity throttle — cap at 30 replies per hour per workspace.
 * Meta's limit is ~200 API actions/hour, but we stay conservative.
 */
export class VelocityThrottle {
  private hourlyCount: Map<string, { count: number; resetAt: number }> = new Map();

  canReply(workspaceId: string): boolean {
    const now = Date.now();
    const entry = this.hourlyCount.get(workspaceId);
    if (!entry || now > entry.resetAt) {
      this.hourlyCount.set(workspaceId, { count: 0, resetAt: now + 3600_000 });
      return true;
    }
    return entry.count < 30;
  }

  recordReply(workspaceId: string): void {
    const entry = this.hourlyCount.get(workspaceId);
    if (entry) entry.count++;
  }
}
```

### 8.4 Integration with ContentGuard and ContentHumanizer

In the webhook handler, before sending any reply:

```typescript
import { ContentGuard } from '@/lib/ai/ContentGuard';
import { ContentHumanizer } from '@/lib/ai/engines/ContentHumanizer';

// 1. Check incoming comment for harmful content
const commentGuard = ContentGuard.check(commentEvent.text);
if (!commentGuard.safe && commentGuard.violation.level === 'blocked') {
  // Log and skip — don't engage with harmful content
  await flagCommentForReview(workspaceId, commentEvent, {
    classification: 'harmful',
    suggestedReply: 'SKIP',
    reasoning: commentGuard.violation.message,
  });
  return;
}

// 2. After AI generates the reply, humanize it
if (result.shouldAutoReply && result.suggestedReply !== 'SKIP') {
  const humanized = await ContentHumanizer.humanize(result.suggestedReply, 'instagram');
  result.suggestedReply = humanized.content;
}
```

---

## 9. Phase 3: Build Management API Layer

### Route 1: GET/PUT /api/instagram/automation

```
GET  /api/instagram/automation?workspaceId=xxx
  → Returns the current automation config for the workspace

PUT  /api/instagram/automation
  Body: { workspaceId, enabled, autoReplyPositive, autoReplyQuestions,
          autoReplyLinkRequests, linkUrl, customInstructions,
          flagNegative, flagSpam, brandPersona, maxRepliesPerHour }
  → Upserts the automation config
```

### Route 2: GET /api/instagram/comments

```
GET  /api/instagram/comments?workspaceId=xxx&page=1&limit=20&classification=positive
  → Returns paginated comment logs with classification breakdown

Response: {
  comments: [...],
  stats: {
    total: 1234,
    byClassification: { positive: 500, question: 200, link_request: 150, ... },
    autoReplied: 800,
    flagged: 50,
    dmsSent: 300
  }
}
```

### Route 3: GET/POST /api/instagram/flagged

```
GET  /api/instagram/flagged?workspaceId=xxx&status=pending
  → Returns pending flagged comments needing owner review

POST /api/instagram/flagged/{id}/action
  Body: { action: 'approve' | 'reject' | 'reply', ownerReply?: string }
  → Approves (posts AI reply), rejects (hides), or posts custom owner reply
```

### Route 4: POST /api/instagram/simulate

```
POST /api/instagram/simulate
  Body: { workspaceId, commentText, postCaption }
  → Runs the full classification pipeline WITHOUT posting anything
  → Returns the classification result and preview of what would happen

Response: {
  classification: 'link_request',
  confidence: 0.97,
  suggestedReply: "Just dropped it in your DMs! What are you building with it?",
  suggestedDM: "Hey @testuser! Here's the template: https://...",
  threadHook: "What are you building with it?",
  leadScore: 2,
  wouldAutoReply: true,
  wouldSendDM: true
}
```

This is **the killer feature** — a live sandbox where creators can test how the AI responds before going live.

---

## 10. Phase 4: Database Migrations

Create a new migration to extend the existing schema:

```sql
-- Migration: Extend instagram automation for SignalDM v2

-- 1. Add new columns to automation config
ALTER TABLE instagram_automation_config
  ADD COLUMN IF NOT EXISTS brand_persona TEXT,
  ADD COLUMN IF NOT EXISTS max_replies_per_hour INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS jitter_min_seconds INTEGER NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS jitter_max_seconds INTEGER NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS thread_chaining_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS dm_template TEXT,
  ADD COLUMN IF NOT EXISTS auto_hide_spam BOOLEAN NOT NULL DEFAULT false;

-- 2. Add lead_score and dm_sent tracking to comment logs
ALTER TABLE instagram_comment_logs
  ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dm_sent BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dm_message TEXT,
  ADD COLUMN IF NOT EXISTS reply_delay_ms INTEGER,
  ADD COLUMN IF NOT EXISTS thread_hook TEXT;

-- 3. Add priority to flagged comments
ALTER TABLE instagram_flagged_comments
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;

-- 4. Create rate limiting tracking table
CREATE TABLE IF NOT EXISTS instagram_reply_velocity (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  hour_bucket TIMESTAMPTZ NOT NULL,
  reply_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (workspace_id, hour_bucket)
);

-- 5. Indexes for the new queries
CREATE INDEX IF NOT EXISTS idx_ig_logs_classification
  ON instagram_comment_logs(workspace_id, classification, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ig_logs_lead_score
  ON instagram_comment_logs(workspace_id, lead_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ig_velocity_bucket
  ON instagram_reply_velocity(workspace_id, hour_bucket DESC);
```

---

## 11. Phase 5: Build the Dashboard UI

### 11.1 New Dashboard Route

Create: `app/dashboard/automation/page.tsx` and `app/dashboard/automation/AutomationClient.tsx`

Add to the sidebar navigation in [app/dashboard/layout.tsx](file:///d:/UNOOLNEW/app/dashboard/layout.tsx) (line 33):

```typescript
{
  name: 'Automation',
  href: '/dashboard/automation',
  icon: Zap,  // from lucide-react
  description: 'Instagram comment automation',
},
```

### 11.2 UI Sections

The automation dashboard has **4 tabs**:

#### Tab 1: "Control Panel"
- **Master toggle:** Enable/disable automation (big switch)
- **Link URL input:** The URL to send via DM for link requests
- **Brand Persona textarea:** How the AI should talk ("Witty, lowercase, no buzzwords...")
- **Custom rules textarea:** Specific instructions ("Never mention competitor X")
- **Toggles:** Auto-reply positive, auto-reply questions, auto-reply link requests, flag negative, flag spam
- **Rate limiting:** Max replies per hour slider (5–60, default 30)
- **Jitter range:** Min/max seconds slider

#### Tab 2: "Live Simulator"
- **Split-pane layout:**
  - Left: Text input for "Test Comment" + optional "Post Caption" field
  - Right: Live preview showing:
    - Classification badge (e.g., `🟢 link_request — 97% confidence`)
    - The exact public reply that would be posted
    - The exact DM that would be sent
    - Lead score indicator
    - "Would auto-reply: ✅" / "Would flag: ⚠️"
- **"Test" button** that calls `POST /api/instagram/simulate`
- This lets creators verify the AI's behavior before going live

#### Tab 3: "Comment Feed"
- Real-time feed of all processed comments (pulls from `instagram_comment_logs`)
- Each row shows: commenter username, comment text, classification badge, AI reply, DM status, lead score, timestamp
- Filter by classification type
- Stats banner: Total processed, auto-replied, DMs sent, flagged

#### Tab 4: "Flagged Inbox"
- Shows all comments with `status = 'pending'` from `instagram_flagged_comments`
- Each card shows: comment text, classification, AI's suggested reply (editable), reasoning
- **3 action buttons per card:**
  - ✅ **Approve** — Posts the AI reply as-is
  - ✏️ **Edit & Reply** — Edit the reply text, then post
  - ❌ **Dismiss** — Mark as rejected, don't reply

---

## 12. Phase 6: Integration with Existing UNOOL Features

### 12.1 Integration with Composer (Studio)

When a user composes an Instagram post in the Composer ([app/dashboard/composer/ComposerClient.tsx](file:///d:/UNOOLNEW/app/dashboard/composer/ComposerClient.tsx)), and they have automation enabled:

- Show a small badge/indicator: "🤖 SignalDM Active — comments will be auto-handled"
- The `firstCommentHint` field already exists in the composer UI (line 2200). Wire it to the first-comment QStash pipeline.

### 12.2 Integration with Flight Plan

When scheduling a week of content via Flight Plan ([app/dashboard/flightplan/FlightPlanClient.tsx](file:///d:/UNOOLNEW/app/dashboard/flightplan/FlightPlanClient.tsx)):

- Show automation status per post
- Allow setting per-post link URLs (e.g., different lead magnets for different posts)

### 12.3 Integration with Bio Link / Profile

When the automation sends a DM with `linkUrl`, use the creator's UNOOL profile URL (`unool.com/u/{subdomain}`) as the default link. This drives traffic to their personal brand hub rather than a random external link.

### 12.4 Integration with Signal (Analytics)

In the Signal dashboard ([app/dashboard/signal/SignalClient.tsx](file:///d:/UNOOLNEW/app/dashboard/signal/SignalClient.tsx)):

- Add an "Automation" card showing:
  - Comments processed today
  - DMs delivered today
  - Hot leads detected
  - Flagged items pending review

---

## 13. Testing Guide

### 13.1 Unit Tests to Write

Create `lib/services/__tests__/InstagramCommentAutomation.test.ts`:

```typescript
describe('InstagramCommentAutomation', () => {
  describe('classifyAndGenerateReply', () => {
    it('classifies "Where can I get this?" as link_request', async () => { ... });
    it('classifies "🔥🔥🔥" as positive', async () => { ... });
    it('classifies "How much does this cost?" as purchase_intent', async () => { ... });
    it('classifies "This is a scam" as negative', async () => { ... });
    it('classifies crypto spam as spam', async () => { ... });
    it('never generates two identical reply openings', async () => { ... });
    it('always includes a thread hook question for positive/question', async () => { ... });
    it('never includes slop words (delve, tapestry, leverage)', async () => { ... });
    it('respects brand persona instructions', async () => { ... });
    it('returns shouldFlagForReview=true for negative comments', async () => { ... });
  });
});
```

Create `lib/services/__tests__/jitter.test.ts`:

```typescript
describe('Humanization Jitter', () => {
  it('generates delays between 25s and 120s', () => { ... });
  it('has a mean around 45s over 1000 samples', () => { ... });
});

describe('VelocityThrottle', () => {
  it('allows up to 30 replies per hour', () => { ... });
  it('blocks the 31st reply', () => { ... });
  it('resets after the hour window', () => { ... });
});
```

### 13.2 Integration Tests

Create `app/api/webhooks/instagram/__tests__/route.test.ts`:

```typescript
describe('Instagram Webhook', () => {
  describe('GET (verification)', () => {
    it('returns challenge when verify_token matches', async () => { ... });
    it('returns 403 when verify_token does not match', async () => { ... });
  });

  describe('POST (comment event)', () => {
    it('returns 200 immediately regardless of processing result', async () => { ... });
    it('rejects invalid HMAC signatures with 401', async () => { ... });
    it('skips non-instagram object payloads', async () => { ... });
    it('skips reply-to-reply comments (parentId set)', async () => { ... });
    it('skips when automation is disabled', async () => { ... });
  });
});
```

### 13.3 End-to-End Manual Testing

#### Step 1: Test Webhook Verification
```bash
curl "https://yourdomain.com/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
# Expected: 200 with body "test123"
```

#### Step 2: Test Webhook with Fake Comment Event
```bash
curl -X POST https://yourdomain.com/api/webhooks/instagram \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=COMPUTED_HASH" \
  -d '{
    "object": "instagram",
    "entry": [{
      "id": "YOUR_IG_USER_ID",
      "changes": [{
        "field": "comments",
        "value": {
          "id": "test_comment_123",
          "text": "Where can I get this template?",
          "from": { "id": "commenter_456", "username": "testuser" },
          "media": { "id": "media_789" },
          "created_time": "2026-10-14T10:00:00Z"
        }
      }]
    }]
  }'
# Expected: 200 with { "received": true }
# Check instagram_comment_logs table for the processed entry
```

#### Step 3: Test the Simulator API
```bash
curl -X POST https://yourdomain.com/api/instagram/simulate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "workspaceId": "xxx",
    "commentText": "This is exactly what I need for my startup!",
    "postCaption": "5 things I learned building a SaaS from zero to $10k MRR"
  }'
# Expected: Full classification result with preview
```

#### Step 4: Test Anti-Duplication
Send 10 similar positive comments through the simulator and verify:
- No two replies start with the same word
- No two replies use the same emoji pattern
- All replies reference something specific from the comment

#### Step 5: Test Rate Limiting
Send 35 comments rapidly and verify:
- First 30 get auto-replied
- Comments 31–35 get queued/delayed, not dropped

### 13.4 Meta App Review Testing

Before submitting for Meta App Review, verify:
- [ ] OAuth flow works end-to-end (connect → token → long-lived token)
- [ ] Webhook receives real comments from a test Instagram Business account
- [ ] Public replies appear correctly on the Instagram post
- [ ] DMs arrive in the commenter's Instagram inbox
- [ ] Token refresh works before the 60-day expiry
- [ ] Disconnecting the account in UNOOL unsubscribes from webhooks

---

## 14. Meta App Review Checklist

> [!CAUTION]
> Without passing Meta App Review, automation will ONLY work for the app developer's own test account. Real users cannot use it until these permissions are approved.

### Required Permissions for App Review

| Permission | Why We Need It | Status |
|---|---|---|
| `instagram_business_basic` | Read user profile, media | Already requested |
| `instagram_business_content_publish` | Publish posts, reels, carousels | Already requested |
| `instagram_business_manage_comments` | Read comments, post replies | Already requested |
| `instagram_business_manage_messages` | Send DMs to commenters | Already requested |
| `instagram_business_manage_insights` | Read engagement metrics | Already requested |

### App Review Submission Requirements

1. **Screen recording** showing the full automation flow (comment → classification → reply → DM)
2. **Privacy policy URL** explaining data handling
3. **Business verification** (requires registered business documents)
4. **Data deletion callback URL** (Meta requires you to delete user data on request)
5. **Test Instagram Business account** linked to a Facebook Page

---

## 15. File Map

### Existing Files (Modify)

| File | What to Change |
|---|---|
| [lib/services/InstagramCommentAutomation.ts](file:///d:/UNOOLNEW/lib/services/InstagramCommentAutomation.ts) | Expand classification schema, upgrade prompt, add anti-duplication, integrate ContentGuard + ContentHumanizer |
| [app/api/webhooks/instagram/route.ts](file:///d:/UNOOLNEW/app/api/webhooks/instagram/route.ts) | Add jitter delays, velocity throttling, ContentGuard pre-check on comments |
| [app/api/webhooks/qstash/publish/route.ts](file:///d:/UNOOLNEW/app/api/webhooks/qstash/publish/route.ts) | Fix first-comment handler (Bug #1) |
| [app/dashboard/layout.tsx](file:///d:/UNOOLNEW/app/dashboard/layout.tsx) | Add "Automation" nav item to sidebar |

### New Files (Create)

| File | Purpose |
|---|---|
| `lib/platforms/firstComment.ts` | `postFirstComment()` helper for Instagram Graph API comment posting |
| `lib/services/automation/jitter.ts` | Poisson jitter delay generator |
| `lib/services/automation/velocity.ts` | Hourly rate limiter |
| `lib/services/automation/lexical.ts` | Lexical entropy guard (anti-duplication) |
| `app/api/instagram/automation/route.ts` | GET/PUT automation config |
| `app/api/instagram/comments/route.ts` | GET comment logs with stats |
| `app/api/instagram/flagged/route.ts` | GET flagged comments |
| `app/api/instagram/flagged/[id]/action/route.ts` | POST approve/reject/reply |
| `app/api/instagram/simulate/route.ts` | POST classification simulator |
| `app/dashboard/automation/page.tsx` | Server component wrapper |
| `app/dashboard/automation/AutomationClient.tsx` | Full automation dashboard UI |
| `supabase/migrations/2026XXXX_signaldm_v2.sql` | Schema extensions |
| `lib/services/__tests__/InstagramCommentAutomation.test.ts` | Unit tests |
| `lib/services/__tests__/jitter.test.ts` | Jitter + velocity tests |

### Files to Reuse (Don't Modify)

| File | How It's Used |
|---|---|
| [lib/ai/ContentGuard.ts](file:///d:/UNOOLNEW/lib/ai/ContentGuard.ts) | Pre-filter harmful incoming comments |
| [lib/ai/engines/ContentHumanizer.ts](file:///d:/UNOOLNEW/lib/ai/engines/ContentHumanizer.ts) | Strip AI slop from generated replies |
| [lib/ai/providers/GroqProvider.ts](file:///d:/UNOOLNEW/lib/ai/providers/GroqProvider.ts) | AI inference engine |
| [lib/crypto/encryption.ts](file:///d:/UNOOLNEW/lib/crypto/encryption.ts) | Decrypt stored access tokens |
| [lib/webhooks/verify.ts](file:///d:/UNOOLNEW/lib/webhooks/verify.ts) | HMAC-SHA256 signature verification |
| [lib/utils/retry.ts](file:///d:/UNOOLNEW/lib/utils/retry.ts) | `fetchWithRetry` for Graph API calls |
| [lib/platforms/InstagramAdapter.ts](file:///d:/UNOOLNEW/lib/platforms/InstagramAdapter.ts) | Token management, publishing, engagement |

---

## Development Order (Recommended)

```
Week 1: Phase 1 (Fix bugs) + Phase 4 (DB migration)
Week 2: Phase 2 (AI engine upgrade)
Week 3: Phase 3 (API routes) + Phase 6 (Integrations)
Week 4: Phase 5 (Dashboard UI)
Week 5: Phase 13 (Testing) + Phase 14 (Meta App Review prep)
```

> [!IMPORTANT]
> The single most important thing to get right is **reply quality**. If the AI generates generic, repetitive, or robotic replies, the entire product fails. Spend the most time on Phase 2 (prompt engineering, anti-duplication, humanization) and test with at least 100 diverse sample comments before shipping.
