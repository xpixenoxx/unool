import type { StudioProfile } from '@/lib/config/studioOnboarding';

export type SettingsGroupId = 'personal' | 'workspace';

export type SettingsSectionId =
  | 'account'
  | 'security'
  | 'notifications'
  | 'channels'
  | 'ai-voice'
  | 'workspace';

export interface SettingsSectionMeta {
  id: SettingsSectionId;
  group: SettingsGroupId;
  label: string;
  shortLabel: string;
  description: string;
}

export const SETTINGS_SECTIONS: SettingsSectionMeta[] = [
  {
    id: 'account',
    group: 'personal',
    label: 'Account & Prefs',
    shortLabel: 'Account',
    description: 'Identity, timezone, formats, personal data export, and account deletion.',
  },
  {
    id: 'security',
    group: 'personal',
    label: 'Security & Access',
    shortLabel: 'Security',
    description: 'Password management, two-factor authentication, active devices, and activity log.',
  },
  {
    id: 'notifications',
    group: 'personal',
    label: 'Notifications',
    shortLabel: 'Notifs',
    description: 'Email alerts for token expiry, security events, publishing failures, and digests.',
  },
  {
    id: 'channels',
    group: 'workspace',
    label: 'Connected Channels',
    shortLabel: 'Channels',
    description: 'Manage social accounts, OAuth tokens, Kick RTMP setup, and API availability.',
  },
  {
    id: 'ai-voice',
    group: 'workspace',
    label: 'AI & Brand Voice',
    shortLabel: 'AI Voice',
    description: 'Configure creator persona, voice cadence, target audience, and AI personalization.',
  },
  {
    id: 'workspace',
    group: 'workspace',
    label: 'Workspace & Team',
    shortLabel: 'Workspace',
    description: 'Workspace switching, team members, roles, ownership transfer, and plan summary.',
  },
];

export interface TabResolutionResult {
  section: SettingsSectionId;
  redirectedFrom?: string;
  presenceNotice?: 'templates' | 'analytics';
  dangerNotice?: boolean;
}

/**
 * Resolves `?tab=` query strings (including legacy deep-links) cleanly onto
 * the canonical 6-section Settings taxonomy without breaking bookmarks.
 */
export function resolveSettingsTab(rawTab: string | null | undefined): TabResolutionResult {
  const normalized = (rawTab || '').trim().toLowerCase();
  if (!normalized) {
    return { section: 'account' };
  }

  switch (normalized) {
    case 'account':
    case 'export':
    case 'delete':
      return { section: 'account', redirectedFrom: normalized === 'account' ? undefined : normalized };
    case 'danger':
      return { section: 'account', redirectedFrom: 'danger', dangerNotice: true };
    case 'security':
    case 'sessions':
    case 'mfa':
    case 'password':
      return { section: 'security', redirectedFrom: normalized === 'security' ? undefined : normalized };
    case 'notifications':
    case 'prefs':
    case 'alerts':
      return {
        section: 'notifications',
        redirectedFrom: normalized === 'notifications' ? undefined : normalized,
      };
    case 'channels':
    case 'platforms':
    case 'integrations':
    case 'api':
      return { section: 'channels', redirectedFrom: normalized === 'channels' ? undefined : normalized };
    case 'ai-voice':
    case 'studio':
    case 'persona':
    case 'profile':
    case 'voice':
      return { section: 'ai-voice', redirectedFrom: normalized === 'ai-voice' ? undefined : normalized };
    case 'workspace':
    case 'team':
    case 'members':
    case 'billing':
    case 'plan':
      return {
        section: 'workspace',
        redirectedFrom: normalized === 'workspace' ? undefined : normalized,
      };
    case 'templates':
      return { section: 'ai-voice', redirectedFrom: 'templates', presenceNotice: 'templates' };
    case 'analytics':
      return { section: 'ai-voice', redirectedFrom: 'analytics', presenceNotice: 'analytics' };
    default:
      return { section: 'account' };
  }
}

export interface UserAccountDto {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  createdAt: string | null;
  emailConfirmedAt: string | null;
  mfaEnabled: boolean;
}

export interface UserPreferencesDto {
  theme: 'system' | 'light' | 'dark';
  timezone: string;
  timeFormat: '12h' | '24h';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  currencyDisplay: 'INR' | 'USD';
  digestFrequency: 'daily' | 'weekly' | 'never';
  notifyTokenExpiry: boolean;
  notifySecurityAlerts: boolean;
  notifyPublishing: boolean;
  aiPersonalizationEnabled: boolean;
}

