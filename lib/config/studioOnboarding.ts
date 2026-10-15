/**
 * Studio Onboarding Questions Configuration
 * Single source of truth for the 6-question Studio profile flow.
 *
 * Config shape per requirement:
 * { key, title, options: string[] | (answers) => string[], multiSelect, allowOther, required }
 */

export interface StudioQuestionConfig {
  key: 'role' | 'doing' | 'audience' | 'tone' | 'style' | 'interests';
  title: string | ((answers: Record<string, any>) => string);
  options: string[] | ((answers: Record<string, any>) => string[]);
  multiSelect?: boolean;
  allowOther?: boolean;
  required?: boolean;
}

export interface StudioProfile {
  role: string;
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
    options: [
      'Student',
      'Founder',
      'Creator',
      'Influencer',
      'Software engineer',
      'Company / Brand',
    ],
    multiSelect: false,
    allowOther: true,
    required: true,
  },
  {
    key: 'doing',
    title: (answers: Record<string, any>) => {
      const role = answers?.role;
      if (role && DOING_BY_ROLE[role]) {
        return DOING_BY_ROLE[role].title;
      }
      return 'What is your primary focus or project?';
    },
    options: (answers: Record<string, any>) => {
      const role = answers?.role;
      if (role && DOING_BY_ROLE[role]) {
        return DOING_BY_ROLE[role].options;
      }
      return [];
    },
    multiSelect: false,
    allowOther: true,
    required: true,
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

  const stringFields = ['role', 'doing', 'audience', 'tone', 'style'] as const;
  for (const field of stringFields) {
    const val = data[field];
    if (typeof val !== 'string' || !val.trim()) {
      return { valid: false, error: `Field '${field}' is required and must be a non-empty string` };
    }
    if (val.trim().length > 80) {
      return { valid: false, error: `Field '${field}' exceeds maximum length of 80 characters` };
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
