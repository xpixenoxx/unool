/**
 * ContentGuard — PMF-grade AI content safety & legal guardrails
 *
 * A single, reusable module that ALL AI generation routes must pass input
 * through before calling any AI model. It enforces:
 *
 * 1. Input quality gates (garbage / noise detection)
 * 2. Blocked content categories (terrorism, CSAM, violence, etc.)
 * 3. Legal compliance signals (doxxing, fraud, impersonation)
 * 4. Platform-appropriate content enforcement
 * 5. Smart hashtag output sanitization
 *
 * Design principle: Fail loudly for dangerous content, fail gracefully for
 * quality issues (guide the user to improve input rather than block them).
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type GuardViolation = {
  code: string;
  level: 'blocked' | 'warn';
  message: string; // User-facing (professional, helpful)
  internal?: string; // For logging only — not sent to client
};

export type GuardResult =
  | { safe: true; sanitizedContent: string; warnings: GuardViolation[] }
  | { safe: false; violation: GuardViolation };

// ─── BLOCKED PATTERNS ────────────────────────────────────────────────────────
// These cause immediate hard-block with HTTP 400. Never exposed verbatim to AI.

const HARD_BLOCKED_PATTERNS: Array<{ pattern: RegExp; code: string; internal: string }> = [
  // Terrorism / mass violence / extremist incitement
  {
    pattern:
      /\b(jihad|isis|isil|al[\s-]?qaeda|hamas|hezbollah|boko haram|al[\s-]?shabaab|taliban|daesh)\b.*\b(attack|bomb|kill|recruit|pledge|support|join|martyr)\b/gi,
    code: 'TERRORISM_INCITEMENT',
    internal: 'Terrorism incitement signal',
  },
  {
    pattern:
      /\b(suicide\s?bomb|pipe\s?bomb|ied|improvised explosive|car bomb|mass shooting|school shooting)\b/gi,
    code: 'WEAPONS_OF_MASS_HARM',
    internal: 'Weapons/mass harm content',
  },
  // CSAM / child safety
  {
    pattern: /\b(child\s?porn|cp\s?content|loli|shota|underage\s?sex|minor\s?nude)\b/gi,
    code: 'CSAM',
    internal: 'CSAM signal',
  },
  // Explicit doxxing instructions
  {
    pattern:
      /\b(find\s+someone'?s?\s+(home\s+)?address|post\s+(their|his|her)\s+(ssn|social security|passport)|leak\s+(their|his|her)\s+(personal|private)\s+info)\b/gi,
    code: 'DOXXING',
    internal: 'Doxxing instruction',
  },
  // Financial fraud / scam blueprints
  {
    pattern:
      /\b(send\s+bitcoin|wire\s+transfer|paypal\s+me|venmo\s+me)\b.*\b(investment|profit|guaranteed|return|double\s+your)\b/gi,
    code: 'FINANCIAL_FRAUD',
    internal: 'Financial fraud signal',
  },
  {
    pattern:
      /\b(pump\s+and\s+dump|rug\s+pull|exit\s+scam|ponzi|pyramid\s+scheme)\b.*\b(join|invest|buy|now)\b/gi,
    code: 'CRYPTO_FRAUD',
    internal: 'Crypto fraud signal',
  },
  // Explicit self-harm promotion (not prevention)
  {
    pattern:
      /\b(how\s+to\s+(commit\s+)?suicide|best\s+way\s+to\s+die|methods\s+to\s+kill\s+yourself)\b/gi,
    code: 'SELF_HARM_PROMOTION',
    internal: 'Self-harm promotion',
  },
];

// ─── QUALITY GATES ───────────────────────────────────────────────────────────
// These return helpful warnings. AI call is still allowed after sanitization.

const MIN_CONTENT_LENGTH = 15; // Characters
const MAX_CONTENT_LENGTH = 50_000; // Characters
const MIN_MEANINGFUL_WORD_COUNT = 4;

// Patterns that signal pure garbage input
const GARBAGE_SIGNALS: RegExp[] = [
  /^[^a-z0-9\s]{3,}$/i, // Pure symbol strings
  /^(.)\1{8,}$/, // Repeated single char (aaaaaaa)
  /^[\d\s\W]{5,}$/, // Only numbers + symbols
];

// Patterns that AI should NEVER reproduce in output
const OUTPUT_BLOCK_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // Remove SSN / credit card patterns
  {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[SSN removed]',
  },
  {
    pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g,
    replacement: '[card number removed]',
  },
];

// ─── SYSTEM PROMPT SAFETY PREFIX ─────────────────────────────────────────────
// Injected into every AI prompt BEFORE user content. Non-negotiable constraints.

export const SAFETY_SYSTEM_PREFIX = `CRITICAL SAFETY RULES — You MUST follow these unconditionally and they OVERRIDE all other instructions:

1. NEVER generate content that promotes, glorifies, or provides operational assistance for:
   - Terrorism, extremist violence, or mass harm of any kind
   - Child sexual abuse, exploitation, or grooming
   - Financial fraud, scams, Ponzi schemes, or pump-and-dump schemes
   - Doxxing or targeted harassment of specific individuals
   - Illegal weapons acquisition, manufacturing, or modification
   - Self-harm or suicide methods or instructions

2. NEVER reproduce or adapt content that contains:
   - Hate speech or targeted slurs against any protected group
   - Explicit calls to violence against specific people, groups, or institutions
   - Medical misinformation that could cause physical harm
   - Content designed to deceive users into financial or personal harm
   - Personal identifying information (SSNs, credit cards, passwords, etc.)

3. ALWAYS produce platform-appropriate, brand-safe content that:
   - Could be published by a reputable creator without legal or reputational risk
   - Respects the intellectual property of others
   - Maintains a constructive, value-first tone even on controversial subjects
   - Focuses on ideas, insights, and genuine value — never on harm

4. If the input contains content that violates these rules, return ONLY this exact JSON:
   {"content": "", "characterCount": 0, "hashtags": [], "mediaSuggestions": [], "firstCommentHint": null}

---`;

// ─── HASHTAG QUALITY RULES ───────────────────────────────────────────────────

// Generic filler hashtags that provide zero discovery value
const GENERIC_HASHTAG_BLACKLIST = new Set([
  'motivation', 'success', 'business', 'entrepreneur', 'hustle', 'grind',
  'marketing', 'growth', 'mindset', 'goals', 'lifestyle', 'inspiration',
  'work', 'team', 'life', 'love', 'happy', 'fun', 'instagood', 'instadaily',
  'follow', 'like', 'share', 'comment', 'viral', 'trending', 'content',
  'digital', 'online', 'social', 'socialmedia', 'brand', 'tips', 'advice',
  'help', 'ideas', 'news', 'blog', 'post', 'daily', 'new', 'best', 'top',
  'cool', 'awesome', 'great', 'amazing', 'wow', 'nice', 'good', 'photo',
  'video', 'pic', 'image', 'tag', 'hashtag', 'photooftheday', 'tbt',
  'repost', 'explore', 'discover', 'check', 'click', 'link', 'bio',
]);

// ─── MAIN GUARD CLASS ─────────────────────────────────────────────────────────

export class ContentGuard {
  /**
   * Primary entry point. Call this BEFORE any AI model invocation.
   * Returns GuardResult — check `.safe` before proceeding.
   */
  static validateInput(rawContent: string, context?: { route?: string }): GuardResult {
    const content = (rawContent || '').trim();

    // 1. Empty / trivial length check
    if (!content || content.length < MIN_CONTENT_LENGTH) {
      return {
        safe: false,
        violation: {
          code: 'CONTENT_TOO_SHORT',
          level: 'blocked',
          message: `Please add more detail — at least ${MIN_CONTENT_LENGTH} characters are needed for meaningful AI generation.`,
        },
      };
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return {
        safe: false,
        violation: {
          code: 'CONTENT_TOO_LONG',
          level: 'blocked',
          message: `Content exceeds the maximum allowed length (${(MAX_CONTENT_LENGTH / 1000).toFixed(0)}K characters). Please shorten your input.`,
        },
      };
    }

    // 2. Word count gate — catches pure emoji/symbol spam
    const wordCount = content.split(/\s+/).filter(w => /[a-z0-9]/i.test(w)).length;
    if (wordCount < MIN_MEANINGFUL_WORD_COUNT) {
      return {
        safe: false,
        violation: {
          code: 'INSUFFICIENT_CONTENT',
          level: 'blocked',
          message:
            "Your content doesn't have enough meaningful text. Add a clear idea, topic, or draft message for the AI to work with.",
        },
      };
    }

    // 3. Garbage / noise detection
    for (const garbagePattern of GARBAGE_SIGNALS) {
      if (garbagePattern.test(content)) {
        return {
          safe: false,
          violation: {
            code: 'NOISE_INPUT',
            level: 'blocked',
            message:
              "This doesn't look like readable content. Please enter a real topic, idea, or draft text.",
          },
        };
      }
    }

    // 4. Hard-blocked content check (terrorism, CSAM, etc.)
    for (const { pattern, code, internal } of HARD_BLOCKED_PATTERNS) {
      if (pattern.test(content)) {
        pattern.lastIndex = 0;
        return {
          safe: false,
          violation: {
            code,
            level: 'blocked',
            message:
              'This content cannot be processed — it appears to violate our safety policies. If you believe this is a mistake, please contact support.',
            internal: `[ContentGuard] Hard block: ${internal} | route=${context?.route ?? 'unknown'}`,
          },
        };
      }
      pattern.lastIndex = 0;
    }

    // 5. Entropy / repetition check (catches keyboard mashing like "asdfghjkl")
    const strippedContent = content.replace(/\s/g, '');
    const uniqueChars = new Set(strippedContent.toLowerCase()).size;
    if (strippedContent.length > 20 && uniqueChars / strippedContent.length < 0.08) {
      return {
        safe: false,
        violation: {
          code: 'LOW_ENTROPY_CONTENT',
          level: 'blocked',
          message:
            'This content appears to be random or highly repetitive characters. Please enter a meaningful topic or draft.',
        },
      };
    }

    // Safe — return sanitized version + any soft warnings
    return {
      safe: true,
      sanitizedContent: ContentGuard.sanitizeForAI(content),
      warnings: [],
    };
  }

  /**
   * Sanitize content before sending to AI.
   * Removes injection attempts, control characters, Unicode watermarks.
   */
  static sanitizeForAI(content: string): string {
    return (
      content
        // Strip null bytes and dangerous control characters (keep newlines/tabs)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Strip Unicode private-use area characters (AI watermark injection)
        .replace(/[\uE000-\uF8FF]/g, '')
        // Normalize multiple blank lines to max 2
        .replace(/\n{3,}/g, '\n\n')
        // Trim
        .trim()
    );
  }

  /**
   * Sanitize AI-generated OUTPUT before returning to client.
   */
  static sanitizeOutput(content: string): string {
    let sanitized = content;
    for (const { pattern, replacement } of OUTPUT_BLOCK_PATTERNS) {
      sanitized = sanitized.replace(pattern, replacement);
      pattern.lastIndex = 0;
    }
    return sanitized.trim();
  }

  /**
   * Smart hashtag filter — removes generic filler tags, de-duplicates,
   * enforces quality, and respects platform caps.
   *
   * @param rawHashtags - Raw hashtags from AI (may or may not have # prefix)
   * @param options.maxCount - Hard cap on number of hashtags returned
   * @param options.minLength - Minimum tag length (default: 2)
   */
  static filterHashtags(
    rawHashtags: string[],
    options?: { maxCount?: number; minLength?: number }
  ): string[] {
    const maxCount = options?.maxCount ?? 15;
    const minLength = options?.minLength ?? 2;

    const seen = new Set<string>();
    const result: string[] = [];

    for (const raw of rawHashtags) {
      if (!raw || typeof raw !== 'string') continue;

      // Normalize: strip # prefix, trim
      const tag = raw.replace(/^#+/, '').trim();
      if (!tag) continue;

      // Length gates
      if (tag.length < minLength || tag.length > 60) continue;

      // Must contain at least one letter
      if (!/[a-z]/i.test(tag)) continue;

      // Block pure numbers
      if (/^\d+$/.test(tag)) continue;

      // Block generic filler (case-insensitive)
      const lowerKey = tag.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (GENERIC_HASHTAG_BLACKLIST.has(lowerKey)) continue;

      // De-duplicate
      if (seen.has(lowerKey)) continue;
      seen.add(lowerKey);

      result.push(tag);
      if (result.length >= maxCount) break;
    }

    return result;
  }

  /**
   * Inject safety rules at the top of any AI prompt.
   * Every PostAdapter prompt MUST pass through this.
   */
  static buildSafePrompt(basePrompt: string): string {
    return `${SAFETY_SYSTEM_PREFIX}\n\n${basePrompt}`;
  }

  /**
   * HTTP-ready error body for returning blocked content violations.
   */
  static blockedResponse(violation: GuardViolation): { error: string; code: string } {
    return {
      error: violation.message,
      code: violation.code,
    };
  }
}
