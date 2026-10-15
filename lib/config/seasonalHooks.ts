/**
 * Seasonal Moments and Cultural Hooks Configuration
 * 
 * Provides timely cultural, professional, and seasonal hooks for Indian and global creators
 * without calling external news/trends APIs.
 */

export interface SeasonalMoment {
  id: string;
  name: string;
  description: string;
  /** Month index: 1 = Jan, 12 = Dec */
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
  /** Optional specific year (e.g., 2026 for specific Diwali date) */
  year?: number;
}

export const SEASONAL_MOMENTS: SeasonalMoment[] = [
  // Diwali 2026 (Nov 8, 2026 - festive shopping starts late Oct through mid-Nov)
  {
    id: 'diwali-2026',
    name: 'Diwali and festive shopping season',
    description: 'Diwali festive preparations, gift giving, festive sales, family homecoming, and celebration of light over darkness',
    startMonth: 10,
    startDay: 20,
    endMonth: 11,
    endDay: 15,
    year: 2026,
  },
  // Year-end recap / 2026 in review
  {
    id: 'year-end-recap',
    name: 'Year-end recap and 2026 in review',
    description: 'Reflections on big wins, lessons learned, unfurnished goals, and retrospective breakdowns of 2026',
    startMonth: 11,
    startDay: 15,
    endMonth: 12,
    endDay: 31,
  },
  // 2027 predictions and industry outlook
  {
    id: 'predictions-2027',
    name: 'Predictions for 2027 and future trends',
    description: 'Bold forecasts, emerging AI and tech developments, industry shifts, and what to expect in 2027',
    startMonth: 12,
    startDay: 10,
    endMonth: 1,
    endDay: 31,
  },
  // New Year resolutions and habit resets
  {
    id: 'new-year-resolutions',
    name: 'New Year resolutions and fresh starts',
    description: 'Starting clean slates, realistic habit building, ditching toxic routines, and January discipline',
    startMonth: 12,
    startDay: 25,
    endMonth: 1,
    endDay: 25,
  },
  // Republic Day & civic pride
  {
    id: 'republic-day',
    name: 'Republic Day and nation-building pride',
    description: 'Reflections on Indian progress, self-reliance, unity, and winter holidays',
    startMonth: 1,
    startDay: 15,
    endMonth: 1,
    endDay: 30,
  },
  // Union Budget & Financial Planning
  {
    id: 'budget-season',
    name: 'Union Budget and financial planning',
    description: 'Budget reactions, personal finance, tax-saving rush, and economic sentiment',
    startMonth: 1,
    startDay: 25,
    endMonth: 2,
    endDay: 20,
  },
  // Board exams & college competitive finals (Spring)
  {
    id: 'spring-exams',
    name: 'Exam season and board preparation stress',
    description: 'Handling exam pressure, study routines, mentoring younger students, and managing high expectations',
    startMonth: 2,
    startDay: 15,
    endMonth: 4,
    endDay: 10,
  },
  // Appraisal season & salary reviews
  {
    id: 'appraisal-season',
    name: 'Annual appraisal season and career growth',
    description: 'Performance reviews, negotiating raises, manager conversations, and career progression reality checks',
    startMonth: 3,
    startDay: 1,
    endMonth: 4,
    endDay: 30,
  },
  // Summer internship & campus hiring (Spring cycle)
  {
    id: 'spring-internships',
    name: 'Summer internship hunt and early-career launch',
    description: 'Cold messaging founders, internship search, portfolio reviews, and learning on the job',
    startMonth: 4,
    startDay: 1,
    endMonth: 6,
    endDay: 15,
  },
  // Back to college & freshers season
  {
    id: 'college-freshers',
    name: 'College freshers and back-to-campus season',
    description: 'Moving to a new city, hostel life, campus clubs, first adult responsibilities, and fresh beginnings',
    startMonth: 7,
    startDay: 1,
    endMonth: 8,
    endDay: 20,
  },
  // Independence Day & Raksha Bandhan
  {
    id: 'independence-rakhi',
    name: 'Independence Day and Raksha Bandhan celebrations',
    description: 'Patriotism, sibling banter, monsoon vibes, and mid-year reflections',
    startMonth: 8,
    startDay: 1,
    endMonth: 8,
    endDay: 25,
  },
  // Campus placement and recruitment season (Fall cycle)
  {
    id: 'fall-placements',
    name: 'Campus placement drives and internship recruitment',
    description: 'On-campus placement season, resume screening, coding rounds, interview jitters, and first job offers',
    startMonth: 8,
    startDay: 15,
    endMonth: 11,
    endDay: 10,
  },
  // Fall semester exams
  {
    id: 'fall-exams',
    name: 'Semester finals and project submission deadlines',
    description: 'Final year projects, semester exams, sleepless submission nights, and academic crunch time',
    startMonth: 11,
    startDay: 10,
    endMonth: 12,
    endDay: 15,
  },
];

/**
 * Checks if a specific day-of-year falls within a range, handling year wrap-around (e.g. Dec to Jan).
 */
function isDayInRange(
  targetMonth: number,
  targetDay: number,
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number
): boolean {
  // Convert month/day to approximate day of year (0 to 365)
  const toDayOfYear = (m: number, d: number) => (m - 1) * 31 + d;
  const target = toDayOfYear(targetMonth, targetDay);
  const start = toDayOfYear(startMonth, startDay);
  const end = toDayOfYear(endMonth, endDay);

  if (start <= end) {
    return target >= start && target <= end;
  }
  // Wraps around year-end (e.g., Dec 10 to Jan 31)
  return target >= start || target <= end;
}

/**
 * Returns upcoming relevant moments for the next ~30 days from the given reference date.
 */
export function seasonalHooks(referenceDate: Date = new Date()): string[] {
  const current = new Date(referenceDate);
  const refYear = current.getFullYear();
  const matchedMoments = new Set<string>();

  // Check every day in the 30-day window
  for (let offset = 0; offset <= 30; offset++) {
    const checkDate = new Date(current);
    checkDate.setDate(current.getDate() + offset);

    const m = checkDate.getMonth() + 1; // 1-12
    const d = checkDate.getDate();
    const y = checkDate.getFullYear();

    for (const moment of SEASONAL_MOMENTS) {
      if (moment.year && moment.year !== y) {
        continue;
      }
      if (isDayInRange(m, d, moment.startMonth, moment.startDay, moment.endMonth, moment.endDay)) {
        matchedMoments.add(moment.name);
      }
    }
  }

  const results = Array.from(matchedMoments);

  // If no moments matched (unlikely), provide fallback general timely themes
  if (results.length === 0) {
    return [
      'Mid-quarter career milestones and learning reflections',
      'Weekend productivity resets and side projects',
      'Everyday work routines and overcoming small struggles',
    ];
  }

  return results;
}

/**
 * Formats hooks array into a clean prompt string.
 */
export function formatSeasonalHooks(hooks: string[]): string {
  if (!hooks || hooks.length === 0) {
    return 'None specified';
  }
  return hooks.join(', ');
}
