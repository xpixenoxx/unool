'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, Bell, Mail, User, Bookmark, Loader2, Image, Sparkles, Smile, CheckCircle2, ArrowLeft } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

const C = {
  oxblood: '#3A0B1A',
  mahogany: '#5C1A1A',
  terracotta: '#8C2A25',
  clay: '#C84B31',
  sand: '#D4B896',
  cream: '#FFF9F2',
  ink: '#1A0A05',
};

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
}

function validateForm(name: string, email: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (!name.trim()) errors.name = 'Name is required.';
  if (!email.includes('@')) errors.email = 'Enter a valid email address.';
  if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
  if (password.length > 128) errors.password = 'Password must be at most 128 characters.';
  return errors;
}

export default function SignUpSocialPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<'form' | 'otp' | 'done'>('form');
  
  // OTP State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [nextResendAt, setNextResendAt] = useState<string>();
  const [cooldown, setCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!nextResendAt) return;
    const diff = Math.ceil((new Date(nextResendAt).getTime() - Date.now()) / 1000);
    if (diff > 0) setCooldown(Math.min(diff, 60));
  }, [nextResendAt]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    if (stage === 'otp') {
      setTimeout(() => otpRefs.current[0]?.focus(), 600);
    }
  }, [stage]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setApiError('');
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=/dashboard`
        }
      });
    } catch {
      setApiError('Failed to initiate Google sign in.');
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    const errs = validateForm(name, email, password);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.message || 'Something went wrong.');
      } else {
        setNextResendAt(new Date(Date.now() + 60_000).toISOString());
        setStage('otp');
      }
    } catch {
      setApiError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    setApiError('');
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otp];
    pasted.split('').forEach((ch, idx) => { next[idx] = ch; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const verifyOtp = async () => {
    const token = otp.join('');
    if (token.length < 6) return;
    setLoading(true);
    setApiError('');
    
    try {
      const res = await fetch('/api/auth/signup/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: token }),
      });
      const data = await res.json();

      if (!res.ok) {
        setApiError(data.message || 'Invalid code.');
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      } else {
        setStage('done');
        setTimeout(() => router.push(data.redirectTo || '/signin'), 2000);
      }
    } catch {
      setApiError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendLoading) return;
    setResendLoading(true);
    try {
      await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'signup' }),
      });
      setOtp(['', '', '', '', '', '']);
      setCooldown(60);
      otpRefs.current[0]?.focus();
    } finally {
      setResendLoading(false);
    }
  };

  const navItems = [
    { icon: Home, label: 'Home', active: false },
    { icon: Search, label: 'Explore', active: false },
    { icon: Bell, label: 'Notifications', active: false },
    { icon: Mail, label: 'Messages', active: false },
    { icon: Bookmark, label: 'Bookmarks', active: false },
    { icon: User, label: 'Profile', active: false },
  ];

  return (
    <div 
      className="min-h-screen w-full flex justify-center font-sans text-white selection:bg-[#C84B31]"
      style={{ background: `linear-gradient(180deg, ${C.oxblood} 0%, ${C.terracotta} 40%, ${C.sand} 80%, ${C.cream} 100%)` }}
    >
      <div className="w-full max-w-7xl flex h-screen overflow-hidden">
        
        {/* Left Sidebar (Nav) */}
        <div className="hidden sm:flex flex-col w-[80px] lg:w-[275px] shrink-0 border-r border-white/10 p-4">
          <Link href="/" className="flex items-center gap-4 p-3 hover:bg-white/5 w-fit rounded-full transition-colors mb-4 group">
            <ArrowLeft className="w-7 h-7 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden lg:block text-xl font-bold">Back to Site</span>
          </Link>
          
          <div className="flex flex-col gap-2 w-full mt-2">
            {navItems.map((item, i) => (
              <div key={i} className="flex items-center gap-5 p-3 w-fit lg:w-full lg:px-4 rounded-full transition-colors opacity-50 hover:bg-white/5 cursor-not-allowed">
                <item.icon className="w-7 h-7" />
                <span className="hidden lg:block text-xl">{item.label}</span>
              </div>
            ))}
          </div>

          <Link href="/signin" className="mt-8 bg-transparent border border-white text-white font-bold text-lg py-4 px-8 rounded-full hidden lg:block text-center hover:bg-white/10 transition-colors shadow-lg">
            Sign In Instead
          </Link>
        </div>

        {/* Center Feed: Composing a post */}
        <div className="flex-1 w-full max-w-[600px] border-r border-white/10 flex flex-col h-full overflow-y-auto no-scrollbar relative bg-black/40 backdrop-blur-md">
          {/* Header */}
          <div className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10 p-4 flex gap-8">
            <Link href="/signin" className="text-[15px] font-bold text-white/50 hover:text-white transition-colors pb-2">
              Sign In
            </Link>
            <Link href="/signup" className="text-[15px] font-bold relative pb-2 text-white">
              Sign Up
              <div className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full bg-[#C84B31]" />
            </Link>
          </div>

          {/* The Compose Area */}
          <div className="p-4 sm:p-6 pb-32">
            
            {/* The initial compose form */}
            <div className="relative z-10 w-full mb-6">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xl font-bold z-10 relative bg-white/10 shadow-inner">
                    {name ? name.charAt(0).toUpperCase() : <User className="w-6 h-6 opacity-50" />}
                  </div>
                  {/* Thread line connecting downward if stage changes */}
                  <AnimatePresence>
                    {stage !== 'form' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: '100%', opacity: 1 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="w-0.5 mt-2 flex-grow rounded-full bg-white/20"
                      />
                    )}
                  </AnimatePresence>
                </div>
                
                <div className="flex-1 pt-1">
                  {stage === 'form' ? (
                    <motion.form 
                      onSubmit={handleSignup} 
                      className="w-full flex flex-col gap-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <h2 className="text-xl font-bold mb-4 opacity-80">Compose your profile</h2>
                      
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center gap-3 p-3 text-[15px] font-bold text-white transition-colors outline-none disabled:opacity-50 group border border-white/10 mb-2"
                      >
                        <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform">
                          <svg viewBox="0 0 24 24" className="w-full h-full">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                        </div>
                        Continue with Google
                      </button>
                      
                      <div className="w-full flex items-center bg-transparent py-2">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-[10px] text-white/40 px-3 font-bold uppercase tracking-widest">Or email</span>
                        <div className="flex-1 h-px bg-white/10" />
                      </div>

                      <input
                        type="text"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setErrors(p => ({...p, name: undefined})); }}
                        disabled={loading}
                        className={`w-full bg-transparent border-none focus:ring-0 text-xl font-medium p-2 placeholder:text-white/30 text-white outline-none disabled:opacity-50
                          ${errors.name ? 'border-b border-red-500' : ''}`}
                      />
                      {errors.name && <p className="text-red-400 text-xs px-2">{errors.name}</p>}

                      <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setErrors(p => ({...p, email: undefined})); setApiError(''); }}
                        disabled={loading}
                        className={`w-full bg-transparent border-none focus:ring-0 text-lg p-2 placeholder:text-white/30 text-white outline-none disabled:opacity-50
                          ${errors.email ? 'border-b border-red-500' : ''}`}
                      />
                      {errors.email && <p className="text-red-400 text-xs px-2">{errors.email}</p>}

                      <input
                        type="password"
                        placeholder="Password (min 8 chars)"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setErrors(p => ({...p, password: undefined})); }}
                        disabled={loading}
                        className={`w-full bg-transparent border-none focus:ring-0 text-lg p-2 placeholder:text-white/30 text-white outline-none disabled:opacity-50
                          ${errors.password ? 'border-b border-red-500' : ''}`}
                      />
                      {errors.password && <p className="text-red-400 text-xs px-2">{errors.password}</p>}
                      {apiError && <p className="text-red-400 text-sm px-2 mt-2">{apiError}</p>}

                      <div className="w-full h-px bg-white/10 my-4" />

                      <div className="flex items-center justify-between">
                        <div className="flex gap-4 text-[#C84B31]">
                          <Image className="w-5 h-5 cursor-pointer opacity-50 hover:opacity-100" />
                          <Sparkles className="w-5 h-5 cursor-pointer opacity-50 hover:opacity-100" />
                          <Smile className="w-5 h-5 cursor-pointer opacity-50 hover:opacity-100" />
                        </div>
                        <button
                          type="submit"
                          disabled={loading || !name || !email || !password}
                          className="px-6 py-2 rounded-full font-bold text-[15px] text-black bg-white flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 hover:bg-white/90"
                        >
                          {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : 'Post Profile'}
                        </button>
                      </div>
                    </motion.form>
                  ) : (
                    <motion.div 
                      className="w-full flex flex-col gap-1 pb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[15px]">{name}</span>
                        <span className="text-[15px] text-white/50">@{email.split('@')[0]}</span>
                      </div>
                      <p className="text-[15px] text-white/90">
                        Joining the network! Waiting for verification...
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Post 2: Unool replies with OTP request */}
            <AnimatePresence>
              {(stage === 'otp' || stage === 'done') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="relative z-10 w-full"
                >
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xl font-bold z-10 shadow-inner" style={{ background: `linear-gradient(135deg, ${C.clay}, ${C.terracotta})` }}>
                        U
                      </div>
                      {/* Only draw line if stage is done, to connect to the final checkmark */}
                      {stage === 'done' && (
                        <div className="w-0.5 mt-2 flex-grow rounded-full bg-white/20" />
                      )}
                    </div>
                    
                    <div className="flex-1 pt-1 pb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[15px]">Unool</span>
                        <span className="text-[15px] text-white/50 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-white fill-[#C84B31]" /> @unool
                        </span>
                      </div>
                      
                      <p className="text-[15px] leading-relaxed mb-4 text-white/90">
                        Welcome to the community, {name.split(' ')[0]}! 🎉<br/>
                        I just sent a 6-digit verification code to your email. Enter it below to confirm your account.
                      </p>

                      {/* OTP Form Input */}
                      {stage === 'otp' && (
                        <div className="rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur-md">
                          <div className="flex justify-between gap-2 mb-4">
                            {otp.map((digit, i) => (
                              <input
                                key={i}
                                ref={(el) => { otpRefs.current[i] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                onPaste={i === 0 ? handleOtpPaste : undefined}
                                disabled={loading}
                                className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border transition-all duration-200 outline-none bg-black/50 text-white
                                  ${digit ? 'border-[#C84B31] shadow-[0_0_15px_rgba(200,75,49,0.3)]' : 'border-white/20'}
                                  focus:border-[#C84B31] focus:ring-1 focus:ring-[#C84B31]
                                `}
                              />
                            ))}
                          </div>

                          {apiError && (
                            <p className="text-red-400 text-sm mt-2 font-medium text-center">{apiError}</p>
                          )}
                          
                          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                            {cooldown > 0 ? (
                              <span className="text-sm font-medium text-white/50">
                                Resend in {cooldown}s
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={handleResend}
                                disabled={resendLoading}
                                className="text-sm font-bold hover:underline text-[#C84B31]"
                              >
                                {resendLoading ? 'Sending...' : 'Resend Code'}
                              </button>
                            )}
                            
                            <button
                              type="button"
                              onClick={verifyOtp}
                              disabled={loading || otp.join('').length < 6}
                              className="w-full sm:w-auto px-8 py-2.5 rounded-full font-bold text-[14px] text-black bg-white flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 hover:bg-white/90"
                            >
                              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                            </button>
                          </div>
                        </div>
                      )}

                      {stage === 'otp' && (
                        <button onClick={() => { setStage('form'); setOtp(['','','','','','']); setApiError(''); }} className="text-sm font-semibold mt-4 text-white/50 hover:text-white transition-colors">
                          ← Cancel signup
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Post 3: Final confirmation */}
            <AnimatePresence>
              {stage === 'done' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="flex gap-4 relative z-0"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white shadow-sm bg-green-500/20 border border-green-500/50">
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                  
                  <div className="flex-1 pt-1 pb-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      className="mt-2 p-6 rounded-2xl border border-green-500/50 bg-green-500/10 flex flex-col items-center justify-center text-center gap-3 w-full"
                    >
                      <CheckCircle2 className="w-12 h-12 text-green-400" />
                      <h3 className="text-xl font-bold text-green-400">Access Granted</h3>
                      <p className="text-sm text-green-400/80">Allowed to Unool. Redirecting to sign in...</p>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* Right Sidebar (Trending/Info) */}
        <div className="hidden lg:flex flex-col w-[350px] shrink-0 p-6 pl-8">
          <div className="bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 p-4 mb-6">
            <h2 className="text-xl font-bold mb-4">Already signed up?</h2>
            <p className="text-sm text-white/60 mb-4 leading-relaxed">
              If you already have an account with Unool, you can skip the creation process and jump right in.
            </p>
            <Link href="/signin" className="block w-full py-2 border border-white/20 rounded-full text-center font-bold hover:bg-white/10 transition-colors">
              Sign In
            </Link>
          </div>

          <div className="bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 p-4">
            <h2 className="text-xl font-bold mb-4">What's happening</h2>
            
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start cursor-pointer group">
                <div className="flex flex-col">
                  <span className="text-xs text-white/50">Technology · Trending</span>
                  <span className="font-bold group-hover:text-[#C84B31] transition-colors">#DesignSystems</span>
                  <span className="text-xs text-white/40">125K posts</span>
                </div>
              </div>
              
              <div className="flex justify-between items-start cursor-pointer group">
                <div className="flex flex-col">
                  <span className="text-xs text-white/50">Startups · Trending</span>
                  <span className="font-bold group-hover:text-[#C84B31] transition-colors">Ship Faster</span>
                  <span className="text-xs text-white/40">84.2K posts</span>
                </div>
              </div>

              <div className="flex justify-between items-start cursor-pointer group">
                <div className="flex flex-col">
                  <span className="text-xs text-white/50">AI · Trending</span>
                  <span className="font-bold group-hover:text-[#C84B31] transition-colors">Unool 2.0</span>
                  <span className="text-xs text-white/40">52.1K posts</span>
                </div>
              </div>
            </div>
            
            <button className="text-[#C84B31] text-sm mt-4 hover:underline">Show more</button>
          </div>
          
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-6 text-xs text-white/40 px-2">
            <span className="hover:underline cursor-pointer">Terms of Service</span>
            <span className="hover:underline cursor-pointer">Privacy Policy</span>
            <span className="hover:underline cursor-pointer">Cookie Policy</span>
            <span className="hover:underline cursor-pointer">Accessibility</span>
            <span className="hover:underline cursor-pointer">Ads info</span>
            <span>© 2026 Unool Inc.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
