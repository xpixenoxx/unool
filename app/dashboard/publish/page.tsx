import { getAuthContext } from '@/lib/auth/context';
import { redirect } from 'next/navigation';
import PublishClientWrapper from './PublishClient';

async function getPublishData() {
  const auth = await getAuthContext();
  if (!auth) {
    return null;
  }
  return { userId: auth.userId, workspaceId: auth.workspaceId };
}

export default async function PublishPage() {
  const data = await getPublishData();

  if (!data) {
    redirect('/');
  }

  return <PublishClientWrapper userId={data.userId} workspaceId={data.workspaceId} />;
}