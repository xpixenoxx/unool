'use client';

import React, { useState, useRef, useEffect, Suspense, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import './signin.css';

interface PlatformTileData {
  key: string;
  ic: string;
  name: string;
  readyText: string;
  liveText: string;
  isMore?: boolean;
}

const TILES: PlatformTileData[] = [
  { key: 'linkedin', ic: 'in', name: 'LinkedIn', readyText: 'Ready', liveText: 'Live' },
  { key: 'instagram', ic: 'Ig', name: 'Instagram', readyText: 'Ready', liveText: 'Live' },
  { key: 'bluesky', ic: 'Bs', name: 'Bluesky', readyText: 'Ready', liveText: 'Live' },
  { key: 'facebook', ic: 'f', name: 'Facebook', readyText: 'Ready', liveText: 'Live' },
  { key: 'youtube', ic: '▶', name: 'YouTube', readyText: 'Ready', liveText: 'Live' },
  { key: 'slack', ic: '#', name: 'Slack', readyText: 'Ready', liveText: 'Live' },
  { key: 'more', ic: '…', name: 'So on', readyText: 'and more', liveText: 'More every month', isMore: true },
];

function SignInComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stage, setStage] = useState<'form' | 'otp'>('form');
  const [busy, setBusy] = useState(false);
  const [emailError, setEmailError] = useState('');
  const urlErrorParam = searchParams.get('error') ? decodeURIComponent(searchParams.get('error')!) : '';
  const initialIsAccountError =
    urlErrorParam === 'account_deleted' ||
    urlErrorParam === 'account_suspended' ||
    urlErrorParam.toLowerCase().includes('contact unool team');

  const [passwordError, setPasswordError] = useState(initialIsAccountError ? '' : urlErrorParam);
  // 'deleted' | 'suspended' | null — triggers a clickable error link
  const [accountError, setAccountError] = useState<'deleted' | 'suspended' | null>(
    initialIsAccountError ? (urlErrorParam === 'account_suspended' ? 'suspended' : 'deleted') : null
  );

  // OTP States
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const [nextResendAt, setNextResendAt] = useState<string>();
  const [resendLoading, setResendLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Right-side Platform Tiles Live state
  const [liveTiles, setLiveTiles] = useState<Record<number, boolean>>({});

  // DOM Refs
  const goBtnRef = useRef<HTMLButtonElement>(null);

  // Cooldown timer for OTP
  useEffect(() => {
    if (!nextResendAt) return;
    const diff = Math.ceil((new Date(nextResendAt).getTime() - Date.now()) / 1000);
    if (diff > 0) setCooldown(Math.min(diff, 60));
  }, [nextResendAt]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Google OAuth
  const handleGoogleSignIn = async () => {
    try {
      setBusy(true);
      setEmailError('');
      setPasswordError('');
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=/dashboard`,
        },
      });
    } catch {
      setPasswordError('Failed to initiate Google sign in.');
      setBusy(false);
    }
  };

  // Trigger celebration on right-side tiles then navigate
  const triggerCelebration = (onComplete: () => void) => {
    TILES.forEach((_, i) => {
      setTimeout(() => {
        setLiveTiles((prev) => ({ ...prev, [i]: true }));
      }, i * 75);
    });
    setTimeout(onComplete, TILES.length * 75 + 350);
  };

  // Submit password authentication
  const submitAuth = async () => {
    if (busy) return;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let hasErr = false;

    if (!emailRe.test(email.trim())) {
      setEmailError('Enter a valid email, like name@company.com');
      hasErr = true;
    } else {
      setEmailError('');
    }

    if (!password) {
      setPasswordError('Enter your password');
      hasErr = true;
    } else {
      setPasswordError('');
    }

    if (hasErr) return;

    setBusy(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.message === 'account_deleted') {
          setAccountError('deleted');
          setPasswordError('');
        } else if (data.message === 'account_suspended') {
          setAccountError('suspended');
          setPasswordError('');
        } else {
          setAccountError(null);
          setPasswordError(data.message || 'Invalid credentials.');
        }
        setBusy(false);
      } else if (data.session?.access_token) {
        const uid = data.userId || data.session?.user?.id;
        if (uid) {
          try {
            sessionStorage.setItem(
              'unool_session',
              JSON.stringify({
                access_token: data.session?.access_token || null,
                refresh_token: data.session?.refresh_token || null,
                userId: uid,
                email: data.session?.user?.email || email,
                ts: Date.now(),
              })
            );
          } catch {}
        }
        try {
          const supabase = getSupabaseBrowserClient();
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        } catch {}

        triggerCelebration(() => {
          router.push(data.redirectTo || '/dashboard');
        });
      } else {
        // OTP required by backend
        setNextResendAt(data.nextResendAt);
        setStage('otp');
        setBusy(false);
        setTimeout(() => otpRefs.current[0]?.focus(), 250);
      }
    } catch {
      setPasswordError('Network error. Please try again.');
      setBusy(false);
    }
  };

  // OTP handlers
  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    setOtpError('');
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otp];
    pasted.split('').forEach((ch, idx) => {
      next[idx] = ch;
    });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const verifyOtp = async () => {
    const token = otp.join('');
    if (token.length < 6) return;
    setBusy(true);
    setOtpError('');

    try {
      const res = await fetch('/api/auth/signin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: token }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (
          data.message === 'account_deleted' ||
          data.message === 'account_suspended' ||
          data.contactUrl ||
          (typeof data.message === 'string' && data.message.toLowerCase().includes('contact unool team'))
        ) {
          setAccountError(data.message === 'account_suspended' ? 'suspended' : 'deleted');
          setOtpError('');
        } else {
          setAccountError(null);
          setOtpError(data.message || 'Invalid code.');
        }
        setOtp(['', '', '', '', '', '']);
        setBusy(false);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      } else {
        const uid = data.userId || data.session?.user?.id;
        if (uid) {
          try {
            sessionStorage.setItem(
              'unool_session',
              JSON.stringify({
                access_token: data.session?.access_token || null,
                refresh_token: data.session?.refresh_token || null,
                userId: uid,
                email: data.session?.user?.email || email,
                ts: Date.now(),
              })
            );
          } catch {}
        }
        if (data.session?.access_token) {
          try {
            const supabase = getSupabaseBrowserClient();
            await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            });
          } catch {}
        }

        triggerCelebration(() => {
          router.push(data.redirectTo || '/dashboard');
        });
      }
    } catch {
      setOtpError('Network error.');
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), purpose: 'signin' }),
      });
      setOtp(['', '', '', '', '', '']);
      setCooldown(60);
      otpRefs.current[0]?.focus();
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="unool-signin-page">
      <div className="frame">
        {/* Top Header */}
        <header>
          <Link href="/" className="mark" aria-label="Unool Home">
            <img className="lg" src="/unool-icon.png" alt="Unool" />
            Unool
          </Link>
          <p>
            New to Unool? <Link href="/signup">Create an account</Link>
          </p>
        </header>

        {/* Scene Container: Form (Left/Center) + Platform Tiles (Right) */}
        <div className="wrap" id="wrap">
          <div className="scene" id="scene">
            {/* Center Column: Form Card */}
            <main className="sc">
              <div className="fc" id="fc">
                {stage === 'form' ? (
                  <>
                    <span className="tag" id="tag">
                      Welcome back
                    </span>
                    <h1>
                      <span>One link.</span>
                      <br />
                      One click<em>.</em>
                    </h1>
                    <p className="sub">Raw idea in, posts out. Everywhere, one click.</p>

                    <button className="g" type="button" onClick={handleGoogleSignIn} disabled={busy}>
                      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"
                        />
                        <path
                          fill="#34A853"
                          d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
                        />
                      </svg>
                      Continue with Google
                    </button>

                    <div className="or">
                      <i></i>or<i></i>
                    </div>

                    <label htmlFor="em">Email address</label>
                    <input
                      id="em"
                      type="email"
                      inputMode="email"
                      autoComplete="username"
                      placeholder="name@company.com"
                      value={email}
                      disabled={busy}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError('');
                        setAccountError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          submitAuth();
                        }
                      }}
                    />
                    <p className="err" id="emerr" role="alert">
                      {emailError}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        margin: '12px 0 5px',
                      }}
                    >
                      <label htmlFor="pw" style={{ margin: 0 }}>
                        Password
                      </label>
                      <Link href="/forgot-password" className="lnk">
                        Forgot password?
                      </Link>
                    </div>

                    <div className="f">
                      <input
                        id="pw"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        style={{ paddingRight: '64px' }}
                        value={password}
                        disabled={busy}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setPasswordError('');
                          setAccountError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            submitAuth();
                          }
                        }}
                      />
                      <button
                        className="eye"
                        type="button"
                        id="eye"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((p) => !p)}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {accountError ? (
                      <p className="err" id="pwerr" role="alert">
                        <a
                          href="https://unool.co/contact"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}
                        >
                          Session creation failed. Contact Unool team
                        </a>
                      </p>
                    ) : (
                      <p className="err" id="pwerr" role="alert">
                        {passwordError}
                      </p>
                    )}

                    <label className="ck">
                      <input type="checkbox" defaultChecked />
                      Keep me signed in on this device
                    </label>

                    <button
                      className="btn"
                      type="button"
                      id="go"
                      ref={goBtnRef}
                      disabled={busy}
                      onClick={submitAuth}
                    >
                      {busy ? (
                        <>
                          <span className="spin"></span>Signing in…
                        </>
                      ) : (
                        'Open my workspace →'
                      )}
                    </button>
                  </>
                ) : (
                  <div className="otp-container">
                    <span className="tag">Security check</span>
                    <h1>
                      <span>
                        Confirm code<em>.</em>
                      </span>
                    </h1>
                    <p className="sub">
                      We just sent a 6-digit verification code to <b>{email}</b>. Enter it below to access your workspace.
                    </p>

                    <div className="otp-grid">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => {
                            otpRefs.current[i] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => {
                            handleOtpKeyDown(i, e);
                            if (e.key === 'Enter') verifyOtp();
                          }}
                          onPaste={i === 0 ? handleOtpPaste : undefined}
                          disabled={busy}
                          className="otp-box"
                        />
                      ))}
                    </div>

                    {accountError ? (
                      <p className="err" role="alert">
                        <a
                          href="https://unool.co/contact"
                          style={{ color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}
                        >
                          Session creation failed. Contact Unool team
                        </a>
                      </p>
                    ) : (
                      <p className="err" role="alert">
                        {otpError}
                      </p>
                    )}

                    <button
                      className="btn"
                      type="button"
                      disabled={busy || otp.join('').length < 6}
                      onClick={verifyOtp}
                    >
                      {busy ? (
                        <>
                          <span className="spin"></span>Verifying…
                        </>
                      ) : (
                        'Confirm & enter workspace →'
                      )}
                    </button>

                    <div className="otp-meta">
                      {cooldown > 0 ? (
                        <span style={{ fontSize: '13px', color: 'var(--mute)' }}>
                          Resend in {cooldown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="lnk"
                          onClick={handleResend}
                          disabled={resendLoading}
                        >
                          {resendLoading ? 'Sending...' : 'Resend code'}
                        </button>
                      )}

                      <button
                        type="button"
                        className="lnk"
                        onClick={() => {
                          setStage('form');
                          setOtp(['', '', '', '', '', '']);
                          setOtpError('');
                        }}
                      >
                        ← Back
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </main>

            {/* Right Column: Platform Tiles */}
            <aside className="sr" id="sr" aria-label="Connected Platforms">
              {TILES.map((tile, i) => {
                const isLive = liveTiles[i];
                return (
                  <div
                    key={tile.key}
                    className={`tl ${tile.isMore ? 'more' : ''} ${isLive ? 'live' : ''}`}
                    onMouseMove={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      const x = (e.clientX - r.left) / r.width - 0.5;
                      const y = (e.clientY - r.top) / r.height - 0.5;
                      e.currentTarget.style.setProperty('--ry', `${x * 12}deg`);
                      e.currentTarget.style.setProperty('--rx', `${-y * 10}deg`);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.setProperty('--rx', '0deg');
                      e.currentTarget.style.setProperty('--ry', '0deg');
                    }}
                  >
                    <span className="ic">{tile.ic}</span>
                    <div>
                      <b>{tile.name}</b>
                      <em>{isLive ? tile.liveText : tile.readyText}</em>
                    </div>
                    <span className="ok">✓</span>
                  </div>
                );
              })}
            </aside>
          </div>
        </div>

        {/* Footer */}
        <footer>
          <span>&copy; {new Date().getFullYear()} Pixenox Solutions · Unool</span>
          <span>
            <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/refund">Refunds</Link> · <Link href="/contact">Contact</Link>
          </span>
        </footer>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FBF8F3',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              border: '2px solid #D2C5B8',
              borderTopColor: '#5A1020',
              borderRadius: '50%',
              animation: 'sp 0.7s linear infinite',
            }}
          />
        </div>
      }
    >
      <SignInComponent />
    </Suspense>
  );
}
