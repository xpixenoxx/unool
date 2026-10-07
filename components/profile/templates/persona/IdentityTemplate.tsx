'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { TemplateProps } from '@/components/profile/templates/types';
import { getTemplateById } from '@/components/profile/templates/registry';
import { motion } from 'framer-motion';
import { Menu, BadgeCheck, ArrowRight, Bookmark, Send, Sparkles, Quote, Github, Linkedin, Instagram, ExternalLink, Users, Link as LinkIcon, Eye } from 'lucide-react';
import { ClubTemplate } from './ClubTemplate';
export { ClubTemplate };

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
  const accent = accentColor || '#C8102E';
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 18;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -18;
    setTilt({ x, y });
  };
  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  const getLinkSubtitle = (label: string) => {
    const l = label?.toLowerCase() || '';
    if (l.includes('youtube')) return 'Watch';
    if (l.includes('hackerrank') || l.includes('leetcode')) return 'Solve';
    if (l.includes('github') || l.includes('gitlab')) return 'Build';
    if (l.includes('instagram')) return 'Follow';
    if (l.includes('twitter') || l.includes('x.com')) return 'Follow';
    if (l.includes('linkedin')) return 'Connect';
    if (l.includes('discord')) return 'Join';
    if (l.includes('twitch')) return 'Stream';
    if (l.includes('tiktok')) return 'Watch';
    return 'Visit';
  };

  const getLinkIcon = (label: string) => {
    const l = label?.toLowerCase() || '';
    if (l.includes('youtube')) return '▶';
    if (l.includes('github') || l.includes('gitlab')) return '⌥';
    if (l.includes('instagram')) return '◈';
    if (l.includes('twitter') || l.includes('x.com')) return '𝕏';
    if (l.includes('linkedin')) return 'in';
    if (l.includes('discord')) return '◎';
    if (l.includes('hackerrank')) return '{}';
    return '↗';
  };

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;0,900;1,400;1,700&family=Inter:wght@300;400;500;600;700&family=Cinzel:wght@400;600;700;900&display=swap');

    /* ── RESET & ROOT ── */
    .reb-wrap *, .reb-wrap *::before, .reb-wrap *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .reb-wrap a { text-decoration: none; }

    .reb-wrap {
      --crimson:   ${accent};
      --crimson-l: color-mix(in srgb, ${accent} 70%, #fff);
      --gold:      #C9993A;
      --gold-l:    #E8C97A;
      --gold-pale: rgba(201, 153, 58, 0.18);
      --ivory:     #FEFAF3;
      --parchment: #F8F1E4;
      --parchment2:#F2E8D6;
      --blush:     #FAF0EE;
      --text:      #2C1810;
      --text-2:    #6B4C3B;
      --text-3:    #9E7B68;
      --serif:     'Playfair Display', Georgia, serif;
      --royal:     'Cinzel', 'Times New Roman', serif;
      --sans:      'Inter', -apple-system, sans-serif;
      --radius:    20px;
      --shadow-gold: 0 8px 40px rgba(201, 153, 58, 0.18);
      --shadow-crim: 0 8px 40px rgba(200, 16, 46, 0.12);

      font-family: var(--sans);
      background: #E8E0D5; /* Neutral background to create the gap */
      padding: clamp(36px, 9vw, 120px); /* Tripled gap between screen and template */
      color: var(--text);
      min-height: 100vh;
      overflow-x: hidden;
      position: relative;
    }

    /* ── AMBIENT BACKGROUND ORBS ── */
    .reb-orb {
      position: absolute; border-radius: 50%; pointer-events: none; z-index: 0;
      filter: blur(60px); opacity: 0.55;
    }
    .reb-orb-1 {
      width: 500px; height: 500px; top: -100px; right: -100px;
      background: radial-gradient(circle, rgba(200,16,46,0.12), transparent 70%);
      animation: reb-drift1 18s ease-in-out infinite;
    }
    .reb-orb-2 {
      width: 600px; height: 600px; bottom: -150px; left: -100px;
      background: radial-gradient(circle, rgba(201,153,58,0.1), transparent 70%);
      animation: reb-drift2 22s ease-in-out infinite;
    }
    .reb-orb-3 {
      width: 300px; height: 300px; top: 40%; left: 30%;
      background: radial-gradient(circle, rgba(255, 220, 180, 0.2), transparent 70%);
      animation: reb-drift1 14s ease-in-out infinite reverse;
    }
    @keyframes reb-drift1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-40px) scale(1.05)} }
    @keyframes reb-drift2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,30px) scale(1.08)} }

    /* ── MAIN FRAME ── */
    .reb-frame {
      max-width: 1280px; margin: 0 auto;
      padding: clamp(24px, 5vw, 48px);
      position: relative; z-index: 1;
      background: radial-gradient(ellipse 120% 80% at 50% 0%, #FFF8EE 0%, #FBF3E3 35%, #F6EAD5 65%, #F0E0C5 100%);
      border-radius: 32px;
      box-shadow: 0 24px 80px rgba(110, 70, 50, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(201,153,58,0.25);
      overflow: hidden;
    }

    /* ── HEADER ── */
    .reb-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 64px;
    }
    .reb-logo {
      display: inline-flex; align-items: center; gap: 10px;
      font-family: var(--royal); font-size: 0.85rem; font-weight: 600;
      letter-spacing: 3px; text-transform: uppercase;
      color: var(--gold);
      padding: 10px 22px; border: 1.5px solid rgba(201,153,58,0.4);
      border-radius: 50px;
      background: linear-gradient(135deg, rgba(255,248,235,0.9), rgba(242,232,214,0.9));
      backdrop-filter: blur(12px);
      box-shadow: 0 2px 16px rgba(201,153,58,0.12), inset 0 1px 0 rgba(255,255,255,0.6);
      transition: transform 0.25s, box-shadow 0.25s;
    }
    .reb-logo:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(201,153,58,0.2); }
    .reb-crown-icon {
      font-size: 1rem; line-height: 1;
      filter: drop-shadow(0 1px 2px rgba(201,153,58,0.5));
    }
    .reb-nav-right {
      display: flex; align-items: center; gap: 20px;
    }
    .reb-tagline {
      font-family: var(--serif); font-style: italic;
      font-size: 0.95rem; color: var(--text-3); letter-spacing: 0.3px;
    }
    .reb-year {
      font-family: var(--royal); font-size: 0.72rem; letter-spacing: 2px;
      text-transform: uppercase; color: var(--text-3);
      padding: 6px 14px; border: 1px solid rgba(110,70,50,0.15);
      border-radius: 30px;
    }

    /* ── HERO ── */
    .reb-hero {
      display: grid; grid-template-columns: 1fr 420px;
      gap: 0; align-items: center; min-height: 480px;
      margin-bottom: 40px;
    }
    .reb-hero-left { padding-right: 40px; }

    /* Eyebrow */
    .reb-eyebrow {
      display: inline-flex; align-items: center; gap: 10px;
      font-family: var(--royal); font-size: 0.72rem;
      letter-spacing: 4px; text-transform: uppercase;
      color: var(--crimson); margin-bottom: 24px;
    }
    .reb-eyebrow::before, .reb-eyebrow::after {
      content: ""; display: block; width: 28px; height: 1px;
      background: linear-gradient(90deg, transparent, var(--crimson));
    }
    .reb-eyebrow::after { background: linear-gradient(90deg, var(--crimson), transparent); }

    /* Giant Name */
    .reb-name {
      font-family: var(--serif); font-weight: 900;
      font-size: clamp(4.5rem, 11vw, 9.5rem); line-height: 0.88;
      letter-spacing: -3px; text-transform: lowercase;
      background: linear-gradient(145deg, var(--crimson) 0%, #A00020 25%, var(--gold) 55%, #E8C97A 75%, var(--crimson) 100%);
      background-size: 200% 200%;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: reb-shimmer-name 6s ease-in-out infinite;
      position: relative;
    }
    @keyframes reb-shimmer-name {
      0%,100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    /* Role */
    .reb-role-row {
      display: flex; align-items: center; gap: 16px; margin: 4px 0 24px;
    }
    .reb-role-gem {
      width: 10px; height: 10px; border-radius: 50%;
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      box-shadow: 0 0 10px rgba(200,16,46,0.35);
      flex-shrink: 0;
    }
    .reb-role {
      font-family: var(--serif); font-style: italic; font-weight: 500;
      font-size: clamp(1.3rem, 2.5vw, 1.8rem);
      color: var(--crimson);
    }
    .reb-bio {
      font-size: 1.05rem; line-height: 1.75; color: var(--text-2);
      max-width: 440px; font-weight: 400;
    }

    /* ── HERO RIGHT — 3D TILT CARD ── */
    .reb-card-3d-wrap {
      perspective: 900px; cursor: pointer; position: relative;
    }
    .reb-card-3d {
      width: 100%; aspect-ratio: 0.72;
      border-radius: 28px; position: relative; overflow: visible;
      transform-style: preserve-3d;
      transition: transform 0.12s ease-out;
      will-change: transform;
    }

    /* Card inner face */
    .reb-card-face {
      width: 100%; height: 100%; border-radius: 28px; overflow: hidden;
      background: linear-gradient(160deg, rgba(255,248,235,0.95) 0%, rgba(242,232,214,0.9) 60%, rgba(248,240,228,0.85) 100%);
      border: 1.5px solid rgba(201,153,58,0.3);
      box-shadow: 0 20px 80px rgba(200,16,46,0.1), 0 8px 30px rgba(201,153,58,0.12), inset 0 1px 0 rgba(255,255,255,0.7);
      backdrop-filter: blur(20px);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 0; padding: 40px 32px;
      position: relative;
    }

    /* Shimmer sweep on card */
    .reb-card-face::before {
      content: ""; position: absolute; inset: 0; border-radius: 28px;
      background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%);
      background-size: 200% 100%; background-position: -100% 0;
      animation: reb-card-shimmer 4s ease-in-out infinite;
      pointer-events: none;
    }
    @keyframes reb-card-shimmer {
      0% { background-position: -100% 0; }
      60%, 100% { background-position: 200% 0; }
    }

    /* Gold border frame accent */
    .reb-card-face::after {
      content: ""; position: absolute; inset: 10px; border-radius: 20px;
      border: 1px solid rgba(201,153,58,0.2);
      pointer-events: none;
    }

    /* Avatar ring */
    .reb-avatar-ring {
      width: 140px; height: 140px; border-radius: 50%; position: relative;
      margin-bottom: 24px; flex-shrink: 0;
    }
    .reb-avatar-ring::before {
      content: ""; position: absolute; inset: -5px; border-radius: 50%;
      background: conic-gradient(from 0deg, var(--crimson), var(--gold), #fff, var(--crimson));
      animation: reb-ring-spin 8s linear infinite;
      z-index: -1;
    }
    @keyframes reb-ring-spin { to { transform: rotate(360deg); } }
    .reb-avatar-ring::after {
      content: ""; position: absolute; inset: -8px; border-radius: 50%;
      background: conic-gradient(from 180deg, rgba(200,16,46,0.15), rgba(201,153,58,0.15), transparent, rgba(200,16,46,0.15));
      animation: reb-ring-spin 12s linear infinite reverse;
      z-index: -2;
    }
    .reb-avatar-img {
      width: 140px; height: 140px; border-radius: 50%; object-fit: cover;
      border: 3px solid rgba(255,255,255,0.8);
      box-shadow: 0 8px 24px rgba(200,16,46,0.15);
    }
    .reb-avatar-placeholder {
      width: 140px; height: 140px; border-radius: 50%;
      background: linear-gradient(145deg, rgba(200,16,46,0.08) 0%, rgba(201,153,58,0.12) 100%);
      border: 3px solid rgba(255,255,255,0.8);
      display: flex; align-items: center; justify-content: center;
      font-family: var(--serif); font-size: 3.5rem; font-weight: 700;
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }

    .reb-card-name {
      font-family: var(--royal); font-size: 1.35rem; font-weight: 700;
      letter-spacing: 2px; text-transform: uppercase; color: var(--text);
      text-align: center; margin-bottom: 6px;
    }
    .reb-card-title {
      font-family: var(--serif); font-style: italic;
      font-size: 1rem; color: var(--crimson); text-align: center;
      margin-bottom: 24px;
    }

    /* Floating stat pills on the card */
    .reb-stat-row {
      display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
    }
    .reb-stat {
      display: flex; flex-direction: column; align-items: center;
      padding: 10px 18px; border-radius: 14px;
      background: rgba(255,248,235,0.8);
      border: 1px solid rgba(201,153,58,0.25);
      backdrop-filter: blur(8px);
      box-shadow: 0 2px 12px rgba(201,153,58,0.08);
      min-width: 72px;
      transition: transform 0.2s;
    }
    .reb-stat:hover { transform: translateY(-3px); }
    .reb-stat strong {
      font-family: var(--royal); font-size: 1.1rem; font-weight: 700;
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .reb-stat span {
      font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px;
      color: var(--text-3); margin-top: 2px;
    }

    /* ── 3D FLOATING DECORATIVE ELEMENTS ── */
    /* These are positioned RELATIVE to the hero section, not the viewport */
    .reb-deco-container {
      position: absolute; inset: 0; pointer-events: none; overflow: visible; z-index: 0;
    }
    /* Floating diamond gem — top right of hero */
    .reb-gem {
      position: absolute; width: 56px; height: 56px;
      top: -20px; right: 440px;
      transform-style: preserve-3d;
      animation: reb-float-gem 7s ease-in-out infinite;
    }
    .reb-gem svg { width: 100%; height: 100%; filter: drop-shadow(0 6px 18px rgba(200,16,46,0.25)); }
    @keyframes reb-float-gem { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-20px) rotate(10deg)} }

    /* Floating crown — above hero card */
    .reb-float-crown {
      position: absolute; top: -36px; right: 168px;
      font-size: 2.2rem; line-height: 1;
      animation: reb-float-crown 6s ease-in-out infinite;
      filter: drop-shadow(0 4px 12px rgba(201,153,58,0.45));
    }
    @keyframes reb-float-crown { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-14px) scale(1.05)} }

    /* Floating sparkle star — left mid */
    .reb-sparkle {
      position: absolute;
      animation: reb-twinkle 2.5s ease-in-out infinite;
      font-style: normal;
    }
    .reb-sparkle-1 { top: 15%; left: 46%; font-size: 1.1rem; color: var(--gold); animation-delay: 0s; }
    .reb-sparkle-2 { bottom: 18%; left: 48%; font-size: 0.75rem; color: var(--crimson); opacity: 0.6; animation-delay: 1.2s; }
    @keyframes reb-twinkle { 0%,100%{opacity:0.3; transform:scale(0.7) rotate(0deg)} 50%{opacity:1; transform:scale(1.2) rotate(15deg)} }

    /* Floating orb small — top left corner */
    .reb-float-orb {
      position: absolute; border-radius: 50%;
      background: radial-gradient(circle, var(--gold-pale) 0%, transparent 70%);
      animation: reb-pulse-orb 5s ease-in-out infinite;
    }
    .reb-float-orb-a { width: 80px; height: 80px; top: 5%; left: 2%; animation-delay: 0s; }
    .reb-float-orb-b { width: 48px; height: 48px; bottom: 12%; right: 36%; animation-delay: 2s; }
    @keyframes reb-pulse-orb { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.25);opacity:1} }

    /* ── MARQUEE RIBBON ── */
    .reb-ribbon-wrap {
      margin: 52px 0; overflow: hidden; position: relative;
    }
    .reb-ribbon {
      padding: 20px 0;
      background: linear-gradient(90deg,
        rgba(200,16,46,0.04) 0%,
        rgba(201,153,58,0.1) 25%,
        rgba(200,16,46,0.07) 50%,
        rgba(201,153,58,0.1) 75%,
        rgba(200,16,46,0.04) 100%);
      border-top: 1px solid rgba(201,153,58,0.2);
      border-bottom: 1px solid rgba(201,153,58,0.2);
      white-space: nowrap; overflow: hidden;
    }
    .reb-ribbon-track {
      display: inline-block;
      animation: reb-marquee 28s linear infinite;
      font-family: var(--serif); font-style: italic; font-weight: 500;
      font-size: clamp(1rem, 1.8vw, 1.35rem); color: var(--text-2);
    }
    .reb-ribbon-track span { padding: 0 24px; }
    .reb-ribbon-sep { color: var(--gold); font-style: normal; opacity: 0.7; }
    @keyframes reb-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }

    /* ── LINK CARDS ── */
    .reb-section-label {
      display: flex; align-items: center; gap: 16px; margin-bottom: 28px;
    }
    .reb-section-label h2 {
      font-family: var(--royal); font-size: 0.8rem; letter-spacing: 4px;
      text-transform: uppercase; color: var(--text-3); font-weight: 400;
    }
    .reb-section-label::after {
      content: ""; flex: 1; height: 1px;
      background: linear-gradient(90deg, rgba(201,153,58,0.3), transparent);
    }

    .reb-links-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 18px;
    }
    .reb-link-card {
      display: block; position: relative; overflow: hidden;
      padding: 28px 24px 24px;
      border-radius: 22px;
      background: linear-gradient(145deg, rgba(255,252,246,0.95) 0%, rgba(248,240,226,0.9) 100%);
      border: 1.5px solid rgba(201,153,58,0.2);
      color: var(--text); text-decoration: none;
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s, border-color 0.3s;
      box-shadow: 0 4px 20px rgba(201,153,58,0.06);
    }
    .reb-link-card::before {
      /* shimmer sweep */
      content: ""; position: absolute; inset: 0;
      background: linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.5) 50%, transparent 65%);
      background-size: 200% 100%; background-position: -100% 0;
      transition: background-position 0.6s;
    }
    .reb-link-card:hover::before { background-position: 150% 0; }
    .reb-link-card:hover {
      transform: translateY(-6px) scale(1.02);
      box-shadow: 0 16px 48px rgba(200,16,46,0.1), 0 6px 20px rgba(201,153,58,0.12);
      border-color: rgba(201,153,58,0.45);
    }
    /* Colored top accent line */
    .reb-link-card::after {
      content: ""; position: absolute; top: 0; left: 20px; right: 20px; height: 2px;
      background: linear-gradient(90deg, var(--crimson), var(--gold));
      border-radius: 0 0 4px 4px;
      opacity: 0; transition: opacity 0.3s;
    }
    .reb-link-card:hover::after { opacity: 1; }

    .reb-link-icon-wrap {
      width: 44px; height: 44px; border-radius: 14px; margin-bottom: 16px;
      background: linear-gradient(135deg, rgba(200,16,46,0.08), rgba(201,153,58,0.1));
      border: 1px solid rgba(201,153,58,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; font-weight: 700; color: var(--crimson);
      font-family: var(--royal);
      transition: background 0.3s, transform 0.3s;
    }
    .reb-link-card:hover .reb-link-icon-wrap {
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      color: #fff; transform: scale(1.1) rotate(-4deg);
    }
    .reb-link-title {
      font-family: var(--serif); font-size: 1.45rem; font-weight: 700;
      color: var(--text); margin-bottom: 4px; line-height: 1.2;
    }
    .reb-link-sub {
      font-size: 0.82rem; color: var(--text-3); font-weight: 500;
      text-transform: uppercase; letter-spacing: 1px;
    }
    .reb-link-arrow {
      position: absolute; bottom: 22px; right: 22px;
      width: 30px; height: 30px; border-radius: 50%;
      border: 1.5px solid rgba(201,153,58,0.25);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; color: var(--text-3);
      transition: all 0.3s;
    }
    .reb-link-card:hover .reb-link-arrow {
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      border-color: transparent; color: #fff;
      transform: rotate(45deg);
    }

    /* ── CTA SECTION ── */
    .reb-cta-section {
      margin-top: 64px; padding: 60px;
      border-radius: 32px; position: relative; overflow: hidden;
      background: linear-gradient(135deg,
        rgba(200,16,46,0.06) 0%,
        rgba(248,240,226,0.8) 30%,
        rgba(201,153,58,0.08) 60%,
        rgba(248,240,226,0.9) 100%);
      border: 1.5px solid rgba(201,153,58,0.25);
      box-shadow: 0 8px 60px rgba(200,16,46,0.06), inset 0 1px 0 rgba(255,255,255,0.7);
    }
    /* Decorative corner crests */
    .reb-cta-crest {
      position: absolute; font-size: 5rem; line-height: 1; opacity: 0.04;
      pointer-events: none; font-family: var(--serif); color: var(--crimson);
    }
    .reb-cta-crest-tl { top: -10px; left: 20px; }
    .reb-cta-crest-br { bottom: -10px; right: 20px; transform: rotate(180deg); }

    .reb-cta-inner {
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 32px; position: relative; z-index: 1;
    }
    .reb-cta-left h2 {
      font-family: var(--serif); font-weight: 900; font-style: italic;
      font-size: clamp(2rem, 4vw, 3.2rem); line-height: 1.1;
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      margin-bottom: 12px;
    }
    .reb-cta-left p {
      color: var(--text-2); font-size: 1rem; max-width: 380px;
    }
    .reb-cta-btn {
      display: inline-flex; align-items: center; gap: 14px;
      padding: 18px 40px; border-radius: 50px;
      background: linear-gradient(135deg, var(--crimson) 0%, #A00020 50%, #8A001A 100%);
      color: #fff; font-family: var(--royal); font-weight: 600;
      font-size: 0.9rem; letter-spacing: 2px; text-transform: uppercase;
      box-shadow: 0 8px 32px rgba(200,16,46,0.3), 0 2px 8px rgba(200,16,46,0.2), inset 0 1px 0 rgba(255,255,255,0.15);
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s;
      position: relative; overflow: hidden;
    }
    .reb-cta-btn::before {
      content: ""; position: absolute; inset: 0;
      background: linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%);
      background-size: 200% 100%; background-position: -100% 0;
      transition: background-position 0.5s;
    }
    .reb-cta-btn:hover::before { background-position: 150% 0; }
    .reb-cta-btn:hover {
      transform: translateY(-4px) scale(1.03);
      box-shadow: 0 16px 48px rgba(200,16,46,0.38), 0 4px 16px rgba(200,16,46,0.2);
    }
    .reb-cta-btn-icon { font-size: 1.1rem; transition: transform 0.3s; }
    .reb-cta-btn:hover .reb-cta-btn-icon { transform: translateX(4px); }

    /* Gold secondary button */
    .reb-cta-btn-sec {
      display: inline-flex; align-items: center; gap: 12px;
      padding: 18px 36px; border-radius: 50px;
      background: transparent; color: var(--gold);
      font-family: var(--royal); font-weight: 600; font-size: 0.9rem;
      letter-spacing: 2px; text-transform: uppercase;
      border: 1.5px solid rgba(201,153,58,0.45);
      transition: all 0.3s;
    }
    .reb-cta-btn-sec:hover {
      background: rgba(201,153,58,0.08);
      border-color: var(--gold); transform: translateY(-3px);
    }
    .reb-cta-buttons { display: flex; flex-wrap: wrap; gap: 14px; }

    /* ── FOOTER LINE ── */
    .reb-footer {
      margin-top: 48px; padding-top: 24px;
      border-top: 1px solid rgba(201,153,58,0.2);
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 16px;
    }
    .reb-footer-brand {
      font-family: var(--royal); font-size: 0.72rem; letter-spacing: 3px;
      text-transform: uppercase; color: var(--text-3);
    }
    .reb-footer-dots {
      display: flex; gap: 8px; align-items: center;
    }
    .reb-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: linear-gradient(135deg, var(--crimson), var(--gold));
      animation: reb-dot-pulse 2.5s ease-in-out infinite;
    }
    .reb-dot:nth-child(2) { animation-delay: 0.4s; opacity: 0.6; }
    .reb-dot:nth-child(3) { animation-delay: 0.8s; opacity: 0.35; }
    @keyframes reb-dot-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.5)} }

    /* ── RESPONSIVE ── */
    @media (max-width: 1024px) {
      .reb-hero { grid-template-columns: 1fr; gap: 40px; text-align: center; }
      .reb-hero-left { padding-right: 0; margin-bottom: 24px; display: flex; flex-direction: column; align-items: center; }
      .reb-bio { text-align: center; margin: 0 auto; }
      .reb-card-3d-wrap { max-width: 380px; margin: 0 auto; width: 100%; }
      .reb-gem, .reb-float-crown, .reb-sparkle, .reb-float-orb { display: none; }
    }
    @media (max-width: 640px) {
      .reb-wrap { padding: 36px 16px; }
      .reb-frame { padding: 24px 20px; border-radius: 24px; }
      .reb-header { flex-direction: column; gap: 20px; margin-bottom: 40px; }
      .reb-nav-right { gap: 10px; width: 100%; justify-content: center; }
      .reb-year { display: none; }
      .reb-name { font-size: clamp(3.2rem, 12vw, 4.5rem); line-height: 0.95; }
      .reb-role-row { flex-wrap: wrap; justify-content: center; margin: 8px 0 20px; }
      .reb-role { font-size: 1.2rem; text-align: center; }
      .reb-card-3d { aspect-ratio: auto; min-height: 400px; }
      .reb-card-face { padding: 32px 20px; }
      .reb-stat-row { gap: 8px; }
      .reb-links-grid { grid-template-columns: 1fr; } /* Stack links fully on mobile */
      .reb-link-card { padding: 24px 20px 20px; }
      .reb-cta-section { padding: 40px 24px; text-align: center; }
      .reb-cta-inner { flex-direction: column; align-items: center; gap: 24px; }
      .reb-cta-left p { text-align: center; margin: 0 auto; }
      .reb-cta-buttons { justify-content: center; width: 100%; flex-direction: column; }
      .reb-cta-btn, .reb-cta-btn-sec { width: 100%; justify-content: center; }
      .reb-footer { flex-direction: column; text-align: center; gap: 20px; }
    }
  `;

  return (
    <div className="reb-wrap">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div className="reb-frame">

        {/* Ambient background orbs (moved inside frame so they are contained) */}
        <div className="reb-orb reb-orb-1" />
        <div className="reb-orb reb-orb-2" />
        <div className="reb-orb reb-orb-3" />

        {/* ── HEADER ── */}
        <header className="reb-header">
          <a className="reb-logo" href="#top">
            <span className="reb-crown-icon">♛</span>
            The Rebellion
          </a>
          <div className="reb-nav-right">
            <span className="reb-tagline">We challenge the industry.</span>
            <span className="reb-year">Est. 2026</span>
          </div>
        </header>

        {/* ── HERO ── */}
        <section
          id="top"
          className="reb-hero"
          style={{ position: 'relative' }}
        >
          {/* Decorative floating elements — absolutely positioned within hero */}
          <div className="reb-deco-container" aria-hidden="true">
            {/* Floating diamond gem */}
            <div className="reb-gem">
              <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="28,4 52,20 52,36 28,52 4,36 4,20" fill="none" stroke="url(#gem-grad)" strokeWidth="1.5"/>
                <polygon points="28,4 52,20 28,28" fill="rgba(200,16,46,0.08)"/>
                <polygon points="28,28 52,20 52,36" fill="rgba(201,153,58,0.1)"/>
                <polygon points="28,28 52,36 28,52" fill="rgba(200,16,46,0.07)"/>
                <polygon points="28,28 4,36 28,52" fill="rgba(201,153,58,0.08)"/>
                <polygon points="28,4 4,20 28,28" fill="rgba(201,153,58,0.12)"/>
                <polygon points="28,28 4,20 4,36" fill="rgba(200,16,46,0.06)"/>
                <defs>
                  <linearGradient id="gem-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C8102E" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#C9993A" stopOpacity="0.8"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            {/* Floating crown above arch */}
            <div className="reb-float-crown">♛</div>
            {/* Sparkle stars */}
            <span className="reb-sparkle reb-sparkle-1">✦</span>
            <span className="reb-sparkle reb-sparkle-2">✦</span>
            {/* Ambient orbs */}
            <div className="reb-float-orb reb-float-orb-a" />
            <div className="reb-float-orb reb-float-orb-b" />
          </div>

          {/* LEFT — Text content */}
          <div className="reb-hero-left">
            <div className="reb-eyebrow">Disruptive · Royal · Rebellion</div>
            <h1 className="reb-name">{profile.name}</h1>
            <div className="reb-role-row">
              <div className="reb-role-gem" />
              <span className="reb-role">{profile.headline}</span>
            </div>
            <p className="reb-bio">{profile.bio}</p>
          </div>

          {/* RIGHT — 3D Tilt Card */}
          <div
            className="reb-card-3d-wrap"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            ref={cardRef}
          >
            <div
              className="reb-card-3d"
              style={{ transform: `perspective(900px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)` }}
            >
              <div className="reb-card-face">
                {/* Avatar */}
                <div className="reb-avatar-ring">
                  {profile.avatarUrl ? (
                    <img className="reb-avatar-img" src={profile.avatarUrl} alt={profile.name} />
                  ) : (
                    <div className="reb-avatar-placeholder">{profile.name?.[0] || 'R'}</div>
                  )}
                </div>

                <div className="reb-card-name">{profile.name}</div>
                <div className="reb-card-title">{profile.headline}</div>

                {/* Stat bubbles */}
                <div className="reb-stat-row">
                  <div className="reb-stat">
                    <strong>120M</strong>
                    <span>Reach</span>
                  </div>
                  <div className="reb-stat">
                    <strong>2026</strong>
                    <span>Founded</span>
                  </div>
                  <div className="reb-stat">
                    <strong>✦ 1</strong>
                    <span>Ranked</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── MARQUEE RIBBON ── */}
        <div className="reb-ribbon-wrap">
          <div className="reb-ribbon">
            <div className="reb-ribbon-track">
              <span>Rebel against the ordinary</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>Elegance is the rebellion</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>We challenge the industry</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>Born to disrupt</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>Royal by nature</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>Rebel against the ordinary</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>Elegance is the rebellion</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>We challenge the industry</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>Born to disrupt</span><span className="reb-ribbon-sep"> ✦ </span>
              <span>Royal by nature</span><span className="reb-ribbon-sep"> ✦ </span>
            </div>
          </div>
        </div>

        {/* ── LINKS ── */}
        <div className="reb-section-label">
          <h2>Connect &amp; Explore</h2>
        </div>

        <nav className="reb-links-grid">
          {profile.links?.map((link: any, i: number) => (
            <a
              key={i}
              className="reb-link-card"
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="reb-link-icon-wrap">
                {getLinkIcon(link.label || link.platform)}
              </div>
              <div className="reb-link-title">{link.label || link.platform}</div>
              <div className="reb-link-sub">{getLinkSubtitle(link.label || link.platform)}</div>
              <div className="reb-link-arrow">↗</div>
            </a>
          ))}
        </nav>

        {/* ── CTA SECTION ── */}
        <section className="reb-cta-section">
          <span className="reb-cta-crest reb-cta-crest-tl">♛</span>
          <span className="reb-cta-crest reb-cta-crest-br">♛</span>
          <div className="reb-cta-inner">
            <div className="reb-cta-left">
              <h2>Start Something Extraordinary.</h2>
              <p>Join the rebellion — challenge convention, redefine the rules, and build something that matters.</p>
            </div>
            <div className="reb-cta-buttons">
              <a
                className="reb-cta-btn"
                href={profile.email ? `mailto:${profile.email}` : '#'}
              >
                Work with {profile.name?.split(' ')[0] || 'Us'}
                <span className="reb-cta-btn-icon">→</span>
              </a>
              {profile.links?.[0] && (
                <a className="reb-cta-btn-sec" href={profile.links[0].url} target="_blank" rel="noopener noreferrer">
                  ♛ &nbsp;Follow
                </a>
              )}
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="reb-footer">
          <span className="reb-footer-brand">The Rebellion · {profile.name} · 2026</span>
          <div className="reb-footer-dots">
            <div className="reb-dot" />
            <div className="reb-dot" />
            <div className="reb-dot" />
          </div>
        </footer>

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

// --- 03 AGENCY: THE CLUB ---
// Maintained and refined in components/profile/templates/persona/ClubTemplate.tsx

// --- 04 ENTREPRENEUR --- //

function BuilderTemplate({ profile }: any) {
  const name = profile?.name || "";
  const role = profile?.role || profile?.headline || "BUILDER & ARCHITECT";
  const bio = profile?.bio || "I construct systems and experiences that turn abstract possibilities into tangible utility.";
  const email = profile?.email || "";

  const links = profile?.links || [];
  const metrics = profile?.metrics || [];
  const proofs = profile?.proofPoints || profile?.proofs || [];

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap');
    
    .builder-theme {
      background-color: #E8E0D5;
      color: #292226;
      font-family: 'Outfit', sans-serif;
    }
    
    .builder-serif {
      font-family: 'DM Serif Display', serif;
    }

    .builder-container {
      background-color: #F3EEE6;
      box-shadow: 0 20px 40px rgba(52, 38, 50, 0.08);
    }
      
    .builder-blueprint-grid {
      background-image: 
        linear-gradient(rgba(135, 149, 138, 0.15) 1px, transparent 1px),
        linear-gradient(90deg, rgba(135, 149, 138, 0.15) 1px, transparent 1px);
      background-size: 24px 24px;
    }

    .builder-module-shadow {
      box-shadow: 4px 4px 0px rgba(52, 38, 50, 1);
      transition: all 0.2s ease;
    }
    .builder-module-shadow:hover {
      box-shadow: 2px 2px 0px rgba(52, 38, 50, 1);
      transform: translate(2px, 2px);
    }
  `;

  return (
    <div className="builder-theme min-h-screen w-full flex justify-center py-4 md:py-12 px-4 md:px-8">
      <style>{customStyles}</style>

      {/* Outer Canvas Container */}
      <div className="builder-container w-full max-w-[1200px] rounded-[32px] md:rounded-[40px] border border-[#292226]/10 overflow-hidden flex flex-col relative pb-20">
        
        {/* HEADER */}
        <header className="px-6 md:px-12 py-8 flex justify-between items-center border-b border-[#292226]/10">
          <div className="flex items-center gap-3">
             <div className="w-5 h-5 bg-[#342632] flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#C5A86A]" />
             </div>
             <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#342632]">BUILDER // {name ? name.split(' ')[0] : 'ID'}</span>
          </div>
        </header>

        <div className="px-6 md:px-12 pt-16 md:pt-24 max-w-[960px] mx-auto w-full">
          {/* HERO WITHOUT HEADLINE QUOTE */}
          <section className="mb-16 relative">
             {/* BUILDER IDENTITY MODULE */}
             <div className="w-full bg-[#342632] text-[#F3EEE6] p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row gap-8 md:gap-16 group builder-module-shadow border border-[#292226]">
                <div className="absolute inset-0 builder-blueprint-grid opacity-30" />
                
                {/* Visual Column */}
                <div className="w-full md:w-[35%] relative min-h-[220px] md:min-h-full flex items-center justify-center shrink-0 border-b md:border-b-0 md:border-r border-white/10 pb-8 md:pb-0 md:pr-8">
                   <div className="relative w-32 h-32 md:w-48 md:h-48 transition-all duration-700">
                     <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                       <div className="w-24 h-24 border-2 border-[#C5A86A] rotate-45 flex items-center justify-center">
                         <div className="w-8 h-8 bg-[#A85C4A]" />
                       </div>
                     </div>
                   </div>
                   <div className="absolute top-0 left-0 text-[8px] text-white/40 tracking-widest">+Y.AXIS</div>
                   <div className="absolute bottom-0 right-0 text-[8px] text-white/40 tracking-widest">+X.AXIS</div>
                </div>

                {/* Content Column */}
                <div className="flex-1 relative z-10 flex flex-col justify-center">
                   <div className="text-[#C5A86A] text-[9px] uppercase tracking-[0.2em] mb-5 flex items-center gap-3 font-bold">
                      <div className="w-2 h-2 bg-current rounded-full animate-ping" />
                      SYSTEM ONLINE
                   </div>
                   
                   <div className="flex items-center gap-5 mb-6">
                     {profile?.avatarUrl ? (
                       <img src={profile.avatarUrl} alt={name} className="w-24 h-24 md:w-32 md:h-32 rounded-sm border border-[#C5A86A] object-cover grayscale mix-blend-screen" />
                     ) : (
                       <div className="w-24 h-24 md:w-32 md:h-32 bg-[#342632] border border-[#C5A86A] flex items-center justify-center text-xs font-bold text-[#C5A86A]">ID</div>
                     )}
                     <h2 className="builder-serif text-4xl md:text-5xl">{name || "[ BUILDER ]"}</h2>
                   </div>
                   
                   <div className="text-[12px] font-bold text-[#C5A86A] mb-3 uppercase tracking-widest">{role}</div>
                   <p className="text-lg text-[#F3EEE6]/80 max-w-sm mb-8 leading-relaxed font-medium">{bio}</p>
                </div>
             </div>
          </section>

          {/* INTRODUCTION ROWS */}
          <section className="mb-24 flex flex-col text-sm font-bold uppercase tracking-widest">
             <div className="flex flex-col md:flex-row md:items-center py-5 border-b border-[#292226]/10 gap-3 md:gap-12 group">
                <span className="text-[#87958A] w-32 shrink-0 group-hover:text-[#A85C4A] transition-colors">POSITION</span>
                <span className="text-[#342632]">{role}</span>
             </div>
             {links.length > 0 && (
               <div className="flex flex-col md:flex-row py-5 border-b border-[#292226]/10 gap-3 md:gap-12 group">
                  <span className="text-[#87958A] w-32 shrink-0 group-hover:text-[#A85C4A] transition-colors pt-1">NETWORK</span>
                  <div className="flex gap-4 flex-wrap">
                     {links.map((link: any, i: number) => {
                        const icon = getAestheteSocialIcon(link.label || link.title);
                        return (
                          <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#342632] border border-[#292226]/30 px-4 py-2 hover:border-[#A85C4A] hover:text-[#A85C4A] transition-colors text-[#F3EEE6]">
                             <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">{icon}</svg>
                             <span>{link.label}</span>
                          </a>
                        );
                     })}
                  </div>
               </div>
             )}
          </section>

          {/* METRICS */}
          {metrics && metrics.length > 0 && (
             <section className="mb-24">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#87958A] mb-8 font-bold border-l-2 border-[#A85C4A] pl-3">SYSTEM DIAGNOSTICS</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {metrics.map((m: any, i: number) => (
                      <div key={i} className="bg-[#342632] border border-[#292226]/20 p-6 flex flex-col justify-center items-center text-center hover:border-[#A85C4A] transition-colors group">
                         <div className="builder-serif text-5xl md:text-6xl text-[#F3EEE6] mb-2 group-hover:text-[#A85C4A] transition-colors">{m.value}</div>
                         <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#C5A86A]">{m.label || m.title || m.name}</div>
                      </div>
                   ))}
                </div>
             </section>
          )}

          {/* PROOF POINTS */}
          {proofs && proofs.length > 0 && (
             <section className="mb-24">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#87958A] mb-8 font-bold border-l-2 border-[#A85C4A] pl-3">SYSTEM CREDENTIALS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {proofs.filter((p: any) => p.type || p.title || p.label).map((p: any, i: number) => (
                      <div key={i} className="bg-[#E8E0D5] border-2 border-[#292226]/40 p-6 flex flex-col justify-center hover:border-[#A85C4A] transition-colors group relative overflow-hidden builder-module-shadow">
                         <div className="absolute inset-0 builder-blueprint-grid opacity-10 pointer-events-none" />
                         <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#292226]/10 group-hover:bg-[#A85C4A] transition-colors" />
                         <div className="flex items-baseline gap-4 mb-2 pl-4">
                           <div className="text-[12px] font-bold tracking-[0.2em] uppercase text-[#342632] relative z-10">{p.type || p.title || p.label}</div>
                           <div className="builder-serif text-3xl md:text-4xl text-[#A85C4A] relative z-10">{p.value}</div>
                         </div>
                         {p.url && (
                           <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-widest text-[#87958A] hover:text-[#A85C4A] border-b border-[#87958A] hover:border-[#A85C4A] w-max mt-4 pl-4 pb-0.5 relative z-10">
                             VERIFY PROOF ↗
                           </a>
                         )}
                      </div>
                   ))}
                </div>
             </section>
          )}

          {/* CONTACT CTA */}
          <section className="mt-32 mb-16 bg-[#A85C4A] text-[#F3EEE6] p-8 md:p-16 flex flex-col items-center text-center relative overflow-hidden border border-[#292226] builder-module-shadow">
             <div className="absolute inset-0 builder-blueprint-grid opacity-20 pointer-events-none" />
             <h2 className="builder-serif text-5xl md:text-6xl mb-6 max-w-2xl leading-[1.05] relative z-10 text-[#F3EEE6]">Ready to initialize?</h2>
             <p className="text-xs text-[#F3EEE6]/80 mb-10 max-w-md uppercase tracking-widest font-bold relative z-10">
               Begin sequence transfer.
             </p>
             <a href={email ? `mailto:${email}` : '#contact'} className="bg-[#342632] text-[#C5A86A] px-8 py-4 text-[12px] uppercase tracking-[0.2em] font-bold flex items-center gap-4 hover:bg-[#292226] transition-colors relative z-10 shadow-[4px_4px_0px_rgba(41,34,38,1)] border border-[#292226]">
                ESTABLISH CONNECTION <span className="text-[#F3EEE6]">↗</span>
             </a>
          </section>
          
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

  const metrics = profile?.metrics || profile?.proofs || profile?.proofPoints || [
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
    const p = (platform || '').toLowerCase().replace(/\s+/g, '');
    if (p.includes('linkedin')) return <svg viewBox="0 0 24 24" fill="currentColor" className="w-[19px] h-[19px] block"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.67 1.67 0 1 0 0-3.34 1.67 1.67 0 0 0 0 3.34M7.86 18.5V10.13H5.07V18.5h2.79z" /></svg>;
    if (p.includes('insta')) return <svg viewBox="0 0 24 24" fill="currentColor" className="w-[19px] h-[19px] block"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>;
    if (p.includes('x') || p.includes('twitter')) return <svg viewBox="0 0 24 24" fill="currentColor" className="w-[19px] h-[19px] block"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
    if (p.includes('github')) return <svg viewBox="0 0 24 24" fill="currentColor" className="w-[19px] h-[19px] block"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>;
    if (p.includes('hackerrank')) return <svg viewBox="0 0 24 24" fill="currentColor" className="w-[19px] h-[19px] block"><path d="M12 1.47l-9.12 5.26v10.53L12 22.53l9.12-5.26V6.73L12 1.47zm5.55 13.9l-2.07 1.2v-3.76l-3.48-2.01v4.02l-2.07 1.2v-6.42l5.55-3.2v3.76l3.48 2.01v-4.02l2.07-1.2v6.42zM12 14.81l-3.48-2.01 3.48-2.01 3.48 2.01L12 14.81z"/></svg>;
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[19px] h-[19px] block"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;
  };

  return (
    <div className="min-h-screen w-full bg-[#F5EFEB] py-8 sm:py-16 px-4 sm:px-8 flex justify-center items-start text-[#2C2825] font-['Manrope',sans-serif] antialiased">
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

            <div className="flex items-center mb-6">
              <span className="text-[9px] tracking-[0.2em] text-[#8B958A] uppercase font-bold">
                THE VISIONARY
              </span>
            </div>
            
            <h1 className="relative z-10 visionary-serif text-[clamp(4rem,10vw,6.5rem)] leading-[0.85] text-[#2C2825] mb-8">
              {firstName}
              <br className="hidden md:block" />
              {lastName ? (
                <>
                  <span className="md:hidden"> </span>
                  {lastName}
                </>
              ) : null}
            </h1>
            

            
            <h2 className="text-[11px] sm:text-[13px] tracking-[0.15em] font-bold uppercase text-[#2C2825] mb-6">
              {headline}
            </h2>
            
            <p className="text-sm sm:text-base leading-[1.8] text-[#2C2825]/80 max-w-lg font-medium mb-10">
              {bio}
            </p>
            
            <div className="mb-10 flex flex-col justify-center items-center md:items-start">
              <span className="text-[8px] tracking-[0.2em] text-[#8B958A] uppercase mb-1">CURRENTLY EXPLORING</span>
              <span className="text-[10px] tracking-[0.1em] font-bold uppercase text-[#2C2825]">{exploring}</span>
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
                  <div key={idx} className={`metric-card relative p-6 sm:p-8 rounded-tr-3xl rounded-bl-3xl border ${theme.border} ${theme.bg} transition-all duration-300 md:hover:-translate-y-1 hover:shadow-md group overflow-hidden`}>
                    <span className={`absolute top-6 right-6 text-[8px] font-bold ${theme.accent} z-0`}>0{idx + 1}</span>
                    
                    {idx === 0 && (
                      <div className="absolute top-8 right-16 w-10 h-6 rounded-full border-[0.5px] border-[#704E59]/40 rotate-12 flex items-center justify-end pr-1 pointer-events-none hidden sm:flex z-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#704E59]/60" />
                      </div>
                    )}
                    
                    <div className="relative z-10 pt-2 pb-2">
                      <div className="metric-value visionary-serif text-5xl sm:text-6xl text-[#2C2825] mb-2 md:mb-3 group-hover:scale-105 transition-transform origin-left block">
                        {metric.value}
                      </div>
                      
                      <div className="metric-label text-[10px] sm:text-[11px] tracking-[0.15em] font-bold uppercase text-[#2C2825] block min-h-[16px]">
                        {metric.label || metric.title || metric.name || metric.type || metric.text || metric.metricLabel || '\u00A0'}
                      </div>
                      
                      {metric.description && metric.description !== (metric.label || metric.title || metric.name || metric.type || metric.text) && (
                        <div className="metric-description text-[8px] tracking-[0.1em] text-[#8B958A] uppercase opacity-80 mt-1 block">
                          {metric.description}
                        </div>
                      )}
                    </div>
                    
                    <div className="absolute bottom-6 left-6 w-3 h-3 border-b border-l border-[#2C2825]/20 pointer-events-none z-0" />
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
                    className="group relative flex items-center gap-4 sm:gap-6 py-6 border-b border-[#2C2825]/10 hover:bg-black/[0.02] focus:outline-none focus-visible:bg-black/[0.02] transition-colors -mx-4 px-4 sm:mx-0 sm:px-0"
                  >
                    <div className="absolute left-0 bottom-0 w-0 h-[1px] bg-current transition-all duration-500 group-hover:w-full opacity-30" />
                    
                    <div className={`text-[9px] tracking-[0.2em] font-bold ${accentClass} flex items-center gap-2 w-8 shrink-0`}>
                      <span className="w-1.5 h-[1px] bg-current opacity-0 group-hover:opacity-100 transition-opacity" />
                      0{idx + 1}
                    </div>
                    
                    <div className="w-[44px] h-[44px] shrink-0 rounded-full border border-[#2C2825]/10 flex items-center justify-center text-[#2C2825] bg-white shadow-sm">
                      {getPlatformIcon(link.icon || link.platform || link.label || '')}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <span className="text-[11px] font-bold uppercase text-[#2C2825] truncate">{link.label}</span>
                    </div>
                    
                    <div className="text-[#2C2825] opacity-30 group-hover:opacity-100 md:group-hover:translate-x-1 transition-transform shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5"></line><polyline points="12 5 19 5 19 12"></polyline></svg>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* 6. Footer */}
        <footer className="px-8 sm:px-12 py-8 flex flex-col items-center text-center">
          <p className="visionary-serif text-xl sm:text-2xl text-[#2C2825] italic m-0">
            Tomorrow is easier to build when someone is willing to see it early.
          </p>
        </footer>
      </div>
    </div>
  );
}

