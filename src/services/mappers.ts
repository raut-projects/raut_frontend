// The admin API returns raw domain values (numbers, ISO timestamps, enums).
// Everything the screens display is formatted here so the pages stay free of
// data shaping.

import {
  DISPUTE_COMPLAINT_LABELS,
  DISPUTE_CURRENCY,
  type DisputeDecision,
  type DisputeStatus,
  type FareBreakdown,
  type RideDispute,
} from "../lib/rideDisputes";
import {
  suggestRefund,
  type DisputeIssueType,
  type RefundMethod,
} from "../lib/refundCalculator";
import type {
  RbacCatalogPermission,
  RbacCatalogRole,
  RbacRegion,
  RbacRolePermission,
} from "../types/rbac";
import type { StaffAssignment, StaffMember } from "../types/staff";

export const EMPTY = "—";

const numberFormat = new Intl.NumberFormat("en-US");

export const formatCount = (value) => {
  const amount = Number(value);

  return Number.isFinite(amount) ? numberFormat.format(amount) : EMPTY;
};

export const formatMoney = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return EMPTY;

  return `TZS ${numberFormat.format(amount)}`;
};

const compactFormat = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

// Axis labels need short values so the chart plot area is not squeezed.
export const formatCompact = (value) => {
  const amount = Number(value);

  return Number.isFinite(amount) ? compactFormat.format(amount) : EMPTY;
};

export const formatCompactMoney = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return EMPTY;

  return `TZS ${compactFormat.format(amount)}`;
};

const FILE_SIZE_UNITS = ["B", "KB", "MB", "GB"];

export const formatFileSize = (value) => {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes <= 0) return EMPTY;

  let size = bytes;
  let unit = 0;

  while (size >= 1024 && unit < FILE_SIZE_UNITS.length - 1) {
    size /= 1024;
    unit += 1;
  }

  const rounded =
    unit === 0 || size >= 10 ? Math.round(size) : Math.round(size * 10) / 10;

  return `${rounded} ${FILE_SIZE_UNITS[unit]}`;
};

export const formatDistance = (value) => {
  if (value === null || value === undefined || value === "") return EMPTY;

  const meters = Number(value);

  if (!Number.isFinite(meters) || meters < 0) return EMPTY;
  if (meters < 1000) return `${Math.round(meters)} m`;

  return `${(meters / 1000).toFixed(1)} km`;
};

export const formatDuration = (value) => {
  if (value === null || value === undefined || value === "") return EMPTY;

  const seconds = Number(value);

  if (!Number.isFinite(seconds) || seconds < 0) return EMPTY;
  if (seconds < 60) return `${Math.round(seconds)} sec`;

  const totalMinutes = Math.round(seconds / 60);

  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes ? `${hours} hr ${minutes} min` : `${hours} hr`;
};

export const formatDate = (value) => {
  if (!value) return EMPTY;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return EMPTY;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
};

export const formatDateTime = (value) => {
  if (!value) return EMPTY;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return EMPTY;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
};

export const formatRelative = (value) => {
  if (!value) return EMPTY;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return EMPTY;

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";

  const minutes = Math.round(seconds / 60);

  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);

  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.round(hours / 24);

  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return formatDate(value);
};

// Percentage change between two periods, ready for the stat cards.
export const formatDelta = (current, previous) => {
  const now = Number(current) || 0;
  const before = Number(previous) || 0;

  if (!before) return now ? "New activity" : "No change";

  const change = ((now - before) / before) * 100;

  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
};

export const shortId = (value, prefix = "RID") => {
  const id = String(value ?? "").replace(/-/g, "");

  if (!id) return EMPTY;

  return `#${prefix}-${id.slice(0, 8).toUpperCase()}`;
};

export const DRIVER_STATUS_LABELS = {
  none: "Not a driver",
  incomplete: "Incomplete",
  pending: "Pending",
  verified: "Verified",
  rejected: "Rejected",
  suspended: "Suspended",
  blocked: "Blocked",
};

export const DOCUMENT_TYPE_LABELS = {
  license: "Driving licence",
  registration: "Vehicle registration",
  inspection: "Inspection certificate",
  insurance: "Insurance",
  profile_photo: "Profile photo",
  certificate_of_authorization: "Certificate of authorization",
  sticker_photo: "Sticker photo",
  vehicle_photo: "Vehicle photo",
};

export const DOCUMENT_STATUS_LABELS = {
  pending: "Pending review",
  approved: "Approved",
  verified: "Approved",
  rejected: "Rejected",
  expired: "Expired",
};

// The backend marks a reviewed document as approved, but a verified spelling
// is accepted as well so an unexpected value still reads correctly.
const APPROVED_DOCUMENT_STATUSES = ["approved", "verified"];

export const RIDE_STATUS_LABELS = {
  requested: "Pending",
  searching: "Pending",
  joined: "In transit",
  accepted: "In transit",
  picked_up: "In transit",
  in_progress: "In transit",
  completed: "Delivered",
  cancelled: "Cancelled",
  rejected: "Cancelled",
  expired: "Cancelled",
};

export const ROUTE_STATUS_LABELS = {
  scheduled: "Scheduled",
  active: "Active",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
};

const ROUTE_CANCELLABLE_STATUSES = ["scheduled", "active", "in_progress"];

const NOTIFICATION_TYPES = {
  ride_completed: "success",
  ride_cancelled: "error",
  payment_received: "success",
  payment_failed: "error",
  driver_approved: "success",
  driver_rejected: "error",
  document_expiring: "warning",
  new_ride: "info",
  account_update: "info",
};

const titleCase = (value) =>
  String(value ?? "")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

