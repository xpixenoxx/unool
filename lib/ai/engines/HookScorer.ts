import { z } from 'zod';
import { PlatformType } from '@/lib/ai/PostAdapter';

// ─── Hook Formulas (ported from ig-reel + ig-viral SKILL.md) ─────────────────
// 26 formulas based on what consistently performs across LinkedIn, X, Instagram,
// YouTube, Threads, Medium, Hashnode, Dev.to and community platforms.

export interface HookFormula {
  id: number;
  name: string;
  template: string;
  example: string;
  what: string;
  dealbreakers: string[];
}

export const HOOK_FORMULAS: HookFormula[] = [
  { id: 1,  name: 'The Loss Number',            template: 'I lost {amount} because of {specific mistake}.', example: 'I lost $18,000 because of one missing clause in a contract.', what: 'Opens with a concrete financial or measurable loss. Triggers loss-aversion.', dealbreakers: ['vague amount', 'passive voice', 'no culprit'] },
  { id: 2,  name: 'The Contrarian Claim',        template: 'Most people think {common belief}. They are wrong.', example: 'Most people think more followers means more money. They are wrong.', what: 'Challenges a widely-held belief. Works when you have data or proof.', dealbreakers: ['no proof forthcoming', 'hedging language in same sentence'] },
  { id: 3,  name: 'The Specific Number',         template: '{Specific number} {thing} in {time period}.', example: '47 clients in 12 months with zero ad spend.', what: 'Leads with a verifiable result. The more specific the number the more believable.', dealbreakers: ['round numbers like 100 or 1000', 'unqualified claim', 'vague timeframe'] },
  { id: 4,  name: 'The Nobody Tells You',        template: 'Nobody tells you that {surprising truth about your niche}.', example: 'Nobody tells you that your first 30 reels are supposed to flop.', what: 'Creates instant insider status. Works when the truth is counterintuitive.', dealbreakers: ['the truth is obvious', 'it could apply to anything'] },
  { id: 5,  name: 'The One Mistake',             template: 'One {mistake/decision/habit} {cost/earned/changed} {specific thing}.', example: 'One habit change added $4,000 a month to my take-home.', what: 'Isolates a single lever. Forces the viewer to wonder which one.', dealbreakers: ['multiple mistakes mentioned', 'no specific outcome'] },
  { id: 6,  name: 'The Year Confession',         template: 'I {did something} for {duration} before I realized {truth}.', example: 'I posted every day for two years before I realized consistency was not the problem.', what: 'Time spent + reversal. Earns empathy and credibility simultaneously.', dealbreakers: ['duration is vague', 'realization is generic'] },
  { id: 7,  name: 'The Comparison Shock',        template: '{Their result} vs {your result}. Same {input}.', example: '3 posts a week vs 21. Same niche. Very different result.', what: 'Side-by-side contrast creates an immediate puzzle the viewer wants solved.', dealbreakers: ['one side is not surprising', 'no shared variable'] },
  { id: 8,  name: 'The Direct Address',          template: 'If you {specific condition}, {consequence or realization}.', example: 'If you are pricing by the hour, you are selling yourself short in three ways.', what: 'Selects a precise audience. Everyone else self-selects out.', dealbreakers: ['condition is too broad', 'if you want to succeed'] },
  { id: 9,  name: 'The How I',                   template: 'How I {specific result} in {timeframe} without {expected cost}.', example: 'How I landed 6 clients in 90 days without a single cold email.', what: 'Promise of a method. Works when the without clause is genuinely surprising.', dealbreakers: ['how I became successful', 'without working hard'] },
  { id: 10, name: 'The What I Wish',             template: 'What I wish someone told me about {topic} before {event}.', example: 'What I wish someone told me about pricing before I burned my first agency client.', what: 'Signals hard-won knowledge. Viewer trusts a lesson paid for with a cost.', dealbreakers: ['event is not specific', 'topic is generic like "business"'] },
  { id: 11, name: 'The Thing About',             template: 'The thing about {topic} nobody wants to say out loud.', example: 'The thing about building an audience nobody wants to say out loud.', what: 'Creates a secret-reveal frame. Works when the thing is actually surprising.', dealbreakers: ['vague topic', 'the thing is not uncomfortable'] },
  { id: 12, name: 'The Replaced By',             template: 'I replaced {old approach} with {new approach} and {result}.', example: 'I replaced cold outreach with content and signed 4 clients in 30 days.', what: 'Before/after with a specific mechanism. Requires a real measurable result.', dealbreakers: ['result is vague', 'no specific timeframe'] },
  { id: 13, name: 'The Question They Are Already Asking', template: 'Why does {common frustration} happen even when you {expected solution}?', example: 'Why does the algorithm bury posts even when you use all the right hashtags?', what: "Mirrors the viewer's exact internal question.", dealbreakers: ['question could not be Googled', 'answer is obvious'] },
  { id: 14, name: 'The Bold Percentage',         template: '{X}% of {group} {surprising fact}.', example: '80% of freelancers undercharge on their first three clients.', what: 'A statistic that recalibrates the viewer\'s worldview.', dealbreakers: ['made-up feel', 'percentage is round with no source'] },
  { id: 15, name: 'The Simpler Than You Think',  template: '{Complex thing} is simpler than you think. Here is the part everyone skips.', example: 'Writing a viral hook is simpler than you think. Here is the part everyone skips.', what: 'Lowers the barrier to watch.', dealbreakers: ['not actually simple', 'no specific skipped step'] },
  { id: 16, name: 'The Comment Reel',            template: 'Someone asked me {specific question}. Here is the honest answer.', example: 'Someone asked me why I charge 3x what other designers charge. Here is the honest answer.', what: 'Turns a real audience question into a hook. Highest trust formula.', dealbreakers: ['vague or rhetorical question', 'answer that took no courage'] },
  { id: 17, name: 'The Uncomfortable Truth',     template: 'The uncomfortable truth about {topic}: {one sentence truth}.', example: 'The uncomfortable truth about content: most of it does not compound.', what: 'Contrarian claim with emotional framing.', dealbreakers: ['truth is motivational-poster level', 'hedging immediately after'] },
  { id: 18, name: 'The After Years',             template: 'After {years} in {field}, here is the one thing I would change.', example: 'After 6 years in agency life, here is the one thing I would change.', what: 'Positions the speaker as battle-tested.', dealbreakers: ['years is less than 2', 'the thing is obvious'] },
  { id: 19, name: 'The Myth Buster',             template: '{Common belief about topic} is a myth. Here is what actually works.', example: 'Posting every day is a myth. Here is what actually builds an audience.', what: 'Credibility-building through correction.', dealbreakers: ['myth is already debunked', 'no alternative provided'] },
  { id: 20, name: 'The If I Started Over',       template: 'If I started {thing} from zero today, I would do {exactly this}.', example: 'If I started freelancing from zero today, I would do these three things differently.', what: 'Hindsight authority.', dealbreakers: ['advice is generic', 'no specific steps implied'] },
  { id: 21, name: 'The Hidden Cost',             template: '{Common good thing} has a hidden cost: {specific downside}.', example: 'Going viral has a hidden cost: follower churn that resets your baseline.', what: 'Reveals a second-order effect.', dealbreakers: ['cost is obvious', 'the good thing is not genuinely good'] },
  { id: 22, name: 'The Scene Setter',            template: 'It was {specific moment}. {What was happening}. That was the day I learned {lesson}.', example: 'It was 11pm. I had just lost the biggest client of my career. That was the day I learned to never have a single point of failure.', what: 'Story-first hook. The most human formula.', dealbreakers: ['vague setting', 'lesson is a cliche', 'no real cost'] },
  { id: 23, name: 'The Two Lists',               template: 'What everyone says about {topic}: {list}. What actually works: {list}.', example: 'What everyone says about growing on LinkedIn: post daily, use hashtags, engage with everyone. What actually works: fewer, longer posts on a narrow topic.', what: 'Side-by-side contrast.', dealbreakers: ['what-actually-works is also generic', 'lists are too long'] },
  { id: 24, name: 'The Reframe',                 template: '{Familiar term/concept} is not {what people think}. It is {reframe}.', example: 'Cold outreach is not a numbers game. It is a research game.', what: 'Semantic reframe.', dealbreakers: ['reframe is a synonym', 'no action implication'] },
  { id: 25, name: 'The Three Word Rule',          template: '{Three words.} [then a surprising expansion]', example: 'Charge more. Here is the math behind why undercharging kills a freelance business faster than bad marketing.', what: 'Ultra-compressed hook. Works for short-form only.', dealbreakers: ['expansion is also vague', 'three words are a cliche'] },
  { id: 26, name: 'The Exact Number Framework',  template: '{Number} {things} that {specific measurable result}. None of them are {expected thing}.', example: '5 questions I ask every new client. None of them are about budget.', what: 'Numbered list hook with a twist.', dealbreakers: ['number is more than 7', 'the twist is obvious', 'no genuine curiosity gap'] },
];

