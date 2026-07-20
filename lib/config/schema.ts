import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),
  SUPABASE_URL: z.string().url().optional().default('http://localhost:54321'),
  SUPABASE_ANON_KEY: z.string().optional().default('test-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default('test-service-key'),
  SUPABASE_PROJECT_ID: z.string().optional().default('local'),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AI_DEFAULT_MODEL: z.string().default('claude-3-5-haiku-20241022'),
  AI_OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  AI_MAX_TOKENS_PER_REQUEST: z.coerce.number().default(4000),
  AI_DAILY_TOKEN_BUDGET: z.coerce.number().default(50000),
  RATE_LIMIT_AI_PER_MIN: z.coerce.number().default(20),
  RATE_LIMIT_PUBLISH_PER_MIN: z.coerce.number().default(10),
  RATE_LIMIT_AUTH_PER_HOUR: z.coerce.number().default(5),
  // Upstash Redis (for rate limiting, OAuth state, etc.) - use REST API URL from .env.local
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  MAGIC_LINK_EXPIRY_MINUTES: z.coerce.number().default(15),

  // Encryption key for token encryption (32-byte base64, required in production)
  ENCRYPTION_KEY: z.string().optional(),
  ENCRYPTION_KEY_VERSION: z.coerce.number().default(1),

  // Dev auth bypass
  DEV_AUTH_BYPASS: z.coerce.boolean().optional().default(false),

  // Sentry
  SENTRY_DSN: z.string().url().optional(),

  // LinkedIn OAuth
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_REDIRECT_URI: z.string().url().optional(),

  // Meta (Threads/Facebook) OAuth
  META_CLIENT_ID: z.string().optional(),
  META_CLIENT_SECRET: z.string().optional(),
  META_REDIRECT_URI: z.string().url().optional(),

  // X (Twitter) OAuth
  X_CLIENT_ID: z.string().optional(),
  X_CLIENT_SECRET: z.string().optional(),
  X_REDIRECT_URI: z.string().url().optional(),

  // Webhook secrets
  LINKEDIN_WEBHOOK_SECRET: z.string().optional(),
  X_WEBHOOK_SECRET: z.string().optional(),
  META_WEBHOOK_SECRET: z.string().optional(),

  // Security hardening
  ENABLE_HSTS: z.coerce.boolean().default(true),
  CSP_REPORT_URI: z.string().url().optional(),
  ALLOWED_ORIGINS: z.string().optional().default(''),
});

export type Config = z.infer<typeof configSchema>;

export const config = configSchema.parse(process.env);

// Augment NodeJS.ProcessEnv for type safety
declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface ProcessEnv extends Config {}
}