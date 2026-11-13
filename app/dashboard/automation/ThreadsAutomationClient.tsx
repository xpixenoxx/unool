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
  { label: 'Resource / Link Ask', text: 'Where can I get the template for this architecture? Drop the link please!', caption: 'Just launched our open-source growth framework for founders.' },
  { label: 'Domain Technical Question', text: 'Are you guys using edge workers or standard serverless for webhook queuing?', caption: 'Deep dive into our 60ms async dispatch pipeline.' },
  { label: 'Praise & Hype', text: 'This is genuinely the cleanest UI I have seen all year. Hats off to the team!', caption: 'A preview of our new luxury biscuit design system.' },
  { label: 'Pricing Query', text: 'Is there a startup discount or free tier for single creators?', caption: 'Pricing breakdown and onboarding guarantee.' },
  { label: 'Spam Mention', text: '@unool Check my bio to claim 1000 free followers right now!!', caption: 'Weekly community shoutouts.' },
];

const CLASSIFICATION_STYLES: Record<string, { label: string; bg: string; color: string; border: string }> = {
  positive:        { label: 'Positive / Praise', bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  question:        { label: 'Audience Question', bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' },
  link_request:    { label: 'Resource / Link Ask', bg: '#F5F3FF', color: '#5B21B6', border: '#DDD6FE' },
  purchase_intent: { label: 'Commercial / Buyer Intent', bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  negative:        { label: 'Negative / Contrarian', bg: '#FFF1F2', color: '#9F1239', border: '#FECDD3' },
  spam:            { label: 'Spam / Automated', bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
  harmful:         { label: 'Flagged / Moderation', bg: '#450A0A', color: '#FEE2E2', border: '#7F1D1D' },
  unrelated:       { label: 'General Remark', bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' },
};

export default function ThreadsAutomationClient({
  workspaceId,
  userId,
}: {
  workspaceId: string;
  userId?: string;
}) {
  const [config, setConfig] = useState<ThreadsAutomationConfig>(DEFAULT_CONFIG);
  const [threadsConnection, setThreadsConnection] = useState<{ status: 'connected' | 'not_connected' | 'expired'; username?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'control' | 'simulator' | 'feed'>('control');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Feed & comments
  const [replies, setReplies] = useState<ThreadsReplyLog[]>([]);
  const [replyStats, setReplyStats] = useState<{ total: number; autoReplied: number; repliesCount: number; mentionsCount: number } | null>(null);
  const [loadingReplies, setLoadingReplies] = useState(false);

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
        if (data.stats) setReplyStats(data.stats);
      }
    } catch {}
    finally { setLoadingReplies(false); }
  }, [workspaceId]);

  useEffect(() => {
    if (activeTab === 'feed') loadReplies();
  }, [activeTab, loadReplies]);

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

            {/* Status Jewel & Connection Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {threadsConnection?.status === 'connected' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 20, background: '#F1F5F9', border: '1px solid #CBD5E1', fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>
                    <span className="un-pulse-dot" style={{ background: '#0F172A' }} />
                    <span>@{threadsConnection.username || 'threads_user'}</span>
                    <span style={{ color: '#475569', opacity: 0.7, fontSize: 11 }}>Active API</span>
                  </div>
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
              { id: 'control',   label: 'Engine Controls', icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg> },
              { id: 'simulator', label: 'Intent Lab',       icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M4 3l9 5-9 5V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
              { id: 'feed',      label: 'Dispatch Ledger',  icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l3 3 3-3h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" stroke="currentColor" strokeWidth="1.5"/></svg>, badge: replyStats?.total },
            ].map(tab => (
              <button
                key={tab.id}
                className={`un-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id as any)}
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
            {threadsConnection?.status !== 'connected' && (
              <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: 16, padding: '16px 22px', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: '#0F172A', fontWeight: 700, fontSize: 14 }}>Threads Account Not Linked</div>
                  <div style={{ color: '#475569', fontSize: 12.5, marginTop: 2 }}>Connect your Meta Threads account to enable real-time webhook parsing, automated replies, and spam moderation.</div>
                </div>
                <a href={`/api/auth/platform/connect?platform=threads&workspaceId=${workspaceId || ''}&userId=${userId || ''}`} className="un-btn un-btn-primary" style={{ fontSize: 12.5, background: '#0F172A' }}>Connect Account</a>
              </div>
            )}

            {/* Strict Meta Policy Banner */}
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D97706', flexShrink: 0 }} />
              <div style={{ fontSize: 12.5, color: '#92400E', lineHeight: 1.4 }}>
                <strong>Meta Threads Policy Compliance:</strong> Replies and mentions automation operates strictly via public thread replies. Meta does not offer a Direct Messaging API for Threads. All AI replies are strictly constrained to <strong>500 characters</strong>.
              </div>
            </div>

            {/* Master Hero */}
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
                      ? 'Inbound public replies and mentions are classified in real-time, sanitized, clamped to 500 chars, and dispatched with organic human jitter.'
                      : 'Automation is paused. New replies will be recorded in the ledger without dispatching responses.'}
                  </p>
                </div>
              </div>

              {/* Master Toggle */}
              <button
                type="button"
                className={`un-rocker ${config.enabled ? 'checked' : ''}`}
                onClick={() => {
                  const nextVal = !config.enabled;
                  setConfig(prev => ({ ...prev, enabled: nextVal }));
                  handleSave({ enabled: nextVal });
                }}
                aria-label="Toggle Threads Automation"
              >
                <span className="un-rocker-thumb" />
              </button>
            </div>

            {/* Protocols Grid */}
            <div className="un-grid-2" style={{ marginTop: 22 }}>

              {/* Card 1: Intent Controls */}
              <div className="un-panel">
                <div className="un-panel-header">
                  <h4 className="un-panel-title">Reply &amp; Mention Intent Protocols</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { key: 'autoReplyReplies', label: 'Thread Reply Dispatch', desc: 'Auto-reply to comments on your original Threads posts.' },
                    { key: 'autoReplyMentions', label: 'Mention Dispatch', desc: 'Auto-reply when creators or audience tag @yourhandle.' },
                    { key: 'autoReplyPositive', label: 'Praise & Community Delight', desc: 'Warm acknowledgments for compliments and appreciation.' },
                    { key: 'autoReplyQuestions', label: 'Knowledge Queries', desc: 'Context-aware factual replies to product and technical questions.' },
                    { key: 'autoReplyLinkRequests', label: 'Resource Link Dispatch', desc: 'Delivers canonical resource link directly in the thread reply.' },
                    { key: 'autoReplyPurchaseIntent', label: 'Buyer Intent Routing', desc: 'High-priority routing for pricing asks and purchase signals.' },
                    { key: 'autoHideSpam', label: 'Spam Auto-Hide Filter', desc: 'Automatically hides spam replies using Threads manage_reply API.' },
                  ].map(item => (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #F3EFE6' }}>
                      <div style={{ paddingRight: 14 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#3D2B1F' }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: '#8B7355', marginTop: 2 }}>{item.desc}</div>
                      </div>
                      <button
                        type="button"
                        className={`un-rocker ${(config as any)[item.key] ? 'checked' : ''}`}
                        onClick={() => {
                          const nextVal = !(config as any)[item.key];
                          setConfig(prev => ({ ...prev, [item.key]: nextVal }));
                          handleSave({ [item.key]: nextVal });
                        }}
                      >
                        <span className="un-rocker-thumb" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Brand Voice & Resource Delivery */}
              <div className="un-panel">
                <div className="un-panel-header">
                  <h4 className="un-panel-title">Brand Voice &amp; Resource Delivery</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="un-label">Canonical Resource Link</label>
                    <input
                      type="url"
                      className="un-input"
                      placeholder="https://unool.co/u/yourbrand"
                      value={config.linkUrl || ''}
                      onChange={e => setConfig(prev => ({ ...prev, linkUrl: e.target.value }))}
                      onBlur={() => handleSave()}
                    />
                    <p style={{ fontSize: 11.5, color: '#8B7355', margin: '4px 0 0' }}>Dispatched when audience members request links in public replies.</p>
                  </div>

                  <div>
                    <label className="un-label">Brand Editorial Persona</label>
                    <textarea
                      className="un-textarea"
                      rows={3}
                      value={config.brandPersona || ''}
                      onChange={e => setConfig(prev => ({ ...prev, brandPersona: e.target.value }))}
                      onBlur={() => handleSave()}
                      placeholder="Describe the tone and voice for your Threads replies (punchy, witty, modern)..."
                    />
                  </div>

                  <div>
                    <label className="un-label">Boundary Instructions &amp; Prohibitions</label>
                    <textarea
                      className="un-textarea"
                      rows={3}
                      value={config.customInstructions || ''}
                      onChange={e => setConfig(prev => ({ ...prev, customInstructions: e.target.value }))}
                      onBlur={() => handleSave()}
                      placeholder="e.g. Always keep replies under 280 chars. Never mention competitors..."
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
              </div>
            </div>
          </div>
        )}

        {/* ════ TAB 2: INTENT LAB / SIMULATOR ════ */}
        {activeTab === 'simulator' && (
          <div className="un-panel">
            <div className="un-panel-header">
              <div>
                <h4 className="un-panel-title">Threads Intent Lab (Live Simulator)</h4>
                <p style={{ fontSize: 12.5, color: '#8B7355', margin: '4px 0 0' }}>
                  Test how the AI classifies inbound Threads replies and validates the 500-character constraint before going live.
                </p>
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
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="un-grid-2">
              <div>
                <div style={{ marginBottom: 12 }}>
                  <label className="un-label">Simulated Threads Reply or Mention</label>
                  <textarea
                    className="un-textarea"
                    rows={4}
                    value={simText}
                    onChange={e => setSimText(e.target.value)}
                    placeholder="Enter a Threads reply to test..."
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
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
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#F1F5F9', color: '#0F172A' }}>
                          {simResult.characterCount || 0} / 500 chars
                        </span>
                        <span style={{ fontSize: 12, color: '#8B7355', fontWeight: 600 }}>
                          {Math.round((simResult.confidence || 0) * 100)}%
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
          <div className="un-panel">
            <div className="un-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h4 className="un-panel-title">Threads Dispatch Ledger</h4>
                <p style={{ fontSize: 12.5, color: '#8B7355', margin: '4px 0 0' }}>
                  Real-time audit log of Threads replies and mentions processed by the autonomous engine.
                </p>
              </div>
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

            {loadingReplies ? (
              <div style={{ textAlign: 'center', padding: 40 }}><div className="un-spinner" /></div>
            ) : replies.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#8B7355' }}>
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
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px' }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {replies.map((r) => {
                      const style = CLASSIFICATION_STYLES[r.classification || 'unrelated'] || CLASSIFICATION_STYLES.unrelated;
                      return (
                        <tr key={r.id} style={{ borderBottom: '1px solid #F3EFE6' }}>
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: r.event_type === 'mention' ? '#EFF6FF' : '#F1F5F9', color: r.event_type === 'mention' ? '#1D4ED8' : '#0F172A' }}>
                              {r.event_type === 'mention' ? '@Mention' : 'Reply'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#3D2B1F', maxWidth: 220 }}>
                            {r.reply_text}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                              {style.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#8B7355', maxWidth: 260 }}>
                            {r.suggested_reply || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>No reply sent</span>}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: r.auto_replied ? '#059669' : '#8B7355' }}>
                              {r.auto_replied ? 'Auto-Replied' : 'Logged'}
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

      </div>
    </div>
  );
}

