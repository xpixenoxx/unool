import { Suspense } from 'react';
import { ReferralsPage } from './ReferralsPage';

export const metadata = {
  title: 'Referrals — Unool',
  description: 'Invite creators to Unool and earn AI credits and free months.',
};

export default function ReferralsDashboardPage() {
  return (
    <Suspense>
      <ReferralsPage />
    </Suspense>
  );
}
