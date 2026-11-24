'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  User,
  Shield,
  Bell,
  Share2,
  Sparkles,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { clearAllClientCaches } from '@/lib/utils/clientCache';
import {
  AccountTab,
  SecurityTab,
  NotificationsTab,
  ChannelsTab,
  AiVoiceTab,
  WorkspaceTab,
  ImpersonationNotice,
  ReadinessStrip,
  UnsavedChangesDialog,
} from '@/components/dashboard/settings/tabs';
import {
  SETTINGS_SECTIONS,
  resolveSettingsTab,
  computeSettingsReadiness,
  type SettingsInitialData,
  type SettingsSectionId,
  type UserAccountDto,
  type UserPreferencesDto,
  type WorkspaceSummaryDto,
  type WorkspaceMemberDto,
  type InitialConnectionSummary,
} from '@/components/dashboard/settings/types';
import type { StudioProfile } from '@/lib/config/studioOnboarding';

const SECTION_ICONS: Record<SettingsSectionId, React.ElementType> = {
  account: User,
  security: Shield,
  notifications: Bell,
  channels: Share2,
  'ai-voice': Sparkles,
  workspace: Building2,
};

const PLATFORM_LABELS: Record<string, string> = {
  x: 'X (Twitter)',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  devto: 'Dev.to',
  mewe: 'MeWe',
};

