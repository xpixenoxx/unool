import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import * as authServer from '@/lib/auth/server';
import { resetIdeasRateLimit } from '@/lib/ai/studioIdeas';

const { mockFindByWorkspaceId, mockGenerateText } = vi.hoisted(() => {
  return {
    mockFindByWorkspaceId: vi.fn(),
    mockGenerateText: vi.fn(),
  };
});

// Mock SupabaseProfileRepository
vi.mock('@/lib/repositories/supabase/SupabaseProfileRepository', () => {
  return {
    SupabaseProfileRepository: class {
      findByWorkspaceId = mockFindByWorkspaceId;
    },
  };
});

// Mock GroqProvider and getAIProvider
vi.mock('@/lib/ai/providers/GroqProvider', () => {
  return {
    GroqProvider: class {
      generateText = mockGenerateText;
    },
  };
});

vi.mock('@/lib/ai/provider', () => {
  return {
    getAIProvider: () => ({
      generateText: mockGenerateText,
    }),
  };
});

import { POST } from '../route';

describe('POST /api/studio/ideas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetIdeasRateLimit();
  });

  it('returns 401 when request is unauthorized', async () => {
    vi.spyOn(authServer, 'getCurrentAuth').mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/studio/ideas', {
      method: 'POST',
      body: JSON.stringify({ alreadyShown: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 when user has not completed studio profile', async () => {
    vi.spyOn(authServer, 'getCurrentAuth').mockResolvedValue({
      userId: 'user-1',
      workspaceId: 'ws-1',
      session: {} as any,
    });

    mockFindByWorkspaceId.mockResolvedValue({
      id: 'prof-1',
      workspaceId: 'ws-1',
      studioProfile: null,
      onboardingCompleted: false,
    });

    const req = new NextRequest('http://localhost:3000/api/studio/ideas', {
      method: 'POST',
      body: JSON.stringify({ alreadyShown: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.code).toBe('PROFILE_INCOMPLETE');
  });

  it('generates 3 ideas and passes correct prompt structure with profile, date, hooks and avoid list', async () => {
    vi.spyOn(authServer, 'getCurrentAuth').mockResolvedValue({
      userId: 'user-1',
      workspaceId: 'ws-1',
      session: {} as any,
    });

    mockFindByWorkspaceId.mockResolvedValue({
      id: 'prof-1',
      workspaceId: 'ws-1',
      studioProfile: {
        role: 'Tech Lead',
        doing: 'Building distributed systems and learning dance',
        audience: 'Junior software engineers',
        tone: 'Warm, candid, and humorous',
        style: 'Short punchy paragraphs',
        interests: ['Kuchipudi', 'Coffee', 'DevOps'],
        completedAt: '2026-10-15T00:00:00Z',
      },
      onboardingCompleted: true,
    });

    const mockAiResponse = JSON.stringify([
      {
        title: 'What dance rehearsals taught me about debugging',
        hook: 'My code failed 11 times today, and dance rehearsals felt the exact same.',
        format: 'story',
        why_it_works: 'Connects relatable code frustration with an unexpected personal hobby.',
      },
      {
        title: 'The myth of the 10x engineer',
        hook: 'Most 10x developers are just great communicators.',
        format: 'hot take',
        why_it_works: 'Disrupts an overrated industry belief.',
      },
      {
        title: 'Three morning habits to avoid the 2 PM slump',
        hook: 'I delayed my morning coffee by 90 minutes and stopped crashing.',
        format: 'how-to',
        why_it_works: 'Actionable and instantly testable advice.',
      },
    ]);

    mockGenerateText.mockResolvedValue({
      ok: true,
      value: { text: mockAiResponse },
    });

    const req = new NextRequest('http://localhost:3000/api/studio/ideas', {
      method: 'POST',
      body: JSON.stringify({
        alreadyShown: ['Previous idea title 1', 'Previous idea title 2'],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.ideas).toHaveLength(3);
    expect(data.ideas[0].title).toBe('What dance rehearsals taught me about debugging');
    expect(data.ideas[0].format).toBe('story');

    // Inspect the prompt sent to mockGenerateText
    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    const [sentPrompt, options] = mockGenerateText.mock.calls[0];
    expect(sentPrompt).toContain('Tech Lead');
    expect(sentPrompt).toContain('CREATOR PROFILE');
    expect(sentPrompt).toContain('Upcoming relevant moments:');
    expect(sentPrompt).toContain('Previous idea title 1');
    expect(options.temperature).toBeGreaterThanOrEqual(0.9);
  });

  it('enforces 20 calls per hour rate limiting', async () => {
    vi.spyOn(authServer, 'getCurrentAuth').mockResolvedValue({
      userId: 'user-rate-limited',
      workspaceId: 'ws-rate',
      session: {} as any,
    });

    mockFindByWorkspaceId.mockResolvedValue({
      id: 'prof-rate',
      workspaceId: 'ws-rate',
      studioProfile: {
        role: 'Founder',
        completedAt: '2026-10-15T00:00:00Z',
      },
    });

    mockGenerateText.mockResolvedValue({
      ok: true,
      value: {
        text: JSON.stringify([
          { title: 'T1', hook: 'H1', format: 'story', why_it_works: 'W1' },
          { title: 'T2', hook: 'H2', format: 'hot take', why_it_works: 'W2' },
          { title: 'T3', hook: 'H3', format: 'how-to', why_it_works: 'W3' },
        ]),
      },
    });

    // Make 20 requests
    for (let i = 0; i < 20; i++) {
      const req = new NextRequest('http://localhost:3000/api/studio/ideas', {
        method: 'POST',
        body: JSON.stringify({ alreadyShown: [] }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
    }

    // 21st request should be rate limited
    const req21 = new NextRequest('http://localhost:3000/api/studio/ideas', {
      method: 'POST',
      body: JSON.stringify({ alreadyShown: [] }),
    });
    const res21 = await POST(req21);
    expect(res21.status).toBe(429);
    const data21 = await res21.json();
    expect(data21.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
