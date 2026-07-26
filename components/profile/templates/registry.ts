import type { TemplateMeta } from './types';

export const TEMPLATE_REGISTRY: TemplateMeta[] = [
  // STUDENT — Clean, resume-focused, single column
  {
    id: 'student',
    name: 'Student',
    category: 'persona',
    intensity: 'standard',
    preset: 'minimal',
    description: 'Clean resume layout with bio card, underline links, and proof badges. Perfect for students and early-career professionals.',
    tags: ['resume', 'clean', 'students', 'internships', 'portfolio'],
    thumbnail: '/templates/previews/student.svg',
    features: {
      has3DBackground: false,
      hasParallax: false,
      hasTiltCards: false,
      hasMagneticHover: false,
      hasAnimatedOrbs: false,
      hasGradientText: false,
      supportsVideoBackground: false,
      maxLinks: 10,
      maxProofPoints: 5,
      performanceBudget: 'light',
    },
    persona: 'student',
  },

  // FOUNDER — Authority, metrics, two-column with KPIs
  {
    id: 'founder',
    name: 'Founder',
    category: 'persona',
    intensity: 'bold',
    preset: 'corporate',
    description: 'Two-column desktop layout with KPI strip (tilt cards), testimonial carousel, magnetic links, and company badges. Built for authority.',
    tags: ['founder', 'metrics', 'kpi', 'testimonials', 'authority', 'investors'],
    thumbnail: '/templates/previews/founder.svg',
    features: {
      has3DBackground: false,
      hasParallax: false,
      hasTiltCards: true,
      hasMagneticHover: true,
      hasAnimatedOrbs: false,
      hasGradientText: false,
      supportsVideoBackground: false,
      maxLinks: 15,
      maxProofPoints: 8,
      performanceBudget: 'medium',
    },
    persona: 'founder',
  },

  // CREATOR — Feed-style, orbital background, engagement rings
  {
    id: 'creator',
    name: 'Creator',
    category: 'persona',
    intensity: 'max',
    preset: 'creative',
    description: 'Feed-style layout with orbital background, dual morphing blobs, media grid, alternating magnetic/tilt cards, and animated engagement rings.',
    tags: ['creator', 'feed', 'engagement', 'content', 'media', 'influencer'],
    thumbnail: '/templates/previews/creator.svg',
    features: {
      has3DBackground: true,
      hasParallax: true,
      hasTiltCards: true,
      hasMagneticHover: true,
      hasAnimatedOrbs: true,
      hasGradientText: true,
      supportsVideoBackground: false,
      maxLinks: 12,
      maxProofPoints: 6,
      performanceBudget: 'heavy',
    },
    persona: 'creator',
  },

  // DEVELOPER — Terminal/IDE aesthetic, syntax-highlighted bio, GitHub stats
  {
    id: 'developer',
    name: 'Developer',
    category: 'persona',
    intensity: 'standard',
    preset: 'technical',
    description: 'Terminal header bar, syntax-highlighted bio, GitHub stats KPIs (tilt cards), repo cards with language colors, orbital particles background.',
    tags: ['developer', 'terminal', 'github', 'code', 'engineer', 'technical'],
    thumbnail: '/templates/previews/developer.svg',
    features: {
      has3DBackground: true,
      hasParallax: false,
      hasTiltCards: true,
      hasMagneticHover: false,
      hasAnimatedOrbs: true,
      hasGradientText: false,
      supportsVideoBackground: false,
      maxLinks: 15,
      maxProofPoints: 8,
      performanceBudget: 'medium',
    },
    persona: 'developer',
  },

  // MINIMALIST — Pure link pills, zero chrome, conditional avatar/bio
  {
    id: 'minimalist',
    name: 'Minimalist',
    category: 'persona',
    intensity: 'minimal',
    preset: 'minimal',
    description: 'Pure link pills (rounded full), centered 400px column. Only shows avatar/bio if provided. Zero chrome. Maximum focus on links.',
    tags: ['minimal', 'link-in-bio', 'clean', 'fast', 'personal'],
    thumbnail: '/templates/previews/minimalist.svg',
    features: {
      has3DBackground: false,
      hasParallax: false,
      hasTiltCards: false,
      hasMagneticHover: false,
      hasAnimatedOrbs: false,
      hasGradientText: false,
      supportsVideoBackground: false,
      maxLinks: 20,
      maxProofPoints: 5,
      performanceBudget: 'ultra-light',
    },
    persona: 'minimalist',
  },
];

export function getTemplateById(id: string): TemplateMeta | undefined {
  return TEMPLATE_REGISTRY.find(t => t.id === id);
}

export function getTemplatesByCategory(category: TemplateMeta['category']): TemplateMeta[] {
  return TEMPLATE_REGISTRY.filter(t => t.category === category);
}

export function getTemplatesByPersona(persona: TemplateMeta['persona']): TemplateMeta[] {
  return TEMPLATE_REGISTRY.filter(t => t.persona === persona);
}

export function getDefaultTemplate(persona?: TemplateMeta['persona']): TemplateMeta {
  if (persona) {
    const found = TEMPLATE_REGISTRY.find(t => t.persona === persona);
    if (found) return found;
  }
  // Fallback to minimalist as default
  return TEMPLATE_REGISTRY.find(t => t.id === 'minimalist')!;
}