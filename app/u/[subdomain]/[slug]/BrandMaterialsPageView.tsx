'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ExternalLink, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  File, 
  Globe, 
  Share2, 
  Check, 
  Copy, 
  Sparkles, 
  BadgeCheck, 
  AlignLeft,
  Layers,
  ChevronDown,
  Eye,
  Palette,
  Instagram
} from 'lucide-react';

export interface MaterialItem {
  id: string;
  type: 'image' | 'pdf' | 'doc' | 'website' | 'text' | 'page';
  title: string;
  description?: string;
  content?: string; // Rich text / notes / specs
  url?: string;
  thumbnailUrl?: string;
  category?: string;
  size?: string;
  order?: number;
}

export interface BrandMaterialsPageData {
  id?: string;
  slug?: string;
  title: string;
  tagline?: string | null;
  description?: string | null;
  materials: MaterialItem[];
  linked_posts?: any[];
  theme?: {
    accentColor?: string;
    template?: string;
    linked_posts?: any[];
  };
  is_published?: boolean;
}

export interface CreatorProfile {
  name?: string;
  subdomain: string;
  avatarUrl?: string | null;
  role?: string | null;
  company?: string | null;
  bio?: string | null;
}

interface Props {
  subdomain: string;
  slug?: string;
  pageData: BrandMaterialsPageData;
  profile?: CreatorProfile | null;
  appUrl?: string;
  liveTemplate?: string;
  searchParams?: { [key: string]: string | string[] | undefined };
}

