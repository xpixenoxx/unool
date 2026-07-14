import { z } from 'zod';
import { generateWithFallback } from './provider';
import { Result, ok, err } from '@/lib/shared/Result';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config/schema';

export const ExtractedProfileSchema = z.object({
  name: z.string().min(1).max(100),
  headline: z.string().max(200),
  bio: z.string().max(2000),
  role: z.string().max(100),
  company: z.string().max(100),
  links: z.array(z.object({
    label: z.string().max(50),
    url: z.string().url(),
    type: z.enum(['website', 'linkedin', 'github', 'twitter', 'calendly', 'other']),
  })).max(10),
  proofPoints: z.array(z.object({
    type: z.enum(['metric', 'customer', 'press', 'product', 'team', 'funding']),
    value: z.string().max(200),
    url: z.string().url().optional().nullable(),
  })).max(10),
});

export type ExtractedProfile = z.infer<typeof ExtractedProfileSchema>;

const PROFILE_EXTRACTOR_PROMPT = `
You are an expert at extracting professional profile information from web pages.
Given a URL, extract the person's professional information including:
- Full name
- Professional headline (1-2 lines)
- Bio (2-4 paragraphs, professional but personal)
- Current role
- Company
- Important links (website, LinkedIn, GitHub, Twitter/X, Calendly, other)
- Proof points (metrics, customers, press mentions, products, team size, funding)

Return ONLY the JSON matching the schema. Be concise and accurate.
If information is not available, use reasonable defaults or omit optional fields.
`;

export class ProfileExtractor {
  private static readonly PROMPT_VERSION = 'profile-extractor-v1';

  static async extractFromUrl(url: string): Promise<Result<ExtractedProfile, Error>> {
    const startTime = Date.now();

    try {
      logger.info('Starting profile extraction', { url });

      // Fetch the page content
      const pageContent = await this.fetchPageContent(url);
      if (!pageContent) {
        return err(new Error('Failed to fetch page content'));
      }

      // Truncate if too long
      const truncatedContent = pageContent.slice(0, 15000);

      const prompt = `${PROFILE_EXTRACTOR_PROMPT}\n\nURL: ${url}\n\nPage Content:\n${truncatedContent}`;

      const result = await generateWithFallback(
        prompt,
        {
          temperature: 0.3,
          maxTokens: 3000,
          model: config.AI_DEFAULT_MODEL,
        },
        ExtractedProfileSchema
      );

      const latencyMs = Date.now() - startTime;

      if (!result.ok) {
        logger.error('Profile extraction failed', { error: result.error, url });
        return err(result.error);
      }

      logger.info('Profile extraction completed', {
        url,
        latencyMs,
      });

      return ok(result.value);
    } catch (error: unknown) {
      const errObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Profile extraction exception', { error: errObj, url });
      return err(errObj);
    }
  }

  private static async fetchPageContent(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'UnoolBot/1.0 (+https://unool.co/bot)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        logger.warn('Page fetch failed', { url, status: response.status });
        return null;
      }

      const html = await response.text();

      // Simple HTML to text extraction (in production, use a proper library like cheerio)
      return this.extractTextFromHtml(html);
    } catch (error: unknown) {
      const errObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Page fetch error', { url, error: errObj });
      return null;
    }
  }

  private static extractTextFromHtml(html: string): string {
    // Remove scripts, styles, and other non-content elements
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return text;
  }
}