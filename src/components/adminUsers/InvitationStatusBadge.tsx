import type { StaffInvitationStatus } from "@/types/staff";

const STATUS_META: Record<
  StaffInvitationStatus,
  { label: string; tone: string; dot: string }
> = {
  pending: {
    label: "Pending",
    tone: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  accepted: {
    label: "Accepted",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    tone: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
  },
  expired: {
    label: "Expired",
    tone: "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-400",
  },
};

export function InvitationStatusBadge({
  status,
}: {
  status: StaffInvitationStatus;
}) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.tone}`}
    >
      <span className={`size-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
