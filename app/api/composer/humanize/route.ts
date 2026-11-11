import { NextRequest, NextResponse } from 'next/server';
import { ContentHumanizer } from '@/lib/ai/engines';
import { PlatformType } from '@/lib/ai/PostAdapter';
import { getCurrentAuth } from '@/lib/auth/server';
import { getPlanContext, enforcePlanLimit } from '@/lib/middleware/plan-enforcement-middleware';
import { trackAiUsage } from '@/lib/limits/enforcer';
import { config } from '@/lib/config/schema';
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
 */

const RequestSchema = z.object({
  content: z.string().min(1),
  platform: z.string().optional(),
  diagnoseOnly: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

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

    const planCtx = await getPlanContext(auth.userId, auth.workspaceId);
    if (!planCtx) {
      return NextResponse.json({ error: 'Failed to retrieve plan information' }, { status: 500 });
    }

    const humanizerCheck = await enforcePlanLimit(request, 'content_humanizer', planCtx);
    if (!humanizerCheck.allowed) {
      return NextResponse.json(
        {
          error: humanizerCheck.error?.message || 'Content Humanizer requires Pro or Studio plan',
          code: 'PLAN_LIMIT_EXCEEDED',
          plan: planCtx.plan,
        },
        { status: 403, headers: humanizerCheck.headers }
      );
    }

    const aiCheck = await enforcePlanLimit(request, 'use_ai', planCtx);
    if (!aiCheck.allowed) {
      return NextResponse.json(
        {
          error: aiCheck.error?.message || 'Monthly AI credit limit reached',
          code: 'PLAN_LIMIT_EXCEEDED',
          plan: planCtx.plan,
          limit: aiCheck.error?.limit,
          currentUsage: aiCheck.error?.currentUsage,
        },
        { status: 403, headers: aiCheck.headers }
      );
    }

    const result = await ContentHumanizer.humanizeWithAI(content, platform as PlatformType | undefined);

    try {
      await trackAiUsage(
        auth.workspaceId,
        auth.userId,
        Math.ceil(content.length / 4),
        Math.ceil((result.humanized?.length || content.length) / 4),
        'content-humanizer',
        config.AI_DEFAULT_MODEL
      );
    } catch {
      // Non-fatal usage tracking
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Humanize failed', details: String(error) },
      { status: 500 }
    );
  }
}
