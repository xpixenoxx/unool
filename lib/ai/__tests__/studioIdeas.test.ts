import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildIdeasPrompt,
  validateIdeasSchema,
  filterDuplicates,
  sanitizeAlreadyShown,
  parseRawIdeasResponse,
  checkIdeasRateLimit,
  resetIdeasRateLimit,
  ALLOWED_FORMATS,
  StudioIdea,
} from '../studioIdeas';

describe('studioIdeas', () => {
  beforeEach(() => {
    resetIdeasRateLimit();
  });

  describe('Prompt Construction', () => {
    it('includes today date, hooks, creator profile block, and avoid list in prompt', () => {
      const mockProfile = {
        role: 'Tech Lead & Dancer',
        doing: 'Building distributed systems and learning Kuchipudi',
        audience: 'Junior and mid-level software engineers',
        tone: 'Warm, candid, and humorous',
        style: 'Short punchy paragraphs with clear takeaways',
        interests: ['Classical dance', 'Coffee brewing', 'Distributed systems'],
      };

      const date = new Date(2026, 9, 15);
      const alreadyShown = [
        'What learning Kuchipudi taught me about debugging',
        'Why distributed systems fail on Friday nights',
      ];

      const { prompt, avoidList, systemPrompt } = buildIdeasPrompt({
        profile: mockProfile,
        today: date,
        alreadyShown,
      });

      expect(systemPrompt).toBe('You are a friendly content coach helping a creator figure out what to post.');
      expect(prompt).toContain('Today\'s date: Oct 15, 2026');
      expect(prompt).toContain('Upcoming relevant moments:');
      expect(prompt).toContain('CREATOR PROFILE');
      expect(prompt).toContain('Tech Lead & Dancer');
      expect(prompt).toContain('Warm, candid, and humorous');
      expect(avoidList).toContain('What learning Kuchipudi taught me about debugging');
      expect(avoidList).toContain('Why distributed systems fail on Friday nights');
      expect(prompt).toContain('MUST-FOLLOW RULES');
      expect(prompt).toContain('Return ONLY a JSON array');
    });

    it('uses "none" when alreadyShown is empty', () => {
      const { prompt, avoidList } = buildIdeasPrompt({
        profile: { role: 'Founder' },
        alreadyShown: [],
      });

      expect(avoidList).toBe('none');
      expect(prompt).toContain('none');
    });
  });

  describe('Sanitization of alreadyShown', () => {
    it('trims, limits length to 120 chars, and keeps max 15 most recent', () => {
      const raw = Array.from({ length: 25 }, (_, i) => `Idea ${i} ${'x'.repeat(150)}`);
      const sanitized = sanitizeAlreadyShown(raw);

      expect(sanitized.length).toBe(15);
      expect(sanitized[sanitized.length - 1].length).toBeLessThanOrEqual(120);
      expect(sanitized[0].startsWith('Idea 10')).toBe(true);
    });

    it('ignores non-string or empty inputs', () => {
      expect(sanitizeAlreadyShown([null, undefined, 42, '', '  ', 'Valid title'])).toEqual(['Valid title']);
    });
  });

  describe('Schema Validation & Parsing', () => {
    const validIdeas: StudioIdea[] = [
      {
        title: 'Dancing through production outages',
        hook: 'My Kubernetes cluster crashed right before my dance rehearsal.',
        format: 'story',
        why_it_works: 'Connects relatable high-stakes tech stress with an unexpected personal hobby.',
      },
      {
        title: 'The myth of the 10x developer',
        hook: 'Most 10x engineers I know are actually just great at communicating.',
        format: 'hot take',
        why_it_works: 'Challenges a widespread industry trope in a grounded, humble way.',
      },
      {
        title: 'Three coffee habits for morning clarity',
        hook: 'I stopped drinking coffee right after waking up, and my 10 AM slump vanished.',
        format: 'how-to',
        why_it_works: 'Provides an immediate, testable tip that appeals to busy professionals.',
      },
    ];

    it('validates good JSON array of 3 ideas', () => {
      const result = validateIdeasSchema(validIdeas);
      expect(result.valid).toBe(true);
      expect(result.ideas?.length).toBe(3);
      expect(result.ideas?.[0].format).toBe('story');
    });

    it('parses raw response with code fences', () => {
      const rawText = '```json\n' + JSON.stringify(validIdeas) + '\n```';
      const parsed = parseRawIdeasResponse(rawText);
      const result = validateIdeasSchema(parsed);
      expect(result.valid).toBe(true);
      expect(result.ideas?.length).toBe(3);
    });

    it('parses response wrapped in { ideas: [...] } object', () => {
      const rawText = JSON.stringify({ ideas: validIdeas });
      const parsed = parseRawIdeasResponse(rawText);
      const result = validateIdeasSchema(parsed);
      expect(result.valid).toBe(true);
      expect(result.ideas?.length).toBe(3);
    });

    it('fails when count is not 3', () => {
      const twoIdeas = validIdeas.slice(0, 2);
      const result = validateIdeasSchema(twoIdeas);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Expected exactly 3 valid ideas');
    });

    it('fails when format is not allowed', () => {
      const invalid = [
        ...validIdeas.slice(0, 2),
        {
          title: 'Another post',
          hook: 'Some hook here',
          format: 'unsupported-format' as any,
          why_it_works: 'Some explanation',
        },
      ];
      const result = validateIdeasSchema(invalid);
      expect(result.valid).toBe(false);
      expect(result.ideas?.length).toBe(2);
    });

    it('fails when required fields are missing or empty', () => {
      const invalid = [
        ...validIdeas.slice(0, 2),
        {
          title: '',
          hook: 'Some hook',
          format: 'story' as const,
          why_it_works: 'Works well',
        },
      ];
      const result = validateIdeasSchema(invalid);
      expect(result.valid).toBe(false);
    });
  });

  describe('Duplicate Filtering', () => {
    const candidates: StudioIdea[] = [
      {
        title: 'What learning Kuchipudi taught me about debugging',
        hook: 'Dance taught me patience in code.',
        format: 'story',
        why_it_works: 'Personal analogy.',
      },
      {
        title: 'Why your startup should slow down hiring',
        hook: 'Hiring too fast killed my first team.',
        format: 'hot take',
        why_it_works: 'Counter-intuitive founder advice.',
      },
      {
        title: 'Diwali preparation for busy remote engineers',
        hook: 'Balancing sprint deadlines with festive cleaning.',
        format: 'behind-the-scenes',
        why_it_works: 'Timely and culturally relatable.',
      },
    ];

    it('filters out near-duplicate titles', () => {
      const alreadyShown = [
        'what learning kuchipudi taught me about debugging when nothing works',
      ];
      const filtered = filterDuplicates(candidates, alreadyShown);
      expect(filtered.length).toBe(2);
      expect(filtered[0].title).toBe('Why your startup should slow down hiring');
      expect(filtered[1].title).toBe('Diwali preparation for busy remote engineers');
    });

    it('keeps all items when no duplicates exist', () => {
      const filtered = filterDuplicates(candidates, ['Completely unrelated post title']);
      expect(filtered.length).toBe(3);
    });
  });

  describe('Rate Limiter', () => {
    it('allows up to 20 calls per hour and blocks the 21st', () => {
      const userId = 'user-test-123';
      for (let i = 1; i <= 20; i++) {
        const check = checkIdeasRateLimit(userId, 20);
        expect(check.allowed).toBe(true);
        expect(check.remaining).toBe(20 - i);
      }

      const check21 = checkIdeasRateLimit(userId, 20);
      expect(check21.allowed).toBe(false);
      expect(check21.remaining).toBe(0);
    });
  });
});
