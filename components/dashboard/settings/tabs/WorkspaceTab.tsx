'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  CreditCard,
  ArrowLeftRight,
  UserPlus,
  Trash2,
  Loader2,
  ArrowUpRight,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  SectionHeading,
  SettingRow,
  PCard,
  PCardHead,
  PCardBody,
  DangerCard,
  SaveActionFooter,
} from './shared';
import {
  normalizePlanId,
  type WorkspaceSummaryDto,
  type WorkspaceMemberDto,
  type AccessibleWorkspaceDto,
  type BillingSummaryDto,
} from '../types';

export interface WorkspaceTabProps {
  currentUserId: string;
  workspace: WorkspaceSummaryDto;
  callerRole: 'owner' | 'admin' | 'editor' | 'viewer';
  members: WorkspaceMemberDto[];
  workspaces: AccessibleWorkspaceDto[];
  billing: BillingSummaryDto;
  isImpersonated: boolean;
  onWorkspaceUpdated: (
    nextWorkspace: WorkspaceSummaryDto,
    nextMembers?: WorkspaceMemberDto[]
  ) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export function WorkspaceTab({
  currentUserId,
  workspace,
  callerRole,
  members,
  workspaces,
  billing,
  isImpersonated,
  onWorkspaceUpdated,
  onDirtyChange,
}: WorkspaceTabProps) {
  const router = useRouter();
  const canManageWorkspace = callerRole === 'owner' || callerRole === 'admin';
  const isOwner = callerRole === 'owner';

  const [wsName, setWsName] = useState(workspace.name);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [switchingWsId, setSwitchingWsId] = useState<string | null>(null);

  // Team invite & actions
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [inviting, setInviting] = useState(false);
  const [roleUpdatingId, setRoleUpdatingId] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMemberDto | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  // Subscription cancellation
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingPlan, setCancellingPlan] = useState(false);

