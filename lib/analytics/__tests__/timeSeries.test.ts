import { describe, it, expect } from 'vitest';
import { buildDailySeries, calcPercentageChange } from '../timeSeries';

describe('buildDailySeries', () => {
  it('generates an array of exactly 30 days by default', () => {
    const series = buildDailySeries([], new Date('2026-10-25T12:00:00Z'));
    expect(series).toHaveLength(30);
    expect(series.every((val) => val === 0)).toBe(true);
  });

  it('correctly maps created_at timestamps into the proper day buckets', () => {
    const now = new Date('2026-10-25T14:00:00Z');
    const rows = [
      { created_at: '2026-10-25T01:00:00Z' },
      { created_at: '2026-10-25T08:30:00Z' },
      { created_at: '2026-10-24T23:59:59Z' }, // yesterday
      { created_at: '2026-09-26T00:00:00Z' }, // oldest in 30-day window
      { created_at: '2026-09-20T00:00:00Z' }, // out of range (older than 30 days)
    ];

    const series = buildDailySeries(rows, now, 30);
    expect(series).toHaveLength(30);
    // Today is the last element
    expect(series[29]).toBe(2);
    // Yesterday is index 28
    expect(series[28]).toBe(1);
    // 29 days ago (2026-09-26, oldest in 30-day window) is index 0
    expect(series[0]).toBe(1);
    // Out of range should not be counted
    const total = series.reduce((sum, n) => sum + n, 0);
    expect(total).toBe(4);
  });

  it('prefers published_at if present over created_at for published posts', () => {
    const now = new Date('2026-10-25T14:00:00Z');
    const rows = [
      {
        created_at: '2026-10-01T10:00:00Z',
        published_at: '2026-10-25T11:00:00Z',
      },
    ];

    const series = buildDailySeries(rows, now, 30);
    expect(series[29]).toBe(1);
  });
});

describe('calcPercentageChange', () => {
  it('handles standard positive and negative week-over-week changes', () => {
    expect(calcPercentageChange(15, 10)).toBe(50);
    expect(calcPercentageChange(5, 10)).toBe(-50);
  });

  it('handles zero previous gracefully', () => {
    expect(calcPercentageChange(10, 0)).toBe(100);
    expect(calcPercentageChange(0, 0)).toBe(0);
  });

  it('handles zero current with positive previous', () => {
    expect(calcPercentageChange(0, 10)).toBe(-100);
  });

  it('accurately extracts the last 7 days of impressions from a 30-day series', () => {
    const now = new Date('2026-10-25T14:00:00Z');
    // Generate 1 impression for each of the last 10 days
    const rows = [];
    for (let d = 0; d < 10; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      rows.push({ created_at: date.toISOString() });
    }

    const series = buildDailySeries(rows, now, 30);
    // Indices 23..29 represent the last 7 calendar days
    const last7DaysTotal = series.slice(23).reduce((sum, n) => sum + n, 0);
    expect(last7DaysTotal).toBe(7);
  });
});

