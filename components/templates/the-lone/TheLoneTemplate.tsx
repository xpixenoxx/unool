import React from 'react';
import { Menu, BadgeCheck, ArrowRight, Bookmark, Send, Sparkles, Quote, Github, Linkedin, Instagram, ExternalLink, Activity } from 'lucide-react';
import { TheLoneBackground } from './TheLoneBackground';

export interface TemplateProps {
  profile: any;
  accentColor?: string;
  isPreview?: boolean;
  onLinkClick?: (link: any) => void;
  templateId?: string;
}

export const TheLoneTemplate = ({ profile, onLinkClick }: TemplateProps) => {
  // Split name for styling
  const nameParts = (profile?.name || 'Imandi Prasanna').split(' ');
  const firstName = nameParts[0] || 'Imandi';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') + '.' : 'Prasanna.';

  // Map icon strings to actual lucide components
  const getIconComponent = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'github': return Github;
      case 'linkedin': return Linkedin;
      case 'instagram': return Instagram;
      default: return ExternalLink;
    }
  };

  const links = profile?.links || [
    { label: 'LinkedIn', url: 'linkedin.com/in/...', icon: 'linkedin' },
    { label: 'Instagram', url: 'instagram.com/', icon: 'instagram' },
    { label: 'Github', url: 'github.com/', icon: 'github' }
  ];

  const stats = profile?.proofs || [
    { title: 'Followers', value: '12K' },
    { title: 'Connections', value: '500+' },
    { title: 'Profile Views', value: '50k' }
  ];

  // We are going to map stats to the design colors from our hardcoded list for visual variety
  const getStatStyle = (index: number) => {
    return index % 2 === 0 ? { dark: true } : { dark: false };
  };

  const getLinkStyle = (index: number, iconName: string) => {
    if (iconName?.toLowerCase() === 'linkedin') return { color: 'bg-[#2C3480]', light: false };
    if (iconName?.toLowerCase() === 'instagram') return { color: 'bg-gradient-to-tr from-[#2C3480] to-[#FFFFFF]/40', light: true };
    return { color: 'bg-[#FFFFFF]/10', light: false };
  };

  return (
    <TheLoneBackground>
      <div className="px-6 py-10 flex flex-col gap-8 font-sans selection:bg-[#2C3480] selection:text-white">
        
        {/* Header Section */}
        <header className="flex justify-between items-start relative">
          <div className="flex flex-col z-10 pt-4">
            <h1 className="text-4xl font-bold tracking-tight leading-tight">
              <span className="text-[#FFFFFF] block font-serif">{firstName}</span>
              <span className="text-[#2C3480] block font-serif">{lastName}</span>
            </h1>
            <p className="text-[#FFFFFF]/60 text-xs tracking-[0.3em] uppercase mt-4">
              {profile?.role || 'Professional'}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-6 z-10">
            <button className="h-10 w-10 rounded-full border border-[#FFFFFF]/20 bg-[#FFFFFF]/5 flex items-center justify-center backdrop-blur-md transition-colors hover:bg-[#FFFFFF]/10">
              <Menu size={18} className="text-[#FFFFFF]" />
            </button>
            <div className="relative">
              <Sparkles size={16} className="text-[#FFFFFF] absolute -top-4 -left-4" />
              <div className="h-24 w-24 rounded-full p-1 bg-gradient-to-tr from-[#2C3480] to-transparent">
                <div className="h-full w-full rounded-full overflow-hidden bg-black border border-[#2C3480]/50 relative flex items-center justify-center">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.name || 'Avatar'} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-[#FFFFFF]/10 to-[#2C3480]/20 flex items-center justify-center">
                      <span className="text-[#FFFFFF]/50 text-xs">Photo</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute bottom-1 right-1 h-3 w-3 bg-[#2C3480] rounded-full border-2 border-black" />
            </div>
          </div>
          
          {/* Subtle background glow */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-[#2C3480]/20 rounded-full blur-3xl pointer-events-none" />
        </header>

        {/* Quote / Bio Section (Parallelogram) */}
        {(profile?.bio || profile?.headline) && (
          <div className="transform -skew-x-12 bg-[#FFFFFF]/5 border border-[#FFFFFF]/10 rounded-2xl overflow-hidden relative shadow-lg">
            <div className="transform skew-x-12 p-5 flex gap-4 items-start relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#2C3480]/10 to-transparent pointer-events-none" />
              <Quote size={24} className="text-[#FFFFFF] shrink-0 fill-current opacity-80" />
              <p className="text-[#FFFFFF]/80 text-sm leading-relaxed italic pr-4">
                {profile?.bio || profile?.headline}
              </p>
            </div>
          </div>
        )}

        {/* Stats Section */}
        {stats.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {stats.slice(0, 3).map((stat: any, i: number) => {
              const style = getStatStyle(i);
              return (
                <div key={i} className={`transform -skew-x-12 border rounded-xl overflow-hidden shadow-lg ${style.dark ? 'bg-[#FFFFFF]/5 border-[#FFFFFF]/10' : 'bg-[#FFFFFF] border-[#FFFFFF]'}`}>
                  <div className={`transform skew-x-12 p-4 flex flex-col items-center justify-center text-center ${style.dark ? 'text-[#FFFFFF]' : 'text-black'}`}>
                    <span className="text-xl font-bold font-serif mb-1">{stat.value}</span>
                    <span className={`text-[10px] uppercase tracking-wider ${style.dark ? 'text-[#FFFFFF]/60' : 'text-black/60'}`}>{stat.title}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Official Links Section */}
        {links.filter((l: any) => l.isVisible !== false).length > 0 && (
          <section className="flex flex-col gap-4 mt-2">
            <div className="flex justify-between items-center text-xs uppercase tracking-widest text-[#FFFFFF]/70">
              <span>Official Links</span>
              <div className="flex items-center gap-1.5 capitalize tracking-normal text-[#FFFFFF]/50">
                Verified Profiles
                <BadgeCheck size={14} className="text-[#2C3480] fill-[#2C3480] text-black" />
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              {links.filter((l: any) => l.isVisible !== false).map((link: any, i: number) => {
                const IconComponent = getIconComponent(link.icon);
                const style = getLinkStyle(i, link.icon);
                
                return (
                  <a 
                    key={link.id || i} 
                    href={link.url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (onLinkClick) {
                        e.preventDefault();
                        onLinkClick(link);
                      }
                    }}
                    className={`group transform -skew-x-12 border overflow-hidden transition-all hover:scale-[1.02] shadow-lg ${style.light ? 'bg-[#FFFFFF] border-[#FFFFFF]' : 'bg-[#FFFFFF]/5 border-[#FFFFFF]/10'}`}
                  >
                    <div className="transform skew-x-12 p-3 flex items-center gap-4 relative">
                      <div className={`absolute right-0 top-0 bottom-0 w-32 blur-2xl opacity-20 pointer-events-none ${style.light ? 'bg-[#2C3480]' : 'bg-[#FFFFFF]'}`} />
                      
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${style.color} ${!style.light ? 'text-[#FFFFFF]' : 'text-white'}`}>
                        <IconComponent size={20} className={!style.light && link.icon !== 'linkedin' ? 'fill-current text-[#FFFFFF]' : ''} />
                      </div>
                      <div className={`flex-1 ${style.light ? 'text-black' : 'text-[#FFFFFF]'}`}>
                        <h3 className="font-semibold text-sm truncate max-w-[150px]">{link.label}</h3>
                        <p className={`text-xs truncate max-w-[150px] ${style.light ? 'text-black/60' : 'text-[#FFFFFF]/50'}`}>
                          {link.url.replace(/^https?:\/\//, '')}
                        </p>
                      </div>
                      <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 mr-2 transition-transform group-hover:-rotate-45 ${style.light ? 'border-black/10 text-black' : 'border-[#FFFFFF]/20 text-[#FFFFFF]'}`}>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Bottom Actions */}
        <div className="flex gap-3 mt-4 mb-4">
          <button className="flex-1 transform -skew-x-12 bg-[#2C3480] text-white overflow-hidden shadow-lg shadow-[#2C3480]/20 hover:bg-[#2C3480]/90 transition-colors">
            <div className="transform skew-x-12 p-4 flex items-center justify-between px-6">
              <Send size={18} />
              <span className="font-medium text-sm">Get in Touch</span>
              <ArrowRight size={16} />
            </div>
          </button>
          
          <button className="flex-1 transform -skew-x-12 bg-[#FFFFFF]/5 border border-[#FFFFFF]/20 text-[#FFFFFF] overflow-hidden hover:bg-[#FFFFFF]/10 transition-colors backdrop-blur-sm">
            <div className="transform skew-x-12 p-4 flex items-center justify-center gap-3">
              <Bookmark size={16} />
              <span className="font-medium text-sm">Save Contact</span>
            </div>
          </button>
        </div>

        {/* Footer */}
        <footer className="flex justify-between items-center text-[#FFFFFF]/40 text-xs px-2 mt-auto">
          <span>{profile?.subdomain ? `${profile.subdomain}.unool.co` : 'ipras.unool.co'}</span>
          <span className="font-serif text-[#FFFFFF]/60">Unool</span>
        </footer>

      </div>
    </TheLoneBackground>
  );
};
