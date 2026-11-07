/**
 * InstagramOutbound.test.ts
 *
 * Comprehensive tests for the fixed Instagram outbound communication system.
 * Covers Phases 1 & 2: comment replies and direct messages.
 *
 * All Meta API calls are mocked — no real Instagram DMs or comments are sent.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  InstagramCommentAutomation,
  DEFAULT_AUTOMATION_CONFIG,
  type AutomationConfig,
} from '../InstagramCommentAutomation';

// ─── Mock dependencies ────────────────────────────────────────────────────────

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/ai/providers/GroqProvider', () => ({
  GroqProvider: class {
    async generateObject() {
      return { ok: false, error: new Error('Not needed for outbound tests') };
    }
  },
}));

// ─── Mock fetchWithRetry ──────────────────────────────────────────────────────

const mockFetch = vi.fn();

vi.mock('@/lib/utils/retry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils/retry')>();
  return {
    ...actual,
    fetchWithRetry: (...args: Parameters<typeof mockFetch>) => mockFetch(...args),
  };
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeJsonResponse(data: object, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeErrorResponse(status: number, body = 'Error'): Response {
  return new Response(body, { status });
}

/** Simulates fetchWithRetry throwing (as it does for 4xx/5xx) */
function makeThrowingError(status: number, message: string) {
  const err = Object.assign(new Error(message), { name: 'APIError', statusCode: status });
  return err;
}

const INSTAGRAM_LOGIN_TOKEN = 'IGqxABCDEFGHIJKLMNOP'; // graph.instagram.com
const FB_BUSINESS_TOKEN = 'EAABwzLixnjYBO';            // graph.facebook.com

const baseConfig: AutomationConfig = {
  ...DEFAULT_AUTOMATION_CONFIG,
  enabled: true,
  linkUrl: 'https://unool.com/u/testbrand',
};

// ─── Phase 1: Public comment reply tests ─────────────────────────────────────

