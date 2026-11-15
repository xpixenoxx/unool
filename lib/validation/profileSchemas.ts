import { z } from 'zod';

/**
 * Validates URL strings against strict protocol allowlists so
 * `javascript:`, `data:`, `vbscript:`, `file:`, or protocol-relative `//` URLs
 * can never be saved or rendered into template links/actions.
 */
export function isSafeHref(
  rawUrl: unknown,
  options: { allowMailto?: boolean } = {}
): boolean {
  if (typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('//')) return false;

  try {
    const parsed = new URL(trimmed);
    const allowed = options.allowMailto
      ? ['http:', 'https:', 'mailto:']
      : ['http:', 'https:'];
    return allowed.includes(parsed.protocol.toLowerCase());
  } catch {
    return false;
  }
}

export function sanitizeHref(
  rawUrl: unknown,
  options: { allowMailto?: boolean } = {}
): string | null {
  if (!isSafeHref(rawUrl, options)) return null;
  return String(rawUrl).trim();
}

export const SafeHttpUrlSchema = z
  .string()
  .trim()
  .max(2048, 'URL is too long')
  .refine((val) => isSafeHref(val, { allowMailto: false }), {
    message: 'Only https:// or http:// URLs are allowed',
  });

export const SafeActionUrlSchema = z
  .string()
  .trim()
  .max(2048, 'URL is too long')
  .refine((val) => isSafeHref(val, { allowMailto: true }), {
    message: 'Only https://, http://, or mailto: links are allowed',
  });

export const OptionalSafeActionUrlSchema = z
  .union([SafeActionUrlSchema, z.literal(''), z.null(), z.undefined()])
  .transform((v) => (v && v.trim() ? v.trim() : undefined));

export const OptionalSafeHttpUrlSchema = z
  .union([SafeHttpUrlSchema, z.literal(''), z.null(), z.undefined()])
  .transform((v) => (v && v.trim() ? v.trim() : undefined));

export const HexColorSchema = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Accent color must be a valid hex code (e.g. #2563EB)');

export const ProfileLinkInputSchema = z.object({
  id: z.string().trim().min(1).max(64).optional(),
  label: z.string().trim().min(1, 'Link label is required').max(100),
  url: SafeActionUrlSchema,
  type: z.string().trim().max(40).optional(),
  icon: z.string().trim().max(40).nullish().transform((v) => v || undefined),
  category: z.enum(['primary', 'work', 'social', 'writing', 'resource', 'other']).optional(),
  isPrimary: z.boolean().optional(),
  badge: z.string().trim().max(32).optional(),
  isVisible: z.boolean().optional(),
  order: z.number().int().min(0).max(500).optional(),
  clicks: z.number().int().min(0).optional(),
});

export const ProofPointInputSchema = z
  .object({
    id: z.string().trim().max(64).optional(),
    type: z.string().trim().max(40).optional(),
    value: z.string().trim().max(240).optional(),
    metric: z.string().trim().max(120).optional(),
    context: z.string().trim().max(240).optional(),
    url: OptionalSafeHttpUrlSchema,
  })
  .transform((p) => {
    const resolvedType = (p.type || p.context || 'metric').trim();
    const resolvedValue = (p.value || p.metric || '').trim();
    return {
      ...(p.id ? { id: p.id } : {}),
      type: resolvedType || 'metric',
      value: resolvedValue,
      ...(p.metric ? { metric: p.metric } : {}),
      ...(p.context ? { context: p.context } : {}),
      ...(p.url ? { url: p.url } : {}),
    };
  })
  .refine((p) => p.value.length > 0, {
    message: 'Proof point value is required',
  });

export const SectionVisibilitySchema = z.object({
  proofs: z.boolean().optional(),
  openTo: z.boolean().optional(),
  activity: z.boolean().optional(),
  contactCta: z.boolean().optional(),
  footerBadge: z.boolean().optional(),
}).strict();

export const ThemeInputSchema = z.object({
  template: z.string().trim().min(1).max(64).optional(),
  preset: z.string().trim().min(1).max(64).optional(),
  accentColor: HexColorSchema.optional(),
  colorMode: z.enum(['auto', 'light', 'dark']).optional(),
  fontPairing: z.enum(['editorial', 'grotesk', 'mono', 'classic']).optional(),
  avatarStyle: z.enum(['circle', 'rounded', 'square']).optional(),
  sectionVisibility: SectionVisibilitySchema.optional(),
  conversationUrl: OptionalSafeActionUrlSchema,
  bookingUrl: OptionalSafeHttpUrlSchema,
  location: z.string().trim().max(100).optional(),
  timezone: z.string().trim().max(64).optional(),
  availabilityBadge: z.string().trim().max(64).optional(),
  showHeroCta: z.boolean().optional(),
  // Deliberately neutralize arbitrary raw CSS injection
  customCss: z.any().optional().transform(() => null),
}).passthrough();

export const SocialHandlesInputSchema = z.record(
  z.string().trim().max(32),
  z.string().trim().max(120)
);

export const ProfileSeoInputSchema = z.object({
  title: z.string().trim().max(160).optional(),
  description: z.string().trim().max(320).optional(),
  image: OptionalSafeHttpUrlSchema.nullable().optional(),
}).passthrough();

export const ProfileMutationSchema = z.object({
  subdomain: z.string().trim().max(64).optional(),
  name: z.string().trim().max(120).optional(),
  headline: z.string().trim().max(220).optional(),
  bio: z.string().trim().max(3000).optional(),
  role: z.string().trim().max(120).optional(),
  company: z.string().trim().max(120).optional(),
  avatarUrl: OptionalSafeHttpUrlSchema.nullable().optional(),
  email: z.union([z.string().trim().email('Invalid contact email').max(254), z.literal(''), z.null()]).optional(),
  showEmail: z.boolean().optional(),
  location: z.string().trim().max(120).optional(),
  timezone: z.string().trim().max(64).optional(),
  availabilityBadge: z.string().trim().max(64).optional(),
  links: z.array(ProfileLinkInputSchema).max(30).optional(),
  proofPoints: z.array(ProofPointInputSchema).max(16).optional(),
  theme: ThemeInputSchema.optional(),
  socialHandles: SocialHandlesInputSchema.optional(),
  seo: ProfileSeoInputSchema.optional(),
  openTo: z.array(z.string().trim().min(1).max(60)).max(12).optional(),
  visibility: z.enum(['public', 'private', 'unlisted']).optional(),
  version: z.number().int().positive().optional(),
}).passthrough();

export const ProfileContactLeadSchema = z.object({
  subdomain: z.string().trim().min(2).max(64),
  senderName: z.string().trim().min(2, 'Please enter your name').max(120),
  senderEmail: z.string().trim().email('Please enter a valid email address').max(254),
  message: z.string().trim().min(5, 'Please write a short message').max(2000),
  website: z.string().max(120).optional(), // honeypot field — must stay empty
});

export const CustomDomainSchema = z.object({
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .min(4, 'Enter a valid domain (e.g. links.yourdomain.com)')
    .max(253)
    .regex(
      /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/,
      'Enter a valid hostname without http:// or paths (e.g. links.yourdomain.com)'
    ),
});
