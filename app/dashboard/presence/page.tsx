import { getAuthContext } from '@/lib/auth/context';
import { redirect } from 'next/navigation';
import PresenceClientWrapper from './PresenceClient';

async function getPresenceData() {
  const auth = await getAuthContext();
  if (!auth) {
    return null;
  }
  return { userId: auth.userId, workspaceId: auth.workspaceId };
}

export default async function PresencePage() {
  const data = await getPresenceData();

  if (!data) {
    redirect('/');
  }

  return <PresenceClientWrapper userId={data.userId} workspaceId={data.workspaceId} />;
}