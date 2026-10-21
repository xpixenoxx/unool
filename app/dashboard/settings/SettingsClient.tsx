'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2,
  Key,
  Shield,
  Bell,
  Trash2,
  Lock,
  LogOut,
  AlertCircle,
  Copy,
  Trash,
  Check,
  Sliders,
  AlertTriangle,
  Link as LinkIcon,
  Key as KeyIcon,
  CheckCircle2,
  XCircle,
  Building2,
  Zap,
  Sparkles,
  CreditCard,
  Terminal,
  Webhook,
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { StudioOnboardingModal } from '@/components/dashboard/StudioOnboardingModal';
import { StudioProfile, getRoleConfig, ROLE_BRANCH_CONFIGS } from '@/lib/config/studioOnboarding';

type SectionId = 'workspace' | 'studio' | 'integrations' | 'notifications' | 'security' | 'danger';

interface Workspace {
  id: string;
  name: string;
  plan: string;
}

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  revoked: boolean;
}

type ApiKeyScope = 'posts:read' | 'posts:write' | 'analytics:read' | 'profile:write' | 'webhooks:manage';

const ALL_SCOPES: { value: ApiKeyScope; label: string; description: string }[] = [
  { value: 'posts:read', label: 'Posts: Read', description: 'Read posts and drafts' },
  { value: 'posts:write', label: 'Posts: Write', description: 'Create, update, publish posts' },
  { value: 'analytics:read', label: 'Analytics: Read', description: 'View analytics and engagement data' },
  { value: 'profile:write', label: 'Profile: Write', description: 'Update profile, links, proof points' },
  { value: 'webhooks:manage', label: 'Webhooks: Manage', description: 'Configure and manage webhook endpoints' },
];

const NAV_SECTIONS: {
  id: SectionId;
  icon: React.ElementType;
  label: string;
  description: string;
  danger?: boolean;
}[] = [
  { id: 'workspace', icon: Building2, label: 'Workspace', description: 'Name, plan & details' },
  { id: 'studio', icon: Sparkles, label: 'Studio AI', description: 'Voice & persona calibration' },
  { id: 'integrations', icon: Terminal, label: 'Integrations', description: 'API keys & webhooks' },
  { id: 'notifications', icon: Bell, label: 'Notifications', description: 'Email & event alerts' },
  { id: 'security', icon: Shield, label: 'Security', description: 'MFA & active sessions' },
  { id: 'danger', icon: AlertTriangle, label: 'Danger Zone', description: 'Irreversible actions', danger: true },
];

interface SettingsClientProps {
  userId: string;
  workspaceId: string;
}

/* ─── Shared small components ─── */

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="h-9 w-9 rounded-xl bg-[#F5EFE2] dark:bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-[#C4A265]" />
      </div>
      <div>
        <h2 className="text-base font-bold text-[#3D2B1F] dark:text-zinc-100 leading-tight">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
  last = false,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 ${
        !last ? 'border-b border-zinc-100 dark:border-zinc-800' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#3D2B1F] dark:text-zinc-100">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 text-balance">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function PCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

function PCardHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40">
      {children}
    </div>
  );
}

function PCardBody({ children }: { children: React.ReactNode }) {
  return <div className="px-6 py-5">{children}</div>;
}

/* ─── Main component ─── */

