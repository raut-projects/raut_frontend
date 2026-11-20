"use client";

import { useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { EllipsisVertical, KeyRound, RotateCcw, UserX } from "lucide-react";

import { InvitationStatusBadge } from "@/components/adminUsers/InvitationStatusBadge";
import { AdminRoleBadge } from "@/components/adminUsers/AdminUserStatusBadge";
import { ReasonDialog } from "@/components/reasonDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCancelStaffInvitation,
  useResendStaffInvitation,
} from "@/hooks/useStaff";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate } from "@/services/mappers";
import type {
  StaffInvitation,
  StaffInvitationListResult,
  StaffInvitationStatus,
} from "@/types/staff";

const STATUS_FILTERS: Array<StaffInvitationStatus | "all"> = [
  "all",
  "pending",
  "accepted",
  "cancelled",
  "expired",
];

const FILTER_LABELS: Record<StaffInvitationStatus | "all", string> = {
  all: "All",
  pending: "Pending",
  accepted: "Accepted",
  cancelled: "Cancelled",
  expired: "Expired",
};

type StaffInvitationsPanelProps = {
  query: UseQueryResult<StaffInvitationListResult, Error>;
  status: StaffInvitationStatus | "all";
  onStatusChange: (status: StaffInvitationStatus | "all") => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewPermissions: (roleKey: string) => void;
};

