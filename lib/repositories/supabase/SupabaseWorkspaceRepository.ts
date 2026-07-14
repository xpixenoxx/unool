import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import type { IWorkspaceRepository, Workspace, CreateWorkspaceInput, IUserRepository } from '../interfaces/IWorkspaceRepository';

export class SupabaseWorkspaceRepository implements IWorkspaceRepository {
  private supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

  private mapRow(row: Record<string, unknown>): Workspace {
    return {
      id: row.id as string,
      name: row.name as string,
      ownerId: row.owner_id as string,
      plan: row.plan as 'free' | 'pro' | 'team',
      settings: row.settings as Record<string, unknown>,
      createdAt: new Date(row.created_at as string),
    };
  }

  async findById(id: string): Promise<Workspace | null> {
    const { data, error } = await this.supabase.from('workspaces').select('*').eq('id', id).single();
    if (error) { if (error.code === 'PGRST116') return null; throw error; }
    return this.mapRow(data);
  }

  async findByOwnerId(ownerId: string): Promise<Workspace[]> {
    const { data, error } = await this.supabase.from('workspaces').select('*').eq('owner_id', ownerId);
    if (error) throw error;
    return data.map(this.mapRow);
  }

  async create(input: CreateWorkspaceInput): Promise<Workspace> {
    const { data, error } = await this.supabase
      .from('workspaces')
      .insert({ name: input.name, owner_id: input.ownerId, plan: input.plan || 'free', settings: {} })
      .select()
      .single();
    if (error) throw error;
    return this.mapRow(data);
  }

  async update(id: string, data: Partial<Workspace>): Promise<Workspace> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.plan !== undefined) updateData.plan = data.plan;
    if (data.settings !== undefined) updateData.settings = data.settings;

    const { data: row, error } = await this.supabase.from('workspaces').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    return this.mapRow(row);
  }
}

export class SupabaseUserRepository implements IUserRepository {
  private supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

  async findById(id: string): Promise<string | null> {
    const { data, error } = await this.supabase.from('users').select('id').eq('id', id).single();
    if (error) { if (error.code === 'PGRST116') return null; throw error; }
    return data.id;
  }

  async findByEmail(email: string): Promise<string | null> {
    const { data, error } = await this.supabase.from('users').select('id').eq('email', email).single();
    if (error) { if (error.code === 'PGRST116') return null; throw error; }
    return data.id;
  }

  async create(userId: string, email: string, fullName?: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .upsert({ id: userId, email, full_name: fullName }, { onConflict: 'id' });
    if (error) throw error;
  }
}