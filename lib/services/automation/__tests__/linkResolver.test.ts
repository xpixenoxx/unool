import { describe, it, expect, vi, beforeEach } from 'vitest';

const { state } = vi.hoisted(() => ({
  state: {
    profilesByWorkspace: [] as any[],
    profilesByUser: [] as any[],
    brandPages: [] as any[],
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/config/schema', () => ({
  config: {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test_service_key',
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      let filterCol = '';
      const chain: any = {
        select: () => chain,
        eq: (col: string) => {
          if (col === 'workspace_id' || col === 'user_id') {
            filterCol = col;
          }
          return chain;
        },
        order: () => chain,
        limit: () => chain,
        then: (resolve: (v: any) => any, reject?: (e: any) => any) => {
          let data: any[] = [];
          if (table === 'profiles') {
            data = filterCol === 'user_id' ? state.profilesByUser : state.profilesByWorkspace;
          } else if (table === 'brand_materials_pages') {
            data = state.brandPages;
          }
          return Promise.resolve({ data, error: null }).then(resolve, reject);
        },
      };
      return chain;
    },
  }),
}));

import { buildSubdomainDeliveryUrl, resolveCreatorDeliveryLink } from '../linkResolver';

describe('linkResolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.profilesByWorkspace = [];
    state.profilesByUser = [];
    state.brandPages = [];
  });

  it('builds root URL for showcase slug and path URL for named slugs', () => {
    expect(buildSubdomainDeliveryUrl('@CreatorHub', 'showcase')).toBe('https://creatorhub.unool.co/');
    expect(buildSubdomainDeliveryUrl('creatorhub', '/vip-kit')).toBe('https://creatorhub.unool.co/vip-kit');
    expect(buildSubdomainDeliveryUrl('creatorhub', 'page')).toBe('https://creatorhub.unool.co/page');
  });

  it('prioritizes post-linked brand_materials_pages over configured link_url', async () => {
    state.profilesByWorkspace = [{ subdomain: 'creatorhub', deleted_at: null }];
    state.brandPages = [
      {
        slug: 'reel-pack',
        theme: { linked_posts: [{ id: 'media_reel_99' }] },
        is_published: true,
      },
    ];

    const url = await resolveCreatorDeliveryLink('ws_1', {
      configuredLinkUrl: 'https://custom.example.com/default',
      mediaId: 'media_reel_99',
    });

    expect(url).toBe('https://creatorhub.unool.co/reel-pack');
  });

  it('falls back from empty configured link_url to workspace subdomain + latest published page slug', async () => {
    state.profilesByWorkspace = [{ subdomain: 'studiox', deleted_at: null }];
    state.brandPages = [
      {
        slug: 'starter-guide',
        theme: {},
        is_published: true,
      },
    ];

    const url = await resolveCreatorDeliveryLink('ws_1', {
      configuredLinkUrl: '',
      brandUsername: 'studio.official', // has dot, must NOT be used as DNS subdomain
    });

    expect(url).toBe('https://studiox.unool.co/starter-guide');
  });

  it('never falls back to bare https://unool.co when neither configured link nor subdomain/CTA exists', async () => {
    const url = await resolveCreatorDeliveryLink('ws_empty', {
      brandUsername: 'dotted.ig.handle',
    });

    expect(url).toBeUndefined();
  });
});

