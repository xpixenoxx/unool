import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockDecryptToken,
  mockPostReply,
  mockHideReply,
  mockClassifyAndGenerateReply,
  mockCanReply,
  mockRecordReply,
  mockGetSecondsUntilNextHourBucket,
  mockGetRecentReplies,
  mockIsTooSimilar,
  dbState,
} = vi.hoisted(() => {
  const dbState = {
    existingJob: null as any,
    upsertedLogs: [] as Array<{ table: string; data: any }>,
    threadsConfig: {
      workspace_id: 'ws_1',
      threads_user_id: 'th_user_1',
      enabled: true,
      auto_reply_replies: true,
      auto_reply_mentions: true,
      auto_hide_spam: true,
      flag_negative: true,
      flag_spam: true,
      max_replies_per_hour: 30,
    } as any,
    connections: [
      {
        id: 'conn_th_1',
        workspace_id: 'ws_1',
        platform: 'threads',
        platform_user_id: 'th_user_1',
        access_token_encrypted: 'enc_th_tok',
        status: 'connected',
      },
    ],
    replyLog: null as any,
  };

  return {
    mockDecryptToken: vi.fn(),
    mockPostReply: vi.fn(),
    mockHideReply: vi.fn(),
    mockClassifyAndGenerateReply: vi.fn(),
    mockCanReply: vi.fn(),
    mockRecordReply: vi.fn(),
    mockGetSecondsUntilNextHourBucket: vi.fn(),
    mockGetRecentReplies: vi.fn(),
    mockIsTooSimilar: vi.fn(),
    dbState,
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/config/schema', () => ({
  config: {
    GROQ_API_KEY: 'test_groq_key',
    AI_GROQ_MODEL: 'openai/gpt-oss-120b',
  },
}));

vi.mock('@/lib/crypto/encryption', () => ({
  decryptToken: (...args: unknown[]) => mockDecryptToken(...args),
}));

vi.mock('@/lib/platforms/ThreadsAdapter', () => ({
  threadsAdapter: {
    postReply: (...args: unknown[]) => mockPostReply(...args),
    hideReply: (...args: unknown[]) => mockHideReply(...args),
  },
  clampThreadsText: (text?: string) => (text || '').trim().slice(0, 500),
}));

vi.mock('@/lib/services/InstagramCommentAutomation', () => ({
  InstagramCommentAutomation: class {
    async classifyAndGenerateReply(...args: unknown[]) {
      return mockClassifyAndGenerateReply(...args);
    }
  },
}));

vi.mock('@/lib/services/automation/velocity', () => ({
  velocityThrottle: {
    canReply: (...args: unknown[]) => mockCanReply(...args),
    recordReply: (...args: unknown[]) => mockRecordReply(...args),
    getSecondsUntilNextHourBucket: (...args: unknown[]) => mockGetSecondsUntilNextHourBucket(...args),
  },
}));

vi.mock('@/lib/services/automation/lexical', () => ({
  lexicalEntropyGuard: {
    getRecentReplies: (...args: unknown[]) => mockGetRecentReplies(...args),
    isTooSimilar: (...args: unknown[]) => mockIsTooSimilar(...args),
    recordReply: vi.fn(),
  },
}));

vi.mock('@/lib/services/QueueService', () => ({
  queueService: {
    isAvailable: () => false,
    enqueueThreadsOutboundTask: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: (table: string) => {
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        not: () => chain,
        limit: () => chain,
        order: () => chain,
        update: () => chain,
        upsert: (data: any) => {
          dbState.upsertedLogs.push({ table, data });
          return Promise.resolve({ error: null });
        },
        maybeSingle: () => {
          if (table === 'threads_outbound_jobs') return Promise.resolve({ data: dbState.existingJob, error: null });
          if (table === 'threads_automation_config') return Promise.resolve({ data: dbState.threadsConfig, error: null });
          if (table === 'threads_reply_logs') return Promise.resolve({ data: dbState.replyLog, error: null });
          return Promise.resolve({ data: null, error: null });
        },
        then: (resolve: (val: any) => void) => {
          if (table === 'platform_connections') return resolve({ data: dbState.connections, error: null });
          return resolve({ data: [], error: null });
        },
      };
      return chain;
    },
  },
}));

import { processThreadsOutboundJob } from '../threadsOutbound';

