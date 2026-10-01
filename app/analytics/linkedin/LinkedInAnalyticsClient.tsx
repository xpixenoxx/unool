'use client';

import React, { useState, useEffect, useRef } from 'react';
import './styles.css';

const POSTS = [
  {
    id: 1,
    t: 'We shipped scheduled carousels for teams',
    d: 'Sep 24',
    s: [820, 2400, 3900, 3100, 2200, 1100, 900],
    react: 412,
    shares: 38,
    c: [
      ['Priya Nair', 'Product Lead', 'Finally! Does the carousel scheduler support PDF uploads too?', 64],
      ['Daniel Okafor', 'Founder, Loop', 'Love the team approvals flow. How do you handle brand review before posting?', 51],
      ['Meera Iyer', 'Designer', 'The preview looks so clean. Any plans for Canva import?', 37],
      ['Arjun Rao', 'Engineer', 'Curious how you queue posts across time zones.', 22],
      ['Sofia Lenz', 'Marketer', 'Saving this for our Q4 planning, thank you for sharing.', 14],
      ['Tom Bell', 'Student', 'Nice work!', 3]
    ]
  },
  {
    id: 2,
    t: 'What 90 days of posting daily taught our team',
    d: 'Sep 20',
    s: [1500, 3800, 5200, 4100, 2600, 1700, 1400],
    react: 688,
    shares: 91,
    c: [
      ['Kavya Reddy', 'Growth Manager', 'Did daily posting hurt quality or did engagement actually go up?', 88],
      ['Rahul Sen', 'Creator', 'Consistency beats virality. Agree completely.', 70],
      ['Hannah Cole', 'Agency owner', 'Which day of the week gave you the best reach?', 45],
      ['Vikram Shah', 'CMO', 'Would love the template you used for the content calendar.', 33],
      ['Lina Park', 'Analyst', 'The reach dip in week 6 matches what we saw too.', 19]
    ]
  },
  {
    id: 3,
    t: 'A simple rule for writing LinkedIn hooks',
    d: 'Sep 16',
    s: [600, 1300, 1900, 1500, 1100, 800, 640],
    react: 231,
    shares: 19,
    c: [
      ['Noah Reed', 'Copywriter', 'Could you share two before and after hook examples?', 41],
      ['Anika Joshi', 'Intern', 'This helped me rewrite my first post. Thank you!', 29],
      ['Carlos Mena', 'Founder', 'Does the rule hold for video posts as well?', 18],
      ['Zoya Khan', 'PM', 'Short and useful.', 9],
      ['Ethan Wu', 'Coach', 'Bookmarked.', 5]
    ]
  },
  {
    id: 4,
    t: 'Our PDF guide to repurposing one idea five ways',
    d: 'Sep 11',
    s: [900, 2100, 2700, 2300, 1800, 1200, 980],
    react: 344,
    shares: 77,
    c: [
      ['Ishaan Verma', 'Strategist', 'Is the guide free to download, and will you update it yearly?', 57],
      ['Grace Liu', 'Editor', 'The repurposing map on page 3 is great.', 34],
      ['Omar Nasser', 'Founder', 'Can teams of three share one workspace for this?', 26],
      ['Neha Gupta', 'Student', 'Thank you for making this available.', 12],
      ['Paul Ames', 'Consultant', 'Any tips for turning long posts into short video?', 11]
    ]
  }
];

const MENT = [
  ['Ravi Teja', 'mentioned you in a post', 'Thanks to @Shruthi for the walkthrough on scheduling. Our team saved hours this week.', '2h ago'],
  ['Studio Nine', 'tagged your page', 'Great read from @Shruthi on posting rhythm, worth a look for anyone running client pages.', 'Yesterday'],
  ['Ananya Das', 'mentioned you in a comment', '@Shruthi any chance you could share the analytics template you showed?', '2 days ago'],
  ['Marcus Hale', 'mentioned you in a post', 'Learning a lot from @Shruthi on repurposing content. Highly recommend following.', '4 days ago']
];

const COLORS = ['#6c74e0', '#b98be0', '#ec9f78', '#5fa7d6', '#8c86d9'];
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

const fmt = (n: number) => n.toLocaleString('en-IN');
const tot = (p: any) => p.s.reduce((a: number, b: number) => a + b, 0);
const eng = (p: any) => (p.react + p.shares + p.c.reduce((a: number, c: any) => a + c[3], 0)) / tot(p) * 100;
const intent = (t: string) => /\?/.test(t) ? (/share|template|example|download|guide|update/i.test(t) ? 'Request' : 'Question') : 'Appreciation';
const ini = (n: string) => n.split(' ').map((x: string) => x[0]).join('');

