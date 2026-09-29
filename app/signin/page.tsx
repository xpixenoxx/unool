'use client';

import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Home, Search, Bell, Mail, User, Bookmark, Loader2, Heart, MessageCircle, Repeat2, Send, CheckCircle2, ArrowLeft } from 'lucide-react';
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

export default function SignInSocialPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stage, setStage] = useState<'form' | 'otp'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Interactive Feed State
  const feedControls = useAnimation();
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const handleNavClick = () => {
    feedControls.start({
      x: [0, -15, 15, -10, 10, -5, 5, 0],
      transition: { duration: 0.5, ease: 'easeInOut' }
    });
  };
  
  // OTP State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [nextResendAt, setNextResendAt] = useState<string>();
  const [cooldown, setCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
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

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.includes('@')) { setError('Enter a valid email.'); return; }
    if (!password) { setError('Password required.'); return; }
    
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Invalid credentials.');
      } else {
        setNextResendAt(data.nextResendAt);
        setStage('otp');
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    setError('');
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
    setError('');
    
    try {
      const res = await fetch('/api/auth/signin/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: token }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Invalid code.');
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      } else {
        const uid = data.userId || data.session?.user?.id;
        if (uid) {
          try {
            sessionStorage.setItem('unool_session', JSON.stringify({
              access_token: data.session?.access_token || null,
              refresh_token: data.session?.refresh_token || null,
              userId: uid,
              email: data.session?.user?.email || email,
              ts: Date.now(),
            }));
          } catch { }
        }
        if (data.session?.access_token) {
          try {
            const supabase = getSupabaseBrowserClient();
            await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            });
          } catch { }
        }
        setOtpSuccess(true);
        setTimeout(() => router.push(data.redirectTo || '/dashboard'), 1500);
      }
    } catch {
      setError('Network error.');
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
        body: JSON.stringify({ email, purpose: 'signin' }),
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
              <div 
                key={i} 
                onClick={handleNavClick}
                className="flex items-center gap-5 p-3 w-fit lg:w-full lg:px-4 rounded-full transition-colors opacity-70 hover:bg-white/10 cursor-pointer"
              >
                <item.icon className="w-7 h-7" />
                <span className="hidden lg:block text-xl">{item.label}</span>
              </div>
            ))}
          </div>

          <Link href="/signup" className="mt-8 bg-white text-black font-bold text-lg py-4 px-8 rounded-full hidden lg:block text-center hover:bg-white/90 transition-colors shadow-lg">
            Create Account
          </Link>
          <Link href="/signup" className="mt-8 bg-white text-black w-14 h-14 rounded-full lg:hidden flex items-center justify-center hover:bg-white/90 shadow-lg">
            <User className="w-6 h-6" />
          </Link>
        </div>

        {/* Center Feed */}
        <motion.div 
          animate={feedControls}
          className="flex-1 w-full max-w-[600px] border-r border-white/10 flex flex-col h-full overflow-y-auto no-scrollbar relative bg-black/40 backdrop-blur-md"
        >
          {/* Header */}
          <div className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10 p-4 flex gap-8">
            <Link href="/signin" className="text-[15px] font-bold relative pb-2 text-white">
              Sign In
              <div className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full bg-[#C84B31]" />
            </Link>
            <Link href="/signup" className="text-[15px] font-bold text-white/50 hover:text-white transition-colors pb-2">
              Sign Up
            </Link>
          </div>

          {/* The Thread */}
          <div className="p-4 sm:p-6 pb-32">
            
            {/* Post 1: Unool */}
            <div className="relative z-10 w-full mb-6">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xl font-bold z-10 relative shadow-inner" style={{ background: `linear-gradient(135deg, ${C.clay}, ${C.terracotta})` }}>
                    U
                  </div>
                  {/* Thread line connecting to next post */}
                  <AnimatePresence>
                    {stage === 'otp' && (
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
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-[15px]">Unool</span>
                    <span className="text-[15px] text-white/50 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-white fill-[#C84B31]" /> @unool
                    </span>
                    <span className="text-[15px] text-white/40 ml-auto">now</span>
                  </div>
                  
                  <p className="text-[15px] leading-relaxed mb-4 text-white/90">
                    Welcome back to your workspace. 🚀 <br/>
                    Reply with your credentials below to authenticate.
                  </p>

                  {/* Form embedded as a 'Reply Box' */}
                  <AnimatePresence mode="wait">
                    {stage === 'form' && (
                      <motion.form
                        key="form"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onSubmit={handlePassword}
                        className="rounded-2xl border border-white/20 bg-white/5 p-1 backdrop-blur-md overflow-hidden"
                      >
                        <div className="flex flex-col">
                          <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                            disabled={loading}
                            className="w-full bg-transparent border-none focus:ring-0 text-[15px] p-4 placeholder:text-white/40 text-white outline-none disabled:opacity-50"
                          />
                          <div className="w-full h-px bg-white/10" />
                          <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            disabled={loading}
                            className="w-full bg-transparent border-none focus:ring-0 text-[15px] p-4 placeholder:text-white/40 text-white outline-none disabled:opacity-50"
                          />
                        </div>
                        
                        {error && (
                          <p className="text-red-400 text-sm px-4 pb-2 font-medium">{error}</p>
                        )}

                        <div className="flex items-center justify-between p-3 bg-white/5 border-t border-white/10">
                          <Link href="/forgot-password" className="text-sm font-semibold hover:underline text-[#C84B31]">
                            Forgot password?
                          </Link>
                          
                          <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="px-6 py-2 rounded-full font-bold text-[14px] text-white flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 bg-white text-black hover:bg-white/90"
                          >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : 'Reply'} <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                  
                  {/* Simulated action bar */}
                  <div className="flex items-center justify-between mt-4 max-w-md text-white/40 select-none">
                    <div onClick={handleNavClick} className="flex items-center gap-2 hover:text-[#C84B31] transition-colors cursor-pointer">
                      <MessageCircle className="w-5 h-5" /> <span className="text-sm">2.4k</span>
                    </div>
                    <div onClick={() => setReposted(!reposted)} className={`flex items-center gap-2 transition-colors cursor-pointer ${reposted ? 'text-green-500' : 'hover:text-green-500'}`}>
                      <Repeat2 className="w-5 h-5" /> <span className="text-sm">{reposted ? '843' : '842'}</span>
                    </div>
                    <div onClick={() => setLiked(!liked)} className={`flex items-center gap-2 transition-colors cursor-pointer ${liked ? 'text-red-500' : 'hover:text-red-500'}`}>
                      <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} /> <span className="text-sm">{liked ? '12.1k' : '12k'}</span>
                    </div>
                    <div onClick={() => setBookmarked(!bookmarked)} className={`flex items-center gap-2 transition-colors cursor-pointer ${bookmarked ? 'text-blue-500' : 'hover:text-blue-500'}`}>
                      <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Post 2: User's reply */}
            <AnimatePresence>
              {stage === 'otp' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="flex gap-4 relative z-0 mb-6"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white text-lg font-bold shadow-sm bg-white/20 border border-white/10">
                      {email.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="w-0.5 mt-2 flex-grow rounded-full bg-white/20" />
                  </div>
                  
                  <div className="flex-1 pt-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[15px]">You</span>
                      <span className="text-[15px] text-white/50">@{email.split('@')[0]}</span>
                    </div>
                    <p className="text-[15px] text-white/90">
                      Authenticating as {email}...
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Post 3: OTP request */}
            <AnimatePresence>
              {stage === 'otp' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 }}
                  className="relative z-10 w-full"
                >
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xl font-bold z-10 shadow-inner" style={{ background: `linear-gradient(135deg, ${C.clay}, ${C.terracotta})` }}>
                        U
                      </div>
                    </div>
                    
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[15px]">Unool</span>
                        <span className="text-[15px] text-white/50 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-white fill-[#C84B31]" /> @unool
                        </span>
                      </div>
                      
                      <p className="text-[15px] leading-relaxed mb-4 text-white/90">
                        Got it. I just sent a 6-digit verification code to your email. Enter it below to confirm it's you. 🔒
                      </p>

                      {/* OTP Form Input */}
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
                              disabled={loading || otpSuccess}
                              className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border transition-all duration-200 outline-none bg-black/50 text-white
                                ${digit ? 'border-[#C84B31] shadow-[0_0_15px_rgba(200,75,49,0.3)]' : 'border-white/20'}
                                focus:border-[#C84B31] focus:ring-1 focus:ring-[#C84B31]
                              `}
                            />
                          ))}
                        </div>

                        {error && !otpSuccess && (
                          <p className="text-red-400 text-sm mt-2 font-medium text-center">{error}</p>
                        )}
                        
                        {otpSuccess ? (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }} 
                            animate={{ opacity: 1, scale: 1 }} 
                            className="mt-6 p-6 rounded-2xl border border-green-500/50 bg-green-500/10 flex flex-col items-center justify-center text-center gap-3"
                          >
                            <CheckCircle2 className="w-12 h-12 text-green-400" />
                            <h3 className="text-xl font-bold text-green-400">Access Granted</h3>
                            <p className="text-sm text-green-400/80">Allowed to Unool. Redirecting to workspace...</p>
                          </motion.div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                            {cooldown > 0 ? (
                              <span className="text-sm font-medium text-white/50">
                                Resend code in {cooldown}s
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
                        )}
                      </div>

                      <button onClick={() => { setStage('form'); setOtp(['','','','','','']); setError(''); }} className="text-sm font-semibold mt-4 text-white/50 hover:text-white transition-colors">
                        ← Cancel login
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right Sidebar (Trending/Info) */}
        <div className="hidden lg:flex flex-col w-[350px] shrink-0 p-6 pl-8">
          <div className="bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 p-4 mb-6">
            <h2 className="text-xl font-bold mb-4">New to Unool?</h2>
            <p className="text-sm text-white/60 mb-4 leading-relaxed">
              Sign up now to get your own AI-powered design system and start shipping faster than ever.
            </p>
            <Link href="/signup" className="block w-full py-2 border border-white/20 rounded-full text-center font-bold hover:bg-white/10 transition-colors">
              Create an account
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
