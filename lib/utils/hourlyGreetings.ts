/**
 * Dynamic 24-Hour Greeting Engine for Unool Overview Dashboard
 * 
 * Replaces generic "Welcome back" greetings with time-crafted,
 * contextual messages tailored for creators building their brands.
 */

export type GreetingPhase = 'late-night' | 'morning' | 'afternoon' | 'evening' | 'night';

export interface HourlyGreetingConfig {
  hour: number;          // 0 - 23
  timeLabel: string;     // e.g. "12 AM", "1 AM", "12 PM", "6 PM"
  phase: GreetingPhase;  // 'late-night' | 'morning' | 'afternoon' | 'evening' | 'night'
  phaseLabel: string;    // "Late night", "Morning", "Afternoon", "Evening", "Night"
  template: string;      // e.g. "Still building, {name}. That’s how brands are made."
}

export const HOURLY_GREETINGS: Record<number, HourlyGreetingConfig> = {
  // ─── Late night (12 AM - 4 AM) ──────────────────────────────────
  0: {
    hour: 0,
    timeLabel: '12 AM',
    phase: 'late-night',
    phaseLabel: 'Late night',
    template: 'Still building, {name}. That’s how brands are made.',
  },
  1: {
    hour: 1,
    timeLabel: '1 AM',
    phase: 'late-night',
    phaseLabel: 'Late night',
    template: 'Your queue runs while you rest, {name}.',
  },
  2: {
    hour: 2,
    timeLabel: '2 AM',
    phase: 'late-night',
    phaseLabel: 'Late night',
    template: 'Great ideas don’t keep office hours, {name}.',
  },
  3: {
    hour: 3,
    timeLabel: '3 AM',
    phase: 'late-night',
    phaseLabel: 'Late night',
    template: 'Quiet hours, clear thinking, {name}.',
  },
  4: {
    hour: 4,
    timeLabel: '4 AM',
    phase: 'late-night',
    phaseLabel: 'Late night',
    template: 'Ahead of the world again, {name}.',
  },

  // ─── Morning (5 AM - 11 AM) ─────────────────────────────────────
  5: {
    hour: 5,
    timeLabel: '5 AM',
    phase: 'morning',
    phaseLabel: 'Morning',
    template: 'The early start is your edge, {name}.',
  },
  6: {
    hour: 6,
    timeLabel: '6 AM',
    phase: 'morning',
    phaseLabel: 'Morning',
    template: 'A new day to grow your audience, {name}.',
  },
  7: {
    hour: 7,
    timeLabel: '7 AM',
    phase: 'morning',
    phaseLabel: 'Morning',
    template: 'Good morning, {name}. Let’s make it count.',
  },
  8: {
    hour: 8,
    timeLabel: '8 AM',
    phase: 'morning',
    phaseLabel: 'Morning',
    template: 'Your audience is waking up, {name}. Be there.',
  },
  9: {
    hour: 9,
    timeLabel: '9 AM',
    phase: 'morning',
    phaseLabel: 'Morning',
    template: 'Consistency wins. Let’s publish, {name}.',
  },
  10: {
    hour: 10,
    timeLabel: '10 AM',
    phase: 'morning',
    phaseLabel: 'Morning',
    template: 'Your followers are online, {name}. Show up.',
  },
  11: {
    hour: 11,
    timeLabel: '11 AM',
    phase: 'morning',
    phaseLabel: 'Morning',
    template: 'Great brands are built on mornings like this, {name}.',
  },

  // ─── Afternoon (12 PM - 4 PM) ───────────────────────────────────
  12: {
    hour: 12,
    timeLabel: '12 PM',
    phase: 'afternoon',
    phaseLabel: 'Afternoon',
    template: 'Midday momentum, {name}. Keep it going.',
  },
  13: {
    hour: 13,
    timeLabel: '1 PM',
    phase: 'afternoon',
    phaseLabel: 'Afternoon',
    template: 'Peak attention hour, {name}. Make it matter.',
  },
  14: {
    hour: 14,
    timeLabel: '2 PM',
    phase: 'afternoon',
    phaseLabel: 'Afternoon',
    template: 'Stay sharp, {name}. Your content is working.',
  },
  15: {
    hour: 15,
    timeLabel: '3 PM',
    phase: 'afternoon',
    phaseLabel: 'Afternoon',
    template: 'Your numbers are telling a story, {name}.',
  },
  16: {
    hour: 16,
    timeLabel: '4 PM',
    phase: 'afternoon',
    phaseLabel: 'Afternoon',
    template: 'Plan tomorrow’s wins today, {name}.',
  },

  // ─── Evening (5 PM - 8 PM) ──────────────────────────────────────
  17: {
    hour: 17,
    timeLabel: '5 PM',
    phase: 'evening',
    phaseLabel: 'Evening',
    template: 'Finish strong, {name}.',
  },
  18: {
    hour: 18,
    timeLabel: '6 PM',
    phase: 'evening',
    phaseLabel: 'Evening',
    template: 'Golden hour for engagement, {name}.',
  },
  19: {
    hour: 19,
    timeLabel: '7 PM',
    phase: 'evening',
    phaseLabel: 'Evening',
    template: 'Prime time, {name}. This is when it counts.',
  },
  20: {
    hour: 20,
    timeLabel: '8 PM',
    phase: 'evening',
    phaseLabel: 'Evening',
    template: 'Your audience is listening, {name}. Say something worth hearing.',
  },

  // ─── Night (9 PM - 11 PM) ───────────────────────────────────────
  21: {
    hour: 21,
    timeLabel: '9 PM',
    phase: 'night',
    phaseLabel: 'Night',
    template: 'One more strategic move, {name}?',
  },
  22: {
    hour: 22,
    timeLabel: '10 PM',
    phase: 'night',
    phaseLabel: 'Night',
    template: 'Queue set, mind clear. Well done, {name}.',
  },
  23: {
    hour: 23,
    timeLabel: '11 PM',
    phase: 'night',
    phaseLabel: 'Night',
    template: 'A day of real work behind you, {name}. Rest well.',
  },
};

export interface FormattedHourlyGreeting {
  headline: string;
  timeLabel: string;
  phase: GreetingPhase;
  phaseLabel: string;
  cleanName: string;
  parts: {
    prefix: string;
    name: string;
    suffix: string;
  };
}

/**
 * Returns formatted greeting details for a given 24-hour hour (0 - 23) and user name.
 */
export function formatHourlyGreeting(hour: number, name?: string | null): FormattedHourlyGreeting {
  const safeHour = Math.min(23, Math.max(0, Math.floor(hour)));
  const config = HOURLY_GREETINGS[safeHour] ?? HOURLY_GREETINGS[0];

  const cleanName = name && name.trim().length > 0 ? name.trim() : 'there';
  const headline = config.template.replace('{name}', cleanName);

  // Split template by {name} for rich JSX rendering (e.g. styling the user's name)
  const [prefix = '', suffix = ''] = config.template.split('{name}');

  return {
    headline,
    timeLabel: config.timeLabel,
    phase: config.phase,
    phaseLabel: config.phaseLabel,
    cleanName,
    parts: {
      prefix,
      name: cleanName,
      suffix,
    },
  };
}

/**
 * Returns formatted greeting based on a Date object (defaults to current client time).
 */
export function getHourlyGreetingForDate(date: Date = new Date(), name?: string | null): FormattedHourlyGreeting {
  return formatHourlyGreeting(date.getHours(), name);
}
