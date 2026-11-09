"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { BulkEditReferralDialog } from "@/components/marketing/BulkEditReferralDialog";
import { BulkSendReferralDialog } from "@/components/marketing/BulkSendReferralDialog";
import { CreateReferralDialog } from "@/components/marketing/CreateReferralDialog";
import { EditReferralDialog } from "@/components/marketing/EditReferralDialog";
import { MockDataBadge } from "@/components/marketing/MockDataBadge";
import { ReferralBulkActions } from "@/components/marketing/ReferralBulkActions";
import { ReferralCodeStatsCards } from "@/components/marketing/ReferralCodeStatsCards";
import { ReferralCodesTable } from "@/components/marketing/ReferralCodesTable";
import {
  ReferralCreatedDialog,
  type ReferralCreatedDetails,
} from "@/components/marketing/ReferralCreatedDialog";
import { ReferralDetailsDialog } from "@/components/marketing/ReferralDetailsDialog";
import { ReferralTabs } from "@/components/marketing/ReferralTabs";
import { SendReferralDialog } from "@/components/marketing/SendReferralDialog";
import { QueryError, RefreshIndicator } from "@/components/queryStates";
import { ConfirmDialog } from "@/components/reasonDialog";
import { useToast } from "@/components/toastContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useClampPage } from "@/hooks/useClampPage";
import {
  useBulkDeleteReferralCodes,
  useBulkUpdateReferralCodes,
  useDeleteReferralCode,
  useReferralCodeStats,
  useReferralCodes,
  useUpdateReferralCode,
  type ReferralBulkResult,
} from "@/hooks/useMarketing";
import {
  partitionReferralCodesForBulkAction,
  REFERRAL_DATE_PRESETS,
  REFERRAL_USER_TYPE_LABELS,
  resolveReferralDateRange,
  type ReferralBulkAction,
  type ReferralCode,
  type ReferralCodeCreateStatus,
  type ReferralCodeTab,
  type ReferralDatePreset,
  type ReferralUserTypeFilter,
} from "@/lib/referralCodes";
import { usePageViewField } from "@/store/pageViewStore";

const PAGE_SIZE = 10;
const EMPTY_REFERRAL_CODES: ReferralCode[] = [];

const selectClass =
  "h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

function StatsSkeleton() {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      { Array.from({ length: 4 }, (_, index) => (
        <div
          key={ index }
          className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card"
        >
          <Skeleton className="h-3 w-24 bg-slate-200" />
          <Skeleton className="h-7 w-20 bg-slate-200" />
          <Skeleton className="h-3 w-32 bg-slate-100" />
        </div>
      )) }
    </section>
  );
}

