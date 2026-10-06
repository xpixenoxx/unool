'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import type { TemplateProps, PublicProfile, ProfileLink, ProfileProof } from '@/components/profile/templates/types';

export interface ClubMetric {
  index?: string;
  value: string;
  label: string;
}

export interface ClubSocial {
  platform: string;
  label: string;
  sublabel?: string;
  url: string;
  icon?: string;
}

export interface ClubProfileData {
  nameLineOne: string;
  nameLineTwo?: string;
  role?: string | null;
  category?: string | null;
  bio?: string;
  location?: string | null;
  availability?: string | null;
  established?: string | number | null;
  edition?: string;
  portraitImage?: string | null;
  portraitAlt?: string;
  initial?: string;
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

// Default sample data reflecting the visual reference (with new porcelain/stone/plum color palette)
export const DEFAULT_CLUB_DATA: ClubProfileData = {
  nameLineOne: 'Maya',
  nameLineTwo: 'Laurent',
  role: 'CREATIVE DIRECTOR / BRAND STRATEGIST',
  category: 'INDEPENDENT CREATIVE PRACTICE',
  bio: 'I build distinctive identities for people, products and ideas that deserve to be remembered.',
  location: null,
  availability: null,
  established: '2019',
  edition: '01',
  monogram: 'TC',
  portraitAlt: 'Editorial portrait artwork of Maya Laurent',
  portraitImage: null, // abstract art mode by default
  initial: 'M',
  email: 'maya@theclub.design',
  ctaLabel: 'WORK WITH MAYA',
  footerStatement: 'ONE PROFILE · ONE VISUAL LANGUAGE',
  metrics: [
    { index: '01', value: '12k', label: 'FOLLOWERS' },
    { index: '02', value: '500+', label: 'CONNECTIONS' },
    { index: '03', value: '2M', label: 'PROFILE VIEWS' },
  ],
  socials: [
    {
      platform: 'github',
      label: 'GITHUB',
      sublabel: 'SOCIAL / 01',
      url: 'https://github.com',
      icon: 'github',
    },
    {
      platform: 'linkedin',
      label: 'LINKEDIN',
      sublabel: 'SOCIAL / 02',
      url: 'https://linkedin.com',
      icon: 'linkedin',
    },
    {
      platform: 'instagram',
      label: 'INSTAGRAM',
      sublabel: 'SOCIAL / 03',
      url: 'https://instagram.com',
      icon: 'instagram',
    },
    {
      platform: 'hackerrank',
      label: 'HACKERRANK',
      sublabel: 'SOCIAL / 04',
      url: 'https://hackerrank.com',
      icon: 'hackerrank',
    },
    {
      platform: 'newsletter',
      label: 'NEWSLETTER',
      sublabel: 'SOCIAL / 05',
      url: 'https://newsletter.theclub.design',
      icon: 'newsletter',
    },
  ],
};

// ==================================================
// CENTRALIZED BRAND SVG ICON REGISTRY FOR THE CLUB
// ==================================================
export const CLUB_BRAND_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  github: ({ className = 'w-4 h-4 md:w-[26px] md:h-[26px]' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  ),
  hackerrank: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0a12 12 0 0 0-3.39.49 11.9 11.9 0 0 0-7.85 7.85A12 12 0 0 0 0 12a12 12 0 0 0 .76 4.22 11.94 11.94 0 0 0 7.02 7.02A12 12 0 0 0 12 24a12 12 0 0 0 4.22-.76 11.94 11.94 0 0 0 7.02-7.02A12 12 0 0 0 24 12a12 12 0 0 0-.76-4.22 11.94 11.94 0 0 0-7.02-7.02A12 12 0 0 0 12 0zm3.93 17.14h-2.31v-4.11H10.38v4.11H8.07V6.86h2.31v4.17h3.24V6.86h2.31v10.28z" />
    </svg>
  ),
  linkedin: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.67 1.67 0 1 0 0-3.34 1.67 1.67 0 0 0 0 3.34M7.86 18.5V10.13H5.07V18.5h2.79z" />
    </svg>
  ),
  instagram: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  youtube: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
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
  facebook: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  tiktok: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.77 1.81-.05 3.3-1.61 3.32-3.42V.02z" />
    </svg>
  ),
  threads: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.186 24h-.007C5.46 23.978 0 18.636 0 12.04 0 5.404 5.485.02 12.186.02c6.64 0 11.97 5.285 11.812 11.8-.13 5.378-3.79 9.87-8.91 10.932-.516.107-.99-.214-1.078-.727-.087-.514.22-.99.734-1.096 4.354-.903 7.464-4.73 7.575-9.3.136-5.59-4.397-10.15-10.133-10.15C6.47 1.48 1.74 6.22 1.74 12.04c0 5.765 4.7 10.457 10.447 10.476 2.83.01 5.474-1.074 7.447-3.05a.87.87 0 0 1 1.23 1.23c-2.31 2.313-5.388 3.58-8.678 3.304zm-1.847-7.234c-2.09-.08-4.043-1.47-4.043-3.924 0-2.32 1.93-3.856 4.336-3.856 2.378 0 4.092 1.34 4.092 3.658 0 .84-.214 1.61-.636 2.29-.44.7-1.09 1.15-1.92 1.32-.42.08-.85.12-1.28.12-.183 0-.365-.01-.549-.03zm.28-6.19c-1.5 0-2.63.93-2.63 2.27 0 1.43 1.13 2.36 2.45 2.41.13.01.27.01.4 0 .54-.06.97-.33 1.27-.8.29-.46.44-.99.44-1.57 0-1.42-1.03-2.31-2.33-2.31z" />
    </svg>
  ),
  discord: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  ),
  reddit: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.612a1.24 1.24 0 0 1 1.108-.702zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.095.327.327 0 0 0 0 .462c.969.969 2.525.969 3.494 0a.327.327 0 0 0 0-.462.327.327 0 0 0-.462 0c-.714.714-1.856.714-2.57 0a.327.327 0 0 0-.231-.095z" />
    </svg>
  ),
  pinterest: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0a12 12 0 0 0-4.37 23.18c-.06-.99-.1-2.52.21-3.6.28-.97 1.83-6.22 1.83-6.22s-.47-.94-.47-2.33c0-2.18 1.26-3.81 2.84-3.81 1.34 0 1.99 1.01 1.99 2.22 0 1.35-.86 3.37-1.3 5.24-.37 1.57.79 2.85 2.34 2.85 2.81 0 4.97-2.96 4.97-7.23 0-3.78-2.72-6.42-6.6-6.42-4.5 0-7.14 3.38-7.14 6.86 0 1.36.52 2.82 1.18 3.61.13.16.15.3.11.46-.12.51-.39 1.58-.44 1.8-.07.29-.23.35-.53.21-1.98-.92-3.22-3.81-3.22-6.13 0-4.99 3.63-9.58 10.46-9.58 5.5 0 9.77 3.92 9.77 9.15 0 5.46-3.44 9.86-8.22 9.86-1.61 0-3.12-.84-3.64-1.83l-.99 3.77c-.36 1.38-1.33 3.11-1.98 4.16A12 12 0 1 0 12 0z" />
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
  medium: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
    </svg>
  ),
  telegram: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.97 9.28c-.15.65-.53.81-1.08.5l-3-2.21-1.45 1.4c-.16.16-.3.3-.61.3l.21-3.05 5.56-5.02c.24-.22-.05-.34-.38-.13l-6.87 4.33-2.96-.92c-.64-.2-.66-.64.13-.95l11.57-4.46c.54-.19 1.01.13.85.93z" />
    </svg>
  ),
  whatsapp: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.507 14.307l-.009.075c-.338.905-1.488 1.632-2.38 1.777-.635.103-1.456.186-4.275-.98-3.606-1.492-5.918-5.187-6.096-5.426-.174-.238-1.442-1.921-1.442-3.666 0-1.746.913-2.604 1.238-2.962.325-.357.708-.447.944-.447.235 0 .47.002.677.012.219.01.512-.083.8.61.302.729 1.033 2.518 1.122 2.7.09.182.15.395.03.633-.12.238-.18.386-.357.595-.178.209-.373.467-.533.627-.178.178-.363.372-.156.729.208.356.924 1.524 1.984 2.47 1.365 1.217 2.515 1.594 2.871 1.772.357.178.566.149.774-.09.208-.238.89-1.039 1.127-1.396.238-.356.475-.297.8-.178.326.119 2.073.978 2.43 1.157.356.178.593.267.682.416.089.149.089.86-.249 1.765zM12 0C5.373 0 0 5.373 0 12c0 2.115.548 4.103 1.51 5.834L0 24l6.335-1.464A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  ),
  gitlab: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="m23.6 9.59-1.12-3.45a.94.94 0 0 0-1.79 0l-1.12 3.45H4.43L3.31 6.14a.94.94 0 0 0-1.79 0L.4 9.59a1.64 1.64 0 0 0 .6 1.83L12 19.43l11-8.01a1.64 1.64 0 0 0 .6-1.83z" />
    </svg>
  ),
  stackoverflow: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.986 21.865v-6.404h2.134V24H2.69v-8.539h2.13v6.404h14.166zM6.11 19.782h11.633v-2.14H6.11v2.14zm.648-5.326l11.236 2.443.468-2.094-11.236-2.443-.468 2.094zm2.148-5.275l9.96 6.07 1.094-1.844-9.96-6.07-1.094 1.844zm4.444-5.367l7.636 8.79 1.63-1.41-7.636-8.79-1.63 1.41zM18.156 0l-1.92 1.01 5.56 10.23 1.92-1.01L18.156 0z" />
    </svg>
  ),
  kaggle: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.825 23.859c-.022.08-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.183c0 .235-.117.379-.352.379H5.093c-.235 0-.352-.144-.352-.379V.379c0-.235.117-.379.352-.379h2.842c.235 0 .352.144.352.379v14.73l6.398-6.398c.141-.141.293-.211.457-.211h3.338c.164 0 .258.07.281.211.023.164-.035.281-.176.352l-6.867 6.648 7.336 7.641c.141.117.187.246.164.357z" />
    </svg>
  ),
  codepen: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="m23.6 7.42-11-7.33a1.08 1.08 0 0 0-1.2 0l-11 7.33A1.08 1.08 0 0 0 0 8.32v7.36a1.08 1.08 0 0 0 .4.9l11 7.33a1.08 1.08 0 0 0 1.2 0l11-7.33a1.08 1.08 0 0 0 .4-.9V8.32a1.08 1.08 0 0 0-.4-.9zM12 2.45l8.53 5.69-3.81 2.54L12 7.55 7.28 10.68 3.47 8.14zm-1.09 7.91 2.18 1.45v4.38l-2.18-1.45zm-8.73 3.55v-3.7l3.27 2.18-3.27 2.18v-.66zm9.82 7.64L3.47 15.86l3.81-2.54 4.72 3.13 4.72-3.13 3.81 2.54zm2.18-5.46-2.18 1.45v-4.38l2.18-1.45zm7.64-2.18-3.27-2.18 3.27-2.18v4.36z" />
    </svg>
  ),
  devto: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7.42 10.05c-.18-.12-.46-.17-.84-.17H5.21v4.24h1.37c.38 0 .66-.05.84-.16.18-.11.32-.28.41-.53.09-.24.14-.58.14-1.02v-.83c0-.45-.05-.79-.14-1.03-.09-.24-.23-.4-.41-.5zm14.39-7.86H2.19C.98 2.19 0 3.17 0 4.38v15.24c0 1.21.98 2.19 2.19 2.19h19.62c1.21 0 2.19-.98 2.19-2.19V4.38c0-1.21-.98-2.19-2.19-2.19zm-13.62 13h-4.4V8.81h4.4c.83 0 1.5.15 2.01.44.51.3.89.74 1.14 1.33.25.59.38 1.34.38 2.25v.34c0 .91-.13 1.66-.38 2.25-.25.59-.63 1.03-1.14 1.33-.51.29-1.18.44-2.01.44zm6.05 0h-3.41V8.81h3.41v1.17h-2.13v1.88h1.89v1.17h-1.89v1.88h2.13v1.28zm5.72-3.92-1.63 3.92h-1.45l-1.63-3.92V17.3h-1.28V8.81h1.7l1.94 4.67 1.94-4.67h1.7v8.49h-1.28v-4.08z" />
    </svg>
  ),
  producthunt: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm-1.33 16.5H8V7.5h4c2.21 0 4 1.79 4 4s-1.79 4-4 4h-1.33v1zM10.67 10h1.33c.74 0 1.33.6 1.33 1.33s-.6 1.33-1.33 1.33h-1.33V10z" />
    </svg>
  ),
  notion: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.737c-.466-.373-.886-.466-2.006-.373L2.64 2.39c-.42.047-.513.28-.327.466l2.146 1.352zm-.513 4.292v11.755c0 .7.373.933 1.166.886l14.288-.84c.793-.046.98-.466.98-1.073V7.52c0-.653-.233-.886-.84-.84l-14.754.886c-.606.047-.84.28-.84.934zm13.355.7c.093.42 0 .84-.42.887l-.793.14v7.79c-.56.327-1.12.513-1.586.513-.747 0-.98-.233-1.54-.933l-4.572-7.185v6.998l1.4.327s0 .84-.98.84l-3.08.187c-.093-.233 0-.7.374-.793l.886-.233V10.23l-1.213-.093c-.093-.42.14-.98.7-.98l3.36-.233 4.759 7.325V9.763l-1.166-.14c-.093-.467.233-.84.7-.84l3.172-.187z" />
    </svg>
  ),
  // Website: Clean globe with latitude/longitude meridians (ONLY for actual website!)
  website: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  // Newsletter: Clean postal envelope
  newsletter: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  // Email: Mail envelope
  email: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  // Neutral Generic External Link / Social Icon Fallback (Used when platform is unknown — NEVER the globe!)
  generic: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
};