describe('processThreadsOutboundJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDecryptToken.mockResolvedValue('th_access_token');
    mockHideReply.mockResolvedValue(undefined);
    mockPostReply.mockResolvedValue({ id: 'reply_out_1' });
    mockCanReply.mockResolvedValue(true);
    mockRecordReply.mockResolvedValue(undefined);
    mockGetSecondsUntilNextHourBucket.mockReturnValue(60);
    mockGetRecentReplies.mockResolvedValue([]);
    mockIsTooSimilar.mockReturnValue(false);
    dbState.upsertedLogs = [];
    dbState.threadsConfig.auto_hide_spam = true;
    dbState.threadsConfig.flag_negative = true;
    dbState.threadsConfig.flag_spam = true;
  });

  it('calls threadsAdapter.hideReply for spam even when shouldAutoReply is false', async () => {
    mockClassifyAndGenerateReply.mockResolvedValue({
      classification: 'spam',
      confidence: 0.99,
      suggestedReply: 'SKIP',
      suggestedDM: null,
      threadHook: null,
      leadScore: 0,
      shouldAutoReply: false,
      shouldSendDM: false,
      shouldFlagForReview: true,
      reasoning: 'Crypto spam link',
    });

    const res = await processThreadsOutboundJob({
      jobId: 'job-spam-1',
      jobType: 'reply',
      workspaceId: 'ws_1',
      connectionId: 'conn_th_1',
      threadsUserId: 'th_user_1',
      replyId: 'th_reply_spam_1',
      postId: 'th_post_1',
      replyText: 'Free crypto signals bit.ly/scam',
      replierId: 'spammer_1',
      eventType: 'reply',
    });

    const body = await res.json();
    expect(body).toEqual({ success: true, action: 'spam_hidden' });
    expect(mockHideReply).toHaveBeenCalledWith('th_access_token', 'th_reply_spam_1', true);
    expect(mockPostReply).not.toHaveBeenCalled();
  });

  it('skips hideReply when auto_hide_spam is false', async () => {
    dbState.threadsConfig.auto_hide_spam = false;
    mockClassifyAndGenerateReply.mockResolvedValue({
      classification: 'spam',
      confidence: 0.95,
      suggestedReply: 'SKIP',
      suggestedDM: null,
      threadHook: null,
      leadScore: 0,
      shouldAutoReply: false,
      shouldSendDM: false,
      shouldFlagForReview: true,
      reasoning: 'Spam',
    });

    const res = await processThreadsOutboundJob({
      jobId: 'job-spam-2',
      jobType: 'reply',
      workspaceId: 'ws_1',
      connectionId: 'conn_th_1',
      threadsUserId: 'th_user_1',
      replyId: 'th_reply_spam_2',
      postId: 'th_post_1',
      replyText: 'Buy followers now',
      replierId: 'spammer_2',
      eventType: 'reply',
    });

    const body = await res.json();
    expect(body).toEqual({ success: true, action: 'skipped_by_policy' });
    expect(mockHideReply).not.toHaveBeenCalled();
    expect(mockPostReply).not.toHaveBeenCalled();
  });

  it('posts public reply for non-spam replies when shouldAutoReply is true', async () => {
    mockClassifyAndGenerateReply.mockResolvedValue({
      classification: 'positive',
      confidence: 0.96,
      suggestedReply: 'Thanks so much for reading!',
      suggestedDM: null,
      threadHook: null,
      leadScore: 1,
      shouldAutoReply: true,
      shouldSendDM: false,
      shouldFlagForReview: false,
      reasoning: 'Positive feedback',
    });

    const res = await processThreadsOutboundJob({
      jobId: 'job-pos-1',
      jobType: 'reply',
      workspaceId: 'ws_1',
      connectionId: 'conn_th_1',
      threadsUserId: 'th_user_1',
      replyId: 'th_reply_pos_1',
      postId: 'th_post_1',
      replyText: 'Great breakdown!',
      replierId: 'fan_1',
      eventType: 'reply',
    });

    const body = await res.json();
    expect(body).toEqual({ success: true });
    expect(mockHideReply).not.toHaveBeenCalled();
    expect(mockPostReply).toHaveBeenCalledWith('th_access_token', 'th_reply_pos_1', 'Thanks so much for reading!');
  });

  it('flags negative replies for Triage Queue without auto-replying even when classifier sets shouldFlagForReview=false', async () => {
    mockClassifyAndGenerateReply.mockResolvedValue({
      classification: 'negative',
      confidence: 0.94,
      suggestedReply: "I hear you're upset—let's sort this out in DMs.",
      suggestedDM: null,
      threadHook: null,
      leadScore: 0,
      shouldAutoReply: false,
      shouldSendDM: false,
      shouldFlagForReview: false,
      reasoning: 'Negative remark',
    });

    const res = await processThreadsOutboundJob({
      jobId: 'job-neg-1',
      jobType: 'reply',
      workspaceId: 'ws_1',
      connectionId: 'conn_th_1',
      threadsUserId: 'th_user_1',
      replyId: 'th_reply_neg_1',
      postId: 'th_post_1',
      replyText: 'go to hell bro',
      replierId: 'angry_user_1',
      eventType: 'reply',
    });

    const body = await res.json();
    expect(body).toEqual({ success: true, action: 'skipped_by_policy' });
    expect(mockPostReply).not.toHaveBeenCalled();
    const replyLog = dbState.upsertedLogs.find((l) => l.table === 'threads_reply_logs');
    expect(replyLog).toBeDefined();
    expect(replyLog?.data.auto_replied).toBe(false);
    expect(replyLog?.data.flagged_for_review).toBe(true);
  });
});
