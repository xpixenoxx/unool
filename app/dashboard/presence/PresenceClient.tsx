'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  Link2,
  Loader2,
  Palette,
  RefreshCw,
  Save,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { getPlan } from '@/lib/billing/plans';
import { registerClientCacheReset, syncClientCacheScope } from '@/lib/utils/clientCache';
import { SPARK_FREE_TEMPLATE_IDS } from '@/components/profile/templates/registry';
import { ProfilePreview } from '@/components/profile/ProfilePreview';
import { IdentityBioTab } from '@/components/profile/builder/IdentityBioTab';
import { LinksProofTab } from '@/components/profile/builder/LinksProofTab';
import { DesignTemplatesTab } from '@/components/profile/builder/DesignTemplatesTab';
import { DomainPrivacyAnalyticsTab } from '@/components/profile/builder/DomainPrivacyAnalyticsTab';
import { LivePreviewPane } from '@/components/profile/builder/LivePreviewPane';
import {
  buildProfileSavePayload,
  createEmptyBuilderProfile,
  normalizeLoadedProfile,
  resolveBuilderTab,
  toPreviewPublicProfile,
  type BuilderProfileState,
  type BuilderSaveError,
  type BuilderTabId,
} from '@/components/profile/builder/types';

interface PresenceClientProps {
  userId: string;
  workspaceId: string;
}

interface StudioProfileContext {
  role?: string;
  businessDomain?: string;
  doing?: string;
  audience?: string;
  tone?: string;
}

interface WorkspacePresenceCacheEntry {
  profile: BuilderProfileState;
  claimedSubdomain: string;
  studioProfile: StudioProfileContext | null;
  maxTemplatesAllowed: number;
}

const workspacePresenceCache = new Map<string, WorkspacePresenceCacheEntry>();
registerClientCacheReset(() => {
  workspacePresenceCache.clear();
});

const BUILDER_TABS: Array<{
  id: BuilderTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'identity', label: 'Identity & Bio', icon: User },
  { id: 'links', label: 'Links & Proof', icon: Link2 },
  { id: 'design', label: 'Design & Templates', icon: Palette },
  { id: 'domain', label: 'Domain & Analytics', icon: Globe },
];

