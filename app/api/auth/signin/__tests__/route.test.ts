import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockSelectQuery = {
  eq: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
};

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        listUsers: vi.fn(),
        updateUserById: vi.fn(),
        generateLink: vi.fn(() => Promise.resolve({
          data: { properties: { hashed_token: 'mock-hashed-token' } },
          error: null,
        })),
      },
    },
    from: vi.fn(() => ({
      select: vi.fn(() => mockSelectQuery),
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  },
}));

vi.mock('@/lib/auth/rate-limits', () => ({
  checkOtpGenerateLimit: vi.fn(),
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('@/lib/auth/password', () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
  needsPasswordRehash: vi.fn(() => false),
}));

vi.mock('@/lib/auth/otp', () => ({
  issueOtp: vi.fn(),
  isResendCoolingDown: vi.fn(),
}));

vi.mock('@/lib/auth/email', () => ({
  sendOtpEmail: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      verifyOtp: vi.fn(() => Promise.resolve({
        data: {
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
            expires_at: 9999999999,
            user: { id: 'user-1', email: 'test@example.com' },
          },
        },
        error: null,
      })),
      signInWithPassword: vi.fn(() => Promise.resolve({
        data: {
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
            expires_at: 9999999999,
            user: { id: 'user-1', email: 'test@example.com' },
          },
        },
        error: null,
      })),
    },
  })),
}));

import { POST } from '../route';
import { verifyPassword } from '@/lib/auth/password';
import { checkOtpGenerateLimit } from '@/lib/auth/rate-limits';
import { isResendCoolingDown } from '@/lib/auth/otp';
import { sendOtpEmail } from '@/lib/auth/email';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';
import { logger } from '@/lib/logger';

