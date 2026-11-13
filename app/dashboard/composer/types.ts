// ── Composer feature types ────────────────────────────────────────
// Extracted from ComposerClient.tsx for maintainability.
// Import in ComposerClient.tsx and any composer sub-components.

import type { SupportedPlatformType } from '@/components/dashboard/previews/PlatformMobilePreview';

export type PlatformType = SupportedPlatformType;

export interface ConnectedAccount {
  id: string;
  platform: PlatformType;
  platformUserId?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  status: 'connected' | 'expired' | 'not_connected' | 'error';
}

export interface PlatformDraft {
  platform: PlatformType;
  platformConnectionId?: string | null;
  accountUsername?: string | null;
  accountDisplayName?: string | null;
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

export interface TargetAdaptedPost extends AdaptedPost {
  variantId?: string;
  platform: PlatformType;
  platformConnectionId?: string | null;
}

export interface AdaptResponse {
  postId: string;
  variants: Record<PlatformType, AdaptedPost>;
  targetVariants?: TargetAdaptedPost[];
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

