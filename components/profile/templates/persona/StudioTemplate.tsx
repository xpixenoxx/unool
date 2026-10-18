'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from 'react';
import type { TemplateProps, PublicProfile, ProfileLink, ProfileProof } from '@/components/profile/templates/types';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';

// ============================================================
// 00 — TYPE DEFINITIONS (Internal shape for Studio)
// ============================================================
export interface StudioMetric {
  index?: string;
  value: string;
  label: string;
}

export interface StudioSocial {
  platform: string;
  label: string;
  sublabel?: string;
  url: string;
  icon?: string;
}

export interface StudioProject {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string | null;
  tags?: string[];
  link?: string;
  liveUrl?: string;
  caseStudyUrl?: string;
}

export interface StudioProfileData {
  // Identity
  nameLineOne: string;
  nameLineTwo?: string;
  role?: string | null;
  category?: string | null;
  bio?: string;
  location?: string | null;
  availability?: string | null;
  established?: string | number | null;
  edition?: string;
  initial?: string;
  monogram?: string;
  portraitImage?: string | null;
  portraitAlt?: string;
  email?: string | null;
  ctaLabel?: string;
  // Visual
  accentColor?: string;
  // Metrics
  metrics: StudioMetric[];
  // Socials
  socials: StudioSocial[];
  // Projects (for drawer)
  projects: StudioProject[];
  // Footer
  footerStatement?: string;
}

// ============================================================
// 01 — DEFAULT DATA (fallback when profile is empty)
// ============================================================
export const DEFAULT_STUDIO_DATA: StudioProfileData = {
  nameLineOne: 'Studio',
  nameLineTwo: 'Noir',
  role: 'CREATIVE DIRECTOR / FOUNDER',
  category: 'BRAND & DIGITAL STUDIO',
  bio: 'We craft distinctive identities, digital experiences, and brand systems for ambitious ventures.',
  location: null,
  availability: 'Open for commissions',
  established: '2020',
  edition: '04',
  monogram: 'SN',
  initial: 'S',
  portraitImage: null,
  portraitAlt: 'Studio Noir wordmark',
  email: 'hello@studionoir.co',
  ctaLabel: 'START A PROJECT',
  accentColor: '#0A84FF',
  metrics: [
    { index: '01', value: '47', label: 'PROJECTS SHIPPED' },
    { index: '02', value: '12', label: 'TEAM MEMBERS' },
    { index: '03', value: '8', label: 'INDUSTRIES' },
  ],
  socials: [
    {
      platform: 'instagram',
      label: 'INSTAGRAM',
      sublabel: 'SOCIAL / 01',
      url: 'https://instagram.com',
      icon: 'instagram',
    },
    {
      platform: 'linkedin',
      label: 'LINKEDIN',
      sublabel: 'SOCIAL / 02',
      url: 'https://linkedin.com',
      icon: 'linkedin',
    },
    {
      platform: 'twitter',
      label: 'X',
      sublabel: 'SOCIAL / 03',
      url: 'https://x.com',
      icon: 'x',
    },
    {
      platform: 'behance',
      label: 'BEHANCE',
      sublabel: 'SOCIAL / 04',
      url: 'https://behance.net',
      icon: 'behance',
    },
    {
      platform: 'dribbble',
      label: 'DRIBBBLE',
      sublabel: 'SOCIAL / 05',
      url: 'https://dribbble.com',
      icon: 'dribbble',
    },
    {
      platform: 'email',
      label: 'EMAIL',
      sublabel: 'SOCIAL / 06',
      url: 'mailto:hello@studionoir.co',
      icon: 'email',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'AURA WELLNESS',
      subtitle: 'Brand Identity & Digital Experience',
      description:
        'Complete brand overhaul for a premium wellness startup. New identity system, packaging design, and a performant e-commerce experience that increased conversion by 34%.',
      image: null,
      tags: ['Branding', 'Web Design', 'E-commerce', 'Art Direction'],
      link: '#',
      liveUrl: 'https://aurawellness.example.com',
      caseStudyUrl: '#',
    },
    {
      id: 'proj-2',
      title: 'MONOLITH ARCHITECTS',
      subtitle: 'Visual Identity & Motion System',
      description:
        'Architectural practice identity built on structural minimalism. Dynamic logo system, environmental graphics, and motion principles for presentations.',
      image: null,
      tags: ['Branding', 'Motion', 'Environmental', 'Typography'],
      link: '#',
      liveUrl: 'https://monolith.example.com',
      caseStudyUrl: '#',
    },
    {
      id: 'proj-3',
      title: 'KINETIC VENTURES',
      subtitle: 'Fund Brand & Portfolio Platform',
      description:
        'Venture capital fund brand with a data-driven portfolio platform. Real-time portfolio tracking, founder network visualization, and LP reporting tools.',
      image: null,
      tags: ['Branding', 'Product Design', 'Data Viz', 'Web App'],
      link: '#',
      liveUrl: 'https://kinetic.example.com',
      caseStudyUrl: '#',
    },
  ],
  footerStatement: 'CRAFTED WITH INTENTION · EST. 2020',
};

