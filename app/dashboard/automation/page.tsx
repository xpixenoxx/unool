import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AutomationClient from './AutomationClient';

export const metadata = {
  title: 'SignalDM — Instagram Automation | UNOOL',
  description: 'AI-powered comment and DM automation for Instagram. Classify intent, auto-reply, and convert followers to leads.',
};

export default async function AutomationPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/signin');
  }

  // Get workspace ID from memberships
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .single();

  const workspaceId = membership?.workspace_id || null;

  return <AutomationClient workspaceId={workspaceId} userId={user.id} />;
}
