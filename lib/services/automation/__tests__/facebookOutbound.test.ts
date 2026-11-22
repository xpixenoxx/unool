import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockDecryptToken,
  mockGetPageAccessToken,
  mockPostCommentReply,
  mockSendPrivateReplyFromComment,
  mockSendMessengerMessage,
  mockHideComment,
  mockClassifyAndGenerateReply,
  mockClassifyAndReplyDM,
  mockResolveCreatorDeliveryLink,
  mockIsAutomationEnabledServer,
  supabaseCalls,
  dbState,
} = vi.hoisted(() => {
  const supabaseCalls: Array<{ table: string; op: string; data?: unknown; filters: Array<{ col: string; val: unknown }> }> = [];
  const dbState = {
    existingJob: null as any,
    fbConfig: {
      workspace_id: '11111111-1111-4111-8111-111111111111',
      page_id: 'page_123',
      enabled: true,
      auto_reply_comments: true,
      auto_reply_dm: true,
      auto_hide_spam: true,
      flag_negative: true,
      flag_spam: true,
      max_replies_per_hour: 20,
      dm_max_replies_per_hour: 20,
      link_url: null as string | null,
    } as any,
    wsSettings: null as any,
    connections: [
      {
        id: 'conn_1',
        workspace_id: '11111111-1111-4111-8111-111111111111',
        user_id: 'user_1',
        platform: 'facebook',
        username: 'creator_page',
        display_name: 'Creator Page',
        access_token_encrypted: 'enc_user_tok',
        status: 'connected',
      },
    ],
    commentLog: null as any,
    dmLog: null as any,
    dmHistory: [] as any[],
    velocityRow: null as any,
    recentReplies: [] as any[],
  };

  return {
    mockDecryptToken: vi.fn(),
    mockGetPageAccessToken: vi.fn(),
    mockPostCommentReply: vi.fn(),
    mockSendPrivateReplyFromComment: vi.fn(),
    mockSendMessengerMessage: vi.fn(),
    mockHideComment: vi.fn(),
    mockClassifyAndGenerateReply: vi.fn(),
    mockClassifyAndReplyDM: vi.fn(),
    mockResolveCreatorDeliveryLink: vi.fn(),
    mockIsAutomationEnabledServer: vi.fn(),
    supabaseCalls,
    dbState,
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/config/schema', () => ({
  config: {
    GROQ_API_KEY: 'test_groq_key',
    NEXT_PUBLIC_APP_URL: 'https://unool.co',
  },
}));

vi.mock('@/lib/feature-flags-server', () => ({
  isAutomationEnabledServer: (...args: unknown[]) => mockIsAutomationEnabledServer(...args),
}));

vi.mock('@/lib/crypto/encryption', () => ({
  decryptToken: (...args: unknown[]) => mockDecryptToken(...args),
}));

vi.mock('@/lib/platforms/FacebookAdapter', () => ({
  facebookAdapter: {
    getPageAccessToken: (...args: unknown[]) => mockGetPageAccessToken(...args),
    postCommentReply: (...args: unknown[]) => mockPostCommentReply(...args),
    sendPrivateReplyFromComment: (...args: unknown[]) => mockSendPrivateReplyFromComment(...args),
    sendMessengerMessage: (...args: unknown[]) => mockSendMessengerMessage(...args),
    hideComment: (...args: unknown[]) => mockHideComment(...args),
  },
}));

vi.mock('@/lib/services/InstagramCommentAutomation', () => ({
  InstagramCommentAutomation: class {
    async classifyAndGenerateReply(...args: unknown[]) {
      return mockClassifyAndGenerateReply(...args);
    }
    async classifyAndReplyDM(...args: unknown[]) {
      return mockClassifyAndReplyDM(...args);
    }
  },
}));

vi.mock('@/lib/services/automation/linkResolver', () => ({
  resolveCreatorDeliveryLink: (...args: unknown[]) => mockResolveCreatorDeliveryLink(...args),
}));

