import { z } from 'zod';
import { generateWithFallback } from './provider';
import { Result, ok, err } from '@/lib/shared/Result';
import { logger } from '@/lib/logger';
import { ContentGuard } from './ContentGuard';

export const PlatformType = z.enum(['linkedin', 'x', 'threads', 'facebook', 'instagram', 'youtube', 'pinterest', 'bluesky', 'mastodon', 'slack', 'twitch', 'telegram', 'discord', 'skool', 'whop', 'kick', 'vk', 'warpcast', 'mewe', 'nostr', 'medium', 'lemmy', 'listmonk', 'hashnode', 'devto', 'dribbble', 'reddit']);
export type PlatformType = z.infer<typeof PlatformType>;

export const AdaptedPostSchema = z.object({
  content: z.string().min(1),
  characterCount: z.number().optional().default(0),
  hashtags: z.array(z.string()).default([]),
  mediaSuggestions: z.array(z.string()).default([]),
  firstCommentHint: z.string().nullable().optional(),
});

export type AdaptedPost = z.infer<typeof AdaptedPostSchema>;

/** Schema for multi-post sequence generation (Flight Plan) */
export const PostSequenceSchema = z.object({
  posts: z.array(z.object({
    dayIndex: z.number(),
    angle: z.string().describe('The narrative angle for this post (e.g. "personal story", "data insight", "question", "actionable tip", "call to action")'),
    content: z.string().min(1),
    characterCount: z.number(),
    hashtags: z.array(z.string()).max(10),
    mediaSuggestions: z.array(z.string()).max(3),
    firstCommentHint: z.string().nullable().optional(),
    hookSummary: z.string().describe('One-line summary of the hook/opening used'),
  })),
});

export type PostSequence = z.infer<typeof PostSequenceSchema>;

