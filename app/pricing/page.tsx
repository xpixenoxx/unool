import type { Metadata } from 'next';
import { PricingPageClient } from './PricingPageClient';

export const metadata: Metadata = {
  title: 'Pricing — Unool | Plans from ₹799/mo',
  description:
    'Unool replaces Zorcha, Buffer, and Linktree with one ₹799/mo platform. Profile + Publishing + Instagram Automation + LinkedIn — all in one. Try free, no credit card.',
  keywords: [
    'unool pricing',
    'creator platform india',
    'instagram automation pricing',
    'link in bio pricing india',
    'zorcha alternative',
    'linktree alternative india',
    'social media tool india',
  ],
  openGraph: {
    title: 'Pricing — Unool | Plans from ₹799/mo',
    description:
      'Replace Zorcha + Buffer + Linktree with one ₹799/mo platform. 14-day free trial, no credit card.',
    type: 'website',
  },
};

export default function PricingPage() {
  return <PricingPageClient />;
}