// Clean helper for masking Cloudflare URLs
function maskCloudflareUrl(url?: string | null): string {
  if (!url) return '';
  const matchR2Dev = url.match(/https?:\/\/[^/]+\.r2\.dev\/(.+)$/);
  if (matchR2Dev) return `/api/media/${matchR2Dev[1]}`;
  const matchR2Storage = url.match(/https?:\/\/[^/]+\.r2\.cloudflarestorage\.com\/[^/]+\/(.+)$/);
  if (matchR2Storage) return `/api/media/${matchR2Storage[1]}`;
  return url;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE REGISTRY & DESIGN SYSTEM
// Matches all 15 persona-driven templates in Templates & Design section
// ─────────────────────────────────────────────────────────────────────────────

export interface TemplateThemeSpec {
  id: string;
  name: string;
  tagline: string;
  isDark: boolean;
  googleFonts: string;
  fontFamily: string;
  fontSerif?: string;
  fontMono?: string;
  pageBg: string;
  pageTextColor: string;
  accentColor: string;
  ambientGlow?: string;
  containerBg: string;
  containerBorder: string;
  containerRadius: string;
  containerShadow: string;
  previewCardBg: string;
  previewCardBorder: string;
  previewCardRadius: string;
  previewCardShadow?: string;
  btnPrimaryBg: string;
  btnPrimaryText: string;
  btnPrimaryHoverBg: string;
  btnPrimaryRadius: string;
  btnPrimaryShadow?: string;
  itemCardBg: string;
  itemCardBorder: string;
  itemCardHoverBorder: string;
  badgeBg: string;
  badgeText: string;
  profileCardBg: string;
  profileCardBorder: string;
  mutedTextColor: string;
  dividerBorder: string;
}

export const SHOWCASE_THEMES: Record<string, TemplateThemeSpec> = {
  // 01 — INDIVIDUAL
  'the-voice': {
    id: 'the-voice',
    name: 'The Voice',
    tagline: 'Opinion leader & storyteller',
    isDark: false,
    googleFonts: '@import url(\'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap\');',
    fontFamily: '\'Plus Jakarta Sans\', sans-serif',
    fontSerif: '\'Playfair Display\', Georgia, serif',
    pageBg: '#F7F9F7',
    pageTextColor: '#1C2B21',
    accentColor: '#DF5B4C',
    containerBg: '#EBF0EC',
    containerBorder: '1px solid rgba(141, 163, 150, 0.35)',
    containerRadius: '36px',
    containerShadow: '0 20px 50px rgba(141, 163, 150, 0.25)',
    previewCardBg: 'linear-gradient(135deg, #E2EAE5 0%, #D0DDD5 100%)',
    previewCardBorder: '1px solid rgba(255, 255, 255, 0.6)',
    previewCardRadius: '28px',
    previewCardShadow: '10px 10px 30px rgba(168, 184, 157, 0.3), inset 1px 1px 3px rgba(255, 255, 255, 0.6)',
    btnPrimaryBg: '#DF5B4C',
    btnPrimaryText: '#FFFAF3',
    btnPrimaryHoverBg: '#B8473D',
    btnPrimaryRadius: '9999px',
    itemCardBg: 'rgba(255, 255, 255, 0.75)',
    itemCardBorder: '1px solid rgba(141, 163, 150, 0.3)',
    itemCardHoverBorder: '#1C2B21',
    badgeBg: 'rgba(223, 91, 76, 0.1)',
    badgeText: '#DF5B4C',
    profileCardBg: 'rgba(255, 255, 255, 0.75)',
    profileCardBorder: '1px solid rgba(141, 163, 150, 0.35)',
    mutedTextColor: 'rgba(43, 35, 33, 0.75)',
    dividerBorder: 'rgba(141, 163, 150, 0.25)',
  },
  'lover': {
    id: 'lover',
    name: 'The Lover',
    tagline: 'Romantic, emotional & expressive',
    isDark: false,
    googleFonts: '@import url(\'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap\');',
    fontFamily: '\'Plus Jakarta Sans\', sans-serif',
    fontSerif: '\'Playfair Display\', Georgia, serif',
    pageBg: '#FAF5F0',
    pageTextColor: '#26160F',
    accentColor: '#CF5628',
    containerBg: '#FFFDF9',
    containerBorder: '1.5px solid rgba(42, 23, 16, 0.12)',
    containerRadius: '32px',
    containerShadow: '0 16px 40px rgba(42, 23, 16, 0.08)',
    previewCardBg: '#FAF5F0',
    previewCardBorder: '1px solid rgba(207, 86, 40, 0.18)',
    previewCardRadius: '24px',
    previewCardShadow: '0 6px 20px rgba(42, 23, 16, 0.05)',
    btnPrimaryBg: 'linear-gradient(135deg, #CF5628 0%, #B34115 100%)',
    btnPrimaryText: '#FFFFFF',
    btnPrimaryHoverBg: '#9C360F',
    btnPrimaryRadius: '9999px',
    itemCardBg: '#FFFDF9',
    itemCardBorder: '1px solid rgba(42, 23, 16, 0.12)',
    itemCardHoverBorder: '#CF5628',
    badgeBg: '#F5E6DC',
    badgeText: '#A64522',
    profileCardBg: '#FAF5F0',
    profileCardBorder: '1px solid rgba(42, 23, 16, 0.12)',
    mutedTextColor: 'rgba(38, 22, 15, 0.7)',
    dividerBorder: 'rgba(42, 23, 16, 0.12)',
  },
  'lone': {
    id: 'lone',
    name: 'The Lone',
    tagline: 'Quiet, cinematic solitude',
    isDark: true,
    googleFonts: '@import url(\'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap\');',
    fontFamily: '\'Inter\', -apple-system, sans-serif',
    pageBg: '#08090C',
    pageTextColor: '#F4EFE7',
    accentColor: '#6366F1',
    ambientGlow: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.22) 0%, rgba(18, 61, 255, 0.12) 50%, transparent 80%)',
    containerBg: 'rgba(13, 14, 18, 0.92)',
    containerBorder: '1px solid rgba(255, 255, 255, 0.09)',
    containerRadius: '32px',
    containerShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
    previewCardBg: 'rgba(255, 255, 255, 0.035)',
    previewCardBorder: '1px solid rgba(255, 255, 255, 0.1)',
    previewCardRadius: '24px',
    btnPrimaryBg: '#FFFFFF',
    btnPrimaryText: '#000000',
    btnPrimaryHoverBg: 'rgba(255, 255, 255, 0.9)',
    btnPrimaryRadius: '9999px',
    itemCardBg: 'rgba(255, 255, 255, 0.035)',
    itemCardBorder: '1px solid rgba(255, 255, 255, 0.08)',
    itemCardHoverBorder: '#6366F1',
    badgeBg: 'rgba(99, 102, 241, 0.15)',
    badgeText: '#A5B4FC',
    profileCardBg: 'rgba(255, 255, 255, 0.04)',
    profileCardBorder: '1px solid rgba(255, 255, 255, 0.1)',
    mutedTextColor: 'rgba(244, 239, 231, 0.65)',
    dividerBorder: 'rgba(255, 255, 255, 0.1)',
  },
  'energy': {
    id: 'energy',
    name: 'The Energy',
    tagline: 'Discipline, ambition & growth',
    isDark: true,
    googleFonts: '@import url(\'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap\');',
    fontFamily: '\'Plus Jakarta Sans\', sans-serif',
    pageBg: '#0A0A0A',
    pageTextColor: '#FFFFFF',
    accentColor: '#CCFF00',
    ambientGlow: 'radial-gradient(ellipse at center, rgba(204, 255, 0, 0.15) 0%, transparent 70%)',
    containerBg: '#141414',
    containerBorder: '2px solid #262626',
    containerRadius: '20px',
    containerShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
    previewCardBg: '#1A1A1A',
    previewCardBorder: '2px solid #333333',
    previewCardRadius: '16px',
    btnPrimaryBg: '#CCFF00',
    btnPrimaryText: '#000000',
    btnPrimaryHoverBg: '#B8E600',
    btnPrimaryRadius: '6px',
    itemCardBg: '#181818',
    itemCardBorder: '1px solid #2A2A2A',
    itemCardHoverBorder: '#CCFF00',
    badgeBg: 'rgba(204, 255, 0, 0.12)',
    badgeText: '#CCFF00',
    profileCardBg: '#181818',
    profileCardBorder: '2px solid #262626',
    mutedTextColor: '#A3A3A3',
    dividerBorder: '#262626',
  },

  // 02 — STARTUP
  'rebellion': {
    id: 'rebellion',
    name: 'The Rebellion',
    tagline: 'Disruptive, anti-corporate & bold',
    isDark: true,
    googleFonts: '@import url(\'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap\');',
    fontFamily: '\'Space Grotesk\', sans-serif',
    fontMono: 'monospace',
    pageBg: '#0D0D0D',
    pageTextColor: '#FFFFFF',
    accentColor: '#C8102E',
    containerBg: '#171717',
    containerBorder: '1.5px solid rgba(200, 16, 46, 0.4)',
    containerRadius: '22px',
    containerShadow: '0 20px 50px rgba(200, 16, 46, 0.15)',
    previewCardBg: '#202020',
    previewCardBorder: '1px solid rgba(255, 255, 255, 0.15)',
    previewCardRadius: '16px',
    btnPrimaryBg: '#C8102E',
    btnPrimaryText: '#FFFFFF',
    btnPrimaryHoverBg: '#A00C24',
    btnPrimaryRadius: '8px',
    itemCardBg: '#202020',
    itemCardBorder: '1px solid rgba(255, 255, 255, 0.1)',
    itemCardHoverBorder: '#C8102E',
    badgeBg: 'rgba(200, 16, 46, 0.15)',
    badgeText: '#FF4D6D',
    profileCardBg: '#1B1B1B',
    profileCardBorder: '1px solid rgba(200, 16, 46, 0.3)',
    mutedTextColor: '#A1A1AA',
    dividerBorder: 'rgba(255, 255, 255, 0.12)',
  },
  'vision': {
    id: 'vision',
    name: 'The Vision',
    tagline: 'Futuristic intelligence & technology',
    isDark: true,
    googleFonts: '@import url(\'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap\');',
    fontFamily: '\'Inter\', sans-serif',
    fontSerif: '\'Space Grotesk\', sans-serif',
    pageBg: '#050814',
    pageTextColor: '#F8FAFC',
    accentColor: '#38BDF8',
    ambientGlow: 'radial-gradient(ellipse at center, rgba(56, 189, 248, 0.22) 0%, rgba(14, 165, 233, 0.1) 50%, transparent 80%)',
    containerBg: 'rgba(15, 23, 42, 0.88)',
    containerBorder: '1px solid rgba(56, 189, 248, 0.25)',
    containerRadius: '30px',
    containerShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
    previewCardBg: 'rgba(30, 41, 59, 0.65)',
    previewCardBorder: '1px solid rgba(56, 189, 248, 0.18)',
    previewCardRadius: '22px',
    btnPrimaryBg: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
    btnPrimaryText: '#FFFFFF',
    btnPrimaryHoverBg: '#0369A1',
    btnPrimaryRadius: '9999px',
    itemCardBg: 'rgba(30, 41, 59, 0.5)',
    itemCardBorder: '1px solid rgba(56, 189, 248, 0.15)',
    itemCardHoverBorder: '#38BDF8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeText: '#7DD3FC',
    profileCardBg: 'rgba(15, 23, 42, 0.8)',
    profileCardBorder: '1px solid rgba(56, 189, 248, 0.22)',
    mutedTextColor: '#94A3B8',
    dividerBorder: 'rgba(56, 189, 248, 0.15)',
  },
  'human': {
    id: 'human',
    name: 'The Human',
    tagline: 'Warm, community-driven & optimistic',
    isDark: false,
    googleFonts: '@import url(\'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap\');',
    fontFamily: '\'Plus Jakarta Sans\', sans-serif',
    pageBg: '#FDFBF7',
    pageTextColor: '#2D2825',
    accentColor: '#E07A5F',
    containerBg: '#FFFFFF',
    containerBorder: '1.5px solid #E8DFD1',
    containerRadius: '32px',
    containerShadow: '0 10px 35px rgba(45, 40, 37, 0.06)',
    previewCardBg: '#F9F6F0',
    previewCardBorder: '1px solid #E8DFD1',
    previewCardRadius: '24px',
    btnPrimaryBg: '#E07A5F',
    btnPrimaryText: '#FFFFFF',
    btnPrimaryHoverBg: '#C9684F',
    btnPrimaryRadius: '9999px',
    itemCardBg: '#FFFFFF',
    itemCardBorder: '1px solid #E8DFD1',
    itemCardHoverBorder: '#E07A5F',
    badgeBg: 'rgba(224, 122, 95, 0.12)',
    badgeText: '#C9684F',
    profileCardBg: '#F9F6F0',
    profileCardBorder: '1.5px solid #E8DFD1',
    mutedTextColor: '#6B6058',
    dividerBorder: '#E8DFD1',
  },

  // 03 — AGENCY
  'the-studio': {
    id: 'the-studio',
    name: 'The Studio',
    tagline: 'High-end creative & editorial design',
    isDark: false,
    googleFonts: '@import url(\'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600&display=swap\');',
    fontFamily: '\'Inter\', sans-serif',
    fontSerif: '\'Playfair Display\', Georgia, serif',
    pageBg: '#F4F4F0',
    pageTextColor: '#111111',
    accentColor: '#111111',
    containerBg: '#FFFFFF',
    containerBorder: '1px solid #E0E0DC',
    containerRadius: '26px',
    containerShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
    previewCardBg: '#FAFAF8',
    previewCardBorder: '1px solid #E5E5E0',
    previewCardRadius: '20px',
    btnPrimaryBg: '#111111',
    btnPrimaryText: '#FFFFFF',
    btnPrimaryHoverBg: '#333333',
    btnPrimaryRadius: '9999px',
    itemCardBg: '#FFFFFF',
    itemCardBorder: '1px solid #E0E0DC',
    itemCardHoverBorder: '#111111',
    badgeBg: '#EAEAEA',
    badgeText: '#111111',
    profileCardBg: '#FAFAF8',
    profileCardBorder: '1px solid #E0E0DC',
    mutedTextColor: '#666666',
    dividerBorder: '#E0E0DC',
  },
  'the-machine': {
    id: 'the-machine',
    name: 'The Machine',
    tagline: 'Fast, data-driven & performance focused',
    isDark: true,
    googleFonts: '@import url(\'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap\');',
    fontFamily: '\'Inter\', sans-serif',
    fontMono: '\'JetBrains Mono\', monospace',
    pageBg: '#0A0E17',
    pageTextColor: '#F9FAFB',
    accentColor: '#3B82F6',
    containerBg: '#111827',
    containerBorder: '1px solid rgba(59, 130, 246, 0.28)',
    containerRadius: '20px',
    containerShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
    previewCardBg: '#1F2937',
    previewCardBorder: '1px solid rgba(59, 130, 246, 0.18)',
    previewCardRadius: '14px',
    btnPrimaryBg: '#3B82F6',
    btnPrimaryText: '#FFFFFF',
    btnPrimaryHoverBg: '#2563EB',
    btnPrimaryRadius: '6px',
    itemCardBg: '#162032',
    itemCardBorder: '1px solid rgba(59, 130, 246, 0.18)',
    itemCardHoverBorder: '#3B82F6',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
    badgeText: '#60A5FA',
    profileCardBg: '#131D2E',
    profileCardBorder: '1px solid rgba(59, 130, 246, 0.22)',
    mutedTextColor: '#9CA3AF',
    dividerBorder: 'rgba(59, 130, 246, 0.15)',
  },
  'the-club': {
    id: 'the-club',
    name: 'The Club',
    tagline: 'Trend-focused culture & creators',
    isDark: true,
    googleFonts: '@import url(\'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap\');',
    fontFamily: '\'Plus Jakarta Sans\', sans-serif',
    pageBg: '#0A0915',
    pageTextColor: '#FDF4FF',
    accentColor: '#D946EF',
    ambientGlow: 'radial-gradient(ellipse at center, rgba(217, 70, 239, 0.25) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 80%)',
    containerBg: 'rgba(26, 20, 48, 0.82)',
    containerBorder: '1px solid rgba(217, 70, 239, 0.32)',
    containerRadius: '30px',
    containerShadow: '0 20px 60px rgba(217, 70, 239, 0.12)',
    previewCardBg: 'rgba(38, 28, 70, 0.65)',
    previewCardBorder: '1px solid rgba(217, 70, 239, 0.22)',
    previewCardRadius: '22px',
    btnPrimaryBg: 'linear-gradient(135deg, #C026D3 0%, #D946EF 100%)',
    btnPrimaryText: '#FFFFFF',
    btnPrimaryHoverBg: '#A21CAF',
    btnPrimaryRadius: '9999px',
    itemCardBg: 'rgba(38, 28, 70, 0.55)',
    itemCardBorder: '1px solid rgba(217, 70, 239, 0.2)',
    itemCardHoverBorder: '#D946EF',
    badgeBg: 'rgba(217, 70, 239, 0.18)',
    badgeText: '#F0ABFC',
    profileCardBg: 'rgba(26, 20, 48, 0.75)',
    profileCardBorder: '1px solid rgba(217, 70, 239, 0.28)',
    mutedTextColor: 'rgba(253, 244, 255, 0.68)',
    dividerBorder: 'rgba(217, 70, 239, 0.18)',
  },

  // 04 — ENTREPRENEUR
  'the-builder': {
    id: 'the-builder',
    name: 'The Builder',
    tagline: 'Focused, disciplined & productive',
    isDark: true,
    googleFonts: '@import url(\'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap\');',
    fontFamily: '\'Inter\', sans-serif',
    pageBg: '#0F172A',
    pageTextColor: '#F8FAFC',
    accentColor: '#F97316',
    containerBg: '#1E293B',
    containerBorder: '1px solid rgba(148, 163, 184, 0.2)',
    containerRadius: '22px',
    containerShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
    previewCardBg: '#283548',
    previewCardBorder: '1px solid rgba(249, 115, 22, 0.22)',
    previewCardRadius: '16px',
    btnPrimaryBg: '#F97316',
    btnPrimaryText: '#FFFFFF',
    btnPrimaryHoverBg: '#EA580C',
    btnPrimaryRadius: '10px',
    itemCardBg: '#233044',
    itemCardBorder: '1px solid rgba(148, 163, 184, 0.15)',
    itemCardHoverBorder: '#F97316',
    badgeBg: 'rgba(249, 115, 22, 0.15)',
    badgeText: '#FDBA74',
    profileCardBg: '#1E293B',
    profileCardBorder: '1px solid rgba(148, 163, 184, 0.2)',
    mutedTextColor: '#94A3B8',
    dividerBorder: 'rgba(148, 163, 184, 0.15)',
  },
  'the-visionary': {
    id: 'the-visionary',
    name: 'The Visionary',
    tagline: 'Inspirational, executive & premium',
    isDark: true,
    googleFonts: '@import url(\'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Inter:wght@400;500;600&display=swap\');',
    fontFamily: '\'Inter\', sans-serif',
    fontSerif: '\'Playfair Display\', Georgia, serif',
    pageBg: '#030712',
    pageTextColor: '#FFFFFF',
    accentColor: '#D4AF37',
    ambientGlow: 'radial-gradient(ellipse at center, rgba(212, 175, 55, 0.2) 0%, rgba(99, 102, 241, 0.1) 50%, transparent 80%)',
    containerBg: 'rgba(17, 24, 39, 0.88)',
    containerBorder: '1px solid rgba(212, 175, 55, 0.35)',
    containerRadius: '32px',
    containerShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
    previewCardBg: 'rgba(31, 41, 55, 0.7)',
    previewCardBorder: '1px solid rgba(212, 175, 55, 0.22)',
    previewCardRadius: '22px',
    btnPrimaryBg: 'linear-gradient(135deg, #D4AF37 0%, #B89628 100%)',
    btnPrimaryText: '#000000',
    btnPrimaryHoverBg: '#9E801F',
    btnPrimaryRadius: '9999px',
    itemCardBg: 'rgba(31, 41, 55, 0.55)',
    itemCardBorder: '1px solid rgba(212, 175, 55, 0.18)',
    itemCardHoverBorder: '#D4AF37',
    badgeBg: 'rgba(212, 175, 55, 0.15)',
    badgeText: '#FDE047',
    profileCardBg: 'rgba(17, 24, 39, 0.85)',
    profileCardBorder: '1px solid rgba(212, 175, 55, 0.28)',
    mutedTextColor: '#D1D5DB',
    dividerBorder: 'rgba(212, 175, 55, 0.18)',
  },
  'the-hustler': {
    id: 'the-hustler',
    name: 'The Hustler',
    tagline: 'Energetic, fast-moving & bold',
    isDark: true,
    googleFonts: '@import url(\'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap\');',
    fontFamily: '\'Plus Jakarta Sans\', sans-serif',
    pageBg: '#09090B',
    pageTextColor: '#FAFAFA',
    accentColor: '#F43F5E',
    containerBg: '#18181B',
    containerBorder: '1px solid #27272A',
    containerRadius: '24px',
    containerShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
    previewCardBg: '#202024',
    previewCardBorder: '1px solid rgba(244, 63, 94, 0.28)',
    previewCardRadius: '16px',
    btnPrimaryBg: '#F43F5E',
    btnPrimaryText: '#FFFFFF',
    btnPrimaryHoverBg: '#E11D48',
    btnPrimaryRadius: '8px',
    itemCardBg: '#202024',
    itemCardBorder: '1px solid #27272A',
    itemCardHoverBorder: '#F43F5E',
    badgeBg: 'rgba(244, 63, 94, 0.15)',
    badgeText: '#FDA4AF',
    profileCardBg: '#18181B',
    profileCardBorder: '1px solid #27272A',
    mutedTextColor: '#A1A1AA',
    dividerBorder: '#27272A',
  },

  // 05 — INFLUENCER
  'the-aesthete': {
    id: 'the-aesthete',
    name: 'The Aesthete',
    tagline: 'Elegant, curated & luxury magazine',
    isDark: false,
    googleFonts: '@import url(\'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap\');',
    fontFamily: '\'Plus Jakarta Sans\', sans-serif',
    fontSerif: '\'Playfair Display\', Georgia, serif',
    pageBg: '#FAF8F5',
    pageTextColor: '#1C1917',
    accentColor: '#B45309',
    containerBg: '#FFFFFF',
    containerBorder: '1px solid #E7E5E4',
    containerRadius: '34px',
    containerShadow: '0 12px 40px rgba(28, 25, 23, 0.05)',
    previewCardBg: '#F5F5F4',
    previewCardBorder: '1px solid #E7E5E4',
    previewCardRadius: '24px',
    btnPrimaryBg: '#1C1917',
    btnPrimaryText: '#FFFFFF',
    btnPrimaryHoverBg: '#44403C',
    btnPrimaryRadius: '9999px',
    itemCardBg: '#FFFFFF',
    itemCardBorder: '1px solid #E7E5E4',
    itemCardHoverBorder: '#B45309',
    badgeBg: 'rgba(180, 83, 9, 0.12)',
    badgeText: '#B45309',
    profileCardBg: '#FAF8F5',
    profileCardBorder: '1px solid #E7E5E4',
    mutedTextColor: '#78716C',
    dividerBorder: '#E7E5E4',
  },
  'the-creator': {
    id: 'the-creator',
    name: 'The Creator',
    tagline: 'Vibrant, motion-inspired video creator',
    isDark: true,
    googleFonts: '@import url(\'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&display=swap\');',
    fontFamily: '\'Plus Jakarta Sans\', sans-serif',
    pageBg: '#0F0E17',
    pageTextColor: '#FFFFFE',
    accentColor: '#FF8906',
    ambientGlow: 'radial-gradient(ellipse at center, rgba(255, 137, 6, 0.25) 0%, rgba(229, 49, 112, 0.15) 50%, transparent 80%)',
    containerBg: 'rgba(30, 27, 46, 0.88)',
    containerBorder: '1px solid rgba(255, 137, 6, 0.32)',
    containerRadius: '30px',
    containerShadow: '0 20px 60px rgba(255, 137, 6, 0.12)',
    previewCardBg: 'rgba(45, 41, 68, 0.65)',
    previewCardBorder: '1px solid rgba(255, 137, 6, 0.2)',
    previewCardRadius: '22px',
    btnPrimaryBg: 'linear-gradient(135deg, #FF8906 0%, #E53170 100%)',
    btnPrimaryText: '#FFFFFF',
    btnPrimaryHoverBg: '#E67A00',
    btnPrimaryRadius: '9999px',
    itemCardBg: 'rgba(45, 41, 68, 0.55)',
    itemCardBorder: '1px solid rgba(255, 137, 6, 0.18)',
    itemCardHoverBorder: '#FF8906',
    badgeBg: 'rgba(255, 137, 6, 0.15)',
    badgeText: '#FDBA74',
    profileCardBg: 'rgba(30, 27, 46, 0.8)',
    profileCardBorder: '1px solid rgba(255, 137, 6, 0.25)',
    mutedTextColor: '#A7A9BE',
    dividerBorder: 'rgba(255, 137, 6, 0.18)',
  },
};

