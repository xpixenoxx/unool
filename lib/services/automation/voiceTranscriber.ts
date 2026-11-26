import { config } from '@/lib/config/schema';
import { logger } from '@/lib/logger';
import { getWorkersAi, resolveAiGatewayEndpoint } from '@/lib/cloudflare/edgeBindings';

export interface VoiceTranscriptionResult {
  ok: boolean;
  transcript: string;
  provider?: 'groq_whisper' | 'cloudflare_workers_ai';
  error?: string;
}

const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10 MB safety cap

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/**
 * Downloads an Instagram DM audio attachment (Voice Note) from Meta's CDN URL
 * and transcribes it using:
 * 1. Groq Whisper (`whisper-large-v3-turbo`), routed via Cloudflare AI Gateway when configured.
 * 2. Automatic Cloudflare Workers AI (`@cf/openai/whisper-large-v3-turbo`) edge GPU fallback
 *    whenever `env.AI` is bound and Groq is unavailable or rate-limited.
 */
export async function transcribeInstagramVoiceNote(
  audioUrl: string,
  groqApiKeyOverride?: string
): Promise<VoiceTranscriptionResult> {
  const apiKey = groqApiKeyOverride || config.GROQ_API_KEY || process.env.GROQ_API_KEY;
  const workersAi = await getWorkersAi();

  if (!apiKey && !workersAi) {
    return { ok: false, transcript: '', error: 'GROQ_API_KEY and Cloudflare Workers AI not configured' };
  }
  if (!audioUrl || !/^https:\/\//i.test(audioUrl)) {
    return { ok: false, transcript: '', error: 'Invalid audio attachment URL' };
  }

  try {
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) {
      return { ok: false, transcript: '', error: `Audio fetch failed (${audioRes.status})` };
    }

    const contentLength = Number(audioRes.headers.get('content-length') || '0');
    if (contentLength > MAX_AUDIO_BYTES) {
      return { ok: false, transcript: '', error: 'Audio exceeds 10MB safety limit' };
    }

    const audioBuffer = await audioRes.arrayBuffer();
    if (audioBuffer.byteLength === 0 || audioBuffer.byteLength > MAX_AUDIO_BYTES) {
      return { ok: false, transcript: '', error: 'Audio payload empty or too large' };
    }

    const contentType = audioRes.headers.get('content-type') || 'audio/mp4';
    const ext = contentType.includes('ogg')
      ? 'ogg'
      : contentType.includes('mpeg')
        ? 'mp3'
        : contentType.includes('wav')
          ? 'wav'
          : 'm4a';

    // 1. Primary: Groq Whisper (optionally via Cloudflare AI Gateway)
    if (apiKey) {
      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer], { type: contentType }), `voice-note.${ext}`);
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('response_format', 'json');

      const gw = resolveAiGatewayEndpoint('groq', 'https://api.groq.com/openai/v1', {
        skipCache: true,
      });

      const whisperRes = await fetch(`${gw.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...gw.extraHeaders,
        },
        body: formData,
      });

      if (whisperRes.ok) {
        const json = (await whisperRes.json()) as { text?: string };
        const transcript = (json?.text || '').trim();
        if (transcript) {
          return { ok: true, transcript, provider: 'groq_whisper' };
        }
      } else {
        const errText = await whisperRes.text();
        logger.warn('Groq Whisper voice note transcription failed — checking Cloudflare Workers AI fallback', {
          status: whisperRes.status,
          error: errText.slice(0, 200),
        });
      }
    }

    // 2. Fallback: Cloudflare Workers AI edge GPU Whisper (`@cf/openai/whisper-large-v3-turbo`)
    if (workersAi) {
      try {
        const cfResult = (await workersAi.run('@cf/openai/whisper-large-v3-turbo', {
          audio: arrayBufferToBase64(audioBuffer),
        })) as { text?: string } | null;
        const transcript = (cfResult?.text || '').trim();
        if (transcript) {
          return { ok: true, transcript, provider: 'cloudflare_workers_ai' };
        }
      } catch (cfErr) {
        logger.warn('Cloudflare Workers AI Whisper fallback failed', {
          error: cfErr instanceof Error ? cfErr.message : String(cfErr),
        });
      }
    }

    return { ok: false, transcript: '', error: 'Empty transcript returned from all Whisper providers' };
  } catch (err) {
    logger.warn('transcribeInstagramVoiceNote exception', {
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      ok: false,
      transcript: '',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
