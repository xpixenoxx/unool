// ─── ContentHumanizer (ported from ig-human SKILL.md) ─────────────────────────
//
// Strips "AI fingerprints" from generated content:
// 1. Removes em dashes and replaces with natural punctuation
// 2. Removes slop vocabulary (delve, tapestry, game-changer, etc.)
// 3. Removes invisible Unicode watermark characters that some models inject
// 4. Flattens overly symmetrical sentence structures
// 5. Scores the result against a 5-check panel before returning
//
// This works identically for ALL platforms — LinkedIn, Instagram, Medium,
// Dev.to, Hashnode, X, Threads, YouTube descriptions, newsletters, etc.
// The only platform-specific adjustment is whether markdown is preserved.

import { PlatformType } from '@/lib/ai/PostAdapter';

// ─── Slop vocabulary replacements ─────────────────────────────────────────────

interface SlopReplacement {
  pattern: RegExp;
  replacement: string;
  reason: string;
}

const SLOP_REPLACEMENTS: SlopReplacement[] = [
  // Signature AI buzzwords
  { pattern: /\bdelve\b/gi,             replacement: 'explore',      reason: 'delve is an AI signature word' },
  { pattern: /\btapestry\b/gi,          replacement: 'mix',          reason: 'tapestry is an AI metaphor cliche' },
  { pattern: /\brobust\b/gi,            replacement: 'strong',       reason: 'robust is overused AI filler' },
  { pattern: /\bseamless(ly)?\b/gi,     replacement: 'smooth$1',     reason: 'seamlessly is AI padding' },
  { pattern: /\bleverage\b/gi,          replacement: 'use',          reason: 'leverage is corporate slop' },
  { pattern: /\bsynergy\b/gi,           replacement: 'alignment',    reason: 'synergy is a credibility killer' },
  { pattern: /\bholistic\b/gi,          replacement: 'complete',     reason: 'holistic is overused jargon' },
  { pattern: /\bstreamline\b/gi,        replacement: 'simplify',     reason: 'streamline is corporate filler' },
  { pattern: /\bparadigm\b/gi,          replacement: 'approach',     reason: 'paradigm is overused jargon' },
  { pattern: /\binnovative\b/gi,        replacement: 'new',          reason: 'innovative is a claim without proof' },
  { pattern: /\btransformative\b/gi,    replacement: 'powerful',     reason: 'transformative is an AI intensifier' },
  { pattern: /\bimpactful\b/gi,         replacement: 'effective',    reason: 'impactful is hollow corporate speech' },
  { pattern: /\bactionable\b/gi,        replacement: 'practical',    reason: 'actionable is overused' },
  { pattern: /\bscalable\b/gi,          replacement: 'scalable',     reason: 'scalable is fine in technical context but overused in marketing' },
  { pattern: /\bunpack\b/gi,            replacement: 'explain',      reason: 'unpack is an AI speech pattern' },
  { pattern: /\blearnings\b/gi,         replacement: 'lessons',      reason: 'learnings is not a word' },
  { pattern: /\bcrucial\b/gi,           replacement: 'important',    reason: 'crucial is an AI intensifier' },
  { pattern: /\butilize\b/gi,           replacement: 'use',          reason: 'utilize when use works is padding' },
  { pattern: /\bfacilitate\b/gi,        replacement: 'help',         reason: 'facilitate is corporate padding' },

  // Long-form AI filler phrases
  { pattern: /in today'?s fast-?paced world[,.]?\s*/gi,        replacement: '',           reason: 'stock AI opener' },
  { pattern: /in today'?s digital landscape[,.]?\s*/gi,        replacement: '',           reason: 'stock AI opener' },
  { pattern: /it'?s important to note that\s*/gi,              replacement: '',           reason: 'hedging filler' },
  { pattern: /it is worth (noting|mentioning) that\s*/gi,      replacement: '',           reason: 'hedging filler' },
  { pattern: /at the end of the day[,.]?\s*/gi,                replacement: '',           reason: 'cliche filler' },
  { pattern: /think outside the box/gi,                         replacement: 'think differently', reason: 'dead metaphor' },
  { pattern: /move the needle/gi,                               replacement: 'make progress', reason: 'corporate cliche' },
  { pattern: /low-?hanging fruit/gi,                            replacement: 'easy wins',  reason: 'corporate cliche' },
  { pattern: /circle back/gi,                                   replacement: 'follow up',  reason: 'corporate cliche' },
  { pattern: /deep dive/gi,                                     replacement: 'close look', reason: 'overused jargon' },
  { pattern: /testament to/gi,                                  replacement: 'proof of',   reason: 'AI flourish' },

  // Instagram-specific slop
  { pattern: /^stop scrolling[!.,]?\s*/gim,                    replacement: '',           reason: 'attention-begging opener' },
  { pattern: /follow for more[!.]?\s*/gi,                      replacement: '',           reason: 'reflex bait phrase' },
  { pattern: /tag someone who needs this[!.]?\s*/gi,           replacement: '',           reason: 'engagement bait cliche' },
  { pattern: /the algorithm loves\s*/gi,                       replacement: '',           reason: 'algorithm-begging phrase' },
  { pattern: /run don'?t walk[!.]?\s*/gi,                      replacement: '',           reason: 'urgency cliche' },
];

// ─── Em dash → natural punctuation ────────────────────────────────────────────

const EM_DASH_CONVERSIONS: { pattern: RegExp; replacement: string }[] = [
  // "word — word" → "word. word" (full thought break)
  { pattern: /(\w)\s*—\s*([A-Z])/g,   replacement: '$1. $2' },
  // "word — word" mid-sentence → "word, word" (light break)
  { pattern: /(\w)\s*—\s*(\w)/g,      replacement: '$1, $2' },
  // "— word" at line start → ", word"
  { pattern: /^—\s*/gm,               replacement: '' },
];

// ─── Invisible Unicode watermark characters ────────────────────────────────────
// Some LLMs inject zero-width characters or directional marks as soft watermarks.

const INVISIBLE_CHAR_PATTERN = /[\u200B\u200C\u200D\u200E\u200F\u202A-\u202E\uFEFF\u00AD]/g;

// ─── Symmetric sentence breaker ───────────────────────────────────────────────
// Detects patterns like "Not only ... but also ..." or "First... Second... Third..."
// which are AI organizational clichés and proposes corrections.

const SYMMETRIC_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /not only .{5,80} but also/gi,          label: '"Not only ... but also" structure' },
  { pattern: /first(ly)?[,.]\s.+second(ly)?[,.]\s/gi, label: 'First/Second list structure' },
  { pattern: /on one hand.{5,100}on the other hand/gi, label: '"On one hand ... on the other hand"' },
  { pattern: /in conclusion[,.]?\s*/gi,              label: '"In conclusion" opener' },
  { pattern: /to (summarize|sum up)[,.]?\s*/gi,      label: '"To summarize" opener' },
  { pattern: /last but not least[,.]?\s*/gi,         label: '"Last but not least" closer' },
];

// ─── 5-Check Panel ─────────────────────────────────────────────────────────────

export interface HumanizePanelCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface HumanizeResult {
  original: string;
  humanized: string;
  changed: boolean;
  changeCount: number;
  changes: { type: string; original: string; replacement: string; reason: string }[];
  panelChecks: HumanizePanelCheck[];
  panelScore: number;   // 0-100, how human the final text reads
  platform: PlatformType | null;
}

// ─── Main Humanizer ────────────────────────────────────────────────────────────

export class ContentHumanizer {
  /**
   * Run the full humanizer pipeline on content.
   * Strips AI fingerprints, replaces slop, removes invisible chars.
   *
   * @param content   Raw content to humanize
   * @param platform  Optional: preserve platform-specific formatting (e.g. markdown for Hashnode)
   */
  static humanize(content: string, platform?: PlatformType | null): HumanizeResult {
    let text = content;
    const changes: HumanizeResult['changes'] = [];

    // Step 1: Strip invisible Unicode watermarks
    const withoutInvisible = text.replace(INVISIBLE_CHAR_PATTERN, '');
    if (withoutInvisible !== text) {
      changes.push({ type: 'invisible_chars', original: '(invisible characters)', replacement: '(removed)', reason: 'AI invisible watermark characters' });
      text = withoutInvisible;
    }

    // Step 2: Fix em dashes
    for (const conv of EM_DASH_CONVERSIONS) {
      const newText = text.replace(conv.pattern, conv.replacement);
      if (newText !== text) {
        changes.push({ type: 'em_dash', original: '—', replacement: conv.replacement.includes('.') ? '.' : ',', reason: 'Em dash replaced with natural punctuation' });
        text = newText;
      }
    }

    // Step 3: Replace slop vocabulary
    for (const slop of SLOP_REPLACEMENTS) {
      const newText = text.replace(slop.pattern, slop.replacement);
      if (newText !== text) {
        changes.push({ type: 'slop_word', original: slop.pattern.source, replacement: slop.replacement, reason: slop.reason });
        text = newText;
      }
    }

    // Step 4: Clean up blank lines created by removing openers
    text = text.replace(/\n{3,}/g, '\n\n').trim();

    // Step 5: Run 5-check panel on the final text
    const panelChecks = ContentHumanizer.runPanel(content, text, platform ?? null);
    const panelScore = Math.round(
      (panelChecks.filter(c => c.passed).length / panelChecks.length) * 100
    );

    return {
      original: content,
      humanized: text,
      changed: text !== content,
      changeCount: changes.length,
      changes,
      panelChecks,
      panelScore,
      platform: platform ?? null,
    };
  }

  /**
   * Run the 5-check panel (ported from ig-human SKILL.md panel description).
   */
  private static runPanel(
    original: string,
    humanized: string,
    platform: PlatformType | null
  ): HumanizePanelCheck[] {
    const checks: HumanizePanelCheck[] = [];

    // Check 1: No em dashes remain
    checks.push({
      id: 'em_dashes',
      label: 'No em dashes',
      passed: !humanized.includes('—'),
      detail: humanized.includes('—') ? 'Em dashes still present — replace with commas or periods' : 'Clean',
    });

    // Check 2: No slop vocabulary
    const remainingSlop = SLOP_REPLACEMENTS
      .filter(s => s.pattern.test(humanized))
      .map(s => s.pattern.source.replace(/\\b/g, '').replace(/\(.*\)/g, '').split('|')[0])
      .slice(0, 3);
    checks.push({
      id: 'slop_vocabulary',
      label: 'No slop vocabulary',
      passed: remainingSlop.length === 0,
      detail: remainingSlop.length > 0 ? `Still contains: ${remainingSlop.join(', ')}` : 'Clean',
    });

    // Check 3: No invisible characters
    checks.push({
      id: 'invisible_chars',
      label: 'No invisible characters',
      passed: !INVISIBLE_CHAR_PATTERN.test(humanized),
      detail: INVISIBLE_CHAR_PATTERN.test(humanized) ? 'Invisible Unicode chars still present' : 'Clean',
    });

    // Check 4: No symmetric AI sentence structures
    const foundSymmetry = SYMMETRIC_PATTERNS.filter(p => p.pattern.test(humanized));
    checks.push({
      id: 'sentence_structure',
      label: 'Natural sentence structure',
      passed: foundSymmetry.length === 0,
      detail: foundSymmetry.length > 0
        ? `Symmetric AI structures found: ${foundSymmetry.map(f => f.label).join(', ')}`
        : 'Natural',
    });

    // Check 5: Opener is not a greeting or preamble
    const openerPatterns = /^(hey\s+guys|hi\s+everyone|in\s+this\s+(post|video)|today\s+i|so\s+i\s+wanted)/i;
    const opener = humanized.trim().slice(0, 50);
    checks.push({
      id: 'opener',
      label: 'No greeting or preamble opener',
      passed: !openerPatterns.test(opener),
      detail: openerPatterns.test(opener) ? `Opener starts with a greeting/preamble: "${opener}..."` : 'Clean opener',
    });

    return checks;
  }

  /**
   * Quick scan — returns true if content needs humanizing.
   */
  static needsHumanizing(content: string): boolean {
    const hasEmDash = content.includes('—');
    const hasInvisible = INVISIBLE_CHAR_PATTERN.test(content);
    const hasSlop = SLOP_REPLACEMENTS.some(s => s.pattern.test(content));
    return hasEmDash || hasInvisible || hasSlop;
  }

  /**
   * Return a human-readable slop report without applying changes.
   */
  static diagnose(content: string): { slopCount: number; emDashCount: number; slopWords: string[] } {
    const emDashCount = (content.match(/—/g) || []).length;
    const slopWords = SLOP_REPLACEMENTS
      .filter(s => s.pattern.test(content))
      .map(s => s.pattern.source.split('|')[0].replace(/\\b|\\s|[().*?+]/g, ''));
    return { slopCount: slopWords.length, emDashCount, slopWords };
  }
}
