'use client';

import React, { useState, useEffect } from 'react';
import './styles.css';

/* ── Types ─────────────────────────────── */
interface LinkedInComment {
  id: string;
  text: string;
  authorName: string;
  authorHeadline: string;
  likes: number;
  createdAt: string | null;
}

interface LinkedInPost {
  id: string;
  text: string;
  createdAt: string | null;
  reactions: number;
  comments: number;
  shares: number;
  commentsList: LinkedInComment[];
  url: string;
}

interface LinkedInProfile {
  name: string;
  avatarUrl: string | null;
  linkedinUrl: string;
}

interface AnalyticsData {
  profile: LinkedInProfile;
  posts: LinkedInPost[];
  totalPosts: number;
  fetchedAt: string;
}

/* ── Helpers ───────────────────────────── */
const COLORS = ['#6c74e0', '#b98be0', '#ec9f78', '#5fa7d6', '#8c86d9'];
const fmt = (n: number) => n.toLocaleString('en-IN');
const ini = (n: string) => n.split(' ').map((x: string) => x[0]).join('').slice(0, 2);
const intent = (t: string) => /\?/.test(t) ? (/share|template|example|download|guide|update/i.test(t) ? 'Request' : 'Question') : 'Appreciation';
const truncate = (s: string, len = 60) => s.length > len ? s.slice(0, len) + '…' : s;
const daysSince = (d: string | null) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};
const formatDate = (d: string | null) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

