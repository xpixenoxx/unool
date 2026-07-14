import Link from 'next/link';
import { ArrowRight, Linkedin, Twitter, MessageSquare, CheckCircle, Zap, Shield, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-3 h-3" />
              <span>One Link + One Click</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
              Your professional presence,<br />
              <span className="text-primary">automated publishing</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Paste your URL. Get a beautiful profile page + platform-native posts for LinkedIn, X, and Threads.
              Write once. Review. Publish everywhere.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/signup" className="w-full sm:w-auto">
                <button className="w-full px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2 inline-block" />
                </button>
              </Link>
              <Link href="#how-it-works" className="w-full sm:w-auto">
                <button className="w-full px-8 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold text-lg hover:bg-secondary/80 transition-colors">
                  See How It Works
                </button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">No credit card · Magic link auth · Free forever for solo founders</p>
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-16 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Zap, label: '< 30s', desc: 'URL to live profile' },
              { icon: CheckCircle, label: '3 platforms', desc: 'LinkedIn, X, Threads' },
              { icon: Shield, label: 'You decide', desc: 'AI suggests, you approve' },
              { icon: Sparkles, label: 'Free tier', desc: 'No credit card required' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="p-4">
                <Icon className="w-8 h-8 mx-auto text-primary mb-2" />
                <div className="font-semibold">{label}</div>
                <div className="text-sm text-muted-foreground">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16">How Unool Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Generate Your Profile',
                desc: 'Paste your website, LinkedIn, or GitHub URL. AI extracts your role, company, metrics, links, and proof points. Live at yourname.unool.co in seconds.',
                icon: Linkedin,
              },
              {
                step: '02',
                title: 'Write Once, Adapt Everywhere',
                desc: 'Type your idea once. Unool generates platform-native versions: LinkedIn (3000 chars, hashtags, first-comment), X (280/thread), Threads (500, reply structure).',
                icon: Twitter,
              },
              {
                step: '03',
                title: 'Review & Publish',
                desc: 'See all 3 drafts side-by-side. Edit any field inline. Accept all, edit individually, reject AI, or write your own. Nothing publishes without your click.',
                icon: MessageSquare,
              },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="relative p-6 bg-card border rounded-xl">
                <div className="absolute -top-3 left-6 bg-background px-2 text-sm font-mono text-primary">{step}</div>
                <Icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to unify your presence?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join founders who&apos;ve replaced Linktree + Buffer + Notion with one workflow.
          </p>
          <Link href="/signup">
            <button className="px-10 py-4 bg-primary-foreground text-primary rounded-lg font-semibold text-lg hover:bg-primary-foreground/90 transition-colors">
              Start Free — Magic Link Only
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Unool — One Link + One Click</p>
          <p className="mt-2">Built for founder-operators, not content creators.</p>
        </div>
      </footer>
    </div>
  );
}