import { PlatformType } from '@/lib/ai/PostAdapter';

// ─── Fold Linter (ported from ig-caption SKILL.md) ────────────────────────────
//
// Every platform truncates text before the user taps "see more" / "read more".
// If the hook or core message is hidden behind the fold, engagement collapses.
// This engine checks the visible window, hashtag caps, keyword density,
// and CTA placement for ALL text-based platforms UNOOL supports.

// ─── Per-platform fold specs ───────────────────────────────────────────────────

export interface PlatformFoldSpec {
  foldChars: number;              // chars visible before truncation
  foldLabel: string;              // human-readable label for UI
  hashtagCap: number;             // max recommended hashtags (0 = none)
  hashtagPlacement: 'inline' | 'end' | 'first_comment' | 'none';
  minKeywords: number;            // min searchable keywords in visible fold
  ctaRequired: boolean;           // does this platform expect a CTA?
  maxChars: number;               // hard char limit for the whole post
  supportsMarkdown: boolean;      // markdown rendering
  lineBreakStyle: 'double' | 'single' | 'none'; // preferred line break
}

export const PLATFORM_FOLD_SPECS: Partial<Record<PlatformType, PlatformFoldSpec>> = {
  instagram:  { foldChars: 125,    foldLabel: '125-char feed fold',          hashtagCap: 5,    hashtagPlacement: 'first_comment', minKeywords: 1, ctaRequired: true,  maxChars: 2200,   supportsMarkdown: false, lineBreakStyle: 'single' },
  linkedin:   { foldChars: 210,    foldLabel: '~210-char desktop fold',      hashtagCap: 5,    hashtagPlacement: 'end',           minKeywords: 2, ctaRequired: true,  maxChars: 3000,   supportsMarkdown: false, lineBreakStyle: 'double' },
  x:          { foldChars: 280,    foldLabel: 'Full tweet (no fold)',         hashtagCap: 2,    hashtagPlacement: 'inline',        minKeywords: 1, ctaRequired: false, maxChars: 280,    supportsMarkdown: false, lineBreakStyle: 'single' },
  threads:    { foldChars: 250,    foldLabel: '~250-char feed fold',          hashtagCap: 5,    hashtagPlacement: 'end',           minKeywords: 1, ctaRequired: false, maxChars: 500,    supportsMarkdown: false, lineBreakStyle: 'single' },
  bluesky:    { foldChars: 300,    foldLabel: 'Full post (no fold)',           hashtagCap: 2,    hashtagPlacement: 'inline',        minKeywords: 1, ctaRequired: false, maxChars: 300,    supportsMarkdown: false, lineBreakStyle: 'single' },
  facebook:   { foldChars: 250,    foldLabel: '~250-char mobile fold',        hashtagCap: 3,    hashtagPlacement: 'end',           minKeywords: 1, ctaRequired: false, maxChars: 5000,   supportsMarkdown: false, lineBreakStyle: 'double' },
  mastodon:   { foldChars: 500,    foldLabel: 'Full post (no fold)',           hashtagCap: 4,    hashtagPlacement: 'end',           minKeywords: 2, ctaRequired: false, maxChars: 500,    supportsMarkdown: false, lineBreakStyle: 'single' },
  warpcast:   { foldChars: 320,    foldLabel: 'Full cast (no fold)',           hashtagCap: 2,    hashtagPlacement: 'inline',        minKeywords: 1, ctaRequired: false, maxChars: 320,    supportsMarkdown: false, lineBreakStyle: 'single' },
  youtube:    { foldChars: 200,    foldLabel: 'Search snippet (~200 chars)',   hashtagCap: 5,    hashtagPlacement: 'end',           minKeywords: 3, ctaRequired: true,  maxChars: 5000,   supportsMarkdown: false, lineBreakStyle: 'double' },
  medium:     { foldChars: 300,    foldLabel: 'Preview card excerpt',          hashtagCap: 5,    hashtagPlacement: 'end',           minKeywords: 2, ctaRequired: false, maxChars: 100000, supportsMarkdown: true,  lineBreakStyle: 'double' },
  hashnode:   { foldChars: 250,    foldLabel: 'Feed subtitle excerpt',         hashtagCap: 5,    hashtagPlacement: 'end',           minKeywords: 3, ctaRequired: false, maxChars: 100000, supportsMarkdown: true,  lineBreakStyle: 'double' },
  devto:      { foldChars: 250,    foldLabel: 'Feed subtitle excerpt',         hashtagCap: 4,    hashtagPlacement: 'end',           minKeywords: 3, ctaRequired: false, maxChars: 100000, supportsMarkdown: true,  lineBreakStyle: 'double' },
  listmonk:   { foldChars: 200,    foldLabel: 'Email preview text',            hashtagCap: 0,    hashtagPlacement: 'none',          minKeywords: 2, ctaRequired: true,  maxChars: 100000, supportsMarkdown: true,  lineBreakStyle: 'double' },
  telegram:   { foldChars: 200,    foldLabel: 'Notification preview',          hashtagCap: 2,    hashtagPlacement: 'end',           minKeywords: 1, ctaRequired: false, maxChars: 4096,   supportsMarkdown: true,  lineBreakStyle: 'double' },
  discord:    { foldChars: 200,    foldLabel: 'Embed preview',                 hashtagCap: 0,    hashtagPlacement: 'none',          minKeywords: 0, ctaRequired: false, maxChars: 2000,   supportsMarkdown: true,  lineBreakStyle: 'double' },
  pinterest:  { foldChars: 100,    foldLabel: 'Pin description preview',       hashtagCap: 3,    hashtagPlacement: 'end',           minKeywords: 3, ctaRequired: true,  maxChars: 500,    supportsMarkdown: false, lineBreakStyle: 'single' },
  slack:      { foldChars: 200,    foldLabel: 'Message preview',               hashtagCap: 0,    hashtagPlacement: 'none',          minKeywords: 0, ctaRequired: true,  maxChars: 40000,  supportsMarkdown: true,  lineBreakStyle: 'double' },
  skool:      { foldChars: 300,    foldLabel: 'Post feed preview',             hashtagCap: 0,    hashtagPlacement: 'none',          minKeywords: 0, ctaRequired: true,  maxChars: 10000,  supportsMarkdown: false, lineBreakStyle: 'double' },
  whop:       { foldChars: 300,    foldLabel: 'Post feed preview',             hashtagCap: 0,    hashtagPlacement: 'none',          minKeywords: 0, ctaRequired: true,  maxChars: 10000,  supportsMarkdown: false, lineBreakStyle: 'double' },
  twitch:     { foldChars: 200,    foldLabel: 'Channel description preview',   hashtagCap: 0,    hashtagPlacement: 'none',          minKeywords: 2, ctaRequired: true,  maxChars: 500,    supportsMarkdown: false, lineBreakStyle: 'single' },
  kick:       { foldChars: 200,    foldLabel: 'Channel description preview',   hashtagCap: 0,    hashtagPlacement: 'none',          minKeywords: 1, ctaRequired: true,  maxChars: 10000,  supportsMarkdown: false, lineBreakStyle: 'single' },
  mewe:       { foldChars: 200,    foldLabel: 'Feed truncation',               hashtagCap: 3,    hashtagPlacement: 'end',           minKeywords: 1, ctaRequired: false, maxChars: 4000,   supportsMarkdown: false, lineBreakStyle: 'double' },
  nostr:      { foldChars: 500,    foldLabel: 'Client-dependent preview',      hashtagCap: 3,    hashtagPlacement: 'end',           minKeywords: 1, ctaRequired: false, maxChars: 65535,  supportsMarkdown: true,  lineBreakStyle: 'double' },
  lemmy:      { foldChars: 300,    foldLabel: 'Post feed excerpt',             hashtagCap: 0,    hashtagPlacement: 'none',          minKeywords: 1, ctaRequired: false, maxChars: 10000,  supportsMarkdown: true,  lineBreakStyle: 'double' },
};

