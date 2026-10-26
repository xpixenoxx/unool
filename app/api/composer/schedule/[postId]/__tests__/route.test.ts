import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const {
  mockGetCurrentAuth,
  mockFindById,
  mockFindVariantsByPostId,
  mockCancelScheduledPost,
  mockReschedulePost,
} = vi.hoisted(() => ({
  mockGetCurrentAuth: vi.fn(),
  mockFindById: vi.fn(),
  mockFindVariantsByPostId: vi.fn(),
  mockCancelScheduledPost: vi.fn(),
  mockReschedulePost: vi.fn(),
}));

vi.mock('@/lib/auth/server', () => ({
  getCurrentAuth: (req: any) => mockGetCurrentAuth(req),
}));

vi.mock('@/lib/repositories/supabase/SupabasePostRepository', () => ({
  SupabasePostRepository: vi.fn().mockImplementation(() => ({
    findById: mockFindById,
    findVariantsByPostId: mockFindVariantsByPostId,
  })),
}));

vi.mock('@/lib/services/ScheduleService', () => ({
  scheduleService: {
    cancelScheduledPost: mockCancelScheduledPost,
    reschedulePost: mockReschedulePost,
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { GET, DELETE, PATCH } from '../route';

describe('/api/composer/schedule/[postId] route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns 401 when unauthorized', async () => {
      mockGetCurrentAuth.mockResolvedValue(null);
      const req = new NextRequest('http://localhost:3000/api/composer/schedule/p-1');
      const res = await GET(req, { params: Promise.resolve({ postId: 'p-1' }) });
      expect(res.status).toBe(401);
    });

    it('returns 404 when post is not found or wrong workspace', async () => {
      mockGetCurrentAuth.mockResolvedValue({ workspaceId: 'ws-1', userId: 'u-1' });
      mockFindById.mockResolvedValue(null);

      const req = new NextRequest('http://localhost:3000/api/composer/schedule/p-1');
      const res = await GET(req, { params: Promise.resolve({ postId: 'p-1' }) });
      expect(res.status).toBe(404);
    });

    it('returns shaped CanvasPost with effective published status if variant is published', async () => {
      mockGetCurrentAuth.mockResolvedValue({ workspaceId: 'ws-1', userId: 'u-1' });
      mockFindById.mockResolvedValue({
        id: 'p-1',
        workspaceId: 'ws-1',
        content: 'Draft content for week',
        status: 'draft',
        scheduledAt: null,
        scheduleStrategy: 'cascading',
        arcId: 'arc-1',
        createdAt: new Date('2026-10-26T10:00:00Z'),
      });
      mockFindVariantsByPostId.mockResolvedValue([
        {
          id: 'v-1',
          platform: 'bluesky',
          adaptedContent: 'Adapted bluesky copy',
          status: 'published',
          scheduledAt: null,
          autoFirstComment: null,
          firstCommentHint: null,
          error: null,
          mediaUrls: [],
          hashtagStrategy: ['growth'],
        },
      ]);

      const req = new NextRequest('http://localhost:3000/api/composer/schedule/p-1');
      const res = await GET(req, { params: Promise.resolve({ postId: 'p-1' }) });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.post.postId).toBe('p-1');
      expect(body.post.status).toBe('published'); // Effective status computed
      expect(body.post.platforms).toHaveLength(1);
      expect(body.post.platforms[0].platform).toBe('bluesky');
    });
  });

  describe('DELETE', () => {
    it('prevents cancelling or deleting a post that has already been published', async () => {
      mockGetCurrentAuth.mockResolvedValue({ workspaceId: 'ws-1', userId: 'u-1' });
      mockFindById.mockResolvedValue({
        id: 'p-published',
        workspaceId: 'ws-1',
        status: 'published',
      });
      mockFindVariantsByPostId.mockResolvedValue([]);

      const req = new NextRequest('http://localhost:3000/api/composer/schedule/p-published', { method: 'DELETE' });
      const res = await DELETE(req, { params: Promise.resolve({ postId: 'p-published' }) });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Cannot delete or cancel a post that has already been published');
      expect(mockCancelScheduledPost).not.toHaveBeenCalled();
    });

    it('successfully cancels scheduled post that is not published', async () => {
      mockGetCurrentAuth.mockResolvedValue({ workspaceId: 'ws-1', userId: 'u-1' });
      mockFindById.mockResolvedValue({
        id: 'p-scheduled',
        workspaceId: 'ws-1',
        status: 'scheduled',
      });
      mockFindVariantsByPostId.mockResolvedValue([
        { id: 'v-1', status: 'scheduled' },
      ]);
      mockCancelScheduledPost.mockResolvedValue(undefined);

      const req = new NextRequest('http://localhost:3000/api/composer/schedule/p-scheduled', { method: 'DELETE' });
      const res = await DELETE(req, { params: Promise.resolve({ postId: 'p-scheduled' }) });
      expect(res.status).toBe(200);
      expect(mockCancelScheduledPost).toHaveBeenCalledWith('p-scheduled', 'ws-1');
    });
  });

  describe('PATCH', () => {
    it('prevents rescheduling a post that has already been published', async () => {
      mockGetCurrentAuth.mockResolvedValue({ workspaceId: 'ws-1', userId: 'u-1' });
      mockFindById.mockResolvedValue({
        id: 'p-published',
        workspaceId: 'ws-1',
        status: 'published',
      });
      mockFindVariantsByPostId.mockResolvedValue([]);

      const futureDate = new Date(Date.now() + 3600 * 1000).toISOString();
      const req = new NextRequest('http://localhost:3000/api/composer/schedule/p-published', {
        method: 'PATCH',
        body: JSON.stringify({ newScheduledAt: futureDate }),
      });
      const res = await PATCH(req, { params: Promise.resolve({ postId: 'p-published' }) });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Cannot reschedule a post that has already been published');
      expect(mockReschedulePost).not.toHaveBeenCalled();
    });
  });
});
