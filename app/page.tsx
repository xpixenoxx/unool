'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle, Zap, Shield, Sparkles,
  PenTool, Globe, Clock, Users, BarChart2,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   OXBLOOD WATERFALL STORY — Landing Page
   Color Journey: Oxblood #3A0B1A → Terracotta #8C2A25 → Sand → Cream #FFF9F2
   Accent: Deep Terracotta Clay #C84B31
   ═══════════════════════════════════════════════════════════════ */

const C = {
  oxblood: '#3A0B1A',
  mahogany: '#5C1A1A',
  terracotta: '#8C2A25',
  clay: '#C84B31',
  sand: '#D4B896',
  parchment: '#F6F4F0',
  cream: '#FFF9F2',
  ink: '#1A0A05',
  warmGray: '#6B5B4F',
  warmGrayLight: '#9A8B7F',
} as const;

const spring = { type: 'spring', stiffness: 60, damping: 20 };
const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: spring },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

/* ─── Realistic iPhone 15 Pro Frame Component ─── */
function IPhoneFrame({ children, label, theme = 'dark' }: { children: React.ReactNode; label?: string; theme?: 'dark' | 'light' }) {
  const isLight = theme === 'light';
  const statusColor = isLight ? '#000' : '#fff';
  
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative rounded-[50px] overflow-visible"
        style={{
          width: '300px',
          height: '620px',
          border: '12px solid #1c1c1e',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6), inset 0 0 0 4px rgba(255,255,255,0.1), inset 0 0 20px rgba(255,255,255,0.05), 0 0 0 1px rgba(255,255,255,0.15)',
          background: isLight ? '#fff' : '#000',
        }}
      >
        {/* Hardware Buttons */}
        <div className="absolute -left-[14px] top-[120px] w-[3px] h-[26px] bg-[#2c2c2e] rounded-l-md border-r border-[#1c1c1e]" /> {/* Action */}
        <div className="absolute -left-[14px] top-[170px] w-[3px] h-[50px] bg-[#2c2c2e] rounded-l-md border-r border-[#1c1c1e]" /> {/* Vol Up */}
        <div className="absolute -left-[14px] top-[230px] w-[3px] h-[50px] bg-[#2c2c2e] rounded-l-md border-r border-[#1c1c1e]" /> {/* Vol Down */}
        <div className="absolute -right-[14px] top-[190px] w-[3px] h-[75px] bg-[#2c2c2e] rounded-r-md border-l border-[#1c1c1e]" /> {/* Power */}

        {/* Status Bar */}
        <div className="absolute top-0 w-full h-[44px] z-40 flex items-center justify-between px-6 pt-1 pointer-events-none">
          <span className="text-[12px] font-semibold tracking-tight mt-0.5" style={{ color: statusColor }}>9:41</span>
          <div className="flex items-center gap-1.5 opacity-90 mt-1">
            {/* Cell */}
            <div className="flex gap-0.5 items-end h-[10px]">
              <div className="w-[3px] h-[4px] rounded-sm" style={{ backgroundColor: statusColor }} />
              <div className="w-[3px] h-[6px] rounded-sm" style={{ backgroundColor: statusColor }} />
              <div className="w-[3px] h-[8px] rounded-sm" style={{ backgroundColor: statusColor }} />
              <div className="w-[3px] h-[10px] rounded-sm" style={{ backgroundColor: statusColor }} />
            </div>
            {/* Wifi */}
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 10C8.1 10 9 9.1 9 8C9 6.9 8.1 6 7 6C5.9 6 5 6.9 5 8C5 9.1 5.9 10 7 10Z" fill={statusColor}/>
              <path d="M10.8801 4.12C8.7401 1.98 5.2701 1.98 3.1301 4.12C2.7401 4.51 2.7401 5.14 3.1301 5.53C3.5201 5.92 4.1501 5.92 4.5401 5.53C5.9001 4.17 8.1101 4.17 9.4701 5.53C9.8601 5.92 10.4901 5.92 10.8801 5.53C11.2701 5.14 11.2701 4.51 10.8801 4.12Z" fill={statusColor}/>
              <path d="M13.7101 1.29C9.8101 -2.61 3.4701 -2.6 0.430098 0.43C0.0400977 0.82 0.0400977 1.45 0.430098 1.84C0.820098 2.23 1.4501 2.23 1.8401 1.84C4.1001 -0.42 8.7601 -1.25 12.3001 2.29C12.6901 2.68 13.3201 2.68 13.7101 2.29C14.1001 1.9 14.1001 1.27 13.7101 1.29Z" fill={statusColor}/>
            </svg>
            {/* Battery */}
            <div className="relative w-[22px] h-[11px] rounded-[3px] border opacity-80" style={{ borderColor: statusColor }}>
              <div className="absolute right-[2px] top-[1px] bottom-[1px] w-[14px] rounded-[1px]" style={{ backgroundColor: statusColor }} />
              <div className="absolute -right-[3px] top-[3px] w-[2px] h-[3px] rounded-r-[1px]" style={{ backgroundColor: statusColor }} />
            </div>
          </div>
        </div>

        {/* Dynamic Island */}
        <div className="absolute top-[11px] left-1/2 -translate-x-1/2 z-50 w-[110px] h-[32px] bg-[#000] rounded-full flex items-center justify-end px-3" style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)' }}>
          <div className="w-[10px] h-[10px] rounded-full bg-[#111] border border-[#222] mr-6" /> {/* Camera */}
          <div className="w-[4px] h-[4px] rounded-full bg-[#058a36] opacity-0" /> {/* Privacy indicator */}
        </div>

        {/* Screen Content */}
        <div className="relative w-full h-full rounded-[38px] overflow-hidden" style={{ backgroundColor: isLight ? '#fff' : '#000' }}>
          {/* Add top padding so content is below the status bar and island */}
          <div className="w-full h-full overflow-y-auto no-scrollbar pb-10" style={{ paddingTop: '44px' }}>
            {children}
          </div>
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[120px] h-[5px] rounded-full z-40" style={{ backgroundColor: isLight ? '#111' : '#fff' }} />
      </div>
      {label && (
        <p
          className="mt-6 text-xs font-semibold tracking-wide"
          style={{ color: 'rgba(255,249,242,0.6)' }}
        >
          {label}
        </p>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ fontFamily: 'var(--font-geist), system-ui, sans-serif' }}>

      {/* ═══════════════════════════════════════════════════════
          SECTION 1: HERO — Deep Oxblood → "Write Once."
          ═══════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-screen flex flex-col"
        style={{
          background: `linear-gradient(180deg, ${C.oxblood} 0%, ${C.mahogany} 50%, ${C.terracotta} 100%)`,
        }}
      >
        {/* Warm atmospheric glow */}
        <div
          className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-25 blur-[150px] pointer-events-none"
          style={{ background: `radial-gradient(circle, ${C.clay}, transparent 70%)` }}
        />

        {/* Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...spring }}
          className="relative z-20 max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between"
        >
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Unool" className="w-[50px] h-[50px] object-contain brightness-0 invert opacity-90" />
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: 'rgba(255,249,242,0.5)' }}>
            {['Overview', 'Pricing', 'Projects', 'Contact'].map((item, i) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className="hover:opacity-100 transition-opacity"
                style={{
                  color: i === 0 ? C.cream : undefined,
                  textDecoration: i === 0 ? 'underline' : 'none',
                  textUnderlineOffset: '6px',
                }}
              >
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/signin" className="text-sm hidden sm:inline-block" style={{ color: 'rgba(255,249,242,0.6)' }}>
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium px-5 py-2.5 rounded-full transition-all hover:scale-105"
              style={{ backgroundColor: C.clay, color: C.cream }}
            >
              Get started
            </Link>
          </div>
        </motion.nav>

        {/* Hero Content */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-16"
        >
          {/* Glowing pill badge */}
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{
              background: 'rgba(200,75,49,0.15)',
              border: '1px solid rgba(200,75,49,0.3)',
              boxShadow: '0 0 20px rgba(200,75,49,0.1)',
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: C.clay, animation: 'blink 2s ease-in-out infinite' }}
            />
            <span className="text-sm font-medium" style={{ color: C.sand }}>One Link · One Click</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-center mb-6"
            style={{
              fontFamily: 'var(--font-syne), Georgia, serif',
              fontSize: 'clamp(3.5rem, 9vw, 8rem)',
              fontWeight: 700,
              fontStyle: 'italic',
              color: C.cream,
              letterSpacing: '-0.04em',
              lineHeight: 1,
            }}
          >
            Write Once.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-center text-base mb-6"
            style={{ color: 'rgba(255,249,242,0.45)', maxWidth: '440px' }}
          >
            Your professional presence, automated publishing across every platform.
          </motion.p>

          {/* ── One Link URL Bar Preview ── */}
          <motion.div
            variants={fadeUp}
            className="flex items-center gap-3 px-5 py-3 rounded-full mb-14"
            style={{
              background: 'rgba(255,249,242,0.08)',
              border: '1px solid rgba(255,249,242,0.1)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4CAF50' }} />
            <span className="text-sm" style={{ color: 'rgba(255,249,242,0.4)' }}>https://</span>
            <span className="text-sm font-semibold" style={{ color: C.cream }}>yourname</span>
            <span className="text-sm" style={{ color: C.sand }}>.unool.co</span>
          </motion.div>

          {/* ── The Parchment Text Editor ── */}
          <motion.div variants={fadeUp} className="relative w-full max-w-2xl mx-auto">
            <div
              className="absolute -inset-10 rounded-3xl opacity-25 blur-[60px] pointer-events-none"
              style={{ background: `radial-gradient(ellipse, ${C.sand}, transparent 70%)` }}
            />

            {/* Glowing top bar light effect */}
            <div
              className="absolute -top-1 left-[15%] right-[15%] h-[3px] rounded-full blur-[2px]"
              style={{ background: `linear-gradient(90deg, transparent, ${C.sand}, transparent)` }}
            />

            <div
              className="relative rounded-xl overflow-hidden"
              style={{
                backgroundColor: C.parchment,
                boxShadow: `0 40px 100px rgba(58, 11, 26, 0.6), 0 0 40px rgba(212,184,150,0.15), inset 0 1px 0 rgba(255,255,255,0.6)`,
                border: '1px solid rgba(212,184,150,0.3)',
              }}
            >
              <div className="p-8 pb-5">
                <p className="text-lg leading-relaxed" style={{ color: C.ink, fontFamily: 'Georgia, serif' }}>
                  Paste your URL. Get a beautiful profile page + platform-native posts for LinkedIn, X, and Threads. Write once. Review. Publish everywhere.
                  <span
                    className="inline-block w-[2px] h-[1.2em] ml-1 align-middle"
                    style={{ backgroundColor: C.clay, animation: 'blink 1s step-end infinite' }}
                  />
                </p>
              </div>
              <div className="px-8 py-4" style={{ borderTop: '1px solid rgba(212,184,150,0.3)' }}>
                <button
                  className="w-full py-3.5 rounded-lg text-sm font-semibold transition-all hover:brightness-110"
                  style={{ backgroundColor: C.clay, color: C.cream }}
                >
                  Create smart input
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          SECTION 2: WRITE ONCE → PUBLISH EVERYWHERE
          One real thought, three realistic phone outputs
          ═══════════════════════════════════════════════════════ */}
      <section
        className="relative"
        style={{
          background: `linear-gradient(180deg, ${C.terracotta} 0%, ${C.mahogany} 30%, ${C.terracotta}cc 70%, ${C.sand}55 100%)`,
        }}
      >
        {/* ── Section Header ── */}
        <div className="pt-12 pb-6 px-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-xs font-semibold tracking-[0.25em] uppercase mb-4" style={{ color: C.sand }}
          >
            One Click · Three Platforms
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            style={{
              fontFamily: 'var(--font-syne), Georgia, serif',
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 700, fontStyle: 'italic', color: C.cream, letterSpacing: '-0.03em',
            }}
          >
            One thought. Three voices.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="mt-3 text-sm max-w-lg mx-auto" style={{ color: 'rgba(255,249,242,0.45)' }}
          >
            Watch how Unool intelligently adapts your content to each platform&apos;s native format, tone, and character limits — automatically.
          </motion.p>
        </div>

        {/* ── Original Thought Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="max-w-2xl mx-auto px-6 mb-0"
        >
          <div
            className="relative px-8 py-6 rounded-2xl text-center"
            style={{
              background: 'rgba(255,249,242,0.07)',
              border: '1px solid rgba(255,249,242,0.12)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3" style={{ color: C.clay }}>Your original thought</p>
            <p className="text-base leading-relaxed" style={{ color: C.cream, fontFamily: 'Georgia, serif' }}>
              &ldquo;At Pixenox, we just shipped our AI-powered design system that reduces brand iteration time by 80%. Here&apos;s what we learned building it.&rdquo;
            </p>
          </div>
        </motion.div>

        {/* ── SVG Branching Lines — connected from card to phones ── */}
        <div className="relative w-full overflow-hidden" style={{ height: '140px' }}>
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1200 140"
            preserveAspectRatio="xMidYMid meet"
            fill="none"
          >
            {/* Trunk from source card center */}
            <line x1="600" y1="0" x2="600" y2="50" stroke={C.sand} strokeWidth="2" opacity="0.6" />

            {/* Branch junction dot */}
            <circle cx="600" cy="50" r="5" fill={C.sand} opacity="0.8" />

            {/* Left branch → LinkedIn phone (at ~200px from left) */}
            <path d="M 600 50 C 600 90, 210 90, 210 140" stroke={C.sand} strokeWidth="1.5" opacity="0.5" strokeDasharray="0" />

            {/* Center branch → X phone (at ~600px center) */}
            <line x1="600" y1="50" x2="600" y2="140" stroke={C.sand} strokeWidth="1.5" opacity="0.5" />

            {/* Right branch → Threads phone (at ~990px from left) */}
            <path d="M 600 50 C 600 90, 990 90, 990 140" stroke={C.sand} strokeWidth="1.5" opacity="0.5" strokeDasharray="0" />

            {/* Arrow heads at phone tops */}
            <polygon points="206,133 210,143 214,133" fill={C.sand} opacity="0.7" />
            <polygon points="596,133 600,143 604,133" fill={C.sand} opacity="0.7" />
            <polygon points="986,133 990,143 994,133" fill={C.sand} opacity="0.7" />
          </svg>
        </div>

        {/* ── Three Realistic iPhone Previews ── */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-20px' }} variants={stagger}
          className="flex flex-col md:flex-row items-start justify-center gap-10 md:gap-16 px-6 pb-28"
        >
          {/* ─ LinkedIn iPhone ─ */}
          <motion.div variants={fadeUp}>
            <IPhoneFrame label="LinkedIn · Long-form · 3,000 chars" theme="light">
              <div style={{ backgroundColor: '#e9e5df', minHeight: '100%', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"' }}>
                {/* LinkedIn Top Nav */}
                <div style={{ backgroundColor: '#fff', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#0A66C2', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700 }}>P</div>
                  <div style={{ flex: 1, backgroundColor: '#eef3f8', borderRadius: 4, height: 32, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="#666666"><path d="M21.41 18.59l-5.27-5.28A6.83 6.83 0 0017 10a7 7 0 10-7 7 6.83 6.83 0 003.31-1.14l5.28 5.27a2 2 0 002.82-2.82zM5 10a5 5 0 115 5 5 5 0 01-5-5z"></path></svg>
                    <span style={{ fontSize: 13, color: '#666666' }}>Search</span>
                  </div>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="#666666"><path d="M16 4H8a7 7 0 000 14h4v4l8.16-5.39A6.78 6.78 0 0023 11a7 7 0 00-7-7zm-8 8.25A1.25 1.25 0 119.25 11 1.25 1.25 0 018 12.25zm4 0A1.25 1.25 0 1113.25 11 1.25 1.25 0 0112 12.25zm4 0A1.25 1.25 0 1117.25 11 1.25 1.25 0 0116 12.25z"></path></svg>
                </div>

                {/* Post */}
                <div style={{ backgroundColor: '#fff', marginTop: 8, padding: '12px 16px' }}>
                  {/* Author */}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #0A66C2, #5BA4F5)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 700 }}>P</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#000000e6', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                        Pixenox 
                        <span style={{ fontSize: 12, color: '#00000099', fontWeight: 400 }}>• 1st</span>
                      </p>
                      <p style={{ fontSize: 12, color: '#00000099', margin: '2px 0 0', lineHeight: 1.3 }}>AI Design Systems • Helping teams build faster</p>
                      <p style={{ fontSize: 12, color: '#00000099', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                        2h • <svg viewBox="0 0 16 16" width="12" height="12" fill="#00000099"><path d="M8 1a7 7 0 107 7 7 7 0 00-7-7zM3 8a5 5 0 011-3l.55.55A1.5 1.5 0 015 6.62v1.07a.75.75 0 00.22.53l.56.56a.75.75 0 00.53.22H7v.69a1.5 1.5 0 01-.44 1.06l-.56.56zm9 0a5 5 0 01-1 3l-.55-.55A1.5 1.5 0 0110 9.38V8.31a.75.75 0 00-.22-.53l-.56-.56a.75.75 0 00-.53-.22H8v-.69A1.5 1.5 0 018.44 5.25l.56-.56z"></path></svg>
                      </p>
                    </div>
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="#00000099"><path d="M14 12a2 2 0 11-2-2 2 2 0 012 2zM4 10a2 2 0 102 2 2 2 0 00-2-2zm16 0a2 2 0 102 2 2 2 0 00-2-2z"></path></svg>
                  </div>

                  {/* Post text */}
                  <p style={{ fontSize: 14, color: '#000000e6', lineHeight: 1.5, margin: '0 0 12px' }}>
                    🚀 <strong>Big announcement from Pixenox:</strong>
                  </p>
                  <p style={{ fontSize: 14, color: '#000000e6', lineHeight: 1.5, margin: '0 0 12px' }}>
                    We just shipped our AI-powered design system that reduces brand iteration time by <strong>80%.</strong>
                  </p>
                  <p style={{ fontSize: 14, color: '#000000e6', lineHeight: 1.5, margin: '0 0 12px' }}>Here&apos;s what we learned:</p>
                  <p style={{ fontSize: 14, color: '#000000e6', lineHeight: 1.6, margin: '0 0 12px' }}>
                    → Consistency beats creativity at scale<br />
                    → Design tokens are your secret weapon<br />
                    → AI amplifies designers, not replaces them<br />
                    → Ship fast. Iterate faster.
                  </p>
                  <p style={{ fontSize: 14, color: '#0A66C2', margin: '0 0 12px', fontWeight: 600 }}>#DesignSystems #AI #Startups #Pixenox</p>
                  
                  {/* Reactions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #00000015' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ display: 'flex' }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#0A66C2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, zIndex: 3 }}>👍</div>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#DF704D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, marginLeft: -4, border: '1px solid #fff', zIndex: 2 }}>❤️</div>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#629E65', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, marginLeft: -4, border: '1px solid #fff', zIndex: 1 }}>💡</div>
                      </div>
                      <span style={{ fontSize: 12, color: '#00000099', marginLeft: 4 }}>842</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#00000099' }}>67 comments</span>
                      <span style={{ fontSize: 12, color: '#00000099' }}>•</span>
                      <span style={{ fontSize: 12, color: '#00000099' }}>12 reposts</span>
                    </div>
                  </div>
                  
                  {/* Action bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px 0' }}>
                    {[
                      { icon: 'M19.46 11l-3.91-3.91a7 7 0 01-1.69-2.74l-.49-1.47A2.76 2.76 0 0010.76 1 2.75 2.75 0 008 3.74v1.12a9.19 9.19 0 00.46 2.89 2.08 2.08 0 01-1.8 2.75H3a2 2 0 00-2 2v10a2 2 0 002 2h13.41a3 3 0 002.83-2l1.43-4.31A3 3 0 0021 15v-1a3 3 0 00-1.54-2.6z', label: 'Like' },
                      { icon: 'M7 9h10v1H7zm0 4h7v-1H7zm16-2a6.78 6.78 0 01-2.84 5.61L12 22v-4H8A7 7 0 018 4h8a7 7 0 017 7z', label: 'Comment' },
                      { icon: 'M23 12l-4.61 5.71v-4A20.31 20.31 0 003.54 22a16.64 16.64 0 015.65-9.35A13.72 13.72 0 0120 10.35v-4z', label: 'Repost' },
                      { icon: 'M21 3L0 10l7.66 4.26L16 8l-6.26 8.34L14 24l7-21z', label: 'Send' }
                    ].map((btn) => (
                      <div key={btn.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px', cursor: 'pointer' }}>
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="#00000099"><path d={btn.icon}></path></svg>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#00000099' }}>{btn.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </IPhoneFrame>
          </motion.div>

          {/* ─ X (Twitter) iPhone ─ */}
          <motion.div variants={fadeUp}>
            <IPhoneFrame label="X · Thread format · 280 chars each">
              <div style={{ backgroundColor: '#000', minHeight: '100%', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"' }}>
                {/* X nav */}
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2f3336' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#333' }} />
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19.75 22H4.25C3.01 22 2 20.99 2 19.75V4.25C2 3.01 3.01 2 4.25 2h15.5C20.99 2 22 3.01 22 4.25v15.5c0 1.24-1.01 2.25-2.25 2.25zM4.25 3.5c-.41 0-.75.34-.75.75v15.5c0 .41.34.75.75.75h15.5c.41 0 .75-.34.75-.75V4.25c0-.41-.34-.75-.75-.75H4.25z"></path></svg>
                  </div>
                </div>

                {/* Tweet 1 */}
                <div style={{ padding: '12px 16px 0', display: 'flex', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #444, #222)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700 }}>P</div>
                    <div style={{ width: 2, height: 'calc(100% - 32px)', minHeight: 30, backgroundColor: '#333639', margin: '4px 0', flexGrow: 1 }} />
                  </div>
                  <div style={{ flex: 1, paddingBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#e7e9ea' }}>Pixenox</span>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="#1d9bf0"><g><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.79-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.727 2.73 1.843 3.42-.064.293-.105.592-.105.9 0 2.21 1.71 4 3.918 4 .576 0 1.127-.12 1.636-.33.515 1.25 1.734 2.12 3.125 2.12 1.39 0 2.61-.87 3.125-2.12.508.21 1.06.33 1.636.33 2.21 0 3.918-1.79 3.918-4 0-.308-.04-.607-.105-.9 1.116-.69 1.843-1.96 1.843-3.42zm-10.746 4.39l-4.146-4.15L9.02 11.33l2.25 2.25L17.75 7.07l1.414 1.415-7.91 7.905z"></path></g></svg>
                        <span style={{ fontSize: 14, color: '#71767b' }}>@pixenox · now</span>
                      </div>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="#71767b"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"></path></svg>
                    </div>
                    <p style={{ fontSize: 15, color: '#e7e9ea', lineHeight: 1.4, margin: '4px 0 0' }}>
                      We just shipped something big at @pixenox 🔥<br /><br />
                      An AI design system that cuts brand iteration time by 80%.<br /><br />
                      Thread on what we learned 🧵👇
                    </p>
                    {/* Action bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, maxWidth: '85%' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#71767b' }}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z"></path></svg>
                        <span style={{ fontSize: 13 }}>48</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#71767b' }}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z"></path></svg>
                        <span style={{ fontSize: 13 }}>312</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#71767b' }}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z"></path></svg>
                        <span style={{ fontSize: 13 }}>1.2K</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#71767b' }}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"></path></svg>
                        <span style={{ fontSize: 13 }}>45K</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tweet 2 */}
                <div style={{ padding: '0 16px', display: 'flex', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #444, #222)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700 }}>P</div>
                  </div>
                  <div style={{ flex: 1, paddingBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#e7e9ea' }}>Pixenox</span>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="#1d9bf0"><g><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.79-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.727 2.73 1.843 3.42-.064.293-.105.592-.105.9 0 2.21 1.71 4 3.918 4 .576 0 1.127-.12 1.636-.33.515 1.25 1.734 2.12 3.125 2.12 1.39 0 2.61-.87 3.125-2.12.508.21 1.06.33 1.636.33 2.21 0 3.918-1.79 3.918-4 0-.308-.04-.607-.105-.9 1.116-.69 1.843-1.96 1.843-3.42zm-10.746 4.39l-4.146-4.15L9.02 11.33l2.25 2.25L17.75 7.07l1.414 1.415-7.91 7.905z"></path></g></svg>
                        <span style={{ fontSize: 14, color: '#71767b' }}>@pixenox · now</span>
                      </div>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="#71767b"><path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"></path></svg>
                    </div>
                    <p style={{ fontSize: 15, color: '#e7e9ea', lineHeight: 1.4, margin: '4px 0 0' }}>
                      Old way: create → review → 3 weeks back-and-forth.<br /><br />
                      Pixenox way: design tokens + AI = instant brand-consistent output ⚡
                    </p>
                  </div>
                </div>
              </div>
            </IPhoneFrame>
          </motion.div>

          {/* ─ Threads iPhone ─ */}
          <motion.div variants={fadeUp}>
            <IPhoneFrame label="Threads · Conversational · 500 chars">
              <div style={{ backgroundColor: '#101010', minHeight: '100%', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"' }}>
                {/* Threads nav */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 20px', borderBottom: '1px solid #262626', position: 'relative' }}>
                  <svg viewBox="0 0 32 32" width="28" height="28" fill="white"><path d="M22.5 15c0-4.14-3.36-7.5-7.5-7.5s-7.5 3.36-7.5 7.5 3.36 7.5 7.5 7.5c2.02 0 3.86-.81 5.2-2.12l1.41 1.41c-1.7 1.7-4.04 2.75-6.61 2.75-5.25 0-9.5-4.25-9.5-9.5s4.25-9.5 9.5-9.5c5.25 0 9.5 4.25 9.5 9.5 0 1.28-.25 2.5-.71 3.63l-1.84-1c.35-.83.55-1.71.55-2.63zm-4.32 3.18c-1.11.83-2.51 1.32-4.02 1.32-3.59 0-6.5-2.91-6.5-6.5s2.91-6.5 6.5-6.5 6.5 2.91 6.5 6.5v2.89c0 1.47-1.19 2.66-2.66 2.66-.75 0-1.43-.32-1.92-.83zM15 17.5c1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5 1.12 2.5 2.5 2.5z"></path></svg>
                </div>

                {/* Post 1 */}
                <div style={{ padding: '16px 16px 0', display: 'flex', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 700 }}>
                      P
                      <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, backgroundColor: '#101010', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 24 24" width="10" height="10" fill="white"><path d="M19 11H13V5h-2v6H5v2h6v6h2v-6h6z"></path></svg>
                      </div>
                    </div>
                    {/* The loop connector */}
                    <div style={{ width: 2, flex: 1, margin: '8px 0', display: 'flex', justifyContent: 'center', overflow: 'visible' }}>
                      <svg width="24" height="100%" preserveAspectRatio="none">
                        <path d="M12,0 C12,30 2,30 2,50 C2,70 12,70 12,100" stroke="#333" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
                      </svg>
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, paddingBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#f5f5f5' }}>pixenox</span>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: 14, color: '#777' }}>2m</span>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="#777"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                      </div>
                    </div>
                    <p style={{ fontSize: 15, color: '#f5f5f5', lineHeight: 1.5, margin: '4px 0 0' }}>
                      okay so we&apos;ve been quietly working on something at pixenox and i&apos;m finally allowed to talk about it
                    </p>
                    <p style={{ fontSize: 15, color: '#f5f5f5', lineHeight: 1.5, margin: '8px 0 0' }}>
                      we built an AI design system that does in hours what used to take our team weeks
                    </p>
                    <p style={{ fontSize: 15, color: '#f5f5f5', lineHeight: 1.5, margin: '8px 0 0' }}>
                      the biggest lesson? AI doesn&apos;t make designers obsolete — it makes them dangerous (in the best way) 🔥
                    </p>
                    
                    {/* Action bar */}
                    <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#f5f5f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#f5f5f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#f5f5f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 1l4 4-4 4"></path><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><path d="M7 23l-4-4 4-4"></path><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#f5f5f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#555', border: '2px solid #101010', zIndex: 3 }}></div>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#666', border: '2px solid #101010', marginLeft: -8, zIndex: 2 }}></div>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: '#777', border: '2px solid #101010', marginLeft: -8, zIndex: 1 }}></div>
                      </div>
                      <span style={{ fontSize: 14, color: '#777' }}>89 replies · 234 likes</span>
                    </div>
                  </div>
                </div>
              </div>
            </IPhoneFrame>
          </motion.div>
        </motion.div>
      </section>





      {/* ═══════════════════════════════════════════════════════
          SECTION 3: THE CONVERGENCE — Lines merge → Profile
          A completely unique visual storytelling section
          ═══════════════════════════════════════════════════════ */}
      <section
        className="relative"
        style={{
          background: `linear-gradient(180deg, ${C.sand}55 0%, ${C.parchment} 40%, ${C.cream} 100%)`,
        }}
      >
        {/* Merge lines from 3 phones converging into one */}
        <div className="flex justify-center">
          <svg width="600" height="120" viewBox="0 0 600 120" fill="none" className="w-full max-w-[600px]">
            <path d="M 120 0 C 120 60, 300 60, 300 120" stroke={C.sand} strokeWidth="1.5" opacity="0.3" />
            <path d="M 300 0 L 300 120" stroke={C.sand} strokeWidth="1.5" opacity="0.3" />
            <path d="M 480 0 C 480 60, 300 60, 300 120" stroke={C.sand} strokeWidth="1.5" opacity="0.3" />
            <polygon points="296,114 300,124 304,114" fill={C.sand} opacity="0.4" />
          </svg>
        </div>

        {/* ── One Link Showcase ── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          className="max-w-3xl mx-auto px-6 text-center mb-24"
        >
          <motion.p variants={fadeUp} className="text-xs font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: C.clay }}>
            One Link
          </motion.p>
          <motion.h2
            variants={fadeUp}
            style={{
              fontFamily: 'var(--font-syne), Georgia, serif',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 700,
              color: C.ink,
              letterSpacing: '-0.02em',
            }}
          >
            Your entire professional story. One beautiful URL.
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-base max-w-lg mx-auto" style={{ color: C.warmGray }}>
            Paste your LinkedIn, portfolio, or GitHub. Unool builds a stunning profile page at
            <span className="font-semibold" style={{ color: C.clay }}> yourname.unool.co </span>
            in under 30 seconds.
          </motion.p>

          {/* Floating URL bar */}
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-3 mt-8 px-8 py-4 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(212,184,150,0.3)',
              boxShadow: '0 8px 30px rgba(26,10,5,0.06)',
            }}
          >
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF5F56' }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FFBD2E' }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#27C93F' }} />
            </div>
            <div className="flex items-center gap-1 ml-3">
              <span className="text-sm" style={{ color: C.warmGrayLight }}>🔒 https://</span>
              <span className="text-sm font-bold" style={{ color: C.ink }}>yourname</span>
              <span className="text-sm font-semibold" style={{ color: C.clay }}>.unool.co</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Profile Template Preview + Description */}
        <div className="max-w-5xl mx-auto px-6 pb-32">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="flex flex-col md:flex-row items-center gap-12 md:gap-20"
          >
            {/* Phone with Profile */}
            <motion.div variants={fadeUp} className="flex-shrink-0">
              <IPhoneFrame label="Your beautiful, fast profile" theme="light">
                <div style={{ backgroundColor: '#fff', minHeight: '100%', fontFamily: '-apple-system, system-ui, sans-serif' }}>
                  {/* Top nav */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', alignItems: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#111', fontFamily: 'var(--font-syne), Georgia, serif' }}>unool.</span>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>😎</div>
                  </div>
                  
                  {/* Profile Header */}
                  <div style={{ padding: '24px 20px 16px', textAlign: 'center' }}>
                    <div style={{ width: 88, height: 88, borderRadius: '50%', backgroundColor: '#000', color: '#fff', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 700, background: 'linear-gradient(135deg, #1A0A05, #C84B31)' }}>
                      P
                    </div>
                    <h4 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: 0, fontFamily: 'var(--font-syne), Georgia, serif' }}>Pixenox</h4>
                    <p style={{ fontSize: 14, color: '#666', marginTop: 4, lineHeight: 1.4 }}>
                      AI Design Systems • San Francisco
                    </p>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                      <button style={{ backgroundColor: '#111', color: '#fff', fontSize: 14, fontWeight: 600, padding: '10px 24px', borderRadius: 100 }}>Follow</button>
                      <button style={{ backgroundColor: '#f0f0f0', color: '#111', fontSize: 14, fontWeight: 600, padding: '10px 24px', borderRadius: 100 }}>Contact</button>
                    </div>
                  </div>

                  {/* Links / Content */}
                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ backgroundColor: '#f9f9f9', border: '1px solid #eaeaea', borderRadius: 16, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#0A66C2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>in</div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0 }}>LinkedIn</p>
                          <p style={{ fontSize: 12, color: '#888', margin: 0 }}>2.8k followers</p>
                        </div>
                      </div>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </div>

                    <div style={{ backgroundColor: '#f9f9f9', border: '1px solid #eaeaea', borderRadius: 16, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                           <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: 0 }}>X (Twitter)</p>
                          <p style={{ fontSize: 12, color: '#888', margin: 0 }}>Latest updates</p>
                        </div>
                      </div>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </div>
                  </div>
                </div>
              </IPhoneFrame>
            </motion.div>

            {/* Description */}
            <motion.div variants={fadeUp} className="text-center md:text-left max-w-md">
              <h2
                style={{
                  fontFamily: 'var(--font-syne), Georgia, serif',
                  fontSize: 'clamp(2.5rem, 4.5vw, 4rem)',
                  fontWeight: 700,
                  fontStyle: 'italic',
                  color: C.ink,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.05,
                }}
              >
                Personal Profile<br />template UI.
              </h2>
              <p className="mt-5 text-base leading-relaxed" style={{ color: C.warmGray }}>
                Provide the ultimate professional presence through Unool&apos;s automated storytelling workflow. Beautiful, customizable, instantly shareable.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 mt-8 px-8 py-4 rounded-full text-sm font-semibold transition-all hover:scale-105 hover:brightness-110"
                style={{ backgroundColor: C.clay, color: C.cream, boxShadow: `0 8px 30px ${C.clay}30` }}
              >
                Get a call-to-action
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          SECTION 4: THE RIVER — A continuous visual flow
          Instead of boring cards, features flow like a river
          ═══════════════════════════════════════════════════════ */}
      <section className="relative py-28 overflow-hidden" style={{ backgroundColor: C.cream }}>
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-20"
          >
            <motion.p variants={fadeUp} className="text-xs font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: C.clay }}>
              The Unool Workflow
            </motion.p>
            <motion.h2
              variants={fadeUp}
              style={{
                fontFamily: 'var(--font-syne), Georgia, serif',
                fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                fontWeight: 700,
                color: C.ink,
                letterSpacing: '-0.02em',
              }}
            >
              Everything flows. Nothing breaks.
            </motion.h2>
          </motion.div>

          {/* ── Alternating left-right feature river ── */}
          <div className="relative">
            {/* Central vertical line */}
            <div
              className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 hidden md:block"
              style={{ background: `linear-gradient(180deg, transparent, ${C.sand}, ${C.clay}30, ${C.sand}, transparent)` }}
            />

            {[
              { icon: PenTool, title: 'One Link Profile', desc: 'Beautiful public profile at yourname.unool.co. 5 professional themes. Auto-generated from any URL. Proof points, links, badges — all editable.', side: 'left' },
              { icon: Sparkles, title: 'AI Post Composer', desc: 'Write once. AI adapts for each platform\'s character limits, formatting, and best practices. LinkedIn threads, X tweets, Threads replies.', side: 'right' },
              { icon: Shield, title: 'Human-in-the-Loop', desc: 'AI drafts. You approve. Edit inline, reject, or write from scratch. Nothing posts without your explicit click. Full control, zero surprises.', side: 'left' },
              { icon: Globe, title: 'One-Click Publish', desc: 'Connected accounts via OAuth. One click publishes to LinkedIn, X, and Threads simultaneously. Real-time status tracking.', side: 'right' },
              { icon: Clock, title: 'Smart Scheduling', desc: 'Schedule posts for optimal times. Timezone-aware. Queue management. Recurring posts. Calendar view.', side: 'left' },
              { icon: BarChart2, title: 'Analytics & Insights', desc: 'Track engagement across all platforms in one dashboard. Understand what resonates. Grow your audience intelligently.', side: 'right' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={fadeUp}
                className={`relative flex items-center mb-16 md:mb-24 ${feature.side === 'right' ? 'md:flex-row-reverse' : ''}`}
              >
                {/* The card */}
                <div className={`w-full md:w-[45%] ${feature.side === 'right' ? 'md:ml-auto md:pl-12' : 'md:mr-auto md:pr-12'}`}>
                  <div
                    className="p-8 rounded-2xl transition-all duration-500 hover:-translate-y-1"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      border: '1px solid rgba(212,184,150,0.2)',
                      boxShadow: '0 4px 24px rgba(26,10,5,0.04)',
                    }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${C.clay}10` }}
                      >
                        <feature.icon className="w-6 h-6" style={{ color: C.clay }} />
                      </div>
                      <h3 className="text-xl font-bold" style={{ color: C.ink }}>{feature.title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: C.warmGray }}>{feature.desc}</p>
                  </div>
                </div>

                {/* Center dot on the river line */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full hidden md:block z-10"
                  style={{
                    backgroundColor: C.cream,
                    border: `3px solid ${C.clay}`,
                    boxShadow: `0 0 0 4px ${C.cream}`,
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          SECTION 5: PRICING — Clean Invoice Style
          ═══════════════════════════════════════════════════════ */}
      <section id="pricing" className="relative py-28" style={{ backgroundColor: C.cream }}>
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-xs font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: C.clay }}>
              Simple Pricing
            </motion.p>
            <motion.h2
              variants={fadeUp}
              style={{
                fontFamily: 'var(--font-syne), Georgia, serif',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 700,
                color: C.ink,
              }}
            >
              Start free. Scale when you&apos;re ready.
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto"
          >
            {/* Free */}
            <motion.div
              variants={fadeUp}
              className="p-8 rounded-2xl"
              style={{
                backgroundColor: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(212,184,150,0.25)',
                boxShadow: '0 4px 20px rgba(26,10,5,0.04)',
              }}
            >
              <h3 className="text-2xl font-bold mb-1" style={{ color: C.ink }}>Free</h3>
              <p className="text-sm mb-6" style={{ color: C.warmGray }}>Perfect for solo founders</p>
              <div className="mb-8">
                <span className="text-5xl font-bold" style={{ color: C.ink }}>$0</span>
                <span className="text-sm ml-2" style={{ color: C.warmGray }}>/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['1 profile at yourname.unool.co', '12 posts/month', 'LinkedIn, X, Threads', 'AI adaptation', '5 themes', 'Magic link auth'].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm" style={{ color: C.ink }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: C.clay }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full py-3.5 rounded-lg text-sm font-semibold text-center transition-all hover:brightness-95"
                style={{ border: `2px solid ${C.clay}`, color: C.clay }}
              >
                Free trial
              </Link>
            </motion.div>

            {/* Pro */}
            <motion.div
              variants={fadeUp}
              className="p-8 rounded-2xl relative overflow-hidden"
              style={{
                backgroundColor: '#fff',
                border: `2px solid ${C.clay}`,
                boxShadow: `0 8px 40px ${C.clay}15`,
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${C.clay}, ${C.terracotta})` }} />
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-2xl font-bold" style={{ color: C.ink }}>Pro</h3>
                <span className="text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full" style={{ backgroundColor: `${C.clay}12`, color: C.clay }}>
                  Most Popular
                </span>
              </div>
              <p className="text-sm mb-6" style={{ color: C.warmGray }}>For growing creators &amp; teams</p>
              <div className="mb-8">
                <span className="text-5xl font-bold" style={{ color: C.ink }}>$19</span>
                <span className="text-sm ml-2" style={{ color: C.warmGray }}>/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Everything in Free, plus:', '300 posts/month', '10 connected accounts', '100 scheduled posts', '5 team members', 'Advanced analytics', 'Priority support'].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm" style={{ color: C.ink }}>
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: C.clay }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full py-3.5 rounded-lg text-sm font-semibold text-center transition-all hover:brightness-110 hover:scale-[1.02]"
                style={{ backgroundColor: C.clay, color: C.cream }}
              >
                CTA →
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          SECTION 6: FINAL CTA
          ═══════════════════════════════════════════════════════ */}
      <section className="relative py-28" style={{ backgroundColor: C.cream }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeUp}
              style={{
                fontFamily: 'var(--font-syne), Georgia, serif',
                fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                fontWeight: 700,
                color: C.ink,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
              }}
            >
              Ready to own your<br />professional presence?
            </motion.h2>
            <motion.div variants={fadeUp} className="mt-10">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-10 py-5 rounded-full text-base font-semibold transition-all hover:scale-105 hover:brightness-110"
                style={{ backgroundColor: C.clay, color: C.cream, boxShadow: `0 10px 40px ${C.clay}25` }}
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* ═══════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════ */}
      <footer className="py-12" style={{ backgroundColor: C.cream, borderTop: `1px solid rgba(212,184,150,0.25)` }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{ color: C.warmGray }}>
            <img src="/logo.png" alt="Unool" className="h-6 w-auto object-contain opacity-50" />
            <div className="flex items-center gap-6">
              <Link href="/terms" className="hover:opacity-70 transition-opacity">Terms</Link>
              <Link href="/privacy" className="hover:opacity-70 transition-opacity">Privacy</Link>
            </div>
            <p className="text-xs">Built for founder-operators, not content creators.</p>
          </div>
        </div>
      </footer>

      {/* Blinking cursor keyframe */}
      <style jsx global>{`
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}