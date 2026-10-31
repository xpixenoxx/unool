'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  Database,
  Share2,
  Eye,
  Cpu,
  Users,
  Clock,
  Trash2,
  Lock,
  ShieldCheck,
  MessageSquare,
  Globe,
  Baby,
  Cookie,
  RefreshCw,
  Headphones,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  const tableOfContents = [
    { id: 'section-1', title: '1. Who We Are & Data Roles' },
    { id: 'section-2', title: '2. What We Collect' },
    { id: 'section-3', title: '3. Platform Data We Access' },
    { id: 'section-4', title: '4. How We Use Data' },
    { id: 'section-5', title: '5. AI Processing & Human Oversight' },
    { id: 'section-6', title: '6. Sub-Processors & Sharing' },
    { id: 'section-7', title: '7. Data Retention Schedule' },
    { id: 'section-8', title: '8. Disconnection & Data Deletion' },
    { id: 'section-9', title: '9. Security & Encryption' },
    { id: 'section-10', title: '10. Your Legal Rights (DPDP & GDPR)' },
    { id: 'section-11', title: '11. Audience & Third-Party Data' },
    { id: 'section-12', title: '12. International Transfers' },
    { id: 'section-13', title: '13. Children’s Privacy' },
    { id: 'section-14', title: '14. Cookies & Tracking' },
    { id: 'section-15', title: '15. Policy Changes & Notice' },
    { id: 'section-16', title: '16. Grievance Officer & Contact' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#EDEDED] font-sans selection:bg-[#C84B31] selection:text-white pb-32">
      {/* Background ambient glow */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#8C2A25] rounded-full mix-blend-screen filter blur-[150px] opacity-20 pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#C84B31] rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none" />

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#C84B31]/50 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
            </div>
            <span className="font-bold tracking-tight">Back to Unool</span>
          </Link>
          <div className="text-xs text-white/50 hidden sm:flex items-center gap-2">
            <span>Operating Entity:</span>
            <span className="text-white font-medium">Pixenox Solutions</span>
          </div>
        </div>
      </nav>

      <main className="pt-36 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        {/* Left Column: Summary & Quick Navigation */}
        <div className="lg:col-span-4 lg:sticky lg:top-28 h-fit space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-[#D4B896] mb-4">
              API &amp; Privacy Compliance
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter leading-[1.1] mb-4">
              Privacy <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C84B31] to-[#8C2A25]">
                Policy.
              </span>
            </h1>
            <p className="text-sm text-white/60 leading-relaxed">
              Effective Date: October 31, 2026. This comprehensive Privacy Policy sets out how Pixenox Solutions collects,
              uses, secures, retains, and deletes personal and connected platform data across Unool.
            </p>

            <div className="mt-6 p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white/70 space-y-2">
              <p className="font-semibold text-white/90">Entity Coordinates</p>
              <p>Pixenox Solutions</p>
              <p className="text-white/50">
                Official Corporate Portal:{' '}
                <a
                  href="https://www.pixenox.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C84B31] hover:underline"
                >
                  www.pixenox.com
                </a>
              </p>
              <p className="text-white/50">Platform: Unool (https://unool.co)</p>
              <p className="text-white/50">Privacy Desk: support@unool.co / connect@pixenox.com</p>
              <p className="text-white/50">Location: Prathipadu, Kakinada District, Andhra Pradesh, India</p>
            </div>

            {/* Quick jump menu */}
            <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5 hidden lg:block">
              <p className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-3">Contents</p>
              <div className="space-y-1.5 text-xs text-white/50 max-h-[380px] overflow-y-auto pr-2">
                {tableOfContents.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block hover:text-[#C84B31] transition-colors truncate"
                  >
                    {item.title}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Full Compliance Sections */}
        <div className="lg:col-span-8 space-y-12">
          {/* Section 1 */}
          <section id="section-1" className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-[#C84B31]" />
              <h2 className="text-xl font-bold text-white/95">1. Who We Are &amp; Data Roles</h2>
            </div>
            <div className="text-sm text-white/70 leading-relaxed space-y-3">
              <p>
                Pixenox Solutions (&ldquo;Pixenox&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;)
                operates the Unool platform (<strong>unool.co</strong> and its related web applications, API endpoints,
                and subdomains). Our primary corporate portal is located at{' '}
                <a
                  href="https://www.pixenox.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C84B31] hover:underline font-medium"
                >
                  www.pixenox.com
                </a>
                , with our registered operational office situated in Prathipadu, Kakinada District, Andhra Pradesh, India.
              </p>
              <p>
                <strong>Data Controller (Data Fiduciary):</strong> For personal data we collect and process to maintain
                your Unool user account, manage subscriptions, process card payments, deliver security logs, and administer
                workspace access, Pixenox Solutions acts as the Data Controller (and Data Fiduciary under the Digital
                Personal Data Protection Act, 2023 of India).
              </p>
              <p>
                <strong>Data Processor:</strong> For audience personal data that you direct us to process on your behalf
                through connected social channels (such as comments, direct message threads, and public mentions on your
                Instagram, Threads, or LinkedIn accounts), you act as the Data Controller, and Pixenox Solutions acts strictly
                as your Data Processor.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="section-2" className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-[#C84B31]" />
              <h2 className="text-xl font-bold text-white/95">2. What We Collect</h2>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              We collect only the personal information strictly necessary to provide, secure, and operate the Unool
              service:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/80">
                    <th className="py-2.5 pr-4 font-semibold">Category</th>
                    <th className="py-2.5 px-4 font-semibold">Examples of Data</th>
                    <th className="py-2.5 pl-4 font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/60">
                  <tr>
                    <td className="py-3 pr-4 font-medium text-white/90">Account Information</td>
                    <td className="py-3 px-4">Name, email address, workspace ID, selected subscription tier, and sign-in credentials (securely salted Argon2id password hash or OAuth provider tokens).</td>
                    <td className="py-3 pl-4">Provided by You</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-white/90">Billing &amp; Invoicing</td>
                    <td className="py-3 px-4">Invoice details, payment reference, and transaction status. Sensitive payment card numbers, CVVs, and banking PINs are handled directly by our PCI-DSS Level 1 compliant gateway partner (Cashfree) and are never stored on our servers.</td>
                    <td className="py-3 pl-4">You &amp; Cashfree</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-white/90">User Content</td>
                    <td className="py-3 px-4">Post drafts, creative copy, media attachments (images, video reels), bio text, link entries, profile theme settings, and knowledge-base documents.</td>
                    <td className="py-3 pl-4">Provided by You</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-white/90">Connected Platform Data</td>
                    <td className="py-3 px-4">Platform user IDs, usernames, profile metadata, OAuth access tokens, comments on your posts, incoming messages, and post performance analytics (detailed in Section 3).</td>
                    <td className="py-3 pl-4">The Platforms (with your explicit consent)</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-white/90">Usage &amp; Diagnostics</td>
                    <td className="py-3 px-4">Timestamped audit logs, IP addresses, browser user-agent, operating system, and in-app section dwell time to deliver active analytics and maintain infrastructure health.</td>
                    <td className="py-3 pl-4">Automatically Collected</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-white/90">Support Communications</td>
                    <td className="py-3 px-4">Inquiries, support tickets, email correspondence, and feedback submitted to our grievance or support desks.</td>
                    <td className="py-3 pl-4">Provided by You</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3 */}
          <section id="section-3" className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Share2 className="w-6 h-6 text-[#C84B31]" />
              <h2 className="text-xl font-bold text-white/95">3. Platform Data We Access</h2>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              We access only data strictly required for the specific features you activate, and only after you grant
              permission on the Platform&apos;s official OAuth consent screen. We do not scrape, harvest, or bypass official APIs.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/80">
                    <th className="py-2.5 pr-2 font-semibold">Platform &amp; Scope</th>
                    <th className="py-2.5 px-3 font-semibold">Data Accessed</th>
                    <th className="py-2.5 px-3 font-semibold">Operational Purpose</th>
                    <th className="py-2.5 pl-2 font-semibold">Retention Period</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/60">
                  <tr>
                    <td className="py-3 pr-2 font-medium text-white/90">
                      <strong>Instagram</strong>
                      <br />
                      <span className="text-[11px] font-mono text-[#D4B896]">instagram_business_basic</span>
                    </td>
                    <td className="py-3 px-3">Instagram account ID, username, profile picture, account category, and media catalogue.</td>
                    <td className="py-3 px-3">Display your connected profile identity and let you select existing media for multi-network composer.</td>
                    <td className="py-3 pl-2">Retained during active connection; deleted upon account disconnect or user deletion request.</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-2 font-medium text-white/90">
                      <strong>Instagram</strong>
                      <br />
                      <span className="text-[11px] font-mono text-[#D4B896]">instagram_business_content_publish</span>
                    </td>
                    <td className="py-3 px-3">Approved post media, captions, container IDs, scheduled departure times, and publishing status.</td>
                    <td className="py-3 px-3">Publish photos, video reels, and carousels you review and approve to your Instagram Professional account.</td>
                    <td className="py-3 pl-2">Retained while account remains active; deleted upon disconnect or deletion request.</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-2 font-medium text-white/90">
                      <strong>Instagram</strong>
                      <br />
                      <span className="text-[11px] font-mono text-[#D4B896]">instagram_business_manage_comments</span>
                    </td>
                    <td className="py-3 px-3">Comments on your published posts, commenter user ID, comment timestamps, and your replies.</td>
                    <td className="py-3 px-3">Display comment threads in your dashboard and publish automated or manual replies you configure.</td>
                    <td className="py-3 pl-2">Retained during active connection; deleted upon disconnect or deletion request.</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-2 font-medium text-white/90">
                      <strong>Instagram</strong>
                      <br />
                      <span className="text-[11px] font-mono text-[#D4B896]">instagram_business_manage_messages</span>
                    </td>
                    <td className="py-3 px-3">Direct message text, participant IDs, timestamps, and your replies.</td>
                    <td className="py-3 px-3">Facilitate DM Concierge responses, comment-to-DM triggers, and approved private replies.</td>
                    <td className="py-3 pl-2">Retained during active connection; deleted upon disconnect or deletion request.</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-2 font-medium text-white/90">
                      <strong>Instagram</strong>
                      <br />
                      <span className="text-[11px] font-mono text-[#D4B896]">instagram_business_manage_insights</span>
                    </td>
                    <td className="py-3 px-3">Aggregated impressions, reach, profile views, and engagement metrics.</td>
                    <td className="py-3 px-3">Populate visual performance charts and engagement analytics in your Unool dashboard.</td>
                    <td className="py-3 pl-2">Maintained within your plan window; purged upon disconnect or deletion request.</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-2 font-medium text-white/90">
                      <strong>Threads</strong>
                      <br />
                      <span className="text-[11px] font-mono text-[#D4B896]">threads_basic, threads_content_publish</span>
                    </td>
                    <td className="py-3 px-3">Threads profile ID, username, approved post drafts, and publish state.</td>
                    <td className="py-3 px-3">Connect your Threads identity and publish scheduled micro-posts approved by you.</td>
                    <td className="py-3 pl-2">Retained during active connection; deleted upon disconnect or deletion request.</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-2 font-medium text-white/90">
                      <strong>LinkedIn (Member)</strong>
                      <br />
                      <span className="text-[11px] font-mono text-[#D4B896]">OpenID, w_member_social</span>
                    </td>
                    <td className="py-3 px-3">Member ID, display name, profile image, verified email (if granted), and approved post content.</td>
                    <td className="py-3 px-3">Authenticate your member account and publish approved posts to your personal LinkedIn profile.</td>
                    <td className="py-3 pl-2">
                      <strong className="text-white/90">Strict LinkedIn limits:</strong> Member social activity data is stored for a maximum of 48 hours; profile data is refreshed or purged within 24 hours.
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-2 font-medium text-white/90">
                      <strong>LinkedIn (Organization)</strong>
                      <br />
                      <span className="text-[11px] font-mono text-[#D4B896]">w_organization_social, r_organization_social</span>
                    </td>
                    <td className="py-3 px-3">Organization Page ID, Page name, published Page posts, and Page engagement statistics.</td>
                    <td className="py-3 px-3">Publish approved updates to your verified LinkedIn Company Page and display Page performance metrics.</td>
                    <td className="py-3 pl-2">Retained strictly within LinkedIn limits; deleted immediately upon account disconnection.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4 */}
          <section id="section-4" className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-[#C84B31]" />
              <h2 className="text-xl font-bold text-white/95">4. How We Use Data &amp; Core Prohibitions</h2>
            </div>
            <div className="text-sm text-white/70 leading-relaxed space-y-3">
              <p>
                We use collected information solely to provide and secure the Unool service: authenticating logins,
                hosting your public portfolio pages at <code>yourname.unool.co</code>, drafting and adapting content across
                network limits, scheduling and publishing posts you explicitly approve, executing comment/DM automations you configure,
                generating analytics, issuing tax invoices, providing customer support, preventing platform abuse, and fulfilling legal duties.
              </p>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                <p className="font-semibold text-white/90">Strict Guarantees &amp; Prohibitions:</p>
                <ul className="list-disc list-inside space-y-1 text-white/60">
                  <li>We <strong>never sell, rent, or monetize</strong> your personal information or connected platform data to third-party data brokers.</li>
                  <li>We <strong>never use Platform data for third-party advertising</strong>, targeted marketing campaigns, or retargeting audiences.</li>
                  <li>We <strong>never use Platform data for surveillance</strong>, tracking across third-party websites, or background checks.</li>
                  <li>We <strong>never use Platform data to determine eligibility</strong> for credit, insurance, employment, or housing.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section id="section-5" className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Cpu className="w-6 h-6 text-[#C84B31]" />
              <h2 className="text-xl font-bold text-white/95">5. AI Processing &amp; Human-in-the-Loop Oversight</h2>
            </div>
            <div className="text-sm text-white/70 leading-relaxed space-y-3">
              <p>
                Unool incorporates artificial intelligence (utilizing enterprise APIs from providers such as Anthropic Claude,
                OpenAI, Google Gemini, and Groq) to assist you with drafting content, generating captions, adapting lengths to
                network constraints, and generating automated comment/DM responses.
              </p>
              <p>
                <strong>No Model Training:</strong> Content you submit for drafting, and the text of comments or messages
                processed for automated replies, is transmitted to AI providers under strict enterprise agreements where customer
                inputs and outputs are <strong>not used to train foundation models</strong> and are not retained beyond transient processing.
              </p>
              <p>
                <strong>LinkedIn Member Data Protection:</strong> In compliance with LinkedIn&apos;s Developer AI Policy, we
                never feed LinkedIn member data or comments from third-party members into AI models, except for content you have
                personally authored.
              </p>
              <p>
                <strong>Human-in-the-Loop Principle:</strong> AI drafts are suggestions. Nothing publishes to any connected social
                platform without your explicit manual review and approval, or your previewed, scheduled flight plan. You retain
                ultimate editorial control and responsibility for all content published from your accounts. Report problematic AI
                output to <a href="mailto:support@unool.co" className="text-[#C84B31] hover:underline">support@unool.co</a>.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section id="section-6" className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-[#C84B31]" />
              <h2 className="text-xl font-bold text-white/95">6. Sub-Processors &amp; Data Sharing</h2>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              Third-party social platforms receive only the media and messages you explicitly schedule or publish.
              We engage vetted infrastructure and technical sub-processors bound by written confidentiality and data protection agreements:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/80">
                    <th className="py-2.5 pr-4 font-semibold">Sub-Processor</th>
                    <th className="py-2.5 px-4 font-semibold">Service Purpose</th>
                    <th className="py-2.5 pl-4 font-semibold">Hosting Region</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/60">
                  <tr>
                    <td className="py-2.5 pr-4 font-medium text-white/90">Cashfree Payments</td>
                    <td className="py-2.5 px-4">Payment gateway processing, recurring subscription billing, and tax invoice generation.</td>
                    <td className="py-2.5 pl-4">India</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-medium text-white/90">Supabase / PostgreSQL</td>
                    <td className="py-2.5 px-4">Cloud database storage, row-level security (RLS), and authentication services.</td>
                    <td className="py-2.5 pl-4">AWS (Singapore / India)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-medium text-white/90">Upstash</td>
                    <td className="py-2.5 px-4">Serverless Redis for low-latency session caching and API rate-limit enforcement.</td>
                    <td className="py-2.5 pl-4">Global Edge</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-medium text-white/90">Cloudflare &amp; QStash</td>
                    <td className="py-2.5 px-4">Edge DNS, web application firewall (WAF), and scheduled background queue execution.</td>
                    <td className="py-2.5 pl-4">Global Edge</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-medium text-white/90">AI Model Providers (Anthropic, OpenAI, Google, Groq)</td>
                    <td className="py-2.5 px-4">Content drafting, idea generation, and format adaptation via zero-retention enterprise APIs.</td>
                    <td className="py-2.5 pl-4">United States / Global</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-medium text-white/90">Resend</td>
                    <td className="py-2.5 px-4">Transactional email delivery, login OTP codes, and critical security notifications.</td>
                    <td className="py-2.5 pl-4">United States</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-white/50 leading-relaxed pt-2">
              We may also disclose data if required by a valid statutory order from a competent legal or regulatory authority.
              We strictly exclude LinkedIn member data from any outward webhook or third-party Zapier triggers.
            </p>
          </section>

          {/* Section 7 */}
          <section id="section-7" className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-[#C84B31]" />
              <h2 className="text-xl font-bold text-white/95">7. Data Retention Schedule</h2>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              We retain personal and platform data only for as long as necessary to provide our services and satisfy legal duties.
              When data expires, it is permanently purged from active databases rather than merely hidden:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-white/80">
                    <th className="py-2.5 pr-4 font-semibold">Data Category</th>
                    <th className="py-2.5 pl-4 font-semibold">Retention &amp; Purge Schedule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/60">
                  <tr>
                    <td className="py-3 pr-4 font-medium text-white/90">User Account &amp; Workspace Data</td>
                    <td className="py-3 pl-4">Retained while your account remains active. Upon closure, all profile assets, drafts, and settings are permanently deleted within 30 days.</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-white/90">Instagram &amp; Threads Platform Data</td>
                    <td className="py-3 pl-4">Retained during active connection. Deleted within 24 hours of account disconnection, or within 30 days upon receipt of a Meta Data Deletion callback.</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-white/90">LinkedIn Member Data</td>
                    <td className="py-3 pl-4">Strictly compliant with LinkedIn Data Storage Requirements: member social activity data is purged within 48 hours; member profile data is refreshed or deleted within 24 hours.</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-white/90">Published Analytics &amp; Performance Logs</td>
                    <td className="py-3 pl-4">Retained only for your plan&apos;s active window (e.g., 30 to 90 days). Out-of-window metrics are permanently purged by scheduled cleanup tasks.</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-white/90">Tax &amp; Financial Invoices</td>
                    <td className="py-3 pl-4">Retained for 7 years as mandated under Indian statutory financial and taxation compliance requirements.</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-white/90">Encrypted System Backups</td>
                    <td className="py-3 pl-4">Encrypted disaster-recovery snapshots are overwritten and purged on a continuous rolling 30-day retention cycle.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 8 */}
          <section id="section-8" className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Trash2 className="w-6 h-6 text-[#C84B31]" />
              <h2 className="text-xl font-bold text-white/95">8. Account Disconnection &amp; Data Deletion Procedure</h2>
            </div>
            <div className="text-sm text-white/70 leading-relaxed space-y-3">
              <p>
                We provide accessible and transparent mechanisms for you to disconnect social channels and permanently delete your data:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                  <h4 className="font-semibold text-white/90 text-xs uppercase tracking-wider">In-App Disconnection</h4>
                  <p className="text-xs text-white/60">
                    Navigate to <strong>Dashboard &gt; Settings &gt; Connected Platforms</strong> and click <strong>Disconnect</strong> next to any account.
                    Access tokens are instantly revoked, and platform data is purged from our systems.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                  <h4 className="font-semibold text-white/90 text-xs uppercase tracking-wider">Platform-Side Revocation</h4>
                  <p className="text-xs text-white/60">
                    You can revoke access directly in Meta settings (Instagram &gt; Settings &gt; Apps and Websites) or LinkedIn (Settings &gt; Data Privacy &gt; Permitted Services).
                    Doing so automatically invalidates our tokens.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#8C2A25]/10 border border-[#C84B31]/30 space-y-2 mt-2">
                <h4 className="font-semibold text-[#D4B896] text-xs uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#C84B31]" />
                  Meta User Data Deletion Callback &amp; Verification
                </h4>
                <p className="text-xs text-white/70 leading-relaxed">
                  When you remove Unool from your Meta settings, Meta transmits an automated server-to-server deletion callback request to our registered endpoint.
                  Upon receipt, we immediately schedule all associated Instagram and Threads records for deletion, complete the purge within 30 days, and generate a
                  unique confirmation code. Users can track data deletion status at any time by contacting our Privacy Desk with their confirmation code or handle.
                </p>
              </div>

              <p className="text-xs text-white/60">
                <strong>Complete Workspace Deletion:</strong> You can permanently delete your entire account and all associated workspace data at any time via{' '}
                <strong>Settings &gt; Delete Account</strong>, or by emailing{' '}
                <a href="mailto:support@unool.co" className="text-[#C84B31] hover:underline">support@unool.co</a> or{' '}
                <a href="mailto:connect@pixenox.com" className="text-[#C84B31] hover:underline">connect@pixenox.com</a> with the subject line <em>&ldquo;Data Deletion Request&rdquo;</em> from your registered address.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section id="section-9" className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-[#C84B31]" />
              <h2 className="text-xl font-bold text-white/95">9. Data Security &amp; Technical Safeguards</h2>
            </div>
            <div className="text-sm text-white/70 leading-relaxed space-y-3">
              <p>
                We implement defense-in-depth technical and organizational controls to safeguard personal data and platform tokens:
              </p>
              <ul className="list-disc list-inside space-y-2 text-xs text-white/60">
                <li><strong>Encryption in Transit:</strong> All communication between user browsers, Unool application servers, and external APIs is strictly enforced via Transport Layer Security (TLS 1.3).</li>
                <li><strong>Encryption at Rest:</strong> Database records and sensitive OAuth tokens are encrypted at rest using AES-256-GCM symmetric authenticated encryption.</li>
                <li><strong>Access Governance:</strong> Production environment access is strictly restricted to designated engineering personnel via multi-factor authentication (MFA) and least-privilege role-based access controls.</li>
                <li><strong>Breach Notification Commitment:</strong> In the event of a verified security incident affecting personal data, Pixenox Solutions will notify impacted users and statutory authorities promptly in accordance with applicable laws.</li>
              </ul>
              <p className="text-xs text-white/50">
                Security vulnerability disclosures may be submitted directly to <a href="mailto:connect@pixenox.com" className="text-[#C84B31] hover:underline">connect@pixenox.com</a>.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section id="section-10" className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#C84B31]" />
              <h2 className="text-xl font-bold text-white/95">10. Your Legal Rights (DPDP &amp; GDPR)</h2>
            </div>
            <div className="text-sm text-white/70 leading-relaxed space-y-3">
              <p>
                Under the Digital Personal Data Protection Act, 2023 (DPDP) of India and international privacy regulations (such as the GDPR for European users), you are entitled to the following rights:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <p className="font-semibold text-white/90">Right to Access &amp; Portability</p>
                  <p className="text-white/50">Obtain confirmation of data being processed and a machine-readable export of your personal information.</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <p className="font-semibold text-white/90">Right to Correction &amp; Erasure</p>
                  <p className="text-white/50">Request correction of inaccurate information, completion of incomplete records, or permanent erasure of personal data.</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <p className="font-semibold text-white/90">Right to Withdraw Consent</p>
                  <p className="text-white/50">Revoke consent for ongoing platform integrations or processing operations at any time without punitive measures.</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <p className="font-semibold text-white/90">Right to Nominate (DPDP)</p>
                  <p className="text-white/50">Nominate another individual to exercise data rights on your behalf in the event of death or incapacity.</p>
                </div>
              </div>
              <p className="text-xs text-white/60 pt-2">
                To exercise any of these rights, email our Grievance Officer at{' '}
                <a href="mailto:connect@pixenox.com" className="text-[#C84B31] hover:underline">connect@pixenox.com</a> or{' '}
                <a href="mailto:support@unool.co" className="text-[#C84B31] hover:underline">support@unool.co</a>. We formally acknowledge requests within 48 hours and resolve them within 15 working days.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section id="section-11" className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-[#C84B31]" />
              <h2 className="text-xl font-bold text-white/95">11. Audience &amp; Third-Party Personal Data</h2>
            </div>
            <div className="text-sm text-white/70 leading-relaxed space-y-3">
              <p>
                If you interact with social media accounts operated by our customers (for instance, by commenting on a customer&apos;s
                Instagram post or sending a direct message), the customer is the Data Controller responsible for that information,
                and Pixenox Solutions processes the data solely on the customer&apos;s instructions to facilitate comment moderation,
                inbox management, or automated concierge replies.
              </p>
              <p>
                <strong>Audience Opt-Out &amp; Deletion:</strong> Any individual who wishes to stop receiving automated messages
                can reply with the keyword <strong>&ldquo;STOP&rdquo;</strong> directly in the message thread, contact the account
                owner directly, or email <a href="mailto:support@unool.co" className="text-[#C84B31] hover:underline">support@unool.co</a> to request removal.
              </p>
            </div>
          </section>

          {/* Section 12 */}
          <section id="section-12" className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-[#C84B31]" />
              <h2 className="text-xl font-bold text-white/95">12. International Data Transfers</h2>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              Our core infrastructure is hosted in secure tier-3 data centers. When personal data is processed across borders by
              authorized technical sub-processors (such as our database hosting or enterprise AI endpoints), transfers are governed
              by standard contractual clauses and rigorous technical encryption safeguards satisfying both India&apos;s DPDP Act standards
              and GDPR cross-border transfer requirements.
            </p>
          </section>

          {/* Section 13 */}
          <section id="section-13" className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Baby className="w-6 h-6 text-[#C84B31]" />
              <h2 className="text-xl font-bold text-white/95">13. Children&apos;s Privacy</h2>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              Unool is strictly intended for individuals who are at least 18 years of age (or the legal age of majority in their jurisdiction).
              We do not knowingly collect, solicit, or process personal information from children under the age of 18. If we discover that personal
              data from a minor has been collected without parental consent, we will take immediate steps to permanently delete that information.
            </p>
          </section>

          {/* Section 14 */}
          <section id="section-14" className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Cookie className="w-6 h-6 text-[#C84B31]" />
              <h2 className="text-xl font-bold text-white/95">14. Cookies &amp; Tracking Notice</h2>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              We employ strictly necessary first-party cookies and local storage tokens solely to maintain secure authentication sessions,
              prevent cross-site request forgery (CSRF), and remember your workspace theme preferences. We do not use third-party behavioral
              advertising cookies or sell browsing tracking data to advertising networks.
            </p>
          </section>

          {/* Section 15 */}
          <section id="section-15" className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-6 h-6 text-[#C84B31]" />
              <h2 className="text-xl font-bold text-white/95">15. Changes to This Privacy Policy</h2>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              We may update this Privacy Policy periodically to reflect evolving legal requirements or platform features. When changes are made,
              we will revise the &ldquo;Effective Date&rdquo; at the top of this policy. For material changes affecting your rights or how platform
              data is processed, we will provide registered workspace administrators with advance notice via email or an in-app notice at least 15 days prior to implementation.
            </p>
          </section>

          {/* Section 16 */}
          <section id="section-16" className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Headphones className="w-6 h-6 text-[#C84B31]" />
              <h2 className="text-xl font-bold text-white/95">16. Contact &amp; Grievance Officer</h2>
            </div>
            <div className="text-sm text-white/70 leading-relaxed space-y-3">
              <p>
                In accordance with the Information Technology Act, 2000, the Consumer Protection (E-Commerce) Rules, 2020, and the Digital Personal Data Protection Act, 2023, our appointed Data Protection and Grievance Officer details are:
              </p>
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-white/80 space-y-2">
                <p><strong>Operating Entity:</strong> Pixenox Solutions</p>
                <p><strong>Designation:</strong> Data Protection &amp; Grievance Officer</p>
                <p>
                  <strong>Email:</strong>{' '}
                  <a href="mailto:connect@pixenox.com" className="text-[#C84B31] hover:underline font-medium">
                    connect@pixenox.com
                  </a>{' '}
                  (Attn: Grievance Officer) |{' '}
                  <a href="mailto:support@unool.co" className="text-[#C84B31] hover:underline font-medium">
                    support@unool.co
                  </a>
                </p>
                <p><strong>Corporate Portal:</strong> <a href="https://www.pixenox.com" target="_blank" rel="noopener noreferrer" className="text-[#C84B31] hover:underline">www.pixenox.com</a></p>
                <p><strong>Operational Address:</strong> Prathipadu, Kakinada District, Andhra Pradesh, India</p>
                <p><strong>Response SLA:</strong> Acknowledgment within 48 hours; resolution within 15 working days.</p>
              </div>
            </div>
          </section>

          {/* Footer certification badge */}
          <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#C84B31]" />
              <span>Unool operates under the strict developer guidelines of Meta and LinkedIn.</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
