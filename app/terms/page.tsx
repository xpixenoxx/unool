'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Mail, Globe, Shield, Clock, User, Lock } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <FileText className="mx-auto h-12 w-12 text-primary mb-4" />
          <h1 className="text-4xl sm:text-5xl font-bold">Terms of Service</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Last updated: July 2025
          </p>
        </div>

        <div className="space-y-8">
          {/* 1. Acceptance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                1. Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                By accessing or using Unool (<strong>unool.vercel.app</strong> and associated services), you agree to these Terms.
                If you disagree, do not use the service.
              </p>
              <p>
                We may update these Terms. Material changes will be posted with a new &ldquo;Last updated&rdquo; date. Continued use constitutes acceptance.
              </p>
            </CardContent>
          </Card>

          {/* 2. Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                2. Service Description
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Unool is a professional profile and social publishing platform providing:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>One Link:</strong> A public profile page at <code>yourname.unool.co</code></li>
                <li><strong>One Click:</strong> Write once, AI adapts for LinkedIn, X, Threads; review and publish</li>
                <li><strong>Sync:</strong> Real-time webhook integration for engagement data</li>
              </ul>
              <p>Features may change. Free tier has monthly post limits; paid tiers unlock higher limits.</p>
            </CardContent>
          </Card>

          {/* 3. Accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                3. Accounts & Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc list-inside space-y-2">
                <li>No passwords — we use <strong>magic link email authentication</strong> via Supabase</li>
                <li>You must provide a valid email and maintain access to it</li>
                <li>One account per person; no shared or automated accounts</li>
                <li>You are responsible for all activity under your account</li>
                <li>We may suspend/terminate accounts for violations</li>
              </ul>
            </CardContent>
          </Card>

          {/* 4. Subscriptions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                4. Subscriptions & Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Free tier:</strong> Limited posts/month, basic profile features</li>
                <li><strong>Pro/Enterprise:</strong> Higher limits, advanced features, priority support</li>
                <li>Billed monthly or annually; auto-renews unless cancelled</li>
                <li>Refunds at our discretion (email <code>connect@pixenox.com</code> within 7 days)</li>
                <li>Price changes: 30 days notice for existing subscribers</li>
              </ul>
            </CardContent>
          </Card>

          {/* 5. User Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                5. Your Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>You retain ownership of content you create/post. By using Unool, you grant us a <strong>non-exclusive, worldwide, royalty-free license</strong> to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Host, store, and display your profile and posts</li>
                <li>Adapt content via AI for platform-specific formats</li>
                <li>Publish to connected platforms (LinkedIn, X, Threads) at your direction</li>
                <li>Sync engagement data via webhooks</li>
              </ul>
              <p>You warrant you have rights to all content. No illegal, infringing, defamatory, spam, or harmful content.</p>
            </CardContent>
          </Card>

          {/* 6. AI Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                6. AI Content Adaptation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc list-inside space-y-2">
                <li>AI (Anthropic/OpenAI) adapts your drafts for each platform&apos;s format/best practices</li>
                <li><strong>You review and approve</strong> before publishing — no auto-publish without consent</li>
                <li>AI may hallucinate; you are responsible for verifying accuracy</li>
                <li>Prompts sent to AI providers contain only your draft content (no account PII)</li>
                <li>Monthly token limits apply per tier</li>
              </ul>
            </CardContent>
          </Card>

          {/* 7. Platform Connections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                7. Social Platform Connections
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc list-inside space-y-2">
                <li>OAuth connections to LinkedIn, X, Threads — we store <strong>encrypted tokens only</strong></li>
                <li>We post <strong>only when you click &ldquo;Publish&rdquo;</strong></li>
                <li>Platform terms apply to content posted there</li>
                <li>We are not liable for platform actions (suspension, reach limits, API changes)</li>
                <li>Revoke access anytime in Settings</li>
              </ul>
            </CardContent>
          </Card>

          {/* 8. Acceptable Use */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                8. Acceptable Use
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>You will not:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Violate laws or platform terms</li>
                <li>Spam, scrape, automate beyond provided features</li>
                <li>Impersonate others or misrepresent affiliation</li>
                <li>Post illegal, hateful, harassing, or misleading content</li>
                <li>Attempt to reverse-engineer or extract our AI prompts</li>
                <li>Overload our systems (rate limits enforced)</li>
              </ul>
            </CardContent>
          </Card>

          {/* 9. Intellectual Property */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                9. Our Intellectual Property
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Unool name, logo, UI, code, and proprietary AI prompts are our property. No license granted except as needed to use the service.</p>
            </CardContent>
          </Card>

          {/* 10. Disclaimers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                10. Disclaimers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p><strong>SERVICE PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTIES OF ANY KIND.</strong></p>
              <ul className="list-disc list-inside space-y-2">
                <li>No guarantee of uptime, uninterrupted access, or platform API availability</li>
                <li>AI output not guaranteed accurate, complete, or compliant</li>
                <li>Third-party platform changes may break features without notice</li>
                <li>Not liable for lost opportunities, engagement drops, or profile views</li>
              </ul>
            </CardContent>
          </Card>

          {/* 11. Limitation of Liability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                11. Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>To the maximum extent permitted by law:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Unool and affiliates not liable for indirect, incidental, special, consequential, or punitive damages</li>
                <li>Total liability limited to fees paid in preceding 12 months (or $100 if free tier)</li>
                <li>Does not apply where prohibited by law (e.g., gross negligence, fraud)</li>
              </ul>
            </CardContent>
          </Card>

          {/* 12. Indemnification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                12. Indemnification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>You agree to indemnify and hold Unool harmless from claims arising from your content, platform connections, or terms violation.</p>
            </CardContent>
          </Card>

          {/* 13. Termination */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                13. Termination
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc list-inside space-y-2">
                <li>You may cancel anytime in Settings → Danger Zone</li>
                <li>We may suspend/terminate for violations with notice (immediate for egregious cases)</li>
                <li>On termination: license ends, data deleted per Privacy Policy, no refunds for partial periods</li>
              </ul>
            </CardContent>
          </Card>

          {/* 14. Governing Law */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                14. Governing Law & Disputes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc list-inside space-y-2">
                <li>Governed by laws of India (where Pixenox is based)</li>
                <li>Exclusive jurisdiction: courts in Bengaluru, Karnataka</li>
                <li>Informal resolution first: email <code>connect@pixenox.com</code></li>
                <li>No class actions; individual arbitration only where permitted</li>
              </ul>
            </CardContent>
          </Card>

          {/* 15. General */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                15. General Provisions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Entire Agreement:</strong> These Terms + Privacy Policy constitute the full agreement</li>
                <li><strong>Severability:</strong> Invalid provisions do not affect the rest</li>
                <li><strong>No Waiver:</strong> Failure to enforce ≠ waiver</li>
                <li><strong>Assignment:</strong> We may assign; you may not</li>
                <li><strong>Force Majeure:</strong> Not liable for events beyond control</li>
              </ul>
            </CardContent>
          </Card>

          {/* 16. Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                16. Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>Questions about these Terms:</p>
              <p><strong>Email:</strong> <a href="mailto:connect@pixenox.com" className="underline">connect@pixenox.com</a></p>
              <p><strong>Entity:</strong> Pixenox (Unool)</p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link> |{' '}
          <Link href="/" className="underline hover:text-foreground">Home</Link>
        </div>
      </main>
    </div>
  );
}