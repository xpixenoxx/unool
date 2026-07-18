import { z } from 'zod';
import { generateWithFallback } from './provider';
import { Result, ok, err } from '@/lib/shared/Result';
import { logger } from '@/lib/logger';

export const PlatformType = z.enum(['linkedin', 'x', 'threads']);
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

  static async adaptForAllPlatforms(
    sourceContent: string,
    context?: { profileName?: string; profileHeadline?: string }
  ): Promise<Record<PlatformType, Result<AdaptedPost, Error>>> {
    const platforms: PlatformType[] = ['linkedin', 'x', 'threads'];
    const results = await Promise.all(
      platforms.map(platform => this.adaptForPlatform(sourceContent, platform, context))
    );

    return Object.fromEntries(results.map((r, i) => [platforms[i], r])) as Record<PlatformType, Result<AdaptedPost, Error>>;
  }
}