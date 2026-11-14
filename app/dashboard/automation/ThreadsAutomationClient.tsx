'use client';

import React, { useState, useEffect, useCallback } from 'react';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface ThreadsAutomationConfig {
  enabled: boolean;
  autoReplyReplies: boolean;
  autoReplyMentions: boolean;
  autoReplyPositive: boolean;
  autoReplyQuestions: boolean;
  autoReplyLinkRequests: boolean;
  autoReplyPurchaseIntent: boolean;
  autoHideSpam: boolean;
  linkUrl: string | null;
  customInstructions: string | null;
  brandPersona: string | null;
  flagNegative: boolean;
  flagSpam: boolean;
  maxRepliesPerHour: number;
  jitterMinSeconds: number;
  jitterMaxSeconds: number;
  threadsUserId?: string;
}

interface ThreadsReplyLog {
  id: string;
  reply_id: string;
  post_id?: string;
  reply_text: string;
  replier_id?: string;
  event_type?: 'reply' | 'mention';
  classification?: string;
  confidence?: number;
  suggested_reply?: string | null;
  auto_replied: boolean;
  delivery_status?: string;
  flagged_for_review?: boolean;
  reasoning?: string | null;
  created_at: string;
}

const DEFAULT_CONFIG: ThreadsAutomationConfig = {
  enabled: false,
  autoReplyReplies: true,
  autoReplyMentions: true,
  autoReplyPositive: true,
  autoReplyQuestions: true,
  autoReplyLinkRequests: true,
  autoReplyPurchaseIntent: true,
  autoHideSpam: true,
  linkUrl: null,
  customInstructions: 'Keep replies concise, punchy, and under 500 characters. Never mention competitor platforms. Direct technical queries to our documentation.',
  brandPersona: 'Sharp, modern, punchy founder tone. Direct, insightful, and engaging. Reflects high standards without corporate fluff.',
  flagNegative: true,
  flagSpam: true,
  maxRepliesPerHour: 20,
  jitterMinSeconds: 20,
  jitterMaxSeconds: 90,
};

const THREADS_COMMENT_PRESETS = [
  { label: 'Resource / Link Ask',    text: 'Where can I get the template for this architecture? Drop the link please!',          caption: 'Just launched our open-source growth framework for founders.' },
  { label: 'Technical Question',     text: 'Are you guys using edge workers or standard serverless for webhook queuing?',         caption: 'Deep dive into our 60ms async dispatch pipeline.' },
  { label: 'Praise & Hype',         text: 'This is genuinely the cleanest UI I have seen all year. Hats off to the team!',       caption: 'A preview of our new luxury biscuit design system.' },
  { label: 'Pricing Query',          text: 'Is there a startup discount or free tier for single creators?',                       caption: 'Pricing breakdown and onboarding guarantee.' },
  { label: 'Spam Mention',           text: '@unool Check my bio to claim 1000 free followers right now!!',                       caption: 'Weekly community shoutouts.' },
];