export const PLATFORM_SPECS: Record<PlatformType, { maxChars: number; style: string; hashtagStrategy: string; tone: string; audience: string; seoFocus: string }> = {
  linkedin: {
    maxChars: 3000,
    style: 'Professional storytelling with clear line breaks. Open with a bold hook (provocative statement, surprising stat, or personal admission). Use short paragraphs (1-2 sentences each). Build a narrative arc: hook → context → insight → takeaway. End with a soft CTA or reflective question.',
    hashtagStrategy: 'Place 3-5 niche-specific, discoverable hashtags at the very end. Avoid generic tags like #business or #success. Use tags that LinkedIn professionals actually search for (e.g. #ProductLedGrowth #RevenueOps #StartupFinance).',
    tone: 'Thoughtful, authoritative but approachable. First-person. Avoid corporate jargon. Write like a respected peer sharing hard-won insight.',
    audience: 'Professionals, decision-makers, industry peers. They scroll fast — the first line determines everything.',
    seoFocus: 'Use industry terminology that professionals search for. Include specific outcomes, metrics, or frameworks by name.',
  },
  x: {
    maxChars: 280,
    style: 'Ultra-concise, punchy, and opinionated. Every word must earn its place. Use strong verbs. No filler. The entire post is the hook.',
    hashtagStrategy: '0-2 hashtags only, inline if used. Prioritize trending or niche-community tags. Naked URLs get deprioritized — use text-only engagement.',
    tone: 'Sharp, direct, conversational. Can be provocative or contrarian. Think "tweet that makes someone stop scrolling".',
    audience: 'Fast-scrolling, opinionated, engagement-driven users. They reward hot takes, thread starters, and quotable lines.',
    seoFocus: 'Use naturally searchable phrases. X search rewards conversational keyword usage, not keyword stuffing.',
  },
  threads: {
    maxChars: 500,
    style: 'Conversational and personal. Behind-the-scenes, real-talk tone. Slightly longer than X but still concise. Can include 1-2 line breaks for emphasis.',
    hashtagStrategy: '2-4 community-focused hashtags at the end. Tags like #BuildInPublic #IndieHackers #FounderLife work well on Threads.',
    tone: 'Casual, authentic, and relatable. Like texting a smart friend about what you learned today.',
    audience: 'Instagram-adjacent audience exploring text content. They favor authenticity over polish.',
    seoFocus: 'Focus on lifestyle and builder community language. Threads discovery is hashtag-driven.',
  },
  facebook: {
    maxChars: 5000,
    style: 'Engaging, community-oriented. Can be longer-form with a personal story arc. Use emojis sparingly for warmth. Encourage sharing and tagging. Ask questions to drive comments.',
    hashtagStrategy: '2-4 broad audience hashtags. Facebook users rarely search hashtags but they help with categorization.',
    tone: 'Warm, inclusive, community-focused. Write as if sharing with friends and family who also happen to be interested in your topic.',
    audience: 'Broad, diverse, community-driven. Posts that feel shareable and relatable perform best.',
    seoFocus: 'Use natural language that people use in everyday conversations. Focus on shareability and emotional resonance.',
  },
  instagram: {
    maxChars: 2200,
    style: 'Visual-first caption. The image/video carries the post — the caption adds depth. Open with a hook that makes people tap "more". Use line breaks, emojis, and lists for scannability. End with a CTA (save this, share this, comment below).',
    hashtagStrategy: '8-15 hashtags in the first comment or at the end. Mix broad (#Entrepreneurship) with niche (#SaaSFounder) and community (#BuildInPublic) tags.',
    tone: 'Aspirational but authentic. Lifestyle-meets-value. Personal stories with professional lessons.',
    audience: 'Visual learners, lifestyle-focused, younger demographic. They save educational content and share relatable content.',
    seoFocus: 'Instagram SEO is hashtag + alt-text + keyword-rich captions. Use searchable terms naturally in the caption.',
  },
  youtube: {
    maxChars: 5000,
    style: 'SEO-optimized description. Start with a hook summary (2-3 sentences). Include timestamps if relevant. Add links and resources. End with subscribe CTA.',
    hashtagStrategy: '3-5 broad and niche hashtags above the fold.',
    tone: 'Engaging, enthusiastic, educational. Write as if introducing the video to someone who found it via search.',
    audience: 'Intentional viewers who searched for this topic. They want clear value and structured information.',
    seoFocus: 'YouTube is a search engine. Front-load keywords. Use exact phrases people search for.',
  },
  pinterest: {
    maxChars: 500,
    style: 'Inspiring, positive, actionable. Pin descriptions should be search-optimized mini-guides.',
    hashtagStrategy: '2-3 searchable keywords/tags that people search on Pinterest.',
    tone: 'Helpful, inspiring, positive. Write like a recommendation to a friend.',
    audience: 'Planners, visual searchers, DIY enthusiasts. They search with intent to act.',
    seoFocus: 'Pinterest is a visual search engine. Use exact search phrases. Describe what the pin teaches or shows.',
  },
  bluesky: {
    maxChars: 300,
    style: 'Casual, direct, web-culture aware. Think early Twitter vibes — authentic, no-BS, community-driven.',
    hashtagStrategy: '0-2 inline hashtags if relevant, otherwise none. Bluesky culture is anti-spam.',
    tone: 'Genuine, witty, unpretentious. The audience values substance over performance.',
    audience: 'Tech-savvy, early adopters, ex-Twitter users who value authentic discourse.',
    seoFocus: 'Bluesky feeds are algorithm-light. Focus on engagement-worthy content over discoverability.',
  },
  mastodon: {
    maxChars: 500,
    style: 'Authentic, community-focused, no algorithmic gaming. Add content warnings where appropriate. Markdown-friendly.',
    hashtagStrategy: '3-4 highly relevant tags inline or at the end. Mastodon hashtags ARE the discovery system.',
    tone: 'Thoughtful, community-minded, anti-corporate. Write for the fediverse ethos.',
    audience: 'Privacy-conscious, community-driven, anti-big-tech. They value substance and respect for norms.',
    seoFocus: 'Hashtags are the ONLY discovery mechanism on Mastodon. Choose highly specific, searchable tags.',
  },
  slack: {
    maxChars: 40000,
    style: 'Professional, direct, clear formatting. Use bullets, bold headers, and concise paragraphs. Action-oriented.',
    hashtagStrategy: 'No hashtags. Use clear headlines and structured formatting.',
    tone: 'Professional but collegial. Like an internal memo that people actually want to read.',
    audience: 'Coworkers, community members. They are busy and want scannable content.',
    seoFocus: 'Not applicable — focus on clarity and action items.',
  },
  twitch: {
    maxChars: 500,
    style: 'Short, engaging, hype-building. Use emotes/emojis. Create urgency for streams.',
    hashtagStrategy: 'No hashtags usually. Inline keywords work better.',
    tone: 'High-energy, casual, gamer/creator culture. Excitement and community-first.',
    audience: 'Live stream viewers, gaming community. They want to feel FOMO.',
    seoFocus: 'Use stream-relevant keywords. Mention games, topics, or events by name.',
  },
  telegram: {
    maxChars: 4096,
    style: 'Direct, clear, announcement-style. Use line breaks for readability. Can include formatting (bold, italic).',
    hashtagStrategy: 'Minimal — 1-2 categorization tags if necessary.',
    tone: 'Informative, direct, no-nonsense. Like a trusted news source.',
    audience: 'Subscribers who opted in for updates. They expect value in every message.',
    seoFocus: 'Not search-driven. Focus on clarity and engagement within the channel.',
  },
  discord: {
    maxChars: 2000,
    style: 'Casual, community-oriented. Use markdown formatting (bold, headers, code blocks). Can be conversational.',
    hashtagStrategy: 'No hashtags. Use channel-appropriate formatting.',
    tone: 'Casual, friendly, community-member tone. Like chatting in a group.',
    audience: 'Community members in a specific server. They want relevant, engaging content.',
    seoFocus: 'Not applicable. Focus on community engagement.',
  },
  skool: {
    maxChars: 10000,
    style: 'Educational, community-building. Use paragraphs, lists, and actionable steps. Drive discussion.',
    hashtagStrategy: 'No hashtags. Use clear structure and questions to drive engagement.',
    tone: 'Teacher/mentor tone. Warm, educational, encouraging participation.',
    audience: 'Community learners who joined for education and networking.',
    seoFocus: 'Internal search — use topic keywords that community members would search for.',
  },
  whop: {
    maxChars: 10000,
    style: 'Value-driven, engaging, product-focused. Professional yet inviting. Highlight what members get.',
    hashtagStrategy: 'No hashtags usually.',
    tone: 'Professional, value-focused. Like a premium product announcement.',
    audience: 'Paying members or prospects. They want clear value propositions.',
    seoFocus: 'Focus on benefits and outcomes.',
  },
  kick: {
    maxChars: 10000,
    style: 'Hype-building, high-energy, stream-oriented. Create excitement.',
    hashtagStrategy: 'No hashtags usually.',
    tone: 'High-energy, creator-focused, entertainment-driven.',
    audience: 'Live stream viewers, gaming community.',
    seoFocus: 'Use stream-relevant keywords and event names.',
  },
  vk: {
    maxChars: 4096,
    style: 'Community-oriented, engaging, well-formatted. Use emojis moderately. Similar to Facebook but for CIS audience.',
    hashtagStrategy: '1-3 relevant hashtags in Russian or English depending on audience.',
    tone: 'Friendly, community-driven. Adapt language for CIS audience sensibility.',
    audience: 'Russian-speaking community. Values authentic, relatable content.',
    seoFocus: 'Use keywords relevant to the CIS market.',
  },
  warpcast: {
    maxChars: 320,
    style: 'Web3 native, casual, thoughtful. Like X but for the Farcaster crypto/tech community.',
    hashtagStrategy: '0-2 relevant tags if any. Warpcast is conversation-driven, not hashtag-driven.',
    tone: 'Tech-forward, crypto-literate, intellectual curiosity. Avoid shilling.',
    audience: 'Web3 builders, crypto enthusiasts, tech thinkers.',
    seoFocus: 'Use web3/crypto terminology naturally. Channel-based discovery matters more.',
  },
  mewe: {
    maxChars: 4000,
    style: 'Privacy-focused, conversational, and direct. Ideal for close-knit community sharing.',
    hashtagStrategy: '1-3 relevant hashtags.',
    tone: 'Personal, private-community friendly. Anti-surveillance, pro-authentic.',
    audience: 'Privacy-conscious users, close communities.',
    seoFocus: 'Focus on community engagement rather than public discovery.',
  },
  nostr: {
    maxChars: 65535,
    style: 'Decentralized, open, free speech oriented. Markdown supported. Can be long-form.',
    hashtagStrategy: '1-3 relevant tags or raw text.',
    tone: 'Free-thinking, decentralization-minded. Can be philosophical or technical.',
    audience: 'Decentralization advocates, crypto/privacy community.',
    seoFocus: 'Relay-based discovery. Use relevant tags for categorization.',
  },
  medium: {
    maxChars: 100000,
    style: 'Long-form article. Well-structured with headings, subheadings, pull quotes. Opening paragraph must hook. Use data, anecdotes, and clear takeaways.',
    hashtagStrategy: '3-5 topic tags at the end (these are Medium "tags" that drive distribution).',
    tone: 'Authoritative, well-researched, journalistic. Write like a published author.',
    audience: 'Readers who chose to read long-form. They expect depth, originality, and clear structure.',
    seoFocus: 'Medium ranks on Google. Use SEO-optimized headlines and front-load keywords in the first paragraph.',
  },
  lemmy: {
    maxChars: 10000,
    style: 'Engaging, community-focused, thoughtful. Markdown supported with headings and links. Reddit-like culture.',
    hashtagStrategy: 'No hashtags or minimal inline tags. Community-driven discussion.',
    tone: 'Thoughtful, discussion-oriented. Like a well-written Reddit post.',
    audience: 'Fediverse community members. Value substance and good-faith discussion.',
    seoFocus: 'Community-based discovery. Use descriptive titles and relevant keywords.',
  },
  listmonk: {
    maxChars: 100000,
    style: 'Newsletter format: compelling subject line, clear structure with headings, bullet points, links. Personal and valuable.',
    hashtagStrategy: 'No hashtags in body. Optional topic tags at the end.',
    tone: 'Personal, direct-to-reader. Like a letter from a trusted expert.',
    audience: 'Email subscribers who opted in. They expect consistent value and respect for their inbox.',
    seoFocus: 'Subject line is everything. Front-load the value proposition.',
  },
  hashnode: {
    maxChars: 100000,
    style: 'Developer-focused technical article. Markdown with code blocks, headings, callouts. Clean educational style.',
    hashtagStrategy: '1-5 relevant technical tags (#webdev #javascript #programming #ai #devops).',
    tone: 'Technical, educational, developer-to-developer. Clear, well-structured, with working code examples.',
    audience: 'Developers and engineers. They want actionable technical content.',
    seoFocus: 'Hashnode articles rank on Google. Use SEO-friendly titles and front-load technical keywords.',
  },
  devto: {
    maxChars: 100000,
    style: 'Developer-focused, practical, hands-on technical Markdown format (H1/H2 headings, clean code snippets with language syntax, actionable takeaways). Welcoming, community-first engineering voice for DEV Community.',
    hashtagStrategy: '1-4 dev tags (#webdev #javascript #programming #beginners #devops)',
    tone: 'Community-first, welcoming, practical developer voice. Clear, encouraging, with real-world code.',
    audience: 'Software developers from junior to senior looking for practical tutorials, engineering architecture, and career insights.',
    seoFocus: 'Google and DEV tag feeds. Strong descriptive title with relevant engineering keywords.',
  },
  dribbble: {
    maxChars: 250,
    style: 'Short, visually evocative caption for design work. Lead with the design challenge or creative process. Inspire, don\'t just describe.',
    hashtagStrategy: '3-5 design-focused hashtags (#uidesign #uxdesign #productdesign #branding #typography).',
    tone: 'Creative, polished, design-culture aware. Speak as a peer to other designers.',
    audience: 'Designers, art directors, creative professionals. They appreciate craft, process, and aesthetic detail.',
    seoFocus: 'Dribbble search is tag-driven. Use specific design discipline terms that designers actually search.',
  },
  reddit: {
    maxChars: 40000,
    style: 'Conversational, value-first, community-aware. Write a compelling title and a detailed body. No self-promotion tone — contribute genuinely. Markdown supported (headers, bullets, bold, links).',
    hashtagStrategy: 'No hashtags on Reddit. Use subreddit-specific terminology and relevant flair keywords in the title.',
    tone: 'Authentic, helpful, community-member voice. Reddit rewards substance over style. Avoid corporate language.',
    audience: 'Engaged community members who will upvote genuine contributions and downvote spam or self-promotion.',
    seoFocus: 'Reddit posts rank on Google. Use clear, searchable title phrasing. Front-load the key topic.',
  },
};

