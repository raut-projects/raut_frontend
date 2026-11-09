"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Megaphone, Plus, Search } from "lucide-react";

import { MarketingTabs } from "@/components/marketing/MarketingTabs";
import { MockDataBadge } from "@/components/marketing/MockDataBadge";
import { PromotionCard } from "@/components/marketing/PromotionCard";
import { QueryError, RefreshIndicator } from "@/components/queryStates";
import { ConfirmDialog } from "@/components/reasonDialog";
import { useToast } from "@/components/toastContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useDeletePromotion, usePromotions } from "@/hooks/useMarketing";
import type { Promotion, PromotionTab } from "@/lib/marketing";
import { usePageViewField } from "@/store/pageViewStore";

const PAGE_SIZE = 9;

function CardSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-24 bg-slate-200" />
        <Skeleton className="h-5 w-16 bg-slate-100" />
      </div>
      <Skeleton className="h-4 w-2/3 bg-slate-200" />
      <Skeleton className="h-3 w-full bg-slate-100" />
      <div className="grid grid-cols-2 gap-3">
        { Array.from({ length: 4 }, (_, index) => (
          <div key={ index } className="space-y-2">
            <Skeleton className="h-2.5 w-16 bg-slate-200" />
            <Skeleton className="h-3.5 w-full bg-slate-100" />
          </div>
        )) }
      </div>
      <Skeleton className="h-9 w-full bg-slate-100" />
    </div>
  );
}

export default function MarketingPage() {
  const toast = useToast();
  const [status, setStatus] = usePageViewField("marketingPromotions", "status");
  const [search, setSearch] = usePageViewField("marketingPromotions", "search");
  const [page, setPage] = usePageViewField("marketingPromotions", "page");
  const [pendingDelete, setPendingDelete] = useState<Promotion | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);
  const params = useMemo(
    () => ({ page, limit: PAGE_SIZE, search: debouncedSearch, status }),
    [page, debouncedSearch, status],
  );

  const query = usePromotions(params);
  const remove = useDeletePromotion();
  const promotions = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const rangeStart = total === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + PAGE_SIZE, total);
  const rangeLabel =
    rangeEnd > rangeStart ? `${rangeStart}-${rangeEnd}` : String(rangeStart);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, setPage, totalPages]);

  const handleTab = (tab: PromotionTab) => {
    setStatus(tab);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;

    try {
      await remove.mutateAsync(pendingDelete.id);
      toast.success(`${pendingDelete.code} deleted.`);
      setPendingDelete(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not delete the promotion.",
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Promotions &amp; Marketing
            </h2>
            <MockDataBadge />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage rider promotions, discounts and referral rewards.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={ () => void setPage(1) }
            className="h-9 px-3 text-sm font-semibold"
          >
            <Link href="/marketing/promotions/new" className="flex items-center gap-2">
              <Plus className="size-4" aria-hidden="true" />
              Create New Promotion
            </Link>
          </Button>
          <RefreshIndicator
            isFetching={ query.isFetching }
            updatedAt={ query.dataUpdatedAt }
            onRefresh={ () => void query.refetch() }
          />
        </div>
      </div>

      <MarketingTabs value={ status } onChange={ handleTab } />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={ search }
            onChange={ (event) => {
              setSearch(event.target.value);
              setPage(1);
            } }
            placeholder="Search promotions by code or name."
            aria-label="Search promotions"
            className="h-9 bg-white pl-9"
          />
        </div>
        <p className="text-xs text-slate-500 sm:ml-auto">
          Showing{ " " }
          <span className="font-semibold text-slate-700">{ rangeLabel }</span> of{ " " }
          <span className="font-semibold text-slate-700">{ total }</span> promotion
          { total === 1 ? "" : "s" }
        </p>
      </div>

      { query.isError ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-card">
          <QueryError error={ query.error } onRetry={ query.refetch } />
        </div>
      ) : query.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          { Array.from({ length: 6 }, (_, index) => (
            <CardSkeleton key={ index } />
          )) }
        </div>
      ) : promotions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center shadow-card">
          <span className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Megaphone className="size-6" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              No { status === "draft" ? "drafts" : status } promotions
            </p>
            <p className="mt-1 text-sm text-slate-500">
              { search.trim()
                ? "No promotion matches this search. Try another code or name."
                : "Create a campaign to start rewarding riders." }
            </p>
          </div>
          <Button asChild className="mt-1 bg-brand-600 text-white hover:bg-brand-700">
            <Link href="/marketing/promotions/new">
              <Plus className="size-4" aria-hidden="true" />
              Create promotion
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          { promotions.map((promotion) => (
            <PromotionCard
              key={ promotion.id }
              promotion={ promotion }
              onDelete={ setPendingDelete }
              deleting={
                remove.isPending && pendingDelete?.id === promotion.id
              }
            />
          )) }
        </div>
      ) }

      { !query.isError && !query.isPending && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-card">
          <p className="text-xs text-slate-500">
            Page{ " " }
            <span className="font-semibold text-slate-700">{ currentPage }</span> of{ " " }
            <span className="font-semibold text-slate-700">{ totalPages }</span>
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
      ) }

      <ConfirmDialog
        open={ Boolean(pendingDelete) }
        onClose={ () => {
          if (!remove.isPending) setPendingDelete(null);
        } }
        title="Delete promotion"
        description={
          pendingDelete
            ? `Delete ${pendingDelete.code}? Riders will no longer be able to redeem it. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete promotion"
        tone="danger"
        pending={ remove.isPending }
        onConfirm={ handleDelete }
      />
    </div>
  );
}
