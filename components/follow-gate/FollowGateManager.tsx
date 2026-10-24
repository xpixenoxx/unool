'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Lock, Plus, Trash2, ExternalLink,
  Instagram, Link2, FileDown, Tag, MessageSquare, Video, Eye, Unlock, X,
  ChevronDown, ChevronUp, Copy, Check, Send, Sparkles,
  ShieldCheck, TrendingUp, Layers, Search, MessageCircle, HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FollowGate, UnlockedContent, UnlockedContentType } from '@/lib/follow-gate/types';
import './FollowGateManager.css';

// ── Types ──────────────────────────────────────────────────────────────────────

interface PlatformConnection {
  id: string;
  platform: string;
  username: string;
  platform_user_id: string;
  status: string;
}

// ── Helpers & Constants ────────────────────────────────────────────────────────

const CONTENT_TYPE_LABELS: Record<UnlockedContentType, string> = {
  link: 'Private Link',
  file: 'File / Download',
  coupon: 'Discount Coupon',
  message: 'Secret Message',
  video: 'Exclusive Video',
};

const CONTENT_TYPE_ICONS: Record<UnlockedContentType, React.ReactNode> = {
  link: <Link2 className="h-4 w-4" />,
  file: <FileDown className="h-4 w-4" />,
  coupon: <Tag className="h-4 w-4" />,
  message: <MessageSquare className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
};

// ── Main FollowGateManager Component ──────────────────────────────────────────

