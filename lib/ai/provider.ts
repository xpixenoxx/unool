import { AIProvider, GenerationOptions } from './types';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { Result, ok } from '@/lib/shared/Result';

let providerInstance: AIProvider | null = null;
// Initialize providerName from config at module load
let providerName: 'anthropic' | 'openai' | null = config.ANTHROPIC_API_KEY ? 'anthropic' : (config.OPENAI_API_KEY ? 'openai' : null);

function getModelForProvider(provider: 'anthropic' | 'openai'): string {
  return provider === 'anthropic'
    ? config.AI_DEFAULT_MODEL
    : config.AI_OPENAI_MODEL;
}

function createProvider(): AIProvider {
  // Priority: Anthropic > OpenAI
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
  // Fallback - throws at runtime if no keys configured
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

// Try primary provider, fallback to secondary on failure
async function tryWithFallback<T>(
  primaryFn: () => Promise<Result<T, Error>>,
  fallbackFn: (fallbackProvider: AIProvider, fallbackModel: string) => Promise<Result<T, Error>>
): Promise<Result<T, Error>> {
  const primaryResult = await primaryFn();
  if (primaryResult.ok) return primaryResult;

  logger.warn('Primary AI provider failed, trying fallback', {
    primary: providerName,
    error: primaryResult.error.message
  });

  // Swap to fallback provider
  if (providerName === 'anthropic' && config.OPENAI_API_KEY) {
    providerInstance = new OpenAIProvider(config.OPENAI_API_KEY);
    providerName = 'openai';
    logger.info('Switched to OpenAI fallback provider');
  } else if (providerName === 'openai' && config.ANTHROPIC_API_KEY) {
    providerInstance = new AnthropicProvider(config.ANTHROPIC_API_KEY);
    providerName = 'anthropic';
    logger.info('Switched to Anthropic fallback provider');
  } else {
    return primaryResult; // No fallback available
  }

  // Now call fallback with the NEW provider and model
  const fallbackProvider = getAIProvider();
  const fallbackModel = getModelForProvider(providerName!);
  return fallbackFn(fallbackProvider, fallbackModel);
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
  // Use module-level providerName (initialized from config at module level)
  const primaryModel = options?.model || getModelForProvider(providerName!);
  logger.info('generateWithFallback called', { providerName, primaryModel, hasSchema: !!schema });

  type FallbackResult = z.infer<z.ZodTypeAny> | { text: string; usage: { promptTokens: number; completionTokens: number; totalTokens: number }; model: string; finishReason: string };

  const primaryCall = async (): Promise<Result<FallbackResult, Error>> => {
    const provider = getAIProvider();
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