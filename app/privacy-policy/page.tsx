'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Shield, ArrowLeft, Mail, Database, Lock, Eye, CheckCircle2 } from 'lucide-react';
import { useRef } from 'react';

const C = {
  oxblood: '#3A0B1A',
  terracotta: '#8C2A25',
  clay: '#C84B31',
  sand: '#D4B896',
};

export default function PrivacyPolicyPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const opacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

  const sections = [
    { id: 'data', icon: Database, title: 'Data We Collect', content: 'We collect what is strictly necessary. Your email for authentication, profile data for your public page, and OAuth tokens when you explicitly connect platforms like LinkedIn or X.' },
    { id: 'usage', icon: Eye, title: 'How We Use Data', content: 'Your data powers your Unool experience. We authenticate you, host your public profile, and use your approval to publish to connected networks. Our AI features use anonymized prompts—never your PII.' },
    { id: 'security', icon: Lock, title: 'Ironclad Security', content: 'All data is encrypted in transit and at rest. We do not store passwords. OAuth tokens are symmetrically encrypted before entering our databases.' },
    { id: 'rights', icon: CheckCircle2, title: 'Your Digital Rights', content: 'You own your data. You can export it, modify it, or completely erase your account and all associated data with a single click in your settings.' }
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-sans selection:bg-[#C84B31] selection:text-white pb-32">
      {/* Background ambient glow */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#8C2A25] rounded-full mix-blend-screen filter blur-[150px] opacity-20 pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#C84B31] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none" />

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
              <Shield className="w-4 h-4 text-[#C84B31]" />
              Updated July 2026
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter leading-[1.1] mb-6">
              Privacy <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C84B31] to-[#8C2A25]">Policy.</span>
            </h1>
            <p className="text-xl text-white/50 font-medium leading-relaxed max-w-md">
              We believe privacy is a fundamental human right. Our policy is designed to be transparent, human-readable, and fiercely protective of your data.
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
                <p>We do not sell your personal data. We share information only with trusted service providers (like our hosting platform Vercel, or database provider Supabase) who are bound by strict confidentiality agreements. When you use our AI features, prompts sent to providers like Anthropic or OpenAI are stripped of personal identifiers.</p>
                <p>Our servers are located in the United States. By using Unool, you consent to the transfer and processing of your data in the US. We employ standard contractual clauses and rigorous security measures to protect international transfers.</p>
                <p>If you have any questions, concerns, or wish to exercise your data rights (including GDPR or CCPA requests), our Data Protection Officer is ready to help at <a href="mailto:connect@pixenox.com">connect@pixenox.com</a>.</p>
              </div>
            </motion.div>

          </div>
        </div>

      </main>
    </div>
  );
}