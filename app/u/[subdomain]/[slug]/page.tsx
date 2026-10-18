import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config/schema';
import BrandMaterialsPageView, { BrandMaterialsPageData, CreatorProfile } from './BrandMaterialsPageView';
import Link from 'next/link';
import { ArrowLeft, Layers, Sparkles } from 'lucide-react';

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

interface PageProps {
  params: Promise<{ subdomain: string; slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { subdomain, slug } = await params;

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, workspace_id, name, subdomain, headline, avatar_url')
      .eq('subdomain', subdomain)
      .maybeSingle();

    if (!profile) {
      return {
        title: 'Brand Materials Not Found | UNOOL',
      };
    }

    const { data: page } = await supabase
      .from('brand_materials_pages')
      .select('title, tagline, description')
      .eq('workspace_id', profile.workspace_id)
      .eq('slug', slug)
      .maybeSingle();

    const pageTitle = page?.title || `${profile.name || subdomain}'s Brand Materials`;
    const pageDescription =
      page?.tagline ||
      page?.description ||
      `Explore official brand and product materials curated by @${subdomain} on UNOOL.`;

    return {
      title: `${pageTitle} — @${subdomain} | UNOOL`,
      description: pageDescription,
      openGraph: {
        title: `${pageTitle} — @${subdomain}`,
        description: pageDescription,
        images: profile.avatar_url ? [{ url: profile.avatar_url }] : [],
      },
    };
  } catch {
    return {
      title: 'Brand Materials Showcase | UNOOL',
    };
  }
}

export default async function BrandMaterialsSlugPage({ params, searchParams }: PageProps) {
  const { subdomain, slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  if (!subdomain) {
    notFound();
  }

  // Fetch creator profile including active template theme
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, workspace_id, name, subdomain, headline, role, company, bio, avatar_url, theme')
    .eq('subdomain', subdomain)
    .maybeSingle();

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#08090C] text-[#F4EFE7] flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
          <Layers className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
          <p className="text-sm text-white/60 mb-6">
            The profile for <span className="text-white font-mono">@{subdomain}</span> does not exist or has been updated.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-white/90 transition-all"
          >
            Go to UNOOL Home
          </a>
        </div>
      </div>
    );
  }

  // Fetch brand materials page for this workspace and slug
  const { data: pageData } = await supabase
    .from('brand_materials_pages')
    .select('*')
    .eq('workspace_id', profile.workspace_id)
    .eq('slug', slug)
    .maybeSingle();

  // If page not published or not found yet
  if (!pageData) {
    return (
      <div className="min-h-screen bg-[#08090C] text-[#F4EFE7] flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Materials Page Coming Soon</h1>
          <p className="text-sm text-white/60 mb-6 leading-relaxed">
            <span className="text-white font-semibold">@{subdomain}</span> has not published brand materials under <span className="font-mono text-white/80">/{slug}</span> yet.
          </p>
          <Link
            href={`/u/${subdomain}`}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-white/90 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Visit @{subdomain}'s Main Profile</span>
          </Link>
        </div>
      </div>
    );
  }

  const appUrl = config.NEXT_PUBLIC_APP_URL || 'https://unool.co';

  // Live profile template theme (e.g. 'the-voice', 'lone', 'lover')
  const liveTemplate = (profile.theme as any)?.template || (profile.theme as any)?.preset || (pageData.theme as any)?.template || 'the-voice';

  // Mask Cloudflare URLs on all materials
  const maskUrl = (rawUrl?: string | null): string => {
    if (!rawUrl) return '';
    const matchR2Dev = rawUrl.match(/https?:\/\/[^/]+\.r2\.dev\/(.+)$/);
    if (matchR2Dev) return `/api/media/${matchR2Dev[1]}`;
    const matchR2Storage = rawUrl.match(/https?:\/\/[^/]+\.r2\.cloudflarestorage\.com\/[^/]+\/(.+)$/);
    if (matchR2Storage) return `/api/media/${matchR2Storage[1]}`;
    return rawUrl;
  };

  const creatorProfile: CreatorProfile = {
    name: profile.name,
    subdomain: profile.subdomain,
    avatarUrl: profile.avatar_url,
    role: profile.role,
    company: profile.company,
    bio: profile.bio,
  };

  const materialsPageData: BrandMaterialsPageData = {
    id: pageData.id,
    slug: pageData.slug,
    title: pageData.title,
    tagline: pageData.tagline,
    description: pageData.description,
    primary_cta_label: pageData.primary_cta_label,
    primary_cta_url: pageData.primary_cta_url,
    materials: (pageData.materials || []).map((m: any) => ({
      ...m,
      url: maskUrl(m.url),
      thumbnailUrl: m.thumbnailUrl ? maskUrl(m.thumbnailUrl) : undefined,
    })),
    theme: {
      accentColor: pageData.theme?.accentColor || '#8B5CF6',
      template: liveTemplate,
      ...(pageData.theme || {}),
    },
    is_published: pageData.is_published,
  };

  return (
    <BrandMaterialsPageView
      subdomain={subdomain}
      slug={slug}
      pageData={materialsPageData}
      profile={creatorProfile}
      appUrl={appUrl}
      liveTemplate={liveTemplate}
      searchParams={resolvedSearchParams}
    />
  );
}
