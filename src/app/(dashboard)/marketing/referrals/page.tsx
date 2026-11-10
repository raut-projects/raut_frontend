"use client";

import { useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Pencil,
  Plus,
  RefreshCw,
  UserPlus,
} from "lucide-react";

import { QueryError, RefreshIndicator } from "@/components/queryStates";
import { useToast } from "@/components/toastContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useBulkEnrollReferralUsers,
  useCreateReferralProgram,
  useEnrollReferralUser,
  useMarkReferralPaymentPaid,
  usePendingReferralPayments,
  useReferralPrograms,
  useReferralRelationships,
  useReferralStats,
  useReferralUser,
  useReferralUsers,
  useTopReferrers,
  useUnenrollReferralUser,
  useUpdateReferralProgram,
} from "@/hooks/useReferrals";
import {
  type ReferralJsonObject,
  type ReferralJsonValue,
  type ReferralProgram,
  type ReferralProgramPayload,
  type ReferralUser,
} from "@/lib/referrals";

const PAGE_SIZE = 50;
const INPUT_CLASS =
  "h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";
const LABEL_CLASS = "grid gap-1.5 text-sm font-medium text-slate-700";

type ReferralSection = "programs" | "users" | "relationships" | "payments";
type ProgramTarget = "all" | "rider" | "driver";
type RewardType = "fixed" | "percentage" | "commission";
type RewardTrigger =
  | "signup"
  | "first_ride"
  | "onboarding_complete"
  | "document_verified";

type RewardDraft = {
  enabled: boolean;
  type: RewardType;
  amount: string;
  rate: string;
  maxAmount: string;
  durationDays: string;
  trigger: RewardTrigger;
};

type ProgramDraft = {
  name: string;
  description: string;
  isDefault: boolean;
  target: ProgramTarget;
  maxReferrals: string;
  expiryDays: string;
  startDate: string;
  endDate: string;
  priority: string;
  isActive: boolean;
  referrer: RewardDraft;
  referee: RewardDraft;
};

type ProgramEditor = {
  programId: string | null;
  original?: ReferralProgram;
  draft: ProgramDraft;
};

function emptyReward(enabled = true): RewardDraft {
  return {
    enabled,
    type: "fixed",
    amount: "2000",
    rate: "0.02",
    maxAmount: "",
    durationDays: "90",
    trigger: "first_ride",
  };
}

function emptyProgramDraft(): ProgramDraft {
  return {
    name: "",
    description: "",
    isDefault: false,
    target: "all",
    maxReferrals: "",
    expiryDays: "",
    startDate: "",
    endDate: "",
    priority: "0",
    isActive: true,
    referrer: emptyReward(),
    referee: emptyReward(),
  };
}

function recordValue(value: ReferralJsonValue | undefined): ReferralJsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function stringValue(value: ReferralJsonValue | undefined, fallback = "") {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : fallback;
}