export const mapCustomer = (user) => ({
  id: user?.id ?? null,
  name: user?.full_name?.trim() || user?.email?.trim() || "Unnamed account",
  email: user?.email ?? EMPTY,
  phone: user?.phone ?? EMPTY,
  orders: Number(user?.total_rides ?? 0),
  joined: formatDate(user?.created_at),
  status: user?.is_active === false ? "Inactive" : "Active",
  statusKey: user?.is_active === false ? "inactive" : "active",
  role: user?.role ?? "user",
  isDriver: Boolean(user?.is_driver),
  isActive: user?.is_active !== false,
  createdAt: user?.created_at ?? null,
});

export const mapDriver = (driver) => {
  const statusKey = driver?.driver_status ?? "none";
  const profile = driver?.profile ?? {};
  const activity = profile?.activity ?? driver?.activity ?? {};
  const personal =
    profile?.personal_information ??
    profile?.personal ??
    profile?.account ??
    {};
  const vehicleValue =
    driver?.vehicle ??
    driver?.vehicle_info ??
    profile?.vehicle ??
    profile?.vehicle_info ??
    profile?.vehicle_details ??
    {};
  const vehicle = Array.isArray(vehicleValue)
    ? (vehicleValue[0] ?? {})
    : vehicleValue;
  const firstDriverValue = (sources, keys) => {
    for (const source of sources) {
      const value = firstOf(source, keys);
      if (value !== null && value !== undefined && value !== "") return value;
    }
    return null;
  };
  const rawIssues = firstDriverValue(
    [driver, profile, activity],
    [
      "has_issues",
      "active_issues",
      "open_issues",
      "current_issues",
      "flags",
      "issue_count",
    ],
  );
  const rawIssueNumber = Number(rawIssues);
  const hasIssues =
    rawIssues === null
      ? null
      : typeof rawIssues === "boolean"
        ? rawIssues
        : typeof rawIssues === "number"
          ? rawIssues > 0
          : Array.isArray(rawIssues)
            ? rawIssues.length > 0
            : typeof rawIssues === "object"
              ? Object.keys(rawIssues).length > 0
              : Number.isFinite(rawIssueNumber) &&
                  String(rawIssues).trim() !== ""
                ? rawIssueNumber > 0
                : !["false", "no", "none"].includes(
                    String(rawIssues).toLowerCase(),
                  );
  const vehicleMake = firstDriverValue(
    [vehicle, driver, profile],
    ["make", "manufacturer", "vehicle_make"],
  );
  const vehicleModel = firstDriverValue(
    [vehicle, driver, profile],
    ["model", "vehicle_model"],
  );
  const vehicleType = firstDriverValue(
    [vehicle, driver, profile],
    ["vehicle_type", "type"],
  );
  const vehicleName = [vehicleMake, vehicleModel].filter(Boolean).join(" ");
  const vehicleLabel =
    vehicleName ||
    (typeof vehicleValue === "string" ? vehicleValue : null) ||
    vehicleType ||
    null;
  const rawOnline = firstDriverValue(
    [driver, profile, personal, activity],
    ["is_online", "online", "online_status", "availability_status"],
  );
  const online =
    typeof rawOnline === "boolean"
      ? rawOnline
      : rawOnline === null
        ? null
        : ["online", "available", "active", "true", "1"].includes(
              String(rawOnline).toLowerCase(),
            )
          ? true
          : ["offline", "unavailable", "inactive", "false", "0"].includes(
                String(rawOnline).toLowerCase(),
              )
            ? false
            : null;

  return {
    id: driver?.id ?? null,
    name:
      driver?.full_name?.trim() || driver?.email?.trim() || "Unnamed driver",
    phone: driver?.phone ?? EMPTY,
    email: driver?.email ?? EMPTY,
    status: DRIVER_STATUS_LABELS[statusKey] ?? titleCase(statusKey),
    statusKey,
    rides: Number(driver?.total_rides ?? 0),
    rating: Number(driver?.rating_avg ?? 0) || 0,
    ratingCount: Number(driver?.rating_count ?? 0),
    isActive: driver?.is_active !== false,
    joined: formatDate(driver?.created_at),
    createdAt: driver?.created_at ?? personal?.created_at ?? null,
    pendingSince: firstDriverValue(
      [driver, profile, activity],
      [
        "application_submitted_at",
        "driver_status_updated_at",
        "status_changed_at",
        "submitted_at",
        "created_at",
      ],
    ),
    vehicle: vehicleLabel,
    vehicleMake: vehicleMake,
    vehicleModel: vehicleModel,
    vehicleType: vehicleType,
    vehicleYear: firstDriverValue(
      [vehicle, driver, profile],
      ["year", "model_year"],
    ),
    vehicleColor: firstDriverValue(
      [vehicle, driver, profile],
      ["color", "vehicle_color"],
    ),
    vehicleInsuranceExpiry: firstDriverValue(
      [vehicle, driver, profile],
      ["insurance_expiry", "insurance_expires_at", "insurance_expiry_date"],
    ),
    vehicleInsuranceValid: firstDriverValue(
      [vehicle, driver, profile],
      ["insurance_valid", "is_insurance_valid"],
    ),
    vehiclePlateVerified: firstDriverValue(
      [vehicle, driver, profile],
      ["plate_verified", "vehicle_verified"],
    ),
    plateNumber:
      firstDriverValue(
        [vehicle, driver, profile],
        ["plate_number", "license_plate", "registration_number", "plate"],
      ) ?? null,
    online,
    hasIssues,
    verifiedAt: formatDate(driver?.driver_verified_at),
  };
};

const IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "bmp",
  "heic",
  "heif",
  "avif",
];