function HustlerTemplate({ profile }: any) {
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  };

  const name = profile?.name || "";
  const role = profile?.role || profile?.headline || "ENTREPRENEUR";
  const bio = profile?.bio || "Building high-leverage products and moving with absolute velocity.";
  const email = profile?.email;
  
  const allLinks = profile?.links || [];
  const validLinks = allLinks.filter((l: any) => l.url && (l.label || l.title));
  
  const metrics = profile?.metrics || [];
  const validMetrics = metrics.filter((m: any) => m.value && (m.label || m.title || m.name));
  
  const proofs = profile?.proofPoints || profile?.proofs || profile?.featured || profile?.milestones || [];
  const validProofs = proofs.filter((p: any) => p.type || p.title || p.label || p.description);

  const handleSave = () => {
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:${name};;;;\nFN:${name}\nORG:${profile?.company || ''}\nTITLE:${role}\nURL:${typeof window !== 'undefined' ? window.location.origin : ''}\nEND:VCARD`;
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '_') || 'Contact'}.vcf`;
    a.click();
    showToast('CONTACT SAVED');
  };

  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
    
    .hustler-theme {
      font-family: 'Inter', sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    
    .hustler-serif {
      font-family: 'Instrument Serif', serif;
    }

    .hustler-mono {
      font-family: 'JetBrains Mono', monospace;
    }

    .hustler-organic {
      border-radius: 4px 32px 4px 16px;
    }
    
    .hustler-organic-sm {
      border-radius: 2px 12px 2px 8px;
    }
  `;

  return (
    <div className="hustler-theme min-h-screen w-full relative overflow-x-hidden bg-[#C4C0B8] selection:bg-[#D64924] selection:text-[#EAE8E3] p-4 sm:p-8 md:p-16 lg:p-24 flex items-center justify-center">
      <style>{customStyles}</style>

      {/* OUTER PREMIUM CONTAINER */}
      <div className="w-full max-w-[860px] bg-[#292724] border-2 border-[#292724] flex flex-col gap-[2px] hustler-organic overflow-hidden shadow-[16px_16px_0px_0px_rgba(41,39,36,0.15)] relative z-10">
         {/* HEADER SECTION */}
         <div className="flex flex-col md:flex-row border-b-2 border-[#EAE8E3]">
            {/* Image Column */}
            <div className="w-full md:w-[40%] border-b-2 md:border-b-0 md:border-r-2 border-[#EAE8E3] p-8 flex items-center justify-center bg-[#D64924] relative overflow-hidden group">
               <div className="absolute inset-0 bg-[#EAE8E3] opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
               <div className="w-[200px] h-[200px] md:w-[280px] md:h-[280px] border-4 border-[#EAE8E3] bg-[#292724] shadow-[8px_8px_0px_0px_#EAE8E3] transform group-hover:-translate-y-2 group-hover:shadow-[12px_12px_0px_0px_#EAE8E3] transition-all duration-300">
                  {profile?.avatarUrl ? (
                     <img src={profile.avatarUrl} className="w-full h-full object-cover filter grayscale contrast-125 mix-blend-luminosity" alt={name} />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center font-serif text-8xl text-[#EAE8E3]">{name?.[0] || 'H'}</div>
                  )}
               </div>
            </div>
            
            {/* Identity Column */}
            <div className="w-full md:w-[60%] flex flex-col">
               <div className="p-8 md:p-12 flex-1 flex flex-col justify-center border-b-2 border-[#EAE8E3] bg-[#292724]">
                  <span className="inline-block bg-[#D64924] text-[#EAE8E3] text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] px-4 py-2 mb-6 self-start shadow-[4px_4px_0px_0px_#EAE8E3]">
                     {role}
                  </span>
                  <h1 className="hustler-serif text-6xl sm:text-7xl md:text-[6rem] leading-[0.85] text-[#EAE8E3] uppercase break-words">
                     {name || 'HUSTLER'}
                  </h1>
               </div>
               <div className="p-8 md:p-12 bg-[#EAE8E3]">
                  <p className="text-lg sm:text-xl font-medium leading-relaxed text-[#292724]">
                     {bio}
                  </p>
               </div>
            </div>
         </div>

         {/* NETWORK SECTION */}
         <div className="p-8 md:p-12 border-b-2 border-[#EAE8E3] bg-[#292724]">
            <h3 className="text-[10px] text-[#D64924] uppercase tracking-widest font-bold mb-8">Network & Nodes</h3>
            <div className="flex flex-wrap gap-4">
               {validLinks.length > 0 ? validLinks.map((l: any, i: number) => {
                  const icon = getAestheteSocialIcon(l.label || l.title);
                  return (
                    <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 border-2 border-[#EAE8E3] px-6 py-4 bg-[#292724] text-[#EAE8E3] hover:bg-[#EAE8E3] hover:text-[#292724] hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#D64924] transition-all">
                       <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">{icon}</svg>
                       <span className="text-xs sm:text-sm uppercase tracking-widest font-bold">{l.label || l.title}</span>
                    </a>
                  )
               }) : (
                  <span className="text-xs uppercase tracking-widest font-bold text-[#7A756D]">NO NODES CONNECTED</span>
               )}
            </div>
         </div>

         {/* PROOF POINTS & METRICS SECTION */}
         <div className="p-8 md:p-12 border-b-2 border-[#EAE8E3] bg-[#EAE8E3]">
            <h3 className="text-[10px] text-[#D64924] uppercase tracking-widest font-bold mb-8">Proof Points & Momentum</h3>
            
            {/* Metrics Sub-grid */}
            {validMetrics.length > 0 && (
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                  {validMetrics.map((m: any, i: number) => (
                     <div key={i} className="flex flex-col p-6 bg-[#292724] border-2 border-[#292724] text-[#EAE8E3] shadow-[4px_4px_0px_0px_#D64924]">
                        <span className="hustler-serif text-5xl sm:text-6xl text-[#EAE8E3]">{m.value}</span>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-[#D64924] mt-2">{m.label || m.title || m.name}</span>
                     </div>
                  ))}
               </div>
            )}

            {/* Proofs Sub-grid */}
            <div className="flex flex-col gap-6">
               {validProofs.length > 0 ? validProofs.map((p: any, i: number) => {
                  const bgColors = ['bg-[#FFD166]', 'bg-[#06D6A0]', 'bg-[#118AB2]', 'bg-[#EF476F]'];
                  const bgColor = bgColors[i % bgColors.length];
                  return (
                  <div key={i} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 sm:p-8 border-4 border-[#292724] ${bgColor} hover:-translate-y-1 hover:-translate-x-1 transition-all group shadow-[8px_8px_0px_#292724] mb-4`}>
                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
                        <h4 className="text-xl sm:text-2xl font-black hustler-serif leading-tight text-[#292724] uppercase">{p.type || p.title || p.label}</h4>
                        <span className="text-3xl sm:text-4xl font-black hustler-serif text-[#EAE8E3] drop-shadow-[2px_2px_0px_#292724]">{p.value}</span>
                     </div>
                     {p.url && (
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="mt-6 sm:mt-0 px-6 py-3 border-2 border-[#292724] bg-white text-[#292724] text-xs font-bold uppercase tracking-widest hover:bg-[#292724] hover:text-white transition-colors shadow-[4px_4px_0px_#292724] group-hover:shadow-[2px_2px_0px_#292724]">
                           VIEW PROOF
                        </a>
                     )}
                  </div>
                  );
               }) : (
                  <div className="p-8 border-2 border-dashed border-[#292724] flex items-center justify-center">
                     <span className="text-xs uppercase tracking-widest font-bold text-[#292724]">NO RECORDS FOUND</span>
                  </div>
               )}
            </div>
         </div>

         {/* ACTIONS SECTION */}
         <div className="flex flex-col sm:flex-row">
            <a href={email ? `mailto:${email}` : '#'} className="flex-1 p-8 bg-[#D64924] text-[#EAE8E3] flex items-center justify-between hover:bg-[#EAE8E3] hover:text-[#D64924] transition-colors border-b-2 sm:border-b-0 sm:border-r-2 border-[#EAE8E3] cursor-pointer group">
               <span className="text-sm uppercase tracking-[0.2em] font-bold">Get In Touch</span>
               <span className="text-3xl group-hover:translate-x-4 transition-transform">→</span>
            </a>
            <button onClick={handleSave} className="sm:w-[320px] p-8 bg-[#292724] text-[#EAE8E3] flex items-center justify-center gap-3 hover:bg-[#EAE8E3] hover:text-[#292724] transition-colors group">
               <span className="text-[11px] uppercase tracking-[0.2em] font-bold">Save Contact</span>
               <span className="text-lg opacity-0 -translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 transition-all">↓</span>
            </button>
         </div>

      </div>

      {/* Toast Notification */}
      {toastVisible && (
        <div className="fixed bottom-8 right-8 bg-[#292724] border-2 border-[#292724] text-[#EAE8E3] px-6 py-4 shadow-2xl z-50 flex items-center gap-4 text-[10px] font-bold tracking-widest uppercase hustler-organic-sm animate-in fade-in slide-in-from-bottom-4">
          <span className="w-2 h-2 rounded-full bg-[#D64924] animate-pulse" />
          {toastMsg}
        </div>
      )}
    </div>
  );
}


