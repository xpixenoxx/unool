import type { TemplateMeta } from './types';

export const TEMPLATE_REGISTRY: TemplateMeta[] = [
  // 01 — INDIVIDUAL
  {
    id: 'lover',
    name: 'The Lover',
    category: 'individual',
    intensity: 'light',
    preset: 'minimal',
    icon: '❤️',
    tagline: 'I create from emotion.',
    description: 'Romantic, emotional, expressive, sentimental. Content should feel like a digital journal + social studio.',
    tags: ['journal', 'photography', 'emotion', 'softness'],
    thumbnail: '/templates/previews/lover.svg',
    features: {
      has3DBackground: false, hasParallax: false, hasTiltCards: false, hasMagneticHover: true, hasAnimatedOrbs: false, hasGradientText: false, supportsVideoBackground: false, maxLinks: 10, maxProofPoints: 5, performanceBudget: 'light',
      maxBundleSizeKB: 45, maxRenderMs: 80,
    },
    persona: 'lover',
  },
  {
    id: 'lone',
    name: 'The Lone',
    category: 'individual',
    intensity: 'minimal',
    preset: 'minimal',
    icon: '🌑',
    tagline: 'I move quietly and build my own world.',
    description: 'Independent, quiet, introspective, mysterious. Minimal, cinematic, dark photography, extremely restrained UI.',
    tags: ['cinema', 'solitude', 'darkness', 'minimalism'],
    thumbnail: '/templates/previews/lone.svg',
    features: {
      has3DBackground: false, hasParallax: false, hasTiltCards: false, hasMagneticHover: false, hasAnimatedOrbs: false, hasGradientText: false, supportsVideoBackground: false, maxLinks: 5, maxProofPoints: 2, performanceBudget: 'ultra-light',
      maxBundleSizeKB: 25, maxRenderMs: 40,
    },
    persona: 'lone',
  },
  {
    id: 'energy',
    name: 'The Energy',
    category: 'individual',
    intensity: 'bold',
    preset: 'bold',
    icon: '⚡',
    tagline: 'Discipline. Ambition. Growth.',
    description: 'Confident, ambitious, high-energy. Bold typography, strong grids, sharp geometry, dynamic progress indicators.',
    tags: ['discipline', 'typography', 'performance', 'intensity'],
    thumbnail: '/templates/previews/energy.svg',
    features: {
      has3DBackground: false, hasParallax: false, hasTiltCards: true, hasMagneticHover: true, hasAnimatedOrbs: false, hasGradientText: false, supportsVideoBackground: false, maxLinks: 10, maxProofPoints: 6, performanceBudget: 'medium',
      maxBundleSizeKB: 65, maxRenderMs: 120,
    },
    persona: 'energy',
  },

  // 02 — STARTUP
  {
    id: 'rebellion',
    name: 'The Rebellion',
    category: 'startup',
    intensity: 'max',
    preset: 'creative',
    icon: '🚨',
    tagline: 'We challenge the industry.',
    description: 'Disruptive startup aiming to change an industry. High contrast, unexpected typography, experimental components.',
    tags: ['experimental', 'bold', 'anti-corporate', 'disruptive'],
    thumbnail: '/templates/previews/rebellion.svg',
    features: {
      has3DBackground: false, hasParallax: true, hasTiltCards: true, hasMagneticHover: true, hasAnimatedOrbs: false, hasGradientText: true, supportsVideoBackground: false, maxLinks: 12, maxProofPoints: 6, performanceBudget: 'heavy',
      maxBundleSizeKB: 120, maxRenderMs: 200,
    },
    persona: 'rebellion',
  },
  {
    id: 'vision',
    name: 'The Vision',
    category: 'startup',
    intensity: 'bold',
    preset: 'technical',
    icon: '🔮',
    tagline: "We're building what's next.",
    description: 'Ambitious technology startup building the future. Dynamic charts, intelligent network-like visualizations.',
    tags: ['futuristic', 'intelligent', 'precision', 'innovative'],
    thumbnail: '/templates/previews/vision.svg',
    features: {
      has3DBackground: true, hasParallax: true, hasTiltCards: false, hasMagneticHover: true, hasAnimatedOrbs: true, hasGradientText: false, supportsVideoBackground: false, maxLinks: 15, maxProofPoints: 5, performanceBudget: 'medium',
      maxBundleSizeKB: 85, maxRenderMs: 150,
    },
    persona: 'vision',
  },
  {
    id: 'human',
    name: 'The Human',
    category: 'startup',
    intensity: 'light',
    preset: 'minimal',
    icon: '🫶',
    tagline: 'People are the product.',
    description: 'Friendly, community-driven startup. Optimistic, accessible, warm photography, organic shapes.',
    tags: ['warm', 'accessible', 'friendly', 'community'],
    thumbnail: '/templates/previews/human.svg',
    features: {
      has3DBackground: false, hasParallax: false, hasTiltCards: false, hasMagneticHover: true, hasAnimatedOrbs: false, hasGradientText: false, supportsVideoBackground: false, maxLinks: 10, maxProofPoints: 6, performanceBudget: 'light',
      maxBundleSizeKB: 40, maxRenderMs: 75,
    },
    persona: 'human',
  },

  // 03 — AGENCY
  {
    id: 'the-machine',
    name: 'The Machine',
    category: 'agency',
    intensity: 'bold',
    preset: 'corporate',
    icon: '📊',
    tagline: 'Performance is everything.',
    description: 'Performance-focused agency. Fast, data-driven, precise. Dark interface with high-contrast accents and dense information.',
    tags: ['data-driven', 'fast', 'performance', 'competitive'],
    thumbnail: '/templates/previews/the-machine.svg',
    features: {
      has3DBackground: false, hasParallax: false, hasTiltCards: true, hasMagneticHover: false, hasAnimatedOrbs: false, hasGradientText: false, supportsVideoBackground: false, maxLinks: 20, maxProofPoints: 8, performanceBudget: 'medium',
      maxBundleSizeKB: 70, maxRenderMs: 100,
    },
    persona: 'the-machine',
  },
  {
    id: 'the-club',
    name: 'The Club',
    category: 'agency',
    intensity: 'max',
    preset: 'creative',
    icon: '🪩',
    tagline: 'We shape culture.',
    description: 'Trend-focused agency for culture and creators. Cool, social, trendy. Fashion-magazine aesthetic with collage layouts.',
    tags: ['culture', 'trendy', 'social', 'collage'],
    thumbnail: '/templates/previews/the-club.svg',
    features: {
      has3DBackground: false, hasParallax: true, hasTiltCards: true, hasMagneticHover: true, hasAnimatedOrbs: false, hasGradientText: true, supportsVideoBackground: false, maxLinks: 15, maxProofPoints: 5, performanceBudget: 'heavy',
      maxBundleSizeKB: 140, maxRenderMs: 220,
    },
    persona: 'the-club',
  },

  // 04 — ENTREPRENEUR
  {
    id: 'the-builder',
    name: 'The Builder',
    category: 'entrepreneur',
    intensity: 'standard',
    preset: 'technical',
    icon: '🔨',
    tagline: 'I build every day.',
    description: 'Entrepreneur obsessed with building. Focused, disciplined. Minimal, neutral, strong productivity-oriented layout.',
    tags: ['productivity', 'disciplined', 'practical', 'minimal'],
    thumbnail: '/templates/previews/the-builder.svg',
    features: {
      has3DBackground: false, hasParallax: false, hasTiltCards: false, hasMagneticHover: false, hasAnimatedOrbs: false, hasGradientText: false, supportsVideoBackground: false, maxLinks: 12, maxProofPoints: 8, performanceBudget: 'ultra-light',
      maxBundleSizeKB: 30, maxRenderMs: 50,
    },
    persona: 'the-builder',
  },
  {
    id: 'the-visionary',
    name: 'The Visionary',
    category: 'entrepreneur',
    intensity: 'bold',
    preset: 'corporate',
    icon: '🔭',
    tagline: "I see what's next.",
    description: 'Big-picture founder. Inspirational, premium, future-focused. Elegant dark/light contrast, cinematic imagery.',
    tags: ['inspirational', 'premium', 'cinematic', 'ambitious'],
    thumbnail: '/templates/previews/the-visionary.svg',
    features: {
      has3DBackground: false, hasParallax: false, hasTiltCards: true, hasMagneticHover: true, hasAnimatedOrbs: true, hasGradientText: false, supportsVideoBackground: false, maxLinks: 10, maxProofPoints: 6, performanceBudget: 'medium',
      maxBundleSizeKB: 75, maxRenderMs: 110,
    },
    persona: 'the-visionary',
  },
  {
    id: 'the-hustler',
    name: 'The Hustler',
    category: 'entrepreneur',
    intensity: 'max',
    preset: 'bold',
    icon: '🔥',
    tagline: 'I move fast.',
    description: 'Fast-moving entrepreneur. Energetic, opportunistic, fast. Strong accent colors, dynamic cards, high information density.',
    tags: ['fast', 'opportunistic', 'dynamic', 'bold'],
    thumbnail: '/templates/previews/the-hustler.svg',
    features: {
      has3DBackground: false, hasParallax: false, hasTiltCards: true, hasMagneticHover: true, hasAnimatedOrbs: false, hasGradientText: true, supportsVideoBackground: false, maxLinks: 15, maxProofPoints: 7, performanceBudget: 'medium',
      maxBundleSizeKB: 70, maxRenderMs: 115,
    },
    persona: 'the-hustler',
  },

  // 05 — INFLUENCER
  {
    id: 'the-aesthete',
    name: 'The Aesthete',
    category: 'influencer',
    intensity: 'light',
    preset: 'creative',
    icon: '✦',
    tagline: 'My world is my canvas.',
    description: 'Fashion, beauty, lifestyle. Elegant, curated, premium. Editorial magazine aesthetic, sophisticated typography.',
    tags: ['elegant', 'curated', 'luxury', 'editorial'],
    thumbnail: '/templates/previews/the-aesthete.svg',
    features: {
      has3DBackground: false, hasParallax: true, hasTiltCards: false, hasMagneticHover: true, hasAnimatedOrbs: false, hasGradientText: false, supportsVideoBackground: false, maxLinks: 10, maxProofPoints: 4, performanceBudget: 'light',
      maxBundleSizeKB: 50, maxRenderMs: 90,
    },
    persona: 'the-aesthete',
  },
  {
    id: 'the-creator',
    name: 'The Creator',
    category: 'influencer',
    intensity: 'max',
    preset: 'creative',
    icon: '🎬',
    tagline: 'I turn ideas into content.',
    description: 'Video-first creator, streamer. Vibrant, energetic, motion-inspired. Large visual real estate.',
    tags: ['video-first', 'vibrant', 'playful', 'motion'],
    thumbnail: '/templates/previews/the-creator.svg',
    features: {
      has3DBackground: true, hasParallax: true, hasTiltCards: true, hasMagneticHover: true, hasAnimatedOrbs: true, hasGradientText: true, supportsVideoBackground: true, maxLinks: 12, maxProofPoints: 6, performanceBudget: 'heavy',
      maxBundleSizeKB: 130, maxRenderMs: 210,
    },
    persona: 'the-creator',
  },
  {
    id: 'the-voice',
    name: 'The Voice',
    category: 'influencer',
    intensity: 'bold',
    preset: 'bold',
    icon: '✍️',
    tagline: 'I have something to say.',
    description: 'Opinion leader, storyteller. Confident, conversational. Typography-heavy, strong contrast, text as a visual element.',
    tags: ['intelligent', 'typography', 'confident', 'thought-leader'],
    thumbnail: '/templates/previews/the-voice.svg',
    features: {
      has3DBackground: false, hasParallax: false, hasTiltCards: false, hasMagneticHover: true, hasAnimatedOrbs: false, hasGradientText: false, supportsVideoBackground: false, maxLinks: 10, maxProofPoints: 5, performanceBudget: 'light',
      maxBundleSizeKB: 55, maxRenderMs: 85,
    },
    persona: 'the-voice',
  },

  // 06 — AGENCY (PREMIUM)
  {
    id: 'the-studio',
    name: 'The Studio',
    category: 'agency',
    intensity: 'max',
    preset: 'creative',
    icon: '🏛️',
    tagline: 'Crafting culture-defining work.',
    description: 'Premier independent studio. Editorial luxury, immersive canvas, zero-scroll cockpit. Liquid ripples, floating monoliths, atelier palette.',
    tags: ['luxury', 'editorial', 'immersive', 'premium', 'atelier'],
    thumbnail: '/templates/previews/the-studio.svg',
    features: {
      has3DBackground: true, hasParallax: true, hasTiltCards: true, hasMagneticHover: true, hasAnimatedOrbs: true, hasGradientText: true, supportsVideoBackground: false, maxLinks: 15, maxProofPoints: 8, performanceBudget: 'heavy',
      maxBundleSizeKB: 150, maxRenderMs: 250,
    },
    persona: 'the-studio',
  },

  // 07 — INDIVIDUAL / CRAFTSMAN (STACKING DOSSIER)
  {
    id: 'the-stack',
    name: 'The Stack',
    category: 'individual',
    intensity: 'standard',
    preset: 'creative',
    icon: '🗂️',
    tagline: 'Dimensional cards built to convert visitors into clients.',
    description: 'Physical stacking dossier for independent designers, consultants, and solo practitioners. Structured for services, clear links, and direct hiring.',
    tags: ['stacking-cards', 'editorial', 'freelancer', 'services', 'tactile'],
    thumbnail: '/templates/previews/the-stack.svg',
    features: {
      has3DBackground: false,
      hasParallax: true,
      hasTiltCards: false,
      hasMagneticHover: true,
      hasAnimatedOrbs: false,
      hasGradientText: false,
      supportsVideoBackground: false,
      maxLinks: 12,
      maxProofPoints: 6,
      performanceBudget: 'light',
      maxBundleSizeKB: 40,
      maxRenderMs: 60,
    },
    persona: 'the-stack',
  },

  // 08 — THE BOOKSHELF (INFLUENCER / ARCHIVAL LIBRARY)
  {
    id: 'the-bookshelf',
    name: 'The Bookshelf',
    category: 'influencer',
    intensity: 'standard',
    preset: 'creative',
    icon: '📚',
    tagline: 'A literary library where every link is a book spine.',
    description: 'Archival literary library with pull-out book spines, embossed services bookplate, and direct contact dossier.',
    tags: ['bookshelf', 'editorial', 'library', 'archival', 'tactile'],
    thumbnail: '/templates/previews/the-bookshelf.svg',
    features: {
      has3DBackground: false,
      hasParallax: false,
      hasTiltCards: true,
      hasMagneticHover: true,
      hasAnimatedOrbs: false,
      hasGradientText: false,
      supportsVideoBackground: false,
      maxLinks: 16,
      maxProofPoints: 8,
      performanceBudget: 'light',
      maxBundleSizeKB: 38,
      maxRenderMs: 55,
    },
    persona: 'the-bookshelf',
  },

  // 09 — THE CUBE (STARTUP / 3D SPATIAL)
  {
    id: 'the-cube',
    name: 'The Cube',
    category: 'startup',
    intensity: 'max',
    preset: 'technical',
    icon: '🎲',
    tagline: '3D kinetic spatial computing cube with 4 interactive faces.',
    description: 'Kinetic 3D spatial cube for founders, engineers, and creators. Rotate smoothly through Identity, Links, Services, and Contact.',
    tags: ['3d-cube', 'spatial', 'kinetic', 'interactive', 'startup'],
    thumbnail: '/templates/previews/the-cube.svg',
    features: {
      has3DBackground: true,
      hasParallax: true,
      hasTiltCards: true,
      hasMagneticHover: true,
      hasAnimatedOrbs: false,
      hasGradientText: false,
      supportsVideoBackground: false,
      maxLinks: 14,
      maxProofPoints: 6,
      performanceBudget: 'medium',
      maxBundleSizeKB: 48,
      maxRenderMs: 70,
    },
    persona: 'the-cube',
  },

  // 10 — THE MONOLITH (AGENCY / ARCHITECTURAL EXPANDING SLABS)
  {
    id: 'the-monolith',
    name: 'The Monolith',
    category: 'agency',
    intensity: 'bold',
    preset: 'creative',
    icon: '🏛️',
    tagline: 'Architectural expanding monolithic slabs with fluid accordion transitions.',
    description: 'Monumental expanding monolithic slabs for modern agencies, design ateliers, and creative studios. Horizontal accordion on desktop, responsive stack on mobile.',
    tags: ['monolith', 'expanding-panels', 'architectural', 'editorial', 'atelier'],
    thumbnail: '/templates/previews/the-monolith.svg',
    features: {
      has3DBackground: false,
      hasParallax: true,
      hasTiltCards: false,
      hasMagneticHover: true,
      hasAnimatedOrbs: false,
      hasGradientText: false,
      supportsVideoBackground: false,
      maxLinks: 16,
      maxProofPoints: 8,
      performanceBudget: 'light',
      maxBundleSizeKB: 42,
      maxRenderMs: 60,
    },
    persona: 'the-monolith',
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
  return TEMPLATE_REGISTRY.find(t => t.id === 'lone')!;
}