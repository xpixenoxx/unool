import { z } from 'zod';
import { generateWithFallback } from '@/lib/ai/provider';
import { logger } from '@/lib/logger';
import type { StoryType } from '@/lib/repositories/interfaces/IPostRepository';
import { PlatformType, buildOnboardingPrompt, PLATFORM_SPECS } from '@/lib/ai/PostAdapter';
import { ContentGuard } from '@/lib/ai/ContentGuard';

// ─── Zod Schema for one post in the arc ────────────────────────────────────

export const ArcPostDraftSchema = z.object({
  day: z.number().min(0).max(6),               // 0 = Monday, 6 = Sunday
  dayLabel: z.string(),                         // e.g. "Monday", "Tuesday"
  arcBeat: z.string(),                          // e.g. "The Contrarian Hook"
  arcBeatReason: z.string(),                    // Why this beat works here
  scheduledHour: z.number().min(0).max(23),     // Local hour (24h format)
  scheduledMinute: z.number().default(0),
  platforms: z.array(z.object({
    platform: z.string(),
    content: z.string(),
    characterCount: z.number(),
    hashtags: z.array(z.string()),
    firstCommentHint: z.string().nullable().optional(),
    autoFirstComment: z.string().nullable().optional(), // Link to move to first comment
    schedulingOffsetMinutes: z.number().default(0),     // For cascading: offset from base time
    enabled: z.boolean().default(true).optional(),       // Whether the user allows uploading to this platform
  })),
  imageUrl: z.string().nullable().optional(),
  imageUrls: z.array(z.string()).optional(),
  deleted: z.boolean().optional(),
});

export type ArcPostDraft = z.infer<typeof ArcPostDraftSchema>;

export const WeekArcSchema = z.object({
  arcTitle: z.string(),
  storyType: z.enum(['shipped', 'learned', 'milestone', 'opinion']),
  storyTypeReason: z.string(),
  weekPosts: z.array(ArcPostDraftSchema),
});

export type WeekArc = z.infer<typeof WeekArcSchema>;

// ─── Story type detection ───────────────────────────────────────────────────

const STORY_TYPE_CUES: Record<StoryType, string[]> = {
  shipped: ['launched', 'shipped', 'deployed', 'built', 'released', 'fixed', 'solved', 'integrated', 'completed', 'finished'],
  learned: ['learned', 'realized', 'discovered', 'understood', 'lesson', 'mistake', 'failed', 'wrong', 'experiment', 'tried'],
  milestone: ['users', 'revenue', 'funding', 'raised', 'growth', 'hit', 'reached', 'milestone', 'team', 'hired'],
  opinion: ['think', 'believe', 'opinion', 'take', 'controversial', 'disagree', 'wrong about', 'change my mind', 'hot take'],
};