export function FollowGateManager({ workspaceId }: { workspaceId: string }) {
  const [gates, setGates] = useState<FollowGate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [igConnections, setIgConnections] = useState<PlatformConnection[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2800);
  }, []);

  const fetchGates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/follow-gate?workspaceId=${workspaceId}`);
      const data = await res.json() as { gates?: FollowGate[] };
      setGates(data.gates ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const fetchConnections = useCallback(async () => {
    try {
      const res = await fetch(`/api/platform/connections?workspaceId=${workspaceId}`);
      const data = await res.json() as {
        connections?: Record<string, { platform: string; status: string; username?: string }>;
      };
      const allConns = Object.values(data.connections ?? {});
      const igConns = allConns
        .filter((c) => c.platform === 'instagram' && c.status === 'connected')
        .map((c, i) => ({
          id: `ig-${i}`,
          platform: c.platform,
          username: c.username ?? '',
          platform_user_id: '',
          status: c.status,
        }));
      setIgConnections(igConns);
    } catch {
      // ignore
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchGates();
    fetchConnections();
  }, [fetchGates, fetchConnections]);

  const handleToggle = async (gate: FollowGate) => {
    const nextState = !gate.isActive;
    // Optimistic update
    setGates((prev) =>
      prev.map((g) => (g.id === gate.id ? { ...g, isActive: nextState } : g))
    );
    showToast(nextState ? 'Gate is now LIVE' : 'Gate paused');

    try {
      await fetch(`/api/follow-gate/${gate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, isActive: nextState }),
      });
    } catch {
      // Revert on error
      setGates((prev) =>
        prev.map((g) => (g.id === gate.id ? { ...g, isActive: !nextState } : g))
      );
      showToast('Failed to update gate status');
    }
  };

  const handleDelete = async (gateId: string) => {
    if (!confirm('Are you sure you want to delete this gate? All view and unlock metrics will be removed.')) return;
    setGates((prev) => prev.filter((g) => g.id !== gateId));
    showToast('Gate deleted');
    try {
      await fetch(`/api/follow-gate/${gateId}?workspaceId=${workspaceId}`, { method: 'DELETE' });
    } catch {
      fetchGates();
    }
  };

  const handleCreated = (gate: FollowGate) => {
    setGates((prev) => [gate, ...prev]);
    setShowCreate(false);
    showToast('🎉 Unlock Gate created successfully!');
  };

  // Metrics calculation
  const totalGates = gates.length;
  const activeGates = gates.filter((g) => g.isActive).length;
  const totalViews = gates.reduce((sum, g) => sum + (g.viewCount || 0), 0);
  const totalUnlocks = gates.reduce((sum, g) => sum + (g.unlockCount || 0), 0);
  const conversionRate = totalViews > 0 ? ((totalUnlocks / totalViews) * 100).toFixed(1) : '0';

  // Filtered list
  const filteredGates = useMemo(() => {
    return gates.filter((g) => {
      if (filterTab === 'active' && !g.isActive) return false;
      if (filterTab === 'inactive' && g.isActive) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = g.title.toLowerCase().includes(q);
        const matchesHandle = g.igUsername.toLowerCase().includes(q);
        const matchesDesc = (g.description || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesHandle && !matchesDesc) return false;
      }
      return true;
    });
  }, [gates, filterTab, searchQuery]);

  return (
    <div className="fgm-root">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fgm-toast-banner" role="status">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="fgm-header-card">
        <div className="fgm-header-left">
          <div className="fgm-header-icon-badge">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <div className="fgm-header-text">
            <h1 className="fgm-title">Unlock Gates</h1>
            <p className="fgm-subtitle">
              Lock premium downloads, discount codes, or secret links behind an Instagram follow. 
              Share in your bio, post captions, or send directly via automated DMs.
            </p>
          </div>
        </div>

        <button
          id="create-gate-btn"
          className="fgm-btn-primary"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="h-4 w-4" />
          <span>New Gate</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="fgm-metrics-strip">
        <div className="fgm-metric-card">
          <div className="fgm-metric-label">
            <Layers className="h-3.5 w-3.5" /> Total Gates
          </div>
          <div className="fgm-metric-val">{totalGates}</div>
          <div className="fgm-metric-sub">{activeGates} currently active</div>
        </div>

        <div className="fgm-metric-card">
          <div className="fgm-metric-label">
            <Eye className="h-3.5 w-3.5" /> Total Impressions
          </div>
          <div className="fgm-metric-val">{totalViews.toLocaleString()}</div>
          <div className="fgm-metric-sub">Across all gates</div>
        </div>

        <div className="fgm-metric-card fgm-metric-card--accent">
          <div className="fgm-metric-label">
            <Unlock className="h-3.5 w-3.5" /> Follower Unlocks
          </div>
          <div className="fgm-metric-val">{totalUnlocks.toLocaleString()}</div>
          <div className="fgm-metric-sub">New followers gained</div>
        </div>

        <div className="fgm-metric-card">
          <div className="fgm-metric-label">
            <TrendingUp className="h-3.5 w-3.5" /> Unlock Rate
          </div>
          <div className="fgm-metric-val">{conversionRate}%</div>
          <div className="fgm-metric-sub">Visitors converted to followers</div>
        </div>
      </div>

      {/* Distribution channels card */}
      <div className="fgm-channels-tip">
        <div className="fgm-tip-icon">
          <Send className="h-4 w-4 text-[#DF5B4C]" />
        </div>
        <div className="fgm-tip-content">
          <strong>3 Ways to Distribute Your Gate:</strong>
          <span>
            <strong>1. Instagram DMs:</strong> Use the &ldquo;Send in DM&rdquo; button to copy a ready-to-send DM asking followers to unlock. • 
            <strong> 2. Bio Link / Story Sticker:</strong> Copy the gate link directly. • 
            <strong> 3. Brand Page / Post:</strong> Feature your gate on your Unool profile.
          </span>
        </div>
      </div>

      {/* Warning if no IG account connected */}
      {igConnections.length === 0 && !loading && (
        <div className="fgm-warning-card">
          <Instagram className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="fgm-warning-text">
            <strong>No Instagram account linked:</strong> Connect your Instagram Business or Creator account in{' '}
            <a href="/dashboard/settings" className="underline font-semibold text-amber-800">
              Settings &rarr; Integrations
            </a>{' '}
            to enable automated follow verification.
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="fgm-controls-bar">
        <div className="fgm-tabs-group">
          <button
            className={cn('fgm-tab-btn', filterTab === 'all' && 'fgm-tab-btn--active')}
            onClick={() => setFilterTab('all')}
          >
            All Gates ({totalGates})
          </button>
          <button
            className={cn('fgm-tab-btn', filterTab === 'active' && 'fgm-tab-btn--active')}
            onClick={() => setFilterTab('active')}
          >
            Active ({activeGates})
          </button>
          <button
            className={cn('fgm-tab-btn', filterTab === 'inactive' && 'fgm-tab-btn--active')}
            onClick={() => setFilterTab('inactive')}
          >
            Paused ({totalGates - activeGates})
          </button>
        </div>

        <div className="fgm-search-wrap">
          <Search className="h-3.5 w-3.5 text-stone-400 fgm-search-icon" />
          <input
            type="text"
            className="fgm-search-input"
            placeholder="Search by title, handle or description…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="fgm-search-clear" onClick={() => setSearchQuery('')}>
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Create Modal Dialog */}
      {showCreate && (
        <CreateGateModal
          workspaceId={workspaceId}
          igConnections={igConnections}
          onCreated={handleCreated}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Gate List or Empty State */}
      {loading ? (
        <GateSkeleton />
      ) : filteredGates.length === 0 ? (
        <EmptyState
          filterActive={filterTab !== 'all' || Boolean(searchQuery)}
          onResetFilter={() => { setFilterTab('all'); setSearchQuery(''); }}
          onCreate={() => setShowCreate(true)}
        />
      ) : (
        <div className="fgm-gate-grid">
          {filteredGates.map((gate) => (
            <GateCard
              key={gate.id}
              gate={gate}
              onToggle={() => handleToggle(gate)}
              onDelete={() => handleDelete(gate.id)}
              onToast={showToast}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Gate Card (Bespoke Designer Look) ──────────────────────────────────────────

function GateCard({
  gate, onToggle, onDelete, onToast,
}: {
  gate: FollowGate;
  onToggle: () => void;
  onDelete: () => void;
  onToast: (msg: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDm, setCopiedDm] = useState(false);

  // Direct clean public gate URL (no more raw API URL!)
  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/gate/${gate.id}`;

  const dmTextTemplate = `Hey! Here is your exclusive access link: ${publicUrl} — Just follow @${gate.igUsername} on Instagram to unlock it right away! ✨`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      onToast('Public gate link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // fallback
    }
  };

  const handleCopyDm = async () => {
    try {
      await navigator.clipboard.writeText(dmTextTemplate);
      setCopiedDm(true);
      onToast('DM text & link copied! Ready to paste into Instagram DMs.');
      setTimeout(() => setCopiedDm(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleCopyGateId = async () => {
    try {
      await navigator.clipboard.writeText(gate.id);
      onToast('Gate ID copied for profile embed!');
    } catch {
      // fallback
    }
  };

  const convRate = gate.viewCount > 0 ? ((gate.unlockCount / gate.viewCount) * 100).toFixed(0) : '0';

  return (
    <div className={cn('fgm-card', !gate.isActive && 'fgm-card--paused')}>
      {/* Card Header Top */}
      <div className="fgm-card-top">
        <div className="fgm-card-badge-row">
          <div className="fgm-content-type-chip">
            {CONTENT_TYPE_ICONS[gate.unlockedContent.type]}
            <span>{CONTENT_TYPE_LABELS[gate.unlockedContent.type]}</span>
          </div>

          <div className="fgm-status-beacon">
            {gate.isActive ? (
              <span className="fgm-status-pill fgm-status-pill--active">
                <span className="fgm-pulse-dot" />
                Live &amp; Protecting
              </span>
            ) : (
              <span className="fgm-status-pill fgm-status-pill--paused">
                Paused
              </span>
            )}
          </div>
        </div>

        {/* Title & IG Account */}
        <div className="fgm-card-identity">
          <h3 className="fgm-card-title">{gate.title}</h3>
          <div className="fgm-card-target-ig">
            <Instagram className="h-3.5 w-3.5 text-[#DF5B4C]" />
            <span>Requires follow: <strong>@{gate.igUsername}</strong></span>
          </div>
        </div>

        {gate.description && (
          <p className="fgm-card-description">{gate.description}</p>
        )}

        {/* Content Preview Tag */}
        <div className="fgm-card-payload-preview">
          <span className="fgm-payload-label">Perk:</span>
          <span className="fgm-payload-val">{gate.unlockedContent.label}</span>
          {gate.unlockedContent.url && (
            <span className="fgm-payload-hint">({gate.unlockedContent.url.replace(/^https?:\/\//, '').slice(0, 24)}…)</span>
          )}
        </div>
      </div>

      {/* Quick Stats Strip */}
      <div className="fgm-card-stats-strip">
        <div className="fgm-card-stat">
          <span className="fgm-stat-label">Views</span>
          <span className="fgm-stat-number">{gate.viewCount}</span>
        </div>
        <div className="fgm-card-stat fgm-card-stat--accent">
          <span className="fgm-stat-label">Follower Unlocks</span>
          <span className="fgm-stat-number">{gate.unlockCount}</span>
        </div>
        <div className="fgm-card-stat">
          <span className="fgm-stat-label">Conv. Rate</span>
          <span className="fgm-stat-number">{convRate}%</span>
        </div>
      </div>

      {/* Action Bar (DM, Link, Preview, Toggle, Delete) */}
      <div className="fgm-card-actions-bar">
        {/* Send in DM Button */}
        <button
          className={cn('fgm-action-btn fgm-action-btn--dm', copiedDm && 'fgm-action-btn--success')}
          onClick={handleCopyDm}
          title="Copy Instagram DM template with link"
        >
          {copiedDm ? <Check className="h-3.5 w-3.5" /> : <MessageCircle className="h-3.5 w-3.5" />}
          <span>{copiedDm ? 'DM Copied!' : 'Send in DM'}</span>
        </button>

        {/* Copy Public Link Button */}
        <button
          className={cn('fgm-action-btn', copiedLink && 'fgm-action-btn--success')}
          onClick={handleCopyLink}
          title="Copy clean public link for bio or stories"
        >
          {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
        </button>

        {/* Preview Link */}
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fgm-action-icon-btn"
          title="Open live preview page"
        >
          <ExternalLink className="h-4 w-4" />
        </a>

        {/* Toggle Switch */}
        <button
          className={cn('fgm-pill-toggle', gate.isActive && 'fgm-pill-toggle--on')}
          onClick={onToggle}
          title={gate.isActive ? 'Pause gate' : 'Activate gate'}
          aria-label={gate.isActive ? 'Pause gate' : 'Activate gate'}
        >
          <span className="fgm-pill-thumb" />
        </button>

        {/* Delete */}
        <button
          className="fgm-action-icon-btn fgm-action-icon-btn--danger"
          onClick={onDelete}
          title="Delete gate"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {/* Expand Details */}
        <button
          className="fgm-action-icon-btn"
          onClick={() => setExpanded((v) => !v)}
          title="Toggle embed details"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expanded Embed Drawer */}
      {expanded && (
        <div className="fgm-card-drawer">
          <div className="fgm-drawer-item">
            <span className="fgm-drawer-label">Live Public URL:</span>
            <div className="fgm-code-box">
              <code>{publicUrl}</code>
              <button className="fgm-code-copy-btn" onClick={handleCopyLink}>
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="fgm-drawer-item">
            <span className="fgm-drawer-label">Ready-to-Send DM Message:</span>
            <div className="fgm-dm-snippet">
              <p>&ldquo;{dmTextTemplate}&rdquo;</p>
              <button className="fgm-code-copy-btn" onClick={handleCopyDm}>
                <Copy className="h-3 w-3" /> Copy DM
              </button>
            </div>
          </div>

          <div className="fgm-drawer-footer">
            <div className="fgm-embed-id-tag" onClick={handleCopyGateId} title="Click to copy gate ID">
              Gate ID: <code>{gate.id}</code> (click to copy for profile embed)
            </div>
            <span className="fgm-date-text">
              Created {new Date(gate.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Create Gate Modal (With Real-Time Live Preview) ────────────────────────────

interface CreateFormState {
  title: string;
  description: string;
  igConnectionId: string;
  contentType: UnlockedContentType;
  contentLabel: string;
  contentUrl: string;
  contentText: string;
  contentExpiry: string;
  ctaText: string;
}

function CreateGateModal({
  workspaceId, igConnections, onCreated, onCancel,
}: {
  workspaceId: string;
  igConnections: PlatformConnection[];
  onCreated: (gate: FollowGate) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CreateFormState>({
    title: '',
    description: '',
    igConnectionId: igConnections[0]?.id ?? '',
    contentType: 'link',
    contentLabel: '',
    contentUrl: '',
    contentText: '',
    contentExpiry: '',
    ctaText: 'Follow to unlock',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedConn = igConnections.find((c) => c.id === form.igConnectionId) || igConnections[0];

  const applyTemplate = (type: 'pdf' | 'coupon' | 'community') => {
    if (type === 'pdf') {
      setForm((prev) => ({
        ...prev,
        title: 'Exclusive Strategy PDF Guide',
        description: 'Get instant access to my comprehensive 2026 playbook. Just follow on Instagram to download.',
        contentType: 'file',
        contentLabel: '2026-Strategy-Playbook.pdf',
        contentUrl: 'https://example.com/download.pdf',
        ctaText: 'Follow to Download PDF',
      }));
    } else if (type === 'coupon') {
      setForm((prev) => ({
        ...prev,
        title: 'VIP 20% Off Store Discount',
        description: 'Unlock my private 20% discount code valid on all collections.',
        contentType: 'coupon',
        contentLabel: 'VIP Store Discount Code',
        contentText: 'VIPFOLLOW20',
        contentExpiry: '2026-12-31',
        ctaText: 'Follow to Reveal Code',
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        title: 'Private Creator Community Link',
        description: 'Join our private Telegram masterclass channel. Available only to active Instagram followers.',
        contentType: 'link',
        contentLabel: 'Private Telegram VIP Group',
        contentUrl: 'https://t.me/example-private',
        ctaText: 'Follow to Join Group',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.contentLabel.trim()) { setError('Perk label is required'); return; }
    if (['link', 'file', 'video'].includes(form.contentType) && !form.contentUrl.trim()) {
      setError('A valid URL is required for this content type'); return;
    }
    if (['coupon', 'message'].includes(form.contentType) && !form.contentText.trim()) {
      setError('Promo code or message text is required'); return;
    }

    const unlockedContent: UnlockedContent = {
      type: form.contentType,
      label: form.contentLabel,
      url: form.contentUrl || undefined,
      text: form.contentText || undefined,
      expiresAt: form.contentExpiry || undefined,
    };

    setSaving(true);
    try {
      const res = await fetch('/api/follow-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          title: form.title,
          description: form.description || undefined,
          igUsername: selectedConn?.username || 'your_handle',
          igUserId: selectedConn?.platform_user_id || '0',
          unlockedContent,
          ctaText: form.ctaText || 'Follow to unlock',
        }),
      });
      const data = await res.json() as { gate?: FollowGate; error?: string };
      if (!res.ok || !data.gate) throw new Error(data.error ?? 'Failed to create gate');
      onCreated(data.gate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create gate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fgm-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="fgm-modal-card">
        {/* Header */}
        <div className="fgm-modal-header">
          <div className="fgm-modal-header-left">
            <div className="fgm-modal-icon-badge">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="fgm-modal-title">Create Follow-to-Unlock Gate</h2>
              <p className="fgm-modal-subtitle">
                Configure your locked perk and preview how it will appear to visitors.
              </p>
            </div>
          </div>
          <button className="fgm-modal-close-btn" onClick={onCancel}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quickstart Templates Strip */}
        <div className="fgm-modal-templates-strip">
          <span className="fgm-templates-label">Quick Templates:</span>
          <button type="button" className="fgm-template-pill" onClick={() => applyTemplate('pdf')}>
            📄 Free PDF / E-Book
          </button>
          <button type="button" className="fgm-template-pill" onClick={() => applyTemplate('coupon')}>
            🏷️ 20% Off Coupon
          </button>
          <button type="button" className="fgm-template-pill" onClick={() => applyTemplate('community')}>
            🔗 Private Community
          </button>
        </div>

        {/* 2-Column Layout: Form (Left) & Live Preview (Right) */}
        <div className="fgm-modal-body-split">
          {/* Left Column: Form */}
          <form className="fgm-modal-form" onSubmit={handleSubmit}>
            {error && (
              <div className="fgm-form-error-alert" role="alert">
                {error}
              </div>
            )}

            {/* Title */}
            <div className="fgm-field">
              <label className="fgm-field-label">Gate Title *</label>
              <input
                type="text"
                className="fgm-input"
                placeholder="e.g. Free 30-Day Fitness & Diet Routine"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="fgm-field">
              <label className="fgm-field-label">
                Description / Value Proposition <span className="fgm-optional">(Optional)</span>
              </label>
              <textarea
                className="fgm-textarea"
                rows={2}
                placeholder="Explain what value followers receive once unlocked…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* IG Account Selector */}
            <div className="fgm-field">
              <label className="fgm-field-label">Target Instagram Account to Follow *</label>
              {igConnections.length > 0 ? (
                <select
                  className="fgm-select"
                  value={form.igConnectionId}
                  onChange={(e) => setForm({ ...form, igConnectionId: e.target.value })}
                >
                  {igConnections.map((conn) => (
                    <option key={conn.id} value={conn.id}>
                      @{conn.username} (Connected)
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="fgm-input"
                  placeholder="Enter your Instagram handle (e.g. @yourname)"
                  value={selectedConn?.username || ''}
                  readOnly
                />
              )}
            </div>

            {/* Content Type Selector Radio Pills */}
            <div className="fgm-field">
              <label className="fgm-field-label">What Content Unlocks? *</label>
              <div className="fgm-type-selector-grid">
                {(['link', 'file', 'coupon', 'message', 'video'] as UnlockedContentType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={cn('fgm-type-pill', form.contentType === t && 'fgm-type-pill--active')}
                    onClick={() => setForm({ ...form, contentType: t })}
                  >
                    {CONTENT_TYPE_ICONS[t]}
                    <span>{CONTENT_TYPE_LABELS[t]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Perk Label */}
            <div className="fgm-field">
              <label className="fgm-field-label">Perk Label *</label>
              <input
                type="text"
                className="fgm-input"
                placeholder="e.g. Download Playbook PDF or VIP Code"
                value={form.contentLabel}
                onChange={(e) => setForm({ ...form, contentLabel: e.target.value })}
                required
              />
            </div>

            {/* Dynamic field by type */}
            {['link', 'file', 'video'].includes(form.contentType) && (
              <div className="fgm-field">
                <label className="fgm-field-label">
                  {form.contentType === 'file' ? 'Direct File Download URL *' : 'Secret Destination URL *'}
                </label>
                <input
                  type="url"
                  className="fgm-input"
                  placeholder="https://drive.google.com/... or https://..."
                  value={form.contentUrl}
                  onChange={(e) => setForm({ ...form, contentUrl: e.target.value })}
                  required
                />
                <span className="fgm-field-hint">
                  Hidden securely until follow is verified. Never exposed in public HTML.
                </span>
              </div>
            )}

            {form.contentType === 'coupon' && (
              <div className="fgm-grid-2">
                <div className="fgm-field">
                  <label className="fgm-field-label">Coupon Code *</label>
                  <input
                    type="text"
                    className="fgm-input"
                    placeholder="e.g. UNOOL20"
                    value={form.contentText}
                    onChange={(e) => setForm({ ...form, contentText: e.target.value })}
                    required
                  />
                </div>
                <div className="fgm-field">
                  <label className="fgm-field-label">Expiry Date <span className="fgm-optional">(Optional)</span></label>
                  <input
                    type="date"
                    className="fgm-input"
                    value={form.contentExpiry}
                    onChange={(e) => setForm({ ...form, contentExpiry: e.target.value })}
                  />
                </div>
              </div>
            )}

            {form.contentType === 'message' && (
              <div className="fgm-field">
                <label className="fgm-field-label">Secret Text / Message *</label>
                <textarea
                  className="fgm-textarea"
                  rows={3}
                  placeholder="Secret access instructions, private code, or thank-you note…"
                  value={form.contentText}
                  onChange={(e) => setForm({ ...form, contentText: e.target.value })}
                  required
                />
              </div>
            )}

            {/* Custom CTA */}
            <div className="fgm-field">
              <label className="fgm-field-label">Button CTA Text</label>
              <input
                type="text"
                className="fgm-input"
                placeholder="Follow to unlock"
                value={form.ctaText}
                onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
              />
            </div>

            {/* Modal Actions */}
            <div className="fgm-modal-actions">
              <button type="button" className="fgm-btn-ghost" onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className="fgm-btn-primary" disabled={saving}>
                {saving ? 'Creating Gate…' : 'Publish Gate'}
              </button>
            </div>
          </form>

          {/* Right Column: Live Interactive Preview */}
          <div className="fgm-modal-preview-col">
            <div className="fgm-preview-header">
              <div className="fgm-preview-header-title">
                <Eye className="h-4 w-4 text-[#DF5B4C]" />
                <span>Live Visitor Preview</span>
              </div>
              <span className="fgm-preview-pill">Interactive</span>
            </div>

            <div className="fgm-live-preview-box">
              <div className="fgm-preview-card">
                <div className="fgm-preview-lock-circle">
                  <Lock className="h-6 w-6 text-[#DF5B4C]" />
                </div>
                <h4 className="fgm-preview-title">
                  {form.title.trim() || 'Your Gated Perk Title'}
                </h4>
                <p className="fgm-preview-desc">
                  {form.description.trim() || 'Visitors will see this description and follow prompt before content is revealed.'}
                </p>

                <div className="fgm-preview-target-badge">
                  <Instagram className="h-3.5 w-3.5 text-[#DF5B4C]" />
                  <span>Must follow <strong>@{selectedConn?.username || 'your_handle'}</strong></span>
                </div>

                <div className="fgm-preview-cta-button">
                  <Instagram className="h-4 w-4" />
                  <span>{form.ctaText || 'Follow to unlock'}</span>
                </div>

                <div className="fgm-preview-verified-hint">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  <span>Follow verified automatically via Instagram API</span>
                </div>
              </div>
            </div>

            {/* Direct DM Snippet Preview */}
            <div className="fgm-dm-preview-card">
              <div className="fgm-dm-preview-title">
                <MessageSquare className="h-3.5 w-3.5 text-[#DF5B4C]" />
                <span>Automated DM Flow Preview:</span>
              </div>
              <p className="fgm-dm-preview-text">
                &ldquo;Hey! Here is the exclusive link: <strong>https://unool.co/gate/[id]</strong> — Follow @{selectedConn?.username || 'your_handle'} on Instagram to unlock it right away! ✨&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Empty State Component ──────────────────────────────────────────────────────

function EmptyState({
  filterActive, onResetFilter, onCreate,
}: {
  filterActive: boolean;
  onResetFilter: () => void;
  onCreate: () => void;
}) {
  if (filterActive) {
    return (
      <div className="fgm-empty-card">
        <Search className="h-8 w-8 text-stone-400" />
        <h3 className="fgm-empty-title">No gates match your filter</h3>
        <p className="fgm-empty-desc">Try clearing your search query or switching tabs.</p>
        <button className="fgm-btn-ghost" onClick={onResetFilter}>
          Clear Filters
        </button>
      </div>
    );
  }

  return (
    <div className="fgm-empty-card">
      <div className="fgm-empty-icon-wrap">
        <Lock className="h-8 w-8 text-[#DF5B4C]" />
      </div>
      <h3 className="fgm-empty-title">No Unlock Gates created yet</h3>
      <p className="fgm-empty-desc">
        Lock exclusive content (PDF guides, VIP discounts, or private links) behind an Instagram follow. 
        Start growing your follower count on autopilot.
      </p>
      <button className="fgm-btn-primary" onClick={onCreate}>
        <Plus className="h-4 w-4" /> Create Your First Gate
      </button>
    </div>
  );
}

// ── Skeleton Loader ────────────────────────────────────────────────────────────

function GateSkeleton() {
  return (
    <div className="fgm-gate-grid">
      {[1, 2].map((i) => (
        <div key={i} className="fgm-card fgm-card--skeleton">
          <div className="fgm-skeleton-line" style={{ width: '40%' }} />
          <div className="fgm-skeleton-line" style={{ width: '75%', height: '1.25rem' }} />
          <div className="fgm-skeleton-line" style={{ width: '90%' }} />
          <div className="fgm-skeleton-line" style={{ width: '50%' }} />
        </div>
      ))}
    </div>
  );
}
