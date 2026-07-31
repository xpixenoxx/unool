import { getAuthContext } from '@/lib/auth/context';
import { redirect } from 'next/navigation';
import ComposerClient from './ComposerClient';

async function getComposerData() {
  const auth = await getAuthContext();
  if (!auth) {
    return null;
  }
  return { userId: auth.userId, workspaceId: auth.workspaceId };
}

export default async function ComposerPage() {
  const data = await getComposerData();

  if (!data) {
    redirect('/');
  }

  return <ComposerClient userId={data.userId} workspaceId={data.workspaceId} />;
}