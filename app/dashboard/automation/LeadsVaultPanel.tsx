'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';

interface LeadsVaultPanelProps {
  workspaceId: string;
  onToast: (message: string, type?: 'success' | 'error') => void;
}

export default function LeadsVaultPanel({ workspaceId, onToast }: LeadsVaultPanelProps) {
  const uid = useId();
  const [contacts, setContacts] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, withEmail: 0, withPhone: 0, vip: 0, hot: 0, optedOut: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');

  // Webhooks & Listmonk Sync
  const [showWebhooks, setShowWebhooks] = useState(false);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [hookName, setHookName] = useState('');
  const [hookType, setHookType] = useState<'webhook' | 'listmonk'>('webhook');
  const [hookUrl, setHookUrl] = useState('');
  const [listmonkListId, setListmonkListId] = useState('1');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        workspaceId,
        platform: platformFilter,
        filter: segmentFilter,
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      const [cRes, wRes] = await Promise.all([
        fetch(`/api/automation/contacts?${qs.toString()}`),
        fetch(`/api/automation/webhooks?workspaceId=${encodeURIComponent(workspaceId)}`),
      ]);
      if (cRes.ok) {
        const data = await cRes.json();
        setContacts(data.contacts || []);
        if (data.stats) setStats(data.stats);
      }
      if (wRes.ok) {
        const wData = await wRes.json();
        setWebhooks(wData.webhooks || []);
      }
    } finally {
      setLoading(false);
    }
  }, [workspaceId, platformFilter, segmentFilter, search]);

  useEffect(() => {
    const t = setTimeout(loadContacts, 150);
    return () => clearTimeout(t);
  }, [loadContacts]);

  const toggleAiPause = async (contact: any) => {
    const isPaused = contact.ai_paused_until && Date.parse(contact.ai_paused_until) > Date.now();
    const res = await fetch(`/api/automation/contacts/${contact.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId,
        ...(isPaused ? { resumeAi: true } : { pauseAiHours: 24 }),
      }),
    });
    if (res.ok) {
      onToast(isPaused ? `Resumed AI for @${contact.username || 'contact'}` : `Paused AI for 24h on @${contact.username || 'contact'}`);
      loadContacts();
    }
  };

  const eraseContact = async (contact: any) => {
    const res = await fetch(`/api/automation/contacts/${contact.id}?workspaceId=${encodeURIComponent(workspaceId)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      onToast(`Erased @${contact.username || 'contact'} (GDPR/DPDP)`);
      loadContacts();
    }
  };

  const exportCsv = () => {
    const qs = new URLSearchParams({
      workspaceId,
      platform: platformFilter,
      filter: segmentFilter,
      format: 'csv',
      ...(search.trim() ? { search: search.trim() } : {}),
    });
    window.open(`/api/automation/contacts?${qs.toString()}`, '_blank');
  };

  const addWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/automation/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId,
        name: hookName,
        target_type: hookType,
        url: hookUrl,
        listmonk_list_id: hookType === 'listmonk' ? Number(listmonkListId || 1) : undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setCreatedSecret(data.signingSecret || null);
      setHookName('');
      setHookUrl('');
      onToast('Sync destination added!');
      loadContacts();
    } else {
      onToast(data.error || 'Failed to add webhook', 'error');
    }
  };

  const sendTestWebhook = async () => {
    const res = await fetch('/api/automation/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, action: 'test' }),
    });
    const data = await res.json();
    if (res.ok) {
      onToast(`Test event dispatched: ${data.delivered} delivered, ${data.failed} failed`);
      loadContacts();
    }
  };

  const deleteWebhook = async (id: string) => {
    const res = await fetch(`/api/automation/webhooks?workspaceId=${encodeURIComponent(workspaceId)}&id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      onToast('Webhook removed');
      loadContacts();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Audience Vault Header & Metrics */}
      <div className="un-master-hero" style={{ padding: '20px 24px' }}>
        <div>
          <h3 className="un-editorial-font" style={{ fontSize: 20, fontWeight: 700, color: '#3D2B1F', margin: 0 }}>
            Audience Vault CRM (Consented Leads)
          </h3>
          <p style={{ fontSize: 13, color: '#8B7355', margin: '4px 0 0' }}>
            100% Meta-compliant, explicitly consented leads with 0–100 Intent Score, VIP detection, 24h Human Takeover control, and GDPR/DPDP erasure.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="un-btn un-btn-secondary" onClick={() => setShowWebhooks((v) => !v)}>
            {showWebhooks ? 'Hide CRM Sync & Webhooks' : `CRM Webhooks & Listmonk (${webhooks.length})`}
          </button>
          <button type="button" className="un-btn un-btn-primary" onClick={exportCsv}>
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total Contacts', value: stats.total, color: '#3D2B1F' },
          { label: 'Verified Emails', value: stats.withEmail, color: '#047857' },
          { label: 'WhatsApp / Phones', value: stats.withPhone, color: '#1D4ED8' },
          { label: 'VIP Creators', value: stats.vip, color: '#B45309' },
          { label: 'Hot Intent (60+)', value: stats.hot, color: '#C8613D' },
        ].map((item) => (
          <div key={item.label} className="un-card" style={{ padding: '14px 16px', margin: 0 }}>
            <div style={{ fontSize: 11.5, color: '#8B7355', fontWeight: 600 }}>{item.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: item.color, marginTop: 4 }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Outbound HMAC Webhooks & Listmonk Sync */}
      {showWebhooks && (
        <div className="un-card">
          <div className="un-card-header">
            <div className="un-card-title"><span>Outbound HMAC Webhooks (Zapier / Make / n8n) &amp; Listmonk Auto-Sync</span></div>
            <button type="button" className="un-btn un-btn-secondary" onClick={sendTestWebhook}>Send Test Event</button>
          </div>
          <form onSubmit={addWebhook} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 14 }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="un-label" htmlFor={`${uid}-hname`}>Name</label>
              <input id={`${uid}-hname`} required className="un-input" value={hookName} onChange={(e) => setHookName(e.target.value)} placeholder="e.g. HubSpot via Zapier" />
            </div>
            <div style={{ minWidth: 140 }}>
              <label className="un-label" htmlFor={`${uid}-htype`}>Target Type</label>
              <select id={`${uid}-htype`} className="un-input" value={hookType} onChange={(e) => setHookType(e.target.value as any)}>
                <option value="webhook">HTTPS Webhook (HMAC)</option>
                <option value="listmonk">Connected Listmonk</option>
              </select>
            </div>
            {hookType === 'webhook' ? (
              <div style={{ flex: 2, minWidth: 220 }}>
                <label className="un-label" htmlFor={`${uid}-hurl`}>Endpoint URL (https://)</label>
                <input id={`${uid}-hurl`} type="url" required className="un-input" value={hookUrl} onChange={(e) => setHookUrl(e.target.value)} placeholder="https://hooks.zapier.com/..." />
              </div>
            ) : (
              <div style={{ minWidth: 120 }}>
                <label className="un-label" htmlFor={`${uid}-lid`}>Listmonk List ID</label>
                <input id={`${uid}-lid`} type="text" inputMode="numeric" className="un-input" value={listmonkListId} onChange={(e) => setListmonkListId(e.target.value)} />
              </div>
            )}
            <button type="submit" className="un-btn un-btn-primary">Add Sync</button>
          </form>

          {createdSecret && (
            <div role="status" aria-live="polite" style={{ padding: '10px 14px', borderRadius: 10, background: '#ECFDF5', border: '1px solid #A7F3D0', fontSize: 12.5, marginBottom: 12 }}>
              <strong>Signing Secret (save once — sent via <code>X-Unool-Signature</code>):</strong> <code>{createdSecret}</code>
            </div>
          )}

          {webhooks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {webhooks.map((w) => (
                <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: '#FAF7F2', fontSize: 12.5, gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <strong>{w.name}</strong> ({w.target_type}) — <code>{w.url}</code>
                    {w.last_status_code ? <span style={{ marginLeft: 8, color: w.last_status_code < 300 ? '#047857' : '#B91C1C' }}>Last HTTP {w.last_status_code}</span> : null}
                  </div>
                  <button type="button" className="un-btn un-btn-secondary" style={{ padding: '4px 10px', fontSize: 11.5 }} onClick={() => deleteWebhook(w.id)}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search & Filters */}
      <search>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
            <label htmlFor={`${uid}-search`} className="sr-only">Search leads by handle, email, phone, or tag</label>
            <input
              id={`${uid}-search`}
              type="search"
              className="un-input"
              style={{ maxWidth: 280 }}
              placeholder="Search @handle, email, phone, tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label="Filter by platform"
              className="un-input"
              style={{ width: 140 }}
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
            >
              <option value="all">All Channels</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="threads">Threads</option>
              <option value="linkedin">LinkedIn</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'leads', label: 'Emails / Phones' },
              { id: 'hot', label: 'Hot 60+' },
              { id: 'vip', label: 'VIPs' },
              { id: 'paused', label: 'AI Paused' },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                aria-pressed={segmentFilter === pill.id}
                onClick={() => setSegmentFilter(pill.id)}
                className={segmentFilter === pill.id ? 'un-btn un-btn-primary' : 'un-btn un-btn-secondary'}
                style={{ padding: '6px 12px', fontSize: 12 }}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </search>

      {/* Accessible Responsive Contacts Table */}
      <div
        tabIndex={0}
        role="region"
        aria-labelledby={`${uid}-caption`}
        className="un-card"
        style={{ padding: 0, overflowX: 'auto' }}
      >
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 13 }}>
          <caption id={`${uid}-caption`} className="sr-only">
            Audience Vault consented leads directory
          </caption>
          <thead>
            <tr style={{ background: '#FAF7F2', textAlign: 'left', color: '#8B7355', fontSize: 11.5 }}>
              <th scope="col" style={{ padding: '12px 14px', borderBottom: '1px solid #E8E0D4' }}>Contact</th>
              <th scope="col" style={{ padding: '12px 14px', borderBottom: '1px solid #E8E0D4' }}>Consented Lead Info</th>
              <th scope="col" style={{ padding: '12px 14px', borderBottom: '1px solid #E8E0D4' }}>Intent Score</th>
              <th scope="col" style={{ padding: '12px 14px', borderBottom: '1px solid #E8E0D4' }}>Activity</th>
              <th scope="col" style={{ padding: '12px 14px', borderBottom: '1px solid #E8E0D4' }}>Controls</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#8B7355' }}>Loading Audience Vault...</td></tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 36, textAlign: 'center', color: '#8B7355' }}>
                  No contacts yet. As followers comment, DM, or share their email/phone via SignalDM campaigns, they appear here automatically.
                </td>
              </tr>
            ) : (
              contacts.map((c) => {
                const aiPaused = Boolean(c.ai_paused_until && Date.parse(c.ai_paused_until) > Date.now());
                const score = Number(c.intent_score || 0);
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #F0EAE0' }}>
                    <th scope="row" style={{ padding: '12px 14px', fontWeight: 600, color: '#3D2B1F', textAlign: 'left', borderBottom: '1px solid #F0EAE0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {c.profile_pic_url ? (
                          <img src={c.profile_pic_url} alt="" width={28} height={28} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                        ) : null}
                        <div>
                          <div>
                            @{c.username || c.platform_user_id}
                            {c.is_vip && (
                              <span style={{ marginLeft: 6, fontSize: 10, padding: '2px 6px', borderRadius: 12, background: '#FEF3C7', color: '#B45309', fontWeight: 700 }}>
                                VIP
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: '#8B7355', fontWeight: 500 }}>
                            {c.platform}{c.follower_count ? ` · ${c.follower_count.toLocaleString()} followers` : ''}
                            {c.is_following_business === true ? ' · Following' : ''}
                          </div>
                        </div>
                      </div>
                    </th>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #F0EAE0' }}>
                      {c.email && <div style={{ color: '#047857', fontWeight: 600 }}>{c.email}</div>}
                      {c.phone && <div style={{ color: '#1D4ED8', fontWeight: 600 }}>{c.phone}</div>}
                      {!c.email && !c.phone && <span style={{ color: '#A69279', fontSize: 12 }}>No email/phone yet</span>}
                      {c.consent_at && <div style={{ fontSize: 10.5, color: '#8B7355' }}>Opt-in: {new Date(c.consent_at).toLocaleDateString()}</div>}
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #F0EAE0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ color: score >= 70 ? '#047857' : score >= 45 ? '#B45309' : '#64748B' }}>{score}</strong>
                        <div style={{ width: 64, height: 6, borderRadius: 4, background: '#F0EAE0', overflow: 'hidden' }}>
                          <div style={{ width: `${score}%`, height: '100%', background: score >= 70 ? '#10B981' : score >= 45 ? '#F59E0B' : '#94A3B8' }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #F0EAE0', fontSize: 12, color: '#6E5A48' }}>
                      {c.total_comments || 0} cmts · {c.total_dms || 0} DMs · {c.total_clicks || 0} clicks
                    </td>
                    <td style={{ padding: '12px 14px', borderBottom: '1px solid #F0EAE0' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="un-btn un-btn-secondary"
                          style={{ padding: '5px 10px', fontSize: 11.5 }}
                          onClick={() => toggleAiPause(c)}
                        >
                          {aiPaused ? 'Resume AI' : 'Pause AI 24h'}
                        </button>
                        <button
                          type="button"
                          className="un-btn un-btn-secondary"
                          style={{ padding: '5px 10px', fontSize: 11.5, color: '#B91C1C' }}
                          onClick={() => eraseContact(c)}
                        >
                          Erase
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