function numberValue(value: ReferralJsonValue | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function booleanValue(value: ReferralJsonValue | undefined) {
  return typeof value === "boolean" ? value : false;
}

function rewardFromProgram(
  value: ReferralJsonValue | undefined,
  enabled = true,
): RewardDraft {
  const reward = recordValue(value);
  const type = stringValue(reward.type);

  return {
    enabled: value !== null && enabled,
    type:
      type === "percentage" || type === "commission" ? type : "fixed",
    amount: stringValue(reward.amount, "2000"),
    rate: stringValue(reward.rate, "0.02"),
    maxAmount: stringValue(reward.max_amount),
    durationDays: stringValue(reward.duration_days, "90"),
    trigger:
      reward.trigger === "signup" ||
        reward.trigger === "onboarding_complete" ||
        reward.trigger === "document_verified"
        ? reward.trigger
        : "first_ride",
  };
}

function draftFromProgram(program: ReferralProgram): ProgramDraft {
  const config = recordValue(program.reward_config);
  const target = stringValue(program.target_referee_type);

  return {
    name: program.name,
    description: stringValue(program.description),
    isDefault: booleanValue(program.is_default),
    target: target === "rider" || target === "driver" ? target : "all",
    maxReferrals: stringValue(program.max_referrals_per_user),
    expiryDays: stringValue(program.reward_expiry_days),
    startDate: stringValue(program.start_date).slice(0, 10),
    endDate: stringValue(program.end_date).slice(0, 10),
    priority: stringValue(program.priority, "0"),
    isActive: program.is_active !== false,
    referrer: rewardFromProgram(config.referrer),
    referee: rewardFromProgram(config.referee),
  };
}

function numberField(value: string, label: string, allowEmpty = false) {
  if (allowEmpty && !value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative number.`);
  }
  return parsed;
}

function rewardPayload(reward: RewardDraft, label: string) {
  if (!reward.enabled) return null;

  const result: Record<string, number | string> = {
    type: reward.type,
    trigger: reward.trigger,
  };
  if (reward.type === "fixed") {
    const amount = numberField(reward.amount, `${label} amount`);
    if (!amount || amount <= 0) {
      throw new Error(`${label} amount must be greater than zero.`);
    }
    result.amount = amount;
  } else {
    const rate = numberField(reward.rate, `${label} rate`);
    if (!rate || rate <= 0 || rate > 1) {
      throw new Error(`${label} rate must be greater than 0 and no more than 1.`);
    }
    result.rate = rate;

    if (reward.type === "percentage" && reward.maxAmount.trim()) {
      const maxAmount = numberField(
        reward.maxAmount,
        `${label} maximum amount`,
      );
      if (!maxAmount || maxAmount <= 0) {
        throw new Error(`${label} maximum amount must be greater than zero.`);
      }
      result.max_amount = maxAmount;
    }

    if (reward.type === "commission") {
      const durationDays = numberField(
        reward.durationDays,
        `${label} duration`,
      );
      if (!durationDays || durationDays <= 0) {
        throw new Error(`${label} duration must be greater than zero.`);
      }
      result.duration_days = durationDays;
    }
  }

  return result;
}

function programPayload(
  draft: ProgramDraft,
  original?: ReferralProgram,
): ReferralProgramPayload {
  const name = draft.name.trim();
  if (!name) throw new Error("Enter a name for the referral program.");
  if (!draft.referrer.enabled) {
    throw new Error("A referral program must include a referrer reward.");
  }

  const priority = numberField(draft.priority, "Priority");
  const maxReferrals = numberField(
    draft.maxReferrals,
    "Maximum referrals",
    true,
  );
  const expiryDays = numberField(draft.expiryDays, "Reward expiry", true);
  const referrer = rewardPayload(draft.referrer, "Referrer reward");
  const referee = rewardPayload(draft.referee, "Referee reward");

  if (!referrer) throw new Error("A referrer reward is required.");

  const payload: ReferralProgramPayload = {
    name,
    is_default: draft.isDefault,
    reward_config: { referrer, referee },
    priority,
    is_active: draft.isActive,
  };

  if (!original || "target_referee_type" in original || draft.target !== "all") {
    payload.target_referee_type =
      draft.target === "all" ? null : draft.target;
  }
  if (
    !original ||
    "max_referrals_per_user" in original ||
    draft.maxReferrals.trim()
  ) {
    if (maxReferrals !== null && maxReferrals < 1) {
      throw new Error("Maximum referrals must be greater than zero.");
    }
    payload.max_referrals_per_user = maxReferrals;
  }
  if (
    !original ||
    "reward_expiry_days" in original ||
    draft.expiryDays.trim()
  ) {
    if (expiryDays !== null && expiryDays < 1) {
      throw new Error("Reward expiry must be greater than zero.");
    }
    payload.reward_expiry_days = expiryDays;
  }
  if (!original || "start_date" in original || draft.startDate) {
    payload.start_date = draft.startDate || null;
  }
  if (!original || "end_date" in original || draft.endDate) {
    payload.end_date = draft.endDate || null;
  }
  if (draft.startDate && draft.endDate && draft.startDate > draft.endDate) {
    throw new Error("End date must be on or after the start date.");
  }
  if (!original || "description" in original || draft.description.trim()) {
    payload.description =
      draft.description.trim() ||
      (original && "description" in original ? "" : undefined);
  }

  return payload;
}

function programRewardSummary(program: ReferralProgram) {
  const config = recordValue(program.reward_config);
  const referrer = recordValue(config.referrer);
  const referee = config.referee;
  const type = stringValue(referrer.type, "reward");

  if (type === "fixed") {
    return `${numberValue(referrer.amount).toLocaleString()} TZS to referrer`;
  }
  if (type === "percentage") {
    return `${(numberValue(referrer.rate) * 100).toLocaleString()}% to referrer`;
  }
  if (type === "commission") {
    return `${(numberValue(referrer.rate) * 100).toLocaleString()}% commission`;
  }
  return referee === null ? "Referrer reward only" : "Reward configuration";
}

function displayText(
  record: ReferralJsonObject,
  key: string,
  fallback = "—",
) {
  const value = record[key];
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : fallback;
}

function displayNumber(record: ReferralJsonObject, key: string) {
  const value = record[key];
  if (typeof value === "number") return value;
  if (typeof value === "string" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return 0;
}

function formatTzs(value: number) {
  return `${value.toLocaleString("en-TZ")} TZS`;
}

function SectionNav({
  value,
  onChange,
}: {
  value: ReferralSection;
  onChange: (section: ReferralSection) => void;
}) {
  const sections: { value: ReferralSection; label: string }[] = [
    { value: "programs", label: "Programs" },
    { value: "users", label: "Users & codes" },
    { value: "relationships", label: "Relationships" },
    { value: "payments", label: "Payments" },
  ];

  return (
    <nav
      aria-label="Referral management sections"
      className="flex gap-1 overflow-x-auto border-b border-slate-200"
    >
      { sections.map((section) => (
        <button
          key={ section.value }
          type="button"
          aria-pressed={ value === section.value }
          onClick={ () => onChange(section.value) }
          className={ `shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${value === section.value
              ? "border-brand-600 text-brand-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
            }` }
        >
          { section.label }
        </button>
      )) }
    </nav>
  );
}

function StatTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="min-w-0 border-l-2 border-brand-200 pl-3">
      <p className="text-xs font-medium text-slate-500">{ label }</p>
      <p className="mt-1 truncate text-xl font-semibold tabular-nums text-slate-900">
        { value }
      </p>
      { detail && <p className="mt-0.5 text-xs text-slate-500">{ detail }</p> }
    </div>
  );
}

function RewardFields({
  title,
  reward,
  onChange,
  allowDisable,
}: {
  title: string;
  reward: RewardDraft;
  onChange: (next: RewardDraft) => void;
  allowDisable: boolean;
}) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4">
      <legend className="px-1 text-sm font-semibold text-slate-800">
        { title }
      </legend>
      { allowDisable && (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={ reward.enabled }
            onChange={ (event) =>
              onChange({ ...reward, enabled: event.target.checked })
            }
            className="size-4 rounded border-slate-300 accent-brand-600"
          />
          This user receives a reward
        </label>
      ) }
      { reward.enabled && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={ LABEL_CLASS }>
            Reward type
            <select
              value={ reward.type }
              onChange={ (event) =>
                onChange({ ...reward, type: event.target.value as RewardType })
              }
              className={ INPUT_CLASS }
            >
              <option value="fixed">Fixed amount</option>
              <option value="percentage">Percentage</option>
              <option value="commission">Commission</option>
            </select>
          </label>
          { reward.type === "fixed" ? (
            <label className={ LABEL_CLASS }>
              Amount (TZS)
              <Input
                type="number"
                min="1"
                step="1"
                required
                value={ reward.amount }
                onChange={ (event) =>
                  onChange({ ...reward, amount: event.target.value })
                }
              />
            </label>
          ) : (
            <label className={ LABEL_CLASS }>
              Rate (0.02 = 2%)
              <Input
                type="number"
                min="0.0001"
                max="1"
                step="0.001"
                required
                value={ reward.rate }
                onChange={ (event) =>
                  onChange({ ...reward, rate: event.target.value })
                }
              />
            </label>
          ) }
          { reward.type === "percentage" && (
            <label className={ LABEL_CLASS }>
              Maximum amount (TZS, optional)
              <Input
                type="number"
                min="1"
                step="1"
                value={ reward.maxAmount }
                onChange={ (event) =>
                  onChange({ ...reward, maxAmount: event.target.value })
                }
              />
            </label>
          ) }
          { reward.type === "commission" && (
            <label className={ LABEL_CLASS }>
              Duration (days)
              <Input
                type="number"
                min="1"
                step="1"
                required
                value={ reward.durationDays }
                onChange={ (event) =>
                  onChange({ ...reward, durationDays: event.target.value })
                }
              />
            </label>
          ) }
          <label className={ LABEL_CLASS }>
            Reward trigger
            <select
              value={ reward.trigger }
              onChange={ (event) =>
                onChange({
                  ...reward,
                  trigger: event.target.value as RewardTrigger,
                })
              }
              className={ INPUT_CLASS }
            >
              <option value="signup">Signup</option>
              <option value="first_ride">First ride</option>
              <option value="onboarding_complete">Onboarding complete</option>
              <option value="document_verified">Document verified</option>
            </select>
          </label>
        </div>
      ) }
    </fieldset>
  );
}

export function ReferralProgramsDashboard() {
  const toast = useToast();
  const [section, setSection] = useState<ReferralSection>("programs");
  const [period, setPeriod] = useState("month");
  const [editor, setEditor] = useState<ProgramEditor | null>(null);
  const [usersPage, setUsersPage] = useState(0);
  const [relationshipsPage, setRelationshipsPage] = useState(0);
  const [relationshipStatus, setRelationshipStatus] = useState<
    "all" | "completed" | "pending"
  >("all");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(
    () => new Set(),
  );
  const [unenrollUserId, setUnenrollUserId] = useState("");
  const [detailUserId, setDetailUserId] = useState("");
  const [paymentTargetId, setPaymentTargetId] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const statsQuery = useReferralStats({ period }, section === "programs");
  const programsQuery = useReferralPrograms(
    {},
    section === "programs" || section === "users",
  );
  const usersQuery = useReferralUsers({
    limit: PAGE_SIZE,
    offset: usersPage * PAGE_SIZE,
  }, section === "users");
  const relationshipsQuery = useReferralRelationships({
    limit: PAGE_SIZE,
    offset: relationshipsPage * PAGE_SIZE,
    status: relationshipStatus === "all" ? undefined : relationshipStatus,
  }, section === "relationships");
  const topReferrersQuery = useTopReferrers(10, section === "programs");
  const paymentsQuery = usePendingReferralPayments(section === "payments");
  const userDetailQuery = useReferralUser(
    detailUserId,
    section === "users",
  );
  const createProgram = useCreateReferralProgram();
  const updateProgram = useUpdateReferralProgram();
  const enrollUser = useEnrollReferralUser();
  const bulkEnroll = useBulkEnrollReferralUsers();
  const unenrollUser = useUnenrollReferralUser();
  const markPaid = useMarkReferralPaymentPaid();

  const programs = programsQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const relationships = relationshipsQuery.data ?? [];
  const allUsersSelected =
    users.length > 0 && users.every((user) => selectedUsers.has(user.user_id));
  const selectedCount = selectedUsers.size;
  const currentQuery =
    section === "programs"
      ? programsQuery
      : section === "users"
        ? usersQuery
        : section === "relationships"
          ? relationshipsQuery
          : paymentsQuery;
  const currentUpdatedAt =
    section === "programs"
      ? Math.max(
        programsQuery.dataUpdatedAt,
        statsQuery.dataUpdatedAt,
        topReferrersQuery.dataUpdatedAt,
      )
      : currentQuery.dataUpdatedAt;
  const currentIsFetching =
    currentQuery.isFetching ||
    (section === "programs" &&
      (statsQuery.isFetching || topReferrersQuery.isFetching));

  const refreshCurrentSection = () => {
    if (section === "programs") {
      void programsQuery.refetch();
      void statsQuery.refetch();
      void topReferrersQuery.refetch();
    } else if (section === "users") {
      void usersQuery.refetch();
    } else if (section === "relationships") {
      void relationshipsQuery.refetch();
    } else {
      void paymentsQuery.refetch();
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAllUsers = () => {
    setSelectedUsers(
      allUsersSelected ? new Set() : new Set(users.map((user) => user.user_id)),
    );
  };

  const saveProgram = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor) return;

    try {
      const payload = programPayload(editor.draft, editor.original);
      if (editor.programId) {
        await updateProgram.mutateAsync({
          programId: editor.programId,
          payload,
        });
        toast.success("Referral program updated.");
      } else {
        await createProgram.mutateAsync(payload);
        toast.success("Referral program created.");
      }
      setEditor(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save the program.",
      );
    }
  };

  const enrollSelectedUsers = async () => {
    if (!selectedProgramId || selectedUsers.size === 0) return;
    try {
      const result = await bulkEnroll.mutateAsync({
        programId: selectedProgramId,
        userIds: Array.from(selectedUsers),
      });
      toast.success(result.message);
      if (result.failed > 0) {
        toast.toast(`${result.failed} users could not be enrolled.`, "info");
      }
      setSelectedUsers(new Set());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not enroll users.",
      );
    }
  };

  const enrollSingleUser = async (userId: string) => {
    if (!selectedProgramId) return;
    try {
      await enrollUser.mutateAsync({
        programId: selectedProgramId,
        userId,
      });
      toast.success("User enrolled in the selected program.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not enroll the user.",
      );
    }
  };

  const unenroll = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProgramId || !unenrollUserId.trim()) return;
    try {
      await unenrollUser.mutateAsync({
        programId: selectedProgramId,
        userId: unenrollUserId.trim(),
      });
      toast.success("User removed from the selected program.");
      setUnenrollUserId("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not unenroll the user.",
      );
    }
  };

  const submitPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!paymentTargetId) return;
    try {
      await markPaid.mutateAsync({
        paymentId: paymentTargetId,
        payload: {
          payment_id: paymentTargetId,
          transaction_id: transactionId.trim() || undefined,
        },
      });
      toast.success("Referral payment marked as paid.");
      setPaymentTargetId("");
      setTransactionId("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not mark the payment as paid.",
      );
    }
  };

  const userPageHasNext = users.length === PAGE_SIZE;
  const relationshipPageHasNext = relationships.length === PAGE_SIZE;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Referral programs
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Configure rewards, enroll users, and review referral activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshIndicator
            isFetching={ currentIsFetching }
            updatedAt={ currentUpdatedAt }
            onRefresh={ refreshCurrentSection }
          />
          { section === "programs" && (
            <Button
              type="button"
              onClick={ () =>
                setEditor({ programId: null, draft: emptyProgramDraft() })
              }
              className="h-9 bg-brand-600 px-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Plus aria-hidden="true" />
              Create program
            </Button>
          ) }
        </div>
      </div>

      <SectionNav value={ section } onChange={ setSection } />

      { section === "programs" && (
        <div className="space-y-5">
          <section className="rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-card sm:px-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Referral performance
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Activity and rewards for the selected period.
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                Period
                <select
                  value={ period }
                  onChange={ (event) => setPeriod(event.target.value) }
                  className={ INPUT_CLASS }
                >
                  <option value="day">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                </select>
              </label>
            </div>
            { statsQuery.isPending && !statsQuery.data ? (
              <div className="grid gap-5 sm:grid-cols-3 xl:grid-cols-6">
                { Array.from({ length: 6 }, (_, index) => (
                  <div
                    key={ index }
                    className="h-14 animate-pulse rounded bg-slate-100"
                  />
                )) }
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-3 xl:grid-cols-6">
                  <StatTile
                    label="Total referrals"
                    value={
                      statsQuery.data?.total_referrals.toLocaleString() ?? "—"
                    }
                  />
                  <StatTile
                    label="Successful"
                    value={
                      statsQuery.data?.successful_referrals.toLocaleString() ??
                      "—"
                    }
                  />
                  <StatTile
                    label="Pending"
                    value={
                      statsQuery.data?.pending_referrals.toLocaleString() ??
                      "—"
                    }
                  />
                  <StatTile
                    label="Rewards paid"
                    value={
                      statsQuery.data
                        ? formatTzs(statsQuery.data.total_rewards_paid)
                        : "—"
                    }
                  />
                  <StatTile
                    label="Rewards pending"
                    value={
                      statsQuery.data
                        ? formatTzs(statsQuery.data.total_rewards_pending)
                        : "—"
                    }
                  />
                  <StatTile
                    label="Top referrers"
                    value={
                      statsQuery.data?.top_referrer_count.toLocaleString() ??
                      "—"
                    }
                  />
                </div>
                { statsQuery.isError && (
                  <div
                    role="alert"
                    className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800"
                  >
                    <span className="flex items-center gap-2">
                      <CircleAlert
                        className="size-4 shrink-0"
                        aria-hidden="true"
                      />
                      Referral statistics could not be loaded
                      { statsQuery.error?.message
                        ? `: ${statsQuery.error.message}`
                        : "." }
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={ () => void statsQuery.refetch() }
                      disabled={ statsQuery.isFetching }
                      className="border-rose-200 bg-white text-rose-800 hover:bg-rose-100"
                    >
                      Try again
                    </Button>
                  </div>
                ) }
              </>
            ) }
          </section>

          <Sheet
            open={ Boolean(editor) }
            onOpenChange={ (open) => {
              if (!open && !createProgram.isPending && !updateProgram.isPending) {
                setEditor(null);
              }
            } }
          >
            <SheetContent
              side="right"
              className="gap-0 overflow-y-auto p-0 sm:max-w-2xl"
              style={ { width: "min(94vw, 42rem)", maxWidth: "42rem" } }
            >
              { editor && (
                <>
                  <SheetHeader className="border-b border-slate-200 pr-12">
                    <SheetTitle>
                      { editor.programId ? "Edit program" : "Create a program" }
                    </SheetTitle>
                    <SheetDescription>
                      Configure when each reward is issued and which users qualify.
                    </SheetDescription>
                  </SheetHeader>
                  <form onSubmit={ saveProgram } className="space-y-5 px-4 py-5 sm:px-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className={ LABEL_CLASS }>
                        Program name
                        <Input
                          required
                          maxLength={ 120 }
                          value={ editor.draft.name }
                          onChange={ (event) =>
                            setEditor({
                              ...editor,
                              draft: { ...editor.draft, name: event.target.value },
                            })
                          }
                        />
                      </label>
                      <label className={ `${LABEL_CLASS} sm:col-span-2` }>
                        Description
                        <Input
                          value={ editor.draft.description }
                          onChange={ (event) =>
                            setEditor({
                              ...editor,
                              draft: {
                                ...editor.draft,
                                description: event.target.value,
                              },
                            })
                          }
                        />
                      </label>
                      <label className={ LABEL_CLASS }>
                        Eligible referee type
                        <select
                          value={ editor.draft.target }
                          onChange={ (event) =>
                            setEditor({
                              ...editor,
                              draft: {
                                ...editor.draft,
                                target: event.target.value as ProgramTarget,
                              },
                            })
                          }
                          className={ INPUT_CLASS }
                        >
                          <option value="all">Riders and drivers</option>
                          <option value="rider">Riders only</option>
                          <option value="driver">Drivers only</option>
                        </select>
                      </label>
                      <label className={ LABEL_CLASS }>
                        Priority
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={ editor.draft.priority }
                          onChange={ (event) =>
                            setEditor({
                              ...editor,
                              draft: {
                                ...editor.draft,
                                priority: event.target.value,
                              },
                            })
                          }
                        />
                      </label>
                      <label className={ LABEL_CLASS }>
                        Maximum referrals per user
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="No limit"
                          value={ editor.draft.maxReferrals }
                          onChange={ (event) =>
                            setEditor({
                              ...editor,
                              draft: {
                                ...editor.draft,
                                maxReferrals: event.target.value,
                              },
                            })
                          }
                        />
                      </label>
                      <label className={ LABEL_CLASS }>
                        Reward expiry (days)
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          placeholder="No expiry"
                          value={ editor.draft.expiryDays }
                          onChange={ (event) =>
                            setEditor({
                              ...editor,
                              draft: {
                                ...editor.draft,
                                expiryDays: event.target.value,
                              },
                            })
                          }
                        />
                      </label>
                      <label className={ LABEL_CLASS }>
                        Start date
                        <Input
                          type="date"
                          value={ editor.draft.startDate }
                          onChange={ (event) =>
                            setEditor({
                              ...editor,
                              draft: {
                                ...editor.draft,
                                startDate: event.target.value,
                              },
                            })
                          }
                        />
                      </label>
                      <label className={ LABEL_CLASS }>
                        End date
                        <Input
                          type="date"
                          value={ editor.draft.endDate }
                          onChange={ (event) =>
                            setEditor({
                              ...editor,
                              draft: {
                                ...editor.draft,
                                endDate: event.target.value,
                              },
                            })
                          }
                        />
                      </label>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      { (["referrer", "referee"] as const).map((party) => (
                        <RewardFields
                          key={ party }
                          title={
                            party === "referrer" ? "Referrer reward" : "Referee reward"
                          }
                          reward={ editor.draft[party] }
                          allowDisable={ party === "referee" }
                          onChange={ (reward) =>
                            setEditor({
                              ...editor,
                              draft: { ...editor.draft, [party]: reward },
                            })
                          }
                        />
                      )) }
                    </div>
                    <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:-mx-6 sm:px-6">
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={ editor.draft.isDefault }
                            onChange={ (event) =>
                              setEditor({
                                ...editor,
                                draft: {
                                  ...editor.draft,
                                  isDefault: event.target.checked,
                                },
                              })
                            }
                            className="size-4 rounded border-slate-300 accent-brand-600"
                          />
                          Default for new users
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={ editor.draft.isActive }
                            onChange={ (event) =>
                              setEditor({
                                ...editor,
                                draft: {
                                  ...editor.draft,
                                  isActive: event.target.checked,
                                },
                              })
                            }
                            className="size-4 rounded border-slate-300 accent-brand-600"
                          />
                          Active
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={ () => setEditor(null) }
                          disabled={ createProgram.isPending || updateProgram.isPending }
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={
                            createProgram.isPending || updateProgram.isPending
                          }
                          className="bg-brand-600 text-white hover:bg-brand-700"
                        >
                          { editor.programId ? "Save changes" : "Create program" }
                        </Button>
                      </div>
                    </div>
                  </form>
                </>
              ) }
            </SheetContent>
          </Sheet>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Programs
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Higher-priority programs take precedence when more than one matches.
                </p>
              </div>
              { programsQuery.isFetching && (
                <RefreshCw
                  className="size-4 animate-spin text-slate-400"
                  aria-label="Loading programs"
                />
              ) }
            </div>
            { programsQuery.isError ? (
              <QueryError
                error={ programsQuery.error }
                onRetry={ programsQuery.refetch }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Program</TableHead>
                    <TableHead>Reward</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  { programsQuery.isPending ? (
                    <TableRow>
                      <TableCell colSpan={ 6 } className="py-10 text-center">
                        Loading programs…
                      </TableCell>
                    </TableRow>
                  ) : programs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={ 6 }
                        className="py-12 text-center text-slate-500"
                      >
                        No referral programs yet. Create one to define referral rewards.
                      </TableCell>
                    </TableRow>
                  ) : (
                    programs.map((program) => (
                      <TableRow key={ program.id }>
                        <TableCell>
                          <div className="font-medium text-slate-900">
                            { program.name }
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-1.5">
                            { booleanValue(program.is_default) && (
                              <Badge variant="secondary">Default</Badge>
                            ) }
                            { displayText(
                              program,
                              "description",
                              "",
                            ) && (
                                <span className="text-xs text-slate-500">
                                  { displayText(program, "description", "") }
                                </span>
                              ) }
                          </div>
                        </TableCell>
                        <TableCell>{ programRewardSummary(program) }</TableCell>
                        <TableCell className="capitalize">
                          { displayText(
                            program,
                            "target_referee_type",
                            "All users",
                          ) || "All users" }
                        </TableCell>
                        <TableCell className="tabular-nums">
                          { displayNumber(program, "priority") }
                        </TableCell>
                        <TableCell>
                          { program.is_active === false ? (
                            <Badge variant="destructive">Inactive</Badge>
                          ) : (
                            <Badge variant="outline">Active</Badge>
                          ) }
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={ () =>
                                setEditor({
                                  programId: program.id,
                                  original: program,
                                  draft: draftFromProgram(program),
                                })
                              }
                              aria-label={ `Edit ${program.name}` }
                            >
                              <Pencil aria-hidden="true" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={ updateProgram.isPending }
                              onClick={ async () => {
                                try {
                                  await updateProgram.mutateAsync({
                                    programId: program.id,
                                    payload: {
                                      is_active: program.is_active === false,
                                    },
                                  });
                                  toast.success(
                                    program.is_active === false
                                      ? "Program activated."
                                      : "Program deactivated.",
                                  );
                                } catch (error) {
                                  toast.error(
                                    error instanceof Error
                                      ? error.message
                                      : "Could not update program status.",
                                  );
                                }
                              } }
                            >
                              { program.is_active === false
                                ? "Activate"
                                : "Deactivate" }
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) }
                </TableBody>
              </Table>
            ) }
          </div>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Top referrers
              </h3>
            </div>
            { topReferrersQuery.isError ? (
              <QueryError
                error={ topReferrersQuery.error }
                onRetry={ topReferrersQuery.refetch }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Total referrals</TableHead>
                    <TableHead>Successful</TableHead>
                    <TableHead>Total earned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  { topReferrersQuery.isPending ? (
                    <TableRow>
                      <TableCell colSpan={ 4 } className="py-8 text-center">
                        Loading top referrers…
                      </TableCell>
                    </TableRow>
                  ) : topReferrersQuery.data?.length ? (
                    topReferrersQuery.data.map((referrer) => (
                      <TableRow key={ referrer.user_id }>
                        <TableCell className="font-medium text-slate-900">
                          { referrer.user_name }
                        </TableCell>
                        <TableCell>
                          { displayNumber(referrer, "referral_count") }
                        </TableCell>
                        <TableCell>
                          { displayNumber(referrer, "successful_count") }
                        </TableCell>
                        <TableCell>
                          { formatTzs(displayNumber(referrer, "total_earned")) }
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={ 4 }
                        className="py-8 text-center text-slate-500"
                      >
                        No referral activity to rank yet.
                      </TableCell>
                    </TableRow>
                  ) }
                </TableBody>
              </Table>
            ) }
          </section>
        </div>
      ) }

      { section === "users" && (
        <div className="space-y-4">
          <section className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card">
            <div className="grid w-full gap-3 sm:max-w-2xl sm:grid-cols-[minmax(12rem,1fr)_auto] sm:items-end">
              <label className={ LABEL_CLASS }>
                Program for enrollment
                <select
                  value={ selectedProgramId }
                  onChange={ (event) => setSelectedProgramId(event.target.value) }
                  className={ INPUT_CLASS }
                >
                  <option value="">Select a program</option>
                  { programs.map((program) => (
                    <option key={ program.id } value={ program.id }>
                      { program.name }
                    </option>
                  )) }
                </select>
              </label>
              <Button
                type="button"
                onClick={ enrollSelectedUsers }
                disabled={
                  !selectedProgramId ||
                  selectedCount === 0 ||
                  bulkEnroll.isPending
                }
                className="bg-brand-600 text-white hover:bg-brand-700"
              >
                <UserPlus aria-hidden="true" />
                Enroll { selectedCount ? `${selectedCount} selected` : "selected" }
              </Button>
            </div>
            <form
              onSubmit={ unenroll }
              className="grid w-full gap-2 sm:max-w-xl sm:grid-cols-[minmax(10rem,1fr)_auto]"
            >
              <label className={ LABEL_CLASS }>
                User ID to unenroll
                <Input
                  value={ unenrollUserId }
                  onChange={ (event) => setUnenrollUserId(event.target.value) }
                  placeholder="Paste user ID"
                  required
                />
              </label>
              <Button
                type="submit"
                variant="outline"
                disabled={
                  !selectedProgramId ||
                  !unenrollUserId.trim() ||
                  unenrollUser.isPending
                }
              >
                Unenroll user
              </Button>
            </form>
            <p className="w-full text-xs text-slate-500">
              Select a program above for both enrollment actions. The user list
              and API support pagination; filtering by name is not available on
              this endpoint.
            </p>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:px-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Users and referral codes
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Select users to enroll them, or inspect a user&apos;s referral history.
                </p>
              </div>
              <span className="text-xs text-slate-500">
                Page { usersPage + 1 }
              </span>
            </div>
            { usersQuery.isError ? (
              <QueryError error={ usersQuery.error } onRetry={ usersQuery.refetch } />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        aria-label="Select all users on this page"
                        checked={ allUsersSelected }
                        onChange={ toggleAllUsers }
                        className="size-4 rounded border-slate-300 accent-brand-600"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Referrals</TableHead>
                    <TableHead>Earned</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  { usersQuery.isPending ? (
                    <TableRow>
                      <TableCell colSpan={ 9 } className="py-10 text-center">
                        Loading users…
                      </TableCell>
                    </TableRow>
                  ) : users.length ? (
                    users.map((user) => (
                      <TableRow key={ user.user_id }>
                        <TableCell>
                          <input
                            type="checkbox"
                            aria-label={ `Select ${displayText(user, "name", user.user_id)}` }
                            checked={ selectedUsers.has(user.user_id) }
                            onChange={ () => toggleUser(user.user_id) }
                            className="size-4 rounded border-slate-300 accent-brand-600"
                          />
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                          { displayText(user, "name", user.user_id) }
                        </TableCell>
                        <TableCell>{ displayText(user, "phone") }</TableCell>
                        <TableCell>{ displayText(user, "referral_code") }</TableCell>
                        <TableCell>{ displayText(user, "program_name") }</TableCell>
                        <TableCell>
                          { displayNumber(user, "total_referrals") }{ " " }
                          <span className="text-xs text-slate-500">
                            ({ displayNumber(user, "successful_referrals") } successful)
                          </span>
                        </TableCell>
                        <TableCell>
                          { formatTzs(displayNumber(user, "total_earned_tzs")) }
                        </TableCell>
                        <TableCell>
                          { formatTzs(displayNumber(user, "pending_rewards_tzs")) }
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={ () => setDetailUserId(user.user_id) }
                            >
                              Details
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={
                                !selectedProgramId || enrollUser.isPending
                              }
                              onClick={ () => void enrollSingleUser(user.user_id) }
                            >
                              Enroll
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={ 9 }
                        className="py-10 text-center text-slate-500"
                      >
                        No users with referral codes found.
                      </TableCell>
                    </TableRow>
                  ) }
                </TableBody>
              </Table>
            ) }
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <span className="text-xs text-slate-500">
                { users.length } user{ users.length === 1 ? "" : "s" } on this page
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={ usersPage === 0 || usersQuery.isFetching }
                  onClick={ () => {
                    setUsersPage((page) => Math.max(0, page - 1));
                    setSelectedUsers(new Set());
                  } }
                >
                  <ChevronLeft aria-hidden="true" />
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={ !userPageHasNext || usersQuery.isFetching }
                  onClick={ () => {
                    setUsersPage((page) => page + 1);
                    setSelectedUsers(new Set());
                  } }
                >
                  Next
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            </div>
          </section>

          <Sheet
            open={ Boolean(detailUserId) }
            onOpenChange={ (open) => {
              if (!open) setDetailUserId("");
            } }
          >
            <SheetContent
              side="right"
              className="gap-0 overflow-y-auto p-0 sm:max-w-lg"
              style={ { width: "min(92vw, 32rem)" } }
            >
              <SheetHeader className="border-b border-slate-200 pr-12">
                <SheetTitle>Referral details</SheetTitle>
                <SheetDescription>
                  Referral code and activity for this user.
                </SheetDescription>
              </SheetHeader>
              <UserDetailPanel
                user={ userDetailQuery.data }
                isPending={ userDetailQuery.isPending }
                isError={ userDetailQuery.isError }
                error={ userDetailQuery.error }
                onRetry={ userDetailQuery.refetch }
              />
            </SheetContent>
          </Sheet>
        </div>
      ) }

      { section === "relationships" && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Referral relationships
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Review who referred each user and whether rewards have been paid.
              </p>
            </div>
            <label className="grid gap-1 text-xs font-medium text-slate-600">
              Status
              <select
                value={ relationshipStatus }
                onChange={ (event) => {
                  setRelationshipStatus(
                    event.target.value as "all" | "completed" | "pending",
                  );
                  setRelationshipsPage(0);
                } }
                className={ INPUT_CLASS }
              >
                <option value="all">All relationships</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </label>
          </div>
          { relationshipsQuery.isError ? (
            <QueryError
              error={ relationshipsQuery.error }
              onRetry={ relationshipsQuery.refetch }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Referrer</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Referee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Referred</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Program</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                { relationshipsQuery.isPending ? (
                  <TableRow>
                    <TableCell colSpan={ 8 } className="py-10 text-center">
                      Loading relationships…
                    </TableCell>
                  </TableRow>
                ) : relationships.length ? (
                  relationships.map((relationship) => {
                    const referrer = recordValue(relationship.referrer);
                    const referee = recordValue(relationship.referee);
                    const complete = booleanValue(
                      relationship.first_ride_completed,
                    );
                    return (
                      <TableRow key={ relationship.referral_id }>
                        <TableCell className="font-medium text-slate-900">
                          { displayText(referrer, "name") }
                        </TableCell>
                        <TableCell>{ displayText(referrer, "code") }</TableCell>
                        <TableCell>{ displayText(referee, "name") }</TableCell>
                        <TableCell className="capitalize">
                          { displayText(referee, "type") }
                        </TableCell>
                        <TableCell>
                          { displayText(relationship, "referred_at") }
                        </TableCell>
                        <TableCell>
                          <Badge variant={ complete ? "outline" : "secondary" }>
                            { complete ? "Completed" : "Pending" }
                          </Badge>
                        </TableCell>
                        <TableCell>
                          { booleanValue(relationship.rewards_paid)
                            ? "Paid"
                            : "Pending" }
                        </TableCell>
                        <TableCell>
                          { displayText(relationship, "program_name") }
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={ 8 }
                      className="py-10 text-center text-slate-500"
                    >
                      No relationships match this status.
                    </TableCell>
                  </TableRow>
                ) }
              </TableBody>
            </Table>
          ) }
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <span className="text-xs text-slate-500">
              { relationships.length } relationship
              { relationships.length === 1 ? "" : "s" } on this page
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={ relationshipsPage === 0 || relationshipsQuery.isFetching }
                onClick={ () =>
                  setRelationshipsPage((page) => Math.max(0, page - 1))
                }
              >
                <ChevronLeft aria-hidden="true" />
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  !relationshipPageHasNext || relationshipsQuery.isFetching
                }
                onClick={ () => setRelationshipsPage((page) => page + 1) }
              >
                Next
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        </section>
      ) }

      { section === "payments" && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Pending referral payments
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Mark a payment complete after processing it in your payment system.
            </p>
          </div>
          { paymentsQuery.isError ? (
            <QueryError
              error={ paymentsQuery.error }
              onRetry={ paymentsQuery.refetch }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                { paymentsQuery.isPending ? (
                  <TableRow>
                    <TableCell colSpan={ 7 } className="py-10 text-center">
                      Loading pending payments…
                    </TableCell>
                  </TableRow>
                ) : paymentsQuery.data?.length ? (
                  paymentsQuery.data.map((payment) => (
                    <TableRow key={ payment.id }>
                      <TableCell className="font-medium text-slate-900">
                        { displayText(
                          payment,
                          "user_name",
                          displayText(payment, "user_id"),
                        ) }
                      </TableCell>
                      <TableCell className="capitalize">
                        { displayText(payment, "user_type") }
                      </TableCell>
                      <TableCell className="font-semibold tabular-nums">
                        { formatTzs(payment.amount_tzs) }
                      </TableCell>
                      <TableCell>
                        { displayText(payment, "trigger_event") }
                      </TableCell>
                      <TableCell>
                        { displayText(payment, "program_name") }
                      </TableCell>
                      <TableCell>
                        { displayText(payment, "created_at") }
                      </TableCell>
                      <TableCell>
                        { paymentTargetId === payment.id ? (
                          <form
                            onSubmit={ submitPayment }
                            className="flex min-w-64 items-center justify-end gap-2"
                          >
                            <Input
                              aria-label="Transaction ID (optional)"
                              value={ transactionId }
                              onChange={ (event) =>
                                setTransactionId(event.target.value)
                              }
                              placeholder="Transaction ID (optional)"
                              className="h-8"
                            />
                            <Button
                              type="submit"
                              size="sm"
                              disabled={ markPaid.isPending }
                            >
                              <Check aria-hidden="true" />
                              Confirm
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={ () => setPaymentTargetId("") }
                              disabled={ markPaid.isPending }
                            >
                              Cancel
                            </Button>
                          </form>
                        ) : (
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={ () => setPaymentTargetId(payment.id) }
                            >
                              Mark paid
                            </Button>
                          </div>
                        ) }
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={ 7 }
                      className="py-10 text-center text-slate-500"
                    >
                      No pending referral payments.
                    </TableCell>
                  </TableRow>
                ) }
              </TableBody>
            </Table>
          ) }
        </section>
      ) }
    </div>
  );
}

function UserDetailPanel({
  user,
  isPending,
  isError,
  error,
  onRetry,
}: {
  user: ReferralUser | undefined;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  onRetry: () => void;
}) {
  const referredBy = Array.isArray(user?.referred_by) ? user.referred_by : [];
  const referredUsers = Array.isArray(user?.referred_users)
    ? user.referred_users
    : [];
  const rewards = Array.isArray(user?.rewards) ? user.rewards : [];

  const lists = [
    { title: "Referred by", values: referredBy },
    { title: "Users referred", values: referredUsers },
    { title: "Rewards", values: rewards },
  ];

  return (
    <div className="space-y-5 px-4 pb-6 pt-5">
      { isError ? (
        <QueryError error={ error } onRetry={ onRetry } />
      ) : isPending || !user ? (
        <div className="space-y-3" aria-label="Loading user details">
          <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 rounded-lg bg-slate-50 p-4">
            <div>
              <p className="text-xs text-slate-500">Name</p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                { displayText(user, "name", user.user_id) }
              </p>
            </div>
            <div className="grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">Referral code</p>
                <p className="mt-1 break-all text-sm font-medium text-slate-900">
                  { displayText(user, "referral_code") }
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="mt-1 break-all text-sm font-medium text-slate-900">
                  { displayText(user, "phone") }
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-5">
            { lists.map((list) => (
              <div key={ list.title }>
                <h4 className="mb-2 text-sm font-semibold text-slate-900">
                  { list.title }
                </h4>
                { list.values.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
                    None recorded.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    { list.values.map((entry, index) => {
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
                          key={
                            displayText(record, "id", `${list.title}-${index}`)
                          }
                          className="rounded-lg bg-slate-50 px-3 py-2 text-sm"
                        >
                          <p className="font-medium text-slate-800">{ heading }</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            { displayText(
                              record,
                              "status",
                              displayText(
                                record,
                                "referred_at",
                                displayText(record, "created_at"),
                              ),
                            ) }
                            { record.amount_tzs !== undefined
                              ? ` · ${formatTzs(
                                typeof record.amount_tzs === "number"
                                  ? record.amount_tzs
                                  : Number(record.amount_tzs) || 0,
                              )}`
                              : "" }
                          </p>
                        </li>
                      );
                    }) }
                  </ul>
                ) }
              </div>
            )) }
          </div>
        </>
      ) }
    </div>
  );
}

export default function ReferralsPage() {
  return <ReferralProgramsDashboard />;
}
