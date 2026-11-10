/**
 * route.inbound.test.ts
 *
 * Tests for inbound DM handling, idempotency, and dashboard state fixes.
 * Covers Phase 3 (DM data loss) and Phase 5 (state synchronization).
 *
 * No real Meta API calls are made.
 *
 * NOTE: vi.mock factories are hoisted above all variable declarations by Vitest.
 * All variables shared with mock factories are declared with vi.hoisted().
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ─── Hoisted shared state (accessible inside vi.mock factories) ───────────────

const {
  mockClassifyAndReplyDM,
  mockClassifyAndGenerateReply,
  mockSendPrivateMessage,
  mockSendDmForComment,
  mockPostPublicReply,
  mockVerifyMetaSignature,
  mockProcessDmFollowGate,
  supabaseCalls,
  controlState,
} = vi.hoisted(() => {
  const mockClassifyAndReplyDM = vi.fn();
  const mockClassifyAndGenerateReply = vi.fn();
  const mockSendPrivateMessage = vi.fn();
  const mockSendDmForComment = vi.fn();
  const mockPostPublicReply = vi.fn();
  const mockVerifyMetaSignature = vi.fn();
  const mockProcessDmFollowGate = vi.fn();
  const supabaseCalls: Array<{ table: string; op: string; data?: unknown }> = [];

  // Control state for conditional mock responses
  const controlState = {
    dmAutoReplyEnabled: true,
    requireFollowForDm: false,
    configuredLinkUrl: 'https://unool.co/link' as string | null,
    profiles: [] as unknown[],
    brandPages: [] as unknown[],
    existingDmLogs: [] as unknown[],
    dmHistoryLogs: [] as unknown[],
    existingCommentLogs: [] as unknown[],
    commenterHourlyCount: 0,
  };

  return {
    mockClassifyAndReplyDM,
    mockClassifyAndGenerateReply,
    mockSendPrivateMessage,
    mockSendDmForComment,
    mockPostPublicReply,
    mockVerifyMetaSignature,
    mockProcessDmFollowGate,
    supabaseCalls,
    controlState,
  };
});

// ─── Static mock data ─────────────────────────────────────────────────────────

const MOCK_CONNECTION = {
  id: 'conn_001',
  workspace_id: 'ws_001',
  platform: 'instagram',
  platform_user_id: 'ig_account_111',
  username: 'testbrand',
  access_token_encrypted: 'encrypted_token',
  status: 'connected',
  expires_at: null,
};

// ─── Mock registrations ───────────────────────────────────────────────────────

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/config/schema', () => ({
  config: {
    INSTAGRAM_WEBHOOK_VERIFY_TOKEN: 'test_verify_token_123',
    INSTAGRAM_WEBHOOK_SECRET: 'test_secret_456',
    INSTAGRAM_CLIENT_SECRET: 'test_client_secret',
    META_WEBHOOK_SECRET: 'test_secret_456',
    FACEBOOK_WEBHOOK_SECRET: 'test_secret_456',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test_service_key',
    NODE_ENV: 'test',
    GROQ_API_KEY: 'test_groq_key',
  },
}));

vi.mock('@/lib/webhooks/verify', () => ({
  verifyMetaSignature: (...args: unknown[]) => mockVerifyMetaSignature(...args),
}));

vi.mock('@/lib/feature-flags-server', () => ({
  isAutomationEnabledServer: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/services/automation/jitter', () => ({
  humanizedSleep: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/services/automation/velocity', () => ({
  velocityThrottle: {
    canReply: vi.fn().mockResolvedValue(true),
    recordReply: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/services/automation/lexical', () => ({
  lexicalEntropyGuard: {
    getRecentReplies: vi.fn().mockResolvedValue([]),
    isTooSimilar: vi.fn().mockReturnValue(false),
    recordReply: vi.fn(),
  },
}));

vi.mock('@/lib/ai/ContentGuard', () => ({
  ContentGuard: {
    validateComment: vi.fn().mockReturnValue({
      safe: true,
      violation: { level: 'none', code: '', message: '', internal: '' },
    }),
  },
}));

vi.mock('@/lib/ai/engines/ContentHumanizer', () => ({
  ContentHumanizer: {
    humanize: vi.fn().mockImplementation((text: string) => ({ humanized: text })),
  },
}));

vi.mock('@/lib/follow-gate/service', () => ({
  handleFollowWebhookEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/crypto/encryption', () => ({
  decryptToken: vi.fn().mockResolvedValue('IGqxTEST_ACCESS_TOKEN'),
  encryptToken: vi.fn().mockResolvedValue('encrypted_token'),
}));

vi.mock('@/lib/services/InstagramCommentAutomation', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/services/InstagramCommentAutomation')>();
  return {
    ...actual,
    InstagramCommentAutomation: class {
      async classifyAndReplyDM(...args: unknown[]) { return mockClassifyAndReplyDM(...args); }
      async classifyAndGenerateReply(...args: unknown[]) {
        if (mockClassifyAndGenerateReply.getMockImplementation()) {
          return mockClassifyAndGenerateReply(...args);
        }
        return {
          classification: 'unrelated', confidence: 0, suggestedReply: '', suggestedDM: null,
          threadHook: null, leadScore: 0, shouldAutoReply: false, shouldSendDM: false,
          shouldFlagForReview: false, reasoning: 'mock',
        };
      }
      async sendPrivateMessage(...args: unknown[]) { return mockSendPrivateMessage(...args); }
      async sendDmForComment(...args: unknown[]) { return mockSendDmForComment(...args); }
      async postPublicReply(...args: unknown[]) { return mockPostPublicReply(...args); }
      async processDmFollowGate(...args: unknown[]) { return mockProcessDmFollowGate(...args); }
      async checkUserFollowsBusiness() { return true; }
      async sendQuickReplyMessage() { return { messageId: 'qr_mock_id' }; }
    },
  };
});

/**
 * Supabase chain mock — builds a thenable proxy chain so awaiting any point in the
 * chain resolves to { data, error } correctly.
 *
 * This matches the real Supabase PostgREST builder pattern where every chainable
 * method returns a "builder" that is itself awaitable as a promise.
 */
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      function buildChain(resolvedValue: { data: unknown; error: null }): any {
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          gte: () => chain,
          limit: () => chain,
          order: () => chain,
          update: () => chain,
          insert: (data: unknown) => {
            supabaseCalls.push({ table, op: 'insert', data });
            return Promise.resolve({ error: null });
          },
          upsert: (data: unknown) => {
            supabaseCalls.push({ table, op: 'upsert', data });
            return Promise.resolve({ error: null });
          },
          single: () => Promise.resolve(resolvedValue),
          // Make the chain itself thenable so `await chain` works
          then: (resolve: (v: unknown) => void, reject: (e: unknown) => void) => {
            Promise.resolve(resolvedValue).then(resolve, reject);
          },
        };
        return chain;
      }

      if (table === 'platform_connections') {
        const conn = MOCK_CONNECTION;
        const chain = buildChain({ data: [conn], error: null });
        chain.single = () => Promise.resolve({ data: conn, error: null });
        return chain;
      }

      if (table === 'instagram_automation_config') {
        return buildChain({
          data: {
            enabled: true,
            auto_reply_positive: true,
            auto_reply_questions: true,
            auto_reply_link_requests: true,
            auto_reply_purchase_intent: true,
            flag_negative: true,
            flag_spam: true,
            link_url: controlState.configuredLinkUrl,
            max_replies_per_hour: 30,
            jitter_min_seconds: 1,
            jitter_max_seconds: 2,
            thread_chaining_enabled: true,
            dm_auto_reply_enabled: controlState.dmAutoReplyEnabled,
            dm_escalation_enabled: true,
            dm_max_replies_per_hour: 20,
            require_follow_for_dm: controlState.requireFollowForDm,
          },
          error: null,
        });
      }

      if (table === 'instagram_dm_logs') {
        let requestedLimit = 1;
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          gte: () => chain,
          order: () => chain,
          update: (data: unknown) => {
            supabaseCalls.push({ table, op: 'update', data });
            return chain;
          },
          insert: (data: unknown) => {
            supabaseCalls.push({ table, op: 'insert', data });
            return Promise.resolve({ error: null });
          },
          upsert: (data: unknown) => {
            supabaseCalls.push({ table, op: 'upsert', data });
            return Promise.resolve({ error: null });
          },
          limit: (n?: number) => {
            if (typeof n === 'number') requestedLimit = n;
            return chain;
          },
          single: () => Promise.resolve({ data: null, error: null }),
          then: (resolve: (val: any) => any, reject?: (reason: any) => any) => {
            const data = requestedLimit >= 10 ? controlState.dmHistoryLogs : controlState.existingDmLogs;
            return Promise.resolve({ data, error: null }).then(resolve as any, reject as any);
          },
        };
        return chain;
      }

      if (table === 'instagram_comment_logs') {
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          gte: () => Promise.resolve({ data: controlState.existingCommentLogs, count: controlState.commenterHourlyCount, error: null }),
          order: () => chain,
          update: () => chain,
          insert: (data: unknown) => {
            supabaseCalls.push({ table, op: 'insert', data });
            return Promise.resolve({ error: null });
          },
          upsert: (data: unknown) => {
            supabaseCalls.push({ table, op: 'upsert', data });
            return Promise.resolve({ error: null });
          },
          limit: () => Promise.resolve({ data: controlState.existingCommentLogs, error: null }),
          single: () => Promise.resolve({ data: null, error: null }),
          then: (resolve: (val: any) => any, reject?: (reason: any) => any) => {
            Promise.resolve({ data: controlState.existingCommentLogs, count: controlState.commenterHourlyCount, error: null }).then(resolve as any, reject as any);
          },
        };
        return chain;
      }

      if (table === 'instagram_flagged_dms' || table === 'instagram_flagged_comments') {
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          update: () => chain,
          insert: (data: unknown) => {
            supabaseCalls.push({ table, op: 'insert', data });
            return Promise.resolve({ error: null });
          },
          upsert: (data: unknown) => {
            supabaseCalls.push({ table, op: 'upsert', data });
            return Promise.resolve({ error: null });
          },
          single: () => Promise.resolve({ data: null, error: null }),
          then: (resolve: (val: any) => any, reject?: (reason: any) => any) => {
            Promise.resolve({ data: null, error: null }).then(resolve as any, reject as any);
          },
        };
        return chain;
      }

      if (table === 'profiles') {
        return buildChain({ data: controlState.profiles, error: null });
      }

      if (table === 'brand_materials_pages') {
        return buildChain({ data: controlState.brandPages, error: null });
      }

      return buildChain({ data: null, error: null });
    },
  }),
}));

