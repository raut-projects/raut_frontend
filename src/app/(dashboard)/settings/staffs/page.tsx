"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  EllipsisVertical,
  KeyRound,
  Plus,
  ShieldCheck,
  UserRound,
  UserX,
} from "lucide-react";

import { Can } from "@/components/Can";
import { InviteStaffDialog } from "@/components/staffs/InviteStaffDialog";
import { ManageStaffDialog } from "@/components/staffs/ManageStaffDialog";
import { StaffInvitationsPanel } from "@/components/staffs/StaffInvitationsPanel";
import { AdminRoleBadge } from "@/components/staffs/AdminRoleBadge";
import { AdminUserStatusBadge } from "@/components/statusBadges";
import { ReasonDialog } from "@/components/reasonDialog";
import { RefreshIndicator } from "@/components/queryStates";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useClampPage } from "@/hooks/useClampPage";
import { useSession } from "@/hooks/useSession";
import {
  useDeactivateStaff,
  useStaff,
  useStaffInvitations,
} from "@/hooks/useStaff";
import {
  formatPhone,
  initialsFromName,
  normalizePhone,
} from "@/lib/adminUsers";
import { PERMISSIONS } from "@/lib/permissions";
import { usePageViewField } from "@/store/pageViewStore";
import type { StaffInvitationStatus, StaffMember } from "@/types/staff";

const PAGE_SIZE = 20;

type StaffView = "staff" | "invitations";

