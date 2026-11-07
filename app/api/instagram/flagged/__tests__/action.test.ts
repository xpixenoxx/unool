import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const {
  mockPostPublicReply,
  mockSendPrivateMessage,
  mockDecryptToken,
  mockVerifyWorkspaceAccess,
  mockGetUser,
  supabaseCalls,
  itemControlState,
} = vi.hoisted(() => {
  const mockPostPublicReply = vi.fn();
  const mockSendPrivateMessage = vi.fn();
  const mockDecryptToken = vi.fn();
  const mockVerifyWorkspaceAccess = vi.fn();
  const mockGetUser = vi.fn();
  const supabaseCalls: Array<{ table: string; op: string; data?: unknown }> = [];

  const itemControlState = {
    isDm: false,
    itemStatus: 'pending',
    commentId: 'cmt_flagged_1',
    messageId: 'msg_flagged_1',
  };

  return {
    mockPostPublicReply,
    mockSendPrivateMessage,
    mockDecryptToken,
    mockVerifyWorkspaceAccess,
    mockGetUser,
    supabaseCalls,
    itemControlState,
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/auth/workspaceAccess', () => ({
  verifyWorkspaceAccess: (...args: unknown[]) => mockVerifyWorkspaceAccess(...args),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: () => Promise.resolve({
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
    },
  }),
}));

vi.mock('@/lib/crypto/encryption', () => ({
  decryptToken: (...args: unknown[]) => mockDecryptToken(...args),
}));

vi.mock('@/lib/services/InstagramCommentAutomation', () => ({
  InstagramCommentAutomation: class {
    async postPublicReply(...args: unknown[]) { return mockPostPublicReply(...args); }
    async sendPrivateMessage(...args: unknown[]) { return mockSendPrivateMessage(...args); }
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      function makeChain(result: any) {
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          limit: () => chain,
          update: (data: unknown) => {
            supabaseCalls.push({ table, op: 'update', data });
            return chain;
          },
          single: () => Promise.resolve(result),
          then: (res: (val: any) => any, rej?: (reason: any) => any) => Promise.resolve(result).then(res, rej),
        };
        return chain;
      }

      if (table === 'instagram_flagged_comments') {
        if (itemControlState.isDm) {
          return makeChain({ data: null, error: { message: 'Not found' } });
        }
        return makeChain({
          data: {
            id: 'flagged_cmt_row_1',
            workspace_id: 'ws_test_1',
            comment_id: itemControlState.commentId,
            media_id: 'media_123',
            comment_text: 'Need pricing info',
            commenter_username: 'prospect_1',
            suggested_reply: 'Our pricing starts at $49/mo',
            reasoning: 'Flagged for review',
            status: itemControlState.itemStatus,
          },
          error: null,
        });
      }

      if (table === 'instagram_flagged_dms') {
        if (!itemControlState.isDm) {
          return makeChain({ data: null, error: { message: 'Not found' } });
        }
        return makeChain({
          data: {
            id: 'flagged_dm_row_1',
            workspace_id: 'ws_test_1',
            message_id: itemControlState.messageId,
            sender_id: 'sender_999',
            sender_username: 'direct_prospect',
            message_text: 'Can we talk on phone?',
            ai_suggested_reply: 'We offer phone support on Pro tier.',
            reasoning: 'Flagged for escalation',
            status: itemControlState.itemStatus,
          },
          error: null,
        });
      }

      if (table === 'platform_connections') {
        return makeChain({
          data: [{
            id: 'conn_1',
            workspace_id: 'ws_test_1',
            platform: 'instagram',
            platform_user_id: 'ig_brand_1',
            access_token_encrypted: 'enc_token_1',
            status: 'connected',
          }],
          error: null,
        });
      }

      if (table === 'instagram_comment_logs' || table === 'instagram_dm_logs') {
        return makeChain({ data: null, error: null });
      }

      return makeChain({ data: null, error: null });
    },
  }),
}));

import { POST } from '../[id]/action/route';

