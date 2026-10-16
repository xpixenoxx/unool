import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAuth } from '@/lib/auth/server';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { config } from '@/lib/config/schema';
import { GroqProvider } from '@/lib/ai/providers/GroqProvider';
import { getAIProvider } from '@/lib/ai/provider';
import { logger } from '@/lib/logger';
import {
  buildIdeasPrompt,
  sanitizeAlreadyShown,
  parseRawIdeasResponse,
  validateSingleIdea,
  filterDuplicates,
  checkIdeasRateLimit,
  StudioIdea,
} from '@/lib/ai/studioIdeas';

const profileRepository = new SupabaseProfileRepository();

export const maxDuration = 60; // 60s max execution duration

/**
 * Executes a promise with an enforced timeout.
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 25000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('AI idea generation timed out')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer!);
  });
}

/**
 * POST /api/studio/ideas
 * Generates 3 personalized, timely post ideas based on the creator's Studio profile.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const traceId = crypto.randomUUID();

  try {
    // 1. Authenticate user
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, workspaceId } = auth;

    // 2. Rate limiting check (20 calls per hour per user)
    const rateCheck = checkIdeasRateLimit(userId, 20, 60 * 60 * 1000);
    if (!rateCheck.allowed) {
      logger.warn('Studio ideas rate limit hit', { workspaceId, traceId });
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. You can generate up to 20 batches of ideas per hour.',
          code: 'RATE_LIMIT_EXCEEDED',
          resetTime: rateCheck.resetTime,
        },
        { status: 429 }
      );
    }

    // 3. Parse & sanitize request body
    const body = await request.json().catch(() => ({}));
    const rawAlreadyShown = body?.alreadyShown;
    const sanitizedAlreadyShown = sanitizeAlreadyShown(rawAlreadyShown);
    const clientStudioProfile = body?.studioProfile;

    // 4. Load profile server-side, allowing fresh client preference overrides
    const profile = await profileRepository.findByWorkspaceId(workspaceId);
    const studioProfile: any = clientStudioProfile || profile?.studioProfile || profile?.onboardingAnswers;

    const isCompleted = Boolean(
      studioProfile &&
      (studioProfile.role || studioProfile.persona) &&
      (studioProfile.completedAt || profile?.onboardingCompleted || clientStudioProfile)
    );

    if (!isCompleted || !studioProfile) {
      return NextResponse.json(
        {
          error: 'Studio profile not completed. Complete onboarding first.',
          code: 'PROFILE_INCOMPLETE',
        },
        { status: 400 }
      );
    }

    // 5. Initialize AI provider (Groq priority, fallback to configured provider)
    const aiProvider = config.GROQ_API_KEY
      ? new GroqProvider(config.GROQ_API_KEY, config.AI_GROQ_MODEL || 'qwen/qwen3.8-27b')
      : getAIProvider();

    const collectedIdeas: StudioIdea[] = [];
    const avoidAccumulator = [...sanitizedAlreadyShown];

    // Helper to call LLM and extract ideas
    const fetchBatch = async (avoidList: string[]): Promise<StudioIdea[]> => {
      const { prompt, systemPrompt } = buildIdeasPrompt({
        profile: studioProfile,
        today: new Date(),
        alreadyShown: avoidList,
      });

      const result = await withTimeout(
        aiProvider.generateText(prompt, {
          systemPrompt,
          temperature: 0.95,
          maxTokens: 2000,
          responseFormatJson: true,
        } as any),
        25000
      );

      if (!result.ok) {
        throw new Error(result.error.message || 'LLM text generation failed');
      }

      const parsed = parseRawIdeasResponse(result.value.text);
      if (!Array.isArray(parsed)) {
        throw new Error('LLM did not return an array');
      }

      const validList: StudioIdea[] = [];
      for (const item of parsed) {
        const validated = validateSingleIdea(item);
        if (validated) {
          validList.push(validated);
        }
      }

      return filterDuplicates(validList, avoidList);
    };

    // Attempt 1: Initial Generation
    try {
      const batch1 = await fetchBatch(avoidAccumulator);
      for (const idea of batch1) {
        if (!collectedIdeas.some((i) => i.title.toLowerCase() === idea.title.toLowerCase())) {
          collectedIdeas.push(idea);
          avoidAccumulator.push(idea.title);
        }
      }
    } catch (attemptErr) {
      logger.warn('Studio ideas attempt 1 failed or invalid', {
        workspaceId,
        error: String(attemptErr),
      });
    }

    // Attempt 2: Retry once if we received fewer than 3 ideas
    if (collectedIdeas.length < 3) {
      try {
        const batch2 = await fetchBatch(avoidAccumulator);
        for (const idea of batch2) {
          if (!collectedIdeas.some((i) => i.title.toLowerCase() === idea.title.toLowerCase())) {
            collectedIdeas.push(idea);
            avoidAccumulator.push(idea.title);
          }
        }
      } catch (retryErr) {
        logger.warn('Studio ideas attempt 2 (retry) failed', {
          workspaceId,
          error: String(retryErr),
        });
      }
    }

    // If still fewer than 3 ideas, return a friendly error
    if (collectedIdeas.length < 3) {
      logger.error('Failed to generate 3 unique ideas after retry', {
        workspaceId,
        collectedCount: collectedIdeas.length,
        durationMs: Date.now() - startTime,
      });
      return NextResponse.json(
        {
          error: 'Unable to generate fresh ideas at this moment. Please try again.',
          code: 'GENERATION_INCOMPLETE',
        },
        { status: 500 }
      );
    }

    const finalIdeas = collectedIdeas.slice(0, 3);

    // Server-side audit log (Zero personal content, only counts and status)
    logger.info('Studio ideas generated successfully', {
      workspaceId,
      traceId,
      ideasCount: finalIdeas.length,
      durationMs: Date.now() - startTime,
      hasAvoidList: sanitizedAlreadyShown.length > 0,
    });

    return NextResponse.json({
      ideas: finalIdeas,
      count: finalIdeas.length,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Studio ideas endpoint error', {
      traceId,
      error: err,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        error: 'Failed to generate ideas. Please try again.',
        details: err.message,
      },
      { status: 500 }
    );
  }
}
