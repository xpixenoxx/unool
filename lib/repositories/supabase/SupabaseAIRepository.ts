import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import type { IAIRepository } from '../interfaces/IAIRepository';
import type { PromptVersion, AIGeneration, CreatePromptVersionInput, CreateAIGenerationInput } from '../interfaces/IAIRepository';

export class SupabaseAIRepository implements IAIRepository {
  private supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

  private mapPromptRow(row: Record<string, unknown>): PromptVersion {
    return {
      id: row.id as string,
      capability: row.capability as 'extract' | 'adapt' | 'recommend',
      version: row.version as string,
      prompt: row.prompt as string,
      model: row.model as string,
      provider: row.provider as string,
      schema: (row.schema as Record<string, unknown>) ?? null,
      isActive: row.is_active as boolean,
      createdAt: new Date(row.created_at as string),
    };
  }

  private mapGenerationRow(row: Record<string, unknown>): AIGeneration {
    return {
      id: row.id as string,
      promptVersionId: row.prompt_version_id as string,
      capability: row.capability as string,
      inputHash: row.input_hash as string,
      output: row.output as Record<string, unknown>,
      tokensIn: row.tokens_in as number,
      tokensOut: row.tokens_out as number,
      costUsd: row.cost_usd as number,
      latencyMs: row.latency_ms as number,
      createdAt: new Date(row.created_at as string),
    };
  }

  async findPromptVersion(capability: 'extract' | 'adapt' | 'recommend', version: string): Promise<PromptVersion | null> {
    const { data, error } = await this.supabase
      .from('ai_prompt_versions')
      .select('*')
      .eq('capability', capability)
      .eq('version', version)
      .single();
    if (error) { if (error.code === 'PGRST116') return null; throw error; }
    return this.mapPromptRow(data);
  }

  async findActivePromptVersion(capability: 'extract' | 'adapt' | 'recommend'): Promise<PromptVersion | null> {
    const { data, error } = await this.supabase
      .from('ai_prompt_versions')
      .select('*')
      .eq('capability', capability)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error) { if (error.code === 'PGRST116') return null; throw error; }
    return this.mapPromptRow(data);
  }

  async findAllPromptVersions(capability: 'extract' | 'adapt' | 'recommend'): Promise<PromptVersion[]> {
    const { data, error } = await this.supabase
      .from('ai_prompt_versions')
      .select('*')
      .eq('capability', capability)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(this.mapPromptRow);
  }

  async createPromptVersion(input: CreatePromptVersionInput): Promise<PromptVersion> {
    // Deactivate other versions if this is set active
    if (input.isActive) {
      await this.supabase
        .from('ai_prompt_versions')
        .update({ is_active: false })
        .eq('capability', input.capability);
    }

    const { data, error } = await this.supabase
      .from('ai_prompt_versions')
      .insert({
        capability: input.capability,
        version: input.version,
        prompt: input.prompt,
        model: input.model,
        provider: input.provider,
        schema: input.schema,
        is_active: input.isActive || false,
      })
      .select()
      .single();
    if (error) throw error;
    return this.mapPromptRow(data);
  }

  async setActivePromptVersion(capability: 'extract' | 'adapt' | 'recommend', version: string): Promise<void> {
    await this.supabase
      .from('ai_prompt_versions')
      .update({ is_active: false })
      .eq('capability', capability);

    await this.supabase
      .from('ai_prompt_versions')
      .update({ is_active: true })
      .eq('capability', capability)
      .eq('version', version);
  }

  async createGeneration(input: CreateAIGenerationInput): Promise<AIGeneration> {
    const { data, error } = await this.supabase
      .from('ai_generations')
      .insert({
        prompt_version_id: input.promptVersionId,
        capability: input.capability,
        input_hash: input.inputHash,
        output: input.output,
        tokens_in: input.tokensIn,
        tokens_out: input.tokensOut,
        cost_usd: input.costUsd,
        latency_ms: input.latencyMs,
      })
      .select()
      .single();
    if (error) throw error;
    return this.mapGenerationRow(data);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findGenerationsByWorkspace(_workspaceId: string): Promise<AIGeneration[]> {
    // Note: ai_generations doesn't have workspace_id directly, would need JOIN
    // For now, return empty - will be enhanced when workspace tracking added
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getUsageStats(_workspaceId: string, _dateFrom: Date): Promise<{
    totalTokens: number;
    totalCost: number;
    byCapability: Record<string, { tokens: number; cost: number; count: number }>;
  }> {
    // Simplified - would need JOIN with prompts to filter by workspace
    return { totalTokens: 0, totalCost: 0, byCapability: {} };
  }
}