const documentFormat = (contentType, fileName) => {
  const type = String(contentType ?? "").toLowerCase();
  const [mediaType, subtype = ""] = type.split("/");
  const extension =
    /\.([a-z0-9]+)$/i.exec(String(fileName ?? ""))?.[1]?.toLowerCase() ?? "";
  const isImage = mediaType === "image" || IMAGE_EXTENSIONS.includes(extension);

  if (subtype) {
    return {
      isImage,
      formatLabel: subtype === "svg+xml" ? "SVG" : subtype.toUpperCase(),
    };
  }

  return { isImage, formatLabel: extension ? extension.toUpperCase() : EMPTY };
};

export const mapDocument = (document) => {
  const statusKey = document?.status ?? "pending";
  const typeKey = document?.doc_type ?? "";
  const { isImage, formatLabel } = documentFormat(
    document?.content_type,
    document?.file_name,
  );

  return {
    id: document?.id ?? null,
    type: typeKey,
    typeLabel:
      DOCUMENT_TYPE_LABELS[typeKey] ?? (typeKey ? titleCase(typeKey) : EMPTY),
    status: DOCUMENT_STATUS_LABELS[statusKey] ?? titleCase(statusKey),
    statusKey,
    fileName: document?.file_name ?? EMPTY,
    fileUrl: document?.file_url ?? null,
    contentType: document?.content_type ?? null,
    fileSize: Number(document?.file_size) || 0,
    fileSizeLabel: formatFileSize(document?.file_size),
    fileFormatLabel: formatLabel,
    isImage,
    vehicleId: document?.vehicle_id ?? null,
    expiresAt: document?.expires_at ?? null,
    expiry: document?.expires_at
      ? formatDate(document.expires_at)
      : "No expiry",
    uploadedAt: formatDate(document?.created_at),
    reviewedAt: document?.reviewed_at ? formatDate(document.reviewed_at) : null,
    reviewedBy:
      document?.reviewed_by_name ??
      document?.reviewer_name ??
      document?.admin_name ??
      null,
    reviewNotes:
      document?.review_notes ??
      document?.notes ??
      document?.admin_notes ??
      null,
    rejectionReason: document?.rejection_reason ?? null,
    isApproved: APPROVED_DOCUMENT_STATUSES.includes(statusKey),
    isRejected: statusKey === "rejected",
  };
};

export const PAYOUT_STATUS_LABELS = {
  pending: "Pending",
  requested: "Pending",
  scheduled: "Scheduled",
  processing: "Processing",
  approved: "Approved",
  paid: "Paid",
  completed: "Paid",
  settled: "Paid",
  transferred: "Paid",
  success: "Paid",
  failed: "Failed",
  error: "Failed",
  reversed: "Reversed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const PAYOUT_METHOD_LABELS = {
  mobile_money: "Mobile money",
  mpesa: "M-Pesa",
  bank: "Bank transfer",
  bank_transfer: "Bank transfer",
  cash: "Cash",
  card: "Card",
};

// The status groups decide which actions the table offers.
export const PAYOUT_AWAITING_STATUSES = [
  "pending",
  "requested",
  "approved",
  "scheduled",
  "processing",
];

export const PAYOUT_SETTLED_STATUSES = [
  "paid",
  "completed",
  "settled",
  "transferred",
  "success",
];

export const PAYOUT_FAILED_STATUSES = ["failed", "error", "reversed"];

export const PAYOUT_APPROVABLE_STATUSES = [
  "pending",
  "requested",
  "approved",
  "scheduled",
];

// The payout endpoints have no declared response model, so every field is read
// through a list of candidates and the first match wins. The API is free to
// name a field differently than expected without breaking the screen.
const firstOf = (source, keys, fallback = null) => {
  if (!source || typeof source !== "object") return fallback;

  for (const key of keys) {
    const value = source[key];

    if (value !== undefined && value !== null && value !== "") return value;
  }

  return fallback;
};

const phoneVerificationValue = (value) => {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;

  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (["true", "verified", "confirmed"].includes(normalized)) return true;
  if (["false", "unverified", "unconfirmed"].includes(normalized)) return false;

  return null;
};