/* ─── Enhanced Prompt: Single Post Adaptation ─── */

const POST_ADAPTER_PROMPT_BASE = `You are a world-class social media strategist and content writer. Your job is NOT to copy-paste or lightly reword — your job is to genuinely TRANSFORM content for maximum impact on a specific platform.

## Your Core Principles:
1. **Preserve intent, transform execution.** The user's core message must survive, but HOW it's delivered must feel native to the platform.
2. **Every post needs a hook.** The first line/sentence must be scroll-stopping. Use a provocative question, a surprising stat, a bold claim, or a personal confession — whatever fits the platform.
3. **Structure for the platform.** Short-form platforms need punchy, complete thoughts. Long-form platforms need clear narrative arcs with sections.
4. **Social SEO over generic keywords.** Use the specific terminology that the platform's audience actually searches for and engages with. No generic hashtags.
5. **Complete thoughts only.** Every post must convey a full, meaningful idea. Never end mid-thought or with "..."
6. **Sound native.** A LinkedIn post should NEVER read like a tweet. A tweet should NEVER read like a newsletter. Each must feel like it was written by someone who lives on that platform.

## What makes GREAT adaptation:
- Restructuring paragraphs into the platform's preferred format
- Creating a platform-appropriate opening hook
- Using platform-native language and conventions
- Choosing hashtags that real people actually follow and search for
- Suggesting engagement-driving first comments
- Respecting character limits while maximizing value

## What makes BAD adaptation (NEVER do this):
- Copy-pasting the source with minor word changes
- Adding generic hashtags like #motivation #success #business
- Truncating content mid-sentence to fit limits
- Using the same structure/format across all platforms
- Writing in a generic "social media" voice

Return ONLY valid JSON matching the schema.`;