function Av({ name, index }: { name: string, index: number }) {
  return (
    <div className="av" style={{ background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,.5), transparent 45%), ${COLORS[index % 5]}` }}>
      {ini(name)}
    </div>
  );
}

export function LinkedInAnalyticsClient() {
  const [cur, setCur] = useState(0);
  const [tab, setTab] = useState<'c' | 'm'>('c');
  const [st, setSt] = useState<Record<string, any>>({});
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const p = POSTS[cur];
  const T = tot(p);
  const mx = Math.max(...p.s);
  const pk = p.s.indexOf(mx);
  const er = eng(p);
  const avg = POSTS.reduce((a, x) => a + eng(x), 0) / POSTS.length;

  const share = Math.round(p.s.slice(0, 3).reduce((a: number, b: number) => a + b, 0) / T * 100);
  const insightText = `Reach peaked on day ${pk + 1}. ${share}% of impressions arrived within 3 days, so replying to comments early keeps the post moving.`;
  const C = 2 * Math.PI * 54;
  const f = Math.min(er / 12, 1);

  useEffect(() => {
    // Detect system theme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const showToastMsg = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2200);
  };

  const handleGen = async (k: string, i: number) => {
    setSt(prev => ({ ...prev, [k]: { loading: true } }));
    const comment = [...p.c].sort((a, b) => b[3] - a[3])[i];
    
    try {
      const r = await fetch('/api/linkedin/suggest-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: comment[2], author: comment[0], post: p.t })
      });
      
      let o;
      if (r.ok) {
        const j = await r.json();
        if (Array.isArray(j.replies) && j.replies.length) {
          o = j.replies;
        }
      }
      
      if (!o) {
        const n = comment[0].split(' ')[0];
        const q = comment[2].includes('?');
        o = [
          { tone: 'Warm', text: q ? `Thanks for asking, ${n}! Great question. I'll share the details in a follow-up post this week, so keep an eye out.` : `Thank you, ${n}! Really glad this was useful to you.` },
          { tone: 'Professional', text: q ? `Hi ${n}, thank you for the question. Yes, we cover this, and I'm happy to send the specifics over by message.` : `Thanks for the thoughtful note, ${n}. Appreciate you taking the time to share it.` },
          { tone: 'Curious', text: q ? `Good one, ${n}. What would you want it to do in your setup? That would help us shape the answer.` : `Appreciate it, ${n}! What part stood out most for you?` }
        ];
      }
      
      setSt(prev => ({ ...prev, [k]: { opts: o, sel: 0, text: o[0].text } }));
    } catch (err) {
      console.error(err);
      const n = comment[0].split(' ')[0];
      const q = comment[2].includes('?');
      const o = [
        { tone: 'Warm', text: q ? `Thanks for asking, ${n}! Great question. I'll share the details in a follow-up post this week, so keep an eye out.` : `Thank you, ${n}! Really glad this was useful to you.` },
      ];
      setSt(prev => ({ ...prev, [k]: { opts: o, sel: 0, text: o[0].text } }));
    }
  };

  const renderAiBlock = (k: string, s: any, i: number) => {
    if (s?.posted) return <div className="done inset">Reply posted</div>;
    if (s?.skipped) return <div className="acts"><button className="btn" onClick={() => { const newSt={...st}; delete newSt[k]; setSt(newSt); }}>Reconsider</button></div>;
    if (s?.loading) return <div className="ai inset"><div className="hd"><span>{SP}Writing suggestions…</span></div><div className="sk"></div></div>;
    if (!s?.opts) return <div className="acts"><button className="btn pri" onClick={() => handleGen(k, i)}>Suggest a reply</button></div>;
    
    return (
      <div className="ai inset">
        <div className="hd">
          <span>{SP}AI suggestions · edit before you post</span>
          <div className="chips" role="group" aria-label="Reply tone">
            {s.opts.map((o: any, j: number) => (
              <button 
                key={j} 
                className="chip" 
                aria-pressed={j === s.sel}
                onClick={() => setSt(prev => ({ ...prev, [k]: { ...s, sel: j, text: s.opts[j].text } }))}
              >
                {o.tone}
              </button>
            ))}
          </div>
        </div>
        <textarea 
          aria-label="Reply text" 
          maxLength={1250} 
          value={s.text}
          onChange={(e) => setSt(prev => ({ ...prev, [k]: { ...s, text: e.target.value } }))}
        />
        <div className="acts">
          <span className="cnt">{s.text.length}/1250</span>
          <button className="btn" onClick={() => handleGen(k, i)}>Try again</button>
          <button className="btn" onClick={() => setSt(prev => ({ ...prev, [k]: { skipped: true } }))}>Skip</button>
          <button className="btn pri" onClick={() => {
            if (!s.text.trim()) {
              showToastMsg('Write a reply first');
              return;
            }
            setSt(prev => ({ ...prev, [k]: { posted: true } }));
            showToastMsg('Reply posted');
          }}>Post reply</button>
        </div>
      </div>
    );
  };

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
          {POSTS.map((post, i) => (
            <button 
              key={post.id} 
              className={`post clay ${i === cur ? 'on' : ''}`} 
              aria-pressed={i === cur}
              onClick={() => setCur(i)}
            >
              <small>{post.d}</small>
              <b>{post.t}</b>
              <div className="row">
                <span className="mini">
                  {post.s.map((v, idx) => (
                    <i key={idx} style={{ height: `${Math.max(v / Math.max(...POSTS.flatMap(x => x.s)) * 100, 12)}%` }}></i>
                  ))}
                </span>
                <strong>{fmt(tot(post))}</strong>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <main>
        <section className="clay hero" aria-live="polite">
          <div>
            <div className="ptitle">{p.t}</div>
            <div className="big">{fmt(T)}</div>
            <div className="sub">impressions in the first 7 days</div>
            <div className="insight inset">
              <span>{SP}</span>
              <p>{insightText}</p>
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
              <circle 
                id="arc" 
                cx="70" cy="70" r="54" fill="none" stroke="url(#rg)" strokeWidth="14" 
                strokeLinecap="round" strokeDasharray={C} 
                strokeDashoffset={C * (1 - f)} 
                transform="rotate(-90 70 70)" 
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.2,.9,.3,1)' }}
              />
            </svg>
            <div>
              <b>{er.toFixed(1)}%</b>
              <span>engagement<br/>page avg {avg.toFixed(1)}%</span>
            </div>
          </div>
          
          <div className="tray">
            {p.s.map((v, i) => (
              <div className="col" key={i}>
                <div className="well">
                  <div 
                    className={`pillar ${i === pk ? 'peak' : ''}`} 
                    tabIndex={0} 
                    aria-label={`Day ${i + 1}: ${fmt(v)} impressions`}
                    style={{ height: `${v / mx * 100}%` }}
                  >
                    <span className="val">{fmt(v)}</span>
                  </div>
                </div>
                <em>Day {i + 1}</em>
              </div>
            ))}
          </div>
          
          <div className="stats">
            <div className="stat inset"><b>{p.react}</b>Reactions</div>
            <div className="stat inset"><b>{p.shares}</b>Reposts</div>
            <div className="stat inset"><b>{p.c.length}</b>Comments</div>
            <div className="stat inset"><b>Day {pk + 1}</b>Peak day</div>
          </div>
        </section>

        <div className="tabs inset" role="tablist">
          <button className="tab" role="tab" aria-selected={tab === 'c'} onClick={() => setTab('c')}>Top comments</button>
          <button className="tab" role="tab" aria-selected={tab === 'm'} onClick={() => setTab('m')}>Mentions</button>
        </div>

        <section className="list">
          {tab === 'm' ? (
            MENT.map((m, i) => (
              <article key={i} className="clay men">
                <Av name={m[0]} index={i + 2} />
                <div>
                  <b>{m[0]}</b> <span style={{ color: 'var(--mute)' }}>{m[1]} · {m[3]}</span>
                  <p dangerouslySetInnerHTML={{ __html: m[2].replace('@Shruthi', '<span class="at">@Shruthi</span>') }} />
                </div>
              </article>
            ))
          ) : (
            [...p.c].sort((a: any, b: any) => b[3] - a[3]).slice(0, 5).map((c: any, i) => {
              const k = `${cur}-${i}`;
              const s = st[k] || {};
              return (
                <article key={k} className="clay cm">
                  <div className="who">
                    <Av name={c[0]} index={i} />
                    <div>
                      <b>{c[0]}</b>
                      <small>{c[1]}</small>
                    </div>
                    <div className="meta">
                      <span className="intent inset">{intent(c[2])}</span>
                      <span className="likes inset">{c[3]} likes</span>
                    </div>
                  </div>
                  <p>{c[2]}</p>
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
