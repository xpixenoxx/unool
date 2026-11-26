/**
 * route.surfaces.test.ts
 *
 * Verifies the new official Meta webhook surfaces & safeguards in /api/webhooks/instagram:
 * - is_echo (creator replies from Instagram phone app) -> pauses AI for humanTakeoverHours & records adaptive voice feedback
 * - Explicit "STOP" opt-out -> marks contact opted_out & suppresses AI reply
 * - DM image/screenshot attachment -> escalates to Human Triage instead of hallucinating
 * - Voice note attachment (when voiceNoteTranscriptionEnabled is true) -> transcribes via Whisper & replies
 * - Default-OFF workspaces preserve 100% existing behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const {
  mockVerifyMetaSignature,
  mockUpsertWorkspaceContact,
  mockGetContactAutomationStatus,
  mockRecordAiReplyFeedback,
  mockTranscribeVoiceNote,
  mockClassifyAndReplyDM,
  mockSendPrivateMessage,
  supabaseInserts,
  cfgState,
} = vi.hoisted(() => ({
  mockVerifyMetaSignature: vi.fn(),
  mockUpsertWorkspaceContact: vi.fn(),
  mockGetContactAutomationStatus: vi.fn(),
  mockRecordAiReplyFeedback: vi.fn(),
  mockTranscribeVoiceNote: vi.fn(),
  mockClassifyAndReplyDM: vi.fn(),
  mockSendPrivateMessage: vi.fn(),
  supabaseInserts: [] as Array<{ table: string; data: unknown }>,
  cfgState: {
    voiceNoteTranscriptionEnabled: false,
    adaptiveVoiceEnabled: true,
    humanTakeoverHours: 24,
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));

vi.mock('@/lib/config/schema', () => ({
  config: {
    INSTAGRAM_WEBHOOK_VERIFY_TOKEN: 'verify_tok',
    INSTAGRAM_WEBHOOK_SECRET: 'secret_tok',
    INSTAGRAM_CLIENT_SECRET: 'client_sec',
    META_WEBHOOK_SECRET: 'secret_tok',
    FACEBOOK_WEBHOOK_SECRET: 'secret_tok',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'srv_key',
    NODE_ENV: 'test',
    GROQ_API_KEY: 'groq_key',
  },
}));

vi.mock('@/lib/webhooks/verify', () => ({
  verifyMetaSignature: (...args: unknown[]) => mockVerifyMetaSignature(...args),
}));

vi.mock('@/lib/feature-flags-server', () => ({
  isAutomationEnabledServer: async () => true,
}));

vi.mock('@/lib/crypto/encryption', () => ({
  decryptToken: async () => 'decrypted_ig_token',
}));

vi.mock('@/lib/services/QueueService', () => ({
  queueService: {
    isAvailable: () => false,
    enqueueInstagramOutboundTask: async () => ({ queued: false }),
  },
}));

vi.mock('@/lib/services/automation/velocity', () => ({
  velocityThrottle: {
    canReply: async () => true,
    recordReply: async () => undefined,
  },
}));

vi.mock('@/lib/services/automation/lexical', () => ({
  lexicalEntropyGuard: {
    getRecentReplies: async () => [],
    isTooSimilar: () => false,
    recordReply: () => {},
  },
}));

vi.mock('@/lib/services/automation/jitter', () => ({
  humanizedSleep: async () => undefined,
}));

vi.mock('@/lib/services/automation/linkResolver', () => ({
  resolveCreatorDeliveryLink: async () => 'https://unool.co/link',
}));

vi.mock('@/lib/ai/ContentGuard', () => ({
  ContentGuard: {
    validateComment: () => ({
      safe: true,
      violation: { level: 'none', code: '', message: '', internal: '' },
    }),
  },
}));

vi.mock('@/lib/ai/engines/ContentHumanizer', () => ({
  ContentHumanizer: {
    humanize: (text: string) => ({ humanized: text }),
  },
}));

vi.mock('@/lib/services/automation/leadCapture', async () => {
  const actual = await vi.importActual<typeof import('@/lib/services/automation/leadCapture')>(
    '@/lib/services/automation/leadCapture'
  );
  return {
    ...actual,
    upsertWorkspaceContact: (...args: unknown[]) => mockUpsertWorkspaceContact(...args),
    getContactAutomationStatus: (...args: unknown[]) => mockGetContactAutomationStatus(...args),
  };
});

vi.mock('@/lib/services/automation/voiceContextLoader', () => ({
  loadAdaptiveAiContext: async () => ({
    voiceContextText: '',
    combinedPromptBlock: '',
    allowedFactsText: '',
    exemplarsUsed: 0,
  }),
  recordAiReplyFeedback: (...args: unknown[]) => mockRecordAiReplyFeedback(...args),
}));

vi.mock('@/lib/services/automation/voiceTranscriber', () => ({
  transcribeInstagramVoiceNote: (...args: unknown[]) => mockTranscribeVoiceNote(...args),
}));

vi.mock('@/lib/services/automation/campaignMatcher', async () => {
  const actual = await vi.importActual<typeof import('@/lib/services/automation/campaignMatcher')>(
    '@/lib/services/automation/campaignMatcher'
  );
  return {
    ...actual,
    loadActiveWorkspaceCampaigns: async () => [],
  };
});

vi.mock('@/lib/services/InstagramCommentAutomation', async () => {
  const actual = await vi.importActual<typeof import('@/lib/services/InstagramCommentAutomation')>(
    '@/lib/services/InstagramCommentAutomation'
  );
  return {
    ...actual,
    InstagramCommentAutomation: class {
      async classifyAndReplyDM(...args: unknown[]) {
        return mockClassifyAndReplyDM(...args);
      }
      async sendPrivateMessage(...args: unknown[]) {
        return mockSendPrivateMessage(...args);
      }
      async fetchMessagingUserProfile() {
        return null;
      }
      async sendSenderAction() {
        return true;
      }
      async resolveIgUsername() {
        return 'tester_user';
      }
      async processDmFollowGate() {
        return { action: 'not_required' };
      }
    },
  };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        neq: () => chain,
        gte: () => chain,
        in: () => chain,
        order: () => chain,
        limit: () => chain,
        single: () => chain.maybeSingle(),
        maybeSingle: async () => {
          if (table === 'platform_connections') {
            return {
              data: {
                id: 'conn_1',
                workspace_id: 'ws_1',
                platform: 'instagram',
                platform_user_id: 'ig_biz_999',
                username: 'creator_brand',
                access_token_encrypted: 'enc_tok',
                status: 'connected',
              },
              error: null,
            };
          }
          if (table === 'instagram_automation_config') {
            return {
              data: {
                workspace_id: 'ws_1',
                enabled: true,
                dm_auto_reply_enabled: true,
                dm_escalation_enabled: true,
                auto_reply_positive: true,
                auto_reply_questions: true,
                auto_reply_link_requests: true,
                auto_reply_purchase_intent: true,
                flag_negative: true,
                flag_spam: true,
                voice_note_transcription_enabled: cfgState.voiceNoteTranscriptionEnabled,
                adaptive_voice_enabled: cfgState.adaptiveVoiceEnabled,
                human_takeover_hours: cfgState.humanTakeoverHours,
              },
              error: null,
            };
          }
          return { data: null, error: null };
        },
        insert: async (data: unknown) => {
          supabaseInserts.push({ table, data });
          return { data: null, error: null };
        },
        upsert: async (data: unknown) => {
          supabaseInserts.push({ table, data });
          return { data: null, error: null };
        },
        update: () => chain,
        then: (resolve: (val: unknown) => void) => {
          if (table === 'platform_connections') {
            resolve({
              data: [
                {
                  id: 'conn_1',
                  workspace_id: 'ws_1',
                  platform: 'instagram',
                  platform_user_id: 'ig_biz_999',
                  username: 'creator_brand',
                  access_token_encrypted: 'enc_tok',
                  status: 'connected',
                },
              ],
              error: null,
            });
          } else if (table === 'instagram_automation_config') {
            resolve({
              data: [
                {
                  workspace_id: 'ws_1',
                  enabled: true,
                  dm_auto_reply_enabled: true,
                  dm_escalation_enabled: true,
                  auto_reply_positive: true,
                  auto_reply_questions: true,
                  auto_reply_link_requests: true,
                  auto_reply_purchase_intent: true,
                  flag_negative: true,
                  flag_spam: true,
                  voice_note_transcription_enabled: cfgState.voiceNoteTranscriptionEnabled,
                  adaptive_voice_enabled: cfgState.adaptiveVoiceEnabled,
                  human_takeover_hours: cfgState.humanTakeoverHours,
                },
              ],
              error: null,
            });
          } else {
            resolve({ data: [], error: null });
          }
        },
      };
      return chain;
    },
  }),
}));

import { POST } from '@/app/api/webhooks/instagram/route';

function buildWebhookRequest(payload: unknown): NextRequest {
  return new NextRequest('https://app.unool.co/api/webhooks/instagram', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hub-signature-256': 'sha256=valid',
    },
    body: JSON.stringify(payload),
  });
}

describe('Instagram Webhook New Surfaces & Safeguards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseInserts.length = 0;
    cfgState.voiceNoteTranscriptionEnabled = false;
    cfgState.adaptiveVoiceEnabled = true;
    cfgState.humanTakeoverHours = 24;
    mockVerifyMetaSignature.mockReturnValue(true);
    mockUpsertWorkspaceContact.mockResolvedValue(null);
    mockGetContactAutomationStatus.mockResolvedValue({
      optedOut: false,
      aiPaused: false,
      leadCaptureState: null,
    });
    mockRecordAiReplyFeedback.mockResolvedValue(undefined);
    mockSendPrivateMessage.mockResolvedValue({ messageId: 'mid_sent_1' });
    mockClassifyAndReplyDM.mockResolvedValue({
      classification: 'question',
      confidence: 0.92,
      suggestedReply: 'Hey! Yes, the workshop starts next Tuesday at 5pm IST.',
      leadScore: 2,
      shouldAutoReply: true,
      shouldEscalate: false,
      reasoning: 'Answered from knowledge base',
    });
  });

  it('pauses AI for 24h and learns creator voice on manual phone reply (is_echo)', async () => {
    const req = buildWebhookRequest({
      object: 'instagram',
      entry: [
        {
          id: 'ig_biz_999',
          time: Date.now(),
          messaging: [
            {
              sender: { id: 'ig_biz_999' },
              recipient: { id: 'fan_123' },
              timestamp: Date.now(),
              message: {
                mid: 'mid_echo_1',
                text: 'Haha yes bro, just sent the Notion link to your email!',
                is_echo: true,
              },
            },
          ],
        },
      ],
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockUpsertWorkspaceContact).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws_1',
        platform: 'instagram',
        platformUserId: 'fan_123',
        aiPausedUntil: expect.any(String),
      })
    );
    expect(mockRecordAiReplyFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws_1',
        action: 'phone_echo',
        creatorFinalReply: 'Haha yes bro, just sent the Notion link to your email!',
      })
    );
    expect(mockClassifyAndReplyDM).not.toHaveBeenCalled();
  });

  it('immediately honors STOP opt-out and suppresses automated DM reply', async () => {
    const req = buildWebhookRequest({
      object: 'instagram',
      entry: [
        {
          id: 'ig_biz_999',
          time: Date.now(),
          messaging: [
            {
              sender: { id: 'fan_stop_1' },
              recipient: { id: 'ig_biz_999' },
              timestamp: Date.now(),
              message: {
                mid: 'mid_stop_1',
                text: 'STOP',
              },
            },
          ],
        },
      ],
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockUpsertWorkspaceContact).toHaveBeenCalledWith(
      expect.objectContaining({
        platformUserId: 'fan_stop_1',
        optedOut: true,
      })
    );
    expect(mockClassifyAndReplyDM).not.toHaveBeenCalled();
    expect(mockSendPrivateMessage).not.toHaveBeenCalled();
  });

  it('escalates image/screenshot DM attachments directly to Human Triage without AI guessing', async () => {
    const req = buildWebhookRequest({
      object: 'instagram',
      entry: [
        {
          id: 'ig_biz_999',
          time: Date.now(),
          messaging: [
            {
              sender: { id: 'fan_img_1' },
              recipient: { id: 'ig_biz_999' },
              timestamp: Date.now(),
              message: {
                mid: 'mid_img_1',
                attachments: [{ type: 'image', payload: { url: 'https://cdn.instagram.com/receipt.jpg' } }],
              },
            },
          ],
        },
      ],
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(supabaseInserts.some((i) => i.table === 'instagram_flagged_dms')).toBe(true);
    expect(mockClassifyAndReplyDM).not.toHaveBeenCalled();
  });

  it('transcribes DM voice notes via Whisper when voiceNoteTranscriptionEnabled is enabled', async () => {
    cfgState.voiceNoteTranscriptionEnabled = true;
    mockTranscribeVoiceNote.mockResolvedValue({
      ok: true,
      transcript: 'Hey when does your workshop start next week?',
    });

    const req = buildWebhookRequest({
      object: 'instagram',
      entry: [
        {
          id: 'ig_biz_999',
          time: Date.now(),
          messaging: [
            {
              sender: { id: 'fan_audio_1' },
              recipient: { id: 'ig_biz_999' },
              timestamp: Date.now(),
              message: {
                mid: 'mid_audio_1',
                attachments: [{ type: 'audio', payload: { url: 'https://cdn.instagram.com/voice.mp4' } }],
              },
            },
          ],
        },
      ],
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockTranscribeVoiceNote).toHaveBeenCalledWith('https://cdn.instagram.com/voice.mp4', 'groq_key');
    expect(mockClassifyAndReplyDM).toHaveBeenCalled();
    expect(mockSendPrivateMessage).toHaveBeenCalled();
  });
});