export interface WorkspaceMemberDto {
  id: string;
  userId: string | null;
  email: string;
  fullName: string | null;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: string;
  invitedAt: string | null;
  joinedAt: string | null;
  isOwner: boolean;
}

export interface WorkspaceSummaryDto {
  id: string;
  name: string;
  plan: string;
  ownerId: string;
}

export interface AccessibleWorkspaceDto {
  workspaceId: string;
  name: string;
  plan: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  isOwner: boolean;
}

export interface BillingSummaryDto {
  planId: string;
  planName: string;
  status: string;
  billingCycle: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isFreeTier: boolean;
}

export interface InitialConnectionSummary {
  status: string;
  username?: string;
  expiresAt?: string;
}

export interface SettingsInitialData {
  userId: string;
  workspaceId: string;
  isImpersonated: boolean;
  account: UserAccountDto;
  preferences: UserPreferencesDto;
  workspace: WorkspaceSummaryDto;
  callerRole: 'owner' | 'admin' | 'editor' | 'viewer';
  members: WorkspaceMemberDto[];
  workspaces: AccessibleWorkspaceDto[];
  billing: BillingSummaryDto;
  studioProfile: StudioProfile | null;
  studioVersion: number;
  studioCompleted: boolean;
  connectionsSummary: Record<string, InitialConnectionSummary>;
  publicApiEnabled: boolean;
}

export type ReadinessState = 'done' | 'warning' | 'todo';

export interface ReadinessItem {
  id: 'channels' | 'ai-voice' | 'timezone' | 'security';
  label: string;
  statusLabel: string;
  state: ReadinessState;
  targetTab: SettingsSectionId;
}

export function computeSettingsReadiness(input: {
  connectionsSummary: Record<string, InitialConnectionSummary>;
  studioCompleted: boolean;
  studioProfile: StudioProfile | null;
  timezone: string;
  mfaEnabled: boolean;
  emailConfirmedAt: string | null;
}): { items: ReadinessItem[]; allReady: boolean } {
  const connValues = Object.values(input.connectionsSummary || {});
  const connectedCount = connValues.filter((c) => c.status === 'connected').length;
  const expiredCount = connValues.filter((c) => c.status === 'expired').length;

  const channelsItem: ReadinessItem =
    expiredCount > 0
      ? {
          id: 'channels',
          label: 'Connected Channels',
          statusLabel: `Reconnect (${expiredCount})`,
          state: 'warning',
          targetTab: 'channels',
        }
      : connectedCount > 0
        ? {
            id: 'channels',
            label: 'Connected Channels',
            statusLabel: `${connectedCount} active`,
            state: 'done',
            targetTab: 'channels',
          }
        : {
            id: 'channels',
            label: 'Connected Channels',
            statusLabel: 'Connect 1 channel',
            state: 'todo',
            targetTab: 'channels',
          };

  const hasVoice = Boolean(
    input.studioCompleted || (input.studioProfile?.role && input.studioProfile?.completedAt)
  );
  const voiceItem: ReadinessItem = {
    id: 'ai-voice',
    label: 'AI Brand Voice',
    statusLabel: hasVoice ? 'Calibrated' : 'Set voice',
    state: hasVoice ? 'done' : 'todo',
    targetTab: 'ai-voice',
  };

  const tzValid = Boolean(input.timezone && input.timezone.trim().length >= 2);
  const timezoneItem: ReadinessItem = {
    id: 'timezone',
    label: 'Timezone & Formats',
    statusLabel: tzValid ? input.timezone : 'Confirm zone',
    state: tzValid ? 'done' : 'todo',
    targetTab: 'account',
  };

  const securityItem: ReadinessItem = input.mfaEnabled
    ? {
        id: 'security',
        label: 'Account Security',
        statusLabel: '2FA Active',
        state: 'done',
        targetTab: 'security',
      }
    : {
        id: 'security',
        label: 'Account Security',
        statusLabel: input.emailConfirmedAt ? 'Add 2FA' : 'Verify & 2FA',
        state: 'todo',
        targetTab: 'security',
      };

  const items = [channelsItem, voiceItem, timezoneItem, securityItem];
  const allReady = items.every((item) => item.state === 'done');
  return { items, allReady };
}

export function normalizePlanId(rawPlan?: string | null): 'spark' | 'creator' | 'pro' | 'studio' {
  const lower = (rawPlan || '').trim().toLowerCase();
  if (lower === 'creator' || lower === 'pro' || lower === 'studio') return lower;
  return 'spark';
}