const CLASSIFICATION_STYLES: Record<string, { label: string; bg: string; color: string; border: string; dot: string }> = {
  positive:        { label: 'Positive / Praise',        bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0', dot: '#10B981' },
  question:        { label: 'Audience Question',         bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE', dot: '#3B82F6' },
  link_request:    { label: 'Resource / Link Ask',       bg: '#F5F3FF', color: '#5B21B6', border: '#DDD6FE', dot: '#8B5CF6' },
  purchase_intent: { label: 'Commercial / Buyer Intent', bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
  negative:        { label: 'Negative / Contrarian',     bg: '#FFF1F2', color: '#9F1239', border: '#FECDD3', dot: '#EF4444' },
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
const SvgAtom = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
    <ellipse cx="8" cy="8" rx="6.5" ry="2.5" stroke="currentColor" strokeWidth="1.3"/>
    <ellipse cx="8" cy="8" rx="6.5" ry="2.5" stroke="currentColor" strokeWidth="1.3" transform="rotate(60 8 8)"/>
    <ellipse cx="8" cy="8" rx="6.5" ry="2.5" stroke="currentColor" strokeWidth="1.3" transform="rotate(120 8 8)"/>
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

export default function ThreadsAutomationClient({
  workspaceId,
  userId,
}: {
  workspaceId: string;
  userId?: string;
}) {
  const [config, setConfig] = useState<ThreadsAutomationConfig>(DEFAULT_CONFIG);
  const [threadsConnection, setThreadsConnection] = useState<{ status: 'connected' | 'not_connected' | 'expired'; username?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'control' | 'simulator' | 'feed' | 'triage'>('control');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Feed & replies
  const [replies, setReplies] = useState<ThreadsReplyLog[]>([]);
  const [replyStats, setReplyStats] = useState<{ total: number; autoReplied: number; repliesCount: number; mentionsCount: number; flagged?: number } | null>(null);
  const [loadingReplies, setLoadingReplies] = useState(false);

  // Triage (flagged)
  const [triageItems, setTriageItems] = useState<ThreadsReplyLog[]>([]);
  const [loadingTriage, setLoadingTriage] = useState(false);

  // Simulator
  const [simText, setSimText] = useState(THREADS_COMMENT_PRESETS[0].text);
  const [simCaption, setSimCaption] = useState(THREADS_COMMENT_PRESETS[0].caption);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{
    classification?: string;
    confidence?: number;
    shouldAutoReply?: boolean;
    suggestedReply?: string;
    characterCount?: number;
    maxAllowed?: number;
    reasoning?: string;
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const updateConfig = (patch: Partial<ThreadsAutomationConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
  };

  // ── Load Platform Connection Status ──
  useEffect(() => {
    fetch('/api/platform/connections', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const th = data?.connections?.threads;
        if (th && th.status === 'connected') {
          setThreadsConnection({ status: 'connected', username: th.username || 'threads_user' });
        } else {
          setThreadsConnection({ status: 'not_connected' });
        }
      })
      .catch(() => setThreadsConnection({ status: 'not_connected' }));
  }, []);

  // ── Load Config ──
  useEffect(() => {
    if (!workspaceId) { setLoading(false); return; }
    fetch(`/api/threads/automation?workspaceId=${workspaceId}`)
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setConfig({ ...DEFAULT_CONFIG, ...data });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceId]);

  // ── Load Replies ──
  const loadReplies = useCallback(async () => {
    if (!workspaceId) return;
    setLoadingReplies(true);
    try {
      const res = await fetch(`/api/threads/comments?workspaceId=${workspaceId}`);
      if (res.ok) {
        const data = await res.json();
        setReplies(data.comments || []);
        setTriageItems((data.comments || []).filter((r: ThreadsReplyLog) => r.flagged_for_review));
        if (data.stats) setReplyStats(data.stats);
      }
    } catch {}
    finally { setLoadingReplies(false); }
  }, [workspaceId]);

  // ── Load Triage ──
  const loadTriage = useCallback(async () => {
    if (!workspaceId) return;
    setLoadingTriage(true);
    try {
      const res = await fetch(`/api/threads/comments?workspaceId=${workspaceId}&flagged=true`);
      if (res.ok) {
        const data = await res.json();
        setTriageItems(data.comments || []);
      }
    } catch {}
    finally { setLoadingTriage(false); }
  }, [workspaceId]);

  useEffect(() => {
    if (activeTab === 'feed') loadReplies();
    if (activeTab === 'triage') loadTriage();
  }, [activeTab, loadReplies, loadTriage]);

  // ── Save Config ──
  const handleSave = async (overrides?: Partial<ThreadsAutomationConfig>) => {
    if (!workspaceId) return;
    setSaving(true);
    const payload = { workspaceId, ...(overrides ? { ...config, ...overrides } : config) };
    try {
      const res = await fetch('/api/threads/automation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        if (overrides) setConfig(prev => ({ ...prev, ...overrides }));
        showToast('Threads automation settings saved!', 'success');
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch {
      showToast('Error saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Run Simulator ──
  const runSimulation = async () => {
    if (!workspaceId || !simText.trim()) return;
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await fetch('/api/threads/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          commentText: simText,
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

  const flaggedCount = replyStats?.flagged ?? triageItems.length;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '90px 0', background: '#FDFBF7' }}>
        <div className="un-spinner" />
        <p style={{ color: '#8B7355', fontSize: 14, fontWeight: 500, marginTop: 12 }}>Calibrating SignalThreads Engine...</p>
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

      {/* ── Threads Editorial Header ── */}
      <div className="un-header" style={{ borderBottom: '1px solid #EBE5D8', background: '#FFFDF9' }}>
        <div className="un-header-max">
          <div className="un-top-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="un-logo-jewel" style={{ background: '#000000', color: '#FFF' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.186 24C5.457 24 0 18.543 0 11.814 0 5.086 5.457 0 12.186 0c6.702 0 12.138 5.405 12.185 12.107v.503c-.024 3.738-2.617 6.44-6.31 6.44-2.188 0-4.04-1.025-4.887-2.684-.047-.09-.089-.182-.128-.276-1.579 1.956-3.834 3.01-6.246 2.924-3.528-.126-6.195-2.73-6.195-6.05 0-3.376 2.768-6.115 6.17-6.115 1.587 0 3.085.602 4.225 1.695v-.252c0-1.87-1.522-3.392-3.392-3.392-1.353 0-2.525.803-3.053 1.957-.225.49-.785.706-1.275.48-.49-.224-.706-.784-.48-1.274.805-1.76 2.585-2.986 4.654-2.986 2.876 0 5.215 2.339 5.215 5.215v6.52c0 2.454 1.69 4.168 4.092 4.168 2.43 0 4.148-1.74 4.164-4.22v-.328C22.44 6.41 17.843 1.823 12.186 1.823 6.46 1.823 1.823 6.46 1.823 12.186S6.46 22.549 12.186 22.549c2.72 0 5.27-.992 7.23-2.81.4-.372 1.034-.347 1.406.053.372.4.347 1.034-.053 1.406C18.423 23.36 15.42 24 12.186 24zm-2.02-8.918c-.066.088-.13.177-.19.268.428.487.978.85 1.597 1.053.313-.418.52-.942.573-1.517-.618.006-1.32.062-1.98.196zm-.437-1.733c.77-.168 1.59-.24 2.385-.24v-.004c.007-.488-.088-.97-.278-1.417-.604-.84-1.57-1.365-2.617-1.365-1.83 0-3.318 1.488-3.318 3.318 0 1.802 1.455 3.268 3.376 3.328.094-.132.193-.26.297-.384-.336-.783-.845-2.236.155-3.236z" />
                </svg>
              </div>
              <div>
                <div className="un-title un-editorial-font" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>SignalThreads</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: '#F1F5F9', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Threads
                  </span>
                </div>
                <div className="un-subtitle">Autonomous Meta Threads Public Reply &amp; Mention Routing Engine</div>
              </div>
            </div>

            {/* Status Jewel & Connection */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {threadsConnection?.status === 'connected' ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 20, background: '#F1F5F9', border: '1px solid #CBD5E1', fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>
                  <span className="un-pulse-dot" style={{ background: '#0F172A' }} />
                  <span>@{threadsConnection.username || 'threads_user'}</span>
                  <span style={{ color: '#475569', opacity: 0.7, fontSize: 11 }}>Active API</span>
                </div>
              ) : (
                <a href={`/api/auth/platform/connect?platform=threads&workspaceId=${workspaceId || ''}&userId=${userId || ''}`} className="un-btn un-btn-primary" style={{ padding: '6px 14px', fontSize: 12.5, background: '#0F172A' }}>
                  Connect Threads
                </a>
              )}
            </div>
          </div>

          {/* Sub-tabs Navigation */}
          <div className="un-tabs-bar">
            {[
              { id: 'control',   label: 'Engine Controls', icon: <SvgGrid /> },
              { id: 'simulator', label: 'Intent Lab',       icon: <SvgPlay /> },
              { id: 'feed',      label: 'Dispatch Ledger',  icon: <SvgLedger />, badge: replyStats?.total },
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
            {threadsConnection?.status !== 'connected' && (
              <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: 16, padding: '16px 22px', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: '#0F172A', fontWeight: 700, fontSize: 14 }}>Threads Account Not Linked</div>
                  <div style={{ color: '#475569', fontSize: 12.5, marginTop: 2 }}>Connect your Meta Threads account to enable real-time webhook parsing, automated replies, and spam moderation.</div>
                </div>
                <a href={`/api/auth/platform/connect?platform=threads&workspaceId=${workspaceId || ''}&userId=${userId || ''}`} className="un-btn un-btn-primary" style={{ fontSize: 12.5, background: '#0F172A' }}>Connect Account</a>
              </div>
            )}

            {/* Meta Policy Banner */}
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D97706', flexShrink: 0 }} />
              <div style={{ fontSize: 12.5, color: '#92400E', lineHeight: 1.4 }}>
                <strong>Meta Threads Policy Compliance:</strong> Replies and mentions automation operates strictly via public thread replies. Meta does not offer a Direct Messaging API for Threads. All AI replies are strictly constrained to <strong>500 characters</strong>.
              </div>
            </div>

            {/* Master Hero Toggle */}
            <div className="un-master-hero">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 className="un-editorial-font" style={{ fontSize: 20, fontWeight: 700, color: '#3D2B1F', margin: 0 }}>
                      Autonomous Threads Dispatcher
                    </h3>
                    <span className={`un-hero-status-pill ${config.enabled ? 'un-hero-status-live' : 'un-hero-status-idle'}`}>
                      {config.enabled && <span className="un-pulse-dot" style={{ background: '#0F172A' }} />}
                      {config.enabled ? 'Real-Time Active' : 'Standby Mode'}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#8B7355', margin: '4px 0 0', fontWeight: 500 }}>
                    {config.enabled
                      ? 'Inbound public replies and mentions are classified in real-time, clamped to 500 chars, and dispatched with organic Poisson jitter.'
                      : 'Automation is paused. New replies will be recorded in the ledger without dispatching responses.'}
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

                {/* Reply & Mention Intent Protocols */}
                <div className="un-card">
                  <div className="un-card-header">
                    <div className="un-card-title">
                      <div className="un-card-title-icon" style={{ background: '#F1F5F9', color: '#0F172A' }}><SvgMessage /></div>
                      <span>Reply &amp; Mention Intent Protocols</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#8B7355', background: '#F5EFE2', padding: '2px 8px', borderRadius: 6 }}>Bespoke Rocker Controls</span>
                  </div>

                  {[
                    { key: 'autoReplyReplies',       color: 'color-emerald',  label: 'Thread Reply Dispatch',        desc: 'Auto-reply to comments on your original Threads posts.' },
                    { key: 'autoReplyMentions',      color: 'color-sapphire', label: 'Mention Dispatch',             desc: 'Auto-reply when creators or audience tag @yourhandle.' },
                    { key: 'autoReplyPositive',      color: 'color-emerald',  label: 'Praise & Community Delight',   desc: 'Warm, punchy acknowledgments for compliments and appreciation.' },
                    { key: 'autoReplyQuestions',     color: 'color-sapphire', label: 'Knowledge Queries',            desc: 'Context-aware factual replies to product and technical questions.' },
                    { key: 'autoReplyLinkRequests',  color: 'color-amethyst', label: 'Resource Link Dispatch',       desc: 'Delivers canonical resource link directly in the thread reply.' },
                    { key: 'autoReplyPurchaseIntent',color: 'color-amber',    label: 'Buyer Intent Routing',         desc: 'High-priority routing for pricing asks and purchase signals.' },
                    { key: 'flagNegative',           color: 'color-coral',    label: 'Flag Negative Sentiment',      desc: 'Route contrarian or negative remarks to human triage queue.' },
                    { key: 'flagSpam',               color: 'color-coral',    label: 'Filter Spam & Bot Replies',    desc: 'Auto-quarantine repetitive scams, bots, and malicious mentions.' },
                    { key: 'autoHideSpam',           color: 'color-coral',    label: 'Spam Auto-Hide via Manage API',desc: 'Hides confirmed spam using Threads manage_reply API.' },
                  ].map(({ key, color, label, desc }) => (
                    <div className="un-rule-row" key={key}>
                      <div style={{ paddingRight: 16 }}>
                        <div className="un-rule-name">{label}</div>
                        <div className="un-rule-desc">{desc}</div>
                      </div>
                      <CapsuleToggle
                        checked={!!(config as unknown as Record<string, unknown>)[key]}
                        onChange={v => { updateConfig({ [key]: v } as Partial<ThreadsAutomationConfig>); handleSave({ [key]: v } as Partial<ThreadsAutomationConfig>); }}
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
                    <label className="un-label">Maximum Hourly Reply Velocity</label>
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
                      Introduces randomized Poisson delay between detection and dispatch. Preserves natural creator timing and avoids Meta rate-limit flags.
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
                    <label className="un-label">Canonical Resource Link (Dispatched for link requests)</label>
                    <input
                      type="url"
                      className="un-input"
                      placeholder="https://unool.co/u/yourbrand"
                      value={config.linkUrl || ''}
                      onChange={e => updateConfig({ linkUrl: e.target.value || null })}
                      onBlur={() => handleSave({ linkUrl: config.linkUrl })}
                    />
                    <p style={{ fontSize: 11.5, color: '#8B7355', margin: '4px 0 0' }}>Dispatched when audience members request links in public thread replies.</p>
                  </div>

                  <div className="un-field">
                    <label className="un-label">Brand Editorial Persona</label>
                    <textarea
                      className="un-input un-textarea"
                      rows={3}
                      value={config.brandPersona || ''}
                      onChange={e => updateConfig({ brandPersona: e.target.value || null })}
                      onBlur={() => handleSave({ brandPersona: config.brandPersona })}
                      placeholder="Sharp, modern, punchy founder tone. Direct, insightful, and engaging. Reflects high standards without corporate fluff."
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
                      placeholder="Keep replies under 500 characters. Never mention competitor platforms. Direct technical queries to our documentation."
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      type="button"
                      className="un-btn un-btn-primary"
                      onClick={() => handleSave()}
                      disabled={saving}
                      style={{ background: '#0F172A' }}
                    >
                      {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>
                </div>

                {/* Threads-Specific Constraints */}
                <div className="un-card">
                  <div className="un-card-header">
                    <div className="un-card-title">
                      <div className="un-card-title-icon" style={{ background: '#F0F9FF', color: '#0369A1' }}><SvgAtom /></div>
                      <span>Threads API Compliance Controls</span>
                    </div>
                  </div>

                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>Reply character limit</span>
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>500 chars max</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>Private DM via Threads API</span>
                        <span style={{ fontWeight: 700, color: '#DC2626' }}>Not available</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>Reply type</span>
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>Public only</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600 }}>Spam control</span>
                        <span style={{ fontWeight: 700, color: '#059669' }}>manage_reply API</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 12.5, color: '#8B7355', lineHeight: 1.5 }}>
                    All Threads automation operates strictly within Meta&apos;s public API surface. Replies are automatically truncated to 500 chars if needed. No DM API access exists — resource links are delivered inline as public thread replies.
                  </div>
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
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#3D2B1F' }}>Threads Intent Lab (Live Simulator)</div>
                  <div style={{ fontSize: 12.5, color: '#8B7355', marginTop: 2 }}>
                    Test how the AI classifies inbound Threads replies and validates the 500-character constraint before going live.
                  </div>
                </div>
              </div>
            </div>

            {/* Presets */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {THREADS_COMMENT_PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  className="un-btn un-btn-secondary"
                  style={{ fontSize: 12, padding: '5px 12px' }}
                  onClick={() => {
                    setSimText(p.text);
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
                  <label className="un-label">Simulated Threads Reply or Mention</label>
                  <textarea
                    className="un-input un-textarea"
                    rows={4}
                    value={simText}
                    onChange={e => setSimText(e.target.value)}
                    placeholder="Enter a Threads reply to test..."
                  />
                </div>
                <div className="un-field">
                  <label className="un-label">Parent Post Context</label>
                  <input
                    type="text"
                    className="un-input"
                    value={simCaption}
                    onChange={e => setSimCaption(e.target.value)}
                    placeholder="Context of your Threads post..."
                  />
                </div>
                <button
                  type="button"
                  className="un-btn un-btn-primary"
                  onClick={runSimulation}
                  disabled={simulating}
                  style={{ background: '#0F172A' }}
                >
                  {simulating ? 'Analyzing Intent...' : 'Test Threads Response'}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: (simResult.characterCount || 0) > 450 ? '#FEF2F2' : '#F1F5F9', color: (simResult.characterCount || 0) > 450 ? '#DC2626' : '#0F172A' }}>
                          {simResult.characterCount || 0} / 500 chars
                        </span>
                        <span style={{ fontSize: 12, color: '#8B7355', fontWeight: 600 }}>
                          {Math.round((simResult.confidence || 0) * 100)}% conf.
                        </span>
                      </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#8B7355', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                        Public Threads Reply
                      </div>
                      <div style={{ fontSize: 13.5, color: '#3D2B1F', background: '#F8F6F0', padding: '10px 14px', borderRadius: 10, lineHeight: 1.5 }}>
                        {simResult.suggestedReply || 'No reply generated (policy skip).'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8, background: simResult.shouldAutoReply ? '#ECFDF5' : '#FEF2F2', color: simResult.shouldAutoReply ? '#059669' : '#991B1B' }}>
                        {simResult.shouldAutoReply ? '✓ Will Auto-Reply' : '✗ Skipped by Policy'}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8, background: '#F1F5F9', color: '#0F172A' }}>
                        Public reply only (no DM)
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: '#8B7355', fontStyle: 'italic', marginTop: 10 }}>
                      Reasoning: {simResult.reasoning}
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#F8F6F0', border: '1px dashed #D5CCA8', borderRadius: 14, padding: 36, textAlign: 'center', color: '#8B7355', fontSize: 13 }}>
                    Run a simulation to view classified intent, 500-char clamped replies, and safety diagnostics.
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
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#3D2B1F' }}>Threads Dispatch Ledger</div>
                  <div style={{ fontSize: 12.5, color: '#8B7355', marginTop: 2 }}>Real-time audit log of Threads replies and mentions processed by the autonomous engine.</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {replyStats && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>{replyStats.repliesCount} replies</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE' }}>{replyStats.mentionsCount} mentions</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#F0FDF4', color: '#059669', border: '1px solid #A7F3D0' }}>{replyStats.autoReplied} replied</span>
                  </div>
                )}
                <button
                  type="button"
                  className="un-btn un-btn-secondary"
                  onClick={loadReplies}
                  disabled={loadingReplies}
                  style={{ fontSize: 12 }}
                >
                  {loadingReplies ? 'Refreshing...' : 'Refresh Ledger'}
                </button>
              </div>
            </div>

            {loadingReplies ? (
              <div style={{ textAlign: 'center', padding: 40 }}><div className="un-spinner" /></div>
            ) : replies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#8B7355' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#3D2B1F', marginBottom: 6 }}>No Threads Replies Recorded Yet</div>
                <div style={{ fontSize: 13 }}>When audience members reply to your Threads or mention your handle, interactions will be logged here automatically.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #EBE5D8', textAlign: 'left', color: '#8B7355' }}>
                      <th style={{ padding: '10px 12px' }}>Type</th>
                      <th style={{ padding: '10px 12px' }}>Content</th>
                      <th style={{ padding: '10px 12px' }}>Intent</th>
                      <th style={{ padding: '10px 12px' }}>AI Reply</th>
                      <th style={{ padding: '10px 12px' }}>Chars</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px' }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {replies.map((r) => {
                      const cls = CLASSIFICATION_STYLES[r.classification || 'unrelated'] || CLASSIFICATION_STYLES.unrelated;
                      const charCount = r.suggested_reply?.length || 0;
                      return (
                        <tr key={r.id} style={{ borderBottom: '1px solid #F3EFE6' }}>
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: r.event_type === 'mention' ? '#EFF6FF' : '#F1F5F9', color: r.event_type === 'mention' ? '#1D4ED8' : '#0F172A' }}>
                              {r.event_type === 'mention' ? '@Mention' : 'Reply'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#3D2B1F', maxWidth: 200 }}>{r.reply_text}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: cls.bg, color: cls.color, border: `1px solid ${cls.border}` }}>
                              {cls.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#8B7355', maxWidth: 240 }}>{r.suggested_reply || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>No reply sent</span>}</td>
                          <td style={{ padding: '12px' }}>
                            {charCount > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: charCount > 450 ? '#DC2626' : '#475569' }}>{charCount}</span>}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: r.auto_replied ? '#059669' : r.flagged_for_review ? '#DC2626' : '#8B7355' }}>
                              {r.auto_replied ? 'Auto-Replied' : r.flagged_for_review ? 'Flagged' : 'Logged'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#8B7355', fontSize: 12 }}>
                            {new Date(r.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                  Replies and mentions flagged for negative sentiment, escalations, or edge cases requiring your personal attention.
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
                <div style={{ fontSize: 13, color: '#8B7355' }}>No replies currently require your review. The AI engine is handling all inbound interactions.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {triageItems.map(item => {
                  const cls = CLASSIFICATION_STYLES[item.classification || 'negative'] || CLASSIFICATION_STYLES.negative;
                  return (
                    <div
                      key={item.id}
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
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: item.event_type === 'mention' ? '#EFF6FF' : '#F1F5F9', color: item.event_type === 'mention' ? '#1D4ED8' : '#0F172A' }}>
                            {item.event_type === 'mention' ? '@Mention' : 'Reply'}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: cls.bg, color: cls.color, border: `1px solid ${cls.border}` }}>
                            {cls.label}
                          </span>
                          <span style={{ fontSize: 11, color: '#8B7355' }}>{new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div style={{ fontSize: 14, color: '#3D2B1F', lineHeight: 1.5, marginBottom: 8 }}>
                          &ldquo;{item.reply_text}&rdquo;
                        </div>
                        {item.reasoning && (
                          <div style={{ fontSize: 12, color: '#8B7355', fontStyle: 'italic' }}>
                            AI Reasoning: {item.reasoning}
                          </div>
                        )}
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        <a
                          href={`https://www.threads.net/t/${item.post_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="un-btn un-btn-secondary"
                          style={{ fontSize: 11.5, padding: '5px 12px' }}
                        >
                          View on Threads
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
