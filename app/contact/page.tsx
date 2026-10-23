'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, MapPin, Clock, ShieldAlert, Send, CheckCircle2, Globe, Building2 } from 'lucide-react';
import { useState } from 'react';

export default function ContactUsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-sans selection:bg-[#C84B31] selection:text-white pb-32">
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
            Owned &amp; Operated by <span className="text-white/80 font-medium">Pixenox Solutions</span>
          </div>
        </div>
      </nav>

      <main className="pt-40 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
        {/* Left Column: Hero & Company Coordinates */}
        <div className="lg:col-span-5 lg:sticky lg:top-40 h-fit">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-[#D4B896] mb-4">
              Pixenox Solutions • Support Desk
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter leading-[1.1] mb-6">
              Contact <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C84B31] to-[#8C2A25]">
                Pixenox.
              </span>
            </h1>
            <p className="text-xl text-white/50 font-medium leading-relaxed max-w-md">
              Need assistance with your account, payment, or enterprise setup? Our support team is here to help.
            </p>

            {/* Entity Badge */}
            <div className="mt-8 p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-[#C84B31] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white/90">Legal Business Entity</h4>
                  <p className="text-sm text-white/60">Pixenox Solutions</p>
                  <p className="text-xs text-white/40 mt-1">Platform: Unool (https://unool.co)</p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-white/5">
                <Globe className="w-5 h-5 text-[#C84B31] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white/90">Main Corporate Website</h4>
                  <a href="https://www.pixenox.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[#C84B31] hover:underline">
                    www.pixenox.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-white/5">
                <MapPin className="w-5 h-5 text-[#C84B31] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white/90">Operational &amp; Registered Office</h4>
                  <p className="text-sm text-white/60">Bengaluru, Karnataka, 560001, India</p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-white/5">
                <Clock className="w-5 h-5 text-[#C84B31] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white/90">Business Hours</h4>
                  <p className="text-sm text-white/60">Monday – Friday: 9:00 AM – 6:00 PM IST</p>
                  <p className="text-xs text-white/40 mt-0.5">Average ticket response: &lt; 24 hours</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Contact Channels & Form */}
        <div className="lg:col-span-7 space-y-8">
          {/* Quick Direct Channels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#C84B31]/40 transition-colors">
              <Mail className="w-6 h-6 text-[#C84B31] mb-3" />
              <h3 className="font-bold text-white/90 mb-1">Corporate &amp; Billing</h3>
              <p className="text-xs text-white/50 mb-3">For business queries, invoicing, and refunds</p>
              <a href="mailto:connect@pixenox.com" className="text-sm text-[#D4B896] hover:underline font-medium">
                connect@pixenox.com
              </a>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-[#C84B31]/40 transition-colors">
              <Mail className="w-6 h-6 text-[#8C2A25] mb-3" />
              <h3 className="font-bold text-white/90 mb-1">Product Support</h3>
              <p className="text-xs text-white/50 mb-3">For technical, profile, and publishing help</p>
              <a href="mailto:support@unool.co" className="text-sm text-[#D4B896] hover:underline font-medium">
                support@unool.co
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10">
            <h2 className="text-2xl font-bold mb-2">Send us a message</h2>
            <p className="text-sm text-white/50 mb-6">Fill out the form below and we will get back to you within 24 hours.</p>

            {submitted ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Thank you for reaching out!</h3>
                <p className="text-sm text-white/50 max-w-sm mx-auto">
                  Your message has been dispatched to Pixenox Solutions support desk. We will respond to {form.email || 'your email'} shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#C84B31]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/60 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#C84B31]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Billing / Account Query / Business Collaboration"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#C84B31]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/60 mb-1">Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="How can we assist you today?"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#C84B31]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-[#C84B31] to-[#8C2A25] text-white font-semibold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* Grievance Redressal Card (RBI & IT Act Requirement) */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <ShieldAlert className="w-5 h-5 text-[#D4B896]" />
              <h3 className="font-bold text-white/90">Grievance Redressal Mechanism</h3>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              In accordance with the Information Technology Act, 2000 and the Consumer Protection (E-Commerce) Rules, 2020, if you have any unaddressed complaint or dispute, you may contact our appointed Grievance Officer:
            </p>
            <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-white/70 space-y-1">
              <p><strong>Designation:</strong> Grievance Redressal Officer, Pixenox Solutions</p>
              <p><strong>Email:</strong> <a href="mailto:connect@pixenox.com" className="text-[#C84B31]">connect@pixenox.com</a> (Attn: Grievance Officer)</p>
              <p><strong>Response SLA:</strong> Acknowledgment within 48 hours; resolution within 15 working days.</p>
              <p><strong>Jurisdiction:</strong> Bengaluru, Karnataka, India.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
