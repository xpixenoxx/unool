'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProfilePreview } from '@/components/profile/ProfilePreview';
import BrandMaterialsPageView from './[slug]/BrandMaterialsPageView';

interface Profile {
  id: string;
  workspaceId: string;
  userId: string;
  subdomain: string;
  name: string | null;
  headline: string | null;
  bio: string | null;
  role: string | null;
  company: string | null;
  avatarUrl: string | null;
  email?: string | null;
  links: any[];
  proofPoints: any[];
  proofs?: any[];
  proof_points?: any[];
  theme: any;
  socialHandles?: any;
  seo?: any;
  sourceUrl: string | null;
  extractionPromptVersion: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

function ProfileLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-3xl" style={{ background: 'linear-gradient(135deg, var(--primary), var(--purple))' }} />
        <p className="text-muted-foreground font-medium">Loading profile...</p>
      </div>
    </div>
  );
}

function ProfileNotFound({ error }: { error: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center p-10">
        <h1 className="text-3xl font-bold text-foreground mb-3">Profile Not Found</h1>
        <p className="text-muted-foreground mb-6">
          {error === 'Profile not found'
            ? 'This profile doesn\'t exist yet. Check the URL or create your own.'
            : 'Unable to load profile. Please try again later.'}
        </p>
        <a href="/signup" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Create Your Profile
        </a>
      </div>
    </div>
  );
}

