import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BrandMaterialsSection from '../BrandMaterialsSection';

async function flushEffects() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

function findButtonByText(rootEl: HTMLElement, text: string | RegExp): HTMLButtonElement | undefined {
  const buttons = Array.from(rootEl.querySelectorAll('button'));
  return buttons.find((b) =>
    typeof text === 'string' ? b.textContent?.includes(text) : text.test(b.textContent || '')
  );
}

describe('BrandMaterialsSection (Facebook Brand & Materials)', () => {
  const originalFetch = global.fetch;
  const originalAlert = global.alert;
  let host: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    global.alert = vi.fn();
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
    global.fetch = originalFetch;
    global.alert = originalAlert;
  });

  function setupBaseFetch(putImpl: () => Promise<any>) {
    global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/api/brand-materials') && (!init?.method || init.method === 'GET')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            subdomain: 'usha',
            liveTemplate: 'the-voice',
            pages: [
              {
                id: 'p1',
                slug: 'showcase',
                title: 'Main Showcase',
                materials: [],
                linked_posts: [],
                theme: { linked_posts: [] },
              },
            ],
            page: {
              id: 'p1',
              slug: 'showcase',
              title: 'Main Showcase',
              materials: [],
              linked_posts: [],
              theme: { linked_posts: [] },
            },
          }),
        });
      }
      if (url.includes('/api/facebook/posts')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            connected: true,
            username: 'Usha Page',
            posts: [
              {
                id: 'fb_post_1',
                caption: 'New horror series',
                media_type: 'PHOTO',
              },
            ],
          }),
        });
      }
      if (url.includes('/api/brand-materials/upload')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            url: '/api/media/materials/test-photo.jpg',
            type: 'image',
            size: '120 KB',
          }),
        });
      }
      if (url.includes('/api/brand-materials') && init?.method === 'PUT') {
        return putImpl();
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  }

  it('displays the actual server error message (e.g. plan limit) instead of generic Facebook post connections failure', async () => {
    setupBaseFetch(async () => ({
      ok: false,
      status: 403,
      json: async () => ({
        error: 'Limit reached: Brand voices (1/1)',
        code: 'PLAN_LIMIT_EXCEEDED',
      }),
    }));

    await act(async () => {
      root.render(<BrandMaterialsSection workspaceId="ws-1" userId="u-1" platform="facebook" />);
    });
    await flushEffects();

    const saveConnBtn = findButtonByText(host, 'Save Post Connections');
    expect(saveConnBtn).toBeDefined();

    await act(async () => {
      saveConnBtn!.click();
    });
    await flushEffects();

    expect(global.alert).toHaveBeenCalledWith('Limit reached: Brand voices (1/1)');
    const alertEl = host.querySelector('[role="alert"]');
    expect(alertEl?.textContent).toContain('Limit reached: Brand voices (1/1)');
    expect(alertEl?.textContent).toContain('Upgrade Plan');
  });

  it('auto-commits an uploaded photo from the inline form and preserves draft slug on Save Post Connections', async () => {
    let capturedPutBody: any = null;

    setupBaseFetch(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        slug: capturedPutBody.slug,
        pageUrl: `https://usha.unool.co/${capturedPutBody.slug}`,
        pages: [
          {
            id: 'p1',
            slug: 'showcase',
            title: 'Main Showcase',
            materials: [],
            linked_posts: [],
          },
          {
            id: 'p2',
            slug: capturedPutBody.slug,
            title: capturedPutBody.title,
            materials: capturedPutBody.materials,
            linked_posts: capturedPutBody.linked_posts,
          },
        ],
      }),
    }));

    const baseFetch = global.fetch as any;
    global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/api/brand-materials') && init?.method === 'PUT') {
        capturedPutBody = JSON.parse(String(init.body));
      }
      return baseFetch(url, init);
    });

    await act(async () => {
      root.render(<BrandMaterialsSection workspaceId="ws-1" userId="u-1" platform="facebook" />);
    });
    await flushEffects();

    const newPageBtn = findButtonByText(host, '+ Create Page for New Post');
    expect(newPageBtn).toBeDefined();

    await act(async () => {
      newPageBtn!.click();
    });

    const fileInput = host.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], 'lookbook-shot.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });

    await act(async () => {
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await flushEffects();

    expect(host.textContent).toContain('Add New Showcase Material');

    const linkBtn = findButtonByText(host, 'Link to this Page');
    expect(linkBtn).toBeDefined();
    await act(async () => {
      linkBtn!.click();
    });

    const saveConnBtn = findButtonByText(host, 'Save Post Connections');
    expect(saveConnBtn).toBeDefined();
    await act(async () => {
      saveConnBtn!.click();
    });
    await flushEffects();

    expect(capturedPutBody).not.toBeNull();
    expect(capturedPutBody.platform).toBe('facebook');
    expect(capturedPutBody.slug).toMatch(/^post-/);
    expect(capturedPutBody.materials).toHaveLength(1);
    expect(capturedPutBody.materials[0].type).toBe('image');
    expect(capturedPutBody.materials[0].title).toBe('lookbook-shot');
    expect(capturedPutBody.materials[0].url).toBe('/api/media/materials/test-photo.jpg');
    expect(capturedPutBody.linked_posts).toEqual(['fb_post_1']);
    expect(host.textContent).toContain('Saved: 1 Facebook post(s) linked to this page!');
  });
});
