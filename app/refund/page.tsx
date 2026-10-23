'use client';

import Link from 'next/link';
import { motion, useScroll } from 'framer-motion';
import { ArrowLeft, RotateCcw, ShieldCheck, Clock, CreditCard, HelpCircle } from 'lucide-react';
import { useRef } from 'react';

export default function RefundPolicyPage() {
  const containerRef = useRef(null);
  useScroll({ target: containerRef, offset: ["start start", "end end"] });

  const sections = [
    {
      id: 'cancellation',
      icon: RotateCcw,
      title: 'Subscription Cancellation',
      content: 'You can cancel your Unool paid subscription at any time directly through your account settings or by emailing our team. When you cancel, your subscription remains active until the end of the current billing cycle. You will not be charged again.'
    },
    {
      id: 'guarantee',
      icon: ShieldCheck,
      title: '7-Day Satisfaction Guarantee',
      content: 'We stand behind Unool. If you subscribe to a paid plan and feel it does not meet your personal branding or publishing needs, you are eligible for a 100% full refund within 7 calendar days of your initial purchase.'
    },
    {
      id: 'timeline',
      icon: Clock,
      title: 'Refund Processing & Timelines',
      content: 'Once approved, refunds are initiated within 24 to 48 business hours via our authorized payment partner (Cashfree). The refunded amount will be credited back to your original payment method (UPI, Debit/Credit Card, Net Banking) within 5 to 7 business days, per standard banking norms.'
    },
    {
      id: 'renewals',
      icon: CreditCard,
      title: 'Renewal & Accidental Charges',
      content: 'If your subscription automatically renewed and you did not intend to continue, notify us within 48 hours of the charge without publishing or scheduling new posts, and our support desk will issue a full refund promptly.'
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
            Operated by <span className="text-white/80 font-medium">Pixenox Solutions</span>
          </div>
        </div>
      </nav>

      <main className="pt-40 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
        {/* Left Column: Hero */}
        <div className="lg:col-span-5 lg:sticky lg:top-40 h-fit">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-[#D4B896] mb-4">
              Pixenox Solutions • Policy Document
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter leading-[1.1] mb-6">
              Refund &amp; <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C84B31] to-[#8C2A25]">
                Cancellation.
              </span>
            </h1>
            <p className="text-xl text-white/50 font-medium leading-relaxed max-w-md">
              Fair, transparent, and hassle-free. We believe in building trust through clear commitments.
            </p>
            <div className="mt-8 p-4 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-white/60">
              <p className="font-semibold text-white/90 mb-1">Parent Company</p>
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

            {/* How to Request */}
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="pt-12 border-t border-white/10"
            >
              <div className="flex items-center gap-3 mb-6">
                <HelpCircle className="w-6 h-6 text-[#C84B31]" />
                <h3 className="text-xl font-bold text-white/90">How to Request a Refund or Cancellation</h3>
              </div>
              <div className="prose prose-invert prose-p:text-white/50 prose-p:leading-relaxed prose-a:text-[#C84B31] prose-a:no-underline hover:prose-a:underline max-w-none font-medium space-y-4">
                <p>
                  To request a refund or raise a billing concern, please email our billing desk at{' '}
                  <a href="mailto:connect@pixenox.com" className="font-semibold text-[#C84B31]">connect@pixenox.com</a>{' '}
                  or <a href="mailto:support@unool.co" className="font-semibold text-[#C84B31]">support@unool.co</a> with:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-white/60">
                  <li>Your registered account email address on Unool</li>
                  <li>Order ID / Payment reference number from your Cashfree receipt</li>
                  <li>Brief reason for cancellation or refund request</li>
                </ul>
                <p>
                  <strong>Resolution Timeframe:</strong> Our billing team will review and respond within 24 to 48 business hours. Approved refunds are credited directly back to the original source account via Cashfree within 5 to 7 business days.
                </p>
                <p className="text-sm text-white/40 pt-4 border-t border-white/5">
                  Legal Entity: Pixenox Solutions • Main Website: <a href="https://www.pixenox.com" target="_blank" rel="noopener noreferrer">www.pixenox.com</a> • Governing Jurisdiction: Courts in Prathipadu, Kakinada District, Andhra Pradesh, India.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