export function SettingsContent({ userId, workspaceId }: SettingsClientProps) {
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<SectionId>('workspace');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [oauthBanner, setOauthBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [copiedWorkspaceId, setCopiedWorkspaceId] = useState(false);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScopes, setNewKeyScopes] = useState<ApiKeyScope[]>(['posts:read', 'posts:write']);
  const [newKeyExpiresDays, setNewKeyExpiresDays] = useState('');
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [newKeyPlaintext, setNewKeyPlaintext] = useState<string>('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [togglingMfa, setTogglingMfa] = useState(false);

  // Studio Profile state
  const [studioProfile, setStudioProfile] = useState<StudioProfile>({
    role: '',
    businessStage: '',
    businessDomain: '',
    workInterests: '',
    doing: '',
    audience: '',
    tone: '',
    style: '',
    interests: [],
  });
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [savingOnboarding, setSavingOnboarding] = useState(false);
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const roleConfig = getRoleConfig(studioProfile.role);

  /* ── data loaders ── */

  const loadOnboardingProfile = async () => {
    try {
      const res = await fetch('/api/studio/profile', { credentials: 'include', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setOnboardingCompleted(Boolean(data.isCompleted));
        if (data.profile) {
          setStudioProfile({
            role: data.profile.role || '',
            businessStage: data.profile.businessStage || '',
            businessDomain: data.profile.businessDomain || data.profile.doing || '',
            workInterests: data.profile.workInterests || '',
            doing: data.profile.doing || data.profile.businessDomain || '',
            audience: data.profile.audience || '',
            tone: data.profile.tone || '',
            style: data.profile.style || '',
            interests: Array.isArray(data.profile.interests) ? data.profile.interests : [],
            completedAt: data.profile.completedAt,
          });
          return;
        }
      }
      const legacyRes = await fetch('/api/profile/onboarding', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (legacyRes.ok) {
        const legacyData = await legacyRes.json();
        if (legacyData.studio_profile || legacyData.studioProfile) {
          const sp = legacyData.studio_profile || legacyData.studioProfile;
          setStudioProfile({
            role: sp.role || '',
            businessStage: sp.businessStage || '',
            businessDomain: sp.businessDomain || sp.doing || '',
            workInterests: sp.workInterests || '',
            doing: sp.doing || sp.businessDomain || '',
            audience: sp.audience || '',
            tone: sp.tone || '',
            style: sp.style || '',
            interests: Array.isArray(sp.interests) ? sp.interests : [],
            completedAt: sp.completedAt,
          });
          setOnboardingCompleted(
            Boolean(legacyData.onboarding_completed || legacyData.onboardingCompleted),
          );
        } else if (legacyData.answers || legacyData.onboarding_answers) {
          const a = legacyData.answers || legacyData.onboarding_answers;
          setStudioProfile({
            role: a.persona || '',
            businessStage: '',
            businessDomain: a.focus || '',
            workInterests: '',
            doing: a.focus || '',
            audience: Array.isArray(a.audience) ? a.audience.join(', ') : a.audience || '',
            tone: Array.isArray(a.tone) ? a.tone.join(', ') : a.tone || '',
            style: a.custom?.style || 'Short & punchy',
            interests: Array.isArray(a.extras) ? a.extras : [],
          });
          setOnboardingCompleted(
            Boolean(legacyData.onboarding_completed || legacyData.onboardingCompleted),
          );
        }
      }
    } catch (e) {
      console.warn('Failed to load studio profile in settings:', e);
    }
  };

  const handleSaveOnboarding = async () => {
    setSavingOnboarding(true);
    try {
      const domain = (studioProfile.businessDomain || studioProfile.doing || '').trim();
      const payload: StudioProfile = {
        role: (studioProfile.role.trim() || 'Creator').slice(0, 80),
        businessStage: (studioProfile.businessStage?.trim() || 'Growing').slice(0, 80),
        businessDomain: (domain || 'Software/AI').slice(0, 80),
        workInterests: studioProfile.workInterests?.trim()
          ? studioProfile.workInterests.trim().slice(0, 120)
          : undefined,
        doing: (domain || 'Software/AI').slice(0, 80),
        audience: (studioProfile.audience.trim() || 'Followers in my niche').slice(0, 80),
        tone: (studioProfile.tone.trim() || 'Conversational & candid').slice(0, 80),
        style: (studioProfile.style.trim() || 'Short punchy lines').slice(0, 80),
        interests:
          studioProfile.interests.length > 0
            ? studioProfile.interests.map((i) => i.trim().slice(0, 80)).filter(Boolean)
            : ['General topics'],
        completedAt: new Date().toISOString(),
      };

      const res = await fetch('/api/studio/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStudioProfile(payload);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('studio-profile-updated', { detail: payload }));
        }
        toast.success('Studio AI calibrations saved!');
        setOnboardingCompleted(true);
      } else {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to save settings');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update Studio AI');
    } finally {
      setSavingOnboarding(false);
    }
  };

  /* ── oauth banner ── */
  const connected = searchParams.get('connected');
  const error = searchParams.get('error');
  const description = searchParams.get('description');

  useEffect(() => {
    if (connected) {
      const platformName = connected.charAt(0).toUpperCase() + connected.slice(1);
      setOauthBanner({ type: 'success', message: `${platformName} connected successfully!` });
      toast.success(`${platformName} connected!`);
    } else if (error) {
      const msg = description
        ? decodeURIComponent(description)
        : error === 'redis_unconfigured'
          ? 'Redis (Upstash) is not configured. Platform connections require Redis for OAuth state.'
          : error === 'invalid_state'
            ? 'OAuth session expired. Please try connecting again.'
            : `Connection failed: ${error}`;
      setOauthBanner({ type: 'error', message: msg });
      toast.error('Connection failed', { description: msg });
    }
  }, [connected, error, description]);

  useEffect(() => {
    loadWorkspace();
    loadApiKeys();
    loadUserSecurity();
    loadOnboardingProfile();
  }, []);

  const loadUserSecurity = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      setMfaEnabled(data.user?.user_metadata?.mfa_enabled === true);
    } catch {}
  };

  const handleToggleMfa = async (checked: boolean) => {
    setTogglingMfa(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ data: { mfa_enabled: checked } });
      if (error) throw error;
      setMfaEnabled(checked);
      toast.success(`MFA ${checked ? 'enabled' : 'disabled'} successfully.`);
    } catch {
      toast.error('Failed to update MFA settings');
    } finally {
      setTogglingMfa(false);
    }
  };

  const loadWorkspace = async () => {
    try {
      const res = await fetch('/api/workspace', { credentials: 'include' });
      const data = await res.json();
      if (data.workspace) {
        setWorkspace(data.workspace);
        setWorkspaceName(data.workspace.name);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const loadApiKeys = async () => {
    setApiKeysLoading(true);
    try {
      const res = await fetch('/api/keys', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys || []);
      }
    } catch {
      // ignore
    } finally {
      setApiKeysLoading(false);
    }
  };

  const handleSaveWorkspace = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/workspace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: workspaceName }),
      });
      if (res.ok) {
        toast.success('Workspace name updated');
      } else {
        toast.error('Failed to update workspace');
      }
    } catch {
      toast.error('Failed to update workspace');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) { toast.error('Key name is required'); return; }
    if (newKeyScopes.length === 0) { toast.error('Select at least one scope'); return; }
    setCreatingKey(true);
    try {
      const expiresAt = newKeyExpiresDays
        ? new Date(Date.now() + parseInt(newKeyExpiresDays) * 24 * 60 * 60 * 1000).toISOString()
        : undefined;
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newKeyName, scopes: newKeyScopes, expiresAt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create key');
      setNewKeyPlaintext(data.plaintextKey);
      setShowNewKey(data.key.id);
      setNewKeyName('');
      setNewKeyScopes(['posts:read', 'posts:write']);
      setNewKeyExpiresDays('');
      setCreateDialogOpen(false);
      await loadApiKeys();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create key');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/keys/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'revoke' }),
      });
      if (res.ok) {
        toast.success('API key revoked');
        await loadApiKeys();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to revoke key');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke key');
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Permanently delete this API key? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/keys/${keyId}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        toast.success('API key deleted');
        await loadApiKeys();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete key');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete key');
    }
  };

  const handleCopyKey = (key: string, keyId?: string) => {
    navigator.clipboard.writeText(key);
    toast.success('Key copied to clipboard');
    if (keyId) setCopiedKeyId(keyId);
  };

  const handleSignOut = async () => {
    const res = await fetch('/api/auth/signout', { method: 'POST' });
    if (res.ok) window.location.href = '/signup';
  };

  /* ── loading skeleton ── */
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <div className="h-8 w-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-64 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="flex gap-6">
          <div className="w-52 shrink-0 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="flex-1 space-y-4">
            <div className="h-40 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
            <div className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  /* ── main render ── */
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#3D2B1F] dark:text-zinc-100 tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your workspace, Studio AI, integrations, and account security.
        </p>
      </div>

      {/* OAuth Banner */}
      {oauthBanner && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border mb-6 text-sm font-medium ${
            oauthBanner.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200'
              : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200'
          }`}
        >
          {oauthBanner.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {oauthBanner.message}
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="md:w-52 shrink-0">
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {NAV_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-150 whitespace-nowrap md:whitespace-normal w-full cursor-pointer group
                    ${
                      isActive
                        ? section.danger
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 shadow-xs'
                          : 'bg-[#F5EFE2] dark:bg-zinc-800 text-[#3D2B1F] dark:text-zinc-100 shadow-xs'
                        : section.danger
                          ? 'text-red-500 dark:text-red-400 hover:bg-red-50/70 dark:hover:bg-red-900/20'
                          : 'text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-foreground'
                    }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                      isActive
                        ? section.danger
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-[#C4A265]'
                        : 'opacity-60 group-hover:opacity-100'
                    }`}
                  />
                  <span className="text-[13px] font-medium">{section.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Panel */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* ══════════════ WORKSPACE ══════════════ */}
          {activeSection === 'workspace' && (
            <div className="space-y-5">
              <SectionHeading
                icon={Building2}
                title="Workspace"
                subtitle="Configure your workspace identity and plan details."
              />

              <PCard>
                <PCardHead>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Identity
                  </p>
                </PCardHead>
                <PCardBody>
                  <SettingRow
                    label="Workspace Name"
                    description="Displayed across your dashboard and public profile."
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        id="workspace-name"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        placeholder="My Workspace"
                        className="w-44 h-8 text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveWorkspace}
                        disabled={saving || workspaceName === workspace?.name}
                        className="h-8 bg-[#3D2B1F] hover:bg-[#2a1e15] text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer"
                      >
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                      </Button>
                    </div>
                  </SettingRow>

                  <SettingRow
                    label="Workspace ID"
                    description="Use this in API requests to identify your workspace."
                    last
                  >
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-zinc-600 dark:text-zinc-400 truncate max-w-[140px]">
                        {workspace?.id || workspaceId}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(workspace?.id || workspaceId);
                          setCopiedWorkspaceId(true);
                          setTimeout(() => setCopiedWorkspaceId(false), 2000);
                          toast.success('Workspace ID copied');
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        {copiedWorkspaceId ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </SettingRow>
                </PCardBody>
              </PCard>

              <PCard>
                <PCardHead>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Plan & Billing
                  </p>
                </PCardHead>
                <PCardBody>
                  <SettingRow
                    label="Current Plan"
                    description="Your active subscription tier and feature access."
                  >
                    <Badge
                      className={`capitalize font-semibold text-xs px-2.5 py-0.5 ${
                        workspace?.plan === 'pro' || workspace?.plan === 'premium'
                          ? 'bg-[#C4A265]/15 text-[#8B6914] border-[#C4A265]/30 dark:bg-[#C4A265]/10 dark:text-[#C4A265]'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                      variant="outline"
                    >
                      {workspace?.plan || 'Free'}
                    </Badge>
                  </SettingRow>
                  <SettingRow
                    label="Upgrade Plan"
                    description="Unlock advanced AI, more platforms, and priority support."
                    last
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 border-[#C4A265]/40 text-[#8B6914] hover:bg-[#F5EFE2] dark:text-[#C4A265] dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <Zap className="h-3 w-3" />
                      Upgrade
                    </Button>
                  </SettingRow>
                </PCardBody>
              </PCard>
            </div>
          )}

          {/* ══════════════ STUDIO AI ══════════════ */}
          {activeSection === 'studio' && (
            <div className="space-y-5">
              <SectionHeading
                icon={Sparkles}
                title="Studio AI"
                subtitle="Your voice signature powers all AI-generated content across every platform."
              />

              {/* Status card */}
              <PCard>
                <PCardBody>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          onboardingCompleted ? 'bg-emerald-500' : 'bg-amber-400'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#3D2B1F] dark:text-zinc-100">
                          {onboardingCompleted ? 'Voice Calibrated' : 'Calibration Pending'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {onboardingCompleted
                            ? 'Your Studio AI is fully tuned to your voice.'
                            : 'Complete calibration for the best AI output quality.'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowRetakeModal(false);
                        setTimeout(() => setShowRetakeModal(true), 0);
                      }}
                      className="gap-1.5 text-xs font-semibold hover:bg-[#F5EFE2] dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <Sliders className="h-3 w-3 text-[#C4A265]" />
                      Launch Calibrator
                    </Button>
                  </div>
                </PCardBody>
              </PCard>

              {/* Voice Signature Summary */}
              <PCard>
                <PCardHead>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Current Voice Signature
                  </p>
                </PCardHead>
                <PCardBody>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { label: 'Role', value: studioProfile.role || '—' },
                      {
                        label: roleConfig.stageTitle.replace(/\?$/, ''),
                        value: studioProfile.businessStage || '—',
                      },
                      {
                        label: roleConfig.domainLabel,
                        value: studioProfile.businessDomain || studioProfile.doing || '—',
                      },
                      {
                        label: roleConfig.audienceTitle.replace(/\?$/, ''),
                        value: studioProfile.audience || '—',
                      },
                      { label: 'Voice Tone', value: studioProfile.tone || '—' },
                      { label: 'Content Style', value: studioProfile.style || '—' },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-700/60"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                          {label}
                        </p>
                        <p className="text-xs font-semibold text-[#3D2B1F] dark:text-zinc-100 truncate">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {studioProfile.interests && studioProfile.interests.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-1.5">
                      <span className="text-[11px] font-medium text-muted-foreground self-center mr-1">
                        Interests:
                      </span>
                      {studioProfile.interests.map((interest) => (
                        <span
                          key={interest}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F5EFE2] dark:bg-zinc-800 text-[#8B6914] dark:text-[#C4A265] border border-[#C4A265]/20"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  )}
                </PCardBody>
              </PCard>

              {/* Direct Edit Form */}
              <PCard>
                <PCardHead>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Edit Calibrations
                  </p>
                </PCardHead>
                <PCardBody>
                  <div className="grid gap-5 sm:grid-cols-2">
                    {/* Role */}
                    <div>
                      <Label htmlFor="studio-role-input" className="text-xs font-semibold">
                        Primary Hat / Role
                      </Label>
                      <Input
                        id="studio-role-input"
                        value={studioProfile.role}
                        onChange={(e) => setStudioProfile((p) => ({ ...p, role: e.target.value }))}
                        placeholder="e.g. Founder, Creator, Engineer..."
                        className="mt-1.5 h-9 text-sm"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {[
                          'Student',
                          'Founder',
                          'Creator',
                          'Influencer',
                          'Software engineer',
                          'Company / Brand',
                        ].map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => {
                              const targetConfig =
                                ROLE_BRANCH_CONFIGS[r] || ROLE_BRANCH_CONFIGS['Founder'];
                              setStudioProfile((prev) => {
                                const isStageValid = targetConfig.stageOptions.includes(
                                  prev.businessStage || '',
                                );
                                const nextStage = isStageValid
                                  ? prev.businessStage
                                  : targetConfig.stageOptions[2] || targetConfig.stageOptions[0];
                                const isAudienceValid = targetConfig.audienceOptions.includes(
                                  prev.audience || '',
                                );
                                const nextAudience = isAudienceValid
                                  ? prev.audience
                                  : targetConfig.audienceOptions[0] || 'Followers in my niche';
                                let nextWorkInterests = prev.workInterests || '';
                                if (
                                  prev.role?.toLowerCase().includes('student') &&
                                  !r.toLowerCase().includes('student')
                                ) {
                                  if (
                                    /\b(exam|exams|finals|midterms|homework|study|campus|college|undergrad)\b/i.test(
                                      nextWorkInterests,
                                    )
                                  ) {
                                    nextWorkInterests = '';
                                  }
                                }
                                const domain = (prev.businessDomain || prev.doing || '').trim();
                                const nextDomain =
                                  domain || targetConfig.domainChips[0] || 'Software/AI';
                                return {
                                  ...prev,
                                  role: r,
                                  businessStage: nextStage,
                                  audience: nextAudience,
                                  businessDomain: nextDomain,
                                  doing: nextDomain,
                                  workInterests: nextWorkInterests,
                                };
                              });
                            }}
                            className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer ${
                              studioProfile.role.toLowerCase() === r.toLowerCase()
                                ? 'bg-[#C4A265] text-white border-[#C4A265] font-semibold'
                                : 'bg-background hover:bg-muted text-muted-foreground border-border'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Business Stage */}
                    <div>
                      <Label htmlFor="studio-stage-input" className="text-xs font-semibold">
                        {roleConfig.stageTitle}
                      </Label>
                      <Input
                        id="studio-stage-input"
                        value={studioProfile.businessStage || ''}
                        onChange={(e) =>
                          setStudioProfile((p) => ({ ...p, businessStage: e.target.value }))
                        }
                        placeholder={`e.g. ${roleConfig.stageOptions.slice(0, 3).join(', ')}...`}
                        className="mt-1.5 h-9 text-sm"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {roleConfig.stageOptions.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              setStudioProfile((p) => ({ ...p, businessStage: opt }))
                            }
                            className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer ${
                              studioProfile.businessStage === opt
                                ? 'bg-[#3D2B1F] dark:bg-zinc-100 text-white dark:text-zinc-900 border-[#3D2B1F] font-semibold'
                                : 'bg-background hover:bg-muted text-muted-foreground border-border'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Domain */}
                    <div>
                      <Label htmlFor="studio-domain-input" className="text-xs font-semibold">
                        {roleConfig.domainTitle}
                      </Label>
                      <Input
                        id="studio-domain-input"
                        value={studioProfile.businessDomain || studioProfile.doing}
                        onChange={(e) =>
                          setStudioProfile((p) => ({
                            ...p,
                            businessDomain: e.target.value,
                            doing: e.target.value,
                          }))
                        }
                        placeholder={roleConfig.domainPlaceholder}
                        className="mt-1.5 h-9 text-sm"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {roleConfig.domainChips.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() =>
                              setStudioProfile((p) => ({
                                ...p,
                                businessDomain: chip,
                                doing: chip,
                              }))
                            }
                            className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer ${
                              (studioProfile.businessDomain || studioProfile.doing) === chip
                                ? 'bg-[#3D2B1F] dark:bg-zinc-100 text-white dark:text-zinc-900 border-[#3D2B1F] font-semibold'
                                : 'bg-background hover:bg-muted text-muted-foreground border-border'
                            }`}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Work Themes */}
                    <div>
                      <Label htmlFor="studio-work-interests" className="text-xs font-semibold">
                        {roleConfig.workInterestsLabel}
                      </Label>
                      <Input
                        id="studio-work-interests"
                        value={studioProfile.workInterests || ''}
                        onChange={(e) =>
                          setStudioProfile((p) => ({ ...p, workInterests: e.target.value }))
                        }
                        placeholder={roleConfig.workInterestsPlaceholder}
                        className="mt-1.5 h-9 text-sm"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Optional — work topics and themes you enjoy discussing.
                      </p>
                    </div>

                    {/* Audience */}
                    <div>
                      <Label htmlFor="studio-audience-input" className="text-xs font-semibold">
                        {roleConfig.audienceTitle}
                      </Label>
                      <Input
                        id="studio-audience-input"
                        value={studioProfile.audience}
                        onChange={(e) =>
                          setStudioProfile((p) => ({ ...p, audience: e.target.value }))
                        }
                        placeholder={`e.g. ${roleConfig.audienceOptions.slice(0, 3).join(', ')}...`}
                        className="mt-1.5 h-9 text-sm"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {roleConfig.audienceOptions.map((aud) => (
                          <button
                            key={aud}
                            type="button"
                            onClick={() => setStudioProfile((p) => ({ ...p, audience: aud }))}
                            className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer ${
                              studioProfile.audience === aud
                                ? 'bg-[#3D2B1F] dark:bg-zinc-100 text-white dark:text-zinc-900 border-[#3D2B1F] font-semibold'
                                : 'bg-background hover:bg-muted text-muted-foreground border-border'
                            }`}
                          >
                            {aud}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Voice Tone */}
                    <div>
                      <Label htmlFor="studio-tone-input" className="text-xs font-semibold">
                        Voice Tone Cadence
                      </Label>
                      <Input
                        id="studio-tone-input"
                        value={studioProfile.tone}
                        onChange={(e) => setStudioProfile((p) => ({ ...p, tone: e.target.value }))}
                        placeholder="e.g. Calm expert, Rebel, Storyteller, Witty..."
                        className="mt-1.5 h-9 text-sm"
                      />
                    </div>

                    {/* Style */}
                    <div>
                      <Label htmlFor="studio-style-input" className="text-xs font-semibold">
                        Reading &amp; Content Style
                      </Label>
                      <Input
                        id="studio-style-input"
                        value={studioProfile.style}
                        onChange={(e) => setStudioProfile((p) => ({ ...p, style: e.target.value }))}
                        placeholder="e.g. Short & punchy, Storytelling, Educational..."
                        className="mt-1.5 h-9 text-sm"
                      />
                    </div>

                    {/* Interests */}
                    <div>
                      <Label htmlFor="studio-interests-input" className="text-xs font-semibold">
                        Interests Outside Work{' '}
                        <span className="font-normal text-muted-foreground">(comma-separated)</span>
                      </Label>
                      <Input
                        id="studio-interests-input"
                        value={studioProfile.interests.join(', ')}
                        onChange={(e) => {
                          const items = e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean);
                          setStudioProfile((p) => ({ ...p, interests: items }));
                        }}
                        placeholder="e.g. Books, Gaming, Fitness, Travel..."
                        className="mt-1.5 h-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Changes apply globally across all Studio AI tools.
                    </p>
                    <Button
                      onClick={handleSaveOnboarding}
                      disabled={savingOnboarding}
                      className="bg-[#C4A265] hover:bg-[#b09055] text-white font-semibold cursor-pointer gap-2"
                    >
                      {savingOnboarding ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Save Calibrations
                        </>
                      )}
                    </Button>
                  </div>
                </PCardBody>
              </PCard>

              {showRetakeModal && (
                <StudioOnboardingModal
                  isOpen={showRetakeModal}
                  onClose={() => {
                    setShowRetakeModal(false);
                    loadOnboardingProfile();
                  }}
                  onComplete={(newProfile: StudioProfile) => {
                    if (newProfile) {
                      setStudioProfile(newProfile);
                      setOnboardingCompleted(true);
                    }
                    setShowRetakeModal(false);
                    loadOnboardingProfile();
                  }}
                  forceOpen
                  isRetake
                  initialAnswers={studioProfile}
                  userId={userId}
                />
              )}
            </div>
          )}

          {/* ══════════════ INTEGRATIONS ══════════════ */}
          {activeSection === 'integrations' && (
            <div className="space-y-5">
              <SectionHeading
                icon={Terminal}
                title="Integrations"
                subtitle="Programmatic access via API keys and real-time event delivery via webhooks."
              />

              {/* API Keys */}
              <PCard>
                <PCardHead>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        API Keys
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Keys are hashed and shown only once at creation.
                      </p>
                    </div>
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 h-8 text-xs cursor-pointer"
                        >
                          <Key className="h-3 w-3" />
                          New Key
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Create API Key</DialogTitle>
                          <DialogDescription>
                            Name your key and select its permissions. The full key is shown only once.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div>
                            <Label htmlFor="key-name" className="text-xs font-semibold">
                              Key Name
                            </Label>
                            <Input
                              id="key-name"
                              value={newKeyName}
                              onChange={(e) => setNewKeyName(e.target.value)}
                              placeholder="e.g., Production Server, CI/CD Pipeline"
                              className="mt-1.5 h-9 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold">Scopes (Permissions)</Label>
                            <div className="space-y-1.5 mt-2">
                              {ALL_SCOPES.map((scope) => (
                                <label
                                  key={scope.value}
                                  className="flex items-center gap-3 p-2.5 border rounded-xl hover:bg-accent cursor-pointer transition-colors"
                                >
                                  <Checkbox
                                    checked={newKeyScopes.includes(scope.value)}
                                    onCheckedChange={(checked) =>
                                      setNewKeyScopes(
                                        checked
                                          ? [...newKeyScopes, scope.value]
                                          : newKeyScopes.filter((s) => s !== scope.value),
                                      )
                                    }
                                  />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{scope.label}</p>
                                    <p className="text-xs text-muted-foreground">{scope.description}</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="key-expires" className="text-xs font-semibold">
                              Expires In (Days){' '}
                              <span className="font-normal text-muted-foreground">optional</span>
                            </Label>
                            <Input
                              id="key-expires"
                              type="number"
                              min="1"
                              max="365"
                              value={newKeyExpiresDays}
                              onChange={(e) => setNewKeyExpiresDays(e.target.value)}
                              placeholder="Never expires"
                              className="mt-1.5 h-9 text-sm"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setCreateDialogOpen(false)}
                            disabled={creatingKey}
                            className="cursor-pointer"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreateKey}
                            disabled={creatingKey}
                            className="bg-[#3D2B1F] hover:bg-[#2a1e15] text-white dark:bg-zinc-100 dark:text-zinc-900 cursor-pointer"
                          >
                            {creatingKey ? (
                              <>
                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              'Create Key'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </PCardHead>

                <PCardBody>
                  {/* Plaintext Key reveal dialog */}
                  {showNewKey && (
                    <Dialog open={!!showNewKey} onOpenChange={() => setShowNewKey(null)}>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-5 w-5" />
                            Key Created Successfully
                          </DialogTitle>
                          <DialogDescription>
                            Copy this key now — it cannot be recovered after closing.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="relative">
                            <Input
                              value={newKeyPlaintext}
                              readOnly
                              className="font-mono text-sm pr-12 bg-zinc-50 dark:bg-zinc-800"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 cursor-pointer"
                              onClick={() => handleCopyKey(newKeyPlaintext, showNewKey)}
                            >
                              {copiedKeyId === showNewKey ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 dark:text-amber-200">
                              <strong>Important:</strong> Store this key securely. It cannot be recovered.
                              Prefix:{' '}
                              <code className="font-mono text-[10px]">uk_live_...</code>
                            </p>
                          </div>
                          <Button
                            onClick={() => setShowNewKey(null)}
                            className="w-full bg-[#3D2B1F] hover:bg-[#2a1e15] text-white cursor-pointer"
                          >
                            I&apos;ve Saved This Key
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* API Key list */}
                  {apiKeysLoading ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse"
                        />
                      ))}
                    </div>
                  ) : apiKeys.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="h-10 w-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                        <KeyIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-[#3D2B1F] dark:text-zinc-100">
                        No API keys yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Create your first key to get programmatic access.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {apiKeys.map((key) => (
                        <div
                          key={key.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-[#3D2B1F] dark:text-zinc-100 truncate">
                                {key.name}
                              </p>
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-semibold px-1.5 py-0 ${
                                  key.revoked
                                    ? 'border-red-200 text-red-600 bg-red-50 dark:border-red-800 dark:text-red-400 dark:bg-red-900/20'
                                    : key.expiresAt && new Date(key.expiresAt) < new Date()
                                      ? 'border-amber-200 text-amber-600 bg-amber-50 dark:border-amber-800 dark:text-amber-400'
                                      : 'border-emerald-200 text-emerald-600 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-900/20'
                                }`}
                              >
                                {key.revoked
                                  ? 'Revoked'
                                  : key.expiresAt && new Date(key.expiresAt) < new Date()
                                    ? 'Expired'
                                    : 'Active'}
                              </Badge>
                              <code className="text-[10px] font-mono text-muted-foreground">
                                {key.keyPrefix}
                              </code>
                            </div>
                            <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground mt-1">
                              <span>
                                Created {new Date(key.createdAt).toLocaleDateString()}
                              </span>
                              {key.lastUsedAt && (
                                <span>Last used {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                              )}
                              {key.expiresAt && (
                                <span>Expires {new Date(key.expiresAt).toLocaleDateString()}</span>
                              )}
                              {key.scopes.length > 0 && (
                                <span>
                                  {key.scopes.length} scope{key.scopes.length !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            {!key.revoked && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRevokeKey(key.id)}
                                className="h-7 text-xs cursor-pointer"
                              >
                                <Trash className="mr-1 h-3 w-3" />
                                Revoke
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteKey(key.id)}
                              className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </PCardBody>
              </PCard>

              {/* Webhooks */}
              <PCard>
                <PCardHead>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Webhooks
                  </p>
                </PCardHead>
                <PCardBody>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <Webhook className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#3D2B1F] dark:text-zinc-100">
                        Webhook Configuration
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Receive real-time HTTP POST events when posts publish, fail, or analytics
                        update. Requires a key with the{' '}
                        <code className="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
                          webhooks:manage
                        </code>{' '}
                        scope.
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Full webhook management coming in v1.1.
                      </p>
                    </div>
                  </div>
                </PCardBody>
              </PCard>
            </div>
          )}

          {/* ══════════════ NOTIFICATIONS ══════════════ */}
          {activeSection === 'notifications' && (
            <div className="space-y-5">
              <SectionHeading
                icon={Bell}
                title="Notifications"
                subtitle="Control when and how Unool reaches you via email and in-app alerts."
              />

              <PCard>
                <PCardHead>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Email Notifications
                  </p>
                </PCardHead>
                <PCardBody>
                  <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                    <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Fine-grained notification controls are coming in v1.1. Currently, emails are sent
                      for all critical events.
                    </p>
                  </div>

                  {[
                    {
                      label: 'Post Published',
                      description: 'When your content goes live on any connected platform.',
                      enabled: true,
                    },
                    {
                      label: 'Publish Failed',
                      description: 'When a scheduled or manual publish encounters an error.',
                      enabled: true,
                    },
                    {
                      label: 'Weekly Performance Digest',
                      description: 'A curated summary of your content performance every Monday.',
                      enabled: false,
                    },
                    {
                      label: 'AI Suggestions Ready',
                      description:
                        'When Studio AI has new content ideas based on your strategy.',
                      enabled: false,
                    },
                  ].map(({ label, description, enabled }, idx, arr) => (
                    <SettingRow
                      key={label}
                      label={label}
                      description={description}
                      last={idx === arr.length - 1}
                    >
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          enabled
                            ? 'border-emerald-200 text-emerald-600 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-900/20'
                            : 'border-zinc-200 text-zinc-500 bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:bg-zinc-800'
                        }`}
                      >
                        {enabled ? 'On' : 'Coming soon'}
                      </Badge>
                    </SettingRow>
                  ))}
                </PCardBody>
              </PCard>
            </div>
          )}

          {/* ══════════════ SECURITY ══════════════ */}
          {activeSection === 'security' && (
            <div className="space-y-5">
              <SectionHeading
                icon={Shield}
                title="Security"
                subtitle="Protect your account with multi-factor authentication and session controls."
              />

              <PCard>
                <PCardHead>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Authentication
                  </p>
                </PCardHead>
                <PCardBody>
                  <SettingRow
                    label="Multi-Factor Authentication"
                    description="Require an email verification code at every sign-in for added security."
                    last
                  >
                    <div className="flex items-center gap-2.5">
                      {togglingMfa && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      )}
                      <button
                        role="switch"
                        aria-checked={mfaEnabled}
                        onClick={() => handleToggleMfa(!mfaEnabled)}
                        disabled={togglingMfa}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer focus-visible:outline-none disabled:opacity-50 ${
                          mfaEnabled ? 'bg-[#C4A265]' : 'bg-zinc-200 dark:bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                            mfaEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
                          }`}
                        />
                      </button>
                      <span className="text-xs font-medium text-muted-foreground">
                        {mfaEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </SettingRow>
                </PCardBody>
              </PCard>

              <PCard>
                <PCardHead>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Active Sessions
                  </p>
                </PCardHead>
                <PCardBody>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#3D2B1F] dark:text-zinc-100">
                        Session Management
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Sessions are currently managed by Supabase Auth. Full per-device session
                        management is coming in v1.1.
                      </p>
                    </div>
                  </div>
                </PCardBody>
              </PCard>
            </div>
          )}

          {/* ══════════════ DANGER ZONE ══════════════ */}
          {activeSection === 'danger' && (
            <div className="space-y-5">
              <SectionHeading
                icon={AlertTriangle}
                title="Danger Zone"
                subtitle="These actions are permanent and cannot be reversed. Proceed with caution."
              />

              {/* Sign Out */}
              <div className="rounded-2xl border border-red-100 dark:border-red-900/40 bg-red-50/40 dark:bg-red-900/10 overflow-hidden">
                <div className="px-6 py-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#3D2B1F] dark:text-zinc-100">
                        Sign Out
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        End your current session. You&apos;ll need to sign in again to access your
                        workspace.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleSignOut}
                      className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 gap-2 shrink-0 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>

              {/* Delete Account */}
              <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-900/20 overflow-hidden">
                <div className="px-6 py-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                          Delete Account
                        </p>
                        <Badge
                          variant="outline"
                          className="text-[10px] border-red-300 text-red-600 bg-red-100 dark:border-red-700 dark:text-red-400 dark:bg-red-900/30"
                        >
                          Irreversible
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Permanently delete your account, all workspaces, posts, and data. There is no
                        recovery path.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (
                          confirm(
                            'This will permanently delete your account and all data. Type "DELETE" to confirm.',
                          )
                        ) {
                          alert('Account deletion coming in v1.1');
                        }
                      }}
                      className="gap-2 shrink-0 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* ─── Suspense wrapper (exported default) ─── */

export default function SettingsClientWrapper({ userId, workspaceId }: SettingsClientProps) {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="mb-8">
            <div className="h-8 w-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-64 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
          <div className="flex gap-6">
            <div className="w-52 shrink-0 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="flex-1 space-y-4">
              <div className="h-40 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
              <div className="h-32 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      }
    >
      <SettingsContent userId={userId} workspaceId={workspaceId} />
    </Suspense>
  );
}