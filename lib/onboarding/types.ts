export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  category: 'profile' | 'social' | 'content' | 'publish' | 'sync';
  required: boolean;
  xp: number;
  completedAt: string | null;
  metadata: Record<string, unknown>;
}

export interface OnboardingChecklist {
  workspaceId: string;
  userId: string;
  steps: OnboardingStep[];
  totalXp: number;
  earnedXp: number;
  completedAt: string | null;
  currentStep: number;
}

export const ONBOARDING_STEPS: Omit<OnboardingStep, 'completedAt' | 'metadata'>[] = [
  // Profile steps
  {
    id: 'claim_subdomain',
    title: 'Claim your .unool.co subdomain',
    description: 'Choose a unique subdomain for your public profile (e.g., yourname.unool.co)',
    category: 'profile',
    required: true,
    xp: 100,
  },
  {
    id: 'complete_profile',
    title: 'Complete your profile',
    description: 'Add name, headline, bio, role, and company',
    category: 'profile',
    required: true,
    xp: 150,
  },
  {
    id: 'add_proof_points',
    title: 'Add 3+ proof points',
    description: 'Showcase metrics, customers, team size, or funding',
    category: 'profile',
    required: false,
    xp: 100,
  },
  {
    id: 'add_links',
    title: 'Add your important links',
    description: 'Website, LinkedIn, Twitter/X, GitHub, Calendly',
    category: 'profile',
    required: true,
    xp: 50,
  },
  {
    id: 'choose_theme',
    title: 'Choose a theme',
    description: 'Pick from minimal, bold, corporate, creative, or technical',
    category: 'profile',
    required: false,
    xp: 50,
  },

  // Social steps
  {
    id: 'connect_linkedin',
    title: 'Connect LinkedIn',
    description: 'Enable one-click publishing to LinkedIn',
    category: 'social',
    required: false,
    xp: 200,
  },
  {
    id: 'connect_x',
    title: 'Connect X (Twitter)',
    description: 'Enable one-click publishing to X',
    category: 'social',
    required: false,
    xp: 200,
  },
  {
    id: 'connect_threads',
    title: 'Connect Threads',
    description: 'Enable one-click publishing to Threads',
    category: 'social',
    required: false,
    xp: 200,
  },

  // Content steps
  {
    id: 'create_first_post',
    title: 'Create your first post',
    description: 'Write content and let AI adapt it for each platform',
    category: 'content',
    required: true,
    xp: 150,
  },
  {
    id: 'review_adaptations',
    title: 'Review AI adaptations',
    description: 'Check and approve platform-specific versions',
    category: 'content',
    required: true,
    xp: 100,
  },

  // Publish steps
  {
    id: 'publish_first_post',
    title: 'Publish your first post',
    description: 'One click to publish across all connected platforms',
    category: 'publish',
    required: true,
    xp: 300,
  },
  {
    id: 'schedule_post',
    title: 'Schedule a post',
    description: 'Set a future date/time for automatic publishing',
    category: 'publish',
    required: false,
    xp: 100,
  },

  // Sync steps
  {
    id: 'view_public_profile',
    title: 'View your live profile',
    description: 'Visit yourname.unool.co and share it',
    category: 'sync',
    required: true,
    xp: 100,
  },
  {
    id: 'enable_sync',
    title: 'Enable real-time sync',
    description: 'Changes in dashboard instantly reflect on your public profile',
    category: 'sync',
    required: false,
    xp: 100,
  },
];

export function createInitialChecklist(): OnboardingStep[] {
  return ONBOARDING_STEPS.map(step => ({
    ...step,
    completedAt: null,
    metadata: {},
  }));
}

export function calculateProgress(checklist: OnboardingChecklist): number {
  const requiredSteps = checklist.steps.filter(s => s.required);
  const completedRequired = requiredSteps.filter(s => s.completedAt).length;
  return requiredSteps.length > 0 ? (completedRequired / requiredSteps.length) * 100 : 0;
}

export function getNextStep(checklist: OnboardingChecklist): OnboardingStep | null {
  return checklist.steps.find(s => !s.completedAt) || null;
}

export function markStepComplete(
  checklist: OnboardingChecklist,
  stepId: string,
  metadata: Record<string, unknown> = {}
): OnboardingChecklist {
  const steps = checklist.steps.map(step => {
    if (step.id === stepId && !step.completedAt) {
      return {
        ...step,
        completedAt: new Date().toISOString(),
        metadata: { ...step.metadata, ...metadata },
      };
    }
    return step;
  });

  const earnedXp = steps
    .filter(s => s.completedAt)
    .reduce((sum, s) => sum + s.xp, 0);

  const allRequiredComplete = steps
    .filter(s => s.required)
    .every(s => s.completedAt);

  return {
    ...checklist,
    steps,
    earnedXp,
    completedAt: allRequiredComplete ? new Date().toISOString() : null,
    currentStep: steps.findIndex(s => !s.completedAt) >= 0
      ? steps.findIndex(s => !s.completedAt)
      : steps.length,
  };
}