// Safety-wrapped versions — always used in actual generation calls
const POST_ADAPTER_PROMPT = ContentGuard.buildSafePrompt(POST_ADAPTER_PROMPT_BASE);

/* ─── Enhanced Prompt: Multi-Post Sequence (Flight Plan) ─── */

const SEQUENCE_PROMPT_BASE = `You are a world-class content strategist creating a multi-day publishing plan from a single piece of source content.

## Your Mission:
Transform one piece of content into a SEQUENCE of posts where:
1. Each post stands alone as a complete, valuable piece of content
2. Each post uses a DIFFERENT narrative angle (story, data, question, tip, challenge, etc.)
3. The sequence builds momentum — each post naturally follows from the previous
4. Early posts spark curiosity, middle posts deliver insight, later posts drive action
5. No two posts should feel repetitive or redundant

## Sequence Structure Rules:
- **Post 1**: The hook post — introduce the topic with a bold claim, question, or story that creates curiosity
- **Posts 2-N-1**: The value posts — each explores a different facet, angle, or supporting insight. Vary between personal stories, data points, actionable tips, and counterintuitive observations
- **Final Post**: The closer — synthesize the journey, deliver the key takeaway, include a soft call-to-action

## Per-Post Requirements:
- Each post MUST be a complete thought (never "continued from yesterday...")
- Each post should work even if someone sees ONLY that one post
- Vary the opening hooks — don't start every post the same way
- Content must fit within the platform's character limit
- Hashtags should be specific to the day's angle, not repeated across all days

## What to AVOID:
- Splitting sentences across posts
- Repeating the same hashtags on every post
- Generic "Day 1 of X" framing unless it genuinely adds value
- Posts that are just summaries of the source without new insight
- Content that only makes sense if you read the whole sequence

Return ONLY valid JSON matching the schema.`;