export const mapPayout = (payout) => {
  const statusKey = String(
    firstOf(payout, ["status", "payout_status"], "pending"),
  ).toLowerCase();
  const methodKey = String(
    firstOf(
      payout,
      ["method", "payout_method", "payment_method", "channel"],
      "",
    ),
  ).toLowerCase();
  const driver = payout?.driver ?? null;
  const rawPhoneVerification = firstOf(
    payout,
    ["driver_phone_verified", "phone_verified", "is_phone_verified"],
    firstOf(driver, ["phone_verified", "is_phone_verified"]),
  );
  const phoneVerifiedAt = firstOf(
    payout,
    ["driver_phone_verified_at", "phone_verified_at"],
    firstOf(driver, ["phone_verified_at"]),
  );

  const rawAmount = firstOf(
    payout,
    ["amount", "payout_amount", "total_amount", "net_amount", "gross_amount"],
    0,
  );
  const amount = Number(rawAmount);

  const driverName =
    firstOf(payout, ["driver_name", "driver_full_name"]) ??
    firstOf(driver, ["full_name", "name"]);

  return {
    id: firstOf(payout, ["id", "payout_id"]),
    driverId:
      firstOf(payout, ["driver_id"]) ?? firstOf(driver, ["id", "driver_id"]),
    driverName: driverName ?? EMPTY,
    driverPhone:
      firstOf(payout, ["driver_phone", "driver_phone_number"]) ??
      firstOf(driver, ["phone", "phone_number"]) ??
      EMPTY,
    phoneVerified:
      rawPhoneVerification === null
        ? phoneVerifiedAt
          ? true
          : null
        : phoneVerificationValue(rawPhoneVerification),
    previousFailureCount: Math.max(
      0,
      Number(
        firstOf(payout, [
          "previous_failure_count",
          "failed_attempts",
          "retry_count",
        ]) ?? 0,
      ) || 0,
    ),
    amount: Number.isFinite(amount) ? amount : 0,
    amountLabel: formatMoney(rawAmount),
    methodKey,
    method:
      PAYOUT_METHOD_LABELS[methodKey] ??
      (methodKey ? titleCase(methodKey) : EMPTY),
    methodDetails:
      firstOf(payout, [
        "phone_number",
        "mobile_money_number",
        "account_number",
        "bank_account",
        "destination_account",
      ]) ?? EMPTY,
    statusKey,
    status: PAYOUT_STATUS_LABELS[statusKey] ?? titleCase(statusKey),
    reference:
      firstOf(payout, [
        "reference",
        "transaction_reference",
        "external_reference",
        "payout_reference",
        "transaction_id",
      ]) ?? EMPTY,
    notes: firstOf(payout, ["notes", "admin_notes", "note"]) ?? EMPTY,
    rejectionReason: firstOf(payout, ["rejection_reason", "reason"]) ?? EMPTY,
    requestedAt: formatDateTime(
      firstOf(payout, [
        "created_at",
        "requested_at",
        "initiated_at",
        "requested_date",
      ]),
    ),
    processedAt: formatDateTime(
      firstOf(payout, [
        "processed_at",
        "approved_at",
        "paid_at",
        "completed_at",
        "paid_date",
      ]),
    ),
    periodStart: formatDate(
      firstOf(payout, [
        "period_start",
        "period_start_date",
        "start_date",
        "from_date",
      ]),
    ),
    periodEnd: formatDate(
      firstOf(payout, ["period_end", "period_end_date", "end_date", "to_date"]),
    ),
    isAwaiting: PAYOUT_AWAITING_STATUSES.includes(statusKey),
    isSettled: PAYOUT_SETTLED_STATUSES.includes(statusKey),
    isFailed: PAYOUT_FAILED_STATUSES.includes(statusKey),
    canApprove: PAYOUT_APPROVABLE_STATUSES.includes(statusKey),
    canRetry: PAYOUT_FAILED_STATUSES.includes(statusKey),
  };
};

export const mapRide = (ride) => {
  const statusKey = ride?.status ?? "requested";
  const pickup =
    ride?.pickup_name?.trim() || ride?.route_origin?.trim() || EMPTY;
  const dropoff =
    ride?.dropoff_name?.trim() || ride?.route_destination?.trim() || EMPTY;

  return {
    id: shortId(ride?.id),
    rideId: ride?.id ?? null,
    customer: ride?.rider_name?.trim() || "Unknown customer",
    customerPhone: ride?.rider_phone ?? EMPTY,
    driver: ride?.driver_name?.trim() || "Unassigned",
    driverPhone: ride?.driver_phone ?? EMPTY,
    pickup,
    dropoff,
    zone: ride?.route_origin?.trim() || ride?.pickup_name?.trim() || EMPTY,
    route:
      pickup === EMPTY || dropoff === EMPTY ? pickup : `${pickup} → ${dropoff}`,
    amount: formatMoney(ride?.fare_amount),
    fare: Number(ride?.fare_amount ?? 0),
    platformFee: formatMoney(ride?.platform_fee),
    driverEarning: formatMoney(ride?.driver_earning),
    seats: Number(ride?.seats_requested ?? 0),
    status: RIDE_STATUS_LABELS[statusKey] ?? titleCase(statusKey),
    statusKey,
    date: formatDate(ride?.created_at),
    requestedAt: formatDateTime(ride?.created_at),
    createdAt: ride?.created_at ?? null,
    hasDispute: Boolean(ride?.has_dispute ?? ride?.hasDispute ?? ride?.dispute),
    disputeStatus: ride?.dispute_status ?? ride?.disputeStatus ?? null,
    disputeId: ride?.dispute_id ?? ride?.disputeId ?? null,
  };
};

const DISPUTE_ISSUE_TYPES: DisputeIssueType[] = [
  "wrong_route",
  "overcharge",
  "driver_no_show",
  "late_arrival",
  "other",
];

const numberOrZero = (value) => {
  const amount = Number(value);

  return Number.isFinite(amount) ? amount : 0;
};

const mapDisputeIssueType = (value): DisputeIssueType => {
  const issue = String(value ?? "")
    .trim()
    .toLowerCase();

  return DISPUTE_ISSUE_TYPES.includes(issue as DisputeIssueType)
    ? (issue as DisputeIssueType)
    : "other";
};

