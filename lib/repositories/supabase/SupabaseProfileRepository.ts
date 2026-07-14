import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import type { IProfileRepository } from '../interfaces/IProfileRepository';
import type { Profile, CreateProfileInput, UpdateProfileInput, ProfileLink, ProofPoint, ProfileTheme } from '../interfaces/IProfileRepository';

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
      links: (row.links as ProfileLink[]) || [],
      proofPoints: (row.proof_points as ProofPoint[]) || [],
      theme: (row.theme as ProfileTheme) || { preset: 'minimal' },
      sourceUrl: row.source_url as string | null,
      extractionPromptVersion: row.extraction_prompt_version as string | null,
      version: row.version as number,
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
    if (data.links !== undefined) updateData.links = data.links;
    if (data.proofPoints !== undefined) updateData.proof_points = data.proofPoints;
    if (data.theme !== undefined) updateData.theme = data.theme;
    if (data.subdomain !== undefined) updateData.subdomain = data.subdomain;

    const { data: row, error } = await this.supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .eq('version', expectedVersion)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('VERSION_CONFLICT');
      }
      throw error;
    }
    return this.mapRow(row);
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
}