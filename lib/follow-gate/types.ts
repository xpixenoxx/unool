// ============================================================
// Follow-Gate Core — lib/follow-gate/types.ts
// Single source of truth for all follow-gate types.
// ============================================================

export type UnlockedContentType = 'link' | 'file' | 'coupon' | 'message' | 'video';

export interface UnlockedContent {
  type: UnlockedContentType;
  /** Human readable label */
  label: string;
  /** URL for link/file/video types */
  url?: string;
  /** Coupon code or message text */
  text?: string;
  /** Optional expiry for coupons */
  expiresAt?: string;
}

export interface FollowGate {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  igUsername: string;
  igUserId: string;
  unlockedContent: UnlockedContent;
  ctaText: string;
  thumbnailUrl: string | null;
  isActive: boolean;
  viewCount: number;
  unlockCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FollowGateSession {
  id: string;
  gateId: string;
  workspaceId: string;
  visitorIgUserId: string | null;
  visitorIgUsername: string | null;
  followVerified: boolean;
  verifiedAt: string | null;
  verificationMethod: 'webhook' | 'polling' | 'manual' | null;
  sessionToken: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateGateInput {
  workspaceId: string;
  title: string;
  description?: string;
  igUsername: string;
  igUserId: string;
  unlockedContent: UnlockedContent;
  ctaText?: string;
  thumbnailUrl?: string;
}

export interface CheckFollowResult {
  isFollowing: boolean;
  source: 'cache' | 'api' | 'webhook';
  checkedAt: string;
}

export interface GateCheckResponse {
  gateId: string;
  sessionToken: string;
  followVerified: boolean;
  unlockedContent?: UnlockedContent;
  expiresAt: string;
}
