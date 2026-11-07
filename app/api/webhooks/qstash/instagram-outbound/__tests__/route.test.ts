import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const {
  mockPostPublicReply,
  mockSendPrivateMessage,
  mockClassifyAndGenerateReply,
  mockClassifyAndReplyDM,
  mockDecryptToken,
  mockCanReply,
  mockRecordReply,
  mockReceiverVerify,
  supabaseCalls,
  jobControlState,
} = vi.hoisted(() => {
  const mockPostPublicReply = vi.fn();
  const mockSendPrivateMessage = vi.fn();
  const mockClassifyAndGenerateReply = vi.fn();
  const mockClassifyAndReplyDM = vi.fn();
  const mockDecryptToken = vi.fn();
  const mockCanReply = vi.fn();
  const mockRecordReply = vi.fn();
  const mockReceiverVerify = vi.fn();
  const supabaseCalls: Array<{ table: string; op: string; data?: unknown }> = [];

  const jobControlState = {
    jobStatus: 'queued' as string,
    retryCount: 0,
    maxRetries: 3,
    commentLogsAutoReplied: false,
    dmLogsAutoReplied: false,
  };

  return {
    mockPostPublicReply,
    mockSendPrivateMessage,
    mockClassifyAndGenerateReply,
    mockClassifyAndReplyDM,
    mockDecryptToken,
    mockCanReply,
    mockRecordReply,
    mockReceiverVerify,
    supabaseCalls,
    jobControlState,
  };
});

vi.mock('@upstash/qstash', () => ({
  Receiver: vi.fn().mockImplementation(() => ({
    verify: mockReceiverVerify,
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/config/schema', () => ({
  config: {
    NEXT_PUBLIC_APP_URL: 'https://app.unool.co',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test_service_key',
    GROQ_API_KEY: 'test_groq_key',
    QSTASH_CURRENT_SIGNING_KEY: undefined,
    QSTASH_NEXT_SIGNING_KEY: undefined,
  },
}));

vi.mock('@/lib/crypto/encryption', () => ({
  decryptToken: (...args: unknown[]) => mockDecryptToken(...args),
}));

vi.mock('@/lib/services/automation/velocity', () => ({
  velocityThrottle: {
    canReply: (...args: unknown[]) => mockCanReply(...args),
    recordReply: (...args: unknown[]) => mockRecordReply(...args),
  },
}));

vi.mock('@/lib/services/automation/lexical', () => ({
  lexicalEntropyGuard: {
    getRecentReplies: vi.fn().mockResolvedValue([]),
    isTooSimilar: vi.fn().mockReturnValue(false),
    recordReply: vi.fn(),
  },
}));

vi.mock('@/lib/ai/engines/ContentHumanizer', () => ({
  ContentHumanizer: {
    humanize: vi.fn().mockImplementation((t: string) => ({ humanized: t })),
  },
}));

vi.mock('@/lib/services/InstagramCommentAutomation', () => ({
  InstagramCommentAutomation: class {
    async postPublicReply(...args: unknown[]) { return mockPostPublicReply(...args); }
    async sendPrivateMessage(...args: unknown[]) { return mockSendPrivateMessage(...args); }
    async classifyAndGenerateReply(...args: unknown[]) { return mockClassifyAndGenerateReply(...args); }
    async classifyAndReplyDM(...args: unknown[]) { return mockClassifyAndReplyDM(...args); }
  },
}));

const MOCK_CONN = {
  id: 'conn_test_1',
  workspace_id: 'ws_test_1',
  platform: 'instagram',
  platform_user_id: 'ig_user_1',
  username: 'brand_account',
  access_token_encrypted: 'enc_token_1',
  status: 'connected',
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      function makeChain(result: any) {
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          limit: () => chain,
          order: () => chain,
          update: (data: unknown) => {
            supabaseCalls.push({ table, op: 'update', data });
            return chain;
          },
          upsert: (data: unknown) => {
            supabaseCalls.push({ table, op: 'upsert', data });
            return Promise.resolve({ error: null });
          },
          insert: (data: unknown) => {
            supabaseCalls.push({ table, op: 'insert', data });
            return Promise.resolve({ error: null });
          },
          single: () => Promise.resolve(result),
          maybeSingle: () => Promise.resolve(result),
          then: (res: Function, rej: Function) => Promise.resolve(result).then(res as any, rej as any),
        };
        return chain;
      }

      if (table === 'instagram_outbound_jobs') {
        return makeChain({
          data: {
            id: 'job_row_1',
            status: jobControlState.jobStatus,
            retry_count: jobControlState.retryCount,
            max_retries: jobControlState.maxRetries,
          },
          error: null,
        });
      }

      if (table === 'platform_connections') {
        return makeChain({ data: [MOCK_CONN], error: null });
      }

      if (table === 'instagram_automation_config') {
        return makeChain({
          data: {
            enabled: true,
            max_replies_per_hour: 30,
            dm_auto_reply_enabled: true,
            dm_max_replies_per_hour: 20,
          },
          error: null,
        });
      }

      if (table === 'instagram_comment_logs') {
        return makeChain({
          data: [{ auto_replied: jobControlState.commentLogsAutoReplied }],
          error: null,
        });
      }

      if (table === 'instagram_dm_logs') {
        return makeChain({
          data: [{ auto_replied: jobControlState.dmLogsAutoReplied }],
          error: null,
        });
      }

      return makeChain({ data: null, error: null });
    },
  }),
}));

