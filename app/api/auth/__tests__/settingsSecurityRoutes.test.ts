import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const {
  mockGetCurrentAuth,
  mockCheckRateLimit,
  mockGetUserPasswordHash,
  mockSaveUserPasswordHash,
  mockValidatePassword,
  mockVerifyPassword,
  mockHashPassword,
  mockGetUserSecurityVersion,
  mockBumpUserSecurityVersion,
  mockVerifyAccountSwitchToken,
  mockRequireWorkspaceRole,
  mockSignOut,
  mockAdminSignOut,
  mockCreateSupabaseServerClient,
  mockGetSession,
  mockGetUser,
  mockFrom,
  mockRpc,
  mockGetUserById,
  mockUpdateUserById,
  mockListFactors,
  mockListUsers,
} = vi.hoisted(() => ({
  mockGetCurrentAuth: vi.fn(),
  mockCheckRateLimit: vi.fn(),
  mockGetUserPasswordHash: vi.fn(),
  mockSaveUserPasswordHash: vi.fn(),
  mockValidatePassword: vi.fn(),
  mockVerifyPassword: vi.fn(),
  mockHashPassword: vi.fn(),
  mockGetUserSecurityVersion: vi.fn(),
  mockBumpUserSecurityVersion: vi.fn(),
  mockVerifyAccountSwitchToken: vi.fn(),
  mockRequireWorkspaceRole: vi.fn(),
  mockSignOut: vi.fn(),
  mockAdminSignOut: vi.fn(),
  mockCreateSupabaseServerClient: vi.fn(),
  mockGetSession: vi.fn(),
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
  mockGetUserById: vi.fn(),
  mockUpdateUserById: vi.fn(),
  mockListFactors: vi.fn(),
  mockListUsers: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  getCurrentAuth: mockGetCurrentAuth,
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: mockCheckRateLimit,
  rateLimitHeaders: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/auth/credentials', () => ({
  getUserPasswordHash: mockGetUserPasswordHash,
  saveUserPasswordHash: mockSaveUserPasswordHash,
}));

vi.mock('@/lib/auth/password', () => ({
  validatePassword: mockValidatePassword,
  verifyPassword: mockVerifyPassword,
  hashPassword: mockHashPassword,
}));

vi.mock('@/lib/auth/security-version', () => ({
  getUserSecurityVersion: mockGetUserSecurityVersion,
  bumpUserSecurityVersion: mockBumpUserSecurityVersion,
}));

vi.mock('@/lib/auth/account-switch-token', () => ({
  createAccountSwitchToken: vi.fn().mockReturnValue('mock-switch-token'),
  verifyAccountSwitchToken: mockVerifyAccountSwitchToken,
}));

vi.mock('@/lib/auth/workspaceAccess', () => ({
  requireWorkspaceRole: mockRequireWorkspaceRole,
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: mockCreateSupabaseServerClient,
}));

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: mockFrom,
    rpc: mockRpc,
    auth: {
      admin: {
        getUserById: mockGetUserById,
        updateUserById: mockUpdateUserById,
        signOut: mockAdminSignOut,
        listUsers: mockListUsers,
        mfa: {
          listFactors: mockListFactors,
        },
      },
    },
  },
}));

import { POST as changePasswordPost } from '@/app/api/auth/change-password/route';
import { POST as switchAccountPost } from '@/app/api/auth/switch-account/route';
import { GET as securityEventsGet } from '@/app/api/auth/security-events/route';
import { POST as revokeOthersPost } from '@/app/api/auth/sessions/revoke-others/route';

function makeDefaultTableChain() {
  const result = { data: null, error: null };
  const chain: any = {
    select: vi.fn(() => chain),
    insert: vi.fn().mockResolvedValue(result),
    update: vi.fn(() => chain),
    upsert: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    is: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
  };
  return chain;
}

