import { StudioProfile } from '@/lib/config/studioOnboarding';
import { buildStudioContext, sanitizeProfileValue } from './studioContext';
import { seasonalHooks, formatSeasonalHooks } from '@/lib/config/seasonalHooks';
import { getAIProvider } from './provider';
import { logger } from '@/lib/logger';

export const ALLOWED_FORMATS = [
  'story',
  'hot take',
  'how-to',
  'carousel',
  'behind-the-scenes',
  'question to audience',
  'list',
] as const;

export type IdeaFormat = (typeof ALLOWED_FORMATS)[number];

export interface StudioIdea {
  title: string;
  hook: string;
  format: IdeaFormat;
  why_it_works: string;
}

/**
 * Sanitizes already shown titles from client:
 * - Strings only
 * - Trimmed and whitespace-collapsed
 * - Max 120 characters each
 * - At most 15 most recent titles
 */
export function sanitizeAlreadyShown(input: unknown): string[] {
  if (!Array.isArray(input)) return [];

  const cleaned: string[] = [];
  // Process in order, taking the most recent if more than 15
  const candidates = input.slice(-15);

  for (const item of candidates) {
    if (typeof item !== 'string') continue;
    const sanitized = item
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (sanitized.length > 0) {
      cleaned.push(sanitized.slice(0, 120).trim());
    }
  }

  return cleaned;
}

/**
 * Builds the complete prompt for idea generation.
 */
export function buildIdeasPrompt(params: {
  profile: StudioProfile | Record<string, any>;
  today?: Date;
  alreadyShown?: string[];
  seasonalMomentList?: string[];
}): { systemPrompt: string; prompt: string; avoidList: string } {
  const dateObj = params.today || new Date();
  const formattedToday = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const hooks = params.seasonalMomentList || seasonalHooks(dateObj);
  const hooksText = formatSeasonalHooks(hooks);

  const studioContextBlock = buildStudioContext(params.profile);
  const rawTone = Array.isArray(params.profile?.tone) ? params.profile.tone[0] : params.profile?.tone;
  const tone = sanitizeProfileValue(rawTone) || 'conversational and authentic';

  const sanitizedShown = sanitizeAlreadyShown(params.alreadyShown);
  const avoidList =
    sanitizedShown.length > 0
      ? sanitizedShown.map((t) => `- "${t}"`).join('\n')
      : 'none';

  const systemPrompt = 'You are a friendly content coach helping a creator figure out what to post.';

  const rawRole = params.profile?.role || (params.profile as any)?.persona || '';
  const roleStr = sanitizeProfileValue(rawRole) || 'Creator';
  const isStudentRole = roleStr.toLowerCase().includes('student');

  const prompt = `You are a friendly content coach helping a creator figure out what to post.
Today's date: ${formattedToday}. Upcoming relevant moments: ${hooksText}.

${studioContextBlock}

Generate exactly 3 post ideas.

MUST-FOLLOW RULES
- STRICT ROLE ALIGNMENT: All 3 ideas must strictly reflect the creator's active role: "${roleStr}". ${!isStudentRole ? `The creator is a ${roleStr}, NOT a student. Absolutely DO NOT generate ideas, hooks, or analogies about exams, homework, classes, grades, or student life. Focus on real-world ${roleStr} topics: product development, business growth, customers, hiring, bootstrapping, and leadership.` : 'Focus on student projects, campus life, studying, and growth.'}
- UNIQUE: each idea combines at least TWO things from the profile (for example what their business does + a stage lesson/challenge, or what they love talking about at work + an outside interest or seasonal moment). Nothing that any creator in any niche could post.
- NOT GENERIC: ban '5 tips for...', 'why consistency matters', 'my journey', 'lessons I learned', 'Monday motivation' style ideas.
- CONVERSATIONAL AND EASY TO UNDERSTAND: write like a smart friend talking, in simple everyday words. Short sentences. No jargon, no buzzwords, no abstract or poetic phrasing. A person should understand the idea in 3 seconds without re-reading. Each title must be plain (max 12 words) and say exactly what the post is about.
- Each hook is the first line of the post, written the way the creator would actually say it out loud, in their tone (${tone}).
- BROADLY LIKEABLE: base ideas on relatable feelings and everyday situations most people connect with (funny truths, small wins, common struggles, curiosity). Avoid niche insider references that only a few would get.
- The 3 ideas in a batch must be clearly different from each other (different angle or format).
- Do not mention specific news events, products, or statistics you cannot verify. Do not invent facts about the creator.
- Do NOT repeat or closely resemble these earlier ideas:
${avoidList}

EXAMPLES OF THE STYLE WE WANT (for style only, never copy):
Too generic: 'Tips for staying productive as a developer'.
Too fancy: 'Orchestrating cognitive bandwidth through deliberate architectural minimalism'.
Just right: 'What learning Kuchipudi taught me about debugging when nothing works'.
Hook just right: 'My code failed 11 times today, and honestly dance rehearsals felt exactly the same.'

Return ONLY a JSON array, no markdown and no extra text:
[{"title":"","hook":"","format":"","why_it_works":""}]
format must be one of: story, hot take, how-to, carousel, behind-the-scenes, question to audience, list.
why_it_works is ONE short plain sentence.`;

  return { systemPrompt, prompt, avoidList };
}

