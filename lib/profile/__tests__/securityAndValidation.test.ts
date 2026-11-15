import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  validateSubdomain,
  normalizeSubdomain,
  isTempSubdomain,
  SYSTEM_RESERVED_SUBDOMAINS,
  TRADEMARK_RESERVED_SUBDOMAINS,
} from '@/lib/validation/subdomain';
import {
  isSafeHref,
  sanitizeHref,
  ProfileLinkInputSchema,
  ProofPointInputSchema,
  ThemeInputSchema,
  ProfileMutationSchema,
  ProfileContactLeadSchema,
  CustomDomainSchema,
} from '@/lib/validation/profileSchemas';
import { validateUrlForFetch, safeFetchExternalPage } from '@/lib/utils/url-validation';
import {
  normalizeHex,
  contrastRatio,
  meetsWcagAA,
  pickReadableText,
  solveAccessibleAccent,
} from '@/lib/profile/contrast';
import {
  normalizeTemplateId,
  getTemplateDisplayName,
  CANONICAL_TEMPLATE_NAMES,
} from '@/lib/profile/templateNormalization';

describe('Phase 0 & 1 Security, Validation, Contrast & Normalization', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Subdomain validation', () => {
    it('rejects system and trademark reserved handles case-insensitively', () => {
      for (const word of ['Admin', 'API', 'dashboard', 'www', 'robots', 'unool']) {
        const res = validateSubdomain(word);
        expect(res.valid).toBe(false);
        expect(res.code).toBe('RESERVED');
      }
      for (const brand of ['Google', 'STRIPE', 'OpenAI', 'anthropic', 'linktree']) {
        const res = validateSubdomain(brand);
        expect(res.valid).toBe(false);
        expect(res.code).toBe('RESERVED');
      }
      expect(SYSTEM_RESERVED_SUBDOMAINS.length).toBeGreaterThan(20);
      expect(TRADEMARK_RESERVED_SUBDOMAINS.length).toBeGreaterThan(20);
    });

    it('enforces length and hyphen rules while normalizing casing and whitespace', () => {
      expect(normalizeSubdomain('  Alex-Chen  ')).toBe('alex-chen');
      expect(validateSubdomain('  Alex-Chen  ')).toEqual({ valid: true, normalized: 'alex-chen' });
      expect(validateSubdomain('a').valid).toBe(false);
      expect(validateSubdomain('-alex').valid).toBe(false);
      expect(validateSubdomain('alex-').valid).toBe(false);
      expect(validateSubdomain('alex--chen').valid).toBe(false);
      expect(validateSubdomain('alex_chen').valid).toBe(false);
    });

    it('identifies temporary generated subdomains', () => {
      expect(isTempSubdomain(null)).toBe(true);
      expect(isTempSubdomain('user-12ab34cd')).toBe(true);
      expect(isTempSubdomain('user-ab-123')).toBe(true);
      expect(isTempSubdomain('alexchen')).toBe(false);
    });
  });

  describe('Profile Zod schemas and href sanitization', () => {
    it('blocks XSS and non-allowlisted protocols', () => {
      const dangerousUrls = [
        'javascript:alert(1)',
        '  JaVaScRiPt:alert(document.cookie)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)',
        'file:///etc/passwd',
        '//evil.com/phish',
      ];
      for (const url of dangerousUrls) {
        expect(isSafeHref(url, { allowMailto: true })).toBe(false);
        expect(sanitizeHref(url, { allowMailto: true })).toBeNull();
        expect(
          ProfileLinkInputSchema.safeParse({ label: 'Click', url }).success
        ).toBe(false);
      }
    });

    it('allows https, http, and mailto when enabled, while keeping bookingUrl strictly http(s)', () => {
      expect(isSafeHref('https://alexchen.dev/work')).toBe(true);
      expect(isSafeHref('mailto:hi@alexchen.dev', { allowMailto: true })).toBe(true);
      expect(isSafeHref('mailto:hi@alexchen.dev', { allowMailto: false })).toBe(false);

      const themeOk = ThemeInputSchema.safeParse({
        conversationUrl: 'mailto:hi@alexchen.dev',
        bookingUrl: 'https://cal.com/alex',
        accentColor: '#3B82F6',
        customCss: 'body { background: url(https://evil.test/x); }',
      });
      expect(themeOk.success).toBe(true);
      if (themeOk.success) {
        expect(themeOk.data.customCss).toBeNull();
      }

      const bookingMailto = ThemeInputSchema.safeParse({
        bookingUrl: 'mailto:hi@alexchen.dev',
      });
      expect(bookingMailto.success).toBe(false);
    });

    it('normalizes legacy metric/context ProofPoint objects into canonical type/value', () => {
      const res = ProofPointInputSchema.safeParse({
        metric: '10M+ Views',
        context: 'Across YouTube',
        url: 'https://youtube.com/@alex',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.value).toBe('10M+ Views');
        expect(res.data.type).toBe('Across YouTube');
        expect(res.data.url).toBe('https://youtube.com/@alex');
      }
    });

    it('validates contact lead schema and custom domain schema', () => {
      expect(
        ProfileContactLeadSchema.safeParse({
          subdomain: 'alex',
          senderName: 'Sam',
          senderEmail: 'sam@example.org',
          message: 'Interested in collaborating on a launch.',
        }).success
      ).toBe(true);

      expect(
        ProfileContactLeadSchema.safeParse({
          subdomain: 'alex',
          senderName: 'Sam',
          senderEmail: 'not-an-email',
          message: 'Hi there!',
        }).success
      ).toBe(false);

      expect(CustomDomainSchema.safeParse({ domain: 'links.alexchen.dev' }).success).toBe(true);
      expect(CustomDomainSchema.safeParse({ domain: 'https://links.alexchen.dev/path' }).success).toBe(false);
      expect(
        ProfileMutationSchema.safeParse({
          visibility: 'unlisted',
          showEmail: false,
          theme: { template: 'the-bento', colorMode: 'dark' },
        }).success
      ).toBe(true);
    });
  });

  describe('SSRF protection and safe redirect handling', () => {
    it('blocks CGNAT, loopback, metadata, and IPv6 ULA/link-local addresses', async () => {
      const blockedTargets = [
        'http://100.64.0.1/',
        'http://100.127.255.254/',
        'http://127.0.0.1:8080/',
        'http://169.254.169.254/latest/meta-data/',
        'http://[::1]/',
        'http://[fc00::1]/',
        'http://[fe80::1]/',
        'http://[::ffff:127.0.0.1]/',
      ];
      for (const target of blockedTargets) {
        const check = await validateUrlForFetch(target);
        expect(check.allowed, target).toBe(false);
      }
    });

    it('blocks redirects targeting private/metadata IPs while allowing safe public redirects', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { location: 'http://169.254.169.254/latest/meta-data' },
        })
      );

      await expect(safeFetchExternalPage('https://93.184.216.34/start')).rejects.toThrow(
        /Blocked URL/i
      );

      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce(
          new Response(null, {
            status: 302,
            headers: { location: 'https://93.184.216.34/final' },
          })
        )
        .mockResolvedValueOnce(
          new Response('<html><title>Ok</title></html>', { status: 200 })
        );

      const okRes = await safeFetchExternalPage('https://93.184.216.34/start');
      expect(okRes.status).toBe(200);
      expect(await okRes.text()).toContain('Ok');
    });
  });

  describe('WCAG 2.1 Contrast Solver & Template Normalization', () => {
    it('guarantees >= 4.5:1 AA contrast on dark and light surfaces', () => {
      const onDark = solveAccessibleAccent('#3E5064', '#0F172A', 4.5);
      expect(contrastRatio(onDark, '#0F172A')).toBeGreaterThanOrEqual(4.5);
      expect(meetsWcagAA(onDark, '#0F172A')).toBe(true);

      const onLight = solveAccessibleAccent('#F59E0B', '#FFFFFF', 4.5);
      expect(contrastRatio(onLight, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);

      expect(pickReadableText('#0F172A')).toBe('#FFFFFF');
      expect(pickReadableText('#FFFFFF')).toBe('#0F172A');
      expect(normalizeHex('#abc')).toBe('#AABBCC');
    });

    it('normalizes legacy and short aliases to canonical 24 template IDs', () => {
      expect(Object.keys(CANONICAL_TEMPLATE_NAMES)).toHaveLength(24);
      expect(normalizeTemplateId('minimalist')).toBe('lone');
      expect(normalizeTemplateId('default')).toBe('lone');
      expect(normalizeTemplateId('bento')).toBe('the-bento');
      expect(normalizeTemplateId('metro')).toBe('the-metro');
      expect(normalizeTemplateId('unknown-template')).toBe('lone');
      expect(getTemplateDisplayName('bento')).toBe('The Bento');
    });
  });
});

