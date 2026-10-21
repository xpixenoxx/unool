'use client';

import { useState } from 'react';
import { Building2, Zap, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { SectionHeading, SettingRow, PCard, PCardHead, PCardBody } from './shared';

interface WorkspaceTabProps {
  workspaceId: string;
  initialWorkspace: { id: string; name: string; plan: string } | null;
  onWorkspaceUpdate: (name: string) => Promise<void>;
}

export function WorkspaceTab({ workspaceId, initialWorkspace, onWorkspaceUpdate }: WorkspaceTabProps) {
  const [workspaceName, setWorkspaceName] = useState(initialWorkspace?.name || '');
  const [saving, setSaving] = useState(false);
  const [copiedWorkspaceId, setCopiedWorkspaceId] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onWorkspaceUpdate(workspaceName);
      toast.success('Workspace name updated');
    } catch {
      toast.error('Failed to update workspace');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(workspaceId);
    setCopiedWorkspaceId(true);
    setTimeout(() => setCopiedWorkspaceId(false), 2000);
    toast.success('Workspace ID copied');
  };

  return (
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
                onClick={handleSave}
                disabled={saving || workspaceName === initialWorkspace?.name}
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
                {initialWorkspace?.id || workspaceId}
              </code>
              <button
                onClick={handleCopyId}
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
                initialWorkspace?.plan === 'pro' || initialWorkspace?.plan === 'premium'
                  ? 'bg-[#C4A265]/15 text-[#8B6914] border-[#C4A265]/30 dark:bg-[#C4A265]/10 dark:text-[#C4A265]'
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
              variant="outline"
            >
              {initialWorkspace?.plan || 'Free'}
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
  );
}