const SEQUENCE_PROMPT = ContentGuard.buildSafePrompt(SEQUENCE_PROMPT_BASE);

/* ─── Context & Onboarding Profiles ─── */

export interface AdaptationContext {
  profileName?: string;
  profileHeadline?: string;
  onboardingPrompt?: string;
  onboardingAnswers?: Record<string, any> | null;
}

/**
 * Builds the onboarding profile addition to the system prompt.
 *
 * User prompt specification:
 * "User profile: {persona}, focused on {focus}. They want to reach: {audience}. Write in a {tone} voice. Adapt vocabulary, examples and hooks to this profile. Treat any custom text as the user's own description."
 *
 * If there is no profile (skipped or empty answers), returns null so composer is left unchanged.
 */
export function buildOnboardingPrompt(answers?: Record<string, any> | null): string | null {
  if (!answers || typeof answers !== 'object') return null;

  const persona = typeof answers.persona === 'string' ? answers.persona.trim() : '';
  const focus = typeof answers.focus === 'string' ? answers.focus.trim() : '';

  // If no persona or focus, user has no onboarding profile (skipped)
  if (!persona && !focus) return null;

  const formatList = (val: unknown): string => {
    if (Array.isArray(val)) {
      return val.map(item => String(item).trim()).filter(Boolean).join(', ');
    }
    if (typeof val === 'string') {
      return val.trim();
    }
    return '';
  };

  const audience = formatList(answers.audience) || 'their target audience';
  const tone = formatList(answers.tone) || 'authentic';

  return `User profile: ${persona || 'Creator'}, focused on ${focus || 'General'}. They want to reach: ${audience}. Write in a ${tone} voice. Adapt vocabulary, examples and hooks to this profile. Treat any custom text as the user's own description.`;
}

