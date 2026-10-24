import { describe, it, expect } from 'vitest';
import { getDraftOrigin, getDraftRedirect, type SignalPost } from '../SignalClient';

describe('Draft Redirection Logic in Signal', () => {
  it('correctly routes Flight Plan drafts to /dashboard/flightplan?postId=...', () => {
    const flightPlanPost: SignalPost = {
      id: 'fp-post-1',
      content: 'Flight plan draft story',
      status: 'draft',
      hookType: null,
      wordCount: 15,
      hasMedia: false,
      createdAt: new Date().toISOString(),
      publishedAt: null,
      origin: 'flightplan',
      arcId: 'arc-123',
      adaptationPromptVersion: 'schedule-engine-v1',
      variants: [],
    };

    expect(getDraftOrigin(flightPlanPost)).toBe('flightplan');
    const redirect = getDraftRedirect(flightPlanPost);
    expect(redirect.href).toBe('/dashboard/flightplan?postId=fp-post-1');
    expect(redirect.title).toContain('Flight Plan');
    expect(redirect.label).toBe('Flight Plan Draft');
  });

  it('correctly identifies Flight Plan drafts by arcId fallback', () => {
    const postWithArc: SignalPost = {
      id: 'fp-post-2',
      content: 'Arc draft story',
      status: 'draft',
      hookType: null,
      wordCount: 10,
      hasMedia: false,
      createdAt: new Date().toISOString(),
      publishedAt: null,
      arcId: 'arc-456',
      variants: [],
    };

    expect(getDraftOrigin(postWithArc)).toBe('flightplan');
    expect(getDraftRedirect(postWithArc).href).toBe('/dashboard/flightplan?postId=fp-post-2');
  });

  it('correctly routes Quick Broadcast drafts to /dashboard/studio?mode=quick&postId=...', () => {
    const quickBroadcastPost: SignalPost = {
      id: 'qb-post-1',
      content: 'Quick broadcast message',
      status: 'draft',
      hookType: null,
      wordCount: 8,
      hasMedia: false,
      createdAt: new Date().toISOString(),
      publishedAt: null,
      origin: 'quick-broadcast',
      adaptationPromptVersion: 'direct-broadcast',
      variants: [],
    };

    expect(getDraftOrigin(quickBroadcastPost)).toBe('quick-broadcast');
    const redirect = getDraftRedirect(quickBroadcastPost);
    expect(redirect.href).toBe('/dashboard/studio?mode=quick&postId=qb-post-1');
    expect(redirect.title).toContain('Quick Broadcast');
    expect(redirect.label).toBe('Quick Broadcast Draft');
  });

  it('correctly identifies Quick Broadcast drafts by adaptationPromptVersion direct-broadcast fallback', () => {
    const postWithDirectBroadcast: SignalPost = {
      id: 'qb-post-2',
      content: 'Direct broadcast fallback',
      status: 'draft',
      hookType: null,
      wordCount: 5,
      hasMedia: false,
      createdAt: new Date().toISOString(),
      publishedAt: null,
      adaptationPromptVersion: 'direct-broadcast',
      variants: [],
    };

    expect(getDraftOrigin(postWithDirectBroadcast)).toBe('quick-broadcast');
    expect(getDraftRedirect(postWithDirectBroadcast).href).toBe('/dashboard/studio?mode=quick&postId=qb-post-2');
  });

  it('correctly routes AI Composer drafts to /dashboard/studio?mode=ai&postId=...', () => {
    const aiComposerPost: SignalPost = {
      id: 'ai-post-1',
      content: 'AI adapted post source content',
      status: 'draft',
      hookType: null,
      wordCount: 12,
      hasMedia: false,
      createdAt: new Date().toISOString(),
      publishedAt: null,
      origin: 'ai-composer',
      adaptationPromptVersion: 'post-adapter-v2',
      variants: [],
    };

    expect(getDraftOrigin(aiComposerPost)).toBe('ai-composer');
    const redirect = getDraftRedirect(aiComposerPost);
    expect(redirect.href).toBe('/dashboard/studio?mode=ai&postId=ai-post-1');
    expect(redirect.title).toContain('AI Composer');
    expect(redirect.label).toBe('AI Composer Draft');
  });

  it('defaults unknown or post-adapter drafts to AI Composer', () => {
    const defaultPost: SignalPost = {
      id: 'unknown-post-1',
      content: 'Default post',
      status: 'draft',
      hookType: null,
      wordCount: 4,
      hasMedia: false,
      createdAt: new Date().toISOString(),
      publishedAt: null,
      variants: [],
    };

    expect(getDraftOrigin(defaultPost)).toBe('ai-composer');
    expect(getDraftRedirect(defaultPost).href).toBe('/dashboard/studio?mode=ai&postId=unknown-post-1');
  });
});
