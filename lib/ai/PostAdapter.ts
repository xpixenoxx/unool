import { z } from 'zod';
import { generateWithFallback } from './provider';
import { Result, ok, err } from '@/lib/shared/Result';
import { logger } from '@/lib/logger';

export const PlatformType = z.enum(['linkedin', 'x', 'threads', 'facebook', 'instagram', 'youtube', 'pinterest', 'bluesky', 'mastodon', 'slack', 'twitch', 'telegram', 'discord']);
export type PlatformType = z.infer<typeof PlatformType>;

export const AdaptedPostSchema = z.object({
  content: z.string().min(1),
  characterCount: z.number(),
  hashtags: z.array(z.string()).max(10),
  mediaSuggestions: z.array(z.string()).max(5),
  firstCommentHint: z.string().nullable().optional(),
});

export type AdaptedPost = z.infer<typeof AdaptedPostSchema>;

const PLATFORM_SPECS: Record<PlatformType, { maxChars: number; style: string; hashtagStrategy: string }> = {
  linkedin: {
    maxChars: 3000,
    style: 'Professional, storytelling, value-driven. Use line breaks. Include 3-5 relevant hashtags at the end.',
    hashtagStrategy: 'Industry-specific, professional tags (#SaaS #Leadership #DataEngineering)'
  },
  bluesky: {
    maxChars: 300,
    style: 'Casual, direct, web-culture aware, no-nonsense',
    hashtagStrategy: '1-2 inline hashtags if relevant, otherwise none',
  },
  youtube: {
    maxChars: 5000,
    style: 'Engaging, descriptive, SEO-optimized. Encourage likes and subscriptions.',
    hashtagStrategy: '3-5 broad and niche hashtags',
  },
  pinterest: {
    maxChars: 500,
    style: 'Inspiring, positive, actionable.',
    hashtagStrategy: '2-3 searchable keywords/tags',
  },
  x: {
    maxChars: 280,
    style: 'Concise, punchy, conversational. Thread format if needed. 1-3 hashtags max.',
    hashtagStrategy: 'Trending, concise tags (#SaaS #AI #Startup)'
  },
  threads: {
    maxChars: 500,
    style: 'Conversational, personal, behind-the-scenes. More casual than LinkedIn. 2-5 hashtags.',
    hashtagStrategy: 'Community-focused tags (#BuildInPublic #IndieHackers #FounderJourney)'
  },
  facebook: {
    maxChars: 5000,
    style: 'Engaging, community-focused, conversational. Can include emojis. 2-5 hashtags. Good for longer-form posts with media.',
    hashtagStrategy: 'Broader audience tags (#SmallBusiness #Community #Entrepreneurship)'
  },

  instagram: {
    maxChars: 2200,
    style: 'Visual-first, aspirational, lifestyle-oriented. Heavy emoji use. 5-15 hashtags in first comment. Great for carousel, Reels, Stories.',
    hashtagStrategy: 'Niche + broad tags (#CreatorEconomy #PersonalBrand #MarketingTips)'
  },
  mastodon: {
    maxChars: 500,
    style: 'Authentic, community-focused, no algorithmic gaming.',
    hashtagStrategy: '3-4 highly relevant tags inline or at the end.'
  },
  slack: {
    maxChars: 40000,
    style: 'Professional, direct, clear formatting with bullets if needed. Action-oriented.',
    hashtagStrategy: 'No hashtags, use clear headlines.'
  },
  twitch: {
    maxChars: 500,
    style: 'Short, engaging, hype-building for streams.',
    hashtagStrategy: 'No hashtags usually, but inline keywords work.'
  },
  telegram: {
    maxChars: 4096,
    style: 'Direct, clear, often used for announcements or updates. Line breaks for readability.',
    hashtagStrategy: 'Minimal hashtags, 1-2 if necessary for categorization.'
  },
  discord: {
    maxChars: 2000,
    style: 'Casual, community-oriented, clear formatting. Use markdown formatting.',
    hashtagStrategy: 'No hashtags usually.'
  },
};

const POST_ADAPTER_PROMPT = `
You are an expert social media content adapter. Your job is to take a source piece of content and adapt it for a specific platform.

Given:
- Source content (what the user wrote)
- Target platform specifications

Adapt the content following the platform's style guidelines. Preserve the core message but optimize for the platform's audience, character limits, and engagement patterns.

Return ONLY valid JSON matching the schema.
`;

export class PostAdapter {
  private static readonly PROMPT_VERSION = 'post-adapter-v1';

  static async adaptForPlatform(
    sourceContent: string,
    platform: PlatformType,
    context?: { profileName?: string; profileHeadline?: string }
  ): Promise<Result<AdaptedPost, Error>> {
    const startTime = Date.now();
    const spec = PLATFORM_SPECS[platform];

    try {
      logger.info('Adapting post for platform', { platform, sourceLength: sourceContent.length });

      const prompt = `${POST_ADAPTER_PROMPT}

**Platform: ${platform.toUpperCase()}**
Max characters: ${spec.maxChars}
Style: ${spec.style}
Hashtag strategy: ${spec.hashtagStrategy}

**Source Content:**
${sourceContent}

${context ? `**Author Context:** ${context.profileName} - ${context.profileHeadline}` : ''}

**Requirements:**
1. Adapt the content for ${platform} keeping the core message
2. Stay within ${spec.maxChars} characters
3. Include appropriate hashtags (${spec.hashtagStrategy})
4. Suggest media/types if relevant
5. For LinkedIn/X, suggest a first comment hint (key insight, link, or question)`;

      const result = await generateWithFallback(
        prompt,
        {
          temperature: 0.7,
          maxTokens: 2000,
        },
        AdaptedPostSchema
      );

      const latencyMs = Date.now() - startTime;

      if (!result.ok) {
        logger.error('Post adaptation failed', { error: result.error, platform });
        return err(new Error(result.error.message));
      }

      // Validate character count
      const adapted = result.value;
      if (adapted.characterCount > spec.maxChars * 1.1) {
        logger.warn('Adapted content exceeds platform limit', {
          platform,
          count: adapted.characterCount,
          limit: spec.maxChars,
        });
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
    context?: { profileName?: string; profileHeadline?: string }
  ): Promise<Record<PlatformType, Result<AdaptedPost, Error>>> {
    const results = await Promise.all(
      platforms.map(platform => this.adaptForPlatform(sourceContent, platform, context))
    );

    return Object.fromEntries(results.map((r, i) => [platforms[i], r])) as Record<PlatformType, Result<AdaptedPost, Error>>;
  }
}