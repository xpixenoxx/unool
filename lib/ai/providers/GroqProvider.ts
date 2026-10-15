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

  constructor(apiKey: string, defaultModel: string = 'qwen/qwen3.8-27b') {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  async generateText(
    prompt: string,
    options?: GenerationOptions & { responseFormatJson?: boolean }
  ): Promise<Result<AIResponse, AIError>> {
    const model = options?.model || this.defaultModel || 'qwen/qwen3.8-27b';
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

    // Retry up to 3 times for rate-limit (429) responses with exponential backoff
    const MAX_RETRIES = 3;
    let lastError: AIError | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
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
          const isRateLimit = response.status === 429;
          const isServerError = response.status >= 500;

          if (isRateLimit && attempt < MAX_RETRIES) {
            // Respect Retry-After header if present, otherwise use exponential backoff
            const retryAfterHeader = response.headers.get('retry-after');
            const retryAfterMs = retryAfterHeader
              ? parseFloat(retryAfterHeader) * 1000
              : Math.min(1000 * Math.pow(2, attempt), 30000); // 1s, 2s, 4s … max 30s
            logger.warn('Groq rate limit hit, retrying', {
              attempt: attempt + 1,
              retryAfterMs,
              model,
            });
            await new Promise(resolve => setTimeout(resolve, retryAfterMs));
            continue;
          }

          lastError = {
            code: 'API_ERROR',
            message: data.error?.message || `Groq API error (${response.status})`,
            provider: this.name,
            retryable: isRateLimit || isServerError,
            name: 'GroqError',
          };
          return err(lastError);
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
        logger.error('Groq provider error', { error: errorObj, attempt, prompt: prompt.slice(0, 100) });
        lastError = {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          provider: this.name,
          retryable: true,
          name: 'GroqError',
        };
        // Network errors: retry with backoff
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
          continue;
        }
        return err(lastError);
      }
    }

    return err(lastError ?? {
      code: 'UNKNOWN_ERROR',
      message: 'Groq provider: all retries exhausted',
      provider: this.name,
      retryable: false,
      name: 'GroqError',
    });
  }

  async generateObject<T extends z.ZodTypeAny>(
    prompt: string,
    schema: T,
    options?: GenerationOptions
  ): Promise<Result<z.infer<T>, AIError>> {
    const systemPrompt = options?.systemPrompt || 'You are an AI that outputs valid JSON only. Follow the required JSON schema keys strictly.';

    // Guide the model on expected schema if not explicitly defined in prompt
    const hasExplicitSchema =
      prompt.includes('"content"') ||
      prompt.includes('"classification"') ||
      prompt.includes('OUTPUT FORMAT') ||
      prompt.includes('valid JSON matching') ||
      prompt.includes('Return ONLY valid JSON');

    const enhancedPrompt = hasExplicitSchema
      ? prompt
      : `${prompt}\n\nYou MUST respond with valid JSON matching this schema: {"content": string, "characterCount": number, "hashtags": string[], "mediaSuggestions": string[], "firstCommentHint": string | null}`;

    const result = await this.generateText(enhancedPrompt, {
      ...options,
      systemPrompt,
      temperature: options?.temperature ?? 0.7,
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

      const parsed: any = JSON.parse(text);

      // Resilient normalization for common LLM field variations (for social post generation)
      if (parsed && typeof parsed === 'object' && ('post' in parsed || 'hashtags' in parsed || 'mediaSuggestions' in parsed)) {
        if (parsed.post && !parsed.content) parsed.content = parsed.post;
        if (parsed.text && !parsed.content) parsed.content = parsed.text;
        if (typeof parsed.characterCount !== 'number' && typeof parsed.content === 'string') {
          parsed.characterCount = parsed.content.length;
        }
        if (!Array.isArray(parsed.hashtags)) {
          parsed.hashtags = [];
        } else {
          parsed.hashtags = parsed.hashtags.map((h: any) => String(h).trim()).filter(Boolean);
        }
        if (!Array.isArray(parsed.mediaSuggestions)) {
          parsed.mediaSuggestions = [];
        } else {
          parsed.mediaSuggestions = parsed.mediaSuggestions.map((m: any) => String(m).trim()).filter(Boolean);
        }
      }

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
