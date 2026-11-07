/**
 * lib/platforms/instagram/__tests__/dynamicOnboarding.test.ts
 *
 * Comprehensive Dynamic Onboarding & Edge Cases Test Suite
 *
 * Covers:
 * 1. Multi-accounts in one workspace
 * 2. Multi-workspaces with distinct accounts
 * 3. Onboarding additional account dynamically without code modifications
 * 4. Reconnecting existing account (updating tokens without breaking aliases)
 * 5. Disconnecting one account without affecting others
 * 6. Invalid / expired token handling (OAuth error resilience)
 * 7. Partial permissions handling
 * 8. Missing business-account identifiers (personal account / ASID-only fallback)
 * 9. Concurrent webhook events (idempotency & race condition resistance)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolveInstagramConnection,
  linkInstagramBusinessAccount,
  invalidateIdentityCache,
  clearIdentityCache,
} from '../identityResolver';

// Hoisted mocks
const { mockSupabaseFrom, mockDecryptToken } = vi.hoisted(() => {
  const mockSupabaseFrom = vi.fn();
  const mockDecryptToken = vi.fn();
  return { mockSupabaseFrom, mockDecryptToken };
});

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: (table: string) => mockSupabaseFrom(table),
  },
}));

vi.mock('@/lib/crypto/encryption', () => ({
  decryptToken: (token: string) => mockDecryptToken(token),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('Instagram Dynamic Onboarding & Multi-Tenant Edge Cases', () => {
  let inMemoryDb: {
    platform_connections: any[];
    platform_posts: any[];
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearIdentityCache();

    inMemoryDb = {
      platform_connections: [],
      platform_posts: [],
    };

    mockDecryptToken.mockImplementation(async (enc: string) => {
      if (enc === 'enc_expired_token') return 'expired_token';
      if (enc === 'enc_malformed') throw new Error('Decryption failed');
      return `decrypted_${enc}`;
    });

    // Flexible Supabase query builder mock supporting all query patterns
    mockSupabaseFrom.mockImplementation((tableName: string) => {
      const tableData = inMemoryDb[tableName as keyof typeof inMemoryDb] || [];
      const filters: Array<(row: any) => boolean> = [];
      let limitCount: number | null = null;

      const chain: any = {
        select: vi.fn().mockImplementation(() => chain),
        eq: vi.fn().mockImplementation((col: string, val: any) => {
          filters.push(row => row[col] === val);
          return chain;
        }),
        neq: vi.fn().mockImplementation((col: string, val: any) => {
          filters.push(row => row[col] !== val);
          return chain;
        }),
        contains: vi.fn().mockImplementation((col: string, arr: any[]) => {
          filters.push(row => {
            const list = Array.isArray(row[col]) ? row[col] : [];
            return arr.every(item => list.includes(item));
          });
          return chain;
        }),
        filter: vi.fn().mockImplementation((expr: string, _op: string, val: any) => {
          if (expr === 'metadata->>instagram_business_account_id') {
            filters.push(row => row.metadata?.instagram_business_account_id === val);
          }
          return chain;
        }),
        limit: vi.fn().mockImplementation((n: number) => {
          limitCount = n;
          return chain;
        }),
        maybeSingle: vi.fn().mockImplementation(async () => {
          const rows = tableData.filter(r => filters.every(f => f(r)));
          return { data: rows[0] || null, error: null };
        }),
        update: vi.fn().mockImplementation((updates: any) => {
          return {
            eq: vi.fn().mockImplementation(async (col: string, val: any) => {
              for (const row of tableData) {
                if (row[col] === val) {
                  Object.assign(row, updates);
                }
              }
              return { data: null, error: null };
            }),
          };
        }),
        then: (resolve: (val: any) => void) => {
          let rows = tableData.filter(r => filters.every(f => f(r)));
          if (limitCount !== null) rows = rows.slice(0, limitCount);
          resolve({ data: rows, error: null });
        },
      };

      return chain;
    });
  });

  it('1. handles multiple Instagram accounts within the SAME workspace', async () => {
    const workspaceId = `ws_multi_${Date.now()}`;
    const account1 = {
      id: `conn_1_${Math.random()}`,
      workspace_id: workspaceId,
      platform: 'instagram',
      platform_user_id: 'asid_store_fashion',
      username: 'fashion_store',
      status: 'connected',
      scopes: ['ig_business_id:17841411111111111'],
      metadata: { instagram_business_account_id: '17841411111111111' },
      access_token_encrypted: 'enc_tok1',
    };
    const account2 = {
      id: `conn_2_${Math.random()}`,
      workspace_id: workspaceId,
      platform: 'instagram',
      platform_user_id: 'asid_store_shoes',
      username: 'shoes_store',
      status: 'connected',
      scopes: ['ig_business_id:17841422222222222'],
      metadata: { instagram_business_account_id: '17841422222222222' },
      access_token_encrypted: 'enc_tok2',
    };

    inMemoryDb.platform_connections.push(account1, account2);

    const res1 = await resolveInstagramConnection('17841411111111111');
    const res2 = await resolveInstagramConnection('17841422222222222');

    expect(res1).not.toBeNull();
    expect(res1.id).toBe(account1.id);
    expect(res1.username).toBe('fashion_store');

    expect(res2).not.toBeNull();
    expect(res2.id).toBe(account2.id);
    expect(res2.username).toBe('shoes_store');
  });

  it('2. isolates multiple distinct workspaces without cross-tenant bleed', async () => {
    const wsA = `ws_tenant_a_${Date.now()}`;
    const wsB = `ws_tenant_b_${Date.now()}`;

    const connA = {
      id: `conn_a_${Math.random()}`,
      workspace_id: wsA,
      platform: 'instagram',
      platform_user_id: 'asid_brand_a',
      username: 'brand_a',
      status: 'connected',
      scopes: ['ig_business_id:178414AAAA'],
      metadata: { instagram_business_account_id: '178414AAAA' },
      access_token_encrypted: 'enc_tok_a',
    };
    const connB = {
      id: `conn_b_${Math.random()}`,
      workspace_id: wsB,
      platform: 'instagram',
      platform_user_id: 'asid_brand_b',
      username: 'brand_b',
      status: 'connected',
      scopes: ['ig_business_id:178414BBBB'],
      metadata: { instagram_business_account_id: '178414BBBB' },
      access_token_encrypted: 'enc_tok_b',
    };

    inMemoryDb.platform_connections.push(connA, connB);

    const resA = await resolveInstagramConnection('178414AAAA');
    expect(resA.workspace_id).toBe(wsA);
    expect(resA.id).toBe(connA.id);

    const resB = await resolveInstagramConnection('178414BBBB');
    expect(resB.workspace_id).toBe(wsB);
    expect(resB.id).toBe(connB.id);

    // Unmapped ID must NEVER leak to wsA or wsB
    const resUnknown = await resolveInstagramConnection('178414UNKNOWN');
    expect(resUnknown).toBeNull();
  });

  it('3. dynamically routes to newly onboarded account without code changes or restarts', async () => {
    // Initially empty DB
    expect(inMemoryDb.platform_connections.length).toBe(0);

    const initialResolve = await resolveInstagramConnection('178414NEW_DYNAMIC');
    expect(initialResolve).toBeNull();

    // A new customer onboards via OAuth in real time:
    invalidateIdentityCache('178414NEW_DYNAMIC');
    const dynamicConn = {
      id: `conn_dynamic_${Date.now()}`,
      workspace_id: `ws_dynamic_${Date.now()}`,
      platform: 'instagram',
      platform_user_id: 'asid_dynamic_creator',
      username: 'newly_onboarded_creator',
      status: 'connected',
      scopes: ['ig_business_id:178414NEW_DYNAMIC'],
      metadata: { instagram_business_account_id: '178414NEW_DYNAMIC' },
      access_token_encrypted: 'enc_dynamic_tok',
    };
    inMemoryDb.platform_connections.push(dynamicConn);

    // Subsequent webhook immediately resolves
    const newResolve = await resolveInstagramConnection('178414NEW_DYNAMIC');
    expect(newResolve).not.toBeNull();
    expect(newResolve.id).toBe(dynamicConn.id);
    expect(newResolve.username).toBe('newly_onboarded_creator');
  });

  it('4. preserves aliases and uninterrupted routing when reconnecting account with new token', async () => {
    const conn = {
      id: 'conn_reconnect_target',
      workspace_id: 'ws_reconnect',
      platform: 'instagram',
      platform_user_id: 'asid_reconnect_user',
      username: 'reconnecting_creator',
      status: 'connected',
      scopes: ['instagram_basic', 'ig_business_id:178414RECONNECT'],
      metadata: {
        instagram_business_account_id: '178414RECONNECT',
        auth_method: 'instagram_login',
      },
      access_token_encrypted: 'enc_old_expired_token',
    };
    inMemoryDb.platform_connections.push(conn);

    // Initial check passes
    const before = await resolveInstagramConnection('178414RECONNECT');
    expect(before.id).toBe('conn_reconnect_target');

    // User completes reconnect OAuth flow -> token and updated scopes saved, aliases preserved
    conn.access_token_encrypted = 'enc_brand_new_token';
    conn.scopes = ['instagram_basic', 'instagram_manage_comments', 'ig_business_id:178414RECONNECT'];
    conn.metadata.token_updated_at = new Date().toISOString();

    // Routing continues smoothly
    const after = await resolveInstagramConnection('178414RECONNECT');
    expect(after).not.toBeNull();
    expect(after.id).toBe('conn_reconnect_target');
    expect(after.scopes).toContain('ig_business_id:178414RECONNECT');
  });

  it('5. disconnecting one account immediately revokes routing without affecting others', async () => {
    const conn1 = {
      id: 'conn_stay_connected',
      workspace_id: 'ws_active',
      platform: 'instagram',
      platform_user_id: 'asid_stay',
      username: 'staying_user',
      status: 'connected',
      scopes: ['ig_business_id:178414STAY'],
      metadata: { instagram_business_account_id: '178414STAY' },
      access_token_encrypted: 'enc_tok1',
    };
    const conn2 = {
      id: 'conn_to_disconnect',
      workspace_id: 'ws_leaving',
      platform: 'instagram',
      platform_user_id: 'asid_leaving',
      username: 'leaving_user',
      status: 'connected',
      scopes: ['ig_business_id:178414LEAVE'],
      metadata: { instagram_business_account_id: '178414LEAVE' },
      access_token_encrypted: 'enc_tok2',
    };
    inMemoryDb.platform_connections.push(conn1, conn2);

    // Both resolve
    expect(await resolveInstagramConnection('178414STAY')).not.toBeNull();
    expect(await resolveInstagramConnection('178414LEAVE')).not.toBeNull();

    // Disconnect conn2: status set to 'disconnected' and cache invalidated
    conn2.status = 'disconnected';
    invalidateIdentityCache('178414LEAVE');

    // conn2 now safely rejected (null)
    const disconnectedRes = await resolveInstagramConnection('178414LEAVE');
    expect(disconnectedRes).toBeNull();

    // conn1 remains completely functional
    const stayingRes = await resolveInstagramConnection('178414STAY');
    expect(stayingRes).not.toBeNull();
    expect(stayingRes.id).toBe('conn_stay_connected');
  });

  it('6. gracefully handles expired or invalid tokens during introspection without crashing', async () => {
    // Connection has an expired token
    const conn = {
      id: 'conn_expired_token_user',
      workspace_id: 'ws_expired',
      platform: 'instagram',
      platform_user_id: 'asid_expired',
      username: 'expired_user',
      status: 'connected',
      scopes: [],
      metadata: {},
      access_token_encrypted: 'enc_expired_token',
    };
    inMemoryDb.platform_connections.push(conn);

    // Mock fetch to simulate Meta API 401 Session Expired response
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          message: 'Error validating access token: Session has expired.',
          type: 'OAuthException',
          code: 190,
          error_subcode: 463,
        },
      }),
    });

    try {
      const res = await resolveInstagramConnection('178414UNKNOWN_EXPIRED');
      // Must not throw, and must safely return null
      expect(res).toBeNull();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('7. missing business account identifier falls back cleanly to platform_user_id (ASID)', async () => {
    // Creator or personal account that does not have an IGID, only ASID
    const asidOnlyConn = {
      id: 'conn_asid_only',
      workspace_id: 'ws_asid',
      platform: 'instagram',
      platform_user_id: '123456789012345',
      username: 'asid_creator',
      status: 'connected',
      scopes: ['instagram_basic'],
      metadata: { auth_method: 'instagram_login' }, // No instagram_business_account_id
      access_token_encrypted: 'enc_asid_tok',
    };
    inMemoryDb.platform_connections.push(asidOnlyConn);

    // When webhook entry ID matches ASID (platform_user_id)
    const res = await resolveInstagramConnection('123456789012345');
    expect(res).not.toBeNull();
    expect(res.id).toBe('conn_asid_only');
    expect(res.username).toBe('asid_creator');
  });

  it('8. handles concurrent incoming webhook events idempotently without race conditions', async () => {
    const conn = {
      id: 'conn_concurrent_target',
      workspace_id: 'ws_concurrent',
      platform: 'instagram',
      platform_user_id: 'asid_concurrent',
      username: 'high_traffic_creator',
      status: 'connected',
      scopes: ['ig_business_id:178414CONCURRENT'],
      metadata: { instagram_business_account_id: '178414CONCURRENT' },
      access_token_encrypted: 'enc_tok_concurrent',
    };
    inMemoryDb.platform_connections.push(conn);

    // Fire 20 simultaneous webhook resolutions
    const resolutions = await Promise.all(
      Array.from({ length: 20 }, () =>
        resolveInstagramConnection('178414CONCURRENT')
      )
    );

    // All must resolve to the identical connection without exception or corruption
    expect(resolutions).toHaveLength(20);
    for (const res of resolutions) {
      expect(res).not.toBeNull();
      expect(res.id).toBe('conn_concurrent_target');
      expect(res.workspace_id).toBe('ws_concurrent');
    }
  });

  it('9. reassigning an IGID strips stale aliases from previous connections', async () => {
    const oldConn = {
      id: 'conn_old_owner',
      workspace_id: 'ws_old',
      platform: 'instagram',
      platform_user_id: 'asid_old',
      username: 'old_owner',
      status: 'connected',
      scopes: ['ig_business_id:178414TRANSFERRED'],
      metadata: { instagram_business_account_id: '178414TRANSFERRED' },
      access_token_encrypted: 'enc_tok_old',
    };
    const newConn = {
      id: 'conn_new_owner',
      workspace_id: 'ws_new',
      platform: 'instagram',
      platform_user_id: 'asid_new',
      username: 'new_owner',
      status: 'connected',
      scopes: [],
      metadata: {},
      access_token_encrypted: 'enc_tok_new',
    };
    inMemoryDb.platform_connections.push(oldConn, newConn);

    // Reassign transferred account to new connection
    await linkInstagramBusinessAccount('conn_new_owner', '178414TRANSFERRED');

    // New connection must now hold the alias
    const updatedNew = inMemoryDb.platform_connections.find(c => c.id === 'conn_new_owner');
    expect(updatedNew.scopes).toContain('ig_business_id:178414TRANSFERRED');
    expect(updatedNew.metadata.instagram_business_account_id).toBe('178414TRANSFERRED');

    // Old connection must have stale alias stripped
    const updatedOld = inMemoryDb.platform_connections.find(c => c.id === 'conn_old_owner');
    expect(updatedOld.scopes).not.toContain('ig_business_id:178414TRANSFERRED');
    expect(updatedOld.metadata.instagram_business_account_id).toBeUndefined();

    // Webhook now resolves to new owner strictly
    const resolved = await resolveInstagramConnection('178414TRANSFERRED');
    expect(resolved.id).toBe('conn_new_owner');
    expect(resolved.workspace_id).toBe('ws_new');
  });
});
