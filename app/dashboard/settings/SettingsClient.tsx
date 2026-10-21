'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, Sparkles, Terminal, Bell, Shield, AlertTriangle, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { StudioProfile } from '@/lib/config/studioOnboarding';
import {
  WorkspaceTab,
  StudioTab,
  IntegrationsTab,
  NotificationsTab,
  SecurityTab,
  DangerZoneTab,
  TemplatesTab,
  LoadingSkeleton,
} from '@/components/dashboard/settings/tabs';

type SectionId = 'workspace' | 'studio' | 'integrations' | 'notifications' | 'security' | 'danger' | 'templates';

interface Workspace {
  id: string;
  name: string;
  plan: string;
}

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
  { id: 'templates', icon: Palette, label: 'Templates', description: 'Profile design & themes' },
  { id: 'notifications', icon: Bell, label: 'Notifications', description: 'Email & event alerts' },
  { id: 'security', icon: Shield, label: 'Security', description: 'MFA & active sessions' },
  { id: 'danger', icon: AlertTriangle, label: 'Danger Zone', description: 'Irreversible actions', danger: true },
];

interface SettingsClientProps {
  userId: string;
  workspaceId: string;
}

/* ─── Main component ─── */

export function SettingsContent({ userId, workspaceId }: SettingsClientProps) {
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<SectionId>('workspace');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [oauthBanner, setOauthBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [togglingMfa, setTogglingMfa] = useState(false);

  // Template state
  const [currentTemplate, setCurrentTemplate] = useState<string>('lone');
  const [templateLoading, setTemplateLoading] = useState(false);

  const loadWorkspace = async () => {
    try {
      const res = await fetch('/api/workspace', { credentials: 'include' });
      const data = await res.json();
      if (data.workspace) {
        setWorkspace(data.workspace);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

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

  const handleSaveWorkspace = async (name: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/workspace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        toast.success('Workspace name updated');
        if (workspace) setWorkspace({ ...workspace, name });
      } else {
        toast.error('Failed to update workspace');
      }
    } catch {
      toast.error('Failed to update workspace');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    const res = await fetch('/api/auth/signout', { method: 'POST' });
    if (res.ok) window.location.href = '/signup';
  };

  const loadTemplate = async () => {
    try {
      const res = await fetch('/api/profile', { credentials: 'include' });
      const data = await res.json();
      if (data.profile?.theme?.template) {
        setCurrentTemplate(data.profile.theme.template);
      }
    } catch {
      // ignore
    }
  };

  const handleSaveTemplate = async (templateId: string) => {
    setTemplateLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ theme: { template: templateId } }),
      });
      if (res.ok) {
        setCurrentTemplate(templateId);
        toast.success('Template updated successfully');
      } else {
        toast.error('Failed to update template');
      }
    } catch {
      toast.error('Failed to update template');
    } finally {
      setTemplateLoading(false);
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
    loadUserSecurity();
    loadTemplate();
  }, []);

  /* ── loading skeleton ── */
  if (loading) {
    return <LoadingSkeleton />;
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
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
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
          {activeSection === 'workspace' && (
            <WorkspaceTab
              workspaceId={workspaceId}
              initialWorkspace={workspace}
              onWorkspaceUpdate={handleSaveWorkspace}
            />
          )}

          {activeSection === 'studio' && (
            <StudioTab
              userId={userId}
              onProfileUpdate={async (profile: StudioProfile) => {
                const domain = (profile.businessDomain || profile.doing || '').trim();
                const payload: StudioProfile = {
                  role: (profile.role.trim() || 'Creator').slice(0, 80),
                  businessStage: (profile.businessStage?.trim() || 'Growing').slice(0, 80),
                  businessDomain: (domain || 'Software/AI').slice(0, 80),
                  workInterests: profile.workInterests?.trim()
                    ? profile.workInterests.trim().slice(0, 120)
                    : undefined,
                  doing: (domain || 'Software/AI').slice(0, 80),
                  audience: (profile.audience.trim() || 'Followers in my niche').slice(0, 80),
                  tone: (profile.tone.trim() || 'Conversational & candid').slice(0, 80),
                  style: (profile.style.trim() || 'Short punchy lines').slice(0, 80),
                  interests:
                    profile.interests.length > 0
                      ? profile.interests.map((i) => i.trim().slice(0, 80)).filter(Boolean)
                      : ['General topics'],
                  completedAt: new Date().toISOString(),
                };

                const res = await fetch('/api/studio/profile', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify(payload),
                });

                if (!res.ok) {
                  const errData = await res.json().catch(() => null);
                  throw new Error(errData?.error || 'Failed to save settings');
                }
              }}
            />
          )}

          {activeSection === 'integrations' && (
            <IntegrationsTab
              onLoadKeys={async () => {
                // The IntegrationsTab handles its own loading
              }}
            />
          )}

          {activeSection === 'templates' && (
            <TemplatesTab
              userId={userId}
              workspaceId={workspaceId}
              currentTemplate={currentTemplate}
              onTemplateChange={handleSaveTemplate}
              profileData={{
                name: workspace?.name || 'Preview User',
                headline: 'Preview your template',
                bio: 'This is a live preview of how your profile will look.',
                subdomain: workspace?.id || 'preview',
                avatarUrl: '',
                links: [
                  { id: '1', label: 'Twitter', url: 'https://twitter.com', icon: 'twitter', clicks: 0, order: 0, isVisible: true },
                  { id: '2', label: 'GitHub', url: 'https://github.com', icon: 'github', clicks: 0, order: 1, isVisible: true },
                  { id: '3', label: 'LinkedIn', url: 'https://linkedin.com', icon: 'linkedin', clicks: 0, order: 2, isVisible: true },
                ],
                proofs: [],
              }}
            />
          )}

          {activeSection === 'notifications' && <NotificationsTab />}

          {activeSection === 'security' && <SecurityTab />}

          {activeSection === 'danger' && <DangerZoneTab onSignOut={handleSignOut} />}
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
        <LoadingSkeleton />
      }
    >
      <SettingsContent userId={userId} workspaceId={workspaceId} />
    </Suspense>
  );
}