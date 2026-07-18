import { AIProvider, AIResponse, AIError, GenerationOptions } from '../types';
import { Result, ok, err } from '@/lib/shared/Result';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { config } from '@/lib/config/schema';

export class AnthropicProvider implements AIProvider {
  name = 'anthropic';

  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateText(prompt: string, options?: GenerationOptions): Promise<Result<AIResponse, AIError>> {
    const model = options?.model || config.ANTHROPIC_MODEL || config.AI_DEFAULT_MODEL;
    const systemPrompt = options?.systemPrompt || '';
    const maxTokens = options?.maxTokens || 4000;
    const temperature = options?.temperature ?? 0.7;

    try {
      console.log('[DEBUG AnthropicProvider] Sending request:', { model, maxTokens, temperature, promptLength: prompt.length });
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();
      console.log('[DEBUG AnthropicProvider] Response:', { ok: response.ok, status: response.status, data: JSON.stringify(data).slice(0, 500) });

      if (!response.ok) {
        return err({
          code: 'API_ERROR',
          message: data.error?.message || 'Anthropic API error',
          provider: this.name,
          retryable: response.status >= 500,
          name: 'AnthropicError',
        });
      }

      const usage = {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      };

      return ok({
        text: data.content[0]?.text || '',
        usage,
        model,
        finishReason: data.stop_reason || 'stop',
      });
    } catch (error: unknown) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Anthropic provider error', { error: errorObj, prompt: prompt.slice(0, 100) });
      return err({
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
        retryable: true,
        name: 'AnthropicError',
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
      // Strip markdown code fences if present
      let text = result.value.text.trim();

      // Remove opening fence (```json, ```javascript, ``` or any ```lang)
      text = text.replace(/^```[a-zA-Z]*\n?/, '');
      // Remove closing fence (```)
      text = text.replace(/\n?```$/, '');
      text = text.trim();

      const parsed = JSON.parse(text);
      const validated = schema.parse(parsed);
      return ok(validated);
    } catch (parseError: unknown) {
      logger.error('Anthropic JSON parse/validation error', { error: parseError instanceof Error ? parseError : new Error(String(parseError)), text: result.value.text });
      return err({
        code: 'PARSE_ERROR',
        message: parseError instanceof Error ? parseError.message : 'Failed to parse JSON response',
        provider: this.name,
        retryable: false,
        name: 'AnthropicError',
      });
    }
  }
}