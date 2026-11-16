'use client';

import React from 'react';
import type { PublicProfile } from '@/components/profile/templates/types';

/**
 * Safely embeds JSON-LD structured data inside a `<script type="application/ld+json">` tag
 * by escaping `<`, `>`, `&`, and Unicode line terminators so user content can never break out
 * of the script context (`</script>` injection).
 */
export function SafeJsonLd({ data }: { data: Record<string, unknown> }) {
  const safeJson = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  );
}

export function buildPersonJsonLd(profile: Partial<PublicProfile> | null | undefined): Record<string, unknown> {
  const subdomain = profile?.subdomain || '';
  const name = profile?.name || subdomain || 'Creator';
  const sameAs = Array.isArray(profile?.links)
    ? profile.links
        .map((l) => l?.url)
        .filter((url): url is string => typeof url === 'string' && /^https?:\/\//i.test(url))
    : [];

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url: subdomain ? `https://unool.co/u/${subdomain}` : 'https://unool.co',
    description: profile?.headline || profile?.bio || `${name}'s creator profile on Unool`,
    ...(profile?.role ? { jobTitle: profile.role } : {}),
    ...(profile?.company
      ? {
          worksFor: {
            '@type': 'Organization',
            name: profile.company,
          },
        }
      : {}),
    ...(profile?.avatarUrl ? { image: profile.avatarUrl } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

