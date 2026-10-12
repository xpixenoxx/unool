import { getAuthContext } from '@/lib/auth/context';
import { redirect } from 'next/navigation';
import FlightPlanClient from './FlightPlanClient';

export default async function FlightPlanPage() {
  const auth = await getAuthContext();
  if (!auth) {
    redirect('/');
  }

  return <FlightPlanClient userId={auth.userId} workspaceId={auth.workspaceId} />;
}