// ─── Import route after all mocks are registered ─────────────────────────────

import { POST } from '../route';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeSignedRequest(payload: object): NextRequest {
  return new NextRequest('https://unool.com/api/webhooks/instagram', {
    method: 'POST',
    headers: {
      'x-hub-signature-256': 'sha256=valid_hash',
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

function makeDmPayload(
  messageId = 'msg_unique_001',
  text = 'Hello there!',
  senderId = 'user_sender_001',
) {
  return {
    object: 'instagram',
    entry: [
      {
        id: 'ig_account_111',
        messaging: [
          {
            sender: { id: senderId },
            recipient: { id: 'ig_account_111' },
            timestamp: Date.now(),
            mid: messageId,
            message: { mid: messageId, text },
          },
        ],
      },
    ],
  };
}

function makeCommentPayload(commentId = 'comment_001', username = 'test_user', fromId = 'user_567') {
  return {
    object: 'instagram',
    entry: [
      {
        id: 'ig_account_111',
        changes: [
          {
            field: 'comments',
            value: {
              id: commentId,
              text: 'What is the price?',
              from: { id: fromId, username },
              media: { id: 'media_888' },
            },
          },
        ],
      },
    ],
  };
}

// ─── Inbound DM Processing Tests ──────────────────────────────────────────────

describe('Inbound DM processing', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    supabaseCalls.length = 0;
    controlState.dmAutoReplyEnabled = true;
    controlState.requireFollowForDm = false;
    controlState.configuredLinkUrl = 'https://unool.co/link';
    controlState.profiles = [];
    controlState.brandPages = [];
    controlState.existingDmLogs = [];
    controlState.existingCommentLogs = [];
    mockVerifyMetaSignature.mockResolvedValue(true);
    mockClassifyAndReplyDM.mockResolvedValue({
      classification: 'question',
      confidence: 0.9,
      suggestedReply: 'Great question! Here is what UNOOL does...',
      leadScore: 1,
      shouldAutoReply: true,
      shouldEscalate: false,
      reasoning: 'Product question',
    });
    mockSendPrivateMessage.mockResolvedValue({ messageId: 'sent_msg_001' });

    // Restore mocks reset by vi.resetAllMocks() in vitest.setup.ts afterEach
    const { isAutomationEnabledServer } = await import('@/lib/feature-flags-server');
    vi.mocked(isAutomationEnabledServer).mockResolvedValue(true);

    const { velocityThrottle } = await import('@/lib/services/automation/velocity');
    vi.mocked(velocityThrottle.canReply).mockResolvedValue(true);
    vi.mocked(velocityThrottle.recordReply).mockResolvedValue(undefined);

    const { humanizedSleep } = await import('@/lib/services/automation/jitter');
    vi.mocked(humanizedSleep).mockResolvedValue(undefined);

    const { ContentGuard } = await import('@/lib/ai/ContentGuard');
    vi.mocked(ContentGuard.validateComment).mockReturnValue({
      safe: true,
      violation: { level: 'none', code: '', message: '', internal: '' },
    } as any);

    const { ContentHumanizer } = await import('@/lib/ai/engines/ContentHumanizer');
    vi.mocked(ContentHumanizer.humanize).mockImplementation((text: string) => ({ humanized: text }) as any);

    const { lexicalEntropyGuard } = await import('@/lib/services/automation/lexical');
    vi.mocked(lexicalEntropyGuard.getRecentReplies).mockResolvedValue([]);
    vi.mocked(lexicalEntropyGuard.isTooSimilar).mockReturnValue(false);

    // decryptToken is reset by vi.resetAllMocks() in vitest.setup.ts afterEach — restore it
    const { decryptToken } = await import('@/lib/crypto/encryption');
    vi.mocked(decryptToken).mockResolvedValue('IGqxTEST_ACCESS_TOKEN');
  });

  it('records DM in instagram_dm_logs even when dmAutoReplyEnabled=false', async () => {
    controlState.dmAutoReplyEnabled = false;

    const response = await POST(makeSignedRequest(makeDmPayload('msg_disabled_001')));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.received).toBe(true);

    // Auto-reply must NOT have been attempted
    expect(mockSendPrivateMessage).not.toHaveBeenCalled();
    expect(mockClassifyAndReplyDM).not.toHaveBeenCalled();

    // DM must have been persisted for human review (upsert into dm_logs)
    const dmOps = supabaseCalls.filter(c => c.table === 'instagram_dm_logs');
    expect(dmOps.length).toBeGreaterThan(0);
  });

  it('does not send auto-reply when dmAutoReplyEnabled=false', async () => {
    controlState.dmAutoReplyEnabled = false;

    await POST(makeSignedRequest(makeDmPayload('msg_no_reply_001')));

    expect(mockSendPrivateMessage).not.toHaveBeenCalled();
  });

  it('sends auto-reply and updates auto_replied only after confirmed send', async () => {
    controlState.dmAutoReplyEnabled = true;

    await POST(makeSignedRequest(makeDmPayload('msg_reply_001')));

    // AI classification and send must have been called
    expect(mockClassifyAndReplyDM).toHaveBeenCalled();
    expect(mockSendPrivateMessage).toHaveBeenCalled();

    // The DM log upsert must have been recorded before the send
    const dmOps = supabaseCalls.filter(c => c.table === 'instagram_dm_logs');
    expect(dmOps.length).toBeGreaterThan(0);
  });

  it('does NOT set auto_replied=true when send fails', async () => {
    controlState.dmAutoReplyEnabled = true;
    mockSendPrivateMessage.mockResolvedValue(null); // Simulate send failure

    await POST(makeSignedRequest(makeDmPayload('msg_fail_001')));

    expect(mockSendPrivateMessage).toHaveBeenCalled();

    // No db call should have explicitly set auto_replied=true
    const autoRepliedTrue = supabaseCalls.some(c => {
      if (c.table !== 'instagram_dm_logs') return false;
      const data = c.data as Record<string, unknown> | undefined;
      return data?.auto_replied === true;
    });
    expect(autoRepliedTrue).toBe(false);
  });

  it('prevents duplicate processing on duplicate webhook delivery (idempotency)', async () => {
    // Second delivery: message_id already exists in dm_logs
    controlState.existingDmLogs = [{ id: 'existing_row', auto_replied: false }];
    controlState.dmAutoReplyEnabled = true;

    await POST(makeSignedRequest(makeDmPayload('msg_duplicate_001')));

    // Because the message_id already exists, the event must be skipped entirely
    expect(mockSendPrivateMessage).not.toHaveBeenCalled();
    expect(mockClassifyAndReplyDM).not.toHaveBeenCalled();
  });

  it('returns 200 to Meta for valid DM payloads', async () => {
    controlState.dmAutoReplyEnabled = true;

    const response = await POST(makeSignedRequest(makeDmPayload('msg_200_test_001')));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.received).toBe(true);
  });

  it('skips echo messages (outbound DMs sent by the brand itself)', async () => {
    const echoPayload = {
      object: 'instagram',
      entry: [
        {
          id: 'ig_account_111',
          messaging: [
            {
              sender: { id: 'ig_account_111' }, // Sender === account owner → echo
              recipient: { id: 'other_user' },
              mid: 'echo_msg_001',
              message: { mid: 'echo_msg_001', text: 'Our outbound message' },
            },
          ],
        },
      ],
    };

    await POST(makeSignedRequest(echoPayload));

    expect(mockSendPrivateMessage).not.toHaveBeenCalled();
    expect(mockClassifyAndReplyDM).not.toHaveBeenCalled();
  });

  it('uses upsert (not bare insert) for instagram_dm_logs to prevent duplicate rows', async () => {
    controlState.dmAutoReplyEnabled = false;

    await POST(makeSignedRequest(makeDmPayload('msg_upsert_001')));

    const dmInserts = supabaseCalls.filter(
      c => c.table === 'instagram_dm_logs' && c.op === 'insert',
    );
    const dmUpserts = supabaseCalls.filter(
      c => c.table === 'instagram_dm_logs' && c.op === 'upsert',
    );

    // Must use upsert for idempotency — raw INSERT would create duplicate rows
    expect(dmUpserts.length).toBeGreaterThan(0);
    expect(dmInserts.length).toBe(0);
  });
});

