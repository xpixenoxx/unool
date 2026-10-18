'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Key, Shield, Bell, Palette, Trash2, User, Lock, LogOut, CheckCircle, AlertCircle, Copy, Trash, Check, Sliders, Settings, AlertTriangle, Link as LinkIcon, Key as KeyIcon, User as UserIcon, CheckCircle2, XCircle } from 'lucide-react';
import { TemplateSelector } from '@/components/profile/TemplateSelector';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { StudioOnboardingModal } from '@/components/dashboard/StudioOnboardingModal';
import { StudioProfile, getRoleConfig } from '@/lib/config/studioOnboarding';

type TabValue = 'account' | 'persona' | 'security' | 'notifications' | 'appearance' | 'danger';

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

const TAB_CONFIG: Record<TabValue, { icon: React.ElementType; label: string; description: string }> = {
  account: { icon: UserIcon, label: 'Account', description: 'Workspace name, plan, and API keys' },
  persona: { icon: Sliders, label: 'Studio Persona', description: 'Your persona, focus, target audience, and tone' },
  security: { icon: Shield, label: 'Security', description: 'Password, 2FA, and active sessions' },
  notifications: { icon: Bell, label: 'Notifications', description: 'Email and in-app notification preferences' },
  appearance: { icon: Palette, label: 'Appearance', description: 'Theme, density, and display preferences' },
  danger: { icon: AlertTriangle, label: 'Danger Zone', description: 'Dangerous actions: sign out, delete account' },
};

interface SettingsClientProps {
  userId: string;
  workspaceId: string;
}

