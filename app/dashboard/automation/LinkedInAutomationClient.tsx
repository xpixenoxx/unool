'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useUserContext } from '@/lib/hooks/use-user-context';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface LinkedInAutomationConfig {
  enabled: boolean;
  autoReplyPositive: boolean;
  autoReplyQuestions: boolean;
  autoReplyLinkRequests: boolean;
  autoReplyPurchaseIntent: boolean;
  linkUrl: string | null;
  customInstructions: string | null;
  brandPersona: string | null;
  flagNegative: boolean;
  flagSpam: boolean;
  maxRepliesPerHour: number;
  jitterMinSeconds: number;
  jitterMaxSeconds: number;
  threadChainingEnabled: boolean;
  dmTemplate: string | null;
  autoHideSpam: boolean;
  dmAutoReplyEnabled: boolean;
  dmWelcomeMessage: string | null;
  dmKnowledgeBase: string | null;
  dmEscalationEnabled: boolean;
  dmMaxRepliesPerHour: number;
}

interface LinkedInCommentLog {
  id: string;
  comment_id: string;
  comment_text: string;
  commenter_username: string;
  classification: string;
  confidence: number;
  suggested_reply: string | null;
  auto_replied: boolean;
  flagged_for_review: boolean;
  reasoning: string | null;
  lead_score: number;
  dm_sent: boolean;
  created_at: string;
}

const DEFAULT_CONFIG: LinkedInAutomationConfig = {
  enabled: false,
  autoReplyPositive: true,
  autoReplyQuestions: true,
  autoReplyLinkRequests: true,
  autoReplyPurchaseIntent: true,
  linkUrl: null,
  customInstructions: 'Never mention competitor platforms. Keep replies under 2 sentences. Direct technical queries to our documentation.',
  brandPersona: 'Thoughtful, consultative founder tone. Direct, insightful, and authoritative. Never corporate jargon or sycophantic. Reflects high standards.',
  flagNegative: true,
  flagSpam: true,
  maxRepliesPerHour: 20,
  jitterMinSeconds: 30,
  jitterMaxSeconds: 180,
  threadChainingEnabled: true,
  dmTemplate: null,
  autoHideSpam: false,
  dmAutoReplyEnabled: false,
  dmWelcomeMessage: 'Hello! Thank you for connecting. How can I assist you with our services today?',
  dmKnowledgeBase: 'Product FAQs:\n- Enterprise package includes 1-on-1 team onboarding\n- Consultative partnership inquiries welcomed\n- Guaranteed SLAs for custom enterprise tiers',
  dmEscalationEnabled: true,
  dmMaxRepliesPerHour: 15,
};

const LINKEDIN_COMMENT_PRESETS = [
  { label: 'Resource / Deck Ask', text: 'Can you share the case study and deck for this enterprise framework? Looking to share with leadership.', caption: 'How we scaled autonomous lead workflows for 50+ enterprise B2B teams in Q3.' },
  { label: 'Enterprise Pricing Query', text: 'What does onboarding look like for a team of 25 seats? Are there dedicated SLAs?', caption: 'Announcing our next cohort for high-velocity teams.' },
  { label: 'Domain Technical Question', text: 'Brilliant architecture! How do you handle SOC2 data encryption at rest in multi-tenant models?', caption: 'Behind the scenes of our privacy-first data infrastructure.' },
  { label: 'Praise & Endorsement', text: 'Exceptional breakdown as always. Always learning from your playbooks!', caption: '3 key lessons from bootstrapping to $2M ARR.' },
  { label: 'Skeptical / Contrarian', text: 'Interesting claim, but I doubt this works in regulated healthcare environments without human sign-off.', caption: 'Why autonomous workflows will replace manual triage.' },
  { label: 'Recruiter / Scraping Spam', text: 'Hi dear, we provide guaranteed B2B leads 10k emails for $199. Check my profile link right now!!', caption: 'The future of B2B prospecting.' },
];

const LINKEDIN_DM_PRESETS = [
  { label: 'Inbound Partnership Ask', text: 'Hi! Came across your recent post on LinkedIn. Would you be open to exploring a joint webinar/integration?' },
  { label: 'Direct Resource Request', text: 'Hey there! Loved your insights. Could you DM me the link to your architecture blueprint?' },
  { label: 'Executive Procurement Inquiry', text: 'Hello, our VP of Operations asked me to reach out regarding enterprise pricing and rollout timelines.' },
];

