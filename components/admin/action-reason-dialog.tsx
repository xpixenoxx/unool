'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Label,
  Flex,
  Box,
  Text,
} from '@/components/ui';
import { Ban, Trash2, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionReasonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  actionType: 'suspend' | 'delete';
  targetEmail: string;
  targetName?: string;
}

export function ActionReasonDialog({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  targetEmail,
  targetName,
}: ActionReasonDialogProps) {
  const [reason, setReason] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setReason('');
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  const presets =
    actionType === 'suspend'
      ? [
          'Violation of Terms of Service',
          'Spam activity or unauthorized promotions',
          'Suspicious login / Security review',
          'Harassment or abusive content',
        ]
      : [
          'User requested account deletion',
          'Spam / bot / duplicate account',
          'Severe platform abuse or fraud',
          'Abandoned test account',
        ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError('Please provide a reason before proceeding.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(trimmedReason);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const isDelete = actionType === 'delete';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-6 z-[100]">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Header */}
          <DialogHeader className="gap-2 text-left sm:text-left">
            <Flex align="center" gap={3}>
              <Box
                className={cn(
                  'p-2.5 rounded-xl border flex items-center justify-center shrink-0',
                  isDelete
                    ? 'bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-900/60'
                    : 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-900/60'
                )}
              >
                {isDelete ? <Trash2 className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
              </Box>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {isDelete ? 'Delete User Account' : 'Suspend User Account'}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Confirm administrator action for <span className="font-semibold text-zinc-800 dark:text-zinc-200">{targetEmail}</span>
                </DialogDescription>
              </div>
            </Flex>

            {/* Visual Notice Card */}
            <div
              className={cn(
                'mt-2 p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5',
                isDelete
                  ? 'bg-rose-50/90 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-900/50'
                  : 'bg-amber-50/90 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/50'
              )}
            >
              <AlertTriangle className={cn('h-4 w-4 shrink-0 mt-0.5', isDelete ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400')} />
              <div>
                {isDelete ? (
                  <>
                    This account for <strong>{targetEmail}</strong> will be moved to the <strong>Recovery table</strong>. The account is not permanently lost and can be restored at any time.
                  </>
                ) : (
                  <>
                    Temporarily bans <strong>{targetEmail}</strong> from signing in. You can restore their account at any time from this panel or the Recovery table.
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Reason Input Area */}
          <Box className="space-y-3.5 pt-1">
            <div className="space-y-2">
              <Label htmlFor="reason-input" className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                Reason for {isDelete ? 'Deletion' : 'Suspension'} <span className="text-rose-500">*</span>
              </Label>
              <textarea
                id="reason-input"
                rows={3}
                placeholder={
                  isDelete
                    ? 'e.g. User requested deletion via support, spam account, duplicate registration...'
                    : 'e.g. Terms violation, spamming bio links, suspicious login activity...'
                }
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full rounded-xl border border-zinc-300 bg-zinc-50/90 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-850 dark:focus:border-zinc-600 resize-none transition-all shadow-inner"
                autoFocus
              />
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <Text size="xs" color="muted" weight="medium" className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                Quick reason presets:
              </Text>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => {
                  const isSelected = reason === preset;
                  return (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => {
                        setReason(preset);
                        if (error) setError(null);
                      }}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-lg border font-medium transition-all text-left cursor-pointer active:scale-95',
                        isSelected
                          ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 shadow-sm'
                          : 'bg-zinc-100/90 hover:bg-zinc-200/90 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 dark:text-zinc-300 dark:border-zinc-700'
                      )}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </Box>

          {/* Footer Actions */}
          <DialogFooter className="mt-6 flex flex-row justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={submitting}
              className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-4 h-9 font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className={cn(
                'px-5 h-9 font-semibold text-white shadow-md transition-all',
                isDelete
                  ? 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700'
                  : 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700'
              )}
            >
              {submitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...
                </span>
              ) : isDelete ? (
                <span className="flex items-center gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Move to Deleted & Archive
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Ban className="h-3.5 w-3.5" /> Suspend Account
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
