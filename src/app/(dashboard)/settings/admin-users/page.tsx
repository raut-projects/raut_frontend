"use client";

import { useMemo, useState } from "react";
import {
  EllipsisVertical,
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  UserX,
} from "lucide-react";

import { EditAdminDialog } from "@/components/adminUsers/EditAdminDialog";
import { InviteAdminDialog } from "@/components/adminUsers/InviteAdminDialog";
import { PermissionMatrixDialog } from "@/components/adminUsers/PermissionMatrixDialog";
import {
  AdminRoleBadge,
  AdminUserStatusBadge,
} from "@/components/adminUsers/AdminUserStatusBadge";
import { AdminUsersTabs } from "@/components/adminUsers/AdminUsersTabs";
import { ConfirmDialog } from "@/components/reasonDialog";
import { RefreshIndicator } from "@/components/queryStates";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useClampPage } from "@/hooks/useClampPage";
import {
  useAdminUsers,
  useDeactivateAdminUser,
  useReactivateAdminUser,
} from "@/hooks/useAdminUsers";
import { useSession } from "@/hooks/useSession";
import {
  formatLastLogin,
  formatPhone,
  initialsFromName,
  normalizePhone,
  type AdminRoleKey,
  type AdminUser,
  type AdminUserStatus,
} from "@/lib/adminUsers";
import { usePageViewField } from "@/store/pageViewStore";

const PAGE_SIZE = 20;

