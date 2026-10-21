'use client';

import { useState, useRef } from 'react';
import { BadgeCheck, Send, Bookmark, ArrowRight, Users, Eye } from 'lucide-react';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { getLinkIcon as getSharedLinkIcon } from '@/components/profile/templates/utils/socialIcons';

interface HumanTemplateProps {
  profile: any;
  accentColor?: string;
}

export function HumanTemplate({ profile, accentColor }: HumanTemplateProps) {
  const accent = accentColor || '#E2B746';
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
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:-top-16 lg:-left-12 text-[#E2B746] font-serif text-[5rem] md:text-[10rem] leading-none select-none opacity-90">"</div>
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
                        {getSharedLinkIcon(link.label, link.url, link.icon, 'w-5 h-5')}
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

      <RecentActivitySection
        activity={profile.recentActivity}
        variant="human"
        autoScroll={profile.autoScroll}
      />

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
            <a
              href={profile.email ? `mailto:${profile.email}` : '#'}
              onClick={(e) => {
                if (!profile.email) {
                  e.preventDefault();
                  showToast('Contact email not available.');
                }
              }}
              className="w-full sm:w-auto px-8 py-4 md:py-5 rounded-full border border-[#1B1D1B]/30 text-[#1B1D1B] font-sans font-bold flex items-center justify-center gap-3 hover:bg-white/10 hover:border-[#1B1D1B] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B1D1B]"
            >
              <Send size={20} strokeWidth={2} />
              Get in touch
            </a>
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
                    <a key={i} href={l.url} target="_blank" rel="noreferrer" className="font-sans font-bold text-lg hover:text-[#BE5B42] transition-colors flex items-center gap-3">
                      {getSharedLinkIcon(l.label, l.url, l.icon, 'w-5 h-5')}
                      <span>{l.label}</span>
                    </a>
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