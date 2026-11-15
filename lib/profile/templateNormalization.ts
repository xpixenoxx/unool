export const DEFAULT_TEMPLATE_ID = 'lone' as const;

export const TEMPLATE_ALIASES: Record<string, string> = {
  minimalist: 'lone',
  default: 'lone',
  minimal: 'lone',
  stack: 'the-stack',
  bookshelf: 'the-bookshelf',
  cube: 'the-cube',
  monolith: 'the-monolith',
  metro: 'the-metro',
  noren: 'the-noren',
  desktop: 'the-desktop',
  calendar: 'the-calendar',
  bento: 'the-bento',
};

export const CANONICAL_TEMPLATE_NAMES: Record<string, string> = {
  lover: 'The Lover',
  lone: 'The Lone',
  energy: 'The Energy',
  rebellion: 'The Rebellion',
  vision: 'The Vision',
  human: 'The Human',
  'the-machine': 'The Machine',
  'the-club': 'The Club',
  'the-studio': 'The Studio',
  'the-builder': 'The Builder',
  'the-visionary': 'The Visionary',
  'the-hustler': 'The Hustler',
  'the-aesthete': 'The Aesthete',
  'the-creator': 'The Creator',
  'the-voice': 'The Voice',
  'the-stack': 'The Stack',
  'the-bookshelf': 'The Bookshelf',
  'the-cube': 'The Cube',
  'the-monolith': 'The Monolith',
  'the-metro': 'The Metro',
  'the-noren': 'The Noren',
  'the-desktop': 'The Desktop',
  'the-calendar': 'The Calendar',
  'the-bento': 'The Bento',
};

export const VALID_TEMPLATE_IDS = new Set(Object.keys(CANONICAL_TEMPLATE_NAMES));

export function normalizeTemplateId(templateId: string | null | undefined): string {
  const raw = String(templateId ?? '').trim().toLowerCase();
  if (!raw) return DEFAULT_TEMPLATE_ID;
  const unaliased = TEMPLATE_ALIASES[raw] ?? raw;
  if (VALID_TEMPLATE_IDS.has(unaliased)) return unaliased;
  if (VALID_TEMPLATE_IDS.has(`the-${unaliased}`)) return `the-${unaliased}`;
  return DEFAULT_TEMPLATE_ID;
}

export function getTemplateDisplayName(templateId: string | null | undefined): string {
  const canonical = normalizeTemplateId(templateId);
  return CANONICAL_TEMPLATE_NAMES[canonical] ?? 'The Lone';
}

