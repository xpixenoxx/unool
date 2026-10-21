'use client';

import { ExternalLink, Github, Linkedin, Instagram } from 'lucide-react';
import { RecentActivitySection } from '@/components/profile/RecentActivitySection';

interface BuilderTemplateProps {
  profile: any;
  accentColor?: string;
}

export function BuilderTemplate({ profile }: BuilderTemplateProps) {
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
      background-color: #FAFAFA;
      color: #292226;
      font-family: 'Outfit', sans-serif;
    }

    .builder-serif {
      font-family: 'DM Serif Display', serif;
    }

    .builder-container {
      background-color: #E8EEF2;
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

  const getAestheteSocialIcon = (label: string, url?: string, icon?: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('github')) return <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />;
    if (lower.includes('linkedin')) return <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />;
    if (lower.includes('instagram')) return <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 110 12.324 6.162 6.162 0 010-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 110 2.881 1.44 1.44 0 010-2.881z" />;
    return <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6l5 5v13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V15a2 2 0 0 0-2-2h-2z" />;
  };

  return (
    <div className="builder-theme min-h-screen w-full flex justify-center py-4 md:py-12 px-4 md:px-8">
      <style>{customStyles}</style>

      <div className="builder-container w-full max-w-[1200px] rounded-[32px] md:rounded-[40px] border border-[#292226]/10 overflow-hidden flex flex-col relative pb-20">

        <header className="px-6 md:px-12 py-8 flex justify-between items-center border-b border-[#292226]/10">
          <div className="flex items-center gap-3">
             <div className="w-5 h-5 bg-[#342632] flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#C5A86A]" />
             </div>
             <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#342632]">BUILDER // {name ? name.split(' ')[0] : 'ID'}</span>
          </div>
        </header>

        <div className="px-6 md:px-12 pt-16 md:pt-24 max-w-[960px] mx-auto w-full">
          <section className="mb-16 relative">
             <div className="w-full bg-[#342632] text-[#F3EEE6] p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row gap-8 md:gap-16 group builder-module-shadow border border-[#292226]">
                <div className="absolute inset-0 builder-blueprint-grid opacity-30" />

                <div className="w-full md:w-[35%] relative min-h-[220px] md:min-h-full flex items-center justify-center shrink-0 border-b md:border-b-0 md:border-r border-white/10 pb-8 md:pb-0 md:pr-8">
                   {profile?.avatarUrl ? (
                     <img src={profile.avatarUrl} alt={name} className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-sm border-2 border-[#C5A86A] z-10 relative" />
                   ) : (
                     <div className="w-48 h-48 md:w-56 md:h-56 bg-[#292226] border-2 border-[#C5A86A] flex items-center justify-center text-xs font-bold text-[#C5A86A] z-10 relative">ID</div>
                   )}
                </div>

                <div className="flex-1 relative z-10 flex flex-col justify-center">
                   <div className="text-[#C5A86A] text-[9px] uppercase tracking-[0.2em] mb-5 flex items-center gap-3 font-bold">
                      <div className="w-2 h-2 bg-current rounded-full animate-ping" />
                      SYSTEM ONLINE
                   </div>

                   <div className="flex items-center gap-5 mb-6">
                     <h2 className="builder-serif text-4xl md:text-5xl">{name || "[ BUILDER ]"}</h2>
                   </div>

                   <div className="text-[12px] font-bold text-[#C5A86A] mb-3 uppercase tracking-widest">{role}</div>
                   <p className="text-lg text-[#F3EEE6]/80 max-w-sm mb-8 leading-relaxed font-medium">{bio}</p>
                </div>
             </div>
          </section>

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
                        const icon = getAestheteSocialIcon(link.label || link.title, link.url, link.icon);
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

          {proofs && proofs.length > 0 && (
             <section className="mb-24">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#87958A] mb-8 font-bold border-l-2 border-[#A85C4A] pl-3">SYSTEM CREDENTIALS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {proofs.filter((p: any) => p.type || p.title || p.label).map((p: any, i: number) => (
                      <div key={i} className="bg-[#FAFAFA] border-2 border-[#292226]/40 p-6 flex flex-col justify-center hover:border-[#A85C4A] transition-colors group relative overflow-hidden builder-module-shadow">
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

          <RecentActivitySection
            activity={profile.recentActivity}
            variant="builder"
            autoScroll={profile.autoScroll}
          />

          <section className="mt-32 mb-16 bg-[#A85C4A] text-[#F3EEE6] p-8 md:p-16 flex flex-col items-center text-center relative overflow-hidden border border-[#292226] builder-module-shadow">
             <div className="absolute inset-0 builder-blueprint-grid opacity-20 pointer-events-none" />
             <h2 className="builder-serif text-5xl md:text-6xl mb-6 max-w-2xl leading-[1.05] relative z-10 text-[#F3EEE6]">Ready to initialize?</h2>
             <p className="text-xs text-[#F3EEE6]/80 mb-10 max-w-md uppercase tracking-widest font-bold relative z-10">
               Begin sequence transfer.
             </p>
             <a href={email ? `mailto:${email}` : '#'} className="bg-[#342632] text-[#C5A86A] px-8 py-4 text-[12px] uppercase tracking-[0.2em] font-bold flex items-center gap-4 hover:bg-[#292226] transition-colors relative z-10 shadow-[4px_4px_0px_rgba(41,34,38,1)] border border-[#292226]">
                GET IN TOUCH <span className="text-[#F3EEE6]">↗</span>
             </a>
          </section>

        </div>
      </div>
    </div>
  );
}