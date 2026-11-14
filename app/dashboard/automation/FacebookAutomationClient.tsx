'use client';

import React, { useState, useEffect, useCallback } from 'react';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface FacebookAutomationConfig {
  enabled: boolean;
  autoReplyComments: boolean;
  autoReplyPositive: boolean;
  autoReplyQuestions: boolean;
  autoReplyLinkRequests: boolean;
  autoReplyPurchaseIntent: boolean;
  autoHideSpam: boolean;
  autoReplyDm: boolean;
  linkUrl: string | null;
  customInstructions: string | null;
  brandPersona: string | null;
  flagNegative: boolean;
  flagSpam: boolean;
  maxRepliesPerHour: number;
  dmMaxRepliesPerHour: number;
  jitterMinSeconds: number;
  jitterMaxSeconds: number;
  pageId?: string;
}

interface FacebookCommentLog {
  id: string;
  comment_id: string;
  post_id?: string;
  comment_text: string;
  commenter_name?: string;
  classification?: string;
  confidence?: number;
  suggested_reply?: string | null;
  auto_replied: boolean;
  delivery_status?: string;
  flagged_for_review?: boolean;
  reasoning?: string | null;
  dm_sent?: boolean;
  created_at: string;
}

const DEFAULT_CONFIG: FacebookAutomationConfig = {
  enabled: false,
  autoReplyComments: true,
  autoReplyPositive: true,
  autoReplyQuestions: true,
  autoReplyLinkRequests: true,
  autoReplyPurchaseIntent: true,
  autoHideSpam: true,
  autoReplyDm: true,
  linkUrl: null,
  customInstructions: 'Never mention competitor platforms. Keep replies under 2 sentences. Direct technical queries to our documentation.',
  brandPersona: 'Thoughtful, consultative founder tone. Direct, insightful, and authoritative. Never corporate jargon or sycophantic. Reflects high standards.',
  flagNegative: true,
  flagSpam: true,
  maxRepliesPerHour: 20,
  dmMaxRepliesPerHour: 20,
  jitterMinSeconds: 20,
  jitterMaxSeconds: 90,
};

const FACEBOOK_COMMENT_PRESETS = [
  { label: 'Resource / Link Ask', text: 'Where can I sign up for this? Can you send me the link?', caption: 'New platform update just went live for creators and founders.' },
  { label: 'Commercial Pricing Query', text: 'How much is the pro plan? Is there a free trial available?', caption: 'Everything included in the UNOOL growth suite.' },
  { label: 'Customer Praise', text: 'This automation has completely streamlined our workflow! Incredible work.', caption: 'Behind the scenes building async tools.' },
  { label: 'Product Question', text: 'Does this integrate directly with our existing webhooks and database?', caption: 'Full technical breakdown of our webhook engine.' },
  { label: 'Spam / Promotion', text: 'MAKE $10,000 PER WEEK FROM HOME CLICK MY PROFILE RIGHT NOW!!', caption: 'Community updates and live stream announcement.' },
];

