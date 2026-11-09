"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { QueryError, RefreshIndicator } from "@/components/queryStates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useReferralStats,
  useReferralUser,
  useReferralUsers,
} from "@/hooks/useReferrals";
import type { ReferralJsonObject, ReferralJsonValue } from "@/lib/referrals";

const PAGE_SIZE = 50;

function recordValue(value: ReferralJsonValue | undefined): ReferralJsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function displayText(
  record: ReferralJsonObject,
  key: string,
  fallback = "—",
): string {
  const value = record[key];
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : fallback;
}

function displayNumber(record: ReferralJsonObject, key: string): number {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return 0;
}

function formatTzs(value: number): string {
  return `${value.toLocaleString("en-TZ")} TZS`;
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 border-l-2 border-brand-200 pl-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 truncate text-xl font-semibold tabular-nums text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ReferralUserDetails({ userId }: { userId: string }) {
  const query = useReferralUser(userId);
  const user = query.data;
  const referredBy = Array.isArray(user?.referred_by) ? user.referred_by : [];
  const referredUsers = Array.isArray(user?.referred_users)
    ? user.referred_users
    : [];
  const rewards = Array.isArray(user?.rewards) ? user.rewards : [];
  const groups = [
    { title: "Referred by", values: referredBy },
    { title: "Users referred", values: referredUsers },
    { title: "Rewards", values: rewards },
  ];

  if (query.isError) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white">
        <QueryError error={query.error} onRetry={query.refetch} />
      </section>
    );
  }

  if (query.isPending || !user) {
    return (
      <section
        aria-label="Loading referral details"
        className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white"
      />
    );
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="grid gap-3 border-b border-slate-100 pb-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-slate-500">Name</p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {displayText(user, "name", user.user_id)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Referral code</p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {displayText(user, "referral_code")}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Phone</p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {displayText(user, "phone")}
          </p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-2 text-sm font-semibold text-slate-800">
              {group.title}
            </h3>
            {group.values.length === 0 ? (
              <p className="text-sm text-slate-500">None recorded.</p>
            ) : (
              <ul className="space-y-2">
                {group.values.map((entry, index) => {
                  const record = recordValue(entry);
                  const heading =
                    displayText(
                      record,
                      "name",
                      displayText(
                        record,
                        "referrer_name",
                        displayText(
                          record,
                          "referee_name",
                          displayText(record, "trigger_event", "Referral"),
                        ),
                      ),
                    );

                  return (
                    <li
                      key={displayText(record, "id", `${group.title}-${index}`)}
                      className="rounded-lg bg-slate-50 px-3 py-2 text-sm"
                    >
                      <p className="font-medium text-slate-800">{heading}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {displayText(
                          record,
                          "status",
                          displayText(
                            record,
                            "referred_at",
                            displayText(record, "created_at"),
                          ),
                        )}
                        {record.amount_tzs !== undefined
                          ? ` · ${formatTzs(displayNumber(record, "amount_tzs"))}`
                          : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function ReferralCodeDirectory() {
  const [page, setPage] = useState(0);
  const [period, setPeriod] = useState("month");
  const [detailUserId, setDetailUserId] = useState("");
  const usersQuery = useReferralUsers({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });
  const statsQuery = useReferralStats({ period });
  const users = usersQuery.data ?? [];
  const hasNextPage = users.length === PAGE_SIZE;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Referral codes
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            View codes generated for users and their referral activity.
          </p>
        </div>
        <RefreshIndicator
          isFetching={usersQuery.isFetching || statsQuery.isFetching}
          updatedAt={Math.max(
            usersQuery.dataUpdatedAt,
            statsQuery.dataUpdatedAt,
          )}
          onRefresh={() => {
            void usersQuery.refetch();
            void statsQuery.refetch();
          }}
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Referral performance
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Summary for the selected period.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
            Period
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="day">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
            </select>
          </label>
        </div>
        {statsQuery.isPending && !statsQuery.data ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Total referrals"
              value={statsQuery.data?.total_referrals.toLocaleString() ?? "0"}
            />
            <Stat
              label="Successful"
              value={
                statsQuery.data?.successful_referrals.toLocaleString() ?? "0"
              }
            />
            <Stat
              label="Pending"
              value={statsQuery.data?.pending_referrals.toLocaleString() ?? "0"}
            />
            <Stat
              label="Rewards paid"
              value={
                statsQuery.data
                  ? formatTzs(statsQuery.data.total_rewards_paid)
                  : "0 TZS"
              }
            />
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              User referral codes
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Codes are listed from the referral users endpoint. Program
              enrollment is managed in Programs &amp; activity.
            </p>
          </div>
          <span className="text-xs text-slate-500">Page {page + 1}</span>
        </div>
        {usersQuery.isError ? (
          <QueryError error={usersQuery.error} onRetry={usersQuery.refetch} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Referrals</TableHead>
                <TableHead>Earned</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQuery.isPending ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center">
                    Loading referral codes…
                  </TableCell>
                </TableRow>
              ) : users.length ? (
                users.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium text-slate-900">
                      {displayText(user, "name", user.user_id)}
                    </TableCell>
                    <TableCell>{displayText(user, "phone")}</TableCell>
                    <TableCell className="font-semibold text-slate-800">
                      {displayText(user, "referral_code")}
                    </TableCell>
                    <TableCell>{displayText(user, "program_name")}</TableCell>
                    <TableCell>
                      {displayNumber(user, "total_referrals")}{" "}
                      <span className="text-xs text-slate-500">
                        ({displayNumber(user, "successful_referrals")} successful)
                      </span>
                    </TableCell>
                    <TableCell>
                      {formatTzs(displayNumber(user, "total_earned_tzs"))}
                    </TableCell>
                    <TableCell>
                      {formatTzs(displayNumber(user, "pending_rewards_tzs"))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        aria-expanded={detailUserId === user.user_id}
                        onClick={() =>
                          setDetailUserId((current) =>
                            current === user.user_id ? "" : user.user_id,
                          )
                        }
                      >
                        {detailUserId === user.user_id ? "Hide" : "View"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-slate-500"
                  >
                    No referral codes are available for this page.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
          <span className="text-xs text-slate-500">
            {users.length} user{users.length === 1 ? "" : "s"} on this page
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page === 0 || usersQuery.isFetching}
              onClick={() => {
                setPage((current) => Math.max(0, current - 1));
                setDetailUserId("");
              }}
            >
              <ChevronLeft aria-hidden="true" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasNextPage || usersQuery.isFetching}
              onClick={() => {
                setPage((current) => current + 1);
                setDetailUserId("");
              }}
            >
              Next
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>

      {detailUserId && <ReferralUserDetails userId={detailUserId} />}
    </div>
  );
}
