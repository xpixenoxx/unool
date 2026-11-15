import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const cleanSubdomain = decodeURIComponent(subdomain || '').toLowerCase().trim();

  if (!cleanSubdomain) {
    return {
      title: 'Profile • Unool',
      robots: { index: false, follow: false },
    };
  }

  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('name, headline, bio, avatar_url, seo, visibility')
      .eq('subdomain', cleanSubdomain)
      .is('deleted_at', null)
      .maybeSingle();

    if (!profile) {
      return {
        title: `${cleanSubdomain} • Unool`,
        description: 'View this creator profile on Unool.',
        robots: { index: false, follow: false },
      };
    }

    // Security & privacy guard: never leak private profile metadata (name, bio, headline, image)
    if (profile.visibility === 'private') {
      return {
        title: 'Private Profile • Unool',
        description: 'This profile is private and restricted to authorized viewers.',
        robots: { index: false, follow: false },
      };
    }

    const seo = (profile.seo as Record<string, unknown> | null) || {};
    const title =
      (typeof seo.title === 'string' && seo.title.trim()) ||
      (profile.name ? `${profile.name} (@${cleanSubdomain}) • Unool` : `@${cleanSubdomain} • Unool`);
    const description =
      (typeof seo.description === 'string' && seo.description.trim()) ||
      profile.headline ||
      profile.bio ||
      `Explore ${profile.name || `@${cleanSubdomain}`}'s links and content on Unool.`;
    const ogImage =
      (typeof seo.image === 'string' && seo.image.trim()) ||
      profile.avatar_url ||
      undefined;

    const isUnlisted = profile.visibility === 'unlisted';

    return {
      title,
      description,
      ...(isUnlisted ? { robots: { index: false, follow: false } } : {}),
      openGraph: {
        title,
        description,
        type: 'profile',
        ...(ogImage ? { images: [{ url: ogImage }] } : {}),
      },
      twitter: {
        card: ogImage ? 'summary_large_image' : 'summary',
        title,
        description,
        ...(ogImage ? { images: [ogImage] } : {}),
      },
    };
  } catch {
    return {
      title: `${cleanSubdomain} • Unool`,
      robots: { index: false, follow: false },
    };
  }
}

export default function SubdomainProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