// ─── Platform Hook Windows ────────────────────────────────────────────────────
// Number of characters visible BEFORE truncation on each platform.

export const PLATFORM_HOOK_WINDOWS: Partial<Record<PlatformType, { chars: number; label: string }>> = {
  instagram: { chars: 125,   label: 'Feed fold (125 chars)' },
  linkedin:  { chars: 210,   label: 'Desktop fold (~210 chars)' },
  x:         { chars: 280,   label: 'Full tweet (280 chars)' },
  threads:   { chars: 250,   label: 'Feed fold (~250 chars)' },
  bluesky:   { chars: 300,   label: 'Full post (300 chars)' },
  facebook:  { chars: 250,   label: 'Feed truncation (~250 chars)' },
  mastodon:  { chars: 500,   label: 'Full post (500 chars)' },
  warpcast:  { chars: 320,   label: 'Full cast (320 chars)' },
  youtube:   { chars: 200,   label: 'Search snippet (~200 chars)' },
  medium:    { chars: 300,   label: 'Preview card excerpt' },
  hashnode:  { chars: 250,   label: 'Feed excerpt subtitle' },
  devto:     { chars: 250,   label: 'Feed excerpt subtitle' },
  listmonk:  { chars: 200,   label: 'Email preview text' },
  telegram:  { chars: 200,   label: 'Notification preview' },
  discord:   { chars: 200,   label: 'Embed preview' },
};