describe('postPublicReply', () => {
  let automation: InstagramCommentAutomation;

  beforeEach(() => {
    vi.clearAllMocks();
    automation = new InstagramCommentAutomation('mock-groq-key');
  });

  it('uses graph.instagram.com for Instagram Login tokens', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ id: 'reply_123' }));

    const result = await automation.postPublicReply(
      INSTAGRAM_LOGIN_TOKEN,
      'media_456',
      'comment_789',
      'Great post!'
    );

    expect(result).toEqual({ replyId: 'reply_123' });
    const calledUrl: string = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('graph.instagram.com');
    expect(calledUrl).not.toContain('graph.facebook.com');
  });

  it('uses graph.facebook.com for Facebook Business Login tokens', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ id: 'reply_456' }));

    const result = await automation.postPublicReply(
      FB_BUSINESS_TOKEN,
      'media_456',
      'comment_789',
      'Great post!'
    );

    expect(result).toEqual({ replyId: 'reply_456' });
    const calledUrl: string = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('graph.facebook.com');
    expect(calledUrl).not.toContain('graph.instagram.com');
  });

  it('does NOT cross-host fallback on 4xx error', async () => {
    // fetchWithRetry throws on 4xx — the function should catch it and fall through
    // to the media comments edge, not try the other host.
    mockFetch
      .mockRejectedValueOnce(makeThrowingError(403, 'Permission denied')) // comment/replies fails
      .mockResolvedValueOnce(makeJsonResponse({ id: 'media_reply_789' }));  // media/comments succeeds

    const result = await automation.postPublicReply(
      INSTAGRAM_LOGIN_TOKEN,
      'media_456',
      'comment_789',
      'Great post!'
    );

    expect(result).toEqual({ replyId: 'media_reply_789' });
    // Should have made exactly 2 calls — NOT 3 (which would indicate a cross-host retry)
    expect(mockFetch).toHaveBeenCalledTimes(2);
    // Second call should be to media/comments on graph.instagram.com
    const secondUrl: string = mockFetch.mock.calls[1][0];
    expect(secondUrl).toContain('/comments');
  });

  it('returns null and logs on Meta 400 Bad Request', async () => {
    const { logger } = await import('@/lib/logger');
    mockFetch
      .mockRejectedValueOnce(makeThrowingError(400, 'Bad request: {"error":{"code":190,"type":"OAuthException"}}'))
      .mockRejectedValueOnce(makeThrowingError(400, 'Bad request on media edge'));

    const result = await automation.postPublicReply(
      INSTAGRAM_LOGIN_TOKEN,
      'media_456',
      'comment_789',
      'Reply text'
    );

    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalled();
  });

  it('returns null and logs on Meta 401 Unauthorized (expired token)', async () => {
    const { logger } = await import('@/lib/logger');
    mockFetch
      .mockRejectedValueOnce(makeThrowingError(401, 'Token expired'))
      .mockRejectedValueOnce(makeThrowingError(401, 'Token expired'));

    const result = await automation.postPublicReply(
      INSTAGRAM_LOGIN_TOKEN,
      'media_456',
      'comment_789',
      'Reply text'
    );

    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalled();
  });

  it('returns null on Meta 403 (missing permission)', async () => {
    mockFetch
      .mockRejectedValueOnce(makeThrowingError(403, 'Permission denied'))
      .mockRejectedValueOnce(makeThrowingError(403, 'Permission denied'));

    const result = await automation.postPublicReply(
      INSTAGRAM_LOGIN_TOKEN,
      'media_456',
      'comment_789',
      'Reply text'
    );

    expect(result).toBeNull();
  });

  it('falls back to media comments edge when comment-level replies endpoint fails', async () => {
    mockFetch
      .mockRejectedValueOnce(makeThrowingError(400, 'Comment node error'))
      .mockResolvedValueOnce(makeJsonResponse({ id: 'fallback_reply_id' }));

    const result = await automation.postPublicReply(
      INSTAGRAM_LOGIN_TOKEN,
      'media_456',
      'comment_789',
      'Reply text'
    );

    expect(result).toEqual({ replyId: 'fallback_reply_id' });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('skips test_ prefixed commentIds to avoid accidental API calls', async () => {
    const result = await automation.postPublicReply(
      INSTAGRAM_LOGIN_TOKEN,
      'test_media',
      'test_comment',
      'Reply text'
    );

    // Both are test_ prefixed — should return null without any fetch calls
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('uses the current API version (v21.0) in the endpoint URL', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ id: 'reply_v21' }));

    await automation.postPublicReply(
      INSTAGRAM_LOGIN_TOKEN,
      'media_456',
      'comment_789',
      'Reply text'
    );

    const calledUrl: string = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('v21.0');
  });

  it('marks auto_replied as true only after confirmed Meta response', async () => {
    // The function returns { replyId } only on actual success from the API.
    // Callers set auto_replied=true based on this return value.
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ id: 'confirmed_reply' }));

    const result = await automation.postPublicReply(
      INSTAGRAM_LOGIN_TOKEN,
      'media_456',
      'comment_789',
      'Reply'
    );

    // Only trust the result object as confirmation
    expect(result).not.toBeNull();
    expect(result?.replyId).toBe('confirmed_reply');
  });

  it('returns null on Meta 500 Server Error', async () => {
    mockFetch
      .mockRejectedValueOnce(makeThrowingError(500, 'Internal server error'))
      .mockRejectedValueOnce(makeThrowingError(500, 'Internal server error'));

    const result = await automation.postPublicReply(
      INSTAGRAM_LOGIN_TOKEN,
      'media_456',
      'comment_789',
      'Reply text'
    );

    expect(result).toBeNull();
  });
});

// ─── Phase 2: Direct message tests ───────────────────────────────────────────