// ─── Comment deduplication for retry ─────────────────────────────────────────

describe('Comment deduplication — retry on failure', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    supabaseCalls.length = 0;
    controlState.dmAutoReplyEnabled = true;
    controlState.requireFollowForDm = false;
    controlState.configuredLinkUrl = 'https://unool.co/link';
    controlState.profiles = [];
    controlState.brandPages = [];
    controlState.existingDmLogs = [];
    controlState.existingCommentLogs = [];
    mockVerifyMetaSignature.mockResolvedValue(true);

    const { isAutomationEnabledServer } = await import('@/lib/feature-flags-server');
    vi.mocked(isAutomationEnabledServer).mockResolvedValue(true);
    const { velocityThrottle } = await import('@/lib/services/automation/velocity');
    vi.mocked(velocityThrottle.canReply).mockResolvedValue(true);
    const { ContentGuard } = await import('@/lib/ai/ContentGuard');
    vi.mocked(ContentGuard.validateComment).mockReturnValue({
      safe: true,
      violation: { level: 'none', code: '', message: '', internal: '' },
    } as any);
    const { lexicalEntropyGuard } = await import('@/lib/services/automation/lexical');
    vi.mocked(lexicalEntropyGuard.getRecentReplies).mockResolvedValue([]);
    vi.mocked(lexicalEntropyGuard.isTooSimilar).mockReturnValue(false);
    // decryptToken is reset by vi.resetAllMocks() in vitest.setup.ts afterEach — restore it
    const { decryptToken } = await import('@/lib/crypto/encryption');
    vi.mocked(decryptToken).mockResolvedValue('IGqxTEST_ACCESS_TOKEN');
  });

  it('allows retry of a comment that previously failed (auto_replied=false)', async () => {
    // A previous webhook delivery logged the comment but the reply failed.
    // The deduplication guard must allow re-processing when auto_replied=false.
    controlState.existingCommentLogs = [{ id: 'existing_log', auto_replied: false }];

    const response = await POST(makeSignedRequest(makeCommentPayload('comment_retry_001')));

    expect(response.status).toBe(200);

    // Verify the logger.debug "already-replied" skip was NOT called
    const { logger } = await import('@/lib/logger');
    const debugCalls = (logger.debug as ReturnType<typeof vi.fn>).mock.calls;
    const skippedForSuccess = debugCalls.some(
      (args: unknown[]) => typeof args[0] === 'string' && args[0].includes('already-replied'),
    );
    expect(skippedForSuccess).toBe(false);
  });

  it('skips a comment that was already successfully replied (auto_replied=true)', async () => {
    // A comment that has been successfully replied must not be replied to again.
    controlState.existingCommentLogs = [{ id: 'existing_log', auto_replied: true }];

    await POST(makeSignedRequest(makeCommentPayload('comment_replied_001')));

    // Verify the logger.debug "already-replied" skip WAS called
    const { logger } = await import('@/lib/logger');
    const debugCalls = (logger.debug as ReturnType<typeof vi.fn>).mock.calls;
    const skippedForSuccess = debugCalls.some(
      (args: unknown[]) => typeof args[0] === 'string' && args[0].includes('already-replied'),
    );
    expect(skippedForSuccess).toBe(true);
  });
});

