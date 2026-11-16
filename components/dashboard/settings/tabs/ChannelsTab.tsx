'use client';

import { useMemo } from 'react';
import { Share2, CheckCircle2, AlertTriangle, Code2, Info } from 'lucide-react';
import { PlatformConnections, type ConnectedAccountItem } from '@/components/dashboard/PlatformConnections';
import { IntegrationsTab } from './IntegrationsTab';
import { SectionHeading, PCard, PCardHead, PCardBody } from './shared';
import type { InitialConnectionSummary } from '../types';

export interface ChannelsTabProps {
  workspaceId: string;
  workspaceName: string;
  userId: string;
  callerRole: 'owner' | 'admin' | 'editor' | 'viewer';
  connectionsSummary: Record<string, InitialConnectionSummary>;
  publicApiEnabled: boolean;
  onConnectionsUpdated: (summary: Record<string, InitialConnectionSummary>) => void;
}

export function ChannelsTab({
  workspaceId,
  workspaceName,
  userId,
  callerRole,
  connectionsSummary,
  publicApiEnabled,
  onConnectionsUpdated,
}: ChannelsTabProps) {
  const isViewer = callerRole === 'viewer';

  const stats = useMemo(() => {
    const values = Object.values(connectionsSummary || {});
    const active = values.filter((v) => v.status === 'connected').length;
    const expired = values.filter((v) => v.status === 'expired' || v.status === 'error').length;
    return { active, expired };
  }, [connectionsSummary]);

  const initialConnectionsProp = useMemo(() => {
    const out: Record<string, { status: string; username?: string; accounts?: ConnectedAccountItem[] }> = {};
    for (const [platform, info] of Object.entries(connectionsSummary || {})) {
      out[platform] = { status: info.status, username: info.username };
    }
    return out;
  }, [connectionsSummary]);

  const handleConnectionChange = (
    next: Record<string, { status: string; username?: string; accounts?: ConnectedAccountItem[] }>
  ) => {
    const summary: Record<string, InitialConnectionSummary> = {};
    for (const [platform, val] of Object.entries(next || {})) {
      summary[platform] = {
        status: val.status,
        username: val.username,
        expiresAt: val.accounts?.[0]?.expiresAt,
      };
    }
    onConnectionsUpdated(summary);
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        icon={Share2}
        title="Connected Channels"
        subtitle={`Connect social accounts, refresh expiring OAuth tokens, and configure Kick RTMP credentials for ${workspaceName}.`}
      />

      {isViewer && (
        <div
          role="status"
          className="rounded-2xl border border-[#C4A265] bg-[#F5EFE2] dark:bg-[#2D2419] px-4 py-3 text-[13px] text-[#5C4315] dark:text-[#EAD7B0] flex items-start gap-2.5"
        >
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-[#A43D1E] dark:text-[#E07A5F]" aria-hidden="true" />
          <p>
            You have <strong className="font-semibold">Viewer</strong> access in this workspace.
            Connecting, configuring, or disconnecting publishing channels requires Editor, Admin, or Owner permissions.
          </p>
        </div>
      )}

      {/* Channel status summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[#E4D9C8] dark:border-[#382F27] bg-white dark:bg-[#1F1A16] px-4 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-[#6E5A48] dark:text-[#B8A896]">Active platforms</p>
            <p className="text-[22px] font-semibold text-[#3D2B1F] dark:text-[#F5EFE6] tabular-nums mt-0.5">
              {stats.active}
            </p>
          </div>
          <span className="h-9 w-9 rounded-xl bg-[#EEF7F1] dark:bg-[#16291E] flex items-center justify-center">
            <CheckCircle2 className="h-4.5 w-4.5 text-[#236B42] dark:text-[#6EE7B7]" aria-hidden="true" />
          </span>
        </div>

        <div className="rounded-2xl border border-[#E4D9C8] dark:border-[#382F27] bg-white dark:bg-[#1F1A16] px-4 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-[#6E5A48] dark:text-[#B8A896]">Attention needed</p>
            <p className="text-[22px] font-semibold text-[#3D2B1F] dark:text-[#F5EFE6] tabular-nums mt-0.5">
              {stats.expired}
            </p>
          </div>
          <span className="h-9 w-9 rounded-xl bg-[#F5EFE2] dark:bg-[#2D2419] flex items-center justify-center">
            <AlertTriangle
              className={`h-4.5 w-4.5 ${
                stats.expired > 0 ? 'text-[#A43D1E] dark:text-[#E07A5F]' : 'text-[#6E5A48] dark:text-[#B8A896]'
              }`}
              aria-hidden="true"
            />
          </span>
        </div>
      </div>

      {/* Unified channel connection grid */}
      <PCard>
        <PCardHead>
          <span>Social & Publishing Adapters</span>
        </PCardHead>
        <PCardBody>
          <PlatformConnections
            workspaceId={workspaceId}
            userId={userId}
            initialConnectionsProp={initialConnectionsProp}
            onConnectionChange={handleConnectionChange}
          />
        </PCardBody>
      </PCard>

      {/* Feature-flag gated Developer API & Webhooks */}
      {publicApiEnabled ? (
        <IntegrationsTab onLoadKeys={async () => {}} />
      ) : (
        <PCard>
          <PCardHead>
            <span className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-[#5C4315] dark:text-[#C4A265]" aria-hidden="true" />
              Developer API & Webhooks
            </span>
          </PCardHead>
          <PCardBody>
            <p className="text-[13px] leading-[20px] text-[#6E5A48] dark:text-[#B8A896]">
              Public API keys and custom outbound webhooks are currently disabled for this workspace environment
              (<code className="font-mono text-[12px] text-[#3D2B1F] dark:text-[#F5EFE6]">public_api_enabled = false</code>).
              Built-in platform publishing, OAuth adapters, and scheduled jobs continue to run automatically without API keys.
            </p>
          </PCardBody>
        </PCard>
      )}
    </div>
  );
}

