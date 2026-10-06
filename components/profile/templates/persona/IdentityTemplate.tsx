'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { TemplateProps } from '@/components/profile/templates/types';
import { getTemplateById } from '@/components/profile/templates/registry';
import { motion } from 'framer-motion';
import { Menu, BadgeCheck, ArrowRight, Bookmark, Send, Sparkles, Quote, Github, Linkedin, Instagram, ExternalLink, Users, Link as LinkIcon, Eye } from 'lucide-react';

// --- 01 INDIVIDUAL --- //

function LoverTemplate({ profile, accentColor }: any) {
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTimer, setToastTimer] = useState<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer) clearTimeout(toastTimer);
    const timer = setTimeout(() => {
      setToastVisible(false);
    }, 2200);
    setToastTimer(timer);
  };

  const copyEmail = () => {
    navigator.clipboard.writeText('hello@example.com');
    showToast('Copied: hello@example.com');
  };

  const downloadVCard = () => {
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:${profile.name};;;;\nFN:${profile.name}\nORG:${profile.company || ''}\nTITLE:${profile.role || ''}\nURL:${typeof window !== 'undefined' ? window.location.origin : ''}\nEND:VCARD`;
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.name?.replace(/\s+/g, '_') || 'Contact'}.vcf`;
    a.click();
    showToast('Contact vCard saved!');
  };

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,500&family=IBM+Plex+Mono:wght@500;600&display=swap');

    .lover-template-container {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .lover-template-container .font-serif {
      font-family: 'Playfair Display', Georgia, serif;
    }

    .lover-template-container .font-mono-tag {
      font-family: 'IBM Plex Mono', monospace;
    }

    .lover-template-container .clay-surface {
      background: #FFFDF9;
      border-radius: 26px;
      box-shadow: 
        0 8px 24px rgba(42, 23, 16, 0.08),
        0 1px 3px rgba(42, 23, 16, 0.04),
        inset 1.5px 1.5px 3px rgba(255, 255, 255, 1),
        inset -1.5px -2px 4px rgba(180, 140, 115, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.95);
    }

    .lover-template-container .clay-card {
      background: #FFFDF9;
      border-radius: 18px;
      box-shadow: 
        0 4px 14px rgba(42, 23, 16, 0.06),
        inset 1.5px 1.5px 2px rgba(255, 255, 255, 1),
        inset -1px -1px 3px rgba(180, 140, 115, 0.09);
      border: 1px solid rgba(255, 255, 255, 0.9);
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .lover-template-container .clay-card:active {
      transform: scale(0.985);
      box-shadow: inset 1.5px 1.5px 3px rgba(42, 23, 16, 0.1);
    }

    .lover-template-container .clay-btn-accent {
      background: linear-gradient(135deg, #CF5628 0%, #B34115 100%);
      color: #FFFFFF;
      min-height: 44px;
      border-radius: 9999px;
      box-shadow: 
        0 4px 14px rgba(190, 70, 25, 0.32),
        inset 1.5px 1.5px 2px rgba(255, 220, 200, 0.5),
        inset -1.5px -2px 3px rgba(0, 0, 0, 0.25);
      transition: all 0.15s ease;
    }
    .lover-template-container .clay-btn-accent:active {
      transform: scale(0.96);
    }

    .lover-template-container .accent-badge { 
      background: #F5E6DC; 
      color: #A64522; 
      border-color: #E9D1C3; 
    }
  `;

  return (
    <div className="lover-template-container bg-transparent text-[#26160F] p-4 sm:p-8 antialiased flex flex-col items-center justify-start min-h-[100dvh] w-full relative">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div className="w-full max-w-[400px] bg-[#FAF5F0] border border-[#2A1710]/15 rounded-[32px] p-5 shadow-xl relative flex flex-col overflow-hidden transition-all duration-300">
        
        {/* Top Status Bar */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2A1710]/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#CF5628] animate-pulse"></span>
            <span className="font-mono-tag text-xs font-bold text-[#2A1710] uppercase tracking-wider">
              {profile.role || 'PROFESSIONAL'} • {profile.company || 'INDEPENDENT'}
            </span>
          </div>
          <span className="font-mono-tag text-xs font-bold accent-badge px-2.5 py-0.5 rounded-full border">
            @{profile.subdomain || 'user'}
          </span>
        </div>

        {/* Avatar & Identity */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="relative mb-3">
            <div className="w-[76px] h-[76px] rounded-full p-1 bg-white shadow-md flex items-center justify-center border border-stone-200">
              <img 
                src={profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} 
                alt={profile.name || 'User'} 
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#2A1710] text-[#FFFDF9] flex items-center justify-center font-bold text-[10px] shadow-sm border border-white">
              ✓
            </div>
          </div>

          <h1 className="font-extrabold text-2xl text-[#2A1710] tracking-tight leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {profile.name}
          </h1>

          <p className="text-xs font-semibold text-[#CF5628] mt-1 font-mono-tag uppercase tracking-wide">
            {profile.headline}
          </p>

          {profile.bio && (
            <p className="text-xs text-stone-600 font-medium leading-relaxed mt-2.5 max-w-[320px] bg-[#FFFDF9] p-3 rounded-2xl border border-white/80 shadow-sm">
              "{profile.bio}"
            </p>
          )}
        </div>

        {/* Verified Proof Points */}
        {profile.proofs && profile.proofs.length > 0 && (
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {profile.proofs.slice(0,3).map((proof: any, i: number) => (
              <div key={i} className="clay-card p-3 flex flex-col items-center justify-center text-center">
                <span className={`text-base font-extrabold ${i === 1 ? 'text-[#CF5628]' : 'text-[#2A1710]'}`}>{proof.value}</span>
                <span className="text-[11px] text-stone-500 font-mono-tag">{proof.title || proof.type}</span>
              </div>
            ))}
          </div>
        )}

        {/* Links */}
        {profile.links && profile.links.length > 0 && (
          <div className="space-y-2.5 mb-5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-[#2A1710] uppercase tracking-wider font-mono-tag">
                Official Links
              </span>
              <span className="text-[11px] text-stone-500 font-medium">Verified Profiles</span>
            </div>

            {profile.links.map((link: any, i: number) => (
              <a key={i} href={link.url} target="_blank" rel="noreferrer" className="clay-card p-3.5 flex items-center justify-between no-underline block active:scale-95 transition">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${i % 3 === 0 ? 'bg-[#F6EDE8] text-[#2A1710]' : i % 3 === 1 ? 'bg-[#FAF0E6] text-[#8C4F35]' : 'bg-[#FCECE9] text-[#CF5628]'}`}>
                    <span className="font-bold text-lg font-serif">{link.label.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#2A1710]">{link.label}</h4>
                    <p className="text-[11px] text-stone-500 truncate max-w-[150px]">{link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}</p>
                  </div>
                </div>
                <span className="text-stone-400 font-bold text-xs pr-1">↗</span>
              </a>
            ))}
          </div>
        )}

        {/* NEW SECTION: RECENT SOCIAL ACTIVITY (Mobile-Friendly & Concise) */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#2A1710] uppercase tracking-wider font-mono-tag">
              Recent Activity
            </span>
            <span className="text-[10px] text-[#CF5628] font-mono-tag font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CF5628] animate-pulse"></span> Live Feeds
            </span>
          </div>

          <div className="space-y-2">
            {/* 1. GitHub Recent Activity */}
            <a href="https://github.com/" target="_blank" rel="noreferrer" className="clay-card p-3 flex items-start gap-3 no-underline block active:scale-95 transition">
              <div className="w-8 h-8 rounded-xl bg-[#FCECE9] flex items-center justify-center text-[#CF5628] shrink-0 mt-0.5">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#2A1710]">GitHub</span>
                  <span className="text-[10px] text-stone-400 font-mono-tag">4h ago</span>
                </div>
                <p className="text-xs text-stone-600 leading-snug mt-0.5">
                  Pushed commits to <span className="font-mono-tag text-[#A64522] font-semibold">unool-platform</span>: updated layout components
                </p>
              </div>
              <span className="text-stone-400 text-xs mt-1">↗</span>
            </a>

            {/* 2. LinkedIn Recent Activity */}
            <a href="https://in.linkedin.com/" target="_blank" rel="noreferrer" className="clay-card p-3 flex items-start gap-3 no-underline block active:scale-95 transition">
              <div className="w-8 h-8 rounded-xl bg-[#F6EDE8] flex items-center justify-center text-[#2A1710] shrink-0 mt-0.5">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#2A1710]">LinkedIn</span>
                  <span className="text-[10px] text-stone-400 font-mono-tag">2d ago</span>
                </div>
                <p className="text-xs text-stone-600 leading-snug mt-0.5">
                  Shared update on internship progress at Pixenox Solutions & Unool platform features
                </p>
              </div>
              <span className="text-stone-400 text-xs mt-1">↗</span>
            </a>

            {/* 3. Instagram Recent Activity */}
            <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="clay-card p-3 flex items-start gap-3 no-underline block active:scale-95 transition">
              <div className="w-8 h-8 rounded-xl bg-[#FAF0E6] flex items-center justify-center text-[#8C4F35] shrink-0 mt-0.5">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#2A1710]">Instagram</span>
                  <span className="text-[10px] text-stone-400 font-mono-tag">1d ago</span>
                </div>
                <p className="text-xs text-stone-600 leading-snug mt-0.5">
                  Workspace snapshot: prototyping claymorphic UI cards
                </p>
              </div>
              <span className="text-stone-400 text-xs mt-1">↗</span>
            </a>
          </div>
        </div>

        {/* Quick Action Bar */}
        <div className="flex items-center gap-2">
          <button onClick={copyEmail} className="clay-btn-accent flex-1 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md">
            <span>✉️</span> Get in Touch
          </button>
          <button onClick={downloadVCard} className="clay-card px-4 py-2.5 text-xs font-bold text-[#2A1710] flex items-center justify-center gap-1.5 shrink-0">
            <span>💾</span> Save Contact
          </button>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[#2A1710]/10 flex items-center justify-between text-[11px] text-stone-400 font-mono-tag">
          <span>{profile.subdomain}.unool.co</span>
          <span className="text-[#2A1710] font-bold">Unool</span>
        </div>

      </div>

      {/* Toast */}
      <div className={`fixed bottom-6 px-4 py-2 bg-[#2A1710] text-[#FFFDF9] text-xs font-mono-tag rounded-full shadow-2xl transition-all duration-200 z-50 ${toastVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {toastMsg}
      </div>
    </div>
  );
}

function LoneTemplate({ profile }: any) {
  const nameParts = (profile?.name || 'Imandi Prasanna').split(' ');
  const firstName = nameParts[0] || 'Imandi';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') + '.' : 'Prasanna.';

  const links = profile?.links || [];
  const stats = profile?.proofs || [];
  
  // Mock recent activity since it's requested in the design
  const recentActivity = [
    {
      id: 1,
      platform: 'GitHub',
      icon: 'github',
      text: 'Pushed commits to unool-platform:\nupdated layout components',
      time: '4h ago'
    },
    {
      id: 2,
      platform: 'LinkedIn',
      icon: 'linkedin',
      text: 'Shared update on internship progress\nat Poonce Solutions & Unool platform features',
      time: '2d ago'
    },
    {
      id: 3,
      platform: 'Instagram',
      icon: 'instagram',
      text: 'Workspace snapshot: prototyping\nclaymorphic UI cards',
      time: '1d ago'
    }
  ];

  const getStatIcon = (index: number) => {
    if (index === 0) return <Users size={16} className="mb-2 text-[#F4EFE7]/80" />;
    if (index === 1) return <LinkIcon size={16} className="mb-2 text-[#111318]" />;
    return <Eye size={16} className="mb-2 text-[#F4EFE7]/80" />;
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'github': return Github;
      case 'linkedin': return Linkedin;
      case 'instagram': return Instagram;
      default: return ExternalLink;
    }
  };

  return (
    <div 
      className="relative min-h-[100dvh] w-full text-[#F4EFE7] overflow-hidden font-sans"
      style={{ 
        backgroundColor: '#08090C',
        backgroundImage: 'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundBlendMode: 'overlay'
      }}
    >
      {/* Subtle radial glow background to prevent pure flat black, adjusted for glass visibility */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_rgba(18,61,255,0.15)_0%,_rgba(8,9,12,0)_70%)] pointer-events-none" />
      <div className="absolute bottom-0 right-[-200px] w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_rgba(244,239,231,0.03)_0%,_rgba(8,9,12,0)_60%)] pointer-events-none" />

      {/* Increased padding and gaps to enhance whitespace as a design element */}
      <div className="relative z-10 h-full w-full max-w-[420px] mx-auto px-6 py-12 flex flex-col gap-10 min-h-[100dvh]">
        
        {/* Menu Button */}
        <div className="absolute top-10 right-6 z-20">
          <button className="h-10 w-10 rounded-full border border-white/10 bg-[#111318]/50 flex items-center justify-center backdrop-blur-md transition-colors hover:bg-white/10">
            <Menu size={18} className="text-[#F4EFE7]" />
          </button>
        </div>

        {/* Top Header */}
        <header className="flex justify-between items-end relative w-full mt-4">
          <div className="flex flex-col z-10 pb-2">
            <h1 className="font-bold tracking-tight leading-[1.05]">
              <span className="text-[#F4EFE7] block font-serif font-black" style={{ fontSize: '3.2rem' }}>{firstName}</span>
              <span className="block font-serif font-black" style={{ color: '#123DFF', fontSize: '3.2rem' }}>{lastName}</span>
            </h1>
            <p className="text-[#9296A0] text-[10px] tracking-[0.4em] uppercase mt-4 font-medium">
              {profile?.role || 'PROFESSIONAL'}
            </p>
          </div>
          
          <div className="relative z-10 mr-2 mb-2">
            <Sparkles size={20} className="text-[#F4EFE7] absolute -top-3 -left-4 opacity-80" />
            <div 
              className="w-[100px] h-[100px] rounded-full border border-[#F4EFE7]/30 shadow-[0_0_25px_rgba(18,61,255,0.2)] relative p-1 backdrop-blur-md"
              style={{ background: 'rgba(18, 61, 255, 0.05)' }}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-[#111318] flex items-center justify-center border border-[#123DFF]/20">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name || 'Avatar'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#101B3A] to-[#111318]" />
                )}
              </div>
              <div className="absolute bottom-[6px] right-[2px] h-3.5 w-3.5 bg-[#123DFF] rounded-full border-[2px] border-[#08090C] shadow-[0_0_8px_rgba(18,61,255,0.8)]" />
            </div>
          </div>
        </header>

        {/* Bio / Quote Section (LEVEL 1 GLASS) */}
        {(profile?.bio || profile?.headline) && (
          <div 
            className="rounded-[24px] overflow-hidden relative shadow-[0_12px_30px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]"
            style={{ 
              transform: 'skewX(-20deg)',
              background: 'linear-gradient(rgba(15, 17, 21, 0.75), rgba(15, 17, 21, 0.85)), url("https://images.unsplash.com/photo-1549880338-65dd4bc83f06?q=80&w=600&auto=format&fit=crop")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(255, 255, 255, 0.16)'
            }}
          >
            {/* Subtle cobalt highlight on edge */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#123DFF]/40 to-transparent" />
            
            <div 
              className="p-7 py-8 flex gap-4 items-start relative z-10"
              style={{ transform: 'skewX(20deg)' }}
            >
              <Quote size={24} className="text-[#F4EFE7] shrink-0 fill-current opacity-80 mt-1" />
              <p className="text-[#F4EFE7]/90 text-[14px] leading-relaxed pr-2 font-medium">
                {profile?.bio || profile?.headline}
              </p>
            </div>
          </div>
        )}

        {/* Stats Section (LEVEL 2 GLASS) */}
        {stats.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {stats.slice(0, 3).map((stat: any, i: number) => {
              const isMiddle = i === 1;
              const isThird = i === 2;
              
              let glassBg = 'linear-gradient(rgba(20, 23, 30, 0.6), rgba(20, 23, 30, 0.8)), url("https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=600&auto=format&fit=crop")'; 
              let borderCol = 'rgba(255, 255, 255, 0.15)';
              
              if (isMiddle) {
                glassBg = 'linear-gradient(rgba(244, 239, 231, 0.85), rgba(244, 239, 231, 0.95)), url("https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=600&auto=format&fit=crop")'; 
                borderCol = 'rgba(255, 255, 255, 0.4)';
              } else if (isThird) {
                glassBg = 'linear-gradient(rgba(16, 27, 58, 0.7), rgba(16, 27, 58, 0.85)), url("https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?q=80&w=600&auto=format&fit=crop")'; 
                borderCol = 'rgba(18, 61, 255, 0.2)';
              }

              return (
                <div 
                  key={i} 
                  className={`rounded-[20px] overflow-hidden relative shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]`}
                  style={{ 
                    transform: 'skewX(-20deg)',
                    background: glassBg,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: `1px solid ${borderCol}`
                  }}
                >
                  <div 
                    className={`p-4 py-5 flex flex-col items-center justify-center text-center relative z-10 ${isMiddle ? 'text-[#111318]' : 'text-[#F4EFE7]'}`}
                    style={{ transform: 'skewX(20deg)' }}
                  >
                    {getStatIcon(i)}
                    <span className="text-[20px] font-bold font-serif leading-none tracking-wide mt-1">{stat.value}</span>
                    <span className={`text-[10px] mt-1.5 capitalize ${isMiddle ? 'text-[#111318]/70 font-medium' : 'text-[#9296A0]'}`}>
                      {stat.title}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Official Links Section (LEVEL 1 GLASS) */}
        {links.filter((l: any) => l.isVisible !== false).length > 0 && (
          <section className="flex flex-col gap-5 mt-2">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] text-[#9296A0] px-2 mb-1 font-medium">
              <span>Official Links</span>
              <div className="flex items-center gap-1.5 capitalize tracking-normal text-[#123DFF] text-[11px]">
                Verified Profiles
                <BadgeCheck size={14} className="text-[#123DFF] fill-[#123DFF] text-[#08090C]" />
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              {links.filter((l: any) => l.isVisible !== false).map((link: any, i: number) => {
                const IconComponent = getIconComponent(link.icon);
                
                let glassBg = 'linear-gradient(rgba(22, 25, 34, 0.7), rgba(22, 25, 34, 0.8)), url("https://images.unsplash.com/photo-1549880338-65dd4bc83f06?q=80&w=600&auto=format&fit=crop")';
                let iconBgStyle = 'bg-[#08090C] text-[#F4EFE7] border border-white/10';
                let textPrimary = 'text-[#F4EFE7]';
                let textSecondary = 'text-[#9296A0]';
                let arrowBg = 'bg-white/10 text-white border border-white/5';
                
                if (link.icon?.toLowerCase() === 'linkedin') {
                  glassBg = 'linear-gradient(rgba(18, 61, 255, 0.2), rgba(10, 20, 50, 0.7)), url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop")'; 
                  iconBgStyle = 'bg-[#123DFF] text-white shadow-[0_0_15px_rgba(18,61,255,0.4)]';
                  arrowBg = 'bg-[#123DFF]/20 text-[#123DFF] border border-[#123DFF]/30';
                } else if (link.icon?.toLowerCase() === 'instagram') {
                  glassBg = 'linear-gradient(rgba(244, 239, 231, 0.75), rgba(220, 200, 180, 0.85)), url("https://images.unsplash.com/photo-1508610048659-a06b669e3321?q=80&w=600&auto=format&fit=crop")'; 
                  iconBgStyle = 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-[0_0_15px_rgba(220,39,67,0.3)]';
                  arrowBg = 'bg-black/10 text-black border border-black/10';
                  textPrimary = 'text-[#2A1710]';
                  textSecondary = 'text-[#2A1710]/70';
                } else if (link.icon?.toLowerCase() === 'github') {
                  glassBg = 'linear-gradient(rgba(16, 27, 58, 0.5), rgba(10, 15, 30, 0.7)), url("https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=600&auto=format&fit=crop")'; 
                  iconBgStyle = 'bg-[#111318] text-[#F4EFE7] border border-white/15 shadow-[0_0_10px_rgba(0,0,0,0.5)]';
                  arrowBg = 'bg-[#111318]/50 text-white border border-white/10';
                }
                
                return (
                  <a 
                    key={link.id || i} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="group rounded-[22px] overflow-hidden relative block hover:scale-[1.01] transition-transform shadow-[0_12px_30px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]"
                    style={{ 
                      transform: 'skewX(-20deg)',
                      background: glassBg,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.16)'
                    }}
                  >
                    {/* Inner highlight */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.1] to-transparent pointer-events-none" />
                    
                    <div 
                      className="p-4 pr-5 flex items-center gap-4 relative z-10"
                      style={{ transform: 'skewX(20deg)' }}
                    >
                      <div className={`w-[50px] h-[50px] rounded-[16px] flex items-center justify-center shrink-0 backdrop-blur-md ${iconBgStyle}`}>
                        <IconComponent size={20} className={link.icon !== 'linkedin' && link.icon !== 'instagram' ? 'fill-current' : ''} />
                      </div>
                      
                      <div className={`flex-1 flex flex-col justify-center`}>
                        <h3 className={`font-semibold text-[15px] truncate max-w-[160px] tracking-wide ${textPrimary}`}>{link.label}</h3>
                        <p className={`text-[11px] truncate max-w-[160px] mt-0.5 ${textSecondary}`}>
                          {link.url.replace(/^https?:\/\//, '')}
                        </p>
                      </div>
                      
                      <div className={`h-[34px] w-[34px] rounded-full flex items-center justify-center shrink-0 ml-2 transition-transform group-hover:translate-x-1 backdrop-blur-md ${arrowBg}`}>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent Activity Section (LEVEL 3 GLASS) */}
        <section className="flex flex-col gap-4 mt-2">
          <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] text-[#9296A0] px-2 mb-2 font-medium">
            <span>Recent Activity</span>
            <div className="flex items-center gap-1.5 capitalize tracking-normal text-[#123DFF] text-[11px]">
              Live Feeds
              <div className="w-2 h-2 rounded-full bg-[#123DFF] animate-pulse" />
            </div>
          </div>
          
          <div className="relative pl-3">
            {/* Minimal Timeline Line */}
            <div className="absolute left-4 top-4 bottom-4 w-[1px] bg-white/10" />
            
            <div className="flex flex-col gap-5">
              {recentActivity.map((activity, i) => {
                const IconComponent = getIconComponent(activity.icon);
                
                let glassBg = 'linear-gradient(rgba(17, 19, 24, 0.6), rgba(17, 19, 24, 0.8)), url("https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=600&auto=format&fit=crop")';
                let iconBgStyle = 'bg-[#08090C] text-[#F4EFE7] border border-white/5';
                let textPrimary = 'text-[#F4EFE7]';
                let textSecondary = 'text-[#9296A0]';
                
                if (activity.icon === 'linkedin') {
                  glassBg = 'linear-gradient(rgba(244, 239, 231, 0.85), rgba(244, 239, 231, 0.95)), url("https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=600&auto=format&fit=crop")';
                  iconBgStyle = 'bg-[#123DFF] text-white';
                  textPrimary = 'text-[#111318]';
                  textSecondary = 'text-[#111318]/70';
                } else if (activity.icon === 'instagram') {
                  glassBg = 'linear-gradient(rgba(30, 20, 20, 0.6), rgba(30, 20, 20, 0.8)), url("https://images.unsplash.com/photo-1508610048659-a06b669e3321?q=80&w=600&auto=format&fit=crop")';
                  iconBgStyle = 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white';
                }
                
                return (
                  <div key={activity.id} className="relative flex items-center pl-8">
                    {/* Timeline Dot */}
                    <div className="absolute left-[-2px] w-[9px] h-[9px] rounded-full bg-[#F4EFE7] border-2 border-[#08090C] shadow-[0_0_8px_rgba(255,255,255,0.3)] z-10" />
                    
                    <div 
                      className={`w-full rounded-[18px] overflow-hidden relative shadow-[0_4px_15px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]`}
                      style={{ 
                        transform: 'skewX(-20deg)',
                        background: glassBg,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
                      
                      <div 
                        className="p-3 pr-4 flex items-center gap-3 relative z-10"
                        style={{ transform: 'skewX(20deg)' }}
                      >
                        <div className={`w-[36px] h-[36px] rounded-[12px] flex items-center justify-center shrink-0 shadow-sm ${iconBgStyle}`}>
                          <IconComponent size={16} className={activity.icon !== 'linkedin' && activity.icon !== 'instagram' ? 'fill-current' : ''} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className={`font-medium text-[13px] ${textPrimary}`}>{activity.platform}</span>
                            <span className={`text-[9px] ${textSecondary}`}>{activity.time}</span>
                          </div>
                          <p className={`text-[10px] leading-snug line-clamp-2 ${textSecondary}`}>
                            {activity.text}
                          </p>
                        </div>
                        
                        <div className={`h-[28px] w-[28px] rounded-full flex items-center justify-center shrink-0 ml-1 opacity-50 ${textPrimary === 'text-[#111318]' ? 'bg-[#111318]/10 text-[#111318]' : 'bg-white/5 text-white'}`}>
                          <ArrowRight size={12} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Bottom Actions */}
        <div className="flex gap-4 mt-8 mb-6">
          <button 
            className="flex-[1.2] rounded-[20px] text-white overflow-hidden shadow-[0_12px_25px_rgba(18,61,255,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] hover:opacity-90 transition-opacity relative"
            style={{ 
              transform: 'skewX(-20deg)',
              background: 'linear-gradient(135deg, rgba(30, 80, 255, 0.95), rgba(10, 40, 200, 0.95))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(100,150,255,0.4)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-[#123DFF] to-transparent opacity-50 pointer-events-none" />
            <div className="p-4 flex items-center justify-between px-6 relative z-10" style={{ transform: 'skewX(20deg)' }}>
              <Send size={16} className="opacity-90" />
              <span className="font-semibold text-[13px] tracking-wide">Get in Touch</span>
              <ArrowRight size={16} />
            </div>
          </button>
          
          <button 
            className="flex-1 rounded-[20px] text-[#F4EFE7] overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-white/5 transition-colors relative"
            style={{ 
              transform: 'skewX(-20deg)',
              background: 'rgba(25, 28, 35, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
            <div className="p-4 flex items-center justify-center gap-2 relative z-10" style={{ transform: 'skewX(20deg)' }}>
              <Bookmark size={15} className="opacity-80" />
              <span className="font-semibold text-[13px] tracking-wide">Save Contact</span>
            </div>
          </button>
        </div>

        {/* Footer */}
        <footer className="flex justify-between items-center text-[#9296A0] text-[10px] px-2 mt-auto mb-2 uppercase tracking-widest">
          <span>{profile?.subdomain ? `${profile.subdomain}.unool.co` : 'ipras.unool.co'}</span>
          <span className="font-serif tracking-widest opacity-80 text-[#F4EFE7]">Unool</span>
        </footer>
      </div>
    </div>
  );
}

function EnergyTemplate({ profile, accentColor }: any) {
  const accent = accentColor || '#CCFF00';
  return (
    <div className="min-h-screen w-full bg-black text-white p-6 md:p-12 overflow-hidden" style={{ fontFamily: 'Impact, sans-serif' }}>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-end">
        <div className="flex-1 space-y-4 uppercase">
          <div className="flex items-center gap-4 mb-8">
             <div className="w-16 h-4" style={{ backgroundColor: accent, transform: 'skewX(-20deg)' }} />
             <span className="text-2xl tracking-widest opacity-80" style={{ fontFamily: 'var(--font-sans)' }}>System Active</span>
          </div>
          <h1 className="text-7xl md:text-9xl leading-none tracking-tighter" style={{ WebkitTextStroke: '2px white', color: 'transparent' }}>
            {profile.name}
          </h1>
          <h2 className="text-4xl md:text-6xl" style={{ color: accent }}>{profile.headline}</h2>
          <p className="text-lg md:text-xl font-bold tracking-widest opacity-80 max-w-lg mt-8" style={{ fontFamily: 'var(--font-sans)' }}>{profile.bio}</p>
        </div>
        
        <div className="w-full md:w-1/3 space-y-3">
          {profile.links?.map((link: any, i: number) => (
            <a key={i} href={link.url} className="group block relative w-full overflow-hidden bg-[#111] p-6 transition-all hover:pl-8 rounded-sm" style={{ borderLeft: `8px solid ${accent}`}}>
              <div className="relative z-10 flex justify-between uppercase text-xl md:text-2xl tracking-wider">
                <span>{link.label}</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">►</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- 02 STARTUP --- //

function RebellionTemplate({ profile, accentColor }: any) {
  const accent = accentColor || '#FF3366';
  return (
    <div className="min-h-screen w-full bg-[#EAEAEA] text-black p-8 md:p-16 flex flex-col items-center justify-center font-mono">
      <div className="max-w-3xl w-full rotate-[-1deg]">
        <div className="border-[6px] border-black bg-white p-8 md:p-12 shadow-[12px_12px_0_0_rgba(0,0,0,1)] relative">
          <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full border-4 border-black flex items-center justify-center animate-spin-slow" style={{ backgroundColor: accent }}>
             <span className="text-3xl">★</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">{profile.name}</h1>
          <div className="inline-block px-4 py-2 text-white font-bold text-xl mb-8 border-2 border-black" style={{ backgroundColor: accent }}>
            {profile.headline}
          </div>
          <p className="text-lg md:text-xl font-semibold leading-snug mb-12 border-l-4 border-black pl-4">
            {profile.bio}
          </p>
          <div className="grid gap-4">
            {profile.links?.map((link: any, i: number) => (
              <a key={i} href={link.url} className="block w-full p-4 border-4 border-black bg-[#EAEAEA] hover:bg-black hover:text-white font-bold uppercase transition-colors flex justify-between shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1">
                <span>{link.label}</span>
                <span>⟶</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function VisionTemplate({ profile, accentColor }: any) {
  const accent = accentColor || '#00F0FF';
  return (
    <div className="min-h-screen w-full bg-[#020208] text-[#E0E7FF] p-8 md:p-16 relative overflow-hidden font-sans">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0, 240, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="relative z-10 max-w-4xl mx-auto border border-blue-900/50 bg-[#060618]/80 backdrop-blur rounded-[2rem] p-10 shadow-[0_0_40px_rgba(0,240,255,0.05)]">
        <div className="flex flex-col md:flex-row gap-12 items-center text-center md:text-left">
          <div className="relative">
            <img src={profile.avatarUrl} alt={profile.name} className="w-32 h-32 rounded-2xl border border-blue-500/30 object-cover" />
            <div className="absolute -inset-2 rounded-[1.2rem] border border-blue-500/20 shadow-[0_0_15px_rgba(0,240,255,0.3)] animate-pulse" />
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white">{profile.name}</h1>
            <p className="text-xl" style={{ color: accent }}>{profile.headline}</p>
            <p className="text-blue-200/60 max-w-lg pt-2">{profile.bio}</p>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profile.links?.map((link: any, i: number) => (
            <a key={i} href={link.url} className="group relative overflow-hidden rounded-xl border border-blue-900/40 bg-blue-950/20 p-5 hover:bg-blue-900/40 transition-all flex justify-between items-center">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="font-medium tracking-wide">{link.label}</span>
              <span className="opacity-40 group-hover:opacity-100 group-hover:text-[#00F0FF]">→</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- 02 HUMAN --- //

function HumanTemplate({ profile, accentColor }: any) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTimer, setToastTimer] = useState<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer) clearTimeout(toastTimer);
    const timer = setTimeout(() => setToastVisible(false), 2200);
    setToastTimer(timer);
  };

  const handleContact = () => {
    if (profile.email) {
      window.location.href = `mailto:${profile.email}`;
    } else {
      showToast('Contact email not available.');
    }
  };

  const downloadVCard = () => {
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:${profile.name || ''};;;;\nFN:${profile.name || ''}\nORG:${profile.company || ''}\nTITLE:${profile.role || profile.headline || ''}\nURL:${typeof window !== 'undefined' ? window.location.origin : ''}\nEND:VCARD`;
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.name?.replace(/\s+/g, '_') || 'Contact'}.vcf`;
    a.click();
    showToast('Contact saved!');
  };

  const getIcon = (iconName?: string) => {
    switch (iconName?.toLowerCase()) {
      case 'github': return <Github size={20} />;
      case 'linkedin': return <Linkedin size={20} />;
      case 'instagram': return <Instagram size={20} />;
      default: return <ExternalLink size={20} />;
    }
  };

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap');

    .human-theme {
      font-family: 'DM Sans', sans-serif;
      background-color: #123040;
      color: #F4EDDC;
    }
    .human-theme .font-serif {
      font-family: 'Playfair Display', serif;
    }
    
    .human-texture {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
      z-index: 50;
      opacity: 0.05;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    }

    .human-blob-bg-1 {
      position: absolute;
      top: -10%; left: -10%;
      width: 70vw; height: 70vw;
      max-width: 800px; max-height: 800px;
      background-color: #E2B746;
      border-radius: 45% 55% 40% 60% / 55% 45% 60% 40%;
      opacity: 0.05;
      pointer-events: none;
      z-index: 0;
    }

    .human-img-mask {
      border-radius: 42% 58% 35% 65% / 55% 45% 60% 40%;
    }

    .human-img-bg {
      border-radius: 50% 50% 45% 55% / 40% 60% 45% 55%;
      background-color: #E2B746;
    }
    
    .human-bio-surface {
      background-color: #EFE4CC;
      border-radius: 40px 100px 40px 100px / 80px 40px 80px 40px;
    }

    .human-metric-1 {
      background-color: #E2B746;
      color: #1B1D1B;
      border-radius: 30px 40px 30px 40px / 40px 30px 40px 30px;
    }
    .human-metric-2 {
      background-color: #A5AE89;
      color: #1B1D1B;
      border-radius: 40px 30px 40px 30px / 30px 40px 30px 40px;
    }
    .human-metric-3 {
      background-color: #BE5B42;
      color: #F4EDDC;
      border-radius: 35px 35px 35px 35px / 45px 45px 25px 25px;
    }
    
    .human-social-link {
      border-radius: 30px 12px 30px 12px / 20px 30px 20px 30px;
      transition: all 0.25s ease;
    }
    .human-social-link:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.15);
      border-radius: 16px 24px 16px 24px / 24px 16px 24px 16px;
    }
    .human-social-link:active {
      transform: translateY(1px);
    }
    
    .human-footer-shape-1 {
      border-radius: 140px 20px 0 0 / 100px 40px 0 0;
    }
    .human-footer-shape-2 {
      border-radius: 40px 140px 0 0 / 20px 100px 0 0;
    }
    .human-footer-shape-3 {
      border-radius: 50% 50% 0 0 / 100px 100px 0 0;
    }
  `;

  return (
    <div className="w-full min-h-[100dvh] flex flex-col items-center justify-start bg-[#0a161e] p-[clamp(24px,6vw,64px)]">
      <div 
        className="human-theme w-full relative flex-1 max-w-[1440px] overflow-hidden antialiased flex flex-col shadow-2xl"
        style={{ borderRadius: 'clamp(24px, 5vw, 48px)' }}
      >
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className="human-texture" />
      <div className="human-blob-bg-1" />

      {/* Navigation & Header */}
      <nav className="relative z-20 w-full p-8 md:p-12 flex justify-between items-start max-w-[1400px] mx-auto">
        <div className="flex flex-col select-none">
          <span className="font-serif font-bold text-2xl md:text-3xl text-[#F4EDDC] leading-[0.8] mb-3 uppercase tracking-widest">
            THE<br/>{profile.company ? profile.company.substring(0,10) : 'HUMAN'}
          </span>
          <span className="font-sans text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-[#AEA997] leading-[1.6] max-w-[150px] font-bold">
            People are<br/>the product.
          </span>
        </div>
        <button 
          onClick={() => setMenuOpen(true)}
          className="w-14 h-14 flex flex-col items-end justify-start gap-[8px] hover:opacity-70 transition-opacity focus:outline-none pt-2 pr-2"
          aria-label="Open menu"
        >
          <div className="w-10 h-[2px] bg-[#F4EDDC]"></div>
          <div className="w-10 h-[2px] bg-[#F4EDDC]"></div>
        </button>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 w-full flex-1 pb-16">
        
        {/* Hero Section */}
        <section className="relative w-full max-w-[1300px] mx-auto px-6 mt-0 md:mt-12 flex flex-col lg:flex-row items-center lg:items-stretch justify-end min-h-[auto] lg:min-h-[500px]">
          
          {/* Text Content (Overlapping) */}
          <div className="w-full lg:w-3/5 flex flex-col z-20 lg:absolute lg:left-8 lg:top-1/2 lg:-translate-y-1/2 mt-6 lg:mt-0 text-center lg:text-left order-2 lg:order-1">
            <span className="font-serif italic text-[#F4EDDC] text-lg sm:text-xl md:text-2xl opacity-90 block mb-1 lg:mb-2">
              @{profile.subdomain || 'identity'}
            </span>
            <h1 className="font-serif text-[#F4EDDC] text-[clamp(3.5rem,14vw,6rem)] lg:text-[8.5rem] leading-[0.9] tracking-tight mb-2 lg:mb-4 drop-shadow-md lg:drop-shadow-none">
              {profile.name}
            </h1>
            <h2 className="font-sans text-[#AEA997] text-lg sm:text-2xl md:text-3xl font-light tracking-wide max-w-2xl mx-auto lg:mx-0">
              {profile.headline || profile.role || 'Professional Profile'}
            </h2>
          </div>

          {/* Image Content */}
          <div className="w-full lg:w-[55%] relative flex justify-center lg:justify-end order-1 lg:order-2 mt-4 lg:mt-0">
            <div className="w-[min(70vw,280px)] h-[min(80vw,320px)] sm:w-[420px] sm:h-[480px] lg:w-[540px] lg:h-[600px] relative z-10 mx-auto lg:mr-0">
               <div className="absolute inset-0 human-img-bg scale-110 -translate-x-6 -translate-y-8 lg:-translate-x-12 lg:-translate-y-12 opacity-90 transition-transform duration-700 hover:scale-105" />
               <img 
                 src={profile.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80'} 
                 alt={profile.name} 
                 className="absolute inset-0 w-full h-full object-cover human-img-mask shadow-2xl transition-transform duration-700 hover:scale-[1.02]" 
               />
               <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 lg:bottom-12 lg:right-12 w-14 h-14 md:w-16 md:h-16 bg-[#E2B746] text-[#123040] flex items-center justify-center shadow-xl z-20" style={{ borderRadius: '50% 50% 40% 60% / 60% 40% 60% 40%' }}>
                 <BadgeCheck size={32} strokeWidth={2} />
               </div>
            </div>
          </div>
          
        </section>

        {/* Bio / About */}
        {(profile.bio || profile.headline) && (
          <section className="relative w-full mt-12 md:mt-20 lg:mt-24 z-10 px-4 md:px-8">
            <div className="human-bio-surface absolute inset-0 -mx-4 md:-mx-8 scale-x-[1.02] -rotate-1 shadow-2xl" />
            
            <div className="relative z-10 max-w-6xl mx-auto py-8 md:py-16 flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-12 px-4 md:px-8">
              
              <div className="relative flex-1 text-center lg:text-left mt-6 lg:mt-0">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:-top-16 lg:-left-12 text-[#E2B746] font-serif text-[5rem] md:text-[10rem] leading-none select-none opacity-90">“</div>
                <h3 className="font-serif text-[#1B1D1B] text-2xl sm:text-3xl md:text-5xl lg:text-[4.5rem] leading-[1.05] tracking-tight relative z-10 max-w-3xl">
                  {profile.bio || profile.headline}
                </h3>
              </div>

              <div className="w-full lg:w-[40%] flex flex-col sm:flex-row lg:flex-row items-stretch gap-8 lg:border-l border-[#1B1D1B]/20 lg:pl-10 pt-4 lg:pt-0">
                <p className="font-sans text-[#1B1D1B] text-base md:text-lg leading-relaxed font-medium opacity-80 flex-1">
                  {profile.description || (profile.role && profile.company ? `${profile.role} at ${profile.company}. ` : '') + 'Creating impact and driving innovation across projects and teams.'}
                </p>
                
                <div className="sm:border-l border-[#1B1D1B]/20 sm:pl-8 flex flex-col justify-center sm:justify-end">
                  <div className="flex flex-col text-[#1B1D1B] text-[9px] md:text-[10px] uppercase tracking-[0.25em] font-bold gap-2 opacity-60">
                    <span>People</span>
                    <span>Ideas</span>
                    <span>Places</span>
                    <span>Possibilities</span>
                    <div className="w-6 h-[2px] bg-[#1B1D1B] mt-3"></div>
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* Metrics */}
        {profile.proofs && profile.proofs.length > 0 && (
          <section className="w-full max-w-5xl mx-auto px-6 mt-12 md:mt-24 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 relative z-10">
            {profile.proofs.slice(0,3).map((proof: any, i: number) => {
              const s = [
                { bg: '#E2B746', text: '#1B1D1B', cls: 'human-metric-1', icon: <Users size={32} strokeWidth={1.5} />, dec: 'chart' },
                { bg: '#A5AE89', text: '#1B1D1B', cls: 'human-metric-2', icon: <div className="flex -space-x-3"><div className="w-8 h-8 rounded-full border border-current opacity-60"></div><div className="w-8 h-8 rounded-full border border-current opacity-80"></div><div className="w-8 h-8 rounded-full border border-current"></div></div>, dec: 'dots' },
                { bg: '#BE5B42', text: '#F4EDDC', cls: 'human-metric-3', icon: <Eye size={32} strokeWidth={1.5} />, dec: 'wave' }
              ][i % 3];

              return (
                <div key={i} className={`${s.cls} p-5 md:p-6 flex flex-row items-center justify-between shadow-xl relative overflow-hidden transition-transform duration-300 hover:-translate-y-2`}>
                  <div className="flex flex-col justify-between h-full min-h-[60px] md:min-h-[80px] gap-4 md:gap-6">
                    <div className="opacity-80 scale-90 md:scale-100 origin-left">{s.icon}</div>
                    <div className="opacity-40">
                      {s.dec === 'chart' && (
                        <div className="flex items-end gap-1.5 h-6">
                          <div className="w-1.5 h-3 bg-current rounded-sm"></div>
                          <div className="w-1.5 h-6 bg-current rounded-sm"></div>
                          <div className="w-1.5 h-4 bg-current rounded-sm"></div>
                        </div>
                      )}
                      {s.dec === 'dots' && (
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 bg-current rounded-full"></div>
                          <div className="w-2.5 h-2.5 bg-current rounded-full"></div>
                          <div className="w-2.5 h-2.5 bg-current rounded-full opacity-40"></div>
                        </div>
                      )}
                      {s.dec === 'wave' && (
                        <svg width="32" height="12" viewBox="0 0 32 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 6C6 1 10 11 16 6C22 1 26 11 30 6"/></svg>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col text-left items-start ml-4 md:ml-6 flex-1 overflow-hidden">
                    <span className="font-serif text-[2rem] md:text-[2.75rem] font-bold tracking-tight leading-none mb-2 break-all">{proof.value}</span>
                    <span className="font-sans text-xs md:text-sm font-bold tracking-wide capitalize truncate w-full">{proof.title || proof.type}</span>
                    {proof.description && (
                      <span className="font-sans text-[10px] md:text-xs mt-2 opacity-80 max-w-[140px] leading-snug font-medium line-clamp-2">
                        {proof.description}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Social Links */}
        {profile.links && profile.links.length > 0 && (
          <section className="w-full max-w-3xl mx-auto px-6 mt-16 md:mt-24 relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 md:mb-10 border-b border-[#AEA997]/20 pb-3 md:pb-5">
              <h4 className="font-serif text-3xl md:text-4xl text-[#F4EDDC] font-bold mb-2 sm:mb-0">Official links</h4>
              <span className="font-sans text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-[#AEA997] font-bold opacity-70">
                Same humans. Different places.
              </span>
            </div>
            
            <div className="flex flex-col gap-4 md:gap-5">
              {profile.links.map((link: any, i: number) => {
                const style = [
                  { bg: '#EFE4CC', text: '#1B1D1B' },
                  { bg: '#C2C8B1', text: '#1B1D1B' },
                  { bg: '#E5C6BD', text: '#1B1D1B' }
                ][i % 3];

                return (
                  <a key={i} href={link.url} target="_blank" rel="noreferrer"
                     className="human-social-link flex items-center justify-between p-2 md:p-3 shadow-lg group"
                     style={{ backgroundColor: style.bg, color: style.text }}>
                    <div className="flex items-center gap-4 md:gap-5">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-white/60 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-[#1B1D1B]">
                        {getIcon(link.icon || link.label)}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-sans font-bold text-base md:text-lg tracking-tight">{link.label}</span>
                        <span className="font-sans text-[10px] md:text-xs opacity-70 font-medium truncate max-w-[180px] md:max-w-none mt-0.5">
                          {link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                        </span>
                      </div>
                    </div>
                    <div className="pr-3 md:pr-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                      <ArrowRight size={24} strokeWidth={1.5} />
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Footer / CTAs */}
      <footer className="relative mt-16 md:mt-24 pt-20 md:pt-24 pb-12 overflow-hidden w-full flex items-center min-h-[250px] md:min-h-[300px]">
        {/* Organic layered backgrounds */}
        <div className="absolute bottom-0 right-0 w-[85%] md:w-[70%] h-full bg-[#EFE4CC] human-footer-shape-1 z-0 shadow-2xl" />
        <div className="absolute bottom-0 left-0 w-[70%] md:w-[45%] h-[85%] bg-[#BE5B42] human-footer-shape-2 z-0 shadow-2xl" />
        <div className="absolute -bottom-16 -left-4 md:left-[5%] w-[50%] md:w-[28%] h-[60%] md:h-[50%] bg-[#123040] human-footer-shape-3 z-0 shadow-2xl" />

        <div className="relative z-10 w-full max-w-[1300px] mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-end gap-8 h-full pb-2">
          
          <div className="flex flex-col text-[9px] uppercase tracking-[0.25em] font-bold text-[#1B1D1B] opacity-50 leading-[2] hidden md:flex pb-2">
            Kinder<br/>People<br/>Braver<br/>Tomorrows<br/>
            <div className="w-8 h-[2px] bg-[#1B1D1B] mt-3"></div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full md:w-auto mx-auto md:ml-auto md:mr-8 z-10">
            <button 
              onClick={handleContact} 
              className="w-full sm:w-auto px-8 py-4 md:py-5 rounded-full border border-[#1B1D1B]/30 text-[#1B1D1B] font-sans font-bold flex items-center justify-center gap-3 hover:bg-white/10 hover:border-[#1B1D1B] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B1D1B]"
            >
              <Send size={20} strokeWidth={2} />
              Get in touch
            </button>
            <button 
              onClick={downloadVCard} 
              className="w-full sm:w-auto px-8 py-4 md:py-5 rounded-full bg-[#123040] text-[#F4EDDC] font-sans font-bold flex items-center justify-center gap-3 hover:bg-[#1a4358] hover:-translate-y-1 transition-all shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#1B1D1B]"
            >
              <Bookmark size={20} strokeWidth={2} />
              Save contact
            </button>
          </div>

          <div className="hidden lg:flex flex-col items-end gap-3 pb-2">
            <div className="flex gap-1.5">
              <div className="w-6 h-6 rounded-full bg-[#123040]"></div>
              <div className="w-6 h-6 rounded-full bg-[#E2B746]"></div>
              <div className="w-6 h-6 rounded-full bg-[#A5AE89]"></div>
              <div className="w-6 h-6 rounded-full bg-[#BE5B42]"></div>
            </div>
            <span className="font-sans text-[9px] uppercase tracking-[0.25em] font-bold text-[#1B1D1B] text-right mt-1">
              Better people<br/>brighter together.
            </span>
          </div>
          
        </div>
      </footer>

      {/* Mobile Menu Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#123040]/80 backdrop-blur-sm transition-opacity" onClick={() => setMenuOpen(false)}>
          <div 
            className="w-full max-w-sm bg-[#EFE4CC] h-full shadow-2xl flex flex-col p-8 md:p-12 transform transition-transform duration-300"
            style={{ borderRadius: '40px 0 0 40px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-end mb-16">
              <button 
                onClick={() => setMenuOpen(false)}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-[#1B1D1B]/10 text-[#1B1D1B] hover:bg-[#1B1D1B]/20 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1B1D1B]"
                aria-label="Close menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <nav className="flex flex-col gap-8 text-[#1B1D1B]">
              <a href="#" onClick={(e) => { e.preventDefault(); handleContact(); setMenuOpen(false); }} className="text-3xl font-serif hover:italic transition-all opacity-90 hover:opacity-100">Contact</a>
              <a href="#" onClick={(e) => { e.preventDefault(); downloadVCard(); setMenuOpen(false); }} className="text-3xl font-serif hover:italic transition-all opacity-90 hover:opacity-100">Save Profile</a>
              {profile.links && profile.links.length > 0 && (
                <div className="mt-12 pt-12 border-t border-[#1B1D1B]/10 flex flex-col gap-5">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40">Links</span>
                  {profile.links.map((l: any, i: number) => (
                    <a key={i} href={l.url} target="_blank" rel="noreferrer" className="font-sans font-bold text-lg hover:text-[#BE5B42] transition-colors">{l.label}</a>
                  ))}
                </div>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-[#1B1D1B] text-[#F4EDDC] text-sm font-sans font-bold tracking-wide rounded-full shadow-2xl transition-all duration-300 z-50 ${toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {toastMsg}
      </div>
      </div>
    </div>
  );
}


// --- 03 AGENCY --- //

function StudioTemplate({ profile }: any) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const nameParts = profile.name ? profile.name.split(' ') : [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  const contactEmail = profile.email || profile.socialHandles?.email || profile.socialHandles?.contactEmail || '';
  const proofs = profile.proofs || profile.proofPoints || profile.proof_points || [];

  const socialLinks = Object.entries(profile.socialHandles || {})
    .filter(([_, val]) => !!val)
    .map(([key, val]) => {
      const getUrl = (k: string, v: any) => {
        if (k === 'twitter' || k === 'x') return `https://x.com/${v}`;
        if (k === 'github') return `https://github.com/${v}`;
        if (k === 'linkedin') return `https://linkedin.com/in/${v}`;
        if (k === 'instagram') return `https://instagram.com/${v}`;
        if (k === 'dribbble') return `https://dribbble.com/${v}`;
        if (k === 'behance') return `https://behance.net/${v}`;
        if (k === 'youtube') return `https://youtube.com/@${v}`;
        return v;
      };
      return { label: key.charAt(0).toUpperCase() + key.slice(1), url: getUrl(key, val) };
    });

  const allLinks = [...(profile.links || []), ...socialLinks];

  const generateVCard = () => {
    let vcard = "BEGIN:VCARD\nVERSION:3.0\n";
    if (profile.name) vcard += `FN:${profile.name}\n`;
    if (profile.headline) vcard += `TITLE:${profile.headline}\n`;
    if (contactEmail) vcard += `EMAIL:${contactEmail}\n`;
    if (profile.phone) vcard += `TEL:${profile.phone}\n`;
    if (profile.location) vcard += `ADR:;;${profile.location};;;;\n`;
    if (profile.website || (profile.links && profile.links.length > 0)) {
       const url = profile.website || profile.links[0].url;
       vcard += `URL:${url}\n`;
    }
    vcard += "END:VCARD";
    
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${firstName || 'contact'}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasAboutData = profile.headline || profile.location || profile.focus || profile.interests || profile.expertise || profile.experience;
  const hasContactInfo = contactEmail || profile.phone || allLinks.length > 0;
  const hasHeroData = profile.name || profile.headline || profile.bio || profile.avatarUrl || profile.location || profile.availability || allLinks.length > 0;
  const hasMainData = hasHeroData || hasAboutData || (profile.projects && profile.projects.length > 0);
  
  return (
    <div className="min-h-screen w-full bg-[#EBE9E4] p-4 sm:p-6 md:p-12 lg:p-16 flex flex-col font-sans text-[#2C2E2A] selection:bg-[#8CA290] selection:text-white overflow-x-hidden">
      <div className="flex-1 w-full max-w-[1400px] mx-auto bg-[#F5F4F0] rounded-xl md:rounded-2xl border border-[#2C2E2A]/10 shadow-sm overflow-hidden flex flex-col relative">
        {/* Header */}
        <header className="w-full max-w-6xl mx-auto px-6 py-8 relative">
        <div className="flex justify-between items-center text-xs tracking-wider uppercase font-medium">
          <div className="flex items-center gap-3 relative z-20">
            {/* Logo mark */}
            <div className="w-5 h-5 flex flex-wrap gap-1">
              <div className="w-2 h-2 rounded-full bg-[#8CA290]"></div>
              <div className="w-2 h-2 rounded-full bg-[#2C2E2A]"></div>
              <div className="w-2 h-2 rounded-full bg-[#2C2E2A]"></div>
              <div className="w-2 h-2 rounded-full bg-[#8CA290]"></div>
            </div>
            {profile.name && <span>{profile.name}</span>}
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 z-20 relative">
            <a href="#profile" className="hover:opacity-60 transition-opacity">Profile</a>
            {hasAboutData && <a href="#about" className="hover:opacity-60 transition-opacity">About</a>}
            {profile.projects?.length > 0 && <a href="#work" className="hover:opacity-60 transition-opacity">Work</a>}
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="px-4 py-2 border border-[#2C2E2A] rounded-full hover:bg-[#2C2E2A] hover:text-[#F5F4F0] transition-colors flex items-center gap-2">
                Contact <span className="text-[10px]">↗</span>
              </a>
            )}
          </nav>

          {/* Mobile Nav Toggle */}
          <div className="md:hidden z-20 relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="px-4 py-2 border border-[#2C2E2A] rounded-full flex items-center gap-2"
            >
              {isMenuOpen ? 'Close' : 'Menu'}
            </button>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-6 bg-[#FCFBFA] border border-[#2C2E2A]/10 rounded-xl p-6 flex flex-col gap-4 text-xs tracking-wider uppercase font-medium shadow-sm relative z-10">
            <a href="#profile" onClick={() => setIsMenuOpen(false)} className="py-2 border-b border-[#2C2E2A]/10 hover:text-[#8CA290]">Profile</a>
            {hasAboutData && <a href="#about" onClick={() => setIsMenuOpen(false)} className="py-2 border-b border-[#2C2E2A]/10 hover:text-[#8CA290]">About</a>}
            {profile.projects?.length > 0 && <a href="#work" onClick={() => setIsMenuOpen(false)} className="py-2 border-b border-[#2C2E2A]/10 hover:text-[#8CA290]">Work</a>}
            {contactEmail && <a href={`mailto:${contactEmail}`} onClick={() => setIsMenuOpen(false)} className="py-2 hover:text-[#8CA290]">Contact ↗</a>}
          </div>
        )}
      </header>

      {hasMainData && (
        <main className="max-w-6xl mx-auto px-6 pb-24">
          {/* HERO */}
          {hasHeroData && (
          <section id="profile" className="py-12 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-24 items-center border-b border-[#2C2E2A]/10">
          
          {/* Left: Photograph */}
          {profile.avatarUrl && (
          <div className="md:col-span-5 relative group order-2 md:order-1">
             <div className="absolute inset-0 bg-[#8CA290] rounded-[2rem] rounded-tl-[10rem] rounded-br-[10rem] rotate-3 scale-105 opacity-20 transition-transform duration-700 group-hover:rotate-6"></div>
             <img 
               src={profile.avatarUrl} 
               alt={profile.name || "Profile Photograph"}
               className="relative w-full aspect-[4/5] object-cover rounded-[2rem] rounded-tl-[10rem] rounded-br-[10rem] border-2 border-[#2C2E2A]/10 shadow-sm transition-all duration-700 group-hover:scale-[1.02] group-hover:brightness-105"
             />
             {profile.location && <div className="absolute top-6 right-6 text-[10px] tracking-widest uppercase text-white mix-blend-difference font-medium">{profile.location}</div>}
          </div>
          )}

          {/* Right: Info */}
          <div className={`${profile.avatarUrl ? 'md:col-span-7' : 'md:col-span-12 max-w-4xl'} flex flex-col items-start order-1 md:order-2`}>
             
             {profile.name && (
               <h1 className="text-6xl md:text-8xl font-serif tracking-tight mb-4 text-[#1A1A1A]">
                  <span className="font-normal">{firstName}</span> <span className="italic text-[#8CA290]">{lastName}</span>
               </h1>
             )}
             
             {profile.headline && (
               <p className="text-xl md:text-2xl font-serif text-[#555] mb-6">
                 {profile.headline}
               </p>
             )}
             
             {profile.bio && (
               <p className="text-base text-[#666] leading-relaxed max-w-md mb-10">
                 {profile.bio}
               </p>
             )}

             {/* Metadata */}
             {(profile.location || profile.availability) && (
               <div className="flex flex-wrap gap-4 text-[10px] tracking-widest uppercase text-[#555] mb-8 font-medium">
                 {profile.location && <span>{profile.location}</span>}
                 {profile.location && profile.availability && <span>·</span>}
                 {profile.availability && <span>{profile.availability}</span>}
               </div>
             )}

             {/* Status */}
             {profile.availability && (
               <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#2C2E2A]/10 rounded-full text-[10px] uppercase tracking-wider mb-12 bg-white/50 shadow-sm">
                 <span className="w-2 h-2 rounded-full bg-[#8CA290] animate-pulse"></span>
                 {profile.availability}
               </div>
             )}

             {/* Social Links */}
             {allLinks.length > 0 && (
               <div className="w-full border border-[#2C2E2A]/10 p-6 md:p-8 bg-[#FCFBFA] relative">
                 <div className="text-[10px] tracking-widest uppercase text-[#888] mb-6 font-medium">Find me online</div>
                 <div className="flex flex-wrap gap-x-8 gap-y-4">
                   {allLinks.map((link: any, i: number) => (
                     <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium border-b border-[#2C2E2A]/20 pb-1 hover:border-[#2C2E2A] transition-colors flex items-center gap-1 group">
                       {link.label}
                       <span className="text-[10px] text-[#888] group-hover:text-[#2C2E2A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">↗</span>
                     </a>
                   ))}
                 </div>
               </div>
             )}
          </div>
        </section>
        )}



        {/* ABOUT */}
        {hasAboutData && (
          <section id="about" className="py-12 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-12 border-b border-[#2C2E2A]/10">
            
            <div className="md:col-span-6 flex flex-col">
              <div className="flex items-center gap-4 mb-12">
                  <div className="w-6 h-[1px] bg-[#2C2E2A]"></div>
                  <span className="text-[10px] tracking-widest uppercase font-bold">About</span>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-serif tracking-tight leading-tight mb-8">
                Designing with a <br/><span className="italic text-[#8CA290]">little more</span> attention.
              </h2>
              
              {profile.bio && (
                <p className="text-base text-[#555] leading-relaxed max-w-md">
                  {profile.bio}
                </p>
              )}
            </div>
            
            <div className="md:col-span-6 flex flex-col justify-start pt-12 md:pt-0">
               <div className="text-right text-[10px] tracking-widest uppercase text-[#888] mb-12 font-medium hidden md:block">02</div>
               
               <div className="w-full">
                 {profile.headline && (
                   <div className="grid grid-cols-[1fr_2fr] py-4 border-b border-[#2C2E2A]/10 text-xs">
                     <span className="text-[#888] tracking-widest uppercase">Role</span>
                     <span className="font-medium">{profile.headline}</span>
                   </div>
                 )}
                 {profile.location && (
                   <div className="grid grid-cols-[1fr_2fr] py-4 border-b border-[#2C2E2A]/10 text-xs">
                     <span className="text-[#888] tracking-widest uppercase">Based In</span>
                     <span className="font-medium">{profile.location}</span>
                   </div>
                 )}
                 {profile.focus && (
                   <div className="grid grid-cols-[1fr_2fr] py-4 border-b border-[#2C2E2A]/10 text-xs">
                     <span className="text-[#888] tracking-widest uppercase">Focus</span>
                     <span className="font-medium">{profile.focus}</span>
                   </div>
                 )}
                 {profile.interests && (
                   <div className="grid grid-cols-[1fr_2fr] py-4 border-b border-[#2C2E2A]/10 text-xs">
                     <span className="text-[#888] tracking-widest uppercase">Interests</span>
                     <span className="font-medium">{profile.interests}</span>
                   </div>
                 )}
               </div>

               {(profile.expertise?.length > 0 || profile.experience?.length > 0) && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                   {profile.expertise?.length > 0 && (
                     <div>
                        <div className="text-[10px] tracking-widest uppercase text-[#888] mb-4">Expertise</div>
                        <div className="flex flex-wrap gap-2">
                          {profile.expertise.map((skill: string) => (
                            <span key={skill} className="px-3 py-1 text-[10px] border border-[#2C2E2A]/20 rounded-full">{skill}</span>
                          ))}
                        </div>
                     </div>
                   )}
                   {profile.experience?.length > 0 && (
                     <div>
                        <div className="text-[10px] tracking-widest uppercase text-[#888] mb-4">Experience</div>
                        <div className="text-xs space-y-2 text-[#555] leading-relaxed">
                           {profile.experience.map((exp: any, i: number) => (
                             <div key={i}><span className="font-medium text-[#2C2E2A]">{exp.year || exp.date} /</span> {exp.company || exp.role}</div>
                           ))}
                        </div>
                     </div>
                   )}
                 </div>
               )}
            </div>
          </section>
        )}

        {/* PROOF POINTS */}
        {(() => {
          const validProofs = proofs.filter((p: any) => p.value && (p.title || p.label));
          if (validProofs.length === 0) return null;
          
          return (
            <section id="proof-points" className="py-16 md:py-24 border-b border-[#2C2E2A]/10">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16">
                 {validProofs.map((proof: any, i: number) => (
                   <div key={i} className="flex items-start gap-6">
                     <span className="text-[10px] tracking-widest text-[#888] w-6 shrink-0 pt-3 font-medium">
                       {(i + 1).toString().padStart(2, '0')}
                     </span>
                     <div className="flex flex-col">
                       <div className="text-4xl md:text-5xl font-serif text-[#1A1A1A] mb-3">{proof.value}</div>
                       <div className="text-xs uppercase tracking-widest text-[#555] font-medium leading-relaxed">{proof.title || proof.label}</div>
                     </div>
                   </div>
                 ))}
               </div>
            </section>
          );
        })()}

        {/* WORK */}
        {profile.projects?.length > 0 && (
          <section id="work" className="py-16 md:py-32 border-b border-[#2C2E2A]/10">
             <div className="flex justify-between items-start mb-16">
                <div>
                  <div className="flex items-center gap-4 mb-8">
                      <div className="w-6 h-[1px] bg-[#2C2E2A]"></div>
                      <span className="text-[10px] tracking-widest uppercase font-bold">Selected Work</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-serif tracking-tight leading-tight">
                    A few things <br/><span className="italic text-[#8CA290]">made with care.</span>
                  </h2>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="text-[10px] tracking-widest uppercase text-[#888] mb-8 font-medium">03</div>
                </div>
             </div>

             <div className="space-y-4">
               {profile.projects.map((project: any, i: number) => (
                 <a key={i} href={project.url || '#'} className="group flex flex-col md:flex-row items-start md:items-center py-6 md:py-4 px-4 border border-transparent hover:border-[#2C2E2A]/10 hover:bg-[#FCFBFA] transition-all rounded-lg gap-6">
                   <span className="text-[10px] tracking-widest text-[#888] w-6 shrink-0">{(i + 1).toString().padStart(2, '0')}</span>
                   <div className="w-16 h-12 rounded bg-[#8CA290]/20 shrink-0 overflow-hidden relative flex items-center justify-center">
                     {project.imageUrl ? (
                       <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-6 h-6 border border-[#8CA290]/50 rounded-full"></div>
                     )}
                   </div>
                   <div className="flex-1">
                     <h3 className="text-lg font-serif mb-1 group-hover:text-[#8CA290] transition-colors">{project.title}</h3>
                     {project.description && <p className="text-xs text-[#666]">{project.description}</p>}
                   </div>
                   <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0">
                     {(project.year || project.category) && (
                       <span className="text-[10px] tracking-widest text-[#888] uppercase">
                         {[project.year, project.category].filter(Boolean).join(' · ')}
                       </span>
                     )}
                     <span className="text-[#2C2E2A] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">↗</span>
                   </div>
                 </a>
               ))}
             </div>
          </section>
        )}
      </main>
      )}

      {/* CONTACT FOOTER */}
      <footer id="contact" className="w-full bg-[#8CA290] text-[#F5F4F0] px-6 py-16 md:py-24 relative overflow-hidden mt-auto">
         {/* Decorative circle graphic */}
         <div className="absolute right-0 md:right-[20%] top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
            <div className="w-48 h-48 md:w-96 md:h-96 rounded-full border-[1px] border-[#F5F4F0] flex items-center justify-center">
               <div className="w-full h-px bg-[#F5F4F0] -rotate-45 absolute"></div>
               <div className="w-full h-px bg-[#F5F4F0] rotate-45 absolute"></div>
            </div>
         </div>

         <div className="max-w-6xl mx-auto relative z-10">
            <div className="flex justify-between items-start mb-12">
              <div className="flex items-center gap-4 text-[#F5F4F0]/80">
                  <div className="w-6 h-[1px] bg-[#F5F4F0]/80"></div>
                  <span className="text-[10px] tracking-widest uppercase font-bold">Get In Touch</span>
              </div>
              <div className="text-[10px] tracking-widest uppercase text-[#F5F4F0]/60 font-medium">04</div>
            </div>

            <h2 className="text-5xl md:text-7xl font-serif tracking-tight leading-tight mb-12 text-white">
              Let's make something<br/><span className="italic text-white">useful.</span>
            </h2>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="inline-flex items-center justify-center gap-3 bg-[#2C2E2A] text-[#F5F4F0] px-8 py-5 text-xs font-bold uppercase tracking-widest hover:bg-[#1A1A1A] transition-colors group rounded-sm w-full sm:w-auto">
                  WRITE TO {profile.name ? profile.name.toUpperCase() : 'ME'}
                  <span className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">↗</span>
                </a>
              )}
              
              <button onClick={generateVCard} className="inline-flex items-center justify-center px-6 py-5 border border-[#F5F4F0]/30 text-[#F5F4F0] hover:bg-[#F5F4F0]/10 text-xs font-bold uppercase tracking-widest transition-colors rounded-sm w-full sm:w-auto">
                + SAVE CONTACT
              </button>
            </div>

              <div className="mt-24 pt-8 border-t border-[#F5F4F0]/20 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] tracking-widest uppercase text-[#F5F4F0]/80">
                <span>© {new Date().getFullYear()}{profile.name ? ` / ${profile.name}` : ''}</span>
                <a href="#" className="hover:text-[#F5F4F0] transition-colors">Back to top ↑</a>
              </div>
           </div>
        </footer>
      </div>
    </div>
  );
}

function MachineTemplate({ profile, accentColor }: any) {
  const accent = accentColor || '#10B981';
  return (
    <div className="min-h-screen w-full bg-[#09090B] text-zinc-400 p-6 font-mono text-sm grid place-items-center">
      <div className="max-w-5xl w-full border border-zinc-800 bg-zinc-950 p-1 md:p-8 rounded-lg shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-500 to-transparent opacity-20" />
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="md:col-span-1 border border-zinc-800 p-4 rounded flex flex-col items-center text-center">
            <img src={profile.avatarUrl} alt={profile.name} className="w-24 h-24 mb-4 rounded border border-zinc-800 grayscale" />
            <h1 className="text-white font-bold text-lg mb-1">{profile.name}</h1>
            <Badge text="ACTIVE" accent={accent} />
          </div>
          
          <div className="md:col-span-3 grid grid-cols-2 gap-4">
             <div className="border border-zinc-800 p-4 rounded flex flex-col justify-between">
               <span className="text-zinc-600 mb-2 block">SYS.OBJECTIVE</span>
               <span className="text-zinc-200">{profile.headline}</span>
             </div>
             <div className="border border-zinc-800 p-4 rounded flex flex-col justify-between">
               <span className="text-zinc-600 mb-2 block">SYS.DIAGNOSIS</span>
               <span className="text-zinc-400 text-xs">{profile.bio}</span>
             </div>
          </div>
        </div>

        <div className="border border-zinc-800 rounded mb-4">
          <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex justify-between text-xs">
            <span>[ MODULES ( {profile.links?.length} ) ]</span>
            <span style={{ color: accent }}>● ROUTING OK</span>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.links?.map((link: any, i: number) => (
              <a key={i} href={link.url} className="border border-zinc-800 p-4 hover:border-zinc-500 transition-colors bg-black rounded relative group">
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-green-500" />
                <span className="text-zinc-600 text-[10px] mb-2 block">MOD_{i.toString().padStart(3, '0')}</span>
                <span className="text-zinc-200 block truncate">{link.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ text, accent }: { text: string; accent: string }) {
  return (
    <div className="px-2 py-0.5 rounded text-[10px] uppercase font-bold flex items-center gap-1.5 border" style={{ borderColor: accent, color: accent, backgroundColor: `${accent}15` }}>
      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
      {text}
    </div>
  )
}

// --- THE CLUB PROFILE TEMPLATE HELPER & COMPREHENSIVE BRAND ICON REGISTRY --- //

// Centralized Brand SVG Icon Registry for The Club
const CLUB_BRAND_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  github: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  ),
  hackerrank: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0a12 12 0 0 0-3.39.49 11.9 11.9 0 0 0-7.85 7.85A12 12 0 0 0 0 12a12 12 0 0 0 .76 4.22 11.94 11.94 0 0 0 7.02 7.02A12 12 0 0 0 12 24a12 12 0 0 0 4.22-.76 11.94 11.94 0 0 0 7.02-7.02A12 12 0 0 0 24 12a12 12 0 0 0-.76-4.22 11.94 11.94 0 0 0-7.02-7.02A12 12 0 0 0 12 0zm3.93 17.14h-2.31v-4.11H10.38v4.11H8.07V6.86h2.31v4.17h3.24V6.86h2.31v10.28z" />
    </svg>
  ),
  linkedin: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.67 1.67 0 1 0 0-3.34 1.67 1.67 0 0 0 0 3.34M7.86 18.5V10.13H5.07V18.5h2.79z" />
    </svg>
  ),
  instagram: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  youtube: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  x: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  twitter: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  facebook: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  tiktok: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.77 1.81-.05 3.3-1.61 3.32-3.42V.02z" />
    </svg>
  ),
  threads: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.186 24h-.007C5.46 23.978 0 18.636 0 12.04 0 5.404 5.485.02 12.186.02c6.64 0 11.97 5.285 11.812 11.8-.13 5.378-3.79 9.87-8.91 10.932-.516.107-.99-.214-1.078-.727-.087-.514.22-.99.734-1.096 4.354-.903 7.464-4.73 7.575-9.3.136-5.59-4.397-10.15-10.133-10.15C6.47 1.48 1.74 6.22 1.74 12.04c0 5.765 4.7 10.457 10.447 10.476 2.83.01 5.474-1.074 7.447-3.05a.87.87 0 0 1 1.23 1.23c-2.31 2.313-5.388 3.58-8.678 3.304zm-1.847-7.234c-2.09-.08-4.043-1.47-4.043-3.924 0-2.32 1.93-3.856 4.336-3.856 2.378 0 4.092 1.34 4.092 3.658 0 .84-.214 1.61-.636 2.29-.44.7-1.09 1.15-1.92 1.32-.42.08-.85.12-1.28.12-.183 0-.365-.01-.549-.03zm.28-6.19c-1.5 0-2.63.93-2.63 2.27 0 1.43 1.13 2.36 2.45 2.41.13.01.27.01.4 0 .54-.06.97-.33 1.27-.8.29-.46.44-.99.44-1.57 0-1.42-1.03-2.31-2.33-2.31z" />
    </svg>
  ),
  discord: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  ),
  reddit: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.612a1.24 1.24 0 0 1 1.108-.702zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.095.327.327 0 0 0 0 .462c.969.969 2.525.969 3.494 0a.327.327 0 0 0 0-.462.327.327 0 0 0-.462 0c-.714.714-1.856.714-2.57 0a.327.327 0 0 0-.231-.095z" />
    </svg>
  ),
  pinterest: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0a12 12 0 0 0-4.37 23.18c-.06-.99-.1-2.52.21-3.6.28-.97 1.83-6.22 1.83-6.22s-.47-.94-.47-2.33c0-2.18 1.26-3.81 2.84-3.81 1.34 0 1.99 1.01 1.99 2.22 0 1.35-.86 3.37-1.3 5.24-.37 1.57.79 2.85 2.34 2.85 2.81 0 4.97-2.96 4.97-7.23 0-3.78-2.72-6.42-6.6-6.42-4.5 0-7.14 3.38-7.14 6.86 0 1.36.52 2.82 1.18 3.61.13.16.15.3.11.46-.12.51-.39 1.58-.44 1.8-.07.29-.23.35-.53.21-1.98-.92-3.22-3.81-3.22-6.13 0-4.99 3.63-9.58 10.46-9.58 5.5 0 9.77 3.92 9.77 9.15 0 5.46-3.44 9.86-8.22 9.86-1.61 0-3.12-.84-3.64-1.83l-.99 3.77c-.36 1.38-1.33 3.11-1.98 4.16A12 12 0 1 0 12 0z" />
    </svg>
  ),
  behance: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 7h-7v2h7V7zm1.726 10c-.442 1.297-2.029 3-4.976 3-3.401 0-5.75-2.292-5.75-6 0-3.52 2.366-6 5.625-6 3.424 0 5.248 2.388 4.938 5.75h-7.85c.088 1.636 1.037 2.656 2.537 2.656 1.487 0 2.195-.898 2.476-1.406H23.726zM15.713 12h5.188c-.088-1.25-.841-2.25-2.525-2.25-1.57 0-2.451.957-2.663 2.25zM8.307 10.828c.954-.44 1.443-1.277 1.443-2.316 0-2.297-1.889-3.512-4.664-3.512H0v14h5.457c3.12 0 4.993-1.488 4.993-3.898 0-1.742-1.002-3.578-2.143-4.274zM2.871 7.4h2.158c1.336 0 2.08.57 2.08 1.602 0 .977-.732 1.59-2.08 1.59H2.871V7.4zm2.348 9.2H2.871v-3.793h2.387c1.551 0 2.398.715 2.398 1.898 0 1.258-.887 1.895-2.437 1.895z" />
    </svg>
  ),
  dribbble: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.118-10.424c-.389-.12-2.787-.84-5.617-.384.887 2.438 1.247 4.5 1.343 5.111 2.508-1.127 4.274-3.515 4.274-6.327v-.4zm-5.785 6.012c-.12-.768-.504-2.892-1.428-5.351-.048.012-.096.024-.144.036-6.192 1.944-8.411 5.832-8.543 6.072 1.584 1.092 3.492 1.74 5.556 1.74 1.668 0 3.228-.432 4.559-1.497zm-11.231-.768c.24-.396 2.64-4.2 8.687-6.036.192-.06.384-.108.576-.156-.372-.828-.78-1.644-1.224-2.436-5.064 1.524-9.924 1.524-10.428 1.524-.012.216-.012.432-.012.66 0 2.508.972 4.8 2.401 6.444zm-3.085-8.496c.72-.012 4.968-.072 9.84-1.464-1.572-2.796-3.276-5.184-3.528-5.532-3.132 1.344-5.4 4.176-6.312 7zm8.136-7.8c.264.36 1.956 2.724 3.516 5.484 2.928-.792 5.568-.78 5.868-.768A9.974 9.974 0 0012 2.016c-.66 0-1.308.06-1.86.108zm10.74 6.372c-.444-.012-3.216-.024-6.3 1.008.384.744.732 1.512 1.056 2.292 2.724-.396 5.088.192 5.376.264.084-.696.12-1.392.12-2.1 0-.504-.072-1-.252-1.464z" />
    </svg>
  ),
  medium: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
    </svg>
  ),
  telegram: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.56 8.16l-1.97 9.28c-.15.65-.53.81-1.08.5l-3-2.21-1.45 1.4c-.16.16-.3.3-.61.3l.21-3.05 5.56-5.02c.24-.22-.05-.34-.38-.13l-6.87 4.33-2.96-.92c-.64-.2-.66-.64.13-.95l11.57-4.46c.54-.19 1.01.13.85.93z" />
    </svg>
  ),
  whatsapp: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.507 14.307l-.009.075c-.338.905-1.488 1.632-2.38 1.777-.635.103-1.456.186-4.275-.98-3.606-1.492-5.918-5.187-6.096-5.426-.174-.238-1.442-1.921-1.442-3.666 0-1.746.913-2.604 1.238-2.962.325-.357.708-.447.944-.447.235 0 .47.002.677.012.219.01.512-.083.8.61.302.729 1.033 2.518 1.122 2.7.09.182.15.395.03.633-.12.238-.18.386-.357.595-.178.209-.373.467-.533.627-.178.178-.363.372-.156.729.208.356.924 1.524 1.984 2.47 1.365 1.217 2.515 1.594 2.871 1.772.357.178.566.149.774-.09.208-.238.89-1.039 1.127-1.396.238-.356.475-.297.8-.178.326.119 2.073.978 2.43 1.157.356.178.593.267.682.416.089.149.089.86-.249 1.765zM12 0C5.373 0 0 5.373 0 12c0 2.115.548 4.103 1.51 5.834L0 24l6.335-1.464A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  ),
  gitlab: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="m23.6 9.59-1.12-3.45a.94.94 0 0 0-1.79 0l-1.12 3.45H4.43L3.31 6.14a.94.94 0 0 0-1.79 0L.4 9.59a1.64 1.64 0 0 0 .6 1.83L12 19.43l11-8.01a1.64 1.64 0 0 0 .6-1.83z" />
    </svg>
  ),
  stackoverflow: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.986 21.865v-6.404h2.134V24H2.69v-8.539h2.13v6.404h14.166zM6.11 19.782h11.633v-2.14H6.11v2.14zm.648-5.326l11.236 2.443.468-2.094-11.236-2.443-.468 2.094zm2.148-5.275l9.96 6.07 1.094-1.844-9.96-6.07-1.094 1.844zm4.444-5.367l7.636 8.79 1.63-1.41-7.636-8.79-1.63 1.41zM18.156 0l-1.92 1.01 5.56 10.23 1.92-1.01L18.156 0z" />
    </svg>
  ),
  kaggle: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.825 23.859c-.022.08-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.183c0 .235-.117.379-.352.379H5.093c-.235 0-.352-.144-.352-.379V.379c0-.235.117-.379.352-.379h2.842c.235 0 .352.144.352.379v14.73l6.398-6.398c.141-.141.293-.211.457-.211h3.338c.164 0 .258.07.281.211.023.164-.035.281-.176.352l-6.867 6.648 7.336 7.641c.141.117.187.246.164.357z" />
    </svg>
  ),
  codepen: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="m23.6 7.42-11-7.33a1.08 1.08 0 0 0-1.2 0l-11 7.33A1.08 1.08 0 0 0 0 8.32v7.36a1.08 1.08 0 0 0 .4.9l11 7.33a1.08 1.08 0 0 0 1.2 0l11-7.33a1.08 1.08 0 0 0 .4-.9V8.32a1.08 1.08 0 0 0-.4-.9zM12 2.45l8.53 5.69-3.81 2.54L12 7.55 7.28 10.68 3.47 8.14zm-1.09 7.91 2.18 1.45v4.38l-2.18-1.45zm-8.73 3.55v-3.7l3.27 2.18-3.27 2.18v-.66zm9.82 7.64L3.47 15.86l3.81-2.54 4.72 3.13 4.72-3.13 3.81 2.54zm2.18-5.46-2.18 1.45v-4.38l2.18-1.45zm7.64-2.18-3.27-2.18 3.27-2.18v4.36z" />
    </svg>
  ),
  devto: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7.42 10.05c-.18-.12-.46-.17-.84-.17H5.21v4.24h1.37c.38 0 .66-.05.84-.16.18-.11.32-.28.41-.53.09-.24.14-.58.14-1.02v-.83c0-.45-.05-.79-.14-1.03-.09-.24-.23-.4-.41-.5zm14.39-7.86H2.19C.98 2.19 0 3.17 0 4.38v15.24c0 1.21.98 2.19 2.19 2.19h19.62c1.21 0 2.19-.98 2.19-2.19V4.38c0-1.21-.98-2.19-2.19-2.19zm-13.62 13h-4.4V8.81h4.4c.83 0 1.5.15 2.01.44.51.3.89.74 1.14 1.33.25.59.38 1.34.38 2.25v.34c0 .91-.13 1.66-.38 2.25-.25.59-.63 1.03-1.14 1.33-.51.29-1.18.44-2.01.44zm6.05 0h-3.41V8.81h3.41v1.17h-2.13v1.88h1.89v1.17h-1.89v1.88h2.13v1.28zm5.72-3.92-1.63 3.92h-1.45l-1.63-3.92V17.3h-1.28V8.81h1.7l1.94 4.67 1.94-4.67h1.7v8.49h-1.28v-4.08z" />
    </svg>
  ),
  producthunt: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm-1.33 16.5H8V7.5h4c2.21 0 4 1.79 4 4s-1.79 4-4 4h-1.33v1zM10.67 10h1.33c.74 0 1.33.6 1.33 1.33s-.6 1.33-1.33 1.33h-1.33V10z" />
    </svg>
  ),
  notion: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.737c-.466-.373-.886-.466-2.006-.373L2.64 2.39c-.42.047-.513.28-.327.466l2.146 1.352zm-.513 4.292v11.755c0 .7.373.933 1.166.886l14.288-.84c.793-.046.98-.466.98-1.073V7.52c0-.653-.233-.886-.84-.84l-14.754.886c-.606.047-.84.28-.84.934zm13.355.7c.093.42 0 .84-.42.887l-.793.14v7.79c-.56.327-1.12.513-1.586.513-.747 0-.98-.233-1.54-.933l-4.572-7.185v6.998l1.4.327s0 .84-.98.84l-3.08.187c-.093-.233 0-.7.374-.793l.886-.233V10.23l-1.213-.093c-.093-.42.14-.98.7-.98l3.36-.233 4.759 7.325V9.763l-1.166-.14c-.093-.467.233-.84.7-.84l3.172-.187z" />
    </svg>
  ),
  // Website: Clean globe with latitude/longitude meridians (ONLY for actual website!)
  website: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  // Newsletter: Clean postal envelope
  newsletter: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  // Email: Mail envelope
  email: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  // Neutral Generic External Link / Social Icon Fallback (Used when platform is unknown — NEVER the globe!)
  generic: ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
};

