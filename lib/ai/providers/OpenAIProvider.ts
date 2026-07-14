import { AIProvider, AIResponse, AIError, GenerationOptions } from '../types';
import { Result, ok, err } from '@/lib/shared/Result';
import { logger } from '@/lib/logger';
import { z } from 'zod';

export class OpenAIProvider implements AIProvider {
  name = 'openai';

  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateText(prompt: string, options?: GenerationOptions): Promise<Result<AIResponse, AIError>> {
    const model = options?.model || 'gpt-4o-mini';
    const systemPrompt = options?.systemPrompt || '';
    const maxTokens = options?.maxTokens || 4000;
    const temperature = options?.temperature ?? 0.7;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt }
          ],
          max_tokens: maxTokens,
          temperature,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return err({
          code: 'API_ERROR',
          message: data.error?.message || 'OpenAI API error',
          provider: this.name,
          retryable: response.status >= 500,
          name: 'OpenAIError',
        });
      }

      const usage = {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      };

      return ok({
        text: data.choices[0]?.message?.content || '',
        usage,
        model,
        finishReason: data.choices[0]?.finish_reason || 'stop',
      });
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('OpenAI provider error', { error: errorObj, prompt: prompt.slice(0, 100) });
      return err({
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
        retryable: true,
        name: 'OpenAIError',
      });
    }
  }

  async generateObject<T extends z.ZodTypeAny>(
    prompt: string,
    schema: T,
    options?: GenerationOptions
  ): Promise<Result<z.infer<T>, AIError>> {
    const jsonPrompt = `${prompt}\n\nReturn ONLY valid JSON matching this schema:\n${JSON.stringify((schema as unknown as z.ZodObject<Record<string, z.ZodTypeAny>>).shape, null, 2)}`;

    const result = await this.generateText(jsonPrompt, {
      ...options,
      temperature: 0.1,
      maxTokens: options?.maxTokens || 2000
    });

    if (!result.ok) return err(result.error);

    try {
      const parsed = JSON.parse(result.value.text);
      const validated = schema.parse(parsed);
      return ok(validated);
    } catch (parseError: unknown) {
      const errorObj = parseError instanceof Error ? parseError : new Error(String(parseError));
      logger.error('OpenAI JSON parse/validation error', { error: errorObj, text: result.value.text });
      return err({
        code: 'PARSE_ERROR',
        message: parseError instanceof Error ? parseError.message : 'Failed to parse JSON response',
        provider: this.name,
        retryable: false,
        name: 'OpenAIError',
      });
    }
  }
}