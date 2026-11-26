import { config } from '@/lib/config/schema';

export interface EdgeKvNamespace {
  get<T = string>(key: string, type?: 'text' | 'json'): Promise<T | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface WorkersAiBinding {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
}

export interface CloudflareEdgeEnv {
  UNOOL_EDGE_KV?: EdgeKvNamespace;
  AI?: WorkersAiBinding;
  AVATARS_BUCKET?: unknown;
  POST_MEDIA_BUCKET?: unknown;
  CLOUDFLARE_AI_GATEWAY_URL?: string;
  CLOUDFLARE_AI_GATEWAY_TOKEN?: string;
  [key: string]: unknown;
}

interface CloudflareWorkersRuntimeModule {
  env?: CloudflareEdgeEnv;
  waitUntil?: (promise: Promise<unknown>) => void;
}

let cachedRuntime: CloudflareWorkersRuntimeModule | null | undefined;
let testOverrideRuntime: CloudflareWorkersRuntimeModule | null = null;

/**
 * Allows unit tests to inject mock Cloudflare Workers bindings cleanly.
 */
export function __setCloudflareRuntimeForTests(
  mockRuntime: CloudflareWorkersRuntimeModule | null
): void {
  testOverrideRuntime = mockRuntime;
}

/**
 * Runtime-safe loader for `cloudflare:workers`.
 * Works natively on Cloudflare Workers (`vinext` / `workerd`) while degrading
 * cleanly to `null` under Node.js, `next build`, and Vitest without bundler errors.
 */
async function loadCloudflareWorkersModule(): Promise<CloudflareWorkersRuntimeModule | null> {
  if (testOverrideRuntime !== null) return testOverrideRuntime;
  if (cachedRuntime !== undefined) return cachedRuntime;

  try {
    const specifier = ['cloudflare', 'workers'].join(':');
    const mod = (await import(/* webpackIgnore: true */ /* @vite-ignore */ specifier)) as CloudflareWorkersRuntimeModule;
    cachedRuntime = mod && typeof mod === 'object' ? mod : null;
  } catch {
    cachedRuntime = null;
  }
  return cachedRuntime;
}

export async function getCloudflareEnv(): Promise<CloudflareEdgeEnv | null> {
  const mod = await loadCloudflareWorkersModule();
  return mod?.env ?? null;
}

export async function getEdgeKv(): Promise<EdgeKvNamespace | null> {
  const env = await getCloudflareEnv();
  const kv = env?.UNOOL_EDGE_KV;
  if (kv && typeof kv.get === 'function' && typeof kv.put === 'function') {
    return kv;
  }
  return null;
}

export async function getWorkersAi(): Promise<WorkersAiBinding | null> {
  const env = await getCloudflareEnv();
  const ai = env?.AI;
  if (ai && typeof ai.run === 'function') {
    return ai;
  }
  return null;
}

/**
 * Runs background telemetry via Cloudflare Workers `waitUntil` when available
 * so edge redirects (`/go/[code]`) return in <5ms; falls back to awaiting cleanly on Node.js.
 */
export async function runEdgeWaitUntil(task: Promise<unknown>): Promise<void> {
  const mod = await loadCloudflareWorkersModule();
  if (mod && typeof mod.waitUntil === 'function') {
    mod.waitUntil(task.catch(() => {}));
    return;
  }
  await task.catch(() => {});
}

export interface AiGatewayResolution {
  baseUrl: string;
  extraHeaders: Record<string, string>;
  viaGateway: boolean;
}

/**
 * Resolves the AI provider base URL through Cloudflare AI Gateway (`unool-ai-gateway`)
 * whenever `CLOUDFLARE_AI_GATEWAY_URL` is configured.
 *
 * Supported formats for `CLOUDFLARE_AI_GATEWAY_URL`:
 * - Gateway root: `https://gateway.ai.cloudflare.com/v1/{account_id}/unool-ai-gateway`
 *   -> automatically appends `/{provider}` (`groq` or `openai`).
 * - Full provider endpoint: `https://gateway.ai.cloudflare.com/v1/{account_id}/unool-ai-gateway/groq`
 *   -> used directly as-is.
 *
 * When unconfigured (or when an authenticated gateway has no token), falls back cleanly
 * to `directBaseUrl` so existing deployments never break.
 */
export function resolveAiGatewayEndpoint(
  provider: 'groq' | 'openai',
  directBaseUrl: string,
  options?: { cacheTtlSeconds?: number; skipCache?: boolean }
): AiGatewayResolution {
  const rawGateway = (
    config.CLOUDFLARE_AI_GATEWAY_URL ||
    process.env.CLOUDFLARE_AI_GATEWAY_URL ||
    ''
  )
    .trim()
    .replace(/\/+$/, '');

  if (!rawGateway || !/^https:\/\/gateway\.ai\.cloudflare\.com\/v1\//i.test(rawGateway)) {
    return { baseUrl: directBaseUrl, extraHeaders: {}, viaGateway: false };
  }

  const gwToken = (
    config.CLOUDFLARE_AI_GATEWAY_TOKEN ||
    process.env.CLOUDFLARE_AI_GATEWAY_TOKEN ||
    ''
  ).trim();

  const alreadyHasProvider =
    rawGateway.endsWith('/groq') ||
    rawGateway.endsWith('/openai') ||
    rawGateway.endsWith('/compat');

  const baseUrl = alreadyHasProvider ? rawGateway : `${rawGateway}/${provider}`;
  const extraHeaders: Record<string, string> = {};

  if (gwToken) {
    extraHeaders['cf-aig-authorization'] = `Bearer ${gwToken}`;
  }
  if (options?.skipCache) {
    extraHeaders['cf-aig-skip-cache'] = 'true';
  } else if (typeof options?.cacheTtlSeconds === 'number' && options.cacheTtlSeconds > 0) {
    extraHeaders['cf-aig-cache-ttl'] = String(Math.round(options.cacheTtlSeconds));
  }

  return { baseUrl, extraHeaders, viaGateway: true };
}
