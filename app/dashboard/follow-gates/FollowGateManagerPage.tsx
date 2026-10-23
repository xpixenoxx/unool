'use client';

import { useEffect, useState } from 'react';
import { FollowGateManager } from '@/components/follow-gate/FollowGateManager';
import '@/components/follow-gate/FollowGateManager.css';

export function FollowGateManagerPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/workspace')
      .then((r) => r.json())
      .then((data: { workspace?: { id: string } }) => {
        setWorkspaceId(data.workspace?.id ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#8B7355' }}>
        Loading…
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
