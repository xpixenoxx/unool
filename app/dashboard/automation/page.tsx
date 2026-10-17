import { getAuthContext } from '@/lib/auth/context';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import AutomationClient from './AutomationClient';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Automation — Instagram & LinkedIn | UNOOL',
  description: 'AI-powered comment and DM automation for Instagram and LinkedIn. Classify intent, auto-reply, and convert audience to leads.',
};

export default async function AutomationPage() {
  const auth = await getAuthContext();

  if (!auth) {
    redirect('/signin');
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#8b5cf6' }} />
        </div>
      }
    >
      <AutomationClient workspaceId={auth.workspaceId} userId={auth.userId} />
    </Suspense>
  );
}
