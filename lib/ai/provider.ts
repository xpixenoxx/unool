import { AIProvider, GenerationOptions } from './types';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { Result } from '@/lib/shared/Result';

let providerInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (providerInstance) return providerInstance;

  // Priority: Anthropic > OpenAI > fallback
  if (config.ANTHROPIC_API_KEY) {
    providerInstance = new AnthropicProvider(config.ANTHROPIC_API_KEY);
    logger.info('Initialized Anthropic AI provider');
    return providerInstance;
  }

  if (config.OPENAI_API_KEY) {
    providerInstance = new OpenAIProvider(config.OPENAI_API_KEY);
    logger.info('Initialized OpenAI AI provider');
    return providerInstance;
  }

  // Fallback - throws at runtime if no keys configured
  logger.warn('No AI provider API keys configured, using Anthropic as default (will fail without key)');
  providerInstance = new AnthropicProvider(config.ANTHROPIC_API_KEY || '');
  return providerInstance;
}

export function resetAIProvider() {
  providerInstance = null;
}

// Overload for when schema is provided - returns validated object
export async function generateWithFallback<T extends z.ZodTypeAny>(
  prompt: string,
  options: GenerationOptions | undefined,
  schema: T
): Promise<Result<z.infer<T>, Error>>;

// Overload for when schema is not provided - returns AIResponse
export async function generateWithFallback(
  prompt: string,
  options?: GenerationOptions,
  schema?: undefined
): Promise<Result<{ text: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number }; model: string; finishReason: string }, Error>>;

// Implementation
export async function generateWithFallback(
  prompt: string,
  options?: GenerationOptions,
  schema?: z.ZodTypeAny
): Promise<Result<z.infer<z.ZodTypeAny> | { text: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number }; model: string; finishReason: string }, Error>> {
  const provider = getAIProvider();

  if (schema) {
    const result = await provider.generateObject(prompt, schema, options);
    if (!result.ok) {
      return { ok: false, error: new Error(result.error.message) };
    }
    return { ok: true, value: result.value };
  }

  const result = await provider.generateText(prompt, options);
  if (!result.ok) {
    return { ok: false, error: new Error(result.error.message) };
  }
  return { ok: true, value: result.value };
}