export function StaffInvitationsPanel({
  query,
  status,
  onStatusChange,
  currentPage,
  totalPages,
  onPageChange,
  onViewPermissions,
}: StaffInvitationsPanelProps) {
  const { has } = usePermissions();
  const canManage = has(PERMISSIONS.PLATFORM_ADMINS_MANAGE);
  const canReadRoles = has(PERMISSIONS.PLATFORM_ROLES_READ);
  const cancelMutation = useCancelStaffInvitation();
  const resendMutation = useResendStaffInvitation();
  const [cancelTarget, setCancelTarget] = useState<StaffInvitation | null>(
    null,
  );
  const [cancelReason, setCancelReason] = useState("");

  const invitations = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const pageSize = query.data?.pageSize ?? 20;
  const startIndex = (currentPage - 1) * pageSize;
  const rangeStart = total === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + pageSize, total);
  const rangeLabel =
    rangeEnd > rangeStart ? `${rangeStart}-${rangeEnd}` : String(rangeStart);

  const closeCancel = () => {
    setCancelTarget(null);
    setCancelReason("");
  };

  const confirmCancel = (reason: string) => {
    if (!cancelTarget) return;

    cancelMutation.mutate(
      { invitationId: cancelTarget.id, reason },
      { onSuccess: closeCancel },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-card">
        <span className="mr-1 text-xs font-semibold text-slate-500">
          Status
        </span>
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            aria-pressed={status === filter}
            onClick={() => onStatusChange(filter)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              status === filter
                ? "border-brand-200 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            {FILTER_LABELS[filter]}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:px-5">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">{rangeLabel}</span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">{total}</span>{" "}
            invitations
          </p>
          <p className="text-xs text-slate-400">
            Page {currentPage} of {totalPages}
          </p>
        </div>

        <Table>
          <TableHeader className="bg-slate-50 [&_tr]:border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableHead>Invitation</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Scope</TableHead>
              <TableHead className="hidden lg:table-cell">Expires</TableHead>
              <TableHead className="w-12 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {query.isError && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="px-4 py-12 text-center whitespace-normal"
                >
                  <p className="text-sm font-medium text-rose-700">
                    {query.error instanceof Error
                      ? query.error.message
                      : "Invitations could not be loaded."}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void query.refetch()}
                    className="mt-3"
                  >
                    Try again
                  </Button>
                </TableCell>
              </TableRow>
            )}

            {query.isPending && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="px-4 py-12 text-center">
                  <span className="text-sm text-slate-500">
                    Loading invitations.
                  </span>
                </TableCell>
              </TableRow>
            )}

            {invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell className="whitespace-normal">
                  <div className="min-w-0">
                    <span className="block truncate font-medium text-slate-900">
                      {invitation.fullName || invitation.email}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {invitation.email}
                    </span>
                    {invitation.cancellationReason ? (
                      <span className="mt-0.5 block truncate text-xs text-rose-600">
                        {invitation.cancellationReason}
                      </span>
                    ) : null}
                  </div>
                </TableCell>

                <TableCell>
                  {invitation.roleKey ? (
                    <AdminRoleBadge role={invitation.roleKey} />
                  ) : (
                    <span className="text-xs text-slate-400">
                      {invitation.roleName || "Unknown role"}
                    </span>
                  )}
                </TableCell>

                <TableCell>
                  <InvitationStatusBadge status={invitation.status} />
                </TableCell>

                <TableCell className="hidden md:table-cell">
                  <span className="text-sm capitalize text-slate-600">
                    {invitation.scopeType}
                  </span>
                  {invitation.scopeId ? (
                    <span className="block text-xs text-slate-400">
                      {invitation.scopeId}
                    </span>
                  ) : null}
                </TableCell>

                <TableCell className="hidden lg:table-cell">
                  <span className="text-sm text-slate-600">
                    {formatDate(
                      invitation.assignmentExpiresAt ??
                        invitation.invitationExpiresAt,
                    )}
                  </span>
                  <span className="block text-xs text-slate-400">
                    {invitation.assignmentExpiresAt ? "Access" : "Invitation"}
                  </span>
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        aria-label={`Actions for ${invitation.email}`}
                      >
                        <EllipsisVertical
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-52 rounded-lg border border-slate-200 bg-white p-1 shadow-elevated ring-0"
                    >
                      {canReadRoles && invitation.roleKey ? (
                        <DropdownMenuItem
                          onSelect={() => onViewPermissions(invitation.roleKey)}
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                        >
                          <KeyRound className="size-3.5" aria-hidden="true" />
                          View permissions
                        </DropdownMenuItem>
                      ) : null}
                      {canManage && invitation.status !== "accepted" ? (
                        <>
                          {canReadRoles && invitation.roleKey ? (
                            <DropdownMenuSeparator className="bg-slate-100" />
                          ) : null}
                          <DropdownMenuItem
                            disabled={resendMutation.isPending}
                            onSelect={() =>
                              resendMutation.mutate(invitation.id)
                            }
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                          >
                            <RotateCcw
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            Resend invitation
                          </DropdownMenuItem>
                          {invitation.status === "pending" ? (
                            <DropdownMenuItem
                              onSelect={() => {
                                setCancelReason("");
                                setCancelTarget(invitation);
                              }}
                              className="px-2.5 py-1.5 text-xs font-medium text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                            >
                              <UserX className="size-3.5" aria-hidden="true" />
                              Cancel invitation
                            </DropdownMenuItem>
                          ) : null}
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {!query.isError &&
              !query.isPending &&
              invitations.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="px-4 py-12 text-center whitespace-normal"
                  >
                    <p className="text-sm font-medium text-slate-700">
                      No invitations found.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try another status or invite a new staff member.
                    </p>
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3.5 sm:px-5">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">{rangeLabel}</span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">{total}</span>{" "}
            invitations
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="h-auto border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:text-slate-400 disabled:opacity-100"
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="h-auto border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:text-slate-400 disabled:opacity-100"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <ReasonDialog
        open={Boolean(cancelTarget)}
        onClose={closeCancel}
        title={cancelTarget ? `Cancel ${cancelTarget.email}?` : "Cancel invitation"}
        description="This Invitation link will no longer work."
        confirmLabel="Cancel invitation"
        tone="danger"
        value={cancelReason}
        onChange={setCancelReason}
        pending={cancelMutation.isPending}
        onConfirm={confirmCancel}
      >
        {cancelTarget && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <p className="font-semibold">
              {cancelTarget.fullName || cancelTarget.email}
            </p>
            <p className="mt-0.5 text-xs text-rose-700">{cancelTarget.email}</p>
          </div>
        )}
      </ReasonDialog>
    </div>
  );
}
