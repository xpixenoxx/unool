import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const {
  mockPostPublicReply,
  mockSendPrivateMessage,
  mockSendDmForComment,
  mockClassifyAndGenerateReply,
  mockClassifyAndReplyDM,
  mockProcessDmFollowGate,
  mockDecryptToken,
  mockCanReply,
  mockRecordReply,
  mockReceiverVerify,
  supabaseCalls,
  jobControlState,
} = vi.hoisted(() => {
  const mockPostPublicReply = vi.fn();
  const mockSendPrivateMessage = vi.fn();
  const mockSendDmForComment = vi.fn();
  const mockClassifyAndGenerateReply = vi.fn();
  const mockClassifyAndReplyDM = vi.fn();
  const mockProcessDmFollowGate = vi.fn();
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
    dmHistoryLogs: [] as any[],
    dmEscalationEnabled: true,
    requireFollowForDm: false,
    dmAutoReplyEnabled: true,
    configuredLinkUrl: 'https://unool.co/link' as string | null,
    profiles: [] as any[],
    brandPages: [] as any[],
  };

  return {
    mockPostPublicReply,
    mockSendPrivateMessage,
    mockSendDmForComment,
    mockClassifyAndGenerateReply,
    mockClassifyAndReplyDM,
    mockProcessDmFollowGate,
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
    async sendDmForComment(...args: unknown[]) { return mockSendDmForComment(...args); }
    async classifyAndGenerateReply(...args: unknown[]) { return mockClassifyAndGenerateReply(...args); }
    async classifyAndReplyDM(...args: unknown[]) { return mockClassifyAndReplyDM(...args); }
    async processDmFollowGate(...args: unknown[]) { return mockProcessDmFollowGate(...args); }
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
          then: (res: (val: any) => any, rej?: (reason: any) => any) => Promise.resolve(result).then(res, rej),
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
            dm_auto_reply_enabled: jobControlState.dmAutoReplyEnabled,
            dm_escalation_enabled: jobControlState.dmEscalationEnabled,
            dm_max_replies_per_hour: 20,
            require_follow_for_dm: jobControlState.requireFollowForDm,
            link_url: jobControlState.configuredLinkUrl,
          },
          error: null,
        });
      }

      if (table === 'profiles') {
        return makeChain({ data: jobControlState.profiles, error: null });
      }

      if (table === 'brand_materials_pages') {
        return makeChain({ data: jobControlState.brandPages, error: null });
      }

      if (table === 'instagram_comment_logs') {
        return makeChain({
          data: [{ auto_replied: jobControlState.commentLogsAutoReplied }],
          error: null,
        });
      }

      if (table === 'instagram_dm_logs') {
        let requestedLimit = 1;
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          order: () => chain,
          limit: (n?: number) => {
            if (typeof n === 'number') requestedLimit = n;
            return chain;
          },
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
          single: () => Promise.resolve({ data: [{ auto_replied: jobControlState.dmLogsAutoReplied }], error: null }),
          maybeSingle: () => Promise.resolve({ data: [{ auto_replied: jobControlState.dmLogsAutoReplied }], error: null }),
          then: (res: (val: any) => any, rej?: (reason: any) => any) => {
            const payload = requestedLimit >= 10
              ? { data: jobControlState.dmHistoryLogs, error: null }
              : { data: [{ auto_replied: jobControlState.dmLogsAutoReplied }], error: null };
            return Promise.resolve(payload).then(res, rej);
          },
        };
        return chain;
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
    jobControlState.dmHistoryLogs = [];
    jobControlState.dmEscalationEnabled = true;
    jobControlState.requireFollowForDm = false;
    jobControlState.dmAutoReplyEnabled = true;
    jobControlState.configuredLinkUrl = 'https://unool.co/link';
    jobControlState.profiles = [];
    jobControlState.brandPages = [];

    mockDecryptToken.mockResolvedValue('IGqx_VALID_TOKEN');
    mockCanReply.mockResolvedValue(true);
    mockRecordReply.mockResolvedValue(undefined);
    mockProcessDmFollowGate.mockResolvedValue({ handled: false, isFollowing: true });

    const { lexicalEntropyGuard } = await import('@/lib/services/automation/lexical');
    vi.mocked(lexicalEntropyGuard.getRecentReplies).mockResolvedValue([]);
    vi.mocked(lexicalEntropyGuard.isTooSimilar).mockReturnValue(false);

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
      'Thanks for reaching out!',
      'customer_1'
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

  it('enforces 15-turn DM ceiling with one-time handoff notice and prevents infinite loops', async () => {
    jobControlState.dmHistoryLogs = Array.from({ length: 15 }, (_, idx) => ({
      message_text: `Msg ${idx + 1}`,
      ai_reply: `Reply ${idx + 1}`,
      escalated: false,
      created_at: new Date().toISOString(),
    }));

    const res16 = await POST(makeRequest({
      jobId: 'job_turn16',
      jobType: 'dm_reply',
      workspaceId: 'ws_test_1',
      connectionId: 'conn_test_1',
      messageId: 'msg_turn16',
      senderId: 'sender_loop_test',
      dmText: 'One more question',
    }));

    expect(res16.status).toBe(200);
    const json16 = await res16.json();
    expect(json16.handoffSent).toBe(true);
    expect(mockClassifyAndReplyDM).not.toHaveBeenCalled();
    expect(mockSendPrivateMessage).toHaveBeenCalledTimes(1);

    // Turn 17 when already escalated -> silent, no repeat handoff
    vi.clearAllMocks();
    supabaseCalls.length = 0;
    jobControlState.dmHistoryLogs = [
      ...jobControlState.dmHistoryLogs,
      { message_text: 'One more question', ai_reply: 'Handoff', escalated: true, created_at: new Date().toISOString() },
    ];

    const res17 = await POST(makeRequest({
      jobId: 'job_turn17',
      jobType: 'dm_reply',
      workspaceId: 'ws_test_1',
      connectionId: 'conn_test_1',
      messageId: 'msg_turn17',
      senderId: 'sender_loop_test',
      dmText: 'Hello again',
    }));

    expect(res17.status).toBe(200);
    const json17 = await res17.json();
    expect(json17.handoffSent).toBe(false);
    expect(mockSendPrivateMessage).not.toHaveBeenCalled();
  });

  it('sends one-time warm wind-down reply when AI escalates with shouldAutoReply=false', async () => {
    jobControlState.dmHistoryLogs = [
      { message_text: 'Whats the weather?', ai_reply: 'Ha not my department!', escalated: false },
      { message_text: 'Who won the game?', ai_reply: 'Busy building!', escalated: false },
    ];

    mockClassifyAndReplyDM.mockResolvedValueOnce({
      classification: 'unrelated',
      confidence: 0.9,
      suggestedReply: "Honestly, I'll let our team take it from here 😊",
      leadScore: 0,
      shouldAutoReply: false,
      shouldEscalate: true,
      reasoning: 'Off-topic deflection cap reached',
    });

    const res = await POST(makeRequest({
      jobId: 'job_deflect_cap',
      jobType: 'dm_reply',
      workspaceId: 'ws_test_1',
      connectionId: 'conn_test_1',
      messageId: 'msg_deflect_cap',
      senderId: 'sender_offtopic',
      dmText: 'Tell me a joke',
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.action).toBe('escalated_with_handoff');
    // Both user and assistant turns passed cleanly + turn count is priorTurnCount + 1 = 3
    expect(mockClassifyAndReplyDM).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      [
        { role: 'user', text: 'Whats the weather?' },
        { role: 'assistant', text: 'Ha not my department!' },
        { role: 'user', text: 'Who won the game?' },
        { role: 'assistant', text: 'Busy building!' },
      ],
      3,
      '@brand_account',
      true
    );
    expect(mockSendPrivateMessage).toHaveBeenCalledTimes(1);
    const flagged = supabaseCalls.filter(c => c.table === 'instagram_flagged_dms');
    expect(flagged.length).toBeGreaterThan(0);
  });

  it('uses public comment reply for follow-gate in comment_reply job to preserve private reply slot', async () => {
    jobControlState.requireFollowForDm = true;
    mockClassifyAndGenerateReply.mockResolvedValueOnce({
      classification: 'link_request',
      suggestedReply: 'Just dropped it!',
      suggestedDM: 'Here is your link!',
      shouldAutoReply: true,
      shouldSendDM: true,
      shouldFlagForReview: false,
      reasoning: 'User requested link',
    });

    const res = await POST(makeRequest({
      jobId: 'job_cmt_follow_gate',
      jobType: 'comment_reply',
      workspaceId: 'ws_test_1',
      connectionId: 'conn_test_1',
      commentId: 'cmt_fg_qstash',
      mediaId: 'media_fg_1',
      commentText: 'link please',
      commenterUsername: 'follower_hopeful',
    }));

    expect(res.status).toBe(200);
    // Called twice on postPublicReply (main reply + follow gate public ask) and NEVER on sendDmForComment
    expect(mockPostPublicReply).toHaveBeenCalledTimes(2);
    expect(mockSendDmForComment).not.toHaveBeenCalled();
  });

  it('passes resolved subdomain/slug linkUrl to classifyAndReplyDM when link_url is null', async () => {
    jobControlState.configuredLinkUrl = null;
    jobControlState.profiles = [{ subdomain: 'creatorhub', deleted_at: null }];
    jobControlState.brandPages = [{ slug: 'launch-kit', theme: {}, is_published: true }];

    const res = await POST(makeRequest({
      jobId: 'job_dm_link_fallback',
      jobType: 'dm_reply',
      workspaceId: 'ws_test_1',
      connectionId: 'conn_test_1',
      messageId: 'msg_dm_link_1',
      senderId: 'sender_link_1',
      dmText: 'Where can I get the guide?',
    }));

    expect(res.status).toBe(200);
    expect(mockClassifyAndReplyDM).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: 'msg_dm_link_1', senderId: 'sender_link_1' }),
      expect.objectContaining({ linkUrl: 'https://creatorhub.unool.co/launch-kit' }),
      [],
      1,
      '@brand_account',
      true
    );
  });

  it('resolves post-linked brand_materials_pages slug before classifyAndGenerateReply in comment_reply', async () => {
    jobControlState.configuredLinkUrl = null;
    jobControlState.profiles = [{ subdomain: 'creatorhub', deleted_at: null }];
    jobControlState.brandPages = [
      { slug: 'launch-kit', theme: { linked_posts: [{ id: 'media_post_launch' }] }, is_published: true },
    ];

    const res = await POST(makeRequest({
      jobId: 'job_cmt_post_slug',
      jobType: 'comment_reply',
      workspaceId: 'ws_test_1',
      connectionId: 'conn_test_1',
      commentId: 'cmt_post_slug_1',
      mediaId: 'media_post_launch',
      commentText: 'link please!',
      commenterUsername: 'curious_dev',
    }));

    expect(res.status).toBe(200);
    expect(mockClassifyAndGenerateReply).toHaveBeenCalledWith(
      expect.objectContaining({ commentId: 'cmt_post_slug_1', mediaId: 'media_post_launch' }),
      '',
      expect.objectContaining({ linkUrl: 'https://creatorhub.unool.co/launch-kit' }),
      []
    );
  });

  it('enforces processDmFollowGate inside QStash dm_reply for prompt_follow and follow_confirmed', async () => {
    jobControlState.requireFollowForDm = true;
    jobControlState.configuredLinkUrl = null;
    jobControlState.profiles = [{ subdomain: 'creatorhub', deleted_at: null }];
    jobControlState.brandPages = [{ slug: 'vip-kit', theme: {}, is_published: true }];

    // 1) Unfollowed sender -> prompt_follow
    mockProcessDmFollowGate.mockResolvedValueOnce({
      handled: true,
      action: 'prompt_follow',
      replyText: 'Please follow @brand_account first! 👇',
      isFollowing: false,
      messageId: 'qr_qstash_1',
      resolvedUsername: 'qstash_fan',
    });

    const res1 = await POST(makeRequest({
      jobId: 'job_fg_prompt',
      jobType: 'dm_reply',
      workspaceId: 'ws_test_1',
      connectionId: 'conn_test_1',
      messageId: 'msg_fg_prompt_1',
      senderId: 'sender_fg_1',
      dmText: 'Send link',
    }));

    expect(res1.status).toBe(200);
    const json1 = await res1.json();
    expect(json1.followGateAction).toBe('prompt_follow');
    expect(mockClassifyAndReplyDM).not.toHaveBeenCalled();

    const promptGateCall = mockProcessDmFollowGate.mock.calls[0][0];
    expect(promptGateCall.config.linkUrl).toBe('https://creatorhub.unool.co/vip-kit');

    const dmPromptUpdate = supabaseCalls.find(c => c.table === 'instagram_dm_logs' && c.op === 'update');
    expect((dmPromptUpdate?.data as any)?.follow_verified).toBe(false);
    expect((dmPromptUpdate?.data as any)?.follow_status).toBe('not_following');
    expect((dmPromptUpdate?.data as any)?.sender_username).toBe('qstash_fan');

    // 2) Verified follower -> follow_confirmed delivers subdomain/slug link
    vi.clearAllMocks();
    supabaseCalls.length = 0;
    mockDecryptToken.mockResolvedValue('IGqx_VALID_TOKEN');
    mockCanReply.mockResolvedValue(true);
    mockRecordReply.mockResolvedValue(undefined);
    const { lexicalEntropyGuard } = await import('@/lib/services/automation/lexical');
    vi.mocked(lexicalEntropyGuard.getRecentReplies).mockResolvedValue([]);
    vi.mocked(lexicalEntropyGuard.isTooSimilar).mockReturnValue(false);
    mockProcessDmFollowGate.mockResolvedValueOnce({
      handled: true,
      action: 'follow_confirmed',
      replyText: 'Thanks for following! https://creatorhub.unool.co/vip-kit',
      isFollowing: true,
      messageId: 'dm_qstash_unlock_1',
    });

    const res2 = await POST(makeRequest({
      jobId: 'job_fg_confirm',
      jobType: 'dm_reply',
      workspaceId: 'ws_test_1',
      connectionId: 'conn_test_1',
      messageId: 'msg_fg_confirm_1',
      senderId: 'sender_fg_1',
      dmText: 'I Followed! ✅',
    }));

    expect(res2.status).toBe(200);
    const json2 = await res2.json();
    expect(json2.followGateAction).toBe('follow_confirmed');
    const dmUnlockUpdate = supabaseCalls.find(c => c.table === 'instagram_dm_logs' && c.op === 'update');
    expect((dmUnlockUpdate?.data as any)?.follow_verified).toBe(true);
    expect((dmUnlockUpdate?.data as any)?.follow_status).toBe('following');
    expect((dmUnlockUpdate?.data as any)?.auto_replied).toBe(true);
  });

  it('retries via 500 when QStash follow-gate send fails (!messageId) and queues human review when dm_auto_reply_enabled=false', async () => {
    jobControlState.requireFollowForDm = true;
    jobControlState.retryCount = 0;
    jobControlState.maxRetries = 3;
    mockProcessDmFollowGate.mockResolvedValueOnce({
      handled: true,
      action: 'prompt_follow',
      replyText: 'Please follow!',
      isFollowing: false,
      messageId: undefined,
    });

    const retryRes = await POST(makeRequest({
      jobId: 'job_fg_retry',
      jobType: 'dm_reply',
      workspaceId: 'ws_test_1',
      connectionId: 'conn_test_1',
      messageId: 'msg_fg_retry_1',
      senderId: 'sender_fg_2',
      dmText: 'link?',
    }));

    expect(retryRes.status).toBe(500);
    const retryJson = await retryRes.json();
    expect(retryJson.retryable).toBe(true);

    // When follow-gate bypasses (already unlocked) and dm_auto_reply_enabled=false -> queued for human review
    vi.clearAllMocks();
    supabaseCalls.length = 0;
    jobControlState.dmAutoReplyEnabled = false;
    mockDecryptToken.mockResolvedValue('IGqx_VALID_TOKEN');
    mockCanReply.mockResolvedValue(true);
    mockRecordReply.mockResolvedValue(undefined);
    const { lexicalEntropyGuard } = await import('@/lib/services/automation/lexical');
    vi.mocked(lexicalEntropyGuard.getRecentReplies).mockResolvedValue([]);
    vi.mocked(lexicalEntropyGuard.isTooSimilar).mockReturnValue(false);
    mockProcessDmFollowGate.mockResolvedValueOnce({ handled: false, isFollowing: true });

    const pausedRes = await POST(makeRequest({
      jobId: 'job_dm_paused',
      jobType: 'dm_reply',
      workspaceId: 'ws_test_1',
      connectionId: 'conn_test_1',
      messageId: 'msg_dm_paused_1',
      senderId: 'sender_fg_2',
      dmText: 'Thank you!',
    }));

    expect(pausedRes.status).toBe(200);
    const pausedJson = await pausedRes.json();
    expect(pausedJson.action).toBe('queued_for_human_review');
    expect(mockClassifyAndReplyDM).not.toHaveBeenCalled();
    const flagged = supabaseCalls.find(c => c.table === 'instagram_flagged_dms' && c.op === 'upsert');
    expect(flagged).toBeDefined();
    const logUpdate = supabaseCalls.find(c => c.table === 'instagram_dm_logs' && c.op === 'update');
    expect((logUpdate?.data as any)?.delivery_status).toBe('needs_review');
  });
});