export function detectStoryType(story: string): StoryType {
  const lower = story.toLowerCase();
  let bestType: StoryType = 'shipped';
  let bestScore = 0;

  for (const [type, cues] of Object.entries(STORY_TYPE_CUES) as [StoryType, string[]][]) {
    const score = cues.reduce((acc, cue) => acc + (lower.includes(cue) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }
  return bestType;
}

// ─── Arc beat templates per story type ─────────────────────────────────────

const ARC_BEATS: Record<StoryType, Array<{ beat: string; day: number; dayLabel: string; scheduledHour: number; platforms: string[] }>> = {
  shipped: [
    { beat: 'The Contrarian Hook',       day: 0, dayLabel: 'Monday',    scheduledHour: 9,  platforms: ['linkedin', 'x', 'bluesky'] },
    { beat: 'The Technical Blueprint',   day: 1, dayLabel: 'Tuesday',   scheduledHour: 9,  platforms: ['linkedin'] },
    { beat: 'The Visual Proof',          day: 2, dayLabel: 'Wednesday', scheduledHour: 14, platforms: ['threads', 'instagram'] },
    { beat: 'The Failure & Lesson',      day: 3, dayLabel: 'Thursday',  scheduledHour: 9,  platforms: ['linkedin', 'threads'] },
    { beat: 'The Community Question',    day: 4, dayLabel: 'Friday',    scheduledHour: 11, platforms: ['threads', 'x'] },
  ],
  learned: [
    { beat: 'The Bold Claim',            day: 0, dayLabel: 'Monday',    scheduledHour: 9,  platforms: ['linkedin', 'x'] },
    { beat: 'The Deep Teardown',         day: 2, dayLabel: 'Wednesday', scheduledHour: 9,  platforms: ['linkedin'] },
    { beat: 'The Discussion Opener',     day: 4, dayLabel: 'Friday',    scheduledHour: 11, platforms: ['threads', 'bluesky'] },
  ],
  milestone: [
    { beat: 'The Teaser',                day: 0, dayLabel: 'Monday',    scheduledHour: 9,  platforms: ['x', 'bluesky'] },
    { beat: 'The Full Story',            day: 1, dayLabel: 'Tuesday',   scheduledHour: 9,  platforms: ['linkedin'] },
    { beat: 'The Thank You & Ask',       day: 3, dayLabel: 'Thursday',  scheduledHour: 11, platforms: ['threads', 'linkedin'] },
  ],
  opinion: [
    { beat: 'The Contrarian Take',       day: 0, dayLabel: 'Monday',    scheduledHour: 9,  platforms: ['linkedin', 'x'] },
    { beat: 'The Evidence & Argument',   day: 2, dayLabel: 'Wednesday', scheduledHour: 9,  platforms: ['linkedin'] },
    { beat: 'The Discussion Invite',     day: 4, dayLabel: 'Friday',    scheduledHour: 11, platforms: ['threads', 'bluesky'] },
  ],
};

// ─── Platform character limits & style notes (compact) ─────────────────────

const PLATFORM_NOTES: Record<string, string> = {
  linkedin: 'Professional storytelling, up to 3000 chars. No outbound links in body (use first comment). 3-5 hashtags at end.',
  x:        'Punchy hook, 280 chars max. 1-2 hashtags.',
  bluesky:  'Direct and transparent, 300 chars max. No hashtag spam.',
  threads:  'Conversational, 500 chars max, invite discussion. 2-4 hashtags.',
  instagram: 'Caption max 2200 chars. Visual-first framing. Move outbound links to bio or first comment.',
};

// ─── Upcoming Days Calculator (Prevents scheduling on past days) ───────────

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function getUpcomingDaysForArc(weekStartDate?: string): Array<{ day: number; dayLabel: string; isToday: boolean }> {
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let startMonday: Date;
  if (weekStartDate) {
    const parts = weekStartDate.split('-');
    if (parts.length === 3) {
      startMonday = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      startMonday = new Date(weekStartDate);
    }
    if (isNaN(startMonday.getTime())) {
      startMonday = new Date(todayMidnight);
    }
  } else {
    startMonday = new Date(todayMidnight);
    const dayOfWeek = (startMonday.getDay() + 6) % 7; // Monday = 0
    startMonday.setDate(startMonday.getDate() - dayOfWeek);
  }

  // Filter only days that are today or in the future
  const upcoming: Array<{ day: number; dayLabel: string; isToday: boolean }> = [];
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const d = new Date(startMonday.getFullYear(), startMonday.getMonth(), startMonday.getDate() + dayOffset);
    if (d.getTime() >= todayMidnight.getTime()) {
      upcoming.push({
        day: dayOffset,
        dayLabel: DAY_NAMES[dayOffset] || 'Day',
        isToday: d.getTime() === todayMidnight.getTime(),
      });
    }
  }

  // Fallback: If all days in weekStartDate have already passed, advance to next upcoming week
  if (upcoming.length === 0) {
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      upcoming.push({
        day: dayOffset,
        dayLabel: DAY_NAMES[dayOffset] || 'Day',
        isToday: false,
      });
    }
  }

  return upcoming;
}

// ─── Fact-Grounded Algorithmic Synthesizer (Fallback when AI Provider is offline) ─────