function AdminUsersPage() {
  const router = useRouter();
  const session = useSession();
  const [page, setPage] = usePageViewField("adminUsers", "page");
  const [view, setView] = usePageViewField("adminUsers", "view");
  const [invitationStatus, setInvitationStatus] = usePageViewField(
    "adminUsers",
    "invitationStatus",
  );
  const [invitationPage, setInvitationPage] = usePageViewField(
    "adminUsers",
    "invitationPage",
  );

  const [inviteOpen, setInviteOpen] = useState(false);
  const [manageTarget, setManageTarget] = useState<StaffMember | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<StaffMember | null>(
    null,
  );
  const [deactivateReason, setDeactivateReason] = useState("");

  const deactivateMutation = useDeactivateStaff();

  const params = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
    }),
    [page],
  );

  const staffQuery = useStaff(params);

  const invitationParams = useMemo(
    () => ({
      status: invitationStatus,
      page: invitationPage,
      pageSize: PAGE_SIZE,
    }),
    [invitationPage, invitationStatus],
  );
  const invitationsQuery = useStaffInvitations(invitationParams);

  const staff = staffQuery.data?.items ?? [];
  const total = staffQuery.data?.total ?? 0;
  const totalPages =
    staffQuery.data?.totalPages ?? Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const rangeStart = total === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + PAGE_SIZE, total);
  const rangeLabel =
    rangeEnd > rangeStart ? `${rangeStart}-${rangeEnd}` : String(rangeStart);

  useClampPage(page, totalPages, setPage);

  const invitationTotal = invitationsQuery.data?.total ?? 0;
  const invitationTotalPages = Math.max(
    1,
    invitationsQuery.data?.totalPages ??
    Math.max(1, Math.ceil(invitationTotal / PAGE_SIZE)),
  );
  const invitationCurrentPage = Math.min(
    invitationTotalPages,
    Math.max(1, invitationPage),
  );

  useClampPage(invitationPage, invitationTotalPages, setInvitationPage);

  const sessionId = session?.id != null ? String(session.id) : "";
  const sessionPhone = normalizePhone(session?.phone).slice(-9);

  const isCurrentUser = (member: StaffMember) =>
    (Boolean(sessionId) && String(member.id) === sessionId) ||
    (sessionPhone.length === 9 &&
      normalizePhone(member.phone).slice(-9) === sessionPhone);

  const openPermissionsPage = () => {
    router.push("/settings/staffs/permissions");
  };

  const handleInvitationStatusChange = (
    next: StaffInvitationStatus | "all",
  ) => {
    setInvitationStatus(next);
    setInvitationPage(1);
  };

  const closeDeactivate = () => {
    setDeactivateTarget(null);
    setDeactivateReason("");
  };

  const confirmDeactivate = (reason: string) => {
    if (!deactivateTarget) return;

    deactivateMutation.mutate(
      { userId: deactivateTarget.id, reason },
      {
        onSuccess: () => {
          closeDeactivate();
        },
      },
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Staff Management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage staff roles, scopes and account status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RefreshIndicator
            isFetching={
              view === "invitations"
                ? invitationsQuery.isFetching
                : staffQuery.isFetching
            }
            updatedAt={
              view === "invitations"
                ? invitationsQuery.dataUpdatedAt
                : staffQuery.dataUpdatedAt
            }
            onRefresh={ () =>
              void (view === "invitations"
                ? invitationsQuery.refetch()
                : staffQuery.refetch())
            }
          />
          <Can permission={PERMISSIONS.PLATFORM_ROLES_READ}>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Link href="/settings/staffs/permissions">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Permissions
              </Link>
            </Button>
          </Can>
          <Can permission={PERMISSIONS.PLATFORM_ROLES_READ}>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Link href="/settings/staffs/roles">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Roles
              </Link>
            </Button>
          </Can>
          <Can permission={ PERMISSIONS.PLATFORM_ADMINS_MANAGE }>
            <Button
              type="button"
              size="sm"
              onClick={ () => setInviteOpen(true) }
              className="h-9 px-3 text-sm font-semibold"
            >
              <Plus className="size-4" aria-hidden="true" />
              Invite staff
            </Button>
          </Can>
        </div>
      </div>

      <Tabs value={ view } onValueChange={ (next) => setView(next as StaffView) }>
        <TabsList>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>

        <TabsContent value="staff">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:px-5">
              <p className="text-xs text-slate-500">
                Showing{ " " }
                <span className="font-semibold text-slate-700">{ rangeLabel }</span> of{ " " }
                <span className="font-semibold text-slate-700">{ total }</span> staff
              </p>
              <p className="text-xs text-slate-400">
                Page { currentPage } of { totalPages }
              </p>
            </div>

            <Table>
              <TableHeader className="bg-slate-50 [&_tr]:border-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Staff</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Scope</TableHead>
                  <TableHead className="w-12 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                { staffQuery.isError && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={ 5 }
                      className="px-4 py-12 text-center whitespace-normal"
                    >
                      <p className="text-sm font-medium text-rose-700">
                        { staffQuery.error instanceof Error
                          ? staffQuery.error.message
                          : "Staff could not be loaded." }
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={ () => void staffQuery.refetch() }
                        className="mt-3"
                      >
                        Try again
                      </Button>
                    </TableCell>
                  </TableRow>
                ) }

                { staffQuery.isPending && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={ 5 } className="px-4 py-12 text-center">
                      <span className="text-sm text-slate-500">
                        Loading staff.
                      </span>
                    </TableCell>
                  </TableRow>
                ) }

                { staff.map((member) => {
                  const current = isCurrentUser(member);
                  const primary = member.assignments[0];
                  const roleKey = primary?.roleKey ?? "";

                  return (
                    <TableRow
                      key={ member.id }
                      className={ current ? "bg-brand-50/40 hover:bg-brand-50/60" : "" }
                    >
                      <TableCell className="whitespace-normal">
                        <div className="flex items-center gap-3">
                          <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 sm:flex sm:h-10 sm:w-10">
                            <svg
                              className="h-5 w-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                              />
                            </svg>
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="truncate font-medium text-slate-900">
                                { member.name }
                              </span>
                              { current && (
                                <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[0.65rem] font-semibold text-brand-700">
                                  You
                                </span>
                              ) }
                            </div>
                            <span className="mt-0.5 block truncate text-xs text-slate-500">
                              { member.email || formatPhone(member.phone) || "—" }
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          { roleKey ? (
                            <AdminRoleBadge role={ roleKey } />
                          ) : (
                            <span className="text-xs text-slate-400">Unassigned</span>
                          ) }
                          { member.assignments.length > 1 ? (
                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[0.65rem] font-semibold text-slate-600">
                              +{ member.assignments.length - 1 }
                            </span>
                          ) : null }
                        </div>
                      </TableCell>

                      <TableCell>
                        <AdminUserStatusBadge status={ member.status } />
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        <span className="text-sm text-slate-600">
                          { primary?.scope ?? "—" }
                        </span>
                        { primary?.scopeId ? (
                          <span className="block text-xs text-slate-400">
                            { primary.scopeId }
                          </span>
                        ) : null }
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                              aria-label={ `Actions for ${member.name}` }
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
                            <Can permission={ PERMISSIONS.PLATFORM_ADMINS_MANAGE }>
                              <DropdownMenuItem
                                onSelect={ () => setManageTarget(member) }
                                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                              >
                                <UserRound className="size-3.5" aria-hidden="true" />
                                Manage access
                              </DropdownMenuItem>
                            </Can>
                            <Can permission={PERMISSIONS.PLATFORM_ROLES_READ}>
                              <DropdownMenuItem
                                onSelect={openPermissionsPage}
                                className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                              >
                                <KeyRound className="size-3.5" aria-hidden="true" />
                                View permissions
                              </DropdownMenuItem>
                            </Can>
                            <Can permission={ PERMISSIONS.PLATFORM_ADMINS_MANAGE }>
                              <DropdownMenuSeparator className="bg-slate-100" />
                              { member.status === "deactivated" ? (
                                <DropdownMenuItem
                                  disabled
                                  title="Reactivate is unavailable until the backend endpoint exists."
                                  className="px-2.5 py-1.5 text-xs font-medium text-slate-400"
                                >
                                  <ShieldCheck
                                    className="size-3.5"
                                    aria-hidden="true"
                                  />
                                  Reactivate account
                                </DropdownMenuItem>
                              ) : member.status === "invited" ? (
                                <DropdownMenuItem
                                  onSelect={ () => setView("invitations") }
                                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                                >
                                  <UserX className="size-3.5" aria-hidden="true" />
                                  View invitations
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  disabled={ current }
                                  onSelect={ () => {
                                    if (!current) {
                                      setDeactivateReason("");
                                      setDeactivateTarget(member);
                                    }
                                  } }
                                  className="px-2.5 py-1.5 text-xs font-medium text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                                >
                                  <UserX className="size-3.5" aria-hidden="true" />
                                  Deactivate account
                                </DropdownMenuItem>
                              ) }
                            </Can>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                }) }

                { !staffQuery.isError &&
                  !staffQuery.isPending &&
                  staff.length === 0 && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={ 5 }
                        className="px-4 py-12 text-center whitespace-normal"
                      >
                        <p className="text-sm font-medium text-slate-700">
                          No staff found.
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Invite a staff member to grant dashboard access.
                        </p>
                        <Can permission={ PERMISSIONS.PLATFORM_ADMINS_MANAGE }>
                          <Button
                            type="button"
                            size="sm"
                            onClick={ () => setInviteOpen(true) }
                            className="mt-3 h-auto px-3 py-1.5 text-xs font-semibold"
                          >
                            <Plus className="size-3.5" aria-hidden="true" />
                            Invite staff
                          </Button>
                        </Can>
                      </TableCell>
                    </TableRow>
                  ) }
              </TableBody>
            </Table>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3.5 sm:px-5">
              <p className="text-xs text-slate-500">
                Showing{ " " }
                <span className="font-semibold text-slate-700">{ rangeLabel }</span> of{ " " }
                <span className="font-semibold text-slate-700">{ total }</span> staff
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={ () => setPage(Math.max(1, currentPage - 1)) }
                  disabled={ currentPage <= 1 }
                  className="h-auto border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:text-slate-400 disabled:opacity-100"
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={ () =>
                    setPage(Math.min(totalPages, Math.max(1, currentPage + 1)))
                  }
                  disabled={ currentPage >= totalPages }
                  className="h-auto border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:text-slate-400 disabled:opacity-100"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="invitations">
          <StaffInvitationsPanel
            query={invitationsQuery}
            status={invitationStatus}
            onStatusChange={handleInvitationStatusChange}
            currentPage={invitationCurrentPage}
            totalPages={invitationTotalPages}
            onPageChange={setInvitationPage}
            onViewPermissions={openPermissionsPage}
          />
        </TabsContent>
      </Tabs>

      <InviteStaffDialog
        open={ inviteOpen }
        onClose={ () => setInviteOpen(false) }
      />

      <ManageStaffDialog
        key={ `${manageTarget?.id ?? "none"}-${Boolean(manageTarget)}` }
        open={ Boolean(manageTarget) }
        staff={ manageTarget }
        isSelf={ Boolean(manageTarget && isCurrentUser(manageTarget)) }
        onClose={ () => setManageTarget(null) }
      />



      <ReasonDialog
        open={ Boolean(deactivateTarget) }
        onClose={ closeDeactivate }
        title={
          deactivateTarget
            ? `Deactivate ${deactivateTarget.name}?`
            : "Deactivate staff"
        }
        description="They will lose dashboard access immediately."
        confirmLabel="Deactivate"
        tone="danger"
        value={ deactivateReason }
        onChange={ setDeactivateReason }
        pending={ deactivateMutation.isPending }
        onConfirm={ confirmDeactivate }
      >
        { deactivateTarget && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <p className="font-semibold">{ deactivateTarget.name }</p>
            <p className="mt-0.5 text-xs text-rose-700">
              { deactivateTarget.email || formatPhone(deactivateTarget.phone) }{ " " }
              &middot; { deactivateTarget.id }
            </p>
            <p className="mt-2 text-xs text-rose-700">
              The account and its history are kept.
            </p>
          </div>
        ) }
      </ReasonDialog>
    </div>
  );
}

export default AdminUsersPage;