export function PresenceClient({ userId, workspaceId }: PresenceClientProps) {
  syncClientCacheScope(userId, workspaceId);

  const searchParams = useSearchParams();
  const initialTab = resolveBuilderTab(searchParams.get('tab'));
  const cacheKey = `${userId}:${workspaceId}`;
  const cached = workspacePresenceCache.get(cacheKey);

  const [activeTab, setActiveTab] = useState<BuilderTabId>(initialTab);
  const [profile, setProfile] = useState<BuilderProfileState>(() => cached?.profile ?? createEmptyBuilderProfile());
  const [claimedSubdomain, setClaimedSubdomain] = useState<string>(() => cached?.claimedSubdomain ?? '');
  const [studioProfile, setStudioProfile] = useState<StudioProfileContext | null>(() => cached?.studioProfile ?? null);
  const [maxTemplatesAllowed, setMaxTemplatesAllowed] = useState<number>(() => cached?.maxTemplatesAllowed ?? 24);
  const [loading, setLoading] = useState<boolean>(() => !cached);
  const [saveState, setSaveState] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<BuilderSaveError | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  const revisionRef = useRef(0);
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const claimedSubdomainRef = useRef(claimedSubdomain);
  claimedSubdomainRef.current = claimedSubdomain;
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    const requestedTab = resolveBuilderTab(searchParams.get('tab'));
    if (searchParams.get('tab')) {
      setActiveTab(requestedTab);
    }
  }, [searchParams]);

  const loadWorkspaceProfile = useCallback(
    async (force = false) => {
      if (!force && workspacePresenceCache.has(cacheKey)) {
        const entry = workspacePresenceCache.get(cacheKey)!;
        setProfile(entry.profile);
        setClaimedSubdomain(entry.claimedSubdomain);
        setStudioProfile(entry.studioProfile);
        setMaxTemplatesAllowed(entry.maxTemplatesAllowed);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [profileRes, contextRes] = await Promise.allSettled([
          fetch('/api/profile', { credentials: 'include' }),
          fetch('/api/user/context', { credentials: 'include' }),
        ]);

        let nextProfile = createEmptyBuilderProfile();
        let nextClaimed = '';
        let nextStudio: StudioProfileContext | null = null;
        let nextMaxTemplates = 24;

        if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
          const data = await profileRes.value.json().catch(() => null);
          const normalized = normalizeLoadedProfile(data);
          if (normalized) {
            nextProfile = normalized;
            nextClaimed = normalized.subdomain || '';
          } else if (data && typeof data === 'object' && typeof (data as Record<string, unknown>).email === 'string') {
            nextProfile.email = String((data as Record<string, unknown>).email);
          }

          if (data && typeof data === 'object') {
            const rawObj = data as Record<string, unknown>;
            const studio = (rawObj.studioProfile ?? rawObj.studio_profile) as StudioProfileContext | undefined;
            if (studio && typeof studio === 'object') {
              nextStudio = studio;
            }
          }
        }

        if (contextRes.status === 'fulfilled' && contextRes.value.ok) {
          const ctxData = await contextRes.value.json().catch(() => null);
          const planTier = ctxData?.workspace?.planTier;
          if (typeof planTier === 'string') {
            const plan = getPlan(planTier);
            if (plan) {
              nextMaxTemplates = plan.isFreeTier ? SPARK_FREE_TEMPLATE_IDS.size : 24;
            }
          }
        }

        setProfile(nextProfile);
        setClaimedSubdomain(nextClaimed);
        setStudioProfile(nextStudio);
        setMaxTemplatesAllowed(nextMaxTemplates);
        isDirtyRef.current = false;
        setSaveState('idle');
        setSaveError(null);

        workspacePresenceCache.set(cacheKey, {
          profile: nextProfile,
          claimedSubdomain: nextClaimed,
          studioProfile: nextStudio,
          maxTemplatesAllowed: nextMaxTemplates,
        });
      } catch {
        toast.error('Failed to load your profile workspace');
      } finally {
        setLoading(false);
      }
    },
    [cacheKey]
  );

  useEffect(() => {
    void loadWorkspaceProfile(false);
  }, [loadWorkspaceProfile]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (!mobilePreviewOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobilePreviewOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobilePreviewOpen]);

  const executeSave = useCallback(
    async (mode: 'auto' | 'manual') => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }

      const targetProfile = profileRef.current;
      const targetSubdomain = claimedSubdomainRef.current;
      const saveRevision = revisionRef.current;

      setSaveState('saving');
      setSaveError(null);

      try {
        const payload = buildProfileSavePayload(targetProfile, targetSubdomain);
        const res = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const detailMsg = Array.isArray(data?.details) && data.details[0]?.message
            ? String(data.details[0].message)
            : null;
          const errObj: BuilderSaveError = {
            status: res.status,
            code: typeof data?.code === 'string' ? data.code : undefined,
            message: detailMsg || data?.error || 'Could not save profile changes',
            upgradeUrl: typeof data?.upgradeUrl === 'string' ? data.upgradeUrl : undefined,
          };
          setSaveError(errObj);
          setSaveState('error');
          if (mode === 'manual') {
            toast.error(errObj.message);
          }
          return;
        }

        const savedVersion = typeof data?.profile?.version === 'number' ? data.profile.version : targetProfile.version;
        const savedSubdomain =
          typeof data?.profile?.subdomain === 'string' ? data.profile.subdomain : targetSubdomain;
        const savedId = typeof data?.profile?.id === 'string' ? data.profile.id : targetProfile.id;

        if (savedSubdomain && savedSubdomain !== targetSubdomain) {
          setClaimedSubdomain(savedSubdomain);
        }

        setProfile((prev) => {
          const updated: BuilderProfileState = {
            ...prev,
            id: savedId,
            subdomain: savedSubdomain || prev.subdomain,
            version: savedVersion,
          };
          workspacePresenceCache.set(cacheKey, {
            profile: updated,
            claimedSubdomain: savedSubdomain || claimedSubdomainRef.current,
            studioProfile,
            maxTemplatesAllowed,
          });
          return updated;
        });

        if (revisionRef.current === saveRevision) {
          isDirtyRef.current = false;
          setSaveState('saved');
        } else {
          isDirtyRef.current = true;
          setSaveState('dirty');
        }

        if (mode === 'manual') {
          toast.success('Profile saved');
        }
      } catch {
        setSaveState('error');
        setSaveError({ status: 0, message: 'Network error while saving changes.' });
        if (mode === 'manual') {
          toast.error('Network error while saving');
        }
      }
    },
    [cacheKey, maxTemplatesAllowed, studioProfile]
  );

  const handleProfileChange = useCallback(
    (updater: (prev: BuilderProfileState) => BuilderProfileState) => {
      revisionRef.current += 1;
      isDirtyRef.current = true;
      setSaveState('dirty');
      setSaveError(null);

      setProfile((prev) => {
        const next = updater(prev);
        profileRef.current = next;
        return next;
      });

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        void executeSave('auto');
      }, 1200);
    },
    [executeSave]
  );

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const handleSubdomainUpdated = useCallback(
    (nextSubdomain: string, nextVersion?: number) => {
      setClaimedSubdomain(nextSubdomain);
      setProfile((prev) => {
        const updated: BuilderProfileState = {
          ...prev,
          subdomain: nextSubdomain,
          version: typeof nextVersion === 'number' ? nextVersion : prev.version,
        };
        workspacePresenceCache.set(cacheKey, {
          profile: updated,
          claimedSubdomain: nextSubdomain,
          studioProfile,
          maxTemplatesAllowed,
        });
        return updated;
      });
    },
    [cacheKey, maxTemplatesAllowed, studioProfile]
  );

  const liveUrl = useMemo(() => {
    if (profile.customDomain && profile.customDomainVerifiedAt) {
      return `https://${profile.customDomain}`;
    }
    if (claimedSubdomain) {
      return `/u/${claimedSubdomain}`;
    }
    return null;
  }, [claimedSubdomain, profile.customDomain, profile.customDomainVerifiedAt]);

  const handleCopyUrl = useCallback(async () => {
    if (!liveUrl) return;
    const absoluteUrl = liveUrl.startsWith('http')
      ? liveUrl
      : typeof window !== 'undefined'
        ? `${window.location.origin}${liveUrl}`
        : `https://${claimedSubdomain}.unool.co`;
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopiedUrl(true);
      toast.success('Profile link copied');
      setTimeout(() => setCopiedUrl(false), 1800);
    } catch {
      toast.error('Copy failed');
    }
  }, [claimedSubdomain, liveUrl]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex items-center justify-center min-h-[420px]">
        <div className="flex items-center gap-2.5 text-sm text-zinc-500 dark:text-zinc-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading profile studio...
        </div>
      </div>
    );
  }

  const mobilePreviewProfile = toPreviewPublicProfile(profile, claimedSubdomain);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Top Sticky Action Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Public Profile Builder
            </h1>
            {saveState === 'saving' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-300">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving
              </span>
            )}
            {saveState === 'saved' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[11px] text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-3 h-3" /> Saved
              </span>
            )}
            {saveState === 'dirty' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-[11px] text-amber-700 dark:text-amber-300">
                Unsaved changes
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Design your editorial dossier, manage proof &amp; links, and publish to your Unool handle or custom domain.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {liveUrl && (
            <div className="inline-flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-xs font-mono text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-emerald-500" aria-hidden="true" />
                {claimedSubdomain ? `${claimedSubdomain}.unool.co` : profile.customDomain}
                <ExternalLink className="w-3 h-3 opacity-60" aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={handleCopyUrl}
                aria-label="Copy live profile URL"
                className="px-2.5 py-1.5 border-l border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => executeSave('manual')}
            disabled={saveState === 'saving'}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:opacity-90 disabled:opacity-50 shadow-sm"
          >
            {saveState === 'saving' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Profile
          </button>
        </div>
      </header>

      {/* Structured Save Error Banner */}
      {saveError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-red-800 dark:text-red-200"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError.message}</span>
          </div>

          <div className="flex items-center gap-2">
            {saveError.status === 409 && (
              <button
                type="button"
                onClick={() => loadWorkspaceProfile(true)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
              >
                <RefreshCw className="w-3 h-3" /> Reload Latest
              </button>
            )}
            {saveError.status === 403 && (
              <Link
                href={saveError.upgradeUrl || '/dashboard/billing'}
                className="px-3 py-1 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold"
              >
                Upgrade Plan
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Split-Pane Editor + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-5 min-w-0">
          {/* Builder Tab Navigation */}
          <nav
            role="tablist"
            aria-label="Profile builder sections"
            className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60"
          >
            {BUILDER_TABS.map((tab) => {
              const Icon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  id={`profile-tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={`profile-panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[125px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    selected
                      ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200/80 dark:border-zinc-700'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Active Tab Panel */}
          <div role="tabpanel" id={`profile-panel-${activeTab}`} aria-labelledby={`profile-tab-${activeTab}`}>
            {activeTab === 'identity' && (
              <IdentityBioTab profile={profile} studioProfile={studioProfile} onChange={handleProfileChange} />
            )}

            {activeTab === 'links' && <LinksProofTab profile={profile} onChange={handleProfileChange} />}

            {activeTab === 'design' && (
              <DesignTemplatesTab
                profile={profile}
                claimedSubdomain={claimedSubdomain}
                maxTemplatesAllowed={maxTemplatesAllowed}
                onChange={handleProfileChange}
              />
            )}

            {activeTab === 'domain' && (
              <DomainPrivacyAnalyticsTab
                profile={profile}
                claimedSubdomain={claimedSubdomain}
                onChange={handleProfileChange}
                onSubdomainUpdated={handleSubdomainUpdated}
                onRefreshProfile={() => loadWorkspaceProfile(true)}
              />
            )}
          </div>
        </div>

        {/* Sticky Desktop Live Preview */}
        <aside className="hidden lg:block lg:col-span-5 sticky top-6">
          <LivePreviewPane
            profile={profile}
            claimedSubdomain={claimedSubdomain}
            liveUrl={liveUrl}
            onCopyUrl={handleCopyUrl}
            copied={copiedUrl}
          />
        </aside>
      </div>

      {/* Mobile Floating Live Preview Button */}
      <button
        type="button"
        onClick={() => setMobilePreviewOpen(true)}
        className="lg:hidden fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold shadow-lg hover:opacity-90"
      >
        <Eye className="w-4 h-4" aria-hidden="true" />
        Preview Profile
      </button>

      {/* Mobile Preview Drawer Modal */}
      {mobilePreviewOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile live profile preview"
        >
          <div className="px-4 py-3 bg-zinc-950 text-white border-b border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-semibold truncate">{profile.name || 'Live Preview'}</span>
            <button
              type="button"
              onClick={() => setMobilePreviewOpen(false)}
              aria-label="Close mobile preview"
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex justify-center">
            <div
              className="w-[390px] max-w-full bg-white dark:bg-zinc-950 rounded-xl overflow-y-auto overflow-x-hidden shadow-2xl"
              style={{ transform: 'translateZ(0)' }}
            >
              <ProfilePreview
                profile={mobilePreviewProfile}
                templateId={profile.theme.template}
                accentColor={profile.theme.accentColor}
                isPreview={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PresenceClientWrapper({ userId, workspaceId }: PresenceClientProps) {
  return (
    <Suspense
      fallback={
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      }
    >
      <PresenceClient userId={userId} workspaceId={workspaceId} />
    </Suspense>
  );
}
