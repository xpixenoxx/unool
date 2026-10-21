'use client';

import { RecentActivitySection } from '@/components/profile/RecentActivitySection';
import { getAestheteSocialIcon } from '@/components/profile/templates/utils/socialIcons';
import type { TemplateProps } from '@/components/profile/templates/types';

interface BuilderTemplateProps extends TemplateProps {}

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

    /* Focus visible styles for accessibility */
    :focus-visible {
      outline: 2px solid #A85C4A;
      outline-offset: 2px;
    }
  `;

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
                <div className="absolute inset-0 builder-blueprint-grid opacity-30" aria-hidden="true" />

                <div className="w-full md:w-[35%] relative min-h-[220px] md:min-h-full flex items-center justify-center shrink-0 border-b md:border-b-0 md:border-r border-white/10 pb-8 md:pb-0 md:pr-8">
                   {profile?.avatarUrl ? (
                     <img src={profile.avatarUrl} alt={name} className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-sm border-2 border-[#C5A86A] z-10 relative" />
                   ) : (
                     <div className="w-48 h-48 md:w-56 md:h-56 bg-[#292226] border-2 border-[#C5A86A] flex items-center justify-center text-xs font-bold text-[#C5A86A] z-10 relative">ID</div>
                   )}
                </div>

                <div className="flex-1 relative z-10 flex flex-col justify-center">
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
                         <div className="absolute inset-0 builder-blueprint-grid opacity-10 pointer-events-none" aria-hidden="true" />
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
             <div className="absolute inset-0 builder-blueprint-grid opacity-20 pointer-events-none" aria-hidden="true" />
             <h2 className="builder-serif text-5xl md:text-6xl mb-6 max-w-2xl leading-[1.05] relative z-10 text-[#F3EEE6]">Ready to initialize?</h2>
             <p className="text-xs text-[#F3EEE6]/80 mb-10 max-w-md uppercase tracking-widest font-bold relative z-10">
               Begin sequence transfer.
             </p>
             {email && (
             <a
               href={`mailto:${email}`}
               className="bg-[#342632] text-[#C5A86A] px-8 py-4 text-[12px] uppercase tracking-[0.2em] font-bold flex items-center gap-4 hover:bg-[#292226] transition-colors relative z-10 shadow-[4px_4px_0px_rgba(41,34,38,1)] border border-[#292226]"
             >
               GET IN TOUCH <span className="text-[#F3EEE6]" aria-hidden="true">↗</span>
             </a>
           )}
          </section>

        </div>
      </div>
    </div>
  );
}