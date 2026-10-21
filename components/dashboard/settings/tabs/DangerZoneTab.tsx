'use client';

import { AlertTriangle, LogOut, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { SectionHeading, DangerCard, SignOutCard } from './shared';

interface DangerZoneTabProps {
  onSignOut: () => Promise<void>;
}

export function DangerZoneTab({ onSignOut }: DangerZoneTabProps) {
  return (
    <div className="space-y-5">
      <SectionHeading
        icon={AlertTriangle}
        title="Danger Zone"
        subtitle="These actions are permanent and cannot be reversed. Proceed with caution."
      />

      {/* Sign Out */}
      <SignOutCard
        title="Sign Out"
        description="End your current session. You&apos;ll need to sign in again to access your workspace."
        action={
          <Button
            variant="outline"
            onClick={onSignOut}
            className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 gap-2 shrink-0 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        }
      />

      {/* Delete Account */}
      <DangerCard
        icon={AlertTriangle}
        title="Delete Account"
        badge={
          <Badge
            variant="outline"
            className="text-[10px] border-red-300 text-red-600 bg-red-100 dark:border-red-700 dark:text-red-400 dark:bg-red-900/30"
          >
            Irreversible
          </Badge>
        }
        description="Permanently delete your account, all workspaces, posts, and data. There is no recovery path."
        action={
          <Button
            variant="destructive"
            onClick={() => {
              if (
                confirm(
                  'This will permanently delete your account and all data. Type "DELETE" to confirm.',
                )
              ) {
                alert('Account deletion coming in v1.1');
              }
            }}
            className="gap-2 shrink-0 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </Button>
        }
      />
    </div>
  );
}