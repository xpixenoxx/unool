import React from 'react';
import { Menu, BadgeCheck, ArrowRight, Bookmark, Send, Sparkles, Quote, Github, Linkedin, Instagram } from 'lucide-react';
import { TheLoneBackground } from './TheLoneBackground';

export const TheLoneTemplate = () => {
  return (
    <TheLoneBackground>
      <div className="px-6 py-10 flex flex-col gap-8 font-sans selection:bg-[#2C3480] selection:text-white">
        
        {/* Header Section */}
        <header className="flex justify-between items-start relative">
          <div className="flex flex-col z-10 pt-4">
            <h1 className="text-4xl font-bold tracking-tight leading-tight">
              <span className="text-[#FFFFFF] block font-serif">Imandi</span>
              <span className="text-[#2C3480] block font-serif">Prasanna.</span>
            </h1>
            <p className="text-[#FFFFFF]/60 text-xs tracking-[0.3em] uppercase mt-4">Professional</p>
          </div>
          
          <div className="flex flex-col items-end gap-6 z-10">
            <button className="h-10 w-10 rounded-full border border-[#FFFFFF]/20 bg-[#FFFFFF]/5 flex items-center justify-center backdrop-blur-md transition-colors hover:bg-[#FFFFFF]/10">
              <Menu size={18} className="text-[#FFFFFF]" />
            </button>
            <div className="relative">
              <Sparkles size={16} className="text-[#FFFFFF] absolute -top-4 -left-4" />
              <div className="h-24 w-24 rounded-full p-1 bg-gradient-to-tr from-[#2C3480] to-transparent">
                <div className="h-full w-full rounded-full overflow-hidden bg-black border border-[#2C3480]/50">
                  {/* Using a placeholder gradient for the profile picture to maintain the dark aesthetic */}
                  <div className="h-full w-full bg-gradient-to-b from-[#FFFFFF]/10 to-[#2C3480]/20 flex items-center justify-center">
                    <span className="text-[#FFFFFF]/50 text-xs">Photo</span>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-1 right-1 h-3 w-3 bg-[#2C3480] rounded-full border-2 border-black" />
            </div>
          </div>
          
          {/* Subtle background glow */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-[#2C3480]/20 rounded-full blur-3xl pointer-events-none" />
        </header>

        {/* Quote Section (Parallelogram) */}
        <div className="transform -skew-x-12 bg-[#FFFFFF]/5 border border-[#FFFFFF]/10 rounded-2xl overflow-hidden relative shadow-lg">
          {/* Inner un-skew */}
          <div className="transform skew-x-12 p-5 flex gap-4 items-start relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#2C3480]/10 to-transparent pointer-events-none" />
            <Quote size={24} className="text-[#FFFFFF] shrink-0 fill-current opacity-80" />
            <p className="text-[#FFFFFF]/80 text-sm leading-relaxed italic pr-4">
              Hey! This is Prasanna. Working as an AI intern in Poonce Solutions. Currently working on unool platform.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Followers', value: '12K', dark: true },
            { label: 'Connections', value: '500+', dark: false },
            { label: 'Profile Views', value: '50k', dark: true }
          ].map((stat, i) => (
            <div key={i} className={`transform -skew-x-12 border rounded-xl overflow-hidden shadow-lg ${stat.dark ? 'bg-[#FFFFFF]/5 border-[#FFFFFF]/10' : 'bg-[#FFFFFF] border-[#FFFFFF]'}`}>
              <div className={`transform skew-x-12 p-4 flex flex-col items-center justify-center text-center ${stat.dark ? 'text-[#FFFFFF]' : 'text-black'}`}>
                <span className="text-xl font-bold font-serif mb-1">{stat.value}</span>
                <span className={`text-[10px] uppercase tracking-wider ${stat.dark ? 'text-[#FFFFFF]/60' : 'text-black/60'}`}>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Official Links Section */}
        <section className="flex flex-col gap-4 mt-2">
          <div className="flex justify-between items-center text-xs uppercase tracking-widest text-[#FFFFFF]/70">
            <span>Official Links</span>
            <div className="flex items-center gap-1.5 capitalize tracking-normal text-[#FFFFFF]/50">
              Verified Profiles
              <BadgeCheck size={14} className="text-[#2C3480] fill-[#2C3480] text-black" />
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            {[
              { name: 'LinkedIn', url: 'linkedin.com/in/prasanna...', icon: Linkedin, color: 'bg-[#2C3480]' },
              { name: 'Instagram', url: 'instagram.com/', icon: Instagram, color: 'bg-gradient-to-tr from-[#2C3480] to-[#FFFFFF]/40', light: true },
              { name: 'Github', url: 'github.com/', icon: Github, color: 'bg-[#FFFFFF]/10' }
            ].map((link, i) => (
              <a key={i} href="#" className={`group transform -skew-x-12 border overflow-hidden transition-all hover:scale-[1.02] shadow-lg ${link.light ? 'bg-[#FFFFFF] border-[#FFFFFF]' : 'bg-[#FFFFFF]/5 border-[#FFFFFF]/10'}`}>
                <div className="transform skew-x-12 p-3 flex items-center gap-4 relative">
                  {/* Decorative background element */}
                  <div className={`absolute right-0 top-0 bottom-0 w-32 blur-2xl opacity-20 pointer-events-none ${link.light ? 'bg-[#2C3480]' : 'bg-[#FFFFFF]'}`} />
                  
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${link.color} ${link.name === 'Github' ? 'text-[#FFFFFF]' : 'text-white'}`}>
                    <link.icon size={20} className={link.name === 'Github' ? 'fill-current' : ''} />
                  </div>
                  <div className={`flex-1 ${link.light ? 'text-black' : 'text-[#FFFFFF]'}`}>
                    <h3 className="font-semibold text-sm">{link.name}</h3>
                    <p className={`text-xs ${link.light ? 'text-black/60' : 'text-[#FFFFFF]/50'}`}>{link.url}</p>
                  </div>
                  <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 mr-2 transition-transform group-hover:-rotate-45 ${link.light ? 'border-black/10 text-black' : 'border-[#FFFFFF]/20 text-[#FFFFFF]'}`}>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Recent Activity Section */}
        <section className="flex flex-col gap-4 mt-2 relative">
          <div className="flex justify-between items-center text-xs uppercase tracking-widest text-[#FFFFFF]/70">
            <span>Recent Activity</span>
            <div className="flex items-center gap-2 capitalize tracking-normal text-[#FFFFFF]/50 italic">
              <div className="h-2 w-2 rounded-full bg-[#2C3480] animate-pulse" />
              Live Feeds
            </div>
          </div>
          
          <div className="flex flex-col gap-4 relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-6 bottom-6 w-px bg-[#FFFFFF]/10 z-0" />
            
            {[
              { platform: 'GitHub', action: 'Pushed commits to unool-platform: updated layout components', time: '4h ago', icon: Github, color: 'bg-[#FFFFFF]' },
              { platform: 'LinkedIn', action: 'Shared update on internship progress at Poonce Solutions', time: '2d ago', icon: Linkedin, color: 'bg-[#2C3480]' },
              { platform: 'Instagram', action: 'Workspace snapshot: prototyping UI cards', time: '1d ago', icon: Instagram, color: 'bg-gradient-to-tr from-[#2C3480] to-[#FFFFFF]/40' }
            ].map((activity, i) => (
              <div key={i} className="flex gap-4 z-10">
                {/* Timeline node */}
                <div className="w-12 pt-4 flex justify-center shrink-0">
                  <div className="w-3 h-3 rounded-full bg-black border-2 border-[#FFFFFF] z-10" />
                </div>
                
                {/* Content Card */}
                <div className={`flex-1 transform -skew-x-12 border overflow-hidden shadow-lg ${i === 1 ? 'bg-[#FFFFFF] border-[#FFFFFF]' : 'bg-[#FFFFFF]/5 border-[#FFFFFF]/10'}`}>
                  <div className={`transform skew-x-12 p-3 pr-4 flex items-center gap-3 relative ${i === 1 ? 'text-black' : 'text-[#FFFFFF]'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${activity.color} ${i === 0 ? 'text-black' : 'text-white'}`}>
                      <activity.icon size={18} className={i === 0 ? 'fill-current' : ''} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-semibold text-sm">{activity.platform}</h4>
                        <span className={`text-[10px] ${i === 1 ? 'text-black/50' : 'text-[#FFFFFF]/40'}`}>{activity.time}</span>
                      </div>
                      <p className={`text-[10px] leading-tight ${i === 1 ? 'text-black/70' : 'text-[#FFFFFF]/60'}`}>
                        {activity.action}
                      </p>
                    </div>
                    <div className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 ${i === 1 ? 'border-black/10 text-black' : 'border-[#FFFFFF]/20 text-[#FFFFFF]'}`}>
                      <ArrowRight size={10} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Actions */}
        <div className="flex gap-3 mt-4">
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
        <footer className="flex justify-between items-center text-[#FFFFFF]/40 text-xs mt-6 px-2">
          <span>ipras.unool.co</span>
          <span className="font-serif text-[#FFFFFF]/60">Unool</span>
        </footer>

      </div>
    </TheLoneBackground>
  );
};
