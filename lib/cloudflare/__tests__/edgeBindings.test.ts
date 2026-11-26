import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  __setCloudflareRuntimeForTests,
  resolveAiGatewayEndpoint,
  runEdgeWaitUntil,
} from '@/lib/cloudflare/edgeBindings';
import {
  appendDmToBurstBuffer,
  drainDmBurstBufferIfLatest,
} from '@/lib/services/automation/dmDebouncer';
import { transcribeInstagramVoiceNote } from '@/lib/services/automation/voiceTranscriber';

describe('Cloudflare Edge Bindings, AI Gateway, Edge KV Debouncer & Workers AI Whisper', () => {
  const originalGwUrl = process.env.CLOUDFLARE_AI_GATEWAY_URL;
  const originalGwToken = process.env.CLOUDFLARE_AI_GATEWAY_TOKEN;
  const originalFetch = global.fetch;

  beforeEach(() => {
    __setCloudflareRuntimeForTests(null);
    delete process.env.CLOUDFLARE_AI_GATEWAY_URL;
    delete process.env.CLOUDFLARE_AI_GATEWAY_TOKEN;
  });

  afterEach(() => {
    __setCloudflareRuntimeForTests(null);
    if (originalGwUrl === undefined) delete process.env.CLOUDFLARE_AI_GATEWAY_URL;
    else process.env.CLOUDFLARE_AI_GATEWAY_URL = originalGwUrl;
    if (originalGwToken === undefined) delete process.env.CLOUDFLARE_AI_GATEWAY_TOKEN;
    else process.env.CLOUDFLARE_AI_GATEWAY_TOKEN = originalGwToken;
    global.fetch = originalFetch;
  });

  it('routes through Cloudflare AI Gateway with auth + cache headers when configured, and falls back directly when unset', () => {
    const direct = resolveAiGatewayEndpoint('groq', 'https://api.groq.com/openai/v1');
    expect(direct.viaGateway).toBe(false);
    expect(direct.baseUrl).toBe('https://api.groq.com/openai/v1');
    expect(direct.extraHeaders).toEqual({});

    process.env.CLOUDFLARE_AI_GATEWAY_URL =
      'https://gateway.ai.cloudflare.com/v1/df0d56739b21ba2234a5eac43ea02c60/unool-ai-gateway';
    process.env.CLOUDFLARE_AI_GATEWAY_TOKEN = 'cf_aig_secret_token';

    const proxied = resolveAiGatewayEndpoint('groq', 'https://api.groq.com/openai/v1', {
      cacheTtlSeconds: 300,
    });
    expect(proxied.viaGateway).toBe(true);
    expect(proxied.baseUrl).toBe(
      'https://gateway.ai.cloudflare.com/v1/df0d56739b21ba2234a5eac43ea02c60/unool-ai-gateway/groq'
    );
    expect(proxied.extraHeaders['cf-aig-authorization']).toBe('Bearer cf_aig_secret_token');
    expect(proxied.extraHeaders['cf-aig-cache-ttl']).toBe('300');
  });

  it('coalesces rapid multi-bubble DM bursts natively via Cloudflare Edge KV when Upstash Redis is absent', async () => {
    const store = new Map<string, string>();
    __setCloudflareRuntimeForTests({
      env: {
        UNOOL_EDGE_KV: {
          async get<T = string>(key: string, type?: 'text' | 'json'): Promise<T | null> {
            const raw = store.get(key);
            if (!raw) return null;
            return (type === 'json' ? JSON.parse(raw) : raw) as T;
          },
          async put(key: string, value: string): Promise<void> {
            store.set(key, value);
          },
          async delete(key: string): Promise<void> {
            store.delete(key);
          },
        },
      },
    });

    const a1 = await appendDmToBurstBuffer('ws_1', 'fan_1', 'mid_1', 'Hey!');
    const a2 = await appendDmToBurstBuffer('ws_1', 'fan_1', 'mid_2', 'Saw your reel');
    const a3 = await appendDmToBurstBuffer('ws_1', 'fan_1', 'mid_3', 'How much is Pro?');
    expect(a1.buffered).toBe(true);
    expect(a2.buffered).toBe(true);
    expect(a3.buffered).toBe(true);

    // Earlier worker mid_1 must exit cleanly without replying
    const early = await drainDmBurstBufferIfLatest('ws_1', 'fan_1', 'mid_1', 'Hey!');
    expect(early.shouldProcess).toBe(false);

    // Latest worker mid_3 drains all 3 messages into one combined prompt
    const latest = await drainDmBurstBufferIfLatest('ws_1', 'fan_1', 'mid_3', 'How much is Pro?');
    expect(latest.shouldProcess).toBe(true);
    expect(latest.burstCount).toBe(3);
    expect(latest.mergedText).toBe('Hey!\nSaw your reel\nHow much is Pro?');
  });

  it('falls back to Cloudflare Workers AI Whisper (@cf/openai/whisper-large-v3-turbo) for Instagram voice notes', async () => {
    const mockAiRun = vi.fn().mockResolvedValue({ text: 'Hey can you send me the pricing link?' });
    __setCloudflareRuntimeForTests({
      env: {
        AI: { run: mockAiRun },
      },
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (name: string) => (name.toLowerCase() === 'content-type' ? 'audio/mp4' : '16'),
      },
      arrayBuffer: async () => new Uint8Array([1, 2, 3, 4, 5, 6]).buffer,
    }) as unknown as typeof fetch;

    const result = await transcribeInstagramVoiceNote('https://cdn.instagram.com/audio/note.m4a', '');
    expect(result.ok).toBe(true);
    expect(result.provider).toBe('cloudflare_workers_ai');
    expect(result.transcript).toBe('Hey can you send me the pricing link?');
    expect(mockAiRun).toHaveBeenCalledWith(
      '@cf/openai/whisper-large-v3-turbo',
      expect.objectContaining({ audio: expect.any(String) })
    );
  });

  it('delegates background telemetry to Cloudflare waitUntil when running on Workers', async () => {
    const waitUntilSpy = vi.fn();
    __setCloudflareRuntimeForTests({ waitUntil: waitUntilSpy });

    await runEdgeWaitUntil(Promise.resolve('done'));
    expect(waitUntilSpy).toHaveBeenCalledTimes(1);
  });
});
