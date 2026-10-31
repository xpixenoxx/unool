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
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyPassword } from '@/lib/auth/password';
import { checkOtpGenerateLimit } from '@/lib/auth/rate-limits';
import { isResendCoolingDown } from '@/lib/auth/otp';
import { sendOtpEmail } from '@/lib/auth/email';

describe('POST /api/auth/signin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOtpGenerateLimit).mockResolvedValue({ allowed: true, retryAfterMs: 0 });
    vi.mocked(isResendCoolingDown).mockResolvedValue(false);
    vi.mocked(sendOtpEmail).mockResolvedValue(true as any);
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
    expect(data.message).toBe('account_deleted');
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
    expect(data.message).toBe('account_suspended');
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
});
