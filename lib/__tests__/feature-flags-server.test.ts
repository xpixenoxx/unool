import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

import { getFeatureFlagsServer, isAutomationEnabledServer } from '@/lib/feature-flags-server';

describe('Feature Flags Server Helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when flag is enabled in database', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ flag_key: 'automation_enabled', flag_value: true }],
        error: null,
      }),
    });

    const isEnabled = await isAutomationEnabledServer();
    expect(isEnabled).toBe(true);
  });
});

