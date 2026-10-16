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

export interface RoleBranchConfig {
  stageTitle: string;
  stageOptions: string[];
  domainTitle: string;
  domainChips: string[];
  domainLabel: string;
  domainPlaceholder: string;
  workInterestsLabel: string;
  workInterestsPlaceholder: string;
  audienceTitle: string;
  audienceOptions: string[];
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

export const ROLE_BRANCH_CONFIGS: Record<string, RoleBranchConfig> = {
  Student: {
    stageTitle: 'Where are you in your studies right now?',
    stageOptions: [
      'Undergrad / College student',
      'Postgrad / Masters student',
      'High school student',
      'Bootcamp / Self-learning',
      'PhD / Academic researcher',
      'Recent graduate / Job hunting',
    ],
    domainTitle: 'What is your main stream or field of study?',
    domainChips: [
      'Computer Science / AI',
      'Engineering (Mech/Civil/EE)',
      'Medicine & Healthcare',
      'Commerce & Finance',
      'Arts, Design & Media',
      'Business & Management',
      'Law & Public Policy',
      'Pure Sciences & Research',
    ],
    domainLabel: 'Your major, stream, or subjects',
    domainPlaceholder: 'e.g. CS with a focus on machine learning, Pre-med biology...',
    workInterestsLabel: 'What topics or projects do you love talking about?',
    workInterestsPlaceholder: 'e.g. Hackathons, building side apps, study routines, campus life, tech trends...',
    audienceTitle: 'Who are you hoping to connect with or learn alongside?',
    audienceOptions: [
      'Recruiters & hiring managers',
      'Fellow students & study community',
      'Tech founders & mentors',
      'Industry professionals & alumni',
      'Followers curious about my journey',
      'My campus & local community',
    ],
  },
  Founder: {
    stageTitle: 'Where is your business right now?',
    stageOptions: [
      'Just an idea',
      'Early stage / startup',
      'Growing',
      'Settled',
      'Expert / established',
    ],
    domainTitle: 'What does your business actually do?',
    domainChips: [
      'Software/AI',
      'Food & dairy',
      'Fashion & beauty',
      'Education',
      'Health & fitness',
      'Agency/services',
      'Finance',
      'Creator/media',
    ],
    domainLabel: 'What your business does',
    domainPlaceholder: 'e.g. AI-powered analytics for creators, Boutique apparel brand, Specialty dairy...',
    workInterestsLabel: 'What do you love talking about in your work?',
    workInterestsPlaceholder: 'e.g. Founder lessons, hiring, product launches, customer stories, bootstrapping...',
    audienceTitle: 'Who are you hoping to catch the attention of?',
    audienceOptions: [
      'Customers & buyers',
      'Investors & angels',
      'Other founders & peers',
      'Top talent & future hires',
      'Industry press & analysts',
      'Followers in my niche',
    ],
  },
  Creator: {
    stageTitle: 'Where are you in your creator journey?',
    stageOptions: [
      'Just starting out (< 1k)',
      'Building momentum (1k - 10k)',
      'Consistent creator (10k - 50k)',
      'Full-time creator (50k+)',
      'Multi-platform media brand',
    ],
    domainTitle: 'What kind of content do you create?',
    domainChips: [
      'Tech & AI reviews',
      'Comedy & Skits',
      'Education & Tutorials',
      'Gaming & Streaming',
      'Finance & Investing',
      'Health & Fitness',
      'Design & Creative Art',
      'Travel & Culture',
    ],
    domainLabel: 'Your primary content niche',
    domainPlaceholder: 'e.g. Weekly tech deep dives, short comedy sketches, fitness transformations...',
    workInterestsLabel: 'What do you love talking about in your work?',
    workInterestsPlaceholder: 'e.g. Behind the scenes, storytelling, equipment, brand deals, creative burnout...',
    audienceTitle: 'Who are you creating content for?',
    audienceOptions: [
      'Passionate fans in my niche',
      'Brand sponsors & partners',
      'Other creators & collaborators',
      'Everyday people looking for value/fun',
      'Aspiring creators who want to learn',
    ],
  },
  Influencer: {
    stageTitle: 'Where is your audience right now?',
    stageOptions: [
      'Nano influencer (< 10k)',
      'Micro influencer (10k - 50k)',
      'Mid-tier influencer (50k - 250k)',
      'Macro influencer (250k+)',
      'Building brand partnerships & products',
    ],
    domainTitle: 'What do people primarily follow you for?',
    domainChips: [
      'Fashion & Styling',
      'Fitness & Wellness',
      'Lifestyle & Daily Vlogs',
      'Beauty & Skincare',
      'Food & Dining',
      'Travel & Luxury',
      'Tech & Everyday Gear',
      'Mindset & Motivation',
    ],
    domainLabel: 'Your core aesthetic or topic',
    domainPlaceholder: 'e.g. Streetwear lookbooks, high-energy gym motivation, luxury solo travel...',
    workInterestsLabel: 'What do you love talking about with your followers?',
    workInterestsPlaceholder: 'e.g. Daily routines, honest brand reviews, mindset, personal stories, favorites...',
    audienceTitle: 'Who is your core audience?',
    audienceOptions: [
      'Highly engaged followers & community',
      'Brand partners & PR agencies',
      'Lifestyle enthusiasts',
      'People seeking inspiration & recommendations',
      'Fellow influencers & creators',
    ],
  },
  'Software engineer': {
    stageTitle: 'Where are you in your engineering career?',
    stageOptions: [
      'Junior / Early career (< 2 yrs)',
      'Mid-level engineer',
      'Senior / Staff engineer',
      'Tech lead / Architect',
      'Engineering manager / Director',
      'Indie hacker / Open sourcerer',
    ],
    domainTitle: 'What do you build or specialize in?',
    domainChips: [
      'AI & Machine Learning',
      'Fullstack & Web Dev',
      'Backend & Distributed Systems',
      'Mobile Apps (iOS/Android)',
      'Cloud & DevOps',
      'Data & Analytics Engineering',
      'Security & Systems',
      'Open Source Developer Tools',
    ],
    domainLabel: 'Your core tech stack or projects',
    domainPlaceholder: 'e.g. TypeScript/React, Rust microservices, PyTorch LLM fine-tuning...',
    workInterestsLabel: 'What do you love discussing about code?',
    workInterestsPlaceholder: 'e.g. Architecture trade-offs, debugging war stories, dev tooling, clean code...',
    audienceTitle: 'Who do you want to reach with your posts?',
    audienceOptions: [
      'Tech recruiters & hiring managers',
      'Other engineers & developers',
      'Founders looking for technical talent',
      'Open source contributors',
      'Junior developers seeking guidance',
      'Tech enthusiasts & builders',
    ],
  },
  'Company / Brand': {
    stageTitle: 'Where is your company right now?',
    stageOptions: [
      'Seed / Pre-revenue',
      'Early growth (1-10 team)',
      'Scaling (10-50 team)',
      'Established SME (50+ team)',
      'Enterprise / Industry leader',
    ],
    domainTitle: 'What does your company actually do?',
    domainChips: [
      'B2B SaaS',
      'E-commerce & D2C',
      'Agency & Professional Services',
      'Consumer Tech & Apps',
      'Healthcare & Biotech',
      'Financial Services & Fintech',
      'Education & Training',
      'Manufacturing & Industrial',
    ],
    domainLabel: "Your company's product or service",
    domainPlaceholder: 'e.g. AI-powered customer support platform, Sustainable everyday clothing...',
    workInterestsLabel: 'What themes does your brand love publishing about?',
    workInterestsPlaceholder: 'e.g. Industry trends, customer success stories, company culture, product updates...',
    audienceTitle: 'Who is your primary brand audience?',
    audienceOptions: [
      'Prospective B2B clients & decision-makers',
      'Direct consumers & shoppers',
      'Industry peers & partners',
      'Investors & stakeholders',
      'Talent looking to join our team',
    ],
  },
};

export const DEFAULT_ROLE_BRANCH_CONFIG: RoleBranchConfig = {
  stageTitle: 'Where are you in your journey right now?',
  stageOptions: [
    'Just starting out',
    'Early stage / building',
    'Growing & active',
    'Settled & consistent',
    'Expert / established',
  ],
  domainTitle: 'What do you primarily do or specialize in?',
  domainChips: [
    'Tech & Software',
    'Creative & Media',
    'Services & Consulting',
    'Commerce & Sales',
    'Education & Coaching',
    'Health & Wellness',
    'Community & Non-profit',
    'Finance & Real Estate',
  ],
  domainLabel: 'What you specialize in or do',
  domainPlaceholder: 'e.g. Independent consultancy, Creative agency, Local specialty service...',
  workInterestsLabel: 'What do you love talking about in your work?',
  workInterestsPlaceholder: 'e.g. Case studies, industry lessons, favorite tools, behind the scenes...',
  audienceTitle: 'Who are you hoping to catch the attention of?',
  audienceOptions: [
    'Clients & customers',
    'Peers & community members',
    'Industry leaders & mentors',
    'Followers interested in my field',
    'My local network',
  ],
};

export function getRoleConfig(role?: string): RoleBranchConfig {
  if (!role) return DEFAULT_ROLE_BRANCH_CONFIG;
  const normalized = role.trim().toLowerCase();
  const match = Object.keys(ROLE_BRANCH_CONFIGS).find(
    (k) => k.toLowerCase() === normalized
  );
  return match ? ROLE_BRANCH_CONFIGS[match] : DEFAULT_ROLE_BRANCH_CONFIG;
}

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
    title: (answers) => getRoleConfig(answers.role).stageTitle,
    options: (answers) => getRoleConfig(answers.role).stageOptions,
    multiSelect: false,
    allowOther: true,
    required: true,
  },
  {
    key: 'businessDomain',
    title: (answers) => getRoleConfig(answers.role).domainTitle,
    options: (answers) => getRoleConfig(answers.role).domainChips,
    multiSelect: false,
    allowOther: true,
    required: true,
    isCustomStep: true,
  },
  {
    key: 'audience',
    title: (answers) => getRoleConfig(answers.role).audienceTitle,
    options: (answers) => getRoleConfig(answers.role).audienceOptions,
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
