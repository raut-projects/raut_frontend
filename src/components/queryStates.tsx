import { useEffect, useState } from "react";
import { CircleAlert, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import { getUserFriendlyErrorMessage } from "@/lib/friendlyError";

export function TableSkeleton({
  rows = 6,
  cols = 6,
  mobileCols = 4,
  lgCols = cols,
}) {
  const cellClass = (col) => {
    if (col >= lgCols) return "hidden xl:table-cell";
    if (col >= mobileCols) return "hidden lg:table-cell";
    return undefined;
  };

  return (
    <tbody>
      { Array.from({ length: rows }, (_, row) => (
        <TableRow key={ row } className="hover:bg-transparent">
          { Array.from({ length: cols }, (_, col) => (
            <TableCell key={ col } className={ cellClass(col) }>
              <Skeleton className="h-3.5 w-full bg-slate-200" />
            </TableCell>
          )) }
        </TableRow>
      )) }
    </tbody>
  );
}

export function QueryError({ error, onRetry }) {
  const message = getUserFriendlyErrorMessage(error, {
    context: "load",
    fallback: "Something went wrong while loading this data.",
  });

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <CircleAlert
        className="h-6 w-6 text-rose-500"
        strokeWidth={ 1.8 }
        aria-hidden="true"
      />
      <p className="text-sm font-medium text-slate-700">{ message }</p>
      <Button
        type="button"
        variant="outline"
        onClick={ onRetry }
        className="h-auto border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        Try again
      </Button>
    </div>
  );
}

export function RefreshIndicator({ isFetching, updatedAt, onRefresh }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(timer);
  }, []);

  const seconds = updatedAt
    ? Math.max(0, Math.round((now - updatedAt) / 1000))
    : null;
  const label =
    seconds === null
      ? "not synced yet"
      : seconds < 5
        ? "just now"
        : seconds < 60
          ? `${seconds}s ago`
          : `${Math.round(seconds / 60)}m ago`;

  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span className={ isFetching ? "font-medium text-brand-600" : "" }>
        { isFetching ? "Refreshing…" : `Updated ${label}` }
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={ onRefresh }
        disabled={ isFetching }
        className="size-6 rounded-md text-slate-400 hover:bg-transparent hover:text-slate-600 disabled:opacity-50"
        aria-label="Refresh data"
      >
        <RefreshCw
          className={ `h-4 w-4 ${isFetching ? "animate-spin" : ""}` }
          strokeWidth={ 1.8 }
          aria-hidden="true"
        />
      </Button>
    </div>
  );
}