function AdminUsersPage() {
  const session = useSession();
  const [status, setStatus] = usePageViewField("adminUsers", "status");
  const [search, setSearch] = usePageViewField("adminUsers", "search");
  const [page, setPage] = usePageViewField("adminUsers", "page");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [matrixOpen, setMatrixOpen] = useState(false);
  const [matrixRole, setMatrixRole] = useState<AdminRoleKey | "all">("all");
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUser | null>(
    null,
  );
  const [reactivateTarget, setReactivateTarget] = useState<AdminUser | null>(
    null,
  );

  const deactivateMutation = useDeactivateAdminUser();
  const reactivateMutation = useReactivateAdminUser();

  const debouncedSearch = useDebouncedValue(search, 300);
  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      status,
    }),
    [debouncedSearch, page, status],
  );

  const usersQuery = useAdminUsers(params);
  const activeCountQuery = useAdminUsers({
    status: "active",
    search: debouncedSearch,
    page: 1,
    limit: 1,
  });
  const invitedCountQuery = useAdminUsers({
    status: "invited",
    search: debouncedSearch,
    page: 1,
    limit: 1,
  });
  const deactivatedCountQuery = useAdminUsers({
    status: "deactivated",
    search: debouncedSearch,
    page: 1,
    limit: 1,
  });

  const users = usersQuery.data?.items ?? [];
  const total = usersQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const rangeStart = total === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + PAGE_SIZE, total);
  const rangeLabel =
    rangeEnd > rangeStart ? `${rangeStart}-${rangeEnd}` : String(rangeStart);

  const counts: Record<AdminUserStatus, number> = {
    active: activeCountQuery.data?.total ?? 0,
    invited: invitedCountQuery.data?.total ?? 0,
    deactivated: deactivatedCountQuery.data?.total ?? 0,
  };

  useClampPage(page, totalPages, setPage);

  const sessionId = session?.id != null ? String(session.id) : "";
  const sessionPhone = normalizePhone(session?.phone).slice(-9);

  const isCurrentUser = (user: AdminUser) =>
    (Boolean(sessionId) && String(user.id) === sessionId) ||
    (sessionPhone.length === 9 &&
      normalizePhone(user.phone).slice(-9) === sessionPhone);

  const openMatrix = (role: AdminRoleKey | "all" = "all") => {
    setMatrixRole(role);
    setMatrixOpen(true);
  };

  const changeStatus = (next: AdminUserStatus) => {
    setStatus(next);
    setPage(1);
  };

  const onSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const confirmDeactivate = () => {
    if (!deactivateTarget) return;

    deactivateMutation.mutate(
      { userId: deactivateTarget.id },
      {
        onSuccess: () => {
          setDeactivateTarget(null);
        },
      },
    );
  };

  const confirmReactivate = () => {
    if (!reactivateTarget) return;

    reactivateMutation.mutate(
      { userId: reactivateTarget.id },
      {
        onSuccess: () => {
          setReactivateTarget(null);
        },
      },
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Admin User Management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Invite teammates, assign roles and control what they can access.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RefreshIndicator
            isFetching={ usersQuery.isFetching }
            updatedAt={ usersQuery.dataUpdatedAt }
            onRefresh={ () => void usersQuery.refetch() }
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={ () => openMatrix() }
            className="h-9 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ShieldCheck className="size-4" aria-hidden="true" />
            Permissions
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={ () => setInviteOpen(true) }
            className="h-9 px-3 text-sm font-semibold"
          >
            <Plus className="size-4" aria-hidden="true" />
            Invite admin
          </Button>
        </div>
      </div>

      <AdminUsersTabs value={ status } counts={ counts } onChange={ changeStatus } />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={ search }
            onChange={ onSearchChange }
            placeholder="Search by name, email, phone or admin ID."
            aria-label="Search admin users"
            className="h-9 bg-white pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:px-5">
          <p className="text-xs text-slate-500">
            Showing{ " " }
            <span className="font-semibold text-slate-700">{ rangeLabel }</span>{ " " }
            of <span className="font-semibold text-slate-700">{ total }</span>{ " " }
            admin{ total === 1 ? "" : "s" }
          </p>
          <p className="text-xs text-slate-400">
            { counts.active } active &middot; { counts.invited } invited &middot;{ " " }
            { counts.deactivated } deactivated
          </p>
        </div>

        <Table>
          <TableHeader className="bg-slate-50 [&_tr]:border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableHead>Admin</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Last login</TableHead>
              <TableHead className="w-12 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            { usersQuery.isError && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={ 5 }
                  className="px-4 py-12 text-center whitespace-normal"
                >
                  <p className="text-sm font-medium text-rose-700">
                    { usersQuery.error instanceof Error
                      ? usersQuery.error.message
                      : "Admin users could not be loaded." }
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={ () => void usersQuery.refetch() }
                    className="mt-3"
                  >
                    Try again
                  </Button>
                </TableCell>
              </TableRow>
            ) }

            { usersQuery.isPending && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={ 5 } className="px-4 py-12 text-center">
                  <span className="text-sm text-slate-500">
                    Loading admin users.
                  </span>
                </TableCell>
              </TableRow>
            ) }

            { users.map((user) => {
              const current = isCurrentUser(user);

              return (
                <TableRow
                  key={ user.id }
                  className={ current ? "bg-brand-50/40 hover:bg-brand-50/60" : "" }
                >
                  <TableCell className="whitespace-normal">
                    <div className="flex flex-wrap items-center gap-3">
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
                            { user.name }
                          </span>
                          { current && (
                            <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[0.65rem] font-semibold text-brand-700">
                              You
                            </span>
                          ) }
                          { user.isOnline && user.status === "active" && (
                            <span
                              className="inline-flex items-center gap-1 text-[0.65rem] font-medium text-emerald-600"
                              title="Online now"
                            >
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Online
                            </span>
                          ) }
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <AdminRoleBadge role={ user.role } />
                  </TableCell>

                  <TableCell>
                    <AdminUserStatusBadge status={ user.status } />
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    <span className="block text-slate-600">
                      { formatLastLogin(user.lastLoginAt, user.isOnline) }
                    </span>
                    {/* <span className="block text-xs text-slate-400">
                      { user.twoFactorRequired ? "2FA on" : "2FA off" }
                    </span> */}
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                          aria-label={ `Actions for ${user.name}` }
                        >
                          <EllipsisVertical
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-elevated ring-0"
                      >
                        <DropdownMenuItem
                          onSelect={ () => setEditingUser(user) }
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                        >
                          <UserRound className="size-3.5" aria-hidden="true" />
                          Edit access
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={ () => openMatrix(user.role) }
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 focus:bg-slate-50 focus:text-slate-700"
                        >
                          <KeyRound className="size-3.5" aria-hidden="true" />
                          View permissions
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-100" />
                        { user.status === "deactivated" ? (
                          <DropdownMenuItem
                            onSelect={ () => setReactivateTarget(user) }
                            className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 focus:bg-emerald-50 focus:text-emerald-800"
                          >
                            <ShieldCheck
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            Reactivate account
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            disabled={ current }
                            onSelect={ () => {
                              if (!current) setDeactivateTarget(user);
                            } }
                            className="px-2.5 py-1.5 text-xs font-medium text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                          >
                            <UserX className="size-3.5" aria-hidden="true" />
                            { user.status === "invited"
                              ? "Cancel invitation"
                              : "Deactivate account" }
                          </DropdownMenuItem>
                        ) }
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            }) }

            { !usersQuery.isError &&
              !usersQuery.isPending &&
              users.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={ 5 }
                    className="px-4 py-12 text-center whitespace-normal"
                  >
                    <p className="text-sm font-medium text-slate-700">
                      No { status } admins found.
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      { search.trim()
                        ? "Try a different search or invite a new admin."
                        : "Invite a teammate to give them dashboard access." }
                    </p>
                    <div className="mt-3 flex justify-center gap-2">
                      { search.trim() && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={ () => {
                            setSearch("");
                            setPage(1);
                          } }
                          className="h-auto border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Clear search
                        </Button>
                      ) }
                      <Button
                        type="button"
                        size="sm"
                        onClick={ () => setInviteOpen(true) }
                        className="h-auto px-3 py-1.5 text-xs font-semibold"
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                        Invite admin
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) }
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3.5 sm:px-5">
          <p className="text-xs text-slate-500">
            Showing{ " " }
            <span className="font-semibold text-slate-700">{ rangeLabel }</span>{ " " }
            of <span className="font-semibold text-slate-700">{ total }</span>{ " " }
            admin{ total === 1 ? "" : "s" }
            { totalPages > 1 && (
              <>
                { " " }
                &middot; Page{ " " }
                <span className="font-semibold text-slate-700">
                  { currentPage }
                </span>{ " " }
                of{ " " }
                <span className="font-semibold text-slate-700">
                  { totalPages }
                </span>
              </>
            ) }
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
              onClick={ () => setPage(Math.min(totalPages, currentPage + 1)) }
              disabled={ currentPage >= totalPages }
              className="h-auto border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:text-slate-400 disabled:opacity-100"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <InviteAdminDialog
        open={ inviteOpen }
        onClose={ () => setInviteOpen(false) }
        onViewMatrix={ () => openMatrix() }
        onInvited={ () => {
          setStatus("invited");
          setPage(1);
        } }
      />

      <EditAdminDialog
        key={ `${editingUser?.id ?? "none"}-${Boolean(editingUser)}` }
        open={ Boolean(editingUser) }
        user={ editingUser }
        isSelf={ Boolean(editingUser && isCurrentUser(editingUser)) }
        onClose={ () => setEditingUser(null) }
      />

      <PermissionMatrixDialog
        key={ `${matrixOpen}-${matrixRole}` }
        open={ matrixOpen }
        initialRole={ matrixRole }
        onClose={ () => setMatrixOpen(false) }
      />

      <ConfirmDialog
        open={ Boolean(deactivateTarget) }
        onClose={ () => setDeactivateTarget(null) }
        title={
          deactivateTarget
            ? `Deactivate ${deactivateTarget.name}?`
            : "Deactivate admin"
        }
        description="They will lose dashboard access immediately."
        confirmLabel="Deactivate"
        tone="danger"
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
              The account and its history are kept. You can reactivate it at any
              time.
            </p>
          </div>
        ) }
      </ConfirmDialog>

      <ConfirmDialog
        open={ Boolean(reactivateTarget) }
        onClose={ () => setReactivateTarget(null) }
        title={
          reactivateTarget
            ? `Reactivate ${reactivateTarget.name}?`
            : "Reactivate admin"
        }
        description="They will be able to sign in again with their existing role."
        confirmLabel="Reactivate"
        pending={ reactivateMutation.isPending }
        onConfirm={ confirmReactivate }
      >
        { reactivateTarget && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <p className="font-semibold">{ reactivateTarget.name }</p>
            <p className="mt-0.5 text-xs text-emerald-700">
              { reactivateTarget.email || formatPhone(reactivateTarget.phone) }
            </p>
          </div>
        ) }
      </ConfirmDialog>
    </div>
  );
}

export default AdminUsersPage;