export default function ReferralsPage() {
  const toast = useToast();
  const [status, setStatus] = usePageViewField("marketingReferrals", "status");
  const [search, setSearch] = usePageViewField("marketingReferrals", "search");
  const [type, setType] = usePageViewField("marketingReferrals", "type");
  const [range, setRange] = usePageViewField("marketingReferrals", "range");
  const [from, setFrom] = usePageViewField("marketingReferrals", "from");
  const [to, setTo] = usePageViewField("marketingReferrals", "to");
  const [page, setPage] = usePageViewField("marketingReferrals", "page");
  const [createOpen, setCreateOpen] = useState(false);
  const [created, setCreated] = useState<ReferralCreatedDetails | null>(null);
  const [viewing, setViewing] = useState<ReferralCode | null>(null);
  const [editing, setEditing] = useState<ReferralCode | null>(null);
  const [sending, setSending] = useState<ReferralCode | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    code: ReferralCode;
    nextStatus: ReferralCodeCreateStatus;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReferralCode | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [bulkConfirm, setBulkConfirm] = useState<{
    action: ReferralBulkAction;
    codes: ReferralCode[];
    skippedCount: number;
  } | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkSendOpen, setBulkSendOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);
  const resolvedRange = resolveReferralDateRange(range, from, to);
  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      status,
      type,
      from: resolvedRange.from,
      to: resolvedRange.to,
    }),
    [
      debouncedSearch,
      page,
      resolvedRange.from,
      resolvedRange.to,
      status,
      type,
    ],
  );

  const query = useReferralCodes(params);
  const statsQuery = useReferralCodeStats();
  const update = useUpdateReferralCode();
  const remove = useDeleteReferralCode();
  const bulkRemove = useBulkDeleteReferralCodes();
  const bulkUpdate = useBulkUpdateReferralCodes();
  const bulkPending = bulkRemove.isPending || bulkUpdate.isPending;
  const busyCodeId = update.isPending
    ? (update.variables?.code.id ?? null)
    : remove.isPending
      ? (remove.variables ?? null)
      : null;
  const codes = query.data?.items ?? EMPTY_REFERRAL_CODES;
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const rangeStart = total === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + PAGE_SIZE, total);
  const rangeLabel =
    rangeEnd > rangeStart ? `${rangeStart}-${rangeEnd}` : String(rangeStart);
  const hasFilters =
    status !== "all" ||
    type !== "all" ||
    range !== "all" ||
    Boolean(search.trim()) ||
    Boolean(from) ||
    Boolean(to);
  const selectedCodes = useMemo(
    () => codes.filter((code) => selectedIds.has(code.id)),
    [codes, selectedIds],
  );
  const bulkDelete = partitionReferralCodesForBulkAction(
    selectedCodes,
    "delete",
  );
  const bulkActivate = partitionReferralCodesForBulkAction(
    selectedCodes,
    "activate",
  );
  const bulkDeactivate = partitionReferralCodesForBulkAction(
    selectedCodes,
    "deactivate",
  );

  useClampPage(page, totalPages, setPage);

  const clearSelection = () => setSelectedIds(new Set());
  const changePage = (nextPage: number) => {
    clearSelection();
    setPage(nextPage);
  };

  const changeTab = (tab: ReferralCodeTab) => {
    clearSelection();
    setStatus(tab);
    setPage(1);
  };

  const clearFilters = () => {
    clearSelection();
    setStatus("all");
    setSearch("");
    setType("all");
    setRange("all");
    setFrom("");
    setTo("");
    setPage(1);
  };

  const changeSearch = (value: string) => {
    clearSelection();
    setSearch(value);
    setPage(1);
  };

  const changeType = (value: ReferralUserTypeFilter) => {
    clearSelection();
    setType(value);
    setPage(1);
  };

  const changeRange = (value: ReferralDatePreset) => {
    clearSelection();
    setRange(value);
    if (value !== "custom") {
      setFrom("");
      setTo("");
    }
    setPage(1);
  };

  const changeFrom = (value: string) => {
    clearSelection();
    setFrom(value);
    setPage(1);
  };

  const changeTo = (value: string) => {
    clearSelection();
    setTo(value);
    setPage(1);
  };

  const toggleSelect = (codeId: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);

      if (next.has(codeId)) next.delete(codeId);
      else next.add(codeId);

      return next;
    });
  };

  const toggleSelectAll = () => {
    if (codes.length > 0 && codes.every((code) => selectedIds.has(code.id))) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds(new Set(codes.map((code) => code.id)));
  };

  const removeSucceededFromSelection = (result: ReferralBulkResult) => {
    const succeededIds = new Set(result.succeeded);

    setSelectedIds((previous) => {
      const next = new Set<string>();

      previous.forEach((id) => {
        if (!succeededIds.has(id)) next.add(id);
      });

      return next;
    });
  };

  const openBulkConfirm = (action: ReferralBulkAction) => {
    const { eligible, skipped } = partitionReferralCodesForBulkAction(
      selectedCodes,
      action,
    );

    if (eligible.length === 0) return;

    setBulkConfirm({
      action,
      codes: eligible,
      skippedCount: skipped.length,
    });
  };

  const handleBulkConfirm = async () => {
    if (!bulkConfirm) return;

    const { action, codes: targetCodes, skippedCount } = bulkConfirm;
    const pastTense =
      action === "delete"
        ? "deleted"
        : action === "activate"
          ? "activated"
          : "deactivated";

    try {
      const outcome =
        action === "delete"
          ? await bulkRemove.mutateAsync(targetCodes)
          : await bulkUpdate.mutateAsync({
              codes: targetCodes,
              payload: {
                status: action === "activate" ? "active" : "inactive",
              },
            });

      if (outcome.succeeded.length > 0) {
        toast.success(
          `${outcome.succeeded.length} referral code${outcome.succeeded.length === 1 ? "" : "s"} ${pastTense}.`,
        );
      }

      if (outcome.failed.length > 0) {
        toast.error(
          `${outcome.failed.length} referral code${outcome.failed.length === 1 ? "" : "s"} could not be ${pastTense}. ${outcome.failed[0]?.message ?? ""}`.trim(),
        );
      }

      if (skippedCount > 0) {
        toast.toast(
          `${skippedCount} selected code${skippedCount === 1 ? "" : "s"} skipped as ineligible for this action.`,
          "info",
        );
      }

      removeSucceededFromSelection(outcome);
      setBulkConfirm(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not complete the bulk action.",
      );
    }
  };

  const handleStatusChange = async () => {
    if (!statusTarget) return;

    try {
      await update.mutateAsync({
        code: statusTarget.code,
        payload: { status: statusTarget.nextStatus },
      });
      toast.success(
        `${statusTarget.code.code} ${
          statusTarget.nextStatus === "active" ? "activated" : "deactivated"
        }.`,
      );
      setStatusTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not change the referral status.",
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await remove.mutateAsync(deleteTarget.id);
      toast.success(`${deleteTarget.code} deleted.`);
      setSelectedIds((previous) => {
        if (!previous.has(deleteTarget.id)) return previous;
        const next = new Set(previous);
        next.delete(deleteTarget.id);
        return next;
      });
      setDeleteTarget(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not delete the referral code.",
      );
    }
  };

  const bulkConfirmCount = bulkConfirm?.codes.length ?? 0;
  const bulkConfirmSkipped = bulkConfirm?.skippedCount ?? 0;
  const bulkConfirmTitle =
    bulkConfirm?.action === "delete"
      ? "Delete selected referral codes"
      : bulkConfirm?.action === "activate"
        ? "Activate selected referral codes"
        : "Deactivate selected referral codes";
  const bulkConfirmLabel =
    bulkConfirm?.action === "delete"
      ? `Delete ${bulkConfirmCount}`
      : bulkConfirm?.action === "activate"
        ? `Activate ${bulkConfirmCount}`
        : `Deactivate ${bulkConfirmCount}`;
  const bulkConfirmSkipReason =
    bulkConfirm?.action === "delete"
      ? "they are not expired or unused"
      : bulkConfirm?.action === "activate"
        ? "they are not inactive"
        : "they are not active or pending";
  const bulkConfirmFinished =
    bulkConfirm?.action === "delete"
      ? "permanently deleted. This cannot be undone"
      : bulkConfirm?.action === "activate"
        ? "activated"
        : "deactivated";
  const bulkConfirmDescription = bulkConfirm
    ? `${bulkConfirmCount} referral code${bulkConfirmCount === 1 ? "" : "s"} will be ${bulkConfirmFinished}.${
        bulkConfirmSkipped > 0
          ? ` ${bulkConfirmSkipped} selected code${bulkConfirmSkipped === 1 ? "" : "s"} will be skipped because ${bulkConfirmSkipReason}.`
          : ""
      }`
    : "";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Referrals
            </h2>
            <MockDataBadge />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage referral codes for riders and drivers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RefreshIndicator
            isFetching={ query.isFetching }
            updatedAt={ query.dataUpdatedAt }
            onRefresh={ () => void query.refetch() }
          />
          <Button
            type="button"
            size="sm"
            onClick={ () => setCreateOpen(true) }
            className="h-9 bg-brand-600 px-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="size-4" aria-hidden="true" />
            Create Referral
          </Button>
        </div>
      </div>

      { statsQuery.isError ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-card">
          <QueryError
            error={ statsQuery.error }
            onRetry={ statsQuery.refetch }
          />
        </div>
      ) : statsQuery.isPending || !statsQuery.data ? (
        <StatsSkeleton />
      ) : (
        <ReferralCodeStatsCards stats={ statsQuery.data } />
      ) }

      <ReferralTabs value={ status } onChange={ changeTab } />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={ search }
            onChange={ (event) => changeSearch(event.target.value) }
            placeholder="Search by code, name or assigned user."
            aria-label="Search referral codes"
            className="h-9 bg-white pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={ type }
            onChange={ (event) =>
              changeType(event.target.value as ReferralUserTypeFilter)
            }
            aria-label="Filter by user type"
            className={ selectClass }
          >
            <option value="all">All users</option>
            { Object.entries(REFERRAL_USER_TYPE_LABELS).map(
              ([value, label]) => (
                <option key={ value } value={ value }>
                  { label }s
                </option>
              ),
            ) }
          </select>

          <select
            value={ range }
            onChange={ (event) => {
              changeRange(event.target.value as ReferralDatePreset);
            } }
            aria-label="Filter by date"
            className={ selectClass }
          >
            { REFERRAL_DATE_PRESETS.map((option) => (
              <option key={ option.value } value={ option.value }>
                { option.label }
              </option>
            )) }
          </select>

          { range === "custom" && (
            <>
              <Input
                type="date"
                value={ from }
                onChange={ (event) => changeFrom(event.target.value) }
                aria-label="Created from date"
                className="h-9 w-auto bg-white"
              />
              <Input
                type="date"
                value={ to }
                onChange={ (event) => changeTo(event.target.value) }
                aria-label="Created to date"
                className="h-9 w-auto bg-white"
              />
            </>
          ) }

          { hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={ clearFilters }
              className="h-9 px-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              Clear filters
            </Button>
          ) }
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:px-5">
          <p className="text-xs text-slate-500">
            Showing{ " " }
            <span className="font-semibold text-slate-700">{ rangeLabel }</span>{ " " }
            of <span className="font-semibold text-slate-700">{ total }</span>{ " " }
            referral code{ total === 1 ? "" : "s" }
          </p>
          <p className="text-xs text-slate-400">
            { currentPage } of { totalPages } page{ totalPages === 1 ? "" : "s" }
          </p>
        </div>

        { selectedIds.size > 0 && (
          <ReferralBulkActions
            selectedCount={ selectedIds.size }
            activateCount={ bulkActivate.eligible.length }
            deactivateCount={ bulkDeactivate.eligible.length }
            deleteCount={ bulkDelete.eligible.length }
            pending={ bulkPending }
            onActivate={ () => openBulkConfirm("activate") }
            onDeactivate={ () => openBulkConfirm("deactivate") }
            onEdit={ () => setBulkEditOpen(true) }
            onSend={ () => setBulkSendOpen(true) }
            onDelete={ () => openBulkConfirm("delete") }
            onClear={ clearSelection }
          />
        ) }

        <ReferralCodesTable
          items={ codes }
          isPending={ query.isPending }
          isError={ query.isError }
          error={ query.error }
          onRetry={ query.refetch }
          hasFilters={ hasFilters }
          onClearFilters={ clearFilters }
          busyCodeId={ busyCodeId }
          actionsBusy={ bulkPending }
          selectedIds={ selectedIds }
          onToggleSelect={ toggleSelect }
          onToggleSelectAll={ toggleSelectAll }
          onViewDetails={ setViewing }
          onEdit={ setEditing }
          onSend={ setSending }
          onActivate={ (code) =>
            setStatusTarget({ code, nextStatus: "active" })
          }
          onDeactivate={ (code) =>
            setStatusTarget({ code, nextStatus: "inactive" })
          }
          onDelete={ setDeleteTarget }
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3.5 sm:px-5">
          <p className="text-xs text-slate-500">
            Showing{ " " }
            <span className="font-semibold text-slate-700">{ rangeLabel }</span>{ " " }
            of <span className="font-semibold text-slate-700">{ total }</span>{ " " }
            referral code{ total === 1 ? "" : "s" }
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
              onClick={ () => changePage(Math.max(1, currentPage - 1)) }
              disabled={ currentPage <= 1 }
              className="h-auto border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:text-slate-400 disabled:opacity-100"
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={ () => changePage(Math.min(totalPages, currentPage + 1)) }
              disabled={ currentPage >= totalPages }
              className="h-auto border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:text-slate-400 disabled:opacity-100"
            >
              Next
            </Button>
          </div>
        </div>
      </section>

      { createOpen && (
        <CreateReferralDialog
          onClose={ () => setCreateOpen(false) }
          onCreated={ (createdCode, assignedUser) => {
            setCreated({ code: createdCode.code, user: assignedUser });
            setCreateOpen(false);
          } }
        />
      ) }

      <ReferralCreatedDialog
        created={ created }
        onClose={ () => setCreated(null) }
      />

      { viewing && (
        <ReferralDetailsDialog
          code={ viewing }
          onClose={ () => setViewing(null) }
        />
      ) }

      { editing && (
        <EditReferralDialog
          code={ editing }
          onClose={ () => setEditing(null) }
        />
      ) }

      { sending && (
        <SendReferralDialog
          code={ sending }
          onClose={ () => setSending(null) }
        />
      ) }

      { bulkEditOpen && selectedCodes.length > 0 && (
        <BulkEditReferralDialog
          codes={ selectedCodes }
          onClose={ () => setBulkEditOpen(false) }
          onFinished={ removeSucceededFromSelection }
        />
      ) }

      { bulkSendOpen && selectedCodes.length > 0 && (
        <BulkSendReferralDialog
          codes={ selectedCodes }
          onClose={ () => setBulkSendOpen(false) }
          onFinished={ removeSucceededFromSelection }
        />
      ) }

      <ConfirmDialog
        open={ Boolean(bulkConfirm) }
        onClose={ () => {
          if (!bulkPending) setBulkConfirm(null);
        } }
        title={ bulkConfirmTitle }
        description={ bulkConfirmDescription }
        confirmLabel={ bulkConfirmLabel }
        tone={ bulkConfirm?.action === "delete" ? "danger" : "brand" }
        pending={ bulkPending }
        onConfirm={ handleBulkConfirm }
      />

      <ConfirmDialog
        open={ Boolean(statusTarget) }
        onClose={ () => {
          if (!update.isPending) setStatusTarget(null);
        } }
        title={
          statusTarget?.nextStatus === "active"
            ? "Activate referral"
            : "Deactivate referral"
        }
        description={
          statusTarget
            ? statusTarget.nextStatus === "active"
              ? `Activate ${statusTarget.code.code} so it can be used again?`
              : `Temporarily disable ${statusTarget.code.code}? Existing referrals are not affected.`
            : ""
        }
        confirmLabel={
          statusTarget?.nextStatus === "active" ? "Activate" : "Deactivate"
        }
        pending={ update.isPending }
        onConfirm={ handleStatusChange }
      />

      <ConfirmDialog
        open={ Boolean(deleteTarget) }
        onClose={ () => {
          if (!remove.isPending) setDeleteTarget(null);
        } }
        title="Delete referral code"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.code}? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete referral"
        tone="danger"
        pending={ remove.isPending }
        onConfirm={ handleDelete }
      />
    </div>
  );
}
