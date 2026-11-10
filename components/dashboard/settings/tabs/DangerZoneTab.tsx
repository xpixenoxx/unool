'use client';

import { useState } from 'react';
import { AlertTriangle, LogOut, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { clearAllClientCaches } from '@/lib/utils/clientCache';
import { SectionHeading, DangerCard, SignOutCard } from './shared';

interface DangerZoneTabProps {
  onSignOut: () => Promise<void>;
}

export function DangerZoneTab({ onSignOut }: DangerZoneTabProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText.trim() !== 'DELETE') {
      toast.error('Please type DELETE in uppercase to confirm account deletion.');
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch('/api/user/delete', {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }
      clearAllClientCaches();
      toast.success('Your account and all associated data have been permanently deleted.');
      window.location.replace('/signin');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account');
      setDeleting(false);
    }
  };

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
          confirmingDelete ? (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder='Type "DELETE"'
                aria-label='Type DELETE to confirm account deletion'
                className="w-32 h-8 text-xs border-red-300 focus-visible:ring-red-500"
                disabled={deleting}
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={deleting || confirmText.trim() !== 'DELETE'}
                className="h-8 gap-1.5 cursor-pointer"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Confirm
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConfirmingDelete(false);
                  setConfirmText('');
                }}
                disabled={deleting}
                className="h-8 text-xs cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="destructive"
              onClick={() => setConfirmingDelete(true)}
              className="gap-2 shrink-0 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </Button>
          )
        }
      />
    </div>
  );
}