vi.mock('@/lib/services/QueueService', () => ({
  queueService: {
    isAvailable: () => false,
    enqueueFacebookOutboundTask: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: (table: string) => {
      const filters: Array<{ col: string; val: unknown }> = [];
      let isOrderAsc = false;
      const chain: any = {
        select: () => chain,
        eq: (col: string, val: unknown) => {
          filters.push({ col, val });
          return chain;
        },
        not: () => chain,
        limit: () => chain,
        order: (_col: string, opts?: { ascending?: boolean }) => {
          isOrderAsc = Boolean(opts?.ascending);
          return chain;
        },
        update: (data: unknown) => {
          supabaseCalls.push({ table, op: 'update', data, filters: [...filters] });
          return chain;
        },
        upsert: (data: unknown) => {
          supabaseCalls.push({ table, op: 'upsert', data, filters: [...filters] });
          return Promise.resolve({ error: null });
        },
        insert: (data: unknown) => {
          supabaseCalls.push({ table, op: 'insert', data, filters: [...filters] });
          return Promise.resolve({ error: null });
        },
        maybeSingle: () => {
          supabaseCalls.push({ table, op: 'maybeSingle', filters: [...filters] });
          if (table === 'facebook_outbound_jobs') return Promise.resolve({ data: dbState.existingJob, error: null });
          if (table === 'facebook_automation_config') return Promise.resolve({ data: dbState.fbConfig, error: null });
          if (table === 'workspaces') return Promise.resolve({ data: dbState.wsSettings ? { settings: dbState.wsSettings } : null, error: null });
          if (table === 'facebook_comment_logs') return Promise.resolve({ data: dbState.commentLog, error: null });
          if (table === 'facebook_dm_logs') return Promise.resolve({ data: dbState.dmLog, error: null });
          return Promise.resolve({ data: null, error: null });
        },
        single: () => {
          supabaseCalls.push({ table, op: 'single', filters: [...filters] });
          if (table === 'instagram_reply_velocity') return Promise.resolve({ data: dbState.velocityRow, error: null });
          return Promise.resolve({ data: null, error: null });
        },
        then: (resolve: (val: any) => void) => {
          supabaseCalls.push({ table, op: 'select', filters: [...filters] });
          if (table === 'platform_connections') return resolve({ data: dbState.connections, error: null });
          if (table === 'facebook_dm_logs') {
            return resolve({ data: isOrderAsc ? dbState.dmHistory : [], error: null });
          }
          if (table === 'facebook_comment_logs') {
            return resolve({ data: dbState.recentReplies, error: null });
          }
          return resolve({ data: [], error: null });
        },
      };
      return chain;
    },
  },
}));

import { processFacebookOutboundJob } from '../facebookOutbound';
import { VelocityThrottle } from '../velocity';
import { LexicalEntropyGuard } from '../lexical';

const WS_ID = '11111111-1111-4111-8111-111111111111';