// Automatic Platform Resolution Layer
function normalizeSocialPlatformKey(label?: string, href?: string, explicitIcon?: string): string {
  // 1. Explicit icon property
  if (explicitIcon) {
    const norm = explicitIcon.toLowerCase().trim();
    if (CLUB_BRAND_ICONS[norm]) return norm;
    if (norm === 'twitter') return 'x';
    if (norm === 'substack') return 'newsletter';
    if (norm === 'mail') return 'email';
    if (norm === 'web' || norm === 'site') return 'website';
  }

  // 2. Normalized label check
  if (label) {
    const l = label.toLowerCase().trim();
    if (l === 'github' || l.includes('github')) return 'github';
    if (l === 'hackerrank' || l.includes('hackerrank') || l.includes('hacker rank')) return 'hackerrank';
    if (l === 'linkedin' || l.includes('linkedin')) return 'linkedin';
    if (l === 'instagram' || l.includes('instagram') || l.includes('insta')) return 'instagram';
    if (l === 'youtube' || l.includes('youtube') || l.includes('yt')) return 'youtube';
    if (l === 'x' || l === 'twitter' || l.includes('twitter') || l.includes('x.com')) return 'x';
    if (l === 'facebook' || l.includes('facebook') || l.includes('fb')) return 'facebook';
    if (l === 'tiktok' || l.includes('tiktok')) return 'tiktok';
    if (l === 'threads' || l.includes('threads')) return 'threads';
    if (l === 'discord' || l.includes('discord')) return 'discord';
    if (l === 'reddit' || l.includes('reddit')) return 'reddit';
    if (l === 'pinterest' || l.includes('pinterest')) return 'pinterest';
    if (l === 'behance' || l.includes('behance')) return 'behance';
    if (l === 'dribbble' || l.includes('dribbble')) return 'dribbble';
    if (l === 'medium' || l.includes('medium')) return 'medium';
    if (l === 'telegram' || l.includes('telegram') || l.includes('t.me')) return 'telegram';
    if (l === 'whatsapp' || l.includes('whatsapp') || l.includes('wa.me')) return 'whatsapp';
    if (l === 'gitlab' || l.includes('gitlab')) return 'gitlab';
    if (l === 'stackoverflow' || l.includes('stack overflow') || l.includes('stackoverflow')) return 'stackoverflow';
    if (l === 'kaggle' || l.includes('kaggle')) return 'kaggle';
    if (l === 'codepen' || l.includes('codepen')) return 'codepen';
    if (l === 'dev.to' || l === 'devto' || l.includes('dev.to') || l.includes('devto')) return 'devto';
    if (l === 'producthunt' || l.includes('product hunt') || l.includes('producthunt')) return 'producthunt';
    if (l === 'notion' || l.includes('notion')) return 'notion';
    if (l === 'newsletter' || l.includes('newsletter') || l.includes('substack')) return 'newsletter';
    if (l === 'email' || l === 'mail' || l.includes('email') || l.includes('contact')) return 'email';
    if (l === 'website' || l === 'personal website' || l === 'portfolio' || l === 'home') return 'website';
  }

  // 3. URL hostname / domain check
  if (href) {
    try {
      const urlStr = href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') ? href : `https://${href}`;
      if (urlStr.startsWith('mailto:')) return 'email';
      const hostname = new URL(urlStr).hostname.toLowerCase();
      if (hostname.includes('github.com')) return 'github';
      if (hostname.includes('hackerrank.com')) return 'hackerrank';
      if (hostname.includes('linkedin.com')) return 'linkedin';
      if (hostname.includes('instagram.com')) return 'instagram';
      if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) return 'youtube';
      if (hostname.includes('x.com') || hostname.includes('twitter.com')) return 'x';
      if (hostname.includes('facebook.com') || hostname.includes('fb.com')) return 'facebook';
      if (hostname.includes('tiktok.com')) return 'tiktok';
      if (hostname.includes('threads.net')) return 'threads';
      if (hostname.includes('discord.com') || hostname.includes('discord.gg')) return 'discord';
      if (hostname.includes('reddit.com')) return 'reddit';
      if (hostname.includes('pinterest.com')) return 'pinterest';
      if (hostname.includes('behance.net')) return 'behance';
      if (hostname.includes('dribbble.com')) return 'dribbble';
      if (hostname.includes('medium.com')) return 'medium';
      if (hostname.includes('t.me') || hostname.includes('telegram.org')) return 'telegram';
      if (hostname.includes('wa.me') || hostname.includes('whatsapp.com')) return 'whatsapp';
      if (hostname.includes('gitlab.com')) return 'gitlab';
      if (hostname.includes('stackoverflow.com')) return 'stackoverflow';
      if (hostname.includes('kaggle.com')) return 'kaggle';
      if (hostname.includes('codepen.io')) return 'codepen';
      if (hostname.includes('dev.to')) return 'devto';
      if (hostname.includes('producthunt.com')) return 'producthunt';
      if (hostname.includes('notion.so') || hostname.includes('notion.site')) return 'notion';
      if (hostname.includes('substack.com')) return 'newsletter';
    } catch {
      // not a standard URL string
    }
  }

  // 4. Strict check for Website (only when actually Website)
  if (label && (label.toLowerCase().trim() === 'website' || label.toLowerCase().trim() === 'web')) {
    return 'website';
  }

  // 5. Fallback is neutral link icon (NEVER globe!)
  return 'generic';
}

