"use client";

import Link from "next/link";
import { CalendarDays, Pencil, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DISCOUNT_TYPE_LABELS,
  formatPromotionDateRange,
  formatTzs,
  promotionBudgetPercent,
  promotionBudgetTone,
  type Promotion,
} from "@/lib/marketing";

import { PromotionStatusBadge } from "./PromotionStatusBadge";

function discountSummary(promotion: Promotion) {
  if (promotion.discountType === "percentage") {
    const cap =
      promotion.maxDiscountTzs !== undefined
        ? ` (max ${formatTzs(promotion.maxDiscountTzs)})`
        : "";

    return `${promotion.discountValue}% off${cap}`;
  }

  if (promotion.discountType === "free_ride") {
    return promotion.maxRideValueTzs !== undefined
      ? `Free ride up to ${formatTzs(promotion.maxRideValueTzs)}`
      : "Free ride";
  }

  return `${formatTzs(promotion.discountValue)} off`;
}

function audienceLabels(promotion: Promotion) {
  const labels: string[] = [];

  if (promotion.newUsersOnly) labels.push("New users");
  if (promotion.existingUsersOnly) labels.push("Existing users");
  if (promotion.eligiblePhones?.length) {
    labels.push(`Specific list (${promotion.eligiblePhones.length})`);
  }
  if (!labels.length) labels.push("All riders");
  if (promotion.duoOnly) labels.push("DUO only");
  if (promotion.peakHoursOnly) {
    labels.push(
      promotion.peakHoursLabel
        ? `Peak hours: ${promotion.peakHoursLabel}`
        : "Peak hours only",
    );
  }

  return labels;
}

export function PromotionCard({
  promotion,
  onDelete,
  deleting = false,
}: {
  promotion: Promotion;
  onDelete: (promotion: Promotion) => void;
  deleting?: boolean;
}) {
  const budgetPercent = promotionBudgetPercent(promotion);
  const usageLimit =
    promotion.totalUsesLimit !== undefined
      ? `${promotion.usageCount} / ${promotion.totalUsesLimit}`
      : String(promotion.usageCount);

  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-900 px-2 py-1 font-mono text-xs font-semibold tracking-wide text-white">
              {promotion.code}
            </span>
            <PromotionStatusBadge status={promotion.status} />
          </div>
          <h3 className="mt-2 truncate text-base font-semibold text-slate-900">
            {promotion.name}
          </h3>
        </div>
        <p className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
          {DISCOUNT_TYPE_LABELS[promotion.discountType]}
        </p>
      </div>

      <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-500">
        {promotion.description || "No description added."}
      </p>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Discount
          </dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900">
            {discountSummary(promotion)}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Valid
          </dt>
          <dd className="mt-1 flex items-center gap-1.5 text-sm text-slate-700">
            <CalendarDays className="size-3.5 text-slate-400" aria-hidden="true" />
            {formatPromotionDateRange(promotion.startsAt, promotion.endsAt)}
          </dd>
        </div>

        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Usage
          </dt>
          <dd className="mt-1 flex items-center gap-1.5 text-sm text-slate-700">
            <Users className="size-3.5 text-slate-400" aria-hidden="true" />
            {usageLimit} use{promotion.usageCount === 1 ? "" : "s"}
            <span className="text-xs text-slate-400">
              · {promotion.perUserLimit} per user
            </span>
          </dd>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Budget
            </dt>
            <span className="text-xs font-semibold text-slate-500">
              {budgetPercent}%
            </span>
          </div>
          <dd className="mt-1.5">
            <Progress
              value={budgetPercent}
              className="h-2 bg-slate-100"
              indicatorClassName={promotionBudgetTone(budgetPercent)}
              aria-label={`${promotion.code} budget used`}
            />
            <p className="mt-1 text-xs text-slate-500">
              {formatTzs(promotion.budgetUsedTzs)} of{" "}
              {formatTzs(promotion.budgetCapTzs)}
            </p>
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {audienceLabels(promotion).map((label) => (
          <span
            key={label}
            className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        >
          <Link href={`/marketing/promotions/${encodeURIComponent(promotion.id)}/edit`}>
            <Pencil className="size-3.5" aria-hidden="true" />
            Edit
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(promotion)}
          disabled={deleting}
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          Delete
        </Button>
      </div>
    </article>
  );
}
