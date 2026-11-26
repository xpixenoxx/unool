/**
 * Intelligent Adaptive AI Reply Quality & Stop Gate
 *
 * Ensures every AI-generated comment reply and DM sounds unmistakably human,
 * grounded in real creator facts, and knows WHEN TO STOP instead of sending
 * generic slop, hallucinations, or awkward conversation loops.
 */

export interface StopSignalResult {
  shouldStop: boolean;
  reason:
    | 'opt_out_stop'
    | 'natural_conversation_end'
    | 'human_requested'
    | 'bot_frustration'
    | 'high_risk_escalation'
    | null;
  escalate: boolean;
  optOut?: boolean;
  explanation?: string;
}

export interface ReplyQualityInput {
  replyText: string;
  inboundText: string;
  channel: 'comment' | 'dm';
  modelConfidence: number; // 0..1
  allowedFactsText?: string;
  recentReplies?: string[];
  minQualityScore?: number; // 0..100, default 65
  minConfidencePct?: number; // 0..100, default 0 (disabled unless configured)
  enforceStopOnLowQuality?: boolean;
}

export interface ReplyQualityEvaluation {
  score: number; // 0..100
  passed: boolean;
  shouldStop: boolean;
  stopReason: string | null;
  cleanedReply: string;
  issues: string[];
  hallucinatedFacts: string[];
}

// ─── Cliché & AI Slop Detection ──────────────────────────────────────────────

