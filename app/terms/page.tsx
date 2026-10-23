'use client';

import Link from 'next/link';
import { motion, useScroll } from 'framer-motion';
import { ArrowLeft, FileText, Zap, Shield, PenTool, CreditCard, Scale, Building2 } from 'lucide-react';
import { useRef } from 'react';

export default function TermsOfServicePage() {
  const containerRef = useRef(null);
  useScroll({ target: containerRef, offset: ["start start", "end end"] });

  const sections = [
    {
      id: 'entity',
      icon: Building2,
      title: 'Company & Ownership',
      content: 'Unool (including unool.co and all subdomains) is an online software platform fully owned, operated, and maintained by Pixenox Solutions ("Company", "we", "us", or "our"), with its principal corporate website located at www.pixenox.com. By accessing or using Unool, you enter into a legally binding agreement with Pixenox Solutions.'
    },
    {
      id: 'acceptance',
      icon: FileText,
      title: 'Acceptance of Terms',
      content: 'By creating an account, browsing, or subscribing to Unool, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you are using Unool on behalf of an organization, you represent and warrant that you possess the authority to bind that entity.'
    },
    {
      id: 'service',
      icon: Zap,
      title: 'Description of Service',
      content: 'Unool is a cloud Software-as-a-Service (SaaS) platform providing unified personal branding links, multi-theme public portfolio profiles, and multi-network social content creation, adaptation, and scheduling across supported platforms.'
    },
    {
      id: 'billing',
      icon: CreditCard,
      title: 'Subscriptions & Payments',
      content: 'Paid tiers (including Unool Pro) are billed in advance on a recurring monthly or annual basis via our secure payment partners (such as Cashfree). Prices are displayed in INR and USD. You may cancel your subscription at any time via Account Settings. Cancellations take effect at the conclusion of the current prepaid billing period.'
    },
    {
      id: 'ai',
      icon: PenTool,
      title: 'Content Ownership & Intellectual Property',
      content: 'You retain 100% intellectual property ownership of all content, copy, media, and credentials you upload or publish via Unool. You grant Pixenox Solutions only the limited license necessary to host, process, and transmit your content at your direction. The Unool design system, software, code, and trademarks remain the exclusive property of Pixenox Solutions.'
    },
    {
      id: 'conduct',
      icon: Shield,
      title: 'Acceptable Use Policy',
      content: 'You agree not to use Unool for unlawful activities, defamatory campaigns, distribution of malware, unsolicited spam, impersonation of third parties, or any attempt to reverse-engineer or circumvent security protocols. Violation may result in immediate suspension or termination of your workspace.'
    },
    {
      id: 'governing',
      icon: Scale,
      title: 'Governing Law & Dispute Resolution',
      content: 'These Terms and any non-contractual obligations arising from them are governed exclusively by the laws of India. Any legal action, suit, or proceeding shall be instituted exclusively in the competent courts of Bengaluru, Karnataka, India.'
    }
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
              Pixenox Solutions • Legal Agreement
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter leading-[1.1] mb-6">
              Terms of <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C84B31] to-[#8C2A25]">Service.</span>
            </h1>
            <p className="text-xl text-white/50 font-medium leading-relaxed max-w-md">
              The rules and operating terms governing the Unool platform and your relationship with Pixenox Solutions.
            </p>

            <div className="mt-8 p-4 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white/60">
              <p className="font-semibold text-white/90 mb-1">Corporate Details</p>
              <p>Pixenox Solutions</p>
              <p className="text-xs text-white/40">Official Portal: <a href="https://www.pixenox.com" target="_blank" rel="noopener noreferrer" className="text-[#C84B31] hover:underline">www.pixenox.com</a></p>
              <p className="text-xs text-white/40 mt-1">Platform: Unool (https://unool.co)</p>
              <p className="text-xs text-white/40">Contact: connect@pixenox.com</p>
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

            {/* Detailed Legal Section */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="pt-12 border-t border-white/10 space-y-6"
            >
              <h3 className="text-xl font-bold text-white/80">Additional Terms &amp; Conditions</h3>
              
              <div className="prose prose-invert prose-p:text-white/50 prose-p:leading-relaxed prose-a:text-[#C84B31] prose-a:no-underline hover:prose-a:underline max-w-none text-sm space-y-4">
                <p>
                  <strong>Disclaimer of Warranties:</strong> Unool and all associated software, features, and content are provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express or implied. Pixenox Solutions disclaims all warranties including, without limitation, merchantability, fitness for a particular purpose, and non-infringement.
                </p>
                <p>
                  <strong>Limitation of Liability:</strong> Under no legal theory shall Pixenox Solutions, its directors, employees, or partners be liable for indirect, incidental, punitive, or consequential damages resulting from your use of the platform. Total liability is capped at the total amount paid by you to Pixenox Solutions for Unool during the three (3) months preceding the event giving rise to liability.
                </p>
                <p>
                  <strong>Taxes &amp; Compliance:</strong> Subscription fees are exclusive of applicable Goods and Services Tax (GST) or relevant local indirect taxes, which will be charged in accordance with prevailing Indian statutory regulations. Tax invoices are electronically generated and issued upon transaction settlement.
                </p>
                <p>
                  <strong>Contact &amp; Notices:</strong> Legal notices and communications should be addressed to:
                  <br />
                  <strong>Pixenox Solutions</strong>
                  <br />
                  Attn: Legal &amp; Compliance Department
                  <br />
                  Email: <a href="mailto:connect@pixenox.com">connect@pixenox.com</a> | <a href="mailto:support@unool.co">support@unool.co</a>
                  <br />
                  Corporate Portal: <a href="https://www.pixenox.com" target="_blank" rel="noopener noreferrer">www.pixenox.com</a>
                  <br />
                  Jurisdiction: Bengaluru, Karnataka, India
                </p>
              </div>
            </motion.div>

          </div>
        </div>

      </main>
    </div>
  );
}