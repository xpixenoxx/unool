import type {
  IProfileRepository,
  Profile,
  CreateProfileInput,
  UpdateProfileInput,
  ProfileLink,
  ProofPoint,
  ProfileTheme,
  ProfileViewer,
  ProfileSeo,
} from '../interfaces/IProfileRepository';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { normalizeTemplateId, DEFAULT_TEMPLATE_ID } from '@/lib/profile/templateNormalization';

const OPTIONAL_PROFILE_COLUMNS = [
  'email',
  'show_email',
  'location',
  'timezone',
  'availability_badge',
  'social_handles',
  'seo',
  'custom_domain',
  'custom_domain_verified_at',
  'custom_domain_verification_token',
  'studio_profile',
  'onboarding_completed',
  'onboarding_answers',
] as const;

export class SupabaseProfileRepository implements IProfileRepository {
  private supabase = supabaseAdmin;

  private mapRow(row: Record<string, unknown>): Profile {
    const rawTheme = ((row.theme as Record<string, unknown>) || {}) as ProfileTheme;
    const normalizedTemplate = normalizeTemplateId(
      typeof rawTheme.template === 'string' ? rawTheme.template : DEFAULT_TEMPLATE_ID
    );
    const cleanTheme: ProfileTheme = {
      ...rawTheme,
      template: normalizedTemplate,
      customCss: null,
    };

    const meta = (rawTheme._profileMeta as Record<string, unknown> | undefined) || {};
    const rawVisibility = (row.visibility as string | undefined) || (meta.visibility as string | undefined) || 'public';
    const visibility: 'public' | 'private' | 'unlisted' =
      rawVisibility === 'private' || rawVisibility === 'unlisted' ? rawVisibility : 'public';

    return {
      id: row.id as string,
      workspaceId: row.workspace_id as string,
      userId: row.user_id as string,
      subdomain: (row.subdomain as string | null) ?? null,
      name: (row.name as string | null) ?? null,
      headline: (row.headline as string | null) ?? null,
      bio: (row.bio as string | null) ?? null,
      role: (row.role as string | null) ?? null,
      company: (row.company as string | null) ?? null,
      avatarUrl: (row.avatar_url as string | null) ?? null,
      email: (row.email as string | null) ?? (meta.email as string | null) ?? null,
      showEmail:
        typeof row.show_email === 'boolean'
          ? row.show_email
          : typeof meta.showEmail === 'boolean'
            ? meta.showEmail
            : false,
      location:
        (row.location as string | null) ??
        (rawTheme.location as string | null) ??
        (meta.location as string | null) ??
        null,
      timezone:
        (row.timezone as string | null) ??
        (rawTheme.timezone as string | null) ??
        (meta.timezone as string | null) ??
        null,
      availabilityBadge:
        (row.availability_badge as string | null) ??
        (rawTheme.availabilityBadge as string | null) ??
        (meta.availabilityBadge as string | null) ??
        null,
      links: (row.links as ProfileLink[]) || [],
      proofPoints: (row.proof_points as ProofPoint[]) || [],
      theme: cleanTheme,
      socialHandles:
        (row.social_handles as Record<string, string>) ||
        (meta.socialHandles as Record<string, string>) ||
        {},
      seo:
        (row.seo as ProfileSeo) ||
        (meta.seo as ProfileSeo) ||
        {},
      customDomain: (row.custom_domain as string | null) ?? null,
      customDomainVerifiedAt: row.custom_domain_verified_at
        ? new Date(row.custom_domain_verified_at as string)
        : null,
      customDomainVerificationToken: (row.custom_domain_verification_token as string | null) ?? null,
      sourceUrl: (row.source_url as string | null) ?? null,
      extractionPromptVersion: (row.extraction_prompt_version as string | null) ?? null,
      version: (row.version as number) || 1,
      visibility,
      openTo: (row.open_to as string[]) || [],
      onboardingCompleted:
        typeof row.onboarding_completed === 'boolean'
          ? row.onboarding_completed
          : Boolean(rawTheme.onboarding_completed),
      onboardingAnswers:
        (row.onboarding_answers as Profile['onboardingAnswers']) ??
        (rawTheme.onboarding_answers as Profile['onboardingAnswers']) ??
        null,
      studioProfile:
        (row.studio_profile as Profile['studioProfile']) ??
        (rawTheme.studio_profile as Profile['studioProfile']) ??
        null,
      deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : null,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;
    return this.mapRow(data);
  }

  async findBySubdomain(subdomain: string): Promise<Profile | null> {
    const clean = subdomain.trim().toLowerCase();
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('subdomain', clean)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;
    return this.mapRow(data);
  }

  async findByCustomDomain(domain: string): Promise<Profile | null> {
    const clean = domain.trim().toLowerCase();
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('custom_domain', clean)
      .not('custom_domain_verified_at', 'is', null)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapRow(data);
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;
    return this.mapRow(data);
  }

  async findByWorkspaceId(workspaceId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .single();

    if (error || !data) return null;
    return this.mapRow(data);
  }

  async findDeletedByWorkspaceId(workspaceId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('workspace_id', workspaceId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapRow(data);
  }

  private stripMissingOptionalColumns(payload: Record<string, unknown>, message: string): Record<string, unknown> {
    const next = { ...payload };
    for (const col of OPTIONAL_PROFILE_COLUMNS) {
      if (col in next && (!message || message.includes(col))) {
        delete next[col];
      }
    }
    return next;
  }

  async create(input: CreateProfileInput): Promise<Profile> {
    const baseTheme: ProfileTheme = {
      preset: input.theme?.preset || 'minimal',
      template: normalizeTemplateId(input.theme?.template || DEFAULT_TEMPLATE_ID),
      ...(input.theme || {}),
      customCss: null,
    };

    const insertData: Record<string, unknown> = {
      workspace_id: input.workspaceId,
      user_id: input.userId,
      subdomain: input.subdomain ? input.subdomain.trim().toLowerCase() : null,
      source_url: input.sourceUrl ?? null,
      extraction_prompt_version: input.extractionPromptVersion ?? null,
      version: 1,
      name: input.name ?? null,
      headline: input.headline ?? null,
      bio: input.bio ?? null,
      role: input.role ?? null,
      company: input.company ?? null,
      avatar_url: input.avatarUrl ?? null,
      links: input.links ?? [],
      proof_points: input.proofPoints ?? [],
      theme: baseTheme,
      visibility: input.visibility ?? 'public',
      open_to: input.openTo ?? [],
    };

    if (input.email !== undefined) insertData.email = input.email;
    if (input.showEmail !== undefined) insertData.show_email = input.showEmail;
    if (input.location !== undefined) insertData.location = input.location;
    if (input.timezone !== undefined) insertData.timezone = input.timezone;
    if (input.availabilityBadge !== undefined) insertData.availability_badge = input.availabilityBadge;
    if (input.socialHandles !== undefined) insertData.social_handles = input.socialHandles;
    if (input.seo !== undefined) insertData.seo = input.seo;
    if (input.onboardingCompleted !== undefined) insertData.onboarding_completed = input.onboardingCompleted;
    if (input.onboardingAnswers !== undefined) insertData.onboarding_answers = input.onboardingAnswers;
    if (input.studioProfile !== undefined) insertData.studio_profile = input.studioProfile;

    const { data, error } = await this.supabase
      .from('profiles')
      .insert(insertData)
      .select()
      .single();

    if (error && (error.code === '42703' || error.code === 'PGRST204' || error.code === '23514')) {
      const safeInsert = this.stripMissingOptionalColumns(insertData, error.message || '');
      if (safeInsert.visibility === 'unlisted') {
        safeInsert.visibility = 'public';
      }
      const { data: retryData, error: retryErr } = await this.supabase
        .from('profiles')
        .insert(safeInsert)
        .select()
        .single();
      if (retryErr || !retryData) {
        throw retryErr || new Error('Failed to create profile');
      }
      return this.mapRow(retryData);
    }

    if (error || !data) {
      throw error || new Error('Failed to create profile');
    }

    return this.mapRow(data);
  }

  async update(id: string, data: UpdateProfileInput, expectedVersion: number): Promise<Profile> {
    const updateData: Record<string, unknown> = {
      version: expectedVersion + 1,
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.headline !== undefined) updateData.headline = data.headline;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
    if (data.links !== undefined) updateData.links = data.links;
    if (data.proofPoints !== undefined) updateData.proof_points = data.proofPoints;
    if (data.subdomain !== undefined) {
      updateData.subdomain = data.subdomain ? data.subdomain.trim().toLowerCase() : null;
    }
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.openTo !== undefined) updateData.open_to = data.openTo;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.showEmail !== undefined) updateData.show_email = data.showEmail;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.availabilityBadge !== undefined) updateData.availability_badge = data.availabilityBadge;
    if (data.socialHandles !== undefined) updateData.social_handles = data.socialHandles;
    if (data.seo !== undefined) updateData.seo = data.seo;
    if (data.customDomain !== undefined) updateData.custom_domain = data.customDomain;
    if (data.customDomainVerifiedAt !== undefined) {
      updateData.custom_domain_verified_at = data.customDomainVerifiedAt instanceof Date
        ? data.customDomainVerifiedAt.toISOString()
        : data.customDomainVerifiedAt;
    }
    if (data.customDomainVerificationToken !== undefined) {
      updateData.custom_domain_verification_token = data.customDomainVerificationToken;
    }
    if (data.onboardingCompleted !== undefined) updateData.onboarding_completed = data.onboardingCompleted;
    if (data.onboardingAnswers !== undefined) updateData.onboarding_answers = data.onboardingAnswers;
    if (data.studioProfile !== undefined) updateData.studio_profile = data.studioProfile;

