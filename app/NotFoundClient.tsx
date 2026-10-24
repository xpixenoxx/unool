'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import './not-found.css';

interface Glyph {
  ch: string;
  i: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  state: 'drift' | 'flying' | 'done';
  fx: number;
  fy: number;
  p: number;
}

interface Spark {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  r?: number;
  life: number;
  ring?: boolean;
}

function isClientSideAuthed(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Check sessionStorage (primary auth storage in Unool)
  try {
    const raw = sessionStorage.getItem('unool_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.userId || parsed?.access_token) return true;
    }
  } catch {}

  // 2. Check localStorage
  try {
    const raw = localStorage.getItem('unool_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.userId || parsed?.access_token) return true;
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.includes('-auth-token')) {
        const val = localStorage.getItem(key);
        if (val && (val.includes('access_token') || val.includes('user'))) {
          return true;
        }
      }
    }
  } catch {}

  // 3. Check document.cookie for non-httpOnly auth tokens
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const parts = cookie.trim().split('=');
      const name = parts[0];
      const val = parts.slice(1).join('=');
      if (
        (name.startsWith('sb-') && name.includes('-auth-token')) ||
        name === 'dev-auth-bypass' ||
        name === 'unool_session'
      ) {
        if (val && val.length > 5 && val !== 'false' && val !== '""') {
          return true;
        }
      }
    }
  } catch {}

  return false;
}

