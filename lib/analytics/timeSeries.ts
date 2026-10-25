/**
 * Analytics time-series utility functions
 */

export interface TimestampRow {
  created_at?: string | null;
  published_at?: string | null;
}

/**
 * Builds a chronological array of counts for each of the last N days (UTC-aligned).
 * 
 * @param rows Array of rows containing created_at or published_at ISO timestamp strings
 * @param now Reference date (defaults to new Date())
 * @param days Number of days to include in the series (default: 30)
 * @returns Array of N numbers representing daily counts from oldest to today
 */
export function buildDailySeries(
  rows: TimestampRow[] = [],
  now: Date = new Date(),
  days: number = 30
): number[] {
  const buckets: Record<string, number> = {};
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(todayUTC);
    d.setUTCDate(d.getUTCDate() - i);
    buckets[d.toISOString().slice(0, 10)] = 0;
  }

  for (const row of rows) {
    const ts = row.published_at || row.created_at;
    if (!ts) continue;
    const day = ts.slice(0, 10);
    if (buckets[day] !== undefined) {
      buckets[day]++;
    }
  }

  return Object.values(buckets);
}

/**
 * Calculates percentage change between two values (e.g., week-over-week).
 * 
 * @param current Current period count
 * @param previous Previous period count
 * @returns Signed percentage integer (+/-)
 */
export function calcPercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