// ============================================================
// 02 — BRAND SVG ICON REGISTRY (matches ClubTemplate pattern)
// ============================================================
export const STUDIO_BRAND_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  linkedin: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.67 1.67 0 1 0 0-3.34 1.67 1.67 0 0 0 0 3.34M7.86 18.5V10.13H5.07V18.5h2.79z" />
    </svg>
  ),
  x: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  twitter: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  behance: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 7h-7v2h7V7zm1.726 10c-.442 1.297-2.029 3-4.976 3-3.401 0-5.75-2.292-5.75-6 0-3.52 2.366-6 5.625-6 3.424 0 5.248 2.388 4.938 5.75h-7.85c.088 1.636 1.037 2.656 2.537 2.656 1.487 0 2.195-.898 2.476-1.406H23.726zM15.713 12h5.188c-.088-1.25-.841-2.25-2.525-2.25-1.57 0-2.451.957-2.663 2.25zM8.307 10.828c.954-.44 1.443-1.277 1.443-2.316 0-2.297-1.889-3.512-4.664-3.512H0v14h5.457c3.12 0 4.993-1.488 4.993-3.898 0-1.742-1.002-3.578-2.143-4.274zM2.871 7.4h2.158c1.336 0 2.08.57 2.08 1.602 0 .977-.732 1.59-2.08 1.59H2.871V7.4zm2.348 9.2H2.871v-3.793h2.387c1.551 0 2.398.715 2.398 1.898 0 1.258-.887 1.895-2.437 1.895z" />
    </svg>
  ),
  dribbble: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.118-10.424c-.389-.12-2.787-.84-5.617-.384.887 2.438 1.247 4.5 1.343 5.111 2.508-1.127 4.274-3.515 4.274-6.327v-.4zm-5.785 6.012c-.12-.768-.504-2.892-1.428-5.351-.048.012-.096.024-.144.036-6.192 1.944-8.411 5.832-8.543 6.072 1.584 1.092 3.492 1.74 5.556 1.74 1.668 0 3.228-.432 4.559-1.497zm-11.231-.768c.24-.396 2.64-4.2 8.687-6.036.192-.06.384-.108.576-.156-.372-.828-.78-1.644-1.224-2.436-5.064 1.524-9.924 1.524-10.428 1.524-.012.216-.012.432-.012.66 0 2.508.972 4.8 2.401 6.444zm-3.085-8.496c.72-.012 4.968-.072 9.84-1.464-1.572-2.796-3.276-5.184-3.528-5.532-3.132 1.344-5.4 4.176-6.312 7zm8.136-7.8c.264.36 1.956 2.724 3.516 5.484 2.928-.792 5.568-.78 5.868-.768A9.974 9.974 0 0012 2.016c-.66 0-1.308.06-1.86.108zm10.74 6.372c-.444-.012-3.216-.024-6.3 1.008.384.744.732 1.512 1.056 2.292 2.724-.396 5.088.192 5.376.264.084-.696.12-1.392.12-2.1 0-.504-.072-1-.252-1.464z" />
    </svg>
  ),
  email: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  website: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  github: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  ),
  generic: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
};

// ============================================================
// 03 — SOCIAL ICON HELPERS (same pattern as ClubTemplate)
// ============================================================
export function normalizeStudioSocialPlatformKey(
  label?: string,
  href?: string,
  explicitIcon?: string
): string {
  if (explicitIcon) {
    const norm = explicitIcon.toLowerCase().trim();
    if (STUDIO_BRAND_ICONS[norm]) return norm;
    if (norm === 'twitter') return 'x';
    if (norm === 'substack') return 'newsletter';
    if (norm === 'mail') return 'email';
    if (norm === 'web' || norm === 'site') return 'website';
  }

  if (label) {
    const l = label.toLowerCase().trim();
    if (l === 'instagram' || l.includes('instagram') || l.includes('insta')) return 'instagram';
    if (l === 'linkedin' || l.includes('linkedin')) return 'linkedin';
    if (l === 'x' || l === 'twitter' || l.includes('twitter') || l.includes('x.com')) return 'x';
    if (l === 'behance' || l.includes('behance')) return 'behance';
    if (l === 'dribbble' || l.includes('dribbble')) return 'dribbble';
    if (l === 'github' || l.includes('github')) return 'github';
    if (l === 'email' || l === 'mail' || l.includes('email') || l.includes('contact')) return 'email';
    if (l === 'website' || l === 'web' || l === 'portfolio') return 'website';
  }

  if (href) {
    try {
      const urlStr = href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')
        ? href
        : `https://${href}`;
      if (urlStr.startsWith('mailto:')) return 'email';
      const hostname = new URL(urlStr).hostname.toLowerCase();
      if (hostname.includes('instagram.com')) return 'instagram';
      if (hostname.includes('linkedin.com')) return 'linkedin';
      if (hostname.includes('x.com') || hostname.includes('twitter.com')) return 'x';
      if (hostname.includes('behance.net')) return 'behance';
      if (hostname.includes('dribbble.com')) return 'dribbble';
      if (hostname.includes('github.com')) return 'github';
      if (hostname.includes('substack.com')) return 'newsletter';
    } catch {
      // ignore
    }
  }

  return 'generic';
}

export function renderStudioSocialIcon(platformKey: string, className = 'w-4 h-4') {
  const IconComponent = STUDIO_BRAND_ICONS[platformKey] || STUDIO_BRAND_ICONS['generic'];
  return <IconComponent className={className} />;
}

