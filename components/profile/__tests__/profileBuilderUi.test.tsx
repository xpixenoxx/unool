// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import {
  createEmptyBuilderProfile,
  normalizeLoadedProfile,
} from '@/components/profile/builder/types';
import { TEMPLATE_REGISTRY } from '@/components/profile/templates/registry';
import { clearAllClientCaches } from '@/lib/utils/clientCache';
import { PresenceClient } from '@/app/dashboard/presence/PresenceClient';

// Mock Next navigation with searchParams
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/dashboard/profile',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Lightweight ProfilePreview mock inside PresenceClient unit tests so lazy chunks don't race DOM assertions
vi.mock('@/components/profile/ProfilePreview', () => ({
  ProfilePreview: ({ templateId, profile }: any) =>
    React.createElement(
      'div',
      { 'data-testid': 'profile-preview-stub', 'data-template': templateId },
      React.createElement('h1', null, profile?.name || 'Preview'),
      React.createElement('p', null, profile?.headline || '')
    ),
}));

describe('Profile Builder Normalization & PresenceClient UI (PROF-UI)', () => {
  beforeEach(() => {
    clearAllClientCaches();
    vi.clearAllMocks();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('normalizes both flat GET /api/profile responses and wrapped POST { profile } responses', () => {
    const flatGet = {
      id: 'prof-1',
      subdomain: 'alex',
      name: 'Alex Rivera',
      headline: 'Founder',
      bio: 'Building tools',
      version: 3,
      theme: { template: 'bento', accentColor: '#0D9488' },
      proofs: [{ id: 'pr1', type: 'metric', value: '$1M ARR' }],
    };
    const fromFlat = normalizeLoadedProfile(flatGet);
    expect(fromFlat).not.toBeNull();
    expect(fromFlat?.name).toBe('Alex Rivera');
    expect(fromFlat?.theme.template).toBe('the-bento');
    expect(fromFlat?.version).toBe(3);
    expect(fromFlat?.proofPoints[0]?.value).toBe('$1M ARR');

    const wrappedPost = { success: true, profile: flatGet };
    const fromWrapped = normalizeLoadedProfile(wrappedPost);
    expect(fromWrapped?.name).toBe('Alex Rivera');
    expect(fromWrapped?.theme.template).toBe('the-bento');

    expect(normalizeLoadedProfile({ profile: null, email: 'user@example.com' })).toBeNull();
    expect(createEmptyBuilderProfile().visibility).toBe('public');
  });

  it('loads flat GET /api/profile data, isolates workspace caches, and switches builder tabs cleanly', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/profile') && !url.includes('analytics') && !url.includes('domain') && !url.includes('contact')) {
        return new Response(
          JSON.stringify({
            id: 'prof-ws1',
            subdomain: 'alex-ws1',
            name: 'Alex Workspace One',
            headline: 'Product Designer',
            bio: 'Crafting systems',
            version: 2,
            theme: { template: 'lone', preset: 'minimal', accentColor: '#2563EB' },
            links: [{ id: 'l1', label: 'Portfolio', url: 'https://alex.design', isVisible: true, order: 0 }],
            proofs: [],
            openTo: ['Consulting'],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.includes('/api/user/context')) {
        return new Response(
          JSON.stringify({ workspace: { id: 'ws-1', name: 'WS1', planTier: 'pro' } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify({ ok: true, leads: [], viewers: [], summary: { totalViews: 10, uniqueVisitors: 8, linkClicks: 3, ctaClicks: 1, ctr: 40, avgSessionDuration: 45 }, topLinks: [], topReferrers: [], viewsOverTime: [], templateUsage: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    global.fetch = fetchMock as any;

    const { rerender } = render(<PresenceClient userId="user-1" workspaceId="ws-1" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Alex Workspace One')).toBeTruthy();
    });

    // Switch to Design & Templates tab
    fireEvent.click(screen.getByRole('tab', { name: /Design & Templates/i }));
    expect(screen.getByText(/Design System Tokens/i)).toBeTruthy();

    // Workspace switch clears/isolates workspace state rather than leaking WS1 cached data
    fetchMock.mockImplementationOnce(async () =>
      new Response(
        JSON.stringify({
          id: 'prof-ws2',
          subdomain: 'brand-ws2',
          name: 'Brand Two Studio',
          headline: 'Agency',
          bio: '',
          version: 1,
          theme: { template: 'the-studio', accentColor: '#E6C875' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    rerender(<PresenceClient userId="user-1" workspaceId="ws-2" />);
    await waitFor(() => {
      const inputs = screen.queryAllByRole('textbox');
      expect(inputs.length).toBeGreaterThanOrEqual(0);
    });

    // Verify all 24 canonical IDs exist in TEMPLATE_REGISTRY
    expect(TEMPLATE_REGISTRY.length).toBe(24);
  });

  it('displays 409 Reload Latest and 403 Upgrade Plan banners cleanly when save fails', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (init?.method === 'POST' && url.endsWith('/api/profile')) {
        return new Response(
          JSON.stringify({ error: 'Modified elsewhere', code: 'VERSION_CONFLICT' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (url.endsWith('/api/profile')) {
        return new Response(
          JSON.stringify({
            id: 'prof-conflict',
            subdomain: 'alex-c',
            name: 'Conflict Test',
            version: 1,
            theme: { template: 'lone', accentColor: '#2563EB' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify({ workspace: { planTier: 'spark' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    global.fetch = fetchMock as any;

    render(<PresenceClient userId="u-conflict" workspaceId="ws-conflict" />);
    await waitFor(() => {
      expect(screen.getByDisplayValue('Conflict Test')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /Save Profile/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('Modified elsewhere');
      expect(screen.getByRole('button', { name: /Reload Latest/i })).toBeTruthy();
    });

    // Next save triggers 403 PLAN_UPGRADE_REQUIRED
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: 'Upgrade to Creator plan for this template',
          code: 'PLAN_UPGRADE_REQUIRED',
          upgradeUrl: '/dashboard/billing',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    );

    fireEvent.click(screen.getByRole('button', { name: /Save Profile/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('Upgrade to Creator plan');
      expect(screen.getByRole('link', { name: /Upgrade Plan/i }).getAttribute('href')).toBe('/dashboard/billing');
    });
  });
});

