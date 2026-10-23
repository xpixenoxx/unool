'use client';

import Link from 'next/link';
import { motion, useScroll } from 'framer-motion';
import { ArrowLeft, Database, Lock, Eye, CheckCircle2, ShieldCheck, Building2 } from 'lucide-react';
import { useRef } from 'react';

export default function PrivacyPolicyPage() {
  const containerRef = useRef(null);
  useScroll({ target: containerRef, offset: ["start start", "end end"] });

  const sections = [
    {
      id: 'entity',
      icon: Building2,
      title: 'Data Controller & Entity',
      content: 'This Privacy Policy is issued by Pixenox Solutions ("Company", "we", "us", or "our"), the legal entity owning and operating the Unool web platform (unool.co) with its primary corporate portal at www.pixenox.com. We serve as the Data Controller responsible for personal information processed under this policy.'
    },
    {
      id: 'data',
      icon: Database,
      title: 'Information We Collect',
      content: 'We collect information you provide directly: your name, email address, workspace identifiers, and connected social network credentials via secure OAuth. For payment transactions, payment details are collected and processed directly by our PCI-DSS Level 1 compliant gateway partner (Cashfree). We do not store sensitive credit card numbers or banking PINs on our servers.'
    },
    {
      id: 'usage',
      icon: Eye,
      title: 'How We Utilize Your Data',
      content: 'We use your data solely to deliver the Unool service: authenticating your login, hosting your public profile pages, scheduling your approved social media posts, and issuing tax invoices. We never sell, rent, or monetize your personal information to third-party data brokers.'
    },
    {
      id: 'security',
      icon: Lock,
      title: 'Data Security & Encryption',
      content: 'All data transmitted between your browser and Unool is encrypted in transit using TLS 1.3. Stored database records and OAuth authentication tokens are symmetrically encrypted at rest with AES-256-GCM encryption standards.'
    },
    {
      id: 'compliance',
      icon: ShieldCheck,
      title: 'Statutory Compliance',
      content: 'Our data protection practices adhere to the Information Technology Act, 2000, the Digital Personal Data Protection Act (DPDP Act, 2023) of India, and internationally recognized privacy principles (including GDPR standards for global users).'
    },
    {
      id: 'rights',
      icon: CheckCircle2,
      title: 'Your Data Subject Rights',
      content: 'You have full autonomy over your data. You may request a complete export of your personal information, update your profile details, or permanently delete your account and all associated workspace data at any time via Account Settings.'
    }
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
          <div className="text-xs text-white/40 hidden sm:block">
            Legal Entity: <span className="text-white/80 font-medium">Pixenox Solutions</span>
          </div>
        </div>
      </nav>

      <main className="pt-40 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
        
        {/* Left Column: Hero & Index */}
        <div className="lg:col-span-5 lg:sticky lg:top-40 h-fit">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-[#D4B896] mb-4">
              Pixenox Solutions • Privacy Commitment
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter leading-[1.1] mb-6">
              Privacy <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C84B31] to-[#8C2A25]">Policy.</span>
            </h1>
            <p className="text-xl text-white/50 font-medium leading-relaxed max-w-md">
              We treat your data with absolute reverence. Transparent, human-readable, and rigorously secure.
            </p>

            <div className="mt-8 p-4 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white/60">
              <p className="font-semibold text-white/90 mb-1">Corporate Details</p>
              <p>Pixenox Solutions</p>
              <p className="text-xs text-white/40">Official Portal: <a href="https://www.pixenox.com" target="_blank" rel="noopener noreferrer" className="text-[#C84B31] hover:underline">www.pixenox.com</a></p>
              <p className="text-xs text-white/40 mt-1">Platform: Unool (https://unool.co)</p>
              <p className="text-xs text-white/40">Privacy Desk: connect@pixenox.com</p>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Content */}
        <div className="lg:col-span-7">
          <div className="space-y-12 lg:space-y-20">
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
                    <h2 className="text-2xl font-bold mb-3 tracking-tight text-white/90">{section.title}</h2>
                    <p className="text-base text-white/60 leading-relaxed font-medium">
                      {section.content}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Grievance & Contact Section */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="pt-12 border-t border-white/10 space-y-6"
            >
              <h3 className="text-xl font-bold text-white/80">Data Protection Officer &amp; Grievances</h3>
              
              <div className="prose prose-invert prose-p:text-white/50 prose-p:leading-relaxed prose-a:text-[#C84B31] prose-a:no-underline hover:prose-a:underline max-w-none text-sm space-y-3">
                <p>
                  If you have questions regarding this Privacy Policy, wish to exercise your data subject rights, or wish to report a privacy concern, please contact our appointed Grievance Officer:
                </p>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/70 space-y-1">
                  <p><strong>Designation:</strong> Data Protection &amp; Grievance Officer</p>
                  <p><strong>Entity:</strong> Pixenox Solutions</p>
                  <p><strong>Email:</strong> <a href="mailto:connect@pixenox.com" className="text-[#C84B31]">connect@pixenox.com</a> | <a href="mailto:support@unool.co" className="text-[#C84B31]">support@unool.co</a></p>
                  <p><strong>Corporate Portal:</strong> <a href="https://www.pixenox.com" target="_blank" rel="noopener noreferrer">www.pixenox.com</a></p>
                  <p><strong>Location:</strong> Bengaluru, Karnataka, India</p>
                </div>
                <p className="text-xs text-white/40">
                  Last updated: October 2026. This policy may be updated periodically. Notice of material revisions will be published here.
                </p>
              </div>
            </motion.div>

          </div>
        </div>

      </main>
    </div>
  );
}