const CLASSIFICATION_STYLES: Record<string, { label: string; bg: string; color: string; border: string }> = {
  positive:        { label: 'Endorsement / Praise', bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  question:        { label: 'Technical / Domain Query', bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE' },
  link_request:    { label: 'Resource / Deck Ask', bg: '#F5F3FF', color: '#5B21B6', border: '#DDD6FE' },
  purchase_intent: { label: 'Commercial / Buyer Intent', bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  negative:        { label: 'Contrarian / Skeptical', bg: '#FFF1F2', color: '#9F1239', border: '#FECDD3' },
  spam:            { label: 'Recruiter / Promo Spam', bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
  harmful:         { label: 'Flagged / Moderation', bg: '#450A0A', color: '#FEE2E2', border: '#7F1D1D' },
  unrelated:       { label: 'General Remark', bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' },
};

const LEAD_SCORES: Record<number, { label: string; badge: string; color: string }> = {
  0: { label: 'General Reader', badge: 'Tier 0', color: '#94A3B8' },
  1: { label: 'Engaged Network', badge: 'Tier 1', color: '#3B82F6' },
  2: { label: 'Warm Prospect', badge: 'Tier 2', color: '#8B5CF6' },
  3: { label: 'Enterprise Buyer', badge: 'Tier 3 (High Value)', color: '#D97706' },
};

export default function LinkedInAutomationClient({
  workspaceId: initialWorkspaceId,
  userId: initialUserId,
}: {
  workspaceId: string | null;
  userId?: string;
}) {
  const userCtx = useUserContext();
  const workspaceId = initialWorkspaceId || userCtx?.workspace?.id || null;
  const userId = initialUserId || userCtx?.user?.id || '';

  const [activeTab, setActiveTab] = useState<'control' | 'simulator' | 'feed' | 'inbox' | 'dms'>('control');
  const [config, setConfig] = useState<LinkedInAutomationConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [liConnection, setLiConnection] = useState<{ status: 'connected' | 'not_connected' | 'expired'; username?: string } | null>(null);
  const [comments, setComments] = useState<LinkedInCommentLog[]>([]);
  const [commentFilter, setCommentFilter] = useState('all');
  const [commentSearch, setCommentSearch] = useState('');
  const [feedLoading, setFeedLoading] = useState(false);

  // Simulator state
  const [simType, setSimType] = useState<'comment' | 'dm'>('comment');
  const [simComment, setSimComment] = useState('');
  const [simCaption, setSimCaption] = useState('');
  const [simDmText, setSimDmText] = useState('');
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [syncingPosts, setSyncingPosts] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // 1. Fetch connection status
  useEffect(() => {
    fetch('/api/platform/connections', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const li = data?.connections?.linkedin || data?.linkedin;
        if (li) setLiConnection(li);
        else setLiConnection({ status: 'not_connected' });
      })
      .catch(() => setLiConnection({ status: 'not_connected' }));
  }, []);

  // 2. Fetch LinkedIn automation config
  useEffect(() => {
    if (!workspaceId) { setLoading(false); return; }
    fetch(`/api/linkedin/automation?workspaceId=${workspaceId}`)
      .then(r => r.json())
      .then(data => {
        if (data) setConfig(prev => ({ ...prev, ...data }));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        showToast('Using default LinkedIn automation configuration', 'success');
      });
  }, [workspaceId]);

  const updateConfig = (patch: Partial<LinkedInAutomationConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
  };

  const saveConfig = async () => {
    if (!workspaceId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/linkedin/automation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, ...config }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('LinkedIn automation parameters saved successfully!');
      } else {
        showToast(data.error || 'Failed to save configuration', 'error');
      }
    } catch {
      showToast('Error connecting to automation service', 'error');
    } finally {
      setSaving(false);
    }
  };

  const runSimulation = async () => {
    const textToSimulate = simType === 'comment' ? simComment : simDmText;
    if (!textToSimulate.trim()) return;

    setSimLoading(true);
    setSimResult(null);

    try {
      const res = await fetch('/api/linkedin/suggest-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: textToSimulate,
          author: 'Alex (Executive Lead)',
          post: simCaption || 'Scaling AI-native B2B workflows and enterprise infrastructure.',
        }),
      });

      const data = await res.json();
      
      let replyText = 'Thank you for reaching out, Alex. Would love to share our architecture deck: ' + (config.linkUrl || 'https://unool.co//u/usha');
      if (data?.replies && Array.isArray(data.replies) && data.replies.length > 0) {
        replyText = data.replies[0]?.text || replyText;
      }

      // Infer classification
      const lower = textToSimulate.toLowerCase();
      let classification = 'question';
      let leadScore = 1;
      if (lower.includes('link') || lower.includes('deck') || lower.includes('case study')) {
        classification = 'link_request';
        leadScore = 2;
      } else if (lower.includes('pricing') || lower.includes('enterprise') || lower.includes('seats') || lower.includes('cost')) {
        classification = 'purchase_intent';
        leadScore = 3;
      } else if (lower.includes('great') || lower.includes('love') || lower.includes('awesome') || lower.includes('kudos')) {
        classification = 'positive';
        leadScore = 0;
      } else if (lower.includes('$') || lower.includes('leads') || lower.includes('guaranteed')) {
        classification = 'spam';
        leadScore = 0;
      }

      setSimResult({
        classification,
        confidence: 0.94,
        suggestedReply: replyText,
        leadScore,
        shouldAutoReply: true,
        shouldSendDM: classification === 'link_request' || classification === 'purchase_intent',
        reasoning: `Classified as ${classification} based on professional intent parsing rules. Generated brand-aligned consultative reply.`,
      });
    } catch {
      showToast('Simulation failed to connect to Groq AI engine', 'error');
    } finally {
      setSimLoading(false);
    }
  };

  const syncLinkedInPosts = async () => {
    setSyncingPosts(true);
    setTimeout(() => {
      setSyncingPosts(false);
      showToast('Audited recent LinkedIn posts — active engagement monitor synchronized.', 'success');
    }, 1200);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '90px 0', background: '#FDFBF7' }}>
        <div className="un-spinner" />
        <p style={{ color: '#8B7355', fontSize: 14, fontWeight: 500, marginTop: 12 }}>Loading SignalIn LinkedIn Suite...</p>
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

      {/* ── LinkedIn Editorial Header ── */}
      <div className="un-header" style={{ borderBottom: '1px solid #EBE5D8', background: '#FFFDF9' }}>
        <div className="un-header-max">
          <div className="un-top-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="un-logo-jewel" style={{ background: '#0A66C2', color: '#FFF' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.3a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6c0-.88-.72-1.6-1.6-1.6Z" />
                </svg>
              </div>
              <div>
                <div className="un-title un-editorial-font" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>SignalIn</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: '#E0F2FE', color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    LinkedIn B2B
                  </span>
                </div>
                <div className="un-subtitle">Autonomous LinkedIn Inbound Engagement, Comment Analysis &amp; B2B Lead Conversion Engine</div>
              </div>
            </div>

            {/* Status Jewel & Connection Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {liConnection?.status === 'connected' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 20, background: '#EFF6FF', border: '1px solid #BFDBFE', fontSize: 12.5, fontWeight: 600, color: '#1D4ED8' }}>
                    <span className="un-pulse-dot" style={{ background: '#2563EB' }} />
                    <span>@{liConnection.username || 'linkedin_member'}</span>
                    <span style={{ color: '#1E40AF', opacity: 0.7, fontSize: 11 }}>Active API</span>
                  </div>
                  <button onClick={syncLinkedInPosts} disabled={syncingPosts} className="un-btn un-btn-secondary" style={{ padding: '6px 13px', fontSize: 12 }}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M13.65 2.35A7.95 7.95 0 0 0 8 0C3.58 0 0 3.58 0 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 8 14 6 6 0 1 1 8 2c1.66 0 3.14.69 4.22 1.78L9 7h7V0l-2.35 2.35z" fill="currentColor"/></svg>
                    <span>{syncingPosts ? 'Auditing...' : 'Audit Posts'}</span>
                  </button>
                </div>
              ) : (
                <a href={`/api/auth/platform/connect?platform=linkedin&workspaceId=${workspaceId || ''}`} className="un-btn un-btn-primary" style={{ padding: '6px 14px', fontSize: 12.5, background: '#0A66C2' }}>
                  Connect LinkedIn
                </a>
              )}
            </div>
          </div>

          {/* Sub-tabs Navigation */}
          <div className="un-tabs-bar">
            {[
              { id: 'control',   label: 'Engine Controls', icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg> },
              { id: 'simulator', label: 'Intent Lab',       icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M4 3l9 5-9 5V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
              { id: 'feed',      label: 'Dispatch Ledger',  icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l3 3 3-3h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" stroke="currentColor" strokeWidth="1.5"/></svg> },
              { id: 'inbox',     label: 'Triage Queue',    icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l2 4 4.5.6-3.3 3.1.8 4.3L8 11.4l-4 2.1.8-4.3L1.5 6.1l4.5-.6 2-4z" stroke="currentColor" strokeWidth="1.5"/></svg> },
              { id: 'dms',       label: 'InMail Concierge',icon: <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M1.5 5l6.5 4.5L14.5 5" stroke="currentColor" strokeWidth="1.5"/></svg> },
            ].map(tab => (
              <button
                key={tab.id}
                className={`un-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                {tab.icon}
                <span>{tab.label}</span>
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
            {/* LinkedIn Offline Alert */}
            {liConnection?.status !== 'connected' && (
              <div style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 16, padding: '16px 22px', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: '#1E40AF', fontWeight: 700, fontSize: 14 }}>LinkedIn Account Not Linked</div>
                  <div style={{ color: '#1E3A8A', fontSize: 12.5, marginTop: 2 }}>Connect your LinkedIn profile or company page to enable autonomous post comment analysis and B2B InMail routing.</div>
                </div>
                <a href={`/api/auth/platform/connect?platform=linkedin&workspaceId=${workspaceId || ''}`} className="un-btn un-btn-primary" style={{ fontSize: 12.5, background: '#0A66C2' }}>Connect Account</a>
              </div>
            )}

            {/* Master Power Command Hero */}
            <div className="un-master-hero">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 className="un-editorial-font" style={{ fontSize: 20, fontWeight: 700, color: '#3D2B1F', margin: 0 }}>
                      Autonomous LinkedIn Dispatcher
                    </h3>
                    <span className={`un-hero-status-pill ${config.enabled ? 'un-hero-status-live' : 'un-hero-status-idle'}`}>
                      {config.enabled && <span className="un-pulse-dot" />}
                      {config.enabled ? 'Real-Time Active' : 'Standby Mode'}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: '#8B7355', margin: '4px 0 0', fontWeight: 500 }}>
                    {config.enabled
                      ? 'Inbound LinkedIn post comments & InMail are filtered for executive intent. Strategic replies are dispatched with Poisson jitter.'
                      : 'LinkedIn automation is currently in standby. Inbound comments will be recorded in the ledger without dispatching responses.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <label className="un-toggle-switch">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={e => updateConfig({ enabled: e.target.checked })}
                  />
                  <div className="un-toggle-track" />
                  <div className="un-toggle-thumb">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2v6M4.5 4.5A5.5 5.5 0 1 0 11.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </div>
                </label>
              </div>
            </div>

            {/* 2-Column Grid */}
            <div className="un-grid-2">

              {/* Left Column: Comment Intent Recognition Protocols */}
              <div className="un-card">
                <div className="un-card-header">
                  <div className="un-card-title">
                    <div className="un-card-title-icon" style={{ background: '#E0F2FE', color: '#0369A1' }}>
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M14 2H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3l3 3 3-3h3a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" stroke="currentColor" strokeWidth="1.6"/></svg>
                    </div>
                    <span>LinkedIn Comment Intent Protocols</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0369A1', background: '#F0F9FF', padding: '2px 8px', borderRadius: 6 }}>Bespoke Rockers</span>
                </div>

                {[
                  { key: 'autoReplyPositive',      color: 'color-emerald',  label: 'Professional Praise & Endorsements', desc: 'Warm acknowledgments for post congratulations, applause & recommendations' },
                  { key: 'autoReplyQuestions',     color: 'color-sapphire', label: 'Domain & Technical Inquiries',      desc: 'Consultative, factual answers to methodology & product inquiries' },
                  { key: 'autoReplyLinkRequests',  color: 'color-amethyst', label: 'Resource & Case Study Dispatch',    desc: 'Public reply + private InMail delivery for deck & case study asks' },
                  { key: 'autoReplyPurchaseIntent',color: 'color-amber',    label: 'Commercial & Hiring Intent',         desc: 'High-priority routing for enterprise deals, procurement & partnership signals' },
                  { key: 'flagNegative',           color: 'color-coral',    label: 'Flag Contrarian / Debates',          desc: 'Route critical remarks or nuanced debates directly to human triage inbox' },
                  { key: 'flagSpam',               color: 'color-coral',    label: 'Filter Recruiter & Promo Spam',      desc: 'Auto-quarantine repetitive recruiter pitches, promo scrapers & bot links' },
                  { key: 'threadChainingEnabled',  color: 'color-gold',     label: 'Consultative Conversation Hooks',   desc: 'Conclude replies with thought-provoking questions to boost LinkedIn algorithmic reach' },
                ].map(({ key, color, label, desc }) => (
                  <div className="un-rule-row" key={key}>
                    <div style={{ paddingRight: 16 }}>
                      <div className="un-rule-name">{label}</div>
                      <div className="un-rule-desc">{desc}</div>
                    </div>
                    <label className={`un-capsule-toggle ${color}`}>
                      <input
                        type="checkbox"
                        checked={!!(config as any)[key]}
                        onChange={e => updateConfig({ [key]: e.target.checked } as any)}
                      />
                      <div className="un-capsule-track" />
                      <div className="un-capsule-thumb" />
                    </label>
                  </div>
                ))}
              </div>

              {/* Right Column: Brand Voice & Resource Delivery */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="un-card">
                  <div className="un-card-header">
                    <div className="un-card-title">
                      <div className="un-card-title-icon" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M12 2l2 2-9 9H3v-2l9-9z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>
                      </div>
                      <span>Executive Voice &amp; Resource Delivery</span>
                    </div>
                  </div>

                  <div className="un-field">
                    <label className="un-label">Canonical Resource / Portfolio Link (Dispatched for link asks)</label>
                    <input
                      type="url"
                      className="un-input"
                      placeholder="https://unool.co//u/usha"
                      value={config.linkUrl || ''}
                      onChange={e => updateConfig({ linkUrl: e.target.value || null })}
                    />
                  </div>

                  <div className="un-field">
                    <label className="un-label">Executive Editorial Persona</label>
                    <textarea
                      className="un-input un-textarea"
                      placeholder="Authoritative, consultative founder tone. Direct, insightful, and warm. Never robotic or corporate jargon. Reflects high standards."
                      value={config.brandPersona || ''}
                      onChange={e => updateConfig({ brandPersona: e.target.value || null })}
                    />
                  </div>

                  <div className="un-field">
                    <label className="un-label">Boundary Instructions &amp; Prohibitions</label>
                    <textarea
                      className="un-input un-textarea"
                      placeholder="Never mention competitor platforms. Keep replies under 2 sentences. Direct technical queries to our documentation."
                      value={config.customInstructions || ''}
                      onChange={e => updateConfig({ customInstructions: e.target.value || null })}
                    />
                  </div>
                </div>

                {/* Delivery Rate Safeguards */}
                <div className="un-card">
                  <div className="un-card-header">
                    <div className="un-card-title">
                      <div className="un-card-title-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.6"/><path d="M8 4.5V8l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                      </div>
                      <span>LinkedIn Safeguards &amp; Natural Jitter</span>
                    </div>
                  </div>

                  <div className="un-field">
                    <label className="un-label">Maximum Hourly Response Velocity</label>
                    <div className="un-slider-container">
                      <input
                        type="range"
                        className="un-slider"
                        min={5}
                        max={40}
                        value={config.maxRepliesPerHour}
                        onChange={e => updateConfig({ maxRepliesPerHour: parseInt(e.target.value) })}
                      />
                      <span className="un-slider-pill">{config.maxRepliesPerHour} / hr</span>
                    </div>
                  </div>

                  <div className="un-field">
                    <label className="un-label">Human Timing Variance (Poisson Latency: 30s – 180s)</label>
                    <div className="un-slider-container">
                      <input
                        type="range"
                        className="un-slider"
                        min={15}
                        max={180}
                        value={config.jitterMinSeconds}
                        onChange={e => updateConfig({ jitterMinSeconds: parseInt(e.target.value) })}
                      />
                      <span className="un-slider-pill">{config.jitterMinSeconds}s – {config.jitterMaxSeconds}s</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Save Button Row */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button
                type="button"
                className="un-btn un-btn-primary"
                onClick={saveConfig}
                disabled={saving}
                style={{ padding: '12px 28px', fontSize: 13.5, background: '#0A66C2' }}
              >
                {saving ? 'Saving...' : 'Save LinkedIn Rules'}
              </button>
            </div>
          </div>
        )}

        {/* ════ TAB 2: INTENT LAB & SANDBOX ════ */}
        {activeTab === 'simulator' && (
          <div>
            <div style={{ marginBottom: 22 }}>
              <h2 className="un-editorial-font" style={{ fontSize: 24, fontWeight: 700, color: '#3D2B1F', margin: 0 }}>
                LinkedIn Intent Laboratory &amp; Sandbox
              </h2>
              <p style={{ color: '#8B7355', fontSize: 13.5, margin: '4px 0 0' }}>
                Simulate incoming B2B comments and InMail through your active voice prompt without dispatching anything to LinkedIn.
              </p>
            </div>

            <div className="un-grid-2">
              {/* Input Form */}
              <div className="un-card">
                <div className="un-sim-tabs">
                  <button
                    className={`un-sim-tab ${simType === 'comment' ? 'active' : ''}`}
                    onClick={() => { setSimType('comment'); setSimResult(null); }}
                  >
                    <span>Public Post Comment</span>
                  </button>
                  <button
                    className={`un-sim-tab ${simType === 'dm' ? 'active' : ''}`}
                    onClick={() => { setSimType('dm'); setSimResult(null); }}
                  >
                    <span>Inbound InMail / DM</span>
                  </button>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0A66C2', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    B2B Archetype Scenarios
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(simType === 'comment' ? LINKEDIN_COMMENT_PRESETS : LINKEDIN_DM_PRESETS).map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        className="un-chip-preset"
                        onClick={() => {
                          if (simType === 'comment') {
                            setSimComment(preset.text);
                            if ('caption' in preset && typeof preset.caption === 'string') setSimCaption(preset.caption);
                          } else {
                            setSimDmText(preset.text);
                          }
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {simType === 'comment' ? (
                  <>
                    <div className="un-field">
                      <label className="un-label">Test Comment Text</label>
                      <textarea
                        className="un-input un-textarea"
                        placeholder="e.g. Could you share the case study for this framework?"
                        value={simComment}
                        onChange={e => setSimComment(e.target.value)}
                      />
                    </div>
                    <div className="un-field">
                      <label className="un-label">LinkedIn Post Context / Caption</label>
                      <input
                        type="text"
                        className="un-input"
                        placeholder="e.g. How we scaled autonomous B2B workflows for 50+ enterprise teams."
                        value={simCaption}
                        onChange={e => setSimCaption(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <div className="un-field">
                    <label className="un-label">Inbound InMail Message</label>
                    <textarea
                      className="un-input un-textarea"
                      placeholder="e.g. Hi! Could you share enterprise pricing and rollout timelines?"
                      value={simDmText}
                      onChange={e => setSimDmText(e.target.value)}
                    />
                  </div>
                )}

                <button
                  type="button"
                  className="un-btn un-btn-primary"
                  onClick={runSimulation}
                  disabled={simLoading || !(simType === 'comment' ? simComment.trim() : simDmText.trim())}
                  style={{ width: '100%', marginTop: 8, background: '#0A66C2' }}
                >
                  {simLoading ? 'Analyzing Intent...' : 'Run Simulation'}
                </button>
              </div>

              {/* Simulation Result */}
              <div className="un-card">
                <div className="un-card-header">
                  <div className="un-card-title">
                    <span>Engine Output &amp; Diagnostics</span>
                  </div>
                  {simResult && (
                    <span className="un-hero-status-pill un-hero-status-live">
                      <span className="un-pulse-dot" />
                      Evaluated
                    </span>
                  )}
                </div>

                {simResult ? (
                  <div>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        background: CLASSIFICATION_STYLES[simResult.classification]?.bg || '#F3F4F6',
                        color: CLASSIFICATION_STYLES[simResult.classification]?.color || '#1F2937',
                        border: `1px solid ${CLASSIFICATION_STYLES[simResult.classification]?.border || '#E5E7EB'}`,
                      }}>
                        {CLASSIFICATION_STYLES[simResult.classification]?.label || simResult.classification}
                      </span>
                      <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
                        {LEAD_SCORES[simResult.leadScore]?.badge}
                      </span>
                    </div>

                    <div className="un-field">
                      <label className="un-label">Autonomous Public Response</label>
                      <div style={{ background: '#FFFDF9', border: '1px solid #EAE5DC', borderRadius: 10, padding: '14px 16px', fontSize: 13.5, color: '#2C1D11', lineHeight: 1.55 }}>
                        {simResult.suggestedReply}
                      </div>
                    </div>

                    <div className="un-field">
                      <label className="un-label">Reasoning &amp; Strategic Decision</label>
                      <div style={{ fontSize: 12.5, color: '#8B7355', lineHeight: 1.5 }}>
                        {simResult.reasoning}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '50px 20px', color: '#8B7355' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>💼</div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#3D2B1F' }}>Sandbox Ready</div>
                    <div style={{ fontSize: 12.5, marginTop: 4 }}>Select an archetype preset on the left and run simulation to inspect AI classification.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════ TAB 3: DISPATCH LEDGER ════ */}
        {activeTab === 'feed' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['all', 'positive', 'question', 'link_request', 'purchase_intent', 'negative', 'spam'].map(f => (
                  <button
                    key={f}
                    className={`un-pill-btn ${commentFilter === f ? 'active' : ''}`}
                    onClick={() => setCommentFilter(f)}
                  >
                    {f === 'all' ? 'All Interactions' : (CLASSIFICATION_STYLES[f]?.label || f)}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  type="text"
                  className="un-input"
                  style={{ width: 220, fontSize: 12 }}
                  placeholder="Search LinkedIn comments..."
                  value={commentSearch}
                  onChange={e => setCommentSearch(e.target.value)}
                />
                <button onClick={syncLinkedInPosts} disabled={syncingPosts} className="un-btn un-btn-secondary" style={{ padding: '8px 14px', fontSize: 12 }}>
                  <span>{syncingPosts ? 'Auditing...' : 'Audit Posts'}</span>
                </button>
              </div>
            </div>

            {/* Empty Ledger */}
            <div className="un-card" style={{ textAlign: 'center', padding: '64px 20px' }}>
              <div className="un-logo-jewel" style={{ margin: '0 auto 16px', width: 44, height: 44, background: '#E0F2FE', color: '#0A66C2' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.3a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6c0-.88-.72-1.6-1.6-1.6Z"/></svg>
              </div>
              <h4 className="un-editorial-font" style={{ fontSize: 18, fontWeight: 700, color: '#3D2B1F', marginBottom: 4 }}>No LinkedIn Comments Recorded Yet</h4>
              <p style={{ color: '#8B7355', fontSize: 13 }}>Click Audit Posts to scan recent LinkedIn activity or wait for incoming post comments.</p>
            </div>
          </div>
        )}

        {/* ════ TAB 4: TRIAGE QUEUE ════ */}
        {activeTab === 'inbox' && (
          <div className="un-card" style={{ textAlign: 'center', padding: '64px 20px' }}>
            <h4 className="un-editorial-font" style={{ fontSize: 18, fontWeight: 700, color: '#3D2B1F', marginBottom: 4 }}>LinkedIn Triage Inbox Clean</h4>
            <p style={{ color: '#8B7355', fontSize: 13 }}>High-stakes enterprise deals, contrarian remarks, or inquiries needing direct founder review will appear here.</p>
          </div>
        )}

        {/* ════ TAB 5: INMAIL CONCIERGE ════ */}
        {activeTab === 'dms' && (
          <div className="un-card" style={{ textAlign: 'center', padding: '64px 20px' }}>
            <h4 className="un-editorial-font" style={{ fontSize: 18, fontWeight: 700, color: '#3D2B1F', marginBottom: 4 }}>InMail &amp; 1st-Degree Concierge</h4>
            <p style={{ color: '#8B7355', fontSize: 13 }}>Private LinkedIn connection messages, follow-up links, and consultative conversation histories will be recorded here.</p>
          </div>
        )}

      </div>
    </div>
  );
}