function formatPlatformLabel(raw: string | null): string {
  if (!raw) return 'channel';
  const key = raw.trim().toLowerCase();
  if (!key) return 'channel';
  return PLATFORM_LABELS[key] || `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
}

function safeSearchParamsString(sp: { toString?: () => string } | null | undefined): string {
  if (!sp || typeof sp.toString !== 'function') return '';
  const str = sp.toString();
  return str === '[object Object]' ? '' : str;
}

export interface SettingsClientProps {
  initialData: SettingsInitialData;
}

export default function SettingsClient({ initialData }: SettingsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get('tab');
  const resolved = useMemo(() => resolveSettingsTab(rawTab), [rawTab]);

  const [activeTab, setActiveTab] = useState<SettingsSectionId>(resolved.section);
  const [presenceNotice, setPresenceNotice] = useState<'templates' | 'analytics' | undefined>(
    resolved.presenceNotice
  );
  const [dangerNotice, setDangerNotice] = useState<boolean>(Boolean(resolved.dangerNotice));

  // Stateful data initialized cleanly from SSR
  const [account, setAccount] = useState<UserAccountDto>(initialData.account);
  const [preferences, setPreferences] = useState<UserPreferencesDto>(initialData.preferences);
  const [workspace, setWorkspace] = useState<WorkspaceSummaryDto>(initialData.workspace);
  const [members, setMembers] = useState<WorkspaceMemberDto[]>(initialData.members);
  const [studioProfile, setStudioProfile] = useState<StudioProfile | null>(initialData.studioProfile);
  const [studioVersion, setStudioVersion] = useState<number>(initialData.studioVersion);
  const [studioCompleted, setStudioCompleted] = useState<boolean>(initialData.studioCompleted);
  const [connectionsSummary, setConnectionsSummary] = useState<
    Record<string, InitialConnectionSummary>
  >(initialData.connectionsSummary);

  // Readiness dismissal state (workspace-scoped)
  const [readinessDismissed, setReadinessDismissed] = useState(false);

  // Unsaved-changes navigation guard
  const [tabDirty, setTabDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState<SettingsSectionId | null>(null);

  // Channel OAuth feedback & deep-link connect state
  const [connectionsRefreshNonce, setConnectionsRefreshNonce] = useState(0);
  const [initialConnectPlatform, setInitialConnectPlatform] = useState<string | null>(null);

  const lastRedirectedFromRef = useRef<string | null>(null);
  const handledOAuthQueryRef = useRef<string | null>(null);

  useEffect(() => {
    setActiveTab(resolved.section);
    if (resolved.presenceNotice) setPresenceNotice(resolved.presenceNotice);
    if (resolved.dangerNotice) setDangerNotice(true);
    if (
      resolved.redirectedFrom &&
      resolved.redirectedFrom !== resolved.section &&
      lastRedirectedFromRef.current !== resolved.redirectedFrom
    ) {
      lastRedirectedFromRef.current = resolved.redirectedFrom;
      const nextParams = new URLSearchParams(safeSearchParamsString(searchParams));
      nextParams.set('tab', resolved.section);
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
    } else if (!resolved.redirectedFrom) {
      lastRedirectedFromRef.current = null;
    }
  }, [resolved, pathname, router, searchParams]);

  // Handle OAuth callback query params (`connected`, `error`, `connect`) and Meta `#_=_` hash
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.location.hash === '#_=_' || window.location.hash === '#_') {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }

    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    const platform = searchParams.get('platform');
    const detail = searchParams.get('detail');
    const description = searchParams.get('description');
    const limit = searchParams.get('limit');
    const plan = searchParams.get('plan');
    const connect = searchParams.get('connect');

    if (connect) {
      setActiveTab('channels');
      setInitialConnectPlatform(connect);
    }

    if (!connected && !error) return;

    const queryKey = safeSearchParamsString(searchParams) || `${connected || ''}:${error || ''}`;
    if (handledOAuthQueryRef.current === queryKey) return;
    handledOAuthQueryRef.current = queryKey;

    setActiveTab('channels');

    const pName = formatPlatformLabel(connected || platform);
    if (connected) {
      toast.success(`${pName} connected successfully!`);
      setConnectionsRefreshNonce((n) => n + 1);
    } else if (error) {
      let message: string;
      switch (error) {
        case 'oauth_denied':
          message = `${pName} connection was cancelled.`;
          break;
        case 'invalid_state':
          message = `Connection session expired. Please try connecting ${pName} again.`;
          break;
        case 'oauth_config_missing':
          message = `${pName} OAuth is not configured on this environment yet.`;
          break;
        case 'quota_exceeded':
        case 'platform_limit':
        case 'channel_limit':
          message = `Channel limit reached${limit ? ` (${limit})` : ''}${plan ? ` on the ${plan} plan` : ''}. Disconnect another channel or upgrade to add ${pName}.`;
          break;
        case 'access_denied':
        case 'permission_denied':
          message = `Missing permissions for ${pName}. Please approve all requested permissions.`;
          break;
        case 'unsupported_platform':
          message = `Unsupported platform${platform ? `: ${platform}` : ''}.`;
          break;
        default:
          message =
            description ||
            detail ||
            `Could not finish connecting ${pName} (${error.replace(/_/g, ' ')}).`;
          break;
      }
      toast.error(message, { duration: 6000 });
    }

    const cleaned = new URLSearchParams(safeSearchParamsString(searchParams));
    cleaned.delete('connected');
    cleaned.delete('error');
    cleaned.delete('platform');
    cleaned.delete('detail');
    cleaned.delete('description');
    cleaned.delete('limit');
    cleaned.delete('plan');
    if (!cleaned.get('tab')) {
      cleaned.set('tab', 'channels');
    }
    const qs = cleaned.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [searchParams, pathname, router]);

  const handleInitialConnectHandled = useCallback(() => {
    setInitialConnectPlatform(null);
    if (!searchParams.get('connect')) return;
    const cleaned = new URLSearchParams(safeSearchParamsString(searchParams));
    cleaned.delete('connect');
    const qs = cleaned.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [searchParams, pathname, router]);

  useEffect(() => {
    try {
      const key = `unool_readiness_dismissed_${initialData.workspace.id}`;
      setReadinessDismissed(sessionStorage.getItem(key) === '1');
    } catch {
      setReadinessDismissed(false);
    }
  }, [initialData.workspace.id]);

  // Warn on tab close / full page unload when active section has unsaved edits
  useEffect(() => {
    if (!tabDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [tabDirty]);

  const navigateToTab = useCallback(
    (nextTab: SettingsSectionId) => {
      if (nextTab === activeTab) return;
      if (tabDirty) {
        setPendingTab(nextTab);
        return;
      }
      setActiveTab(nextTab);
      if (nextTab !== 'account') setDangerNotice(false);
      if (nextTab !== 'ai-voice') setPresenceNotice(undefined);
      router.replace(`${pathname}?tab=${nextTab}`, { scroll: false });
    },
    [activeTab, tabDirty, pathname, router]
  );

  const handleConfirmDiscard = () => {
    const target = pendingTab;
    setPendingTab(null);
    setTabDirty(false);
    if (!target) return;
    setActiveTab(target);
    router.replace(`${pathname}?tab=${target}`, { scroll: false });
  };

  const handleDismissReadiness = () => {
    setReadinessDismissed(true);
    try {
      sessionStorage.setItem(`unool_readiness_dismissed_${workspace.id}`, '1');
    } catch {
      // non-fatal
    }
  };

  const handleSignOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    clearAllClientCaches();
    router.push('/login');
  }, [router]);

  const handleMfaChanged = useCallback((enabled: boolean) => {
    setAccount((prev) => (prev.mfaEnabled === enabled ? prev : { ...prev, mfaEnabled: enabled }));
  }, []);

  const handleProfileUpdated = useCallback(
    (nextProfile: StudioProfile | null, nextVersion: number, nextCompleted: boolean) => {
      setStudioProfile(nextProfile);
      setStudioVersion(nextVersion);
      setStudioCompleted(nextCompleted);
    },
    []
  );

  const handleWorkspaceUpdated = useCallback(
    (nextWs: WorkspaceSummaryDto, nextMembers?: WorkspaceMemberDto[]) => {
      setWorkspace(nextWs);
      if (nextMembers) setMembers(nextMembers);
    },
    []
  );

  const readiness = useMemo(
    () =>
      computeSettingsReadiness({
        connectionsSummary,
        studioCompleted,
        studioProfile,
        timezone: preferences.timezone,
        mfaEnabled: account.mfaEnabled,
        emailConfirmedAt: account.emailConfirmedAt,
      }),
    [
      connectionsSummary,
      studioCompleted,
      studioProfile,
      preferences.timezone,
      account.mfaEnabled,
      account.emailConfirmedAt,
    ]
  );

  const personalSections = useMemo(
    () => SETTINGS_SECTIONS.filter((s) => s.group === 'personal'),
    []
  );
  const workspaceSections = useMemo(
    () => SETTINGS_SECTIONS.filter((s) => s.group === 'workspace'),
    []
  );
  const currentMeta = useMemo(
    () => SETTINGS_SECTIONS.find((s) => s.id === activeTab) || SETTINGS_SECTIONS[0],
    [activeTab]
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#16120F] text-[#3D2B1F] dark:text-[#F5EFE6]">
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-9">
        {/* Page Header */}
        <header className="mb-6 pb-5 border-b border-[#E4D9C8] dark:border-[#382F27] flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6E5A48] dark:text-[#B8A896] mb-1">
              Studio Configuration
            </p>
            <h1 className="font-display text-[32px] sm:text-[36px] leading-[1.12] font-medium tracking-[-0.02em] text-[#3D2B1F] dark:text-[#F5EFE6]">
              Settings
            </h1>
            <p className="text-[14px] text-[#6E5A48] dark:text-[#B8A896] mt-1">
              Manage your personal security alongside workspace channels, brand voice, and team access.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-full border border-[#E4D9C8] dark:border-[#382F27] bg-white dark:bg-[#1F1A16] text-[12px]">
            <span className="h-2 w-2 rounded-full bg-[#C4A265]" aria-hidden="true" />
            <span className="font-medium truncate max-w-[180px]">{workspace.name}</span>
            <span className="text-[#6E5A48] dark:text-[#B8A896] capitalize">
              · {initialData.callerRole}
            </span>
          </div>
        </header>

        {initialData.isImpersonated && <ImpersonationNotice />}

        {!readinessDismissed && !readiness.allReady && (
          <ReadinessStrip
            items={readiness.items}
            onSelectTab={navigateToTab}
            onDismiss={handleDismissReadiness}
          />
        )}

        {/* Mobile Sticky Section Selector (< 768px) */}
        <div className="md:hidden sticky top-2 z-20 mb-5 rounded-2xl border border-[#E4D9C8] dark:border-[#382F27] bg-white/95 dark:bg-[#1F1A16]/95 backdrop-blur px-3 py-2.5 shadow-xs">
          <label
            htmlFor="mobile-settings-section"
            className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6E5A48] dark:text-[#B8A896] mb-1"
          >
            Settings Section ({currentMeta.group === 'personal' ? 'Personal' : 'Workspace'})
          </label>
          <select
            id="mobile-settings-section"
            value={activeTab}
            onChange={(e) => navigateToTab(e.target.value as SettingsSectionId)}
            className="w-full min-h-[44px] rounded-xl border border-[#E4D9C8] dark:border-[#382F27] bg-[#FAF7F2] dark:bg-[#28211C] px-3 text-[14px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6]"
          >
            <optgroup label="Personal">
              {personalSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Workspace">
              {workspaceSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Two-column layout: Desktop grouped nav + bounded content column */}
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
          <aside className="hidden md:block w-[240px] shrink-0 sticky top-6">
            <nav aria-label="Settings sections" className="space-y-6">
              <div>
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6E5A48] dark:text-[#B8A896]">
                  Personal
                </p>
                <div className="space-y-1">
                  {personalSections.map((sec) => {
                    const Icon = SECTION_ICONS[sec.id];
                    const active = activeTab === sec.id;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => navigateToTab(sec.id)}
                        aria-current={active ? 'page' : undefined}
                        className={`w-full min-h-[42px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13.5px] font-medium text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#3D2B1F] text-white dark:bg-[#C4A265] dark:text-[#16120F] shadow-xs'
                            : 'text-[#3D2B1F] dark:text-[#F5EFE6] hover:bg-[#F4EFE6] dark:hover:bg-[#28211C]'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{sec.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6E5A48] dark:text-[#B8A896]">
                  Workspace
                </p>
                <div className="space-y-1">
                  {workspaceSections.map((sec) => {
                    const Icon = SECTION_ICONS[sec.id];
                    const active = activeTab === sec.id;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => navigateToTab(sec.id)}
                        aria-current={active ? 'page' : undefined}
                        className={`w-full min-h-[42px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13.5px] font-medium text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#3D2B1F] text-white dark:bg-[#C4A265] dark:text-[#16120F] shadow-xs'
                            : 'text-[#3D2B1F] dark:text-[#F5EFE6] hover:bg-[#F4EFE6] dark:hover:bg-[#28211C]'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{sec.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </nav>
          </aside>

          {/* Main Section Canvas */}
          <main className="flex-1 w-full min-w-0 max-w-[740px]">
            {activeTab === 'account' && (
              <AccountTab
                account={account}
                preferences={preferences}
                isImpersonated={initialData.isImpersonated}
                dangerNotice={dangerNotice}
                onAccountUpdated={setAccount}
                onPreferencesUpdated={setPreferences}
                onDirtyChange={setTabDirty}
                onNavigateTab={navigateToTab}
              />
            )}

            {activeTab === 'security' && (
              <SecurityTab
                userEmail={account.email}
                initialMfaEnabled={account.mfaEnabled}
                isImpersonated={initialData.isImpersonated}
                onMfaChanged={handleMfaChanged}
                onSignOut={handleSignOut}
              />
            )}

            {activeTab === 'notifications' && (
              <NotificationsTab
                preferences={preferences}
                onPreferencesUpdated={setPreferences}
              />
            )}

            {activeTab === 'channels' && (
              <ChannelsTab
                workspaceId={workspace.id}
                workspaceName={workspace.name}
                userId={initialData.userId}
                callerRole={initialData.callerRole}
                connectionsSummary={connectionsSummary}
                publicApiEnabled={initialData.publicApiEnabled}
                onConnectionsUpdated={setConnectionsSummary}
                refreshNonce={connectionsRefreshNonce}
                initialConnectPlatform={initialConnectPlatform}
                onInitialConnectHandled={handleInitialConnectHandled}
              />
            )}

            {activeTab === 'ai-voice' && (
              <AiVoiceTab
                userId={initialData.userId}
                workspaceName={workspace.name}
                callerRole={initialData.callerRole}
                preferences={preferences}
                initialProfile={studioProfile}
                initialVersion={studioVersion}
                initialCompleted={studioCompleted}
                presenceNotice={presenceNotice}
                onPreferencesUpdated={setPreferences}
                onProfileUpdated={handleProfileUpdated}
                onDirtyChange={setTabDirty}
              />
            )}

            {activeTab === 'workspace' && (
              <WorkspaceTab
                currentUserId={initialData.userId}
                workspace={workspace}
                callerRole={initialData.callerRole}
                members={members}
                workspaces={initialData.workspaces}
                billing={initialData.billing}
                isImpersonated={initialData.isImpersonated}
                onWorkspaceUpdated={handleWorkspaceUpdated}
                onDirtyChange={setTabDirty}
              />
            )}
          </main>
        </div>
      </div>

      <UnsavedChangesDialog
        open={Boolean(pendingTab)}
        onStay={() => setPendingTab(null)}
        onDiscard={handleConfirmDiscard}
      />
    </div>
  );
}
