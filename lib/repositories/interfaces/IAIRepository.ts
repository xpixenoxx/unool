export interface PromptVersion {
  id: string;
  capability: 'extract' | 'adapt' | 'recommend';
  version: string;
  prompt: string;
  model: string;
  provider: string;
  schema: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
}

export interface AIGeneration {
  id: string;
  promptVersionId: string;
  capability: string;
  inputHash: string;
  output: Record<string, unknown>;
  tokensIn: number | null;
  tokensOut: number | null;
  costUsd: number | null;
  latencyMs: number | null;
  createdAt: Date;
}

export interface CreatePromptVersionInput {
  capability: 'extract' | 'adapt' | 'recommend';
  version: string;
  prompt: string;
  model: string;
  provider: string;
  schema: Record<string, unknown>;
  isActive?: boolean;
}

export interface CreateAIGenerationInput {
  promptVersionId: string;
  capability: string;
  inputHash: string;
  output: Record<string, unknown>;
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  latencyMs?: number;
}

export interface IAIRepository {
  // Prompt versions
  findPromptVersion(capability: 'extract' | 'adapt' | 'recommend', version: string): Promise<PromptVersion | null>;
  findActivePromptVersion(capability: 'extract' | 'adapt' | 'recommend'): Promise<PromptVersion | null>;
  findAllPromptVersions(capability: 'extract' | 'adapt' | 'recommend'): Promise<PromptVersion[]>;
  createPromptVersion(input: CreatePromptVersionInput): Promise<PromptVersion>;
  setActivePromptVersion(capability: 'extract' | 'adapt' | 'recommend', version: string): Promise<void>;

  // Generations
  createGeneration(input: CreateAIGenerationInput): Promise<AIGeneration>;
  findGenerationsByWorkspace(workspaceId: string, limit?: number): Promise<AIGeneration[]>;
  getUsageStats(workspaceId: string, dateFrom: Date): Promise<{
    totalTokens: number;
    totalCost: number;
    byCapability: Record<string, { tokens: number; cost: number; count: number }>;
  }>;
}