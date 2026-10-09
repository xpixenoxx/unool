'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Scale, ArrowLeft, FileText, Zap, Shield, Sparkles } from 'lucide-react';
import { useRef } from 'react';

export default function TermsOfServicePage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const opacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

  const sections = [
    { id: 'acceptance', icon: FileText, title: 'Acceptance of Terms', content: 'By accessing or using Unool, you agree to these Terms. We may update them occasionally, and material changes will be posted here. Continued use constitutes your acceptance.' },
    { id: 'service', icon: Zap, title: 'The Service', content: 'Unool provides a professional profile and social publishing platform. You get one link for your public profile, and AI tools to adapt and publish content to connected platforms like LinkedIn and X.' },
    { id: 'ai', icon: Sparkles, title: 'AI & Content', content: 'You retain full ownership of your content. Our AI adapts your drafts, but you always review and approve before publishing. You are responsible for the accuracy and legality of everything you post.' },
    { id: 'conduct', icon: Shield, title: 'Acceptable Use', content: 'Do not violate laws, spam, scrape, impersonate others, or attempt to reverse-engineer our systems. We reserve the right to suspend or terminate accounts that violate these rules.' }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-sans selection:bg-[#C84B31] selection:text-white pb-32">
      {/* Background ambient glow */}
      <div className="fixed top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#8C2A25] rounded-full mix-blend-screen filter blur-[150px] opacity-20 pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#C84B31] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none" />

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#C84B31]/50 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
            </div>
            <span className="font-bold tracking-tight">Back to Unool</span>
          </Link>
        </div>
      </nav>

      <main className="pt-40 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
        
        {/* Left Column: Hero & Index */}
        <div className="lg:col-span-5 lg:sticky lg:top-40 h-fit">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-white/70 mb-8">
              <Scale className="w-4 h-4 text-[#C84B31]" />
              Updated July 2026
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter leading-[1.1] mb-6">
              Terms of <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C84B31] to-[#8C2A25]">Service.</span>
            </h1>
            <p className="text-xl text-white/50 font-medium leading-relaxed max-w-md">
              The rules of the road. We keep it simple, fair, and designed to protect both you and the Unool community.
            </p>
          </motion.div>
        </div>

        {/* Right Column: Content */}
        <div className="lg:col-span-7">
          <div className="space-y-12 lg:space-y-24">
            {sections.map((section, idx) => (
              <motion.div 
                key={section.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: idx * 0.1, ease: "easeOut" }}
                className="group"
              >
                <div className="flex items-start gap-6">
                  <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#C84B31]/50 group-hover:from-[#C84B31]/20 group-hover:to-transparent transition-all duration-500 shadow-lg">
                    <section.icon className="w-6 h-6 text-white/80 group-hover:text-[#C84B31] transition-colors" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-4 tracking-tight text-white/90">{section.title}</h2>
                    <p className="text-lg text-white/50 leading-relaxed font-medium">
                      {section.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Detailed Legal Section */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="pt-12 border-t border-white/10"
            >
              <h3 className="text-xl font-bold mb-6 text-white/70">The Fine Print</h3>
              <div className="prose prose-invert prose-p:text-white/40 prose-p:leading-relaxed prose-a:text-[#C84B31] prose-a:no-underline hover:prose-a:underline max-w-none font-medium">
                <p><strong>Disclaimers:</strong> The service is provided "AS IS" without warranties of any kind. We do not guarantee uptime, uninterrupted access, or platform API availability. Third-party platform changes may break features without notice.</p>
                <p><strong>Limitation of Liability:</strong> To the maximum extent permitted by law, Unool and its affiliates are not liable for indirect, incidental, special, consequential, or punitive damages. Our total liability is limited to the fees you paid us in the preceding 12 months (or $100 if on a free tier).</p>
                <p><strong>Governing Law:</strong> These terms are governed by the laws of India, where Pixenox is based. Exclusive jurisdiction for disputes lies in the courts of Bengaluru, Karnataka. We encourage informal resolution first—please reach out to us at <a href="mailto:connect@pixenox.com">connect@pixenox.com</a>.</p>
              </div>
            </motion.div>

          </div>
        </div>

      </main>
    </div>
  );
}