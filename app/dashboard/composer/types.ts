// ── Composer feature types ────────────────────────────────────────
// Extracted from ComposerClient.tsx for maintainability.
// Import in ComposerClient.tsx and any composer sub-components.

import type { SupportedPlatformType } from '@/components/dashboard/previews/PlatformMobilePreview';

export type PlatformType = SupportedPlatformType;

export interface PlatformDraft {
  platform: PlatformType;
  content: string;
  characterCount: number;
  hashtags: string[];
  firstCommentHint?: string;
  status: 'idle' | 'generating' | 'ready' | 'error';
  error?: string;
}

export interface AdaptedPost {
  content: string;
  characterCount: number;
  hashtags: string[];
  firstCommentHint?: string;
}

export interface AdaptResponse {
  postId: string;
  variants: Record<PlatformType, AdaptedPost>;
  results?: Record<string, { success: boolean; platformUrl?: string; error?: string }>;
}

export interface Profile {
  id: string;
  name: string;
  headline: string;
  bio: string;
  role: string;
  company: string;
  onboardingAnswers?: any;
  studioProfile?: any;
}

export interface ComposerClientProps {
  userId: string;
  workspaceId: string;
}

