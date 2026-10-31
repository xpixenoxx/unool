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
        deleteUser: vi.fn(() => Promise.resolve({ error: null })),
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
  validatePassword: vi.fn(() => null),
  hashPassword: vi.fn(() => Promise.resolve('$argon2id$mock-hash')),
}));

vi.mock('@/lib/auth/otp', () => ({
  issueSignupOtp: vi.fn(() => Promise.resolve({ otp: '123456' })),
}));

vi.mock('@/lib/auth/email', () => ({
  sendOtpEmail: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { POST } from '../route';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { checkOtpGenerateLimit } from '@/lib/auth/rate-limits';

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkOtpGenerateLimit).mockResolvedValue({ allowed: true, retryAfterMs: 0 });
  });

  it('allows a soft-deleted account to re-register with the same email', async () => {
    vi.mocked(supabaseAdmin.auth.admin.listUsers).mockResolvedValue({
      data: {
        users: [
          {
            id: 'deleted-user-1',
            email: 'deleted@example.com',
            email_confirmed_at: '2026-01-01T00:00:00Z',
            user_metadata: {
              is_deleted: true,
            },
          } as any,
        ],
        aud: '',
      },
      error: null,
    });

    const req = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New User Name',
        email: 'deleted@example.com',
        password: 'ValidPassword123!',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    // Verified that deleteUser was called to clean up old deleted user
    expect(supabaseAdmin.auth.admin.deleteUser).toHaveBeenCalledWith('deleted-user-1');
  });

  it('blocks active verified accounts from re-registering', async () => {
    vi.mocked(supabaseAdmin.auth.admin.listUsers).mockResolvedValue({
      data: {
        users: [
          {
            id: 'active-user-1',
            email: 'active@example.com',
            email_confirmed_at: '2026-01-01T00:00:00Z',
            user_metadata: {
              is_deleted: false,
            },
          } as any,
        ],
        aud: '',
      },
      error: null,
    });

    const req = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Active User',
        email: 'active@example.com',
        password: 'ValidPassword123!',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.alreadyRegistered).toBe(true);
  });
});