// Automatic Platform Resolution Layer
export function normalizeSocialPlatformKey(label?: string, href?: string, explicitIcon?: string): string {
  // 1. Explicit icon property
  if (explicitIcon) {
    const norm = explicitIcon.toLowerCase().trim();
    if (CLUB_BRAND_ICONS[norm]) return norm;
    if (norm === 'twitter') return 'x';
    if (norm === 'substack') return 'newsletter';
    if (norm === 'mail') return 'email';
    if (norm === 'web' || norm === 'site') return 'website';
  }

  // 2. Normalized label check
  if (label) {
    const l = label.toLowerCase().trim();
    if (l === 'github' || l.includes('github')) return 'github';
    if (l === 'hackerrank' || l.includes('hackerrank') || l.includes('hacker rank')) return 'hackerrank';
    if (l === 'linkedin' || l.includes('linkedin')) return 'linkedin';
    if (l === 'instagram' || l.includes('instagram') || l.includes('insta')) return 'instagram';
    if (l === 'youtube' || l.includes('youtube') || l.includes('yt')) return 'youtube';
    if (l === 'x' || l === 'twitter' || l.includes('twitter') || l.includes('x.com')) return 'x';
    if (l === 'facebook' || l.includes('facebook') || l.includes('fb')) return 'facebook';
    if (l === 'tiktok' || l.includes('tiktok')) return 'tiktok';
    if (l === 'threads' || l.includes('threads')) return 'threads';
    if (l === 'discord' || l.includes('discord')) return 'discord';
    if (l === 'reddit' || l.includes('reddit')) return 'reddit';
    if (l === 'pinterest' || l.includes('pinterest')) return 'pinterest';
    if (l === 'behance' || l.includes('behance')) return 'behance';
    if (l === 'dribbble' || l.includes('dribbble')) return 'dribbble';
    if (l === 'medium' || l.includes('medium')) return 'medium';
    if (l === 'telegram' || l.includes('telegram') || l.includes('t.me')) return 'telegram';
    if (l === 'whatsapp' || l.includes('whatsapp') || l.includes('wa.me')) return 'whatsapp';
    if (l === 'gitlab' || l.includes('gitlab')) return 'gitlab';
    if (l === 'stackoverflow' || l.includes('stack overflow') || l.includes('stackoverflow')) return 'stackoverflow';
    if (l === 'kaggle' || l.includes('kaggle')) return 'kaggle';
    if (l === 'codepen' || l.includes('codepen')) return 'codepen';
    if (l === 'dev.to' || l === 'devto' || l.includes('dev.to') || l.includes('devto')) return 'devto';
    if (l === 'producthunt' || l.includes('product hunt') || l.includes('producthunt')) return 'producthunt';
    if (l === 'notion' || l.includes('notion')) return 'notion';
    if (l === 'newsletter' || l.includes('newsletter') || l.includes('substack')) return 'newsletter';
    if (l === 'email' || l === 'mail' || l.includes('email') || l.includes('contact')) return 'email';
    if (l === 'website' || l === 'personal website' || l === 'portfolio' || l === 'home') return 'website';
  }

  // 3. URL hostname / domain check
  if (href) {
    try {
      const urlStr = href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') ? href : `https://${href}`;
      if (urlStr.startsWith('mailto:')) return 'email';
      const hostname = new URL(urlStr).hostname.toLowerCase();
      if (hostname.includes('github.com')) return 'github';
      if (hostname.includes('hackerrank.com')) return 'hackerrank';
      if (hostname.includes('linkedin.com')) return 'linkedin';
      if (hostname.includes('instagram.com')) return 'instagram';
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube';
      if (hostname.includes('x.com') || hostname.includes('twitter.com')) return 'x';
      if (hostname.includes('facebook.com') || hostname.includes('fb.com')) return 'facebook';
      if (hostname.includes('tiktok.com')) return 'tiktok';
      if (hostname.includes('threads.net')) return 'threads';
      if (hostname.includes('discord.com') || hostname.includes('discord.gg')) return 'discord';
      if (hostname.includes('reddit.com')) return 'reddit';
      if (hostname.includes('pinterest.com')) return 'pinterest';
      if (hostname.includes('behance.net')) return 'behance';
      if (hostname.includes('dribbble.com')) return 'dribbble';
      if (hostname.includes('medium.com')) return 'medium';
      if (hostname.includes('t.me') || hostname.includes('telegram.org')) return 'telegram';
      if (hostname.includes('wa.me') || hostname.includes('whatsapp.com')) return 'whatsapp';
      if (hostname.includes('gitlab.com')) return 'gitlab';
      if (hostname.includes('stackoverflow.com')) return 'stackoverflow';
      if (hostname.includes('kaggle.com')) return 'kaggle';
      if (hostname.includes('codepen.io')) return 'codepen';
      if (hostname.includes('dev.to')) return 'devto';
      if (hostname.includes('producthunt.com')) return 'producthunt';
      if (hostname.includes('notion.so') || hostname.includes('notion.site')) return 'notion';
      if (hostname.includes('substack.com')) return 'newsletter';
    } catch {
      // not a standard URL string
    }
  }

  // 4. Strict check for Website (only when actually Website)
  if (label && (label.toLowerCase().trim() === 'website' || label.toLowerCase().trim() === 'web')) {
    return 'website';
  }

  // 5. Fallback is neutral link icon (NEVER globe!)
  return 'generic';
}

