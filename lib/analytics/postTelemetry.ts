/**
 * Deterministic Post Telemetry Extractor & Classifier
 *
 * Computes structured `posts` metadata (`hook_type`, `hook_formula_id`,
 * `hook_score`, `word_count`, `has_media`, `media_count`, `content_format`)
 * at write time (Composer / FlightPlan / Schedule) AND acts as a safe
 * fallback when reading historical database rows with missing columns.
 */

import { HookScorer } from '@/lib/ai/engines/HookScorer';

export type HookType =
  | 'question'
  | 'number'
  | 'contrarian'
  | 'story'
  | 'howto'
  | 'curiosity'
  | 'direct'
  | 'statement';

export type ContentFormat = 'text' | 'image' | 'video' | 'carousel' | 'article';

export type WordCountBracket = 'short' | 'punchy' | 'structured' | 'deep';

export interface HookStyleMeta {
  id: HookType;
  label: string;
  color: string;
  shortHint: string;
  sampleStarter: string;
}

export const HOOK_TYPE_META: Record<HookType, HookStyleMeta> = {
  question: {
    id: 'question',
    label: 'Question',
    color: '#0d9488',
    shortHint: 'Opens an unanswered question readers want resolved',
    sampleStarter: 'Why does growth stall right after your first 10 customers?',
  },
  number: {
    id: 'number',
    label: 'Number / Metric',
    color: '#2563eb',
    shortHint: 'Leads with concrete numbers, percentages, or counts',
    sampleStarter: '47 customer calls in 12 weeks taught us 3 pricing lessons:',
  },
  contrarian: {
    id: 'contrarian',
    label: 'Contrarian',
    color: '#e11d48',
    shortHint: 'Challenges conventional wisdom or exposes a hidden cost',
    sampleStarter: 'Most founders think daily posting builds growth. It does not.',
  },
  story: {
    id: 'story',
    label: 'Story / Moment',
    color: '#7c3aed',
    shortHint: 'Anchors in a first-person moment, failure, or lesson',
    sampleStarter: 'I spent 6 months building the wrong onboarding flow before realizing:',
  },
  howto: {
    id: 'howto',
    label: 'How-To / Guide',
    color: '#059669',
    shortHint: 'Promises a concrete repeatable process or teardown',
    sampleStarter: 'How we cut onboarding drop-off in half without adding a tour:',
  },
  curiosity: {
    id: 'curiosity',
    label: 'Curiosity Gap',
    color: '#d97706',
    shortHint: 'Withholds the reveal past the first fold line',
    sampleStarter: 'Nobody tells you what happens after a post hits 100k views:',
  },
  direct: {
    id: 'direct',
    label: 'Direct Callout',
    color: '#4f46e5',
    shortHint: 'Selects the exact reader ("If you build...", "For solo founders")',
    sampleStarter: 'If you are shipping solo this quarter, skip these 2 distractions:',
  },
  statement: {
    id: 'statement',
    label: 'Statement',
    color: '#64748b',
    shortHint: 'Direct declarative opener without special framing',
    sampleStarter: 'Shipping weekly compounds faster than waiting for perfection.',
  },
};

const VALID_HOOK_TYPES = new Set<string>(Object.keys(HOOK_TYPE_META));

export function normalizeHookType(raw: unknown): HookType | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.trim().toLowerCase();
  if (VALID_HOOK_TYPES.has(cleaned)) return cleaned as HookType;
  if (cleaned === 'how_to' || cleaned === 'how-to') return 'howto';
  return null;
}

/**
 * Extract the lead hook line(s) from post copy (up to first 220 chars / 2 lines).
 */
export function extractLeadHook(content: string): string {
  const cleaned = (content || '').trim();
  if (!cleaned) return '';
  const lines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return '';
  const first = lines[0];
  if (first.length >= 45 || lines.length === 1) return first.slice(0, 260);
  return `${first} ${lines[1]}`.slice(0, 260);
}

