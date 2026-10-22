'use client';

import React, { useState, useRef, useEffect, Suspense, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import './signin.css';

function SignInComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [stage, setStage] = useState<'form' | 'otp'>('form');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState(
    searchParams.get('error') ? decodeURIComponent(searchParams.get('error')!) : ''
  );

  // OTP States
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const [nextResendAt, setNextResendAt] = useState<string>();
  const [resendLoading, setResendLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

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
        setPasswordError(data.message || 'Invalid email or password.');
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

        setSuccess(true);
        setTimeout(() => {
          router.push(data.redirectTo || '/dashboard');
        }, 300);
      } else {
        // OTP required by backend
        setNextResendAt(data.nextResendAt);
        setStage('otp');
        setBusy(false);
        setTimeout(() => otpRefs.current[0]?.focus(), 150);
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
        setOtpError(data.message || 'Invalid verification code.');
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

        setSuccess(true);
        setTimeout(() => {
          router.push(data.redirectTo || '/dashboard');
        }, 300);
      }
    } catch {
      setOtpError('Network error. Please try again.');
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
      <div className="signin-shell">
        {/* Header / Brand */}
        <header className="signin-header">
          <Link href="/" className="signin-brand" aria-label="Unool Home">
            <img src="/unool-icon.png" alt="Unool Logo" className="brand-icon" />
            <span className="brand-text">unool</span>
          </Link>
        </header>

        {/* Centered Auth Card Container */}
        <main className="signin-main">
          <div className="auth-card">
            {stage === 'form' ? (
              <>
                <div className="card-top">
                  <span className="welcome-tag">Welcome back</span>
                  <h1 className="card-title">Sign in to your account</h1>
                  <p className="card-desc">
                    Enter your email and password, or continue with Google.
                  </p>
                </div>

                {/* Google OAuth Button */}
                <button
                  type="button"
                  className="btn-google"
                  onClick={handleGoogleSignIn}
                  disabled={busy || success}
                >
                  <svg className="google-icon" width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
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
                  <span>Continue with Google</span>
                </button>

                <div className="auth-divider">
                  <span className="divider-line" />
                  <span className="divider-text">or with email</span>
                  <span className="divider-line" />
                </div>

                {/* Email & Password Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitAuth();
                  }}
                  noValidate
                >
                  <div className="form-group">
                    <label htmlFor="signin-email" className="input-label">
                      Email address
                    </label>
                    <input
                      id="signin-email"
                      type="email"
                      inputMode="email"
                      autoComplete="username"
                      placeholder="name@company.com"
                      value={email}
                      disabled={busy || success}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError('');
                      }}
                      className={`text-input ${emailError ? 'input-error' : ''}`}
                    />
                    {emailError && (
                      <p className="field-error" role="alert">
                        {emailError}
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <div className="password-header">
                      <label htmlFor="signin-password" className="input-label">
                        Password
                      </label>
                      <Link href="/forgot-password" className="forgot-link">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="password-input-wrap">
                      <input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        disabled={busy || success}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setPasswordError('');
                        }}
                        className={`text-input password-input ${passwordError ? 'input-error' : ''}`}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword((p) => !p)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="field-error" role="alert">
                        {passwordError}
                      </p>
                    )}
                  </div>

                  <div className="remember-row">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={busy || success}
                      />
                      <span>Keep me signed in</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className={`btn-primary ${success ? 'btn-success' : ''}`}
                    disabled={busy || success}
                  >
                    {success ? (
                      <>
                        <CheckCircle2 size={18} className="btn-icon" />
                        <span>Welcome back! Opening workspace…</span>
                      </>
                    ) : busy ? (
                      <>
                        <span className="spinner" />
                        <span>Signing in…</span>
                      </>
                    ) : (
                      <>
                        <span>Sign in to workspace</span>
                        <ArrowRight size={16} className="btn-icon" />
                      </>
                    )}
                  </button>
                </form>

                <div className="signup-switch">
                  <span>Don’t have an account?</span>{' '}
                  <Link href="/signup" className="signup-switch-link">
                    Create account →
                  </Link>
                </div>
              </>
            ) : (
              /* OTP Verification Stage */
              <div className="otp-view">
                <div className="card-top">
                  <span className="welcome-tag security">
                    <ShieldCheck size={13} style={{ display: 'inline', marginRight: 4 }} />
                    Security Check
                  </span>
                  <h1 className="card-title">Confirm verification code</h1>
                  <p className="card-desc">
                    We sent a 6-digit code to <strong>{email}</strong>. Enter it below to access your workspace.
                  </p>
                </div>

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
                      disabled={busy || success}
                      className="otp-box"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                {otpError && (
                  <p className="field-error text-center" role="alert">
                    {otpError}
                  </p>
                )}

                <button
                  type="button"
                  className={`btn-primary ${success ? 'btn-success' : ''}`}
                  disabled={busy || success || otp.join('').length < 6}
                  onClick={verifyOtp}
                >
                  {success ? (
                    <>
                      <CheckCircle2 size={18} className="btn-icon" />
                      <span>Code confirmed! Opening workspace…</span>
                    </>
                  ) : busy ? (
                    <>
                      <span className="spinner" />
                      <span>Verifying…</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & open workspace</span>
                      <ArrowRight size={16} className="btn-icon" />
                    </>
                  )}
                </button>

                <div className="otp-actions">
                  {cooldown > 0 ? (
                    <span className="otp-cooldown">Resend code in {cooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      className="otp-link-btn"
                      onClick={handleResend}
                      disabled={resendLoading}
                    >
                      {resendLoading ? 'Sending new code…' : 'Resend code'}
                    </button>
                  )}

                  <button
                    type="button"
                    className="otp-link-btn"
                    onClick={() => {
                      setStage('form');
                      setOtp(['', '', '', '', '', '']);
                      setOtpError('');
                    }}
                  >
                    ← Back to login
                  </button>
                </div>
              </div>
            )}

            {/* Card Bottom Legal */}
            <div className="auth-card-footer">
              <span>By continuing, you agree to Unool’s</span>{' '}
              <Link href="/terms" className="footer-legal-link">
                Terms
              </Link>{' '}
              <span>&</span>{' '}
              <Link href="/privacy" className="footer-legal-link">
                Privacy Policy
              </Link>
              .
            </div>
          </div>
        </main>

        {/* Global Footer */}
        <footer className="signin-footer">
          <p>© {new Date().getFullYear()} Unool. All rights reserved.</p>
          <div className="footer-links">
            <Link href="/">Home</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInComponent />
    </Suspense>
  );
}
