import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logger', () => ({ logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

type Result = { data: unknown; error: null };
let tables: Record<string, Result[]>;

function builder(table: string) {
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'or', 'order', 'limit']) b[m] = () => b;
  b.then = (resolve: (r: Result) => void) => resolve(tables[table]?.shift() ?? { data: null, error: null });
  return b;
}

vi.mock('@/lib/supabase/admin', () => ({ supabaseAdmin: { from: (t: string) => builder(t) } }));

import { resolveThreadsAutomationTarget } from '../threadsTargetResolver';

describe('resolveThreadsAutomationTarget', () => {
  beforeEach(() => {
    tables = {};
  });

  it('prefers the most recently connected/updated workspace when multiple workspaces share a Threads account', async () => {
    tables = {
      platform_connections: [
        {
          data: [
            {
              id: 'conn_new',
              workspace_id: 'ws_new',
              platform_user_id: '28741626462190047',
              username: 'avadika_senakkay',
              updated_at: '2026-11-25T12:09:46Z',
            },
            {
              id: 'conn_old',
              workspace_id: 'ws_old',
              platform_user_id: '28741626462190047',
              username: 'avadika_senakkay',
              updated_at: '2026-11-14T07:16:03Z',
            },
          ],
          error: null,
        },
      ],
      threads_automation_config: [
        {
          data: [
            {
              id: 'cfg_old',
              workspace_id: 'ws_old',
              threads_user_id: '28741626462190047',
              enabled: true,
              updated_at: '2026-11-24T12:27:15Z',
            },
            {
              id: 'cfg_new',
              workspace_id: 'ws_new',
              threads_user_id: '28741626462190047',
              enabled: true,
              updated_at: '2026-11-24T12:33:32Z',
            },
          ],
          error: null,
        },
      ],
    };

    const target = await resolveThreadsAutomationTarget('28741626462190047', 'avadika_senakkay');
    expect(target).not.toBeNull();
    expect(target?.cfg.workspace_id).toBe('ws_new');
    expect(target?.connectionId).toBe('conn_new');
    expect(target?.username).toBe('avadika_senakkay');
  });

  it('falls back to workspaces.settings.threads_automation when dedicated table row is missing', async () => {
    tables = {
      platform_connections: [
        {
          data: [
            {
              id: 'conn_ws',
              workspace_id: 'ws_settings',
              platform_user_id: 'th_99',
              username: 'creator_threads',
              updated_at: '2026-11-25T12:00:00Z',
            },
          ],
          error: null,
        },
      ],
      threads_automation_config: [
        { data: [], error: null },
        { data: [], error: null },
      ],
      workspaces: [
        {
          data: [
            {
              settings: {
                threads_automation: {
                  enabled: true,
                  auto_reply_replies: true,
                },
              },
            },
          ],
          error: null,
        },
      ],
    };

    const target = await resolveThreadsAutomationTarget('th_99');
    expect(target).not.toBeNull();
    expect(target?.cfg.workspace_id).toBe('ws_settings');
    expect(target?.connectionId).toBe('conn_ws');
  });

  it('returns null when neither user ID nor username is provided', async () => {
    expect(await resolveThreadsAutomationTarget(undefined, undefined)).toBeNull();
  });
});