export function classifyHookType(content: string): HookType {
  const lead = extractLeadHook(content);
  const full = (content || '').trim().slice(0, 320);
  if (!lead) return 'statement';
  const lower = lead.toLowerCase();

  // Direct audience callout
  if (
    /\b(if you('re| are|'ve)?|for (founders|creators|builders|developers|engineers|designers|marketers|anyone|solo|teams))\b/i.test(lead)
  ) {
    return 'direct';
  }

  // Question opener
  if (
    lead.includes('?') ||
    /^(why|what|when|who|which|do you|are you|have you|did you|can you|is it)\b/i.test(lower)
  ) {
    return 'question';
  }

  // Contrarian / myth buster / reframe
  if (
    /\b(most people|unpopular opinion|stop doing|don't|never|myth|wrong|overrated|hidden cost|uncomfortable truth|is not .+ it is)\b/i.test(lower)
  ) {
    return 'contrarian';
  }

  // How-to / playbook
  if (
    /^(how (to|i|we)|step[- ]by[- ]step|\d+\s+steps?\b|guide to|playbook|framework)/i.test(lower) ||
    /\bhow i\b.+\bwithout\b/i.test(lower)
  ) {
    return 'howto';
  }

  // Curiosity / insider reveal
  if (
    /\b(nobody tells you|the thing about|secret|turned out|turns out|here('s| is) (why|what|the part)|wait until|replaced .+ with)\b/i.test(lower)
  ) {
    return 'curiosity';
  }

  // Number / metric / list opener
  if (
    /^(\$|€|£)?\d+[%kmxbKM]?\b/.test(lower) ||
    /\b\d+[%kmx]?\b.*\b(days?|weeks?|months?|years?|hours?|clients?|users?|lessons?|ways?|tips?|mistakes?)\b/i.test(full)
  ) {
    return 'number';
  }

  // Story / confession
  if (
    /^(it was |i (used to|spent|lost|failed|learned|built|quit|realized|asked|walked)|last (week|month|year)|after \d+ years?|\d+ years? ago|when i )/i.test(lower)
  ) {
    return 'story';
  }

  return 'statement';
}

export function countWords(content: string): number {
  const trimmed = (content || '').trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function getWordCountBracket(wordCount: number): {
  id: WordCountBracket;
  label: string;
  rangeLabel: string;
} {
  if (wordCount < 30) {
    return { id: 'short', label: 'Short Punch', rangeLabel: '< 30 words' };
  }
  if (wordCount < 80) {
    return { id: 'punchy', label: 'Sweet Spot', rangeLabel: '30–79 words' };
  }
  if (wordCount < 160) {
    return { id: 'structured', label: 'Narrative', rangeLabel: '80–159 words' };
  }
  return { id: 'deep', label: 'Deep Dive', rangeLabel: '160+ words' };
}

export interface MediaAssetLike {
  url?: string;
  type?: string;
}

export function normalizeMediaList(mediaUrls: unknown): Array<{ url: string; type: 'image' | 'video' }> {
  if (!Array.isArray(mediaUrls)) return [];
  const normalized: Array<{ url: string; type: 'image' | 'video' }> = [];
  for (const item of mediaUrls) {
    if (typeof item === 'string' && item.trim()) {
      const isVid = /\.(mp4|mov|webm|m4v)(\?|$)/i.test(item);
      normalized.push({ url: item.trim(), type: isVid ? 'video' : 'image' });
    } else if (item && typeof item === 'object') {
      const m = item as MediaAssetLike;
      if (typeof m.url === 'string' && m.url.trim()) {
        const type = m.type === 'video' || /\.(mp4|mov|webm|m4v)(\?|$)/i.test(m.url) ? 'video' : 'image';
        normalized.push({ url: m.url.trim(), type });
      }
    }
  }
  return normalized;
}

export function inferContentFormat(input: {
  media?: Array<{ url: string; type: string }>;
  hasMedia?: boolean;
  mediaCount?: number;
  wordCount: number;
  platforms?: string[];
  existingFormat?: unknown;
}): ContentFormat {
  if (
    typeof input.existingFormat === 'string' &&
    ['text', 'image', 'video', 'carousel', 'article'].includes(input.existingFormat) &&
    input.existingFormat !== 'text'
  ) {
    return input.existingFormat as ContentFormat;
  }

  const mediaList = input.media || [];
  const mCount = Math.max(mediaList.length, input.mediaCount ?? 0);
  const hasVid = mediaList.some(m => m.type === 'video');
  if (hasVid) return 'video';
  if (mCount >= 2) return 'carousel';
  if (mCount === 1 || input.hasMedia) return 'image';

  const articlePlatforms = new Set(['devto', 'hashnode', 'medium']);
  const pList = (input.platforms || []).map(p => p.toLowerCase());
  if (input.wordCount >= 350 || (pList.length > 0 && pList.every(p => articlePlatforms.has(p)) && input.wordCount >= 120)) {
    return 'article';
  }
  return 'text';
}

export interface ExtractedPostTelemetry {
  hookType: HookType;
  hookFormulaId: number | null;
  hookScore: number;
  wordCount: number;
  hasMedia: boolean;
  mediaCount: number;
  contentFormat: ContentFormat;
}

export function extractPostTelemetry(input: {
  content: string;
  mediaUrls?: unknown;
  variantMediaUrls?: unknown[];
  platforms?: string[];
  existingHookType?: unknown;
  existingHookFormulaId?: unknown;
  existingHookScore?: unknown;
  existingWordCount?: unknown;
  existingHasMedia?: unknown;
  existingMediaCount?: unknown;
  existingFormat?: unknown;
}): ExtractedPostTelemetry {
  const content = typeof input.content === 'string' ? input.content : '';
  const lead = extractLeadHook(content);
  const scored = lead ? HookScorer.score(lead) : null;

  const hookType = normalizeHookType(input.existingHookType) || classifyHookType(content);

  const hookFormulaId =
    typeof input.existingHookFormulaId === 'number' && Number.isFinite(input.existingHookFormulaId)
      ? input.existingHookFormulaId
      : scored?.matchedFormulas?.[0] ?? null;

  const hookScore =
    typeof input.existingHookScore === 'number' && Number.isFinite(input.existingHookScore)
      ? Math.max(0, Math.min(100, Math.round(input.existingHookScore)))
      : scored?.breakdown.totalScore ?? 0;

  const derivedWords = countWords(content);
  const wordCount =
    typeof input.existingWordCount === 'number' && input.existingWordCount > 0
      ? Math.round(input.existingWordCount)
      : derivedWords;

  const postMedia = normalizeMediaList(input.mediaUrls);
  const variantMedia = (input.variantMediaUrls || []).flatMap(v => normalizeMediaList(v));
  const combinedMedia = postMedia.length > 0 ? postMedia : variantMedia;

  const derivedMediaCount = combinedMedia.length;
  const mediaCount =
    typeof input.existingMediaCount === 'number' && input.existingMediaCount > 0
      ? Math.max(Math.round(input.existingMediaCount), derivedMediaCount)
      : derivedMediaCount;

  const hasMedia = Boolean(input.existingHasMedia) || mediaCount > 0;

  const contentFormat = inferContentFormat({
    media: combinedMedia,
    hasMedia,
    mediaCount,
    wordCount,
    platforms: input.platforms,
    existingFormat: input.existingFormat,
  });

  return {
    hookType,
    hookFormulaId,
    hookScore,
    wordCount,
    hasMedia,
    mediaCount,
    contentFormat,
  };
}
