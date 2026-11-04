import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

import { getFeatureFlagsServer, isAutomationEnabledServer, setFeatureFlagServer } from '@/lib/feature-flags-server';

describe('Feature Flags Server Helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads flag from admin_feature_flags table when present', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ flag_key: 'automation_enabled', flag_value: false }],
        error: null,
      }),
    });

    const isEnabled = await isAutomationEnabledServer();
    expect(isEnabled).toBe(false);
  });

  it('falls back to admin_audit_log when admin_feature_flags table fails', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'admin_feature_flags') {
        return {
          select: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('relation does not exist'),
          }),
        };
      }
      if (table === 'admin_audit_log') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    {
                      target_id: 'automation_enabled',
                      metadata: { flag_value: false },
                      created_at: new Date().toISOString(),
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const isEnabled = await isAutomationEnabledServer();
    expect(isEnabled).toBe(false);
  });
});