// Dispute responses are not typed by the backend contract, so fields are read
// through aliases and coerced to the numeric/shape the dispute forms expect.
export const mapRideDispute = (raw, rideIdHint = ""): RideDispute => {
  const source = raw?.dispute ?? raw ?? {};
  const rawEvidence = source?.evidence ?? raw?.evidence ?? {};
  const rawFare =
    rawEvidence?.fare_breakdown ??
    rawEvidence?.fareBreakdown ??
    source?.fare_breakdown ??
    source?.fareBreakdown ??
    {};

  const rideId = String(
    firstOf(
      source,
      ["ride_id", "rideId"],
      firstOf(raw, ["ride_id", "rideId"], rideIdHint),
    ) ??
      rideIdHint ??
      "",
  );
  const complaint = mapDisputeIssueType(
    firstOf(source, ["complaint", "issue_type", "issueType", "reason"]),
  );
  const actualDistanceKm = numberOrZero(
    firstOf(rawEvidence, [
      "actual_distance_km",
      "actualDistanceKm",
      "actual_distance",
    ]),
  );
  const optimalDistanceKm = numberOrZero(
    firstOf(rawEvidence, [
      "optimal_distance_km",
      "optimalDistanceKm",
      "optimal_distance",
    ]),
  );
  const extraDistanceKm = numberOrZero(
    firstOf(
      rawEvidence,
      ["extra_distance_km", "extraDistanceKm", "extra_distance"],
      Math.max(0, actualDistanceKm - optimalDistanceKm),
    ),
  );
  const originalFare = numberOrZero(
    firstOf(
      rawEvidence,
      ["original_fare", "originalFare", "fare_amount", "fareAmount"],
      firstOf(source, ["original_fare", "fare_amount", "fare"]),
    ),
  );
  const suggestedRefundValue = firstOf(source, [
    "suggested_refund",
    "suggestedRefund",
  ]);
  const statusValue = String(
    firstOf(source, ["status", "dispute_status"], "open"),
  ).toLowerCase();
  const status: DisputeStatus = ["resolved", "closed", "completed"].includes(
    statusValue,
  )
    ? "resolved"
    : "open";
  const decisionValue = String(
    firstOf(source, ["decision", "resolution_decision"], ""),
  ).toLowerCase();
  const decision = ["rider", "driver", "split"].includes(decisionValue)
    ? (decisionValue as DisputeDecision)
    : undefined;
  const refundValue = firstOf(source, ["refund_amount", "refundAmount"]);
  const methodValue = String(
    firstOf(source, ["refund_method", "refundMethod"], ""),
  ).toLowerCase();
  const refundMethod = ["mpesa", "wallet", "next_ride_discount"].includes(
    methodValue,
  )
    ? (methodValue as RefundMethod)
    : undefined;
  const resolutionNote = firstOf(source, [
    "resolution_note",
    "resolutionNote",
    "note",
  ]);
  const filedAt = firstOf(source, [
    "filed_at",
    "filedAt",
    "created_at",
    "createdAt",
  ]);
  const resolvedAt = firstOf(source, ["resolved_at", "resolvedAt"]);
  const displayId =
    firstOf(source, ["display_id", "displayId"]) ?? shortId(rideId, "RD");
  const id =
    firstOf(source, ["id", "dispute_id", "disputeId"]) ??
    `DIS-${String(displayId).replace(/^#RD-/, "")}`;
  const fareBreakdown: FareBreakdown = {
    baseFare: numberOrZero(firstOf(rawFare, ["base_fare", "baseFare"])),
    distanceCharge: numberOrZero(
      firstOf(rawFare, ["distance_charge", "distanceCharge"]),
    ),
    timeCharge: numberOrZero(firstOf(rawFare, ["time_charge", "timeCharge"])),
    platformFee: numberOrZero(
      firstOf(rawFare, ["platform_fee", "platformFee"]),
    ),
    total: numberOrZero(firstOf(rawFare, ["total"], originalFare)),
  };

  return {
    id: String(id),
    rideId,
    displayId: String(displayId),
    status,
    disputingParty: String(
      firstOf(
        source,
        ["disputing_party", "disputingParty", "filed_by", "complainant"],
        EMPTY,
      ) ?? EMPTY,
    ),
    complaint,
    complaintLabel: DISPUTE_COMPLAINT_LABELS[complaint],
    filedAt: formatDateTime(filedAt),
    evidence: {
      actualDistanceKm,
      optimalDistanceKm,
      extraDistanceKm,
      originalFare,
      routeLabel:
        firstOf(rawEvidence, ["route_label", "routeLabel"]) ?? undefined,
      fareBreakdown,
    },
    suggestedRefund:
      suggestedRefundValue === null
        ? suggestRefund({
            issueType: complaint,
            originalFare,
            actualDistanceKm,
            extraDistanceKm,
          })
        : numberOrZero(suggestedRefundValue),
    currency: String(
      firstOf(source, ["currency"], DISPUTE_CURRENCY) ?? DISPUTE_CURRENCY,
    ),
    decision,
    refundAmount: refundValue === null ? undefined : numberOrZero(refundValue),
    refundMethod,
    resolutionNote:
      resolutionNote === null ? undefined : String(resolutionNote),
    resolvedAt: resolvedAt ? formatDateTime(resolvedAt) : undefined,
  };
};

export const mapRoute = (route) => {
  const statusKey = String(route?.status ?? "unknown").toLowerCase();
  const origin = route?.origin_name?.trim() || EMPTY;
  const destination = route?.dest_name?.trim() || EMPTY;
  const routePath =
    origin === EMPTY || destination === EMPTY
      ? origin || destination
      : `${origin} \u2192 ${destination}`;

  return {
    id: shortId(route?.id, "RTE"),
    routeId: route?.id ?? null,
    driverId: route?.driver_id ?? null,
    vehicleId: route?.vehicle_id ?? null,
    driver: route?.driver_name?.trim() || "Unassigned",
    driverPhone: route?.driver_phone ?? EMPTY,
    vehicle: route?.vehicle_info?.trim() || EMPTY,
    plateNumber: route?.plate_number ?? EMPTY,
    origin,
    destination,
    route: routePath,
    originLat: Number(route?.origin_lat),
    originLng: Number(route?.origin_lng),
    destLat: Number(route?.dest_lat),
    destLng: Number(route?.dest_lng),
    distanceM: Number(route?.route_distance_m ?? 0),
    distance: formatDistance(route?.route_distance_m),
    durationS: Number(route?.route_duration_s ?? 0),
    duration: formatDuration(route?.route_duration_s),
    seats: Number(route?.available_seats ?? 0),
    status: ROUTE_STATUS_LABELS[statusKey] ?? titleCase(statusKey),
    statusKey,
    scheduledFor: route?.scheduled_for
      ? formatDateTime(route.scheduled_for)
      : "Not scheduled",
    startedAt: route?.started_at
      ? formatDateTime(route.started_at)
      : "Not started",
    completedAt: route?.completed_at
      ? formatDateTime(route.completed_at)
      : "Not completed",
    createdAt: formatDateTime(route?.created_at),
    created: formatDate(route?.created_at),
    activeRides: Number(route?.active_rides_count ?? 0),
    totalRides: Number(route?.total_rides_count ?? 0),
    canCancel: ROUTE_CANCELLABLE_STATUSES.includes(statusKey),
  };
};