describe('POST /api/auth/signin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOtpGenerateLimit).mockResolvedValue({ allowed: true, retryAfterMs: 0 });
    vi.mocked(isResendCoolingDown).mockResolvedValue(false);
    vi.mocked(sendOtpEmail).mockResolvedValue(true as any);
    vi.mocked(supabaseAdmin.auth.admin.generateLink).mockResolvedValue({
      data: { properties: { hashed_token: 'mock-hashed-token' } } as any,
      error: null,
    });
    vi.mocked(supabaseAdmin.auth.admin.updateUserById).mockResolvedValue({
      data: { user: {} as any },
      error: null,
    });
    vi.mocked(createServerClient).mockReturnValue({
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({
          data: {
            session: {
              access_token: 'mock-token',
              refresh_token: 'mock-refresh',
              expires_at: 9999999999,
              user: { id: 'user-1', email: 'test@example.com' },
            },
          },
          error: null,
        }),
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            session: {
              access_token: 'mock-token',
              refresh_token: 'mock-refresh',
              expires_at: 9999999999,
              user: { id: 'user-1', email: 'test@example.com' },
            },
          },
          error: null,
        }),
      },
    } as any);
  });

  it('returns 403 and contactUrl when user account is deleted', async () => {
    vi.mocked(supabaseAdmin.auth.admin.listUsers).mockResolvedValue({
      data: {
        users: [
          {
            id: 'deleted-user-1',
            email: 'deleted@example.com',
            email_confirmed_at: '2026-01-01T00:00:00Z',
            user_metadata: {
              password_hash: '$argon2id$mock-hash',
              is_deleted: true,
            },
          } as any,
        ],
        aud: '',
      },
      error: null,
    });
    vi.mocked(verifyPassword).mockResolvedValue(true);

    const req = new NextRequest('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'deleted@example.com', password: 'Password123!' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.code).toBe('account_deleted');
    expect(data.message).toBe('Session creation failed. Contact Unool team');
    expect(data.contactUrl).toBe('https://unool.co/contact');
  });

  it('returns 403 and contactUrl when user account is suspended', async () => {
    vi.mocked(supabaseAdmin.auth.admin.listUsers).mockResolvedValue({
      data: {
        users: [
          {
            id: 'suspended-user-1',
            email: 'suspended@example.com',
            email_confirmed_at: '2026-01-01T00:00:00Z',
            banned_until: '2099-01-01T00:00:00Z',
            user_metadata: {
              password_hash: '$argon2id$mock-hash',
            },
          } as any,
        ],
        aud: '',
      },
      error: null,
    });
    vi.mocked(verifyPassword).mockResolvedValue(true);

    const req = new NextRequest('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'suspended@example.com', password: 'Password123!' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.code).toBe('account_suspended');
    expect(data.message).toBe('Account suspended. Contact Unool team');
    expect(data.contactUrl).toBe('https://unool.co/contact');
  });

  it('returns 401 when password does not match', async () => {
    vi.mocked(supabaseAdmin.auth.admin.listUsers).mockResolvedValue({
      data: {
        users: [
          {
            id: 'user-1',
            email: 'user@example.com',
            email_confirmed_at: '2026-01-01T00:00:00Z',
            user_metadata: {
              password_hash: '$argon2id$mock-hash',
            },
          } as any,
        ],
        aud: '',
      },
      error: null,
    });
    vi.mocked(verifyPassword).mockResolvedValue(false);

    const req = new NextRequest('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'WrongPassword' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invalid email or password.');
  });

  it('returns 401 with informative message when account is Google-linked and has no password', async () => {
    vi.mocked(supabaseAdmin.auth.admin.listUsers).mockResolvedValue({
      data: {
        users: [
          {
            id: 'google-user-1',
            email: 'googleuser@example.com',
            email_confirmed_at: '2026-01-01T00:00:00Z',
            app_metadata: { provider: 'google', providers: ['google'] },
            user_metadata: {},
          } as any,
        ],
        aud: '',
      },
      error: null,
    });

    const req = new NextRequest('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'googleuser@example.com', password: 'SomePassword123!' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.code).toBe('oauth_account');
    expect(data.message).toContain('Continue with Google');
  });

  it('signs in directly and issues session cookies when MFA is disabled', async () => {
    vi.mocked(supabaseAdmin.auth.admin.listUsers).mockResolvedValue({
      data: {
        users: [
          {
            id: 'user-mfa-disabled',
            email: 'user@example.com',
            email_confirmed_at: '2026-01-01T00:00:00Z',
            user_metadata: {
              password_hash: '$argon2id$mock-hash',
              mfa_enabled: false,
            },
          } as any,
        ],
        aud: '',
      },
      error: null,
    });
    vi.mocked(verifyPassword).mockResolvedValue(true);

    const req = new NextRequest('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'CorrectPassword123!' }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(vi.mocked(logger.error).mock.calls).toEqual([]);
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.session?.access_token).toBe('mock-token');
    expect(supabaseAdmin.auth.admin.generateLink).toHaveBeenCalledWith({
      type: 'magiclink',
      email: 'user@example.com',
    });
  });

  it('falls back to signInWithPassword if generateLink fails and signs in', async () => {
    vi.mocked(supabaseAdmin.auth.admin.listUsers).mockResolvedValue({
      data: {
        users: [
          {
            id: 'user-fallback',
            email: 'fallback@example.com',
            email_confirmed_at: '2026-01-01T00:00:00Z',
            user_metadata: {
              password_hash: '$argon2id$mock-hash',
              mfa_enabled: false,
            },
          } as any,
        ],
        aud: '',
      },
      error: null,
    });
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(supabaseAdmin.auth.admin.generateLink).mockResolvedValueOnce({
      data: null as any,
      error: { message: 'Magiclink generation disabled' } as any,
    });
    vi.mocked(supabaseAdmin.auth.admin.updateUserById).mockResolvedValueOnce({
      data: { user: {} as any },
      error: null,
    });

    const req = new NextRequest('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'fallback@example.com', password: 'CorrectPassword123!' }),
    });

    const res = await POST(req);
    const data = await res.json();
    expect(vi.mocked(logger.error).mock.calls).toEqual([]);
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.session?.access_token).toBe('mock-token');
    expect(supabaseAdmin.auth.admin.updateUserById).toHaveBeenCalled();
  });
});
