import { describe, it, expect } from 'vitest';
import {
  STUDIO_ONBOARDING_QUESTIONS,
  DOING_BY_ROLE,
  validateStudioProfile,
} from '../studioOnboarding';

describe('Studio Onboarding Config & Cascading Logic', () => {
  it('should define exactly 7 ordered questions', () => {
    expect(STUDIO_ONBOARDING_QUESTIONS).toHaveLength(7);
    const keys = STUDIO_ONBOARDING_QUESTIONS.map((q) => q.key);
    expect(keys).toEqual([
      'role',
      'businessStage',
      'businessDomain',
      'audience',
      'tone',
      'style',
      'interests',
    ]);
  });

  it('should configure question 2 (businessStage) with dynamic stage options', () => {
    const stageQuestion = STUDIO_ONBOARDING_QUESTIONS[1];
    expect(stageQuestion.key).toBe('businessStage');
    const founderTitle = typeof stageQuestion.title === 'function' ? stageQuestion.title({ role: 'Founder' }) : stageQuestion.title;
    const founderOptions = typeof stageQuestion.options === 'function' ? stageQuestion.options({ role: 'Founder' }) : stageQuestion.options;
    expect(founderTitle).toBe('Where is your business right now?');
    expect(founderOptions).toEqual([
      'Just an idea',
      'Early stage / startup',
      'Growing',
      'Settled',
      'Expert / established',
    ]);
    expect(stageQuestion.allowOther).toBe(true);
    expect(stageQuestion.multiSelect).toBe(false);
  });

  it('should configure question 3 (businessDomain) with dynamic quick-pick chips', () => {
    const domainQuestion = STUDIO_ONBOARDING_QUESTIONS[2];
    expect(domainQuestion.key).toBe('businessDomain');
    const founderTitle = typeof domainQuestion.title === 'function' ? domainQuestion.title({ role: 'Founder' }) : domainQuestion.title;
    const founderOptions = typeof domainQuestion.options === 'function' ? domainQuestion.options({ role: 'Founder' }) : domainQuestion.options;
    expect(founderTitle).toBe('What does your business actually do?');
    expect(founderOptions).toEqual([
      'Software/AI',
      'Food & dairy',
      'Fashion & beauty',
      'Education',
      'Health & fitness',
      'Agency/services',
      'Finance',
      'Creator/media',
    ]);
    expect(domainQuestion.isCustomStep).toBe(true);
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

  it('validates profile with businessStage, businessDomain, and workInterests', () => {
    const stageProfile = {
      role: 'Founder',
      businessStage: 'Growing',
      businessDomain: 'Software/AI',
      workInterests: 'Scaling teams and distributed databases',
      audience: 'Engineers',
      tone: 'Straight-talker',
      style: 'Short & punchy',
      interests: ['Books', 'Gaming'],
    };
    const res = validateStudioProfile(stageProfile);
    expect(res.valid).toBe(true);
  });

  it('rejects businessStage or workInterests exceeding character limits', () => {
    const invalidStage = {
      ...validProfile,
      businessStage: 'A'.repeat(81),
    };
    expect(validateStudioProfile(invalidStage).valid).toBe(false);

    const invalidWorkInterests = {
      ...validProfile,
      workInterests: 'B'.repeat(121),
    };
    expect(validateStudioProfile(invalidWorkInterests).valid).toBe(false);
  });
});
