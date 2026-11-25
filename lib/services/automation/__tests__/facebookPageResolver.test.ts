import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logger', () => ({ logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/crypto/encryption', () => ({ decryptToken: vi.fn().mockResolvedValue('user_token') }));
const mockGetUserPages = vi.fn();
vi.mock('@/lib/platforms/FacebookAdapter', () => ({
  facebookAdapter: { getUserPages: (...a: unknown[]) => mockGetUserPages(...a) },
}));

type Result = { data: unknown; error: null };
const updates: Array<{ table: string; values: unknown }> = [];
let tables: Record<string, Result[]>;

// Thenable query builder: every chained call returns itself; awaiting yields the next queued result.
function builder(table: string) {
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'contains', 'order', 'limit']) b[m] = () => b;
  b.update = (values: unknown) => {
    updates.push({ table, values });
    return b;
  };
  b.then = (resolve: (r: Result) => void) => resolve(tables[table]?.shift() ?? { data: null, error: null });
  return b;
}
vi.mock('@/lib/supabase/admin', () => ({ supabaseAdmin: { from: (t: string) => builder(t) } }));

import { resolveFacebookAutomationTarget } from '../facebookPageResolver';

describe('resolveFacebookAutomationTarget', () => {
  beforeEach(() => {
    updates.length = 0;
    mockGetUserPages.mockReset();
  });

  it('resolves via page-tagged connection and heals placeholder page_id', async () => {
    tables = {
      platform_connections: [{ data: [{ id: 'c1', workspace_id: 'w1', scopes: ['fb_page_id:P1'] }], error: null }],
      facebook_automation_config: [
        { data: [], error: null }, // no exact page_id config
        { data: [{ workspace_id: 'w1', page_id: 'default_page', enabled: true }], error: null },
      ],
    };
    const r = await resolveFacebookAutomationTarget('P1');
    expect(r?.connectionId).toBe('c1');
    expect(r?.cfg.workspace_id).toBe('w1');
    expect(updates.some((u) => u.table === 'facebook_automation_config')).toBe(true);
  });

  it('prefers a config bound exactly to the page', async () => {
    tables = {
      platform_connections: [{ data: [{ id: 'c2', workspace_id: 'w2', scopes: ['fb_page_id:P2'] }], error: null }],
      facebook_automation_config: [{ data: [{ workspace_id: 'w2', page_id: 'P2', enabled: true }], error: null }],
    };
    const r = await resolveFacebookAutomationTarget('P2');
    expect(r).toMatchObject({ connectionId: 'c2' });
    expect(updates).toHaveLength(0);
  });

  it('lazily tags legacy untagged connections', async () => {
    mockGetUserPages.mockResolvedValue([{ id: 'P3' }, { id: 'P4' }]);
    tables = {
      platform_connections: [
        { data: [], error: null }, // no tagged connection
        { data: [{ id: 'c3', workspace_id: 'w3', scopes: ['pages_show_list'], access_token_encrypted: 'enc' }], error: null },
      ],
      facebook_automation_config: [
        { data: [], error: null },
        { data: [{ workspace_id: 'w3', page_id: 'P3', enabled: true }], error: null },
      ],
    };
    const r = await resolveFacebookAutomationTarget('P3');
    expect(r?.connectionId).toBe('c3');
    const tagUpdate = updates.find((u) => u.table === 'platform_connections');
    expect((tagUpdate?.values as { scopes: string[] }).scopes).toEqual(
      expect.arrayContaining(['fb_page_id:P3', 'fb_page_id:P4'])
    );
  });

  it('falls back to workspaces.settings.facebook_automation when dedicated table row is missing', async () => {
    tables = {
      platform_connections: [{ data: [{ id: 'c5', workspace_id: 'w5', scopes: ['fb_page_id:P5'] }], error: null }],
      facebook_automation_config: [
        { data: [], error: null }, // no exact page_id config
        { data: [], error: null }, // no workspace row in dedicated table
      ],
      workspaces: [
        {
          data: [
            {
              settings: {
                facebook_automation: {
                  enabled: true,
                  page_id: 'default_page',
                  auto_reply_comments: true,
                },
              },
            },
          ],
          error: null,
        },
      ],
    };
    const r = await resolveFacebookAutomationTarget('P5');
    expect(r).not.toBeNull();
    expect(r?.connectionId).toBe('c5');
    expect(r?.cfg.workspace_id).toBe('w5');
    expect(r?.cfg.page_id).toBe('P5');
    expect(r?.cfg.enabled).toBe(true);
  });

  it('prefers the most recently updated workspace when multiple workspaces share a page_id', async () => {
    tables = {
      platform_connections: [
        {
          data: [
            { id: 'c_new', workspace_id: 'ws_new', scopes: ['fb_page_id:P_SHARED'], updated_at: '2026-11-25T11:12:48Z' },
            { id: 'c_old', workspace_id: 'ws_old', scopes: ['fb_page_id:P_SHARED'], updated_at: '2026-11-14T07:18:37Z' },
          ],
          error: null,
        },
      ],
      facebook_automation_config: [
        {
          data: [
            { id: 'cfg_old', workspace_id: 'ws_old', page_id: 'P_SHARED', enabled: true, updated_at: '2026-11-14T07:28:10Z' },
            { id: 'cfg_new', workspace_id: 'ws_new', page_id: 'P_SHARED', enabled: true, updated_at: '2026-11-25T11:14:55Z' },
          ],
          error: null,
        },
      ],
    };
    const r = await resolveFacebookAutomationTarget('P_SHARED');
    expect(r?.connectionId).toBe('c_new');
    expect(r?.cfg.workspace_id).toBe('ws_new');
  });

  it('returns null when no workspace owns the page', async () => {
    mockGetUserPages.mockResolvedValue([]);
    tables = {
      platform_connections: [{ data: [], error: null }, { data: [], error: null }],
      facebook_automation_config: [{ data: [], error: null }],
    };
    expect(await resolveFacebookAutomationTarget('PX')).toBeNull();
  });
});