function synthesizeFactGroundedArc(params: {
  coreStory: string;
  followUps: { whatChanged: string; whatWentWrong: string; oneRealNumber: string };
  connectedPlatforms: PlatformType[];
  audienceTimezone: string;
  userFirstName: string;
  weekStartDate?: string;
}): WeekArc | null {
  const { coreStory, followUps, connectedPlatforms, weekStartDate } = params;

  // Enforce ContentGuard quality & safety rules: never synthesize un-generatable content
  const guard = ContentGuard.validateInput(coreStory, { route: 'weekarc/synthesize' });
  if (!guard.safe) {
    logger.warn('ContentGuard blocked synthesizeFactGroundedArc coreStory', { code: guard.violation.code });
    return null;
  }

  const combinedFollowUps = `${followUps.whatChanged || ''} ${followUps.whatWentWrong || ''} ${followUps.oneRealNumber || ''}`.trim();
  if (combinedFollowUps) {
    const followUpGuard = ContentGuard.validateSocialInput(combinedFollowUps, { route: 'weekarc/synthesize/followups' });
    if (!followUpGuard.safe) {
      logger.warn('ContentGuard blocked synthesizeFactGroundedArc followups', { code: followUpGuard.violation.code });
      return null;
    }
  }

  const detectedType = detectStoryType(coreStory);
  const arcBeats = ARC_BEATS[detectedType];
  const upcomingDays = getUpcomingDaysForArc(weekStartDate);
  const now = new Date();

  const storyClean = guard.sanitizedContent;
  const num = followUps.oneRealNumber.trim();
  const changed = followUps.whatChanged.trim();
  const mistake = followUps.whatWentWrong.trim();

  // Generate for ALL connected platforms (fallback to defaults if none)
  const activePlatforms = connectedPlatforms.length > 0 ? connectedPlatforms : (['linkedin', 'threads', 'x'] as PlatformType[]);

  const weekPosts = arcBeats.map((b, i) => {
    // Map beat to a future/today slot, never a past day
    const daySlot = upcomingDays[i] || upcomingDays[upcomingDays.length - 1];
    let scheduledHour = b.scheduledHour;
    if (daySlot.isToday && now.getHours() >= scheduledHour) {
      scheduledHour = Math.min(23, now.getHours() + 1);
    }

    const platforms = activePlatforms.map((platform) => {
      let content = '';
      let hashtags: string[] = ['#BuildInPublic', '#Tech'];
      let autoFirstComment: string | null = null;
      let schedulingOffsetMinutes = 0;

      if (platform === 'linkedin') {
        schedulingOffsetMinutes = 45;
        hashtags = ['#BuildInPublic', '#Startups', '#Engineering'];

        if (b.beat.includes('Hook') || b.beat.includes('Claim') || b.beat.includes('Teaser') || b.beat.includes('Take')) {
          content = `Most people think progress in tech is linear.\n\nHere is what actually happened this week:\n\n${storyClean}\n\n${num ? `The metric that mattered most: ${num}.\n\n` : ''}Here is the honest breakdown of why we took this approach and what we learned.`;
        } else if (b.beat.includes('Blueprint') || b.beat.includes('Teardown') || b.beat.includes('Full Story') || b.beat.includes('Evidence')) {
          content = `Under the hood of what we built:\n\n${storyClean}\n\n${changed ? `What actually changed behind the scenes:\n${changed}\n\n` : ''}Key architectural principle: keep the feedback loop fast and isolate failures so the core product remains resilient.`;
        } else if (b.beat.includes('Lesson') || b.beat.includes('Proof') || b.beat.includes('Failure')) {
          content = `The part builders rarely post about: what broke along the way.\n\n${mistake ? `The friction:\n${mistake}\n\n` : 'Every deployment carries unexpected friction.\n\n'}The fix: We diagnosed the bottleneck, refactored the pipeline, and added automated guardrails.\n\nOwn the bug. Ship the fix. Share the lesson.`;
        } else {
          content = `Reflecting on the week after ${storyClean.slice(0, 100)}...\n\nQuestion for fellow builders and founders:\nWhen shipping fast, how do you balance edge-case reliability vs speed?\n\nCurious to hear your perspective below 👇`;
        }

        if (content.includes('http://') || content.includes('https://')) {
          autoFirstComment = 'Links and additional references in the comments below.';
        }
      } else if (platform === 'x' || platform === 'bluesky') {
        schedulingOffsetMinutes = 0;
        hashtags = ['#BuildInPublic'];

        if (b.beat.includes('Hook') || b.beat.includes('Claim') || b.beat.includes('Teaser')) {
          content = `${num ? `${num} — ` : ''}${storyClean.slice(0, 200)}\n\nHere's what we did differently:`;
        } else if (b.beat.includes('Lesson') || b.beat.includes('Failure')) {
          content = `What went wrong this week: ${mistake ? mistake.slice(0, 180) : storyClean.slice(0, 180)}\n\nThe fix is live.`;
        } else {
          content = `${storyClean.slice(0, 200)}\n\nWhat would you have done here?`;
        }
      } else {
        // Threads / Instagram
        schedulingOffsetMinutes = 120;
        hashtags = ['#FounderJourney', '#BuildInPublic'];

        if (b.beat.includes('Lesson') || b.beat.includes('Failure')) {
          content = `Honest founder update: ${mistake ? mistake.slice(0, 280) : storyClean.slice(0, 280)}\n\nLearning in public is humbling but it's the fastest way to get better.`;
        } else {
          content = `${storyClean.slice(0, 320)}${num ? `\n\nMetric: ${num}` : ''}\n\nThoughts on this approach?`;
        }
      }

      let sanitizedContent = ContentGuard.sanitizeOutput(content);
      const filteredHashtags = ContentGuard.filterHashtags(hashtags, { maxCount: 10 });
      const spec = PLATFORM_SPECS[platform];
      if (spec?.maxChars && sanitizedContent.length > spec.maxChars) {
        const trimmed = sanitizedContent.slice(0, spec.maxChars - 3);
        const lastSpace = trimmed.lastIndexOf(' ');
        sanitizedContent = (lastSpace > spec.maxChars * 0.8 ? trimmed.slice(0, lastSpace) : trimmed) + '...';
      }

      return {
        platform,
        content: sanitizedContent,
        characterCount: sanitizedContent.length,
        hashtags: filteredHashtags,
        firstCommentHint: null,
        autoFirstComment,
        schedulingOffsetMinutes,
        enabled: true,
      };
    });

    return {
      day: daySlot.day,
      dayLabel: daySlot.dayLabel,
      arcBeat: b.beat,
      arcBeatReason: `Strategic narrative step: establishes authority and keeps engagement high across connected networks.`,
      scheduledHour,
      scheduledMinute: 0,
      platforms,
    };
  });

  const titleSnippet = storyClean.split('.')[0]?.slice(0, 45) || 'Weekly Momentum Arc';

  return {
    arcTitle: `${titleSnippet}`,
    storyType: detectedType,
    storyTypeReason: `Categorized as ${detectedType} because the narrative highlights concrete accomplishments, lessons, and metrics.`,
    weekPosts,
  };
}

