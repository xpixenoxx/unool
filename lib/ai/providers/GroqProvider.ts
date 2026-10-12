import { AIProvider, AIResponse, AIError, GenerationOptions } from '../types';
import { Result, ok, err } from '@/lib/shared/Result';
import { logger } from '@/lib/logger';
import { z } from 'zod';

/**
 * Groq AI provider — uses the OpenAI-compatible API at api.groq.com.
 * Supports high-throughput generation using models like openai/gpt-oss-120b.
 */
export class GroqProvider implements AIProvider {
  name = 'groq';

  private apiKey: string;
  private defaultModel: string;
  private baseUrl = 'https://api.groq.com/openai/v1';

  constructor(apiKey: string, defaultModel: string = 'openai/gpt-oss-120b') {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  async generateText(
    prompt: string,
    options?: GenerationOptions & { responseFormatJson?: boolean }
  ): Promise<Result<AIResponse, AIError>> {
    const model = options?.model || this.defaultModel || 'openai/gpt-oss-120b';
    const systemPrompt = options?.systemPrompt || '';
    const maxTokens = options?.maxTokens || 4000;
    const temperature = options?.temperature ?? 0.7;

    const requestBody: Record<string, unknown> = {
      model,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
      temperature,
    };

    if (options?.responseFormatJson) {
      requestBody.response_format = { type: 'json_object' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        return err({
          code: 'API_ERROR',
          message: data.error?.message || 'Groq API error',
          provider: this.name,
          retryable: response.status >= 500,
          name: 'GroqError',
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
      logger.error('Groq provider error', { error: errorObj, prompt: prompt.slice(0, 100) });
      return err({
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        provider: this.name,
        retryable: true,
        name: 'GroqError',
      });
    }
  }

  async generateObject<T extends z.ZodTypeAny>(
    prompt: string,
    schema: T,
    options?: GenerationOptions
  ): Promise<Result<z.infer<T>, AIError>> {
    const result = await this.generateText(prompt, {
      ...options,
      temperature: 0.1,
      maxTokens: options?.maxTokens || 4000,
      responseFormatJson: true,
    });

    if (!result.ok) return err(result.error);

    try {
      let text = result.value.text.trim();
      if (text.startsWith('```json')) {
        text = text.slice(7);
      } else if (text.startsWith('```')) {
        text = text.slice(3);
      }
      if (text.endsWith('```')) {
        text = text.slice(0, -3);
      }
      text = text.trim();

      const parsed = JSON.parse(text);
      const validated = schema.parse(parsed);
      return ok(validated);
    } catch (parseError: unknown) {
      const errorObj = parseError instanceof Error ? parseError : new Error(String(parseError));
      logger.error('Groq JSON parse/validation error', { error: errorObj, text: result.value.text });
      return err({
        code: 'PARSE_ERROR',
        message: parseError instanceof Error ? parseError.message : 'Failed to parse JSON response',
        provider: this.name,
        retryable: false,
        name: 'GroqError',
      });
    }
  }
}