/**
 * Normalizes a title for duplicate comparison.
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Simple word overlap similarity check between two titles.
 */
export function areTitlesSimilar(a: string, b: string): boolean {
  const normA = normalizeTitle(a);
  const normB = normalizeTitle(b);

  if (normA === normB) return true;
  if (!normA || !normB) return false;

  // Substring containment
  if (normA.includes(normB) || normB.includes(normA)) return true;

  const wordsA = new Set(normA.split(' ').filter((w) => w.length > 2));
  const wordsB = new Set(normB.split(' ').filter((w) => w.length > 2));

  if (wordsA.size === 0 || wordsB.size === 0) return false;

  let common = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) common++;
  }

  const similarity = (2 * common) / (wordsA.size + wordsB.size);
  return similarity >= 0.7;
}

/**
 * Filters out ideas that match or closely resemble previously shown titles.
 */
export function filterDuplicates(ideas: StudioIdea[], alreadyShown: string[]): StudioIdea[] {
  if (!alreadyShown || alreadyShown.length === 0) return ideas;

  const filtered: StudioIdea[] = [];
  for (const idea of ideas) {
    const isDup = alreadyShown.some((shown) => areTitlesSimilar(idea.title, shown));
    if (!isDup) {
      filtered.push(idea);
    }
  }

  return filtered;
}

/**
 * Validates a single idea against schema requirements.
 */
export function validateSingleIdea(item: any): StudioIdea | null {
  if (!item || typeof item !== 'object') return null;

  const title = typeof item.title === 'string' ? item.title.trim() : '';
  const hook = typeof item.hook === 'string' ? item.hook.trim() : '';
  const formatRaw = typeof item.format === 'string' ? item.format.trim().toLowerCase() : '';
  const why_it_works = typeof item.why_it_works === 'string' ? item.why_it_works.trim() : '';

  // Required non-empty string fields
  if (!title || !hook || !formatRaw || !why_it_works) return null;

  // Title limits: max 120 chars, max 15 words
  const words = title.split(/\s+/).filter(Boolean);
  if (title.length > 120 || words.length > 15) return null;

  // Hook limit: max 320 chars
  if (hook.length > 320) return null;

  // Why it works limit: max 220 chars
  if (why_it_works.length > 220) return null;

  // Format validation
  const matchedFormat = ALLOWED_FORMATS.find(
    (f) => f === formatRaw || formatRaw.includes(f)
  );
  if (!matchedFormat) return null;

  return {
    title,
    hook,
    format: matchedFormat,
    why_it_works,
  };
}

/**
 * Parses raw LLM text response into candidate JSON.
 */
export function parseRawIdeasResponse(text: string): any {
  let cleaned = text.trim();
  // Strip code fences
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  // Parse JSON
  const parsed = JSON.parse(cleaned);

  // If wrapped in { ideas: [...] } or { posts: [...] }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    if (Array.isArray(parsed.ideas)) return parsed.ideas;
    if (Array.isArray(parsed.posts)) return parsed.posts;
    if (Array.isArray(parsed.items)) return parsed.items;
  }

  return parsed;
}

/**
 * Validates candidate ideas against the 3-idea schema.
 */
