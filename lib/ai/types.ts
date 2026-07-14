import { z } from 'zod';
import { Result } from '@/lib/shared/Result';

export interface AIProvider {
  name: string;
  generateText(prompt: string, options?: GenerationOptions): Promise<Result<AIResponse, AIError>>;
  generateObject<T extends z.ZodTypeAny>(prompt: string, schema: T, options?: GenerationOptions): Promise<Result<z.infer<T>, AIError>>;
}

export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
  systemPrompt?: string;
}

export interface AIResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

export interface AIError {
  code: string;
  message: string;
  provider: string;
  retryable: boolean;
  name: string;
}

export interface PromptVersion {
  id: string;
  name: string;
  version: string;
  prompt: string;
  schema?: z.ZodTypeAny;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerationLog {
  id: string;
  promptVersionId: string;
  provider: string;
  model: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  usage: AIResponse['usage'];
  latencyMs: number;
  status: 'success' | 'error';
  error?: AIError;
  createdAt: Date;
}