export const TRANSACTION_STATUS_LABELS = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  successful: "Completed",
  paid: "Completed",
  settled: "Completed",
  success: "Completed",
  failed: "Failed",
  error: "Failed",
  cancelled: "Cancelled",
  refunded: "Refunded",
  reversed: "Reversed",
};

export const TRANSACTION_TYPE_LABELS = {
  payment: "Payment",
  ride_payment: "Ride Payment",
  ride_earning: "Ride Earning",
  fare: "Fare",
  payout: "Payout",
  withdrawal: "Withdrawal",
  refund: "Refund",
  commission: "Commission",
  fee: "Fee",
  top_up: "Top Up",
  deposit: "Deposit",
};

const TRANSACTION_AWAITING_STATUSES = ["pending", "processing"];
const TRANSACTION_COMPLETED_STATUSES = [
  "completed",
  "successful",
  "paid",
  "settled",
  "success",
];
const TRANSACTION_FAILED_STATUSES = [
  "failed",
  "error",
  "cancelled",
  "reversed",
];

export const mapTransaction = (transaction) => {
  const statusKey = String(transaction?.status ?? "pending").toLowerCase();
  const typeKey = String(transaction?.type ?? "").toLowerCase();
  const rawAmount = transaction?.amount ?? 0;
  const amount = Number(rawAmount);
  return {
    id: transaction?.id ?? null,
    reference: transaction?.external_ref ?? transaction?.id ?? EMPTY,
    userId: transaction?.user_id ?? null,
    userName: transaction?.user_name?.trim() || EMPTY,
    userPhone: transaction?.user_phone ?? EMPTY,
    typeKey,
    type:
      TRANSACTION_TYPE_LABELS[typeKey] ??
      (typeKey ? titleCase(typeKey) : EMPTY),
    amount: Number.isFinite(amount) ? amount : 0,
    amountLabel: formatMoney(rawAmount),
    currency: "TZS",
    statusKey,
    status: TRANSACTION_STATUS_LABELS[statusKey] ?? titleCase(statusKey),
    description: EMPTY,
    paymentMethod: EMPTY,
    rideId: transaction?.ride_id ?? null,
    routeId: null,
    payoutId: transaction?.payout_id ?? null,
    createdAt: formatDateTime(transaction?.created_at),
    updatedAt: formatDateTime(transaction?.completed_at),
    created: formatDate(transaction?.created_at),
    completedAt: formatDateTime(transaction?.completed_at),
    externalRef: transaction?.external_ref ?? null,
    isPending: TRANSACTION_AWAITING_STATUSES.includes(statusKey),
    isCompleted: TRANSACTION_COMPLETED_STATUSES.includes(statusKey),
    isFailed: TRANSACTION_FAILED_STATUSES.includes(statusKey),
  };
};

export const mapNotification = (notification) => ({
  id: notification?.id,
  type: NOTIFICATION_TYPES[notification?.type] ?? "info",
  title: notification?.title ?? "Update",
  message: notification?.body ?? "",
  time: formatRelative(notification?.created_at),
  read: Boolean(notification?.is_read),
  to: notification?.ride_id
    ? "/rides"
    : notification?.route_id
      ? "/routes"
      : null,
});

// Config values arrive as objects, null, strings or primitives. Objects pass
// through; null/undefined become {}; strings are JSON-parsed when possible (a
// parsed object wins, a parsed primitive is wrapped as { value }), and any
// unparseable string or primitive is wrapped as { value } so consumers always
// see a record.
const asConfigValue = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (value === null || value === undefined) return {};

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) return {};

    try {
      const parsed = JSON.parse(trimmed);

      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }

      return { value: parsed };
    } catch {
      return { value };
    }
  }

  return { value };
};

export const mapConfigRecord = (raw) => ({
  id: String(raw?.id ?? ""),
  key: String(raw?.config_key ?? raw?.key ?? ""),
  value: asConfigValue(raw?.config_value ?? raw?.value),
  type: String(raw?.config_type ?? raw?.type ?? ""),
  description: String(raw?.description ?? ""),
  region: raw?.region ?? null,
  vehicleType: raw?.vehicle_type ?? raw?.vehicleType ?? null,
  version: Number(raw?.version ?? 0),
  activeFrom: raw?.active_from ?? raw?.activeFrom ?? null,
  activeUntil: raw?.active_until ?? raw?.activeUntil ?? null,
  updatedAt: raw?.updated_at ?? raw?.updatedAt ?? null,
  notes: raw?.notes ?? null,
});

export const mapConfigDetail = (raw) => {
  const source = raw?.config ?? raw ?? {};

  return {
    key: String(source?.key ?? source?.config_key ?? ""),
    value: asConfigValue(source?.value ?? source?.config_value),
    region: source?.region ?? null,
    vehicleType: source?.vehicle_type ?? source?.vehicleType ?? null,
  };
};

