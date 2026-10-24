import type { Metadata } from 'next';
import { PricingPageClient } from './PricingPageClient';

export const metadata: Metadata = {
  title: 'Unool pricing: one bill',
  description:
    'Unool replaces Zorcha, Buffer, Linktree and Taplio. Profile page, publishing, Instagram automation and LinkedIn growth, for one flat price.',
  openGraph: {
    title: 'Unool pricing: one bill',
    description:
      'Unool replaces Zorcha, Buffer, Linktree and Taplio. Profile page, publishing, Instagram automation and LinkedIn growth, for one flat price.',
    type: 'website',
  },
};

export default function PricingPage() {
  return <PricingPageClient />;
}