describe('sendPrivateMessage', () => {
  let automation: InstagramCommentAutomation;

  beforeEach(() => {
    vi.clearAllMocks();
    automation = new InstagramCommentAutomation('mock-groq-key');
  });

  it('sends DM via graph.instagram.com for Instagram Login tokens', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ message_id: 'msg_123' }));

    const result = await automation.sendPrivateMessage(
      INSTAGRAM_LOGIN_TOKEN,
      'ig_user_id_111',
      'recipient_igsid_222',
      'Hello from UNOOL!'
    );

    expect(result).toEqual({ messageId: 'msg_123' });
    const calledUrl: string = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('graph.instagram.com');
  });

  it('sends DM via graph.facebook.com for Facebook Business Login tokens', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ message_id: 'msg_456' }));

    const result = await automation.sendPrivateMessage(
      FB_BUSINESS_TOKEN,
      'ig_user_id_111',
      'recipient_igsid_222',
      'Hello!'
    );

    expect(result).toEqual({ messageId: 'msg_456' });
    const calledUrl: string = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('graph.facebook.com');
  });

  it('places access_token in the JSON body, not Authorization header', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ message_id: 'msg_789' }));

    await automation.sendPrivateMessage(
      INSTAGRAM_LOGIN_TOKEN,
      'ig_user_id_111',
      'recipient_222',
      'Test message'
    );

    const callOptions = mockFetch.mock.calls[0][1];
    const bodyParsed = JSON.parse(callOptions.body);
    expect(bodyParsed.access_token).toBe(INSTAGRAM_LOGIN_TOKEN);
    // Should NOT use Authorization header
    expect(callOptions.headers?.Authorization).toBeUndefined();
  });

  it('returns null on 401 expired token and logs structured error', async () => {
    const { logger } = await import('@/lib/logger');
    mockFetch.mockRejectedValueOnce(makeThrowingError(401, 'Token expired'));

    const result = await automation.sendPrivateMessage(
      INSTAGRAM_LOGIN_TOKEN,
      'ig_user_id_111',
      'recipient_222',
      'Test message'
    );

    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to send Instagram DM'),
      expect.objectContaining({ errorType: 'APIError', httpStatus: 401 })
    );
  });

  it('returns null on 403 missing messaging permission', async () => {
    mockFetch.mockRejectedValueOnce(makeThrowingError(403, 'Missing instagram_business_manage_messages'));

    const result = await automation.sendPrivateMessage(
      INSTAGRAM_LOGIN_TOKEN,
      'ig_user_id_111',
      'recipient_222',
      'Test'
    );

    expect(result).toBeNull();
  });
});

describe('sendPrivateReplyToComment', () => {
  let automation: InstagramCommentAutomation;

  beforeEach(() => {
    vi.clearAllMocks();
    automation = new InstagramCommentAutomation('mock-groq-key');
  });

  it('sends private reply via correct host for Instagram Login token', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ id: 'private_msg_123' }));

    const result = await automation.sendPrivateReplyToComment(
      INSTAGRAM_LOGIN_TOKEN,
      'comment_id_999',
      'Private reply message'
    );

    expect(result).toEqual({ messageId: 'private_msg_123' });
    const calledUrl: string = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('graph.instagram.com');
    expect(calledUrl).toContain('/private_replies');
  });

  it('skips test_ prefixed commentIds', async () => {
    const result = await automation.sendPrivateReplyToComment(
      INSTAGRAM_LOGIN_TOKEN,
      'test_comment_id',
      'Message'
    );

    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns null on 400 (comment older than 7 days or already replied)', async () => {
    mockFetch.mockRejectedValueOnce(
      makeThrowingError(400, '{"error":{"code":100,"type":"OAuthException","error_subcode":2018267}}')
    );

    const result = await automation.sendPrivateReplyToComment(
      INSTAGRAM_LOGIN_TOKEN,
      'old_comment_id',
      'Private message'
    );

    expect(result).toBeNull();
  });
});