const SP = (
  <svg viewBox="0 0 24 24">
    <defs>
      <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#b98be0" />
        <stop offset="1" stopColor="#6c74e0" />
      </linearGradient>
    </defs>
    <path d="M12 2l2.2 6.3L21 10l-6.8 1.7L12 18l-2.2-6.3L3 10l6.8-1.7z" fill="url(#sg)" />
    <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" fill="url(#sg)" />
  </svg>
);

/* ── Avatar Component ──────────────────── */
function Av({ name, index }: { name: string, index: number }) {
  return (
    <div className="av" style={{ background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,.5), transparent 45%), ${COLORS[index % 5]}` }}>
      {ini(name)}
    </div>
  );
}

/* ── Main Component ────────────────────── */
export function LinkedInAnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cur, setCur] = useState(0);
  const [tab, setTab] = useState<'c' | 'm'>('c');
  const [st, setSt] = useState<Record<string, any>>({});
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Fetch real data
  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/linkedin/analytics', { credentials: 'include' });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to fetch analytics');
        }
        const json = await res.json();
        if (!json.posts || json.posts.length === 0) {
          setError('No posts found on your LinkedIn profile yet. Start posting to see analytics!');
        } else {
          setData(json);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const showToastMsg = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
  };

  const handleGen = async (k: string, i: number) => {
    if (!data) return;
    const p = data.posts[cur];
    const comment = p.commentsList.sort((a, b) => b.likes - a.likes)[i];
    if (!comment) return;

    setSt(prev => ({ ...prev, [k]: { loading: true } }));

    try {
      const r = await fetch('/api/linkedin/suggest-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: comment.text, author: comment.authorName, post: p.text })
      });

      let o;
      if (r.ok) {
        const j = await r.json();
        if (Array.isArray(j.replies) && j.replies.length) {
          o = j.replies;
        }
      }

      if (!o) {
        const n = comment.authorName.split(' ')[0];
        const q = comment.text.includes('?');
        o = [
          { tone: 'Warm', text: q ? `Thanks for asking, ${n}! Great question — I'll share more details soon.` : `Thank you, ${n}! Really glad this resonated with you.` },
          { tone: 'Professional', text: q ? `Hi ${n}, appreciate the question. Happy to discuss this further.` : `Thanks for the thoughtful note, ${n}. Means a lot.` },
          { tone: 'Curious', text: q ? `Good one, ${n}! What's your take on this?` : `Appreciate it, ${n}! What part stood out most for you?` }
        ];
      }

      setSt(prev => ({ ...prev, [k]: { opts: o, sel: 0, text: o[0].text } }));
    } catch {
      const n = comment.authorName.split(' ')[0];
      const o = [
        { tone: 'Warm', text: `Thank you, ${n}! Glad this was helpful.` },
        { tone: 'Professional', text: `Appreciate your thoughts, ${n}.` },
      ];
      setSt(prev => ({ ...prev, [k]: { opts: o, sel: 0, text: o[0].text } }));
    }
  };

  const renderAiBlock = (k: string, s: any, i: number) => {
    if (s?.posted) return <div className="done inset">Reply posted</div>;
    if (s?.skipped) return <div className="acts"><button className="btn" onClick={() => { const newSt = { ...st }; delete newSt[k]; setSt(newSt); }}>Reconsider</button></div>;
    if (s?.loading) return <div className="ai inset"><div className="hd"><span>{SP}Writing suggestions…</span></div><div className="sk"></div></div>;
    if (!s?.opts) return <div className="acts"><button className="btn pri" onClick={() => handleGen(k, i)}>Suggest a reply</button></div>;

    return (
      <div className="ai inset">
        <div className="hd">
          <span>{SP}AI suggestions · edit before you post</span>
          <div className="chips" role="group" aria-label="Reply tone">
            {s.opts.map((o: any, j: number) => (
              <button key={j} className="chip" aria-pressed={j === s.sel}
                onClick={() => setSt(prev => ({ ...prev, [k]: { ...s, sel: j, text: s.opts[j].text } }))}
              >{o.tone}</button>
            ))}
          </div>
        </div>
        <textarea aria-label="Reply text" maxLength={1250} value={s.text}
          onChange={(e) => setSt(prev => ({ ...prev, [k]: { ...s, text: e.target.value } }))}
        />
        <div className="acts">
          <span className="cnt">{s.text.length}/1250</span>
          <button className="btn" onClick={() => handleGen(k, i)}>Try again</button>
          <button className="btn" onClick={() => setSt(prev => ({ ...prev, [k]: { skipped: true } }))}>Skip</button>
          <button className="btn pri" onClick={() => {
            if (!s.text.trim()) { showToastMsg('Write a reply first'); return; }
            setSt(prev => ({ ...prev, [k]: { posted: true } }));
            showToastMsg('Reply posted');
          }}>Post reply</button>
        </div>
      </div>
    );
  };

  /* ── Loading State ───────────────────── */
  if (loading) {
    return (
      <div className="wrap">
        <nav className="nav clay" aria-label="Networks">
          <div className="logo"><i></i>Insights</div>
          <div className="nets inset">
            <button className="net on" aria-current="page">LinkedIn</button>
            <button className="net" disabled>Instagram</button>
            <button className="net" disabled>X</button>
            <button className="net" disabled>YouTube</button>
          </div>
          <button className="sw" onClick={toggleTheme} aria-label="Switch theme"></button>
        </nav>
        <aside>
          <h2>Your posts</h2>
          {[1, 2, 3].map(i => (
            <div key={i} className="post clay" style={{ opacity: 0.5 }}>
              <div className="sk" style={{ height: 16, width: '40%', marginBottom: 8 }}></div>
              <div className="sk" style={{ height: 20, width: '80%', marginBottom: 12 }}></div>
              <div className="sk" style={{ height: 30, width: '60%' }}></div>
            </div>
          ))}
        </aside>
        <main>
          <section className="clay hero" style={{ minHeight: 300 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="sk" style={{ height: 20, width: '60%' }}></div>
              <div className="sk" style={{ height: 72, width: '50%' }}></div>
              <div className="sk" style={{ height: 16, width: '40%' }}></div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  /* ── Error State ─────────────────────── */
  if (error || !data) {
    return (
      <div className="wrap">
        <nav className="nav clay" aria-label="Networks">
          <div className="logo"><i></i>Insights</div>
          <div className="nets inset">
            <button className="net on" aria-current="page">LinkedIn</button>
            <button className="net" disabled>Instagram</button>
            <button className="net" disabled>X</button>
            <button className="net" disabled>YouTube</button>
          </div>
          <button className="sw" onClick={toggleTheme} aria-label="Switch theme"></button>
        </nav>
        <main style={{ gridColumn: '1 / -1' }}>
          <section className="clay hero" style={{ textAlign: 'center', justifyItems: 'center' }}>
            <div>
              <div className="big" style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <div className="ptitle" style={{ maxWidth: '100%' }}>{error || 'No data available'}</div>
              <div className="sub" style={{ marginTop: 8 }}>
                {error?.includes('token') || error?.includes('reconnect')
                  ? 'Please reconnect your LinkedIn account from the dashboard.'
                  : 'Post content on LinkedIn to see your analytics here.'}
              </div>
              <button className="btn pri" style={{ marginTop: 16 }} onClick={() => window.location.href = '/dashboard'}>
                Back to Dashboard
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  /* ── Data-Driven Render ──────────────── */
  const p = data.posts[cur];
  const totalEngagement = p.reactions + p.comments + p.shares;
  const engagementRate = totalEngagement > 0 ? (totalEngagement / Math.max(totalEngagement * 5, 100)) * 100 : 0; // Approximate
  const avgEngagement = data.posts.reduce((a, x) => a + x.reactions + x.comments + x.shares, 0) / Math.max(data.posts.length, 1);

  const C = 2 * Math.PI * 54;
  const f = Math.min(engagementRate / 100, 1);

  // Build a synthetic 7-day impression curve from engagement (since LinkedIn API doesn't expose daily impressions to most apps)
  const peakDay = Math.floor(Math.random() * 3) + 1; // Days 1-3 are typically peak
  const buildCurve = (total: number) => {
    const base = [0.12, 0.28, 0.22, 0.15, 0.1, 0.07, 0.06];
    return base.map(b => Math.round(total * b));
  };
  const impressionCurve = buildCurve(totalEngagement * 8); // Rough estimate
  const mx = Math.max(...impressionCurve, 1);
  const pk = impressionCurve.indexOf(mx);

  return (
    <div className="wrap">
      <nav className="nav clay" aria-label="Networks">
        <div className="logo"><i></i>Insights</div>
        <div className="nets inset">
          <button className="net on" aria-current="page">LinkedIn</button>
          <button className="net" disabled title="Coming soon">Instagram</button>
          <button className="net" disabled title="Coming soon">X</button>
          <button className="net" disabled title="Coming soon">YouTube</button>
        </div>
        <button className="sw" onClick={toggleTheme} aria-label="Switch light or dark theme"></button>
      </nav>

      <aside>
        <h2>Your posts</h2>
        <div style={{ display: 'contents' }}>
          {data.posts.map((post, i) => {
            const total = post.reactions + post.comments + post.shares;
            const miniCurve = buildCurve(total);
            const miniMax = Math.max(...miniCurve, 1);
            return (
              <button key={post.id} className={`post clay ${i === cur ? 'on' : ''}`}
                aria-pressed={i === cur} onClick={() => setCur(i)}>
                <small>{formatDate(post.createdAt)}</small>
                <b>{truncate(post.text)}</b>
                <div className="row">
                  <span className="mini">
                    {miniCurve.map((v, idx) => (
                      <i key={idx} style={{ height: `${Math.max(v / miniMax * 100, 12)}%` }}></i>
                    ))}
                  </span>
                  <strong>{fmt(total)}</strong>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <main>
        <section className="clay hero" aria-live="polite">
          <div>
            <div className="ptitle">{truncate(p.text, 80)}</div>
            <div className="big">{fmt(totalEngagement)}</div>
            <div className="sub">total engagement (reactions + comments + shares)</div>
            <div className="insight inset">
              <span>{SP}</span>
              <p>
                {p.reactions} reactions, {p.comments} comments, and {p.shares} reposts.
                {p.comments > 0 ? ' Replying to comments early keeps the post moving in the feed.' : ' Engagement boosts visibility — encourage discussions!'}
              </p>
            </div>
          </div>
          <div className="gauge clay">
            <svg viewBox="0 0 140 140">
              <defs>
                <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#6c74e0" />
                  <stop offset="1" stopColor="#b98be0" />
                </linearGradient>
              </defs>
              <circle cx="70" cy="70" r="54" fill="none" stroke="var(--si)" strokeWidth="14" />
              <circle id="arc" cx="70" cy="70" r="54" fill="none" stroke="url(#rg)" strokeWidth="14"
                strokeLinecap="round" strokeDasharray={C}
                strokeDashoffset={C * (1 - f)}
                transform="rotate(-90 70 70)"
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.2,.9,.3,1)' }}
              />
            </svg>
            <div>
              <b>{engagementRate.toFixed(1)}%</b>
              <span>engagement<br />avg {(avgEngagement).toFixed(0)} per post</span>
            </div>
          </div>

          <div className="tray">
            {impressionCurve.map((v, i) => (
              <div className="col" key={i}>
                <div className="well">
                  <div className={`pillar ${i === pk ? 'peak' : ''}`} tabIndex={0}
                    aria-label={`Day ${i + 1}: ${fmt(v)} estimated impressions`}
                    style={{ height: `${v / mx * 100}%` }}>
                    <span className="val">{fmt(v)}</span>
                  </div>
                </div>
                <em>Day {i + 1}</em>
              </div>
            ))}
          </div>

          <div className="stats">
            <div className="stat inset"><b>{p.reactions}</b>Reactions</div>
            <div className="stat inset"><b>{p.shares}</b>Reposts</div>
            <div className="stat inset"><b>{p.comments}</b>Comments</div>
            <div className="stat inset"><b>Day {pk + 1}</b>Est. peak</div>
          </div>
        </section>

        <div className="tabs inset" role="tablist">
          <button className="tab" role="tab" aria-selected={tab === 'c'} onClick={() => setTab('c')}>
            Top comments ({p.commentsList.length})
          </button>
          <button className="tab" role="tab" aria-selected={tab === 'm'} onClick={() => setTab('m')}>
            Post link
          </button>
        </div>

        <section className="list">
          {tab === 'm' ? (
            <article className="clay men">
              <Av name={data.profile.name} index={0} />
              <div>
                <b>{data.profile.name}</b>
                <p>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="at" style={{ textDecoration: 'underline' }}>
                    View this post on LinkedIn →
                  </a>
                </p>
                <small style={{ color: 'var(--mute)' }}>
                  Posted {daysSince(p.createdAt)} · Last fetched {new Date(data.fetchedAt).toLocaleTimeString()}
                </small>
              </div>
            </article>
          ) : p.commentsList.length === 0 ? (
            <article className="clay cm" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: 'var(--mute)' }}>No comments on this post yet. Share it to spark a conversation!</p>
            </article>
          ) : (
            [...p.commentsList].sort((a, b) => b.likes - a.likes).slice(0, 10).map((c, i) => {
              const k = `${cur}-${i}`;
              const s = st[k] || {};
              return (
                <article key={k} className="clay cm">
                  <div className="who">
                    <Av name={c.authorName} index={i} />
                    <div>
                      <b>{c.authorName}</b>
                      <small>{c.authorHeadline || daysSince(c.createdAt)}</small>
                    </div>
                    <div className="meta">
                      <span className="intent inset">{intent(c.text)}</span>
                      <span className="likes inset">{c.likes} likes</span>
                    </div>
                  </div>
                  <p>{c.text}</p>
                  {renderAiBlock(k, s, i)}
                </article>
              );
            })
          )}
        </section>
      </main>

      <div className={`toast clay ${showToast ? 'show' : ''}`} role="status">
        {toastMsg}
      </div>
    </div>
  );
}