function makeRequest(id: string, body: object): NextRequest {
  return new NextRequest(`https://app.unool.co/api/instagram/flagged/${id}/action`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/instagram/flagged/[id]/action', () => {
  beforeEach(() => {
    supabaseCalls.length = 0;
    itemControlState.isDm = false;
    itemControlState.itemStatus = 'pending';

    mockGetUser.mockResolvedValue({ data: { user: { id: 'user_123' } }, error: null });
    mockVerifyWorkspaceAccess.mockResolvedValue(true);
    mockDecryptToken.mockResolvedValue('IGqx_VALID_TOKEN');
    mockPostPublicReply.mockResolvedValue({ replyId: 'reply_789' });
    mockSendPrivateMessage.mockResolvedValue({ messageId: 'msg_789' });
  });

  it('approves a flagged comment: posts reply and synchronizes both tables', async () => {
    itemControlState.isDm = false;

    const res = await POST(
      makeRequest('flagged_cmt_row_1', { action: 'approve', workspaceId: 'ws_test_1' }),
      { params: Promise.resolve({ id: 'flagged_cmt_row_1' }) }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.status).toBe('replied');

    expect(mockPostPublicReply).toHaveBeenCalledWith(
      'IGqx_VALID_TOKEN',
      'media_123',
      'cmt_flagged_1',
      'Our pricing starts at $49/mo',
      'prospect_1'
    );

    // Verify instagram_flagged_comments updated to replied
    const flaggedUpdates = supabaseCalls.filter(c => c.table === 'instagram_flagged_comments' && c.op === 'update');
    expect(flaggedUpdates.some(u => (u.data as any)?.status === 'replied')).toBe(true);

    // Phase 5 verification: verify instagram_comment_logs synchronized with auto_replied = true
    const logUpdates = supabaseCalls.filter(c => c.table === 'instagram_comment_logs' && c.op === 'update');
    expect(logUpdates.some(u => (u.data as any)?.auto_replied === true)).toBe(true);
  });

  it('replies to a flagged DM: sends message and synchronizes both tables', async () => {
    itemControlState.isDm = true;

    const res = await POST(
      makeRequest('flagged_dm_row_1', {
        action: 'reply',
        ownerReply: 'Yes, call us at +1-800-UNOOL',
        workspaceId: 'ws_test_1',
      }),
      { params: Promise.resolve({ id: 'flagged_dm_row_1' }) }
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.status).toBe('replied');

    expect(mockSendPrivateMessage).toHaveBeenCalledWith(
      'IGqx_VALID_TOKEN',
      'ig_brand_1',
      'sender_999',
      'Yes, call us at +1-800-UNOOL'
    );

    // Verify instagram_flagged_dms updated to replied
    const flaggedUpdates = supabaseCalls.filter(c => c.table === 'instagram_flagged_dms' && c.op === 'update');
    expect(flaggedUpdates.some(u => (u.data as any)?.status === 'replied')).toBe(true);

    // Phase 5 verification: verify instagram_dm_logs synchronized with auto_replied = true
    const logUpdates = supabaseCalls.filter(c => c.table === 'instagram_dm_logs' && c.op === 'update');
    expect(logUpdates.some(u => (u.data as any)?.auto_replied === true)).toBe(true);
  });

  it('handles failed outbound send: preserves pending state and writes error diagnostic reasoning', async () => {
    itemControlState.isDm = false;
    mockPostPublicReply.mockResolvedValue(null); // Graph API fails

    const res = await POST(
      makeRequest('flagged_cmt_row_1', { action: 'approve', workspaceId: 'ws_test_1' }),
      { params: Promise.resolve({ id: 'flagged_cmt_row_1' }) }
    );

    expect(res.status).toBe(500);

    // Must NOT have marked status as replied
    const flaggedUpdates = supabaseCalls.filter(c => c.table === 'instagram_flagged_comments' && c.op === 'update');
    const repliedUpdate = flaggedUpdates.find(u => (u.data as any)?.status === 'replied');
    expect(repliedUpdate).toBeUndefined();

    // Must have updated reasoning with failure details so operator sees WHY it failed
    const reasoningUpdate = flaggedUpdates.find(u => typeof (u.data as any)?.reasoning === 'string');
    expect(reasoningUpdate).toBeDefined();
    expect((reasoningUpdate?.data as any).reasoning).toContain('failed');
  });

  it('rejects an item without sending outbound message', async () => {
    itemControlState.isDm = false;

    const res = await POST(
      makeRequest('flagged_cmt_row_1', { action: 'reject', workspaceId: 'ws_test_1' }),
      { params: Promise.resolve({ id: 'flagged_cmt_row_1' }) }
    );

    expect(res.status).toBe(200);
    expect(mockPostPublicReply).not.toHaveBeenCalled();

    const flaggedUpdates = supabaseCalls.filter(c => c.table === 'instagram_flagged_comments' && c.op === 'update');
    expect(flaggedUpdates.some(u => (u.data as any)?.status === 'rejected')).toBe(true);
  });
});
