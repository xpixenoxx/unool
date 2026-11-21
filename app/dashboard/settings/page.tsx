import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth/context';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getFeatureFlagsServer } from '@/lib/feature-flags-server';
import { getWorkspaceSubscription } from '@/lib/billing/subscription';
import { getPlan, type PlanId } from '@/lib/billing/plans';
import { resolveConnectionRowStatus } from '@/lib/platforms/connectionStatus';
import SettingsClient from './SettingsClient';
import { LoadingSkeleton } from '@/components/dashboard/settings/tabs/shared';
import {
  normalizePlanId,
  type SettingsInitialData,
  type UserPreferencesDto,
  type WorkspaceMemberDto,
  type AccessibleWorkspaceDto,
  type InitialConnectionSummary,
} from '@/components/dashboard/settings/types';
import type { StudioProfile } from '@/lib/config/studioOnboarding';

export const dynamic = 'force-dynamic';

function buildInitialPreferences(
  prefRow: Record<string, any> | null,
  wsPrefs: Record<string, any> | undefined
): UserPreferencesDto {
  const src = prefRow || wsPrefs || {};
  const rawTheme = String(src.theme || 'system').toLowerCase();
  const theme: UserPreferencesDto['theme'] =
    rawTheme === 'light' || rawTheme === 'dark' ? rawTheme : 'system';

  const timeFormat: UserPreferencesDto['timeFormat'] =
    src.time_format === '24h' || src.timeFormat === '24h' ? '24h' : '12h';

  const rawDate = String(src.date_format || src.dateFormat || 'DD/MM/YYYY');
  const dateFormat: UserPreferencesDto['dateFormat'] =
    rawDate === 'MM/DD/YYYY' || rawDate === 'YYYY-MM-DD' ? rawDate : 'DD/MM/YYYY';

  const rawCurrency = String(src.currency_display || src.currencyDisplay || 'INR').toUpperCase();
  const currencyDisplay: UserPreferencesDto['currencyDisplay'] = rawCurrency === 'USD' ? 'USD' : 'INR';

  const rawDigest = String(src.digest_frequency || src.digestFrequency || 'weekly').toLowerCase();
  const digestFrequency: UserPreferencesDto['digestFrequency'] =
    rawDigest === 'daily' || rawDigest === 'never' ? rawDigest : 'weekly';

  return {
    theme,
    timezone: String(src.timezone || 'UTC'),
    timeFormat,
    dateFormat,
    currencyDisplay,
    digestFrequency,
    notifyTokenExpiry:
      typeof src.notify_token_expiry === 'boolean'
        ? src.notify_token_expiry
        : typeof src.notifyTokenExpiry === 'boolean'
          ? src.notifyTokenExpiry
          : true,
    notifySecurityAlerts:
      typeof src.notify_security_alerts === 'boolean'
        ? src.notify_security_alerts
        : typeof src.notifySecurityAlerts === 'boolean'
          ? src.notifySecurityAlerts
          : true,
    notifyPublishing:
      typeof src.notify_publishing === 'boolean'
        ? src.notify_publishing
        : typeof src.notifyPublishing === 'boolean'
          ? src.notifyPublishing
          : true,
    aiPersonalizationEnabled:
      typeof src.ai_personalization_enabled === 'boolean'
        ? src.ai_personalization_enabled
        : typeof src.aiPersonalizationEnabled === 'boolean'
          ? src.aiPersonalizationEnabled
          : true,
  };
}