// Aliases for legacy and alternative IDs
const THEME_ALIASES: Record<string, string> = {
  'voice': 'the-voice',
  'the-lone': 'lone',
  'the-lover': 'lover',
  'studio': 'the-studio',
  'machine': 'the-machine',
  'club': 'the-club',
  'builder': 'the-builder',
  'visionary': 'the-visionary',
  'hustler': 'the-hustler',
  'aesthete': 'the-aesthete',
  'creator': 'the-creator',
  // Legacy identity mappings
  'student': 'lone',
  'founder': 'the-visionary',
  'developer': 'the-builder',
  'minimalist': 'the-studio',
  'ngo': 'human',
  'premium-opaque': 'the-visionary',
  'glossy-premium': 'the-club',
};

export function resolveShowcaseTheme(rawId?: string | null): TemplateThemeSpec {
  if (!rawId) return SHOWCASE_THEMES['the-voice'];
  const lower = rawId.toLowerCase().trim();
  const direct = SHOWCASE_THEMES[lower];
  if (direct) return direct;
  const alias = THEME_ALIASES[lower];
  if (alias && SHOWCASE_THEMES[alias]) return SHOWCASE_THEMES[alias];
  return SHOWCASE_THEMES['the-voice'];
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: BRAND MATERIALS PAGE VIEW
// Guarantees 100% consistent 5-section format across all 15 templates
// ─────────────────────────────────────────────────────────────────────────────

export default function BrandMaterialsPageView({
  subdomain,
  slug,
  pageData,
  profile,
  liveTemplate = 'the-voice',
  searchParams,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const [copiedContent, setCopiedContent] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<MaterialItem | null>(null);

  // Read URL search param for quick previewing any template or item
  const rawTargetQuery = searchParams?.item || searchParams?.file || searchParams?.product || searchParams?.material || '';
  const targetSlug = String(rawTargetQuery).trim();

  // Template override from query string (?template=lover, ?template=lone, etc.) or page data
  const templateOverrideParam = searchParams?.template ? String(searchParams.template).trim() : null;
  const activeTemplateId = templateOverrideParam || pageData.theme?.template || liveTemplate || 'the-voice';
  const theme = useMemo(() => resolveShowcaseTheme(activeTemplateId), [activeTemplateId]);

  const materials = useMemo(() => {
    return (pageData.materials || []).map(m => ({
      ...m,
      url: maskCloudflareUrl(m.url),
      thumbnailUrl: m.thumbnailUrl ? maskCloudflareUrl(m.thumbnailUrl) : undefined,
    }));
  }, [pageData.materials]);

  // Selected or primary material to preview directly in the card
  const selectedMaterial = useMemo(() => {
    if (materials.length === 0) return null;
    if (!targetSlug) return materials[0];

    const qLower = targetSlug.toLowerCase();
    const match = materials.find((m) => {
      const slugTitle = m.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      return (
        m.id.toLowerCase() === qLower ||
        slugTitle === qLower ||
        slugTitle.includes(qLower) ||
        qLower.includes(slugTitle) ||
        m.title.toLowerCase().includes(qLower)
      );
    });

    return match || materials[0];
  }, [materials, targetSlug]);

  // Canonical live page URL that redirects directly back to user's live page
  const livePageHref = typeof window !== 'undefined' && window.location.hostname.endsWith('.unool.co')
    ? `https://${subdomain}.unool.co/`
    : `/u/${subdomain}`;
  const profileUrl = livePageHref;

  // Clean canonical page URL for this specific post/brand page
  const effectiveSlug = slug || pageData.slug || '';
  const currentItemParam = selectedMaterial ? encodeURIComponent(selectedMaterial.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_').substring(0, 40)) : '';
  const pageUrl = (effectiveSlug && effectiveSlug !== 'showcase')
    ? `https://${subdomain}.unool.co/${effectiveSlug}`
    : `https://${subdomain}.unool.co/${currentItemParam ? `?item=${currentItemParam}` : ''}`;

  const copyPageLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const copyItemLink = (item: MaterialItem) => {
    const slugified = encodeURIComponent(
      item.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_').substring(0, 40)
    );
    const directUrl = (effectiveSlug && effectiveSlug !== 'showcase')
      ? `https://${subdomain}.unool.co/${effectiveSlug}?item=${slugified}`
      : `https://${subdomain}.unool.co/?item=${slugified}`;
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(directUrl);
      setCopiedItemId(item.id);
      setTimeout(() => setCopiedItemId(null), 2000);
    }
  };

  const copyTextContent = (text: string) => {
    if (typeof window !== 'undefined' && text) {
      navigator.clipboard.writeText(text);
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-5 h-5" style={{ color: theme.accentColor }} />;
      case 'text':
        return <AlignLeft className="w-5 h-5" style={{ color: theme.accentColor }} />;
      case 'pdf':
        return <FileText className="w-5 h-5" style={{ color: theme.accentColor }} />;
      case 'doc':
        return <File className="w-5 h-5" style={{ color: theme.accentColor }} />;
      case 'website':
      case 'page':
      default:
        return <Globe className="w-5 h-5" style={{ color: theme.accentColor }} />;
    }
  };

  return (
    <div 
      className="w-full min-h-screen antialiased flex flex-col items-center justify-start p-4 sm:p-6 md:p-10 lg:p-14 relative overflow-x-hidden"
      style={{
        backgroundColor: theme.pageBg,
        color: theme.pageTextColor,
        fontFamily: theme.fontFamily,
      }}
    >
      {/* Dynamic Google Fonts injection for the active template */}
      <style dangerouslySetInnerHTML={{ __html: `
        ${theme.googleFonts}
        .showcase-font-serif {
          font-family: ${theme.fontSerif || theme.fontFamily};
        }
        .showcase-font-sans {
          font-family: ${theme.fontFamily};
        }
        .showcase-btn-primary {
          background: ${theme.btnPrimaryBg};
          color: ${theme.btnPrimaryText};
          border-radius: ${theme.btnPrimaryRadius};
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .showcase-btn-primary:hover {
          background: ${theme.btnPrimaryHoverBg};
          transform: translateY(-1px);
        }
      ` }} />

      {/* Ambient background glow if configured for dark/futuristic templates */}
      {theme.ambientGlow && (
        <div 
          className="pointer-events-none fixed top-[-100px] left-1/2 -translate-x-1/2 w-[900px] h-[550px] blur-[140px] opacity-35 rounded-full"
          style={{ background: theme.ambientGlow }}
        />
      )}

      {/* Main Card Container */}
      <div 
        className="w-full max-w-[1000px] relative z-10 overflow-hidden flex flex-col py-8 md:py-14 px-5 sm:px-8 md:px-14 transition-all duration-300"
        style={{
          backgroundColor: theme.containerBg,
          border: theme.containerBorder,
          borderRadius: theme.containerRadius,
          boxShadow: theme.containerShadow,
        }}
      >
        
        {/* ── SECTION 1: HERO HEADER ── */}
        <section className="py-2 md:py-4 flex flex-col items-start gap-3">
          <h1 
            className="showcase-font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] max-w-3xl"
            style={{ color: theme.pageTextColor }}
          >
            {pageData.title || `${profile?.name || 'Brand'} Showcase`}
          </h1>

          {pageData.tagline && (
            <p 
              className="showcase-font-serif text-base sm:text-xl italic max-w-2xl leading-relaxed"
              style={{ color: theme.mutedTextColor }}
            >
              "{pageData.tagline}"
            </p>
          )}

          {pageData.description && (
            <p 
              className="text-sm max-w-2xl leading-relaxed"
              style={{ color: theme.mutedTextColor }}
            >
              {pageData.description}
            </p>
          )}

          {/* Linked Instagram Post Connection Badge */}
          {((pageData.linked_posts && pageData.linked_posts.length > 0) || (pageData.theme?.linked_posts && pageData.theme.linked_posts.length > 0)) && (
            <div 
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mt-1 shadow-xs"
              style={{
                backgroundColor: theme.badgeBg,
                color: theme.badgeText,
                border: `1px solid ${theme.itemCardBorder}`,
              }}
            >
              <Instagram size={13} />
              <span>
                Connected to Instagram Post • Exclusive Resources &amp; Materials
              </span>
            </div>
          )}
        </section>

        {/* ── SECTION 2: MAIN SHOWCASE PREVIEW CARD ── */}
        {selectedMaterial ? (
          <section 
            className="my-8 p-6 sm:p-8 relative overflow-hidden transition-all duration-300"
            style={{
              background: theme.previewCardBg,
              border: theme.previewCardBorder,
              borderRadius: theme.previewCardRadius,
              boxShadow: theme.previewCardShadow || 'none',
            }}
          >
            <div className="flex flex-col gap-6">
              
              {/* 1. Direct Image Preview right inside the card */}
              {selectedMaterial.type === 'image' && (
                <div 
                  className="w-full rounded-2xl overflow-hidden shadow-md flex items-center justify-center"
                  style={{
                    backgroundColor: theme.isDark ? '#000000' : 'rgba(0, 0, 0, 0.04)',
                    border: theme.previewCardBorder,
                  }}
                >
                  <img
                    src={selectedMaterial.url}
                    alt={selectedMaterial.title}
                    className="w-full max-h-[540px] object-contain mx-auto"
                  />
                </div>
              )}

              {/* 2. Direct Text Content Preview (Notes, guides, craft story) */}
              {selectedMaterial.type === 'text' && (
                <div 
                  className="w-full p-6 sm:p-8 rounded-2xl shadow-inner"
                  style={{
                    backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.9)',
                    border: theme.previewCardBorder,
                  }}
                >
                  <div 
                    className="text-xs font-bold tracking-wider uppercase mb-3 flex items-center gap-2"
                    style={{ color: theme.accentColor }}
                  >
                    <AlignLeft size={14} />
                    <span>Story &amp; Guide Content</span>
                  </div>
                  <div 
                    className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans select-text"
                    style={{ color: theme.pageTextColor }}
                  >
                    {selectedMaterial.content || selectedMaterial.description}
                  </div>
                </div>
              )}

              {/* 3. Document / PDF / Website Link Direct Card */}
              {selectedMaterial.type !== 'image' && selectedMaterial.type !== 'text' && (
                <div 
                  className="w-full p-8 rounded-2xl flex flex-col items-center justify-center text-center gap-4"
                  style={{
                    backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.85)',
                    border: theme.previewCardBorder,
                  }}
                >
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm"
                    style={{
                      backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    {getMaterialIcon(selectedMaterial.type)}
                  </div>
                  <div>
                    <div className="font-bold text-lg" style={{ color: theme.pageTextColor }}>
                      {selectedMaterial.title}
                    </div>
                    <div className="text-xs uppercase tracking-wider mt-1" style={{ color: theme.mutedTextColor }}>
                      {selectedMaterial.type} {selectedMaterial.size ? `• ${selectedMaterial.size}` : ''}
                    </div>
                  </div>
                  {selectedMaterial.url && (
                    <a
                      href={selectedMaterial.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="showcase-btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold shadow-sm"
                    >
                      <Download size={14} />
                      <span>{selectedMaterial.type === 'website' ? 'Open Website' : 'Download / View File'}</span>
                    </a>
                  )}
                </div>
              )}

              {/* Metadata & Direct Actions */}
              <div 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4"
                style={{ borderTop: `1px solid ${theme.dividerBorder}` }}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{
                      backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    {getMaterialIcon(selectedMaterial.type)}
                  </div>
                  <div>
                    <h2 
                      className="showcase-font-serif text-xl sm:text-2xl font-bold"
                      style={{ color: theme.pageTextColor }}
                    >
                      {selectedMaterial.title}
                    </h2>
                    <div className="flex items-center gap-3 text-xs mt-1" style={{ color: theme.mutedTextColor }}>
                      <span 
                        className="font-bold uppercase tracking-wider px-2 py-0.5 rounded text-[10px]"
                        style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
                      >
                        {selectedMaterial.type}
                      </span>
                      {selectedMaterial.size && <span>• {selectedMaterial.size}</span>}
                      {selectedMaterial.category && <span>• {selectedMaterial.category}</span>}
                    </div>
                    {selectedMaterial.description && selectedMaterial.type !== 'text' && (
                      <p className="text-xs sm:text-sm mt-2 max-w-xl" style={{ color: theme.mutedTextColor }}>
                        {selectedMaterial.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  {selectedMaterial.type === 'text' && (
                    <button
                      onClick={() => copyTextContent(selectedMaterial.content || selectedMaterial.description || '')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all"
                      style={{
                        backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : '#FFFFFF',
                        border: `1px solid ${theme.dividerBorder}`,
                        color: theme.pageTextColor,
                      }}
                      title="Copy note text to clipboard"
                    >
                      {copiedContent ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedContent ? 'Copied Note' : 'Copy Note'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => copyItemLink(selectedMaterial)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all"
                    style={{
                      backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : '#FFFFFF',
                      border: `1px solid ${theme.dividerBorder}`,
                      color: theme.pageTextColor,
                    }}
                    title="Copy direct link for this asset"
                  >
                    {copiedItemId === selectedMaterial.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedItemId === selectedMaterial.id ? 'Copied Link' : 'Share Item'}</span>
                  </button>

                  {selectedMaterial.url && (
                    <a
                      href={selectedMaterial.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="showcase-btn-primary inline-flex items-center gap-2 px-5 py-2 text-xs font-bold shadow-sm"
                      title="Open full asset"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

            </div>
          </section>
        ) : (
          <div 
            className="my-8 p-12 text-center rounded-2xl"
            style={{
              backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.03)' : '#FAF8F5',
              border: `1px dashed ${theme.dividerBorder}`,
              color: theme.mutedTextColor,
            }}
          >
            No materials published in this showcase yet.
          </div>
        )}

        {/* ── SECTION 3: OTHER MATERIALS GRID ── */}
        {materials.length > 1 && (
          <section className="mt-4 pt-6" style={{ borderTop: `1px solid ${theme.dividerBorder}` }}>
            <h3 
              className="showcase-font-serif text-lg font-bold mb-4"
              style={{ color: theme.pageTextColor }}
            >
              Other Materials from @{subdomain}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {materials.filter(m => m.id !== selectedMaterial?.id).map((item, idx) => {
                const itemQuery = encodeURIComponent((item.title || 'asset').toLowerCase().replace(/[^a-z0-9_-]/g, '_'));
                const itemHref = (effectiveSlug && effectiveSlug !== 'showcase')
                  ? `/u/${subdomain}/${effectiveSlug}?item=${itemQuery}`
                  : `/u/${subdomain}?item=${itemQuery}`;

                return (
                  <Link
                    key={item.id || idx}
                    href={itemHref}
                    className="p-4 rounded-2xl transition-all flex items-center gap-3 group"
                    style={{
                      backgroundColor: theme.itemCardBg,
                      border: theme.itemCardBorder,
                    }}
                  >
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                      }}
                    >
                      {getMaterialIcon(item.type)}
                    </div>
                    <div className="overflow-hidden">
                      <div 
                        className="font-bold text-sm truncate transition-colors"
                        style={{ color: theme.pageTextColor }}
                      >
                        {item.title}
                      </div>
                      <div 
                        className="text-[11px] uppercase tracking-wider"
                        style={{ color: theme.mutedTextColor }}
                      >
                        {item.type} {item.size ? `• ${item.size}` : ''}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── SECTION 4: REDIRECT TO USER'S MAIN LIVE PAGE BANNER ── */}
        <div 
          className="mt-8 p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
          style={{
            backgroundColor: theme.profileCardBg,
            border: theme.profileCardBorder,
          }}
        >
          <div className="flex items-center gap-3.5">
            <div 
              className="w-11 h-11 rounded-full overflow-hidden border-2 flex items-center justify-center shrink-0 shadow-sm"
              style={{
                backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.1)' : '#D0DDD5',
                borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.2)' : '#FFFFFF',
              }}
            >
              {profile?.avatarUrl ? (
                <img src={maskCloudflareUrl(profile.avatarUrl)} alt={profile.name || subdomain} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold" style={{ color: theme.pageTextColor }}>
                  {(profile?.name || subdomain).charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="font-bold text-sm sm:text-base flex items-center gap-1.5" style={{ color: theme.pageTextColor }}>
                <span>{profile?.name || `@${subdomain}`}</span>
                <BadgeCheck className="w-4 h-4" style={{ color: theme.accentColor, fill: theme.accentColor }} />
              </div>
              <div className="text-xs mt-0.5" style={{ color: theme.mutedTextColor }}>
                Explore full live profile, social links, updates &amp; creations
              </div>
            </div>
          </div>
          <Link
            href={profileUrl}
            className="showcase-btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold shrink-0 shadow-sm"
          >
            <span>Visit Live Page</span>
            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>

        {/* ── SECTION 5: FOOTER ── */}
        <footer 
          className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          style={{
            borderTop: `1px solid ${theme.dividerBorder}`,
            color: theme.mutedTextColor,
          }}
        >
          <div className="flex items-center gap-2">
            <span>Curated by</span>
            <Link 
              href={profileUrl} 
              className="font-bold underline underline-offset-4"
              style={{ color: theme.pageTextColor }}
            >
              @{subdomain}
            </Link>
            <span>•</span>
            <span>{theme.name} Theme</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={copyPageLink}
              className="hover:opacity-80 transition-opacity flex items-center gap-1 font-semibold"
              style={{ color: theme.pageTextColor }}
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}
