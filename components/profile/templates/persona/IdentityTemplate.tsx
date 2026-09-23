import React from 'react';
import type { TemplateProps } from '@/components/profile/templates/types';
import { getTemplateById } from '@/components/profile/templates/registry';
import { motion } from 'framer-motion';

// --- 01 INDIVIDUAL --- //

function LoverTemplate({ profile, accentColor }: any) {
  return (
    <div className="min-h-screen w-full bg-[#FAF6F0] text-[#5A4540] p-8 md:p-16 flex flex-col items-center" style={{ fontFamily: 'Georgia, serif' }}>
      <div className="max-w-2xl w-full flex flex-col items-center space-y-12">
        <div className="bg-white p-4 pb-12 shadow-md transform rotate-2 w-64 items-center flex flex-col">
          <img src={profile.avatarUrl} alt={profile.name} className="w-full h-auto aspect-square object-cover sepia-[.2] rounded-sm" />
          <span className="mt-4 font-style: italic text-xl opacity-80" style={{ fontFamily: 'cursive' }}>{profile.name}</span>
        </div>
        <div className="text-center space-y-4">
          <h1 className="text-5xl italic text-[#8B5A5A]">{profile.headline}</h1>
          <p className="text-lg opacity-80 max-w-lg mx-auto leading-loose">{profile.bio}</p>
        </div>
        <div className="w-full max-w-md space-y-4">
          {profile.links?.map((link: any, i: number) => (
            <a key={i} href={link.url} className="block text-center p-4 border border-[#E8DCC4] rounded-2xl bg-white/50 hover:bg-[#F3E7D3] transition-colors text-[#8B5A5A] tracking-wider text-sm transition-transform hover:-translate-y-1">
              • {link.label} •
            </a>
          ))}
        </div>
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
