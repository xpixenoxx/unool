'use client';

import React, { useState } from 'react';
import type { TemplateProps } from '@/components/profile/templates/types';
import { getTemplateById } from '@/components/profile/templates/registry';
import { motion } from 'framer-motion';

// --- 01 INDIVIDUAL --- //

function LoverTemplate({ profile, accentColor }: any) {
  const availableTabs = ['overview'];
  if (profile.company || profile.role) availableTabs.push('project');
  if (profile.skills && profile.skills.length > 0) availableTabs.push('stack');
  if (profile.links && profile.links.length > 0) availableTabs.push('connect');

  const [activeTab, setActiveTab] = useState(availableTabs[0] || 'overview');
  const [reactions, setReactions] = useState({ handshake: 142, applaud: 89 });
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastTimer, setToastTimer] = useState<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer) clearTimeout(toastTimer);
    const timer = setTimeout(() => {
      setToastVisible(false);
    }, 2500);
    setToastTimer(timer);
  };

  const handleReaction = (type: 'handshake' | 'applaud') => {
    setReactions(prev => ({ ...prev, [type]: prev[type] + 1 }));
    showToast(`+1 ${type === 'handshake' ? 'Handshake 🤝' : 'Applaud 👏'} sent!`);
  };
  
  const customStyles = `
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

    .lover-template-container {
      --page-bg: #140B07; 
      --stage-mat: #22120C; 
      --card-bg: #FAF5EE; 
      --card-border: rgba(255, 255, 255, 0.98);
      --card-shadow-outer-1: 20px 28px 55px rgba(18, 9, 5, 0.45);
      --card-shadow-outer-2: -10px -10px 30px rgba(255, 255, 255, 0.12);
      --card-shadow-inner-1: inset 3px 3px 8px rgba(255, 255, 255, 1);
      --card-shadow-inner-2: inset -4px -6px 12px rgba(195, 160, 135, 0.2);
      --pill-bg: #F2E8DC; 
      --pill-text: #2B1710; 
      --pill-shadow: 5px 7px 15px rgba(170, 125, 100, 0.2), -3px -3px 8px rgba(255, 255, 255, 0.98), inset 2px 2px 4px rgba(255, 255, 255, 0.95), inset -2px -2px 4px rgba(160, 110, 85, 0.15);
      --choc-primary: #2B1710;
      --choc-gradient: linear-gradient(135deg, #3A1E15 0%, #20100A 100%);
      --choc-btn-shadow: 6px 10px 22px rgba(22, 10, 5, 0.48), inset 2px 2px 4px rgba(255, 255, 255, 0.18), inset -2px -3px 5px rgba(0, 0, 0, 0.65);
      --cream-secondary-bg: #F2E8DC;
      --cream-secondary-border: #E0CEBE;
      --text-main: #2B1710; 
      --text-muted: #6B493B; 
      --text-eyebrow: #3A1E15; 
      --inset-bg: #EFE4D6; 
      --border-subtle: #E2D3C2;

      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--page-bg);
    }

    .lover-template-container .font-mono-tag {
      font-family: 'IBM Plex Mono', monospace;
      letter-spacing: 0.08em;
    }

    .lover-template-container .font-display {
      font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
    }

    .lover-template-container .clay-master-card {
      background: var(--card-bg);
      border-radius: 32px;
      box-shadow: var(--card-shadow-outer-1), var(--card-shadow-outer-2), var(--card-shadow-inner-1), var(--card-shadow-inner-2);
      border: 1px solid var(--card-border);
    }

    .lover-template-container .clay-pill {
      background: var(--pill-bg);
      color: var(--pill-text);
      box-shadow: var(--pill-shadow);
      border-radius: 14px;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
    }
    .lover-template-container .clay-pill:hover {
      transform: translateY(-2px);
      filter: brightness(1.02);
    }
    .lover-template-container .clay-pill:active, .lover-template-container .clay-pill-active {
      transform: translateY(1.5px) scale(0.99);
      box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.18), inset 2px 2px 4px rgba(0, 0, 0, 0.15), inset -1px -1px 3px rgba(255, 255, 255, 0.7);
    }

    .lover-template-container .clay-choc-btn {
      background: var(--choc-gradient);
      box-shadow: var(--choc-btn-shadow);
      border-radius: 14px;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .lover-template-container .clay-choc-btn:hover {
      transform: translateY(-2px);
      filter: brightness(1.08);
    }
    .lover-template-container .clay-choc-btn:active {
      transform: translateY(1.5px) scale(0.99);
      box-shadow: 2px 3px 6px rgba(0, 0, 0, 0.35), inset 3px 3px 6px rgba(0, 0, 0, 0.5);
    }

    .lover-template-container .clay-inset-tray {
      background: var(--inset-bg);
      border-radius: 20px;
      box-shadow: inset 3px 3px 7px rgba(0, 0, 0, 0.08), inset -2px -2px 5px rgba(255, 255, 255, 0.9);
      border: 1px solid rgba(0, 0, 0, 0.04);
    }

    .lover-template-container .clay-avatar-frame {
      box-shadow: 0 14px 28px rgba(0, 0, 0, 0.2), inset 3px 3px 6px rgba(255, 255, 255, 0.95), inset -3px -3px 6px rgba(0, 0, 0, 0.15);
    }

    .tab-content-wrapper {
      min-height: 260px;
    }
  `;

  return (
    <div className="lover-template-container min-h-[100dvh] w-full text-stone-100 p-2 sm:p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden" data-palette="whipped-cream">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <main className="w-full max-w-[460px] p-4 sm:p-7 rounded-[32px] sm:rounded-[48px] shadow-2xl z-10" style={{ background: 'var(--stage-mat)' }}>
        <div className="clay-master-card p-5 sm:p-7 flex flex-col relative overflow-hidden">
          
          <div className="w-full flex items-center justify-between pb-3 mb-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--text-main)' }}></span>
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--text-main)' }}></span>
              </span>
              <span className="font-mono-tag text-[10px] font-semibold tracking-wider uppercase" style={{ color: 'var(--text-eyebrow)' }}>
                SPEC: {profile.role || 'APPLIED AI'}
              </span>
            </div>
            <span className="font-mono-tag text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {profile.company || 'INDEPENDENT'}
            </span>
          </div>

          <div className="flex items-start gap-4 mb-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl p-1.5 clay-avatar-frame flex items-center justify-center" style={{ background: 'var(--pill-bg)', border: '2px solid var(--text-main)' }}>
                <div className="w-full h-full rounded-2xl overflow-hidden bg-stone-900 border" style={{ borderColor: 'var(--border-subtle)' }}>
                  <img src={profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'} alt={profile.name} className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full clay-pill flex items-center justify-center font-bold text-[10px]" style={{ background: 'var(--text-main)', color: 'var(--card-bg)' }}>
                ✓
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight truncate" style={{ color: 'var(--text-main)' }}>
                {profile.name}
              </h2>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {profile.headline}
              </p>
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="clay-pill px-2.5 py-1 font-mono-tag text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-eyebrow)' }}>
                  {profile.role || 'PROFESSIONAL'}
                </span>
              </div>
            </div>
          </div>

          {availableTabs.length > 1 && (
            <div className="w-full p-1 rounded-2xl clay-inset-tray mb-5 grid gap-1" style={{ gridTemplateColumns: `repeat(${availableTabs.length}, minmax(0, 1fr))` }}>
              {availableTabs.map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)} 
                  className={`py-2 px-1 text-center font-mono-tag text-[10px] rounded-xl transition font-semibold ${activeTab === tab ? 'clay-pill clay-pill-active' : 'text-stone-500 hover:text-stone-800'}`} 
                  style={{ color: activeTab === tab ? 'var(--text-main)' : '' }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          )}

          <div className="tab-content-wrapper">
            {activeTab === 'overview' && (
              <div className="tab-pane space-y-4">
                {profile.bio && (
                  <div className="clay-inset-tray p-3.5 rounded-2xl">
                    <p className="text-xs leading-relaxed font-normal" style={{ color: 'var(--text-main)' }}>
                      {profile.bio}
                    </p>
                  </div>
                )}

                {profile.proofs && profile.proofs.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {profile.proofs.slice(0,3).map((proof: any, i: number) => (
                      <div key={i} onClick={() => showToast(`${proof.title || proof.type}: ${proof.value}`)} className="clay-pill p-2.5 rounded-2xl flex flex-col items-center text-center cursor-pointer" style={i === 1 ? { border: '1px solid var(--text-main)' } : {}}>
                        <span className="text-base sm:text-lg font-bold font-display" style={{ color: 'var(--text-main)' }}>{proof.value}</span>
                        <span className="font-mono-tag text-[8px] uppercase font-semibold" style={{ color: 'var(--text-muted)' }}>{proof.title || proof.type} ⓘ</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-3 rounded-2xl clay-inset-tray flex items-center justify-between gap-2">
                  <span className="font-mono-tag text-[10px] font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                    ENGAGE:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleReaction('handshake')} className="clay-pill px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-transform">
                      <span>🤝</span>
                      <span className="font-mono-tag text-[10px]">{reactions.handshake}</span>
                    </button>
                    <button onClick={() => handleReaction('applaud')} className="clay-pill px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-transform">
                      <span>👏</span>
                      <span className="font-mono-tag text-[10px]">{reactions.applaud}</span>
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(window.location.href); showToast('Profile link copied!'); }} className="clay-pill p-1.5 text-xs active:scale-95 transition-transform" title="Share Profile">
                      🔗
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'project' && (
              <div className="tab-pane space-y-3">
                <div className="clay-inset-tray p-4 rounded-2xl border" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono-tag text-[9px] font-bold px-2 py-0.5 rounded-md uppercase" style={{ background: 'var(--text-main)', color: 'var(--card-bg)' }}>
                      CORE INITIATIVE
                    </span>
                    <span className="font-mono-tag text-[9px] font-semibold" style={{ color: 'var(--text-eyebrow)' }}>
                      ACTIVE SPRINT
                    </span>
                  </div>
                  <h3 className="text-base font-bold font-display tracking-tight" style={{ color: 'var(--text-main)' }}>
                    {profile.company || 'Current Project'}
                  </h3>
                  <p className="text-xs leading-relaxed mt-1" style={{ color: 'var(--text-muted)' }}>
                    Currently focusing on building out core features, scaling architecture, and improving user experiences.
                  </p>
                  <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--text-main)' }}></span>
                      <span className="font-mono-tag text-[9px] font-semibold uppercase" style={{ color: 'var(--text-main)' }}>
                        ROLE: {profile.role || 'LEAD'}
                      </span>
                    </div>
                    <button onClick={() => showToast('Architecture documentation requested!')} className="clay-pill px-2.5 py-1 text-[10px] font-mono-tag font-semibold" style={{ color: 'var(--text-eyebrow)' }}>
                      View Specs →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stack' && (
              <div className="tab-pane space-y-3">
                <p className="text-[11px] font-mono-tag uppercase" style={{ color: 'var(--text-muted)' }}>
                  Tap any competency to endorse:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {profile.skills?.map((skill: string, i: number) => (
                    <div key={i} onClick={(e) => { const el = e.currentTarget; el.classList.add('clay-pill-active'); setTimeout(() => el.classList.remove('clay-pill-active'), 250); showToast(`Endorsed ${skill}!`); }} className="clay-pill p-2.5 rounded-xl flex items-center justify-between cursor-pointer">
                      <span className="font-mono-tag text-[10px] font-semibold" style={{ color: 'var(--text-main)' }}>{skill}</span>
                      <span className="skill-count font-mono-tag text-[9px] px-1.5 py-0.5 rounded bg-black/5" style={{ color: 'var(--text-muted)' }}>+{Math.floor(Math.random() * 50) + 10}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'connect' && (
              <div className="tab-pane space-y-2.5">
                {profile.links && profile.links.map((link: any, i: number) => (
                  <a key={i} href={link.url} target="_blank" rel="noreferrer" className={`${i === 0 ? 'clay-choc-btn' : 'clay-pill border'} w-full py-3.5 px-4 font-bold text-xs tracking-wider uppercase flex items-center justify-between no-underline block`} style={i === 0 ? { color: 'var(--card-bg)' } : { borderColor: 'var(--border-subtle)', color: 'var(--text-main)' }}>
                    <div className="flex items-center gap-2.5">
                      <span>{link.label}</span>
                    </div>
                    <span className="font-mono-tag text-[10px]" style={i === 0 ? { opacity: 0.85 } : { color: 'var(--text-muted)' }}>Visit →</span>
                  </a>
                ))}
                <button onClick={() => { navigator.clipboard.writeText('hello@example.com'); showToast('Copied: hello@example.com'); }} className="clay-pill w-full py-2.5 px-4 font-mono-tag text-[10px] font-semibold flex items-center justify-center gap-2" style={{ color: 'var(--text-eyebrow)' }}>
                  <span>✉</span> Copy Professional Inquiries Email
                </button>
              </div>
            )}
          </div>

          <div className="mt-5 pt-3.5 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="font-mono-tag text-[9px] font-medium uppercase" style={{ color: 'var(--text-muted)' }}>
              STATUS: ACTIVE ENGAGEMENT
            </span>
            <button onClick={() => showToast('Contact vCard downloaded!')} className="font-mono-tag text-[9px] font-semibold uppercase hover:underline" style={{ color: 'var(--text-main)' }}>
              Save Contact (vCard)
            </button>
          </div>

        </div>
      </main>

      <div className={`fixed bottom-6 px-4 py-2.5 rounded-2xl bg-stone-900/95 border border-stone-700 text-stone-200 text-xs font-mono-tag shadow-2xl flex items-center gap-2 z-50 transition-all duration-300 ${toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-3'}`}>
        <span className="w-2 h-2 rounded-full" style={{ background: 'var(--text-main)' }}></span>
        <span>{toastMsg}</span>
      </div>
    </div>
  );
}

function LoneTemplate({ profile }: any) {
  return (
    <div className="min-h-screen w-full bg-[#0A0A0A] text-[#E0E0E0] p-12 md:p-24 flex flex-col justify-end" style={{ fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em' }}>
      <div className="max-w-3xl space-y-8">
        <img src={profile.avatarUrl} alt={profile.name} className="w-20 h-20 rounded-full grayscale opacity-80 hover:opacity-100 transition-opacity" />
        <div>
          <h1 className="text-6xl md:text-8xl font-medium tracking-tighter text-white">{profile.name}</h1>
          <p className="text-xl md:text-2xl mt-4 opacity-70 mb-12">{profile.headline}</p>
          <p className="max-w-xl text-lg opacity-50 mb-16">{profile.bio}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
          {profile.links?.map((link: any, i: number) => (
            <a key={i} href={link.url} className="text-sm uppercase tracking-[0.2em] opacity-60 hover:opacity-100 border-b border-[#333] hover:border-white pb-2 flex justify-between transition-all">
              <span>{link.label}</span>
              <span>↗</span>
            </a>
          ))}
        </div>
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

function HumanTemplate({ profile, accentColor }: any) {
  const accent = accentColor || '#FFD666';
  return (
    <div className="min-h-screen w-full bg-[#FFFDF8] text-[#3D3A33] p-6 md:p-12 flex flex-col items-center">
      <div className="max-w-xl w-full space-y-10 text-center mt-12">
        <div className="relative inline-block">
          <div className="absolute inset-0 rounded-[3rem] rotate-6" style={{ backgroundColor: accent, opacity: 0.5 }} />
          <img src={profile.avatarUrl} alt={profile.name} className="relative w-40 h-40 rounded-[3rem] object-cover border-4 border-white shadow-xl" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight rounded-2xl">{profile.name}</h1>
          <div className="inline-block px-6 py-2 rounded-full font-medium shadow-sm" style={{ backgroundColor: accent, color: '#3D3A33' }}>
            {profile.headline}
          </div>
          <p className="text-lg opacity-80 max-w-md mx-auto leading-relaxed">{profile.bio}</p>
        </div>
        
        <div className="space-y-4 pt-4">
          {profile.links?.map((link: any, i: number) => (
            <a key={i} href={link.url} className="block w-full py-4 px-8 bg-white border-2 border-[#F0EBE0] rounded-full font-medium text-lg shadow-sm hover:border-gray-300 hover:shadow-md transition-all hover:scale-[1.02]">
              {link.label}
            </a>
          ))}
        </div>
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