  // Ownership transfer
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [targetOwnerId, setTargetOwnerId] = useState('');
  const [transferConfirm, setTransferConfirm] = useState('');
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    setWsName(workspace.name);
  }, [workspace.name, workspace.id]);

  const isDirty = wsName.trim() !== (workspace.name || '').trim();

  useEffect(() => {
    onDirtyChange?.(canManageWorkspace && isDirty);
    return () => onDirtyChange?.(false);
  }, [canManageWorkspace, isDirty, onDirtyChange]);

  const transferCandidates = useMemo(
    () =>
      members.filter(
        (m) => m.userId && m.userId !== currentUserId && m.status === 'active'
      ),
    [members, currentUserId]
  );

  const normalizedPlan = normalizePlanId(billing.planId || workspace.plan);
  const planDisplayName = normalizedPlan.charAt(0).toUpperCase() + normalizedPlan.slice(1);

  const refreshWorkspaceFromServer = async () => {
    const res = await fetch('/api/workspace', { credentials: 'include' });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.workspace) {
      onWorkspaceUpdated(data.workspace, Array.isArray(data.members) ? data.members : members);
    }
  };

  const handleSaveName = async () => {
    if (!canManageWorkspace) return;
    const trimmed = wsName.trim();
    if (trimmed.length < 2) {
      setNameError('Workspace name must be at least 2 characters.');
      return;
    }
    setNameError(null);
    setSavingName(true);
    try {
      const res = await fetch('/api/workspace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Failed to rename workspace.');
      onWorkspaceUpdated({ ...workspace, name: data?.workspace?.name || trimmed }, members);
      toast.success('Workspace name updated.');
    } catch (err) {
      setNameError(err instanceof Error ? err.message : 'Rename failed');
    } finally {
      setSavingName(false);
    }
  };

  const handleSwitchWorkspace = async (workspaceId: string) => {
    if (workspaceId === workspace.id) return;
    setSwitchingWsId(workspaceId);
    try {
      const res = await fetch('/api/workspace/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Failed to switch workspace.');
      toast.success(`Switched to ${data?.workspaceName || 'workspace'}`);
      router.refresh();
      await refreshWorkspaceFromServer();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Switch failed');
    } finally {
      setSwitchingWsId(null);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageWorkspace) return;
    const cleanEmail = inviteEmail.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error('Enter an email address to invite.');
      return;
    }
    setInviting(true);
    try {
      const res = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: cleanEmail, role: inviteRole }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Failed to send invite.');
      setInviteEmail('');
      await refreshWorkspaceFromServer();
      if (data?.emailDelivered === false) {
        toast.warning(data?.message || 'Invite saved, but delivery email failed — share login instructions manually.');
      } else {
        toast.success(`Invitation sent to ${cleanEmail}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invite failed');
    } finally {
      setInviting(false);
    }
  };

  const handleChangeMemberRole = async (member: WorkspaceMemberDto, nextRole: 'admin' | 'editor' | 'viewer') => {
    if (!canManageWorkspace || member.role === nextRole) return;
    setRoleUpdatingId(member.id);
    try {
      const res = await fetch('/api/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ memberId: member.id, role: nextRole }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Failed to change member role.');
      await refreshWorkspaceFromServer();
      toast.success(`Updated ${member.email} to ${nextRole}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Role update failed');
    } finally {
      setRoleUpdatingId(null);
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    setRemovingMember(true);
    try {
      const res = await fetch(`/api/workspace?memberId=${encodeURIComponent(memberToRemove.id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Failed to remove member.');
      const selfLeft = memberToRemove.userId === currentUserId;
      setMemberToRemove(null);
      if (selfLeft) {
        toast.success('You left the workspace.');
        router.refresh();
      } else {
        toast.success('Member access removed.');
      }
      await refreshWorkspaceFromServer();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Removal failed');
    } finally {
      setRemovingMember(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (isImpersonated || !isOwner) return;
    setCancellingPlan(true);
    try {
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Failed to cancel subscription.');
      setCancelDialogOpen(false);
      toast.success('Subscription will downgrade to Spark at the end of your current billing period.');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cancellation failed');
    } finally {
      setCancellingPlan(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (isImpersonated || !isOwner || !targetOwnerId) return;
    setTransferring(true);
    try {
      const res = await fetch('/api/workspace/transfer-ownership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetUserId: targetOwnerId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Failed to transfer ownership.');
      setTransferDialogOpen(false);
      setTransferConfirm('');
      toast.success('Workspace ownership transferred. Your role is now Admin.');
      router.refresh();
      await refreshWorkspaceFromServer();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        icon={Building2}
        title="Workspace & Team"
        subtitle="Manage active workspace identity, switch teams, invite collaborators, and review your plan."
      />

      {/* Workspace identity & switcher */}
      <PCard>
        <PCardHead>
          <span>Workspace Identity</span>
        </PCardHead>
        <PCardBody>
          <SettingRow
            label="Workspace name"
            htmlFor="workspace-name-input"
            description={
              canManageWorkspace
                ? 'Visible in the studio header and collaboration invites.'
                : 'Only Owners and Admins can rename this workspace.'
            }
          >
            <Input
              id="workspace-name-input"
              value={wsName}
              disabled={!canManageWorkspace}
              maxLength={80}
              onChange={(e) => setWsName(e.target.value)}
              className="sm:w-72"
            />
          </SettingRow>

          <SettingRow
            label="Your workspace role"
            description="Determines billing, channel, and team administration capabilities."
            last={workspaces.length <= 1}
          >
            <Badge className="capitalize bg-[#F5EFE2] text-[#5C4315] border-[#C4A265]/40 dark:bg-[#2D2419] dark:text-[#EAD7B0]">
              {callerRole}
            </Badge>
          </SettingRow>

          {workspaces.length > 1 && (
            <SettingRow
              label="Switch active workspace"
              description="Choose which workspace context drives Studio, Channels, and Billing."
              last
            >
              <div className="flex flex-col gap-2 sm:w-80">
                {workspaces.map((w) => {
                  const isCurrent = w.workspaceId === workspace.id;
                  const wsPlan = normalizePlanId(w.plan);
                  return (
                    <div
                      key={w.workspaceId}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border ${
                        isCurrent
                          ? 'border-[#C4A265] bg-[#F5EFE2]/70 dark:bg-[#2D2419]'
                          : 'border-[#E4D9C8] dark:border-[#382F27] bg-[#FAF7F2] dark:bg-[#28211C]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6] truncate">
                          {w.name}
                        </p>
                        <p className="text-[11px] text-[#6E5A48] dark:text-[#B8A896] capitalize">
                          {w.role} · {wsPlan} plan
                        </p>
                      </div>
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5C4315] dark:text-[#C4A265]">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" /> Active
                        </span>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={switchingWsId === w.workspaceId}
                          onClick={() => handleSwitchWorkspace(w.workspaceId)}
                          className="min-h-[34px] text-[12px] border-[#E4D9C8] cursor-pointer"
                        >
                          {switchingWsId === w.workspaceId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            'Switch'
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </SettingRow>
          )}

          {canManageWorkspace && (
            <SaveActionFooter
              dirty={isDirty}
              saving={savingName}
              error={nameError}
              saveLabel="Save name"
              onSave={handleSaveName}
              onReset={() => {
                setWsName(workspace.name);
                setNameError(null);
              }}
            />
          )}
        </PCardBody>
      </PCard>

      {/* Plan & Commercial Summary */}
      <PCard>
        <PCardHead
          action={
            <Button asChild size="sm" variant="outline" className="min-h-[36px] border-[#C4A265]/50 text-[#5C4315] dark:text-[#C4A265]">
              <Link href="/dashboard/billing" className="inline-flex items-center gap-1.5">
                Billing & Invoices <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          }
        >
          <span className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#5C4315] dark:text-[#C4A265]" aria-hidden="true" />
            Subscription Plan
          </span>
        </PCardHead>
        <PCardBody>
          <SettingRow
            label="Active tier"
            description={
              billing.currentPeriodEnd
                ? `Current billing cycle runs through ${new Date(billing.currentPeriodEnd).toLocaleDateString()}.`
                : 'Upgrade or manage Cashfree billing in the Billing Center.'
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-[#3D2B1F] text-white dark:bg-[#C4A265] dark:text-[#16120F]">
                {planDisplayName}
              </Badge>
              {billing.billingCycle && (
                <span className="text-[12px] text-[#6E5A48] dark:text-[#B8A896] capitalize">
                  ({billing.billingCycle})
                </span>
              )}
              {billing.cancelAtPeriodEnd && (
                <Badge variant="outline" className="border-[#A43D1E]/40 text-[#A43D1E]">
                  Cancels at period end
                </Badge>
              )}
            </div>
          </SettingRow>

          {isOwner && !billing.isFreeTier && !billing.cancelAtPeriodEnd && (
            <SettingRow
              label="Cancel subscription"
              description="Downgrade to Spark at the end of the current paid period."
              last
            >
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isImpersonated}
                onClick={() => setCancelDialogOpen(true)}
                className="min-h-[40px] sm:min-h-[36px] border-[#9E2A2B]/40 text-[#9E2A2B] hover:bg-[#FFF8F6] cursor-pointer"
              >
                Cancel plan renewal
              </Button>
            </SettingRow>
          )}
        </PCardBody>
      </PCard>

      {/* Team Members */}
      <PCard>
        <PCardHead>
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#5C4315] dark:text-[#C4A265]" aria-hidden="true" />
            Team Roster ({members.length})
          </span>
        </PCardHead>
        <PCardBody className="space-y-4">
          {canManageWorkspace && (
            <form onSubmit={handleInviteMember} className="flex flex-col sm:flex-row gap-2 pb-4 border-b border-[#E4D9C8]/80 dark:border-[#382F27]">
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                aria-label="Teammate email address"
                className="flex-1"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'admin' | 'editor' | 'viewer')}
                aria-label="Invite role"
                className="min-h-[44px] sm:min-h-[38px] rounded-lg border border-[#E4D9C8] dark:border-[#382F27] bg-white dark:bg-[#1F1A16] px-3 text-[13px] text-[#3D2B1F] dark:text-[#F5EFE6]"
              >
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
              <Button
                type="submit"
                disabled={inviting}
                className="min-h-[44px] sm:min-h-[38px] bg-[#3D2B1F] hover:bg-[#261B13] text-white dark:bg-[#F5EFE6] dark:text-[#16120F] cursor-pointer gap-1.5"
              >
                {inviting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                )}
                Invite member
              </Button>
            </form>
          )}

          <div className="divide-y divide-[#E4D9C8]/70 dark:divide-[#382F27]">
            {members.map((member) => {
              const isSelf = member.userId === currentUserId;
              const isTargetOwner = member.isOwner || member.role === 'owner';
              const canChangeRole =
                !isTargetOwner &&
                !isSelf &&
                (isOwner || (callerRole === 'admin' && member.role !== 'admin'));
              const canRemove =
                (!isTargetOwner && isSelf) ||
                (!isTargetOwner && (isOwner || (callerRole === 'admin' && member.role !== 'admin')));

              return (
                <div
                  key={member.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px] font-medium text-[#3D2B1F] dark:text-[#F5EFE6] truncate">
                        {member.fullName || member.email}
                      </span>
                      {isSelf && (
                        <Badge variant="outline" className="text-[10px] border-[#C4A265]/40 text-[#5C4315]">
                          You
                        </Badge>
                      )}
                      {member.status === 'pending' && (
                        <Badge variant="outline" className="text-[10px] border-[#A43D1E]/40 text-[#A43D1E]">
                          Pending invite
                        </Badge>
                      )}
                    </div>
                    <p className="text-[12px] text-[#6E5A48] dark:text-[#B8A896] truncate">
                      {member.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {canChangeRole ? (
                      <select
                        value={member.role}
                        disabled={roleUpdatingId === member.id}
                        aria-label={`Role for ${member.email}`}
                        onChange={(e) =>
                          handleChangeMemberRole(member, e.target.value as 'admin' | 'editor' | 'viewer')
                        }
                        className="min-h-[38px] rounded-lg border border-[#E4D9C8] dark:border-[#382F27] bg-[#FAF7F2] dark:bg-[#28211C] px-2.5 text-[12px] text-[#3D2B1F] dark:text-[#F5EFE6]"
                      >
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <Badge variant="outline" className="capitalize border-[#E4D9C8] dark:border-[#382F27]">
                        {member.role}
                      </Badge>
                    )}

                    {canRemove && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setMemberToRemove(member)}
                        aria-label={isSelf ? 'Leave workspace' : `Remove ${member.email}`}
                        className="min-h-[38px] border-[#9E2A2B]/30 text-[#9E2A2B] hover:bg-[#FFF8F6] cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </PCardBody>
      </PCard>

      {/* Ownership transfer */}
      {isOwner && (
        <DangerCard
          icon={ArrowLeftRight}
          title="Transfer Workspace Ownership"
          description={
            transferCandidates.length > 0
              ? 'Promote an active team member to Workspace Owner. Your account will become an Admin.'
              : 'Invite and activate another team member before transferring ownership (required prior to deleting an owned workspace account).'
          }
          action={
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isImpersonated || transferCandidates.length === 0}
              onClick={() => {
                setTargetOwnerId(transferCandidates[0]?.userId || '');
                setTransferConfirm('');
                setTransferDialogOpen(true);
              }}
              className="min-h-[40px] sm:min-h-[36px] border-[#9E2A2B]/50 text-[#9E2A2B] hover:bg-[#FFF8F6] cursor-pointer"
            >
              Transfer ownership
            </Button>
          }
        />
      )}

      {/* Remove/leave confirmation dialog */}
      <Dialog open={Boolean(memberToRemove)} onOpenChange={(o) => !o && setMemberToRemove(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#1F1A16] border-[#E4D9C8] dark:border-[#382F27]">
          <DialogHeader>
            <DialogTitle className="text-[#3D2B1F] dark:text-[#F5EFE6]">
              {memberToRemove?.userId === currentUserId ? 'Leave workspace?' : 'Remove team member?'}
            </DialogTitle>
            <DialogDescription className="text-[#6E5A48] dark:text-[#B8A896]">
              {memberToRemove?.userId === currentUserId
                ? `You will lose access to ${workspace.name} until re-invited.`
                : `${memberToRemove?.email} will immediately lose access to this workspace.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={() => setMemberToRemove(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmRemoveMember}
              disabled={removingMember}
              className="bg-[#9E2A2B] hover:bg-[#7F1D1D] text-white cursor-pointer"
            >
              {removingMember ? 'Removing...' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel subscription dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#1F1A16] border-[#E4D9C8] dark:border-[#382F27]">
          <DialogHeader>
            <DialogTitle className="text-[#3D2B1F] dark:text-[#F5EFE6]">
              Cancel {planDisplayName} renewal?
            </DialogTitle>
            <DialogDescription className="text-[#6E5A48] dark:text-[#B8A896]">
              Your workspace keeps {planDisplayName} features until the end of the current paid period, then moves to Spark.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep plan
            </Button>
            <Button
              type="button"
              disabled={cancellingPlan}
              onClick={handleCancelSubscription}
              className="bg-[#9E2A2B] hover:bg-[#7F1D1D] text-white cursor-pointer"
            >
              {cancellingPlan ? 'Cancelling...' : 'Confirm cancellation'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer ownership dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#1F1A16] border-[#E4D9C8] dark:border-[#382F27]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#9E2A2B] dark:text-[#EF9A9A]">
              <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
              Transfer ownership of {workspace.name}
            </DialogTitle>
            <DialogDescription className="text-[#6E5A48] dark:text-[#B8A896]">
              Select the active member who will become the sole owner. Only the new owner can manage billing cancellation or transfer ownership again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label htmlFor="transfer-member-select" className="block text-[12px] font-medium mb-1">
                New owner
              </label>
              <select
                id="transfer-member-select"
                value={targetOwnerId}
                onChange={(e) => setTargetOwnerId(e.target.value)}
                className="w-full min-h-[40px] rounded-lg border border-[#E4D9C8] dark:border-[#382F27] bg-white dark:bg-[#1F1A16] px-3 text-[13px]"
              >
                {transferCandidates.map((m) => (
                  <option key={m.id} value={m.userId || ''}>
                    {m.fullName ? `${m.fullName} (${m.email})` : m.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="transfer-confirm-input" className="block text-[12px] font-medium mb-1">
                Type <strong>TRANSFER</strong> to confirm
              </label>
              <Input
                id="transfer-confirm-input"
                value={transferConfirm}
                onChange={(e) => setTransferConfirm(e.target.value)}
                placeholder="TRANSFER"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setTransferDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={transferring || transferConfirm !== 'TRANSFER' || !targetOwnerId}
              onClick={handleTransferOwnership}
              className="bg-[#9E2A2B] hover:bg-[#7F1D1D] text-white cursor-pointer"
            >
              {transferring ? 'Transferring...' : 'Transfer ownership'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
