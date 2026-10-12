import { NextRequest, NextResponse } from 'next/server';
import { FoldLinter, PLATFORM_FOLD_SPECS } from '@/lib/ai/engines';
import { PlatformType } from '@/lib/ai/PostAdapter';
import { z } from 'zod';

/**
 * POST /api/composer/fold-lint
 *
 * Lints post content against platform-specific fold rules.
 * Returns the visible preview text, pass/warn/fail checks for:
 * - Character count vs hard limit
 * - Content that fits before the "... more" fold
 * - Hashtag count vs platform cap
 * - Hashtag placement (body vs first comment)
 * - Keyword presence in fold
 * - CTA presence
 *
 * Works for all 25 UNOOL platforms. No AI call needed — pure deterministic.
 */

const RequestSchema = z.object({
  content: z.string().min(1),
  platforms: z.array(z.string()).min(1),
  keywords: z.array(z.string()).optional().default([]),
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

    const { content, platforms, keywords } = parsed.data;

    const results = FoldLinter.lintAll(
      content,
      platforms as PlatformType[],
      keywords
    );

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: 'Fold lint failed', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return platform specs so the UI can render fold previews
  return NextResponse.json({ specs: PLATFORM_FOLD_SPECS });
}
