import { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, FileText, Database, Globe, Lock, Mail, Eye, User } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | Unool',
  description: 'Privacy Policy for Unool - How we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  const lastUpdated = 'July 18, 2026';
  const effectiveDate = 'July 18, 2026';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">Unool</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated} | Effective: {effectiveDate}
          </p>
        </div>

        <div className="space-y-8">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                1. Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Unool (&ldquo;we,&rdquo; &ldquo;our,&rdquo; &ldquo;us&rdquo;) respects your privacy. This Policy explains what personal data we collect, how we use it, and your rights.
              </p>
              <p>
                By using Unool, you agree to this Policy. Contact us at <strong>connect@pixenox.com</strong> with questions.
              </p>
            </CardContent>
          </Card>

          {/* Data We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                2. Data We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p><strong>Account Data:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Email address (for magic link authentication)</li>
                <li>Name, headline, bio, role, company (profile data you provide)</li>
                <li>Subdomain choice for your public profile</li>
              </ul>

              <p><strong>Usage Data:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Posts you create, schedule, and publish</li>
                <li>Platform connections (OAuth tokens for LinkedIn, X, Threads)</li>
                <li>Profile views, link clicks, engagement metrics</li>
                <li>AI token usage for content adaptation</li>
              </ul>

              <p><strong>Technical Data:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>IP address, browser type, device info</li>
                <li>Access logs, error reports</li>
                <li>Referrers, timestamps</li>
              </ul>

              <p><strong>Third-Party Data (via OAuth):</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Profile info from LinkedIn, X, Threads when you connect accounts</li>
                <li>We only request permissions needed for publishing</li>
              </ul>
            </CardContent>
          </Card>

          {/* How We Use Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                3. How We Use Your Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc list-inside space-y-3">
                <li><strong>Provide the Service:</strong> Authenticate you, host your profile, publish your content</li>
                <li><strong>AI Content Adaptation:</strong> Transform your posts for LinkedIn, X, Threads (with your approval)</li>
                <li><strong>Analytics:</strong> Show you profile views, link clicks, post performance</li>
                <li><strong>Platform Publishing:</strong> Use OAuth tokens to post to connected platforms on your behalf</li>
                <li><strong>Improve Service:</strong> Analyze usage patterns (aggregated, anonymized)</li>
                <li><strong>Communications:</strong> Send magic links, security alerts, feature updates</li>
                <li><strong>Legal/Compliance:</strong> Comply with laws, enforce Terms, detect fraud</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                4. Data Sharing & Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>We do not sell your data. We share only in these cases:</p>
              <ul className="list-disc list-inside space-y-3">
                <li><strong>Platform Publishing:</strong> Content you approve is sent to LinkedIn, X, Threads via their APIs</li>
                <li><strong>AI Providers:</strong> Anonymized prompts sent to Anthropic/OpenAI for content adaptation (no PII in prompts)</li>
                <li><strong>Service Providers:</strong> Vercel (hosting), Supabase (database/auth), Upstash (rate limiting/queue), Resend (email)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect rights/safety</li>
                <li><strong>Business Transfer:</strong> In a merger/acquisition, with notice and continued privacy protection</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                5. Data Retention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc list-inside space-y-2">
                <li>Account data: Retained while account is active</li>
                <li>Published posts: Retained until you delete them</li>
                <li>OAuth tokens: Encrypted, retained while connection active</li>
                <li>Analytics: Aggregated data retained indefinitely; raw logs 90 days</li>
                <li>Deleted accounts: Data purged within 30 days (backups up to 90 days)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                6. Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc list-inside space-y-2">
                <li>Encryption in transit (TLS 1.2+) and at rest (AES-256 via Supabase)</li>
                <li>OAuth tokens encrypted with rotating keys before storage</li>
                <li>No passwords stored (magic link authentication only)</li>
                <li>Rate limiting, CSP, HSTS, security headers on all responses</li>
                <li>Regular dependency updates and vulnerability scanning</li>
              </ul>
              <p>No internet transmission is 100% secure. We cannot guarantee absolute security.</p>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                7. Your Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Depending on your location, you may have the right to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Access your personal data</li>
                <li>Rectify inaccurate data</li>
                <li>Erase your data (&ldquo;right to be forgotten&rdquo;)</li>
                <li>Restrict or object to processing</li>
                <li>Data portability (export your data)</li>
                <li>Withdraw consent (where consent is the basis)</li>
                <li>Opt out of marketing communications</li>
              </ul>
              <p>To exercise these rights, email <strong>connect@pixenox.com</strong> or use Settings &rarr; Danger Zone &rarr; Delete Account.</p>
            </CardContent>
          </Card>

          {/* Cookies & Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                8. Cookies & Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Essential:</strong> Session/auth cookies (via Supabase SSR)</li>
                <li><strong>No tracking cookies:</strong> We do not use Google Analytics, Meta Pixel, or ad tracking</li>
                <li><strong>LocalStorage:</strong> Theme preference, onboarding progress</li>
                <li>You can disable cookies in your browser (auth may not work)</li>
              </ul>
            </CardContent>
          </Card>

          {/* International Transfers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                9. International Data Transfers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Our infrastructure is hosted in the US (Vercel, Supabase, Upstash). AI processing uses Anthropic (US) and OpenAI (US).
                By using Unool, you consent to US data processing with standard contractual clauses where applicable.
              </p>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                10. Children&apos;s Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Unool is not directed to children under 18. We do not knowingly collect data from minors.
                If you believe a child provided data, contact us for deletion.
              </p>
            </CardContent>
          </Card>

          {/* Changes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                11. Changes to This Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                We may update this Policy. Material changes will be posted here with a new &ldquo;Last updated&rdquo; date.
                Continued use constitutes acceptance.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                12. Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>Privacy questions or requests:</p>
              <p><strong>Email:</strong> connect@pixenox.com</p>
              <p><strong>Data Protection Officer:</strong> Available upon request</p>
            </CardContent>
          </Card>
        </div>

        {/* Footer link */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <Link href="/terms" className="underline hover:text-foreground">Terms of Service</Link> |{' '}
          <Link href="/" className="underline hover:text-foreground">Home</Link>
        </div>
      </main>
    </div>
  );
}