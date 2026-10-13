import { NextRequest, NextResponse } from 'next/server';
import { ContentHumanizer } from '@/lib/ai/engines';
import { PlatformType } from '@/lib/ai/PostAdapter';
import { z } from 'zod';

export const maxDuration = 60;

/**
 * POST /api/composer/humanize
 *
 * Strips AI fingerprints from post content:
 * - Removes em dashes (replaced with natural punctuation)
 * - Replaces slop vocabulary (delve, tapestry, seamlessly, etc.)
 * - Strips invisible Unicode watermark characters
 * - Fixes symmetric AI sentence structures
 * - Returns a 5-check panel score (0-100)
 *
 * Works for ALL platforms. Platform param used only to preserve
 * markdown formatting on Hashnode / Dev.to / Medium / Listmonk.
 *
 * No AI call — pure deterministic regex pipeline.
 */

const RequestSchema = z.object({
  content: z.string().min(1),
  platform: z.string().optional(),
  diagnoseOnly: z.boolean().optional().default(false),
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

    const { content, platform, diagnoseOnly } = parsed.data;

    if (diagnoseOnly) {
      const diagnosis = ContentHumanizer.diagnose(content);
      const needsHumanizing = ContentHumanizer.needsHumanizing(content);
      return NextResponse.json({ diagnosis, needsHumanizing });
    }

    const result = await ContentHumanizer.humanizeWithAI(content, platform as PlatformType | undefined);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Humanize failed', details: String(error) },
      { status: 500 }
    );
  }
}
