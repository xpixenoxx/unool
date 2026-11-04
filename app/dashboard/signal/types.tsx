import React from 'react';
import {
  Type,
  HelpCircle,
  BarChart3,
  BookOpen,
  Flame,
  Layers,
  FileText,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────────────── */
export type PostVariant = {
  id: string;
  platform: string;
  status: string;
  platformUrl: string | null;
  platformPostId: string | null;
  characterCount: number;
  error: any;
  createdAt: string;
  updatedAt: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    totalInteractions: number;
    hasRealData: boolean;
  };
};

export type SignalPost = {
  id: string;
  content: string;
  status: string;
  hookType: string | null;
  wordCount: number | null;
  hasMedia: boolean;
  createdAt: string;
  updatedAt?: string;
  publishedAt: string | null;
  origin?: 'flightplan' | 'quick-broadcast' | 'ai-composer';
  arcId?: string | null;
  adaptationPromptVersion?: string | null;
  variants: PostVariant[];
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    total: number;
    hasRealData: boolean;
  };
};

export function getDraftOrigin(post: SignalPost): 'flightplan' | 'quick-broadcast' | 'ai-composer' {
  if (post.origin) return post.origin;
  if (post.arcId || post.adaptationPromptVersion === 'schedule-engine-v1') return 'flightplan';
  if (post.adaptationPromptVersion === 'direct-broadcast') return 'quick-broadcast';
  return 'ai-composer';
}

export function getDraftRedirect(post: SignalPost): { href: string; title: string; label: string } {
  const origin = getDraftOrigin(post);
  switch (origin) {
    case 'flightplan':
      return {
        href: `/dashboard/flightplan?postId=${post.id}`,
        title: 'Review, edit, and schedule in Flight Plan',
        label: 'Flight Plan Draft',
      };
    case 'quick-broadcast':
      return {
        href: `/dashboard/studio?mode=quick&postId=${post.id}`,
        title: 'Review, edit, and publish in Quick Broadcast',
        label: 'Quick Broadcast Draft',
      };
    case 'ai-composer':
    default:
      return {
        href: `/dashboard/studio?mode=ai&postId=${post.id}`,
        title: 'Review, edit, and publish in AI Composer',
        label: 'AI Composer Draft',
      };
  }
}

export type ResonanceData = {
  hasData: boolean;
  hasRealEngagement?: boolean;
  totalPosts: number;
  totalInteractions?: number;
  avgInteractionsPerPost?: number;
  totalViews?: number;
  topHook?: string;
  hookBreakdown: Array<{
    type: string;
    count: number;
    totalInteractions?: number;
    avgInteractions?: number;
    avgComments?: number;
    avgLikes?: number;
    avgShares?: number;
    performanceIndex?: number;
    avgSuccess?: number;
    samples?: string[];
    topPostSnippet?: string;
    hasRealData?: boolean;
  }>;
  bestDay: { day: number; name: string; count: number; interactions?: number } | null;
  bestHour: { hour: number; label: string; count: number; interactions?: number } | null;
  dayDistribution?: number[];
  dayEngagement?: number[];
  hourDistribution?: number[];
  hourEngagement?: number[];
  avgWordCount?: number;
  mediaRatio?: number;
  mediaLift?: number;
  resonanceScore?: number;
  recommendations?: Array<{
    id: string;
    title: string;
    desc: string;
    type: 'hook' | 'timing' | 'format' | 'growth';
  }>;
  recentPatternRows?: Array<{
    id?: string;
    contentSnippet?: string;
    hookType: string;
    wordCount: number;
    dayOfWeek: number;
    hourOfDay: number;
    hasMedia: boolean;
    deliveryRate?: number;
    successRate?: number;
    publishedCount: number;
    totalPlatforms?: number;
    status?: string;
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
    interactions?: number;
    hasRealData?: boolean;
  }>;
};

/* ── Hook Archetype Metadata ───────────────────────────────────────────────── */
export const HOOK_META: Record<string, { label: string; desc: string; icon: React.ReactNode; color: string; bg: string; text: string }> = {
  statement: {
    label: 'Bold Statement',
    desc: 'Uncompromising assertion that commands authority.',
    icon: <Type className="w-3.5 h-3.5" />,
    color: '#B48C48',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
  },
  question: {
    label: 'Curiosity Question',
    desc: 'Intriguing opener that compels the mind to search for an answer.',
    icon: <HelpCircle className="w-3.5 h-3.5" />,
    color: '#3B82F6',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
  },
  statistic: {
    label: 'Data / Statistic',
    desc: 'Hard metric or percentage that anchors intellectual credibility.',
    icon: <BarChart3 className="w-3.5 h-3.5" />,
    color: '#10B981',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
  },
  story: {
    label: 'Personal Narrative',
    desc: 'First-person journey creating emotional resonance and empathy.',
    icon: <BookOpen className="w-3.5 h-3.5" />,
    color: '#EC4899',
    bg: 'bg-pink-50',
    text: 'text-pink-800',
  },
  contrarian: {
    label: 'Contrarian Angle',
    desc: 'Challenging conventional wisdom to disrupt crowded feeds.',
    icon: <Flame className="w-3.5 h-3.5" />,
    color: '#EF4444',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
  },
  framework: {
    label: 'Framework / Steps',
    desc: 'Systematized blueprint that inspires saves and bookmarks.',
    icon: <Layers className="w-3.5 h-3.5" />,
    color: '#8B5CF6',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
  },
  unknown: {
    label: 'Standard Dispatch',
    desc: 'Balanced conversational dispatch.',
    icon: <FileText className="w-3.5 h-3.5" />,
    color: '#6B7280',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
  },
};

export function getPostAge(createdAt: string): 'active' | 'settling' | 'cooled' {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageMin = ageMs / 60000;
  if (ageMin < 60) return 'active';
  if (ageMin < 1440) return 'settling';
  return 'cooled';
}

export function getGoldenHourRemaining(createdAt: string): number | null {
  const ageMin = (Date.now() - new Date(createdAt).getTime()) / 60000;
  if (ageMin >= 60) return null;
  return Math.max(1, Math.round(60 - ageMin));
}

