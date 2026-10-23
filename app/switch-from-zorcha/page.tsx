import type { Metadata } from 'next';
import { SwitchFromPageClient } from '../_shared/SwitchFromPageClient';

export const metadata: Metadata = {
  title: 'Switch from Zorcha to Unool — More Features at ₹799/mo',
  description:
    'Tired of Zorcha\'s ₹1,199/mo for Instagram-only automation? Unool gives you Instagram + LinkedIn automation, a stunning profile, and multi-platform publishing — all at ₹799/mo. Switch in minutes.',
  keywords: [
    'zorcha alternative',
    'zorcha vs unool',
    'switch from zorcha',
    'instagram automation india',
    'better than zorcha',
    'manychat alternative india',
    'zorcha competitor',
  ],
  openGraph: {
    title: 'Unool vs Zorcha — Everything Zorcha does + LinkedIn + Publishing at ₹799/mo',
    description: 'Switch from Zorcha to Unool in minutes. Keep all your automations. Add LinkedIn, scheduling, and a premium profile.',
    type: 'website',
  },
};

export default function SwitchFromZorchaPage() {
  return (
    <SwitchFromPageClient
      from="zorcha"
      fromDisplayName="Zorcha"
      fromMonthlyPrice="₹1,199"
      fromPlanName="Zorcha Pro"
      headline="You're paying ₹1,199/mo for Instagram-only."
      subheadline="Unool gives you Instagram + LinkedIn automation, a premium profile, and multi-platform publishing — all at ₹799/mo."
      painPoints={[
        { icon: '📱', title: 'Instagram-only', desc: 'Zorcha locks you to one platform. Your audience is on LinkedIn, Threads, and X too.' },
        { icon: '🎨', title: 'Three basic themes', desc: 'Zorcha\'s bio page has 3 generic themes. Unool has 16 studio-grade persona templates.' },
        { icon: '📅', title: 'No publishing', desc: 'Zorcha has zero content scheduling. You still need Buffer or Later on top — that\'s ₹2,000+ extra.' },
        { icon: '💸', title: '₹1,199/mo — only DMs', desc: 'You\'re paying Zorcha Pro pricing for a feature subset that Unool includes in Spark (free).' },
      ]}
      gains={[
        { icon: '🤖', title: 'Same IG automation — smarter', desc: 'AI semantic intent — no rigid "comment EBOOK below" triggers. Natural language works.' },
        { icon: '💼', title: 'LinkedIn automation added', desc: 'Full comment classification, auto-reply, and B2B lead scoring on LinkedIn. Nobody else does this.' },
        { icon: '🌐', title: 'Premium profile included', desc: '16 persona templates. Parallax, 3D, magnetic hover. Looks like a custom site — not a button list.' },
        { icon: '📣', title: 'Multi-platform publishing', desc: 'IG, LinkedIn, X, Threads, Bluesky — one composer, one schedule, one bill.' },
        { icon: '🔒', title: 'Follow-to-unlock gates', desc: 'Same feature Zorcha has — included on Unool\'s free tier.' },
        { icon: '💬', title: 'AI DM Concierge', desc: 'Full knowledge-base-powered inbound DM responder. Zorcha has rigid FAQ slots. Unool understands your brand.' },
      ]}
      testimonialQuote="I was paying Zorcha ₹1,199 just for Instagram DMs. Unool does that AND LinkedIn AND has scheduling AND my profile looks 10x better — for ₹400 less."
      testimonialAuthor="Rahul S., Content Creator, Hyderabad"
      comparisonRows={[
        { feature: 'IG Comment automation', from: true, unool: true },
        { feature: 'Comment-to-DM flows', from: true, unool: true },
        { feature: 'LinkedIn automation', from: false, unool: true },
        { feature: 'Multi-platform publishing', from: false, unool: true },
        { feature: 'Premium profile page', from: 'partial', unool: true },
        { feature: 'AI content composer', from: false, unool: true },
        { feature: 'Follow-to-unlock gates', from: true, unool: true },
        { feature: 'DM Concierge (AI responder)', from: 'partial', unool: true },
        { feature: 'Monthly price (India)', from: '₹1,199', unool: '₹799' },
      ]}
    />
  );
}
