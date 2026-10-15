import { describe, it, expect } from 'vitest';
import {
  STUDIO_ONBOARDING_QUESTIONS,
  DOING_BY_ROLE,
  validateStudioProfile,
} from '../studioOnboarding';

describe('Studio Onboarding Config & Cascading Logic', () => {
  it('should define exactly 6 ordered questions', () => {
    expect(STUDIO_ONBOARDING_QUESTIONS).toHaveLength(6);
    const keys = STUDIO_ONBOARDING_QUESTIONS.map((q) => q.key);
    expect(keys).toEqual(['role', 'doing', 'audience', 'tone', 'style', 'interests']);
  });

  it('should dynamically return cascading options and titles for question 2 (doing)', () => {
    const doingQuestion = STUDIO_ONBOARDING_QUESTIONS[1];
    expect(doingQuestion.key).toBe('doing');

    const titleFn = doingQuestion.title as (answers: Record<string, any>) => string;
    const optionsFn = doingQuestion.options as (answers: Record<string, any>) => string[];

    // 1. Student
    expect(titleFn({ role: 'Student' })).toBe('What are you studying or grinding on?');
    expect(optionsFn({ role: 'Student' })).toEqual(DOING_BY_ROLE['Student'].options);
    expect(optionsFn({ role: 'Student' })).toContain('Technical / engineering');

    // 2. Founder
    expect(titleFn({ role: 'Founder' })).toBe('What does your business actually do?');
    expect(optionsFn({ role: 'Founder' })).toEqual(DOING_BY_ROLE['Founder'].options);
    expect(optionsFn({ role: 'Founder' })).toContain('Tech startup');

    // 3. Creator
    expect(titleFn({ role: 'Creator' })).toBe('What kind of content is your thing?');
    expect(optionsFn({ role: 'Creator' })).toContain('Horror');

    // 4. Influencer
    expect(titleFn({ role: 'Influencer' })).toBe('What do people follow you for?');
    expect(optionsFn({ role: 'Influencer' })).toContain('Fashion');

    // 5. Software engineer
    expect(titleFn({ role: 'Software engineer' })).toBe('What do you build all day?');
    expect(optionsFn({ role: 'Software engineer' })).toContain('Frontend');

    // 6. Company / Brand
    expect(titleFn({ role: 'Company / Brand' })).toBe('What does your company do?');
    expect(optionsFn({ role: 'Company / Brand' })).toContain('B2B SaaS');

    // Fallback for custom / unknown role
    expect(titleFn({ role: 'Independent Consultant' })).toBe('What is your primary focus or project?');
    expect(optionsFn({ role: 'Independent Consultant' })).toEqual([]);
  });

  it('should mark interests as multiSelect and others as single-select', () => {
    for (const q of STUDIO_ONBOARDING_QUESTIONS) {
      if (q.key === 'interests') {
        expect(q.multiSelect).toBe(true);
      } else {
        expect(q.multiSelect).toBe(false);
      }
      expect(q.allowOther).toBe(true);
      expect(q.required).toBe(true);
    }
  });
});

describe('validateStudioProfile Validation Rules', () => {
  const validProfile = {
    role: 'Founder',
    doing: 'Tech startup',
    audience: 'Investors',
    tone: 'Calm expert',
    style: 'Short & punchy',
    interests: ['Cricket', 'Travel'],
    completedAt: new Date().toISOString(),
  };

  it('validates a complete and correct profile', () => {
    const result = validateStudioProfile(validProfile);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rejects non-object or null input', () => {
    expect(validateStudioProfile(null).valid).toBe(false);
    expect(validateStudioProfile(undefined).valid).toBe(false);
    expect(validateStudioProfile('invalid').valid).toBe(false);
  });

  it('rejects missing or empty required string fields', () => {
    expect(validateStudioProfile({ ...validProfile, role: '' }).valid).toBe(false);
    expect(validateStudioProfile({ ...validProfile, doing: '   ' }).valid).toBe(false);
    expect(validateStudioProfile({ ...validProfile, audience: undefined }).valid).toBe(false);
    expect(validateStudioProfile({ ...validProfile, tone: '' }).valid).toBe(false);
    expect(validateStudioProfile({ ...validProfile, style: '' }).valid).toBe(false);
  });

  it('rejects strings that exceed 80 characters', () => {
    const longString = 'A'.repeat(81);
    const result = validateStudioProfile({ ...validProfile, doing: longString });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds maximum length of 80 characters');
  });

  it('rejects invalid interests format or empty interests array', () => {
    expect(validateStudioProfile({ ...validProfile, interests: 'Cricket' }).valid).toBe(false);
    expect(validateStudioProfile({ ...validProfile, interests: [] }).valid).toBe(false);
    expect(validateStudioProfile({ ...validProfile, interests: [''] }).valid).toBe(false);
    expect(validateStudioProfile({ ...validProfile, interests: ['A'.repeat(81)] }).valid).toBe(false);
  });
});