// ─── Flagged DMs for human inbox ─────────────────────────────────────────────

describe('Flagged DMs for human inbox', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    supabaseCalls.length = 0;
    controlState.existingDmLogs = [];
    mockVerifyMetaSignature.mockResolvedValue(true);

    const { isAutomationEnabledServer } = await import('@/lib/feature-flags-server');
    vi.mocked(isAutomationEnabledServer).mockResolvedValue(true);
    const { velocityThrottle } = await import('@/lib/services/automation/velocity');
    vi.mocked(velocityThrottle.canReply).mockResolvedValue(true);
    const { decryptToken } = await import('@/lib/crypto/encryption');
    vi.mocked(decryptToken).mockResolvedValue('IGqxTEST_ACCESS_TOKEN');
    const { ContentGuard } = await import('@/lib/ai/ContentGuard');
    vi.mocked(ContentGuard.validateComment).mockReturnValue({
      safe: true,
      violation: { level: 'none', code: '', message: '', internal: '' },
    } as any);
  });

  it('inserts into instagram_flagged_dms when dmAutoReplyEnabled=false and automation enabled', async () => {
    controlState.dmAutoReplyEnabled = false;

    await POST(makeSignedRequest(makeDmPayload('msg_flagged_001')));

    const flaggedOps = supabaseCalls.filter(
      c => c.table === 'instagram_flagged_dms',
    );
    expect(flaggedOps.length).toBeGreaterThan(0);
  });
});

