'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  Inbox,
  Link2,
  Loader2,
  Lock,
  Mail,
  MousePointerClick,
  RefreshCw,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import type { BuilderProfileState, ProfileVisibilityMode } from './types';

interface DomainPrivacyAnalyticsTabProps {
  profile: BuilderProfileState;
  claimedSubdomain: string;
  onChange: (updater: (prev: BuilderProfileState) => BuilderProfileState) => void;
  onSubdomainUpdated: (nextSubdomain: string, nextVersion?: number) => void;
  onRefreshProfile: () => Promise<void>;
}

interface CustomDomainStatus {
  allowed: boolean;
  customDomain: string | null;
  verified: boolean;
  verifiedAt: string | null;
  txtRecordName: string | null;
  txtRecordValue: string | null;
  cnameTarget: string;
}

interface PrivateViewer {
  id: string;
  profileId: string;
  viewerUserId: string;
  createdAt: string;
  email?: string;
  fullName?: string;
}

interface ContactLead {
  id: string;
  sender_name: string;
  sender_email: string;
  message: string;
  created_at: string;
}

interface ProfileAnalyticsResponse {
  period: string;
  profile: {
    id: string;
    name: string;
    subdomain: string;
    currentTemplate: string;
    currentTemplateName: string;
  } | null;
  summary: {
    totalViews: number;
    uniqueVisitors: number;
    linkClicks: number;
    ctaClicks: number;
    ctr: number;
    avgSessionDuration: number;
  };
  topLinks: Array<{ label: string; url: string; clicks: number }>;
  topReferrers: Array<{ source: string; visits: number; percentage: number }>;
  viewsOverTime: Array<{ date: string; views: number; clicks: number }>;
  templateUsage: Array<{
    templateId: string;
    templateName: string;
    views: number;
    clicks: number;
    ctr: number;
  }>;
}

