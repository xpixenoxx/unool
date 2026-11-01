import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/auth/admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/repositories/supabase/SupabaseAdminRepository', () => ({
  adminRepository: {
    listSubscriptions: vi.fn(),
  },
}));

import { GET } from '../route';
import { requireAdmin } from '@/lib/auth/admin';
import { adminRepository } from '@/lib/repositories/supabase/SupabaseAdminRepository';

describe('Admin Subscriptions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/subscriptions', () => {
    it('returns 403 or redirect when caller is not an admin', async () => {
      vi.mocked(requireAdmin).mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 403 }) as any
      );

      const req = new NextRequest('http://localhost:3000/api/admin/subscriptions');
      const res = await GET(req);

      expect(res.status).toBe(403);
      expect(adminRepository.listSubscriptions).not.toHaveBeenCalled();
    });

    it('returns subscriptions with user name, user email, user id, and workspace info', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({
        admin: { userId: 'admin-1', email: 'admin@unool.co' },
      } as any);

      const mockSubscriptionsResult = {
        data: [
          {
            id: 'sub-1',
            workspaceId: 'ws-1',
            workspaceName: 'My Workspace',
            userId: 'user-123',
            userName: 'Alex Johnson',
            userEmail: 'alex@example.com',
            cfSubscriptionId: 'sub_cf_123',
            planId: 'pro',
            billingCycle: 'monthly',
            status: 'active',
            amountPaise: 199900,
            currency: 'INR',
            currentPeriodStart: '2026-10-01T00:00:00Z',
            currentPeriodEnd: '2026-11-01T00:00:00Z',
            trialEnd: null,
            cancelAtPeriodEnd: false,
            cancelledAt: null,
            paymentMethod: 'card',
            metadata: {},
            createdAt: '2026-10-01T00:00:00Z',
            updatedAt: '2026-10-01T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      };

      vi.mocked(adminRepository.listSubscriptions).mockResolvedValue(mockSubscriptionsResult as any);

      const req = new NextRequest('http://localhost:3000/api/admin/subscriptions?page=1&pageSize=20&search=alex');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(adminRepository.listSubscriptions).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          pageSize: 20,
          search: 'alex',
        })
      );

      expect(data.data).toHaveLength(1);
      const sub = data.data[0];
      expect(sub.userName).toBe('Alex Johnson');
      expect(sub.userEmail).toBe('alex@example.com');
      expect(sub.userId).toBe('user-123');
      expect(sub.workspaceName).toBe('My Workspace');
      expect(sub.workspaceId).toBe('ws-1');
    });

    it('returns subscription stats with plan breakdown (active, cancelled, monthly, annual)', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({
        admin: { userId: 'admin-1', email: 'admin@unool.co' },
      } as any);

      const mockSubscriptionsResult = {
        data: [],
        total: 5,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        stats: {
          totalSubscriptions: 5,
          totalActive: 5,
          totalCancelled: 0,
          totalPastDue: 0,
          totalMonthly: 3,
          totalAnnual: 2,
          byPlan: [
            {
              planId: 'studio',
              planName: 'Studio',
              total: 5,
              active: 5,
              cancelled: 0,
              pastDue: 0,
              paused: 0,
              otherStatus: 0,
              monthly: 3,
              annual: 2,
              totalRevenuePaise: 2499500,
            },
          ],
        },
      };

      vi.mocked(adminRepository.listSubscriptions).mockResolvedValue(mockSubscriptionsResult as any);

      const req = new NextRequest('http://localhost:3000/api/admin/subscriptions?planId=studio');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(adminRepository.listSubscriptions).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: 'studio',
        })
      );
      expect(data.stats).toBeDefined();
      expect(data.stats.totalSubscriptions).toBe(5);
      expect(data.stats.totalActive).toBe(5);
      expect(data.stats.totalCancelled).toBe(0);
      expect(data.stats.totalMonthly).toBe(3);
      expect(data.stats.totalAnnual).toBe(2);

      const studioPlan = data.stats.byPlan[0];
      expect(studioPlan.planId).toBe('studio');
      expect(studioPlan.total).toBe(5);
      expect(studioPlan.active).toBe(5);
      expect(studioPlan.cancelled).toBe(0);
      expect(studioPlan.monthly).toBe(3);
      expect(studioPlan.annual).toBe(2);
    });

    it('handles repository errors gracefully', async () => {
      vi.mocked(requireAdmin).mockResolvedValue({
        admin: { userId: 'admin-1', email: 'admin@unool.co' },
      } as any);

      vi.mocked(adminRepository.listSubscriptions).mockRejectedValue(new Error('Database error'));

      const req = new NextRequest('http://localhost:3000/api/admin/subscriptions');
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe('Failed to fetch subscriptions');
    });
  });
});

