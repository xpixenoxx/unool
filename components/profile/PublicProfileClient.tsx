'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProfilePreview } from '@/components/profile/ProfilePreview';
import BrandMaterialsPageView from '@/app/u/[subdomain]/[slug]/BrandMaterialsPageView';
import { normalizeTemplateId } from '@/lib/profile/templateNormalization';
import type { PublicProfileApiPayload } from '@/lib/profile/publicProfilePayload';

interface PublicProfileClientProps {
  profile: PublicProfileApiPayload;
}

export function PublicProfileClient({ profile }: PublicProfileClientProps) {
  const searchParams = useSearchParams();
  const [hasActivityHash, setHasActivityHash] = useState(false);
  const [showcaseData, setShowcaseData] = useState<any>(null);

  const shouldScrollToActivity = searchParams.get('activity') === '1' || hasActivityHash;
  const targetPage = searchParams.get('page');
  const itemParam =
    searchParams.get('item') ||
    searchParams.get('file') ||
    searchParams.get('product') ||
    searchParams.get('material');
  const isPreviewQuery = searchParams.get('preview') === 'true';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const h = window.location.hash;
      if (h === '#recent-activity' || h === '#activity') {
        setHasActivityHash(true);
      }
    }
  }, []);

  // Load brand showcase when ?item=... / ?product=... is present
  useEffect(() => {
    let cancelled = false;
    async function loadShowcase() {
      if (!itemParam || !profile.subdomain) return;
      try {
        const res = await fetch(`/api/brand-materials?subdomain=${encodeURIComponent(profile.subdomain)}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data.page) {
            setShowcaseData(data);
          }
        }
      } catch {
        // ignore
      }
    }
    void loadShowcase();
    return () => {
      cancelled = true;
    };
  }, [itemParam, profile.subdomain]);

  // Smoothly route ?page=... subpage requests
  useEffect(() => {
    if (targetPage && typeof window !== 'undefined') {
      const currentUrl = new URL(window.location.href);
      const cleanPage = targetPage.replace(/^\/+/, '');
      currentUrl.pathname = currentUrl.pathname.startsWith('/u/')
        ? `${currentUrl.pathname.replace(/\/+$/, '')}/${cleanPage}`
        : `/${cleanPage}`;
      currentUrl.searchParams.delete('page');
      window.location.replace(currentUrl.toString());
    }
  }, [targetPage]);

  const canonicalTemplate = normalizeTemplateId(profile.theme?.template || profile.theme?.preset || 'lone');

  // Lightweight view beacon compatible with ISR 60s SSR
  useEffect(() => {
    if (!profile.id || !profile.workspaceId || isPreviewQuery || profile.visibility === 'private') {
      return;
    }
    const dedupeKey = `unool_viewed_${profile.id}`;
    try {
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(dedupeKey)) {
        return;
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(dedupeKey, '1');
      }
    } catch {
      // ignore storage errors
    }

    const referrer = typeof document !== 'undefined' ? document.referrer : '';
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: [
          {
            eventType: 'profile_view',
            workspaceId: profile.workspaceId,
            profileId: profile.id,
            eventData: {
              template: canonicalTemplate,
              subdomain: profile.subdomain,
              ...(referrer ? { referrer } : {}),
            },
          },
        ],
      }),
      keepalive: true,
    }).catch(() => {
      // non-blocking telemetry
    });
  }, [profile.id, profile.workspaceId, profile.subdomain, profile.visibility, canonicalTemplate, isPreviewQuery]);

  // Global Link Click Tracking for "Link Engagement"
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;

      const rawHref = anchor.getAttribute('href') || '';
      if (!anchor.href || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) {
        return;
      }

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
            : anchor.href.includes('twitter.com') || /(?:^|[\/\.])x\.com(?=[\/\?#:]|$)/i.test(anchor.href)
              ? 'x'
              : anchor.href.includes('instagram.com')
                ? 'instagram'
                : anchor.href.includes('github.com')
                  ? 'github'
                  : 'website';

      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [
            {
              eventType: 'link_click',
              workspaceId: profile.workspaceId,
              profileId: profile.id,
              eventData: {
                template: canonicalTemplate,
                link_url: anchor.href,
                link_text: linkText,
                link_type: linkType,
              },
            },
          ],
        }),
        keepalive: true,
      }).catch(() => {
        // non-blocking telemetry
      });
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [profile.id, profile.workspaceId, canonicalTemplate]);

  if (itemParam && showcaseData?.page) {
    return (
      <BrandMaterialsPageView
        subdomain={showcaseData.subdomain || profile.subdomain || ''}
        pageData={showcaseData.page}
        profile={
          showcaseData.profile || {
            name: profile.name,
            subdomain: profile.subdomain || '',
            avatarUrl: profile.avatarUrl,
          }
        }
        liveTemplate={showcaseData.liveTemplate || canonicalTemplate}
        searchParams={{ item: itemParam }}
      />
    );
  }

  const normalizedForTemplate = {
    ...profile,
    autoScroll: shouldScrollToActivity,
  };

  return (
    <ProfilePreview
      templateId={canonicalTemplate}
      profile={normalizedForTemplate}
      isPreview={false}
    />
  );
}