const VISIBILITY_OPTIONS: Array<{
  value: ProfileVisibilityMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: 'public',
    label: 'Public (Indexed)',
    description: 'Visible to everyone and discoverable by search engines.',
    icon: Globe,
  },
  {
    value: 'unlisted',
    label: 'Unlisted (Direct link only)',
    description: 'Accessible via your link, hidden from search engines (noindex).',
    icon: Eye,
  },
  {
    value: 'private',
    label: 'Private (Invite-only)',
    description: 'Requires an invited Unool account to view. Blocked from search & public preview.',
    icon: Lock,
  },
];

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function DomainPrivacyAnalyticsTab({
  profile,
  claimedSubdomain,
  onChange,
  onSubdomainUpdated,
  onRefreshProfile,
}: DomainPrivacyAnalyticsTabProps) {
  // Subdomain state
  const [subdomainInput, setSubdomainInput] = useState(claimedSubdomain || profile.subdomain || '');
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [claimingSubdomain, setClaimingSubdomain] = useState(false);
  const [releasingSubdomain, setReleasingSubdomain] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [subdomainCheckResult, setSubdomainCheckResult] = useState<{
    checkedValue: string;
    available: boolean;
    error?: string;
  } | null>(null);

  // Custom domain state
  const [domainStatus, setDomainStatus] = useState<CustomDomainStatus | null>(null);
  const [domainLoading, setDomainLoading] = useState(true);
  const [domainInput, setDomainInput] = useState('');
  const [savingDomain, setSavingDomain] = useState(false);
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [removingDomain, setRemovingDomain] = useState(false);
  const [domainFeedback, setDomainFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);

  // Private viewers state
  const [viewers, setViewers] = useState<PrivateViewer[]>([]);
  const [viewersLoading, setViewersLoading] = useState(false);
  const [viewerEmailInput, setViewerEmailInput] = useState('');
  const [addingViewer, setAddingViewer] = useState(false);
  const [removingViewerId, setRemovingViewerId] = useState<string | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);

  // Analytics state
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [analyticsData, setAnalyticsData] = useState<ProfileAnalyticsResponse | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Contact leads inbox state
  const [leads, setLeads] = useState<ContactLead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);

  useEffect(() => {
    setSubdomainInput(claimedSubdomain || '');
  }, [claimedSubdomain]);

  const loadDomainStatus = useCallback(async () => {
    setDomainLoading(true);
    try {
      const res = await fetch('/api/profile/domain', { credentials: 'include' });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        setDomainStatus(data as CustomDomainStatus);
        if (typeof data.customDomain === 'string' && data.customDomain) {
          setDomainInput(data.customDomain);
        }
      }
    } catch {
      // ignore transient network errors
    } finally {
      setDomainLoading(false);
    }
  }, []);

  const loadViewers = useCallback(async () => {
    if (!profile.id) {
      setViewers([]);
      return;
    }
    setViewersLoading(true);
    try {
      const res = await fetch('/api/profile/viewers', { credentials: 'include' });
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data?.viewers)) {
        setViewers(data.viewers);
      }
    } catch {
      // ignore
    } finally {
      setViewersLoading(false);
    }
  }, [profile.id]);

  const loadAnalytics = useCallback(async (periodDays: 7 | 30 | 90) => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`/api/profile/analytics?days=${periodDays}`, { credentials: 'include' });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.summary) {
        setAnalyticsData(data as ProfileAnalyticsResponse);
      }
    } catch {
      // ignore
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const loadLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const res = await fetch('/api/profile/contact', { credentials: 'include' });
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data?.leads)) {
        setLeads(data.leads);
      }
    } catch {
      // ignore
    } finally {
      setLeadsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDomainStatus();
    void loadLeads();
  }, [loadDomainStatus, loadLeads]);

  useEffect(() => {
    void loadAnalytics(days);
  }, [days, loadAnalytics]);

  useEffect(() => {
    if (profile.visibility === 'private' || viewers.length > 0) {
      void loadViewers();
    }
  }, [profile.visibility, loadViewers, viewers.length]);

  const handleCheckSubdomain = async () => {
    const clean = subdomainInput.trim().toLowerCase();
    if (!clean) return;
    setCheckingSubdomain(true);
    setSubdomainCheckResult(null);
    try {
      const res = await fetch(`/api/subdomains/check?subdomain=${encodeURIComponent(clean)}`, {
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      const isOwnedBySelf = clean === claimedSubdomain;
      setSubdomainCheckResult({
        checkedValue: clean,
        available: isOwnedBySelf ? true : Boolean(data.available),
        error: isOwnedBySelf ? undefined : data.error,
      });
    } catch {
      setSubdomainCheckResult({
        checkedValue: clean,
        available: false,
        error: 'Unable to verify availability right now.',
      });
    } finally {
      setCheckingSubdomain(false);
    }
  };

  const handleClaimSubdomain = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = subdomainInput.trim().toLowerCase();
    if (!clean) return;
    setClaimingSubdomain(true);
    setConfirmRelease(false);
    try {
      const res = await fetch('/api/subdomains/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subdomain: clean, version: profile.version }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Could not claim handle');
        return;
      }
      const assigned = typeof data.subdomain === 'string' ? data.subdomain : clean;
      const nextVersion = typeof data.profile?.version === 'number' ? data.profile.version : undefined;
      onSubdomainUpdated(assigned, nextVersion);
      setSubdomainCheckResult({ checkedValue: assigned, available: true });
      toast.success(`Handle claimed: ${assigned}.unool.co`);
    } catch {
      toast.error('Failed to claim handle');
    } finally {
      setClaimingSubdomain(false);
    }
  };

  const handleReleaseSubdomain = async () => {
    if (!claimedSubdomain) return;
    setReleasingSubdomain(true);
    try {
      const res = await fetch(`/api/subdomains/${encodeURIComponent(claimedSubdomain)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'Could not release handle');
        return;
      }
      setConfirmRelease(false);
      await onRefreshProfile();
      toast.success('Handle released');
    } catch {
      toast.error('Failed to release handle');
    } finally {
      setReleasingSubdomain(false);
    }
  };

  const handleConnectDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = domainInput.trim().toLowerCase();
    if (!clean) return;
    setSavingDomain(true);
    setDomainFeedback(null);
    try {
      const res = await fetch('/api/profile/domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ domain: clean }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDomainFeedback({ type: 'error', message: data.error || 'Failed to save custom domain' });
        return;
      }
      await loadDomainStatus();
      await onRefreshProfile();
      setDomainFeedback({
        type: 'success',
        message: 'Domain saved. Add the DNS records below, then click Verify DNS.',
      });
    } catch {
      setDomainFeedback({ type: 'error', message: 'Network error while saving domain.' });
    } finally {
      setSavingDomain(false);
    }
  };

  const handleVerifyDomain = async () => {
    setVerifyingDomain(true);
    setDomainFeedback(null);
    try {
      const res = await fetch('/api/profile/domain', {
        method: 'PUT',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.verified) {
        setDomainFeedback({
          type: 'error',
          message: data.error || 'TXT verification record not yet detected via DNS.',
        });
        return;
      }
      await loadDomainStatus();
      await onRefreshProfile();
      setDomainFeedback({
        type: 'success',
        message: `Verified! ${data.customDomain} now routes to your Unool profile.`,
      });
      toast.success('Custom domain verified');
    } catch {
      setDomainFeedback({ type: 'error', message: 'DNS verification failed due to a network error.' });
    } finally {
      setVerifyingDomain(false);
    }
  };

  const handleDisconnectDomain = async () => {
    setRemovingDomain(true);
    setDomainFeedback(null);
    try {
      const res = await fetch('/api/profile/domain', {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        setDomainFeedback({ type: 'error', message: 'Could not disconnect custom domain.' });
        return;
      }
      setDomainInput('');
      await loadDomainStatus();
      await onRefreshProfile();
      toast.success('Custom domain disconnected');
    } catch {
      setDomainFeedback({ type: 'error', message: 'Network error while disconnecting domain.' });
    } finally {
      setRemovingDomain(false);
    }
  };

  const handleCopyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRecord(key);
      setTimeout(() => setCopiedRecord((cur) => (cur === key ? null : cur)), 1800);
    } catch {
      toast.error('Copy failed');
    }
  };

  const handleAddViewer = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = viewerEmailInput.trim().toLowerCase();
    if (!email) return;
    setAddingViewer(true);
    setViewerError(null);
    try {
      const res = await fetch('/api/profile/viewers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setViewerError(data.error || 'Could not add viewer');
        return;
      }
      if (Array.isArray(data.viewers)) {
        setViewers(data.viewers);
      } else {
        await loadViewers();
      }
      setViewerEmailInput('');
      toast.success(`Granted private access to ${email}`);
    } catch {
      setViewerError('Network error while inviting viewer.');
    } finally {
      setAddingViewer(false);
    }
  };

  const handleRemoveViewer = async (viewerUserId: string) => {
    setRemovingViewerId(viewerUserId);
    setViewerError(null);
    try {
      const res = await fetch(`/api/profile/viewers?userId=${encodeURIComponent(viewerUserId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setViewerError(data.error || 'Failed to revoke access');
        return;
      }
      if (Array.isArray(data.viewers)) {
        setViewers(data.viewers);
      } else {
        setViewers((prev) => prev.filter((v) => v.viewerUserId !== viewerUserId));
      }
      toast.success('Viewer access revoked');
    } catch {
      setViewerError('Network error while removing viewer.');
    } finally {
      setRemovingViewerId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Public Handle (.unool.co) */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-zinc-500" aria-hidden="true" />
              Unool Public Handle
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Your permanent creator URL: <span className="font-mono">unool.co/u/your-handle</span> and{' '}
              <span className="font-mono">your-handle.unool.co</span>.
            </p>
          </div>

          {claimedSubdomain && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              {claimedSubdomain}.unool.co
            </span>
          )}
        </div>

        <form onSubmit={handleClaimSubdomain} className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 overflow-hidden focus-within:ring-2 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-300">
            <label htmlFor="subdomain-input" className="sr-only">
              Subdomain handle
            </label>
            <input
              id="subdomain-input"
              type="text"
              value={subdomainInput}
              onChange={(e) => {
                setSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                setSubdomainCheckResult(null);
              }}
              placeholder="alex-rivera"
              maxLength={63}
              className="flex-1 bg-transparent px-3 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none"
            />
            <span className="px-3 py-2 text-xs font-mono text-zinc-500 dark:text-zinc-400 border-l border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950">
              .unool.co
            </span>
          </div>

          <button
            type="button"
            onClick={handleCheckSubdomain}
            disabled={!subdomainInput.trim() || checkingSubdomain}
            className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50"
          >
            {checkingSubdomain ? 'Checking...' : 'Check'}
          </button>

          <button
            type="submit"
            disabled={!subdomainInput.trim() || claimingSubdomain || subdomainInput.trim() === claimedSubdomain}
            className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {claimingSubdomain ? 'Saving...' : claimedSubdomain ? 'Update Handle' : 'Claim Handle'}
          </button>
        </form>

        {subdomainCheckResult && subdomainCheckResult.checkedValue === subdomainInput.trim() && (
          <p
            className={`text-xs flex items-center gap-1.5 ${
              subdomainCheckResult.available
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {subdomainCheckResult.available ? (
              <>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                {subdomainCheckResult.checkedValue}.unool.co is available.
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                {subdomainCheckResult.error || 'This handle is unavailable.'}
              </>
            )}
          </p>
        )}

        {claimedSubdomain && (
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <a
              href={`/u/${claimedSubdomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-zinc-700 dark:text-zinc-300 hover:underline"
            >
              View live profile <ExternalLink className="w-3 h-3" />
            </a>

            {!confirmRelease ? (
              <button
                type="button"
                onClick={() => setConfirmRelease(true)}
                className="text-red-600 hover:text-red-700 dark:text-red-400 font-medium"
              >
                Release handle
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Release {claimedSubdomain}?</span>
                <button
                  type="button"
                  onClick={handleReleaseSubdomain}
                  disabled={releasingSubdomain}
                  className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  {releasingSubdomain ? 'Releasing...' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRelease(false)}
                  className="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11px]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 2. Custom Domain */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-zinc-500" aria-hidden="true" />
              Custom Domain
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Serve your public dossier directly on your own domain (e.g. <span className="font-mono">bio.yourdomain.com</span>).
            </p>
          </div>

          {domainStatus?.verified && domainStatus.customDomain && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              Verified DNS
            </span>
          )}
        </div>

        {domainLoading ? (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading domain configuration...
          </div>
        ) : domainStatus && !domainStatus.allowed ? (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-amber-900 dark:text-amber-200">
              Custom domains are available on <strong>Pro</strong> and <strong>Studio</strong> plans.
            </div>
            <Link
              href="/dashboard/billing"
              className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:opacity-90"
            >
              Upgrade Plan
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleConnectDomain} className="flex flex-col sm:flex-row gap-2">
              <label htmlFor="custom-domain-input" className="sr-only">
                Custom domain hostname
              </label>
              <input
                id="custom-domain-input"
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="bio.yourdomain.com"
                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-300"
              />
              <button
                type="submit"
                disabled={!domainInput.trim() || savingDomain}
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {savingDomain ? 'Saving...' : domainStatus?.customDomain ? 'Update Domain' : 'Connect Domain'}
              </button>
              {domainStatus?.customDomain && (
                <button
                  type="button"
                  onClick={handleDisconnectDomain}
                  disabled={removingDomain}
                  className="px-3 py-2 rounded-xl border border-red-200 dark:border-red-900/50 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
                >
                  {removingDomain ? 'Removing...' : 'Disconnect'}
                </button>
              )}
            </form>

            {domainStatus?.customDomain && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    DNS Configuration for <span className="font-mono">{domainStatus.customDomain}</span>
                  </span>
                  {!domainStatus.verified && (
                    <button
                      type="button"
                      onClick={handleVerifyDomain}
                      disabled={verifyingDomain}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50"
                    >
                      {verifyingDomain ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Verify DNS
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 space-y-1">
                    <div className="text-[11px] font-medium text-zinc-500">1. CNAME Record</div>
                    <div className="font-mono text-zinc-900 dark:text-zinc-100 break-all">
                      Target: {domainStatus.cnameTarget}
                    </div>
                  </div>

                  {domainStatus.txtRecordName && domainStatus.txtRecordValue && (
                    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-zinc-500">2. Verification TXT</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText('txt', domainStatus.txtRecordValue || '')}
                          className="inline-flex items-center gap-1 text-[11px] text-zinc-600 dark:text-zinc-300 hover:underline"
                        >
                          {copiedRecord === 'txt' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          Copy
                        </button>
                      </div>
                      <div className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 break-all">
                        Host: {domainStatus.txtRecordName}
                      </div>
                      <div className="font-mono text-[11px] text-zinc-900 dark:text-zinc-100 break-all">
                        Value: {domainStatus.txtRecordValue}
                      </div>
                    </div>
                  )}
                </div>

                {domainStatus.verifiedAt && (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Verified on {formatShortDate(domainStatus.verifiedAt)}.
                  </p>
                )}
              </div>
            )}

            {domainFeedback && (
              <p
                role="status"
                className={`text-xs flex items-center gap-1.5 ${
                  domainFeedback.type === 'success'
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {domainFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                {domainFeedback.message}
              </p>
            )}
          </>
        )}
      </section>

      {/* 3. Privacy Mode & Private Viewers Allowlist */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-zinc-500" aria-hidden="true" />
            Privacy & Access Control
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Control search engine indexing and restrict sensitive founder dossiers to specific Unool accounts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" role="radiogroup" aria-label="Profile visibility">
          {VISIBILITY_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = profile.visibility === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange((prev) => ({ ...prev, visibility: opt.value }))}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  active
                    ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/50'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  {opt.label}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{opt.description}</p>
              </button>
            );
          })}
        </div>

        {/* Invite-only Private Viewers Allowlist */}
        {(profile.visibility === 'private' || viewers.length > 0) && (
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                Authorized Private Viewers ({viewers.length})
              </span>
            </div>

            {!profile.id ? (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Save your profile once before inviting private viewers.
              </p>
            ) : (
              <>
                <form onSubmit={handleAddViewer} className="flex flex-col sm:flex-row gap-2">
                  <label htmlFor="private-viewer-email" className="sr-only">
                    Viewer email address
                  </label>
                  <input
                    id="private-viewer-email"
                    type="email"
                    value={viewerEmailInput}
                    onChange={(e) => {
                      setViewerEmailInput(e.target.value);
                      setViewerError(null);
                    }}
                    placeholder="investor@firm.com"
                    className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-300"
                  />
                  <button
                    type="submit"
                    disabled={!viewerEmailInput.trim() || addingViewer}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {addingViewer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                    Grant Access
                  </button>
                </form>

                {viewerError && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {viewerError}
                  </p>
                )}

                {viewersLoading ? (
                  <div className="text-xs text-zinc-500 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading viewer allowlist...
                  </div>
                ) : viewers.length === 0 ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    No invited viewers yet. Only you (the owner) can view this profile while Private mode is active.
                  </p>
                ) : (
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    {viewers.map((viewer) => (
                      <li
                        key={viewer.viewerUserId}
                        className="px-3 py-2 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {viewer.email || viewer.viewerUserId}
                          </div>
                          {(viewer.fullName || viewer.createdAt) && (
                            <div className="text-[11px] text-zinc-500 truncate">
                              {viewer.fullName ? `${viewer.fullName} • ` : ''}
                              Added {formatShortDate(viewer.createdAt)}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveViewer(viewer.viewerUserId)}
                          disabled={removingViewerId === viewer.viewerUserId}
                          aria-label={`Revoke access for ${viewer.email || viewer.viewerUserId}`}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          {removingViewerId === viewer.viewerUserId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
      </section>

      {/* 4. Profile Analytics Summary */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-500" aria-hidden="true" />
              Public Profile Analytics
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Views, outbound link clicks, referrers, and template conversion rate.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {([7, 30, 90] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setDays(period)}
                aria-pressed={days === period}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  days === period
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                {period}d
              </button>
            ))}
            <button
              type="button"
              onClick={() => loadAnalytics(days)}
              aria-label="Refresh profile analytics"
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyticsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {analyticsLoading && !analyticsData ? (
          <div className="flex items-center gap-2 text-xs text-zinc-500 py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading analytics...
          </div>
        ) : analyticsData ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 p-3">
                <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Views
                </div>
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 tabular-nums">
                  {analyticsData.summary.totalViews.toLocaleString()}
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 p-3">
                <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Unique Visitors
                </div>
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 tabular-nums">
                  {analyticsData.summary.uniqueVisitors.toLocaleString()}
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 p-3">
                <div className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <MousePointerClick className="w-3 h-3" /> Link + CTA Clicks
                </div>
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 tabular-nums">
                  {(analyticsData.summary.linkClicks + analyticsData.summary.ctaClicks).toLocaleString()}
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 p-3">
                <div className="text-[11px] text-zinc-500">Engagement CTR</div>
                <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 tabular-nums">
                  {analyticsData.summary.ctr.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Links */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-2">
                <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Top Clicked Links</div>
                {analyticsData.topLinks.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-2">No link clicks recorded in this window.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs">
                    {analyticsData.topLinks.slice(0, 5).map((item, idx) => (
                      <li key={`${item.label}-${idx}`} className="flex items-center justify-between gap-2">
                        <span className="truncate text-zinc-700 dark:text-zinc-300">{item.label}</span>
                        <span className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold shrink-0">
                          {item.clicks}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Top Referrers */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-2">
                <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Top Referrers</div>
                {analyticsData.topReferrers.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-2">No referrer traffic recorded in this window.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs">
                    {analyticsData.topReferrers.slice(0, 5).map((ref) => (
                      <li key={ref.source} className="flex items-center justify-between gap-2">
                        <span className="truncate text-zinc-700 dark:text-zinc-300">{ref.source}</span>
                        <span className="font-mono text-zinc-500 dark:text-zinc-400 shrink-0">
                          {ref.visits} ({ref.percentage}%)
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {analyticsData.templateUsage.length > 0 && (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900/70 text-xs font-semibold text-zinc-800 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-800">
                  Performance by Template
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                  {analyticsData.templateUsage.map((row) => (
                    <div key={row.templateId} className="px-3.5 py-2 flex items-center justify-between gap-3">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{row.templateName}</span>
                      <span className="font-mono text-zinc-600 dark:text-zinc-300">
                        {row.views} views · {row.clicks} clicks · {row.ctr.toFixed(1)}% CTR
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-zinc-500">Claim a handle and save your profile to start tracking analytics.</p>
        )}
      </section>

      {/* 5. Visitor Contact Leads Inbox */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-zinc-500" aria-hidden="true" />
              Visitor Inquiries ({leads.length})
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Direct messages submitted through your public profile&apos;s contact modal.
            </p>
          </div>
          <button
            type="button"
            onClick={loadLeads}
            aria-label="Refresh visitor inquiries"
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${leadsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {leadsLoading && leads.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-zinc-500 py-3">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading messages...
          </div>
        ) : leads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-5 text-center text-xs text-zinc-500 dark:text-zinc-400">
            No visitor messages yet. Enable <strong>Direct Contact Dock</strong> in the Links &amp; Proof tab to accept inquiries.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {leads.map((lead) => (
              <li
                key={lead.id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50 p-3.5 space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{lead.sender_name}</span>
                    <a
                      href={`mailto:${encodeURIComponent(lead.sender_email)}`}
                      className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-300 hover:underline"
                    >
                      <Mail className="w-3 h-3" aria-hidden="true" />
                      {lead.sender_email}
                    </a>
                  </div>
                  <span className="text-[11px] text-zinc-500">{formatShortDate(lead.created_at)}</span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {lead.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