export function renderClubSocialIcon(platformKey: string, className = 'w-4 h-4') {
  const IconComponent = CLUB_BRAND_ICONS[platformKey] || CLUB_BRAND_ICONS['generic'];
  return <IconComponent className={className} />;
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

// Adapter from standard Unool PublicProfile to ClubProfileData
export function adaptPublicProfileToClub(
  profile?: PublicProfile | null,
  directData?: Partial<ClubProfileData>
): ClubProfileData {
  const rawName = (directData?.nameLineOne ? `${directData.nameLineOne} ${directData.nameLineTwo || ''}` : (profile?.name || '')).trim();
  const nameParts = rawName ? rawName.split(/\s+/) : ['The', 'Club'];
  const nameLineOne = directData?.nameLineOne || nameParts[0] || 'The';
  const nameLineTwo = directData?.nameLineTwo !== undefined
    ? directData.nameLineTwo
    : (nameParts.slice(1).join(' ') || (nameParts.length === 1 ? '' : ''));

  const initial = directData?.initial || (nameLineOne ? nameLineOne.charAt(0).toUpperCase() : 'C');
  const monogram = directData?.monogram || (nameLineOne.charAt(0) + (nameLineTwo ? nameLineTwo.charAt(0) : '')).toUpperCase() || 'TC';

  // Role resolution
  const role = directData?.role !== undefined ? directData.role : (profile?.role || profile?.headline || null);

  // Kicker / Category resolution: NEVER promote company name to category!
  let identityKicker: string | null = null;
  if (directData?.category) {
    identityKicker = directData.category;
  } else if ((profile as any)?.category) {
    const cat = (profile as any).category;
    const comp = profile?.company || (profile as any)?.employer || (profile as any)?.organization;
    if (!comp || cat.trim().toLowerCase() !== comp.trim().toLowerCase()) {
      identityKicker = cat;
    } else if (role) {
      identityKicker = role;
    }
  } else if (role) {
    identityKicker = role;
  }

  const bio = directData?.bio !== undefined ? directData.bio : (profile?.bio || '');

  // Location & Availability: NEVER hardcode or default to fake values like Mumbai, India
  const location = directData?.location !== undefined
    ? directData.location
    : ((profile as any)?.location || null);

  const availability = directData?.availability !== undefined
    ? directData.availability
    : ((profile as any)?.availability || null);

  const established = directData?.established !== undefined
    ? directData.established
    : ((profile as any)?.established || null);

  const edition = directData?.edition || '01';

  // Social links extraction with brand detection
  const socialList: ClubSocial[] = [];

  if (directData?.socials && directData.socials.length > 0) {
    directData.socials.forEach((s, idx) => {
      if (s && s.url) {
        const url = s.url;
        const explicitIcon = s.icon;
        const label = s.label || 'LINK';
        const resolvedPlatform = normalizeSocialPlatformKey(label, url, explicitIcon);
        socialList.push({
          platform: resolvedPlatform,
          label: label.toUpperCase(),
          sublabel: s.sublabel || `SOCIAL / 0${idx + 1}`,
          url,
          icon: explicitIcon || resolvedPlatform,
        });
      }
    });
  } else {
    const rawLinks = profile?.links || [];
    const links = (rawLinks || []).filter((l: ProfileLink) => l && l.url && l.isVisible !== false);

    if (links.length > 0) {
      links.slice(0, 6).forEach((link, idx) => {
        const url = link.url;
        const explicitIcon = link.icon || undefined;
        const label = link.label || 'LINK';
        const resolvedPlatform = normalizeSocialPlatformKey(label, url, explicitIcon);

        socialList.push({
          platform: resolvedPlatform,
          label: label.toUpperCase(),
          sublabel: `SOCIAL / 0${idx + 1}`,
          url,
          icon: explicitIcon || resolvedPlatform,
        });
      });
    } else if (profile?.socialHandles && Object.keys(profile.socialHandles).length > 0) {
      const keys = Object.keys(profile.socialHandles);
      keys.slice(0, 6).forEach((key, idx) => {
        const val = profile.socialHandles[key];
        if (!val) return;
        let url = val;
        if (!val.startsWith('http://') && !val.startsWith('https://') && !val.startsWith('mailto:')) {
          if (key.toLowerCase() === 'instagram') url = `https://instagram.com/${val.replace('@', '')}`;
          else if (key.toLowerCase() === 'github') url = `https://github.com/${val.replace('@', '')}`;
          else if (key.toLowerCase() === 'hackerrank') url = `https://hackerrank.com/${val.replace('@', '')}`;
          else if (key.toLowerCase() === 'linkedin') url = `https://linkedin.com/in/${val}`;
          else if (key.toLowerCase() === 'youtube') url = `https://youtube.com/@${val}`;
          else if (key.toLowerCase() === 'twitter' || key.toLowerCase() === 'x') url = `https://x.com/${val.replace('@', '')}`;
          else url = `https://${val}`;
        }
        const resolvedPlatform = normalizeSocialPlatformKey(key, url, key);
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

  // Dynamic metrics extraction: strictly use actual metric names, NEVER "METRIC 01 / METRIC 02"
  const rawMetrics = directData?.metrics || profile?.proofs || (profile as any)?.proofPoints || (profile as any)?.proof_points || [];
  const metricList: ClubMetric[] = [];

  if (Array.isArray(rawMetrics) && rawMetrics.length > 0) {
    rawMetrics.slice(0, 3).forEach((item: any, idx: number) => {
      const val = (item.value || item.stat || item.count || item.number || '').toString().trim();

      // Prioritize actual metric label/title/name and reject generic placeholders like "METRIC 01"
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

      // If no explicit candidate exists, supply meaningful fallback names
      if (!lbl) {
        const defaultLabels = ['FOLLOWERS', 'CONNECTIONS', 'PROFILE VIEWS'];
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
    : ((profile as any)?.email || profile?.socialHandles?.email || null);

  const firstName = (nameLineOne || '').toUpperCase();
  const ctaLabel = directData?.ctaLabel || (firstName && firstName !== 'THE' ? `WORK WITH ${firstName}` : 'START A CONVERSATION');

  return {
    nameLineOne,
    nameLineTwo,
    role: role ? role.toUpperCase() : null,
    category: identityKicker ? identityKicker.toUpperCase() : null,
    bio,
    location,
    availability,
    established,
    edition,
    initial,
    monogram,
    portraitImage: directData?.portraitImage !== undefined ? directData.portraitImage : (profile?.avatarUrl || null),
    portraitAlt: directData?.portraitAlt || `Editorial portrait of ${nameLineOne} ${nameLineTwo}`,
    email,
    ctaLabel,
    footerStatement: directData?.footerStatement || 'ONE PROFILE · ONE VISUAL LANGUAGE',
    metrics: metricList,
    socials: socialList,
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

  // Compute profile data strictly from real input
  const clubData = useMemo(() => {
    return adaptPublicProfileToClub(profile, directData);
  }, [profile, directData]);

  // Subtle scroll reveal with IntersectionObserver & reduced-motion support
  useEffect(() => {
    if (typeof window === 'undefined') return;
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
        threshold: 0.1,
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

  const handleSocialClick = (social: ClubSocial) => {
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

  // Safe mailto link resolution for the interactive CTA
  const mailtoHref = useMemo(() => {
    if (clubData.email) {
      return `mailto:${clubData.email}?subject=Collaboration%20Inquiry%20via%20The%20Club`;
    }
    const safeUser = (clubData.nameLineOne || 'profile').toLowerCase();
    return `mailto:${safeUser}@unool.me?subject=Inquiry%20via%20The%20Club`;
  }, [clubData.email, clubData.nameLineOne]);

  return (
    <div className="club-template-root min-h-screen w-full bg-[var(--ivory)] text-[var(--ink)] py-8 md:py-16 px-3 md:px-6 md:px-8 flex justify-center items-start selection:bg-[var(--wine)] selection:text-[var(--paper)]">
      {/* Editorial Google Fonts & Micro-CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        
        :root {
          --ivory: #f3eee6;
          --paper: #fcf9f3;
          --paper-deep: #e9dfd2;
          --ink: #282321;
          --muted: #756c65;
          --wine: #6b2436;
          --wine-deep: #4a1725;
          --rose: #d7aeaa;
          --rule: rgba(40,35,33,.2);
          --soft-rule: rgba(40,35,33,.11);
        }

        .club-template-root .font-club-serif {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
        }

        .club-template-root .font-club-sans {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .club-chamfer-shape {
          clip-path: polygon(18px 0, 100% 0, 100% 100%, 0 100%, 0 18px);
        }

        
        @media (min-width: 768px) {
          .metrics-desktop { display: grid !important; }
          .metrics-mobile { display: none !important; }
        }
        @media (max-width: 767px) {
          .metrics-desktop { display: none !important; }
          .metrics-mobile { display: block !important; }
        }

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
          .club-portrait-lift {
            transition: none !important;
          }
          .club-portrait-lift:hover {
            transform: none !important;
          }
        }
      `}} />

      {/* Main Profile Shell (Warm Porcelain outer, Soft Parchment inner shell, Cocoa borders) */}
      <article
        ref={containerRef}
        aria-label={`${clubData.nameLineOne} ${clubData.nameLineTwo} — The Club Profile`}
        className="font-club-sans relative w-full max-w-[440px] md:w-[min(920px,calc(100vw-80px))] md:max-w-[920px] md:my-8 bg-[var(--paper)] border border-[var(--ink)]/85 rounded-[28px] md:rounded-[34px] shadow-[0_20px_50px_-12px_var(--soft-rule)] overflow-hidden transition-all duration-300"
      >
        {/* Registration Corner Marks on Shell */}
        <div className="pointer-events-none absolute top-3.5 left-3.5 w-3.5 h-3.5 border-t border-l border-[var(--ink)]/45" aria-hidden="true" />
        <div className="pointer-events-none absolute top-3.5 right-3.5 w-3.5 h-3.5 border-t border-r border-[var(--ink)]/45" aria-hidden="true" />
        <div className="pointer-events-none absolute top-3.5 right-8 w-4 h-[1px] bg-[#282321]/30" aria-hidden="true" />

        {/* ==================================================
            TOP PROFILE BAR
        ================================================== */}
        <header className="relative pt-4 md:pt-5 pb-3 px-5 md:px-6">
          <div className="flex items-center justify-between">
            {/* Left: Square Monogram & Label (Clean 'THE CLUB' without '/ 01') */}
            <div className="flex items-center gap-2.5">
              <div 
                className="w-7 h-7 border border-[var(--ink)] p-[1.5px] bg-[var(--paper)] flex items-center justify-center relative select-none"
                title={`${clubData.monogram} Monogram`}
              >
                <div className="w-full h-full border border-[#6b2436]/35 flex items-center justify-center bg-[var(--paper)]">
                  <span className="font-club-serif font-semibold text-[9.5px] md:text-[10.5px] tracking-wider text-[var(--ink)]">
                    {clubData.monogram || 'TC'}
                  </span>
                </div>
              </div>

              <div className="flex items-center">
                <span className="text-[10px] tracking-[0.22em] font-semibold text-[var(--ink)] uppercase">
                  THE CLUB
                </span>
              </div>
            </div>

            {/* Right: Profile Indicator in Muted Plum */}
            <div className="text-right">
              <span className="text-[10px] tracking-[0.22em] font-semibold text-[var(--wine)] uppercase">
                PROFILE {clubData.established || currentYear}
              </span>
            </div>
          </div>

          {/* Bottom Divider with intersecting diamond */}
          <div className="relative mt-3.5 w-full flex items-center justify-center">
            <div className="w-full h-[1px] bg-[#282321]/20" />
            <div className="absolute bg-[var(--paper)] px-1.5 flex items-center justify-center">
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className="text-[var(--wine)]" aria-hidden="true">
                <polygon points="5,0 10,5 5,10 0,5" stroke="currentColor" strokeWidth="1.2" fill="var(--paper)" />
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
          className="club-reveal-section px-5 md:px-[42px] pt-3 md:pt-[32px] pb-5 md:pb-[32px]"
        >
          {/* Section Header: Clean flex arrangement with NO horizontal connecting line */}
          <div className="flex items-baseline justify-between gap-3 mb-4">
            <h2 className="text-[9.5px] font-bold tracking-[0.22em] text-[var(--wine)] uppercase whitespace-nowrap">
              01 / IDENTITY
            </h2>
            {clubData.category && (
              <span className="text-[8.5px] font-medium tracking-[0.2em] text-[var(--muted)] uppercase text-right truncate">
                {clubData.category}
              </span>
            )}
          </div>

          {/* Two-Column Composition: Portrait + Information */}
          <div className="grid grid-cols-1 md:grid-cols-[24%_76%] gap-6 md:gap-14 items-start">
            {/* Left: Editorial Portrait Treatment (Clean & Intentional, NO 'PLATE / A', NO empty caption space) */}
            <div className="flex flex-col items-center md:items-start shrink-0">
              <div 
                className="club-portrait-lift relative w-[138px] md:w-full aspect-[4/5] transition-transform duration-500 ease-out hover:-translate-y-1 hover:rotate-[-0.8deg] cursor-pointer group"
                tabIndex={0}
                role="img"
                aria-label={clubData.portraitAlt}
              >
                {clubData.portraitImage ? (
                  /* Real Portrait Image without Grayscale (Retains Natural Color with Editorial Polish) */
                  <div className="relative w-full h-full club-chamfer-shape bg-[var(--paper-deep)] overflow-hidden border border-[var(--ink)]/80 shadow-[0_4px_12px_var(--soft-rule)]">
                    <img 
                      src={clubData.portraitImage} 
                      alt={clubData.portraitAlt}
                      className="w-full h-full object-cover contrast-[1.02] brightness-[0.98] group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="pointer-events-none absolute inset-0 club-chamfer-shape border border-[var(--ink)]/30" />
                    <div className="absolute bottom-1 left-2 font-club-serif italic font-semibold text-[26px] text-[var(--paper)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] select-none">
                      {clubData.initial}
                    </div>
                  </div>
                ) : (
                  /* Built-in Abstract Editorial Artwork with Warm Palette */
                  <div className="relative w-full h-full club-chamfer-shape bg-[var(--paper-deep)] overflow-hidden border border-[var(--ink)]/80 shadow-[inset_0_0_12px_var(--soft-rule)]">
                    <svg viewBox="0 0 142 178" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="142" height="178" fill="var(--paper-deep)" />
                      <line x1="16" y1="0" x2="16" y2="178" stroke="var(--ink)" strokeWidth="0.7" strokeOpacity="0.4" />
                      <line x1="0" y1="18" x2="142" y2="128" stroke="var(--ink)" strokeWidth="0.75" strokeOpacity="0.45" />
                      <line x1="28" y1="0" x2="120" y2="178" stroke="var(--ink)" strokeWidth="0.6" strokeOpacity="0.25" />
                      
                      {/* Dusty Mauve Oval */}
                      <ellipse cx="88" cy="66" rx="27" ry="25" fill="var(--rose)" />
                      
                      {/* Deep Cocoa Focal Dot */}
                      <circle cx="95" cy="58" r="3" fill="var(--ink)" />
                      
                      {/* Muted Plum Organic Mound */}
                      <path 
                        d="M 0,112 Q 38,98 76,112 Q 114,126 142,116 L 142,178 L 0,178 Z" 
                        fill="var(--wine)" 
                      />
                      
                      {/* High-Contrast Serif Initial in Parchment */}
                      <text 
                        x="22" 
                        y="156" 
                        fontFamily="'Cormorant Garamond', Georgia, serif" 
                        fontSize="34" 
                        fontStyle="italic" 
                        fontWeight="600" 
                        fill="var(--paper)"
                        className="select-none"
                      >
                        {clubData.initial}
                      </text>
                      
                      <polygon 
                        points="18,1 141,1 141,177 1,177 1,18" 
                        stroke="var(--ink)" 
                        strokeWidth="0.8" 
                        strokeOpacity="0.35" 
                        fill="none" 
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Profile Info */}
            <div className="flex flex-col justify-start pt-0 md:pt-0.5 min-w-0">
              {clubData.role && (
                <div className="text-[9px] md:text-[0.76rem] font-bold tracking-[0.2em] md:tracking-[0.22em] text-[var(--wine)] uppercase mb-1.5 md:mb-2.5 leading-snug">
                  {clubData.role}
                </div>
              )}

              <h1 className="font-club-serif tracking-[-0.015em] leading-[0.92] select-text">
                <span className="block text-[40px] md:text-[clamp(4.2rem,6.5vw,6.2rem)] font-normal text-[var(--ink)]">
                  {clubData.nameLineOne}
                </span>
                {clubData.nameLineTwo && (
                  <span className="block text-[40px] md:text-[clamp(4.2rem,6.5vw,6.2rem)] font-normal italic text-[var(--wine)] leading-[0.98]">
                    {clubData.nameLineTwo}
                  </span>
                )}
              </h1>

              {clubData.bio && (
                <p className="text-[12px] leading-[1.48] md:leading-[1.2] text-[var(--muted)] font-normal mt-3 md:mt-5 max-w-[280px] md:max-w-[85%] md:text-[1.25rem]">
                  {clubData.bio}
                </p>
              )}

              {/* Location & Status Metadata */}
              {(clubData.location || clubData.availability) && (
                <div className="mt-3.5 pt-2 border-t border-[var(--ink)]/15 flex items-center gap-1.5 text-[8px] font-medium tracking-[0.16em] uppercase text-[var(--muted)] flex-wrap">
                  {clubData.location && <span>{clubData.location}</span>}
                  {clubData.location && clubData.availability && (
                    <span className="text-[var(--wine)] text-[9px] leading-none" aria-hidden="true">•</span>
                  )}
                  {clubData.availability && <span>{clubData.availability}</span>}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ==================================================
            02 / SOCIALS SECTION (CENTRALIZED BRAND SVG SYSTEM)
        ================================================== */}
        {clubData.socials && clubData.socials.length > 0 && (
          <section 
            id="socials" 
            aria-label="Social Links"
            className="club-reveal-section px-5 md:px-[42px] pt-3 md:pt-[24px] pb-4 md:pb-[28px]"
          >
            {/* Section Header: Clean flex arrangement with NO horizontal connecting line */}
            <div className="flex items-baseline justify-between gap-3 mb-3.5">
              <h2 className="text-[9.5px] font-bold tracking-[0.22em] text-[var(--wine)] uppercase whitespace-nowrap">
                02 / SOCIALS
              </h2>
              <span className="text-[8.5px] font-medium tracking-[0.2em] text-[var(--muted)] uppercase">
                STAY CLOSE
              </span>
            </div>

            {/* Social Cards Grid: Desktop 2 cols + full width 5th; Mobile 1 col */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
              {clubData.socials.map((social, index) => {
                const isFullWidth = index === 4 && clubData.socials.length === 5;

                return (
                  <a
                    key={`${social.platform}-${index}`}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleSocialClick(social)}
                    aria-label={`${social.label} — ${social.sublabel || 'Social Link'}`}
                    className={`
                      group relative bg-[var(--paper-deep)] border border-[var(--ink)]/75 px-3.5 py-3 md:pt-[18px] md:px-[20px] md:pb-[28px] md:min-h-[96px] 
                      flex items-center justify-between rounded-[2px] transition-all duration-200 
                      hover:bg-[#DCD4C9] hover:border-[#6b2436] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(40,35,33,0.08)]
                      active:translate-y-0 active:scale-[0.99]
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b2436]
                      ${isFullWidth ? 'md:col-span-2' : ''}
                    `}
                  >
                    {/* Inset Hairline Frame */}
                    <div className="pointer-events-none absolute inset-[2.5px] border border-[var(--ink)]/15" aria-hidden="true" />

                    {/* Corner Bracket Mark in Bottom-Right Corner in Muted Plum */}
                    <div 
                      className="pointer-events-none absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b-[1.5px] border-r-[1.5px] border-[#6b2436]" 
                      aria-hidden="true" 
                    />

                    {/* Left: Authentic Brand SVG Icon in Plum & Title */}
                    <div className="flex items-center gap-3 md:gap-4 relative z-10">
                      <div className="w-5 h-5 md:w-[32px] md:h-[32px] flex items-center justify-center text-[var(--wine)] transition-transform duration-200 group-hover:scale-105">
                        {renderClubSocialIcon(social.platform, 'w-4 h-4 md:w-[26px] md:h-[26px]')}
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10.5px] md:text-[0.82rem] font-bold tracking-[0.16em] text-[var(--ink)] uppercase leading-tight">
                          {social.label}
                        </span>
                        <span className="text-[7.5px] font-medium tracking-[0.18em] text-[var(--muted)] uppercase mt-0.5">
                          {social.sublabel || `SOCIAL / 0${index + 1}`}
                        </span>
                      </div>
                    </div>

                    {/* Right: Upward-Right Arrow */}
                    <div className="relative z-10 text-[var(--ink)]/70 group-hover:text-[var(--wine)] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 pr-2">
                      <ArrowUpRightIcon className="w-3.5 h-3.5 md:w-5 md:h-5" />
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* ==================================================
            03 / THE RECORD SECTION (SEPARATE DESKTOP & MOBILE VIEWS)
        ================================================== */}
        {clubData.metrics && clubData.metrics.length > 0 && (
          <section 
            id="record" 
            aria-label="The Record"
            className="club-reveal-section px-5 md:px-6 pt-3 pb-4"
          >
            {/* Section Header: Clean flex arrangement with NO horizontal connecting line */}
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <h2 className="text-[9.5px] font-bold tracking-[0.22em] text-[var(--wine)] uppercase whitespace-nowrap">
                03 / THE RECORD
              </h2>
              <span className="text-[8.5px] font-medium tracking-[0.2em] text-[var(--muted)] uppercase">
                SELECTED SIGNALS
              </span>
            </div>

            {/* DESKTOP METRICS VIEW (.club-metrics-desktop: visible on desktop/tablet, hidden on mobile) */}
            <div className="club-metrics-desktop  relative bg-[var(--paper-deep)] border-t border-b border-[var(--ink)]/80 py-3.5 px-3 md:py-[24px] md:px-[42px]">
              {/* Top Corner Registration Marks in Muted Plum */}
              <div className="pointer-events-none absolute top-1 left-1.5 w-2 h-2 border-t border-l border-[#6b2436]" aria-hidden="true" />
              <div className="pointer-events-none absolute top-1 right-1.5 w-2 h-2 border-t border-r border-[#6b2436]" aria-hidden="true" />

              <div className="grid grid-cols-3 divide-x divide-[#282321]/20">
                {clubData.metrics.map((metric, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col px-2 md:px-3 relative ${idx === 0 ? 'pl-1 md:pl-2' : ''}`}
                  >
                    {/* Small editorial index in top-right */}
                    <div className="flex justify-end">
                      <span className="text-[7.5px] font-mono tracking-wider text-[var(--muted)]">
                        {metric.index || `0${idx + 1}`}
                      </span>
                    </div>

                    {/* Large High-Contrast Editorial Serif Number */}
                    <div className="font-club-serif text-[30px] md:text-[36px] font-normal leading-none text-[var(--ink)] my-1">
                      {metric.value}
                    </div>

                    {/* Actual Metric Label */}
                    <div className="text-[7.5px] md:text-[8px] font-semibold tracking-[0.16em] uppercase text-[var(--muted)] leading-tight">
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MOBILE METRICS VIEW (.club-metrics-mobile: visible on mobile, hidden on desktop/tablet) */}
            <div className="club-metrics-mobile  relative bg-[var(--paper-deep)] border border-[var(--ink)]/60 rounded-[2px] divide-y divide-[#282321]/20 overflow-hidden shadow-sm">
              {clubData.metrics.map((metric, idx) => (
                <div 
                  key={idx} 
                  className="flex items-baseline justify-between px-3.5 py-2.5 relative group"
                >
                  <div className="pointer-events-none absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-[#6b2436]" aria-hidden="true" />

                  {/* Left: Value + Actual Metric Label */}
                  <div className="flex items-baseline gap-2.5 min-w-0 pr-2">
                    <span className="font-club-serif text-[26px] font-normal leading-none text-[var(--ink)] shrink-0">
                      {metric.value}
                    </span>
                    <span className="text-[8px] font-semibold tracking-[0.16em] uppercase text-[var(--muted)] truncate">
                      {metric.label}
                    </span>
                  </div>

                  {/* Right: Small Index */}
                  <span className="text-[7.5px] font-mono text-[var(--muted)] shrink-0">
                    {metric.index || `0${idx + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ==================================================
            04 / INVITATION SECTION (INTERACTIVE CTA)
        ================================================== */}
        <section 
          id="invitation" 
          aria-label="Invitation"
          className="club-reveal-section bg-[var(--wine-deep)] text-[var(--paper)] px-5 md:px-[40px] py-5 md:py-[30px] transition-colors"
        >
          <div className="text-[8.5px] font-semibold tracking-[0.25em] text-[var(--rose)] uppercase mb-2">
            04 / INVITATION
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-club-serif tracking-[-0.015em] leading-[0.95] select-text">
                <span className="block text-[30px] md:text-[42px] font-normal text-[var(--paper)]">
                  Start a
                </span>
                <span className="block text-[30px] md:text-[42px] font-normal italic text-[var(--rose)] leading-[1.05]">
                  conversation.
                </span>
              </h2>
            </div>

            {/* Right: Framed Interactive CTA Button */}
            <div className="w-full md:w-auto self-start md:self-end">
              <a
                href={mailtoHref}
                className="group relative w-full md:w-auto inline-flex items-stretch justify-between border border-[var(--rose)] bg-transparent hover:bg-[var(--wine)] active:bg-[#2a0e15] transition-all duration-200 hover:-translate-y-0.5 hover:translate-x-0.5 active:translate-y-0 active:translate-x-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rose)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--wine-deep)]"
                aria-label={`${clubData.ctaLabel}${clubData.email ? ` — Email ${clubData.email}` : ''}`}
              >
                {/* Inset Hairline Frame */}
                <div className="pointer-events-none absolute inset-[2px] border border-[var(--rose)]/30" aria-hidden="true" />

                {/* Bottom-Right Corner Registration Accent */}
                <div className="pointer-events-none absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[var(--rose)]" aria-hidden="true" />

                {/* Left Text Segment */}
                <span className="flex-1 md:flex-initial px-4 py-2.5 md:px-6 md:py-3.5 text-[9.5px] font-semibold tracking-[0.2em] text-[var(--paper)] uppercase border-r border-[var(--rose)]/80 group-hover:border-[var(--rose)] group-hover:text-white transition-colors truncate">
                  {clubData.ctaLabel}
                </span>

                {/* Right Arrow Segment */}
                <span className="px-3 py-2.5 md:px-5 md:py-3.5 flex items-center justify-center text-[var(--paper)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200 shrink-0">
                  <ArrowUpRightIcon className="w-3.5 h-3.5 md:w-5 md:h-5" />
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* ==================================================
            10 / FOOTER
        ================================================== */}
        <footer 
          aria-label="Profile Footer"
          className="bg-[var(--paper-deep)] border-t border-[var(--ink)]/20 px-5 md:px-6 py-3.5 flex items-center justify-between text-[8px] font-semibold tracking-[0.2em] uppercase text-[var(--muted)]"
        >
          <div>
            THE CLUB / {currentYear}
          </div>

          <div className="hidden xs:block text-[var(--muted)] text-[7.5px] truncate max-w-[200px] text-center">
            {clubData.footerStatement}
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top of profile"
            className="flex items-center gap-1 hover:text-[var(--wine)] transition-colors p-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6b2436]"
          >
            <span className="sr-only">Back to top</span>
            <ArrowUpIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--ink)] hover:text-[var(--wine)]" />
          </button>
        </footer>
      </article>
    </div>
  );
}

export default ClubTemplate;
