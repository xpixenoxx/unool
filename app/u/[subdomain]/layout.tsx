import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const cleanSubdomain = (subdomain || '').toLowerCase().trim();

  if (!cleanSubdomain) {
    return { title: 'Profile • Unool' };
  }

  try {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('name, headline, bio, avatar_url, seo')
      .eq('subdomain', cleanSubdomain)
      .is('deleted_at', null)
      .maybeSingle();

    if (!profile) {
      return {
        title: `${cleanSubdomain} • Unool`,
        description: 'View this creator profile on Unool.',
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

    return {
      title,
      description,
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