const GENERIC_AI_PHRASES: Array<{ pattern: RegExp; label: string; penalty: number }> = [
  { pattern: /\bthank(?:s| you)\s+for\s+reaching\s+out\b/i, label: 'generic corporate greeting', penalty: 28 },
  { pattern: /\b(?:great|awesome|wonderful|fantastic)\s+question[!.]?/i, label: 'cliche "great question"', penalty: 18 },
  { pattern: /\bi['’]?d\s+be\s+(?:more\s+than\s+)?happy\s+to\s+(?:help|assist)\b/i, label: 'robotic "happy to help"', penalty: 25 },
  { pattern: /\b(?:feel\s+free|don['’]?t\s+hesitate)\s+to\s+(?:reach\s+out|ask|let\s+me\s+know)\b/i, label: 'generic closer', penalty: 18 },
  { pattern: /\blet\s+me\s+know\s+if\s+(?:you\s+need\s+anything\s+else|there['’]?s\s+anything\s+else)\b/i, label: 'support-bot closer', penalty: 20 },
  { pattern: /\bhope\s+this\s+helps[!.]?\b/i, label: 'cliche "hope this helps"', penalty: 16 },
  { pattern: /\bas\s+an\s+ai\b|\blanguage\s+model\b|\bi\s+am\s+a\s+bot\b|\bautomated\s+assistant\b/i, label: 'AI identity leak', penalty: 60 },
  { pattern: /\b(delve|tapestry|seamlessly|game[- ]changer|transformative|synergy|holistic|paradigm|supercharge|unlock\s+your\s+potential)\b/i, label: 'AI slop vocabulary', penalty: 22 },
  { pattern: /\bin\s+today['’]?s\s+(?:fast[- ]paced|digital)\s+(?:world|landscape)\b/i, label: 'stock AI intro', penalty: 28 },
  { pattern: /\bi\s+understand\s+your\s+frustration\b/i, label: 'canned support apology', penalty: 18 },
];

const PURE_GENERIC_FILLERS = new Set([
  'thanks',
  'thank you',
  'thanks so much',
  'appreciate it',
  'appreciate you',
  'glad you liked it',
  'awesome',
  'amazing',
  'love this',
  'so glad',
  'check your dm',
  'check your dms',
  'sent',
  'done',
  'link sent',
  'dm sent',
]);

// ─── Conversation Stop Signals ───────────────────────────────────────────────

const OPT_OUT_PATTERNS = [
  /^\s*(?:stop|unsubscribe|opt\s*out|cancel\s+messages|remove\s+me|leave\s+me\s+alone)\s*[!.?]*\s*$/i,
  /\b(?:stop\s+messaging\s+me|do\s+not\s+message\s+me|don'?t\s+dm\s+me)\b/i,
];

const NATURAL_END_PATTERNS = [
  /^\s*(?:ok|okay|kk?|cool|got\s+it|gotcha|thanks?|thank\s+you|thx|ty|tysm|appreciated?|sounds\s+good|bet|noted|perfect|great\s+thanks|alright|aight|cheers|done|bye|take\s+care|peace|dhanyawad|shukriya|gracias|obrigad[oa]|merci)[\s!.,🙏👍👌❤️🔥🙌😊✨💯🫶🤝]*$/i,
  /^[\s🙏👍👌❤️🔥🙌😊✨💯🫶🤝]+$/,
];

const HUMAN_REQUEST_PATTERNS = [
  /\b(?:talk\s+to\s+(?:a\s+)?human|real\s+person|speak\s+to\s+(?:someone|a\s+human|the\s+owner|support)|connect\s+me\s+to\s+(?:a\s+)?human|human\s+please|agent\s+please)\b/i,
  /\b(?:are\s+you\s+(?:a\s+)?bot|this\s+is\s+a\s+bot|stop\s+the\s+bot|stupid\s+bot|useless\s+bot)\b/i,
];

const BOT_FRUSTRATION_PATTERNS = [
  /\b(?:you\s+didn'?t\s+answer|that'?s\s+not\s+what\s+i\s+asked|same\s+reply|already\s+told\s+you|not\s+helpful|stop\s+repeating|you\s+keep\s+saying)\b/i,
];

const HIGH_RISK_ESCALATION_PATTERNS = [
  /\b(?:charged\s+twice|double\s+charged|unauthorized\s+charge|chargeback|dispute|fraudulent|lawsuit|lawyer|attorney|legal\s+action|sue\s+you|police|consumer\s+court|gdpr\s+request|delete\s+my\s+data)\b/i,
];

/**
 * Detects whether the AI should STOP replying immediately (opt-out, natural end of thread,
 * user asking for a human, frustration loop, or legal/billing escalation).
 */
export function detectConversationStopSignal(
  inboundText: string,
  options?: {
    channel?: 'comment' | 'dm';
    priorAssistantTurns?: number;
    hasDeliveredLinkOrAnswer?: boolean;
  }
): StopSignalResult {
  const text = (inboundText || '').trim();
  if (!text) {
    return { shouldStop: false, reason: null, escalate: false };
  }

  // 1. Explicit opt-out ("STOP", "unsubscribe") — always honor immediately
  if (OPT_OUT_PATTERNS.some((p) => p.test(text))) {
    return {
      shouldStop: true,
      reason: 'opt_out_stop',
      escalate: false,
      optOut: true,
      explanation: 'User explicitly opted out ("STOP"/unsubscribe).',
    };
  }

  // 2. Explicit human handoff or bot callout
  if (HUMAN_REQUEST_PATTERNS.some((p) => p.test(text))) {
    return {
      shouldStop: true,
      reason: 'human_requested',
      escalate: true,
      explanation: 'User asked to speak with a real human — pausing AI and routing to Triage.',
    };
  }

  // 3. Frustration with prior AI reply
  if (BOT_FRUSTRATION_PATTERNS.some((p) => p.test(text))) {
    return {
      shouldStop: true,
      reason: 'bot_frustration',
      escalate: true,
      explanation: 'User expressed frustration with automated replies — stopping AI and escalating.',
    };
  }

  // 4. High-risk billing/legal/compliance escalation
  if (HIGH_RISK_ESCALATION_PATTERNS.some((p) => p.test(text))) {
    return {
      shouldStop: true,
      reason: 'high_risk_escalation',
      escalate: true,
      explanation: 'Billing dispute or legal/compliance inquiry detected — routing directly to owner.',
    };
  }

  // 5. Natural conversation ending in DMs (ONLY after >= 1 prior AI reply so Turn-1 emoji/thanks still works!)
  if (
    options?.channel === 'dm' &&
    (options.priorAssistantTurns ?? 0) >= 1 &&
    NATURAL_END_PATTERNS.some((p) => p.test(text))
  ) {
    return {
      shouldStop: true,
      reason: 'natural_conversation_end',
      escalate: false,
      explanation: 'Natural closing acknowledgment ("thanks"/"got it"/emoji) after AI already replied — stopping gracefully instead of over-messaging.',
    };
  }

  return { shouldStop: false, reason: null, escalate: false };
}

/**
 * Checks whether the follower explicitly opted back in ("START", "RESUME").
 */
export function isOptInResumeSignal(inboundText: string): boolean {
  return /^\s*(?:start|resume|subscribe|unstop)\s*[!.]*\s*$/i.test((inboundText || '').trim());
}

// ─── Language & Register Auto-Mirroring ──────────────────────────────────────

export function detectMessageLanguageHint(text: string): string | null {
  const trimmed = (text || '').trim();
  if (!trimmed) return null;

  if (/[\u0900-\u097F]/.test(trimmed)) {
    return 'Hindi (Devanagari script) — reply naturally in Hindi matching their warmth.';
  }
  if (/[\u0C00-\u0C7F]/.test(trimmed)) {
    return 'Telugu — reply naturally in Telugu.';
  }
  if (/[\u0B80-\u0BFF]/.test(trimmed)) {
    return 'Tamil — reply naturally in Tamil.';
  }
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    return 'Arabic — reply naturally in Arabic.';
  }

  const lower = trimmed.toLowerCase();
  const hinglishHits = [
    /\bbhai\b/,
    /\byaar\b/,
    /\bkya\b/,
    /\bkaise\b/,
    /\bkitna\b/,
    /\bkitne\b/,
    /\bbhejo\b/,
    /\bchahiye\b/,
    /\bbatao\b/,
    /\bkaro\b/,
    /\bmujhe\b/,
    /\bmere\b/,
    /\bbohot\b/,
    /\bbahut\b/,
  ].filter((p) => p.test(lower)).length;
  if (hinglishHits >= 1) {
    return 'Hinglish (casual Indian English + Hindi in Latin script) — mirror their exact casual Hinglish vibe naturally without sounding translated.';
  }

  if (/\b(?:hola|precio|enlace|gracias|quiero|como\s+funciona|informaci[oó]n)\b/i.test(lower)) {
    return 'Spanish — reply naturally in casual Spanish.';
  }
  if (/\b(?:ol[aá]|obrigad[oa]|quanto\s+custa|quero|manda\s+o\s+link)\b/i.test(lower)) {
    return 'Portuguese — reply naturally in casual Portuguese.';
  }
  if (/\b(?:bonjour|salut|combien|merci|je\s+veux|lien)\b/i.test(lower)) {
    return 'French — reply naturally in casual French.';
  }

  return null;
}

// ─── Hallucination / Fact-Grounding Check ────────────────────────────────────

const CURRENCY_PRICE_REGEX = /(?:₹|\$|€|£|\bUSD\s*|\bINR\s*|\bRs\.?\s*)\s*\d[\d,]*(?:\.\d{1,2})?/gi;
const PROMO_CODE_REGEX = /\b(?:code|coupon|promo)\s*[:\-]?\s*["']?([A-Z0-9]{4,18})["']?/g;

function normalizeNumericToken(token: string): string {
  return token.replace(/[^0-9.]/g, '');
}

function findUnverifiedFactClaims(replyText: string, allowedFactsText: string): string[] {
  const issues: string[] = [];
  const allowedLower = (allowedFactsText || '').toLowerCase();
  const allowedNumbers = new Set(
    (allowedFactsText.match(/\d[\d,]*(?:\.\d{1,2})?/g) || []).map(normalizeNumericToken)
  );

  // Check currency/price figures mentioned in AI reply
  const priceMatches = replyText.match(CURRENCY_PRICE_REGEX) || [];
  for (const rawPrice of priceMatches) {
    const num = normalizeNumericToken(rawPrice);
    if (num && !allowedNumbers.has(num)) {
      issues.push(`Unverified price "${rawPrice.trim()}" not present in Brand Materials or Knowledge Base`);
    }
  }

  // Check explicit promo codes invented by AI
  let codeMatch: RegExpExecArray | null;
  PROMO_CODE_REGEX.lastIndex = 0;
  while ((codeMatch = PROMO_CODE_REGEX.exec(replyText)) !== null) {
    const code = codeMatch[1];
    if (code && !allowedLower.includes(code.toLowerCase())) {
      issues.push(`Unverified promo code "${code}" not present in campaign or Brand Materials`);
    }
  }

  return issues;
}

// ─── Token Overlap & Markdown Cleanup ────────────────────────────────────────

function stripRoboticMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/^#{1,4}\s+/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function tokenizeForSimilarity(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3)
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const tok of a) {
    if (b.has(tok)) inter++;
  }
  return inter / (a.size + b.size - inter);
}

/**
 * Evaluates a candidate AI reply for human naturalness, factual grounding, novelty,
 * and confidence. Returns `shouldStop=true` when sending the reply would hurt the
 * creator's brand (hallucinated price/code, severe AI slop, low confidence, or repetition).
 */
export function evaluateAiReplyQuality(input: ReplyQualityInput): ReplyQualityEvaluation {
  const {
    replyText,
    inboundText,
    channel,
    modelConfidence,
    allowedFactsText = '',
    recentReplies = [],
    minQualityScore = 62,
    minConfidencePct = 0,
    enforceStopOnLowQuality = false,
  } = input;

  const raw = (replyText || '').trim();
  if (!raw || raw === 'SKIP') {
    return {
      score: 0,
      passed: false,
      shouldStop: true,
      stopReason: 'Empty or SKIP reply',
      cleanedReply: raw,
      issues: ['Empty reply'],
      hallucinatedFacts: [],
    };
  }

  const cleanedReply = stripRoboticMarkdown(raw);
  let score = 100;
  const issues: string[] = [];

  // 1. Cliché / AI slop check
  for (const rule of GENERIC_AI_PHRASES) {
    if (rule.pattern.test(cleanedReply)) {
      score -= rule.penalty;
      issues.push(rule.label);
    }
  }

  // 2. Pure generic filler reply check (e.g., "Thanks!", "Appreciate it!")
  const normalizedNoEmoji = cleanedReply
    .toLowerCase()
    .replace(/@[\w.]+/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (PURE_GENERIC_FILLERS.has(normalizedNoEmoji) || normalizedNoEmoji.split(' ').filter(Boolean).length <= 2) {
    score -= 35;
    issues.push('reply is too generic/short without specific context');
  }

  // 3. Hallucinated price or promo code check
  const groundedCorpus = `${inboundText}\n${allowedFactsText}`;
  const hallucinatedFacts = findUnverifiedFactClaims(cleanedReply, groundedCorpus);
  if (hallucinatedFacts.length > 0) {
    score -= 45;
    issues.push(...hallucinatedFacts);
  }

  // 4. Mobile length check (avoid AI essays)
  const maxChars = channel === 'comment' ? 320 : 620;
  if (cleanedReply.length > maxChars) {
    score -= 15;
    issues.push(`reply exceeds mobile-native length (${cleanedReply.length} chars)`);
  }

  // 5. Repetition check against recent replies
  const candTokens = tokenizeForSimilarity(cleanedReply);
  const candOpener = normalizedNoEmoji.split(' ').slice(0, 3).join(' ');
  for (const prev of recentReplies.slice(-10)) {
    const prevClean = prev
      .toLowerCase()
      .replace(/@[\w.]+/g, '')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (jaccard(candTokens, tokenizeForSimilarity(prev)) >= 0.68) {
      score -= 42;
      issues.push('too similar to a recently sent reply');
      break;
    }
    const prevOpener = prevClean.split(' ').slice(0, 3).join(' ');
    if (candOpener.length >= 8 && candOpener === prevOpener) {
      score -= 22;
      issues.push('reuses exact opening phrase from a recent reply');
      break;
    }
  }

  // 6. Model confidence calibration
  const confidencePct = Math.round(Math.max(0, Math.min(1, modelConfidence)) * 100);
  if (confidencePct < 55) {
    score -= 25;
    issues.push(`low model confidence (${confidencePct}%)`);
  }

  const clampedScore = Math.max(0, Math.min(100, score));

  // Determine hard stop conditions
  const hasIdentityLeak = /\bas\s+an\s+ai\b|\blanguage\s+model\b|\bi\s+am\s+a\s+bot\b/i.test(cleanedReply);
  const failedConfidenceThreshold = minConfidencePct > 0 && confidencePct < minConfidencePct;
  const failedQualityThreshold = enforceStopOnLowQuality && clampedScore < minQualityScore;
  const failedHallucinationGuard = enforceStopOnLowQuality && hallucinatedFacts.length > 0;

  let stopReason: string | null = null;
  if (hasIdentityLeak) {
    stopReason = 'AI identity leak detected — stopped before sending.';
  } else if (failedHallucinationGuard) {
    stopReason = hallucinatedFacts[0];
  } else if (failedConfidenceThreshold) {
    stopReason = `AI confidence ${confidencePct}% below threshold (${minConfidencePct}%) — routed to Triage for human review.`;
  } else if (failedQualityThreshold) {
    stopReason = `AI reply quality score ${clampedScore}/100 below safe bar (${issues.slice(0, 2).join('; ')}) — stopped and routed to Triage.`;
  }

  const shouldStop = Boolean(stopReason);
  return {
    score: clampedScore,
    passed: !shouldStop && clampedScore >= minQualityScore,
    shouldStop,
    stopReason,
    cleanedReply,
    issues,
    hallucinatedFacts,
  };
}

/**
 * Splits a natural DM reply into 1-3 short mobile bubbles when appropriate,
 * without ever breaking URLs or ultra-short messages.
 */
export function splitIntoNaturalBubbles(text: string, maxBubbles = 3): string[] {
  const trimmed = (text || '').trim();
  if (!trimmed) return [];
  if (trimmed.length <= 160) return [trimmed];

  // Respect explicit paragraph breaks first
  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length > 1 && paragraphs.length <= maxBubbles) {
    return paragraphs;
  }

  // Otherwise split on sentence boundaries outside URLs
  const sentences = trimmed.match(/[^.!?]+(?:[.!?]+|$)/g)?.map((s) => s.trim()).filter(Boolean) || [trimmed];
  if (sentences.length <= 1) return [trimmed];

  const bubbles: string[] = [];
  let current = '';
  for (const s of sentences) {
    const candidate = current ? `${current} ${s}` : s;
    if (candidate.length > 170 && current && bubbles.length < maxBubbles - 1) {
      bubbles.push(current.trim());
      current = s;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) bubbles.push(current.trim());
  return bubbles.slice(0, maxBubbles);
}
