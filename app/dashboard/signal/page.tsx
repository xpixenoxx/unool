import { getAuthContext } from '@/lib/auth/context';
import { redirect } from 'next/navigation';
import { SignalClient } from './SignalClient';

export const metadata = {
  title: 'Signal — Unool',
  description: 'Your live post deployment feed and content pattern intelligence.',
};

export default async function SignalPage() {
  const auth = await getAuthContext();
  if (!auth) redirect('/');
  return <SignalClient />;
}
