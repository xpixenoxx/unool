import { Suspense } from 'react';
import { FollowGateManagerPage } from './FollowGateManagerPage';

export const metadata = {
  title: 'Unlock Gates — Unool',
  description: 'Lock exclusive content behind an Instagram follow. Your audience follows, content unlocks instantly.',
};

export default function FollowGatesPage() {
  return (
    <Suspense>
      <FollowGateManagerPage />
    </Suspense>
  );
}
