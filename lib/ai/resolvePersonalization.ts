import { supabaseAdmin } from '@/lib/supabase/admin';
import type { StudioProfile } from '@/lib/config/studioOnboarding';

export interface ResolvedAiPersonalization {
  enabled: boolean;
  studioProfile: (Partial<StudioProfile> & Record<string, any>) | null;
}

export interface ResolveAiPersonalizationParams {
  userId: string;
  workspaceId: string;
  disablePersonalization?: boolean;
  bodyStudioProfile?: Record<string, any> | null;
  profileStudioProfile?: Record<string, any> | null;
  profileOnboardingAnswers?: Record<string, any> | null;
}

/**
 * Resolves whether AI prompt personalization is enabled for the user/workspace
 * and returns the highest-priority Brand Voice / Studio profile.
 * Fails open to `enabled: true` only when preferences have not been set or
 * a pre-migration table read errors, while honoring explicit `false` opt-out.
 */
export async function resolveAiPersonalization(
  params: ResolveAiPersonalizationParams
): Promise<ResolvedAiPersonalization> {
  if (params.disablePersonalization === true) {
    return { enabled: false, studioProfile: null };
  }

  let enabled = true;
  let workspaceStudioProfile: Record<string, any> | null = null;
  let dedicatedStudioProfile: Record<string, any> | null = null;

  try {
    const [prefRes, studioRes, wsRes] = await Promise.allSettled([
      supabaseAdmin
        .from('user_preferences')
        .select('ai_personalization_enabled')
        .eq('user_id', params.userId)
        .maybeSingle(),
      supabaseAdmin
        .from('studio_profiles')
        .select('profile_data')
        .eq('workspace_id', params.workspaceId)
        .maybeSingle(),
      supabaseAdmin
        .from('workspaces')
        .select('settings')
        .eq('id', params.workspaceId)
        .maybeSingle(),
    ]);

    let prefBool: boolean | undefined;

    if (prefRes.status === 'fulfilled' && !prefRes.value?.error && prefRes.value?.data) {
      const val = (prefRes.value.data as Record<string, unknown>).ai_personalization_enabled;
      if (typeof val === 'boolean') {
        prefBool = val;
      }
    }

    if (wsRes.status === 'fulfilled' && !wsRes.value?.error && wsRes.value?.data) {
      const settings = ((wsRes.value.data as Record<string, any>).settings || {}) as Record<string, any>;
      if (settings.studio_profile && typeof settings.studio_profile === 'object') {
        workspaceStudioProfile = settings.studio_profile;
      }
      if (prefBool === undefined && settings.preferences && typeof settings.preferences === 'object') {
        const wsPref =
          settings.preferences.ai_personalization_enabled ??
          settings.preferences.aiPersonalizationEnabled;
        if (typeof wsPref === 'boolean') {
          prefBool = wsPref;
        }
      }
    }

    if (studioRes.status === 'fulfilled' && !studioRes.value?.error && studioRes.value?.data) {
      const pdata = (studioRes.value.data as Record<string, any>).profile_data;
      if (pdata && typeof pdata === 'object') {
        dedicatedStudioProfile = pdata;
      }
    }

    if (typeof prefBool === 'boolean') {
      enabled = prefBool;
    }
  } catch {
    // Non-fatal fallback for mocked test environments or pre-migration DB states
  }

  if (!enabled) {
    return { enabled: false, studioProfile: null };
  }

  const studioProfile =
    params.bodyStudioProfile ||
    dedicatedStudioProfile ||
    workspaceStudioProfile ||
    params.profileStudioProfile ||
    params.profileOnboardingAnswers ||
    null;

  return {
    enabled: true,
    studioProfile,
  };
}