// ─── Follow-to-Unlock Gate in Webhook ─────────────────────────────────────────

describe('Follow-to-Unlock Gate in Inbound DM Webhook', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    supabaseCalls.length = 0;
    controlState.dmAutoReplyEnabled = true;
    controlState.requireFollowForDm = true;
    controlState.existingDmLogs = [];
    mockVerifyMetaSignature.mockResolvedValue(true);

    const { isAutomationEnabledServer } = await import('@/lib/feature-flags-server');
    vi.mocked(isAutomationEnabledServer).mockResolvedValue(true);
    const { velocityThrottle } = await import('@/lib/services/automation/velocity');
    vi.mocked(velocityThrottle.canReply).mockResolvedValue(true);
    const { decryptToken } = await import('@/lib/crypto/encryption');
    vi.mocked(decryptToken).mockResolvedValue('IGqxTEST_ACCESS_TOKEN');
    const { ContentGuard } = await import('@/lib/ai/ContentGuard');
    vi.mocked(ContentGuard.validateComment).mockReturnValue({
      safe: true,
      violation: { level: 'none', code: '', message: '', internal: '' },
    } as any);
  });

  it('intercepts unfollowed user, sends follow prompt, and logs without calling LLM', async () => {
    mockProcessDmFollowGate.mockResolvedValueOnce({
      handled: true,
      action: 'prompt_follow',
      replyText: 'Hey @user! Make sure to follow @testbrand to unlock your access! 👇',
      isFollowing: false,
      messageId: 'qr_prompt_123',
    });

    const res = await POST(makeSignedRequest(makeDmPayload('msg_unfollowed_001', 'Can I get the link?')));
    expect(res.status).toBe(200);

    expect(mockProcessDmFollowGate).toHaveBeenCalledTimes(1);
    expect(mockClassifyAndReplyDM).not.toHaveBeenCalled();

    const dmLogUpsert = supabaseCalls.find(
      c => c.table === 'instagram_dm_logs' && c.op === 'upsert' && (c.data as any)?.message_id === 'msg_unfollowed_001'
    );
    expect(dmLogUpsert).toBeDefined();
    expect((dmLogUpsert?.data as any)?.follow_verified).toBe(false);
    expect((dmLogUpsert?.data as any)?.follow_status).toBe('not_following');
    expect((dmLogUpsert?.data as any)?.ai_reply).toContain('Make sure to follow');
  });

  it('delivers confirmed access when user follows and confirms', async () => {
    mockProcessDmFollowGate.mockResolvedValueOnce({
      handled: true,
      action: 'follow_confirmed',
      replyText: 'Thanks for following @testbrand! 🎉 Here is your exclusive link: https://unool.co/link',
      isFollowing: true,
      messageId: 'sent',
    });

    const res = await POST(makeSignedRequest(makeDmPayload('msg_confirmed_002', 'I Followed! ✅')));
    expect(res.status).toBe(200);

    expect(mockProcessDmFollowGate).toHaveBeenCalledTimes(1);
    expect(mockClassifyAndReplyDM).not.toHaveBeenCalled();

    const dmLogUpsert = supabaseCalls.find(
      c => c.table === 'instagram_dm_logs' && c.op === 'upsert' && (c.data as any)?.message_id === 'msg_confirmed_002'
    );
    expect(dmLogUpsert).toBeDefined();
    expect((dmLogUpsert?.data as any)?.follow_verified).toBe(true);
    expect((dmLogUpsert?.data as any)?.follow_status).toBe('following');
  });

  it('runs follow-gate even when dmAutoReplyEnabled=false (gate fires before the disabled-reply bail-out)', async () => {
    // The key regression guard: require_follow_for_dm=true means the follow prompt
    // must be sent on EVERY DM, even when dm_auto_reply_enabled=false.
    controlState.dmAutoReplyEnabled = false;
    controlState.requireFollowForDm = true;

    mockProcessDmFollowGate.mockResolvedValueOnce({
      handled: true,
      action: 'prompt_follow',
      replyText: 'Follow @testbrand to unlock! 👇',
      isFollowing: false,
      messageId: 'qr_early_gate_001',
    });

    const res = await POST(makeSignedRequest(makeDmPayload('msg_early_gate_001', 'link please')));
    expect(res.status).toBe(200);

    // Follow gate must have fired — not silenced by dmAutoReplyEnabled=false
    expect(mockProcessDmFollowGate).toHaveBeenCalledTimes(1);
    expect(mockClassifyAndReplyDM).not.toHaveBeenCalled();

    const dmLogUpsert = supabaseCalls.find(
      c => c.table === 'instagram_dm_logs' && c.op === 'upsert' && (c.data as any)?.message_id === 'msg_early_gate_001'
    );
    expect(dmLogUpsert).toBeDefined();
    expect((dmLogUpsert?.data as any)?.follow_verified).toBe(false);
    expect((dmLogUpsert?.data as any)?.follow_status).toBe('not_following');
    expect((dmLogUpsert?.data as any)?.auto_replied).toBe(true);
  });

  it('skips is_echo messages even when sender.id differs from igUserId', async () => {
    controlState.requireFollowForDm = true;

    const echoWithFlag = {
      object: 'instagram',
      entry: [
        {
          id: 'ig_account_111',
          messaging: [
            {
              sender: { id: 'external_or_alias_sender' },
              recipient: { id: 'user_sender_001' },
              timestamp: Date.now(),
              message: {
                mid: 'msg_is_echo_flag',
                text: 'Outbound echo copy',
                is_echo: true,
              },
            },
          ],
        },
      ],
    };

    const res = await POST(makeSignedRequest(echoWithFlag));
    expect(res.status).toBe(200);
    expect(mockProcessDmFollowGate).not.toHaveBeenCalled();
    expect(mockClassifyAndReplyDM).not.toHaveBeenCalled();
    expect(mockSendPrivateMessage).not.toHaveBeenCalled();
  });

  it('extracts quick_reply.payload when message.text is omitted and resolves subdomain/slug link once', async () => {
    controlState.requireFollowForDm = true;
    controlState.configuredLinkUrl = null;
    controlState.profiles = [{ subdomain: 'creatorhub', deleted_at: null }];
    controlState.brandPages = [{ slug: 'vip-kit', theme: {}, is_published: true }];

    mockProcessDmFollowGate.mockResolvedValueOnce({
      handled: true,
      action: 'follow_confirmed',
      replyText: 'Thanks for following @testbrand! https://creatorhub.unool.co/vip-kit',
      isFollowing: true,
      messageId: 'sent_qr_unlock',
      resolvedUsername: 'fan_handle',
    });

    const quickReplyOnlyPayload = {
      object: 'instagram',
      entry: [
        {
          id: 'ig_account_111',
          messaging: [
            {
              sender: { id: 'user_qr_01' },
              recipient: { id: 'ig_account_111' },
              timestamp: Date.now(),
              message: {
                mid: 'msg_qr_payload_01',
                quick_reply: { payload: 'CONFIRM_FOLLOW' },
              },
            },
          ],
        },
      ],
    };

    const res = await POST(makeSignedRequest(quickReplyOnlyPayload));
    expect(res.status).toBe(200);

    // Must call follow gate exactly once (never twice on sync path)
    expect(mockProcessDmFollowGate).toHaveBeenCalledTimes(1);
    const gateCallArg = mockProcessDmFollowGate.mock.calls[0][0];
    expect(gateCallArg.dmEvent.text).toBe('CONFIRM_FOLLOW');
    expect(gateCallArg.config.linkUrl).toBe('https://creatorhub.unool.co/vip-kit');

    const dmLogUpsert = supabaseCalls.find(
      c => c.table === 'instagram_dm_logs' && c.op === 'upsert' && (c.data as any)?.message_id === 'msg_qr_payload_01'
    );
    expect((dmLogUpsert?.data as any)?.sender_username).toBe('fan_handle');
    expect((dmLogUpsert?.data as any)?.auto_replied).toBe(true);
  });

  it('marks auto_replied=false, escalates, and queues flagged DM when follow-gate Meta send fails', async () => {
    controlState.requireFollowForDm = true;
    const { velocityThrottle } = await import('@/lib/services/automation/velocity');

    mockProcessDmFollowGate.mockResolvedValueOnce({
      handled: true,
      action: 'prompt_follow',
      replyText: 'Please follow @testbrand!',
      isFollowing: false,
      messageId: undefined,
    });

    const res = await POST(makeSignedRequest(makeDmPayload('msg_fg_fail_01', 'link?')));
    expect(res.status).toBe(200);

    const dmLogUpsert = supabaseCalls.find(
      c => c.table === 'instagram_dm_logs' && c.op === 'upsert' && (c.data as any)?.message_id === 'msg_fg_fail_01'
    );
    expect((dmLogUpsert?.data as any)?.auto_replied).toBe(false);
    expect((dmLogUpsert?.data as any)?.escalated).toBe(true);

    const flagged = supabaseCalls.find(
      c => c.table === 'instagram_flagged_dms' && (c.data as any)?.message_id === 'msg_fg_fail_01'
    );
    expect(flagged).toBeDefined();
    expect(velocityThrottle.recordReply).not.toHaveBeenCalled();
  });
});

