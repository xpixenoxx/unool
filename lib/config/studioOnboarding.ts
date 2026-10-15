/**
 * Studio Onboarding Questions Configuration
 * Single source of truth for the 7-step Studio profile flow.
 *
 * Config shape:
 * { key, title, options: string[] | (answers) => string[], multiSelect, allowOther, required, isCustomStep }
 */

export interface StudioQuestionConfig {
  key: 'role' | 'businessStage' | 'businessDomain' | 'doing' | 'audience' | 'tone' | 'style' | 'interests';
  title: string | ((answers: Record<string, any>) => string);
  options: readonly string[] | string[] | ((answers: Record<string, any>) => string[]);
  multiSelect?: boolean;
  allowOther?: boolean;
  required?: boolean;
  isCustomStep?: boolean;
}

export interface StudioProfile {
  role: string;
  businessStage?: string;
  businessDomain?: string;
  workInterests?: string;
  doing: string;
  audience: string;
  tone: string;
  style: string;
  interests: string[];
  completedAt?: string;
}

export const ROLE_OPTIONS = [
  'Student',
  'Founder',
  'Creator',
  'Influencer',
  'Software engineer',
  'Company / Brand',
] as const;

export const BUSINESS_STAGE_OPTIONS = [
  'Just an idea',
  'Early stage / startup',
  'Growing',
  'Settled',
  'Expert / established',
] as const;

export const BUSINESS_DOMAIN_OPTIONS = [
  'Software/AI',
  'Food & dairy',
  'Fashion & beauty',
  'Education',
  'Health & fitness',
  'Agency/services',
  'Finance',
  'Creator/media',
] as const;

export const DOING_BY_ROLE: Record<string, { title: string; options: string[] }> = {
  Student: {
    title: 'What are you studying or grinding on?',
    options: [
      'Technical / engineering',
      'Medicine',
      'Commerce & finance',
      'Arts & design',
      'Exam prep',
      'Job hunting',
    ],
  },
  Founder: {
    title: 'What does your business actually do?',
    options: [
      'Tech startup',
      'Local food / dairy business',
      'D2C brand',
      'Agency / services',
      'Education business',
      'Just getting started',
    ],
  },
  Creator: {
    title: 'What kind of content is your thing?',
    options: ['Horror', 'Beauty', 'Studies', 'Comedy', 'Travel', 'Gaming'],
  },
  Influencer: {
    title: 'What do people follow you for?',
    options: ['Fashion', 'Fitness', 'Lifestyle', 'Food', 'Travel', 'Tech reviews'],
  },
  'Software engineer': {
    title: 'What do you build all day?',
    options: ['Frontend', 'Backend', 'AI / ML', 'Mobile', 'DevOps', 'Open source'],
  },
  'Company / Brand': {
    title: 'What does your company do?',
    options: ['B2B SaaS', 'Retail', 'Agency', 'Nonprofit', 'Manufacturing', 'Hospitality'],
  },
};

export const STUDIO_ONBOARDING_QUESTIONS: StudioQuestionConfig[] = [
  {
    key: 'role',
    title: "Let's meet. Which hat do you wear most days?",
    options: [...ROLE_OPTIONS],
    multiSelect: false,
    allowOther: true,
    required: true,
  },
  {
    key: 'businessStage',
    title: 'Where is your business right now?',
    options: [...BUSINESS_STAGE_OPTIONS],
    multiSelect: false,
    allowOther: true,
    required: true,
  },
  {
    key: 'businessDomain',
    title: 'What does your business actually do?',
    options: [...BUSINESS_DOMAIN_OPTIONS],
    multiSelect: false,
    allowOther: true,
    required: true,
    isCustomStep: true,
  },
  {
    key: 'audience',
    title: 'Who are you hoping to catch the attention of?',
    options: [
      'Recruiters & hiring managers',
      'Fellow students',
      'Customers',
      'Investors',
      'Followers in my niche',
      'Other founders',
      'My local community',
    ],
    multiSelect: false,
    allowOther: true,
    required: true,
  },
  {
    key: 'tone',
    title: 'If your posts had a voice, what would it sound like?',
    options: [
      'Soft & smooth',
      'Rebel',
      'Witty',
      'Calm expert',
      'Storyteller',
      'Straight-talker',
    ],
    multiSelect: false,
    allowOther: true,
    required: true,
  },
  {
    key: 'style',
    title: 'How should your posts feel to read?',
    options: [
      'Short & punchy',
      'Storytelling',
      'Educational',
      'Bold opinions',
      'Behind-the-scenes',
      'Funny & light',
    ],
    multiSelect: false,
    allowOther: true,
    required: true,
  },
  {
    key: 'interests',
    title: 'Last one: what do you love outside work? Pick any.',
    options: [
      'Politics',
      'Dancing',
      'Singing',
      'Cricket',
      'Movies & series',
      'Travel',
      'Food',
      'Fitness',
      'Gaming',
      'Books',
      'Music',
      'Photography',
      'Gadgets',
      'Fashion',
      'Spirituality',
      'Comedy',
    ],
    multiSelect: true,
    allowOther: true,
    required: true,
  },
];

/**
 * Validates a StudioProfile object server-side or client-side.
 * Returns null if valid, or an error string if invalid.
 */
export function validateStudioProfile(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Profile data must be an object' };
  }

  const baseStringFields = ['role', 'audience', 'tone', 'style'] as const;
  for (const field of baseStringFields) {
    const val = data[field];
    if (typeof val !== 'string' || !val.trim()) {
      return { valid: false, error: `Field '${field}' is required and must be a non-empty string` };
    }
    if (val.trim().length > 80) {
      return { valid: false, error: `Field '${field}' exceeds maximum length of 80 characters` };
    }
  }

  // Either businessDomain or doing must be present
  const domainOrDoing = data.businessDomain || data.doing;
  if (typeof domainOrDoing !== 'string' || !domainOrDoing.trim()) {
    return { valid: false, error: "Field 'businessDomain' or 'doing' is required and must be a non-empty string" };
  }
  if (domainOrDoing.trim().length > 80) {
    return { valid: false, error: "Field 'businessDomain' exceeds maximum length of 80 characters" };
  }

  if (data.businessStage !== undefined && data.businessStage !== null) {
    if (typeof data.businessStage !== 'string') {
      return { valid: false, error: "Field 'businessStage' must be a string" };
    }
    if (data.businessStage.trim().length > 80) {
      return { valid: false, error: "Field 'businessStage' exceeds maximum length of 80 characters" };
    }
  }

  if (data.workInterests !== undefined && data.workInterests !== null) {
    if (typeof data.workInterests !== 'string') {
      return { valid: false, error: "Field 'workInterests' must be a string" };
    }
    if (data.workInterests.trim().length > 120) {
      return { valid: false, error: "Field 'workInterests' exceeds maximum length of 120 characters" };
    }
  }

  if (!Array.isArray(data.interests)) {
    return { valid: false, error: "Field 'interests' must be an array" };
  }

  if (data.interests.length === 0) {
    return { valid: false, error: 'At least one interest must be selected' };
  }

  for (const item of data.interests) {
    if (typeof item !== 'string' || !item.trim()) {
      return { valid: false, error: 'All interests must be non-empty strings' };
    }
    if (item.trim().length > 80) {
      return { valid: false, error: 'Interest item exceeds maximum length of 80 characters' };
    }
  }

  return { valid: true };
}
