import { getAuthContext } from '@/lib/auth/context';
import { redirect } from 'next/navigation';
import PresenceClientWrapper from '../presence/PresenceClient';

export const metadata = {
  title: 'Profile — Unool',
  description: 'Your public profile and bio links.',
};

async function getPresenceData() {
  const auth = await getAuthContext();
  if (!auth) {
    return null;
  }
  return { userId: auth.userId, workspaceId: auth.workspaceId };
}

export default async function ProfilePage() {
  const data = await getPresenceData();

  if (!data) {
    redirect('/');
  }

  return <PresenceClientWrapper userId={data.userId} workspaceId={data.workspaceId} />;
}
