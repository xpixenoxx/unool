import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const {
  mockGetUser,
  mockVerifyWorkspaceAccess,
  mockDecryptToken,
  mockClassifyAndGenerateReply,
  mockPostPublicReply,
  mockSendDmForComment,
  mockCanReply,
  mockRecordReply,
  supabaseState,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockVerifyWorkspaceAccess: vi.fn(),
  mockDecryptToken: vi.fn(),
  mockClassifyAndGenerateReply: vi.fn(),
  mockPostPublicReply: vi.fn(),
  mockSendDmForComment: vi.fn(),
  mockCanReply: vi.fn(),
  mockRecordReply: vi.fn(),
  supabaseState: {
    commentLogRows: [] as Array<Record<string, any>>,
    upsertedCommentLogs: [] as Array<Record<string, any>>,
    updatedCommentLogs: [] as Array<{ payload: Record<string, any>; commentId?: string }>,
    existingByCommentId: {} as Record<string, Array<Record<string, any>>>,
    automationConfig: {
      enabled: true,
      auto_reply_positive: true,
      auto_reply_questions: true,
      auto_reply_link_requests: true,
      auto_reply_purchase_intent: true,
      require_follow_for_dm: false,
      link_url: 'https://unool.co/test',
      thread_chaining_enabled: true,
    } as Record<string, any>,
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/config/schema', () => ({
  config: {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test_service_key',
    GROQ_API_KEY: 'test_groq_key',
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
  }),
}));

vi.mock('@/lib/auth/workspaceAccess', () => ({
  verifyWorkspaceAccess: (...args: unknown[]) => mockVerifyWorkspaceAccess(...args),
}));

vi.mock('@/lib/crypto/encryption', () => ({
  decryptToken: (...args: unknown[]) => mockDecryptToken(...args),
}));

vi.mock('@/lib/feature-flags-server', () => ({
  isAutomationEnabledServer: async () => true,
}));

vi.mock('@/lib/services/automation/velocity', () => ({
  velocityThrottle: {
    canReply: (...args: unknown[]) => mockCanReply(...args),
    recordReply: (...args: unknown[]) => mockRecordReply(...args),
  },
}));

vi.mock('@/lib/services/automation/lexical', () => ({
  lexicalEntropyGuard: {
    getRecentReplies: async () => [],
    isTooSimilar: () => false,
    recordReply: () => undefined,
  },
}));

vi.mock('@/lib/services/automation/linkResolver', () => ({
  resolveCreatorDeliveryLink: async () => 'https://unool.co/test',
}));

vi.mock('@/lib/ai/ContentGuard', () => ({
  ContentGuard: {
    validateComment: () => ({
      safe: true,
      violation: { level: 'none', code: '', message: '', internal: '' },
    }),
    sanitizeOutput: (t: string) => t,
  },
}));

vi.mock('@/lib/ai/engines/ContentHumanizer', () => ({
  ContentHumanizer: {
    humanize: (t: string) => ({ humanized: t }),
  },
}));