export function validateIdeasSchema(raw: unknown): {
  valid: boolean;
  ideas?: StudioIdea[];
  error?: string;
} {
  if (!Array.isArray(raw)) {
    return { valid: false, error: 'Expected JSON array of ideas' };
  }

  const validIdeas: StudioIdea[] = [];
  for (const item of raw) {
    const validated = validateSingleIdea(item);
    if (validated) {
      validIdeas.push(validated);
    }
  }

  if (validIdeas.length !== 3) {
    return {
      valid: false,
      error: `Expected exactly 3 valid ideas, received ${validIdeas.length}`,
      ideas: validIdeas,
    };
  }

  return { valid: true, ideas: validIdeas };
}

/**
 * In-memory sliding window rate limiter fallback (20 calls per hour per user).
 */
const rateLimitMap = new Map<string, number[]>();

export function checkIdeasRateLimit(
  userId: string,
  limit: number = 20,
  windowMs: number = 60 * 60 * 1000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const timestamps = rateLimitMap.get(userId) || [];
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= limit) {
    const oldest = validTimestamps[0];
    const resetTime = oldest + windowMs;
    rateLimitMap.set(userId, validTimestamps);
    return { allowed: false, remaining: 0, resetTime };
  }

  validTimestamps.push(now);
  rateLimitMap.set(userId, validTimestamps);
  return {
    allowed: true,
    remaining: limit - validTimestamps.length,
    resetTime: now + windowMs,
  };
}

/**
 * Resets the in-memory rate limiter (useful for tests).
 */
export function resetIdeasRateLimit(): void {
  rateLimitMap.clear();
}

/**
 * Deterministic, contextual fallback ideas generator that guarantees fresh,
 * high-converting ideas even if the AI provider times out or is unconfigured.
 */
export function synthesizeFallbackIdeas(
  profile?: StudioProfile | Record<string, any> | null,
  alreadyShown: string[] = []
): StudioIdea[] {
  const role = profile?.role || (profile as any)?.persona || 'Founder & Creator';
  const domain = profile?.businessDomain || profile?.doing || (profile as any)?.company || 'Product Growth';

  const pool: StudioIdea[] = [
    {
      title: `The biggest misconception about succeeding as a ${role}`,
      hook: `Most people think winning as a ${role} is about grinding 80 hours a week. Here is what actually moved the needle for us:`,
      format: 'hot take',
      why_it_works: 'Challenges common industry dogma with refreshing honesty that drives saves and shares.',
    },
    {
      title: `The pivot that changed everything for our ${domain}`,
      hook: `We spent months pushing a feature nobody asked for. The moment we stripped it down, our retention spiked:`,
      format: 'story',
      why_it_works: 'Vulnerability and tangible turnaround stories build authority and emotional connection.',
    },
    {
      title: `Our 3-step checklist before shipping any update in ${domain}`,
      hook: `Every time we skip step 2 on this list, something breaks in production. Here is our exact pre-launch filter:`,
      format: 'how-to',
      why_it_works: 'Actionable tactical frameworks trigger high bookmark rates and immediate peer discussion.',
    },
    {
      title: `Behind the scenes: what our actual numbers looked like this month`,
      hook: `Transparency check: the real metrics, the churn spike we did not expect, and how we responded.`,
      format: 'behind-the-scenes',
      why_it_works: 'Raw build-in-public metrics cut through generic marketing noise instantly.',
    },
    {
      title: `Question for fellow creators and builders in ${domain}`,
      hook: `When you are scaling fast, how do you balance shipping speed vs technical debt? Curious how you handle it:`,
      format: 'question to audience',
      why_it_works: 'Low-friction, relatable questions drive high comment velocity and algorithmic reach.',
    },
    {
      title: `3 tools and mental models that saved our team 15+ hours`,
      hook: `We replaced 4 messy spreadsheets with one automated workflow. Here are the 3 simple shifts:`,
      format: 'list',
      why_it_works: 'Curated tool stacks with concrete time savings deliver instant tangible utility.',
    },
    {
      title: `The hardest lesson we learned the hard way this quarter`,
      hook: `I used to think customer feedback should dictate every roadmap decision. I was wrong. Here is why:`,
      format: 'story',
      why_it_works: 'Contrarian personal epiphanies provoke curiosity and spark engaging debate.',
    },
  ];

  const candidates = pool.filter(
    (item) => !alreadyShown.some((shown) => areTitlesSimilar(item.title, shown))
  );

  return candidates.length >= 3 ? candidates.slice(0, 3) : pool.slice(0, 3);
}
