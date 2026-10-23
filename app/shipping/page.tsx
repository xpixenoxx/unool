'use client';

import Link from 'next/link';
import { motion, useScroll } from 'framer-motion';
import { ArrowLeft, Zap, Shield, Mail, Globe, CheckCircle2 } from 'lucide-react';
import { useRef } from 'react';

export default function ShippingPolicyPage() {
  const containerRef = useRef(null);
  useScroll({ target: containerRef, offset: ["start start", "end end"] });

  const sections = [
    {
      id: 'digital',
      icon: Zap,
      title: 'Digital SaaS Delivery — Instant Access',
      content: 'Unool is an entirely cloud-hosted Software-as-a-Service (SaaS) platform owned and operated by Pixenox Solutions. We do not sell or ship physical merchandise. All services, account upgrades, and premium features are delivered digitally and instantly upon successful payment verification.'
    },
    {
      id: 'timeline',
      icon: CheckCircle2,
      title: 'Delivery Timelines',
      content: 'Access to your upgraded Unool Pro features (such as increased monthly posts, connected social profiles, customized themes, and advanced analytics) takes effect immediately—typically within 5 to 30 seconds of completing payment through Cashfree.'
    },
    {
      id: 'confirmation',
      icon: Mail,
      title: 'Electronic Receipts & Invoices',
      content: 'An electronic confirmation and formal tax invoice receipt containing your payment ID, plan details, and subscription terms will be sent automatically to your registered account email address immediately upon transaction success.'
    },
    {
      id: 'charges',
      icon: Shield,
      title: 'Zero Shipping or Handling Charges',
      content: 'Because all products and services provided on Unool are purely electronic and hosted in the cloud, there are zero shipping fees, postal charges, or handling costs associated with any transaction on our platform.'
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
            Operated by <span className="text-white/80 font-medium">Pixenox Solutions</span>
          </div>
        </div>
      </nav>

      <main className="pt-40 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
        {/* Left Column: Hero */}
        <div className="lg:col-span-5 lg:sticky lg:top-40 h-fit">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-[#D4B896] mb-4">
              Pixenox Solutions • Fulfillment Policy
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter leading-[1.1] mb-6">
              Shipping &amp; <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C84B31] to-[#8C2A25]">
                Delivery.
              </span>
            </h1>
            <p className="text-xl text-white/50 font-medium leading-relaxed max-w-md">
              Instantaneous digital fulfillment. How your SaaS service access and plan features are activated.
            </p>
            <div className="mt-8 p-4 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white/60">
              <p className="font-semibold text-white/90 mb-1">Entity Information</p>
              <p>Pixenox Solutions (<a href="https://www.pixenox.com" target="_blank" rel="noopener noreferrer" className="text-[#C84B31] hover:underline">www.pixenox.com</a>)</p>
              <p className="mt-2 text-xs text-white/40">Product: Unool (https://unool.co)</p>
            </div>
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

            {/* Assistance Section */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="pt-12 border-t border-white/10"
            >
              <div className="flex items-center gap-3 mb-6">
                <Globe className="w-6 h-6 text-[#C84B31]" />
                <h3 className="text-xl font-bold text-white/90">Delivery Assistance &amp; Troubleshooting</h3>
              </div>
              <div className="prose prose-invert prose-p:text-white/50 prose-p:leading-relaxed prose-a:text-[#C84B31] prose-a:no-underline hover:prose-a:underline max-w-none font-medium space-y-4">
                <p>
                  If you have completed a payment but your workspace has not updated automatically within 5 minutes, please refresh your session or contact our customer support desk:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-white/60">
                  <li>Email: <a href="mailto:connect@pixenox.com" className="font-semibold text-[#C84B31]">connect@pixenox.com</a> or <a href="mailto:support@unool.co" className="font-semibold text-[#C84B31]">support@unool.co</a></li>
                  <li>Include your registered email address and the Cashfree payment transaction reference</li>
                  <li>Our operational team will manually provision your plan within 2 business hours</li>
                </ul>
                <p className="text-sm text-white/40 pt-4 border-t border-white/5">
                  Legal Business Name: Pixenox Solutions • Main Portal: <a href="https://www.pixenox.com" target="_blank" rel="noopener noreferrer">www.pixenox.com</a> • Headquartered in Bengaluru, Karnataka, India.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