describe('Settings security API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ success: true, remaining: 10, reset: 60 });
    mockValidatePassword.mockReturnValue(null);
    mockGetUserSecurityVersion.mockResolvedValue(1);
    mockBumpUserSecurityVersion.mockResolvedValue(2);
    mockGetUserById.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com', user_metadata: {} } },
      error: null,
    });
    mockUpdateUserById.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com', user_metadata: {} } },
      error: null,
    });
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
      error: null,
    });
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'access-tok-1', user: { id: 'user-1' } } },
      error: null,
    });
    mockSignOut.mockResolvedValue({ error: null });
    mockAdminSignOut.mockResolvedValue({ error: null });
    mockCreateSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: mockGetUser,
        getSession: mockGetSession,
        signOut: mockSignOut,
      },
    });
    mockRpc.mockResolvedValue({ data: null, error: null });
    mockFrom.mockImplementation(() => makeDefaultTableChain());
    mockListFactors.mockResolvedValue({ data: { factors: [] }, error: null });
  });

  describe('POST /api/auth/change-password', () => {
    it('blocks unauthenticated callers and impersonated sessions', async () => {
      mockGetCurrentAuth.mockResolvedValueOnce(null);
      const unauthReq = new NextRequest('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: 'OldPassword1!', newPassword: 'NewPassword2@' }),
      });
      expect((await changePasswordPost(unauthReq)).status).toBe(401);

      mockGetCurrentAuth.mockResolvedValueOnce({
        userId: 'user-1',
        workspaceId: 'ws-1',
        email: 'user@example.com',
        isImpersonated: true,
      });
      const impReq = new NextRequest('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: 'OldPassword1!', newPassword: 'NewPassword2@' }),
      });
      const impRes = await changePasswordPost(impReq);
      expect(impRes.status).toBe(403);
      expect((await impRes.json()).code).toBe('IMPERSONATION_BLOCKED');
    });

    it('rejects missing password hash or mismatched current password', async () => {
      mockGetCurrentAuth.mockResolvedValue({
        userId: 'user-1',
        workspaceId: 'ws-1',
        email: 'user@example.com',
        isImpersonated: false,
      });

      mockGetUserPasswordHash.mockResolvedValueOnce({ hash: null, source: 'none' });
      const noHashReq = new NextRequest('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: 'OldPassword1!', newPassword: 'NewPassword2@' }),
      });
      const noHashRes = await changePasswordPost(noHashReq);
      expect(noHashRes.status).toBe(400);

      mockGetUserPasswordHash.mockResolvedValueOnce({ hash: '$argon2id$hash', source: 'table' });
      mockVerifyPassword.mockResolvedValueOnce(false);
      const wrongReq = new NextRequest('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: 'WrongPassword1!', newPassword: 'NewPassword2@' }),
      });
      const wrongRes = await changePasswordPost(wrongReq);
      expect(wrongRes.status).toBe(403);
    });

    it('updates password hash, bumps security_version, revokes other sessions, and returns no-store headers', async () => {
      mockGetCurrentAuth.mockResolvedValue({
        userId: 'user-1',
        workspaceId: 'ws-1',
        email: 'user@example.com',
        isImpersonated: false,
      });
      mockGetUserPasswordHash.mockResolvedValue({ hash: '$argon2id$old', source: 'table' });
      mockVerifyPassword.mockResolvedValue(true);
      mockHashPassword.mockResolvedValue('$argon2id$new');
      mockSaveUserPasswordHash.mockResolvedValue({
        persistedInTable: true,
        persistedInMetadataFallback: false,
      });
      mockFrom.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      const req = new NextRequest('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: 'OldPassword1!', newPassword: 'NewPassword2@' }),
      });
      const res = await changePasswordPost(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(res.headers.get('cache-control')).toContain('no-store');
      expect(mockSaveUserPasswordHash).toHaveBeenCalledWith(
        'user-1',
        '$argon2id$new',
        expect.anything()
      );
      expect(mockBumpUserSecurityVersion).toHaveBeenCalledWith('user-1');
      expect(mockSignOut).toHaveBeenCalledWith({ scope: 'others' });
    });
  });

  describe('POST /api/auth/switch-account', () => {
    it('rejects stale tokens after security_version bump and blocks MFA-protected accounts', async () => {
      mockVerifyAccountSwitchToken.mockReturnValueOnce({
        userId: 'user-1',
        email: 'user@example.com',
        securityVersion: 1,
      });
      mockGetUserById.mockResolvedValueOnce({
        data: { user: { id: 'user-1', email: 'user@example.com', user_metadata: {} } },
        error: null,
      });
      mockGetUserSecurityVersion.mockResolvedValueOnce(2);

      const staleReq = new NextRequest('http://localhost:3000/api/auth/switch-account', {
        method: 'POST',
        body: JSON.stringify({ switchToken: 'tok-1' }),
      });
      const staleRes = await switchAccountPost(staleReq);
      expect(staleRes.status).toBe(401);
      expect((await staleRes.json()).code).toBe('SESSION_REVOKED');

      mockVerifyAccountSwitchToken.mockReturnValueOnce({
        userId: 'user-1',
        email: 'user@example.com',
        securityVersion: 2,
      });
      mockGetUserById.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-1',
            email: 'user@example.com',
            user_metadata: { mfa_enabled: true },
          },
        },
        error: null,
      });
      mockGetUserSecurityVersion.mockResolvedValueOnce(2);

      const mfaReq = new NextRequest('http://localhost:3000/api/auth/switch-account', {
        method: 'POST',
        body: JSON.stringify({ switchToken: 'tok-2' }),
      });
      const mfaRes = await switchAccountPost(mfaReq);
      expect(mfaRes.status).toBe(403);
      expect((await mfaRes.json()).code).toBe('MFA_REQUIRED');
    });
  });

  describe('GET /api/auth/security-events', () => {
    it('returns 401 unauthenticated and degrades cleanly pre-migration', async () => {
      mockGetCurrentAuth.mockResolvedValueOnce(null);
      const unauthRes = await securityEventsGet(
        new NextRequest('http://localhost:3000/api/auth/security-events')
      );
      expect(unauthRes.status).toBe(401);

      mockGetCurrentAuth.mockResolvedValueOnce({
        userId: 'user-1',
        workspaceId: 'ws-1',
        email: 'user@example.com',
        isImpersonated: false,
      });
      mockRequireWorkspaceRole.mockResolvedValueOnce({
        allowed: false,
        reason: 'insufficient_role',
        role: 'viewer',
      });
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'relation "workspace_security_events" does not exist' },
                }),
              }),
            }),
          }),
        }),
      });

      const res = await securityEventsGet(
        new NextRequest('http://localhost:3000/api/auth/security-events')
      );
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.events).toEqual([]);
      expect(body.source).toBe('pre-migration');
    });
  });

  describe('POST /api/auth/sessions/revoke-others', () => {
    it('blocks impersonation and revokes other sessions for the authenticated user', async () => {
      mockGetCurrentAuth.mockResolvedValueOnce({
        userId: 'user-1',
        workspaceId: 'ws-1',
        email: 'user@example.com',
        isImpersonated: true,
      });
      const impRes = await revokeOthersPost(
        new NextRequest('http://localhost:3000/api/auth/sessions/revoke-others', { method: 'POST' })
      );
      expect(impRes.status).toBe(403);
      expect((await impRes.json()).code).toBe('IMPERSONATION_BLOCKED');

      mockGetCurrentAuth.mockResolvedValueOnce({
        userId: 'user-1',
        workspaceId: 'ws-1',
        email: 'user@example.com',
        isImpersonated: false,
      });
      mockFrom.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      const okRes = await revokeOthersPost(
        new NextRequest('http://localhost:3000/api/auth/sessions/revoke-others', { method: 'POST' })
      );
      const okBody = await okRes.json();
      expect(okRes.status).toBe(200);
      expect(okBody.success).toBe(true);
      expect(mockBumpUserSecurityVersion).toHaveBeenCalledWith('user-1');
      expect(mockSignOut).toHaveBeenCalledWith({ scope: 'others' });
    });
  });
});