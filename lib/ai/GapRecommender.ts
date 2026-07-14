import { z } from 'zod';
import { generateWithFallback } from './provider';
import { Result, ok, err } from '@/lib/shared/Result';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config/schema';

export const ProfileGapSchema = z.object({
  category: z.enum(['content', 'proof', 'links', 'design', 'completeness']),
  priority: z.enum(['high', 'medium', 'low']),
  title: z.string().max(100),
  description: z.string().max(500),
  suggestedAction: z.string().max(200),
  impact: z.string().max(200),
});

export type ProfileGap = z.infer<typeof ProfileGapSchema>;

export const RecommendationSchema = z.object({
  gaps: z.array(ProfileGapSchema).max(10),
  overallScore: z.number().min(0).max(100),
  strengths: z.array(z.string()).max(5),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

const GAP_RECOMMENDER_PROMPT = `
You are an expert at auditing professional profiles for completeness and impact.
Analyze the given profile and identify gaps that would hurt the person's credibility,
discoverability, or conversion rate.

Evaluate across these categories:
- CONTENT: Bio, headline, role, company completeness
- PROOF: Metrics, customers, press, team size, funding evidence
- LINKS: Website, LinkedIn, GitHub, Twitter, Calendly coverage
- DESIGN: Theme selection, visual hierarchy
- COMPLETENESS: Overall profile finish level

Return ONLY valid JSON matching the schema.
`;

export class GapRecommender {
  private static readonly PROMPT_VERSION = 'gap-recommender-v1';

  static async analyzeProfile(profile: {
    name: string | null;
    headline: string | null;
    bio: string | null;
    role: string | null;
    company: string | null;
    links: Array<{ label: string; url: string; type: string }>;
    proofPoints: Array<{ type: string; value: string; url?: string }>;
    theme: { preset: string };
  }): Promise<Result<Recommendation, Error>> {
    const startTime = Date.now();

    try {
      logger.info('Analyzing profile for gaps', { name: profile.name });

      const prompt = `${GAP_RECOMMENDER_PROMPT}

**Profile to Analyze:**
Name: ${profile.name || 'NOT SET'}
Headline: ${profile.headline || 'NOT SET'}
Bio: ${profile.bio || 'NOT SET'}
Role: ${profile.role || 'NOT SET'}
Company: ${profile.company || 'NOT SET'}
Links: ${JSON.stringify(profile.links, null, 2)}
Proof Points: ${JSON.stringify(profile.proofPoints, null, 2)}
Theme: ${profile.theme.preset}

**Scoring Guidelines:**
- 90-100: Complete, compelling profile with strong proof
- 70-89: Good profile, minor gaps
- 50-69: Average profile, several gaps
- Below 50: Incomplete profile, major gaps

**Output Format:**
- gaps: Array of specific, actionable gaps with priority
- overallScore: 0-100
- strengths: What's working well`;

      const result = await generateWithFallback(
        prompt,
        {
          temperature: 0.3,
          maxTokens: 3000,
          model: config.AI_DEFAULT_MODEL,
        },
        RecommendationSchema
      );

      const latencyMs = Date.now() - startTime;

      if (!result.ok) {
        logger.error('Gap analysis failed', { error: result.error });
        return err(new Error(result.error.message));
      }

      logger.info('Gap analysis completed', {
        score: result.value.overallScore,
        gapCount: result.value.gaps.length,
        latencyMs,
      });

      return ok(result.value);
    } catch (error: unknown) {
      const errObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Gap analysis exception', { error: errObj });
      return err(errObj);
    }
  }

  static getQuickWins(analysis: Recommendation): ProfileGap[] {
    return analysis.gaps
      .filter(g => g.priority === 'high' && g.category !== 'design')
      .sort((a, b) => {
        const priorityOrder = { content: 0, proof: 1, links: 2, completeness: 3, design: 4 };
        return priorityOrder[a.category] - priorityOrder[b.category];
      });
  }
}