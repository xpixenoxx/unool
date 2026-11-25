import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardClient from '@/app/dashboard/DashboardClient';

const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/hooks/use-feature-flags', () => ({
  useFeatureFlags: () => ({ flags: {} }),
}));

vi.mock('@/lib/hooks/useAnalyticsInsights', () => ({
  useAnalyticsInsights: () => ({ insights: null, loadingInsights: false }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/dashboard/PlatformConnections', () => ({
  PlatformConnections: () => <div data-testid="platform-connections-modal" />,
}));

vi.mock('@/components/dashboard/BlueskyConnectDialog', () => ({
  BlueskyConnectDialog: () => null,
}));

vi.mock('@/components/dashboard/ManualIntegrationDialog', () => ({
  ManualIntegrationDialog: () => null,
}));

vi.mock('@/components/dashboard/ProfileCompletionQuest', () => ({
  ProfileCompletionQuest: () => null,
  getQuestSteps: () => [{ id: '1', completed: true }],
}));

function makeDashboardData(overrides: Record<string, any> = {}) {
  return {
    profile: {
      subdomain: 'naza',
      name: 'Naza Raina',
      headline: 'Creator',
      status: 'published' as const,
      updatedAt: '2026-11-24T00:00:00.000Z',
      links: [],
      proofPoints: [],
    },
    recentPosts: [],
    usageStats: {
      postsThisMonth: 0,
      postsLimit: 12,
      profileViews: 0,
      profileViewsThisWeek: 0,
      linkClicks: 0,
      linkClicksThisWeek: 0,
    },
    connections: {
      instagram: {
        status: 'connected' as const,
        username: 'naza.raina',
        accounts: [
          {
            id: 'conn-ig',
            platform: 'instagram',
            username: 'naza.raina',
            status: 'connected',
          },
        ],
      },
      facebook: {
        status: 'connected' as const,
        username: '1408139494619957',
        accounts: [
          {
            id: 'conn-fb',
            platform: 'facebook',
            username: '1408139494619957',
            status: 'connected',
          },
        ],
      },
    },
    planTier: 'free' as const,
    userId: 'user-1',
    workspaceId: 'ws-1',
    ...overrides,
  };
}

describe('Broadcast Network disconnect isolation', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('disconnecting one platform leaves sibling connected platforms connected without calling router.refresh', async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (init?.method === 'DELETE' && url.includes('/api/platform/connections/facebook')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        };
      }
      if (url.includes('/api/platform/connections')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            connections: {
              instagram: {
                platform: 'instagram',
                status: 'connected',
                username: 'naza.raina',
                accounts: [
                  {
                    id: 'conn-ig',
                    platform: 'instagram',
                    username: 'naza.raina',
                    status: 'connected',
                  },
                ],
              },
              facebook: {
                platform: 'facebook',
                status: 'not_connected',
                accounts: [],
              },
            },
          }),
        };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    });
    globalThis.fetch = fetchMock as any;

    const { container, rerender } = render(<DashboardClient data={makeDashboardData() as any} />);

    // Both Instagram and Facebook start connected
    const igTile = () => container.querySelector('.tile[data-platform="instagram"]');
    const fbTile = () => container.querySelector('.tile[data-platform="facebook"]');
    expect(igTile()?.classList.contains('on')).toBe(true);
    expect(fbTile()?.classList.contains('on')).toBe(true);

    // Click Disconnect on Facebook
    const fbDisconnectBtn = screen.getByRole('button', { name: 'Disconnect Facebook' });
    fireEvent.click(fbDisconnectBtn);

    // Confirm disconnect in dialog
    const confirmBtn = await screen.findByRole('button', { name: 'Disconnect' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      // Once disconnected, Facebook either loses `.on` or drops out of the top-8 sorted grid
      const tile = fbTile();
      expect(tile === null || !tile.classList.contains('on')).toBe(true);
    });

    // Sibling connected platform (Instagram) MUST stay connected and colored
    expect(igTile()?.classList.contains('on')).toBe(true);
    expect(screen.getByText('@naza.raina')).toBeDefined();
    expect(mockRefresh).not.toHaveBeenCalled();

    // Even if an unauthenticated/empty RSC payload arrives later, it must not wipe Instagram
    rerender(
      <DashboardClient
        data={makeDashboardData({ userId: '', workspaceId: '', connections: {} }) as any}
      />
    );
    expect(igTile()?.classList.contains('on')).toBe(true);
  });
});
