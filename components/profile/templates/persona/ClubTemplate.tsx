'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { TemplateProps, PublicProfile, ProfileLink, ProfileProof } from '@/components/profile/templates/types';

export interface ClubMetric {
  index?: string;
  value: string;
  label: string;
}

export interface ClubSocial {
  platform: 'instagram' | 'linkedin' | 'website' | 'youtube' | 'newsletter' | string;
  label: string;
  sublabel?: string;
  url: string;
  icon?: string;
}

export interface ClubProfileData {
  nameLineOne: string;
  nameLineTwo: string;
  role: string;
  category: string;
  bio: string;
  location: string;
  availability: string;
  established?: string | number;
  edition?: string;
  portraitImage?: string | null;
  portraitAlt?: string;
  portraitCaption?: string;
  portraitNote?: string;
  initial?: string;
  plateLabel?: string;
  email?: string | null;
  ctaLabel?: string;
  monogram?: string;
  metrics: ClubMetric[];
  socials: ClubSocial[];
  footerStatement?: string;
}

export interface ClubTemplateProps extends Partial<TemplateProps> {
  data?: Partial<ClubProfileData>;
  templateId?: string;
}

// Default high-fidelity sample data reflecting the visual reference
export const DEFAULT_CLUB_DATA: ClubProfileData = {
  nameLineOne: 'Maya',
  nameLineTwo: 'Laurent',
  role: 'CREATIVE DIRECTOR / BRAND STRATEGIST',
  category: 'INDEPENDENT CREATIVE PRACTICE',
  bio: 'I build distinctive identities for people, products and ideas that deserve to be remembered.',
  location: 'MUMBAI, INDIA',
  availability: 'AVAILABLE FOR SELECTED COLLABORATIONS',
  established: '2019',
  edition: '01',
  monogram: 'TC',
  plateLabel: 'PLATE / A',
  portraitCaption: 'PROFILE PORTRAIT',
  portraitAlt: 'Editorial portrait artwork of Maya Laurent',
  portraitImage: null, // abstract art mode by default
  initial: 'M',
  email: 'maya@theclub.design',
  ctaLabel: 'WORK WITH MAYA',
  footerStatement: 'ONE PROFILE · ONE VISUAL LANGUAGE',
  metrics: [
    { index: '01', value: '08+', label: 'YEARS IN PRACTICE' },
    { index: '02', value: '42', label: 'SELECTED COMMISSIONS' },
    { index: '03', value: 'II', label: 'BRANDS BUILT' },
  ],
  socials: [
    {
      platform: 'instagram',
      label: 'INSTAGRAM',
      sublabel: 'SOCIAL / 01',
      url: 'https://instagram.com',
    },
    {
      platform: 'linkedin',
      label: 'LINKEDIN',
      sublabel: 'SOCIAL / 02',
      url: 'https://linkedin.com',
    },
    {
      platform: 'website',
      label: 'WEBSITE',
      sublabel: 'SOCIAL / 03',
      url: 'https://theclub.design',
    },
    {
      platform: 'youtube',
      label: 'YOUTUBE',
      sublabel: 'SOCIAL / 04',
      url: 'https://youtube.com',
    },
    {
      platform: 'newsletter',
      label: 'NEWSLETTER',
      sublabel: 'SOCIAL / 05',
      url: 'https://newsletter.theclub.design',
    },
  ],
};

// SVG Icons with consistent editorial stroke weight
function InstagramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" strokeWidth="2" />
    </svg>
  );
}

function LinkedInIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function WebsiteIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function YouTubeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" stroke="none" />
    </svg>
  );
}

function NewsletterIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function GenericLinkIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function ArrowUpRightIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="12" x2="12" y2="4" />
      <polyline points="5 4 12 4 12 11" />
    </svg>
  );
}

function ArrowUpIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="8" y1="13" x2="8" y2="3" />
      <polyline points="4 7 8 3 12 7" />
    </svg>
  );
}