export const mapConfigHistoryEntry = (entry) => ({
  id: String(entry?.id ?? ""),
  version: Number(entry?.version ?? 0),
  previousVersionId:
    entry?.previous_version_id ?? entry?.previousVersionId ?? null,
  value: asConfigValue(entry?.config_value ?? entry?.value ?? entry?.new_value),
  changedAt:
    entry?.created_at ?? entry?.active_from ?? entry?.changed_at ?? null,
  changedBy:
    entry?.updated_by ??
    entry?.created_by ??
    entry?.changed_by ??
    entry?.admin_name ??
    null,
  notes: entry?.notes ?? entry?.note ?? null,
});

export const mapConfigHistory = (response) => {
  const history = Array.isArray(response?.history)
    ? response.history
    : Array.isArray(response?.items)
      ? response.items
      : [];

  return history.map(mapConfigHistoryEntry);
};

const roleAssignments = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((role) => ({
      assignmentId: firstOf(role, ["assignment_id", "assignmentId"]),
      key: String(firstOf(role, ["key", "name", "role"], "") ?? ""),
      scope: firstOf(role, ["scope", "scope_type", "scopeType"], "platform"),
      scopeId: firstOf(role, ["scope_id", "scopeId"]),
      expiresAt: firstOf(role, ["expires_at", "expiresAt"]),
    }))
    .filter((role) => role.key);
};

const normalizeAccessGrant = (code, raw) => {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const requiredScopes = Array.isArray(
    firstOf(source, ["required_scopes", "requiredScopes"]),
  )
    ? (firstOf(source, ["required_scopes", "requiredScopes"]) as unknown[])
        .map((scope) => String(scope ?? "").trim())
        .filter(Boolean)
    : [];

  return {
    code,
    scope: String(
      firstOf(source, ["scope", "scope_type", "scopeType"], "platform") ??
        "platform",
    ),
    scopeId:
      firstOf(source, ["scope_id", "scopeId"], null) === undefined
        ? null
        : (firstOf(source, ["scope_id", "scopeId"], null) as string | null),
    requiredScopes,
    assignmentId:
      firstOf(source, ["assignment_id", "assignmentId"], null) === undefined
        ? null
        : (firstOf(source, ["assignment_id", "assignmentId"], null) as
            | string
            | null),
    constraints: rbacConstraints(
      firstOf(source, ["constraints", "conditions", "metadata"]),
    ),
  };
};

const addAccessGrant = (grantsByCode, code, raw) => {
  const normalizedCode = String(code ?? "").trim();
  if (!normalizedCode) return;

  const grant = normalizeAccessGrant(normalizedCode, raw);
  const existing = grantsByCode[normalizedCode] ?? [];
  grantsByCode[normalizedCode] = [...existing, grant];
};

const collectAccessGrants = (value) => {
  const grantsByCode: Record<string, ReturnType<typeof normalizeAccessGrant>[]> =
    {};

  if (Array.isArray(value)) {
    value.forEach((entry) => {
      if (typeof entry === "string") {
        addAccessGrant(grantsByCode, entry, null);
        return;
      }

      if (entry && typeof entry === "object") {
        const code = firstOf(entry, ["code", "permission", "key"]);
        if (typeof code === "string") addAccessGrant(grantsByCode, code, entry);
      }
    });

    return grantsByCode;
  }

  if (value && typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(
      ([code, rawGrant]) => {
        if (Array.isArray(rawGrant)) {
          rawGrant.forEach((entry) => addAccessGrant(grantsByCode, code, entry));
          return;
        }

        addAccessGrant(grantsByCode, code, rawGrant);
      },
    );
  }

  return grantsByCode;
};

export function mapRbacAccess(raw) {
  const data = raw && typeof raw === "object" && "data" in raw ? raw.data : raw;
  const source = data && typeof data === "object" ? data : {};
  const rawPermissions = firstOf(
    source,
    [
      "permissions",
      "permission_codes",
      "permissionCodes",
      "codes",
      "grants",
      "permission_grants",
      "permissionGrants",
      "scoped_permissions",
      "scopedPermissions",
      "effective_permissions",
      "effectivePermissions",
    ],
    Array.isArray(data) ? data : [],
  );
  const rawRoles = firstOf(source, [
    "roles",
    "role_assignments",
    "roleAssignments",
  ]);
  const grantsByCode = collectAccessGrants(rawPermissions);

  return {
    permissions: Object.keys(grantsByCode),
    grantsByCode,
    roles: roleAssignments(rawRoles),
  };
}

const rbacCollection = (source, keys) => {
  if (Array.isArray(source)) return source;

  for (const key of keys) {
    const value = firstOf(source, [key]);
    if (Array.isArray(value)) return value;
  }

  return [];
};

const rbacConstraints = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return { value };
    }
  }

  return {};
};

export const mapRbacPermission = (raw): RbacCatalogPermission => {
  const source = raw && typeof raw === "object" ? raw : {};
  const code = String(
    firstOf(source, ["code", "permission_code", "permissionCode", "key"], "") ??
      "",
  );

  return {
    code,
    name: String(firstOf(source, ["name", "label", "title"], code) ?? code),
    description: String(firstOf(source, ["description", "desc"], "") ?? ""),
    module: String(
      firstOf(source, ["module", "group", "category"], "general") ?? "general",
    ),
    createdAt: firstOf(source, ["created_at", "createdAt"]),
  };
};

export const mapRbacPermissionCatalog = (raw): RbacCatalogPermission[] => {
  const data = raw && typeof raw === "object" && "data" in raw ? raw.data : raw;
  const items = rbacCollection(data, [
    "permissions",
    "items",
    "results",
    "data",
  ]);

  return items
    .map(mapRbacPermission)
    .filter((permission) => permission.code.trim());
};

