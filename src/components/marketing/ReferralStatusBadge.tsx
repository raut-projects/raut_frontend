import {
  REFERRAL_STATUS_BADGE_CLASSES,
  REFERRAL_STATUS_LABELS,
  type ReferralCodeStatus,
} from "@/lib/referralCodes";

export function ReferralStatusBadge({
  status,
}: {
  status: ReferralCodeStatus;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${REFERRAL_STATUS_BADGE_CLASSES[status]}`}
    >
      {REFERRAL_STATUS_LABELS[status]}
    </span>
  );
}
