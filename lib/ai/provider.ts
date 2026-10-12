import { AIProvider, GenerationOptions } from './types';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { GroqProvider } from './providers/GroqProvider';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { Result, ok } from '@/lib/shared/Result';

let providerInstance: AIProvider | null = null;
let providerName: 'anthropic' | 'openai' | 'groq' | null = config.GROQ_API_KEY
  ? 'groq'
  : config.ANTHROPIC_API_KEY
  ? 'anthropic'
  : config.OPENAI_API_KEY
  ? 'openai'
  : null;

function getModelForProvider(provider: 'anthropic' | 'openai' | 'groq'): string {
  if (provider === 'groq') return config.AI_GROQ_MODEL || 'qwen/qwen3.8-27b';
  if (provider === 'anthropic') return config.AI_DEFAULT_MODEL;
  if (provider === 'openai') return config.AI_OPENAI_MODEL;
  return config.AI_GROQ_MODEL || 'qwen/qwen3.8-27b';
}

function createProvider(): AIProvider {
  // Priority: Groq > Anthropic > OpenAI
  if (config.GROQ_API_KEY) {
    providerName = 'groq';
    logger.info('Initialized Groq AI provider');
    return new GroqProvider(config.GROQ_API_KEY, config.AI_GROQ_MODEL || 'qwen/qwen3.8-27b');
  }
  if (config.ANTHROPIC_API_KEY) {
    providerName = 'anthropic';
    logger.info('Initialized Anthropic AI provider');
    return new AnthropicProvider(config.ANTHROPIC_API_KEY);
  }
  if (config.OPENAI_API_KEY) {
    providerName = 'openai';
    logger.info('Initialized OpenAI AI provider');
    return new OpenAIProvider(config.OPENAI_API_KEY);
  }
  // Fallback - warns at runtime if no keys configured
  logger.warn('No AI provider API keys configured, using Anthropic as default (will fail without key)');
  providerName = 'anthropic';
  return new AnthropicProvider(config.ANTHROPIC_API_KEY || '');
}

export function getAIProvider(): AIProvider {
  if (providerInstance) return providerInstance;
  providerInstance = createProvider();
  return providerInstance;
}

export function resetAIProvider() {
  providerInstance = null;
  providerName = null;
}

// Try primary provider, fallback to secondary/tertiary on failure
async function tryWithFallback<T>(
  primaryFn: () => Promise<Result<T, Error>>,
  fallbackFn: (fallbackProvider: AIProvider, fallbackModel: string) => Promise<Result<T, Error>>
): Promise<Result<T, Error>> {
  const primaryResult = await primaryFn();
  if (primaryResult.ok) return primaryResult;

  logger.warn('Primary AI provider failed, trying fallback', {
    primary: providerName,
    error: primaryResult.error.message,
  });

  const tried = new Set<string>([providerName || 'unknown']);
  const candidates: Array<{ name: 'groq' | 'anthropic' | 'openai'; create: () => AIProvider }> = [];

  if (config.GROQ_API_KEY) {
    candidates.push({ name: 'groq', create: () => new GroqProvider(config.GROQ_API_KEY!, config.AI_GROQ_MODEL || 'qwen/qwen3.8-27b') });
  }
  if (config.ANTHROPIC_API_KEY) {
    candidates.push({ name: 'anthropic', create: () => new AnthropicProvider(config.ANTHROPIC_API_KEY!) });
  }
  if (config.OPENAI_API_KEY) {
    candidates.push({ name: 'openai', create: () => new OpenAIProvider(config.OPENAI_API_KEY!) });
  }

  let lastError = primaryResult.error;
  for (const candidate of candidates) {
    if (tried.has(candidate.name)) continue;
    tried.add(candidate.name);

    providerInstance = candidate.create();
    providerName = candidate.name;
    const fallbackModel = getModelForProvider(candidate.name);
    logger.info(`Switched to ${candidate.name} fallback provider`, { model: fallbackModel });

    const fallbackResult = await fallbackFn(providerInstance, fallbackModel);
    if (fallbackResult.ok) {
      return fallbackResult;
    }
    logger.warn(`${candidate.name} fallback provider failed`, { error: fallbackResult.error.message });
    lastError = fallbackResult.error;
  }

  return { ok: false, error: lastError };
}

export async function generateWithFallback<T extends z.ZodTypeAny>(
  prompt: string,
  options: GenerationOptions | undefined,
  schema: T
): Promise<Result<z.infer<T>, Error>>;

export async function generateWithFallback(
  prompt: string,
  options?: GenerationOptions,
  schema?: undefined
): Promise<Result<{ text: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number }; model: string; finishReason: string }, Error>>;

export async function generateWithFallback(
  prompt: string,
  options?: GenerationOptions,
  schema?: z.ZodTypeAny
): Promise<Result<z.infer<z.ZodTypeAny> | { text: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number }; model: string; finishReason: string }, Error>> {
  const provider = getAIProvider();
  const primaryModel = options?.model || (providerName ? getModelForProvider(providerName) : config.AI_DEFAULT_MODEL);
  logger.info('generateWithFallback called', { providerName, primaryModel, hasSchema: !!schema });

  type FallbackResult = z.infer<z.ZodTypeAny> | { text: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number }; model: string; finishReason: string };

  const primaryCall = async (): Promise<Result<FallbackResult, Error>> => {
    logger.info('Primary call', { provider: provider.name, model: primaryModel });
    if (schema) {
      const result = await provider.generateObject(prompt, schema, { ...options, model: primaryModel });
      if (!result.ok) {
        logger.error('Primary generateObject failed', { error: new Error(result.error.message) });
        return { ok: false as const, error: new Error(result.error.message) };
      }
      return ok(result.value);
    }
    const result = await provider.generateText(prompt, { ...options, model: primaryModel });
    if (!result.ok) {
      logger.error('Primary generateText failed', { error: new Error(result.error.message) });
      return { ok: false as const, error: new Error(result.error.message) };
    }
    return ok(result.value);
  };

  const fallbackCall = async (fallbackProvider: AIProvider, fallbackModel: string): Promise<Result<FallbackResult, Error>> => {
    if (schema) {
      const result = await fallbackProvider.generateObject(prompt, schema, { ...options, model: fallbackModel });
      if (!result.ok) return { ok: false as const, error: new Error(result.error.message) };
      return ok(result.value);
    }
    const result = await fallbackProvider.generateText(prompt, { ...options, model: fallbackModel });
    if (!result.ok) return { ok: false as const, error: new Error(result.error.message) };
    return ok(result.value);
  };

  return tryWithFallback(primaryCall, fallbackCall);
}