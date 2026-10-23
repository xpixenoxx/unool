import type { Metadata } from 'next';
import { SwitchFromPageClient } from '../_shared/SwitchFromPageClient';

export const metadata: Metadata = {
  title: 'Switch from Linktree to Unool — Premium Profiles + Automation at ₹799/mo',
  description:
    'Linktree Pro costs ₹1,250/mo for a button list with no automation and no publishing. Unool gives you a stunning profile + Instagram/LinkedIn automation + content scheduling — all at ₹799/mo.',
  keywords: [
    'linktree alternative india',
    'linktree vs unool',
    'switch from linktree',
    'better link in bio india',
    'linktree competitor',
    'beacons alternative india',
    'creator profile alternative linktree',
  ],
  openGraph: {
    title: 'Unool vs Linktree — Premium Profiles + Full Automation at ₹799/mo',
    description: 'Your audience deserves more than a button list. Switch from Linktree to a profile that feels like a custom website — with automation built in.',
    type: 'website',
  },
};

export default function SwitchFromLinktreePage() {
  return (
    <SwitchFromPageClient
      from="linktree"
      fromDisplayName="Linktree"
      fromMonthlyPrice="₹1,250"
      fromPlanName="Linktree Pro"
      headline="Your audience deserves more than a button list."
      subheadline="Linktree Pro costs ₹1,250/mo for a generic page with zero automation and zero publishing. Unool gives you a premium profile + Instagram automation + LinkedIn + scheduling — at ₹799/mo."
      painPoints={[
        { icon: '🔗', title: 'Button list — not a brand', desc: 'Linktree profiles all look the same. Your audience can tell it\'s a generic bio page.' },
        { icon: '💸', title: '₹1,250/mo for static links', desc: 'Linktree Pro is more expensive than Unool Creator — and does 10% of what Unool does.' },
        { icon: '🤖', title: 'Zero automation', desc: 'Linktree has no comment automation, no DM flows, no lead capture — none of it.' },
        { icon: '📅', title: 'No publishing', desc: 'Still managing Buffer or Later separately? Unool includes content scheduling for all platforms.' },
      ]}
      gains={[
        { icon: '🎨', title: '16 persona templates — not themes', desc: 'Each template is built around a creator archetype. Parallax, magnetic hover, 3D. Looks custom-built.' },
        { icon: '🤖', title: 'Instagram automation included', desc: 'AI comment classification, Comment-to-DM flows, DM Concierge — things Linktree will never build.' },
        { icon: '💼', title: 'LinkedIn automation included', desc: 'Auto-reply comments, B2B lead scoring. Nobody else does this.' },
        { icon: '📣', title: 'Multi-platform publishing', desc: 'Write once, publish to IG, LinkedIn, X, Threads, Bluesky. Linktree cannot schedule a single post.' },
        { icon: '🔒', title: 'Follow-to-unlock gates', desc: 'Lock exclusive content behind a follow. Linktree doesn\'t have this.' },
        { icon: '🌐', title: 'Custom domain on Pro', desc: 'Same as Linktree Pro — but you also get automation, publishing, and real templates at ₹749 less/mo.' },
      ]}
      testimonialQuote="I was embarrassed telling people to click my Linktree. Switched to Unool and my profile now looks like a proper website. Also finally got automation for free on top."
      testimonialAuthor="Priya M., Lifestyle Creator, Bangalore"
      comparisonRows={[
        { feature: 'Premium profile design', from: 'partial', unool: true },
        { feature: 'Custom domain', from: true, unool: true },
        { feature: 'IG Comment automation', from: false, unool: true },
        { feature: 'Comment-to-DM flows', from: false, unool: true },
        { feature: 'LinkedIn automation', from: false, unool: true },
        { feature: 'Multi-platform publishing', from: false, unool: true },
        { feature: 'Follow-to-unlock gates', from: false, unool: true },
        { feature: 'AI content composer', from: false, unool: true },
        { feature: 'Monthly price (India)', from: '₹1,250', unool: '₹799' },
      ]}
    />
  );
}