export default function PublicProfilePage({ params }: { params: Promise<{ subdomain: string }> }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [hasActivityHash, setHasActivityHash] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hash;
      if (h === '#recent-activity' || h === '#activity') {
        setHasActivityHash(true);
      }
    }
  }, []);

  const shouldScrollToActivity = searchParams.get('activity') === '1' || hasActivityHash;
  const targetPage = searchParams.get('page');
  const itemParam = searchParams.get('item') || searchParams.get('file') || searchParams.get('product') || searchParams.get('material');
  const [showcaseData, setShowcaseData] = useState<any>(null);

  // If a ?item=... or ?product=... query string is provided on root subdomain, load showcase
  useEffect(() => {
    let cancelled = false;
    async function loadShowcase() {
      if (!itemParam) return;
      const { subdomain } = await params;
      try {
        const res = await fetch(`/api/brand-materials?subdomain=${subdomain}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.page) {
            setShowcaseData(data);
          }
        }
      } catch (err) {
        console.error('Failed to load showcase item:', err);
      }
    }
    loadShowcase();
    return () => { cancelled = true; };
  }, [itemParam, params]);

  // If a ?page=... query string is provided on root subdomain, smoothly route to the subpage
  useEffect(() => {
    if (targetPage && typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      currentUrl.pathname = `/${targetPage}`;
      currentUrl.searchParams.delete('page');
      window.location.replace(currentUrl.toString());
    }
  }, [targetPage]);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      const { subdomain } = await params;
      console.log('[PublicProfile] Fetching profile for:', subdomain);
      try {
        const refParam = typeof document !== 'undefined' && document.referrer
          ? `?ref=${encodeURIComponent(document.referrer)}`
          : '';
        const response = await fetch(`/api/profile/${subdomain}${refParam}`, {
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
        });
        console.log('[PublicProfile] Response status:', response.status);
        if (!response.ok) {
          if (response.status === 404) {
            if (!cancelled) setError('Profile not found');
          } else {
            const text = await response.text();
            console.error('[PublicProfile] Error response:', text);
            if (!cancelled) setError('Failed to load profile');
          }
          return;
        }
        const data = await response.json();
        console.log('[PublicProfile] Profile data received:', { subdomain: data.subdomain, name: data.name });
        if (!cancelled) setProfile(data);
      } catch (err) {
        console.error('[PublicProfile] Fetch error:', err);
        if (!cancelled) setError('Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [params]);

  // Global Link Click Tracking for "Link Engagement"
  useEffect(() => {
    if (!profile) return;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;
      
      const rawHref = anchor.getAttribute('href') || '';
      // Ignore hash jumps on the same page, javascript, or empty links
      if (!anchor.href || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) {
        return;
      }

      // Extract a clean human-readable label
      const linkText = (
        anchor.getAttribute('data-label') ||
        anchor.getAttribute('aria-label') ||
        anchor.innerText?.trim() ||
        anchor.getAttribute('title') ||
        anchor.href
      ).slice(0, 120);

      const linkType = anchor.href.startsWith('mailto:')
        ? 'email'
        : anchor.href.startsWith('tel:')
        ? 'phone'
        : anchor.href.includes('linkedin.com')
        ? 'linkedin'
        : anchor.href.includes('twitter.com') || anchor.href.includes('x.com')
        ? 'x'
        : anchor.href.includes('instagram.com')
        ? 'instagram'
        : anchor.href.includes('github.com')
        ? 'github'
        : 'website';

      // Send tracking event without blocking navigation
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [{
            eventType: 'link_click',
            workspaceId: profile.workspaceId || (profile as any).workspace_id,
            profileId: profile.id,
            eventData: {
              link_url: anchor.href,
              link_text: linkText,
              link_type: linkType,
            }
          }]
        }),
        keepalive: true
      }).catch(err => console.error('[Analytics] Failed to track click:', err));
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [profile]);

  if (loading) {
    return <ProfileLoading />;
  }

  if (error || !profile) {
    return <ProfileNotFound error={error || 'Profile not found'} />;
  }

  // Get template from profile theme - map old templates to new persona-driven ones
  const rawTemplateId = profile.theme?.template || profile.theme?.preset || 'lone';

  // Migration map for old template IDs to new persona-driven templates
  const templateMigrationMap: Record<string, string> = {
    // Old template names mapped to new persona templates
    'student': 'lone',
    'founder': 'the-visionary',
    'creator': 'the-creator',
    'developer': 'the-builder',
    'minimalist': 'lone',
    'ngo': 'human',
    'premium-opaque': 'the-studio',
    'glossy-premium': 'the-club',
    // Short names without "the-" prefix
    'club': 'the-club',
    'studio': 'the-studio',
    'builder': 'the-builder',
    'visionary': 'the-visionary',
    'hustler': 'the-hustler',
    'aesthete': 'the-aesthete',
    'voice': 'the-voice',
    'machine': 'the-machine',
    // Old essential templates
    'essential-minimal': 'lone',
    'essential-light': 'lone',
    'essential-standard': 'lone',
    'essential-bold': 'the-visionary',
    'essential-max': 'the-visionary',
    // Old professional templates
    'professional-minimal': 'lone',
    'professional-light': 'lone',
    'professional-standard': 'the-visionary',
    'professional-bold': 'the-visionary',
    'professional-max': 'the-visionary',
    // Old creative templates
    'creative-minimal': 'the-creator',
    'creative-light': 'the-creator',
    'creative-standard': 'the-creator',
    'creative-bold': 'the-creator',
    'creative-max': 'the-creator',
    // Old technical templates
    'technical-minimal': 'the-builder',
    'technical-light': 'the-builder',
    'technical-standard': 'the-builder',
    'technical-bold': 'the-builder',
    'technical-max': 'the-builder',
    // Old social templates
    'social-minimal': 'lone',
    'social-light': 'the-creator',
    'social-standard': 'the-creator',
    'social-bold': 'the-creator',
    'social-max': 'the-creator',
  };

  const templateId = templateMigrationMap[rawTemplateId] || rawTemplateId;

  // Normalize raw API data into the PublicProfile shape that templates expect
  const normalizedProfile = {
    ...profile,
    id: profile.id,
    subdomain: profile.subdomain,
    name: profile.name || '',
    headline: profile.headline || '',
    bio: profile.bio || '',
    role: profile.role || '',
    company: profile.company || '',
    avatarUrl: profile.avatarUrl || '',
    email: profile.email || '',
    links: (profile.links || []).map((link: any, i: number) => ({
      id: link.id || `link-${i}`,
      label: link.label || link.title || link.url || 'Link',
      url: link.url || '#',
      icon: link.icon || null,
      clicks: link.clicks || 0,
      order: link.order ?? i,
      isVisible: link.isVisible !== false,
    })),
    proofs: (profile.proofPoints || profile.proofs || profile.proof_points || []).map((proof: any, i: number) => ({
      id: proof.id || `proof-${i}`,
      type: proof.type || 'metric',
      title: proof.title || proof.label || '',
      value: proof.value || '',
      description: proof.description || null,
      icon: proof.icon || null,
      order: proof.order ?? i,
    })),
    theme: {
      template: templateId,
      preset: profile.theme?.preset || 'minimal',
      accentColor: profile.theme?.accentColor || 'var(--color-primary)',
      customCss: profile.theme?.customCss || null,
    },
    socialHandles: profile.socialHandles || {},
    openTo: (profile as any).openTo || [],
    recentActivity: (profile as any).recentActivity ?? null,
    autoScroll: shouldScrollToActivity,
    seo: profile.seo || {
      title: profile.name || 'Profile',
      description: profile.headline || profile.bio || '',
      image: null,
    },
  };

  // If viewing a specific showcase item on the root subdomain (e.g. ?item=crocheting_ball)
  if (itemParam && showcaseData?.page) {
    return (
      <BrandMaterialsPageView
        subdomain={showcaseData.subdomain || profile.subdomain}
        pageData={showcaseData.page}
        profile={showcaseData.profile || { name: profile.name, subdomain: profile.subdomain, avatarUrl: profile.avatarUrl }}
        liveTemplate={showcaseData.liveTemplate || profile.theme?.template}
        searchParams={{ item: itemParam }}
      />
    );
  }

  return (
    <ProfilePreview
      templateId={templateId}
      profile={normalizedProfile}
      isPreview={false}
    />
  );
}