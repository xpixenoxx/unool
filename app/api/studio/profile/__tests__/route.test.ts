import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const { mockGetCurrentAuth, mockFindByWorkspaceId, mockCreate, mockUpdate } = vi.hoisted(() => ({
  mockGetCurrentAuth: vi.fn(),
  mockFindByWorkspaceId: vi.fn(),
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  getCurrentAuth: (req: any) => mockGetCurrentAuth(req),
}));

vi.mock('@/lib/repositories/supabase/SupabaseProfileRepository', () => {
  return {
    SupabaseProfileRepository: vi.fn().mockImplementation(() => ({
      findByWorkspaceId: mockFindByWorkspaceId,
      create: mockCreate,
      update: mockUpdate,
    })),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/config/schema', () => ({
  config: {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test_service_key',
    NODE_ENV: 'test',
  },
}));

import { GET, PUT } from '../route';

describe('/api/studio/profile route handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validProfilePayload = {
    role: 'Founder',
    doing: 'Tech startup',
    audience: 'Investors',
    tone: 'Calm expert',
    style: 'Short & punchy',
    interests: ['Cricket', 'Travel'],
  };

  describe('GET', () => {
    it('returns 401 if unauthorized', async () => {
      mockGetCurrentAuth.mockResolvedValue(null);
      const req = new NextRequest('http://localhost:3000/api/studio/profile');
      const res = await GET(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Unauthorized');
    });

    it('returns empty profile if no profile in workspace', async () => {
      mockGetCurrentAuth.mockResolvedValue({ userId: 'u1', workspaceId: 'w1' });
      mockFindByWorkspaceId.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/studio/profile');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.profile).toBeNull();
      expect(json.isCompleted).toBe(false);
    });

    it('returns studioProfile if found', async () => {
      mockGetCurrentAuth.mockResolvedValue({ userId: 'u1', workspaceId: 'w1' });
      mockFindByWorkspaceId.mockResolvedValue({
        id: 'p1',
        workspaceId: 'w1',
        userId: 'u1',
        studioProfile: {
          ...validProfilePayload,
          completedAt: '2026-10-15T10:00:00.000Z',
        },
      });

      const req = new NextRequest('http://localhost:3000/api/studio/profile');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.isCompleted).toBe(true);
      expect(json.profile.role).toBe('Founder');
    });
  });

  describe('PUT', () => {
    it('returns 401 if unauthorized', async () => {
      mockGetCurrentAuth.mockResolvedValue(null);
      const req = new NextRequest('http://localhost:3000/api/studio/profile', {
        method: 'PUT',
        body: JSON.stringify(validProfilePayload),
      });
      const res = await PUT(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 when missing required string fields', async () => {
      mockGetCurrentAuth.mockResolvedValue({ userId: 'u1', workspaceId: 'w1' });
      const req = new NextRequest('http://localhost:3000/api/studio/profile', {
        method: 'PUT',
        body: JSON.stringify({ ...validProfilePayload, role: '' }),
      });
      const res = await PUT(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('role');
    });

    it('returns 400 when any field exceeds 80 characters', async () => {
      mockGetCurrentAuth.mockResolvedValue({ userId: 'u1', workspaceId: 'w1' });
      const req = new NextRequest('http://localhost:3000/api/studio/profile', {
        method: 'PUT',
        body: JSON.stringify({ ...validProfilePayload, doing: 'X'.repeat(81) }),
      });
      const res = await PUT(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('exceeds maximum length of 80 characters');
    });

    it('returns 400 when interests is empty or invalid', async () => {
      mockGetCurrentAuth.mockResolvedValue({ userId: 'u1', workspaceId: 'w1' });
      const req = new NextRequest('http://localhost:3000/api/studio/profile', {
        method: 'PUT',
        body: JSON.stringify({ ...validProfilePayload, interests: [] }),
      });
      const res = await PUT(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.toLowerCase()).toContain('interest');
    });

    it('validates and saves valid profile successfully', async () => {
      mockGetCurrentAuth.mockResolvedValue({ userId: 'u1', workspaceId: 'w1' });
      mockFindByWorkspaceId.mockResolvedValue({
        id: 'p1',
        workspaceId: 'w1',
        userId: 'u1',
        version: 1,
      });
      mockUpdate.mockResolvedValue({
        id: 'p1',
        studioProfile: {
          ...validProfilePayload,
          completedAt: '2026-10-15T10:00:00.000Z',
        },
      });

      const req = new NextRequest('http://localhost:3000/api/studio/profile', {
        method: 'PUT',
        body: JSON.stringify(validProfilePayload),
      });
      const res = await PUT(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.isCompleted).toBe(true);
      expect(json.profile.role).toBe('Founder');
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });
  });
});
