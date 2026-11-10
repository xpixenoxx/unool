import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ComposerClient } from '../ComposerClient';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
}));

// Mock user context & feature flags
vi.mock('@/lib/hooks/use-user-context', () => ({
  useUserContext: () => ({
    user: { id: 'u1', fullName: 'Chetna', avatarUrl: '' },
    profile: { id: 'p1', name: 'Chetna', headline: 'Professional' },
  }),
}));

vi.mock('@/lib/hooks/use-feature-flags', () => ({
  useFeatureFlags: () => ({
    flags: { automationEnabled: true },
    loading: false,
  }),
}));

describe('ComposerClient platform connection filtering', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
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

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders "No connected platforms yet" when user has 0 connected platforms', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/platform/connections')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ connections: {} }),
        });
      }
      if (url.includes('/api/profile')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            profile: { id: 'p1', name: 'Chetna', headline: 'Professional' },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    render(<ComposerClient userId="u1" workspaceId="w1" />);

    await waitFor(() => {
      expect(screen.getByText(/No connected platforms yet/i)).toBeDefined();
    });

    // None of the 8 fixed platforms should be shown to select
    expect(screen.queryByText('Threads')).toBeNull();
    expect(screen.queryByText('Bluesky')).toBeNull();
    expect(screen.queryByText('Kick')).toBeNull();
    expect(screen.queryByText('Dribbble')).toBeNull();
  });

  it('renders only connected platforms when user has connected platforms', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/platform/connections')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            connections: {
              linkedin: { platform: 'linkedin', status: 'connected' },
              instagram: { platform: 'instagram', status: 'connected' },
            },
          }),
        });
      }
      if (url.includes('/api/profile')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            profile: { id: 'p1', name: 'Chetna', headline: 'Professional' },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    render(<ComposerClient userId="u1" workspaceId="w1" />);

    await waitFor(() => {
      expect(screen.getAllByText('LinkedIn').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Instagram').length).toBeGreaterThan(0);
    });

    // Other unconnected platforms must NOT be shown
    expect(screen.queryByText('Threads')).toBeNull();
    expect(screen.queryByText('Bluesky')).toBeNull();
    expect(screen.queryByText('Telegram')).toBeNull();
    expect(screen.queryByText('Kick')).toBeNull();
    expect(screen.queryByText('Dribbble')).toBeNull();
    expect(screen.queryByText('YouTube')).toBeNull();
  });
});
