'use client';

import React, { useState } from 'react';
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

  const copyEmail = () => {
    navigator.clipboard.writeText(profile.email || 'hello@example.com');
    showToast('Email copied to clipboard!');
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
    <div className="human-theme min-h-[100dvh] w-full relative overflow-x-hidden antialiased flex flex-col">
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
        <section className="relative w-full max-w-[1300px] mx-auto px-6 mt-4 md:mt-12 flex flex-col lg:flex-row items-center lg:items-stretch justify-end min-h-[500px]">
          
          {/* Text Content (Overlapping) */}
          <div className="w-full lg:w-3/5 flex flex-col z-20 lg:absolute lg:left-8 lg:top-1/2 lg:-translate-y-1/2 mt-12 lg:mt-0 text-center lg:text-left order-2 lg:order-1">
            <span className="font-serif italic text-[#F4EDDC] text-xl md:text-2xl opacity-90 block mb-2">
              @{profile.subdomain || 'identity'}
            </span>
            <h1 className="font-serif text-[#F4EDDC] text-[4.5rem] sm:text-[6rem] lg:text-[8.5rem] leading-[0.9] tracking-tight mb-4 drop-shadow-lg lg:drop-shadow-none">
              {profile.name}
            </h1>
            <h2 className="font-sans text-[#AEA997] text-xl sm:text-2xl md:text-3xl font-light tracking-wide max-w-2xl mx-auto lg:mx-0">
              {profile.headline || profile.role || 'Professional Profile'}
            </h2>
          </div>

          {/* Image Content */}
          <div className="w-full lg:w-[55%] relative flex justify-center lg:justify-end order-1 lg:order-2">
            <div className="w-[300px] h-[340px] sm:w-[420px] sm:h-[480px] lg:w-[540px] lg:h-[600px] relative z-10">
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
          <section className="relative w-full mt-24 md:mt-32 lg:mt-40 z-10 px-4 md:px-8">
            <div className="human-bio-surface absolute inset-0 -mx-4 md:-mx-8 scale-x-[1.02] -rotate-1 shadow-2xl" />
            
            <div className="relative z-10 max-w-6xl mx-auto py-16 md:py-24 flex flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-16 px-4 md:px-8">
              
              <div className="relative flex-1 text-center lg:text-left mt-12 lg:mt-0">
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:-top-16 lg:-left-12 text-[#E2B746] font-serif text-[10rem] md:text-[14rem] leading-none select-none opacity-90">“</div>
                <h3 className="font-serif text-[#1B1D1B] text-4xl md:text-5xl lg:text-[4.5rem] leading-[1.05] tracking-tight relative z-10 max-w-3xl">
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
          <section className="w-full max-w-6xl mx-auto px-6 mt-20 md:mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative z-10">
            {profile.proofs.slice(0,3).map((proof: any, i: number) => {
              const s = [
                { bg: '#E2B746', text: '#1B1D1B', cls: 'human-metric-1', icon: <Users size={32} strokeWidth={1.5} />, dec: 'chart' },
                { bg: '#A5AE89', text: '#1B1D1B', cls: 'human-metric-2', icon: <div className="flex -space-x-3"><div className="w-8 h-8 rounded-full border border-current opacity-60"></div><div className="w-8 h-8 rounded-full border border-current opacity-80"></div><div className="w-8 h-8 rounded-full border border-current"></div></div>, dec: 'dots' },
                { bg: '#BE5B42', text: '#F4EDDC', cls: 'human-metric-3', icon: <Eye size={32} strokeWidth={1.5} />, dec: 'wave' }
              ][i % 3];

              return (
                <div key={i} className={\`\${s.cls} p-8 md:p-10 flex flex-row items-center justify-between shadow-xl relative overflow-hidden transition-transform duration-300 hover:-translate-y-2\`}>
                  <div className="flex flex-col justify-between h-full min-h-[90px] gap-6">
                    <div className="opacity-80">{s.icon}</div>
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
                  
                  <div className="flex flex-col text-left items-start ml-6 flex-1 overflow-hidden">
                    <span className="font-serif text-[2.5rem] md:text-[3.25rem] font-bold tracking-tight leading-none mb-2 break-all">{proof.value}</span>
                    <span className="font-sans text-sm md:text-base font-bold tracking-wide capitalize truncate w-full">{proof.title || proof.type}</span>
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
          <section className="w-full max-w-4xl mx-auto px-6 mt-24 md:mt-32 relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 md:mb-12 border-b border-[#AEA997]/20 pb-4 md:pb-6">
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
                     className="human-social-link flex items-center justify-between p-3 md:p-4 shadow-lg group"
                     style={{ backgroundColor: style.bg, color: style.text }}>
                    <div className="flex items-center gap-5 md:gap-6">
                      <div className="w-14 h-14 md:w-16 md:h-16 bg-white/60 rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-[#1B1D1B]">
                        {getIcon(link.icon || link.label)}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-sans font-bold text-lg md:text-xl tracking-tight">{link.label}</span>
                        <span className="font-sans text-xs md:text-sm opacity-70 font-medium truncate max-w-[200px] md:max-w-none mt-0.5">
                          {link.url.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                        </span>
                      </div>
                    </div>
                    <div className="pr-4 md:pr-6 opacity-40 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
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
      <footer className="relative mt-24 md:mt-40 pt-32 pb-16 overflow-hidden w-full flex items-center min-h-[350px]">
        {/* Organic layered backgrounds */}
        <div className="absolute bottom-0 right-0 w-[85%] md:w-[70%] h-full bg-[#EFE4CC] human-footer-shape-1 z-0 shadow-2xl" />
        <div className="absolute bottom-0 left-0 w-[70%] md:w-[45%] h-[85%] bg-[#BE5B42] human-footer-shape-2 z-0 shadow-2xl" />
        <div className="absolute -bottom-16 left-[20%] w-[35%] h-[60%] bg-[#123040] human-footer-shape-3 z-0 shadow-2xl" />

        <div className="relative z-10 w-full max-w-[1300px] mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-end gap-12 h-full pb-4">
          
          <div className="flex flex-col text-[9px] uppercase tracking-[0.25em] font-bold text-[#1B1D1B] opacity-50 leading-[2] hidden md:flex pb-2">
            Kinder<br/>People<br/>Braver<br/>Tomorrows<br/>
            <div className="w-8 h-[2px] bg-[#1B1D1B] mt-3"></div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full md:w-auto mx-auto md:ml-auto md:mr-16">
            <button 
              onClick={copyEmail} 
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
              <a href="#" onClick={(e) => { e.preventDefault(); copyEmail(); setMenuOpen(false); }} className="text-3xl font-serif hover:italic transition-all opacity-90 hover:opacity-100">Contact</a>
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
  );
}


// --- 03 AGENCY --- //

function StudioTemplate({ profile }: any) {
  return (
    <div className="min-h-screen w-full bg-white text-[#111] p-12 md:p-24 flex flex-col justify-center font-sans tracking-tight">
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-5 space-y-8 relative">
           <div className="absolute -left-12 -top-12 text-[200px] text-gray-100 font-serif leading-none select-none z-0">
             {profile.name?.charAt(0)}
           </div>
           <div className="relative z-10">
             <h1 className="text-5xl md:text-7xl font-light mb-4">{profile.name}</h1>
             <div className="w-12 h-1 bg-black mb-8" />
             <p className="text-2xl font-serif italic text-gray-500 mb-6">{profile.headline}</p>
             <p className="text-sm uppercase tracking-widest text-gray-400 leading-loose max-w-sm">{profile.bio}</p>
           </div>
        </div>
        
        <div className="md:col-span-7 flex flex-col gap-6 items-end w-full">
          {profile.links?.map((link: any, i: number) => (
            <a key={i} href={link.url} className={`block w-full max-w-md p-8 bg-gray-50 hover:bg-black hover:text-white transition-all border border-gray-100 flex justify-between ${i % 2 !== 0 ? 'md:mr-12' : ''}`}>
              <span className="font-serif italic text-xl">{link.label}</span>
              <span className="font-sans text-xs uppercase tracking-widest opacity-50 block mt-2">View Project ↗</span>
            </a>
          ))}
        </div>
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

function ClubTemplate({ profile, accentColor }: any) {
  const accent = accentColor || '#D600FF';
  return (
    <div className="min-h-screen w-full bg-black text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl scale-110" style={{ backgroundImage: `url(${profile.avatarUrl})` }} />
      <div className="relative z-10 p-6 md:p-12 flex flex-col md:flex-row gap-8 items-center md:items-stretch max-w-7xl mx-auto min-h-screen py-20">
        
        <div className="flex-1 relative flex items-center justify-center">
            <div className="w-64 h-80 md:w-96 md:h-[500px] bg-zinc-900 rotate-[-4deg] border-4 border-white shadow-2xl overflow-hidden group">
               <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover grayscale mix-blend-luminosity group-hover:mix-blend-normal transition-all" />
               <div className="absolute bottom-[-1px] left-[-1px] right-[-1px] bg-white text-black p-4 font-bold text-2xl uppercase tracking-tighter">
                 ★ {profile.name}
               </div>
            </div>
            {/* Collage stickers */}
            <div className="absolute top-10 right-10 md:top-20 md:-right-10 bg-white text-black font-black uppercase italic p-3 text-xl rotate-12">{profile.headline}</div>
        </div>
        
        <div className="flex-1 flex flex-col justify-center space-y-6 w-full max-w-md">
          <p className="bg-black/80 backdrop-blur text-white p-6 font-mono border border-zinc-800 text-sm leading-relaxed">{profile.bio}</p>
          <div className="space-y-3">
            {profile.links?.map((link: any, i: number) => (
              <a key={i} href={link.url} className={`block w-full p-5 font-bold uppercase tracking-tighter text-xl border-l-[6px] bg-zinc-900/80 hover:bg-white hover:text-black transition-all`} style={{ borderLeftColor: i % 2 === 0 ? accent : '#00F0FF' }}>
                {link.label}
              </a>
            ))}
          </div>
        </div>

      </div>
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

function VisionaryTemplate({ profile, accentColor }: any) {
  const accent = accentColor || '#D4AF37';
  return (
    <div className="min-h-screen w-full bg-[#141414] text-white p-8 md:p-16 flex flex-col justify-center items-center text-center font-sans font-light">
      <div className="max-w-3xl w-full flex flex-col items-center space-y-10">
        <img src={profile.avatarUrl} alt={profile.name} className="w-28 h-28 rounded-full border border-gray-700 p-1 object-cover" />
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl tracking-widest uppercase">{profile.name}</h1>
          <div className="w-24 h-[1px] mx-auto bg-gray-700" />
          <p className="text-lg md:text-xl text-gray-400 uppercase tracking-widest">{profile.headline}</p>
        </div>
        
        <p className="max-w-xl text-gray-300/80 leading-loose text-sm md:text-base border-l border-gray-700 pl-6 pb-6 border-b text-left">
          {profile.bio}
        </p>
        
        <div className="w-full max-w-xl pt-12 space-y-4">
          {profile.links?.map((link: any, i: number) => (
            <a key={i} href={link.url} className="block w-full border border-gray-800 bg-[#1A1A1A] p-5 uppercase tracking-widest text-xs md:text-sm hover:border-gray-500 transition-colors flex justify-between group">
              <span className="text-gray-400 group-hover:text-white transition-colors">{link.label}</span>
              <span style={{ color: accent }} className="opacity-0 group-hover:opacity-100 transition-opacity">Discover</span>
            </a>
          ))}
        </div>
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
  return (
    <div className="min-h-screen w-full bg-[#FFFFFF] text-[#000000] p-6 text-left" style={{ fontFamily: 'var(--font-serif)', maxWidth: '800px', margin: '0 auto' }}>
      <header className="border-b-4 border-black pb-6 mb-8 mt-12">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4" style={{ fontFamily: 'var(--font-sans)' }}>{profile.name}</h1>
        <h2 className="text-2xl md:text-3xl font-light italic">{profile.headline}</h2>
      </header>
      
      <main className="flex flex-col md:flex-row gap-12">
        <div className="md:w-2/3">
           <article className="prose prose-lg prose-black text-gray-800 leading-relaxed text-justify">
             <p className="text-xl md:text-2xl mb-8 font-medium">
               <span className="float-left text-6xl md:text-8xl mr-4 -mt-2 font-black" style={{ fontFamily: 'var(--font-sans)' }}>{profile.bio?.charAt(0) || '"'}</span>
               {profile.bio?.substring(1)}
             </p>
           </article>
        </div>
        
        <aside className="md:w-1/3 border-t-2 md:border-t-0 md:border-l-2 border-gray-200 md:pl-8 pt-8 md:pt-0">
          <p className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-6 font-sans">Index</p>
          <ul className="space-y-4 font-sans font-medium text-sm">
            {profile.links?.map((link: any, i: number) => (
              <li key={i} className="border-b border-gray-100 pb-4">
                <a href={link.url} className="hover:text-gray-500 hover:underline flex justify-between transition-all">
                  <span>{link.label}</span>
                  <span className="text-gray-300">0{i+1}</span>
                </a>
              </li>
            ))}
          </ul>
        </aside>
      </main>
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
