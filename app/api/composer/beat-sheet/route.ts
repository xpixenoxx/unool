import { NextRequest, NextResponse } from 'next/server';
import { BeatSheetGenerator, PLATFORM_VIDEO_SPECS } from '@/lib/ai/engines';
import { PlatformType } from '@/lib/ai/PostAdapter';
import { z } from 'zod';

/**
 * POST /api/composer/beat-sheet
 *
 * Generates a spoken-word timing beat sheet from a script.
 * Ported from beats.py (165 wpm baseline for Instagram Reels).
 *
 * Per-platform timing:
 *   instagram  165 wpm  hook ≤ 3s   beat max 4s    Reel (15-90s)
 *   youtube    150 wpm  hook ≤ 30s  beat max 120s  Long-form video
 *   twitch     160 wpm  hook ≤ 15s  beat max 300s  Stream segment
 *   kick       160 wpm  hook ≤ 15s  beat max 300s  Stream segment
 *   medium     145 wpm  companion script analysis
 *
 * Returns:
 *   - Beat-by-beat timecodes and flag warnings
 *   - Hook score (0-100)
 *   - Loop closure detection
 *   - Delta to target duration (over/under)
 *   - Word count and suggestions
 */

const RequestSchema = z.object({
  script: z.string().min(1),
  platform: z.string().optional().default('instagram'),
  targetSecs: z.number().optional(),
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

    const { script, platform, targetSecs } = parsed.data;

    // Quick duration estimate
    const estimatedSecs = BeatSheetGenerator.estimateDuration(script, platform as PlatformType);

    // Full beat sheet
    const result = BeatSheetGenerator.generate(script, platform as PlatformType, targetSecs);

    return NextResponse.json({ estimatedSecs, beatSheet: result });
  } catch (error) {
    return NextResponse.json(
      { error: 'Beat sheet generation failed', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ platformSpecs: PLATFORM_VIDEO_SPECS });
}
