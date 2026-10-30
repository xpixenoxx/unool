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
  Textarea,
  Label,
  Flex,
  Box,
  Text,
} from '@/components/ui';
import { Ban, Trash2, AlertCircle } from 'lucide-react';

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
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="gap-2">
            <Flex align="center" gap={2}>
              <Box
                className={`p-2 rounded-xl ${
                  isDelete
                    ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                }`}
              >
                {isDelete ? <Trash2 className="h-5 w-5" /> : <Ban className="h-5 w-5" />}
              </Box>
              <DialogTitle className="text-lg">
                {isDelete ? 'Delete User Account' : 'Suspend User Account'}
              </DialogTitle>
            </Flex>
            <DialogDescription className="text-xs text-muted-foreground">
              {isDelete ? (
                <>
                  This account for <strong className="text-foreground">{targetEmail}</strong> will be moved to the Recovery table. The account will not be permanently deleted and can be restored at any time.
                </>
              ) : (
                <>
                  This will temporarily ban <strong className="text-foreground">{targetEmail}</strong> and block them from logging in. You can restore them from the Recovery console.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <Box className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason-input" className="text-xs font-semibold">
                Reason for {isDelete ? 'Deletion' : 'Suspension'} <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason-input"
                placeholder={
                  isDelete
                    ? 'e.g. User requested deletion via support, spam account...'
                    : 'e.g. Terms violation, spamming bio links, suspicious activity...'
                }
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError(null);
                }}
                className="resize-none min-h-[80px] text-sm"
                autoFocus
              />
            </div>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <Text size="xs" color="muted" weight="medium">
                Quick reason presets:
              </Text>
              <Flex gap={1.5} className="flex-wrap">
                {presets.map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    onClick={() => setReason(preset)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-muted-foreground/10"
                  >
                    {preset}
                  </button>
                ))}
              </Flex>
            </div>

            {error && (
              <Flex align="center" gap={1.5} className="text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </Flex>
            )}
          </Box>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className={
                isDelete
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }
            >
              {submitting
                ? 'Processing...'
                : isDelete
                ? 'Move to Deleted & Archive'
                : 'Suspend Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
