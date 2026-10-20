import { getAuthContext } from '@/lib/auth/context';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { FlightPlanClientWrapper } from './FlightPlanClientWrapper';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Flight Plan — Unool',
  description: 'Plan and schedule your weekly content across all connected platforms.',
};

export default async function FlightPlanPage() {
  const auth = await getAuthContext();
  if (!auth) {
    redirect('/signin');
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]" style={{ backgroundColor: '#F7F3ED' }}>
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#C4A265' }} />
        </div>
      }
    >
      <FlightPlanClientWrapper userId={auth.userId} workspaceId={auth.workspaceId} />
    </Suspense>
  );
}
