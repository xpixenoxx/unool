import { getAuthContext } from '@/lib/auth/context';
import { redirect } from 'next/navigation';
import SettingsClientWrapper from './SettingsClient';

async function getSettingsData() {
  const auth = await getAuthContext();
  if (!auth) {
    return null;
  }
  return { userId: auth.userId, workspaceId: auth.workspaceId };
}

export default async function SettingsPage() {
  const data = await getSettingsData();

  if (!data) {
    redirect('/signin?redirect=/dashboard/settings');
  }

  return <SettingsClientWrapper userId={data.userId} workspaceId={data.workspaceId} />;
}