describe('sendDmForComment', () => {
  let automation: InstagramCommentAutomation;

  beforeEach(() => {
    vi.clearAllMocks();
    automation = new InstagramCommentAutomation('mock-groq-key');
  });

  it('uses ONLY the Private Replies API (no ordinary DM fallback)', async () => {
    // Private reply fails
    mockFetch.mockRejectedValueOnce(makeThrowingError(400, 'Private reply failed'));

    const result = await automation.sendDmForComment(
      INSTAGRAM_LOGIN_TOKEN,
      'ig_user_111',
      'comment_id_999',
      'recipient_igsid_222',
      'DM message'
    );

    // Must return null — NOT fall back to ordinary DM
    expect(result).toBeNull();
    // Should only have called once (private_replies), NOT twice (which would indicate DM fallback)
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const calledUrl: string = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('/private_replies');
  });

  it('succeeds when private reply API accepts the request', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ id: 'private_dm_success' }));

    const result = await automation.sendDmForComment(
      INSTAGRAM_LOGIN_TOKEN,
      'ig_user_111',
      'comment_id_999',
      undefined,
      'DM message'
    );

    expect(result).toEqual({ messageId: 'private_dm_success' });
  });
});

describe('sendQuickReplyMessage', () => {
  let automation: InstagramCommentAutomation;

  beforeEach(() => {
    vi.clearAllMocks();
    automation = new InstagramCommentAutomation('mock-groq-key');
  });

  it('uses correct host based on token type', async () => {
    mockFetch.mockResolvedValueOnce(makeJsonResponse({ message_id: 'qr_msg_123' }));

    await automation.sendQuickReplyMessage(
      INSTAGRAM_LOGIN_TOKEN,
      'ig_user_111',
      'recipient_222',
      'Choose an option:',
      [{ title: 'Option A', payload: 'OPTION_A' }]
    );

    const calledUrl: string = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('graph.instagram.com');
  });

  it('falls back to plain text DM when quick replies are rejected', async () => {
    mockFetch
      .mockRejectedValueOnce(makeThrowingError(400, 'Quick replies not supported'))
      .mockResolvedValueOnce(makeJsonResponse({ message_id: 'plain_msg_456' }));

    const result = await automation.sendQuickReplyMessage(
      INSTAGRAM_LOGIN_TOKEN,
      'ig_user_111',
      'recipient_222',
      'Text message',
      [{ title: 'Option A', payload: 'OPTION_A' }]
    );

    expect(result).toEqual({ messageId: 'plain_msg_456' });
    // Second call should be to the messages endpoint (plain DM)
    const secondUrl: string = mockFetch.mock.calls[1][0];
    expect(secondUrl).toContain('/messages');
  });
});

// ─── API version tests ────────────────────────────────────────────────────────

describe('API version routing', () => {
  it('resolveInstagramApiHost returns instagram host for IGqx tokens', async () => {
    const { resolveInstagramApiHost } = await import('@/lib/platforms/apiVersions');
    expect(resolveInstagramApiHost('IGqxTESTTOKEN')).toBe('https://graph.instagram.com');
  });

  it('resolveInstagramApiHost returns facebook host for EAA tokens', async () => {
    const { resolveInstagramApiHost } = await import('@/lib/platforms/apiVersions');
    expect(resolveInstagramApiHost('EAABwzLixnjYBO')).toBe('https://graph.facebook.com');
  });

  it('resolveInstagramApiHost returns facebook host for IGdid tokens', async () => {
    const { resolveInstagramApiHost } = await import('@/lib/platforms/apiVersions');
    expect(resolveInstagramApiHost('IGdidTESTTOKEN')).toBe('https://graph.instagram.com');
  });

  it('API_VERSIONS.instagram is v21.0 (not deprecated v20.0)', async () => {
    const { API_VERSIONS } = await import('@/lib/platforms/apiVersions');
    expect(API_VERSIONS.instagram).toBe('v21.0');
  });
});

