'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Gift, Copy, Check, Users, TrendingUp, Star, ExternalLink, ChevronRight
} from 'lucide-react';
import type { ReferralCode, Referral } from '@/lib/referrals/service';

// ── Types for API response ─────────────────────────────────────────────────────

interface ReferralStats {
  code: ReferralCode | null;
  referrals: Referral[];
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ReferralDashboard({ workspaceId }: { workspaceId: string }) {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/referrals?workspaceId=${workspaceId}`);
      const data = await res.json() as ReferralStats;
      setStats(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

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
      <div className="ref-header">
        <div className="ref-header-icon"><Gift className="h-5 w-5" /></div>
        <div>
          <h1 className="ref-title">Referrals</h1>
          <p className="ref-subtitle">Invite creators, earn AI credits and free months.</p>
        </div>
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