export const mapRbacRolePermission = (raw): RbacRolePermission => {
  if (typeof raw === "string") {
    return { code: raw, scope: "platform", constraints: {} };
  }

  const source = raw && typeof raw === "object" ? raw : {};
  const code = String(
    firstOf(
      source,
      [
        "code",
        "permission",
        "permission_code",
        "permissionCode",
        "key",
        "name",
      ],
      "",
    ) ?? "",
  );

  return {
    code,
    scope: String(
      firstOf(source, ["scope", "scope_type", "scopeType"], "platform") ??
        "platform",
    ),
    constraints: rbacConstraints(
      firstOf(source, ["constraints", "conditions", "metadata"]),
    ),
  };
};

export const mapRbacCatalogRole = (raw): RbacCatalogRole => {
  const source = raw && typeof raw === "object" ? raw : {};
  const key = String(
    firstOf(source, ["key", "role_key", "roleKey", "name"], "") ?? "",
  );
  const permissions = rbacCollection(source, [
    "permissions",
    "permission_grants",
    "permissionGrants",
    "grants",
  ]);

  return {
    id: firstOf(source, ["id", "role_id", "roleId"]),
    key,
    name: String(firstOf(source, ["name", "label", "title"], key) ?? key),
    description: String(firstOf(source, ["description", "desc"], "") ?? ""),
    isSystem: Boolean(
      firstOf(source, ["is_system", "isSystem", "system"], false),
    ),
    createdAt: firstOf(source, ["created_at", "createdAt"]),
    updatedAt: firstOf(source, ["updated_at", "updatedAt"]),
    permissions: permissions
      .map(mapRbacRolePermission)
      .filter((permission) => permission.code.trim()),
  };
};

export const mapRbacRoleCatalog = (raw): RbacCatalogRole[] => {
  const data = raw && typeof raw === "object" && "data" in raw ? raw.data : raw;
  const items = rbacCollection(data, ["roles", "items", "results", "data"]);

  return items.map(mapRbacCatalogRole).filter((role) => role.key.trim());
};

export const mapRbacRegion = (raw): RbacRegion => {
  const source = raw && typeof raw === "object" ? raw : {};
  const code = String(firstOf(source, ["code", "region_code"], "") ?? "");
  const id = String(firstOf(source, ["id", "region_id"], code) ?? code);

  return {
    id,
    code,
    name: String(firstOf(source, ["name", "label"], code) ?? code),
    isActive: firstOf(source, ["is_active", "isActive"], true) !== false,
    createdAt: firstOf(source, ["created_at", "createdAt"]),
  };
};

export const mapRbacRegionCatalog = (raw): RbacRegion[] => {
  const data = raw && typeof raw === "object" && "data" in raw ? raw.data : raw;
  const items = rbacCollection(data, ["regions", "items", "results", "data"]);

  return items
    .map(mapRbacRegion)
    .filter((region) => region.id.trim() || region.code.trim());
};

const mapStaffAssignment = (raw): StaffAssignment => {
  const source = raw && typeof raw === "object" ? raw : {};
  const roleKey = String(
    firstOf(source, ["role_key", "roleKey", "key"], "") ?? "",
  );
  const roleName = String(
    firstOf(source, ["role_name", "roleName", "name", "role"], roleKey) ??
      roleKey,
  );
  const assignmentId = String(
    firstOf(source, ["assignment_id", "assignmentId", "id"], "") ?? "",
  );

  return {
    assignmentId,
    roleId: String(firstOf(source, ["role_id", "roleId"], "") ?? ""),
    roleKey,
    roleName,
    scope: String(
      firstOf(source, ["scope", "scope_type", "scopeType"], "platform") ??
        "platform",
    ),
    scopeId:
      firstOf(source, ["scope_id", "scopeId"]) === null
        ? null
        : String(firstOf(source, ["scope_id", "scopeId"], "") ?? "") || null,
    expiresAt:
      firstOf(source, ["expires_at", "expiresAt"]) === null
        ? null
        : String(firstOf(source, ["expires_at", "expiresAt"], "") ?? "") ||
          null,
    assignedAt:
      firstOf(source, ["assigned_at", "assignedAt"]) === null
        ? null
        : String(firstOf(source, ["assigned_at", "assignedAt"], "") ?? "") ||
          null,
  };
};

export const mapStaffMember = (raw): StaffMember => {
  const source = raw && typeof raw === "object" ? raw : {};
  const nested =
    source.staff && typeof source.staff === "object" ? source.staff : source;
  const name = String(
    firstOf(nested, ["full_name", "fullName", "name"], "") ?? "",
  );
  const email = String(firstOf(nested, ["email"], "") ?? "");
  const phone = String(
    firstOf(nested, ["phone", "phone_number", "phoneNumber"], "") ?? "",
  );
  const isActive = firstOf(nested, ["is_active", "isActive"], true) !== false;
  const rawStatus = String(firstOf(nested, ["status"], "") ?? "").toLowerCase();
  const status =
    rawStatus === "invited" || rawStatus === "pending"
      ? "invited"
      : isActive
        ? "active"
        : "deactivated";
  const assignments = Array.isArray(nested.assignments)
    ? nested.assignments
        .map(mapStaffAssignment)
        .filter((assignment) => assignment.assignmentId)
    : [];

  return {
    id: String(firstOf(nested, ["id", "user_id", "userId"], "") ?? ""),
    name: name.trim() || email.trim() || phone.trim() || "Unnamed staff",
    email,
    phone,
    isActive,
    status,
    assignments,
  };
};
