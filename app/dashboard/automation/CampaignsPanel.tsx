'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import type {
  InstagramCampaign,
  CampaignPlaybookPreset,
  CampaignTriggerSurface,
  CampaignTriggerMode,
} from '@/lib/services/automation/campaignMatcher';
import type { CampaignDiagnostic, CampaignFunnelMetrics } from '@/lib/services/automation/campaignDoctor';

interface CampaignsPanelProps {
  workspaceId: string;
  defaultLinkUrl?: string | null;
  onToast: (message: string, type?: 'success' | 'error') => void;
}

const SURFACE_LABELS: Record<CampaignTriggerSurface, string> = {
  comment: 'Post / Reel Comment',
  story_reply: 'Story Reply',
  story_mention: 'Story Mention',
  live_comment: 'IG Live Comment',
  dm_keyword: 'Inbound DM Keyword',
  ad_referral: 'Click-to-DM Ad',
  reel_share: 'Shared Reel DM',
};

const EMPTY_FORM = {
  name: '',
  trigger_surface: 'comment' as CampaignTriggerSurface,
  trigger_mode: 'fuzzy' as CampaignTriggerMode,
  media_id: '',
  ad_id: '',
  keywords: 'GUIDE, LINK',
  exclude_keywords: 'scam, spam',
  ignore_sub_comments: false,
  ignore_tag_only_comments: true,
  dedup_user_post_hours: 24,
  public_replies: 'Just dropped it in your DMs! 🙌\nSent it straight to your inbox — check your requests!',
  dm_opening_enabled: false,
  dm_opening_text: 'Hey! Ready for the full breakdown? Tap below 👇',
  dm_opening_button_title: 'Send it to me',
  dm_message: 'Here is your instant access! Let me know what you think once you check it out 🙌',
  dm_card_title: '',
  dm_card_subtitle: '',
  dm_cta_title: 'Open Resource',
  dm_cta_url: '',
  dm_extra_bubbles: '',
  require_follow: false,
  follow_ask_text: '',
  capture_email: false,
  capture_phone: false,
  capture_prompt: 'Drop your best email below and I will send your permanent copy right away 👇',
  send_email_delivery: false,
  ab_variant_b_dm: '',
  ab_split_pct: 50,
  nudge_enabled: false,
  nudge_delay_minutes: 180,
  nudge_text: 'Quick check-in — did the link open okay for you?',
  closed_dm_public_fallback: 'Looks like your DMs are restricted — tap our bio link to grab it directly!',
  max_total_sends: '',
  playbook_id: '',
};