// ─── Loop Prevention, Flood Protection & Human Handoff ──────────────────────

describe('Loop Prevention, Flood Protection & Human Handoff', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    supabaseCalls.length = 0;
    controlState.dmAutoReplyEnabled = true;
    controlState.requireFollowForDm = false;
    controlState.existingDmLogs = [];
    controlState.dmHistoryLogs = [];
    controlState.existingCommentLogs = [];
    controlState.commenterHourlyCount = 0;
    mockVerifyMetaSignature.mockResolvedValue(true);

    const { isAutomationEnabledServer } = await import('@/lib/feature-flags-server');
    vi.mocked(isAutomationEnabledServer).mockResolvedValue(true);
    const { velocityThrottle } = await import('@/lib/services/automation/velocity');
    vi.mocked(velocityThrottle.canReply).mockResolvedValue(true);
    vi.mocked(velocityThrottle.recordReply).mockResolvedValue(undefined);
    const { humanizedSleep } = await import('@/lib/services/automation/jitter');
    vi.mocked(humanizedSleep).mockResolvedValue(undefined);
    const { ContentHumanizer } = await import('@/lib/ai/engines/ContentHumanizer');
    vi.mocked(ContentHumanizer.humanize).mockImplementation((text: string) => ({ humanized: text }) as any);
    const { lexicalEntropyGuard } = await import('@/lib/services/automation/lexical');
    vi.mocked(lexicalEntropyGuard.getRecentReplies).mockResolvedValue([]);
    vi.mocked(lexicalEntropyGuard.isTooSimilar).mockReturnValue(false);
    const { decryptToken } = await import('@/lib/crypto/encryption');
    vi.mocked(decryptToken).mockResolvedValue('IGqxTEST_ACCESS_TOKEN');
    const { ContentGuard } = await import('@/lib/ai/ContentGuard');
    vi.mocked(ContentGuard.validateComment).mockReturnValue({
      safe: true,
      violation: { level: 'none', code: '', message: '', internal: '' },
    } as any);
  });

  it('blocks self-reply by numeric platform_user_id even if username differs', async () => {
    const res = await POST(
      makeSignedRequest(makeCommentPayload('comment_self_num', 'different_alias', 'ig_account_111'))
    );
    expect(res.status).toBe(200);
    expect(mockClassifyAndGenerateReply).not.toHaveBeenCalled();
  });

  it('flags commenter flood without invoking LLM when hourly count >= 5', async () => {
    controlState.commenterHourlyCount = 5;
    const res = await POST(
      makeSignedRequest(makeCommentPayload('comment_flood_001', 'spammy_user', 'user_spam_999'))
    );
    expect(res.status).toBe(200);
    expect(mockClassifyAndGenerateReply).not.toHaveBeenCalled();

    const flagged = supabaseCalls.find(c => c.table === 'instagram_flagged_comments');
    expect(flagged).toBeDefined();
  });

  it('uses public comment reply for follow-gate to preserve one-time private reply slot', async () => {
    controlState.requireFollowForDm = true;
    mockClassifyAndGenerateReply.mockResolvedValueOnce({
      classification: 'link_request',
      confidence: 0.95,
      suggestedReply: 'Sent to your DMs!',
      suggestedDM: 'Here is your link!',
      threadHook: null,
      leadScore: 2,
      shouldAutoReply: true,
      shouldSendDM: true,
      shouldFlagForReview: false,
      reasoning: 'User requested link',
    });
    mockPostPublicReply.mockResolvedValue({ replyId: 'pub_reply_001' });

    const res = await POST(
      makeSignedRequest(makeCommentPayload('comment_fg_pub', 'eager_follower', 'user_eager_01'))
    );
    expect(res.status).toBe(200);

    // Public reply should be called (for both main comment reply + follow gate notice),
    // and sendDmForComment (private reply API) MUST NOT be called!
    expect(mockPostPublicReply).toHaveBeenCalled();
    expect(mockSendDmForComment).not.toHaveBeenCalled();
  });

  it('sends one-time human handoff notice at 15-turn DM ceiling and stays silent thereafter', async () => {
    // 15 prior turns, none escalated yet
    controlState.dmHistoryLogs = Array.from({ length: 15 }, (_, idx) => ({
      message_text: `Turn ${idx + 1}`,
      ai_reply: `Reply ${idx + 1}`,
      escalated: false,
      created_at: new Date().toISOString(),
    }));
    mockSendPrivateMessage.mockResolvedValueOnce({ messageId: 'handoff_msg_1' });

    const res16 = await POST(makeSignedRequest(makeDmPayload('msg_turn_16', 'Still have more questions!')));
    expect(res16.status).toBe(200);
    expect(mockClassifyAndReplyDM).not.toHaveBeenCalled();
    expect(mockSendPrivateMessage).toHaveBeenCalledTimes(1);

    const flagged16 = supabaseCalls.find(c => c.table === 'instagram_flagged_dms');
    expect(flagged16).toBeDefined();

    // Now turn 17: already escalated -> MUST NOT send another DM (no loop!)
    vi.clearAllMocks();
    supabaseCalls.length = 0;
    controlState.dmHistoryLogs = [
      ...(controlState.dmHistoryLogs as any[]),
      { message_text: 'Turn 16', ai_reply: 'Handoff sent', escalated: true, created_at: new Date().toISOString() },
    ];

    const res17 = await POST(makeSignedRequest(makeDmPayload('msg_turn_17', 'Hello???')));
    expect(res17.status).toBe(200);
    expect(mockClassifyAndReplyDM).not.toHaveBeenCalled();
    expect(mockSendPrivateMessage).not.toHaveBeenCalled();
  });

  it('sends one-time warm wind-down reply on AI escalation (shouldAutoReply=false) and flags inbox', async () => {
    controlState.dmHistoryLogs = [
      { message_text: 'Off topic 1', ai_reply: 'Haha fair!', escalated: false, created_at: new Date().toISOString() },
      { message_text: 'Off topic 2', ai_reply: 'Gotcha!', escalated: false, created_at: new Date().toISOString() },
    ];
    mockClassifyAndReplyDM.mockResolvedValueOnce({
      classification: 'unrelated',
      confidence: 0.9,
      suggestedReply: "Going to hand you over to our team from here — they'll reply soon 😊",
      leadScore: 0,
      shouldAutoReply: false,
      shouldEscalate: true,
      reasoning: 'Off-topic deflection cap reached',
    });
    mockSendPrivateMessage.mockResolvedValueOnce({ messageId: 'wind_down_msg_1' });

    const res = await POST(makeSignedRequest(makeDmPayload('msg_escalate_wind_down', 'Tell me another joke')));
    expect(res.status).toBe(200);
    expect(mockClassifyAndReplyDM).toHaveBeenCalledTimes(1);
    expect(mockSendPrivateMessage).toHaveBeenCalledTimes(1);
    const flagged = supabaseCalls.find(c => c.table === 'instagram_flagged_dms' && c.op === 'upsert');
    expect(flagged).toBeDefined();
  });
});