// ============================================================
// 04 — DATA ADAPTER (PublicProfile → StudioProfileData)
// ============================================================
export function adaptPublicProfileToStudio(
  profile?: PublicProfile | null,
  directData?: Partial<StudioProfileData>
): StudioProfileData {
  const rawName = (directData?.nameLineOne
    ? `${directData.nameLineOne} ${directData.nameLineTwo || ''}`
    : profile?.name || ''
  ).trim();
  const nameParts = rawName ? rawName.split(/\s+/) : ['Studio', 'Noir'];
  const nameLineOne = directData?.nameLineOne || nameParts[0] || 'Studio';
  const nameLineTwo =
    directData?.nameLineTwo !== undefined
      ? directData.nameLineTwo
      : nameParts.slice(1).join(' ') || '';

  const initial = directData?.initial || (nameLineOne ? nameLineOne.charAt(0).toUpperCase() : 'S');
  const monogram =
    directData?.monogram ||
    (nameLineOne.charAt(0) + (nameLineTwo ? nameLineTwo.charAt(0) : '')).toUpperCase() ||
    'SN';

  // Role resolution
  const role = directData?.role !== undefined ? directData.role : profile?.role || profile?.headline || null;

  // Category kicker: NEVER promote company name to category
  let category: string | null = null;
  if (directData?.category) {
    category = directData.category;
  } else if ((profile as any)?.category) {
    const cat = (profile as any).category;
    const comp = profile?.company || (profile as any)?.employer || (profile as any)?.organization;
    if (!comp || cat.trim().toLowerCase() !== comp.trim().toLowerCase()) {
      category = cat;
    } else if (role) {
      category = role;
    }
  } else if (role) {
    category = role;
  }

  const bio = directData?.bio !== undefined ? directData.bio : profile?.bio || '';

  const location = directData?.location !== undefined
    ? directData.location
    : (profile as any)?.location || null;

  const availability = directData?.availability !== undefined
    ? directData.availability
    : (profile as any)?.availability || null;

  const established = directData?.established !== undefined
    ? directData.established
    : (profile as any)?.established || null;

  const edition = directData?.edition || '01';

  // Social links extraction
  const socialList: StudioSocial[] = [];

  if (directData?.socials && directData.socials.length > 0) {
    directData.socials.forEach((s, idx) => {
      if (s && s.url) {
        const resolvedPlatform = normalizeStudioSocialPlatformKey(s.label, s.url, s.icon);
        socialList.push({
          platform: resolvedPlatform,
          label: (s.label || 'LINK').toUpperCase(),
          sublabel: s.sublabel || `SOCIAL / 0${idx + 1}`,
          url: s.url,
          icon: s.icon || resolvedPlatform,
        });
      }
    });
  } else {
    const rawLinks = profile?.links || [];
    const links = (rawLinks || []).filter((l: ProfileLink) => l && l.url && l.isVisible !== false);

    if (links.length > 0) {
      links.slice(0, 6).forEach((link, idx) => {
        const resolvedPlatform = normalizeStudioSocialPlatformKey(link.label, link.url, link.icon || undefined);
        socialList.push({
          platform: resolvedPlatform,
          label: (link.label || 'LINK').toUpperCase(),
          sublabel: `SOCIAL / 0${idx + 1}`,
          url: link.url,
          icon: link.icon || resolvedPlatform,
        });
      });
    } else if (profile?.socialHandles && Object.keys(profile.socialHandles).length > 0) {
      const keys = Object.keys(profile.socialHandles);
      keys.slice(0, 6).forEach((key, idx) => {
        const val = profile.socialHandles![key];
        if (!val) return;
        let url = val;
        if (!val.startsWith('http://') && !val.startsWith('https://') && !val.startsWith('mailto:')) {
          if (key.toLowerCase() === 'instagram') url = `https://instagram.com/${val.replace('@', '')}`;
          else if (key.toLowerCase() === 'github') url = `https://github.com/${val.replace('@', '')}`;
          else if (key.toLowerCase() === 'linkedin') url = `https://linkedin.com/in/${val}`;
          else if (key.toLowerCase() === 'youtube') url = `https://youtube.com/@${val}`;
          else if (key.toLowerCase() === 'twitter' || key.toLowerCase() === 'x') url = `https://x.com/${val.replace('@', '')}`;
          else if (key.toLowerCase() === 'behance') url = `https://behance.net/${val}`;
          else if (key.toLowerCase() === 'dribbble') url = `https://dribbble.com/${val}`;
          else url = `https://${val}`;
        }
        const resolvedPlatform = normalizeStudioSocialPlatformKey(key, url, key);
        socialList.push({
          platform: resolvedPlatform,
          label: key.toUpperCase(),
          sublabel: `SOCIAL / 0${idx + 1}`,
          url,
          icon: resolvedPlatform,
        });
      });
    }
  }

  // Metrics extraction
  const rawMetrics = directData?.metrics || profile?.proofs || (profile as any)?.proofPoints || (profile as any)?.proof_points || [];
  const metricList: StudioMetric[] = [];

  if (Array.isArray(rawMetrics) && rawMetrics.length > 0) {
    rawMetrics.slice(0, 3).forEach((item: any, idx: number) => {
      const val = (item.value || item.stat || item.count || item.number || '').toString().trim();
      let lbl = '';
      const candidates = [item.label, item.title, item.name, item.description];
      for (const c of candidates) {
        if (typeof c === 'string' && c.trim().length > 0) {
          const trimmed = c.trim();
          if (!/^metric\s*0?\d+$/i.test(trimmed) && !/^proof\s*0?\d+$/i.test(trimmed)) {
            lbl = trimmed;
            break;
          }
        }
      }
      if (!lbl) {
        const defaultLabels = ['PROJECTS SHIPPED', 'TEAM MEMBERS', 'INDUSTRIES'];
        lbl = defaultLabels[idx] || `SIGNAL 0${idx + 1}`;
      }
      if (val || lbl) {
        metricList.push({
          index: `0${idx + 1}`,
          value: val || '—',
          label: lbl.toUpperCase(),
        });
      }
    });
  }

  // Email & CTA
  const email = directData?.email !== undefined
    ? directData.email
    : (profile as any)?.email || profile?.socialHandles?.email || null;

  const firstName = (nameLineOne || '').toUpperCase();
  const ctaLabel = directData?.ctaLabel || (firstName && firstName !== 'THE' ? `WORK WITH ${firstName}` : 'START A PROJECT');

  // Projects extraction
  const rawProjects = directData?.projects || (profile as any)?.projects || [];
  const projectList: StudioProject[] = Array.isArray(rawProjects)
    ? rawProjects.map((p: any, i: number) => ({
        id: p.id || `proj-${i}`,
        title: p.title || p.name || `Project ${i + 1}`,
        subtitle: p.subtitle || p.tagline || '',
        description: p.description || p.body || '',
        image: p.image || p.thumbnail || p.coverImage || null,
        tags: p.tags || p.categories || [],
        link: p.link || p.url || '#',
        liveUrl: p.liveUrl || p.demoUrl || p.url,
        caseStudyUrl: p.caseStudyUrl || p.caseStudy || p.studyUrl,
      }))
    : [];

  return {
    nameLineOne,
    nameLineTwo,
    role: role ? role.toUpperCase() : null,
    category: category ? category.toUpperCase() : null,
    bio,
    location,
    availability,
    established,
    edition,
    initial,
    monogram,
    portraitImage: directData?.portraitImage !== undefined ? directData.portraitImage : profile?.avatarUrl || null,
    portraitAlt: directData?.portraitAlt || `Editorial portrait of ${nameLineOne} ${nameLineTwo}`,
    email,
    ctaLabel,
    accentColor: directData?.accentColor || (profile as any)?.theme?.accentColor || '#0A84FF',
    metrics: metricList,
    socials: socialList,
    projects: projectList,
    footerStatement: directData?.footerStatement || 'CRAFTED WITH INTENTION · EST. 2020',
  };
}

// ============================================================
// 05 — ICON COMPONENTS
// ============================================================
function ArrowUpRightIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="12" x2="12" y2="4" />
      <polyline points="5 4 12 4 12 11" />
    </svg>
  );
}

function ArrowRightIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="8" x2="12" y2="8" />
      <polyline points="8 4 12 8 8 12" />
    </svg>
  );
}

function ChevronRightIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="5 12 11 8 5 4" />
    </svg>
  );
}

function CheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 8 6 11 13 4" />
    </svg>
  );
}

function ExternalLinkIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="12" x2="12" y2="4" />
      <polyline points="5 4 12 4 12 11" />
    </svg>
  );
}

function ClockIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="8" r="7" />
      <path d="M8 4v4l2 2" />
    </svg>
  );
}

function MapPinIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 14c-3 0-4-2-4-4s1-4 4-4 4 2 4 4-1 4-4 4z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

function MailIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="12" height="10" rx="1.5" />
      <path d="M3 3l5 3.5 5-3.5" />
    </svg>
  );
}

function DownloadIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3v10M4 11l4 4 4-4" />
    </svg>
  );
}

function CopyIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="7" y="2" width="7" height="10" rx="1" />
      <rect x="2" y="7" width="7" height="7" rx="1" />
    </svg>
  );
}

function CalendarIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="12" height="10" rx="2" />
      <path d="M6 4v-2M10 4v-2M2 9h12" />
    </svg>
  );
}

function UsersIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 14c2 0 3-1.5 3-3s-1-3-3-3-3 1.5-3 3 1 3 3 3z" />
      <path d="M5 14c0-1.5 1-2.5 2-3" />
      <path d="M14 14c-1.5 0-2.5-1-3-2" />
      <circle cx="13" cy="5" r="2" />
      <circle cx="7" cy="5" r="2" />
    </svg>
  );
}

function BriefcaseIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="12" height="9" rx="1" />
      <path d="M4 5V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function GlobeIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="8" r="7" />
      <line x1="8" y1="1" x2="8" y2="15" />
      <path d="M1 8a7 7 0 0 1 14 0" />
    </svg>
  );
}

function XIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="4" x2="12" y2="12" />
      <line x1="12" y1="4" x2="4" y2="12" />
    </svg>
  );
}

// ============================================================
// 06 — TOAST SYSTEM (copy email, vCard saved, etc.)
// ============================================================
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info';
}

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-[8px] text-xs font-medium
            shadow-[0_8px_24px_rgba(0,0,0,0.15)] backdrop-blur-md border
            animate-in fade-in slide-in-from-right-4 duration-200 ease-out
            ${toast.type === 'success'
              ? 'bg-white border-[var(--ink)]/15 text-[var(--ink)]'
              : 'bg-[var(--ink)] border-[var(--ink)]/15 text-white'}
          `}
          role="alert"
        >
          {toast.type === 'success' ? (
            <CheckIcon className="w-4 h-4 shrink-0 text-[var(--wine)]" />
          ) : (
            <CopyIcon className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="ml-1 p-0.5 hover:bg-black/5 rounded transition-colors"
            aria-label="Dismiss"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 07 — PROJECT DRAWER (slides from right)
// ============================================================
interface ProjectDrawerProps {
  project: StudioProject | null;
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
}

function ProjectDrawer({ project, isOpen, onClose, accentColor }: ProjectDrawerProps) {
  if (!project || !isOpen) return null;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const prefersReducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      onClick={onClose}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Drawer Panel */}
      <motion.aside
        className="w-full max-w-[480px] h-full bg-white border-l border-[var(--ink)]/10 overflow-y-auto"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300, duration: prefersReducedMotion ? 0 : 0.4 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 md:p-6 border-b border-[var(--ink)]/10 bg-white/95 backdrop-blur-sm">
          <h2 id="drawer-title" className="font-club-serif text-[20px] md:text-[24px] font-medium text-[var(--ink)]">
            {project.title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[var(--ink)]/5 transition-colors"
            aria-label="Close project drawer"
          >
            <XIcon className="w-5 h-5 text-[var(--ink)]/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6">
          {project.subtitle && (
            <p className="text-[14px] md:text-[16px] text-[var(--ink)]/60 font-medium">
              {project.subtitle}
            </p>
          )}

          {project.description && (
            <p className="text-[15px] md:text-[17px] leading-[1.7] text-[var(--ink)]/75 font-normal">
              {project.description}
            </p>
          )}

          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.1em] rounded-full"
                  style={{
                    backgroundColor: `${accentColor}15`,
                    color: accentColor,
                    border: `1px solid ${accentColor}40`,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 border-t border-[var(--ink)]/10 flex flex-col gap-3">
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-[8px] font-semibold text-[13px] uppercase tracking-[0.1em] transition-all"
                style={{
                  backgroundColor: accentColor,
                  color: '#fff',
                }}
              >
                <GlobeIcon className="w-4 h-4" />
                View Live Site
              </a>
            )}
            {project.caseStudyUrl && (
              <a
                href={project.caseStudyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-[8px] font-semibold text-[13px] uppercase tracking-[0.1em] transition-all border border-[var(--ink)]/20 text-[var(--ink)] hover:bg-[var(--ink)]/5"
              >
                <ExternalLinkIcon className="w-4 h-4" />
                Read Case Study
              </a>
            )}
            {project.link && !project.liveUrl && !project.caseStudyUrl && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-[8px] font-semibold text-[13px] uppercase tracking-[0.1em] transition-all border border-[var(--ink)]/20 text-[var(--ink)] hover:bg-[var(--ink)]/5"
              >
                <ExternalLinkIcon className="w-4 h-4" />
                View Project
              </a>
            )}
          </div>
        </div>
      </motion.aside>
    </div>
  );
}

// Need to import motion for ProjectDrawer
import { motion } from 'framer-motion';

// ============================================================
// 08 — AVAILABILITY PILL COMPONENT
// ============================================================
interface AvailabilityPillProps {
  status: 'open' | 'busy' | 'closed' | null;
  label?: string;
  accentColor: string;
}

function AvailabilityPill({ status, label, accentColor }: AvailabilityPillProps) {
  if (!status) return null;

  const statusConfig = {
    open: { dotColor: '#10B981', bgColor: '#10B98115', borderColor: '#10B98140', defaultLabel: 'Open for work' },
    busy: { dotColor: '#F59E0B', bgColor: '#F59E0B15', borderColor: '#F59E0B40', defaultLabel: 'Busy' },
    closed: { dotColor: '#EF4444', bgColor: '#EF444415', borderColor: '#EF444440', defaultLabel: 'Not accepting work' },
  };

  const config = statusConfig[status];

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full"
      style={{
        backgroundColor: config.bgColor,
        border: `1px solid ${config.borderColor}`,
      }}
      title={label || config.defaultLabel}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ backgroundColor: config.dotColor }}
        aria-hidden="true"
      />
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: config.dotColor }}>
        {label || config.defaultLabel}
      </span>
    </div>
  );
}

// ============================================================
// 09 — LIVE CLOCK COMPONENT
// ============================================================
function LiveClock({ timezone = 'local', accentColor }: { timezone?: string; accentColor: string }) {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const updateTime = () => setTime(new Date());
    // Update at the start of each minute
    const now = new Date();
    const msToNextMinute = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());
    const timeout = setTimeout(() => {
      updateTime();
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
    }, msToNextMinute);
    return () => clearTimeout(timeout);
  }, []);

  const formattedTime = useMemo(() => {
    if (timezone === 'local' || !timezone) {
      return time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    try {
      return time.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: timezone,
      });
    } catch {
      return time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    }
  }, [time, timezone]);

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--ink)]/5 border border-[var(--ink)]/10">
      <ClockIcon className="w-3.5 h-3.5 text-[var(--ink)]/50" />
      <span className="font-mono text-[11px] font-medium tabular-nums text-[var(--ink)]">{formattedTime}</span>
    </div>
  );
}

// ============================================================
// 10 — MAIN STUDIO TEMPLATE COMPONENT
// ============================================================
export interface StudioTemplateProps extends Partial<TemplateProps> {
  data?: Partial<StudioProfileData>;
  templateId?: string;
}

export function StudioTemplate({
  profile,
  accentColor,
  isPreview = false,
  onLinkClick,
  data: directData,
}: StudioTemplateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const accent = useMemo(() => accentColor || '#0A84FF', [accentColor]);

  // Compute profile data strictly from real input
  const studioData = useMemo(() => {
    return adaptPublicProfileToStudio(profile, directData);
  }, [profile, directData]);

  // State for interactivity
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [drawerProject, setDrawerProject] = useState<StudioProject | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Toast helpers
  const showToast = useCallback((message: string, type: 'success' | 'info' = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleCopyEmail = useCallback(() => {
    if (studioData.email) {
      navigator.clipboard.writeText(studioData.email);
      showToast(`Copied: ${studioData.email}`, 'success');
    }
  }, [studioData.email, showToast]);

  const handleDownloadVCard = useCallback(() => {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${studioData.nameLineTwo ? `${studioData.nameLineOne};${studioData.nameLineTwo}` : studioData.nameLineOne};;;;`,
      `FN:${studioData.nameLineOne} ${studioData.nameLineTwo || ''}`,
      studioData.role ? `TITLE:${studioData.role}` : '',
      studioData.category ? `ORG:${studioData.category}` : '',
      studioData.email ? `EMAIL:${studioData.email}` : '',
      typeof window !== 'undefined' ? `URL:${window.location.origin}` : '',
      'END:VCARD',
    ]
      .filter(Boolean)
      .join('\n');

    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(studioData.nameLineOne + (studioData.nameLineTwo ? '_' + studioData.nameLineTwo : '')).replace(/\s+/g, '_') || 'Studio'}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Contact vCard saved!', 'success');
  }, [studioData, showToast]);

  const handleSocialClick = useCallback(
    (social: StudioSocial) => {
      if (onLinkClick) {
        onLinkClick({
          id: social.platform,
          label: social.label,
          url: social.url,
          icon: social.icon || null,
          clicks: 0,
          order: 0,
          isVisible: true,
        });
      }
    },
    [onLinkClick]
  );

  const handleProjectClick = useCallback((project: StudioProject) => {
    setDrawerProject(project);
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => setDrawerProject(null), 300);
  }, []);

  const mailtoHref = useMemo(() => {
    if (studioData.email) {
      return `mailto:${studioData.email}?subject=Project%20Inquiry%20via%20Studio%20Profile`;
    }
    return '#';
  }, [studioData.email]);

  // Scroll reveal
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const sections = containerRef.current?.querySelectorAll<HTMLElement>('.studio-reveal-section');
    if (!sections || sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('studio-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    sections.forEach((sec) => observer.observe(sec));
    return () => observer.disconnect();
  }, []);

  const prefersReducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  return (
    <div className="studio-template-root min-h-screen w-full bg-[var(--studio-bg)] text-[var(--studio-ink)] py-8 md:py-16 px-3 md:px-6 md:px-8 flex justify-center items-start selection:bg-[var(--studio-accent)] selection:text-white">
      {/* Editorial Fonts & Design Tokens */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=JetBrains+Mono:wght@400;500;600&display=swap');

        :root {
          --studio-bg: #FAFAF9;
          --studio-surface: #FFFFFF;
          --studio-surface-elevated: #FFFFFF;
          --studio-ink: #1A1A2E;
          --studio-ink-soft: #4A4A68;
          --studio-muted: #6B6B8A;
          --studio-rule: rgba(26,26,46,0.08);
          --studio-rule-strong: rgba(26,26,46,0.15);
          --studio-accent: ${accent};
          --studio-accent-soft: ${accent}15;
          --studio-accent-border: ${accent}40;
          --studio-success: #10B981;
          --studio-warning: #F59E0B;
          --studio-error: #EF4444;
        }

        .studio-template-root .font-studio-sans {
          font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .studio-template-root .font-studio-serif {
          font-family: 'Playfair Display', Georgia, serif;
        }

        .studio-template-root .font-studio-mono {
          font-family: 'JetBrains Mono', "SF Mono", "Fira Code", monospace;
        }

        .studio-chamfer {
          clip-path: polygon(12px 0, 100% 0, 100% 100%, 0 100%, 0 12px);
        }

        @media (min-width: 768px) {
          .studio-metrics-desktop { display: grid !important; }
          .studio-metrics-mobile { display: none !important; }
        }
        @media (max-width: 767px) {
          .studio-metrics-desktop { display: none !important; }
          .studio-metrics-mobile { display: block !important; }
        }

        .studio-reveal-section {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .studio-reveal-section.studio-revealed {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .studio-reveal-section {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
          .studio-lift:hover {
            transform: none !important;
          }
        }

        /* Scrollbar styling for social rail */
        .studio-social-rail::-webkit-scrollbar { height: 6px; }
        .studio-social-rail::-webkit-scrollbar-track { background: transparent; }
        .studio-social-rail::-webkit-scrollbar-thumb { background: var(--studio-rule-strong); border-radius: 3px; }
        .studio-social-rail::-webkit-scrollbar-thumb:hover { background: var(--studio-muted); }
      `}} />

      {/* Toast Stack */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {/* Project Drawer */}
      <ProjectDrawer
        project={drawerProject}
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        accentColor={accent}
      />

      {/* Main Profile Shell */}
      <article
        ref={containerRef}
        aria-label={`${studioData.nameLineOne} ${studioData.nameLineTwo} — Studio Profile`}
        className="font-studio-sans relative w-full max-w-[420px] md:w-[min(980px,calc(100vw-80px))] md:max-w-[980px] md:my-8 bg-[var(--studio-surface)] border border-[var(--studio-rule)] rounded-[24px] md:rounded-[28px] shadow-[0_24px_48px_-16px_rgba(26,26,46,0.08)] overflow-hidden transition-all duration-300"
      >
        {/* Registration Corner Marks */}
        <div className="pointer-events-none absolute top-3 left-3 w-3 h-3 border-t border-l border-[var(--studio-rule)]" aria-hidden="true" />
        <div className="pointer-events-none absolute top-3 right-3 w-3 h-3 border-t border-r border-[var(--studio-rule)]" aria-hidden="true" />

        {/* ========================================================
            TOP BAR — Edition + Live Clock
        ======================================================== */}
        <header className="relative pt-4 md:pt-5 pb-3 px-5 md:px-6">
          <div className="flex items-center justify-between">
            {/* Left: Edition Badge */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-studio-mono font-semibold tracking-[0.2em] uppercase text-[var(--studio-muted)]">
                EDITION
              </span>
              <span
                className="px-2 py-0.5 rounded-[4px] text-[9px] font-studio-mono font-semibold tracking-[0.15em] uppercase"
                style={{
                  backgroundColor: `${accent}15`,
                  color: accent,
                  border: `1px solid ${accent}40`,
                }}
              >
                {studioData.edition || '01'}
              </span>
            </div>

            {/* Right: Live Clock */}
            <LiveClock timezone={(profile as any)?.timezone} accentColor={accent} />
          </div>

          {/* Divider with center mark */}
          <div className="relative mt-3 w-full flex items-center justify-center">
            <div className="w-full h-[1px] bg-[var(--studio-rule)]" />
            <div className="absolute bg-[var(--studio-surface)] px-2 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
            </div>
          </div>
        </header>

        {/* ========================================================
            01 — IDENTITY SECTION
        ======================================================== */}
        <section id="identity" aria-label="Identity" className="studio-reveal-section px-5 md:px-[40px] pt-3 md:pt-[28px] pb-5 md:pb-[28px]">
          {/* Section Header */}
          <div className="flex items-baseline justify-between gap-3 mb-4 md:mb-5">
            <h2 className="text-[9px] font-studio-mono font-bold tracking-[0.22em] uppercase text-[var(--studio-muted)] whitespace-nowrap">
              01 / IDENTITY
            </h2>
            {studioData.category && (
              <span className="text-[8px] font-studio-mono font-medium tracking-[0.2em] uppercase text-[var(--studio-muted)] text-right truncate max-w-[40%]">
                {studioData.category}
              </span>
            )}
          </div>

          {/* Two-Column: Portrait + Info */}
          <div className="grid grid-cols-1 md:grid-cols-[28%_72%] gap-6 md:gap-12 items-start">
            {/* Left: Portrait */}
            <div className="flex flex-col items-center md:items-start shrink-0">
              <div
                className="studio-lift relative w-[140px] md:w-full aspect-[3/4] transition-all duration-500 ease-out hover:-translate-y-1 cursor-pointer group"
                tabIndex={0}
                role="img"
                aria-label={studioData.portraitAlt}
              >
                {studioData.portraitImage ? (
                  <div className="relative w-full h-full studio-chamfer bg-[var(--studio-surface-elevated)] overflow-hidden border border-[var(--studio-rule-strong)] shadow-[0_8px_24px_rgba(26,26,46,0.06)]">
                    <img
                      src={studioData.portraitImage}
                      alt={studioData.portraitAlt}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                    />
                    <div className="pointer-events-none absolute inset-0 studio-chamfer border border-[var(--studio-rule)]" />
                    <div className="absolute bottom-2 left-2 font-studio-serif italic font-semibold text-[22px] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] select-none">
                      {studioData.initial}
                    </div>
                  </div>
                ) : (
                  /* Abstract Editorial Artwork */
                  <div className="relative w-full h-full studio-chamfer bg-[var(--studio-surface-elevated)] overflow-hidden border border-[var(--studio-rule-strong)] shadow-[inset_0_0_20px_rgba(26,26,46,0.04)]">
                    <svg viewBox="0 0 140 180" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="140" height="180" fill="#F5F5F3" />
                      <line x1="18" y1="0" x2="18" y2="180" stroke="var(--studio-ink)" strokeWidth="0.5" strokeOpacity="0.3" />
                      <line x1="0" y1="20" x2="140" y2="130" stroke="var(--studio-ink)" strokeWidth="0.6" strokeOpacity="0.35" />
                      <line x1="30" y1="0" x2="115" y2="180" stroke="var(--studio-ink)" strokeWidth="0.4" strokeOpacity="0.2" />

                      {/* Accent geometric forms */}
                      <rect x="85" y="55" width="32" height="32" rx="4" style={{ fill: accent, opacity: 0.9 }} />
                      <circle cx="95" cy="65" r="3" fill="var(--studio-ink)" />
                      <path d="M 0,120 Q 40,105 75,120 Q 110,135 140,125 L 140,180 L 0,180 Z" style={{ fill: accent, opacity: 0.15 }} />

                      <text x="20" y="158" fontFamily="'Playfair Display', Georgia, serif" fontSize="30" fontStyle="italic" fontWeight="600" fill="var(--studio-ink)" className="select-none" opacity="0.4">
                        {studioData.initial}
                      </text>

                      <polygon points="16,1 138,1 138,179 1,179 1,18" stroke="var(--studio-ink)" strokeWidth="0.6" strokeOpacity="0.25" fill="none" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Availability Pill (below portrait on mobile, inline on desktop) */}
              {(studioData.availability || studioData.location) && (
                <div className="mt-4 w-full md:w-auto flex items-center justify-center md:justify-start gap-2 flex-wrap">
                  <AvailabilityPill status={(studioData.availability ? 'open' : null) as any} label={studioData.availability || undefined} accentColor={accent} />
                  {studioData.location && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--studio-rule)] border border-[var(--studio-rule-strong)]">
                      <MapPinIcon className="w-3.5 h-3.5 text-[var(--studio-muted)]" />
                      <span className="text-[10px] font-studio-mono font-medium uppercase tracking-[0.1em] text-[var(--studio-muted)]">
                        {studioData.location}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Profile Info */}
            <div className="flex flex-col justify-start pt-0 md:pt-1 min-w-0">
              {studioData.role && (
                <div className="text-[9px] md:text-[10px] font-studio-mono font-bold tracking-[0.25em] uppercase mb-2 md:mb-3" style={{ color: accent }}>
                  {studioData.role}
                </div>
              )}

              <h1 className="font-studio-serif tracking-[-0.02em] leading-[0.9] select-text">
                <span className="block text-[44px] md:text-[clamp(4.5rem,7vw,7.5rem)] font-medium text-[var(--studio-ink)]">
                  {studioData.nameLineOne}
                </span>
                {studioData.nameLineTwo && (
                  <span className="block text-[44px] md:text-[clamp(4.5rem,7vw,7.5rem)] font-medium italic text-[var(--studio-ink)]/70 leading-[0.95]">
                    {studioData.nameLineTwo}
                  </span>
                )}
              </h1>

              {studioData.bio && (
                <p className="text-[14px] md:text-[16px] leading-[1.6] md:leading-[1.55] text-[var(--studio-ink-soft)] font-normal mt-4 md:mt-6 max-w-[280px] md:max-w-[90%]">
                  {studioData.bio}
                </p>
              )}

              {/* Established */}
              {studioData.established && (
                <div className="mt-4 pt-3 border-t border-[var(--studio-rule)] flex items-center gap-2 text-[10px] font-studio-mono font-medium uppercase tracking-[0.15em] text-[var(--studio-muted)]">
                  <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>Est. {studioData.established}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================
            02 — METRICS / SIGNALS SECTION
        ======================================================== */}
        {studioData.metrics && studioData.metrics.length > 0 && (
          <section id="signals" aria-label="Key Signals" className="studio-reveal-section px-5 md:px-[40px] pt-2 md:pt-[16px] pb-4 md:pb-[20px]">
            <div className="flex items-baseline justify-between gap-3 mb-3 md:mb-4">
              <h2 className="text-[9px] font-studio-mono font-bold tracking-[0.22em] uppercase text-[var(--studio-muted)] whitespace-nowrap">
                02 / SIGNALS
              </h2>
              <span className="text-[8px] font-studio-mono font-medium tracking-[0.2em] uppercase text-[var(--studio-muted)]">
                SELECTED METRICS
              </span>
            </div>

            {/* Desktop */}
            <div className="studio-metrics-desktop relative bg-[var(--studio-surface-elevated)] border-t border-b border-[var(--studio-rule-strong)] py-3 md:py-[20px] px-3 md:px-[40px]">
              <div className="pointer-events-none absolute top-1 left-1.5 w-2 h-2 border-t border-l" style={{ borderColor: accent }} aria-hidden="true" />
              <div className="pointer-events-none absolute top-1 right-1.5 w-2 h-2 border-t border-r" style={{ borderColor: accent }} aria-hidden="true" />

              <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'var(--studio-rule)' }}>
                {studioData.metrics.map((metric, idx) => (
                  <div key={idx} className={`flex flex-col px-2 md:px-4 relative ${idx === 0 ? 'pl-1 md:pl-2' : ''}`}>
                    <div className="flex justify-end mb-1">
                      <span className="text-[7px] font-studio-mono tracking-wider text-[var(--studio-muted)]">
                        {metric.index || `0${idx + 1}`}
                      </span>
                    </div>
                    <div className="font-studio-serif text-[32px] md:text-[40px] font-medium leading-none text-[var(--studio-ink)] my-1">
                      {metric.value}
                    </div>
                    <div className="text-[7.5px] md:text-[8px] font-studio-mono font-semibold tracking-[0.16em] uppercase text-[var(--studio-muted)] leading-tight">
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile */}
            <div className="studio-metrics-mobile relative bg-[var(--studio-surface-elevated)] border border-[var(--studio-rule)] rounded-[8px] divide-y overflow-hidden shadow-sm" style={{ borderColor: 'var(--studio-rule)' }}>
              {studioData.metrics.map((metric, idx) => (
                <div key={idx} className="flex items-baseline justify-between px-3.5 py-3 relative group">
                  <div className="pointer-events-none absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r" style={{ borderColor: accent }} aria-hidden="true" />
                  <div className="flex items-baseline gap-2.5 min-w-0 pr-2">
                    <span className="font-studio-serif text-[28px] font-medium leading-none text-[var(--studio-ink)] shrink-0">
                      {metric.value}
                    </span>
                    <span className="text-[8px] font-studio-mono font-semibold tracking-[0.16em] uppercase text-[var(--studio-muted)] truncate">
                      {metric.label}
                    </span>
                  </div>
                  <span className="text-[7.5px] font-studio-mono text-[var(--studio-muted)] shrink-0">
                    {metric.index || `0${idx + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================
            03 — SOCIAL RAIL (Horizontal Scroll-Snap)
        ======================================================== */}
        {studioData.socials && studioData.socials.length > 0 && (
          <section id="socials" aria-label="Social Links" className="studio-reveal-section px-5 md:px-[40px] pt-2 md:pt-[16px] pb-4 md:pb-[20px]">
            <div className="flex items-baseline justify-between gap-3 mb-3 md:mb-4">
              <h2 className="text-[9px] font-studio-mono font-bold tracking-[0.22em] uppercase text-[var(--studio-muted)] whitespace-nowrap">
                03 / CONNECT
              </h2>
              <span className="text-[8px] font-studio-mono font-medium tracking-[0.2em] uppercase text-[var(--studio-muted)]">
                STAY IN TOUCH
              </span>
            </div>

            <div
              className="studio-social-rail flex gap-3 overflow-x-auto scroll-snap-x px-1 pb-2 md:pb-0 -mx-1 md:mx-0 snap-mandatory"
              role="list"
              aria-label="Social platforms"
            >
              {studioData.socials.map((social, index) => (
                <a
                  key={`${social.platform}-${index}`}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleSocialClick(social)}
                  aria-label={`${social.label} — ${social.sublabel || 'Social Link'}`}
                  className={`
                    group shrink-0 snap-start w-[80px] md:w-[96px] flex flex-col items-center gap-2 px-3 py-3 md:px-4 md:py-4
                    bg-[var(--studio-surface-elevated)] border border-[var(--studio-rule)] rounded-[12px]
                    transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(26,26,46,0.08)]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-accent)]
                  `}
                  style={{ borderColor: 'var(--studio-rule)' }}
                >
                  <div className="relative w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-[8px] transition-all duration-200 group-hover:scale-105" style={{ backgroundColor: `${accent}08`, border: `1px solid ${accent}20` }}>
                    {renderStudioSocialIcon(social.platform, 'w-5 h-5 md:w-6 md:h-6')}
                    <span
                      className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-studio-mono font-bold"
                      style={{ backgroundColor: accent, color: '#fff' }}
                      aria-hidden="true"
                    >
                      {index + 1 < 10 ? `0${index + 1}` : index + 1}
                    </span>
                  </div>
                  <span className="text-[9px] md:text-[10px] font-studio-mono font-semibold uppercase tracking-[0.1em] text-[var(--studio-ink)] text-center leading-tight">
                    {social.label}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================
            04 — FEATURED PROJECTS (with drawer trigger)
        ======================================================== */}
        {studioData.projects && studioData.projects.length > 0 && (
          <section id="projects" aria-label="Featured Projects" className="studio-reveal-section px-5 md:px-[40px] pt-2 md:pt-[16px] pb-4 md:pb-[20px]">
            <div className="flex items-baseline justify-between gap-3 mb-3 md:mb-4">
              <h2 className="text-[9px] font-studio-mono font-bold tracking-[0.22em] uppercase text-[var(--studio-muted)] whitespace-nowrap">
                04 / WORK
              </h2>
              <span className="text-[8px] font-studio-mono font-medium tracking-[0.2em] uppercase text-[var(--studio-muted)]">
                SELECTED PROJECTS
              </span>
            </div>

            <div className="space-y-3">
              {studioData.projects.slice(0, 3).map((project, idx) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectClick(project)}
                  className="group w-full text-left p-4 md:p-5 rounded-[12px] bg-[var(--studio-surface-elevated)] border border-[var(--studio-rule)] transition-all duration-200 hover:border-[var(--studio-accent-border)] hover:shadow-[0_8px_24px_rgba(26,26,46,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--studio-accent)]"
                  style={{ borderColor: 'var(--studio-rule)' }}
                  aria-label={`View project: ${project.title}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[8px] font-studio-mono font-bold tracking-[0.2em] uppercase text-[var(--studio-muted)]">
                          0{idx + 1}
                        </span>
                        {project.subtitle && (
                          <span className="text-[10px] font-studio-mono font-medium uppercase tracking-[0.1em]" style={{ color: accent }}>
                            {project.subtitle}
                          </span>
                        )}
                      </div>
                      <h3 className="font-studio-serif text-[18px] md:text-[20px] font-medium leading-tight text-[var(--studio-ink)] truncate group-hover:text-[var(--studio-accent)] transition-colors">
                        {project.title}
                      </h3>
                      {project.description && (
                        <p className="text-[13px] md:text-[14px] leading-[1.55] text-[var(--studio-ink-soft)] mt-2 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      {project.tags && project.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {project.tags.slice(0, 4).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-[9px] font-studio-mono font-medium uppercase tracking-[0.1em] rounded-[4px]"
                              style={{
                                backgroundColor: `${accent}10`,
                                color: accent,
                                border: `1px solid ${accent}30`,
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <ChevronRightIcon className="w-5 h-5 text-[var(--studio-muted)] group-hover:text-[var(--studio-accent)] transition-colors group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================
            RECENT ACTIVITY
        ======================================================== */}
        <div className="px-5 md:px-[40px] pt-4">
          <RecentActivitySection
            activity={(profile as any)?.recentActivity}
            variant="club"
            autoScroll={(profile as any)?.autoScroll}
          />
        </div>

        {/* ========================================================
            05 — CTA SECTION (Interactive)
        ======================================================== */}
        <section id="cta" aria-label="Call to Action" className="studio-reveal-section bg-[var(--studio-ink)] text-white px-5 md:px-[40px] py-5 md:py-[32px] relative overflow-hidden">
          {/* Subtle accent geometry */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute top-0 right-0 w-[200px] h-[200px] translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.03]" style={{ backgroundColor: accent }} />
            <div className="absolute bottom-0 left-0 w-[150px] h-[150px] -translate-x-1/2 translate-y-1/2 rounded-full opacity-[0.02]" style={{ backgroundColor: accent }} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-studio-serif tracking-[-0.015em] leading-[0.95] select-text">
                <span className="block text-[32px] md:text-[44px] font-medium">
                  Let's build
                </span>
                <span className="block text-[32px] md:text-[44px] font-medium italic" style={{ color: accent }}>
                  something remarkable.
                </span>
              </h2>
            </div>

            {/* Right: Action Buttons */}
            <div className="w-full md:w-auto self-start md:self-end flex flex-col md:flex-row gap-3">
              {/* Primary CTA */}
              <a
                href={mailtoHref}
                className="group relative w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 md:px-7 py-3.5 md:py-4 rounded-[10px] font-studio-mono font-semibold text-[11px] md:text-[12px] uppercase tracking-[0.15em] transition-all"
                style={{
                  backgroundColor: accent,
                  color: '#fff',
                  border: `1px solid ${accent}`,
                }}
                aria-label={`${studioData.ctaLabel}${studioData.email ? ` — Email ${studioData.email}` : ''}`}
              >
                <span className="relative z-10">{studioData.ctaLabel}</span>
                <ArrowRightIcon className="w-4 h-4 md:w-5 md:h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="pointer-events-none absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-[10px]" />
              </a>

              {/* Secondary: Download vCard */}
              <button
                onClick={handleDownloadVCard}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 md:px-7 py-3.5 md:py-4 rounded-[10px] font-studio-mono font-semibold text-[11px] md:text-[12px] uppercase tracking-[0.15em] transition-all border border-[var(--studio-rule-strong)] text-[var(--studio-ink)] hover:bg-[var(--studio-rule)]"
              >
                <DownloadIcon className="w-4 h-4" />
                <span>Save Contact</span>
              </button>

              {/* Tertiary: Copy Email */}
              {studioData.email && (
                <button
                  onClick={handleCopyEmail}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 md:px-7 py-3.5 md:py-4 rounded-[10px] font-studio-mono font-semibold text-[11px] md:text-[12px] uppercase tracking-[0.15em] transition-all border border-[var(--studio-rule-strong)] text-[var(--studio-ink)] hover:bg-[var(--studio-rule)]"
                >
                  <CopyIcon className="w-4 h-4" />
                  <span>Copy Email</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================
            FOOTER
        ======================================================== */}
        <footer aria-label="Profile Footer" className="bg-[var(--studio-surface-elevated)] border-t border-[var(--studio-rule)] px-5 md:px-6 py-3.5 md:py-4 flex flex-col md:flex-row items-center md:items-center justify-between gap-2 md:gap-0 text-[8px] font-studio-mono font-semibold tracking-[0.2em] uppercase text-[var(--studio-muted)]">
          <div className="flex items-center gap-3 flex-wrap">
            <span>STUDIO / {currentYear}</span>
            <span className="w-[1px] h-4" style={{ backgroundColor: 'var(--studio-rule)' }} aria-hidden="true" />
            <span>{studioData.footerStatement}</span>
          </div>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })}
            aria-label="Back to top of profile"
            className="flex items-center gap-1.5 hover:text-[var(--studio-accent)] transition-colors p-1 rounded-[6px] hover:bg-[var(--studio-rule)]"
          >
            <span className="sr-only">Back to top</span>
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="8" y1="13" x2="8" y2="3" />
              <polyline points="4 7 8 3 12 7" />
            </svg>
          </button>
        </footer>
      </article>
    </div>
  );
}

export default StudioTemplate;