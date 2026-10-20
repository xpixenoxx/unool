import type { StoryIntakeData, WeekArc, ArcPost, PlatformType } from '@/types/flightplan';

const BEAT_TEMPLATES = [
  {
    beat: 'Hook',
    day: 0,
    dayLabel: 'Monday',
    scheduledHour: 9,
    scheduledMinute: 30,
    prefix: '',
    suffix: {
      instagram: '\n\n#buildinpublic #creators #startuplife',
      facebook: '\n\nFull story and details in comments.',
      linkedin: '\n\nWhat would you have done in this situation?',
      x: '',
      threads: '',
      bluesky: '',
    },
  },
  {
    beat: 'Context',
    day: 1,
    dayLabel: 'Tuesday',
    scheduledHour: 8,
    scheduledMinute: 30,
    prefix: 'The context behind the decision: ',
    suffix: {
      instagram: '\n\nSwipe to see our timeline breakdown 👉',
      facebook: '\n\nContext matters when making product pivots.',
      linkedin: '\n\nContext is everything in product strategy.',
      x: '',
      threads: '',
      bluesky: '',
    },
  },
  {
    beat: 'Challenge',
    day: 2,
    dayLabel: 'Wednesday',
    scheduledHour: 12,
    scheduledMinute: 0,
    prefix: 'The biggest obstacle we faced: ',
    suffix: {
      instagram: '\n\nDrop a comment if you have dealt with this bottleneck.',
      facebook: '\n\nHow do you solve this in your workflow?',
      linkedin: '\n\nHave you seen this in your team?',
      x: '',
      threads: '',
      bluesky: '',
    },
  },
  {
    beat: 'Proof',
    day: 3,
    dayLabel: 'Thursday',
    scheduledHour: 10,
    scheduledMinute: 0,
    prefix: 'The numbers that proved the turnaround: ',
    suffix: {
      instagram: '\n\n#growth #metrics #saas',
      facebook: '\n\nReal data from the last 3 weeks.',
      linkedin: '\n\nData over intuition every time.',
      x: '',
      threads: '',
      bluesky: '',
    },
  },
  {
    beat: 'CTA',
    day: 4,
    dayLabel: 'Friday',
    scheduledHour: 17,
    scheduledMinute: 0,
    prefix: 'The next chapter: ',
    suffix: {
      instagram: '\n\nLink in bio to try the new flow.',
      facebook: '\n\nCheck out the full story: unool.com/flight',
      linkedin: '\n\nTry it yourself and let me know what we should improve next.',
      x: '',
      threads: '',
      bluesky: '',
    },
  },
];

export function generateClientFallbackArc(data: StoryIntakeData): WeekArc {
  const platforms = (data.selectedPlatforms && data.selectedPlatforms.length > 0)
    ? data.selectedPlatforms
    : (['instagram', 'facebook', 'linkedin', 'threads', 'x'] as PlatformType[]);

  const titleSnippet = data.coreStory.split('.')[0]?.trim().slice(0, 60) || 'Weekly Narrative Arc';

  const weekPosts: ArcPost[] = BEAT_TEMPLATES.map((tmpl, idx) => {
    let baseCopy = '';
    if (idx === 0) {
      baseCopy = data.coreStory;
    } else if (idx === 1) {
      baseCopy = data.whatChanged
        ? `${tmpl.prefix}${data.whatChanged}. ${data.coreStory.slice(0, 140)}`
        : `Here is the deeper context: ${data.coreStory}`;
    } else if (idx === 2) {
      baseCopy = data.whatWentWrong
        ? `${tmpl.prefix}${data.whatWentWrong}. The obstacle that forced our pivot.`
        : `The challenge: 35% of users dropped off before ever seeing the value. Our process was the bottleneck.`;
    } else if (idx === 3) {
      baseCopy = data.oneRealNumber
        ? `${tmpl.prefix}${data.oneRealNumber}. Measurable impact in just 3 weeks.`
        : `The numbers: +47 new accounts in 3 weeks, and churn dropped by 35%.`;
    } else {
      baseCopy = `Want to see how this works in practice? Try our new flow free, plan your first week in minutes, and tell us what we should build next.`;
    }

    const platformDrafts = platforms.map(p => {
      const suffix = (tmpl.suffix as any)[p] || '';
      let copy = `${baseCopy}${suffix}`;
      if (p === 'x' && copy.length > 275) copy = copy.slice(0, 270) + '...';
      if (p === 'bluesky' && copy.length > 295) copy = copy.slice(0, 290) + '...';

      return {
        platform: p,
        content: copy,
        characterCount: copy.length,
        hashtags: ['#BuildInPublic', '#Storytelling'],
        firstCommentHint: p === 'instagram' ? 'Full story and data link in bio' : null,
        autoFirstComment: p === 'instagram' ? 'Full story and data breakdown: unool.com/flight #buildinpublic' : null,
        schedulingOffsetMinutes: p === 'linkedin' ? 45 : p === 'threads' ? 90 : 0,
        enabled: true,
      };
    });

    return {
      day: tmpl.day,
      dayLabel: tmpl.dayLabel,
      arcBeat: tmpl.beat,
      arcBeatReason: `Beat ${idx + 1}: ${tmpl.beat} drives strategic progression for the weekly narrative.`,
      scheduledHour: tmpl.scheduledHour,
      scheduledMinute: tmpl.scheduledMinute,
      platforms: platformDrafts,
    };
  });

  return {
    arcTitle: titleSnippet,
    storyType: 'shipped',
    storyTypeReason: 'Synthesized 5-beat story arc tailored to founder momentum and milestone sharing.',
    weekPosts,
  };
}