// ─── Lint Result Types ─────────────────────────────────────────────────────────

export type LintStatus = 'PASS' | 'WARN' | 'FAIL';

export interface LintCheck {
  id: string;
  label: string;
  status: LintStatus;
  detail: string;
}

export interface FoldLintResult {
  platform: PlatformType;
  spec: PlatformFoldSpec;
  visiblePreview: string;          // the exact text visible before fold
  overallStatus: LintStatus;
  checks: LintCheck[];
  charCount: number;
  hashtagCount: number;
  isOverLimit: boolean;
}

// ─── Linter ────────────────────────────────────────────────────────────────────

export class FoldLinter {
  /**
   * Lint a piece of content against a specific platform's fold rules.
   *
   * @param content   The full post content (all characters)
   * @param platform  Target platform
   * @param keywords  Optional: expected SEO/search keywords to check for
   */
  static lint(
    content: string,
    platform: PlatformType,
    keywords: string[] = []
  ): FoldLintResult {
    const spec = PLATFORM_FOLD_SPECS[platform];

    // If platform has no spec, return a generic pass
    if (!spec) {
      return {
        platform,
        spec: {
          foldChars: 9999, foldLabel: 'No fold data', hashtagCap: 30,
          hashtagPlacement: 'end', minKeywords: 0, ctaRequired: false,
          maxChars: 9999, supportsMarkdown: false, lineBreakStyle: 'single',
        },
        visiblePreview: content.slice(0, 200),
        overallStatus: 'PASS',
        checks: [],
        charCount: content.length,
        hashtagCount: (content.match(/#\w+/g) || []).length,
        isOverLimit: false,
      };
    }

    const checks: LintCheck[] = [];
    const charCount = content.length;
    const visiblePreview = content.slice(0, spec.foldChars);
    const hashtags = content.match(/#\w+/g) || [];
    const hashtagCount = hashtags.length;

    // ── CHECK 1: Total character limit ────────────────────────────────────
    const overLimit = charCount > spec.maxChars;
    checks.push({
      id: 'char_limit',
      label: 'Character limit',
      status: overLimit ? 'FAIL' : charCount > spec.maxChars * 0.9 ? 'WARN' : 'PASS',
      detail: `${charCount.toLocaleString()} / ${spec.maxChars.toLocaleString()} characters`,
    });

    // ── CHECK 2: Fold content — does the hook complete before truncation? ─
    if (spec.foldChars < charCount) {
      const hookComplete = !visiblePreview.endsWith(',') &&
                           !visiblePreview.endsWith('and') &&
                           visiblePreview.length >= 30;
      const foldCutMidWord = /\w$/.test(visiblePreview) && content.length > spec.foldChars;
      checks.push({
        id: 'fold_hook',
        label: 'Fold content',
        status: foldCutMidWord ? 'WARN' : hookComplete ? 'PASS' : 'WARN',
        detail: foldCutMidWord
          ? `Fold cuts mid-word at char ${spec.foldChars}. The visible window: "${visiblePreview.slice(-30)}..."`
          : `${spec.foldLabel}: first ${spec.foldChars} chars must carry the core hook`,
      });
    } else {
      checks.push({
        id: 'fold_hook',
        label: 'Fold content',
        status: 'PASS',
        detail: `Content fits within ${spec.foldLabel}`,
      });
    }

    // ── CHECK 3: Hashtag count ────────────────────────────────────────────
    if (spec.hashtagCap > 0) {
      let hashtagStatus: LintStatus = 'PASS';
      let hashtagDetail = `${hashtagCount} hashtag${hashtagCount !== 1 ? 's' : ''}`;
      if (hashtagCount > spec.hashtagCap) {
        hashtagStatus = 'WARN';
        hashtagDetail += ` — exceeds recommended cap of ${spec.hashtagCap} for ${platform}`;
      } else if (hashtagCount === 0 && spec.minKeywords > 0) {
        hashtagStatus = 'WARN';
        hashtagDetail += ` — at least 1 hashtag recommended for ${platform} discoverability`;
      }
      checks.push({ id: 'hashtag_count', label: 'Hashtag count', status: hashtagStatus, detail: hashtagDetail });
    } else if (spec.hashtagCap === 0 && hashtagCount > 0) {
      checks.push({ id: 'hashtag_count', label: 'Hashtag count', status: 'WARN', detail: `Hashtags not typically used on ${platform} — remove for natural feel` });
    }

    // ── CHECK 4: Hashtag placement ────────────────────────────────────────
    if (spec.hashtagPlacement === 'first_comment' && hashtagCount > 0) {
      const hashtagsInBody = content.match(/#\w+/g) || [];
      if (hashtagsInBody.length > 0) {
        checks.push({ id: 'hashtag_placement', label: 'Hashtag placement', status: 'WARN', detail: `Move hashtags to first comment on ${platform} to protect caption reach` });
      }
    }

    // ── CHECK 5: Keyword density in visible fold ───────────────────────────
    if (keywords.length > 0 && spec.minKeywords > 0) {
      const visibleLower = visiblePreview.toLowerCase();
      const foundKeywords = keywords.filter(kw => visibleLower.includes(kw.toLowerCase()));
      const missing = keywords.filter(kw => !visibleLower.includes(kw.toLowerCase()));
      const kwStatus: LintStatus = foundKeywords.length >= spec.minKeywords ? 'PASS' : 'WARN';
      checks.push({
        id: 'keyword_density',
        label: 'Search keywords',
        status: kwStatus,
        detail: `${foundKeywords.length}/${keywords.length} present in fold.${missing.length > 0 ? ` Missing: ${missing.join(', ')}` : ''}`,
      });
    }

    // ── CHECK 6: CTA present ──────────────────────────────────────────────
    if (spec.ctaRequired) {
      const ctaPatterns = /comment|reply|dm|message|link in bio|save this|share|follow|subscribe|click|tap|download|get it|grab it|sign up|join|book|schedule|watch|read more/i;
      const hasCtA = ctaPatterns.test(content);
      checks.push({
        id: 'cta',
        label: 'Call-to-action',
        status: hasCtA ? 'PASS' : 'WARN',
        detail: hasCtA ? 'CTA detected' : `No clear CTA found — ${platform} benefits from a direct ask`,
      });
    }

    // ── CHECK 7: First sentence completeness ─────────────────────────────
    const firstSentence = content.split(/[.!?]\s/)[0] || '';
    const isHookComplete = firstSentence.length >= 20 && firstSentence.length <= 280;
    checks.push({
      id: 'first_sentence',
      label: 'First sentence',
      status: isHookComplete ? 'PASS' : firstSentence.length < 10 ? 'WARN' : 'PASS',
      detail: isHookComplete
        ? `First sentence: ${firstSentence.length} chars — delivers in the opening.`
        : `First sentence is ${firstSentence.length < 10 ? 'very short' : 'complete'}`,
    });

    // ── Overall status ────────────────────────────────────────────────────
    const hasFail = checks.some(c => c.status === 'FAIL');
    const hasWarn = checks.some(c => c.status === 'WARN');
    const overallStatus: LintStatus = hasFail ? 'FAIL' : hasWarn ? 'WARN' : 'PASS';

    return {
      platform,
      spec,
      visiblePreview,
      overallStatus,
      checks,
      charCount,
      hashtagCount,
      isOverLimit: overLimit,
    };
  }

  /**
   * Lint content against multiple platforms simultaneously.
   */
  static lintAll(
    content: string,
    platforms: PlatformType[],
    keywords: string[] = []
  ): Record<PlatformType, FoldLintResult> {
    return Object.fromEntries(
      platforms.map(p => [p, FoldLinter.lint(content, p, keywords)])
    ) as Record<PlatformType, FoldLintResult>;
  }

  /**
   * Get a simple summary of the fold window for a platform.
   */
  static getFoldPreview(content: string, platform: PlatformType): { preview: string; remaining: number; foldChar: number } {
    const spec = PLATFORM_FOLD_SPECS[platform];
    const foldChar = spec?.foldChars ?? content.length;
    return {
      preview: content.slice(0, foldChar),
      remaining: Math.max(0, content.length - foldChar),
      foldChar,
    };
  }
}