vi.mock('@/lib/services/InstagramCommentAutomation', () => ({
  DEFAULT_AUTOMATION_CONFIG: {
    enabled: false,
    autoReplyPositive: true,
    autoReplyQuestions: true,
    autoReplyLinkRequests: true,
    autoReplyPurchaseIntent: true,
    flagNegative: true,
    flagSpam: true,
    maxRepliesPerHour: 30,
    jitterMinSeconds: 5,
    jitterMaxSeconds: 30,
    threadChainingEnabled: true,
  },
  InstagramCommentAutomation: class {
    static subscribeAccountToWebhook = async () => true;
    async classifyAndGenerateReply(...args: unknown[]) {
      return mockClassifyAndGenerateReply(...args);
    }
    async postPublicReply(...args: unknown[]) {
      return mockPostPublicReply(...args);
    }
    async sendDmForComment(...args: unknown[]) {
      return mockSendDmForComment(...args);
    }
  },
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: (table: string) => {
      let eqCommentId: string | undefined;
      let isSelectCount = false;

      const chain: any = {
        select: (_cols?: string, opts?: { count?: string }) => {
          if (opts?.count === 'exact') isSelectCount = true;
          return chain;
        },
        eq: (col: string, val: any) => {
          if (col === 'comment_id') eqCommentId = val;
          return chain;
        },
        not: () => chain,
        or: () => chain,
        ilike: () => chain,
        order: () => chain,
        range: () => chain,
        limit: () => chain,
        single: () => {
          if (table === 'instagram_automation_config') {
            return Promise.resolve({ data: supabaseState.automationConfig, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        },
        upsert: (payload: Record<string, any>) => {
          if (table === 'instagram_comment_logs') {
            supabaseState.upsertedCommentLogs.push(payload);
          }
          return Promise.resolve({ error: null });
        },
        update: (payload: Record<string, any>) => {
          const updateChain: any = {
            eq: (col: string, val: any) => {
              if (table === 'instagram_comment_logs' && col === 'comment_id') {
                supabaseState.updatedCommentLogs.push({ payload, commentId: val });
              }
              return Promise.resolve({ error: null });
            },
          };
          return updateChain;
        },
        then: (resolve: (val: any) => any) => {
          if (table === 'platform_connections') {
            return Promise.resolve({
              data: [
                {
                  id: 'conn_1',
                  workspace_id: 'ws_1',
                  platform: 'instagram',
                  platform_user_id: 'ig_brand_1',
                  username: 'avadika_senakkay',
                  access_token_encrypted: 'enc_tok',
                  status: 'connected',
                },
              ],
              error: null,
            }).then(resolve);
          }
          if (table === 'instagram_comment_logs') {
            if (eqCommentId !== undefined) {
              return Promise.resolve({
                data: supabaseState.existingByCommentId[eqCommentId] || [],
                error: null,
              }).then(resolve);
            }
            return Promise.resolve({
              data: supabaseState.commentLogRows,
              count: isSelectCount ? supabaseState.commentLogRows.length : null,
              error: null,
            }).then(resolve);
          }
          return Promise.resolve({ data: [], error: null }).then(resolve);
        },
      };
      return chain;
    },
  },
}));

import { GET as getComments } from '@/app/api/instagram/comments/route';
import { POST as syncComments } from '@/app/api/instagram/sync/route';

describe('Dispatch Ledger: /api/instagram/comments & /api/instagram/sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseState.commentLogRows = [];
    supabaseState.upsertedCommentLogs = [];
    supabaseState.updatedCommentLogs = [];
    supabaseState.existingByCommentId = {};
    supabaseState.automationConfig.require_follow_for_dm = false;

    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_1' } } });
    mockVerifyWorkspaceAccess.mockResolvedValue(true);
    mockDecryptToken.mockResolvedValue('IGQX_VALID_TOKEN');
    mockCanReply.mockResolvedValue(true);
    mockRecordReply.mockResolvedValue(undefined);
    mockClassifyAndGenerateReply.mockResolvedValue({
      classification: 'link_request',
      confidence: 0.96,
      suggestedReply: "Sounds like you're ready to grab it!",
      suggestedDM: 'Here is the link: https://unool.co/test',
      threadHook: 'Which part are you excited to try?',
      leadScore: 2,
      shouldAutoReply: true,
      shouldSendDM: true,
      shouldFlagForReview: false,
      reasoning: 'User requested link',
    });
    mockPostPublicReply.mockResolvedValue({ replyId: 'reply_999' });
    mockSendDmForComment.mockResolvedValue({ messageId: 'dm_999' });
  });

  it('GET /api/instagram/comments sets no-store cache headers and returns logs', async () => {
    supabaseState.commentLogRows = [
      {
        id: 'log_1',
        comment_id: 'cmt_1',
        comment_text: 'hey i want it',
        commenter_username: 'swiha_sri',
        classification: 'link_request',
        auto_replied: true,
        dm_sent: true,
        flagged_for_review: false,
      },
    ];

    const req = new NextRequest(
      'https://unool.co/api/instagram/comments?workspaceId=ws_1&page=1&limit=25&classification=all&search=swiha_sri'
    );
    const res = await getComments(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('no-store');
    const json = await res.json();
    expect(json.comments).toHaveLength(1);
    expect(json.comments[0].commenter_username).toBe('swiha_sri');
    expect(json.stats.total).toBe(1);
  });

  it('POST /api/instagram/sync logs pending/missing comments and updates auto_replied after reply', async () => {
    supabaseState.existingByCommentId = {
      cmt_pending: [
        {
          id: 'log_pending',
          workspace_id: 'ws_1',
          auto_replied: false,
          classification: 'pending',
          delivery_status: 'queued',
        },
      ],
      cmt_done: [
        {
          id: 'log_done',
          workspace_id: 'ws_1',
          auto_replied: true,
          classification: 'positive',
          delivery_status: 'sent',
        },
      ],
    };

    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/me?fields=')) {
        return new Response(
          JSON.stringify({ id: 'ig_brand_1', username: 'avadika_senakkay', account_type: 'BUSINESS' }),
          { status: 200 }
        );
      }
      if (url.includes('/subscribed_apps')) {
        return new Response(JSON.stringify({ data: [{ subscribed_fields: ['comments', 'messages'] }] }), {
          status: 200,
        });
      }
      if (url.includes('/me/media')) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: 'media_1',
                caption: 'hey good afternoon',
                comments_count: 3,
                comments: {
                  data: [
                    {
                      id: 'cmt_pending',
                      text: 'hey i want it',
                      from: { id: 'u_swiha', username: 'swiha_sri' },
                    },
                    {
                      id: 'cmt_done',
                      text: '🙌',
                      from: { id: 'u_charan', username: 'hello._.charan' },
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const req = new NextRequest('https://unool.co/api/instagram/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ workspaceId: 'ws_1' }),
    });
    const res = await syncComments(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.newCommentsProcessed).toBe(1);
    expect(json.repliesPosted).toBe(1);

    // cmt_pending was re-processed and logged, cmt_done was skipped
    expect(supabaseState.upsertedCommentLogs).toHaveLength(1);
    expect(supabaseState.upsertedCommentLogs[0].comment_id).toBe('cmt_pending');
    expect(supabaseState.updatedCommentLogs.some((u) => u.commentId === 'cmt_pending' && u.payload.auto_replied === true)).toBe(true);
    expect(supabaseState.updatedCommentLogs.some((u) => u.commentId === 'cmt_pending' && u.payload.dm_sent === true)).toBe(true);

    vi.unstubAllGlobals();
  });

  it('POST /api/instagram/sync avoids duplicate public reply when requireFollowForDm is enabled', async () => {
    supabaseState.automationConfig.require_follow_for_dm = true;

    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('/me?fields=')) {
        return new Response(
          JSON.stringify({ id: 'ig_brand_1', username: 'avadika_senakkay' }),
          { status: 200 }
        );
      }
      if (url.includes('/subscribed_apps')) {
        return new Response(JSON.stringify({ data: [{ subscribed_fields: ['comments'] }] }), { status: 200 });
      }
      if (url.includes('/me/media')) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: 'media_2',
                comments_count: 1,
                comments: {
                  data: [
                    {
                      id: 'cmt_link_new',
                      text: 'hi link please',
                      from: { id: 'u_swiha', username: 'swiha_sri' },
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const req = new NextRequest('https://unool.co/api/instagram/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ workspaceId: 'ws_1' }),
    });
    const res = await syncComments(req);
    expect(res.status).toBe(200);
    expect(mockPostPublicReply).toHaveBeenCalledTimes(1);
    expect(mockSendDmForComment).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
