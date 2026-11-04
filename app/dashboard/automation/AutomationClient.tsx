'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUserContext } from '@/lib/hooks/use-user-context';
import LinkedInAutomationClient from './LinkedInAutomationClient';
import BrandMaterialsSection from './BrandMaterialsSection';
import './automation.css';
import type { AutomationConfig, CommentLog, DmLog, FlaggedComment, SimulateResult } from './types';

// ─── Semantic Style Tokens (Light Premium Biscuit & Champagne) ───────────────

const CLASSIFICATION_STYLES: Record<string, { bg: string; text: string; dot: string; border: string; label: string }> = {
  positive:        { bg: '#ECFDF5', text: '#047857', dot: '#10B981', border: '#A7F3D0', label: 'Positive / Praise' },
  question:        { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6', border: '#BFDBFE', label: 'Audience Question' },
  link_request:    { bg: '#F5F3FF', text: '#6D28D9', dot: '#8B5CF6', border: '#DDD6FE', label: 'Resource / Link Ask' },
  purchase_intent: { bg: '#FEF3C7', text: '#B45309', dot: '#F59E0B', border: '#FDE68A', label: 'High Intent / Buyer' },
  negative:        { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444', border: '#FECACA', label: 'Negative Sentiment' },
  spam:            { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8', border: '#CBD5E1', label: 'Spam / Automated' },
  harmful:         { bg: '#FFF1F2', text: '#BE123C', dot: '#F43F5E', border: '#FECDD3', label: 'Harmful / Moderation' },
  unrelated:       { bg: '#F8FAFC', text: '#64748B', dot: '#94A3B8', border: '#E2E8F0', label: 'General Conversation' },
  support:         { bg: '#FFFBEB', text: '#92400E', dot: '#D97706', border: '#FDE68A', label: 'Support Request' },
};

const LEAD_SCORES: Record<number, { label: string; text: string; bg: string; border: string }> = {
  0: { label: 'Casual Viewer', text: '#64748B', bg: '#F1F5F9', border: '#CBD5E1' },
  1: { label: 'Engaged Prospect', text: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  2: { label: 'Hot Lead', text: '#B45309', bg: '#FEF3C7', border: '#FDE68A' },
  3: { label: 'Ready to Transact', text: '#047857', bg: '#ECFDF5', border: '#A7F3D0' },
};

const COMMENT_PRESETS = [
  { label: 'Resource Link Request', text: 'Where can I get this template? Can you send me the download link?', caption: 'New enterprise workflow template just launched for engineering teams.' },
  { label: 'Commercial Intent', text: 'How much does this cost per seat? I need this implemented by next week!', caption: 'Pricing, packages, and SLA tiers for our automation engine.' },
  { label: 'Genuine Praise', text: 'This system completely transformed our creator workflow. Incredible build!', caption: 'Behind the scenes of how we scaled async publishing.' },
  { label: 'Technical Inquiry', text: 'Does this support Supabase webhooks and multi-account dispatch?', caption: 'Architecture breakdown of our high-concurrency event system.' },
  { label: 'Customer Complaint', text: 'Payment went through but my access key was not delivered. Need help ASAP.', caption: 'Weekly platform changelog and status note.' },
  { label: 'Spam Comment', text: 'Earn $5000 a day using this secret trading bot! Send DM to start.', caption: 'Community announcements and upcoming live sessions.' },
];

const DM_PRESETS = [
  { label: 'Pricing & Access', text: 'Hello! Could you share the current pricing tiers and if you offer team onboarding?' },
  { label: 'Story Resource Ask', text: 'Hey! Dropping in from your story—can you send the automation cheatsheet link?' },
  { label: 'Partnership Offer', text: 'Hi team, love the software. Would you be open to an integration partner call?' },
  { label: 'Escalation Issue', text: 'My webhook stopped receiving Instagram events 2 hours ago. Can someone review this?' },
];

// ─── Custom Stylesheet: Light Luxury Biscuit System ──────────────────────────

// In-memory module cache for instant (0ms) revisits across sidebar navigation
let memoryAutomationConfig: AutomationConfig | null = null;
let memoryIgConnection: { status: 'connected' | 'not_connected' | 'expired'; username?: string } | null = null;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AutomationClient({
  workspaceId: initialWorkspaceId,
  userId: initialUserId,
}: {
  workspaceId: string | null;
  userId?: string;
}) {
  const userCtx = useUserContext();
  const workspaceId = initialWorkspaceId || userCtx?.workspace?.id || null;
  const userId = initialUserId || userCtx?.user?.id || '';

  const [platform, setPlatform] = useState<'instagram' | 'linkedin'>('instagram');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const p = params.get('platform');
      if (p === 'linkedin' || p === 'instagram') {
        setPlatform(p);
      }
      const t = params.get('tab');
      if (t && ['control', 'materials', 'simulator', 'feed', 'inbox', 'dms'].includes(t)) {
        setActiveTab(t as any);
      }
    }
  }, []);

  const handlePlatformChange = (p: 'instagram' | 'linkedin') => {
    setPlatform(p);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('platform', p);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleTabChange = (tabId: 'control' | 'materials' | 'simulator' | 'feed' | 'inbox' | 'dms') => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const [activeTab, setActiveTab] = useState<'control' | 'materials' | 'simulator' | 'feed' | 'inbox' | 'dms'>('control');
  const [config, setConfig] = useState<AutomationConfig | null>(() => memoryAutomationConfig);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(() => !memoryAutomationConfig);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [igConnection, setIgConnection] = useState<{ status: 'connected' | 'not_connected' | 'expired'; username?: string } | null>(() => memoryIgConnection);
  const [comments, setComments] = useState<CommentLog[]>([]);
  const [commentStats, setCommentStats] = useState<any>(null);
  const [commentFilter, setCommentFilter] = useState('all');
  const [commentSearch, setCommentSearch] = useState('');
  const [commentPage, setCommentPage] = useState(1);
  const [feedLoading, setFeedLoading] = useState(false);
  const [dms, setDms] = useState<DmLog[]>([]);
  const [dmStats, setDmStats] = useState<any>(null);
  const [dmsLoading, setDmsLoading] = useState(false);
  const [flagged, setFlagged] = useState<FlaggedComment[]>([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [inboxLoading, setInboxLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [editReplies, setEditReplies] = useState<Record<string, string>>({});
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [simType, setSimType] = useState<'comment' | 'dm'>('comment');
  const [simComment, setSimComment] = useState('');
  const [simCaption, setSimCaption] = useState('');
  const [simDmText, setSimDmText] = useState('');
  const [simResult, setSimResult] = useState<SimulateResult | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [syncingWebhook, setSyncingWebhook] = useState(false);
  const [syncingComments, setSyncingComments] = useState(false);
  const [syncDiagnostics, setSyncDiagnostics] = useState<any[] | null>(null);
  const [metaWithheldInfo, setMetaWithheldInfo] = useState<{
    postsWithCommentsCount: number;
    mediaCount: number;
    diagnostics: any[];
  } | null>(null);
  const [showDiagnosticsDetail, setShowDiagnosticsDetail] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const syncLiveComments = async () => {
    if (!workspaceId) return;
    setSyncingComments(true);
    try {
      const res = await fetch('/api/instagram/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.diagnostics) {
          setSyncDiagnostics(data.diagnostics);
        }
        if (data.metaWithheld || (data.postsWithCommentsCount > 0 && data.totalCommentsExamined === 0)) {
          setMetaWithheldInfo({
            postsWithCommentsCount: data.postsWithCommentsCount,
            mediaCount: data.mediaCount,
            diagnostics: data.diagnostics || [],
          });
          showToast(`Audited ${data.mediaCount} posts (${data.postsWithCommentsCount} with comments). Meta withheld them — see Dev Mode guide below.`, 'error');
        } else {
          setMetaWithheldInfo(null);
          if (data.newCommentsProcessed > 0) {
            showToast(`Synced ${data.newCommentsProcessed} comment${data.newCommentsProcessed > 1 ? 's' : ''} (${data.repliesPosted} auto-replied)!`, 'success');
          } else if (data.totalCommentsExamined > 0) {
            showToast(`Audited ${data.totalCommentsExamined} comments across ${data.mediaCount || 0} posts — all up to date.`, 'success');
          } else if (data.mediaCount === 0) {
            showToast('No Instagram posts found for this account. Ensure account has published posts.', 'error');
          } else {
            showToast(`Audited ${data.mediaCount} post${data.mediaCount > 1 ? 's' : ''}. No comments found on Instagram.`, 'success');
          }
        }
      } else {
        showToast(data.message || data.error || 'Failed to sync comments', 'error');
      }
    } catch {
      showToast('Error syncing comments with Instagram', 'error');
    } finally {
      setSyncingComments(false);
      loadComments();
    }
  };

  const syncWebhook = async () => {
    if (!workspaceId) return;
    setSyncingWebhook(true);
    try {
      const res = await fetch('/api/instagram/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Meta Graph API webhooks synchronized successfully');
      } else {
        showToast(data.error || 'Failed to sync webhook with Meta API', 'error');
      }
    } catch {
      showToast('Network error connecting to webhook endpoint', 'error');
    } finally {
      setSyncingWebhook(false);
    }
  };

  useEffect(() => {
    fetch('/api/platform/connections', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const ig = data?.connections?.instagram || data?.instagram;
        if (ig) {
          memoryIgConnection = ig;
          setIgConnection(ig);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!workspaceId) { setLoading(false); return; }
    fetch(`/api/instagram/automation?workspaceId=${workspaceId}`)
      .then(r => r.json())
      .then(data => {
        memoryAutomationConfig = data;
        setConfig(data);
        setLoading(false);
      })
      .catch(() => { setLoading(false); showToast('Failed to load automation config', 'error'); });
  }, [workspaceId]);

  const loadComments = useCallback(async () => {
    if (!workspaceId) return;
    setFeedLoading(true);
    try {
      const res = await fetch(`/api/instagram/comments?workspaceId=${workspaceId}&page=${commentPage}&limit=25&classification=${commentFilter}`);
      const data = await res.json();
      setComments(data.comments || []);
      setCommentStats(data.stats || null);
    } finally {
      setFeedLoading(false);
    }
  }, [workspaceId, commentPage, commentFilter]);

  const loadFlagged = useCallback(async () => {
    if (!workspaceId) return;
    setInboxLoading(true);
    try {
      const res = await fetch(`/api/instagram/flagged?workspaceId=${workspaceId}&status=${statusFilter}`);
      const data = await res.json();
      setFlagged(data.flagged || []);
      setPendingCount(data.statusCounts?.pending || 0);
    } finally {
      setInboxLoading(false);
    }
  }, [workspaceId, statusFilter]);

  const loadDms = useCallback(async () => {
    if (!workspaceId) return;
    setDmsLoading(true);
    try {
      const res = await fetch(`/api/instagram/dms?workspaceId=${workspaceId}`);
      const data = await res.json();
      setDms(data.dms || []);
      setDmStats(data.stats || null);
    } finally {
      setDmsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { if (activeTab === 'feed') loadComments(); }, [activeTab, loadComments]);
  useEffect(() => { if (activeTab === 'inbox') loadFlagged(); }, [activeTab, loadFlagged]);
  useEffect(() => { if (activeTab === 'dms') loadDms(); }, [activeTab, loadDms]);

  useEffect(() => {
    if (!workspaceId) return;
    let channel: any = null;
    (async () => {
      try {
        const { getSupabaseBrowserClient } = await import('@/lib/supabase/browser');
        const supabase = getSupabaseBrowserClient();
        channel = supabase.channel(`signaldm-live-${workspaceId}`)
          .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'instagram_comment_logs', filter: `workspace_id=eq.${workspaceId}` }, () => { loadComments(); })
          .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'instagram_flagged_comments', filter: `workspace_id=eq.${workspaceId}` }, () => { loadFlagged(); })
          .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'instagram_dm_logs', filter: `workspace_id=eq.${workspaceId}` }, () => { loadDms(); })
          .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'instagram_flagged_dms', filter: `workspace_id=eq.${workspaceId}` }, () => { loadFlagged(); })
          .subscribe((status: string) => { if (status === 'SUBSCRIBED') console.log('[SignalDM] Realtime connected'); });
      } catch (err) {
        console.warn('[SignalDM] Realtime subscription notice', err);
      }
    })();
    return () => {
      if (channel) {
        import('@/lib/supabase/browser').then(({ getSupabaseBrowserClient }) => {
          getSupabaseBrowserClient().removeChannel(channel!);
        }).catch(() => {});
      }
    };
  }, [workspaceId, loadComments, loadFlagged, loadDms]);

  const saveConfig = async () => {
    if (!workspaceId || !config) return;
    setSaving(true);
    try {
      const res = await fetch('/api/instagram/automation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, ...config }),
      });
      if (res.ok) showToast('Automation settings saved successfully');
      else showToast('Failed to save configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const runSimulator = async () => {
    if (!workspaceId) return;
    const inputText = simType === 'comment' ? simComment : simDmText;
    if (!inputText.trim()) return;
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await fetch('/api/instagram/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          commentText: simType === 'comment' ? simComment : undefined,
          postCaption: simType === 'comment' ? simCaption : undefined,
          isDmSimulation: simType === 'dm',
          dmText: simType === 'dm' ? simDmText : undefined,
        }),
      });
      const data = await res.json();
      setSimResult(data);
    } finally {
      setSimLoading(false);
    }
  };

  const flaggedAction = async (id: string, action: 'approve' | 'reject' | 'reply', ownerReply?: string) => {
    if (!workspaceId) return;
    try {
      const res = await fetch(`/api/instagram/flagged/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, action, ownerReply }),
      });
      if (res.ok) {
        showToast(action === 'reject' ? 'Dismissed item' : 'Response dispatched');
        loadFlagged();
      } else {
        const err = await res.json();
        showToast(err.error || 'Action failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    }
  };

  const updateConfig = (patch: Partial<AutomationConfig>) => {
    setConfig(prev => prev ? { ...prev, ...patch } : prev);
  };

  // ─── SVG Icons ──────────────────────────────────────────────────────────────
  const SvgSignal = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 18a6 6 0 100-12 6 6 0 000 12z" stroke="#C4A265" strokeWidth="2" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="#C4A265" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
  const SvgGrid = () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="9" y="2" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="2" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="9" y="9" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
  const SvgPlay = () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M4 3l9 5-9 5V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
  const SvgMessage = () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M14 2.5H2A1.5 1.5 0 00.5 4v7A1.5 1.5 0 002 12.5h3v2.5l3.5-2.5H14a1.5 1.5 0 001.5-1.5V4A1.5 1.5 0 0014 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
  const SvgStar = () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5l2.2 4.5 4.8.7-3.5 3.4.8 4.9L8 12.7 3.7 15l.8-4.9-3.5-3.4 4.8-.7L8 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
  const SvgMail = () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="3" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 4.5l6 4.5 6-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  const SvgRefresh = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M2 8a6 6 0 116 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M2 12V8h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  const SvgCheck = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 8.5l4 4 7-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  const SvgSparkle = () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M8 1v14M1 8h14M3 3l10 10M3 13L13 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );

  if (!workspaceId && userCtx?.loading) {
    return (
      <>
        
        <div className="un-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="un-spinner" />
            <p style={{ color: '#8B7355', fontSize: 13, fontWeight: 500 }}>Connecting workspace session...</p>
          </div>
        </div>
      </>
    );
  }

  if (!workspaceId) {
    return (
      <>
        
        <div className="un-root">
          <div style={{ textAlign: 'center', padding: '90px 20px' }}>
            <div className="un-logo-jewel" style={{ margin: '0 auto 20px', width: 52, height: 52 }}><SvgSignal /></div>
            <h2 className="un-editorial-font" style={{ fontSize: 24, fontWeight: 700, color: '#3D2B1F', marginBottom: 8 }}>Workspace Required</h2>
            <p style={{ color: '#8B7355', fontSize: 13.5, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>Please select or connect an active workspace to launch SignalDM automation.</p>
            <a href="/dashboard" className="un-btn un-btn-primary">Return to Overview</a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      
      <div className="un-root">

        {/* ── Top Platform Navigation (Instagram vs LinkedIn) matching reference design ── */}
        <div className="un-platform-bar">
          <div className="un-platform-bar-inner">
            <button
              type="button"
              className={`un-platform-tab ${platform === 'instagram' ? 'active' : ''}`}
              onClick={() => handlePlatformChange('instagram')}
            >
              Instagram
            </button>
            <button
              type="button"
              className={`un-platform-tab ${platform === 'linkedin' ? 'active' : ''}`}
              onClick={() => handlePlatformChange('linkedin')}
            >
              LinkedIn
            </button>
          </div>
        </div>

        {platform === 'linkedin' ? (
          <LinkedInAutomationClient workspaceId={workspaceId} userId={userId} />
        ) : (
          (loading || !config) ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
              <div style={{ textAlign: 'center' }}>
                <div className="un-spinner" />
                <p style={{ color: '#8B7355', fontSize: 13.5, fontWeight: 600 }}>Calibrating SignalDM Engine...</p>
              </div>
            </div>
          ) : (
            <>

        {/* ── Editorial Header ── */}
        <div className="un-header">
          <div className="un-header-max">
            <div className="un-top-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="un-logo-jewel"><SvgSignal /></div>
                <div>
                  <div className="un-title un-editorial-font">SignalDM</div>
                  <div className="un-subtitle">Autonomous Instagram Inbound Engagement &amp; Routing Engine</div>
                </div>
              </div>

              {/* Status Jewel & Connection Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {igConnection?.status === 'connected' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 20, background: '#ECFDF5', border: '1px solid #A7F3D0', fontSize: 12.5, fontWeight: 600, color: '#047857' }}>
                      <span className="un-pulse-dot" />
                      <span>@{igConnection.username || 'instagram'}</span>
                      <span style={{ color: '#059669', opacity: 0.7, fontSize: 11 }}>Active API</span>
                    </div>
                    <button onClick={syncWebhook} disabled={syncingWebhook} className="un-btn un-btn-secondary" style={{ padding: '6px 13px', fontSize: 12 }}>
                      <SvgRefresh />
                      <span>{syncingWebhook ? 'Syncing API...' : 'Sync Webhook'}</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="un-tabs-bar">
              {[
                { id: 'control',   label: 'Engine Controls',     icon: <SvgGrid /> },
                { id: 'materials', label: 'Brand & Materials',   icon: <SvgSparkle /> },
                { id: 'simulator', label: 'Intent Lab',           icon: <SvgPlay /> },
                { id: 'feed',      label: 'Dispatch Ledger',      icon: <SvgMessage />, badge: commentStats?.total },
                { id: 'inbox',     label: 'Triage Queue',        icon: <SvgStar />,    badge: pendingCount || undefined },
                { id: 'dms',       label: 'DM Concierge',        icon: <SvgMail />,    badge: dmStats?.total },
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`un-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => handleTabChange(tab.id as any)}
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
              {/* Instagram Offline Alert */}
              {igConnection && igConnection.status !== 'connected' && (
                <div style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', borderRadius: 16, padding: '16px 22px', marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: '#B91C1C', fontWeight: 700, fontSize: 14 }}>Instagram Account Not Linked</div>
                    <div style={{ color: '#7F1D1D', fontSize: 12.5, marginTop: 2 }}>Connect an Instagram Professional or Creator account to enable real-time webhooks and comment parsing.</div>
                  </div>
                  <a href={`/api/auth/platform/connect?platform=instagram&workspaceId=${workspaceId || ''}&userId=${userId || ''}`} className="un-btn un-btn-primary" style={{ fontSize: 12.5 }}>Connect Account</a>
                </div>
              )}

              {/* Master Power Command Hero */}
              <div className="un-master-hero">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h3 className="un-editorial-font" style={{ fontSize: 20, fontWeight: 700, color: '#3D2B1F', margin: 0 }}>
                        Autonomous Engine Dispatcher
                      </h3>
                      <span className={`un-hero-status-pill ${config.enabled ? 'un-hero-status-live' : 'un-hero-status-idle'}`}>
                        {config.enabled && <span className="un-pulse-dot" />}
                        {config.enabled ? 'Real-Time Active' : 'Standby Mode'}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#8B7355', margin: '4px 0 0', fontWeight: 500 }}>
                      {config.enabled
                        ? 'Inbound comments and DMs are parsed through natural language intent filters. Replies are dispatched with randomized human jitter.'
                        : 'Automation is currently paused. Received interactions will be recorded in the ledger without dispatching automated responses.'}
                    </p>
                  </div>
                </div>

                {/* The Horology Master Switch */}
                <label className="un-master-switch" title={config.enabled ? 'Click to pause automation' : 'Click to activate automation'}>
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={e => updateConfig({ enabled: e.target.checked })}
                  />
                  <div className="un-master-track" />
                  <div className="un-master-thumb">
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1v5M3.5 3.5A5 5 0 1010.5 3.5" stroke={config.enabled ? '#C4A265' : '#A69279'} strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                </label>
              </div>

              {/* 2-Column Rules Architecture */}
              <div className="un-grid-2">
                {/* Column 1: Comment Trigger Rules */}
                <div>
                  <div className="un-card">
                    <div className="un-card-header">
                      <div className="un-card-title">
                        <div className="un-card-title-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}><SvgMessage /></div>
                        <span>Comment Intent Recognition Protocols</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#8B7355', background: '#F5EFE2', padding: '2px 8px', borderRadius: 6 }}>Bespoke Rocker Controls</span>
                    </div>

                    {[
                      { key: 'autoReplyPositive',      color: 'color-emerald',  label: 'Praise & Community Delight',  desc: 'Warm acknowledgments for testimonials, applause, and appreciation' },
                      { key: 'autoReplyQuestions',     color: 'color-sapphire', label: 'Direct Knowledge Queries',     desc: 'Context-aware factual replies to product & technical questions' },
                      { key: 'autoReplyLinkRequests',  color: 'color-amethyst', label: 'Resource Link Dispatch',       desc: 'Public response + private DM delivery for resource requests' },
                      { key: 'autoReplyPurchaseIntent',color: 'color-amber',    label: 'Buyer & Commercial Intent',    desc: 'High-priority routing for pricing asks and purchase signals' },
                      { key: 'flagNegative',           color: 'color-coral',    label: 'Flag Negative Sentiment',      desc: 'Route dissatisfied remarks directly to human triage inbox' },
                      { key: 'flagSpam',               color: 'color-coral',    label: 'Filter Spam & Crypto Bots',    desc: 'Auto-quarantine repetitive scams, bots, and malicious links' },
                      { key: 'threadChainingEnabled',  color: 'color-gold',     label: 'Thread Continuity Chaining',   desc: 'Conclude replies with conversation hooks to boost algorithmic reach' },
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

                  {/* Rate Limiting & Natural Jitter */}
                  <div className="un-card">
                    <div className="un-card-header">
                      <div className="un-card-title">
                        <div className="un-card-title-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
                          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.6"/><path d="M8 4.5V8l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                        </div>
                        <span>Delivery Rate Safeguards &amp; Natural Jitter</span>
                      </div>
                    </div>

                    <div className="un-field">
                      <label className="un-label">Maximum Hourly Response Velocity</label>
                      <div className="un-slider-container">
                        <input
                          type="range"
                          className="un-slider"
                          min={5}
                          max={60}
                          value={config.maxRepliesPerHour}
                          onChange={e => updateConfig({ maxRepliesPerHour: parseInt(e.target.value) })}
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
                          max={60}
                          value={config.jitterMinSeconds}
                          onChange={e => updateConfig({ jitterMinSeconds: parseInt(e.target.value) })}
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
                        />
                        <span className="un-slider-pill">{config.jitterMaxSeconds}s</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#8B7355', marginTop: 8 }}>
                        Introduces randomized delay between detection and posting, preserving natural creator timing profiles.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Brand Voice & DM Operations */}
                <div>
                  {/* Brand Voice Studio */}
                  <div className="un-card">
                    <div className="un-card-header">
                      <div className="un-card-title">
                        <div className="un-card-title-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M12 2l2 2-9 9H3v-2l9-9z" stroke="currentColor" strokeWidth="1.5"/></svg>
                        </div>
                        <span>Brand Voice &amp; Resource Delivery</span>
                      </div>
                    </div>

                    <div className="un-field">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <label className="un-label" style={{ margin: 0 }}>Canonical Resource Link (Dispatched for link requests)</label>
                        <button
                          type="button"
                          onClick={() => setActiveTab('materials')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#7C3AED',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <span>Manage Brand Materials</span>
                          <span style={{ fontSize: 13 }}>→</span>
                        </button>
                      </div>
                      <input
                        type="url"
                        className="un-input"
                        placeholder="https://yourbrand.com/blueprint or https://unool.co/u/username/page"
                        value={config.linkUrl || ''}
                        onChange={e => updateConfig({ linkUrl: e.target.value || null })}
                      />
                    </div>

                    <div className="un-field">
                      <label className="un-label">Brand Editorial Persona</label>
                      <textarea
                        className="un-input un-textarea"
                        placeholder="Warm, thoughtful founder tone. Authoritative yet conversational. Never robotic or sycophantic. Reflects high standards."
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

                  {/* Inbound Direct Messaging Concierge */}
                  <div className="un-card">
                    <div className="un-card-header">
                      <div className="un-card-title">
                        <div className="un-card-title-icon" style={{ background: '#ECFDF5', color: '#047857' }}><SvgMail /></div>
                        <span>Inbound Direct Messaging (DM) Protocols</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#8B7355', background: '#F5EFE2', padding: '2px 8px', borderRadius: 6 }}>Channel Switches</span>
                    </div>

                    <div className="un-rule-row">
                      <div>
                        <div className="un-rule-name">Autonomous DM Auto-Responder</div>
                        <div className="un-rule-desc">Instantly address inbound private messages based on knowledge base</div>
                      </div>
                      <label className="un-channel-switch">
                        <input
                          type="checkbox"
                          checked={config.dmAutoReplyEnabled}
                          onChange={e => updateConfig({ dmAutoReplyEnabled: e.target.checked })}
                        />
                        <div className="un-channel-track" />
                        <div className="un-channel-thumb">
                          <div className="un-channel-thumb-ridges"><span /><span /><span /></div>
                        </div>
                      </label>
                    </div>

                    <div className="un-rule-row">
                      <div>
                        <div className="un-rule-name">Human Escalation Routing</div>
                        <div className="un-rule-desc">Flag nuanced or high-stakes inquiries for direct owner reply</div>
                      </div>
                      <label className="un-channel-switch">
                        <input
                          type="checkbox"
                          checked={config.dmEscalationEnabled}
                          onChange={e => updateConfig({ dmEscalationEnabled: e.target.checked })}
                        />
                        <div className="un-channel-track" />
                        <div className="un-channel-thumb">
                          <div className="un-channel-thumb-ridges"><span /><span /><span /></div>
                        </div>
                      </label>
                    </div>

                    <div className="un-field" style={{ marginTop: 14 }}>
                      <label className="un-label">Hourly DM Reply Ceiling</label>
                      <div className="un-slider-container">
                        <input
                          type="range"
                          className="un-slider"
                          min={5}
                          max={50}
                          value={config.dmMaxRepliesPerHour}
                          onChange={e => updateConfig({ dmMaxRepliesPerHour: parseInt(e.target.value) })}
                        />
                        <span className="un-slider-pill">{config.dmMaxRepliesPerHour} / hr</span>
                      </div>
                    </div>

                    <div className="un-field">
                      <label className="un-label">First-Contact Welcome Greeting</label>
                      <textarea
                        className="un-input un-textarea"
                        placeholder="Hello! Thanks for reaching out. What can our team assist you with today?"
                        value={config.dmWelcomeMessage || ''}
                        onChange={e => updateConfig({ dmWelcomeMessage: e.target.value || null })}
                      />
                    </div>

                    <div className="un-field">
                      <label className="un-label">DM Knowledge Repository (FAQ &amp; Product Truths)</label>
                      <textarea
                        className="un-input un-textarea"
                        style={{ minHeight: 110 }}
                        placeholder={"Product FAQs:\n- Enterprise package includes 1-on-1 team onboarding\n- Next cohort enrollment opens on the 1st\n- Refund policy: 14-day complete satisfaction guarantee"}
                        value={config.dmKnowledgeBase || ''}
                        onChange={e => updateConfig({ dmKnowledgeBase: e.target.value || null })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Persistent Save Station */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, paddingTop: 18, borderTop: '1px solid #E8E0D4' }}>
                <button className="un-btn un-btn-primary" onClick={saveConfig} disabled={saving} style={{ minWidth: 150 }}>
                  {saving ? (
                    <span>Saving Changes...</span>
                  ) : (
                    <>
                      <SvgCheck />
                      <span>Save Automation Rules</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ════ TAB: BRAND & PRODUCT MATERIALS HUB ════ */}
          {activeTab === 'materials' && (
            <BrandMaterialsSection
              workspaceId={workspaceId}
              userId={userId}
              currentLinkUrl={config.linkUrl}
              onLinkCreated={(url) => {
                updateConfig({ linkUrl: url });
              }}
            />
          )}

          {/* ════ TAB 2: LIVE SIMULATOR ════ */}
          {activeTab === 'simulator' && (
            <div>
              <div style={{ marginBottom: 22 }}>
                <h2 className="un-editorial-font" style={{ fontSize: 24, fontWeight: 700, color: '#3D2B1F', margin: 0 }}>
                  Intent Laboratory &amp; Sandbox
                </h2>
                <p style={{ color: '#8B7355', fontSize: 13.5, margin: '4px 0 0' }}>
                  Simulate incoming audience interactions through your active rules and voice prompt without dispatching anything to Meta.
                </p>
              </div>

              <div className="un-grid-2">
                {/* Left Bench: Input Form */}
                <div className="un-card">
                  <div className="un-sim-tabs">
                    <button
                      className={`un-sim-tab ${simType === 'comment' ? 'active' : ''}`}
                      onClick={() => { setSimType('comment'); setSimResult(null); }}
                    >
                      <SvgMessage />
                      <span>Public Comment</span>
                    </button>
                    <button
                      className={`un-sim-tab ${simType === 'dm' ? 'active' : ''}`}
                      onClick={() => { setSimType('dm'); setSimResult(null); }}
                    >
                      <SvgMail />
                      <span>Inbound DM</span>
                    </button>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#8B7355', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                      Quick Archetype Scenarios
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(simType === 'comment' ? COMMENT_PRESETS : DM_PRESETS).map(preset => (
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
                          placeholder="e.g. Could you send the link to this workflow? Need to share with my co-founder."
                          value={simComment}
                          onChange={e => setSimComment(e.target.value)}
                        />
                      </div>
                      <div className="un-field">
                        <label className="un-label">Post Caption Context (Optional)</label>
                        <textarea
                          className="un-input un-textarea"
                          placeholder="5 lessons learned scaling async workflows..."
                          value={simCaption}
                          onChange={e => setSimCaption(e.target.value)}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="un-field">
                      <label className="un-label">Inbound Direct Message</label>
                      <textarea
                        className="un-input un-textarea"
                        placeholder="e.g. Hi there! How much does your enterprise coaching tier cost?"
                        value={simDmText}
                        onChange={e => setSimDmText(e.target.value)}
                      />
                    </div>
                  )}

                  <button
                    className="un-btn un-btn-primary"
                    onClick={runSimulator}
                    disabled={simLoading || !(simType === 'comment' ? simComment : simDmText).trim()}
                    style={{ width: '100%', marginTop: 6 }}
                  >
                    {simLoading ? (
                      <span>Classifying Intent &amp; Composing...</span>
                    ) : (
                      <>
                        <SvgPlay />
                        <span>Run Decision Engine</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Right Bench: Simulation Diagnostics */}
                <div>
                  {!simResult && !simLoading && (
                    <div className="un-card" style={{ textAlign: 'center', padding: '64px 24px' }}>
                      <div className="un-logo-jewel" style={{ margin: '0 auto 16px', width: 44, height: 44, opacity: 0.7 }}><SvgPlay /></div>
                      <h4 className="un-editorial-font" style={{ fontSize: 18, fontWeight: 700, color: '#3D2B1F', marginBottom: 6 }}>Ready for Execution</h4>
                      <p style={{ color: '#8B7355', fontSize: 13, maxWidth: 300, margin: '0 auto' }}>
                        Select a preset or enter sample text to evaluate classification certainty, lead score, and draft responses.
                      </p>
                    </div>
                  )}

                  {simLoading && (
                    <div className="un-card" style={{ textAlign: 'center', padding: '64px 24px' }}>
                      <div className="un-spinner" />
                      <p style={{ color: '#3D2B1F', fontSize: 13.5, fontWeight: 600 }}>Analyzing semantic intent...</p>
                    </div>
                  )}

                  {simResult && !simLoading && (
                    <div className="un-result-card">
                      {simResult.blocked ? (
                        <div>
                          <div style={{ color: '#DC2626', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Interaction Filtered by Safeguards</div>
                          <p style={{ color: '#8B7355', fontSize: 13 }}>{simResult.reason}</p>
                        </div>
                      ) : (
                        <>
                          {/* Classification Jewel & Confidence */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                            {(() => {
                              const style = CLASSIFICATION_STYLES[simResult.classification] || CLASSIFICATION_STYLES['unrelated'];
                              return (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 20, background: style.bg, border: `1px solid ${style.border}`, color: style.text, fontSize: 12.5, fontWeight: 700 }}>
                                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: style.dot }} />
                                  <span>{style.label}</span>
                                </span>
                              );
                            })()}
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#8B7355' }}>
                              {Math.round(simResult.confidence * 100)}% Confidence
                            </span>
                          </div>

                          {/* Confidence Progress Bar */}
                          <div style={{ height: 5, background: '#EFE9DF', borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
                            <div style={{ height: '100%', width: `${Math.round(simResult.confidence * 100)}%`, background: 'linear-gradient(90deg, #C4A265, #059669)', borderRadius: 3 }} />
                          </div>

                          {/* Lead Qualification Pill */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: '#F7F3ED', border: '1px solid #E8E0D4', marginBottom: 16 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#8B7355' }}>Lead Classification:</span>
                            {(() => {
                              const score = LEAD_SCORES[simResult.leadScore] || LEAD_SCORES[0];
                              return (
                                <span style={{ fontSize: 12, fontWeight: 700, color: score.text, background: score.bg, border: `1px solid ${score.border}`, padding: '2px 9px', borderRadius: 14 }}>
                                  {score.label}
                                </span>
                              );
                            })()}
                          </div>

                          {/* Action Badges */}
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 14, background: simResult.wouldAutoReply ? '#ECFDF5' : '#F1F5F9', color: simResult.wouldAutoReply ? '#047857' : '#64748B', border: `1px solid ${simResult.wouldAutoReply ? '#A7F3D0' : '#CBD5E1'}` }}>
                              {simResult.wouldAutoReply ? '✓ Public Reply Triggered' : '— No Public Reply'}
                            </span>
                            {simResult.wouldSendDM !== undefined && (
                              <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 14, background: simResult.wouldSendDM ? '#F5F3FF' : '#F1F5F9', color: simResult.wouldSendDM ? '#6D28D9' : '#64748B', border: `1px solid ${simResult.wouldSendDM ? '#DDD6FE' : '#CBD5E1'}` }}>
                                {simResult.wouldSendDM ? '✓ Private DM Triggered' : '— No DM Triggered'}
                              </span>
                            )}
                            {simResult.wouldFlag && (
                              <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 14, background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>
                                ⚠ Flagged for Human Review
                              </span>
                            )}
                          </div>

                          {/* Response Previews */}
                          {simResult.suggestedReply && (
                            <div style={{ marginBottom: 14 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#8B7355', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Generated Public Comment</div>
                              <div style={{ background: '#FAF7F2', border: '1px solid #E8E0D4', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#3D2B1F', lineHeight: 1.6 }}>
                                {simResult.suggestedReply}
                              </div>
                            </div>
                          )}

                          {simResult.suggestedDM && (
                            <div style={{ marginBottom: 14 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#8B7355', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Generated Private DM</div>
                              <div style={{ background: '#FAF7F2', border: '1px solid #E8E0D4', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#3D2B1F', lineHeight: 1.6 }}>
                                {simResult.suggestedDM}
                              </div>
                            </div>
                          )}

                          {simResult.threadHook && (
                            <div style={{ marginBottom: 14 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#C4A265', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Appended Thread Hook</div>
                              <div style={{ fontSize: 12.5, color: '#8B7355', fontStyle: 'italic' }}>
                                "{simResult.threadHook}"
                              </div>
                            </div>
                          )}

                          {simResult.reasoning && (
                            <div style={{ borderTop: '1px solid #EFE9DF', paddingTop: 12, marginTop: 14 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#8B7355', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Decision Rationale</div>
                              <div style={{ fontSize: 12, color: '#8B7355', lineHeight: 1.6 }}>
                                {simResult.reasoning}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════ TAB 3: COMMENT FEED ════ */}
          {activeTab === 'feed' && (
            <div>
              {/* Stat Tiles */}
              {commentStats && (
                <div className="un-stat-grid">
                  <div className="un-stat-tile">
                    <div className="un-stat-num un-editorial-font">{commentStats.total}</div>
                    <div className="un-stat-label">Total Audited</div>
                  </div>
                  <div className="un-stat-tile">
                    <div className="un-stat-num un-editorial-font" style={{ color: '#047857' }}>{commentStats.autoReplied}</div>
                    <div className="un-stat-label">Automated Replies</div>
                  </div>
                  <div className="un-stat-tile">
                    <div className="un-stat-num un-editorial-font" style={{ color: '#1D4ED8' }}>{commentStats.dmsSent}</div>
                    <div className="un-stat-label">Direct Messages</div>
                  </div>
                  <div className="un-stat-tile">
                    <div className="un-stat-num un-editorial-font" style={{ color: '#B45309' }}>{commentStats.flagged}</div>
                    <div className="un-stat-label">Human Review Queue</div>
                  </div>
                </div>
              )}

              {/* Filter Controls & Search */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
                <div className="un-filter-pills">
                  {['all', 'positive', 'question', 'link_request', 'purchase_intent', 'negative', 'spam', 'harmful'].map(f => (
                    <button
                      key={f}
                      className={`un-filter-pill ${commentFilter === f ? 'active' : ''}`}
                      onClick={() => { setCommentFilter(f); setCommentPage(1); }}
                    >
                      {f === 'all' ? 'All Interactions' : CLASSIFICATION_STYLES[f]?.label || f}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    className="un-input"
                    placeholder="Search comments or @user..."
                    value={commentSearch}
                    onChange={e => setCommentSearch(e.target.value)}
                    style={{ width: 220, padding: '8px 12px', fontSize: 12.5 }}
                  />
                  <button
                    className="un-btn un-btn-secondary"
                    onClick={syncLiveComments}
                    disabled={syncingComments || feedLoading}
                    style={{ padding: '8px 14px', fontSize: 12 }}
                  >
                    <SvgRefresh />
                    <span>{syncingComments ? 'Syncing...' : 'Audit Posts'}</span>
                  </button>
                </div>
              </div>

              {/* Meta Development Mode Notice & Tester Action Guide */}
              {metaWithheldInfo && (
                <div style={{
                  background: 'linear-gradient(135deg, #FFFDF7 0%, #FEF9EE 100%)',
                  border: '1.5px solid #E6D2B5',
                  borderRadius: 14,
                  padding: '20px 24px',
                  marginBottom: 20,
                  boxShadow: '0 4px 16px rgba(139, 115, 85, 0.08)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '3px 9px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          background: '#FEF3C7',
                          color: '#B45309',
                          border: '1px solid #FDE68A',
                        }}>
                          Development Stage Diagnostic
                        </span>
                        <h4 className="un-editorial-font" style={{ fontSize: 17, fontWeight: 700, color: '#3D2B1F', margin: 0 }}>
                          Meta Withheld Comments for {metaWithheldInfo.postsWithCommentsCount} Post{metaWithheldInfo.postsWithCommentsCount > 1 ? 's' : ''}
                        </h4>
                      </div>
                      <p style={{ color: '#786146', fontSize: 13.5, lineHeight: 1.5, margin: 0, maxWidth: 820 }}>
                        Instagram confirmed that <strong>{metaWithheldInfo.postsWithCommentsCount}</strong> of your <strong>{metaWithheldInfo.mediaCount}</strong> audited posts have comments, but Meta&apos;s Graph API returned empty comment arrays (<code style={{ fontSize: 12, background: '#F5ECE0', padding: '1px 5px', borderRadius: 4 }}>data: []</code>). This occurs because your Meta App is in <strong>Development Mode</strong> and the commenting tester account has not accepted their Tester Role at Facebook.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => setShowDiagnosticsDetail(!showDiagnosticsDetail)}
                        className="un-btn un-btn-secondary"
                        style={{ fontSize: 12, padding: '7px 12px' }}
                      >
                        {showDiagnosticsDetail ? 'Hide Technical Diagnostics' : 'View Diagnostics'}
                      </button>
                      <button
                        type="button"
                        onClick={syncWebhook}
                        disabled={syncingWebhook}
                        className="un-btn un-btn-secondary"
                        style={{ fontSize: 12, padding: '7px 12px' }}
                      >
                        {syncingWebhook ? 'Syncing...' : 'Sync Webhooks'}
                      </button>
                    </div>
                  </div>

                  {/* Step-by-Step Instructions */}
                  <div style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: '1px solid #EFE4D3',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 14,
                  }}>
                    <div style={{ background: '#FAF6EE', padding: '12px 14px', borderRadius: 8, border: '1px solid #EAE0D0' }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#3D2B1F', marginBottom: 4 }}>
                        1. Add Tester in Meta Portal
                      </div>
                      <div style={{ fontSize: 12, color: '#8B7355', lineHeight: 1.45 }}>
                        In <strong>Meta Developer Portal</strong> &rarr; <em>App Roles &rarr; Roles &rarr; Testers</em>, invite the tester&apos;s Facebook account.
                      </div>
                    </div>

                    <div style={{ background: '#FAF6EE', padding: '12px 14px', borderRadius: 8, border: '1px solid #EAE0D0' }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#3D2B1F', marginBottom: 4 }}>
                        2. Tester Accepts at facebook.com
                      </div>
                      <div style={{ fontSize: 12, color: '#8B7355', lineHeight: 1.45 }}>
                        Tester must visit <strong>facebook.com &rarr; Settings &rarr; Apps and Websites &rarr; Developer Invites</strong> tab and click <em>Accept</em>.
                      </div>
                    </div>

                    <div style={{ background: '#FAF6EE', padding: '12px 14px', borderRadius: 8, border: '1px solid #EAE0D0' }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#3D2B1F', marginBottom: 4 }}>
                        3. Audit Posts Again
                      </div>
                      <div style={{ fontSize: 12, color: '#8B7355', lineHeight: 1.45 }}>
                        Once the role shows an accepted green status in Meta Portal, click <strong>Audit Posts</strong> above to fetch the comments.
                      </div>
                    </div>
                  </div>

                  {/* Technical Diagnostic Details Accordion */}
                  {showDiagnosticsDetail && metaWithheldInfo.diagnostics.length > 0 && (
                    <div style={{
                      marginTop: 16,
                      background: '#2B2118',
                      color: '#E8DCCF',
                      padding: 14,
                      borderRadius: 8,
                      fontSize: 12,
                      fontFamily: 'monospace',
                      maxHeight: 220,
                      overflowY: 'auto',
                    }}>
                      <div style={{ color: '#D4A373', fontWeight: 700, marginBottom: 6 }}>
                        Meta Graph API Diagnostic Traces:
                      </div>
                      {metaWithheldInfo.diagnostics.map((d: any, idx: number) => (
                        <div key={idx} style={{ padding: '4px 0', borderBottom: '1px solid #3F3327' }}>
                          <span style={{ color: d.status === 'ok' ? '#10B981' : d.status === 'meta_empty_data' ? '#F59E0B' : '#EF4444', fontWeight: 600 }}>
                            [{d.status}]
                          </span>{' '}
                          <span style={{ color: '#E8DCCF' }}>{d.step}</span>: {d.detail || JSON.stringify(d)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Table Ledger */}
              {feedLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div className="un-spinner" />
                  <p style={{ color: '#8B7355', fontSize: 13 }}>Loading interaction ledger...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="un-card" style={{ textAlign: 'center', padding: '64px 20px' }}>
                  <div className="un-logo-jewel" style={{ margin: '0 auto 16px', width: 44, height: 44, opacity: 0.7 }}><SvgMessage /></div>
                  <h4 className="un-editorial-font" style={{ fontSize: 18, fontWeight: 700, color: '#3D2B1F', marginBottom: 4 }}>
                    {metaWithheldInfo ? 'Comments Withheld by Meta (Development Mode)' : 'No Comments Recorded Yet'}
                  </h4>
                  <p style={{ color: '#8B7355', fontSize: 13, maxWidth: 540, margin: '0 auto' }}>
                    {metaWithheldInfo
                      ? `Instagram confirmed ${metaWithheldInfo.postsWithCommentsCount} post(s) have comments, but Meta Graph API withheld them in Development Mode. Follow the guide above to accept the tester invite at facebook.com.`
                      : 'Click Audit Posts to scan recent Instagram media or wait for real-time webhooks.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="un-table-card">
                    <table className="un-table">
                      <thead>
                        <tr>
                          <th>Account</th>
                          <th>Inbound Comment</th>
                          <th>Classification</th>
                          <th>Public Response</th>
                          <th>Lead Tier</th>
                          <th>Outcome</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comments.filter(c => {
                          if (!commentSearch.trim()) return true;
                          const q = commentSearch.toLowerCase();
                          return (
                            (c.commenter_username && c.commenter_username.toLowerCase().includes(q)) ||
                            (c.comment_text && c.comment_text.toLowerCase().includes(q)) ||
                            (c.suggested_reply && c.suggested_reply.toLowerCase().includes(q))
                          );
                        }).map(c => {
                          const style = CLASSIFICATION_STYLES[c.classification] || CLASSIFICATION_STYLES['unrelated'];
                          const lead = LEAD_SCORES[c.lead_score] || LEAD_SCORES[0];
                          return (
                            <tr key={c.id}>
                              <td>
                                <span style={{ fontWeight: 700, color: '#3D2B1F', fontSize: 12.5 }}>
                                  @{c.commenter_username || 'anonymous'}
                                </span>
                              </td>
                              <td style={{ maxWidth: 220, color: '#5D4330', lineHeight: 1.5 }}>
                                {c.comment_text}
                              </td>
                              <td>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px', borderRadius: 14, background: style.bg, border: `1px solid ${style.border}`, color: style.text, fontSize: 11, fontWeight: 700 }}>
                                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: style.dot }} />
                                  <span>{style.label}</span>
                                </span>
                              </td>
                              <td style={{ maxWidth: 220, color: '#8B7355', fontSize: 12 }}>
                                {c.suggested_reply || '—'}
                              </td>
                              <td>
                                <span style={{ fontSize: 11, fontWeight: 700, color: lead.text, background: lead.bg, border: `1px solid ${lead.border}`, padding: '2px 8px', borderRadius: 10 }}>
                                  {lead.label}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                  {c.auto_replied && (
                                    <span style={{ fontSize: 10.5, fontWeight: 700, background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '2px 7px', borderRadius: 8 }}>
                                      Replied
                                    </span>
                                  )}
                                  {c.dm_sent && (
                                    <span style={{ fontSize: 10.5, fontWeight: 700, background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE', padding: '2px 7px', borderRadius: 8 }}>
                                      DM Sent
                                    </span>
                                  )}
                                  {!c.auto_replied && !c.dm_sent && (
                                    <span style={{ fontSize: 10.5, fontWeight: 600, background: '#F1F5F9', color: '#64748B', border: '1px solid #CBD5E1', padding: '2px 7px', borderRadius: 8 }}>
                                      {c.classification === 'harmful' || c.classification === 'spam' ? 'Quarantined' : 'Logged'}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ color: '#A69279', fontSize: 11, whiteSpace: 'nowrap' }}>
                                {new Date(c.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {commentStats && commentStats.total > 25 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, fontSize: 12.5, color: '#8B7355' }}>
                      <span>Showing page {commentPage} of {Math.ceil(commentStats.total / 25)} ({commentStats.total} total logged)</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="un-btn un-btn-secondary" disabled={commentPage <= 1} onClick={() => setCommentPage(p => Math.max(1, p - 1))} style={{ padding: '6px 14px', fontSize: 12 }}>Previous</button>
                        <button className="un-btn un-btn-secondary" disabled={commentPage >= Math.ceil(commentStats.total / 25)} onClick={() => setCommentPage(p => p + 1)} style={{ padding: '6px 14px', fontSize: 12 }}>Next</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ════ TAB 4: FLAGGED INBOX ════ */}
          {activeTab === 'inbox' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h2 className="un-editorial-font" style={{ fontSize: 24, fontWeight: 700, color: '#3D2B1F', margin: 0 }}>
                    Human Triage Queue
                  </h2>
                  <p style={{ color: '#8B7355', fontSize: 13.5, margin: '4px 0 0' }}>
                    Interactions flagged for personal creator follow-up. High commercial priority items appear first.
                  </p>
                </div>
                <button className="un-btn un-btn-secondary" onClick={loadFlagged} style={{ fontSize: 12.5 }}>
                  <SvgRefresh />
                  <span>Refresh Queue</span>
                </button>
              </div>

              <div className="un-filter-pills" style={{ marginBottom: 18 }}>
                {['pending', 'approved', 'replied', 'rejected', 'all'].map(s => (
                  <button
                    key={s}
                    className={`un-filter-pill ${statusFilter === s ? 'active' : ''}`}
                    onClick={() => setStatusFilter(s)}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                    {s === 'pending' && pendingCount > 0 && (
                      <span style={{ marginLeft: 6, background: '#D97706', color: '#FFF', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 800 }}>
                        {pendingCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {inboxLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div className="un-spinner" />
                  <p style={{ color: '#8B7355', fontSize: 13 }}>Loading review queue...</p>
                </div>
              ) : flagged.length === 0 ? (
                <div className="un-card" style={{ textAlign: 'center', padding: '64px 20px' }}>
                  <div className="un-logo-jewel" style={{ margin: '0 auto 16px', width: 44, height: 44 }}><SvgCheck /></div>
                  <h4 className="un-editorial-font" style={{ fontSize: 18, fontWeight: 700, color: '#3D2B1F', marginBottom: 4 }}>Triage Queue Clear</h4>
                  <p style={{ color: '#8B7355', fontSize: 13 }}>All pending items have been resolved or approved.</p>
                </div>
              ) : (
                flagged.map(item => {
                  const style = CLASSIFICATION_STYLES[item.classification] || CLASSIFICATION_STYLES['unrelated'];
                  const isEdit = editMode[item.id];
                  return (
                    <div key={item.id} className={`un-triage-card ${item.priority === 'high' ? 'priority-high' : ''}`}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: '#3D2B1F', fontSize: 13 }}>@{item.commenter_username || 'unknown'}</span>
                            <span style={{ fontSize: 11, background: item.item_type === 'dm' ? '#F5F3FF' : '#EFF6FF', color: item.item_type === 'dm' ? '#6D28D9' : '#1D4ED8', border: `1px solid ${item.item_type === 'dm' ? '#DDD6FE' : '#BFDBFE'}`, borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>
                              {item.item_type === 'dm' ? 'Escalated Direct Message' : 'Flagged Comment'}
                            </span>
                            <span style={{ fontSize: 11, background: style.bg, color: style.text, border: `1px solid ${style.border}`, borderRadius: 10, padding: '1px 7px', fontWeight: 700 }}>
                              {style.label}
                            </span>
                            {item.lead_score >= 2 && (
                              <span style={{ fontSize: 11, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', borderRadius: 10, padding: '1px 7px', fontWeight: 800 }}>
                                High Commercial Intent
                              </span>
                            )}
                            {item.priority === 'high' && (
                              <span style={{ fontSize: 10, background: '#DC2626', color: '#FFF', borderRadius: 6, padding: '2px 6px', fontWeight: 800 }}>
                                PRIORITY
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 14, color: '#3D2B1F', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 6 }}>
                            "{item.comment_text}"
                          </div>
                          {item.reasoning && (
                            <div style={{ fontSize: 12, color: '#8B7355' }}>
                              Flag Rationale: {item.reasoning}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#A69279', whiteSpace: 'nowrap' }}>
                          {new Date(item.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {item.status === 'pending' && (
                        <>
                          {item.suggested_reply && item.suggested_reply !== 'SKIP' && (
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#8B7355', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                                Suggested Draft {isEdit ? '(Editing)' : ''}:
                              </div>
                              {isEdit ? (
                                <textarea
                                  className="un-input un-textarea"
                                  value={editReplies[item.id] ?? item.suggested_reply}
                                  onChange={e => setEditReplies(prev => ({ ...prev, [item.id]: e.target.value }))}
                                  style={{ minHeight: 70 }}
                                />
                              ) : (
                                <div style={{ background: '#FAF7F2', border: '1px solid #E8E0D4', borderRadius: 9, padding: '10px 14px', fontSize: 13, color: '#3D2B1F' }}>
                                  {editReplies[item.id] ?? item.suggested_reply}
                                </div>
                              )}
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {item.suggested_reply && item.suggested_reply !== 'SKIP' && (
                              <button
                                className="un-btn un-btn-success"
                                style={{ fontSize: 12, padding: '6px 14px' }}
                                onClick={() => flaggedAction(item.id, 'approve')}
                              >
                                {item.item_type === 'dm' ? 'Approve & Send DM' : 'Approve & Post Reply'}
                              </button>
                            )}
                            <button
                              className="un-btn un-btn-secondary"
                              style={{ fontSize: 12, padding: '6px 14px' }}
                              onClick={() => setEditMode(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                            >
                              {isEdit ? 'Cancel' : 'Edit Custom Draft'}
                            </button>
                            {isEdit && (
                              <button
                                className="un-btn un-btn-primary"
                                style={{ fontSize: 12, padding: '6px 14px' }}
                                onClick={() => {
                                  flaggedAction(item.id, 'reply', editReplies[item.id] ?? item.suggested_reply);
                                  setEditMode(prev => ({ ...prev, [item.id]: false }));
                                }}
                              >
                                Dispatch Custom Reply
                              </button>
                            )}
                            <button
                              className="un-btn un-btn-danger"
                              style={{ fontSize: 12, padding: '6px 14px' }}
                              onClick={() => flaggedAction(item.id, 'reject')}
                            >
                              Dismiss Item
                            </button>
                          </div>
                        </>
                      )}

                      {item.status !== 'pending' && (
                        <div style={{ fontSize: 12.5, color: '#8B7355', borderTop: '1px solid #F0EBE3', paddingTop: 8, marginTop: 8 }}>
                          Resolution: <strong style={{ textTransform: 'capitalize', color: '#3D2B1F' }}>{item.status}</strong>
                          {item.owner_reply && <div style={{ marginTop: 3 }}>Dispatched reply: "{item.owner_reply}"</div>}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ════ TAB 5: DM CONCIERGE FEED ════ */}
          {activeTab === 'dms' && (
            <div>
              {dmStats && (
                <div className="un-stat-grid">
                  <div className="un-stat-tile">
                    <div className="un-stat-num un-editorial-font">{dmStats.total}</div>
                    <div className="un-stat-label">Inbound Direct Messages</div>
                  </div>
                  <div className="un-stat-tile">
                    <div className="un-stat-num un-editorial-font" style={{ color: '#047857' }}>{dmStats.autoReplied}</div>
                    <div className="un-stat-label">Auto-Responded</div>
                  </div>
                  <div className="un-stat-tile">
                    <div className="un-stat-num un-editorial-font" style={{ color: '#B45309' }}>{dmStats.escalated}</div>
                    <div className="un-stat-label">Escalated to Owner</div>
                  </div>
                  <div className="un-stat-tile">
                    <div className="un-stat-num un-editorial-font" style={{ color: '#1D4ED8' }}>{dmStats.hotLeads}</div>
                    <div className="un-stat-label">High-Value Opportunities</div>
                  </div>
                </div>
              )}

              {!config.dmAutoReplyEnabled && (
                <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: '#92400E', fontWeight: 700, fontSize: 13.5 }}>Direct Message Auto-Responder is in Standby</div>
                    <div style={{ color: '#B45309', fontSize: 12.5, marginTop: 2 }}>Enable inbound DM automation in the Engine Controls tab to begin responding automatically.</div>
                  </div>
                  <button className="un-btn un-btn-primary" onClick={() => setActiveTab('control')} style={{ fontSize: 12 }}>
                    Open Engine Controls
                  </button>
                </div>
              )}

              {dmsLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <div className="un-spinner" />
                  <p style={{ color: '#8B7355', fontSize: 13 }}>Loading DM history...</p>
                </div>
              ) : dms.length === 0 ? (
                <div className="un-card" style={{ textAlign: 'center', padding: '64px 20px' }}>
                  <div className="un-logo-jewel" style={{ margin: '0 auto 16px', width: 44, height: 44, opacity: 0.7 }}><SvgMail /></div>
                  <h4 className="un-editorial-font" style={{ fontSize: 18, fontWeight: 700, color: '#3D2B1F', marginBottom: 4 }}>No Direct Messages Processed</h4>
                  <p style={{ color: '#8B7355', fontSize: 13 }}>Inbound Instagram direct messages will be recorded and triaged here in real time.</p>
                </div>
              ) : (
                <div className="un-table-card">
                  <table className="un-table">
                    <thead>
                      <tr>
                        <th>Sender Account</th>
                        <th>Inbound Message</th>
                        <th>Classification</th>
                        <th>Dispatched Reply</th>
                        <th>Lead Tier</th>
                        <th>Outcome</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dms.map(dm => {
                        const style = CLASSIFICATION_STYLES[dm.classification] || CLASSIFICATION_STYLES['unrelated'];
                        const lead = LEAD_SCORES[dm.lead_score] || LEAD_SCORES[0];
                        return (
                          <tr key={dm.id}>
                            <td>
                              <span style={{ fontWeight: 700, color: '#3D2B1F', fontSize: 12.5 }}>
                                @{dm.sender_username || dm.sender_id}
                              </span>
                            </td>
                            <td style={{ maxWidth: 220, color: '#5D4330', lineHeight: 1.5 }}>
                              {dm.message_text}
                            </td>
                            <td>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px', borderRadius: 14, background: style.bg, border: `1px solid ${style.border}`, color: style.text, fontSize: 11, fontWeight: 700 }}>
                                <span style={{ width: 5, height: 5, borderRadius: '50%', background: style.dot }} />
                                <span>{style.label}</span>
                              </span>
                            </td>
                            <td style={{ maxWidth: 220, color: '#8B7355', fontSize: 12 }}>
                              {dm.ai_reply || '—'}
                            </td>
                            <td>
                              <span style={{ fontSize: 11, fontWeight: 700, color: lead.text, background: lead.bg, border: `1px solid ${lead.border}`, padding: '2px 8px', borderRadius: 10 }}>
                                {lead.label}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                {dm.auto_replied && (
                                  <span style={{ fontSize: 10.5, fontWeight: 700, background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '2px 7px', borderRadius: 8 }}>
                                    Replied
                                  </span>
                                )}
                                {dm.escalated && (
                                  <span style={{ fontSize: 10.5, fontWeight: 700, background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', padding: '2px 7px', borderRadius: 8 }}>
                                    Escalated
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ color: '#A69279', fontSize: 11, whiteSpace: 'nowrap' }}>
                              {new Date(dm.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
            </>
          )
        )}

        {/* ── Luxury Slide-In Notification Toast ── */}
        {toast && (
          <div className="un-toast">
            {toast.type === 'error' ? (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#EF4444" strokeWidth="2"/><path d="M5 5l6 6M11 5l-6 6" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#10B981" strokeWidth="2"/><path d="M5 8l2.5 2.5 4-4" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            )}
            <span>{toast.message}</span>
          </div>
        )}

      </div>
    </>
  );
}