// Convert platform name to matching SVG icon
function getSocialIcon(platform: string, className?: string) {
  const p = platform.toLowerCase();
  if (p.includes('instagram')) return <InstagramIcon className={className} />;
  if (p.includes('linkedin')) return <LinkedInIcon className={className} />;
  if (p.includes('youtube')) return <YouTubeIcon className={className} />;
  if (p.includes('newsletter') || p.includes('substack') || p.includes('mail')) return <NewsletterIcon className={className} />;
  if (p.includes('web') || p.includes('site') || p.includes('domain')) return <WebsiteIcon className={className} />;
  return <GenericLinkIcon className={className} />;
}

// Adapter from standard Unool PublicProfile to ClubProfileData
export function adaptPublicProfileToClub(
  profile?: PublicProfile | null,
  overrides?: Partial<ClubProfileData>
): ClubProfileData {
  if (!profile) {
    return { ...DEFAULT_CLUB_DATA, ...(overrides || {}) };
  }

  // Name handling
  const rawName = (profile.name || '').trim();
  const nameParts = rawName.split(/\s+/);
  let nameLineOne = nameParts[0] || DEFAULT_CLUB_DATA.nameLineOne;
  let nameLineTwo = nameParts.slice(1).join(' ') || (nameParts.length === 1 ? '' : DEFAULT_CLUB_DATA.nameLineTwo);

  // Initial for artwork
  const initial = (nameLineOne ? nameLineOne.charAt(0) : 'M').toUpperCase();

  // Monogram for top-left mark
  const monogram = (nameLineOne.charAt(0) + (nameLineTwo ? nameLineTwo.charAt(0) : 'C')).toUpperCase() || 'TC';

  // Role and category
  const role = profile.role || profile.headline || DEFAULT_CLUB_DATA.role;
  const category = (profile as any)?.category || profile.company || DEFAULT_CLUB_DATA.category;

  // Social links extraction
  const socialCards: ClubSocial[] = [];
  const links = (profile.links || []).filter((l: ProfileLink) => l && l.url && l.isVisible !== false);

  if (links.length > 0) {
    links.slice(0, 5).forEach((link, idx) => {
      const lowerUrl = (link.url || '').toLowerCase();
      const lowerLabel = (link.label || '').toLowerCase();
      let platform = 'website';

      if (lowerUrl.includes('instagram.com') || lowerLabel.includes('instagram')) platform = 'instagram';
      else if (lowerUrl.includes('linkedin.com') || lowerLabel.includes('linkedin')) platform = 'linkedin';
      else if (lowerUrl.includes('youtube.com') || lowerLabel.includes('youtube')) platform = 'youtube';
      else if (lowerUrl.includes('substack.com') || lowerUrl.includes('newsletter') || lowerLabel.includes('newsletter')) platform = 'newsletter';

      socialCards.push({
        platform,
        label: link.label ? link.label.toUpperCase() : platform.toUpperCase(),
        sublabel: `SOCIAL / 0${idx + 1}`,
        url: link.url,
      });
    });
  } else if (profile.socialHandles && Object.keys(profile.socialHandles).length > 0) {
    const handleKeys = Object.keys(profile.socialHandles);
    handleKeys.slice(0, 5).forEach((key, idx) => {
      const handle = profile.socialHandles[key];
      if (!handle) return;
      let url = handle;
      if (!handle.startsWith('http://') && !handle.startsWith('https://')) {
        if (key.toLowerCase() === 'instagram') url = `https://instagram.com/${handle.replace('@', '')}`;
        else if (key.toLowerCase() === 'linkedin') url = `https://linkedin.com/in/${handle}`;
        else if (key.toLowerCase() === 'youtube') url = `https://youtube.com/@${handle}`;
        else url = `https://${handle}`;
      }
      socialCards.push({
        platform: key.toLowerCase(),
        label: key.toUpperCase(),
        sublabel: `SOCIAL / 0${idx + 1}`,
        url,
      });
    });
  }

  // Fallback to default socials if none configured
  const finalSocials = socialCards.length > 0 ? socialCards : DEFAULT_CLUB_DATA.socials;

  // Metrics extraction from proofs
  const rawProofs = profile.proofs || (profile as any).proofPoints || (profile as any).proof_points || [];
  const metrics: ClubMetric[] = [];

  if (Array.isArray(rawProofs) && rawProofs.length > 0) {
    rawProofs.slice(0, 3).forEach((p: ProfileProof | any, idx: number) => {
      metrics.push({
        index: `0${idx + 1}`,
        value: p.value || `${p.title || ''}`,
        label: (p.description || p.title || `METRIC 0${idx + 1}`).toUpperCase(),
      });
    });
  }

  // Ensure 3 metrics slots are populated
  while (metrics.length < 3) {
    const defaultIdx = metrics.length;
    metrics.push(DEFAULT_CLUB_DATA.metrics[defaultIdx]);
  }

  // Email and CTA
  const email = (profile as any).email || (profile.socialHandles && profile.socialHandles.email) || DEFAULT_CLUB_DATA.email;
  const firstName = nameLineOne.toUpperCase();
  const ctaLabel = `WORK WITH ${firstName}`;

  return {
    nameLineOne,
    nameLineTwo,
    role: role.toUpperCase(),
    category: category.toUpperCase(),
    bio: profile.bio || DEFAULT_CLUB_DATA.bio,
    location: (profile as any).location || DEFAULT_CLUB_DATA.location,
    availability: (profile as any).availability || DEFAULT_CLUB_DATA.availability,
    established: (profile as any).established || DEFAULT_CLUB_DATA.established,
    edition: (profile as any).edition || DEFAULT_CLUB_DATA.edition,
    portraitImage: profile.avatarUrl || null,
    portraitAlt: `Portrait of ${rawName || 'Maya Laurent'}`,
    portraitCaption: (profile as any).portraitCaption || DEFAULT_CLUB_DATA.portraitCaption,
    initial,
    monogram,
    plateLabel: (profile as any).plateLabel || DEFAULT_CLUB_DATA.plateLabel,
    email,
    ctaLabel,
    footerStatement: DEFAULT_CLUB_DATA.footerStatement,
    metrics: metrics.slice(0, 3),
    socials: finalSocials,
    ...(overrides || {}),
  };
}

