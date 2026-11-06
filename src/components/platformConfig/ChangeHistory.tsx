"use client";

import { useState } from "react";
import { ChevronDown, History } from "lucide-react";
import { cn } from "cn";

import SidePanel from "@/components/SidePanel";
import { QueryError } from "@/components/queryStates";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfigHistory } from "@/hooks/usePlatformConfig";
import { formatHistoryChange } from "@/lib/platformConfig";
import { formatDateTime } from "@/services/mappers";
import type { ConfigHistoryEntry } from "@/types/platformConfig";

const formatRole = (role: string) => {
  if (!role) return "Admin";

  return role
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

function HistoryRow({ entry }: { entry: ConfigHistoryEntry }) {
  return (
    <li className="flex gap-3 px-5 py-3.5">
      <span
        className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-800">
          <span className="font-semibold text-slate-900">
            {entry.admin_name}
          </span>{" "}
          {formatHistoryChange(entry)}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {formatDateTime(entry.created_at)} · {formatRole(entry.admin_role)}
        </p>
        {entry.note && (
          <p className="mt-1 text-xs text-slate-600">“{entry.note}”</p>
        )}
      </div>
    </li>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-4 px-5 py-4">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex gap-3">
          <Skeleton className="mt-1.5 size-2 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-3/4 bg-slate-200" />
            <Skeleton className="h-3 w-40 bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryPanel({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(1);
  const query = useConfigHistory({ page, limit: 10 });
  const pagination = query.data?.pagination;
  const totalPages = Math.max(1, pagination?.total_pages ?? 1);

  return (
    <SidePanel
      open
      onClose={onClose}
      title="Change history"
      description="Every platform configuration change, newest first."
      wide
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || query.isFetching}
            className="h-9 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Previous
          </Button>
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            disabled={page >= totalPages || query.isFetching}
            className="h-9 border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Next
          </Button>
        </div>
      }
    >
      {query.isPending ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3.5 w-3/4 bg-slate-200" />
              <Skeleton className="h-3 w-40 bg-slate-100" />
            </div>
          ))}
        </div>
      ) : query.isError ? (
        <QueryError error={query.error} onRetry={query.refetch} />
      ) : query.data?.items.length ? (
        <ul className="-mx-5 divide-y divide-slate-200">
          {query.data.items.map((entry, index) => (
            <HistoryRow
              key={`${entry.id}-${entry.created_at}-${index}`}
              entry={entry}
            />
          ))}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-slate-500">
          No configuration changes yet.
        </p>
      )}
    </SidePanel>
  );
}

export function ChangeHistory() {
  const [open, setOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const query = useConfigHistory({ page: 1, limit: 5 });

  return (
    <>
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <History className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900">
                  Change history
                </span>
                <span className="block text-xs text-slate-500">
                  Recent changes to the platform configuration.
                </span>
              </span>
            </button>
          </CollapsibleTrigger>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPanelOpen(true)}
              className="h-8 px-2.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 hover:text-brand-700"
            >
              View all
            </Button>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-slate-500 hover:bg-slate-100"
                aria-label={open ? "Collapse change history" : "Expand change history"}
              >
                <ChevronDown
                  className={cn(
                    "transition-transform duration-200",
                    open && "rotate-180",
                  )}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <div className="border-t border-slate-200">
            {query.isPending ? (
              <HistorySkeleton />
            ) : query.isError ? (
              <QueryError error={query.error} onRetry={query.refetch} />
            ) : query.data?.items.length ? (
              <ul className="divide-y divide-slate-200">
                {query.data.items.map((entry, index) => (
                  <HistoryRow
                    key={`${entry.id}-${entry.created_at}-${index}`}
                    entry={entry}
                  />
                ))}
              </ul>
            ) : (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                No configuration changes yet.
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {panelOpen && <HistoryPanel onClose={() => setPanelOpen(false)} />}
    </>
  );
}
