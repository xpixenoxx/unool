'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Gift, Copy, Check, Users, TrendingUp, Star, ExternalLink, ChevronRight, RefreshCw
} from 'lucide-react';
import type { ReferralCode, Referral } from '@/lib/referrals/service';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

// ── Types for API response ─────────────────────────────────────────────────────

interface ReferralStats {
  code: ReferralCode | null;
  referrals: Referral[];
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ReferralDashboard({ workspaceId }: { workspaceId: string }) {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchStats = useCallback(async (isManualRefresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (isManualRefresh) setRefreshing(true);

    try {
      const res = await fetch(`/api/referrals?workspaceId=${workspaceId}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json() as ReferralStats;
        setStats(data);
      }
    } catch {
      // ignore
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  }, [workspaceId]);

  // Initial load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Periodic polling every 8 seconds when tab is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchStats();
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [fetchStats]);

  // Window focus and visibility change revalidation
  useEffect(() => {
    const handleRevalidate = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        fetchStats();
      }
    };

    window.addEventListener('focus', handleRevalidate);
    document.addEventListener('visibilitychange', handleRevalidate);

    return () => {
      window.removeEventListener('focus', handleRevalidate);
      document.removeEventListener('visibilitychange', handleRevalidate);
    };
  }, [fetchStats]);

  // Supabase Realtime subscription for instant updates on new signups or conversions
  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof getSupabaseBrowserClient>['channel']> | null = null;
    try {
      const supabase = getSupabaseBrowserClient();
      channel = supabase
        .channel(`referrals-sync-${workspaceId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'referral_codes' },
          () => {
            fetchStats();
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'referrals' },
          () => {
            fetchStats();
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('[ReferralDashboard] Realtime subscription error:', err);
    }

    return () => {
      if (channel) {
        try {
          const supabase = getSupabaseBrowserClient();
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, [workspaceId, fetchStats]);

  const referralUrl = stats?.code
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${stats.code.code}`
    : '';

  const handleCopy = async () => {
    if (!referralUrl) return;
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (typeof navigator.share !== 'undefined' && referralUrl) {
      navigator.share({
        title: 'Join me on Unool',
        text: 'Build your creator brand with Unool — the all-in-one creator platform.',
        url: referralUrl,
      });
    }
  };

  if (loading) return <ReferralSkeleton />;

  return (
    <div className="ref-root">
      {/* Header */}
      <div className="ref-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div className="ref-header-icon"><Gift className="h-5 w-5" /></div>
          <div>
            <h1 className="ref-title">Referrals</h1>
            <p className="ref-subtitle">Invite creators, earn AI credits and free months.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="ref-btn ref-btn--share"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.8125rem',
            padding: '0.45rem 0.85rem',
            cursor: refreshing ? 'not-allowed' : 'pointer',
          }}
          title="Check for new referral points"
          aria-label="Refresh referral stats"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'ref-spinning' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* How it works */}
      <div className="ref-how-card">
        <h2 className="ref-how-title">How it works</h2>
        <div className="ref-how-steps">
          <div className="ref-how-step">
            <span className="ref-step-num">1</span>
            <div>
              <strong>Share your link</strong>
              <p>Send your unique link to creator friends</p>
            </div>
          </div>
          <ChevronRight className="ref-step-arrow h-4 w-4" />
          <div className="ref-how-step">
            <span className="ref-step-num">2</span>
            <div>
              <strong>They sign up</strong>
              <p>You earn <strong>200 AI credits</strong> per signup</p>
            </div>
          </div>
          <ChevronRight className="ref-step-arrow h-4 w-4" />
          <div className="ref-how-step">
            <span className="ref-step-num">3</span>
            <div>
              <strong>They upgrade</strong>
              <p>You earn <strong>1 free month</strong> per paid conversion</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral link */}
      <div className="ref-link-card">
        <p className="ref-link-label">Your referral link</p>
        <div className="ref-link-row">
          <input
            className="ref-link-input"
            value={referralUrl}
            readOnly
            id="referral-link-input"
            aria-label="Your referral link"
          />
          <button
            className="ref-btn ref-btn--copy"
            onClick={handleCopy}
            id="copy-referral-btn"
            aria-label="Copy referral link"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button className="ref-btn ref-btn--share" onClick={handleShare} id="share-referral-btn">
              <ExternalLink className="h-4 w-4" /> Share
            </button>
          )}
        </div>
        {stats?.code && (
          <p className="ref-link-code">
            Your code: <code>{stats.code.code}</code>
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="ref-stats-grid">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Signups"
          value={stats?.code?.signupCount ?? 0}
          sub="people joined via your link"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Conversions"
          value={stats?.code?.conversionCount ?? 0}
          sub="upgraded to paid"
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="AI Credits Earned"
          value={stats?.code?.rewardsEarned ?? 0}
          sub="from referral rewards"
        />
        <StatCard
          icon={<Gift className="h-5 w-5" />}
          label="Free Months Earned"
          value={stats?.code?.monthsEarned ?? 0}
          sub="from paid conversions"
        />
      </div>

      {/* Referral list */}
      {stats && stats.referrals.length > 0 && (
        <div className="ref-list-card">
          <h2 className="ref-list-title">Your referrals</h2>
          <div className="ref-list">
            {stats.referrals.map((ref) => (
              <div key={ref.id} className="ref-list-item">
                <div className="ref-list-dot" data-status={ref.status} />
                <div className="ref-list-info">
                  <span className="ref-list-id">User #{ref.referredUserId.slice(0, 8)}</span>
                  <span className="ref-list-date">{new Date(ref.createdAt).toLocaleDateString()}</span>
                </div>
                <span className={`ref-status-badge ref-status-badge--${ref.status}`}>
                  {ref.status === 'signed_up' ? 'Signed up' : ref.status === 'converted' ? 'Upgraded' : 'Rewarded ✓'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <div className="ref-stat-card">
      <div className="ref-stat-icon">{icon}</div>
      <div className="ref-stat-num">{value.toLocaleString()}</div>
      <div className="ref-stat-label">{label}</div>
      <div className="ref-stat-sub">{sub}</div>
    </div>
  );
}

function ReferralSkeleton() {
  return (
    <div className="ref-root">
      <div className="ref-skeleton-block" style={{ height: '4rem' }} />
      <div className="ref-skeleton-block" style={{ height: '8rem' }} />
      <div className="ref-skeleton-block" style={{ height: '5rem' }} />
    </div>
  );
}