export function ClubTemplate({
  profile,
  accentColor,
  isPreview = false,
  onLinkClick,
  data: directData,
}: ClubTemplateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Compute profile data
  const data = useMemo(() => {
    return adaptPublicProfileToClub(profile, directData);
  }, [profile, directData]);

  // Dynamic initial from nameLineOne
  const displayInitial = useMemo(() => {
    return data.initial || (data.nameLineOne ? data.nameLineOne.charAt(0).toUpperCase() : 'M');
  }, [data.initial, data.nameLineOne]);

  // IntersectionObserver for refined scroll reveals
  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const sections = containerRef.current?.querySelectorAll<HTMLElement>('.club-reveal-section');
    if (!sections || sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('club-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    sections.forEach((sec) => observer.observe(sec));

    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  const handleSocialClick = (social: ClubSocial, e: React.MouseEvent) => {
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
  };

  return (
    <div className="club-template-root min-h-screen w-full bg-[#F5EFEB] text-[#241E1B] py-6 sm:py-12 px-3 sm:px-6 flex justify-center items-start selection:bg-[#6E1E24] selection:text-[#FAF6F0] font-club-sans">
      {/* Editorial Webfont Links & Embedded Micro-Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        .club-template-root .font-club-serif {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
        }

        .club-template-root .font-club-sans {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        /* Chamfered clipped portrait */
        .club-chamfer-shape {
          clip-path: polygon(18px 0, 100% 0, 100% 100%, 0 100%, 0 18px);
        }

        /* Reveal animation styles */
        .club-reveal-section {
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .club-reveal-section.club-revealed {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .club-reveal-section {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
          .club-pulse-line {
            animation: none !important;
          }
          .club-portrait-lift {
            transition: none !important;
          }
          .club-portrait-lift:hover {
            transform: none !important;
          }
        }

        /* Subtle pulse for micro navigation rule */
        @keyframes clubLinePulse {
          0%, 100% { opacity: 0.35; transform: scaleX(0.96); }
          50% { opacity: 0.9; transform: scaleX(1); }
        }

        .club-pulse-line {
          animation: clubLinePulse 4s ease-in-out infinite;
        }
      `}} />

      {/* Main Profile Shell */}
      <article
        ref={containerRef}
        aria-label={`${data.nameLineOne} ${data.nameLineTwo} — The Club Profile`}
        className="relative w-full max-w-[490px] bg-[#FDFBF7] border border-[#241E1B] rounded-[28px] sm:rounded-[32px] shadow-[0_20px_50px_-12px_rgba(40,24,18,0.14)] overflow-hidden transition-all duration-300"
      >
        {/* Subtle Corner Registration Bracket Marks */}
        <div className="pointer-events-none absolute top-3.5 left-3.5 w-3.5 h-3.5 border-t border-l border-[#241E1B]/50" aria-hidden="true" />
        <div className="pointer-events-none absolute top-3.5 right-3.5 w-3.5 h-3.5 border-t border-r border-[#241E1B]/50" aria-hidden="true" />
        <div className="pointer-events-none absolute top-3.5 right-8 w-4 h-[1px] bg-[#241E1B]/40" aria-hidden="true" />

        {/* ==================================================
            TOP PROFILE BAR
        ================================================== */}
        <header className="relative pt-4 sm:pt-5 pb-3 px-5 sm:px-6">
          <div className="flex items-center justify-between">
            {/* Left: Monogram and Label */}
            <div className="flex items-center gap-2.5">
              {/* Private-Club Square Monogram */}
              <div 
                className="w-7 h-7 sm:w-7 sm:h-7 border border-[#241E1B] p-[1.5px] bg-[#FDFBF7] flex items-center justify-center relative select-none"
                title={`${data.monogram} Monogram`}
              >
                <div className="w-full h-full border border-[#6E1E24]/30 flex items-center justify-center bg-[#FDFBF7]">
                  <span className="font-club-serif font-semibold text-[9.5px] tracking-wider text-[#241E1B]">
                    {data.monogram || 'TC'}
                  </span>
                </div>
              </div>

              {/* Club Label */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] tracking-[0.22em] font-semibold text-[#241E1B] uppercase">
                  THE CLUB
                </span>
                <span className="text-[10px] tracking-[0.22em] font-medium text-[#7A726A]">
                  /
                </span>
                <span className="text-[10px] tracking-[0.22em] font-medium text-[#241E1B]">
                  {data.edition || '01'}
                </span>
              </div>
            </div>

            {/* Right: Profile Indicator */}
            <div className="text-right">
              <span className="text-[10px] tracking-[0.22em] font-semibold text-[#6E1E24] uppercase">
                PROFILE {data.established || '2019'}
              </span>
            </div>
          </div>

          {/* Bottom Divider with intersecting diamond detail */}
          <div className="relative mt-3.5 w-full flex items-center justify-center">
            <div className="w-full h-[1px] bg-[#241E1B]/25" />
            <div className="absolute bg-[#FDFBF7] px-1.5 flex items-center justify-center">
              {/* Intersecting Diamond Mark */}
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className="text-[#6E1E24]" aria-hidden="true">
                <polygon points="5,0 10,5 5,10 0,5" stroke="currentColor" strokeWidth="1.2" fill="#FDFBF7" />
              </svg>
            </div>
          </div>
        </header>

        {/* ==================================================
            01 / IDENTITY SECTION
        ================================================== */}
        <section 
          id="identity" 
          aria-label="Identity"
          className="club-reveal-section px-5 sm:px-6 pt-3 pb-4"
        >
          {/* Section Header Bar */}
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-[9.5px] font-bold tracking-[0.22em] text-[#6E1E24] uppercase whitespace-nowrap">
              01 / IDENTITY
            </h2>
            <div className="h-[1px] bg-[#241E1B]/20 flex-1 min-w-[20px]" aria-hidden="true" />
            <span className="text-[8.5px] font-medium tracking-[0.2em] text-[#736B63] uppercase text-right truncate">
              {data.category}
            </span>
          </div>

          {/* Two-Column Composition: Portrait + Profile Info */}
          <div className="grid grid-cols-1 sm:grid-cols-[142px_1fr] gap-5 items-start">
            {/* Left: Editorial Abstract Portrait Artwork or Real Photograph */}
            <div className="flex flex-col items-center sm:items-start">
              <div 
                className="club-portrait-lift relative w-[138px] sm:w-[142px] aspect-[4/5] transition-transform duration-500 ease-out hover:-translate-y-1 hover:rotate-[-0.8deg] cursor-pointer group"
                tabIndex={0}
                role="img"
                aria-label={data.portraitAlt || 'Editorial portrait'}
              >
                {/* Real Image or Abstract Editorial Artwork */}
                {data.portraitImage ? (
                  /* Real Portrait Image with Chamfer Frame */
                  <div className="relative w-full h-full club-chamfer-shape bg-[#E5DDD3] overflow-hidden border border-[#241E1B]/80">
                    <img 
                      src={data.portraitImage} 
                      alt={data.portraitAlt || 'Profile Photograph'}
                      className="w-full h-full object-cover grayscale contrast-[1.05] brightness-95 group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    {/* Editorial Inset Border Overlay */}
                    <div className="pointer-events-none absolute inset-0 club-chamfer-shape border border-[#241E1B]/30" />
                    
                    {/* Vertical Plate Label Badge */}
                    <div className="absolute top-2.5 right-2 bg-[#E0D7CC]/90 backdrop-blur-[2px] border border-[#241E1B]/80 px-1 py-1.5 flex items-center justify-center">
                      <span className="text-[6.5px] tracking-[0.22em] font-semibold text-[#6E665E] uppercase [writing-mode:vertical-rl] rotate-180 select-none">
                        {data.plateLabel || 'PLATE / A'}
                      </span>
                    </div>

                    {/* Bottom-left monogram letter watermark */}
                    <div className="absolute bottom-1 left-2 font-club-serif italic font-semibold text-[26px] text-[#FAF6F0] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] select-none">
                      {displayInitial}
                    </div>
                  </div>
                ) : (
                  /* Built-in Abstract Editorial Artwork */
                  <div className="relative w-full h-full club-chamfer-shape bg-[#E5DDD3] overflow-hidden border border-[#241E1B]/80 shadow-[inset_0_0_12px_rgba(40,24,18,0.06)]">
                    <svg viewBox="0 0 142 178" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Background fill */}
                      <rect width="142" height="178" fill="#E5DDD3" />

                      {/* Subtle Grid Guidelines */}
                      <line x1="16" y1="0" x2="16" y2="178" stroke="#241E1B" strokeWidth="0.7" strokeOpacity="0.45" />
                      <line x1="0" y1="18" x2="142" y2="128" stroke="#241E1B" strokeWidth="0.75" strokeOpacity="0.5" />
                      <line x1="28" y1="0" x2="120" y2="178" stroke="#241E1B" strokeWidth="0.6" strokeOpacity="0.3" />

                      {/* Dusty Rose Circular Form */}
                      <ellipse cx="88" cy="66" rx="27" ry="25" fill="#D8A5A5" />
                      
                      {/* Charcoal Focal Dot inside the circle */}
                      <circle cx="95" cy="58" r="3" fill="#241E1B" />

                      {/* Deep Wine Curved Organic Form at Bottom */}
                      <path 
                        d="M 0,112 Q 38,98 76,112 Q 114,126 142,116 L 142,178 L 0,178 Z" 
                        fill="#6E1E24" 
                      />

                      {/* Large Elegant Serif Initial "M" in Ivory */}
                      <text 
                        x="22" 
                        y="156" 
                        fontFamily="'Cormorant Garamond', Georgia, serif" 
                        fontSize="34" 
                        fontStyle="italic" 
                        fontWeight="600" 
                        fill="#FAF6F0"
                        className="select-none"
                      >
                        {displayInitial}
                      </text>

                      {/* Subtle Inset Perimeter Line following the Chamfer */}
                      <polygon 
                        points="18,1 141,1 141,177 1,177 1,18" 
                        stroke="#241E1B" 
                        strokeWidth="0.8" 
                        strokeOpacity="0.35" 
                        fill="none" 
                      />
                    </svg>

                    {/* Vertical Plate Label Badge */}
                    <div className="absolute top-2.5 right-2 bg-[#E0D7CC] border border-[#241E1B]/70 px-1 py-1.5 flex items-center justify-center select-none shadow-sm">
                      <span className="text-[6.5px] tracking-[0.22em] font-semibold text-[#6E665E] uppercase [writing-mode:vertical-rl] rotate-180">
                        {data.plateLabel || 'PLATE / A'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Portrait Caption */}
              <div className="mt-2 text-center w-full">
                <span className="text-[7.5px] tracking-[0.24em] font-semibold text-[#7A726A] uppercase">
                  {data.portraitCaption || 'PROFILE PORTRAIT'}
                </span>
              </div>
            </div>

            {/* Right: Profile Information */}
            <div className="flex flex-col justify-start pt-0 sm:pt-0.5">
              {/* Role / Occupation Label */}
              <div className="text-[9px] font-bold tracking-[0.2em] text-[#6E1E24] uppercase mb-1.5 leading-snug">
                {data.role}
              </div>

              {/* Large Editorial Serif Name */}
              <h1 className="font-club-serif tracking-[-0.015em] leading-[0.92] select-text">
                <span className="block text-[42px] sm:text-[46px] font-normal text-[#241E1B]">
                  {data.nameLineOne}
                </span>
                {data.nameLineTwo && (
                  <span className="block text-[42px] sm:text-[46px] font-normal italic text-[#6E1E24] leading-[0.98]">
                    {data.nameLineTwo}
                  </span>
                )}
              </h1>

              {/* Editorial Bio */}
              <p className="text-[12px] sm:text-[12.5px] leading-[1.48] text-[#4A433D] font-normal mt-3 max-w-[270px]">
                {data.bio}
              </p>

              {/* Location & Status Metadata */}
              <div className="mt-3.5 pt-2 border-t border-[#241E1B]/15 flex items-center gap-1.5 text-[8px] font-medium tracking-[0.16em] uppercase text-[#736B63] flex-wrap">
                {data.location && <span>{data.location}</span>}
                {data.location && data.availability && (
                  <span className="text-[#6E1E24] text-[9px] leading-none" aria-hidden="true">•</span>
                )}
                {data.availability && <span>{data.availability}</span>}
              </div>
            </div>
          </div>

          {/* Micro Navigation / Identity Footer */}
          <div className="mt-5 pt-3 border-t border-[#241E1B]/15 flex items-center justify-between text-[8px] font-semibold tracking-[0.2em] uppercase text-[#7A726A]">
            <span className="whitespace-nowrap">
              CURATED PROFILE / EDITION {data.edition || '01'}
            </span>
            <div className="club-pulse-line h-[1px] bg-[#241E1B]/30 flex-1 mx-3" aria-hidden="true" />
            <a 
              href="#socials" 
              className="hover:text-[#6E1E24] transition-colors flex items-center gap-0.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6E1E24]"
            >
              SCROLL TO EXPLORE ↓
            </a>
          </div>
        </section>

        {/* ==================================================
            02 / SOCIALS SECTION
        ================================================== */}
        <section 
          id="socials" 
          aria-label="Social Links"
          className="club-reveal-section px-5 sm:px-6 pt-3 pb-4"
        >
          {/* Section Header Bar */}
          <div className="flex items-center justify-between gap-3 mb-3.5">
            <h2 className="text-[9.5px] font-bold tracking-[0.22em] text-[#6E1E24] uppercase whitespace-nowrap">
              02 / SOCIALS
            </h2>
            <div className="h-[1px] bg-[#241E1B]/20 flex-1 min-w-[20px]" aria-hidden="true" />
            <span className="text-[8.5px] font-medium tracking-[0.2em] text-[#736B63] uppercase">
              STAY CLOSE
            </span>
          </div>

          {/* Social Cards Grid: Desktop 2 cols + full-width 5th item; Mobile 1 col */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {data.socials.map((social, index) => {
              // 5th item (Newsletter) spans both columns on desktop if there are 5 items
              const isFullWidth = index === 4 && data.socials.length === 5;

              return (
                <a
                  key={`${social.platform}-${index}`}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => handleSocialClick(social, e)}
                  aria-label={`${social.label} — ${social.sublabel || 'Social Link'}`}
                  className={`
                    group relative bg-[#ECE4D8] border border-[#241E1B]/80 px-3.5 py-3 
                    flex items-center justify-between rounded-[2px] transition-all duration-200 
                    hover:bg-[#E4D8D2] hover:border-[#6E1E24] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(40,24,18,0.08)]
                    active:translate-y-0 active:scale-[0.99]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E1E24]
                    ${isFullWidth ? 'sm:col-span-2' : ''}
                  `}
                >
                  {/* Subtle Inset Hairline Frame (2.5px inside) */}
                  <div className="pointer-events-none absolute inset-[2.5px] border border-[#241E1B]/15" aria-hidden="true" />

                  {/* Deep Wine Corner Bracket Mark in Bottom-Right Corner (Exact Reference Detail!) */}
                  <div 
                    className="pointer-events-none absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b-[1.5px] border-r-[1.5px] border-[#6E1E24]" 
                    aria-hidden="true" 
                  />

                  {/* Left: Wine Icon & Platform Details */}
                  <div className="flex items-center gap-3 relative z-10">
                    {/* Consistent Stroke Wine SVG Icon */}
                    <div className="w-5 h-5 flex items-center justify-center text-[#6E1E24] transition-transform duration-200 group-hover:scale-105">
                      {getSocialIcon(social.platform, 'w-4 h-4')}
                    </div>

                    {/* Platform Title and Sublabel */}
                    <div className="flex flex-col">
                      <span className="text-[10.5px] font-bold tracking-[0.16em] text-[#241E1B] uppercase leading-tight">
                        {social.label}
                      </span>
                      <span className="text-[7.5px] font-medium tracking-[0.18em] text-[#7A726A] uppercase mt-0.5">
                        {social.sublabel || `SOCIAL / 0${index + 1}`}
                      </span>
                    </div>
                  </div>

                  {/* Right: Upward-Right Arrow */}
                  <div className="relative z-10 text-[#241E1B]/70 group-hover:text-[#6E1E24] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 pr-2">
                    <ArrowUpRightIcon className="w-3.5 h-3.5" />
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {/* ==================================================
            03 / THE RECORD SECTION (METRICS)
        ================================================== */}
        <section 
          id="record" 
          aria-label="The Record"
          className="club-reveal-section px-5 sm:px-6 pt-3 pb-4"
        >
          {/* Section Header Bar */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-[9.5px] font-bold tracking-[0.22em] text-[#6E1E24] uppercase whitespace-nowrap">
              03 / THE RECORD
            </h2>
            <div className="h-[1px] bg-[#241E1B]/20 flex-1 min-w-[20px]" aria-hidden="true" />
            <span className="text-[8.5px] font-medium tracking-[0.2em] text-[#736B63] uppercase">
              SELECTED SIGNALS
            </span>
          </div>

          {/* Continuous Editorial Metric Strip */}
          <div className="relative bg-[#ECE4D8] border-t border-b border-[#241E1B]/80 py-3.5 px-3">
            {/* Top Corner Registration Brackets on the strip */}
            <div className="pointer-events-none absolute top-1 left-1.5 w-2 h-2 border-t border-l border-[#241E1B]/60" aria-hidden="true" />
            <div className="pointer-events-none absolute top-1 right-1.5 w-2 h-2 border-t border-r border-[#241E1B]/60" aria-hidden="true" />

            {/* 3 Columns */}
            <div className="grid grid-cols-3 divide-x divide-[#241E1B]/25">
              {data.metrics.slice(0, 3).map((metric, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col px-2 sm:px-3 relative ${idx === 0 ? 'pl-1 sm:pl-2' : ''}`}
                >
                  {/* Top-Right Index Number */}
                  <div className="flex justify-end">
                    <span className="text-[7.5px] font-mono tracking-wider text-[#7A726A]">
                      {metric.index || `0${idx + 1}`}
                    </span>
                  </div>

                  {/* Large High-Contrast Editorial Serif Number */}
                  <div className="font-club-serif text-[28px] sm:text-[34px] font-normal leading-none text-[#241E1B] my-1">
                    {metric.value}
                  </div>

                  {/* Uppercase Metric Label */}
                  <div className="text-[7px] sm:text-[7.5px] font-medium tracking-[0.16em] uppercase text-[#5A524A] leading-tight">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================================================
            04 / INVITATION SECTION (CONTACT & CTA)
        ================================================== */}
        <section 
          id="invitation" 
          aria-label="Invitation"
          className="club-reveal-section bg-[#4E141A] text-[#FAF6F0] px-5 sm:px-6 py-5 sm:py-6 transition-colors"
        >
          {/* Header Label */}
          <div className="text-[8.5px] font-semibold tracking-[0.25em] text-[#D4A3A8] uppercase mb-2">
            04 / INVITATION
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            {/* Left: Large Editorial Serif Heading */}
            <div>
              <h2 className="font-club-serif tracking-[-0.015em] leading-[0.95] select-text">
                <span className="block text-[30px] sm:text-[34px] font-normal text-[#FAF6F0]">
                  Start a
                </span>
                <span className="block text-[30px] sm:text-[34px] font-normal italic text-[#E8C4C4] leading-[1.05]">
                  conversation.
                </span>
              </h2>
            </div>

            {/* Right: Framed Outlined CTA Button with divider & corner mark */}
            <div className="self-start sm:self-end">
              {data.email ? (
                <a
                  href={`mailto:${data.email}?subject=Collaboration%20Inquiry%20via%20The%20Club`}
                  className="group relative inline-flex items-stretch border border-[#B37B82] bg-transparent hover:bg-[#5E1A22] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C4C4]"
                  aria-label={`${data.ctaLabel || 'Start a conversation'} — Email ${data.email}`}
                >
                  {/* Inset Hairline Frame */}
                  <div className="pointer-events-none absolute inset-[2px] border border-[#B37B82]/30" aria-hidden="true" />

                  {/* Bottom-Right Corner Registration Accent */}
                  <div className="pointer-events-none absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[#E8C4C4]" aria-hidden="true" />

                  {/* Left Text Segment */}
                  <span className="px-3.5 py-2.5 text-[9px] font-semibold tracking-[0.2em] text-[#FAF6F0] uppercase border-r border-[#B37B82] group-hover:text-white transition-colors">
                    {data.ctaLabel || 'WORK WITH MAYA'}
                  </span>

                  {/* Right Arrow Segment */}
                  <span className="px-2.5 py-2.5 flex items-center justify-center text-[#FAF6F0] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                    <ArrowUpRightIcon className="w-3.5 h-3.5" />
                  </span>
                </a>
              ) : (
                /* Disabled CTA State if No Email Exists */
                <div 
                  className="relative inline-flex items-stretch border border-[#B37B82]/40 bg-black/20 opacity-60 cursor-not-allowed select-none"
                  title="Inquiries currently unavailable"
                  aria-disabled="true"
                >
                  <div className="pointer-events-none absolute inset-[2px] border border-[#B37B82]/20" aria-hidden="true" />
                  <span className="px-3.5 py-2.5 text-[9px] font-semibold tracking-[0.2em] text-[#FAF6F0]/60 uppercase border-r border-[#B37B82]/40">
                    INQUIRIES CLOSED
                  </span>
                  <span className="px-2.5 py-2.5 flex items-center justify-center text-[#FAF6F0]/40">
                    <ArrowUpRightIcon className="w-3.5 h-3.5" />
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ==================================================
            10 / FOOTER
        ================================================== */}
        <footer 
          aria-label="Profile Footer"
          className="bg-[#ECE4D8] border-t border-[#241E1B]/20 px-5 sm:px-6 py-3 flex items-center justify-between text-[8px] font-semibold tracking-[0.2em] uppercase text-[#5A524A]"
        >
          {/* Left: Dynamic Year */}
          <div>
            THE CLUB / {currentYear}
          </div>

          {/* Center: Profile Philosophy Statement */}
          <div className="hidden xs:block text-[#7A726A] text-[7.5px] truncate max-w-[200px] text-center">
            {data.footerStatement || 'ONE PROFILE · ONE VISUAL LANGUAGE'}
          </div>

          {/* Right: Smooth Back-to-Top Button */}
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top of profile"
            className="flex items-center gap-1 hover:text-[#6E1E24] transition-colors p-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6E1E24]"
          >
            <span className="sr-only">Back to top</span>
            <ArrowUpIcon className="w-3.5 h-3.5 text-[#241E1B] hover:text-[#6E1E24]" />
          </button>
        </footer>
      </article>
    </div>
  );
}

export default ClubTemplate;