export function NotFoundClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [title, setTitle] = useState<string>('404: this page wandered off.');
  const [sub, setSub] = useState<string>(
    'Page not found. Sweep your light around the dark and catch the letters that spell pixenox.'
  );
  const [tally, setTally] = useState<string>('0 of 7 letters caught');
  const [solved, setSolved] = useState<boolean>(false);
  const router = useRouter();
  const [targetHref, setTargetHref] = useState<string>('/');

  // Route to /dashboard ONLY for users who are logged in with an Unool account.
  // Otherwise, strictly route to homepage (/).
  useEffect(() => {
    let isMounted = true;

    // Fast initial synchronous check from client-side storage
    if (isClientSideAuthed()) {
      setTargetHref('/dashboard');
    }

    // Fast asynchronous check from server auth status endpoint
    fetch('/api/auth/status', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data?.authenticated) {
          setTargetHref('/dashboard');
        } else if (!isClientSideAuthed()) {
          setTargetHref('/');
        }
      })
      .catch(() => {});

    // Supabase browser client session check
    const checkSupabase = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user?.id && isMounted) {
          setTargetHref('/dashboard');
          return;
        }
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id && isMounted) {
          setTargetHref('/dashboard');
        }
      } catch {}
    };
    checkSupabase();

    const supabase = getSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: unknown, session: { user?: { id?: string } } | null) => {
        if (isMounted) {
          setTargetHref(session?.user?.id || isClientSideAuthed() ? '/dashboard' : '/');
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleHomeClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // 1. If targetHref has already resolved to dashboard, navigate to /dashboard
    if (targetHref === '/dashboard') {
      e.preventDefault();
      router.push('/dashboard');
      return;
    }

    // 2. Fast synchronous check of client storage
    if (isClientSideAuthed()) {
      e.preventDefault();
      setTargetHref('/dashboard');
      router.push('/dashboard');
      return;
    }

    // 3. Quick verification check against /api/auth/status with timeout
    e.preventDefault();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600);
      const res = await fetch('/api/auth/status', {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data?.authenticated) {
          setTargetHref('/dashboard');
          router.push('/dashboard');
          return;
        }
      }
    } catch {}

    // 4. Supabase browser client session check
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setTargetHref('/dashboard');
        router.push('/dashboard');
        return;
      }
    } catch {}

    // 5. Strictly a non-user / guest: navigate strictly to homepage
    router.push('/');
  };

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const context = cv.getContext('2d');
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

    // Body state setup
    const origCursor = document.body.style.cursor;
    const origTouch = document.body.style.touchAction;
    const origOverflow = document.body.style.overflow;
    const origBg = document.body.style.backgroundColor;
    const origColor = document.body.style.color;

    document.body.style.cursor = 'none';
    document.body.style.touchAction = 'none';
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = '#0e1420';
    document.body.style.color = '#f4efe4';

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const speed = reduce ? 0.25 : 1;

    const chars = [...'pixenox'];
    const N = chars.length;

    let W = window.innerWidth;
    let H = window.innerHeight;
    let DPR = Math.min(window.devicePixelRatio || 1, 2);
    let R = Math.max(130, Math.min(W, H) * 0.24);

    const light = { x: W / 2, y: H / 2, tx: W / 2, ty: H / 2, active: false };
    let idleT = 0;
    const glyphs: Glyph[] = [];
    const sparks: Spark[] = [];
    let found = 0;
    let isSolved = false;

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      if (cv) {
        cv.width = W * DPR;
        cv.height = H * DPR;
      }
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      R = Math.max(130, Math.min(W, H) * 0.24);
    }
    resize();
    window.addEventListener('resize', resize);

    try {
      document.fonts.load('16px "Press Start 2P"');
    } catch {
      // Font fallback
    }
    const PX = '"Press Start 2P", ui-monospace, Menlo, monospace';

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    chars.forEach((ch, i) => {
      glyphs.push({
        ch,
        i,
        x: rand(60, Math.max(60, W - 60)),
        y: rand(H * 0.25, Math.max(H * 0.25, H - 140)),
        vx: rand(-0.5, 0.5),
        vy: rand(-0.4, 0.4),
        rot: 0,
        vr: 0,
        size: rand(34, 56),
        state: ch === ' ' ? 'done' : 'drift',
        fx: 0,
        fy: 0,
        p: 0,
      });
    });

    function slot(i: number) {
      const w = Math.min(34, (W - 48) / N);
      return { x: W / 2 - (N * w) / 2 + w * (i + 0.5), y: H - 70, w };
    }

    function pointer(e: MouseEvent | TouchEvent | PointerEvent) {
      const t = 'touches' in e && e.touches.length > 0 ? e.touches[0] : (e as MouseEvent);
      light.tx = t.clientX;
      light.ty = t.clientY;
      light.active = true;
      idleT = 0;
    }

    const ring = (x: number, y: number) => sparks.push({ x, y, r: 6, life: 1, ring: true });
    function burst(x: number, y: number) {
      for (let k = 0; k < 14; k++) {
        const a = rand(0, 6.28);
        const s = rand(1, 4);
        sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1 });
      }
    }

    const lines: [number, string][] = [
      [0.25, 'Warmer. It’s hiding close.'],
      [0.5, 'Halfway. The address is coming back together.'],
      [0.8, 'Almost whole.'],
    ];

    const countable = () => glyphs.filter((g) => g.ch !== ' ').length;

    function finish() {
      isSolved = true;
      setSolved(true);
      document.body.classList.add('solved');
      setTitle('404: every letter found, still not here.');
      setSub('Page not found, but you spelled pixenox. The way back is lit.');
    }

    function catchGlyph(g: Glyph) {
      g.state = 'flying';
      g.fx = g.x;
      g.fy = g.y;
      g.p = 0;
      burst(g.x, g.y);
      found++;
      const count = countable();
      setTally(`${found} of ${count} letters caught`);
      const frac = found / count;
      if (frac < 1) {
        for (const [threshold, msg] of lines) {
          if (frac >= threshold) setSub(msg);
        }
      } else {
        finish();
      }
    }

    function handlePointerDown(e: PointerEvent) {
      pointer(e);
      let best: Glyph | null = null;
      let bd = 1e9;
      for (const g of glyphs) {
        if (g.state !== 'drift') continue;
        const d = Math.hypot(g.x - e.clientX, g.y - e.clientY);
        if (d < g.size * 0.9 && d < R && d < bd) {
          best = g;
          bd = d;
        }
      }
      if (best) catchGlyph(best);
      else ring(e.clientX, e.clientY);
    }

    function handleKeyDown(e: KeyboardEvent) {
      const step = 60;
      const k: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      if (k[e.key]) {
        light.tx = Math.max(0, Math.min(W, light.tx + k[e.key][0]));
        light.ty = Math.max(0, Math.min(H, light.ty + k[e.key][1]));
        light.active = true;
        idleT = 0;
        e.preventDefault();
      }
      if (e.key === ' ' && document.activeElement === document.body) {
        e.preventDefault();
        let best: Glyph | null = null;
        let bd = 1e9;
        for (const g of glyphs) {
          if (g.state !== 'drift') continue;
          const d = Math.hypot(g.x - light.x, g.y - light.y);
          if (d < R && d < bd) {
            best = g;
            bd = d;
          }
        }
        if (best) catchGlyph(best);
      }
    }

    window.addEventListener('pointermove', pointer);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    let animId: number;

    function frame(t: number) {
      idleT += 1;
      if (!light.active || idleT > 600) {
        light.tx = W / 2 + Math.sin(t / 1700) * W * 0.32;
        light.ty = H / 2 + Math.cos(t / 2300) * H * 0.26;
      }
      light.x += (light.tx - light.x) * 0.12;
      light.y += (light.ty - light.y) * 0.12;

      ctx.fillStyle = '#0e1420';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Giant pixel 404: always readable, blazing amber under the lamp
      const D: Record<string, string[]> = {
        '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
        '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
      };
      const cell = Math.floor(Math.min((W * 0.82) / 17, (H * 0.46) / 7));
      const ox = Math.round(W / 2 - (17 * cell) / 2);
      const oy = Math.round(H * 0.54 - (7 * cell) / 2);

      ctx.beginPath();
      [...'404'].forEach((d, di) =>
        D[d].forEach((row, r) =>
          [...row].forEach((v, c) => {
            if (v === '1') {
              ctx.rect(ox + (di * 6 + c) * cell + 1, oy + r * cell + 1, cell - 2, cell - 2);
            }
          })
        )
      );
      ctx.fillStyle = isSolved ? '#ffd9a0' : 'rgba(169,189,219,.65)';
      ctx.fill();

      if (!isSolved) {
        const gr = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, R * 1.3);
        gr.addColorStop(0, 'rgba(255,225,170,1)');
        gr.addColorStop(1, 'rgba(255,217,160,0)');
        ctx.fillStyle = gr;
        ctx.fill();
      }

      // Tray placeholders
      const tf = Math.floor(Math.min(16, slot(0).w - 3));
      ctx.font = tf + 'px ' + PX;
      for (let i = 0; i < N; i++) {
        if (chars[i] === ' ') continue;
        const s = slot(i);
        ctx.fillStyle = 'rgba(143,163,196,.35)';
        ctx.fillRect(s.x - tf / 2, s.y + tf / 2 + 6, tf, 3);
      }

      // Glyphs
      for (const g of glyphs) {
        if (g.state === 'drift') {
          const dx = g.x - light.x;
          const dy = g.y - light.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < R * 0.7) {
            const f = (1 - d / (R * 0.7)) * 0.06;
            g.vx += (dx / d) * f;
            g.vy += (dy / d) * f;
          }
          g.vx *= 0.995;
          g.vy *= 0.995;
          const sp = Math.hypot(g.vx, g.vy);
          if (sp > 1.6) {
            g.vx *= 1.6 / sp;
            g.vy *= 1.6 / sp;
          }
          g.x += g.vx * speed;
          g.y += g.vy * speed;
          g.rot += g.vr * speed;
          if (g.x < 30 || g.x > W - 30) g.vx *= -1;
          if (g.y < 30 || g.y > H - 130) g.vy *= -1;
          const a = Math.max(0.05, 1 - d / R);
          ctx.save();
          ctx.translate(g.x, g.y);
          ctx.rotate(g.rot);
          ctx.font = Math.round(g.size * 0.7) + 'px ' + PX;
          ctx.fillStyle = 'rgba(244,239,228,' + (a * a + 0.14).toFixed(3) + ')';
          ctx.fillText(g.ch, 0, 0);
          ctx.restore();
        } else if (g.state === 'flying') {
          g.p = Math.min(1, g.p + 0.035);
          const e = 1 - Math.pow(1 - g.p, 3);
          const s = slot(g.i);
          g.x = g.fx + (s.x - g.fx) * e;
          g.y = g.fy + (s.y - g.fy) * e;
          ctx.save();
          ctx.translate(g.x, g.y);
          ctx.rotate(g.rot * (1 - e));
          ctx.font = Math.round(g.size * 0.7 + (tf - g.size * 0.7) * e) + 'px ' + PX;
          ctx.fillStyle = '#ffd9a0';
          ctx.fillText(g.ch, 0, 0);
          ctx.restore();
          if (g.p >= 1) g.state = 'done';
        } else if (g.ch !== ' ') {
          const s = slot(g.i);
          ctx.font = tf + 'px ' + PX;
          ctx.fillStyle = isSolved ? '#ffd9a0' : '#f4efe4';
          ctx.fillText(g.ch, s.x, s.y);
        }
      }

      // Sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.life -= s.ring ? 0.04 : 0.03;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        if (s.ring) {
          s.r = (s.r || 6) + 3;
          ctx.strokeStyle = 'rgba(255,217,160,' + s.life * 0.5 + ')';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, 6.28);
          ctx.stroke();
        } else {
          s.x += s.vx || 0;
          s.y += s.vy || 0;
          if (s.vx) s.vx *= 0.94;
          if (s.vy) s.vy *= 0.94;
          ctx.fillStyle = 'rgba(255,217,160,' + s.life + ')';
          ctx.fillRect(s.x, s.y, 2.5, 2.5);
        }
      }

      // The lamp itself: warm bloom + bright core
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const pulse = 1 + Math.sin(t / 380) * 0.03;
      const bloom = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, R * pulse);
      bloom.addColorStop(0, 'rgba(255,217,160,.22)');
      bloom.addColorStop(0.5, 'rgba(255,190,120,.07)');
      bloom.addColorStop(1, 'rgba(255,190,120,0)');
      ctx.fillStyle = bloom;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      ctx.fillStyle = '#fff3dc';
      ctx.fillRect(Math.round(light.x) - 4, Math.round(light.y) - 4, 8, 8);

      animId = requestAnimationFrame(frame);
    }

    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', pointer);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);

      document.body.style.cursor = origCursor;
      document.body.style.touchAction = origTouch;
      document.body.style.overflow = origOverflow;
      document.body.style.backgroundColor = origBg;
      document.body.style.color = origColor;
      document.body.classList.remove('solved');
    };
  }, []);

  return (
    <div className={`not-found-wrapper${solved ? ' solved' : ''}`}>
      <canvas id="c" ref={canvasRef} aria-hidden="true" />

      <div className="copy" aria-live="polite">
        <h1 id="title">{title}</h1>
        <p id="sub">{sub}</p>
        <p className="tally" id="tally">
          {tally}
        </p>
      </div>

      <Link
        className="home"
        href={targetHref}
        onClick={handleHomeClick}
      >
        Take me home
      </Link>
    </div>
  );
}
