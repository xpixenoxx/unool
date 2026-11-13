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
  brandPersona: 'Thoughtful, conversational founder tone. Clear, helpful, and professional. Reflects high standards without corporate jargon.',
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

const CLASSIFICATION_STYLES: Record<string, { label: string; bg: string; color: string; border: string }> = {
  positive:        { label: 'Positive / Praise', bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  question:        { label: 'Audience Question', bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' },
  link_request:    { label: 'Resource / Link Ask', bg: '#F5F3FF', color: '#5B21B6', border: '#DDD6FE' },
  purchase_intent: { label: 'Commercial / Buyer Intent', bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  negative:        { label: 'Negative / Critical', bg: '#FFF1F2', color: '#9F1239', border: '#FECDD3' },
  spam:            { label: 'Spam / Automated', bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
  harmful:         { label: 'Flagged / Moderation', bg: '#450A0A', color: '#FEE2E2', border: '#7F1D1D' },
  unrelated:       { label: 'General Remark', bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' },
};

export default function FacebookAutomationClient({
  workspaceId,
  userId,
}: {
  workspaceId: string;
  userId?: string;
}) {
  const [config, setConfig] = useState<FacebookAutomationConfig>(DEFAULT_CONFIG);
  const [fbConnection, setFbConnection] = useState<{ status: 'connected' | 'not_connected' | 'expired'; username?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'control' | 'simulator' | 'feed'>('control');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Feed & comments
  const [comments, setComments] = useState<FacebookCommentLog[]>([]);
  const [commentStats, setCommentStats] = useState<{ total: number; autoReplied: number; flagged: number } | null>(null);
  const [loadingComments, setLoadingComments] = useState(false);

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
    setTimeout(() => setToast(null), 3500);
  };

  // ── Load Platform Connection Status ──
  useEffect(() => {
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
        if (data.stats) setCommentStats(data.stats);
      }
    } catch {}
    finally { setLoadingComments(false); }
  }, [workspaceId]);

  useEffect(() => {
    if (activeTab === 'feed') loadComments();
  }, [activeTab, loadComments]);

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
      if (res.ok) {
        if (overrides) setConfig(prev => ({ ...prev, ...overrides }));
        showToast('Facebook automation settings saved!', 'success');
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

            {/* Status Jewel & Connection Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {fbConnection?.status === 'connected' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 20, background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: 12.5, fontWeight: 600, color: '#1D4ED8' }}>
                    <span className="un-pulse-dot" style={{ background: '#1877F2' }} />
                    <span>@{fbConnection.username || 'facebook_page'}</span>
                    <span style={{ color: '#1E40AF', opacity: 0.7, fontSize: 11 }}>Active API</span>
                  </div>
                </div>
              ) : (
                <a href={`/api/auth/platform/connect?platform=facebook&workspaceId=${workspaceId || ''}&userId=${userId || ''}`} className="un-btn un-btn-primary" style={{ padding: '6px 14px', fontSize: 12.5, background: '#1877F2' }}>
                  Connect Facebook Page
                </a>
              )}
            </div>
          </div>

          {/* Sub-tabs Navigation */}
          <div className="un-tabs-bar">
            {[
              { id: 'control',   label: 'Engine Controls', icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg> },
              { id: 'simulator', label: 'Intent Lab',       icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M4 3l9 5-9 5V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
              { id: 'feed',      label: 'Dispatch Ledger',  icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l3 3 3-3h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" stroke="currentColor" strokeWidth="1.5"/></svg>, badge: commentStats?.total },
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
            {fbConnection?.status !== 'connected' && (
              <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 16, padding: '16px 22px', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: '#1E40AF', fontWeight: 700, fontSize: 14 }}>Facebook Page Not Linked</div>
                  <div style={{ color: '#1E3A8A', fontSize: 12.5, marginTop: 2 }}>Connect your Facebook Page to enable autonomous comment replies, spam filtering, and private Messenger follow-ups.</div>
                </div>
                <a href={`/api/auth/platform/connect?platform=facebook&workspaceId=${workspaceId || ''}&userId=${userId || ''}`} className="un-btn un-btn-primary" style={{ fontSize: 12.5, background: '#1877F2' }}>Connect Page</a>
              </div>
            )}

            {/* Master Hero */}
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
                      ? 'Inbound Facebook Page comments are filtered by AI intent, verified for safety, and replied to with humanized pacing.'
                      : 'Automation is paused. New Facebook comments will be logged in the dispatch ledger without auto-replying.'}
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
                aria-label="Toggle Facebook Automation"
              >
                <span className="un-rocker-thumb" />
              </button>
            </div>

            {/* Protocols Grid */}
            <div className="un-grid-2" style={{ marginTop: 22 }}>

              {/* Card 1: Intent Controls */}
              <div className="un-panel">
                <div className="un-panel-header">
                  <h4 className="un-panel-title">Comment Intent Recognition Protocols</h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { key: 'autoReplyPositive', label: 'Praise & Community Delight', desc: 'Positive affirmations, compliments, and thank-yous.' },
                    { key: 'autoReplyQuestions', label: 'Knowledge Queries', desc: 'Product, pricing, and how-to questions from audience.' },
                    { key: 'autoReplyLinkRequests', label: 'Resource & Link Dispatch', desc: 'Auto-reply with canonical resource link + optional private reply.' },
                    { key: 'autoReplyPurchaseIntent', label: 'Commercial & Buyer Intent', desc: 'High-intent buying signals routed with priority response.' },
                    { key: 'autoHideSpam', label: 'Spam Auto-Hide Filter', desc: 'Automatically hides spam comments using Facebook Page moderation API.' },
                    { key: 'autoReplyDm', label: 'Messenger Private Reply', desc: 'Sends a private Messenger reply on comments requesting resource links (within 7-day Meta window).' },
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
                    <p style={{ fontSize: 11.5, color: '#8B7355', margin: '4px 0 0' }}>Delivered when audience members ask for links, templates, or resources.</p>
                  </div>

                  <div>
                    <label className="un-label">Brand Editorial Persona</label>
                    <textarea
                      className="un-textarea"
                      rows={3}
                      value={config.brandPersona || ''}
                      onChange={e => setConfig(prev => ({ ...prev, brandPersona: e.target.value }))}
                      onBlur={() => handleSave()}
                      placeholder="Describe the tone and voice for your Facebook Page replies..."
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
                      placeholder="e.g. Never mention competitors. Direct technical issues to support..."
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
              </div>
            </div>
          </div>
        )}

        {/* ════ TAB 2: INTENT LAB / SIMULATOR ════ */}
        {activeTab === 'simulator' && (
          <div className="un-panel">
            <div className="un-panel-header">
              <div>
                <h4 className="un-panel-title">Facebook Intent Lab (Live Simulator)</h4>
                <p style={{ fontSize: 12.5, color: '#8B7355', margin: '4px 0 0' }}>
                  Test how the AI categorizes Facebook comments and drafts responses based on your current settings before going live.
                </p>
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
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="un-grid-2">
              <div>
                <div style={{ marginBottom: 12 }}>
                  <label className="un-label">Simulated Facebook Comment</label>
                  <textarea
                    className="un-textarea"
                    rows={4}
                    value={simComment}
                    onChange={e => setSimComment(e.target.value)}
                    placeholder="Enter a comment to test..."
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
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
          <div className="un-panel">
            <div className="un-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h4 className="un-panel-title">Facebook Dispatch Ledger</h4>
                <p style={{ fontSize: 12.5, color: '#8B7355', margin: '4px 0 0' }}>
                  Real-time audit log of Facebook comments processed by the autonomous engine.
                </p>
              </div>
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

            {loadingComments ? (
              <div style={{ textAlign: 'center', padding: 40 }}><div className="un-spinner" /></div>
            ) : comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#8B7355' }}>
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
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px' }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comments.map((c) => {
                      const style = CLASSIFICATION_STYLES[c.classification || 'unrelated'] || CLASSIFICATION_STYLES.unrelated;
                      return (
                        <tr key={c.id} style={{ borderBottom: '1px solid #F3EFE6' }}>
                          <td style={{ padding: '12px', fontWeight: 600, color: '#3D2B1F' }}>
                            {c.commenter_name || 'Community Member'}
                          </td>
                          <td style={{ padding: '12px', color: '#3D2B1F', maxWidth: 220 }}>
                            {c.comment_text}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                              {style.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#8B7355', maxWidth: 260 }}>
                            {c.suggested_reply || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>No reply sent</span>}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: c.auto_replied ? '#059669' : '#8B7355' }}>
                              {c.auto_replied ? 'Auto-Replied' : 'Logged'}
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

      </div>
    </div>
  );
}