// ─── Universal Dealbreakers ────────────────────────────────────────────────────

export const UNIVERSAL_DEALBREAKERS: { pattern: RegExp; label: string; penalty: number }[] = [
  { pattern: /^(hey\s+guys|hi\s+guys|hello\s+everyone|hey\s+everyone|what'?s\s+up)/i,   label: 'Greeting opener. Nobody came to the feed to be greeted.',            penalty: 60 },
  { pattern: /^stop\s+scrolling/i,                                                        label: 'Attention-begging. Asking for attention proves you have not earned it.', penalty: 70 },
  { pattern: /^in\s+this\s+(video|post|reel|article|newsletter|thread)/i,               label: 'Meta-commentary opener. Opens with self-reference instead of the idea.', penalty: 50 },
  { pattern: /^today\s+i\s+(want|am going|will)/i,                                       label: 'Creator-first opener. The viewer is not here for your schedule.',       penalty: 40 },
  { pattern: /^so\s+i\s+(wanted|was|have been)/i,                                        label: 'Throat-clearing. Delays the idea.',                                     penalty: 35 },
  { pattern: /follow\s+(me|for\s+more)/i,                                                label: '"Follow for more" reflex bait. Weakens the hook.',                     penalty: 25 },
  { pattern: /^(amazing|incredible|awesome|exciting)\s+news/i,                           label: 'Hype without substance opener.',                                       penalty: 30 },
  { pattern: /^(just\s+a\s+quick|quick\s+update|quick\s+post)/i,                        label: '"Quick" pre-apology. Signals low-value content before it starts.',      penalty: 40 },
];

// ─── Slop Vocabulary (ported from ig-human SKILL.md) ─────────────────────────

export const SLOP_WORDS: string[] = [
  'delve', 'tapestry', 'game-changer', 'game changer', 'robust', 'seamless',
  'crucial', 'leverage', 'synergy', 'paradigm', 'holistic', 'streamline',
  'innovative', 'cutting-edge', 'state-of-the-art', 'world-class',
  'best-in-class', 'bleeding-edge', 'revolutionary', 'transformative',
  "in today's fast-paced world", "in today's digital landscape",
  'testament to', 'at the end of the day', 'think outside the box',
  'move the needle', 'low-hanging fruit', 'circle back', 'deep dive',
  'unpack', 'learnings', 'impactful', 'actionable', 'scalable',
  'stop scrolling', "in today's video", 'follow for more',
  'tag someone who needs this', 'life-changing', 'must-have', 'mind-blowing',
];

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface HookScoreBreakdown {
  frontload: number;
  specificity: number;
  stakes: number;
  address: number;
  curiosity: number;
  totalScore: number;
  grade: 'STRONG' | 'OK' | 'WEAK' | 'FAIL';
  dealbreaker: string | null;
  weakestDimension: string;
  slopWords: string[];
}

export interface HookScoreResult {
  hook: string;
  breakdown: HookScoreBreakdown;
  matchedFormulas: number[];
  foldWarning: string | null;
  suggestions: string[];
}

// ─── Main Scorer ───────────────────────────────────────────────────────────────

export class HookScorer {
  static score(hook: string, platform?: PlatformType): HookScoreResult {
    const trimmed = hook.trim();
    const suggestions: string[] = [];

    // 1. Universal dealbreaker check
    let dealbreaker: string | null = null;
    let dealbreakPenalty = 0;
    for (const db of UNIVERSAL_DEALBREAKERS) {
      if (db.pattern.test(trimmed)) {
        dealbreaker = db.label;
        dealbreakPenalty = db.penalty;
        break;
      }
    }

    // 2. Slop vocabulary detection
    const slopFound = SLOP_WORDS.filter(w => trimmed.toLowerCase().includes(w.toLowerCase()));
    if (slopFound.length > 0) suggestions.push(`Remove slop vocabulary: ${slopFound.slice(0, 3).join(', ')}`);

    // 3. Score five dimensions
    const preamblePatterns = /^(so|well|ok|alright|today|in\s+this|let\s+me|i\s+want\s+to|i\s+am\s+going)/i;
    const frontload = preamblePatterns.test(trimmed) ? 20 : 100;
    if (frontload < 100) suggestions.push('Cut the preamble — start with the idea, not the setup.');

    const hasNumber = /\d+/.test(trimmed);
    const hasConcreteThing = /\$|%|€|£|\bk\b|\bK\b|million|thousand|days?|weeks?|months?|years?|hours?|minutes?/i.test(trimmed);
    const specificity = Math.min(100, (hasNumber ? 50 : 0) + (hasConcreteThing ? 50 : 0));
    if (specificity < 50) suggestions.push('Add a specific number, timeframe, or named entity. Vague claims are invisible.');

    const stakePatterns = /lost|gained|earned|cost|paid|saved|wasted|failed|won|landed|fired|quit|left|broke|sold|raised|funded|hired|scaled/i;
    const stakes = stakePatterns.test(trimmed) ? 100 : 40;
    if (stakes < 80) suggestions.push('Add a concrete stake — what was won, lost, or at risk?');

    const addressPatterns = /if you|you are|for (anyone|founders|designers|developers|engineers|creators|freelancers|builders)|when you/i;
    const address = addressPatterns.test(trimmed) ? 100 : 60;

    const curiosityPatterns = /why|how|what|here is|the reason|turns out|nobody|most people|but|except|until|even though/i;
    const curiosity = curiosityPatterns.test(trimmed) ? 90 : 55;
    if (curiosity < 70) suggestions.push('Create an open loop — imply that what comes next will resolve an unsaid question.');

    // 4. Weighted total
    const rawTotal = frontload * 0.20 + specificity * 0.30 + stakes * 0.20 + address * 0.15 + curiosity * 0.15;
    const totalScore = Math.max(0, Math.round(rawTotal - dealbreakPenalty - (slopFound.length * 5)));

    // 5. Grade
    let grade: HookScoreBreakdown['grade'];
    if (dealbreaker && dealbreakPenalty >= 50) grade = 'FAIL';
    else if (totalScore >= 75) grade = 'STRONG';
    else if (totalScore >= 50) grade = 'OK';
    else if (totalScore >= 25) grade = 'WEAK';
    else grade = 'FAIL';

    // 6. Weakest dimension
    const dims = [
      { name: 'FRONTLOAD', score: frontload },
      { name: 'SPECIFICITY', score: specificity },
      { name: 'STAKES', score: stakes },
      { name: 'ADDRESS', score: address },
      { name: 'CURIOSITY', score: curiosity },
    ].sort((a, b) => a.score - b.score);
    const weakestDimension = dims[0].name;

    // 7. Formula matching
    const matchedFormulas = HookScorer.matchFormulas(trimmed);

    // 8. Platform fold warning
    let foldWarning: string | null = null;
    if (platform && PLATFORM_HOOK_WINDOWS[platform]) {
      const w = PLATFORM_HOOK_WINDOWS[platform]!;
      if (trimmed.length > w.chars) {
        foldWarning = `Hook is ${trimmed.length} chars but ${platform} shows only ${w.chars} (${w.label}) before truncation.`;
      }
    }

    return { hook: trimmed, breakdown: { frontload, specificity, stakes, address, curiosity, totalScore, grade, dealbreaker, weakestDimension, slopWords: slopFound }, matchedFormulas, foldWarning, suggestions: suggestions.slice(0, 3) };
  }

  static rank(hooks: string[], platform?: PlatformType): HookScoreResult[] {
    return hooks.map(h => HookScorer.score(h, platform)).sort((a, b) => b.breakdown.totalScore - a.breakdown.totalScore);
  }

  static matchFormulas(hook: string): number[] {
    const matched: number[] = [];
    const matchers: [number, RegExp][] = [
      [1,  /i lost \$?\d/i],                          [2,  /most people think|they are wrong/i],
      [3,  /^\d+\s+\w+.*in \d+/i],                    [4,  /nobody tells you/i],
      [5,  /one (mistake|decision|habit|thing)/i],     [6,  /for \d+ (year|month|day).*before i realized/i],
      [7,  /vs\.?\s+\d+|versus/i],                     [8,  /if you (are|have|want|need)/i],
      [9,  /how i .* in \d+/i],                        [10, /what i wish/i],
      [11, /the thing about/i],                        [12, /i replaced/i],
      [13, /why does.*even when/i],                    [14, /^\d+%\s+of/i],
      [15, /simpler than you think/i],                 [16, /someone asked me/i],
      [17, /uncomfortable truth/i],                    [18, /after \d+ years?/i],
      [19, /is a myth/i],                              [20, /if i started.*from zero/i],
      [21, /hidden cost/i],                            [22, /it was.*(pm|am|morning|night|day)/i],
      [23, /what everyone says.*what actually works/i],[24, /is not.*it is/i],
      [26, /none of them are/i],
    ];
    for (const [id, re] of matchers) { if (re.test(hook)) matched.push(id); }
    return matched;
  }

  static suggestFormulas(count = 3): HookFormula[] {
    const preferred = [1, 4, 2, 16, 5, 9, 3, 17, 22, 20, 18, 10];
    return preferred.slice(0, count).map(id => HOOK_FORMULAS.find(f => f.id === id)!).filter(Boolean);
  }

  static getFormula(id: number): HookFormula | undefined {
    return HOOK_FORMULAS.find(f => f.id === id);
  }
}

export const HookScoreResultSchema = z.object({
  hook: z.string(),
  breakdown: z.object({
    frontload: z.number(), specificity: z.number(), stakes: z.number(),
    address: z.number(), curiosity: z.number(), totalScore: z.number(),
    grade: z.enum(['STRONG', 'OK', 'WEAK', 'FAIL']),
    dealbreaker: z.string().nullable(), weakestDimension: z.string(),
    slopWords: z.array(z.string()),
  }),
  matchedFormulas: z.array(z.number()),
  foldWarning: z.string().nullable(),
  suggestions: z.array(z.string()),
});