export default function CampaignsPanel({
  workspaceId,
  defaultLinkUrl,
  onToast,
}: CampaignsPanelProps) {
  const formUid = useId();
  const [campaigns, setCampaigns] = useState<InstagramCampaign[]>([]);
  const [metrics, setMetrics] = useState<Record<string, CampaignFunnelMetrics>>({});
  const [diagnostics, setDiagnostics] = useState<CampaignDiagnostic[]>([]);
  const [presets, setPresets] = useState<CampaignPlaybookPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM, dm_cta_url: defaultLinkUrl || '' });
  const [keywordWarnings, setKeywordWarnings] = useState<string[]>([]);

  // Active tools drawers (Backfill, Coupons, Giveaway Picker, Ice Breakers)
  const [backfillBusyId, setBackfillBusyId] = useState<string | null>(null);
  const [couponTargetId, setCouponTargetId] = useState<string | null>(null);
  const [couponCodesText, setCouponCodesText] = useState('');
  const [couponStats, setCouponStats] = useState<{ total: number; claimed: number; available: number } | null>(null);
  const [winnerTargetId, setWinnerTargetId] = useState<string | null>(null);
  const [winnerResult, setWinnerResult] = useState<{ totalEligible: number; winners: any[] } | null>(null);
  const [winnerReqFollow, setWinnerReqFollow] = useState(true);
  const [winnerReqEmail, setWinnerReqEmail] = useState(false);

  // Ice Breakers & Persistent Menu
  const [showMessengerProfile, setShowMessengerProfile] = useState(false);
  const [iceBreakers, setIceBreakers] = useState<Array<{ question: string; payload: string }>>([]);
  const [persistentMenu, setPersistentMenu] = useState<Array<{ type: 'web_url' | 'postback'; title: string; url?: string; payload?: string }>>([]);
  const [savingProfile, setSavingProfile] = useState(false);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const [campRes, profRes] = await Promise.all([
        fetch(`/api/instagram/campaigns?workspaceId=${encodeURIComponent(workspaceId)}`),
        fetch(`/api/instagram/messenger-profile?workspaceId=${encodeURIComponent(workspaceId)}`),
      ]);
      if (campRes.ok) {
        const data = await campRes.json();
        setCampaigns(data.campaigns || []);
        setMetrics(data.metricsByCampaign || {});
        setDiagnostics(data.diagnostics || []);
        setPresets(data.presets || []);
      }
      if (profRes.ok) {
        const pData = await profRes.json();
        setIceBreakers(pData.iceBreakers || []);
        setPersistentMenu(pData.persistentMenu || []);
      }
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const applyPreset = (preset: CampaignPlaybookPreset) => {
    const d = preset.defaults;
    setForm({
      ...EMPTY_FORM,
      name: d.name || preset.title,
      playbook_id: preset.id,
      trigger_surface: d.trigger_surface || 'comment',
      trigger_mode: d.trigger_mode || 'fuzzy',
      keywords: (d.keywords || []).join(', '),
      exclude_keywords: (d.exclude_keywords || []).join(', '),
      ignore_tag_only_comments: d.ignore_tag_only_comments ?? true,
      dedup_user_post_hours: d.dedup_user_post_hours ?? 24,
      public_replies: (d.public_replies || []).join('\n'),
      dm_opening_enabled: Boolean(d.dm_opening_enabled),
      dm_opening_text: d.dm_opening_text || EMPTY_FORM.dm_opening_text,
      dm_opening_button_title: d.dm_opening_button_title || 'Send it to me',
      dm_message: d.dm_message || EMPTY_FORM.dm_message,
      dm_card_title: d.dm_card_title || '',
      dm_cta_title: d.dm_cta_title || 'Open Link',
      dm_cta_url: d.dm_cta_url || defaultLinkUrl || '',
      require_follow: Boolean(d.require_follow),
      capture_email: Boolean(d.capture_email),
      capture_phone: Boolean(d.capture_phone),
      capture_prompt: d.capture_prompt || EMPTY_FORM.capture_prompt,
      send_email_delivery: Boolean(d.send_email_delivery),
      nudge_enabled: Boolean(d.nudge_enabled),
      nudge_delay_minutes: d.nudge_delay_minutes ?? 180,
      nudge_text: d.nudge_text || EMPTY_FORM.nudge_text,
    });
    setKeywordWarnings([]);
    setShowBuilder(true);
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      onToast('Enter a campaign name', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/instagram/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          ...form,
          keywords: form.keywords.split(',').map((s) => s.trim()).filter(Boolean),
          exclude_keywords: form.exclude_keywords.split(',').map((s) => s.trim()).filter(Boolean),
          public_replies: form.public_replies.split('\n').map((s) => s.trim()).filter(Boolean),
          dm_extra_bubbles: form.dm_extra_bubbles.split('\n').map((s) => s.trim()).filter(Boolean),
          max_total_sends: form.max_total_sends ? Number(form.max_total_sends) : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const warns: string[] = [
          ...(data.keywordAnalysis?.warnings || []),
          ...(data.keywordAnalysis?.collisions || []).map(
            (c: any) => `Keyword "${c.keyword}" overlaps with "${c.campaignName}"`
          ),
        ];
        setKeywordWarnings(warns);
        onToast(`Campaign "${form.name}" launched!`);
        setShowBuilder(false);
        loadCampaigns();
      } else {
        onToast(data.error || 'Failed to create campaign', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleCampaign = async (camp: InstagramCampaign) => {
    const res = await fetch(`/api/instagram/campaigns/${camp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, is_active: !camp.is_active }),
    });
    if (res.ok) {
      onToast(`${camp.name} ${!camp.is_active ? 'activated' : 'paused'}`);
      loadCampaigns();
    }
  };

  const promoteWinner = async (campaignId: string, winner: 'A' | 'B') => {
    const res = await fetch(`/api/instagram/campaigns/${campaignId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, promoteWinner: winner }),
    });
    if (res.ok) {
      onToast(`Promoted Variant ${winner} to 100% traffic`);
      loadCampaigns();
    }
  };

  const deleteCampaign = async (camp: InstagramCampaign) => {
    const res = await fetch(`/api/instagram/campaigns/${camp.id}?workspaceId=${encodeURIComponent(workspaceId)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      onToast(`Deleted "${camp.name}"`);
      loadCampaigns();
    }
  };

  const runBackfill = async (camp: InstagramCampaign) => {
    setBackfillBusyId(camp.id);
    try {
      const res = await fetch(`/api/instagram/campaigns/${camp.id}/backfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, dryRun: false, maxToSend: 15 }),
      });
      const data = await res.json();
      if (res.ok) {
        onToast(
          `7-Day Backfill scanned ${data.scanned} comments → matched ${data.matchedCount}, dispatched ${data.sentCount} DMs.`
        );
        loadCampaigns();
      } else {
        onToast(data.error || 'Backfill failed', 'error');
      }
    } finally {
      setBackfillBusyId(null);
    }
  };

  const openCoupons = async (campaignId: string) => {
    setCouponTargetId(campaignId);
    setCouponCodesText('');
    const res = await fetch(`/api/instagram/campaigns/${campaignId}/coupons?workspaceId=${encodeURIComponent(workspaceId)}`);
    if (res.ok) {
      const data = await res.json();
      setCouponStats(data.stats);
    }
  };

  const uploadCoupons = async () => {
    if (!couponTargetId || !couponCodesText.trim()) return;
    const res = await fetch(`/api/instagram/campaigns/${couponTargetId}/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, codes: couponCodesText }),
    });
    const data = await res.json();
    if (res.ok) {
      onToast(`Uploaded ${data.uploadedCount} unique promo codes`);
      setCouponCodesText('');
      openCoupons(couponTargetId);
      loadCampaigns();
    } else {
      onToast(data.error || 'Upload failed', 'error');
    }
  };

  const drawWinners = async (campaignId: string) => {
    const res = await fetch(`/api/instagram/campaigns/${campaignId}/pick-winner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId,
        winnerCount: 1,
        requireFollow: winnerReqFollow,
        requireEmail: winnerReqEmail,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setWinnerResult({ totalEligible: data.totalEligible || 0, winners: data.winners || [] });
    } else {
      onToast(data.error || 'Draw failed', 'error');
    }
  };

  const saveMessengerProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/instagram/messenger-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, iceBreakers, persistentMenu }),
      });
      const data = await res.json();
      if (res.ok) {
        onToast(
          data.metaSync?.iceBreakers || data.metaSync?.persistentMenu
            ? 'Synced Ice Breakers & Persistent Menu live to Instagram!'
            : 'Saved Ice Breakers & Menu (connect Instagram to push live).'
        );
      } else {
        onToast(data.error || 'Sync failed', 'error');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Bar */}
      <div className="un-master-hero" style={{ padding: '20px 24px' }}>
        <div>
          <h3 className="un-editorial-font" style={{ fontSize: 20, fontWeight: 700, color: '#3D2B1F', margin: 0 }}>
            Hybrid Keyword Campaigns &amp; Playbooks
          </h3>
          <p style={{ fontSize: 13, color: '#8B7355', margin: '4px 0 0' }}>
            Deterministic zero-miss keyword triggers (Comments, Stories, Mentions, Live, Ads, Shared Reels) with AI fallback when no rule matches.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="un-btn un-btn-secondary"
            onClick={() => setShowMessengerProfile((v) => !v)}
          >
            {showMessengerProfile ? 'Hide Ice Breakers & Menu' : 'Ice Breakers & Menu'}
          </button>
          <button
            type="button"
            className="un-btn un-btn-primary"
            onClick={() => {
              setForm({ ...EMPTY_FORM, dm_cta_url: defaultLinkUrl || '' });
              setShowBuilder((v) => !v);
            }}
          >
            {showBuilder ? 'Close Builder' : '+ New Campaign'}
          </button>
        </div>
      </div>

      {/* Campaign Doctor Live Diagnostics */}
      {diagnostics.length > 0 && (
        <div
          role="region"
          aria-label="Campaign Doctor diagnostics"
          style={{
            background: '#FFFBEB',
            border: '1.5px solid #FDE68A',
            borderRadius: 16,
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Campaign Doctor — {diagnostics.length} Actionable Finding{diagnostics.length > 1 ? 's' : ''}
          </div>
          {diagnostics.map((d) => (
            <div
              key={`${d.campaignId}-${d.code}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                background: '#FFFFFF',
                borderRadius: 12,
                padding: '10px 14px',
                border: '1px solid #FDE68A',
              }}
            >
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#3D2B1F' }}>{d.headline}</div>
                <div style={{ fontSize: 12, color: '#6E5A48', marginTop: 2 }}>{d.detail}</div>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#B45309', background: '#FEF3C7', padding: '4px 10px', borderRadius: 20 }}>
                {d.suggestedAction}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Ice Breakers (max 4) & Persistent Menu Studio */}
      {showMessengerProfile && (
        <div className="un-card">
          <div className="un-card-header">
            <div className="un-card-title">
              <span>Instagram DM Ice Breakers (Max 4) &amp; Persistent Menu</span>
            </div>
            <button type="button" className="un-btn un-btn-primary" onClick={saveMessengerProfile} disabled={savingProfile}>
              {savingProfile ? 'Syncing to Meta...' : 'Save & Push to Instagram'}
            </button>
          </div>
          <div className="un-grid-2">
            <div>
              <div className="un-label" style={{ marginBottom: 8 }}>DM Starter Questions (Shown before a follower types)</div>
              {iceBreakers.map((ib, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    className="un-input"
                    aria-label={`Ice breaker question ${idx + 1}`}
                    placeholder="e.g. Send me the free starter kit"
                    value={ib.question}
                    onChange={(e) => {
                      const next = [...iceBreakers];
                      next[idx] = { ...next[idx], question: e.target.value, payload: next[idx].payload || e.target.value };
                      setIceBreakers(next);
                    }}
                  />
                  <button
                    type="button"
                    className="un-btn un-btn-secondary"
                    onClick={() => setIceBreakers(iceBreakers.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {iceBreakers.length < 4 && (
                <button
                  type="button"
                  className="un-btn un-btn-secondary"
                  onClick={() => setIceBreakers([...iceBreakers, { question: '', payload: '' }])}
                >
                  + Add Ice Breaker ({iceBreakers.length}/4)
                </button>
              )}
            </div>
            <div>
              <div className="un-label" style={{ marginBottom: 8 }}>Persistent DM Menu (Up to 5 links or quick triggers)</div>
              {persistentMenu.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                  <input
                    className="un-input"
                    style={{ flex: 1, minWidth: 120 }}
                    aria-label={`Menu label ${idx + 1}`}
                    placeholder="Button title (max 30 chars)"
                    value={item.title}
                    onChange={(e) => {
                      const next = [...persistentMenu];
                      next[idx] = { ...next[idx], title: e.target.value };
                      setPersistentMenu(next);
                    }}
                  />
                  <input
                    className="un-input"
                    style={{ flex: 1, minWidth: 160 }}
                    aria-label={`Menu URL ${idx + 1}`}
                    placeholder="https://... (leave blank for postback)"
                    value={item.url || ''}
                    onChange={(e) => {
                      const next = [...persistentMenu];
                      const val = e.target.value;
                      next[idx] = val.startsWith('http')
                        ? { type: 'web_url', title: next[idx].title, url: val }
                        : { type: 'postback', title: next[idx].title, payload: val || next[idx].title };
                      setPersistentMenu(next);
                    }}
                  />
                  <button
                    type="button"
                    className="un-btn un-btn-secondary"
                    onClick={() => setPersistentMenu(persistentMenu.filter((_, i) => i !== idx))}
                  >
                    ×
                  </button>
                </div>
              ))}
              {persistentMenu.length < 5 && (
                <button
                  type="button"
                  className="un-btn un-btn-secondary"
                  onClick={() =>
                    setPersistentMenu([
                      ...persistentMenu,
                      { type: 'web_url', title: 'Visit My Hub', url: defaultLinkUrl || 'https://' },
                    ])
                  }
                >
                  + Add Menu Button ({persistentMenu.length}/5)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6 One-Click Playbook Presets */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#8B7355', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          1-Click Proven Playbooks (60-Second Launch)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p)}
              style={{
                textAlign: 'left',
                padding: '14px 16px',
                borderRadius: 14,
                border: '1.5px solid #E8E0D4',
                background: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                minHeight: 48,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: '#3D2B1F' }}>{p.title}</span>
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#FAF4E8', color: '#8B6914', whiteSpace: 'nowrap' }}>
                  {p.badge}
                </span>
              </div>
              <span style={{ fontSize: 12, color: '#6E5A48', lineHeight: 1.4 }}>{p.tagline}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Campaign Builder Form */}
      {showBuilder && (
        <form className="un-card" onSubmit={handleCreateCampaign} aria-labelledby={`${formUid}-heading`}>
          <div className="un-card-header">
            <h4 id={`${formUid}-heading`} style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#3D2B1F' }}>
              Configure SignalDM Campaign
            </h4>
            <button type="button" className="un-btn un-btn-secondary" onClick={() => setShowBuilder(false)}>
              Cancel
            </button>
          </div>

          <div className="un-grid-2">
            <div>
              <div className="un-field">
                <label className="un-label" htmlFor={`${formUid}-name`}>Campaign Name *</label>
                <input
                  id={`${formUid}-name`}
                  name="name"
                  required
                  className="un-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Reel Freebie Funnel"
                />
              </div>

              <div className="un-field">
                <label className="un-label" htmlFor={`${formUid}-surface`}>Official Trigger Surface</label>
                <select
                  id={`${formUid}-surface`}
                  name="trigger_surface"
                  className="un-input"
                  value={form.trigger_surface}
                  onChange={(e) => setForm({ ...form, trigger_surface: e.target.value as CampaignTriggerSurface })}
                >
                  {(Object.keys(SURFACE_LABELS) as CampaignTriggerSurface[]).map((s) => (
                    <option key={s} value={s}>{SURFACE_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              <div className="un-field">
                <label className="un-label" htmlFor={`${formUid}-mode`}>Matching Mode</label>
                <select
                  id={`${formUid}-mode`}
                  name="trigger_mode"
                  className="un-input"
                  value={form.trigger_mode}
                  onChange={(e) => setForm({ ...form, trigger_mode: e.target.value as CampaignTriggerMode })}
                >
                  <option value="fuzzy">Fuzzy (Catches typos like LIKN → LINK)</option>
                  <option value="contains">Contains Keyword</option>
                  <option value="exact">Exact Match Only</option>
                  <option value="any">Any Message / Comment</option>
                </select>
              </div>

              {form.trigger_mode !== 'any' && (
                <div className="un-field">
                  <label className="un-label" htmlFor={`${formUid}-kws`}>Trigger Keywords (comma-separated)</label>
                  <input
                    id={`${formUid}-kws`}
                    name="keywords"
                    className="un-input"
                    value={form.keywords}
                    onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                    placeholder="GUIDE, LINK, SEND"
                  />
                </div>
              )}

              <div className="un-field">
                <label className="un-label" htmlFor={`${formUid}-excl`}>Exclude Keywords (Never trigger if present)</label>
                <input
                  id={`${formUid}-excl`}
                  name="exclude_keywords"
                  className="un-input"
                  value={form.exclude_keywords}
                  onChange={(e) => setForm({ ...form, exclude_keywords: e.target.value })}
                  placeholder="scam, refund, fake"
                />
              </div>

              <div className="un-field">
                <label className="un-label" htmlFor={`${formUid}-media`}>Specific Instagram Post / Media ID (leave blank for all posts)</label>
                <input
                  id={`${formUid}-media`}
                  name="media_id"
                  className="un-input"
                  value={form.media_id}
                  onChange={(e) => setForm({ ...form, media_id: e.target.value })}
                  placeholder="Optional IG media ID"
                />
              </div>

              <div className="un-field">
                <label className="un-label" htmlFor={`${formUid}-pub`}>Rotating Public Comment Replies (1 per line)</label>
                <textarea
                  id={`${formUid}-pub`}
                  name="public_replies"
                  className="un-input un-textarea"
                  value={form.public_replies}
                  onChange={(e) => setForm({ ...form, public_replies: e.target.value })}
                />
              </div>
            </div>

            <div>
              <div className="un-field">
                <label className="un-label" htmlFor={`${formUid}-dm`}>Primary DM Message (supports &#123;username&#125;, &#123;link&#125;, &#123;&#123;coupon&#125;&#125;)</label>
                <textarea
                  id={`${formUid}-dm`}
                  name="dm_message"
                  required
                  className="un-input un-textarea"
                  value={form.dm_message}
                  onChange={(e) => setForm({ ...form, dm_message: e.target.value })}
                />
              </div>

              <div className="un-field">
                <label className="un-label" htmlFor={`${formUid}-url`}>Tracked CTA Link URL (Auto-wrapped in /go/ for CTR + 3h Nudge)</label>
                <input
                  id={`${formUid}-url`}
                  type="url"
                  name="dm_cta_url"
                  className="un-input"
                  value={form.dm_cta_url}
                  onChange={(e) => setForm({ ...form, dm_cta_url: e.target.value })}
                  placeholder="https://yourbrand.unool.co/offer"
                />
              </div>

              <div className="un-field">
                <label className="un-label" htmlFor={`${formUid}-card`}>Optional Rich CTA Card Title (Instagram Generic Template)</label>
                <input
                  id={`${formUid}-card`}
                  name="dm_card_title"
                  className="un-input"
                  value={form.dm_card_title}
                  onChange={(e) => setForm({ ...form, dm_card_title: e.target.value })}
                  placeholder="e.g. Free 2026 Growth Vault"
                />
              </div>

              <div className="un-field">
                <label className="un-label" htmlFor={`${formUid}-ab`}>Optional A/B Variant B DM Copy (50/50 split test)</label>
                <textarea
                  id={`${formUid}-ab`}
                  name="ab_variant_b_dm"
                  className="un-input"
                  rows={2}
                  value={form.ab_variant_b_dm}
                  onChange={(e) => setForm({ ...form, ab_variant_b_dm: e.target.value })}
                  placeholder="Optional challenger copy to test against your primary DM"
                />
              </div>

              {/* Feature Toggles */}
              <fieldset style={{ border: '1px solid #E8E0D4', borderRadius: 12, padding: 12, marginBottom: 14 }}>
                <legend style={{ fontSize: 12, fontWeight: 700, color: '#3D2B1F', padding: '0 6px' }}>
                  Funnel Superpowers
                </legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12.5 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.dm_opening_enabled} onChange={(e) => setForm({ ...form, dm_opening_enabled: e.target.checked })} />
                    <span>Opening DM Button</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.require_follow} onChange={(e) => setForm({ ...form, require_follow: e.target.checked })} />
                    <span>Follow-to-Unlock Gate</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.capture_email} onChange={(e) => setForm({ ...form, capture_email: e.target.checked })} />
                    <span>Capture Email in DM</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.capture_phone} onChange={(e) => setForm({ ...form, capture_phone: e.target.checked })} />
                    <span>Capture Phone / WhatsApp</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.send_email_delivery} onChange={(e) => setForm({ ...form, send_email_delivery: e.target.checked })} />
                    <span>Auto-Send Email Copy</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.nudge_enabled} onChange={(e) => setForm({ ...form, nudge_enabled: e.target.checked })} />
                    <span>3h Unclicked Nudge</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.ignore_tag_only_comments} onChange={(e) => setForm({ ...form, ignore_tag_only_comments: e.target.checked })} />
                    <span>Ignore @Tag-Only</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.ignore_sub_comments} onChange={(e) => setForm({ ...form, ignore_sub_comments: e.target.checked })} />
                    <span>Ignore Sub-Replies</span>
                  </label>
                </div>
              </fieldset>

              {(form.capture_email || form.capture_phone) && (
                <div className="un-field">
                  <label className="un-label" htmlFor={`${formUid}-cap`}>Lead Capture Prompt</label>
                  <input
                    id={`${formUid}-cap`}
                    className="un-input"
                    value={form.capture_prompt}
                    onChange={(e) => setForm({ ...form, capture_prompt: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #E8E0D4' }}>
            <button type="submit" className="un-btn un-btn-primary" disabled={saving}>
              {saving ? 'Launching...' : 'Launch Live Campaign'}
            </button>
          </div>
        </form>
      )}

      {keywordWarnings.length > 0 && (
        <div role="status" aria-live="polite" style={{ padding: '12px 16px', borderRadius: 12, background: '#FEF3C7', color: '#92400E', fontSize: 12.5 }}>
          <strong>Keyword Health Notice:</strong> {keywordWarnings.join(' · ')}
        </div>
      )}

      {/* Coupon Pool Modal-Inline Panel */}
      {couponTargetId && (
        <div className="un-card" style={{ borderColor: '#C4A265' }}>
          <div className="un-card-header">
            <div className="un-card-title">
              <span>Unique Coupon Code Pool</span>
              {couponStats && (
                <span style={{ fontSize: 12, color: '#047857', background: '#ECFDF5', padding: '2px 10px', borderRadius: 20 }}>
                  {couponStats.available} available / {couponStats.total} total
                </span>
              )}
            </div>
            <button type="button" className="un-btn un-btn-secondary" onClick={() => setCouponTargetId(null)}>Close</button>
          </div>
          <p style={{ fontSize: 12.5, color: '#6E5A48', marginTop: 0 }}>
            Paste one unique code per line. Include <code>&#123;&#123;coupon&#125;&#125;</code> in your campaign DM — Postgres atomically locks and assigns one unique code per follower with zero duplicates.
          </p>
          <textarea
            className="un-input un-textarea"
            rows={4}
            placeholder={"VIP-1001\nVIP-1002\nVIP-1003"}
            value={couponCodesText}
            onChange={(e) => setCouponCodesText(e.target.value)}
          />
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="un-btn un-btn-primary" onClick={uploadCoupons}>Upload Promo Codes</button>
          </div>
        </div>
      )}

      {/* Fair Giveaway Winner Picker Panel */}
      {winnerTargetId && (
        <div className="un-card" style={{ borderColor: '#C4A265' }}>
          <div className="un-card-header">
            <div className="un-card-title"><span>Fair Giveaway Winner Picker</span></div>
            <button type="button" className="un-btn un-btn-secondary" onClick={() => { setWinnerTargetId(null); setWinnerResult(null); }}>Close</button>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={winnerReqFollow} onChange={(e) => setWinnerReqFollow(e.target.checked)} />
              <span>Must be Verified Follower</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <input type="checkbox" checked={winnerReqEmail} onChange={(e) => setWinnerReqEmail(e.target.checked)} />
              <span>Must have Submitted Email</span>
            </label>
            <button type="button" className="un-btn un-btn-primary" onClick={() => drawWinners(winnerTargetId)}>
              Draw Random Winner
            </button>
          </div>
          {winnerResult && (
            <div role="status" aria-live="polite" style={{ padding: 14, borderRadius: 12, background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
              <div style={{ fontSize: 12, color: '#047857', fontWeight: 700 }}>
                Eligible unique entries: {winnerResult.totalEligible}
              </div>
              {winnerResult.winners.length === 0 ? (
                <div style={{ fontSize: 13, color: '#3D2B1F', marginTop: 4 }}>No eligible participants yet for these filters.</div>
              ) : (
                winnerResult.winners.map((w, idx) => (
                  <div key={idx} style={{ fontSize: 15, fontWeight: 700, color: '#065F46', marginTop: 6 }}>
                    Winner #{idx + 1}: @{w.username} {w.email ? `(${w.email})` : ''}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Active Campaigns List */}
      {loading ? (
        <div className="un-card" style={{ textAlign: 'center', padding: 40, color: '#8B7355' }}>Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="un-card" style={{ textAlign: 'center', padding: 42 }}>
          <div className="un-editorial-font" style={{ fontSize: 18, fontWeight: 700, color: '#3D2B1F' }}>No Keyword Campaigns Yet</div>
          <p style={{ fontSize: 13, color: '#8B7355', maxWidth: 440, margin: '6px auto 16px' }}>
            Click any 1-Click Playbook above to launch your first Comment-to-DM, Story Reply, or Lead Capture campaign in 60 seconds.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {campaigns.map((camp) => {
            const m = metrics[camp.id];
            const ctr = m && m.dmSent > 0 ? Math.round((m.linkClicks / m.dmSent) * 100) : 0;
            return (
              <div key={camp.id} className="un-card" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#3D2B1F' }}>{camp.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: camp.is_active ? '#ECFDF5' : '#F1F5F9', color: camp.is_active ? '#047857' : '#64748B' }}>
                        {camp.is_active ? 'LIVE' : 'PAUSED'}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: '#FAF4E8', color: '#8B6914' }}>
                        {SURFACE_LABELS[camp.trigger_surface]}
                      </span>
                      {camp.require_follow && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#EFF6FF', color: '#1D4ED8' }}>Follow-Gate</span>}
                      {(camp.capture_email || camp.capture_phone) && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#F5F3FF', color: '#6D28D9' }}>Lead Capture</span>}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#6E5A48', marginTop: 6 }}>
                      <strong>Triggers ({camp.trigger_mode}):</strong>{' '}
                      {camp.trigger_mode === 'any' ? 'All interactions' : (camp.keywords || []).join(', ') || 'None'}
                      {camp.media_id ? ` · Bound to Post ${camp.media_id}` : ' · All posts'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {camp.trigger_surface === 'comment' && (
                      <button
                        type="button"
                        className="un-btn un-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        disabled={backfillBusyId === camp.id}
                        onClick={() => runBackfill(camp)}
                      >
                        {backfillBusyId === camp.id ? 'Scanning 7d...' : '7-Day Backfill'}
                      </button>
                    )}
                    <button type="button" className="un-btn un-btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => openCoupons(camp.id)}>
                      Coupons {m?.totalCoupons ? `(${m.availableCoupons}/${m.totalCoupons})` : ''}
                    </button>
                    <button type="button" className="un-btn un-btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { setWinnerTargetId(camp.id); setWinnerResult(null); }}>
                      Pick Winner
                    </button>
                    <button type="button" className="un-btn un-btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => toggleCampaign(camp)}>
                      {camp.is_active ? 'Pause' : 'Activate'}
                    </button>
                    <button type="button" className="un-btn un-btn-secondary" style={{ padding: '6px 12px', fontSize: 12, color: '#B91C1C' }} onClick={() => deleteCampaign(camp)}>
                      Delete
                    </button>
                  </div>
                </div>

                {/* Live Funnel Metrics Strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginTop: 14, paddingTop: 12, borderTop: '1px solid #F0EAE0' }}>
                  <div><div style={{ fontSize: 11, color: '#8B7355' }}>Triggered</div><div style={{ fontSize: 16, fontWeight: 700, color: '#3D2B1F' }}>{m?.triggered ?? camp.total_sends ?? 0}</div></div>
                  <div><div style={{ fontSize: 11, color: '#8B7355' }}>DMs Sent</div><div style={{ fontSize: 16, fontWeight: 700, color: '#3D2B1F' }}>{m?.dmSent ?? 0}</div></div>
                  <div><div style={{ fontSize: 11, color: '#8B7355' }}>Follow Unlocks</div><div style={{ fontSize: 16, fontWeight: 700, color: '#1D4ED8' }}>{m?.followVerified ?? 0}</div></div>
                  <div><div style={{ fontSize: 11, color: '#8B7355' }}>Leads Captured</div><div style={{ fontSize: 16, fontWeight: 700, color: '#047857' }}>{m?.leadsCaptured ?? 0}</div></div>
                  <div><div style={{ fontSize: 11, color: '#8B7355' }}>Link Clicks (CTR)</div><div style={{ fontSize: 16, fontWeight: 700, color: '#C8613D' }}>{m?.linkClicks ?? 0} ({ctr}%)</div></div>
                </div>

                {/* A/B Split Comparison */}
                {camp.ab_variant_b_dm && m && (
                  <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: '#FAF7F2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, fontSize: 12 }}>
                    <span>
                      <strong>A/B Split:</strong> Variant A: {m.variantAClicks}/{m.variantASends} clicks · Variant B: {m.variantBClicks}/{m.variantBSends} clicks
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="un-btn un-btn-secondary" style={{ padding: '4px 10px', fontSize: 11.5 }} onClick={() => promoteWinner(camp.id, 'A')}>Promote A</button>
                      <button type="button" className="un-btn un-btn-secondary" style={{ padding: '4px 10px', fontSize: 11.5 }} onClick={() => promoteWinner(camp.id, 'B')}>Promote B</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
