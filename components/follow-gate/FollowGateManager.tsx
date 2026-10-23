'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock, Plus, Trash2, ToggleLeft, ToggleRight, ExternalLink,
  Instagram, Link2, FileDown, Tag, MessageSquare, Video, Eye, Unlock, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FollowGate, UnlockedContent, UnlockedContentType } from '@/lib/follow-gate/types';

// ── Types ──────────────────────────────────────────────────────────────────────

interface PlatformConnection {
  id: string;
  platform: string;
  username: string;
  platform_user_id: string;
  status: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const CONTENT_TYPE_LABELS: Record<UnlockedContentType, string> = {
  link: 'Link',
  file: 'File download',
  coupon: 'Coupon / promo code',
  message: 'Secret message',
  video: 'Video',
};

const CONTENT_TYPE_ICONS: Record<UnlockedContentType, React.ReactNode> = {
  link: <Link2 className="h-4 w-4" />,
  file: <FileDown className="h-4 w-4" />,
  coupon: <Tag className="h-4 w-4" />,
  message: <MessageSquare className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
};

// ── Main Component ─────────────────────────────────────────────────────────────

export function FollowGateManager({ workspaceId }: { workspaceId: string }) {
  const [gates, setGates] = useState<FollowGate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [igConnections, setIgConnections] = useState<PlatformConnection[]>([]);

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
      // connections is an object keyed by platform name; extract instagram entries
      const allConns = Object.values(data.connections ?? {});
      const igConns = allConns
        .filter((c) => c.platform === 'instagram' && c.status === 'connected')
        .map((c, i) => ({
          id: `ig-${i}`,
          platform: c.platform,
          username: c.username ?? '',
          // platform_user_id not in this endpoint — will be resolved server-side via workspaceId
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
    await fetch(`/api/follow-gate/${gate.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, isActive: !gate.isActive }),
    });
    setGates((prev) =>
      prev.map((g) => (g.id === gate.id ? { ...g, isActive: !g.isActive } : g))
    );
  };

  const handleDelete = async (gateId: string) => {
    if (!confirm('Delete this gate? This cannot be undone.')) return;
    await fetch(`/api/follow-gate/${gateId}?workspaceId=${workspaceId}`, { method: 'DELETE' });
    setGates((prev) => prev.filter((g) => g.id !== gateId));
  };

  const handleCreated = (gate: FollowGate) => {
    setGates((prev) => [gate, ...prev]);
    setShowCreate(false);
  };

  return (
    <div className="fgm-root">
      {/* Header */}
      <div className="fgm-header">
        <div className="fgm-header-left">
          <div className="fgm-header-icon">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="fgm-title">Unlock Gates</h1>
            <p className="fgm-subtitle">
              Lock premium content behind an Instagram follow. Visitors follow you, content unlocks — automatically.
            </p>
          </div>
        </div>
        <button
          id="create-gate-btn"
          className="fgm-btn fgm-btn--primary"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="h-4 w-4" /> New Gate
        </button>
      </div>

      {/* No IG connection warning */}
      {igConnections.length === 0 && !loading && (
        <div className="fgm-warning">
          <Instagram className="h-5 w-5 flex-shrink-0" />
          <span>Connect your Instagram Business account in <strong>Settings → Integrations</strong> to enable follow verification.</span>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <CreateGateForm
          workspaceId={workspaceId}
          igConnections={igConnections}
          onCreated={handleCreated}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* Gate list */}
      {loading ? (
        <GateSkeleton />
      ) : gates.length === 0 ? (
        <EmptyState onCreate={() => setShowCreate(true)} />
      ) : (
        <div className="fgm-gate-list">
          {gates.map((gate) => (
            <GateCard
              key={gate.id}
              gate={gate}
              workspaceId={workspaceId}
              onToggle={() => handleToggle(gate)}
              onDelete={() => handleDelete(gate.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Gate Card ──────────────────────────────────────────────────────────────────

function GateCard({
  gate, workspaceId, onToggle, onDelete,
}: {
  gate: FollowGate;
  workspaceId: string;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/follow-gate/${gate.id}`;

  return (
    <div className={cn('fgm-gate-card', !gate.isActive && 'fgm-gate-card--inactive')}>
      <div className="fgm-gate-card-header">
        <div className="fgm-gate-card-icon">
          {gate.isActive ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        </div>
        <div className="fgm-gate-card-info">
          <h3 className="fgm-gate-name">{gate.title}</h3>
          <span className="fgm-gate-ig">@{gate.igUsername}</span>
        </div>
        <div className="fgm-gate-stats">
          <span className="fgm-stat"><Eye className="h-3.5 w-3.5" /> {gate.viewCount}</span>
          <span className="fgm-stat"><Unlock className="h-3.5 w-3.5" /> {gate.unlockCount}</span>
        </div>
        <div className="fgm-gate-actions">
          <button
            className="fgm-toggle-btn"
            onClick={onToggle}
            title={gate.isActive ? 'Deactivate' : 'Activate'}
            aria-label={gate.isActive ? 'Deactivate gate' : 'Activate gate'}
          >
            {gate.isActive
              ? <ToggleRight className="h-5 w-5 text-emerald-500" />
              : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fgm-icon-btn"
            title="Preview gate"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            className="fgm-icon-btn fgm-icon-btn--danger"
            onClick={onDelete}
            title="Delete gate"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            className="fgm-icon-btn"
            onClick={() => setExpanded((v) => !v)}
            title="Toggle details"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="fgm-gate-details">
          {gate.description && (
            <p className="fgm-gate-desc">{gate.description}</p>
          )}
          <div className="fgm-gate-content-chip">
            {CONTENT_TYPE_ICONS[gate.unlockedContent.type]}
            <span>{CONTENT_TYPE_LABELS[gate.unlockedContent.type]}: <strong>{gate.unlockedContent.label}</strong></span>
          </div>
          <div className="fgm-gate-embed">
            <p className="fgm-gate-embed-label">Embed on profile — copy gate ID:</p>
            <code className="fgm-gate-embed-code">{gate.id}</code>
          </div>
          <div className="fgm-gate-meta-row">
            <span>Status: <strong>{gate.isActive ? 'Active' : 'Inactive'}</strong></span>
            <span>Created: {new Date(gate.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Create Gate Form ───────────────────────────────────────────────────────────

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

function CreateGateForm({
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

  const set = (field: keyof CreateFormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const selectedConn = igConnections.find((c) => c.id === form.igConnectionId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!selectedConn) { setError('Select an Instagram account'); return; }
    if (!form.contentLabel.trim()) { setError('Content label is required'); return; }
    if (['link', 'file', 'video'].includes(form.contentType) && !form.contentUrl.trim()) {
      setError('URL is required for this content type'); return;
    }
    if (['coupon', 'message'].includes(form.contentType) && !form.contentText.trim()) {
      setError('Text / code is required for this content type'); return;
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
          igUsername: selectedConn.username,
          igUserId: selectedConn.platform_user_id,
          unlockedContent,
          ctaText: form.ctaText,
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
    <form className="fgm-create-form" onSubmit={handleSubmit} id="create-gate-form">
      <div className="fgm-create-header">
        <h2 className="fgm-create-title">Create Unlock Gate</h2>
        <button type="button" className="fgm-icon-btn" onClick={onCancel}>
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && <p className="fgm-form-error" role="alert">{error}</p>}

      <div className="fgm-form-grid">
        {/* Gate title */}
        <div className="fgm-field fgm-field--full">
          <label htmlFor="gate-title" className="fgm-label">Gate title *</label>
          <input
            id="gate-title"
            className="fgm-input"
            placeholder="e.g. Exclusive discount for followers"
            value={form.title}
            onChange={set('title')}
            required
          />
        </div>

        {/* Description */}
        <div className="fgm-field fgm-field--full">
          <label htmlFor="gate-desc" className="fgm-label">Description <span className="fgm-optional">(optional)</span></label>
          <textarea
            id="gate-desc"
            className="fgm-input fgm-textarea"
            placeholder="Tell visitors what they'll get…"
            value={form.description}
            onChange={set('description')}
            rows={2}
          />
        </div>

        {/* Instagram account */}
        <div className="fgm-field">
          <label htmlFor="gate-ig" className="fgm-label">Instagram account to follow *</label>
          {igConnections.length === 0 ? (
            <p className="fgm-field-hint">No Instagram account connected. Go to Settings → Integrations.</p>
          ) : (
            <select
              id="gate-ig"
              className="fgm-input fgm-select"
              value={form.igConnectionId}
              onChange={set('igConnectionId')}
            >
              {igConnections.map((c) => (
                <option key={c.id} value={c.id}>@{c.username}</option>
              ))}
            </select>
          )}
        </div>

        {/* CTA text */}
        <div className="fgm-field">
          <label htmlFor="gate-cta" className="fgm-label">Button text</label>
          <input
            id="gate-cta"
            className="fgm-input"
            value={form.ctaText}
            onChange={set('ctaText')}
            placeholder="Follow to unlock"
          />
        </div>

        {/* Content type */}
        <div className="fgm-field">
          <label htmlFor="gate-content-type" className="fgm-label">What to unlock *</label>
          <select
            id="gate-content-type"
            className="fgm-input fgm-select"
            value={form.contentType}
            onChange={(e) => setForm((prev) => ({
              ...prev,
              contentType: e.target.value as UnlockedContentType,
              contentUrl: '',
              contentText: '',
            }))}
          >
            {Object.entries(CONTENT_TYPE_LABELS).map(([type, label]) => (
              <option key={type} value={type}>{label}</option>
            ))}
          </select>
        </div>

        {/* Content label */}
        <div className="fgm-field">
          <label htmlFor="gate-content-label" className="fgm-label">Content label *</label>
          <input
            id="gate-content-label"
            className="fgm-input"
            placeholder={form.contentType === 'coupon' ? 'e.g. 30% off coupon' : form.contentType === 'link' ? 'e.g. Free course' : 'Label'}
            value={form.contentLabel}
            onChange={set('contentLabel')}
            required
          />
        </div>

        {/* URL field for link/file/video */}
        {['link', 'file', 'video'].includes(form.contentType) && (
          <div className="fgm-field fgm-field--full">
            <label htmlFor="gate-content-url" className="fgm-label">URL *</label>
            <input
              id="gate-content-url"
              className="fgm-input"
              type="url"
              placeholder="https://"
              value={form.contentUrl}
              onChange={set('contentUrl')}
              required
            />
          </div>
        )}

        {/* Text field for coupon/message */}
        {['coupon', 'message'].includes(form.contentType) && (
          <div className="fgm-field fgm-field--full">
            <label htmlFor="gate-content-text" className="fgm-label">
              {form.contentType === 'coupon' ? 'Coupon code *' : 'Message text *'}
            </label>
            <textarea
              id="gate-content-text"
              className="fgm-input fgm-textarea"
              placeholder={form.contentType === 'coupon' ? 'SAVE30' : 'Your secret message…'}
              value={form.contentText}
              onChange={set('contentText')}
              rows={form.contentType === 'message' ? 4 : 2}
              required
            />
          </div>
        )}

        {/* Expiry for coupons */}
        {form.contentType === 'coupon' && (
          <div className="fgm-field">
            <label htmlFor="gate-content-expiry" className="fgm-label">Coupon expiry <span className="fgm-optional">(optional)</span></label>
            <input
              id="gate-content-expiry"
              className="fgm-input"
              type="date"
              value={form.contentExpiry}
              onChange={set('contentExpiry')}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="fgm-form-actions">
        <button type="button" className="fgm-btn fgm-btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button
          id="submit-gate-btn"
          type="submit"
          className="fgm-btn fgm-btn--primary"
          disabled={saving || igConnections.length === 0}
        >
          {saving ? 'Creating…' : 'Create Gate'}
        </button>
      </div>
    </form>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="fgm-empty">
      <div className="fgm-empty-icon"><Lock className="h-8 w-8" /></div>
      <h2 className="fgm-empty-title">No gates yet</h2>
      <p className="fgm-empty-desc">
        Lock exclusive content — links, files, coupons, videos — behind an Instagram follow.
        Your audience follows you, content unlocks instantly.
      </p>
      <button className="fgm-btn fgm-btn--primary" onClick={onCreate}>
        <Plus className="h-4 w-4" /> Create your first gate
      </button>
    </div>
  );
}

function GateSkeleton() {
  return (
    <div className="fgm-gate-list">
      {[0, 1].map((i) => (
        <div key={i} className="fgm-gate-card fgm-gate-card--skeleton">
          <div className="fgm-skeleton-line" style={{ width: '40%' }} />
          <div className="fgm-skeleton-line" style={{ width: '60%' }} />
        </div>
      ))}
    </div>
  );
}
