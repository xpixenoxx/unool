import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentAuth } from '@/lib/auth/server';
import { SupabaseProfileRepository } from '@/lib/repositories/supabase/SupabaseProfileRepository';
import { logger } from '@/lib/logger';
import { config } from '@/lib/config/schema';
import { getPlanContext } from '@/lib/middleware/plan-enforcement-middleware';
import { isTemplateAllowedForPlan } from '@/components/profile/templates/registry';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { validateSubdomain } from '@/lib/validation/subdomain';
import { ProfileMutationSchema } from '@/lib/validation/profileSchemas';
import { normalizeTemplateId, DEFAULT_TEMPLATE_ID } from '@/lib/profile/templateNormalization';
import { analytics } from '@/lib/analytics/track';

const profileRepository = new SupabaseProfileRepository();

function invalidateProfileCache(subdomains: Array<string | null | undefined>) {
  for (const sub of subdomains) {
    if (!sub) continue;
    try {
      revalidateTag(`profile:${sub}`);
      revalidatePath(`/u/${sub}`);
    } catch {
      // Safe no-op in tests outside Next runtime
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await profileRepository.findByWorkspaceId(auth.workspaceId);

    let userEmail: string | undefined;
    try {
      const { data: userRecord } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', auth.userId)
        .single();
      userEmail = userRecord?.email ?? undefined;
      if (!userEmail) {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(auth.userId);
        userEmail = authUser?.user?.email ?? undefined;
      }
    } catch {
      // Ignore email lookup failure
    }

    if (!profile) {
      return NextResponse.json({
        profile: null,
        email: userEmail || null,
        onboarding_completed: false,
        onboardingCompleted: false,
      });
    }

    const normalizedTemplate = normalizeTemplateId(profile.theme?.template || DEFAULT_TEMPLATE_ID);

    return NextResponse.json({
      ...profile,
      theme: {
        ...profile.theme,
        template: normalizedTemplate,
        customCss: null,
      },
      email: profile.email || userEmail || null,
      proofs: profile.proofPoints || [],
      onboarding_completed: profile.onboardingCompleted ?? false,
      onboardingCompleted: profile.onboardingCompleted ?? false,
      onboarding_answers: profile.onboardingAnswers ?? null,
      onboardingAnswers: profile.onboardingAnswers ?? null,
      studio_profile: profile.studioProfile ?? null,
      studioProfile: profile.studioProfile ?? null,
    });
  } catch (error) {
    logger.error('Failed to get profile', { error });
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}

async function upsertProfile(request: NextRequest) {
  const auth = await getCurrentAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, workspaceId } = auth;
  const rawBody = await request.json().catch(() => null);
  if (!rawBody || typeof rawBody !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const parsed = ProfileMutationSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message || 'Validation failed',
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const input = parsed.data;
  let requestedTemplate: string | undefined;
  let cachedPlanCtx: Awaited<ReturnType<typeof getPlanContext>> | undefined;
  const loadPlanCtx = async () => {
    if (cachedPlanCtx === undefined) {
      cachedPlanCtx = await getPlanContext(userId, workspaceId);
    }
    return cachedPlanCtx;
  };

  if (input.theme?.template) {
    requestedTemplate = normalizeTemplateId(input.theme.template);
    const planCtx = await loadPlanCtx();
    if (planCtx && !isTemplateAllowedForPlan(requestedTemplate, planCtx.templateCount)) {
      return NextResponse.json(
        {
          error: `The "${requestedTemplate}" template requires a Creator plan or higher. Upgrade to unlock all 24 templates.`,
          code: 'PLAN_UPGRADE_REQUIRED',
          upgradeUrl: '/dashboard/billing',
        },
        { status: 403 }
      );
    }
  }

  if (input.theme?.sectionVisibility?.footerBadge === false) {
    const planCtx = await loadPlanCtx();
    if (planCtx && !planCtx.features?.badge_removal && !planCtx.features?.white_label) {
      return NextResponse.json(
        {
          error: 'Removing the Unool footer badge requires a Creator plan or higher.',
          code: 'PLAN_UPGRADE_REQUIRED',
          upgradeUrl: '/dashboard/billing',
        },
        { status: 403 }
      );
    }
  }

  let profile = await profileRepository.findByWorkspaceId(workspaceId);
  const previousSubdomain = profile?.subdomain;
  const previousTemplate = normalizeTemplateId(profile?.theme?.template || DEFAULT_TEMPLATE_ID);

  // Validate subdomain whenever supplied and changed
  let nextSubdomain: string | undefined;
  if (input.subdomain !== undefined) {
    const cleanSub = input.subdomain.trim().toLowerCase();
    if (cleanSub && cleanSub !== profile?.subdomain) {
      const subValidation = validateSubdomain(cleanSub);
      if (!subValidation.valid) {
        return NextResponse.json({ error: subValidation.error }, { status: 400 });
      }
      const existingOwner = await profileRepository.findBySubdomain(subValidation.normalized);
      if (existingOwner && existingOwner.id !== profile?.id) {
        return NextResponse.json({ error: 'Subdomain already taken' }, { status: 409 });
      }
      nextSubdomain = subValidation.normalized;
    }
  }

  if (profile) {
    const expectedVersion = typeof input.version === 'number' ? input.version : profile.version;

    const mergedTheme = input.theme !== undefined
      ? {
        ...((profile.theme as Record<string, unknown>) || {}),
        ...input.theme,
        template: requestedTemplate ?? normalizeTemplateId(profile.theme?.template || DEFAULT_TEMPLATE_ID),
        customCss: null,
      }
      : undefined;

    profile = await profileRepository.update(
      profile.id,
      {
        ...(nextSubdomain !== undefined ? { subdomain: nextSubdomain } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.headline !== undefined ? { headline: input.headline } : {}),
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
        ...(input.role !== undefined ? { role: input.role } : {}),
        ...(input.company !== undefined ? { company: input.company } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
        ...(input.email !== undefined ? { email: input.email || null } : {}),
        ...(input.showEmail !== undefined ? { showEmail: input.showEmail } : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
        ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
        ...(input.availabilityBadge !== undefined ? { availabilityBadge: input.availabilityBadge } : {}),
        ...(input.links !== undefined ? { links: input.links } : {}),
        ...(input.proofPoints !== undefined ? { proofPoints: input.proofPoints } : {}),
        ...(mergedTheme !== undefined ? { theme: mergedTheme } : {}),
        ...(input.socialHandles !== undefined ? { socialHandles: input.socialHandles } : {}),
        ...(input.seo !== undefined ? { seo: input.seo } : {}),
        ...(input.openTo !== undefined ? { openTo: input.openTo } : {}),
        ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
      },
      expectedVersion
    );
  } else {
    const tempSubdomain = nextSubdomain || `user-${userId.substring(0, 8)}-${Date.now().toString(36)}`;
    profile = await profileRepository.create({
      workspaceId,
      userId,
      subdomain: tempSubdomain,
      name: input.name || tempSubdomain,
      headline: input.headline,
      bio: input.bio,
      role: input.role,
      company: input.company,
      avatarUrl: input.avatarUrl ?? null,
      email: input.email || null,
      showEmail: input.showEmail,
      location: input.location,
      timezone: input.timezone,
      availabilityBadge: input.availabilityBadge,
      links: input.links || [],
      proofPoints: input.proofPoints || [],
      theme: input.theme
        ? {
          preset: 'minimal',
          ...input.theme,
          template: requestedTemplate || DEFAULT_TEMPLATE_ID,
          customCss: null,
        }
        : { preset: 'minimal', template: DEFAULT_TEMPLATE_ID, customCss: null },
      socialHandles: input.socialHandles,
      seo: input.seo,
      openTo: input.openTo || [],
      visibility: input.visibility || 'public',
    });
  }

  const currentTemplate = normalizeTemplateId(profile.theme?.template || DEFAULT_TEMPLATE_ID);
  if (requestedTemplate && currentTemplate !== previousTemplate) {
    analytics.templateChange({
      workspaceId,
      userId,
      profileId: profile.id,
      fromTemplate: previousTemplate,
      toTemplate: currentTemplate,
    });
  }

  invalidateProfileCache([previousSubdomain, profile.subdomain]);

  return NextResponse.json({
    success: true,
    profile,
    proofs: profile.proofPoints || [],
  });
}

export async function POST(request: NextRequest) {
  try {
    return await upsertProfile(request);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to save profile', { error: err });
    if (err.message === 'VERSION_CONFLICT') {
      return NextResponse.json(
        { error: 'Profile was modified in another session. Refresh to load latest version.', code: 'VERSION_CONFLICT' },
        { status: 409 }
      );
    }
    if (err.message.includes('duplicate key') || err.message.includes('23505')) {
      return NextResponse.json({ error: 'Subdomain already taken' }, { status: 409 });
    }
    return NextResponse.json(
      { error: config.NODE_ENV === 'production' ? 'Failed to save profile' : err.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    return await upsertProfile(request);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update profile', { error: err });
    if (err.message === 'VERSION_CONFLICT') {
      return NextResponse.json(
        { error: 'Profile was modified in another session. Refresh to load latest version.', code: 'VERSION_CONFLICT' },
        { status: 409 }
      );
    }
    if (err.message.includes('duplicate key') || err.message.includes('23505')) {
      return NextResponse.json({ error: 'Subdomain already taken' }, { status: 409 });
    }
    return NextResponse.json(
      { error: config.NODE_ENV === 'production' ? 'Failed to update profile' : err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getCurrentAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await profileRepository.findByWorkspaceId(auth.workspaceId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    await profileRepository.delete(profile.id);
    invalidateProfileCache([profile.subdomain]);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete profile', { error });
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
  }
}
