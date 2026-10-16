import { describe, it, expect } from 'vitest';
import { seasonalHooks, formatSeasonalHooks } from '../seasonalHooks';

describe('seasonalHooks', () => {
  it('returns Diwali and placements for mid-October 2026', () => {
    const octDate = new Date(2026, 9, 15); // Month is 0-indexed: 9 = October
    const hooks = seasonalHooks(octDate);
    expect(hooks.some((h) => h.includes('Diwali'))).toBe(true);
    expect(hooks.some((h) => h.includes('placement'))).toBe(true);
  });

  it('returns Year-end recap, 2027 predictions, and resolutions for late December 2026', () => {
    const decDate = new Date(2026, 11, 20); // 11 = December
    const hooks = seasonalHooks(decDate);
    expect(hooks.some((h) => h.includes('Year-end recap'))).toBe(true);
    expect(hooks.some((h) => h.includes('Predictions for 2027'))).toBe(true);
    expect(hooks.some((h) => h.includes('New Year resolutions'))).toBe(true);
  });

  it('returns Republic Day, predictions, and budget season for mid-January 2027', () => {
    const janDate = new Date(2027, 0, 15); // 0 = January
    const hooks = seasonalHooks(janDate);
    expect(hooks.some((h) => h.includes('Republic Day'))).toBe(true);
    expect(hooks.some((h) => h.includes('Budget'))).toBe(true);
  });

  it('returns Appraisal season and exams for March 2027', () => {
    const marchDate = new Date(2027, 2, 10); // 2 = March
    const hooks = seasonalHooks(marchDate);
    expect(hooks.some((h) => h.includes('appraisal'))).toBe(true);
    expect(hooks.some((h) => h.includes('Exam season'))).toBe(true);
  });

  it('formats seasonal hooks cleanly for LLM prompt', () => {
    const formatted = formatSeasonalHooks(['Diwali celebration', 'New Year reset']);
    expect(formatted).toBe('Diwali celebration, New Year reset');
    expect(formatSeasonalHooks([])).toBe('None specified');
  });
});
