'use client';

import { useEffect, useState } from 'react';
import { FollowGateManager } from '@/components/follow-gate/FollowGateManager';
import '@/components/follow-gate/FollowGateManager.css';

let cachedWorkspaceId: string | null = null;

export function FollowGateManagerPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(() => cachedWorkspaceId);
  const [loading, setLoading] = useState(() => !cachedWorkspaceId);

  useEffect(() => {
    fetch('/api/workspace')
      .then((r) => r.json())
      .then((data: { workspace?: { id: string } }) => {
        const id = data.workspace?.id ?? null;
        cachedWorkspaceId = id;
        setWorkspaceId(id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E0D4]">
          <div className="space-y-2">
            <div className="h-7 w-48 rounded-xl bg-[#EDE7DD] animate-pulse" />
            <div className="h-4 w-72 rounded-lg bg-[#EDE7DD]/60 animate-pulse" />
          </div>
        </div>
        <div className="p-8 rounded-2xl bg-white border border-[#E8E0D4] space-y-4">
          <div className="h-6 w-36 rounded bg-[#EDE7DD] animate-pulse" />
          <div className="h-10 w-full rounded-xl bg-[#FAF7F2] animate-pulse" />
          <div className="h-10 w-full rounded-xl bg-[#FAF7F2] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!workspaceId) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#8B7355' }}>
        No workspace found. Please complete onboarding.
      </div>
    );
  }

  return <FollowGateManager workspaceId={workspaceId} />;
}
