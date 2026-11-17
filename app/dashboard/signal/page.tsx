import { Suspense } from 'react';
import { getAuthContext } from '@/lib/auth/context';
import { redirect } from 'next/navigation';
import { SignalClient } from './SignalClient';

export const metadata = {
  title: 'Signal — Unool',
  description: 'Closed-loop social analytics, hook formula intelligence, timing optimization & live feed.',
};

export default async function SignalPage() {
  const auth = await getAuthContext();
  if (!auth) redirect('/signin?redirect=/dashboard/signal');
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-6 py-8 text-xs text-[#78716C]">Loading Signal Intelligence…</div>}>
      <SignalClient />
    </Suspense>
  );
}
