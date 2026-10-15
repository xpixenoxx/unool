import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import type { IProfileRepository } from '../interfaces/IProfileRepository';
import type { Profile, CreateProfileInput, UpdateProfileInput, ProfileLink, ProofPoint, ProfileTheme, ProfileViewer } from '../interfaces/IProfileRepository';

export class SupabaseProfileRepository implements IProfileRepository {
  private supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

  private mapRow(row: Record<string, unknown>): Profile {
    return {
      id: row.id as string,
      workspaceId: row.workspace_id as string,
      userId: row.user_id as string,
      subdomain: row.subdomain as string,
      name: row.name as string,
      headline: row.headline as string,
      bio: row.bio as string,
      role: row.role as string,
      company: row.company as string,
      avatarUrl: row.avatar_url as string | null,
      links: (row.links as ProfileLink[]) || [],
      proofPoints: (row.proof_points as ProofPoint[]) || [],
      theme: (row.theme as ProfileTheme) || { preset: 'minimal' },
      sourceUrl: row.source_url as string | null,
      extractionPromptVersion: row.extraction_prompt_version as string | null,
      version: row.version as number,
      visibility: (row.visibility as 'public' | 'private') || 'public',
      openTo: (row.open_to as string[]) || [],
      onboardingCompleted:
        (row.onboarding_completed as boolean) ??
        Boolean((row.theme as Record<string, unknown>)?.onboarding_completed) ??
        false,
      onboardingAnswers:
        (row.onboarding_answers as any) ??
        ((row.theme as Record<string, unknown>)?.onboarding_answers as any) ??
        null,
      studioProfile:
        ((row.studio_profile as any) ??
        ((row.theme as Record<string, unknown>)?.studio_profile as any) ??
        null),
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.mapRow(data);
  }

  async findBySubdomain(subdomain: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('subdomain', subdomain)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.mapRow(data);
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.mapRow(data);
  }

  async findByWorkspaceId(workspaceId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.mapRow(data);
  }

  async create(input: CreateProfileInput): Promise<Profile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .insert({
        workspace_id: input.workspaceId,
        user_id: input.userId,
        subdomain: input.subdomain,
        source_url: input.sourceUrl,
        extraction_prompt_version: input.extractionPromptVersion,
        visibility: 'public',
        version: 1,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return this.mapRow(data);
  }

  async update(id: string, data: UpdateProfileInput, expectedVersion: number): Promise<Profile> {
    const updateData: Record<string, unknown> = {
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
    if (data.subdomain !== undefined) updateData.subdomain = data.subdomain;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.openTo !== undefined) updateData.open_to = data.openTo;

    // Build theme object with fallback onboarding metadata
    let themeObj: Record<string, unknown> = (data.theme as Record<string, unknown>) || {};
    if (data.onboardingCompleted !== undefined || data.onboardingAnswers !== undefined || data.studioProfile !== undefined) {
      themeObj = {
        ...themeObj,
        ...(data.onboardingCompleted !== undefined ? { onboarding_completed: data.onboardingCompleted } : {}),
        ...(data.onboardingAnswers !== undefined ? { onboarding_answers: data.onboardingAnswers } : {}),
        ...(data.studioProfile !== undefined ? { studio_profile: data.studioProfile } : {}),
      };
      updateData.theme = themeObj;
    } else if (data.theme !== undefined) {
      updateData.theme = data.theme;
    }

    if (data.onboardingCompleted !== undefined) {
      updateData.onboarding_completed = data.onboardingCompleted;
    }
    if (data.onboardingAnswers !== undefined) {
      updateData.onboarding_answers = data.onboardingAnswers;
    }
    if (data.studioProfile !== undefined) {
      updateData.studio_profile = data.studioProfile;
    }

    let result = await this.supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .eq('version', expectedVersion)
      .select()
      .single();

    // If top-level columns onboarding_completed / onboarding_answers / studio_profile don't exist in Supabase yet,
    // fallback gracefully to updating without them (theme already has them saved)
    if (result.error && (result.error.code === '42703' || result.error.message?.includes('onboarding') || result.error.message?.includes('studio_profile'))) {
      delete updateData.onboarding_completed;
      delete updateData.onboarding_answers;
      delete updateData.studio_profile;
      result = await this.supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id)
        .eq('version', expectedVersion)
        .select()
        .single();
    }

    if (result.error) {
      if (result.error.code === 'PGRST116') {
        throw new Error('VERSION_CONFLICT');
      }
      throw result.error;
    }
    return this.mapRow(result.data);
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
      .delete()
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

    if (error && error.code !== '23505') { // Ignore unique constraint violation
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

  async getViewers(profileId: string): Promise<ProfileViewer[]> {
    const { data, error } = await this.supabase
      .from('profile_viewers')
      .select(`
        id,
        profile_id,
        user_id,
        created_at,
        user:users!user_id (
          email,
          full_name
        )
      `)
      .eq('profile_id', profileId);

    if (error) {
      // If table doesn't exist yet, just return empty gracefully
      if (error.code === '42P01') return [];
      throw error;
    }

    return (data || []).map(row => {
      const user = Array.isArray(row.user) ? row.user[0] : row.user;
      return {
        id: row.id,
        profileId: row.profile_id,
        viewerUserId: row.user_id,
        createdAt: new Date(row.created_at),
        email: user?.email,
        fullName: user?.full_name
      };
    });
  }
}