// --- 05 INFLUENCER --- //

const getAestheteSocialIcon = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes('github')) return <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" fill="currentColor"/>;
  if (l.includes('linkedin')) return <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="currentColor"/>;
  if (l.includes('instagram')) return <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" fill="currentColor"/>;
  if (l.includes('twitter') || l.includes('x.com')) return <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" fill="currentColor"/>;
  if (l.includes('youtube')) return <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 00-2.122 2.136C0 8.07 0 12 0 12s0 3.93.501 5.814a3.016 3.016 0 002.122 2.136c1.871.55 9.377.55 9.377.55s7.505 0 9.377-.55a3.016 3.016 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="currentColor"/>;
  if (l.includes('hacker rank') || l.includes('hackerrank')) return <path d="M11.953 2c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10zm4.863 14.595h-1.787v-4.072h-6.15v4.072H7.092V7.452h1.787v4.072h6.15V7.452h1.787v9.143z" fill="currentColor"/>;
  if (l.includes('dribbble')) return <path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-11.834c-.116-.296-2.585-6.398-7.98-7.653.076.172.148.35.216.533 2.128 5.728 1.405 10.575 1.156 11.932 2.656-1.536 5.568-3.087 6.608-4.812zm-3.616 7.64c.265-1.56 1.144-6.903-1.636-12.724-3.136.216-6.42.985-9.356 2.37.16 2.062 1.055 6.782 4.148 10.66 2.21 2.766 5.253 4.542 5.922 4.908.384-.814.7-1.666.922-2.564v-.004V19.8zm-9.043 2.06c-3.167-3.95-4.145-9.255-4.145-9.255 3.398-1.514 7.034-2.27 10.37-2.316-.065-.183-.133-.362-.206-.538-2.378-5.748-5.3-7.55-5.594-7.72-4.996 1.83-8.156 6.557-8.156 11.97 0 2.94 1.066 5.632 2.82 7.747 1.4-1.593 3.4-3.87 4.912-5.642v.006.012l.006-.008z" fill="currentColor"/>;
  if (l.includes('behance')) return <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.895 15.696H6.182V8.305h3.923c1.375 0 2.477.195 3.307.585.83.39 1.245 1.045 1.245 1.965 0 .59-.2 1.077-.6 1.46-.4.384-1.004.664-1.81.84.974.12 1.693.425 2.158.915.465.49.697 1.155.697 1.995 0 .91-.453 1.636-1.36 2.175-.907.54-2.122.81-3.645.81zm9.055-.915c-.48.6-1.125 1.05-1.935 1.35-.81.3-1.69.45-2.64.45-1.28 0-2.34-.275-3.18-.825-.84-.55-1.47-1.3-1.89-2.25-.42-.95-.63-2.025-.63-3.225 0-1.21.215-2.29.645-3.24.43-.95 1.06-1.685 1.89-2.205.83-.52 1.805-.78 2.925-.78 1.1 0 2.03.245 2.79.735.76.49 1.33 1.18 1.71 2.07.38.89.57 1.935.57 3.135 0 .15-.01.35-.03.6h-6.75c.03.95.34 1.71.93 2.28.59.57 1.33.855 2.22.855.77 0 1.42-.195 1.95-.585.53-.39.92-.885 1.17-1.485h1.725c-.23.82-.62 1.52-1.17 2.12zm-8.815-4.83h2.385c.61 0 1.09-.12 1.44-.36.35-.24.525-.615.525-1.125 0-.49-.17-.85-.51-1.08-.34-.23-.84-.345-1.5-.345H10.34v2.91zm0 3.735h2.52c.76 0 1.33-.14 1.71-.42.38-.28.57-.7.57-1.26 0-.57-.2-1.01-.6-1.32-.4-.31-1.05-.465-1.95-.465H10.34v3.465zm4.86-5.805h3.9v-1.11h-3.9v1.11zm.33 1.965h4.155c-.06-.71-.3-1.26-.72-1.65-.42-.39-.98-.585-1.68-.585-.66 0-1.205.195-1.635.585-.43.39-.715.94-.855 1.65z" fill="currentColor"/>;
  if (l.includes('medium')) return <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-4.32 16.486c-2.316 0-4.194-2.008-4.194-4.486 0-2.477 1.878-4.485 4.194-4.485 2.315 0 4.193 2.008 4.193 4.485 0 2.478-1.878 4.486-4.193 4.486zm7.25-1.157c-.89 0-1.613-1.49-1.613-3.329 0-1.838.723-3.328 1.613-3.328.89 0 1.612 1.49 1.612 3.328 0 1.839-.722 3.329-1.612 3.329zm2.42-1.183c-.313 0-.568-1.205-.568-2.693 0-1.488.255-2.693.568-2.693.314 0 .568 1.205.568 2.693 0 1.488-.254 2.693-.568 2.693z" fill="currentColor"/>;
  if (l.includes('spotify')) return <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.517 17.31c-.218.356-.684.472-1.04.254-2.85-1.74-6.438-2.134-10.666-1.168-.403.092-.81-.16-.902-.563-.093-.404.16-.81.564-.903 4.622-1.057 8.583-.616 11.79 1.343.355.218.47.684.254 1.037zm1.48-3.308c-.276.45-.86.592-1.31.316-3.265-2.007-8.243-2.613-12.015-1.432-.51.156-1.043-.13-1.198-.638-.155-.51.13-1.044.638-1.2 4.34-1.357 9.84-.678 13.57 1.615.45.276.592.86.315 1.338zm.135-3.447c-3.92-2.327-10.387-2.54-14.15-1.403-.61.184-1.256-.16-1.44-.77-.184-.61.16-1.256.77-1.44 4.316-1.3 11.455-1.05 16.002 1.65.548.326.728 1.036.402 1.584-.326.548-1.036.728-1.584.403z" fill="currentColor"/>;
  return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" fill="none" stroke="currentColor"/>;
};