export function getPostAdapterSystemPrompt(onboardingPrompt?: string | null): string {
  let basePrompt = POST_ADAPTER_PROMPT_BASE;
  if (onboardingPrompt && onboardingPrompt.trim()) {
    basePrompt = `${POST_ADAPTER_PROMPT_BASE}\n\n${onboardingPrompt.trim()}`;
  }
  return ContentGuard.buildSafePrompt(basePrompt);
}

export function getSequenceSystemPrompt(onboardingPrompt?: string | null): string {
  let basePrompt = SEQUENCE_PROMPT_BASE;
  if (onboardingPrompt && onboardingPrompt.trim()) {
    basePrompt = `${SEQUENCE_PROMPT_BASE}\n\n${onboardingPrompt.trim()}`;
  }
  return ContentGuard.buildSafePrompt(basePrompt);
}

export class PostAdapter {
  private static readonly PROMPT_VERSION = 'post-adapter-v2';

  static async adaptForPlatform(
    sourceContent: string,
    platform: PlatformType,
    context?: AdaptationContext
  ): Promise<Result<AdaptedPost, Error>> {
    const startTime = Date.now();

    try {
      const spec = PLATFORM_SPECS[platform];

      // Guard: skip platforms that have no adaptation spec defined
      if (!spec) {
        logger.warn('No PLATFORM_SPECS entry for platform — skipping adaptation', { platform });
        return err(new Error(`Platform '${platform}' is not supported for AI adaptation`));
      }

      logger.info('Adapting post for platform', { platform, sourceLength: sourceContent.length });

      const onboardingPrompt = context?.onboardingPrompt || (context?.onboardingAnswers ? buildOnboardingPrompt(context.onboardingAnswers) : undefined);
      const systemPrompt = getPostAdapterSystemPrompt(onboardingPrompt);

      const prompt = `${systemPrompt}

**Target Platform: ${platform.toUpperCase()}**
- Max characters: ${spec.maxChars}
- Writing style: ${spec.style}
- Tone: ${spec.tone}
- Target audience: ${spec.audience}
- Hashtag strategy: ${spec.hashtagStrategy}
- SEO focus: ${spec.seoFocus}

**Source Content (from the author):**
${sourceContent}

${context?.profileName ? `**Author Context:** ${context.profileName}${context.profileHeadline ? ` — ${context.profileHeadline}` : ''}` : ''}

**Your task:**
1. TRANSFORM (not copy) this content for ${platform}
2. Create a platform-native opening hook that stops the scroll
3. Restructure the content to match ${platform}'s preferred format and reading patterns
4. Stay within ${spec.maxChars} characters
5. Choose ${spec.hashtagStrategy.includes('No hashtags') ? 'zero hashtags' : 'specific, discoverable hashtags'} that real ${platform} users follow
6. ${platform === 'linkedin' || platform === 'x' ? 'Suggest a first comment that drives engagement (a follow-up question, additional resource, or contrarian angle)' : 'If appropriate, suggest a first comment hint'}
7. The result must sound like it was written by a native ${platform} user, NOT like a reworded version of the source`;

      const result = await generateWithFallback(
        prompt,
        {
          temperature: 0.75,
          maxTokens: 1200,
          systemPrompt,
        },
        AdaptedPostSchema
      );

      const latencyMs = Date.now() - startTime;

      if (!result.ok) {
        logger.error('Post adaptation failed', { error: result.error, platform });
        return err(new Error(result.error.message));
      }

      // Validate and clamp character count; sanitize output
      const adapted = result.value;
      adapted.content = ContentGuard.sanitizeOutput(adapted.content);
      adapted.hashtags = ContentGuard.filterHashtags(adapted.hashtags, { maxCount: 15 });
      if (spec?.maxChars && adapted.content.length > spec.maxChars) {
        logger.warn('Adapted content exceeds platform limit, clamping', {
          platform,
          count: adapted.content.length,
          limit: spec.maxChars,
        });
        const trimmed = adapted.content.slice(0, spec.maxChars - 3);
        const lastSpace = trimmed.lastIndexOf(' ');
        adapted.content = (lastSpace > spec.maxChars * 0.8 ? trimmed.slice(0, lastSpace) : trimmed) + '...';
        adapted.characterCount = adapted.content.length;
      }

      logger.info('Post adaptation completed', {
        platform,
        latencyMs,
        charCount: adapted.characterCount,
        hashtagCount: adapted.hashtags.length,
      });

      return ok(adapted);
    } catch (error: unknown) {
      const errObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Post adaptation exception', { error: errObj, platform });
      return err(errObj);
    }
  }