export function SettingsContent({ userId, workspaceId }: SettingsClientProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabValue>('account');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [oauthBanner, setOauthBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

      // Fallback check to legacy /api/profile/onboarding
      const legacyRes = await fetch('/api/profile/onboarding', { credentials: 'include', cache: 'no-store' });
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
          setOnboardingCompleted(Boolean(legacyData.onboarding_completed || legacyData.onboardingCompleted));
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
          setOnboardingCompleted(Boolean(legacyData.onboarding_completed || legacyData.onboardingCompleted));
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
        workInterests: studioProfile.workInterests?.trim() ? studioProfile.workInterests.trim().slice(0, 120) : undefined,
        doing: (domain || 'Software/AI').slice(0, 80),
        audience: (studioProfile.audience.trim() || 'Followers in my niche').slice(0, 80),
        tone: (studioProfile.tone.trim() || 'Conversational & candid').slice(0, 80),
        style: (studioProfile.style.trim() || 'Short punchy lines').slice(0, 80),
        interests: studioProfile.interests.length > 0
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
        toast.success('Studio Profile calibrations saved successfully!');
        setOnboardingCompleted(true);
      } else {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to save settings');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update Studio Profile');
    } finally {
      setSavingOnboarding(false);
    }
  };

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
      const { error } = await supabase.auth.updateUser({
        data: { mfa_enabled: checked }
      });
      if (error) throw error;
      setMfaEnabled(checked);
      toast.success(`MFA has been ${checked ? 'enabled' : 'disabled'} for sign in.`);
    } catch (err: any) {
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
      // Ignore errors
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
      // Ignore errors
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
    if (!newKeyName.trim()) {
      toast.error('Key name is required');
      return;
    }
    if (newKeyScopes.length === 0) {
      toast.error('Select at least one scope');
      return;
    }

    setCreatingKey(true);
    try {
      const expiresAt = newKeyExpiresDays ? new Date(Date.now() + parseInt(newKeyExpiresDays) * 24 * 60 * 60 * 1000).toISOString() : undefined;

      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newKeyName,
          scopes: newKeyScopes,
          expiresAt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create key');
      }

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
      const res = await fetch(`/api/keys/${keyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

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
    if (res.ok) {
      window.location.href = '/signup';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
        <Card>
          <CardContent className="min-h-[300px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account, workspace, and preferences</p>
      </div>

      {/* OAuth Result Banner */}
      {oauthBanner && (
        <Alert variant={oauthBanner.type === 'error' ? 'destructive' : 'default'} className={oauthBanner.type === 'success' ? 'border-green-500 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-900/20 dark:text-green-200' : ''}>
          {oauthBanner.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>{oauthBanner.message}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as TabValue)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
          {Object.entries(TAB_CONFIG).map(([value, config]) => (
            <TabsTrigger key={value} value={value as TabValue} className="flex items-center gap-2">
              <config.icon className="h-4 w-4" />
              {config.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Studio Persona Tab */}
        <TabsContent value="persona" className="mt-6 space-y-6">
          <Card className="border-border shadow-xs">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
              <div>
                <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#C4A265]" />
                  <span>Studio Voice Calibrations & Persona</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  These strategic calibrations anchor Studio&apos;s multi-platform AI adaptations, opening hooks, voice cadence, and content ideas.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={onboardingCompleted ? 'default' : 'secondary'}
                  className={onboardingCompleted ? 'bg-[#C4A265] text-white font-medium hover:bg-[#b09055]' : 'text-xs'}
                >
                  {onboardingCompleted ? 'Voice Calibrated' : 'Pending Calibration'}
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowRetakeModal(false);
                    setTimeout(() => setShowRetakeModal(true), 0);
                  }}
                  className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-[#F5EFE2] dark:hover:bg-zinc-800"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#C4A265]" />
                  <span>Launch Calibrator</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-5">
              {/* Active Voice Signature Summary */}
              <div
                className="p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40"
                style={{
                  background: 'linear-gradient(135deg, rgba(196,162,101,0.05) 0%, rgba(255,255,255,0.01) 100%)',
                }}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-[#C4A265] mb-2.5">
                  Current Voice Signature
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Role</p>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                      {studioProfile.role || 'Not calibrated'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">{roleConfig.stageTitle.replace(/\?$/, '')}</p>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                      {studioProfile.businessStage || 'Growing'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">{roleConfig.domainLabel}</p>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                      {studioProfile.businessDomain || studioProfile.doing || 'Not specified'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">{roleConfig.audienceTitle.replace(/\?$/, '')}</p>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                      {studioProfile.audience || 'Not selected'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Voice Tone</p>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                      {studioProfile.tone || 'Not selected'}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Reading Style</p>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                      {studioProfile.style || 'Not selected'}
                    </p>
                  </div>
                  {Boolean(studioProfile.workInterests) && (
                    <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700 sm:col-span-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">{roleConfig.workInterestsLabel.replace(/\?$/, '')}</p>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                        {studioProfile.workInterests}
                      </p>
                    </div>
                  )}
                </div>

                {studioProfile.interests && studioProfile.interests.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-700 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-medium text-muted-foreground mr-1">Active Interests:</span>
                    {studioProfile.interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Direct Configuration Form */}
              <div className="grid gap-5 sm:grid-cols-2">
                {/* 1. Primary Hat / Role */}
                <div>
                  <Label htmlFor="studio-role-input">Primary Hat / Role</Label>
                  <Input
                    id="studio-role-input"
                    value={studioProfile.role}
                    onChange={(e) => setStudioProfile((prev) => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g. Student, Founder, Creator, Influencer, Software engineer..."
                    className="mt-1"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['Student', 'Founder', 'Creator', 'Influencer', 'Software engineer', 'Company / Brand'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setStudioProfile((prev) => ({ ...prev, role: r }))}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                          studioProfile.role.toLowerCase() === r.toLowerCase()
                            ? 'bg-[#C4A265] text-white border-[#C4A265] font-semibold shadow-xs'
                            : 'bg-background hover:bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Which hat you wear most days. Selecting a role dynamically updates the questions and choices below.
                  </p>
                </div>

                {/* 2. Business Stage */}
                <div>
                  <Label htmlFor="studio-stage-input">{roleConfig.stageTitle}</Label>
                  <Input
                    id="studio-stage-input"
                    value={studioProfile.businessStage || ''}
                    onChange={(e) => setStudioProfile((prev) => ({ ...prev, businessStage: e.target.value }))}
                    placeholder={`e.g. ${roleConfig.stageOptions.slice(0, 3).join(', ')}...`}
                    className="mt-1"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {roleConfig.stageOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setStudioProfile((prev) => ({ ...prev, businessStage: opt }))}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                          studioProfile.businessStage === opt
                            ? 'bg-[#3D2B1F] dark:bg-zinc-100 text-white dark:text-zinc-900 border-[#3D2B1F] dark:border-zinc-100 font-semibold shadow-xs'
                            : 'bg-background hover:bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Select a stage option or type your own above.
                  </p>
                </div>

                {/* 3. Business Domain */}
                <div>
                  <Label htmlFor="studio-domain-input-settings">{roleConfig.domainTitle}</Label>
                  <Input
                    id="studio-domain-input-settings"
                    value={studioProfile.businessDomain || studioProfile.doing}
                    onChange={(e) =>
                      setStudioProfile((prev) => ({
                        ...prev,
                        businessDomain: e.target.value,
                        doing: e.target.value,
                      }))
                    }
                    placeholder={roleConfig.domainPlaceholder}
                    className="mt-1"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {roleConfig.domainChips.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() =>
                          setStudioProfile((prev) => ({
                            ...prev,
                            businessDomain: chip,
                            doing: chip,
                          }))
                        }
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                          (studioProfile.businessDomain || studioProfile.doing) === chip
                            ? 'bg-[#3D2B1F] dark:bg-zinc-100 text-white dark:text-zinc-900 border-[#3D2B1F] dark:border-zinc-100 font-semibold shadow-xs'
                            : 'bg-background hover:bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {roleConfig.domainLabel}. Pick a chip or type your custom domain.
                  </p>
                </div>

                {/* 4. Work Themes / Topics */}
                <div>
                  <Label htmlFor="studio-work-interests-settings">{roleConfig.workInterestsLabel}</Label>
                  <Input
                    id="studio-work-interests-settings"
                    value={studioProfile.workInterests || ''}
                    onChange={(e) => setStudioProfile((prev) => ({ ...prev, workInterests: e.target.value }))}
                    placeholder={roleConfig.workInterestsPlaceholder}
                    className="mt-1"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Optional work topics and themes you love discussing in posts.
                  </p>
                </div>

                {/* 5. Target Audience */}
                <div>
                  <Label htmlFor="studio-audience-input">{roleConfig.audienceTitle}</Label>
                  <Input
                    id="studio-audience-input"
                    value={studioProfile.audience}
                    onChange={(e) => setStudioProfile((prev) => ({ ...prev, audience: e.target.value }))}
                    placeholder={`e.g. ${roleConfig.audienceOptions.slice(0, 3).join(', ')}...`}
                    className="mt-1"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {roleConfig.audienceOptions.map((aud) => (
                      <button
                        key={aud}
                        type="button"
                        onClick={() => setStudioProfile((prev) => ({ ...prev, audience: aud }))}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                          studioProfile.audience === aud
                            ? 'bg-[#3D2B1F] dark:bg-zinc-100 text-white dark:text-zinc-900 border-[#3D2B1F] dark:border-zinc-100 font-semibold shadow-xs'
                            : 'bg-background hover:bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {aud}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Who you are hoping to catch the attention of across publications.
                  </p>
                </div>

                {/* 6. Voice Tone */}
                <div>
                  <Label htmlFor="studio-tone-input">Voice Tone Cadence</Label>
                  <Input
                    id="studio-tone-input"
                    value={studioProfile.tone}
                    onChange={(e) => setStudioProfile((prev) => ({ ...prev, tone: e.target.value }))}
                    placeholder="e.g. Soft & smooth, Rebel, Witty, Calm expert, Storyteller, Straight-talker..."
                    className="mt-1"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    The rhetorical tone and cadence that defines your written voice.
                  </p>
                </div>

                {/* 7. Reading Style */}
                <div>
                  <Label htmlFor="studio-style-input">Reading & Content Style</Label>
                  <Input
                    id="studio-style-input"
                    value={studioProfile.style}
                    onChange={(e) => setStudioProfile((prev) => ({ ...prev, style: e.target.value }))}
                    placeholder="e.g. Short & punchy, Storytelling, Educational, Bold opinions..."
                    className="mt-1"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    How your posts should feel to read (Short & punchy, Storytelling, Educational, etc.).
                  </p>
                </div>

                {/* 6. Interests Outside Work */}
                <div>
                  <Label htmlFor="studio-interests-input">Interests Outside Work (comma-separated)</Label>
                  <Input
                    id="studio-interests-input"
                    value={studioProfile.interests.join(', ')}
                    onChange={(e) => {
                      const items = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                      setStudioProfile((prev) => ({ ...prev, interests: items }));
                    }}
                    placeholder="e.g. Books, Gaming, Fitness, Travel, Movies, Tech..."
                    className="mt-1"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Topics you love outside work that add authentic dimension and fresh angles to your ideas.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t">
                <Button
                  onClick={handleSaveOnboarding}
                  disabled={savingOnboarding}
                  className="bg-[#C4A265] hover:bg-[#b09055] text-white font-semibold cursor-pointer shadow-sm"
                >
                  {savingOnboarding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Calibrations...
                    </>
                  ) : (
                    'Save Persona Settings'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Modal if user clicks Retake Flow */}
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
              forceOpen={true}
              isRetake={true}
              initialAnswers={studioProfile}
              userId={userId}
            />
          )}
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Workspace Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="workspace-name">Workspace Name</Label>
                  <Input
                    id="workspace-name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="My Workspace"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="plan-tier">Plan</Label>
                  <Input
                    id="plan-tier"
                    value={workspace?.plan || 'free'}
                    disabled
                    className="mt-1 bg-muted"
                  />
                </div>
              </div>
              <Button onClick={handleSaveWorkspace} disabled={saving} size="lg">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Workspace Name'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyIcon className="h-5 w-5" />
                API Keys
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Manage your API keys for programmatic access to Unool. Keys are encrypted and shown only once.
              </p>

              {/* Create Key Dialog */}
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <KeyIcon className="h-4 w-4" />
                    Create New Key
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create API Key</DialogTitle>
                    <DialogDescription>
                      Give your key a name and select the permissions it needs. The full key will only be shown once.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div>
                      <Label htmlFor="key-name">Key Name</Label>
                      <Input
                        id="key-name"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g., Production Server, CI/CD Pipeline"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Scopes (Permissions)</Label>
                      <div className="space-y-2 mt-1">
                        {ALL_SCOPES.map((scope) => (
                          <label key={scope.value} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                            <Checkbox
                              checked={newKeyScopes.includes(scope.value)}
                              onCheckedChange={(checked) =>
                                setNewKeyScopes(checked
                                  ? [...newKeyScopes, scope.value]
                                  : newKeyScopes.filter((s) => s !== scope.value))
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
                      <Label htmlFor="key-expires">Expires In (Days, Optional)</Label>
                      <Input
                        id="key-expires"
                        type="number"
                        min="1"
                        max="365"
                        value={newKeyExpiresDays}
                        onChange={(e) => setNewKeyExpiresDays(e.target.value)}
                        placeholder="Never expires"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={creatingKey}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateKey} disabled={creatingKey}>
                      {creatingKey ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Key'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Plaintext Key Dialog */}
              {showNewKey && (
                <Dialog open={!!showNewKey} onOpenChange={() => setShowNewKey(null)}>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                        Key Created Successfully
                      </DialogTitle>
                      <DialogDescription>
                        Copy this key now. You won&apos;t be able to see it again.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <div className="relative">
                        <Input
                          value={newKeyPlaintext}
                          readOnly
                          className="font-mono text-sm pr-12"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => handleCopyKey(newKeyPlaintext, showNewKey)}
                        >
                          {copiedKeyId === showNewKey ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <Alert variant="default" className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          <strong>Important:</strong> Save this key securely. It cannot be recovered.
                          <span className="block mt-1">Prefix: <code className="font-mono text-xs">uk_live_...</code></span>
                        </AlertDescription>
                      </Alert>
                      <Button onClick={() => setShowNewKey(null)} className="w-full" size="lg">
                        I&apos;ve Saved This Key
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* API Keys List */}
              {apiKeysLoading ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading API keys...</p>
                </div>
              ) : apiKeys.length === 0 ? (
                <Alert variant="default" className="border-dashed">
                  <KeyIcon className="h-4 w-4 text-muted-foreground" />
                  <AlertDescription className="text-muted-foreground">No API keys yet. Create one to get started.</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {apiKeys.map((key) => (
                    <Card key={key.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium truncate">{key.name}</p>
                          <Badge variant={key.revoked ? 'destructive' : key.expiresAt && new Date(key.expiresAt) < new Date() ? 'warning' : 'default'} className="sm">
                            {key.revoked ? 'Revoked' : key.expiresAt && new Date(key.expiresAt) < new Date() ? 'Expired' : 'Active'}
                          </Badge>
                          <span className="text-sm text-muted-foreground font-mono">{key.keyPrefix}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                          <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                          {key.lastUsedAt && <span>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>}
                          {key.expiresAt && <span>Expires: {new Date(key.expiresAt).toLocaleDateString()}</span>}
                          {key.scopes.length > 0 && (
                            <Badge variant="ghost" className="sm">
                              {key.scopes.length} scope{key.scopes.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {!key.revoked && (
                          <Button variant="outline" size="sm" onClick={() => handleRevokeKey(key.id)}>
                            <Trash className="mr-1 h-3 w-3" />
                            Revoke
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteKey(key.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Password & Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">Multi-Factor Authentication (OTP)</p>
                    <p className="text-sm text-muted-foreground mt-1 text-balance">
                      Require an email verification code when signing in. Applies only to sign-in.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <Checkbox
                      id="mfa-toggle"
                      checked={mfaEnabled}
                      onCheckedChange={(checked) => handleToggleMfa(checked as boolean)}
                      disabled={togglingMfa}
                    />
                    <Label htmlFor="mfa-toggle" className="cursor-pointer">
                      {mfaEnabled ? 'Enabled' : 'Disabled'}
                    </Label>
                    {togglingMfa && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyIcon className="h-5 w-5" />
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="default" className="border-dashed">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-muted-foreground">Session management coming soon. Currently, sessions are managed by Supabase Auth.</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="default" className="border-dashed">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-muted-foreground">Notification preferences coming in v1.1. Currently all emails are sent for important events.</AlertDescription>
              </Alert>
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Post Published</p>
                    <p className="text-sm text-muted-foreground">When your post goes live on any platform</p>
                  </div>
                  <Button variant="ghost" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Publish Failed</p>
                    <p className="text-sm text-muted-foreground">When a post fails to publish</p>
                  </div>
                  <Button variant="ghost" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Weekly Digest</p>
                    <p className="text-sm text-muted-foreground">Summary of your week&apos;s performance</p>
                  </div>
                  <Button variant="ghost" size="sm">Configure</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Webhooks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Configure webhooks to receive real-time events. Requires <code className="font-mono">webhooks:manage</code> API scope.</p>
              <Button variant="outline" asChild>
                <a href="/dashboard/settings?tab=account#api-keys">Manage API Keys</a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Profile Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Choose a template that matches your vibe. Changes apply instantly to your public profile.
              </p>
              <TemplateSelector
                profileData={{
                  id: 'preview',
                  subdomain: workspace?.name?.toLowerCase().replace(/\s+/g, '-') || 'preview',
                  name: workspace?.name || 'Preview User',
                  headline: 'Builder & Creator',
                  bio: 'This is a live preview of how your profile will look with this template.',
                  avatarUrl: '',
                  links: [
                    { id: '1', label: 'Twitter', url: 'https://twitter.com', icon: 'twitter', clicks: 1234, order: 0, isVisible: true },
                    { id: '2', label: 'GitHub', url: 'https://github.com', icon: 'github', clicks: 567, order: 1, isVisible: true },
                    { id: '3', label: 'LinkedIn', url: 'https://linkedin.com', icon: 'linkedin', clicks: 890, order: 2, isVisible: true },
                  ],
                  proofs: [
                    { id: '1', title: 'Followers', value: '12.3K' },
                    { id: '2', title: 'Posts', value: '247' },
                    { id: '3', title: 'Engagement', value: '4.2%' },
                  ],
                  theme: { template: 'essential-standard', preset: '', accentColor: '', customCss: null },
                  socialHandles: {},
                  seo: { title: '', description: '', image: null },
                }}
                onSelect={(templateId) => {
                  // In a real app, this would save to the workspace
                  toast.success(`Template selected! Apply to save.`);
                  console.log('Template selected:', templateId);
                }}
                inline
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {(['light', 'dark', 'system'] as const).map((theme) => (
                  <Button
                    key={theme}
                    variant="outline"
                    className="flex flex-col items-center gap-2 p-6 h-full"
                  >
                    <div className={`w-12 h-12 rounded-lg border-2 ${theme === 'light' ? 'bg-white border-gray-300' : theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-gradient-to-r from-white to-gray-900 border-gray-300'}`} />
                    <p className="font-medium capitalize">{theme}</p>
                    <p className="text-xs text-muted-foreground">
                      {theme === 'light' ? 'Always light' : theme === 'dark' ? 'Always dark' : 'Match system'}
                    </p>
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">Theme selector uses your system preference by default. Full theme customization coming in v1.1.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Density & Display
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="default" className="border-dashed">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-muted-foreground">Density and display options coming in v1.1.</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone Tab */}
        <TabsContent value="danger" className="mt-6 space-y-6">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="font-medium">Sign Out</p>
                    <p className="text-sm text-muted-foreground">Sign out of all sessions on this device</p>
                  </div>
                  <Button variant="outline" onClick={handleSignOut} className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>

              <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and all data. This action cannot be undone.</p>
                  </div>
                  <Button variant="destructive" onClick={() => { if (confirm('This will permanently delete your account and all data. Type "DELETE" to confirm.')) { alert('Account deletion coming in v1.1'); } }} className="bg-destructive hover:bg-destructive/90">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsClientWrapper({ userId, workspaceId }: SettingsClientProps) {
  return (
    <Suspense fallback={
      <div className="space-y-8 max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
        <Card>
          <CardContent className="min-h-[300px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    }>
      <SettingsContent userId={userId} workspaceId={workspaceId} />
    </Suspense>
  );
}