    // Only write `theme` JSONB when caller explicitly updates theme — NEVER wipe theme during AI/onboarding writes!
    if (data.theme !== undefined) {
      updateData.theme = {
        ...data.theme,
        template: normalizeTemplateId(data.theme.template || DEFAULT_TEMPLATE_ID),
        customCss: null,
      };
    }

    const { data: updated, error } = await this.supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .eq('version', expectedVersion)
      .is('deleted_at', null)
      .select()
      .single();

    if (error && (error.code === '42703' || error.code === 'PGRST204' || error.code === '23514')) {
      const stripped = this.stripMissingOptionalColumns(updateData, error.message || '');
      if (stripped.visibility === 'unlisted') {
        stripped.visibility = 'public';
      }
      const { data: retryUpdated, error: retryError } = await this.supabase
        .from('profiles')
        .update(stripped)
        .eq('id', id)
        .eq('version', expectedVersion)
        .is('deleted_at', null)
        .select()
        .single();

      if (retryError || !retryUpdated) {
        throw new Error('VERSION_CONFLICT');
      }
      return this.mapRow(retryUpdated);
    }

    if (error || !updated) {
      throw new Error('VERSION_CONFLICT');
    }

    return this.mapRow(updated);
  }

  async updateVersion(id: string, newVersion: number): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .update({ version: newVersion, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      const { error: hardErr } = await this.supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      if (hardErr) throw hardErr;
    }
  }

  async recover(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .update({ deleted_at: null, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw error;
    }
  }

  async addViewer(profileId: string, viewerUserId: string): Promise<void> {
    const { error } = await this.supabase
      .from('profile_viewers')
      .insert({ profile_id: profileId, user_id: viewerUserId })
      .select()
      .single();

    if (error && error.code !== '23505') {
      throw error;
    }
  }

  async removeViewer(profileId: string, viewerUserId: string): Promise<void> {
    const { error } = await this.supabase
      .from('profile_viewers')
      .delete()
      .eq('profile_id', profileId)
      .eq('user_id', viewerUserId);

    if (error) {
      throw error;
    }
  }

  async isViewerAllowed(profileId: string, viewerUserId: string): Promise<boolean> {
    if (!viewerUserId) return false;
    const { data, error } = await this.supabase
      .from('profile_viewers')
      .select('id')
      .eq('profile_id', profileId)
      .eq('user_id', viewerUserId)
      .maybeSingle();

    if (error) {
      return false;
    }
    return Boolean(data?.id);
  }

  async getViewers(profileId: string): Promise<ProfileViewer[]> {
    const { data, error } = await this.supabase
      .from('profile_viewers')
      .select('id, profile_id, user_id, created_at')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') return [];
      throw error;
    }

    const rows = data || [];
    const enriched = await Promise.all(
      rows.map(async (row) => {
        let email: string | undefined;
        let fullName: string | undefined;
        try {
          const { data: userRes } = await this.supabase.auth.admin.getUserById(row.user_id);
          email = userRes?.user?.email ?? undefined;
          fullName =
            (userRes?.user?.user_metadata?.full_name as string | undefined) ||
            (userRes?.user?.user_metadata?.name as string | undefined);
        } catch {
          // Graceful degradation when user lookup is unavailable in mocked environments
        }
        return {
          id: row.id,
          profileId: row.profile_id,
          viewerUserId: row.user_id,
          createdAt: new Date(row.created_at),
          email,
          fullName,
        };
      })
    );

    return enriched;
  }
}