const CLASSIFICATION_STYLES: Record<string, { label: string; bg: string; color: string; border: string; dot: string }> = {
  positive:        { label: 'Positive / Praise',        bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0', dot: '#10B981' },
  question:        { label: 'Audience Question',         bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE', dot: '#3B82F6' },
  link_request:    { label: 'Resource / Link Ask',       bg: '#F5F3FF', color: '#5B21B6', border: '#DDD6FE', dot: '#8B5CF6' },
  purchase_intent: { label: 'Commercial / Buyer Intent', bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
  negative:        { label: 'Negative / Critical',       bg: '#FFF1F2', color: '#9F1239', border: '#FECDD3', dot: '#EF4444' },
  spam:            { label: 'Spam / Automated',          bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', dot: '#94A3B8' },
  harmful:         { label: 'Flagged / Moderation',      bg: '#450A0A', color: '#FEE2E2', border: '#7F1D1D', dot: '#F43F5E' },
  unrelated:       { label: 'General Remark',            bg: '#F8FAFC', color: '#475569', border: '#E2E8F0', dot: '#94A3B8' },
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const SvgGrid = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const SvgPlay = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M4 3l9 5-9 5V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);
const SvgLedger = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l3 3 3-3h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const SvgTriage = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M8 2l1.5 3H13l-2.5 2 1 3L8 8.5 5.5 10l1-3L4 5h3.5L8 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
  </svg>
);
const SvgMessage = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M13 1H3a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2v3l4-3h4a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const SvgClock = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M8 4.5V8l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const SvgPen = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M12 2l2 2-9 9H3v-2l9-9z" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const SvgMail = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M1 4l7 5 7-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// ─── Capsule Toggle ───────────────────────────────────────────────────────────
function CapsuleToggle({
  checked,
  onChange,
  color = 'color-blue',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}) {
  return (
    <label className={`un-capsule-toggle ${color}`} style={{ cursor: 'pointer', flexShrink: 0 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ display: 'none' }}
      />
      <div className="un-capsule-track" />
      <div className="un-capsule-thumb" />
    </label>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FacebookAutomationClient({
  workspaceId,
  userId,
}: {
  workspaceId: string;
  userId?: string;
}) {
  const [config, setConfig] = useState<FacebookAutomationConfig>(DEFAULT_CONFIG);
  const [fbConnection, setFbConnection] = useState<{ status: 'connected' | 'not_connected' | 'expired'; username?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'control' | 'simulator' | 'feed' | 'triage'>('control');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Feed & comments
  const [comments, setComments] = useState<FacebookCommentLog[]>([]);
  const [commentStats, setCommentStats] = useState<{ total: number; autoReplied: number; flagged: number } | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);

  // Triage (flagged)
  const [triageItems, setTriageItems] = useState<FacebookCommentLog[]>([]);
  const [loadingTriage, setLoadingTriage] = useState(false);

  // Simulator
  const [simComment, setSimComment] = useState(FACEBOOK_COMMENT_PRESETS[0].text);
  const [simCaption, setSimCaption] = useState(FACEBOOK_COMMENT_PRESETS[0].caption);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{
    classification?: string;
    confidence?: number;
    shouldAutoReply?: boolean;
    suggestedReply?: string;
    shouldSendDM?: boolean;
    suggestedDM?: string | null;
    reasoning?: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), type === 'error' ? 5500 : 3500);
  };

  const updateConfig = (patch: Partial<FacebookAutomationConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
  };

  // ── Load Platform Connection Status and Handle OAuth Feedback ──
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#_=_' || window.location.hash === '#_') {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      const params = new URLSearchParams(window.location.search);
      const connected = params.get('connected');
      const err = params.get('error');
      const detail = params.get('detail') || params.get('description');
      if (connected === 'facebook') {
        showToast('Facebook Page connected successfully!', 'success');
        params.delete('connected');
        window.history.replaceState(null, '', `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`);
      } else if (err) {
        const msg = err === 'missing_credentials'
          ? 'Missing Facebook App ID (FACEBOOK_CLIENT_ID). Please check your .env.local file.'
          : `Facebook connection failed: ${detail || err}`;
        showToast(msg, 'error');
        params.delete('error');
        params.delete('detail');
        params.delete('description');
        params.delete('platform');
        window.history.replaceState(null, '', `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`);
      }
    }

    fetch('/api/platform/connections', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const fb = data?.connections?.facebook;
        if (fb && fb.status === 'connected') {
          setFbConnection({ status: 'connected', username: fb.username || 'Facebook Page' });
        } else {
          setFbConnection({ status: 'not_connected' });
        }
      })
      .catch(() => setFbConnection({ status: 'not_connected' }));
  }, []);

  // ── Load Config ──
  useEffect(() => {
    if (!workspaceId) { setLoading(false); return; }
    fetch(`/api/facebook/automation?workspaceId=${workspaceId}`)
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setConfig({ ...DEFAULT_CONFIG, ...data });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceId]);

  // ── Load Comments ──
  const loadComments = useCallback(async () => {
    if (!workspaceId) return;
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/facebook/comments?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        setTriageItems((data.comments || []).filter((c: FacebookCommentLog) => c.flagged_for_review));
        if (data.stats) setCommentStats(data.stats);
      }
    } catch {}
    finally { setLoadingComments(false); }
  }, [workspaceId]);

  // ── Load Triage ──
  const loadTriage = useCallback(async () => {
    if (!workspaceId) return;
    setLoadingTriage(true);
    try {
      const res = await fetch(`/api/facebook/comments?workspaceId=${workspaceId}&flagged=true`);
      if (res.ok) {
        const data = await res.json();
        setTriageItems(data.comments || []);
      }
    } catch {}
    finally { setLoadingTriage(false); }
  }, [workspaceId]);

  useEffect(() => {
    if (activeTab === 'feed') loadComments();
    if (activeTab === 'triage') loadTriage();
  }, [activeTab, loadComments, loadTriage]);

  // ── Save Config ──
  const handleSave = async (overrides?: Partial<FacebookAutomationConfig>) => {
    if (!workspaceId) return;
    setSaving(true);
    const payload = { workspaceId, ...(overrides ? { ...config, ...overrides } : config) };
    try {
      const res = await fetch('/api/facebook/automation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        if (overrides) setConfig(prev => ({ ...prev, ...overrides }));
        showToast('Facebook automation settings saved!', 'success');
      } else {
        const errorMsg = data?.error || data?.message || 'Failed to save settings';
        showToast(errorMsg, 'error');
      }
    } catch {
      showToast('Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Run Simulator ──
  const runSimulation = async () => {
    if (!workspaceId || !simComment.trim()) return;
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await fetch('/api/facebook/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          commentText: simComment,
          postCaption: simCaption,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSimResult(data);
      } else {
        showToast(data.error || 'Simulation failed', 'error');
      }
    } catch {
      showToast('Simulation request failed', 'error');
    } finally {
      setSimulating(false);
    }
  };

  const flaggedCount = commentStats?.flagged ?? triageItems.length;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '90px 0', background: '#FDFBF7' }}>
        <div className="un-spinner" />
        <p style={{ color: '#8B7355', fontSize: 14, fontWeight: 500, marginTop: 12 }}>Calibrating SignalFB Engine...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 60px' }}>
      {toast && (
        <div className={`un-toast un-toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* ── Facebook Editorial Header ── */}
      <div className="un-header" style={{ borderBottom: '1px solid #EBE5D8', background: '#FFFDF9' }}>
        <div className="un-header-max">
          <div className="un-top-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="un-logo-jewel" style={{ background: '#1877F2', color: '#FFF' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <div>
                <div className="un-title un-editorial-font" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>SignalFB</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: '#EBF5FF', color: '#1877F2', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Facebook Pages
                  </span>
                </div>
                <div className="un-subtitle">Autonomous Facebook Page Inbound Comment Moderation &amp; Messenger Lead Dispatch</div>
              </div>
            </div>

            {/* Status Jewel & Connection */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {fbConnection?.status === 'connected' ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 20, background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: 12.5, fontWeight: 600, color: '#1D4ED8' }}>
                  <span className="un-pulse-dot" style={{ background: '#1877F2' }} />
                  <span>@{fbConnection.username || 'facebook_page'}</span>
                  <span style={{ color: '#1E40AF', opacity: 0.7, fontSize: 11 }}>Active API</span>
                </div>
              ) : (
                <a href={`/api/auth/platform/connect?platform=facebook&workspaceId=${workspaceId || ''}&userId=${userId || ''}&returnUrl=${encodeURIComponent('/dashboard/automation?platform=facebook')}`} className="un-btn un-btn-primary" style={{ padding: '6px 14px', fontSize: 12.5, background: '#1877F2' }}>
                  Connect Facebook Page
                </a>
              )}
            </div>
          </div>

          {/* Sub-tabs Navigation */}
          <div className="un-tabs-bar">
            {[
              { id: 'control',   label: 'Engine Controls', icon: <SvgGrid /> },
              { id: 'simulator', label: 'Intent Lab',       icon: <SvgPlay /> },
              { id: 'feed',      label: 'Dispatch Ledger',  icon: <SvgLedger />, badge: commentStats?.total },
              { id: 'triage',    label: 'Triage Queue',     icon: <SvgTriage />, badge: flaggedCount || undefined },
            ].map(tab => (
              <button
                key={tab.id}
                className={`un-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id as 'control' | 'simulator' | 'feed' | 'triage')}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge ? <span className="un-tab-badge">{tab.badge}</span> : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Workspace Body ── */}
      <div className="un-body">

        {/* ════ TAB 1: ENGINE CONTROLS ════ */}
        {activeTab === 'control' && (
          <div>
            {/* Not Connected Banner */}
            {fbConnection?.status !== 'connected' && (
              <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 16, padding: '16px 22px', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: '#1E40AF', fontWeight: 700, fontSize: 14 }}>Facebook Page Not Linked</div>
                  <div style={{ color: '#1E3A8A', fontSize: 12.5, marginTop: 2 }}>Connect your Facebook Page to enable autonomous comment replies, spam filtering, and private Messenger follow-ups.</div>
                </div>
                <a href={`/api/auth/platform/connect?platform=facebook&workspaceId=${workspaceId || ''}&userId=${userId || ''}&returnUrl=${encodeURIComponent('/dashboard/automation?platform=facebook')}`} className="un-btn un-btn-primary" style={{ fontSize: 12.5, background: '#1877F2' }}>Connect Page</a>
              </div>
            )}

            {/* Master Hero Toggle */}
            <div className="un-master-hero">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 className="un-editorial-font" style={{ fontSize: 20, fontWeight: 700, color: '#3D2B1F', margin: 0 }}>
                      Autonomous Facebook Dispatcher
                    </h3>
                    <span className={`un-hero-status-pill ${config.enabled ? 'un-hero-status-live' : 'un-hero-status-idle'}`}>
                      {config.enabled && <span className="un-pulse-dot" style={{ background: '#1877F2' }} />}
                      {config.enabled ? 'Real-Time Active' : 'Standby Mode'}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#8B7355', margin: '4px 0 0', fontWeight: 500 }}>
                    {config.enabled
                      ? 'Inbound Facebook Page comments are classified by AI intent, verified for safety, and replied with humanized Poisson pacing.'
                      : 'Automation is paused. New Facebook comments will be logged in the dispatch ledger without auto-replying.'}
                  </p>
                </div>
              </div>
              <label
                className="un-master-switch"
                title={config.enabled ? 'Click to pause automation' : 'Click to activate automation'}
                style={{ cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                <input
                  type="checkbox"
                  checked={config.enabled}
                  disabled={saving}
                  onChange={e => {
                    const nextVal = e.target.checked;
                    updateConfig({ enabled: nextVal });
                    handleSave({ enabled: nextVal });
                  }}
                />
                <div className="un-master-track" />
                <div className="un-master-thumb">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M7 1v5M3.5 3.5A5 5 0 1010.5 3.5"
                      stroke={config.enabled ? '#C4A265' : '#A69279'}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </label>
            </div>

            {/* Two-Column Grid */}
            <div className="un-grid-2" style={{ marginTop: 22 }}>

              {/* ── Column 1 ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Comment Intent Recognition */}
                <div className="un-card">
                  <div className="un-card-header">
                    <div className="un-card-title">
                      <div className="un-card-title-icon" style={{ background: '#EBF5FF', color: '#1877F2' }}><SvgMessage /></div>
                      <span>Comment Intent Recognition Protocols</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#8B7355', background: '#F5EFE2', padding: '2px 8px', borderRadius: 6 }}>Bespoke Rocker Controls</span>
                  </div>

                  {[
                    { key: 'autoReplyPositive',      color: 'color-emerald',  label: 'Praise & Community Delight',   desc: 'Warm acknowledgments for testimonials, applause, and appreciation.' },
                    { key: 'autoReplyQuestions',     color: 'color-sapphire', label: 'Direct Knowledge Queries',     desc: 'Context-aware factual replies to product & technical questions.' },
                    { key: 'autoReplyLinkRequests',  color: 'color-amethyst', label: 'Resource & Link Dispatch',     desc: 'Public reply + optional private Messenger delivery for resource requests.' },
                    { key: 'autoReplyPurchaseIntent',color: 'color-amber',    label: 'Buyer & Commercial Intent',    desc: 'High-priority routing for pricing asks and purchase signals.' },
                    { key: 'flagNegative',           color: 'color-coral',    label: 'Flag Negative Sentiment',      desc: 'Route dissatisfied remarks directly to human triage queue.' },
                    { key: 'flagSpam',               color: 'color-coral',    label: 'Filter Spam & Bot Comments',   desc: 'Auto-quarantine repetitive scams, bots, and malicious links.' },
                    { key: 'autoHideSpam',           color: 'color-coral',    label: 'Spam Auto-Hide via Page API',  desc: 'Hides confirmed spam from your Page using Facebook moderation API.' },
                  ].map(({ key, color, label, desc }) => (
                    <div className="un-rule-row" key={key}>
                      <div style={{ paddingRight: 16 }}>
                        <div className="un-rule-name">{label}</div>
                        <div className="un-rule-desc">{desc}</div>
                      </div>
                      <CapsuleToggle
                        checked={!!(config as unknown as Record<string, unknown>)[key]}
                        onChange={v => { updateConfig({ [key]: v } as Partial<FacebookAutomationConfig>); handleSave({ [key]: v } as Partial<FacebookAutomationConfig>); }}
                        color={color}
                      />
                    </div>
                  ))}
                </div>

                {/* Delivery Rate Safeguards */}
                <div className="un-card">
                  <div className="un-card-header">
                    <div className="un-card-title">
                      <div className="un-card-title-icon" style={{ background: '#FEF3C7', color: '#D97706' }}><SvgClock /></div>
                      <span>Delivery Rate Safeguards &amp; Natural Jitter</span>
                    </div>
                  </div>

                  <div className="un-field">
                    <label className="un-label">Maximum Hourly Comment Reply Velocity</label>
                    <div className="un-slider-container">
                      <input
                        type="range"
                        className="un-slider"
                        min={5}
                        max={60}
                        value={config.maxRepliesPerHour}
                        onChange={e => updateConfig({ maxRepliesPerHour: parseInt(e.target.value) })}
                        onMouseUp={() => handleSave({ maxRepliesPerHour: config.maxRepliesPerHour })}
                      />
                      <span className="un-slider-pill">{config.maxRepliesPerHour} / hr</span>
                    </div>
                  </div>

                  <div className="un-field">
                    <label className="un-label">Maximum Hourly Messenger DM Velocity</label>
                    <div className="un-slider-container">
                      <input
                        type="range"
                        className="un-slider"
                        min={1}
                        max={30}
                        value={config.dmMaxRepliesPerHour}
                        onChange={e => updateConfig({ dmMaxRepliesPerHour: parseInt(e.target.value) })}
                        onMouseUp={() => handleSave({ dmMaxRepliesPerHour: config.dmMaxRepliesPerHour })}
                      />
                      <span className="un-slider-pill">{config.dmMaxRepliesPerHour} / hr</span>
                    </div>
                  </div>

                  <div className="un-field" style={{ marginBottom: 4 }}>
                    <label className="un-label">Human Timing Variance (Poisson Latency)</label>
                    <div className="un-slider-container">
                      <input
                        type="range"
                        className="un-slider"
                        min={5}
                        max={120}
                        value={config.jitterMinSeconds}
                        onChange={e => updateConfig({ jitterMinSeconds: parseInt(e.target.value) })}
                        onMouseUp={() => handleSave({ jitterMinSeconds: config.jitterMinSeconds })}
                      />
                      <span className="un-slider-pill">{config.jitterMinSeconds}s</span>
                      <span style={{ color: '#A69279', fontWeight: 700 }}>–</span>
                      <input
                        type="range"
                        className="un-slider"
                        min={60}
                        max={300}
                        value={config.jitterMaxSeconds}
                        onChange={e => updateConfig({ jitterMaxSeconds: parseInt(e.target.value) })}
                        onMouseUp={() => handleSave({ jitterMaxSeconds: config.jitterMaxSeconds })}
                      />
                      <span className="un-slider-pill">{config.jitterMaxSeconds}s</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#8B7355', marginTop: 8 }}>
                      Introduces randomized delay between detection and posting, preserving natural creator timing profiles and avoiding Meta rate-limit flags.
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Column 2 ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Brand Voice Studio */}
                <div className="un-card">
                  <div className="un-card-header">
                    <div className="un-card-title">
                      <div className="un-card-title-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}><SvgPen /></div>
                      <span>Brand Voice &amp; Resource Delivery</span>
                    </div>
                  </div>

                  <div className="un-field">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label className="un-label" style={{ margin: 0 }}>Canonical Resource Link (Dispatched for link requests)</label>
                    </div>
                    <input
                      type="url"
                      className="un-input"
                      placeholder="https://unool.co/u/yourbrand"
                      value={config.linkUrl || ''}
                      onChange={e => updateConfig({ linkUrl: e.target.value || null })}
                      onBlur={() => handleSave({ linkUrl: config.linkUrl })}
                    />
                    <p style={{ fontSize: 11.5, color: '#8B7355', margin: '4px 0 0' }}>Delivered when audience members ask for links, templates, or resources in comments.</p>
                  </div>

                  <div className="un-field">
                    <label className="un-label">Brand Editorial Persona</label>
                    <textarea
                      className="un-input un-textarea"
                      rows={3}
                      value={config.brandPersona || ''}
                      onChange={e => updateConfig({ brandPersona: e.target.value || null })}
                      onBlur={() => handleSave({ brandPersona: config.brandPersona })}
                      placeholder="Thoughtful, consultative founder tone. Direct, insightful, and authoritative. Never corporate jargon or sycophantic."
                    />
                  </div>

                  <div className="un-field">
                    <label className="un-label">Boundary Instructions &amp; Prohibitions</label>
                    <textarea
                      className="un-input un-textarea"
                      rows={3}
                      value={config.customInstructions || ''}
                      onChange={e => updateConfig({ customInstructions: e.target.value || null })}
                      onBlur={() => handleSave({ customInstructions: config.customInstructions })}
                      placeholder="Never mention competitor platforms. Keep replies under 2 sentences. Direct technical queries to our documentation."
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      type="button"
                      className="un-btn un-btn-primary"
                      onClick={() => handleSave()}
                      disabled={saving}
                      style={{ background: '#1877F2' }}
                    >
                      {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>
                </div>

                {/* Messenger Private Reply Concierge */}
                <div className="un-card">
                  <div className="un-card-header">
                    <div className="un-card-title">
                      <div className="un-card-title-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}><SvgMail /></div>
                      <span>Messenger Private Reply Concierge</span>
                    </div>
                  </div>

                  <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
                    <div style={{ fontSize: 12.5, color: '#1E40AF', lineHeight: 1.5 }}>
                      <strong>Meta 7-Day Messaging Window:</strong> Private Messenger replies can only be sent to users who have interacted with your Page within the last 7 days. All Messenger dispatches are strictly policy-compliant.
                    </div>
                  </div>

                  {[
                    { key: 'autoReplyDm', color: 'color-sapphire', label: 'Messenger Private Reply on Link Requests', desc: 'Sends a private Messenger DM to commenters requesting resource links, within the 7-day Meta window.' },
                  ].map(({ key, color, label, desc }) => (
                    <div className="un-rule-row" key={key}>
                      <div style={{ paddingRight: 16 }}>
                        <div className="un-rule-name">{label}</div>
                        <div className="un-rule-desc">{desc}</div>
                      </div>
                      <CapsuleToggle
                        checked={!!(config as unknown as Record<string, unknown>)[key]}
                        onChange={v => { updateConfig({ [key]: v } as Partial<FacebookAutomationConfig>); handleSave({ [key]: v } as Partial<FacebookAutomationConfig>); }}
                        color={color}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ TAB 2: INTENT LAB / SIMULATOR ════ */}
        {activeTab === 'simulator' && (
          <div className="un-card">
            <div className="un-card-header">
              <div className="un-card-title">
                <div className="un-card-title-icon" style={{ background: '#ECFDF5', color: '#059669' }}><SvgPlay /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#3D2B1F' }}>Facebook Intent Lab (Live Simulator)</div>
                  <div style={{ fontSize: 12.5, color: '#8B7355', marginTop: 2 }}>
                    Test how the AI categorizes Facebook comments and drafts responses based on your current settings before going live.
                  </div>
                </div>
              </div>
            </div>

            {/* Presets */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {FACEBOOK_COMMENT_PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  className="un-btn un-btn-secondary"
                  style={{ fontSize: 12, padding: '5px 12px' }}
                  onClick={() => {
                    setSimComment(p.text);
                    setSimCaption(p.caption);
                    setSimResult(null);
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="un-grid-2">
              <div>
                <div className="un-field">
                  <label className="un-label">Simulated Facebook Comment</label>
                  <textarea
                    className="un-input un-textarea"
                    rows={4}
                    value={simComment}
                    onChange={e => setSimComment(e.target.value)}
                    placeholder="Enter a comment to test..."
                  />
                </div>
                <div className="un-field">
                  <label className="un-label">Simulated Post Context</label>
                  <input
                    type="text"
                    className="un-input"
                    value={simCaption}
                    onChange={e => setSimCaption(e.target.value)}
                    placeholder="Context of the Facebook post..."
                  />
                </div>
                <button
                  type="button"
                  className="un-btn un-btn-primary"
                  onClick={runSimulation}
                  disabled={simulating}
                  style={{ background: '#1877F2' }}
                >
                  {simulating ? 'Analyzing Intent...' : 'Test AI Response'}
                </button>
              </div>

              {/* Simulation Result */}
              <div>
                <label className="un-label">AI Diagnostic Output</label>
                {simResult ? (
                  <div style={{ background: '#FFFDF9', border: '1.5px solid #EBE5D8', borderRadius: 14, padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 20,
                          background: CLASSIFICATION_STYLES[simResult.classification || 'unrelated']?.bg || '#F8FAFC',
                          color: CLASSIFICATION_STYLES[simResult.classification || 'unrelated']?.color || '#3D2B1F',
                          border: `1px solid ${CLASSIFICATION_STYLES[simResult.classification || 'unrelated']?.border || '#E2E8F0'}`,
                        }}
                      >
                        {CLASSIFICATION_STYLES[simResult.classification || 'unrelated']?.label || simResult.classification}
                      </span>
                      <span style={{ fontSize: 12, color: '#8B7355', fontWeight: 600 }}>
                        Confidence: {Math.round((simResult.confidence || 0) * 100)}%
                      </span>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#8B7355', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                        Public Comment Reply
                      </div>
                      <div style={{ fontSize: 13.5, color: '#3D2B1F', background: '#F8F6F0', padding: '10px 14px', borderRadius: 10, lineHeight: 1.5 }}>
                        {simResult.suggestedReply || 'No reply generated (policy skip).'}
                      </div>
                    </div>

                    {simResult.shouldSendDM && simResult.suggestedDM && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1877F2', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                          Messenger Private Reply
                        </div>
                        <div style={{ fontSize: 13, color: '#1E3A8A', background: '#EFF6FF', padding: '10px 14px', borderRadius: 10, lineHeight: 1.5, border: '1px solid #BFDBFE' }}>
                          {simResult.suggestedDM}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8, background: simResult.shouldAutoReply ? '#ECFDF5' : '#FEF2F2', color: simResult.shouldAutoReply ? '#059669' : '#991B1B' }}>
                        {simResult.shouldAutoReply ? '✓ Will Auto-Reply' : '✗ Skipped by Policy'}
                      </span>
                      {simResult.shouldSendDM && (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8' }}>
                          + Messenger DM
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: '#8B7355', fontStyle: 'italic', marginTop: 10 }}>
                      Reasoning: {simResult.reasoning}
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#F8F6F0', border: '1px dashed #D5CCA8', borderRadius: 14, padding: 36, textAlign: 'center', color: '#8B7355', fontSize: 13 }}>
                    Run a simulation to view classified intent, generated replies, and safety diagnostics.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════ TAB 3: DISPATCH LEDGER ════ */}
        {activeTab === 'feed' && (
          <div className="un-card">
            <div className="un-card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div className="un-card-title">
                <div className="un-card-title-icon" style={{ background: '#F0FDF4', color: '#16A34A' }}><SvgLedger /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#3D2B1F' }}>Facebook Dispatch Ledger</div>
                  <div style={{ fontSize: 12.5, color: '#8B7355', marginTop: 2 }}>Real-time audit log of Facebook comments processed by the autonomous engine.</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {commentStats && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#F0FDF4', color: '#059669', border: '1px solid #A7F3D0' }}>{commentStats.autoReplied} replied</span>
                    {commentStats.flagged > 0 && <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>{commentStats.flagged} flagged</span>}
                  </div>
                )}
                <button
                  type="button"
                  className="un-btn un-btn-secondary"
                  onClick={loadComments}
                  disabled={loadingComments}
                  style={{ fontSize: 12 }}
                >
                  {loadingComments ? 'Refreshing...' : 'Refresh Ledger'}
                </button>
              </div>
            </div>

            {loadingComments ? (
              <div style={{ textAlign: 'center', padding: 40 }}><div className="un-spinner" /></div>
            ) : comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#8B7355' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#3D2B1F', marginBottom: 6 }}>No Facebook Comments Recorded Yet</div>
                <div style={{ fontSize: 13 }}>When audience members comment on your Facebook Page posts, interactions will be logged here automatically.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #EBE5D8', textAlign: 'left', color: '#8B7355' }}>
                      <th style={{ padding: '10px 12px' }}>Commenter</th>
                      <th style={{ padding: '10px 12px' }}>Comment</th>
                      <th style={{ padding: '10px 12px' }}>Intent</th>
                      <th style={{ padding: '10px 12px' }}>AI Reply</th>
                      <th style={{ padding: '10px 12px' }}>DM</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px' }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comments.map((c) => {
                      const cls = CLASSIFICATION_STYLES[c.classification || 'unrelated'] || CLASSIFICATION_STYLES.unrelated;
                      return (
                        <tr key={c.id} style={{ borderBottom: '1px solid #F3EFE6' }}>
                          <td style={{ padding: '12px', fontWeight: 600, color: '#3D2B1F' }}>{c.commenter_name || 'Community Member'}</td>
                          <td style={{ padding: '12px', color: '#3D2B1F', maxWidth: 200 }}>{c.comment_text}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: cls.bg, color: cls.color, border: `1px solid ${cls.border}` }}>
                              {cls.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#8B7355', maxWidth: 240 }}>{c.suggested_reply || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>No reply sent</span>}</td>
                          <td style={{ padding: '12px' }}>
                            {c.dm_sent ? <span style={{ fontSize: 11, fontWeight: 600, color: '#1D4ED8', background: '#EFF6FF', padding: '2px 7px', borderRadius: 8 }}>DM Sent</span> : <span style={{ fontSize: 11, color: '#8B7355' }}>—</span>}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: c.auto_replied ? '#059669' : c.flagged_for_review ? '#DC2626' : '#8B7355' }}>
                              {c.auto_replied ? 'Auto-Replied' : c.flagged_for_review ? 'Flagged' : 'Logged'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#8B7355', fontSize: 12 }}>
                            {new Date(c.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════ TAB 4: TRIAGE QUEUE ════ */}
        {activeTab === 'triage' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h4 className="un-editorial-font" style={{ fontSize: 18, fontWeight: 700, color: '#3D2B1F', margin: 0 }}>
                  Human Triage Queue
                </h4>
                <p style={{ fontSize: 13, color: '#8B7355', margin: '4px 0 0' }}>
                  Comments flagged for negative sentiment, escalations, or edge cases requiring your personal attention.
                </p>
              </div>
              <button
                type="button"
                className="un-btn un-btn-secondary"
                onClick={loadTriage}
                disabled={loadingTriage}
                style={{ fontSize: 12 }}
              >
                {loadingTriage ? 'Loading...' : 'Refresh Queue'}
              </button>
            </div>

            {loadingTriage ? (
              <div style={{ textAlign: 'center', padding: 40 }}><div className="un-spinner" /></div>
            ) : triageItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFDF9', borderRadius: 16, border: '1px dashed #D5CCA8' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#3D2B1F', marginBottom: 6 }}>Triage Queue Clear</div>
                <div style={{ fontSize: 13, color: '#8B7355' }}>No comments currently require your review. The AI engine is handling all inbound interactions.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {triageItems.map(item => {
                  const cls = CLASSIFICATION_STYLES[item.classification || 'negative'] || CLASSIFICATION_STYLES.negative;
                  return (
                    <div
                      key={item.id}
                      className="un-triage-card"
                      style={{
                        background: '#FFFDF9',
                        border: `1.5px solid ${item.flagged_for_review ? '#FECDD3' : '#EBE5D8'}`,
                        borderRadius: 14,
                        padding: '16px 20px',
                        display: 'flex',
                        gap: 16,
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: cls.bg, color: cls.color, border: `1px solid ${cls.border}` }}>
                            {cls.label}
                          </span>
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#3D2B1F' }}>{item.commenter_name || 'Community Member'}</span>
                          <span style={{ fontSize: 11, color: '#8B7355' }}>{new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div style={{ fontSize: 14, color: '#3D2B1F', lineHeight: 1.5, marginBottom: 8 }}>
                          &ldquo;{item.comment_text}&rdquo;
                        </div>
                        {item.reasoning && (
                          <div style={{ fontSize: 12, color: '#8B7355', fontStyle: 'italic' }}>
                            AI Reasoning: {item.reasoning}
                          </div>
                        )}
                      </div>
                      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <a
                          href={`https://www.facebook.com/${item.post_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="un-btn un-btn-secondary"
                          style={{ fontSize: 11.5, padding: '5px 12px' }}
                        >
                          View on Facebook
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
