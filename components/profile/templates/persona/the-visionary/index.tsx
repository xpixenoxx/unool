'use client';

import { ExternalLink, Github, Linkedin, Instagram } from 'lucide-react';
import { SocialIcon } from '@/components/profile/SocialBrandIcons';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import type { ProfileLink } from '@/components/profile/templates/types';

interface VisionaryTemplateProps {
  profile: any;
  onLinkClick?: (link: ProfileLink) => void;
  accentColor?: string;
}

export function VisionaryTemplate({ profile, onLinkClick, accentColor }: VisionaryTemplateProps) {
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
  const email = profile?.email || "";
  const contactLink = email.includes('@') ? `mailto:${email}` : '#';

  const currentYear = new Date().getFullYear();

  const getPlatformIcon = (platform: string, url?: string, icon?: string) => {
    return <SocialIcon label={platform} url={url} icon={icon} className="w-[19px] h-[19px] block fill-current" />;
  };

  return (
    <div className="min-h-screen w-full bg-[#ECEEF5] py-8 sm:py-16 px-4 sm:px-8 flex justify-center items-start text-[#2C2825] font-['Manrope',sans-serif] antialiased">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Manrope:wght@300;400;500;600;700&display=swap');
        .visionary-serif { font-family: 'DM Serif Display', serif; }
        .visionary-sans { font-family: 'Manrope', sans-serif; }

        .visionary-outer-shell {
          background-color: #FDF2E9;
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

        <div className="absolute top-6 left-6 w-3 h-3 border-t border-l border-[#2C2825]/30 pointer-events-none" />
        <div className="absolute top-6 right-6 w-3 h-3 border-t border-r border-[#2C2825]/30 pointer-events-none" />
        <div className="absolute bottom-6 left-6 w-3 h-3 border-b border-l border-[#2C2825]/30 pointer-events-none" />
        <div className="absolute bottom-6 right-6 w-3 h-3 border-b border-r border-[#2C2825]/30 pointer-events-none" />

        <header className="relative pt-8 pb-4 px-8 sm:px-12 flex justify-between items-center text-[9px] tracking-[0.2em] uppercase font-bold text-[#2C2825]">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border border-[#2C2825] flex items-center justify-center p-[2px]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2C2825]" />
            </div>
            <span>UNOOL / FIELD NOTE</span>
          </div>
        </header>

        <section className="relative px-8 sm:px-12 pt-12 pb-20 flex flex-col md:flex-row gap-12 md:gap-20 items-center md:items-start border-b border-[#2C2825]/10">

          <div className="w-full md:w-[400px] flex flex-col items-center shrink-0">
            <div className="absolute top-16 left-12 w-4 h-4 border-t border-l border-[#2C2825]/20 hidden md:block" />
            <div className="relative w-full aspect-square max-w-[360px]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#DCCDC3] to-[#E8DCC8] rounded-[50%] anim-float" />
              <div className="absolute inset-4 bg-gradient-to-tr from-[#F5E6D3] to-[#FDF2E9] rounded-[50%] border border-[#2C2825]/10" />
              {imageUrl ? (
                <img src={imageUrl} alt={name} className="relative z-10 w-full h-full object-cover rounded-[50%] border-4 border-[#FDF2E9] shadow-[0_20px_40px_-10px_rgba(44,40,37,0.15)]" />
              ) : (
                <div className="relative z-10 w-full h-full rounded-[50%] bg-gradient-to-br from-[#DCCDC3] to-[#E8DCC8] flex items-center justify-center">
                  <span className="visionary-serif text-7xl md:text-9xl text-[#2C2825]/30">{firstName[0]}</span>
                </div>
              )}
              <div className="absolute -bottom-6 -right-6 w-14 h-14 bg-[#2C2825] rounded-full flex items-center justify-center border-4 border-[#FDF2E9] shadow-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FDF2E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </div>
            </div>
            <div className="mt-8 text-center md:text-left w-full">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#2C2825]/50 font-bold">FIELD NOTE // {currentYear}</p>
              <h1 className="visionary-serif text-5xl sm:text-6xl md:text-7xl font-normal leading-[1.05] text-[#2C2825] mt-2 max-w-[360px]">{firstName}<br /><span className="text-[#2C2825]/60">{lastName}</span></h1>
              <p className="mt-4 text-base md:text-lg text-[#2C2825]/70 font-medium leading-relaxed max-w-[360px]">{headline}</p>
            </div>
          </div>

          <div className="flex-1 w-full md:pt-4">
            <div className="mb-12 md:mb-16">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#2C2825]/50 font-bold mb-3">POSITIONING</p>
              <p className="text-lg md:text-xl text-[#2C2825]/80 leading-relaxed max-w-2xl">{positioning}</p>
            </div>

            <div className="mb-12 md:mb-16">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#2C2825]/50 font-bold mb-3">CURRENTLY EXPLORING</p>
              <p className="text-base md:text-lg text-[#2C2825] font-medium tracking-wide uppercase">{exploring}</p>
            </div>

            <div className="mb-12 md:mb-16">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#2C2825]/50 font-bold mb-3">THE QUESTION</p>
              <p className="visionary-serif text-2xl md:text-3xl text-[#2C2825] leading-[1.2] max-w-2xl italic">"{question}"</p>
            </div>

            <div className="mb-12 md:mb-16 flex flex-wrap gap-4">
              {metrics.map((m: any, i: number) => (
                <div key={i} className="flex-1 min-w-[140px] bg-[#FDF2E9] border border-[#2C2825]/10 rounded-[16px] p-6 md:p-8 transition-all hover:border-[#2C2825]/30 hover:shadow-lg">
                  <p className="visionary-serif text-4xl md:text-5xl font-normal text-[#2C2825] leading-none mb-2">{m.value}</p>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-[#2C2825]/60 font-bold">{m.label}</p>
                  <p className="text-[10px] text-[#2C2825]/40 mt-1">{m.description}</p>
                </div>
              ))}
            </div>

            <div className="mb-12 md:mb-16">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#2C2825]/50 font-bold mb-4">SIGNAL CHANNELS</p>
              <div className="flex flex-wrap gap-3">
                {links.map((link: any, i: number) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" onClick={(e) => { e.preventDefault(); onLinkClick?.(link.url); window.open(link.url, '_blank'); }} className="flex items-center gap-3 px-5 py-3 bg-[#FDF2E9] border border-[#2C2825]/10 rounded-[12px] text-[#2C2825] text-sm font-medium transition-all hover:border-[#2C2825]/30 hover:shadow-md group">
                    <div className="w-8 h-8 rounded-full bg-[#2C2825]/10 flex items-center justify-center group-hover:bg-[#2C2825] group-hover:text-[#FDF2E9] transition-colors">{getPlatformIcon(link.label, link.url, link.icon)}</div>
                    <span>{link.label}</span>
                    <span className="text-[9px] uppercase tracking-[0.1em] text-[#2C2825]/40 hidden sm:inline">{link.description}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-[#2C2825]/10">
              <a href={contactLink} className="inline-flex items-center gap-3 px-8 py-4 bg-[#2C2825] text-[#FDF2E9] rounded-[12px] text-sm font-bold uppercase tracking-[0.1em] transition-all hover:shadow-xl hover:shadow-[#2C2825]/30">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                Get in Touch
              </a>
            </div>
          </div>
        </section>

        <section className="px-8 sm:px-12 py-16 border-b border-[#2C2825]/10">
          <div className="flex flex-col md:flex-row gap-8 md:gap-16">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#2C2825]/50 font-bold mb-4">BASED IN</p>
              <p className="text-base md:text-lg text-[#2C2825]/70 font-medium">{location}</p>
            </div>
            <div className="flex-1 min-w-0 border-l border-[#2C2825]/10 md:border-l-0 md:border-t md:pt-8 pl-8 md:pl-0 md:mt-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#2C2825]/50 font-bold mb-4">CONNECT</p>
              <a href={contactLink} className="text-base md:text-lg text-[#2C2825] font-medium hover:text-[#2C2825]/60 transition-colors underline underline-offset-2">{email || 'Email not public'}</a>
            </div>
          </div>
        </section>

        <RecentActivitySection
          activity={profile.recentActivity}
          variant="visionary"
          autoScroll={profile.autoScroll}
        />

        <footer className="px-8 sm:px-12 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] uppercase tracking-[0.2em] text-[#2C2825]/40 font-bold">
          <p>© {currentYear} {name} — Built with UNOOL</p>
          <div className="flex gap-6">
            <span>FIELD NOTE</span>
            <span>VISIONARY</span>
          </div>
        </footer>

      </div>
    </div>
  );
}