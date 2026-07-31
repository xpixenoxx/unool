import { getAuthContext } from '@/lib/auth/context';
import { redirect } from 'next/navigation';
import BillingClientWrapper from './BillingClient';

async function getBillingData() {
  const auth = await getAuthContext();
  if (!auth) {
    return null;
  }
  return { userId: auth.userId, workspaceId: auth.workspaceId };
}

export default async function BillingPage() {
  const data = await getBillingData();

  if (!data) {
    redirect('/');
  }

  return <BillingClientWrapper userId={data.userId} workspaceId={data.workspaceId} />;
}