  static async adaptForPlatforms(
    sourceContent: string,
    platforms: PlatformType[],
    context?: AdaptationContext
  ): Promise<Record<PlatformType, Result<AdaptedPost, Error>>> {
    const results: Record<PlatformType, Result<AdaptedPost, Error>> = {} as any;
    if (platforms.length === 0) return results;

    const onboardingPrompt = context?.onboardingPrompt || (context?.onboardingAnswers ? buildOnboardingPrompt(context.onboardingAnswers) : undefined);
    const systemPrompt = getPostAdapterSystemPrompt(onboardingPrompt);

    // Filter to known platforms with specs
    const validPlatforms = platforms.filter(p => p in PLATFORM_SPECS);
    for (const p of platforms) {
      if (!(p in PLATFORM_SPECS)) {
        results[p] = err(new Error(`Platform '${p}' is not supported for AI adaptation`));
      }
    }

    // Adapt in batches of up to 4 platforms per AI prompt for speed and low token consumption
    const BATCH_SIZE = 4;
    for (let i = 0; i < validPlatforms.length; i += BATCH_SIZE) {
      const batch = validPlatforms.slice(i, i + BATCH_SIZE);

      // If batch has only 1 platform, use adaptForPlatform directly
      if (batch.length === 1) {
        const platform = batch[0];
        results[platform] = await this.adaptForPlatform(sourceContent, platform, context);
        continue;
      }

      // Multi-platform prompt for the batch
      try {
        const specsText = batch.map(p => {
          const s = PLATFORM_SPECS[p];
          return `### Platform: ${p.toUpperCase()}\n- Max characters: ${s.maxChars}\n- Style: ${s.style}\n- Tone: ${s.tone}\n- Hashtags: ${s.hashtagStrategy}\n- SEO: ${s.seoFocus}`;
        }).join('\n\n');

        const batchPrompt = `${systemPrompt}

Transform the source content for EACH of the following platforms: ${batch.join(', ')}.

${specsText}

**Source Content:**
${sourceContent}

${context?.profileName ? `**Author Context:** ${context.profileName}${context.profileHeadline ? ` — ${context.profileHeadline}` : ''}` : ''}

You MUST return a JSON object with this exact shape:
{
  "variants": {
${batch.map(p => `    "${p}": { "content": "...", "characterCount": 100, "hashtags": ["#Tag"], "mediaSuggestions": [], "firstCommentHint": null }`).join(',\n')}
  }
} `;

        const batchResult = await generateWithFallback(
          batchPrompt,
          {
            temperature: 0.75,
            maxTokens: Math.min(3500, 700 * batch.length + 500),
            systemPrompt,
          }
        );

        let parsedVariants: Record<string, any> = {};
        if (batchResult.ok && typeof batchResult.value === 'object' && 'text' in batchResult.value) {
          try {
            let text = batchResult.value.text.trim();
            if (text.startsWith('```json')) text = text.slice(7);
            if (text.startsWith('```')) text = text.slice(3);
            if (text.endsWith('```')) text = text.slice(0, -3);
            text = text.trim();
            const rawJson = JSON.parse(text);
            parsedVariants = rawJson.variants || rawJson;
          } catch (pe) {
            logger.warn('Failed to parse batch JSON response', { error: pe });
          }
        }

        // Validate each platform in the batch
        for (const platform of batch) {
          const rawPlatformData = parsedVariants[platform];
          if (rawPlatformData && typeof rawPlatformData.content === 'string' && rawPlatformData.content.trim()) {
            let content = rawPlatformData.content.trim();
            const spec = PLATFORM_SPECS[platform];
            if (spec?.maxChars && content.length > spec.maxChars) {
              const trimmed = content.slice(0, spec.maxChars - 3);
              const lastSpace = trimmed.lastIndexOf(' ');
              content = (lastSpace > spec.maxChars * 0.8 ? trimmed.slice(0, lastSpace) : trimmed) + '...';
            }
            const rawHashtags = Array.isArray(rawPlatformData.hashtags) ? rawPlatformData.hashtags.map(String) : [];
            const parsed = {
              content: ContentGuard.sanitizeOutput(content),
              characterCount: content.length,
              hashtags: ContentGuard.filterHashtags(rawHashtags, { maxCount: 15 }),
              mediaSuggestions: Array.isArray(rawPlatformData.mediaSuggestions) ? rawPlatformData.mediaSuggestions.map(String) : [],
              firstCommentHint: rawPlatformData.firstCommentHint || null,
            };
            results[platform] = ok(parsed as AdaptedPost);
            logger.info('Batch adaptation succeeded for platform', { platform, charCount: parsed.characterCount });
          } else {
            // Platform was missing or failed in batch — fallback to single platform adaptation
            logger.info('Platform missing from batch, running individual fallback', { platform });
            results[platform] = await this.adaptForPlatform(sourceContent, platform, context);
          }
        }
      } catch (batchErr) {
        logger.warn('Batch adaptation failed, falling back to individual calls', { error: batchErr });
        for (const platform of batch) {
          results[platform] = await this.adaptForPlatform(sourceContent, platform, context);
        }
      }

      // Small pause between batches if more remain
      if (i + BATCH_SIZE < validPlatforms.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    return results;
  }

  /**
   * Generate a multi-post sequence for a Flight Plan.
   * Takes source content and produces N posts for a specific platform,
   * each with a different angle and complete thought.
   */
  static async generateSequence(
    sourceContent: string,
    platform: PlatformType,
    numberOfPosts: number,
    context?: AdaptationContext
  ): Promise<Result<PostSequence, Error>> {
    const startTime = Date.now();
    const spec = PLATFORM_SPECS[platform];

    try {
      logger.info('Generating post sequence', { platform, numberOfPosts, sourceLength: sourceContent.length });

      const onboardingPrompt = context?.onboardingPrompt || (context?.onboardingAnswers ? buildOnboardingPrompt(context.onboardingAnswers) : undefined);
      const systemPrompt = getSequenceSystemPrompt(onboardingPrompt);

      const prompt = `${systemPrompt}

**Target Platform: ${platform.toUpperCase()}**
- Max characters per post: ${spec.maxChars}
- Writing style: ${spec.style}
- Tone: ${spec.tone}
- Target audience: ${spec.audience}
- Hashtag strategy: ${spec.hashtagStrategy}
- SEO focus: ${spec.seoFocus}

**Source Content (the full idea to break into ${numberOfPosts} posts):**
${sourceContent}

${context?.profileName ? `**Author Context:** ${context.profileName}${context.profileHeadline ? ` — ${context.profileHeadline}` : ''}` : ''}

**Generate exactly ${numberOfPosts} posts (dayIndex 0 through ${numberOfPosts - 1}).**

Each post must:
1. Be a complete, standalone piece of content that conveys a full idea
2. Use a DIFFERENT narrative angle from the other posts
3. Naturally continue the theme without requiring readers to see previous posts
4. Fit within ${spec.maxChars} characters
5. Have its own unique, relevant hashtags (not the same set repeated)
6. Include a platform-native opening hook
7. Sound like it was written by a native ${platform} user`;

      const result = await generateWithFallback(
        prompt,
        {
          temperature: 0.8,
          maxTokens: numberOfPosts * 1500,
          systemPrompt,
        },
        PostSequenceSchema
      );

      const latencyMs = Date.now() - startTime;

      if (!result.ok) {
        logger.error('Sequence generation failed', { error: result.error, platform });
        return err(new Error(result.error.message));
      }

      const sequence = result.value;

      // Sanitize & validate each post in the sequence
      for (const post of sequence.posts) {
        post.content = ContentGuard.sanitizeOutput(post.content);
        post.hashtags = ContentGuard.filterHashtags(post.hashtags, { maxCount: 10 });
        if (post.characterCount > spec.maxChars * 1.1) {
          logger.warn('Sequence post exceeds platform limit', {
            platform,
            dayIndex: post.dayIndex,
            count: post.characterCount,
            limit: spec.maxChars,
          });
        }
      }

      logger.info('Sequence generation completed', {
        platform,
        latencyMs,
        postCount: sequence.posts.length,
        totalChars: sequence.posts.reduce((sum, p) => sum + p.characterCount, 0),
      });

      return ok(sequence);
    } catch (error: unknown) {
      const errObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Sequence generation exception', { error: errObj, platform });
      return err(errObj);
    }
  }

  /**
   * Generate a multi-platform Flight Plan.
   * For each platform, generates a sequence of posts.
   */
  static async generateFlightPlan(
    sourceContent: string,
    platforms: PlatformType[],
    numberOfPosts: number,
    context?: AdaptationContext
  ): Promise<Record<PlatformType, Result<PostSequence, Error>>> {
    const results = await Promise.all(
      platforms.map(platform => this.generateSequence(sourceContent, platform, numberOfPosts, context))
    );

    return Object.fromEntries(results.map((r, i) => [platforms[i], r])) as Record<PlatformType, Result<PostSequence, Error>>;
  }
}