export default async function SettingsPage() {
  const auth = await getAuthContext();
  if (!auth) {
    redirect('/login?next=/dashboard/settings');
  }

  const [
    userRes,
    prefRes,
    workspaceRes,
    membersRes,
    userMembershipsRes,
    ownedWorkspacesRes,
    subscriptionRes,
    studioRes,
    connectionsRes,
    flagsRes,
  ] = await Promise.allSettled([
    supabaseAdmin.auth.admin.getUserById(auth.userId),
    supabaseAdmin.from('user_preferences').select('*').eq('user_id', auth.userId).maybeSingle(),
    supabaseAdmin.from('workspaces').select('*').eq('id', auth.workspaceId).maybeSingle(),
    supabaseAdmin
      .from('workspace_members')
      .select('id, user_id, email, role, status, invited_at, joined_at')
      .eq('workspace_id', auth.workspaceId)
      .order('joined_at', { ascending: true }),
    supabaseAdmin
      .from('workspace_members')
      .select('workspace_id, role, status')
      .eq('user_id', auth.userId),
    supabaseAdmin
      .from('workspaces')
      .select('id, name, plan')
      .eq('owner_id', auth.userId),
    getWorkspaceSubscription(auth.workspaceId),
    supabaseAdmin
      .from('studio_profiles')
      .select('profile_data, version')
      .eq('workspace_id', auth.workspaceId)
      .maybeSingle(),
    supabaseAdmin
      .from('platform_connections')
      .select('id, platform, platform_user_id, username, display_name, avatar_url, status, expires_at, created_at, updated_at, refresh_token_encrypted, access_token_encrypted')
      .eq('workspace_id', auth.workspaceId),
    getFeatureFlagsServer(),
  ]);

  const authUser =
    userRes.status === 'fulfilled' ? userRes.value.data?.user : null;
  const userMeta = (authUser?.user_metadata || {}) as Record<string, any>;
  const verifiedFactors = Array.isArray((authUser as any)?.factors)
    ? ((authUser as any).factors as Array<{ status?: string }>).some((f) => f.status === 'verified')
    : false;

  const wsRow =
    workspaceRes.status === 'fulfilled' ? (workspaceRes.value.data as Record<string, any> | null) : null;
  const wsSettings = (wsRow?.settings || {}) as Record<string, any>;

  const prefRow =
    prefRes.status === 'fulfilled' && !prefRes.value.error
      ? (prefRes.value.data as Record<string, any> | null)
      : null;

  const preferences = buildInitialPreferences(prefRow, wsSettings.preferences);

  const rawMembers =
    membersRes.status === 'fulfilled' && Array.isArray(membersRes.value.data)
      ? (membersRes.value.data as Array<Record<string, any>>)
      : [];

  const workspaceOwnerId = String(wsRow?.owner_id || auth.userId);
  const members: WorkspaceMemberDto[] = rawMembers.map((m) => ({
    id: String(m.id),
    userId: m.user_id ? String(m.user_id) : null,
    email: String(m.email || ''),
    fullName: m.user_id === auth.userId ? String(userMeta.full_name || userMeta.name || '') || null : null,
    role:
      m.user_id === workspaceOwnerId || m.role === 'owner'
        ? 'owner'
        : m.role === 'admin' || m.role === 'viewer'
          ? m.role
          : 'editor',
    status: String(m.status || 'active'),
    invitedAt: m.invited_at ? String(m.invited_at) : null,
    joinedAt: m.joined_at ? String(m.joined_at) : null,
    isOwner: m.user_id === workspaceOwnerId || m.role === 'owner',
  }));

  let callerRole: WorkspaceMemberDto['role'] =
    workspaceOwnerId === auth.userId
      ? 'owner'
      : auth.userRole === 'admin' || auth.userRole === 'viewer'
        ? auth.userRole
        : auth.userRole === 'owner'
          ? 'owner'
          : 'editor';

  const callerMemberRow = members.find((m) => m.userId === auth.userId);
  if (callerMemberRow) {
    callerRole = callerMemberRow.role;
  }

  // Merge accessible workspaces from memberships + owned workspaces
  const wsMap = new Map<string, AccessibleWorkspaceDto>();
  if (wsRow?.id) {
    wsMap.set(String(wsRow.id), {
      workspaceId: String(wsRow.id),
      name: String(wsRow.name || 'Workspace'),
      plan: normalizePlanId(wsRow.plan),
      role: callerRole,
      isOwner: workspaceOwnerId === auth.userId,
    });
  }

  if (ownedWorkspacesRes.status === 'fulfilled' && Array.isArray(ownedWorkspacesRes.value.data)) {
    for (const w of ownedWorkspacesRes.value.data) {
      wsMap.set(String(w.id), {
        workspaceId: String(w.id),
        name: String(w.name || 'Workspace'),
        plan: normalizePlanId(w.plan),
        role: 'owner',
        isOwner: true,
      });
    }
  }

  if (userMembershipsRes.status === 'fulfilled' && Array.isArray(userMembershipsRes.value.data)) {
    const memberWsIds = userMembershipsRes.value.data
      .filter((m) => (!m.status || m.status === 'active') && !wsMap.has(String(m.workspace_id)))
      .map((m) => String(m.workspace_id));

    if (memberWsIds.length > 0) {
      const { data: extraWsRows } = await supabaseAdmin
        .from('workspaces')
        .select('id, name, plan')
        .in('id', memberWsIds);

      for (const m of userMembershipsRes.value.data) {
        const wsDetail = extraWsRows?.find((x) => x.id === m.workspace_id);
        if (wsDetail && !wsMap.has(String(wsDetail.id))) {
          const role =
            m.role === 'owner' || m.role === 'admin' || m.role === 'viewer' ? m.role : 'editor';
          wsMap.set(String(wsDetail.id), {
            workspaceId: String(wsDetail.id),
            name: String(wsDetail.name || 'Workspace'),
            plan: normalizePlanId(wsDetail.plan),
            role,
            isOwner: role === 'owner',
          });
        }
      }
    }
  }

  const sub = subscriptionRes.status === 'fulfilled' ? subscriptionRes.value : null;
  const effectivePlanId = normalizePlanId(sub?.status === 'active' ? sub.plan_id : wsRow?.plan) as PlanId;
  const planDef = getPlan(effectivePlanId);

  const studioRow =
    studioRes.status === 'fulfilled' && !studioRes.value.error ? studioRes.value.data : null;
  const rawStudioProfile = (studioRow?.profile_data || wsSettings.studio_profile || null) as StudioProfile | null;
  const studioVersion = typeof studioRow?.version === 'number' ? studioRow.version : 0;
  const studioCompleted = Boolean(rawStudioProfile?.role && rawStudioProfile?.audience);

  const connectionsSummary: Record<string, InitialConnectionSummary> = {};
  if (connectionsRes.status === 'fulfilled' && Array.isArray(connectionsRes.value.data)) {
    for (const row of connectionsRes.value.data) {
      const platform = String(row.platform || '').toLowerCase();
      if (!platform) continue;
      const status = resolveConnectionRowStatus(row);
      if (status === 'not_connected') continue;
      if (!connectionsSummary[platform] || status === 'connected') {
        connectionsSummary[platform] = {
          status,
          username: row.username || row.display_name || undefined,
          expiresAt: row.expires_at || undefined,
        };
      }
    }
  }

  const flags = flagsRes.status === 'fulfilled' ? flagsRes.value : {};

  const initialData: SettingsInitialData = {
    userId: auth.userId,
    workspaceId: auth.workspaceId,
    isImpersonated: auth.isImpersonated,
    account: {
      id: auth.userId,
      email: String(authUser?.email || auth.email || ''),
      fullName: String(userMeta.full_name || userMeta.name || ''),
      avatarUrl: userMeta.avatar_url ? String(userMeta.avatar_url) : null,
      createdAt: authUser?.created_at || null,
      emailConfirmedAt: authUser?.email_confirmed_at || null,
      mfaEnabled: verifiedFactors,
    },
    preferences,
    workspace: {
      id: auth.workspaceId,
      name: String(wsRow?.name || 'Workspace'),
      plan: effectivePlanId,
      ownerId: workspaceOwnerId,
    },
    callerRole,
    members,
    workspaces: Array.from(wsMap.values()),
    billing: {
      planId: effectivePlanId,
      planName: planDef?.name || 'Spark',
      status: sub?.status || 'active',
      billingCycle: sub?.billing_cycle || null,
      currentPeriodEnd: sub?.current_period_end || null,
      cancelAtPeriodEnd: Boolean(sub?.cancel_at_period_end),
      isFreeTier: effectivePlanId === 'spark',
    },
    studioProfile: rawStudioProfile,
    studioVersion,
    studioCompleted,
    connectionsSummary,
    publicApiEnabled: Boolean(flags.public_api_enabled),
  };

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <SettingsClient initialData={initialData} />
    </Suspense>
  );
}