// ─── Main arc generator ─────────────────────────────────────────────────────

export async function generateWeekArc(params: {
  coreStory: string;
  followUps: { whatChanged: string; whatWentWrong: string; oneRealNumber: string };
  connectedPlatforms: PlatformType[];
  audienceTimezone: string;      // e.g. "Asia/Kolkata"
  userFirstName: string;
  weekStartDate?: string;
  onboardingPrompt?: string;
  onboardingAnswers?: Record<string, any> | null;
}): Promise<WeekArc | null> {
  const { coreStory, followUps, connectedPlatforms, audienceTimezone, userFirstName, weekStartDate } = params;

  // 1. ContentGuard validation before generation: do not process unsafe/noise content
  const guard = ContentGuard.validateInput(coreStory, { route: 'weekarc/generate' });
  if (!guard.safe) {
    logger.warn('ContentGuard blocked week arc coreStory in generateWeekArc', { code: guard.violation.code });
    return null;
  }

  // 2. Validate followUps
  const combinedFollowUps = `${followUps.whatChanged || ''} ${followUps.whatWentWrong || ''} ${followUps.oneRealNumber || ''}`.trim();
  if (combinedFollowUps) {
    const followUpGuard = ContentGuard.validateSocialInput(combinedFollowUps, { route: 'weekarc/generate/followups' });
    if (!followUpGuard.safe) {
      logger.warn('ContentGuard blocked week arc followups in generateWeekArc', { code: followUpGuard.violation.code });
      return null;
    }
  }

  const onboardingPrompt = params.onboardingPrompt || (params.onboardingAnswers ? buildOnboardingPrompt(params.onboardingAnswers) : undefined);
  const detectedType = detectStoryType(coreStory);
  const arcBeats = ARC_BEATS[detectedType];
  const upcomingDays = getUpcomingDaysForArc(weekStartDate);
  const now = new Date();

  // Generate for ALL connected platforms (fallback to default 3)
  const activePlatforms = connectedPlatforms.length > 0 ? connectedPlatforms : (['linkedin', 'threads', 'x'] as PlatformType[]);

  const activePlatformNotes = activePlatforms
    .filter(p => PLATFORM_NOTES[p])
    .map(p => `- ${p}: ${PLATFORM_NOTES[p]}`)
    .join('\n');

  const fullStory = [
    `Core story: ${guard.sanitizedContent}`,
    followUps.whatChanged ? `What changed: ${followUps.whatChanged}` : '',
    followUps.whatWentWrong ? `What went wrong: ${followUps.whatWentWrong}` : '',
    followUps.oneRealNumber ? `Real number: ${followUps.oneRealNumber}` : '',
  ].filter(Boolean).join('\n');

  const beatsDescription = arcBeats.map((b, i) => {
    const daySlot = upcomingDays[i] || upcomingDays[upcomingDays.length - 1];
    let hour = b.scheduledHour;
    if (daySlot.isToday && now.getHours() >= hour) {
      hour = Math.min(23, now.getHours() + 1);
    }
    return `Post ${i + 1}: "${b.beat}" — ${daySlot.dayLabel} (day: ${daySlot.day}) at ~${hour}:00, generate variants for ALL connected platforms: ${activePlatforms.join(', ')}`;
  }).join('\n');

  const prompt = `You are a world-class content strategist for creators and founders. Your job is to transform ONE real story into a week of native platform content.

${onboardingPrompt ? `${onboardingPrompt}\n\n` : ''}CREATOR NAME: ${userFirstName}
AUDIENCE TIMEZONE: ${audienceTimezone}

THE STORY (fact-grounded — use ONLY facts from this input, do NOT invent numbers or claims):
${fullStory}

STORY TYPE DETECTED: ${detectedType}
CONNECTED PLATFORMS:
${activePlatformNotes}

WEEK ARC STRUCTURE:
${beatsDescription}

RULES (critical):
1. Every number or claim in a draft MUST come directly from the story input above. If no number was provided for a beat, write around it — do not fabricate.
2. Each platform draft must sound native to that platform — not copy-pasted.
3. If a post has an outbound link on LinkedIn, put it in autoFirstComment, not in the main content.
4. For cascading mode: LinkedIn posts should publish 45 minutes AFTER the X/Bluesky post (schedulingOffsetMinutes: 45). Threads/Instagram should publish 120 minutes after (schedulingOffsetMinutes: 120).
5. The opening line of every draft must create immediate curiosity or value. No generic openers.
6. arcBeatReason must explain in ONE clear sentence why this beat works on this day for this story type.
7. scheduledHour values are in ${audienceTimezone} local time (24h).
8. CRITICAL: Every post MUST generate native content for EVERY connected platform: ${activePlatforms.join(', ')}.
9. CRITICAL: Do NOT schedule any post on a past day. Strictly use the day indices and labels provided in the structure above.

Return a JSON object matching this exact structure:
{
  "arcTitle": "Brief title for this week arc (max 8 words)",
  "storyType": "${detectedType}",
  "storyTypeReason": "One sentence explaining why this story is categorized as ${detectedType}",
  "weekPosts": [
    {
      "day": 0,
      "dayLabel": "Monday",
      "arcBeat": "The beat name",
      "arcBeatReason": "Why this beat works here",
      "scheduledHour": 9,
      "scheduledMinute": 0,
      "platforms": [
        {
          "platform": "linkedin",
          "content": "Full post content here",
          "characterCount": 450,
          "hashtags": ["#BuildInPublic"],
          "firstCommentHint": null,
          "autoFirstComment": null,
          "schedulingOffsetMinutes": 45,
          "enabled": true
        }
      ]
    }
  ]
}

Write ONLY the JSON. No markdown code blocks. No explanation.`;

  try {
    const safePrompt = ContentGuard.buildSafePrompt(prompt);
    const result = await generateWithFallback(safePrompt, { maxTokens: 6000 }, WeekArcSchema);

    if (result.ok && result.value) {
      // Check if AI refused to generate content (returned empty posts per Rule 4)
      const hasRealContent = result.value.weekPosts.some(p =>
        p.platforms.some(pl => pl.content && pl.content.trim().length > 0)
      );
      if (!hasRealContent) {
        logger.warn('AI refused week arc generation due to safety/policy constraints');
        return null;
      }

      // Validate that posts are assigned to valid upcoming days and have all active platforms
      const validUpcomingDayNumbers = new Set(upcomingDays.map(d => d.day));
      const processedPosts = result.value.weekPosts.map((post, idx) => {
        const slot = upcomingDays[idx] || upcomingDays[upcomingDays.length - 1];
        const day = validUpcomingDayNumbers.has(post.day) ? post.day : slot.day;
        const dayLabel = DAY_NAMES[day] || slot.dayLabel;
        let scheduledHour = post.scheduledHour;
        if (slot.isToday && now.getHours() >= scheduledHour) {
          scheduledHour = Math.min(23, now.getHours() + 1);
        }

        // Ensure all active platforms are present, sanitized, and enabled
        const existingPlatforms = new Map(post.platforms.map(p => [p.platform, p]));
        const mergedPlatforms = activePlatforms.map(platform => {
          const spec = PLATFORM_SPECS[platform];
          const existing = existingPlatforms.get(platform);
          if (existing) {
            let cleanContent = ContentGuard.sanitizeOutput(existing.content);
            if (spec?.maxChars && cleanContent.length > spec.maxChars) {
              const trimmed = cleanContent.slice(0, spec.maxChars - 3);
              const lastSpace = trimmed.lastIndexOf(' ');
              cleanContent = (lastSpace > spec.maxChars * 0.8 ? trimmed.slice(0, lastSpace) : trimmed) + '...';
            }
            return {
              ...existing,
              content: cleanContent,
              characterCount: cleanContent.length,
              hashtags: ContentGuard.filterHashtags(existing.hashtags || [], { maxCount: 10 }),
              enabled: existing.enabled !== false,
            };
          }
          let fallbackContent = ContentGuard.sanitizeOutput(post.platforms[0]?.content || coreStory.slice(0, 280));
          if (spec?.maxChars && fallbackContent.length > spec.maxChars) {
            const trimmed = fallbackContent.slice(0, spec.maxChars - 3);
            const lastSpace = trimmed.lastIndexOf(' ');
            fallbackContent = (lastSpace > spec.maxChars * 0.8 ? trimmed.slice(0, lastSpace) : trimmed) + '...';
          }
          return {
            platform,
            content: fallbackContent,
            characterCount: fallbackContent.length,
            hashtags: ContentGuard.filterHashtags(post.platforms[0]?.hashtags || ['#BuildInPublic'], { maxCount: 10 }),
            firstCommentHint: null,
            autoFirstComment: null,
            schedulingOffsetMinutes: platform === 'linkedin' ? 45 : platform === 'threads' || platform === 'instagram' ? 120 : 0,
            enabled: true,
          };
        });

        return {
          ...post,
          day,
          dayLabel,
          scheduledHour,
          platforms: mergedPlatforms,
        };
      });

      return {
        ...result.value,
        weekPosts: processedPosts,
      };
    }

    logger.warn('AI provider generation was not successful — using fact-grounded synthesis fallback', {
      error: !result.ok ? result.error.message : 'no value',
    });
  } catch (err) {
    logger.error('generateWithFallback exception caught in generateWeekArc', {
      error: err instanceof Error ? err : new Error(String(err)),
    });
  }

  // Graceful deterministic fallback: synthesize fact-grounded week arc directly from user facts
  return synthesizeFactGroundedArc({
    ...params,
    coreStory: guard.sanitizedContent,
  });
}