import { POST } from '../route';

function makeRequest(body: object): NextRequest {
  return new NextRequest('https://app.unool.co/api/webhooks/qstash/instagram-outbound', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/webhooks/qstash/instagram-outbound route', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    supabaseCalls.length = 0;
    jobControlState.jobStatus = 'queued';
    jobControlState.retryCount = 0;
    jobControlState.maxRetries = 3;
    jobControlState.commentLogsAutoReplied = false;
    jobControlState.dmLogsAutoReplied = false;

    mockDecryptToken.mockResolvedValue('IGqx_VALID_TOKEN');
    mockCanReply.mockResolvedValue(true);
    mockRecordReply.mockResolvedValue(undefined);

    mockClassifyAndGenerateReply.mockResolvedValue({
      classification: 'question',
      suggestedReply: 'Thanks for reaching out!',
      shouldAutoReply: true,
      shouldFlagForReview: false,
      reasoning: 'Product query',
    });

    mockClassifyAndReplyDM.mockResolvedValue({
      classification: 'question',
      suggestedReply: 'Hello! How can we help?',
      shouldAutoReply: true,
      shouldEscalate: false,
      reasoning: 'Direct inquiry',
    });

    mockPostPublicReply.mockResolvedValue({ replyId: 'meta_reply_123' });
    mockSendPrivateMessage.mockResolvedValue({ messageId: 'meta_dm_456' });
  });

  it('skips execution if job status is already sent (idempotency)', async () => {
    jobControlState.jobStatus = 'sent';

    const res = await POST(makeRequest({
      jobId: 'job_1',
      jobType: 'comment_reply',
      workspaceId: 'ws_test_1',
      connectionId: 'conn_test_1',
      commentId: 'cmt_already_sent',
      commentText: 'Hi',
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toBe('Already sent');
    expect(mockPostPublicReply).not.toHaveBeenCalled();
  });

  it('processes comment_reply successfully and updates status to sent', async () => {
    const res = await POST(makeRequest({
      jobId: 'job_2',
      jobType: 'comment_reply',
      workspaceId: 'ws_test_1',
      connectionId: 'conn_test_1',
      commentId: 'cmt_new_1',
      commentText: 'How much does it cost?',
      commenterUsername: 'customer_1',
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.replyId).toBe('meta_reply_123');

    expect(mockPostPublicReply).toHaveBeenCalledWith(
      'IGqx_VALID_TOKEN',
      '',
      'cmt_new_1',
      'Thanks for reaching out!'
    );

    // Verify job status updated to sent
    const jobUpdates = supabaseCalls.filter(c => c.table === 'instagram_outbound_jobs' && c.op === 'update');
    const sentUpdate = jobUpdates.find(u => (u.data as any)?.status === 'sent');
    expect(sentUpdate).toBeDefined();

    // Verify comment_logs updated with auto_replied = true
    const commentUpdates = supabaseCalls.filter(c => c.table === 'instagram_comment_logs' && c.op === 'update');
    const autoRepliedUpdate = commentUpdates.find(u => (u.data as any)?.auto_replied === true);
    expect(autoRepliedUpdate).toBeDefined();
  });

  it('processes dm_reply successfully and updates status to sent', async () => {
    const res = await POST(makeRequest({
      jobId: 'job_3',
      jobType: 'dm_reply',
      workspaceId: 'ws_test_1',
      connectionId: 'conn_test_1',
      messageId: 'msg_new_1',
      senderId: 'sender_111',
      dmText: 'Can I get a demo?',
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.messageId).toBe('meta_dm_456');

    expect(mockSendPrivateMessage).toHaveBeenCalledWith(
      'IGqx_VALID_TOKEN',
      'ig_user_1',
      'sender_111',
      'Hello! How can we help?'
    );

    // Verify dm_logs updated with auto_replied = true
    const dmUpdates = supabaseCalls.filter(c => c.table === 'instagram_dm_logs' && c.op === 'update');
    const autoRepliedDm = dmUpdates.find(u => (u.data as any)?.auto_replied === true);
    expect(autoRepliedDm).toBeDefined();
  });

  it('dead-letters a job with permanent Meta error and flags for human review', async () => {
    mockPostPublicReply.mockRejectedValue(new Error('Meta OAuthException: Error validating access token: Session has expired.'));

    const res = await POST(makeRequest({
      jobId: 'job_4',
      jobType: 'comment_reply',
      workspaceId: 'ws_test_1',
      connectionId: 'conn_test_1',
      commentId: 'cmt_token_expired',
      commentText: 'Hello',
    }));

    // Must return 200 so QStash halts retries on dead letter
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deadLetter).toBe(true);

    // Verify job status updated to needs_review
    const jobUpdates = supabaseCalls.filter(c => c.table === 'instagram_outbound_jobs' && c.op === 'update');
    const deadLetterJob = jobUpdates.find(u => (u.data as any)?.status === 'needs_review');
    expect(deadLetterJob).toBeDefined();

    // Verify comment was inserted into instagram_flagged_comments for operator review
    const flaggedComments = supabaseCalls.filter(c => c.table === 'instagram_flagged_comments' && c.op === 'upsert');
    expect(flaggedComments.length).toBeGreaterThan(0);
  });

  it('returns 500 for retryable transient error when retryCount < maxRetries', async () => {
    jobControlState.retryCount = 0;
    jobControlState.maxRetries = 3;
    mockPostPublicReply.mockRejectedValue(new Error('500 Internal Server Error: transient network timeout'));

    const res = await POST(makeRequest({
      jobId: 'job_5',
      jobType: 'comment_reply',
      workspaceId: 'ws_test_1',
      connectionId: 'conn_test_1',
      commentId: 'cmt_transient',
      commentText: 'Need support',
    }));

    // 500 tells QStash to retry with exponential backoff
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.retryable).toBe(true);
  });

  it('dead-letters when retries are exhausted (retryCount >= maxRetries)', async () => {
    jobControlState.retryCount = 2; // will become 3 (= maxRetries)
    jobControlState.maxRetries = 3;
    mockPostPublicReply.mockRejectedValue(new Error('Server unavailable'));

    const res = await POST(makeRequest({
      jobId: 'job_6',
      jobType: 'comment_reply',
      workspaceId: 'ws_test_1',
      connectionId: 'conn_test_1',
      commentId: 'cmt_exhausted',
      commentText: 'Final retry',
    }));

    // Returns 200 to halt QStash
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deadLetter).toBe(true);

    const flagged = supabaseCalls.filter(c => c.table === 'instagram_flagged_comments' && c.op === 'upsert');
    expect(flagged.length).toBeGreaterThan(0);
  });
});

