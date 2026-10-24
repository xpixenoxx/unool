'use client';

import { useEffect, useState } from 'react';
import { ReferralDashboard } from '@/components/referrals/ReferralDashboard';
import '@/components/referrals/ReferralDashboard.css';

let cachedReferralWorkspaceId: string | null = null;

export function ReferralsPage() {
  const [workspaceId, setWorkspaceId] = useState<string | null>(() => cachedReferralWorkspaceId);
  const [loading, setLoading] = useState(() => !cachedReferralWorkspaceId);

  useEffect(() => {
    fetch('/api/workspace')
      .then((r) => r.json())
      .then((data: { workspace?: { id: string } }) => {
        const id = data.workspace?.id ?? null;
        cachedReferralWorkspaceId = id;
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
            <div className="h-7 w-44 rounded-xl bg-[#EDE7DD] animate-pulse" />
            <div className="h-4 w-64 rounded-lg bg-[#EDE7DD]/60 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-5 rounded-2xl bg-white border border-[#E8E0D4] space-y-2 shadow-2xs">
              <div className="h-4 w-20 rounded bg-[#EDE7DD] animate-pulse" />
              <div className="h-7 w-16 rounded bg-[#EDE7DD] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!workspaceId) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#8B7355' }}>No workspace found.</div>;
  }

  return <ReferralDashboard workspaceId={workspaceId} />;
}
