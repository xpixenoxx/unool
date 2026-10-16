/**
 * ContentGuard — PMF-grade AI content safety & legal guardrails
 *
 * A single, reusable module that ALL AI generation routes must pass input
 * through before calling any AI model. It enforces:
 *
 * 1. Input quality gates (garbage / noise / keyboard mashing / entropy detection)
 * 2. Blocked content categories (terrorism, CSAM, violence, etc.)
 * 3. Legal compliance signals (doxxing, fraud, impersonation)
 * 4. Output sanitization (SSN, credit cards, control characters, private-use unicode)
 * 5. Smart hashtag filtering (60+ generic filler tags blacklisted, deduplication, length gates)
 * 6. Safety prompt prefix (injected into every system prompt)
 *
 * Design principle: Fail loudly for dangerous content, fail gracefully for
 * quality issues (guide the user to improve input rather than block them).
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type GuardViolation = {
  code: string;
  level: 'blocked' | 'warn';
  message: string; // User-facing (professional, helpful guidance)
  internal?: string; // For logging only — not sent to client
};

export type GuardResult =
  | { safe: true; sanitizedContent: string; warnings: GuardViolation[] }
  | { safe: false; violation: GuardViolation };

// ─── BLOCKED PATTERNS ────────────────────────────────────────────────────────
// These cause immediate hard-block with HTTP 400. Never exposed verbatim to AI.
// Note: Regexes intentionally do NOT use the `/g` flag to avoid stateful lastIndex issues.
// `[\s\S]` is used so patterns match across newlines without needing dotAll mode.

const HARD_BLOCKED_PATTERNS: Array<{ pattern: RegExp; code: string; internal: string }> = [
  // 1. Terrorism, Mass Violence & Violent Extremism Incitement / Celebration
  {
    pattern:
      /\b(celebrat(e|ing|ion)|praise|glorif(y|ying|ication)|applaud(ing)?|incit(e|ing|ement)|promot(e|ing)|cheer(ing)?|call\s+for)\b[\s\S]{0,60}\b(mass[\s-]?casualty|extremist\s+attack|terror(ist)?\s+attack|suicide\s+bomb(ing)?|mass\s+shoot(ing)?|massacre|genocide|beheading|car\s+bomb|pipe\s+bomb|violence|slaughter)\b/i,
    code: 'TERRORISM_INCITEMENT',
    internal: 'Celebration or incitement of mass violence/terrorist attack',
  },
  {
    pattern:
      /\b(mass[\s-]?casualty|extremist\s+attack|terror(ist)?\s+attack|suicide\s+bomb(ing)?|mass\s+shoot(ing)?|massacre|genocide|beheading)\b[\s\S]{0,60}\b(celebrat(e|ing|ion)|praise|glorif(y|ying|ication)|applaud(ing)?|incit(e|ing|ement)|promot(e|ing)|cheer(ing)?)\b/i,
    code: 'TERRORISM_INCITEMENT',
    internal: 'Celebration of mass violence/terrorist attack (reversed phrasing)',
  },
  {
    pattern:
      /\b(jihad|isis|isil|al[\s-]?qaeda|hamas|hezbollah|boko[\s-]?haram|al[\s-]?shabaab|taliban|daesh|terrorist|violent\s+extremis(t|m)|white\s+supremac(y|ist)|neo[\s-]?nazi)\b[\s\S]{0,80}\b(attack|bomb|kill|recruit|pledge|support|join|martyr|behead|slaughter|celebrate|glory)\b/i,
    code: 'TERRORISM_INCITEMENT',
    internal: 'Terrorism incitement or extremist group signal',
  },
  {
    pattern:
      /\b(join|pledge\s+allegiance\s+to|recruit\s+for|support)\s+(isis|isil|al[\s-]?qaeda|daesh|boko[\s-]?haram|taliban|terrorist\s+(group|organization)|extremist\s+group)\b/i,
    code: 'TERRORISM_INCITEMENT',
    internal: 'Terrorist group recruitment/affiliation',
  },
  // 2. Weapons of Mass Harm, Mass Casualty & Explosives Instructions
  {
    pattern:
      /\b(mass[\s-]?casualty(\s+(extremist|terrorist|violent))?\s+attack|suicide\s?bomb(ing)?|pipe\s?bomb|ied|improvised\s+explosive|car\s?bomb|mass\s+shooting|school\s+shooting|mass\s+murder|dirty\s+bomb|nerve\s+agent|sarin|ricin|anthrax\s+attack|execute\s+hostages)\b/i,
    code: 'WEAPONS_OF_MASS_HARM',
    internal: 'Weapons of mass harm / mass casualty event content',
  },
  {
    pattern:
      /\b(how\s+to\s+(make|build|assemble|synthesize|create)\s+(a\s+)?(bomb|explosive|pipe\s?bomb|ied|molotov|sarin|ricin|anthrax|weapon\s+of\s+mass\s+destruction))\b/i,
    code: 'WEAPONS_OF_MASS_HARM',
    internal: 'Bomb or mass harm weapon manufacturing instructions',
  },
  // 3. Hate Speech, Genocide & Extermination Calls
  {
    pattern:
      /\b(exterminate|wipe\s+out|kill\s+all|death\s+to\s+all|gas\s+the|lynch|slaughter\s+all)\s+(the\s+)?(jews|blacks|muslims|christians|gays|transgender|lgbtq|immigrants|minorities|infidels)\b/i,
    code: 'HATE_SPEECH_GENOCIDE',
    internal: 'Genocidal violence or extermination incitement',
  },
  {
    pattern:
      /\b(ethnic\s+cleansing|genocide|race\s+war)\b[\s\S]{0,60}\b(support|promote|glory|justify|call\s+for)\b/i,
    code: 'HATE_SPEECH_GENOCIDE',
    internal: 'Ethnic cleansing or genocide promotion',
  },
  // 4. CSAM / Child Sexual Exploitation & Abuse
  {
    pattern:
      /(\b(child|minor|underage|pedophil(e|ia)|loli|shota|kindergarten|elementary\s+school)\b[\s\S]{0,50}\b(porn|sex|nude|sexual|exploit|abuse|nsfw|erotic|lewd|touching)\b|\bcsam\b|\bchild\s+exploitation\b)/i,
    code: 'CSAM',
    internal: 'Child sexual exploitation and abuse material (CSAM) signal',
  },
  // 5. Explicit Doxxing & Non-Consensual Private Data Exposure
  {
    pattern:
      /\b(find\s+(someone'?s?|their|his|her)\s+(home\s+)?address|post\s+(their|his|her|someone'?s?)\s+(ssn|social\s+security|passport|home\s+address|phone\s+number)|leak\s+(their|his|her|someone'?s?)\s+(personal|private)\s+info|doxx?\s+(this|that|someone|the|him|her)\b|expose\s+(their|his|her)\s+(private|home)\s+address)\b/i,
    code: 'DOXXING',
    internal: 'Explicit doxxing or non-consensual personal data exposure',
  },
  // 6. Financial Fraud, Wire Scams & Scam Blueprints
  {
    pattern:
      /\b(send\s+(bitcoin|crypto|btc|eth|sol|money)|wire\s+transfer|paypal\s+me|venmo\s+me|cashapp\s+me)\b[\s\S]{0,80}\b(investment|profit|guaranteed|return|double\s+your|100%\s+profit|get\s+rich|daily\s+roi)\b/i,
    code: 'FINANCIAL_FRAUD',
    internal: 'Financial fraud / advance fee scam signal',
  },
  {
    pattern:
      /\b(guaranteed\s+(return|profit|roi)|double\s+your\s+(money|crypto|bitcoin))\b[\s\S]{0,60}\b(invest|send|wire|deposit)\b/i,
    code: 'FINANCIAL_FRAUD',
    internal: 'Guaranteed return investment scam',
  },
  // 7. Crypto Scams, Ponzi & Market Manipulation Schemes
  {
    pattern:
      /\b(pump\s+and\s+dump|rug\s+pull|exit\s+scam|ponzi|pyramid\s+scheme)\b[\s\S]{0,80}\b(join|invest|buy|now|airdrop|token|coin|telegram)\b/i,
    code: 'CRYPTO_FRAUD',
    internal: 'Crypto fraud or market manipulation scheme',
  },
  // 8. Self-Harm & Suicide Promotion / Instruction
  {
    pattern:
      /\b(how\s+to\s+(commit\s+)?suicide|best\s+way\s+to\s+die|methods\s+to\s+kill\s+yourself|how\s+to\s+(hang|slit|overdose|cut)\s+(your|my)self|painless\s+(suicide|way\s+to\s+die)|ways\s+to\s+end\s+(your|my)\s+life|tell\s+(me|them|him|her)\s+to\s+kill\s+(them|him|her|your)selves?)\b/i,
    code: 'SELF_HARM_PROMOTION',
    internal: 'Self-harm or suicide instruction/encouragement',
  },
  // 9. Cyberattack & Malware Development Instructions
  {
    pattern:
      /\b(how\s+to\s+(hack|infiltrate|breach)\s+(into\s+)?(a\s+)?(website|database|server|account|wifi)|write\s+(a\s+)?(ransomware|keylogger|malware|trojan|spyware)|conduct\s+(a\s+)?ddos\s+attack)\b/i,
    code: 'CYBERATTACK_INSTRUCTION',
    internal: 'Cyberattack or malware authoring instructions',
  },
  // 10. Prompt Injection & Adversarial Jailbreaking Overrides
  {
    pattern:
      /\b(ignore\s+(all\s+)?(previous|prior)\s+instructions|disregard\s+(all\s+)?safety\s+(rules|guidelines)|reveal\s+your\s+system\s+prompt|print\s+your\s+(initial|system)\s+instructions|DAN\s+mode|jailbreak\s+prompt)\b/i,
    code: 'PROMPT_INJECTION',
    internal: 'Adversarial jailbreak or system prompt extraction attempt',
  },
];

// ─── QUALITY GATES ───────────────────────────────────────────────────────────

const MIN_CONTENT_LENGTH = 15; // Characters
const MAX_CONTENT_LENGTH = 50_000; // Characters
const MIN_MEANINGFUL_WORD_COUNT = 4;

// QWERTY keyboard walk patterns (home-row, top-row, bottom-row walks)
const KEYBOARD_WALK_PATTERN =
  /(qwerty|wertyu|ertyui|rtyuio|tyuiop|asdfgh|sdfghj|dfghjk|fghjkl|zxcvbn|xcvbnm|poiuyt|oiuytr|iuytre|uytrew|ytrewq|lkjhgf|kjhgfd|jhgfds|hgfdsa|mnbvcx|nbvcxz)/i;

// Patterns that signal pure garbage input
const GARBAGE_SIGNALS: RegExp[] = [
  /^[^a-z0-9\s]{3,}$/i, // Pure symbol strings
  /^(.)\1{4,}$/, // Repeated single char (aaaaa)
  /^[\d\s\W]{5,}$/, // Only numbers + symbols
];

// Patterns that AI should NEVER reproduce in output
const OUTPUT_BLOCK_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // Remove SSN patterns
  {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[SSN removed]',
  },
  // Remove major credit card patterns (Visa, Mastercard, Amex, Discover)
  {
    pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
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

// Generic filler hashtags that provide zero discovery value (60+ curated tags)
const GENERIC_HASHTAG_BLACKLIST = new Set([
  // Motivational filler
  'motivation', 'motivational', 'success', 'hustle', 'grind', 'grindset',
  'mindset', 'goals', 'lifestyle', 'inspiration', 'inspirational', 'blessed',
  'growth', 'entrepreneur', 'entrepreneurship', 'wealth', 'rich', 'money',
  'millionaire', 'billionaire', 'startupgrind',
  // Social engagement filler
  'viral', 'trending', 'trendingnow', 'explore', 'explorepage', 'fyp',
  'foryou', 'foryoupage', 'follow', 'followme', 'followforfollow', 'f4f',
  'like', 'likes', 'likeforlike', 'l4l', 'likeforlikes', 'share', 'comment',
  'repost', 'tag', 'hashtag', 'popular', 'influencer',
  // Photo / vibe filler
  'instagood', 'instadaily', 'instamood', 'instapic', 'photooftheday',
  'picoftheday', 'pic', 'photo', 'image', 'video', 'tbt', 'throwback',
  'throwbackthursday', 'flashbackfriday', 'vibes', 'goodvibes', 'mood',
  'love', 'happy', 'fun', 'life', 'daily', 'selfie', 'nofilter', 'ootd',
  // Generic business / marketing filler
  'business', 'marketing', 'content', 'digital', 'online', 'social',
  'socialmedia', 'brand', 'branding', 'work', 'team', 'news', 'blog',
  'post', 'tips', 'advice', 'help', 'ideas', 'new', 'best', 'top',
  // Generic praise / empty qualifiers
  'cool', 'awesome', 'great', 'amazing', 'wow', 'nice', 'good', 'status',
  'quote', 'quotes', 'fitness', 'gym', 'fit', 'weekend', 'sundayfunday',
  'mondaymotivation', 'tuesdaythoughts', 'wednesdaywisdom', 'fridayvibes',
  // Call to action filler
  'check', 'click', 'link', 'bio', 'linkinbio', 'dm',
]);

// ─── MAIN GUARD CLASS ─────────────────────────────────────────────────────────

export class ContentGuard {
  /**
   * Calculate Shannon entropy (bits per character) of a string.
   */
  static calculateEntropy(str: string): number {
    if (!str || str.length === 0) return 0;
    const counts: Record<string, number> = {};
    for (const char of str) {
      counts[char] = (counts[char] || 0) + 1;
    }
    let entropy = 0;
    const len = str.length;
    for (const char in counts) {
      const p = counts[char] / len;
      entropy -= p * Math.log2(p);
    }
    return entropy;
  }

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
    const words = content.split(/\s+/).filter(w => /[a-z0-9]/i.test(w));
    if (words.length < MIN_MEANINGFUL_WORD_COUNT) {
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

    // 3. Pure symbols / numbers check (must have at least 5 letters)
    const letters = content.replace(/[^a-zA-Z]/g, '');
    if (letters.length < 5) {
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

    // 4. Garbage / noise patterns
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

    // 5. Repeated character runs (e.g. "aaaaa", "zzzzz", "11111")
    if (/(.)\1{4,}/.test(content)) {
      return {
        safe: false,
        violation: {
          code: 'REPETITIVE_INPUT',
          level: 'blocked',
          message:
            'This content contains excessively repeated characters. Please enter a real topic or draft message.',
        },
      };
    }

    // 6. Hard-blocked content check (terrorism, CSAM, doxxing, fraud, self-harm)
    for (const { pattern, code, internal } of HARD_BLOCKED_PATTERNS) {
      if (pattern.test(content)) {
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
    }

    // 7. Keyboard mashing & QWERTY walk checks (e.g. "asdfghjkl", "qwerty")
    const lowerLetters = letters.toLowerCase();
    const vowelCount = (lowerLetters.match(/[aeiouy]/g) || []).length;
    const vowelRatio = vowelCount / lowerLetters.length;

    if (KEYBOARD_WALK_PATTERN.test(content)) {
      if (vowelRatio < 0.25 || lowerLetters.length < 25) {
        return {
          safe: false,
          violation: {
            code: 'KEYBOARD_MASH_INPUT',
            level: 'blocked',
            message:
              'This content appears to be keyboard mashing. Please enter a meaningful topic or idea for the AI.',
          },
        };
      }
    }

    // 8. Consonant gibberish & unpronounceable token check
    if (lowerLetters.length >= 15 && vowelRatio < 0.12) {
      return {
        safe: false,
        violation: {
          code: 'GIBBERISH_INPUT',
          level: 'blocked',
          message:
            'This text does not appear to contain readable words. Please enter a real topic or draft message.',
        },
      };
    }

    const hasUnpronounceableCluster = words.some(w => {
      const clean = w.replace(/[^a-z]/gi, '');
      return clean.length >= 7 && /[bcdfghjklmnpqrstvwxz]{6,}/i.test(clean);
    });
    if (hasUnpronounceableCluster && vowelRatio < 0.25) {
      return {
        safe: false,
        violation: {
          code: 'GIBBERISH_INPUT',
          level: 'blocked',
          message:
            'This text does not appear to contain readable words. Please enter a real topic or draft message.',
        },
      };
    }

    // 9. Shannon entropy / character repetition check
    const strippedContent = content.replace(/\s/g, '').toLowerCase();
    if (strippedContent.length >= 20) {
      const entropy = ContentGuard.calculateEntropy(strippedContent);
      const uniqueChars = new Set(strippedContent).size;
      if (entropy < 2.2 || uniqueChars / strippedContent.length < 0.10) {
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
    }

    // 10. Repetitive word loop spam (e.g. "test test test test")
    const normalizedWords = words.map(w => w.toLowerCase());
    const uniqueWords = new Set(normalizedWords);
    if (normalizedWords.length >= 4 && uniqueWords.size <= 2 && (uniqueWords.size / normalizedWords.length) <= 0.25) {
      return {
        safe: false,
        violation: {
          code: 'REPETITIVE_WORD_INPUT',
          level: 'blocked',
          message:
            'This content is repeating the same word. Please provide more detail about what you want to share.',
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
   * Lightweight validation for direct-broadcast routes (Quick Broadcast, no AI).
   *
   * Skips all AI-quality gates (min length, word count, garbage detection, entropy).
   * Only enforces hard safety blocks (terrorism, CSAM, etc.) and the max-length cap.
   * Content is sanitized (control chars stripped) but NOT filtered for AI quality.
   */
  static validateForBroadcast(rawContent: string, context?: { route?: string }): GuardResult {
    const content = (rawContent || '').trim();

    // Must not be empty
    if (!content) {
      return {
        safe: false,
        violation: {
          code: 'CONTENT_EMPTY',
          level: 'blocked',
          message: 'Content cannot be empty.',
        },
      };
    }

    // Max length cap still applies
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

    // Hard-blocked safety checks still apply
    for (const { pattern, code, internal } of HARD_BLOCKED_PATTERNS) {
      if (pattern.test(content)) {
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
    }

    // Safe — return sanitized version (no AI quality filters applied)
    return {
      safe: true,
      sanitizedContent: ContentGuard.sanitizeForAI(content),
      warnings: [],
    };
  }

  /**
   * Validates social media input (comments, DMs) where short text, emojis,
   * single-word replies ("link", "price", "🔥") are normal and expected.
   * Only blocks hard safety violations (terrorism, CSAM, doxxing, fraud, self-harm)
   * and oversized inputs.
   */
  static validateSocialInput(rawContent: string, context?: { route?: string }): GuardResult {
    const content = (rawContent || '').trim();

    if (!content) {
      return {
        safe: true,
        sanitizedContent: '',
        warnings: [],
      };
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      return {
        safe: false,
        violation: {
          code: 'CONTENT_TOO_LONG',
          level: 'blocked',
          message: 'Content exceeds the maximum allowed length.',
        },
      };
    }

    // Hard-blocked content check (terrorism, CSAM, doxxing, fraud, self-harm)
    for (const { pattern, code, internal } of HARD_BLOCKED_PATTERNS) {
      if (pattern.test(content)) {
        return {
          safe: false,
          violation: {
            code,
            level: 'blocked',
            message:
              'This content cannot be processed — it appears to violate our safety policies. If you believe this is a mistake, please contact support.',
            internal: `[ContentGuard] Hard block: ${internal} | route=${context?.route ?? 'social'}`,
          },
        };
      }
    }

    return {
      safe: true,
      sanitizedContent: ContentGuard.sanitizeForAI(content),
      warnings: [],
    };
  }

  /** Alias for validateSocialInput */
  static validateComment = ContentGuard.validateSocialInput;

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
   * Strips SSNs, credit cards, control characters, and Unicode watermarks.
   */
  static sanitizeOutput(content: string): string {
    if (!content || typeof content !== 'string') return '';
    let sanitized = content
      // Strip null bytes and dangerous control characters (keep newlines/tabs)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Strip Unicode private-use area characters (AI watermark injection)
      .replace(/[\uE000-\uF8FF]/g, '')
      // Normalize multiple blank lines to max 2
      .replace(/\n{3,}/g, '\n\n');

    for (const { pattern, replacement } of OUTPUT_BLOCK_PATTERNS) {
      sanitized = sanitized.replace(pattern, replacement);
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