describe('Facebook automation fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseCalls.length = 0;
    dbState.existingJob = null;
    dbState.fbConfig = {
      workspace_id: WS_ID,
      page_id: 'page_123',
      enabled: true,
      auto_reply_comments: true,
      auto_reply_dm: true,
      auto_hide_spam: true,
      flag_negative: true,
      flag_spam: true,
      max_replies_per_hour: 20,
      dm_max_replies_per_hour: 20,
      link_url: null,
    };
    dbState.wsSettings = null;
    dbState.commentLog = null;
    dbState.dmLog = null;
    dbState.dmHistory = [];
    dbState.velocityRow = null;
    dbState.recentReplies = [];

    mockIsAutomationEnabledServer.mockResolvedValue(true);
    mockDecryptToken.mockResolvedValue('fb_user_token');
    mockGetPageAccessToken.mockResolvedValue('fb_page_token');
    mockPostCommentReply.mockResolvedValue({ id: 'fb_reply_1' });
    mockSendPrivateReplyFromComment.mockResolvedValue({ message_id: 'fb_dm_1' });
    mockSendMessengerMessage.mockResolvedValue({ message_id: 'fb_msg_1' });
    mockHideComment.mockResolvedValue(undefined);
    mockResolveCreatorDeliveryLink.mockResolvedValue('https://creator.unool.co/kit');
    mockClassifyAndGenerateReply.mockResolvedValue({
      classification: 'question',
      confidence: 0.95,
      suggestedReply: 'Yes, webhooks work out of the box!',
      suggestedDM: null,
      threadHook: null,
      leadScore: 1,
      shouldAutoReply: true,
      shouldSendDM: false,
      shouldFlagForReview: false,
      reasoning: 'Product question',
    });
    mockClassifyAndReplyDM.mockResolvedValue({
      classification: 'question',
      confidence: 0.92,
      suggestedReply: 'Hey! Happy to walk you through it.',
      leadScore: 1,
      shouldAutoReply: true,
      shouldEscalate: false,
      reasoning: 'Direct question',
    });
  });

  it('strips fb:, fb-dm:, and threads: prefixes in VelocityThrottle so workspace_id stays a clean UUID', async () => {
    const throttle = new VelocityThrottle();
    await throttle.canReply(`fb:${WS_ID}`, 20);
    await throttle.canReply(`fb-dm:${WS_ID}`, 15);
    await throttle.canReply(`threads:${WS_ID}`, 25);

    const velocityQueries = supabaseCalls.filter((c) => c.table === 'instagram_reply_velocity' && c.op === 'single');
    expect(velocityQueries).toHaveLength(3);
    expect(velocityQueries[0].filters).toEqual(
      expect.arrayContaining([
        { col: 'workspace_id', val: WS_ID },
        { col: 'channel', val: 'fb_comment' },
      ])
    );
    expect(velocityQueries[1].filters).toEqual(
      expect.arrayContaining([
        { col: 'workspace_id', val: WS_ID },
        { col: 'channel', val: 'fb_dm' },
      ])
    );
    expect(velocityQueries[2].filters).toEqual(
      expect.arrayContaining([
        { col: 'workspace_id', val: WS_ID },
        { col: 'channel', val: 'threads_reply' },
      ])
    );
  });

  it('routes fb: keys in LexicalEntropyGuard to facebook_comment_logs with clean UUID and post_id', async () => {
    const guard = new LexicalEntropyGuard();
    await guard.getRecentReplies(`fb:${WS_ID}`, 15, 'post_999');

    const fbLogQueries = supabaseCalls.filter((c) => c.table === 'facebook_comment_logs' && c.op === 'select');
    expect(fbLogQueries.length).toBeGreaterThan(0);
    expect(fbLogQueries[0].filters).toEqual(
      expect.arrayContaining([
        { col: 'workspace_id', val: WS_ID },
        { col: 'post_id', val: 'post_999' },
      ])
    );
  });

  it('executes autoHideSpam for spam comments even though shouldAutoReply is false', async () => {
    mockClassifyAndGenerateReply.mockResolvedValueOnce({
      classification: 'spam',
      confidence: 0.99,
      suggestedReply: 'SKIP',
      suggestedDM: null,
      threadHook: null,
      leadScore: 0,
      shouldAutoReply: false,
      shouldSendDM: false,
      shouldFlagForReview: true,
      reasoning: 'Crypto spam',
    });

    const res = await processFacebookOutboundJob({
      jobId: 'job_spam_1',
      jobType: 'comment_reply',
      workspaceId: WS_ID,
      connectionId: 'conn_1',
      pageId: 'page_123',
      commentId: 'cmt_spam_1',
      commentText: 'MAKE $10000 NOW CLICK MY LINK',
    });

    const json = await res.json();
    expect(json.action).toBe('spam_hidden');
    expect(mockHideComment).toHaveBeenCalledWith('fb_page_token', 'cmt_spam_1', true);
    expect(mockPostCommentReply).not.toHaveBeenCalled();

    const logUpsert = supabaseCalls.find((c) => c.table === 'facebook_comment_logs' && c.op === 'upsert');
    expect((logUpsert?.data as any)?.post_id).toBe('');
  });

  it('respects auto_reply_dm=false on comment link_request and still uses resolved creator link when enabled', async () => {
    mockClassifyAndGenerateReply.mockResolvedValue({
      classification: 'link_request',
      confidence: 0.96,
      suggestedReply: 'Just sent you the resource!',
      suggestedDM: 'Here is the link: https://creator.unool.co/kit',
      threadHook: null,
      leadScore: 2,
      shouldAutoReply: true,
      shouldSendDM: true,
      shouldFlagForReview: false,
      reasoning: 'Link ask',
    });

    // 1) auto_reply_dm = false -> public reply only, NO private DM
    dbState.fbConfig.auto_reply_dm = false;
    await processFacebookOutboundJob({
      jobId: 'job_link_no_dm',
      jobType: 'comment_reply',
      workspaceId: WS_ID,
      connectionId: 'conn_1',
      pageId: 'page_123',
      commentId: 'cmt_link_1',
      postId: 'post_1',
      commentText: 'Send link pls',
    });
    expect(mockPostCommentReply).toHaveBeenCalledTimes(1);
    expect(mockSendPrivateReplyFromComment).not.toHaveBeenCalled();

    // 2) auto_reply_dm = true with null cfg.link_url -> resolves creator link and sends private DM
    vi.clearAllMocks();
    mockIsAutomationEnabledServer.mockResolvedValue(true);
    mockDecryptToken.mockResolvedValue('fb_user_token');
    mockGetPageAccessToken.mockResolvedValue('fb_page_token');
    mockPostCommentReply.mockResolvedValue({ id: 'fb_reply_2' });
    mockSendPrivateReplyFromComment.mockResolvedValue({ message_id: 'fb_dm_2' });
    mockResolveCreatorDeliveryLink.mockResolvedValue('https://creator.unool.co/kit');
    mockClassifyAndGenerateReply.mockResolvedValue({
      classification: 'link_request',
      confidence: 0.96,
      suggestedReply: 'Check your Messenger inbox for the guide!',
      suggestedDM: 'Here is the link: https://creator.unool.co/kit',
      threadHook: null,
      leadScore: 2,
      shouldAutoReply: true,
      shouldSendDM: true,
      shouldFlagForReview: false,
      reasoning: 'Link ask',
    });
    dbState.fbConfig.auto_reply_dm = true;
    dbState.fbConfig.link_url = null;

    await processFacebookOutboundJob({
      jobId: 'job_link_with_dm',
      jobType: 'comment_reply',
      workspaceId: WS_ID,
      connectionId: 'conn_1',
      pageId: 'page_123',
      commentId: 'cmt_link_2',
      postId: 'post_1',
      commentText: 'Send link pls',
    });
    expect(mockSendPrivateReplyFromComment).toHaveBeenCalledWith(
      'fb_page_token',
      'page_123',
      'cmt_link_2',
      'Here is the link: https://creator.unool.co/kit'
    );
  });

  it('uses classifyAndReplyDM for messenger_reply and writes facebook_dm_logs without non-existent updated_at', async () => {
    dbState.dmHistory = [
      { message_text: 'Hi', ai_reply: 'Hey! How can I help?', escalated: false },
    ];

    const res = await processFacebookOutboundJob({
      jobId: 'job_dm_1',
      jobType: 'messenger_reply',
      workspaceId: WS_ID,
      connectionId: 'conn_1',
      pageId: 'page_123',
      messageId: 'mid_1',
      senderId: 'psid_999',
      dmText: 'What is the price?',
    });

    expect(res.status).toBe(200);
    expect(mockClassifyAndReplyDM).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: 'mid_1', senderId: 'psid_999', text: 'What is the price?' }),
      expect.objectContaining({ dmAutoReplyEnabled: true, linkUrl: 'https://creator.unool.co/kit' }),
      [
        { role: 'user', text: 'Hi' },
        { role: 'assistant', text: 'Hey! How can I help?' },
      ],
      2,
      'Creator Page',
      true
    );
    expect(mockClassifyAndGenerateReply).not.toHaveBeenCalled();
    expect(mockSendMessengerMessage).toHaveBeenCalledWith(
      'fb_page_token',
      'page_123',
      'psid_999',
      'Hey! Happy to walk you through it.'
    );

    const dmUpsert = supabaseCalls.find((c) => c.table === 'facebook_dm_logs' && c.op === 'upsert');
    expect(dmUpsert).toBeDefined();
    expect((dmUpsert?.data as any)?.updated_at).toBeUndefined();
    expect((dmUpsert?.data as any)?.auto_replied).toBe(true);
  });

  it('skips processing when global admin automation kill-switch is off', async () => {
    mockIsAutomationEnabledServer.mockResolvedValueOnce(false);
    const res = await processFacebookOutboundJob({
      jobId: 'job_killed',
      jobType: 'comment_reply',
      workspaceId: WS_ID,
      connectionId: 'conn_1',
      pageId: 'page_123',
      commentId: 'cmt_killed',
      commentText: 'Hello',
    });
    const json = await res.json();
    expect(json.action).toBe('automation_disabled_by_admin');
    expect(mockPostCommentReply).not.toHaveBeenCalled();
  });
});