function AestheteTemplate({ profile }: any) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const firstName = profile.name?.split(' ')[0] || "Aesthete";
  const lastName = profile.name?.split(' ').slice(1).join(' ') || "";
  
  return (
    <div className="w-full min-h-screen bg-[#EAE7E0] flex items-center justify-center p-0 md:p-8 overflow-hidden font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;0,6..96,700;1,6..96,400&family=Inter:wght@300;400;500&display=swap');
        
        .font-bodoni {
          font-family: 'Bodoni Moda', serif;
        }
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
        
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .editorial-image {
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
          transition: clip-path 1.2s cubic-bezier(0.19, 1, 0.22, 1), transform 1.2s ease;
        }
        .editorial-column:hover .editorial-image {
          clip-path: polygon(4% 4%, 96% 4%, 96% 96%, 4% 96%);
          transform: scale(1.02);
        }
        
        .link-item {
          position: relative;
          display: inline-block;
        }
        .link-item::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0%;
          height: 1px;
          background-color: #292826;
          transition: width 0.6s cubic-bezier(0.19, 1, 0.22, 1);
        }
        .link-item-wrapper:hover .link-item::before {
          width: 100%;
        }
      `}</style>

      <div className="w-full max-w-[1600px] md:h-[90vh] bg-[#F5F3EF] md:rounded-[2px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] flex flex-col md:flex-row relative overflow-hidden">
        
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center p-5 border-b border-[#292826]/10 bg-[#F5F3EF] z-20">
          <span className="font-inter text-[10px] tracking-[0.25em] uppercase text-[#292826]">The Aesthete</span>
          <span className="font-inter text-[9px] tracking-[0.2em] uppercase text-[#292826]/50">{profile.role || 'Digital Creator'}</span>
        </div>

        {/* Left Column: Visual Canvas */}
        <div className="editorial-column w-full md:w-[50%] h-[50vh] md:h-full relative overflow-hidden bg-[#E2DED5] cursor-crosshair">
          {profile.avatarUrl ? (
            <img 
              src={profile.avatarUrl} 
              alt={profile.name} 
              className="editorial-image w-full h-full object-cover grayscale-[0.05] contrast-[1.05] object-center"
            />
          ) : (
            <div className="editorial-image w-full h-full flex items-center justify-center bg-[#E2DED5]">
              <span className="font-bodoni italic text-3xl text-[#292826]/20">Canvas</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/5 pointer-events-none transition-opacity duration-1000" />
          
          <div className="hidden md:flex absolute top-8 left-8 flex-col text-[#F5F3EF] mix-blend-difference pointer-events-none z-10">
            <span className="font-inter text-[10px] tracking-[0.3em] uppercase opacity-80">Portfolio</span>
            <span className="w-8 h-px bg-[#F5F3EF] mt-2 opacity-50" />
          </div>
        </div>

        {/* Right Column: Content */}
        <div className="w-full md:w-[50%] h-auto md:h-full flex flex-col bg-[#F5F3EF] z-10 relative text-[#292826]">
          
          <div 
            className="flex-1 overflow-y-auto no-scrollbar p-8 md:p-10 lg:p-14 flex flex-col relative"
            onScroll={(e) => {
              if (e.currentTarget.scrollTop > 10) {
                setHasScrolled(true);
              } else {
                setHasScrolled(false);
              }
            }}
          >
            
            {/* Title Section */}
            <div className="mb-10">
              <span className="inline-block px-3 py-1 mb-4 rounded-full border border-[#A39686]/30 text-[#A39686] font-inter text-[9px] tracking-[0.2em] uppercase">
                {profile.role || 'Digital Creator'}
              </span>
              <h1 className="font-bodoni text-6xl lg:text-8xl text-[#292826] leading-[0.85] tracking-tight uppercase">
                {firstName} <br />
                <span className="italic normal-case text-[#A39686] font-medium">{lastName}</span>
              </h1>
            </div>

            {/* Headline Block */}
            <div className="pl-6 border-l border-[#A39686]/40 mb-10">
              <h2 className="font-bodoni text-2xl md:text-3xl text-[#292826] leading-[1.2] mb-3">
                {profile.headline || 'My world is my canvas.'}
              </h2>
              <p className="font-inter text-sm md:text-base text-[#73706A] leading-relaxed font-light">
                {profile.bio || 'Fashion, beauty, lifestyle. Elegant, curated, premium. Editorial magazine aesthetic, sophisticated typography.'}
              </p>
            </div>

            {/* The Philosophy */}
            <div className="mb-10 p-6 bg-[#EBE8E3] border border-[#292826]/5 rounded-sm">
               <h3 className="font-inter text-[9px] tracking-[0.2em] uppercase text-[#292826]/40 mb-3 flex items-center gap-2">
                 <span className="w-4 h-px bg-[#292826]/20"></span>
                 Signature Philosophy
               </h3>
               <p className="font-bodoni italic text-[#292826]/80 leading-relaxed text-base">
                 "Curating the space between modern minimalism and timeless elegance. Every detail is an intentional choice towards a beautiful existence."
               </p>
            </div>

            {/* Structured Proof Points */}
            {profile.proofPoints && profile.proofPoints.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
                {profile.proofPoints.map((point: any, i: number) => (
                  <div key={i} className="flex flex-col">
                    <span className="font-bodoni text-3xl text-[#292826] mb-1">{point.value}</span>
                    <span className="font-inter text-[9px] tracking-[0.2em] uppercase text-[#A39686]">{point.type}</span>
                    <div className="w-full h-px bg-[#292826]/5 mt-3" />
                  </div>
                ))}
              </div>
            )}

            {/* Link Directory */}
            <div className="mt-auto pt-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="font-inter text-[9px] tracking-[0.2em] uppercase text-[#292826]/40">Featured Directories</span>
                <div className="flex-1 h-px bg-[#292826]/10" />
              </div>

              <div className="flex flex-col gap-4">
                {profile.links?.map((link: any, i: number) => (
                  <a 
                    key={i} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="link-item-wrapper group flex items-center justify-between cursor-pointer py-1"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#292826]/5 flex items-center justify-center text-[#292826]/40 group-hover:bg-[#A39686] group-hover:text-[#F5F3EF] transition-colors duration-500">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          {getAestheteSocialIcon(link.label)}
                        </svg>
                      </div>
                      <span className="link-item font-inter text-base md:text-lg text-[#292826] tracking-wide">
                        {link.label}
                      </span>
                    </div>
                    <div className="text-[#292826]/20 group-hover:text-[#A39686] transition-colors duration-500">
                      <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          {/* Scroll Indicator */}
          <div className={`hidden md:flex absolute bottom-[15%] right-8 flex-col items-center gap-3 transition-opacity duration-1000 pointer-events-none z-50 ${hasScrolled ? 'opacity-0' : 'opacity-40'}`}>
             <span className="font-inter text-[8px] tracking-[0.3em] uppercase text-[#292826] rotate-90 mb-6">Scroll</span>
             <svg className="w-4 h-4 text-[#292826] animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
             </svg>
          </div>
          
          {/* Footer */}
          <div className="p-8 md:p-10 lg:p-14 pt-0 mt-8">
             <div className="w-full h-px bg-[#292826]/10 mb-5" />
             <div className="flex justify-between items-center text-[#292826]/40 font-inter text-[9px] tracking-[0.2em] uppercase">
                <span>© {new Date().getFullYear()}</span>
                <span>The Aesthete</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function CreatorTemplate({ profile, accentColor }: any) {
  const accent = accentColor || '#7C3AED';
  const proofs = profile?.proofPoints || profile?.proofs || [];
  
  // Custom chamfered shape string
  const chamferedShape = 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)';
  const avatarShape = 'polygon(30% 0%, 100% 0, 100% 70%, 70% 100%, 0 100%, 0 30%)';

  return (
    <div className="min-h-screen w-full bg-[#EBE4DB] text-[#1E293B] p-6 md:p-12 font-sans flex justify-center selection:bg-purple-200" style={{ background: 'linear-gradient(145deg, #FFF6E5 0%, #F5E6FE 100%)' }}>
      <div className="max-w-4xl w-full pt-16 pb-24 px-8 md:px-16 flex flex-col items-center space-y-10 bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] rounded-[3rem] my-8">
        
        {/* Avatar with unique shape */}
        <div className="relative group">
          <div 
            className="absolute -inset-2 blur-md opacity-40 group-hover:opacity-80 transition duration-1000 group-hover:duration-200 animate-pulse" 
            style={{ 
              backgroundImage: `linear-gradient(135deg, ${accent}, #FF0080)`,
              clipPath: avatarShape 
            }} 
          />
          <img 
            src={profile.avatarUrl} 
            alt={profile.name} 
            className="relative w-48 h-48 md:w-64 md:h-64 object-cover transition-transform duration-700 group-hover:scale-105 bg-white shadow-sm"
            style={{ clipPath: avatarShape }}
          />
          {/* Decorative Corner Borders */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-zinc-300 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-zinc-300 pointer-events-none" />
        </div>
        
        <div className="text-center space-y-3">
           <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase" style={{ textShadow: `2px 2px 0 ${accent}20` }}>
             {profile.name}
           </h1>
           <p className="text-slate-600 font-bold text-xl tracking-widest uppercase">{profile.headline}</p>
           <p className="max-w-xl text-sm md:text-base text-slate-700 mt-6 leading-relaxed mx-auto font-medium border-l-4 pl-6 text-left" style={{ borderColor: accent }}>{profile.bio}</p>
        </div>

        {/* METRICS SECTION WITH CHAMFERED CARDS */}
        {profile.metrics && profile.metrics.length > 0 && (
          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {profile.metrics.map((metric: any, i: number) => (
              <div 
                key={i} 
                className="bg-white/60 backdrop-blur-md p-6 flex flex-col items-center text-center hover:bg-white/90 transition-all relative group border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
                style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
              >
                {/* Accent bar */}
                <div className="absolute top-0 left-0 w-full h-1 opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: accent }} />
                <span className="text-3xl font-black mb-1 text-slate-900">{metric.value}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{metric.label || metric.title || metric.type || metric.name}</span>
                {metric.description && metric.description !== (metric.label || metric.title || metric.type || metric.name) && (
                  <span className="text-[9px] text-slate-400 mt-2 uppercase">{metric.description}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PROOF POINTS SECTION */}
        {proofs.length > 0 && (
          <div className="w-full mt-12 flex flex-col gap-4">
             <div className="flex items-center gap-4 mb-4">
                <span className="text-[10px] tracking-widest uppercase font-bold text-slate-500">Credentials & Milestones</span>
                <div className="flex-1 h-px bg-slate-300/50" />
             </div>
             {proofs.filter((p: any) => p.type || p.title || p.label).map((proof: any, i: number) => (
                <div 
                  key={i} 
                  className="bg-white/50 backdrop-blur-sm hover:bg-white/80 p-6 flex flex-col md:flex-row justify-between items-start md:items-center transition-all group relative border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.03)]"
                  style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: accent }} />
                  <div className="flex flex-col gap-1 pr-6 pl-2">
                     <div className="flex items-baseline gap-3">
                        <span className="text-xl md:text-2xl font-black text-slate-800">{proof.type || proof.title || proof.label}</span>
                        {proof.value && (
                           <span className="text-lg md:text-xl font-bold" style={{ color: accent }}>{proof.value}</span>
                        )}
                     </div>
                     {proof.description && (
                        <span className="text-sm text-slate-500 font-medium">{proof.description}</span>
                     )}
                  </div>
                  {proof.url && (
                     <a href={proof.url} target="_blank" rel="noopener noreferrer" className="mt-4 md:mt-0 text-[10px] uppercase tracking-widest font-bold text-slate-500 hover:text-slate-900 transition-colors border-b border-slate-300 hover:border-slate-900 pb-1 shrink-0">
                        View Proof ↗
                     </a>
                  )}
                </div>
             ))}
          </div>
        )}

        {/* LINKS WITH UNIQUE GEOMETRY */}
        <div className="w-full grid gap-4 mt-8 pb-12">
          {profile.links?.map((link: any, i: number) => (
            <a 
              key={i} 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="relative w-full h-20 md:h-24 bg-gradient-to-r from-white/60 to-white/90 backdrop-blur-md p-[2px] group shadow-sm"
              style={{ clipPath: chamferedShape }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <div 
                className="w-full h-full bg-white/80 relative z-10 flex items-center px-6"
                style={{ clipPath: 'polygon(18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%, 0 18px)' }}
              >
                <div className="absolute right-0 top-0 bottom-0 w-48 bg-gradient-to-l from-slate-50/80 to-transparent pointer-events-none" style={{ background: `linear-gradient(to left, ${accent}15, transparent)` }} />
                
                {/* SVG Icon Container with geometric shape */}
                <div 
                  className="bg-white p-3 mr-6 flex items-center justify-center w-12 h-12 group-hover:bg-slate-50 transition-colors border border-slate-100 shadow-sm"
                  style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                >
                  <svg className="w-5 h-5 text-slate-700 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                     {getAestheteSocialIcon(link.label)}
                  </svg>
                </div>
                <span className="text-lg md:text-xl font-bold uppercase tracking-wide group-hover:text-slate-900 text-slate-700 transition-colors">{link.label}</span>
                
                {/* Right decorative elements */}
                <div className="absolute right-6 flex items-center opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-300">
                   <span className="text-[10px] tracking-widest uppercase mr-4" style={{ color: accent }}>Execute</span>
                   <div className="w-4 h-px bg-current" style={{ color: accent }}></div>
                </div>
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

  const metrics = profile.metrics || [];
  const links = profile.links || [];
  const statement = profile.metadata?.statement;
  const statementSub = profile.metadata?.statementSub;

  let sectionCounter = 1;
  const getSectionNumber = () => `0${sectionCounter++}`;

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
               <span className="text-[#766B64]">Editorial</span>
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
                {profile.name?.split(' ')[0] || "Name"} <br className="hidden md:block" />
                <span className="text-[#DF5B4C] italic pr-0 md:pr-4">{profile.name?.split(' ').slice(1).join(' ')}</span>
              </h1>
              {profile.headline && (
                <p className="text-base md:text-lg text-[#766B64] font-medium mb-5">
                  {profile.headline}
                </p>
              )}
              {profile.bio && (
                <p className="text-sm md:text-base text-[#2B2321] max-w-sm leading-relaxed mb-8">
                  {profile.bio}
                </p>
              )}
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
          {statement && (
            <section className="mb-16 md:mb-24 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 w-[250px] h-[250px] rounded-full bg-[#A8B89D] opacity-20 blur-3xl -z-10 pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-16 relative z-10">
                <div className="relative">
                  <span className="text-[#DF5B4C] text-[10px] md:text-xs font-bold tracking-widest block md:absolute md:-left-10 md:top-2 mb-3 md:mb-0">{getSectionNumber()}</span>
                  <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl leading-[1.1] text-[#2B2321] max-w-2xl relative z-10">
                    <span className="absolute -left-2 md:-left-6 -top-3 md:-top-6 text-5xl md:text-7xl text-[#A8B89D] opacity-40 -z-10 select-none">“</span>
                    {statement}
                  </h2>
                </div>
                {statementSub && (
                  <div className="md:w-1/3 md:pb-2 border-l-2 border-[#A8B89D]/30 pl-4 md:border-none md:pl-0">
                    <p className="text-[#766B64] leading-relaxed text-sm">
                      {statementSub}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 3. Proof */}
          {metrics && metrics.length > 0 && (
            <section className="mb-16 md:mb-24">
              <div className="flex items-center justify-between mb-6 md:mb-10 relative">
                <span className="text-[#DF5B4C] text-[10px] md:text-xs font-bold tracking-widest md:absolute md:-left-10">{getSectionNumber()}</span>
                <span className="text-[#A99C91] text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase ml-auto">A little proof</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 pl-0 md:pl-6">
                {metrics.map((metric: any, i: number) => (
                  <div key={i} className="flex flex-col border-t border-[rgba(169,156,145,0.3)] pt-4 md:pt-5">
                    <span className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#2B2321] mb-1">{metric.value}</span>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-[#766B64]">{metric.label || metric.title || metric.type || metric.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. Links */}
          {links && links.length > 0 && (
            <section className="mb-16 md:mb-24 relative">
              <div className="flex items-center justify-between mb-6 md:mb-10 relative">
                  <span className="text-[#DF5B4C] text-[10px] md:text-xs font-bold tracking-widest md:absolute md:-left-10">{getSectionNumber()}</span>
                  <span className="text-[#A99C91] text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase ml-auto">Official Links</span>
              </div>
              
              <div className="flex flex-col gap-3 pl-0 md:pl-6">
                {links.map((link: any, i: number) => (
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

          {/* Footer */}
          <section className="relative mt-16 md:mt-24 pt-6 border-t border-[rgba(169,156,145,0.3)]">
            <footer className="flex flex-col md:flex-row justify-between items-center gap-4 pb-4 text-[9px] font-bold tracking-[0.2em] uppercase text-[#A99C91]">
              <div className="flex items-center gap-2">
                <span className="text-[#2B2321]">{profile.name?.toUpperCase() || "PROFILE"}</span>
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
