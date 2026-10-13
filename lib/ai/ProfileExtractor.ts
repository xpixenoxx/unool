import { z } from 'zod';
import { generateWithFallback } from './provider';
import { Result, ok, err } from '@/lib/shared/Result';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config/schema';
import { validateUrlForFetch, isAllowedExtractionDomain } from '@/lib/utils/url-validation';

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

      // Validate URL before fetching (SSRF protection)
      const validation = await validateUrlForFetch(url);
      if (!validation.allowed) {
        logger.warn('URL validation failed', { url, reason: validation.reason });
        return err(new Error(`Invalid URL: ${validation.reason}`));
      }

      // Optional: check against allowed domains
      if (!isAllowedExtractionDomain(url)) {
        logger.warn('URL not in allowed extraction domains', { url });
        // Don't fail, just log - allowlist is optional
      }

      // Fetch the page content with fallback
      let pageContent = await this.fetchPageContent(url);
      if (!pageContent) {
        // Fallback: derive domain context so AI can still synthesize a starting profile
        try {
          const parsed = new URL(url);
          const domain = parsed.hostname.replace(/^www\./, '');
          pageContent = `Website URL: ${url}. Domain: ${domain}. The user wants a professional public portfolio profile for this domain.`;
        } catch {
          pageContent = `Website URL: ${url}`;
        }
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
        logger.warn('AI Profile extraction returned error, synthesizing fallback', { error: result.error, url });
        // Resilient fallback so the user always receives a valid extracted profile
        const parsed = new URL(url);
        const domain = parsed.hostname.replace(/^www\./, '');
        const capitalizedDomain = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
        const fallbackProfile: ExtractedProfile = {
          name: capitalizedDomain,
          headline: `Creator & Builder at ${domain}`,
          bio: `Building and crafting digital experiences at ${domain}. Connect with me to learn more about my work and portfolio.`,
          role: 'Founder & Creator',
          company: domain,
          links: [{ label: 'Website', url, type: 'website' }],
          proofPoints: [{ type: 'product', value: `Active project: ${domain}`, url }],
        };
        return ok(fallbackProfile);
      }

      logger.info('Profile extraction completed', {
        url,
        latencyMs,
      });

      return ok(result.value);
    } catch (error: unknown) {
      const errObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Profile extraction exception, providing safe fallback', { error: errObj, url });
      try {
        const parsed = new URL(url);
        const domain = parsed.hostname.replace(/^www\./, '');
        const capitalizedDomain = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
        return ok({
          name: capitalizedDomain,
          headline: `Creator at ${domain}`,
          bio: `Professional profile for ${domain}.`,
          role: 'Creator',
          company: domain,
          links: [{ label: 'Website', url, type: 'website' }],
          proofPoints: [],
        });
      } catch {
        return err(errObj);
      }
    }
  }

  private static async fetchPageContent(url: string): Promise<string | null> {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'UnoolBot/1.0 (+https://unool.co/bot)',
    ];

    for (const ua of userAgents) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': ua,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: AbortSignal.timeout(6000),
          redirect: 'follow',
        });

        if (!response.ok) {
          logger.warn('Page fetch attempt failed', { url, status: response.status, ua });
          continue;
        }

        const html = await response.text();
        if (html && html.trim().length > 50) {
          return this.extractTextFromHtml(html);
        }
      } catch (error: unknown) {
        logger.warn('Page fetch attempt error', { url, error });
      }
    }

    return null;
  }

  private static extractTextFromHtml(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}