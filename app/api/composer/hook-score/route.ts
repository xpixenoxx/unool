import { NextRequest, NextResponse } from 'next/server';
import { HookScorer, HOOK_FORMULAS } from '@/lib/ai/engines';
import { PlatformType } from '@/lib/ai/PostAdapter';
import { z } from 'zod';

/**
 * POST /api/composer/hook-score
 *
 * Scores one or more hook candidates against the 26-formula rubric.
 * Returns per-dimension scores (0-100), grade, dealbreakers, slop words,
 * matched formula IDs, platform fold warnings, and improvement suggestions.
 *
 * Supports all text-based UNOOL platforms: LinkedIn, X, Threads, Bluesky,
 * Instagram, Medium, Hashnode, Dev.to, Mastodon, Warpcast, etc.
 *
 * No AI call needed — pure deterministic scoring.
 */

const RequestSchema = z.object({
  hooks: z.array(z.string().min(1).max(500)).min(1).max(10),
  platform: z.string().optional(),
  returnFormulas: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { hooks, platform, returnFormulas } = parsed.data;

    const ranked = HookScorer.rank(hooks, platform as PlatformType | undefined);

    return NextResponse.json({
      ranked,
      formulas: returnFormulas ? HOOK_FORMULAS : undefined,
      suggestedFormulas: HookScorer.suggestFormulas(3),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Hook scoring failed', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return the full formula library for the composer UI to display
  return NextResponse.json({ formulas: HOOK_FORMULAS, count: HOOK_FORMULAS.length });
}
