"use client";

import { Gift } from "lucide-react";

import { QueryError, TableSkeleton } from "@/components/queryStates";
import { ReferralRowActions } from "@/components/marketing/ReferralRowActions";
import { ReferralStatusBadge } from "@/components/marketing/ReferralStatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { initialsFromName } from "@/lib/adminUsers";
import { formatReferralDate, formatTzs } from "@/lib/marketing";
import {
  REFERRAL_USER_TYPE_LABELS,
  type ReferralCode,
} from "@/lib/referralCodes";

const USER_TYPE_CLASSES = {
  rider: "border-sky-200 bg-sky-50 text-sky-700",
  driver: "border-violet-200 bg-violet-50 text-violet-700",
};

export function ReferralCodesTable({
  items,
  isPending,
  isError,
  error,
  onRetry,
  hasFilters,
  onClearFilters,
  busyCodeId,
  actionsBusy,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onViewDetails,
  onEdit,
  onSend,
  onActivate,
  onDeactivate,
  onDelete,
}: {
  items: ReferralCode[];
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  busyCodeId: string | null;
  actionsBusy: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (codeId: string) => void;
  onToggleSelectAll: () => void;
  onViewDetails: (code: ReferralCode) => void;
  onEdit: (code: ReferralCode) => void;
  onSend: (code: ReferralCode) => void;
  onActivate: (code: ReferralCode) => void;
  onDeactivate: (code: ReferralCode) => void;
  onDelete: (code: ReferralCode) => void;
}) {
  const columns = 10;
  const allSelected =
    items.length > 0 && items.every((code) => selectedIds.has(code.id));
  const someSelected = items.some((code) => selectedIds.has(code.id));

  return (
    <Table>
      <TableHeader className="bg-slate-50 [&_tr]:border-slate-200">
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-10 pr-0">
            <Checkbox
              checked={
                allSelected ? true : someSelected ? "indeterminate" : false
              }
              onCheckedChange={onToggleSelectAll}
              disabled={isPending || actionsBusy || items.length === 0}
              aria-label="Select all referral codes on this page"
            />
          </TableHead>
          <TableHead>Referral Code</TableHead>
          <TableHead>Assigned User</TableHead>
          <TableHead className="hidden sm:table-cell">User Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden md:table-cell">Uses</TableHead>
          <TableHead className="hidden lg:table-cell">Rewards Paid</TableHead>
          <TableHead className="hidden xl:table-cell">Expiry</TableHead>
          <TableHead className="hidden xl:table-cell">Created</TableHead>
          <TableHead className="w-12 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>

      {!isError && isPending && <TableSkeleton rows={8} cols={columns} />}

      <TableBody>
        {isError && (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={columns}
              className="whitespace-normal px-4 py-8"
            >
              <QueryError error={error} onRetry={onRetry} />
            </TableCell>
          </TableRow>
        )}

        {!isError &&
          !isPending &&
          items.map((code) => (
            <TableRow key={code.id}>
              <TableCell className="w-10 pr-0">
                <Checkbox
                  checked={selectedIds.has(code.id)}
                  onCheckedChange={() => onToggleSelect(code.id)}
                  disabled={actionsBusy}
                  aria-label={`Select ${code.code}`}
                />
              </TableCell>

              <TableCell className="whitespace-normal cursor-pointer" onClick={() => onViewDetails(code)}>
                <span className="block font-mono text-xs font-semibold tracking-wide text-slate-900">
                  {code.code}
                </span>
              </TableCell>

              <TableCell className="whitespace-normal">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                    {initialsFromName(code.assignedUserName)}
                  </span>
                  <div className="min-w-0">
                    <span className="block max-w-40 truncate text-sm font-medium text-slate-900">
                      {code.assignedUserName}
                    </span>
                  </div>
                </div>
              </TableCell>

              <TableCell className="hidden sm:table-cell">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${USER_TYPE_CLASSES[code.userType]}`}
                >
                  {REFERRAL_USER_TYPE_LABELS[code.userType]}
                </span>
              </TableCell>

              <TableCell>
                <ReferralStatusBadge status={code.status} />
              </TableCell>

              <TableCell className="hidden md:table-cell">
                <span className="font-semibold text-slate-800">
                  {code.uses.toLocaleString("en-US")}
                </span>
                <span className="text-xs text-slate-400">
                  {" "}
                  / {code.maxUses.toLocaleString("en-US")}
                </span>
              </TableCell>

              <TableCell className="hidden lg:table-cell">
                <span className="font-medium text-slate-700">
                  {formatTzs(code.rewardsTzs)}
                </span>
              </TableCell>

              <TableCell className="hidden xl:table-cell">
                <span className="text-slate-600">
                  {code.expiryDate
                    ? formatReferralDate(code.expiryDate)
                    : "No expiry"}
                </span>
              </TableCell>

              <TableCell className="hidden xl:table-cell">
                <span className="text-slate-600">
                  {formatReferralDate(code.createdAt)}
                </span>
              </TableCell>

              <TableCell className="text-right">
                <ReferralRowActions
                  code={code}
                  busy={actionsBusy || busyCodeId === code.id}
                  onViewDetails={onViewDetails}
                  onEdit={onEdit}
                  onSend={onSend}
                  onActivate={onActivate}
                  onDeactivate={onDeactivate}
                  onDelete={onDelete}
                />
              </TableCell>
            </TableRow>
          ))}

        {!isError && !isPending && items.length === 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell
              colSpan={columns}
              className="whitespace-normal px-4 py-14 text-center"
            >
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <Gift className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-800">
                No referral codes found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {hasFilters
                  ? "Try a different filter or search term."
                  : "Create a referral code to start rewarding riders and drivers."}
              </p>
              {hasFilters && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClearFilters}
                  className="mt-3 h-auto border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Clear filters
                </Button>
              )}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
