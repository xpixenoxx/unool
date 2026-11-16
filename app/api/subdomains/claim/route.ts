import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentAuth } from '@/lib/auth/server';
import { requireWorkspaceRole } from '@/lib/auth/workspaceAccess';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { validateSubdomain } from '@/lib/validation/subdomain';
import { analytics } from '@/lib/analytics/track';
import { logger } from '@/lib/logger';

const profileRepository = new SupabaseProfileRepository();

export async function POST(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roleCheck = await requireWorkspaceRole(auth.userId, auth.workspaceId, ['owner', 'admin', 'editor']);
    if (!roleCheck.allowed) {
      return NextResponse.json(
        { error: 'Insufficient workspace permissions to claim a subdomain.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const rawSubdomain = typeof body?.subdomain === 'string' ? body.subdomain : '';
    const validation = validateSubdomain(rawSubdomain);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const subdomain = validation.normalized;
    const existing = await profileRepository.findBySubdomain(subdomain);
    let profile = await profileRepository.findByWorkspaceId(auth.workspaceId);

    if (existing && existing.id !== profile?.id) {
      return NextResponse.json({ error: 'Subdomain already taken' }, { status: 409 });
    }

    const previousSubdomain = profile?.subdomain;

    if (!profile) {
      profile = await profileRepository.create({
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        subdomain,
        name: subdomain,
      });
    } else if (profile.subdomain !== subdomain) {
      profile = await profileRepository.update(
        profile.id,
        { subdomain },
        typeof body?.version === 'number' ? body.version : profile.version
      );
    }

    analytics.subdomainClaim({
      workspaceId: auth.workspaceId,
      userId: auth.userId,
      profileId: profile.id,
      subdomain,
    });

    try {
      revalidateTag(`profile:${subdomain}`);
      revalidatePath(`/u/${subdomain}`);
      if (previousSubdomain && previousSubdomain !== subdomain) {
        revalidateTag(`profile:${previousSubdomain}`);
        revalidatePath(`/u/${previousSubdomain}`);
      }
    } catch {
      // Safe no-op in non-Next test runtime
    }

    return NextResponse.json({
      success: true,
      subdomain: profile.subdomain,
      profile,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Claim subdomain failed', { error: err });
    if (err.message === 'VERSION_CONFLICT') {
      return NextResponse.json({ error: 'Profile was modified, please refresh and try again' }, { status: 409 });
    }
    if (err.message.includes('duplicate key') || err.message.includes('23505')) {
      return NextResponse.json({ error: 'Subdomain already taken' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to claim subdomain' }, { status: 500 });
  }
}
