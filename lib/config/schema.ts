import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),
  SUPABASE_URL: z.string().url().optional().default('http://localhost:54321'),
  SUPABASE_ANON_KEY: z.string().optional().default('test-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default('test-service-key'),
  SUPABASE_PROJECT_ID: z.string().optional().default('local'),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AI_DEFAULT_MODEL: z.string().default('claude-3-5-haiku-20241022'),
  AI_MAX_TOKENS_PER_REQUEST: z.coerce.number().default(4000),
  AI_DAILY_TOKEN_BUDGET: z.coerce.number().default(50000),
  RATE_LIMIT_AI_PER_MIN: z.coerce.number().default(20),
  RATE_LIMIT_PUBLISH_PER_MIN: z.coerce.number().default(10),
  RATE_LIMIT_AUTH_PER_HOUR: z.coerce.number().default(5),
  UPSTASH_QSTASH_URL: z.string().url().optional().default('http://localhost:8080'),
  UPSTASH_QSTASH_TOKEN: z.string().optional().default('test-token'),
  UPSTASH_REDIS_URL: z.string().url().optional().default('http://localhost:6379'),
  UPSTASH_REDIS_TOKEN: z.string().optional().default('test-token'),
  MAGIC_LINK_EXPIRY_MINUTES: z.coerce.number().default(15),
});

export type Config = z.infer<typeof configSchema>;

export const config = configSchema.parse(process.env);

// Augment NodeJS.ProcessEnv for type safety
declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ProcessEnv extends Config {}
}