function renderClubSocialIcon(platformKey: string, className = 'w-4 h-4') {
  const IconComponent = CLUB_BRAND_ICONS[platformKey] || CLUB_BRAND_ICONS['generic'];
  return <IconComponent className={className} />;
}

function ClubArrowUpRightIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="12" x2="12" y2="4" />
      <polyline points="5 4 12 4 12 11" />
    </svg>
  );
}

function ClubArrowUpIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="8" y1="13" x2="8" y2="3" />
      <polyline points="4 7 8 3 12 7" />
    </svg>
  );
}

export function ClubTemplate({ profile, accentColor, onLinkClick, isPreview, data: directData }: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  // Compute profile data strictly from real input (no fake hardcoded values)
  const clubData = useMemo(() => {
    const rawName = (directData?.name || profile?.name || '').trim();
    const nameParts = rawName ? rawName.split(/\s+/) : ['The', 'Club'];
    const nameLineOne = directData?.nameLineOne || nameParts[0] || 'The';
    const nameLineTwo = directData?.nameLineTwo !== undefined 
      ? directData.nameLineTwo 
      : (nameParts.slice(1).join(' ') || (nameParts.length === 1 ? '' : ''));

    const initial = directData?.initial || (nameLineOne ? nameLineOne.charAt(0).toUpperCase() : 'C');
    const monogram = directData?.monogram || (nameLineOne.charAt(0) + (nameLineTwo ? nameLineTwo.charAt(0) : '')).toUpperCase() || 'TC';

    // Role and Category / Kicker resolution
    const role = directData?.role !== undefined 
      ? directData.role 
      : (profile?.role || profile?.headline || null);

    // Kicker / Category resolution: NEVER promote company name to category!
    let identityKicker: string | null = null;
    if (directData?.category) {
      identityKicker = directData.category;
    } else if ((profile as any)?.category) {
      const cat = (profile as any).category;
      const comp = profile?.company || (profile as any)?.employer || (profile as any)?.organization;
      if (!comp || cat.trim().toLowerCase() !== comp.trim().toLowerCase()) {
        identityKicker = cat;
      } else if (role) {
        identityKicker = role;
      }
    } else if (role) {
      identityKicker = role;
    }

    const bio = directData?.bio !== undefined ? directData.bio : (profile?.bio || '');

    // Location & Availability: NEVER hardcode or default to fake values like Mumbai, India
    const location = directData?.location !== undefined 
      ? directData.location 
      : (profile?.location || null);

    const availability = directData?.availability !== undefined 
      ? directData.availability 
      : (profile?.availability || null);

    const established = directData?.established !== undefined 
      ? directData.established 
      : (profile?.established || null);

    const edition = directData?.edition || '01';

    // Social links extraction with brand detection
    const socialList: Array<{ platform: string; label: string; sublabel?: string; url: string; icon?: string }> = [];

    if (directData?.socials && directData.socials.length > 0) {
      directData.socials.forEach((s: any, idx: number) => {
        if (s && (s.url || s.href)) {
          const url = s.url || s.href;
          const explicitIcon = s.icon;
          const label = s.label || s.title || s.name || 'LINK';
          const resolvedPlatform = normalizeSocialPlatformKey(label, url, explicitIcon);
          socialList.push({
            platform: resolvedPlatform,
            label: label.toUpperCase(),
            sublabel: s.sublabel || `SOCIAL / 0${idx + 1}`,
            url,
            icon: explicitIcon || resolvedPlatform,
          });
        }
      });
    } else {
      const rawLinks = profile?.socials || profile?.links || [];
      const links = (rawLinks || []).filter((l: any) => l && (l.url || l.href) && l.isVisible !== false);

      if (links.length > 0) {
        links.slice(0, 6).forEach((link: any, idx: number) => {
          const url = link.url || link.href;
          const explicitIcon = link.icon;
          const label = link.label || link.title || link.name || 'LINK';
          const resolvedPlatform = normalizeSocialPlatformKey(label, url, explicitIcon);

          socialList.push({
            platform: resolvedPlatform,
            label: label.toUpperCase(),
            sublabel: `SOCIAL / 0${idx + 1}`,
            url,
            icon: explicitIcon || resolvedPlatform,
          });
        });
      } else if (profile?.socialHandles && Object.keys(profile.socialHandles).length > 0) {
        const keys = Object.keys(profile.socialHandles);
        keys.slice(0, 6).forEach((key, idx) => {
          const val = profile.socialHandles[key];
          if (!val) return;
          let url = val;
          if (!val.startsWith('http://') && !val.startsWith('https://') && !val.startsWith('mailto:')) {
            if (key.toLowerCase() === 'instagram') url = `https://instagram.com/${val.replace('@', '')}`;
            else if (key.toLowerCase() === 'github') url = `https://github.com/${val.replace('@', '')}`;
            else if (key.toLowerCase() === 'hackerrank') url = `https://hackerrank.com/${val.replace('@', '')}`;
            else if (key.toLowerCase() === 'linkedin') url = `https://linkedin.com/in/${val}`;
            else if (key.toLowerCase() === 'youtube') url = `https://youtube.com/@${val}`;
            else if (key.toLowerCase() === 'twitter' || key.toLowerCase() === 'x') url = `https://x.com/${val.replace('@', '')}`;
            else url = `https://${val}`;
          }
          const resolvedPlatform = normalizeSocialPlatformKey(key, url, key);
          socialList.push({
            platform: resolvedPlatform,
            label: key.toUpperCase(),
            sublabel: `SOCIAL / 0${idx + 1}`,
            url,
            icon: resolvedPlatform,
          });
        });
      }
    }

    // Dynamic metrics extraction: strictly use actual metric names, NEVER "METRIC 01 / METRIC 02"
    const rawMetrics = directData?.metrics || profile?.metrics || profile?.proofs || profile?.proofPoints || profile?.proof_points || [];
    const metricList: Array<{ index?: string; value: string; label: string }> = [];

    if (Array.isArray(rawMetrics) && rawMetrics.length > 0) {
      rawMetrics.slice(0, 3).forEach((item: any, idx: number) => {
        const val = (item.value || item.stat || item.count || item.number || '').toString().trim();
        
        // Prioritize actual metric label/title/name and reject generic placeholders like "METRIC 01"
        let lbl = '';
        const candidates = [item.label, item.title, item.name, item.description];
        for (const c of candidates) {
          if (typeof c === 'string' && c.trim().length > 0) {
            const trimmed = c.trim();
            if (!/^metric\s*0?\d+$/i.test(trimmed) && !/^proof\s*0?\d+$/i.test(trimmed)) {
              lbl = trimmed;
              break;
            }
          }
        }

        // If no explicit candidate exists, supply meaningful fallback names
        if (!lbl) {
          const defaultLabels = ['FOLLOWERS', 'CONNECTIONS', 'PROFILE VIEWS'];
          lbl = defaultLabels[idx] || `SIGNAL 0${idx + 1}`;
        }

        if (val || lbl) {
          metricList.push({
            index: `0${idx + 1}`,
            value: val || '—',
            label: lbl.toUpperCase(),
          });
        }
      });
    }

    // Email & CTA: NEVER invent fake email
    const email = directData?.email !== undefined 
      ? directData.email 
      : (profile?.email || profile?.socialHandles?.email || null);
    
    const firstName = (nameLineOne || '').toUpperCase();
    const ctaLabel = directData?.ctaLabel || (firstName && firstName !== 'THE' ? `WORK WITH ${firstName}` : 'START A CONVERSATION');

    return {
      nameLineOne,
      nameLineTwo,
      role: role ? role.toUpperCase() : null,
      category: identityKicker ? identityKicker.toUpperCase() : null,
      bio,
      location,
      availability,
      established,
      edition,
      initial,
      monogram,
      portraitImage: directData?.portraitImage !== undefined ? directData.portraitImage : (profile?.avatarUrl || null),
      portraitAlt: directData?.portraitAlt || `Editorial portrait of ${nameLineOne} ${nameLineTwo}`,
      email,
      ctaLabel,
      footerStatement: directData?.footerStatement || 'ONE PROFILE · ONE VISUAL LANGUAGE',
      metrics: metricList,
      socials: socialList,
    };
  }, [profile, directData]);

  // Subtle scroll reveal with IntersectionObserver & reduced-motion support
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const sections = containerRef.current?.querySelectorAll<HTMLElement>('.club-reveal-section');
    if (!sections || sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('club-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    sections.forEach((sec) => observer.observe(sec));

    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  const handleSocialClick = (social: any) => {
    if (onLinkClick) {
      onLinkClick({
        id: social.platform,
        label: social.label,
        url: social.url,
        clicks: 0,
        order: 0,
        isVisible: true,
      });
    }
  };

  return (
    <div className="club-template-root min-h-screen w-full bg-[#F5EFEB] text-[#241E1B] py-6 sm:py-12 px-3 sm:px-6 flex justify-center items-start selection:bg-[#6E1E24] selection:text-[#FAF6F0]">
      {/* Editorial Google Fonts & Micro-CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        .club-template-root .font-club-serif {
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
        }

        .club-template-root .font-club-sans {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .club-chamfer-shape {
          clip-path: polygon(18px 0, 100% 0, 100% 100%, 0 100%, 0 18px);
        }

        .club-reveal-section {
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .club-reveal-section.club-revealed {
          opacity: 1;
          transform: translateY(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .club-reveal-section {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
          .club-pulse-line {
            animation: none !important;
          }
          .club-portrait-lift {
            transition: none !important;
          }
          .club-portrait-lift:hover {
            transform: none !important;
          }
        }

        @keyframes clubLinePulse {
          0%, 100% { opacity: 0.35; transform: scaleX(0.96); }
          50% { opacity: 0.9; transform: scaleX(1); }
        }

        .club-pulse-line {
          animation: clubLinePulse 4s ease-in-out infinite;
        }
      `}} />

      {/* Main Profile Shell */}
      <article
        ref={containerRef}
        aria-label={`${clubData.nameLineOne} ${clubData.nameLineTwo} — The Club Profile`}
        className="font-club-sans relative w-full max-w-[490px] bg-[#FDFBF7] border border-[#241E1B] rounded-[28px] sm:rounded-[32px] shadow-[0_20px_50px_-12px_rgba(40,24,18,0.14)] overflow-hidden transition-all duration-300"
      >
        {/* Registration Corner Marks on Shell */}
        <div className="pointer-events-none absolute top-3.5 left-3.5 w-3.5 h-3.5 border-t border-l border-[#241E1B]/50" aria-hidden="true" />
        <div className="pointer-events-none absolute top-3.5 right-3.5 w-3.5 h-3.5 border-t border-r border-[#241E1B]/50" aria-hidden="true" />
        <div className="pointer-events-none absolute top-3.5 right-8 w-4 h-[1px] bg-[#241E1B]/40" aria-hidden="true" />

        {/* ==================================================
            TOP PROFILE BAR
        ================================================== */}
        <header className="relative pt-4 sm:pt-5 pb-3 px-5 sm:px-6">
          <div className="flex items-center justify-between">
            {/* Left: Square Monogram & Label (Clean 'THE CLUB' without '/ 01') */}
            <div className="flex items-center gap-2.5">
              <div 
                className="w-7 h-7 border border-[#241E1B] p-[1.5px] bg-[#FDFBF7] flex items-center justify-center relative select-none"
                title={`${clubData.monogram} Monogram`}
              >
                <div className="w-full h-full border border-[#6E1E24]/30 flex items-center justify-center bg-[#FDFBF7]">
                  <span className="font-club-serif font-semibold text-[9.5px] tracking-wider text-[#241E1B]">
                    {clubData.monogram || 'TC'}
                  </span>
                </div>
              </div>

              <div className="flex items-center">
                <span className="text-[10px] tracking-[0.22em] font-semibold text-[#241E1B] uppercase">
                  THE CLUB
                </span>
              </div>
            </div>

            {/* Right: Profile Indicator in Wine */}
            <div className="text-right">
              <span className="text-[10px] tracking-[0.22em] font-semibold text-[#6E1E24] uppercase">
                PROFILE {clubData.established || currentYear}
              </span>
            </div>
          </div>

          {/* Bottom Divider with intersecting diamond */}
          <div className="relative mt-3.5 w-full flex items-center justify-center">
            <div className="w-full h-[1px] bg-[#241E1B]/25" />
            <div className="absolute bg-[#FDFBF7] px-1.5 flex items-center justify-center">
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className="text-[#6E1E24]" aria-hidden="true">
                <polygon points="5,0 10,5 5,10 0,5" stroke="currentColor" strokeWidth="1.2" fill="#FDFBF7" />
              </svg>
            </div>
          </div>
        </header>

        {/* ==================================================
            01 / IDENTITY SECTION
        ================================================== */}
        <section 
          id="identity" 
          aria-label="Identity"
          className="club-reveal-section px-5 sm:px-6 pt-3 pb-4"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-[9.5px] font-bold tracking-[0.22em] text-[#6E1E24] uppercase whitespace-nowrap">
              01 / IDENTITY
            </h2>
            <div className="h-[1px] bg-[#241E1B]/20 flex-1 min-w-[20px]" aria-hidden="true" />
            {clubData.category && (
              <span className="text-[8.5px] font-medium tracking-[0.2em] text-[#736B63] uppercase text-right truncate">
                {clubData.category}
              </span>
            )}
          </div>

          {/* Two-Column Composition: Portrait + Information */}
          <div className="grid grid-cols-1 sm:grid-cols-[142px_1fr] gap-5 items-start">
            {/* Left: Editorial Portrait Treatment (Clean & Intentional, NO 'PLATE / A', NO empty caption space) */}
            <div className="flex flex-col items-center sm:items-start">
              <div 
                className="club-portrait-lift relative w-[138px] sm:w-[142px] aspect-[4/5] transition-transform duration-500 ease-out hover:-translate-y-1 hover:rotate-[-0.8deg] cursor-pointer group"
                tabIndex={0}
                role="img"
                aria-label={clubData.portraitAlt}
              >
                {clubData.portraitImage ? (
                  /* Real Portrait Image without Grayscale (Retains Natural Color with Editorial Polish) */
                  <div className="relative w-full h-full club-chamfer-shape bg-[#E5DDD3] overflow-hidden border border-[#241E1B]/80 shadow-[0_4px_12px_rgba(40,24,18,0.06)]">
                    <img 
                      src={clubData.portraitImage} 
                      alt={clubData.portraitAlt}
                      className="w-full h-full object-cover contrast-[1.02] brightness-[0.98] group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="pointer-events-none absolute inset-0 club-chamfer-shape border border-[#241E1B]/30" />
                    <div className="absolute bottom-1 left-2 font-club-serif italic font-semibold text-[26px] text-[#FAF6F0] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] select-none">
                      {clubData.initial}
                    </div>
                  </div>
                ) : (
                  /* Built-in Abstract Editorial Artwork with Warm Color Language */
                  <div className="relative w-full h-full club-chamfer-shape bg-[#E5DDD3] overflow-hidden border border-[#241E1B]/80 shadow-[inset_0_0_12px_rgba(40,24,18,0.06)]">
                    <svg viewBox="0 0 142 178" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="142" height="178" fill="#E5DDD3" />
                      <line x1="16" y1="0" x2="16" y2="178" stroke="#241E1B" strokeWidth="0.7" strokeOpacity="0.45" />
                      <line x1="0" y1="18" x2="142" y2="128" stroke="#241E1B" strokeWidth="0.75" strokeOpacity="0.5" />
                      <line x1="28" y1="0" x2="120" y2="178" stroke="#241E1B" strokeWidth="0.6" strokeOpacity="0.3" />
                      
                      {/* Dusty Rose Oval */}
                      <ellipse cx="88" cy="66" rx="27" ry="25" fill="#D8A5A5" />
                      
                      {/* Dark Charcoal Focal Dot */}
                      <circle cx="95" cy="58" r="3" fill="#241E1B" />
                      
                      {/* Deep Wine Organic Mound */}
                      <path 
                        d="M 0,112 Q 38,98 76,112 Q 114,126 142,116 L 142,178 L 0,178 Z" 
                        fill="#6E1E24" 
                      />
                      
                      {/* High-Contrast Serif Initial in Ivory */}
                      <text 
                        x="22" 
                        y="156" 
                        fontFamily="'Cormorant Garamond', Georgia, serif" 
                        fontSize="34" 
                        fontStyle="italic" 
                        fontWeight="600" 
                        fill="#FAF6F0"
                        className="select-none"
                      >
                        {clubData.initial}
                      </text>
                      
                      <polygon 
                        points="18,1 141,1 141,177 1,177 1,18" 
                        stroke="#241E1B" 
                        strokeWidth="0.8" 
                        strokeOpacity="0.35" 
                        fill="none" 
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Profile Info */}
            <div className="flex flex-col justify-start pt-0 sm:pt-0.5">
              {clubData.role && (
                <div className="text-[9px] font-bold tracking-[0.2em] text-[#6E1E24] uppercase mb-1.5 leading-snug">
                  {clubData.role}
                </div>
              )}

              <h1 className="font-club-serif tracking-[-0.015em] leading-[0.92] select-text">
                <span className="block text-[42px] sm:text-[46px] font-normal text-[#241E1B]">
                  {clubData.nameLineOne}
                </span>
                {clubData.nameLineTwo && (
                  <span className="block text-[42px] sm:text-[46px] font-normal italic text-[#6E1E24] leading-[0.98]">
                    {clubData.nameLineTwo}
                  </span>
                )}
              </h1>

              {clubData.bio && (
                <p className="text-[12px] sm:text-[12.5px] leading-[1.48] text-[#4A433D] font-normal mt-3 max-w-[270px]">
                  {clubData.bio}
                </p>
              )}

              {/* Location & Status Metadata — Only rendered if real data is provided (NEVER hardcoded fake data) */}
              {(clubData.location || clubData.availability) && (
                <div className="mt-3.5 pt-2 border-t border-[#241E1B]/15 flex items-center gap-1.5 text-[8px] font-medium tracking-[0.16em] uppercase text-[#736B63] flex-wrap">
                  {clubData.location && <span>{clubData.location}</span>}
                  {clubData.location && clubData.availability && (
                    <span className="text-[#6E1E24] text-[9px] leading-none" aria-hidden="true">•</span>
                  )}
                  {clubData.availability && <span>{clubData.availability}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Micro Navigation / Identity Footer */}
          <div className="mt-5 pt-3 border-t border-[#241E1B]/15 flex items-center justify-between text-[8px] font-semibold tracking-[0.2em] uppercase text-[#7A726A]">
            <span className="whitespace-nowrap">
              CURATED PROFILE / EDITION {clubData.edition || '01'}
            </span>
            <div className="club-pulse-line h-[1px] bg-[#241E1B]/30 flex-1 mx-3" aria-hidden="true" />
            <a 
              href="#socials" 
              className="hover:text-[#6E1E24] transition-colors flex items-center gap-0.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6E1E24]"
            >
              SCROLL TO EXPLORE ↓
            </a>
          </div>
        </section>

        {/* ==================================================
            02 / SOCIALS SECTION (CENTRALIZED BRAND SVG SYSTEM)
        ================================================== */}
        {clubData.socials && clubData.socials.length > 0 && (
          <section 
            id="socials" 
            aria-label="Social Links"
            className="club-reveal-section px-5 sm:px-6 pt-3 pb-4"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between gap-3 mb-3.5">
              <h2 className="text-[9.5px] font-bold tracking-[0.22em] text-[#6E1E24] uppercase whitespace-nowrap">
                02 / SOCIALS
              </h2>
              <div className="h-[1px] bg-[#241E1B]/20 flex-1 min-w-[20px]" aria-hidden="true" />
              <span className="text-[8.5px] font-medium tracking-[0.2em] text-[#736B63] uppercase">
                STAY CLOSE
              </span>
            </div>

            {/* Social Cards Grid: Desktop 2 cols + full width 5th; Mobile 1 col */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {clubData.socials.map((social: any, index: number) => {
                const isFullWidth = index === 4 && clubData.socials.length === 5;

                return (
                  <a
                    key={`${social.platform}-${index}`}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleSocialClick(social)}
                    aria-label={`${social.label} — ${social.sublabel || 'Social Link'}`}
                    className={`
                      group relative bg-[#ECE4D8] border border-[#241E1B]/80 px-3.5 py-3 
                      flex items-center justify-between rounded-[2px] transition-all duration-200 
                      hover:bg-[#E4D8D2] hover:border-[#6E1E24] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(40,24,18,0.08)]
                      active:translate-y-0 active:scale-[0.99]
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E1E24]
                      ${isFullWidth ? 'sm:col-span-2' : ''}
                    `}
                  >
                    {/* Inset Hairline Frame */}
                    <div className="pointer-events-none absolute inset-[2.5px] border border-[#241E1B]/15" aria-hidden="true" />

                    {/* Deep Wine Corner Bracket Mark in Bottom-Right Corner (Exact Reference Detail!) */}
                    <div 
                      className="pointer-events-none absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b-[1.5px] border-r-[1.5px] border-[#6E1E24]" 
                      aria-hidden="true" 
                    />

                    {/* Left: Authentic Brand SVG Icon in Wine & Title */}
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="w-5 h-5 flex items-center justify-center text-[#6E1E24] transition-transform duration-200 group-hover:scale-105">
                        {renderClubSocialIcon(social.platform, 'w-4 h-4')}
                      </div>

                      <div className="flex flex-col">
                        <span className="text-[10.5px] font-bold tracking-[0.16em] text-[#241E1B] uppercase leading-tight">
                          {social.label}
                        </span>
                        <span className="text-[7.5px] font-medium tracking-[0.18em] text-[#7A726A] uppercase mt-0.5">
                          {social.sublabel || `SOCIAL / 0${index + 1}`}
                        </span>
                      </div>
                    </div>

                    {/* Right: Upward-Right Arrow */}
                    <div className="relative z-10 text-[#241E1B]/70 group-hover:text-[#6E1E24] transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 pr-2">
                      <ClubArrowUpRightIcon className="w-3.5 h-3.5" />
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* ==================================================
            03 / THE RECORD SECTION (SEPARATE DESKTOP & MOBILE VIEWS)
        ================================================== */}
        {clubData.metrics && clubData.metrics.length > 0 && (
          <section 
            id="record" 
            aria-label="The Record"
            className="club-reveal-section px-5 sm:px-6 pt-3 pb-4"
          >
            {/* Section Header */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-[9.5px] font-bold tracking-[0.22em] text-[#6E1E24] uppercase whitespace-nowrap">
                03 / THE RECORD
              </h2>
              <div className="h-[1px] bg-[#241E1B]/20 flex-1 min-w-[20px]" aria-hidden="true" />
              <span className="text-[8.5px] font-medium tracking-[0.2em] text-[#736B63] uppercase">
                SELECTED SIGNALS
              </span>
            </div>

            {/* DESKTOP METRICS VIEW (.club-metrics-desktop: visible on desktop/tablet, hidden on mobile) */}
            <div className="club-metrics-desktop hidden sm:block relative bg-[#ECE4D8] border-t border-b border-[#241E1B]/80 py-3.5 px-3">
              {/* Top Corner Registration Marks in Wine */}
              <div className="pointer-events-none absolute top-1 left-1.5 w-2 h-2 border-t border-l border-[#6E1E24]" aria-hidden="true" />
              <div className="pointer-events-none absolute top-1 right-1.5 w-2 h-2 border-t border-r border-[#6E1E24]" aria-hidden="true" />

              <div className="grid grid-cols-3 divide-x divide-[#241E1B]/25">
                {clubData.metrics.map((metric: any, idx: number) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col px-2 sm:px-3 relative ${idx === 0 ? 'pl-1 sm:pl-2' : ''}`}
                  >
                    {/* Small editorial index in top-right */}
                    <div className="flex justify-end">
                      <span className="text-[7.5px] font-mono tracking-wider text-[#7A726A]">
                        {metric.index || `0${idx + 1}`}
                      </span>
                    </div>

                    {/* Large High-Contrast Editorial Serif Number */}
                    <div className="font-club-serif text-[30px] sm:text-[36px] font-normal leading-none text-[#241E1B] my-1">
                      {metric.value}
                    </div>

                    {/* Actual Metric Label (Never "METRIC 01") */}
                    <div className="text-[7.5px] sm:text-[8px] font-semibold tracking-[0.16em] uppercase text-[#5A524A] leading-tight">
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MOBILE METRICS VIEW (.club-metrics-mobile: visible on mobile, hidden on desktop/tablet) */}
            <div className="club-metrics-mobile block sm:hidden relative bg-[#ECE4D8] border border-[#241E1B]/60 rounded-[2px] divide-y divide-[#241E1B]/20 overflow-hidden shadow-sm">
              {clubData.metrics.map((metric: any, idx: number) => (
                <div 
                  key={idx} 
                  className="flex items-baseline justify-between px-3.5 py-2.5 relative group"
                >
                  <div className="pointer-events-none absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-[#6E1E24]" aria-hidden="true" />

                  {/* Left: Value + Actual Metric Label */}
                  <div className="flex items-baseline gap-2.5 min-w-0 pr-2">
                    <span className="font-club-serif text-[26px] font-normal leading-none text-[#241E1B] shrink-0">
                      {metric.value}
                    </span>
                    <span className="text-[8px] font-semibold tracking-[0.16em] uppercase text-[#5A524A] truncate">
                      {metric.label}
                    </span>
                  </div>

                  {/* Right: Small Index */}
                  <span className="text-[7.5px] font-mono text-[#7A726A] shrink-0">
                    {metric.index || `0${idx + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ==================================================
            04 / INVITATION SECTION (CONTACT & CTA)
        ================================================== */}
        <section 
          id="invitation" 
          aria-label="Invitation"
          className="club-reveal-section bg-[#4E141A] text-[#FAF6F0] px-5 sm:px-6 py-5 sm:py-6 transition-colors"
        >
          <div className="text-[8.5px] font-semibold tracking-[0.25em] text-[#D4A3A8] uppercase mb-2">
            04 / INVITATION
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="font-club-serif tracking-[-0.015em] leading-[0.95] select-text">
                <span className="block text-[30px] sm:text-[34px] font-normal text-[#FAF6F0]">
                  Start a
                </span>
                <span className="block text-[30px] sm:text-[34px] font-normal italic text-[#E8C4C4] leading-[1.05]">
                  conversation.
                </span>
              </h2>
            </div>

            <div className="self-start sm:self-end">
              {clubData.email ? (
                <a
                  href={`mailto:${clubData.email}?subject=Collaboration%20Inquiry%20via%20The%20Club`}
                  className="group relative inline-flex items-stretch border border-[#B37B82] bg-transparent hover:bg-[#5E1A22] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C4C4]"
                  aria-label={`${clubData.ctaLabel} — Email ${clubData.email}`}
                >
                  <div className="pointer-events-none absolute inset-[2px] border border-[#B37B82]/30" aria-hidden="true" />
                  <div className="pointer-events-none absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[#E8C4C4]" aria-hidden="true" />

                  <span className="px-3.5 py-2.5 text-[9px] font-semibold tracking-[0.2em] text-[#FAF6F0] uppercase border-r border-[#B37B82] group-hover:text-white transition-colors">
                    {clubData.ctaLabel}
                  </span>

                  <span className="px-2.5 py-2.5 flex items-center justify-center text-[#FAF6F0] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                    <ClubArrowUpRightIcon className="w-3.5 h-3.5" />
                  </span>
                </a>
              ) : (
                <div 
                  className="relative inline-flex items-stretch border border-[#B37B82]/70 bg-transparent opacity-80 cursor-default select-none"
                  aria-disabled="true"
                  aria-label={clubData.ctaLabel}
                >
                  <div className="pointer-events-none absolute inset-[2px] border border-[#B37B82]/30" aria-hidden="true" />
                  <div className="pointer-events-none absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[#E8C4C4]" aria-hidden="true" />

                  {/* Always use configured ctaLabel — NEVER 'INQUIRIES CLOSED' */}
                  <span className="px-3.5 py-2.5 text-[9px] font-semibold tracking-[0.2em] text-[#FAF6F0] uppercase border-r border-[#B37B82]/70">
                    {clubData.ctaLabel}
                  </span>

                  <span className="px-2.5 py-2.5 flex items-center justify-center text-[#FAF6F0]/80">
                    <ClubArrowUpRightIcon className="w-3.5 h-3.5" />
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ==================================================
            10 / FOOTER
        ================================================== */}
        <footer 
          aria-label="Profile Footer"
          className="bg-[#ECE4D8] border-t border-[#241E1B]/20 px-5 sm:px-6 py-3 flex items-center justify-between text-[8px] font-semibold tracking-[0.2em] uppercase text-[#5A524A]"
        >
          <div>
            THE CLUB / {currentYear}
          </div>

          <div className="hidden xs:block text-[#7A726A] text-[7.5px] truncate max-w-[200px] text-center">
            {clubData.footerStatement}
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top of profile"
            className="flex items-center gap-1 hover:text-[#6E1E24] transition-colors p-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#6E1E24]"
          >
            <span className="sr-only">Back to top</span>
            <ClubArrowUpIcon className="w-3.5 h-3.5 text-[#241E1B] hover:text-[#6E1E24]" />
          </button>
        </footer>
      </article>
    </div>
  );
}

// --- 04 ENTREPRENEUR --- //

function BuilderTemplate({ profile }: any) {
  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] text-[#111111] p-8 flex justify-center font-sans">
      <div className="max-w-2xl w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-fit mt-12">
        <div className="border-b border-gray-100 flex p-6 gap-6 items-start">
          <img src={profile.avatarUrl} alt={profile.name} className="w-16 h-16 rounded-md object-cover border border-gray-200" />
          <div className="flex-1">
             <h1 className="text-xl font-bold tracking-tight mb-1">{profile.name}</h1>
             <p className="text-sm font-medium text-gray-500 mb-3">{profile.headline}</p>
             <p className="text-sm text-gray-600 leading-relaxed text-balance">{profile.bio}</p>
          </div>
        </div>
        
        <div className="p-2 space-y-1 bg-gray-50/50">
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-2">Resources</div>
          {profile.links?.map((link: any, i: number) => (
            <a key={i} href={link.url} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors mx-2">
              <span className="w-8 h-8 rounded shrink-0 bg-white border border-gray-200 flex items-center justify-center text-gray-400 shadow-sm text-xs">
                {i + 1}
              </span>
              <span className="font-medium text-sm text-gray-800 flex-1">{link.label}</span>
              <span className="text-gray-300">→</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function VisionaryTemplate({ profile, onLinkClick }: any) {
  const name = profile?.name || "Aria Mehta";
  const nameParts = name.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || '';

  const headline = profile?.headline || profile?.role || "FOUNDER - FUTURE SYSTEMS DESIGNER";
  const bio = profile?.bio || "I build products and systems around ideas that feel slightly ahead of their time — turning emerging technology into experiences people can actually understand and use.";
  const exploring = (profile as any)?.exploring || "AI + HUMAN EXPERIENCE";
  const location = (profile as any)?.location || "BENGALURU, INDIA";

  const question = (profile as any)?.question || "What do you build when the future has not been named yet?";
  const positioning = (profile as any)?.positioning || "I work at the intersection of emerging technology, product thinking, and human behavior — turning uncertain possibilities into useful experiences.";

  const metrics = profile?.proofs || profile?.proofPoints || [
    { value: "12+", label: "EXPERIMENTS SHIPPED", description: "BUILD / LAST 3 YEARS" },
    { value: "48K", label: "PEOPLE REACHED", description: "REACH / ACROSS PROJECTS" },
    { value: "07", label: "PRODUCTS & PROTOTYPES", description: "SIGNAL / SELECTED WORK" }
  ];

  const links = profile?.links || [
    { label: "LINKEDIN", url: "https://linkedin.com", description: "PROFESSIONAL / NETWORK", icon: "linkedin" },
    { label: "INSTAGRAM", url: "https://instagram.com", description: "VISUAL / JOURNAL", icon: "instagram" },
    { label: "X / TWITTER", url: "https://x.com", description: "IDEAS / SIGNAL", icon: "x" }
  ];

  const imageUrl = profile?.avatarUrl;
  const email = profile?.email || "aria@example.com";
  const contactLink = email.includes('@') ? `mailto:${email}` : email;

  const currentYear = new Date().getFullYear();

  const getPlatformIcon = (platform: string) => {
    const p = (platform || '').toLowerCase();
    if (p.includes('linkedin')) return <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.67 1.67 0 1 0 0-3.34 1.67 1.67 0 0 0 0 3.34M7.86 18.5V10.13H5.07V18.5h2.79z" /></svg>;
    if (p.includes('insta')) return <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>;
    if (p.includes('x') || p.includes('twitter')) return <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;
  };

  return (
    <div className="min-h-screen w-full bg-[#F5EFEB] py-8 sm:py-16 px-4 sm:px-8 flex justify-center items-start text-[#2C2825] font-['Manrope',sans-serif] antialiased selection:bg-[#704E59] selection:text-white">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Manrope:wght@300;400;500;600;700&display=swap');
        .visionary-serif { font-family: 'DM Serif Display', serif; }
        .visionary-sans { font-family: 'Manrope', sans-serif; }
        
        .visionary-outer-shell {
          background-color: #F8F5F0;
          background-image: 
            radial-gradient(circle at 50% 0%, rgba(220, 209, 195, 0.15) 0%, transparent 70%),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
          box-shadow: 0 20px 40px -10px rgba(44, 40, 37, 0.08), inset 0 0 0 1px rgba(44, 40, 37, 0.05);
        }
        
        @keyframes visionaryFloat {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes visionarySpinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .anim-float { animation: visionaryFloat 12s ease-in-out infinite; }
        .anim-spin-slow { animation: visionarySpinSlow 40s linear infinite; }
        
        @media (prefers-reduced-motion: reduce) {
          .anim-float, .anim-spin-slow { animation: none !important; }
          .transition-all, .transition-colors, .transition-transform, .transition-opacity { transition: none !important; }
        }
      `}} />
      
      <div className="visionary-outer-shell relative w-full max-w-[1040px] rounded-[32px] sm:rounded-[48px] border border-[#2C2825]/10 overflow-hidden">
        
        {/* Registration Marks */}
        <div className="absolute top-6 left-6 w-3 h-3 border-t border-l border-[#2C2825]/30 pointer-events-none" />
        <div className="absolute top-6 right-6 w-3 h-3 border-t border-r border-[#2C2825]/30 pointer-events-none" />
        <div className="absolute bottom-6 left-6 w-3 h-3 border-b border-l border-[#2C2825]/30 pointer-events-none" />
        <div className="absolute bottom-6 right-6 w-3 h-3 border-b border-r border-[#2C2825]/30 pointer-events-none" />

        {/* 1. Top Navigation */}
        <header className="relative pt-8 pb-4 px-8 sm:px-12 flex justify-between items-center text-[9px] tracking-[0.2em] uppercase font-bold text-[#2C2825]">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border border-[#2C2825] flex items-center justify-center p-[2px]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2C2825]" />
            </div>
            <span>UNOOL / FIELD NOTE</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[#8B958A]">
            <span>PROFILE / 01—04</span>
            <span className="w-1 h-1 rotate-45 bg-[#8B958A]" />
            <span>ARCHIVE / 01</span>
          </div>
        </header>

        {/* 2. Hero Section */}
        <section className="relative px-8 sm:px-12 pt-12 pb-20 flex flex-col md:flex-row gap-12 md:gap-20 items-center md:items-start border-b border-[#2C2825]/10">
          
          {/* Left: Portrait Instrument */}
          <div className="w-full md:w-[400px] flex flex-col items-center shrink-0">
            <div className="absolute top-16 left-12 w-4 h-4 border-t border-l border-[#2C2825]/20 hidden md:block" />
            <div className="absolute bottom-20 right-[55%] w-4 h-4 border-b border-r border-[#2C2825]/20 hidden md:block" />
            
            <div className="relative w-64 h-72 sm:w-80 sm:h-96 group perspective-1000 mt-4 md:mt-0">
              {/* Orbital Rings */}
              <div className="absolute inset-[-10%] rounded-full border-[0.5px] border-[#A599B5]/30 anim-spin-slow pointer-events-none" />
              <div className="absolute inset-[-5%] rounded-full border-[0.5px] border-[#BA6F61]/20 anim-float pointer-events-none" style={{ animationDelay: '-4s' }} />
              
              <div className="relative w-full h-full rounded-[40%_60%_70%_30%/40%_50%_60%_50%] overflow-hidden border border-[#2C2825]/20 transition-transform duration-700 md:group-hover:-translate-y-2 md:group-hover:rotate-1 bg-[#DCD1C3]/30 flex items-center justify-center shadow-lg">
                {imageUrl ? (
                  <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[#704E59]">
                    <div className="w-8 h-8 rounded-full border border-current flex items-center justify-center mb-3">
                      <div className="w-2 h-2 rounded-full bg-current" />
                    </div>
                    <span className="text-[10px] tracking-[0.2em] font-bold">PORTRAIT FIELD</span>
                  </div>
                )}
              </div>
              
              <div className="absolute top-1/2 -left-4 w-2 h-[1px] bg-[#2C2825]/30 pointer-events-none" />
              <div className="absolute top-1/2 -right-4 w-2 h-[1px] bg-[#2C2825]/30 pointer-events-none" />
              <div className="absolute -top-4 left-1/2 h-2 w-[1px] bg-[#2C2825]/30 pointer-events-none" />
              <div className="absolute -bottom-4 left-1/2 h-2 w-[1px] bg-[#2C2825]/30 pointer-events-none" />
              
              <span className="absolute top-[20%] -right-8 text-[8px] tracking-widest text-[#8B958A] rotate-90 origin-left pointer-events-none hidden sm:block">E. 17° 39'</span>
              <span className="absolute bottom-[20%] -left-8 text-[8px] tracking-widest text-[#8B958A] -rotate-90 origin-right pointer-events-none hidden sm:block">N. 41° 21'</span>
            </div>
            
            <div className="mt-10 flex flex-col items-center gap-2 text-[9px] tracking-[0.2em] text-[#8B958A] uppercase">
              <span>OPTICAL FRAME / 38° 18'</span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2C2825]" />
                <span>LOCATION / {location}</span>
              </div>
            </div>
          </div>

          {/* Right: Hero Identity */}
          <div className="flex-1 w-full flex flex-col relative z-10 pt-4 items-center text-center md:items-start md:text-left">
            
            <div className="absolute top-0 right-0 hidden md:flex flex-col items-end">
               <div className="w-20 h-20 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] border-[0.5px] border-[#704E59]/30 anim-float flex items-center justify-center pointer-events-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#704E59]/40" />
               </div>
               <span className="text-[8px] tracking-[0.2em] text-[#8B958A] uppercase mt-2">FIELD / 01</span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-[1px] bg-[#2C2825]/30 hidden md:block" />
              <span className="text-[9px] tracking-[0.2em] text-[#8B958A] uppercase font-bold">
                THE VISIONARY / FUTURE SYSTEMS
              </span>
            </div>
            
            <h1 className="visionary-serif text-[clamp(4rem,10vw,6.5rem)] leading-[0.85] text-[#2C2825] mb-8">
              {firstName}
              <br className="hidden md:block" />
              {lastName ? (
                <>
                  <span className="md:hidden"> </span>
                  {lastName}
                </>
              ) : null}
            </h1>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-6 h-[1px] bg-[#2C2825]/30 hidden md:block" />
              <span className="text-[9px] tracking-[0.2em] text-[#8B958A] uppercase font-bold text-center md:text-left">
                FIELD 01 / VISION INDEX / FUTURE SYSTEMS
              </span>
            </div>
            
            <h2 className="text-[11px] sm:text-[13px] tracking-[0.15em] font-bold uppercase text-[#2C2825] mb-6">
              {headline}
            </h2>
            
            <p className="text-sm sm:text-base leading-[1.8] text-[#2C2825]/80 max-w-lg font-medium mb-10">
              {bio}
            </p>
            
            <div className="flex gap-4 mb-10 items-stretch">
              <div className="w-[1px] bg-[#704E59]/40 hidden md:block" />
              <div className="flex flex-col justify-center items-center md:items-start">
                <span className="text-[8px] tracking-[0.2em] text-[#8B958A] uppercase mb-1">CURRENTLY EXPLORING</span>
                <span className="text-[10px] tracking-[0.1em] font-bold uppercase text-[#2C2825]">{exploring}</span>
              </div>
            </div>
            
            <a 
              href={contactLink}
              className="group inline-flex items-center self-center md:self-start gap-4 pr-6 rounded-full border border-[#2C2825]/20 bg-white/50 hover:bg-white transition-all hover:shadow-[0_8px_20px_rgba(112,78,89,0.1)] md:hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#704E59] focus:ring-offset-2 focus:ring-offset-[#F8F5F0]"
            >
              <div className="w-12 h-12 rounded-full bg-[#704E59] flex items-center justify-center text-white transition-transform group-hover:rotate-45">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5"></line><polyline points="12 5 19 5 19 12"></polyline></svg>
              </div>
              <div className="flex flex-col py-2 text-left">
                <span className="text-[8px] tracking-[0.2em] text-[#8B958A] uppercase font-bold">PRIMARY SIGNAL</span>
                <span className="text-[11px] font-bold text-[#2C2825]">Start a conversation</span>
              </div>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8B958A] ml-2 group-hover:translate-x-1 transition-transform"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </a>
            
            <div className="mt-16 flex items-center gap-4 w-full justify-center md:justify-start">
              <span className="text-[9px] tracking-[0.2em] text-[#8B958A] uppercase font-bold">01</span>
              <div className="h-[1px] flex-1 bg-[#2C2825]/10" />
              <span className="text-[9px] tracking-[0.2em] text-[#8B958A] uppercase font-bold">MAKE THE NEXT POSSIBILITY LEGIBLE</span>
            </div>

          </div>
        </section>

        {/* 3. Philosophy Section */}
        <section className="relative px-8 sm:px-12 py-16 md:py-20 border-b border-[#2C2825]/10 flex flex-col md:flex-row gap-12">
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] md:w-[60%] h-[150%] md:h-[200%] rounded-[100%] border-[0.5px] border-[#A599B5]/20 -rotate-12 pointer-events-none" />
          
          <div className="w-full md:w-32 flex flex-col shrink-0 text-[#704E59] items-center md:items-start">
            <span className="visionary-serif text-3xl mb-2">02</span>
            <span className="text-[9px] tracking-[0.2em] font-bold uppercase text-center md:text-left">POINT OF VIEW</span>
            
            <div className="mt-6 md:mt-auto pt-4 md:pt-0 pb-4 text-[#8B958A] text-[8px] tracking-[0.1em] uppercase leading-relaxed max-w-[100px] text-center md:text-left hidden md:block">
              A FIELD NOTE<br/>ON POSSIBILITY
            </div>
          </div>
          
          <div className="flex-1 max-w-3xl relative z-10 text-center md:text-left flex flex-col items-center md:items-start">
            <div className="text-[9px] tracking-[0.2em] text-[#8B958A] uppercase font-bold mb-6">
              THE QUESTION BENEATH THE WORK
            </div>
            
            <h3 className="visionary-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] text-[#2C2825] mb-8 relative inline-block">
              {question}
              <span className="absolute -right-4 sm:-right-8 md:-right-16 -top-4 md:-top-8 visionary-serif text-5xl sm:text-6xl md:text-8xl text-[#A599B5]/40 rotate-12 select-none">
                ?
              </span>
            </h3>
            
            <p className="text-sm sm:text-base leading-[1.8] text-[#2C2825]/80 font-medium max-w-xl">
              {positioning}
            </p>
          </div>
          
          <div className="hidden md:flex flex-col items-center justify-center shrink-0 w-8">
             <span className="text-[8px] tracking-[0.2em] text-[#BA6F61] rotate-90 uppercase whitespace-nowrap">SEQ / 02A</span>
          </div>

        </section>

        {/* 4. Proof Section */}
        {metrics && metrics.length > 0 && (
          <section className="relative px-8 sm:px-12 py-16 border-b border-[#2C2825]/10">
            <div className="text-[9px] tracking-[0.2em] text-[#8B958A] uppercase font-bold mb-8 text-center md:text-left">
              PROOF / SIGNAL / TRACE
            </div>
            
            <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 md:gap-8 mb-12">
              <h3 className="visionary-serif text-4xl sm:text-5xl text-[#2C2825] text-center md:text-left">
                Evidence, <span className="text-[#704E59] italic">in orbit.</span>
              </h3>
              <p className="text-[10px] tracking-[0.05em] text-[#8B958A] max-w-[200px] text-center md:text-left leading-relaxed">
                Small, legible markers of momentum. Add only what is true, useful, and yours.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {metrics.slice(0, 3).map((metric: any, idx: number) => {
                const colors = [
                  { bg: 'bg-[#FDFBF7]', border: 'border-[#704E59]/20', accent: 'text-[#704E59]' },
                  { bg: 'bg-[#F2F4F2]', border: 'border-[#8B958A]/30', accent: 'text-[#8B958A]' },
                  { bg: 'bg-[#FDF8F6]', border: 'border-[#BA6F61]/20', accent: 'text-[#BA6F61]' },
                ];
                const theme = colors[idx % 3];
                
                return (
                  <div key={idx} className={`relative p-8 rounded-tr-3xl rounded-bl-3xl border ${theme.border} ${theme.bg} transition-all duration-300 md:hover:-translate-y-1 hover:shadow-md group overflow-hidden`}>
                    <span className={`absolute top-6 right-6 text-[8px] font-bold ${theme.accent}`}>0{idx + 1}</span>
                    
                    {idx === 0 && (
                      <div className="absolute top-10 right-16 w-10 h-6 rounded-full border-[0.5px] border-[#704E59]/40 rotate-12 flex items-center justify-end pr-1 pointer-events-none hidden sm:flex">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#704E59]/60" />
                      </div>
                    )}
                    
                    <div className="visionary-serif text-5xl sm:text-6xl text-[#2C2825] mb-8 group-hover:scale-105 transition-transform origin-left">
                      {metric.value}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-[9px] tracking-[0.1em] font-bold uppercase text-[#2C2825]">
                        {metric.label}
                      </div>
                      <div className="text-[8px] tracking-[0.2em] uppercase text-[#8B958A]">
                        {metric.description}
                      </div>
                    </div>
                    
                    <div className="absolute bottom-6 left-6 w-3 h-3 border-b border-l border-[#2C2825]/20 pointer-events-none" />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. Social / Signal Section */}
        {links && links.length > 0 && (
          <section className="relative px-8 sm:px-12 py-16 border-b border-[#2C2825]/10 flex flex-col md:flex-row gap-12 md:gap-20">
            <div className="w-full md:w-1/3 shrink-0 relative text-center md:text-left">
              <div className="text-[9px] tracking-[0.2em] text-[#8B958A] uppercase font-bold mb-6">
                THE INDEX
              </div>
              <h3 className="visionary-serif text-5xl sm:text-6xl text-[#2C2825] leading-[1]">
                Find the <br className="hidden md:block" /> <span className="text-[#A599B5] italic">signal.</span>
              </h3>
              
              <div className="absolute top-12 right-12 md:-right-8 w-16 h-12 rounded-[50%] border-[0.5px] border-[#A599B5]/40 -rotate-12 items-center justify-start pl-2 anim-float pointer-events-none hidden sm:flex">
                <div className="w-1.5 h-1.5 rounded-full bg-[#A599B5]" />
              </div>
              
              <div className="mt-12 md:mt-16 text-[8px] tracking-[0.2em] uppercase text-[#8B958A] border-l-2 border-[#A599B5]/30 pl-3 inline-block text-left">
                SOCIAL FIELD <br/> 0{links.length} SIGNALS
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center border-t border-[#2C2825]/10 pt-8 md:pt-0 md:border-none">
              {links.map((link: any, idx: number) => {
                const accents = ['text-[#704E59]', 'text-[#BA6F61]', 'text-[#8B958A]'];
                const bgAccents = ['bg-[#704E59]', 'bg-[#BA6F61]', 'bg-[#8B958A]'];
                const accentClass = accents[idx % 3];
                const bgClass = bgAccents[idx % 3];
                
                return (
                  <a 
                    key={idx} 
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Visit ${link.label}`}
                    className="group relative flex items-center gap-4 sm:gap-6 py-6 border-b border-[#2C2825]/10 hover:bg-black/[0.02] transition-colors -mx-4 px-4 sm:mx-0 sm:px-0"
                  >
                    <div className="absolute left-0 bottom-0 w-0 h-[1px] bg-current transition-all duration-500 group-hover:w-full opacity-30" />
                    
                    <div className={`text-[9px] tracking-[0.2em] font-bold ${accentClass} flex items-center gap-2 w-8 shrink-0`}>
                      <span className="w-1.5 h-[1px] bg-current opacity-0 group-hover:opacity-100 transition-opacity" />
                      0{idx + 1}
                    </div>
                    
                    <div className={`w-10 h-10 rounded-full border border-[#2C2825]/10 flex items-center justify-center text-[#2C2825] md:group-hover:scale-110 md:group-hover:-rotate-12 transition-transform duration-300 bg-white shadow-sm shrink-0`}>
                      <div className="w-4 h-4">
                        {getPlatformIcon(link.icon)}
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <span className="text-[11px] font-bold uppercase text-[#2C2825] mb-1 truncate">{link.label}</span>
                      <span className="text-[8px] tracking-[0.2em] uppercase text-[#8B958A] truncate">{link.description || 'SIGNAL / LINK'}</span>
                    </div>
                    
                    <div className={`w-1.5 h-1.5 rounded-full ${bgClass} mx-2 md:mr-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0`} />
                    
                    <div className="text-[#2C2825] opacity-30 group-hover:opacity-100 md:group-hover:translate-x-1 md:group-hover:-translate-y-1 transition-all shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5"></line><polyline points="12 5 19 5 19 12"></polyline></svg>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* 6. Footer */}
        <footer className="px-8 sm:px-12 py-12 flex flex-col items-center text-center">
          <div className="text-[8px] tracking-[0.25em] text-[#8B958A] uppercase font-bold mb-8">
            THE END OF THE PAGE / THE START OF THE CONVERSATION
          </div>
          
          <p className="visionary-serif text-xl sm:text-2xl text-[#2C2825] italic mb-12">
            Tomorrow is easier to build when someone is willing to see it early.
          </p>
          
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-[8px] tracking-[0.2em] text-[#8B958A] uppercase font-bold mb-6">
            <span className="text-[#2C2825]">VISION INDEX</span>
            <span>01 — BUILD</span>
            <span>02 — EXPLORE</span>
            <span>03 — CONNECT</span>
          </div>
          
          <div className="text-[8px] tracking-[0.3em] text-[#2C2825] uppercase font-bold">
            UNOOL / {currentYear}
          </div>
        </footer>
        
      </div>
    </div>
  );
}

function HustlerTemplate({ profile, accentColor }: any) {
  const accent = accentColor || '#FF5500';
  return (
    <div className="min-h-screen w-full bg-[#F3F4F6] text-[#111] p-4 flex flex-col font-sans uppercase font-black">
       <div className="w-full bg-black text-white p-2 overflow-hidden mb-6 flex rounded shadow-lg whitespace-nowrap text-xs md:text-sm">
         <div className="animate-pulse mr-4" style={{ color: accent }}>LIVE UPDATE</div>
         <div className="overflow-hidden w-full relative">
           <div className="inline-block animate-marquee">{profile.bio} — {profile.bio} — {profile.bio}</div>
         </div>
       </div>

       <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col gap-6">
         <div className="bg-white p-6 shadow-xl border-l-[8px] flex items-center gap-6" style={{ borderLeftColor: accent }}>
           <img src={profile.avatarUrl} alt={profile.name} className="w-20 h-20 rounded shadow-inner" />
           <div>
             <h1 className="text-3xl md:text-5xl tracking-tighter mb-1">{profile.name}</h1>
             <h2 className="text-gray-500 font-bold tracking-tight">{profile.headline}</h2>
           </div>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           {profile.links?.map((link: any, i: number) => (
             <a key={i} href={link.url} className="bg-white p-6 shadow-[4px_4px_0_0_#9CA3AF] hover:shadow-[0_0_0_0_#9CA3AF] hover:translate-x-1 hover:translate-y-1 transition-all border-2 border-gray-300 relative group overflow-hidden">
               <div className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out opacity-20" style={{ backgroundColor: accent }} />
               <span className="relative z-10 text-xl tracking-tight block truncate">{link.label}</span>
               <div className="relative z-10 w-full h-1 bg-gray-200 mt-4 rounded-full overflow-hidden">
                 <div className="h-full bg-black block" style={{ width: `${(100 - i * 15)}%` }} />
               </div>
             </a>
           ))}
         </div>
       </div>
    </div>
  );
}


// --- 05 INFLUENCER --- //

function AestheteTemplate({ profile }: any) {
  return (
    <div className="min-h-screen w-full bg-[#E5E0D8] text-[#2C2B29] p-4 md:p-12 font-serif flex justify-center">
      <div className="max-w-4xl w-full bg-[#EFEDE6] shadow-2xl relative">
        <div className="p-8 md:p-16 text-center space-y-8 flex flex-col items-center">
          <p className="uppercase tracking-[0.3em] text-xs font-sans text-gray-500">Vol. I — Identity</p>
          <h1 className="text-5xl md:text-8xl tracking-tight text-[#1A1A1A]">{profile.name}</h1>
          <p className="text-xl md:text-2xl max-w-lg mb-12 italic text-gray-700">{profile.headline}</p>
          
          <img src={profile.avatarUrl} alt={profile.name} className="w-full aspect-[4/3] object-cover mb-12 sepia-[0.1] shadow-lg" />
          
          <p className="text-sm md:text-base max-w-xl mx-auto leading-loose text-gray-600 font-sans font-light tracking-wide mb-16 text-justify">
            {profile.bio}
          </p>

          <div className="w-full flex flex-col items-center gap-6 z-10">
            {profile.links?.map((link: any, i: number) => (
              <a key={i} href={link.url} className="text-xl md:text-3xl hover:italic transition-all border-b border-transparent hover:border-[#1A1A1A] pb-1 font-light flex items-center justify-center">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreatorTemplate({ profile, accentColor }: any) {
  const accent = accentColor || '#7C3AED';
  return (
    <div className="min-h-screen w-full bg-[#0F0F13] text-white p-4 font-sans flex justify-center">
      <div className="max-w-2xl w-full pt-16 flex flex-col items-center space-y-10">
        
        <div className="relative group">
          <div className="absolute -inset-1 rounded-full blur opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt" style={{ backgroundImage: `linear-gradient(to right, ${accent}, #FF0080)` }} />
          <img src={profile.avatarUrl} alt={profile.name} className="relative w-32 h-32 rounded-full border-2 border-black object-cover" />
        </div>
        
        <div className="text-center space-y-2">
           <h1 className="text-4xl font-black tracking-tight">{profile.name}</h1>
           <p className="text-[#A1A1AA] font-medium">{profile.headline}</p>
           <p className="max-w-sm text-sm text-[#71717A] mt-4 leading-relaxed">{profile.bio}</p>
        </div>

        <div className="w-full grid gap-4 mt-8 pb-12">
          {profile.links?.map((link: any, i: number) => (
            <a key={i} href={link.url} className="relative w-full h-20 md:h-24 bg-gradient-to-r from-zinc-900 to-zinc-950 rounded-2xl p-[2px] overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <div className="w-full h-full bg-zinc-950 rounded-xl relative z-10 flex items-center px-6 overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black/50 to-transparent pointer-events-none" style={{ background: `linear-gradient(to left, ${accent}20, transparent)` }} />
                <div className="bg-white/10 p-3 rounded-full mr-4 group-hover:scale-110 transition-transform">
                  ▶
                </div>
                <span className="text-lg md:text-xl font-bold">{link.label}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function VoiceTemplate({ profile }: any) {
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTimer, setToastTimer] = useState<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer) clearTimeout(toastTimer);
    const timer = setTimeout(() => {
      setToastVisible(false);
    }, 2200);
    setToastTimer(timer);
  };

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

    .voice-template {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #2B2321;
      line-height: 1.5;
    }
    
    .voice-template .font-serif {
      font-family: 'Playfair Display', Georgia, serif;
    }
    
    .voice-template .btn-primary {
      background-color: #DF5B4C;
      color: #FFFAF3;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .voice-template .btn-primary:hover {
      background-color: #B8473D;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(184, 71, 61, 0.2);
    }
    
    .voice-template .btn-secondary {
      background-color: transparent;
      border: 1px solid #A99C91;
      color: #2B2321;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .voice-template .btn-secondary:hover {
      background-color: #FFFAF3;
      border-color: #2B2321;
    }

    .voice-template .paper-card {
      background-color: #FFFAF3;
      border-radius: 16px;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid rgba(169, 156, 145, 0.15);
    }
    .voice-template .paper-card:hover {
      box-shadow: 0 12px 40px rgba(43, 35, 33, 0.06);
      border-color: rgba(169, 156, 145, 0.3);
      transform: translateY(-2px);
    }

    .voice-template .section-divider {
      height: 1px;
      background-color: rgba(169, 156, 145, 0.3);
      width: 100%;
    }

    .voice-template .arch-image {
      border-top-left-radius: 200px;
      border-top-right-radius: 200px;
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 12px;
      object-fit: cover;
    }
  `;

  // Fallbacks
  const stats = profile.stats || [
    { label: "People listening", value: "284K" },
    { label: "Monthly reach", value: "6.8M" },
    { label: "Return rate", value: "92%" }
  ];

  const featured = profile.featured || [
    { 
      title: "Attention is a practice.", 
      category: "ESSAY / 10 MIN READ", 
      date: "SEP 2026", 
      desc: "A field note on making meaningful work in a world that keeps asking for more of you.",
      url: "#"
    }
  ];

  const activities = profile.activity || [
    { type: "NEWSLETTER", title: "Field Notes 014: the joy of changing your mind", date: "2 days ago", url: "#" },
    { type: "PODCAST", title: "A conversation about ambition without the performance", date: "1 week ago", url: "#" },
    { type: "NOTES", title: "Three questions I ask before I say yes", date: "2 weeks ago", url: "#" }
  ];

  const statement = profile.metadata?.statement || "Say the thing that stays with them.";
  const statementSub = profile.metadata?.statementSub || "Every episode, essay, and conversation starts with curiosity — then gets a little braver.";

  return (
    <div className="voice-template w-full min-h-screen bg-[#FAF8F5] p-6 md:p-8 lg:p-12 flex justify-center">
      <style>{customStyles}</style>

      {/* Main Card Wrapper */}
      <div className="w-full max-w-[1200px] bg-[#F4EEE6] rounded-[32px] md:rounded-[48px] shadow-2xl relative overflow-hidden flex justify-center py-10 md:py-16 px-6 md:px-12 lg:px-16 border border-[#A99C91]/15">
        
        {/* Main Content Container */}
        <div className="w-full max-w-[960px] mx-auto relative z-10">
          
          {/* Header */}
          <header className="flex justify-between items-center pb-6 mb-8 md:mb-12">
            <div className="flex items-center gap-2">
               <div className="w-4 h-4 bg-[#DF5B4C] rounded-sm transform rotate-45"></div>
               <span className="font-bold tracking-widest text-xs uppercase">The Voice</span>
            </div>
            <div className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-[#DF5B4C] flex items-center gap-2 md:gap-4">
               <span className="text-[#766B64]">Influencer / 03</span>
               <span>↗</span>
            </div>
          </header>

          {/* 1. Hero */}
          <section className="flex flex-col-reverse md:flex-row gap-10 md:gap-8 items-center md:items-start mb-16 md:mb-24">
            <div className="w-full md:w-1/2 flex flex-col justify-center mt-2 md:mt-10 text-center md:text-left items-center md:items-start">
              <p className="text-[#A99C91] text-xs font-bold tracking-[0.2em] uppercase mb-4 md:mb-6 flex items-center justify-center md:justify-start gap-4 w-full">
                <span className="w-8 h-px bg-[#A99C91] hidden md:block"></span>
                A voice in progress
              </p>
              <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] text-[#2B2321] mb-5 tracking-tight">
                {profile.name?.split(' ')[0] || "Maya"} <br className="hidden md:block" />
                <span className="text-[#DF5B4C] italic pr-0 md:pr-4">{profile.name?.split(' ').slice(1).join(' ') || "Vale"}</span>
              </h1>
              <p className="text-base md:text-lg text-[#766B64] font-medium mb-5">
                {profile.role || profile.headline || "Writer, host & cultural commentator"}
              </p>
              <p className="text-sm md:text-base text-[#2B2321] max-w-sm leading-relaxed mb-8">
                {profile.bio || "I make room for the complicated thought, the honest question, and the story you carry home."}
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <a href={`mailto:${profile.email || 'hello@example.com'}`} className="btn-primary w-full sm:w-auto justify-center px-6 py-3 rounded-full font-semibold text-sm tracking-wide flex items-center gap-2 group">
                  Get in touch
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </a>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(typeof window !== 'undefined' ? window.location.href : '');
                    showToast('Profile link copied!');
                  }}
                  className="btn-secondary w-full sm:w-auto justify-center px-6 py-3 rounded-full font-semibold text-sm tracking-wide flex items-center gap-2 group">
                  Share profile
                  <ArrowRight className="w-4 h-4 transform rotate-[-45deg] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
            </div>
            
            <div className="w-full md:w-1/2 flex justify-center md:justify-end relative mt-4 md:mt-0">
              <div className="hidden md:block absolute top-8 left-8 text-[#DF5B4C] z-10">
                 <ArrowRight className="w-6 h-6 transform rotate-[135deg]" />
              </div>
              {profile.avatarUrl ? (
                <img 
                  src={profile.avatarUrl} 
                  alt={profile.name} 
                  className="arch-image w-full max-w-[320px] md:max-w-[380px] h-[380px] md:h-[480px] object-cover shadow-xl relative z-0"
                />
              ) : (
                <div className="arch-image w-full max-w-[320px] md:max-w-[380px] h-[380px] md:h-[480px] bg-[#D9D2E6] flex items-center justify-center shadow-xl relative z-0">
                  <span className="font-serif text-4xl text-[#766B64] opacity-50">Profile</span>
                </div>
              )}
              <div className="absolute bottom-4 left-4 md:bottom-8 md:left-12 text-white text-xs font-bold tracking-widest uppercase z-10 drop-shadow-md">
                {new Date().getFullYear()} / Profile
              </div>
            </div>
          </section>

          {/* 2. Point of View */}
          <section className="mb-16 md:mb-24 relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 w-[250px] h-[250px] rounded-full bg-[#A8B89D] opacity-20 blur-3xl -z-10 pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-16 relative z-10">
              <div className="relative">
                <span className="text-[#DF5B4C] text-[10px] md:text-xs font-bold tracking-widest block md:absolute md:-left-10 md:top-2 mb-3 md:mb-0">01</span>
                <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl leading-[1.1] text-[#2B2321] max-w-2xl relative z-10">
                  <span className="absolute -left-2 md:-left-6 -top-3 md:-top-6 text-5xl md:text-7xl text-[#A8B89D] opacity-40 -z-10 select-none">“</span>
                  {statement}
                </h2>
              </div>
              <div className="md:w-1/3 md:pb-2 border-l-2 border-[#A8B89D]/30 pl-4 md:border-none md:pl-0">
                <p className="text-[#766B64] leading-relaxed text-sm">
                  {statementSub}
                </p>
              </div>
            </div>
          </section>

          {/* 3. Proof */}
          {stats && stats.length > 0 && (
            <section className="mb-16 md:mb-24">
              <div className="flex items-center justify-between mb-6 md:mb-10 relative">
                <span className="text-[#DF5B4C] text-[10px] md:text-xs font-bold tracking-widest md:absolute md:-left-10">02</span>
                <span className="text-[#A99C91] text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase ml-auto">A little proof</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 pl-0 md:pl-6">
                {stats.map((stat: any, i: number) => (
                  <div key={i} className="flex flex-col border-t border-[rgba(169,156,145,0.3)] pt-4 md:pt-5">
                    <span className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#2B2321] mb-1">{stat.value}</span>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-[#766B64]">{stat.label}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. Links */}
          {profile.links && profile.links.length > 0 && (
            <section className="mb-16 md:mb-24 relative">
              <div className="flex items-center justify-between mb-6 md:mb-10 relative">
                  <span className="text-[#DF5B4C] text-[10px] md:text-xs font-bold tracking-widest md:absolute md:-left-10">03</span>
                  <span className="text-[#A99C91] text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase ml-auto">Official Links</span>
              </div>
              
              <div className="flex flex-col gap-3 pl-0 md:pl-6">
                {profile.links.map((link: any, i: number) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="paper-card p-3 md:p-5 flex items-center justify-between group">
                    <div className="flex items-center gap-3 md:gap-5">
                      <div className="w-10 h-10 rounded-full bg-[#F4EEE6] text-[#DF5B4C] flex items-center justify-center group-hover:bg-[#DF5B4C] group-hover:text-white transition-colors shrink-0">
                          <LinkIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#2B2321] text-sm md:text-base">{link.label}</h3>
                        <p className="text-xs text-[#766B64] mt-0.5 truncate max-w-[150px] sm:max-w-[300px] md:max-w-[400px]">
                          {link.url.replace(/^https?:\/\/(www\.)?/, '')}
                        </p>
                      </div>
                    </div>
                    <div className="text-[#DF5B4C] md:text-[#A99C91] group-hover:text-[#DF5B4C] transition-colors pl-4 shrink-0">
                      <ArrowRight className="w-5 h-5 transform rotate-[-45deg] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* 5. Featured Work */}
          {featured && featured.length > 0 && (
            <section className="mb-16 md:mb-24 relative">
              <div className="flex items-center justify-between mb-6 md:mb-10 relative">
                <span className="text-[#DF5B4C] text-[10px] md:text-xs font-bold tracking-widest md:absolute md:-left-10">04</span>
                <span className="text-[#A99C91] text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase ml-auto">On the record</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-0 md:pl-6">
                {featured.map((item: any, i: number) => (
                  <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="paper-card overflow-hidden flex flex-col md:flex-row group col-span-1 md:col-span-2">
                    <div className="md:w-5/12 h-48 md:h-auto bg-[#766B64] relative overflow-hidden shrink-0">
                      {item.image ? (
                         <img src={item.image} alt={item.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-700" />
                      ) : (
                         <div className="w-full h-full bg-[#2B2321] flex items-center justify-center p-6">
                           <div className="w-20 h-20 rounded-full border border-[rgba(255,250,243,0.1)] flex items-center justify-center">
                             <Sparkles className="w-6 h-6 text-[#A8B89D]" />
                           </div>
                         </div>
                      )}
                      <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#DF5B4C] text-white flex items-center justify-center transform rotate-[-45deg] opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all md:translate-y-2 md:group-hover:translate-y-0">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="p-5 md:p-8 md:w-7/12 flex flex-col justify-center">
                      <p className="text-[9px] font-bold tracking-[0.2em] text-[#A99C91] uppercase mb-3">
                        <span className="text-[#DF5B4C]">{item.category}</span> <span className="mx-1.5">·</span> {item.date}
                      </p>
                      <h3 className="font-serif text-2xl md:text-4xl text-[#2B2321] leading-tight mb-3 group-hover:text-[#DF5B4C] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-[#766B64] leading-relaxed mb-6 max-w-lg">
                        {item.desc}
                      </p>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#DF5B4C] flex items-center gap-2 border-b border-[#DF5B4C]/30 pb-1 w-fit group-hover:pr-2 group-hover:border-[#DF5B4C] transition-all">
                        Read the full piece <ArrowRight className="w-3 h-3 transform rotate-[-45deg]" />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* 6. Activity */}
          {activities && activities.length > 0 && (
            <section className="mb-16 md:mb-24 relative">
              <div className="flex items-center justify-between mb-6 md:mb-10 relative">
                <span className="text-[#DF5B4C] text-[10px] md:text-xs font-bold tracking-widest md:absolute md:-left-10">05</span>
                <span className="text-[#A99C91] text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase ml-auto">Recently Said</span>
              </div>

              <div className="pl-0 md:pl-6 flex flex-col gap-0">
                {activities.map((act: any, i: number) => (
                  <a key={i} href={act.url} target="_blank" rel="noopener noreferrer" className="py-4 md:py-5 border-b border-[rgba(169,156,145,0.2)] group flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[rgba(255,250,243,0.5)] px-4 -mx-4 rounded-xl transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-10 w-full md:w-auto">
                      <span className="text-[9px] font-bold tracking-[0.2em] text-[#DF5B4C] uppercase w-24 shrink-0">
                        {act.type}
                      </span>
                      <span className="font-medium text-[#2B2321] text-sm md:text-base group-hover:text-[#DF5B4C] transition-colors leading-snug">
                        {act.title}
                      </span>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto mt-1 md:mt-0 shrink-0">
                      <span className="text-[10px] font-semibold text-[#A99C91] uppercase tracking-wider">{act.date}</span>
                      <ArrowRight className="w-4 h-4 text-[#DF5B4C] md:text-[#A99C91] group-hover:text-[#DF5B4C] transform rotate-[-45deg]" />
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* 7. Contact & Footer */}
          <section className="relative mt-16 md:mt-24 pt-12 md:pt-16 border-t border-[rgba(169,156,145,0.3)]">
            <span className="text-[#DF5B4C] text-[10px] md:text-xs font-bold tracking-widest md:absolute md:-left-10 md:top-16 mb-8 block text-center md:text-left">06</span>
            
            <div className="flex flex-col items-center text-center mb-16 md:mb-20">
              <p className="text-[#A99C91] text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase mb-6">Keep in touch</p>
              <h2 className="font-serif text-4xl md:text-6xl lg:text-7xl leading-[1.1] text-[#2B2321] mb-8">
                Bring me into <br className="hidden sm:block" /> <span className="text-[#DF5B4C] italic">the conversation.</span>
              </h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center">
                <a href={`mailto:${profile.email || 'hello@example.com'}`} className="btn-primary w-full sm:w-auto justify-center px-8 py-3.5 rounded-full font-semibold text-sm tracking-wide flex items-center gap-2 group">
                  Get in touch
                  <ArrowRight className="w-4 h-4 transform rotate-[-45deg] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </a>
                <button 
                  onClick={() => {
                    const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:${profile.name};;;;\nFN:${profile.name}\nORG:${profile.company || ''}\nTITLE:${profile.role || ''}\nURL:${typeof window !== 'undefined' ? window.location.origin : ''}\nEND:VCARD`;
                    const blob = new Blob([vcard], { type: 'text/vcard' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${profile.name?.replace(/\s+/g, '_') || 'Contact'}.vcf`;
                    a.click();
                    showToast('Contact saved!');
                  }}
                  className="btn-secondary w-full sm:w-auto justify-center px-8 py-3.5 rounded-full font-semibold text-sm tracking-wide flex items-center gap-2 group hover:bg-[#FFFAF3]">
                  Save contact
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-y-1 transition-transform" />
                </button>
              </div>
              <p className="text-[#A99C91] text-[10px] md:text-xs font-medium mt-6">For talks, collaborations, and good questions.</p>
            </div>

            <footer className="flex flex-col md:flex-row justify-between items-center gap-4 pb-4 text-[9px] font-bold tracking-[0.2em] uppercase text-[#A99C91] border-t border-[rgba(169,156,145,0.15)] pt-6">
              <div className="flex items-center gap-2">
                <span className="text-[#2B2321]">{profile.name?.toUpperCase() || "MAYA VALE"}</span>
              </div>
              <div className="text-center text-[#766B64]">
                MATERIAL DRAWING / THE VOICE.
              </div>
              <div>
                &copy; {new Date().getFullYear()}
              </div>
            </footer>
          </section>

        </div>
      </div>
      
      {/* Toast */}
      {toastVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#2B2321] text-[#FFFAF3] px-6 py-3 rounded-full text-sm font-medium shadow-2xl z-50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <BadgeCheck className="w-5 h-5 text-[#DF5B4C]" />
          {toastMsg}
        </div>
      )}
    </div>
  );
}


// A dynamic template that adjusts its vibe based on the selected identity template ID.
export function IdentityTemplate(props: TemplateProps & { templateId: string }) {
  const { templateId } = props;

  switch (templateId) {
    // Individual
    case 'lover': return <LoverTemplate {...props} />;
    case 'lone': return <LoneTemplate {...props} />;
    case 'energy': return <EnergyTemplate {...props} />;
    
    // Startup
    case 'rebellion': return <RebellionTemplate {...props} />;
    case 'vision': return <VisionTemplate {...props} />;
    case 'human': return <HumanTemplate {...props} />;
    
    // Agency
    case 'the-studio': return <StudioTemplate {...props} />;
    case 'the-machine': return <MachineTemplate {...props} />;
    case 'the-club': return <ClubTemplate {...props} />;
    
    // Entrepreneur
    case 'the-builder': return <BuilderTemplate {...props} />;
    case 'the-visionary': return <VisionaryTemplate {...props} />;
    case 'the-hustler': return <HustlerTemplate {...props} />;
    
    // Influencer
    case 'the-aesthete': return <AestheteTemplate {...props} />;
    case 'the-creator': return <CreatorTemplate {...props} />;
    case 'the-voice': return <VoiceTemplate {...props} />;
    
    default:
      return <LoneTemplate {...props} />; // Fallback
  }
}
