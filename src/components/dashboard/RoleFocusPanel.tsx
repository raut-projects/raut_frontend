"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, ChartNoAxesCombined, CreditCard, LifeBuoy, Megaphone } from "lucide-react";

import { QueryError } from "@/components/queryStates";
import { Skeleton } from "@/components/ui/skeleton";
import { usePromotions } from "@/hooks/useMarketing";
import { usePermissions } from "@/hooks/usePermissions";
import { useReferralStats } from "@/hooks/useReferrals";
import { usePendingPayouts } from "@/hooks/usePayouts";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import { formatMoney } from "@/services/mappers";

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const numberValue = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const textValue = (value: unknown, fallback = "—") => {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  return fallback;
};

const listFrom = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (Array.isArray(record.items)) return record.items;
  if (Array.isArray(record.data)) return record.data;
  return [];
};

type Focus = "support" | "finance" | "marketing" | "analyst";

const FOCUS_META: Record<
  Focus,
  { title: string; href: string; label: string; icon: typeof LifeBuoy }
> = {
  support: {
    title: "Support focus",
    href: "/support-tickets",
    label: "Open tickets",
    icon: LifeBuoy,
  },
  finance: {
    title: "Finance focus",
    href: "/payouts",
    label: "Pending payouts",
    icon: CreditCard,
  },
  marketing: {
    title: "Marketing focus",
    href: "/marketing/promotions",
    label: "Active promotions",
    icon: Megaphone,
  },
  analyst: {
    title: "Analyst focus",
    href: "/",
    label: "Cross-functional view",
    icon: ChartNoAxesCombined,
  },
};

function MetricLine({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-2 last:border-0">
      <span className="truncate text-xs text-slate-500">{ label }</span>
      <span
        className={ `truncate text-right text-sm font-semibold tabular-nums ${alert ? "text-rose-700" : "text-slate-900"
          }` }
      >
        { value }
      </span>
    </div>
  );
}

function FocusBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <h3 className="pb-1 text-xs font-semibold text-slate-700">{ title }</h3>
      { children }
    </div>
  );
}

function SupportMetrics() {
  const query = useSupportTickets({ page: 1, limit: 5 });
  const items = listFrom(query.data);
  const total = numberValue(asRecord(query.data).total ?? items.length);
  const urgent = items.filter((item) => {
    const record = asRecord(item);
    const value = String(record.priority ?? record.status ?? "").toLowerCase();
    return value === "urgent" || value === "high" || value === "escalated";
  }).length;
  const latest = items.length > 0 ? asRecord(items[0]) : null;

  if (query.isPending) return <Skeleton className="h-20 w-full" />;
  if (query.isError) return <QueryError error={ query.error } onRetry={ query.refetch } />;

  return (
    <>
      <MetricLine label="Total tickets" value={ String(total) } />
      <MetricLine label="Urgent / high" value={ String(urgent) } alert={ urgent > 0 } />
      <MetricLine
        label="Latest"
        value={ textValue(latest?.subject ?? latest?.title, "No tickets") }
      />
    </>
  );
}

function FinanceMetrics() {
  const query = usePendingPayouts();
  const payouts = listFrom(query.data);
  const total = payouts.reduce<number>(
    (sum, payout) =>
      sum + numberValue(asRecord(payout).amount ?? asRecord(payout).amount_tzs),
    0,
  );

  if (query.isPending) return <Skeleton className="h-20 w-full" />;
  if (query.isError) return <QueryError error={ query.error } onRetry={ query.refetch } />;

  return (
    <>
      <MetricLine label="Pending batches" value={ String(payouts.length) } />
      <MetricLine label="Amount due" value={ formatMoney(total) } />
    </>
  );
}

function MarketingMetrics() {
  const promotions = usePromotions({ page: 1, limit: 5 });
  const referralStats = useReferralStats({}, true);
  const items = listFrom(promotions.data);
  const active = items.filter((item) => {
    const value = String(
      asRecord(item).status ?? asRecord(item).derivedStatus ?? "",
    ).toLowerCase();
    return value === "active" || value === "scheduled";
  }).length;
  const stats = asRecord(referralStats.data);

  if (promotions.isPending || referralStats.isPending) {
    return <Skeleton className="h-24 w-full" />;
  }
  if (promotions.isError) {
    return <QueryError error={ promotions.error } onRetry={ promotions.refetch } />;
  }
  if (referralStats.isError) {
    return <QueryError error={ referralStats.error } onRetry={ referralStats.refetch } />;
  }

  return (
    <>
      <MetricLine label="Active promos" value={ String(active) } />
      <MetricLine
        label="Referrals"
        value={ String(numberValue(stats.total_referrals)) }
      />
      <MetricLine
        label="Rewards pending"
        value={ formatMoney(numberValue(stats.total_rewards_pending)) }
      />
    </>
  );
}

function useFocus(): Focus | null {
  const { permissions, roles, loaded } = usePermissions();

  if (!loaded) return null;

  const roleKeys = roles.map((role) =>
    String(asRecord(role).key ?? role).toLowerCase(),
  );
  const has = (prefix: string) =>
    permissions.some((permission) => permission.startsWith(prefix));

  if (roleKeys.some((key) => key.includes("analyst"))) return "analyst";
  if (roleKeys.some((key) => key.includes("support")) || has("support.")) {
    return "support";
  }
  if (roleKeys.some((key) => key.includes("finance")) || has("finance.")) {
    return "finance";
  }
  if (roleKeys.some((key) => key.includes("marketing")) || has("marketing.")) {
    return "marketing";
  }

  return null;
}

export function RoleFocusPanel() {
  const focus = useFocus();

  if (!focus) return null;

  const meta = FOCUS_META[focus];
  const Icon = meta.icon;

  return (
    <section aria-label={ meta.title }>
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-slate-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-900">{ meta.title }</h2>
        </div>
        <Link
          href={ meta.href }
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          { meta.label }
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      { focus === "analyst" ? (
        <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-3 md:divide-x md:divide-slate-200">
          <FocusBlock title="Support">
            <SupportMetrics />
          </FocusBlock>
          <FocusBlock title="Finance">
            <FinanceMetrics />
          </FocusBlock>
          <FocusBlock title="Marketing">
            <MarketingMetrics />
          </FocusBlock>
        </div>
      ) : (
        <div className="pt-4">
          { focus === "support" && <SupportMetrics /> }
          { focus === "finance" && <FinanceMetrics /> }
          { focus === "marketing" && <MarketingMetrics /> }
        </div>
      ) }
    </section>
  );
}
