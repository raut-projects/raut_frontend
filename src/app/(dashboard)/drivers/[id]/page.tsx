"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Ban,
  CarFront,
  CircleCheck,
  CircleHelp,
  CircleX,
  Clock3,
  Download,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  ShieldAlert,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { QueryError } from "@/components/queryStates";
import { ReasonDialog } from "@/components/reasonDialog";
import DocumentRejectionDialog from "@/components/documentRejectionDialog";
import DocumentReviewDialog from "@/components/documentReviewDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useApproveDocument,
  useRejectDocument,
  useRejectDriver,
  useSuspendDriver,
  useUnsuspendDriver,
  useVerifyDriver,
} from "@/hooks/useAdminActions";
import { useDriverDetails } from "@/hooks/useDriverDetails";
import { useToast } from "@/components/toastContext";
import { useAuthStore } from "@/store/authStore";
import { usePageViewField } from "@/store/pageViewStore";
import {
  formatDate,
  formatDuration,
  formatMoney,
  formatRelative,
} from "@/services/mappers";
import { ApiError } from "@/services/http";

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const firstValue = (records, keys) => {
  for (const record of records) {
    if (!isRecord(record)) continue;

    for (const key of keys) {
      const value = record[key];
      if (value !== undefined && value !== null && value !== "") return value;
    }
  }

  return null;
};

const displayValue = (value) => {
  if (value === undefined || value === null || value === "") {
    return "Not provided";
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    if (!value.length) return "None";
    return value
      .map((item) =>
        isRecord(item)
          ? (item.summary ??
            item.title ??
            item.reason ??
            item.name ??
            item.id ??
            "Issue")
          : item,
      )
      .join(", ");
  }
  if (isRecord(value)) {
    return (
      value.full_name ??
      value.name ??
      value.label ??
      value.id ??
      "Not provided"
    );
  }

  return String(value);
};

const verificationLabel = (value, verifiedAt) => {
  if (value === true) return "Verified";
  if (value === false) return "Not verified";
  const normalized = String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (["verified", "confirmed", "true", "1", "yes"].includes(normalized)) {
    return "Verified";
  }
  if (
    ["unverified", "not_verified", "false", "0", "no", "rejected"].includes(
      normalized,
    )
  ) {
    return "Not verified";
  }
  if (["pending", "in_progress"].includes(normalized)) {
    return "Pending verification";
  }
  if (verifiedAt) return "Verified";
  return "Verification not provided";
};

const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  const amount = Number(value);
  if (!Number.isFinite(amount)) return displayValue(value);

  return `${Math.round((amount <= 1 ? amount * 100 : amount) * 10) / 10}%`;
};

const formatMoneyValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? formatMoney(amount) : displayValue(value);
};

const numericValue = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
};

const formatHours = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? `${amount}h` : displayValue(value);
};

function InfoField({ label, value, detail = null, badge = null }) {
  return (
    <div className="min-w-0 border-b border-slate-100 py-3 last:border-0">
      <dt className="text-xs font-medium text-slate-500">{ label }</dt>
      <dd className="mt-1 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">
        <span className="wrap-break-words">{ displayValue(value) }</span>
        { badge && (
          <Badge
            variant="outline"
            className={
              badge === "Verified" || badge === "Valid"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : badge === "Expired"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : badge === "Not verified"
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-slate-200 bg-slate-50 text-slate-600"
            }
          >
            { badge === "Verified" || badge === "Valid" ? (
              <CircleCheck aria-hidden="true" />
            ) : (
              <CircleHelp aria-hidden="true" />
            ) }
            { badge }
          </Badge>
        ) }
      </dd>
      { detail && <p className="mt-1 text-xs text-slate-500">{ detail }</p> }
    </div>
  );
}

function DriverSection({
  icon: Icon,
  title,
  action = null,
  children,
  id = undefined,
}) {
  return (
    <section id={ id } className="border-t border-slate-200 pt-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
          { title }
        </h2>
        { action }
      </div>
      { children }
    </section>
  );
}

function DriverDetailsPage() {
  const { id: routeId } = useParams<{ id: string | string[] }>();
  const driverId = Array.isArray(routeId) ? routeId[0] : routeId;
  const router = useRouter();
  const toast = useToast();
  const sessionRole = useAuthStore((state) => state.session?.role);
  const normalizedRole = String(sessionRole ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const canProcessPayouts = ["finance", "finance_manager"].includes(normalizedRole);
  const [, setRidesDriverId] = usePageViewField("rides", "driverId");
  const [, setPayoutDriverId] = usePageViewField("payouts", "driverId");
  const [, setPayoutStatus] = usePageViewField("payouts", "status");
  const [, setPayoutFrom] = usePageViewField("payouts", "from");
  const [, setPayoutTo] = usePageViewField("payouts", "to");
  const [, setRidesPage] = usePageViewField("rides", "page");
  const [, setPayoutsPage] = usePageViewField("payouts", "page");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [lightboxPhoto, setLightboxPhoto] = useState(null);
  const {
    data: driver,
    isPending: driverPending,
    isError: driverIsError,
    error: driverError,
    refetch: refetchDriver,
  } = useDriverDetails(driverId);
  useEffect(() => {
    if (!lightboxPhoto) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setLightboxPhoto(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxPhoto]);
  const documents = driver?.documents ?? [];
  const documentsPending = driverPending;
  const documentsIsError = driverIsError;
  const documentsError = driverError;
  const refetchDocuments = refetchDriver;
  const approveDocument = useApproveDocument();
  const rejectDocument = useRejectDocument();
  const verifyDriver = useVerifyDriver();
  const rejectDriver = useRejectDriver();
  const suspendDriver = useSuspendDriver();
  const unsuspendDriver = useUnsuspendDriver();
  const closeDocumentReview = useCallback(() => setReviewTarget(null), []);

  if (driverPending) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        <Card className="h-48 animate-pulse bg-slate-50" />
        <Card className="h-64 animate-pulse bg-slate-50" />
      </div>
    );
  }

  if (driverIsError) {
    if (driverError instanceof ApiError && driverError.status === 404) {
      return (
        <div className="space-y-6">
          <Button asChild variant="outline">
            <Link href="/drivers">
              <ArrowLeft aria-hidden="true" />
              Back to Drivers
            </Link>
          </Button>
          <Card className="p-8 text-center">
            <h1 className="text-lg font-semibold text-slate-900">
              Driver not found
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              This driver may have been removed or the profile link is invalid.
            </p>
          </Card>
        </div>
      );
    }

    return (
      <Card className="rounded-xl">
        <QueryError error={ driverError } onRetry={ refetchDriver } />
      </Card>
    );
  }

  const profile = driver.profile ?? {};
  const nestedProfile = profile.profile ?? {};
  const personal =
    profile.personal_information ??
    profile.personal ??
    profile.account ??
    nestedProfile.personal_information ??
    nestedProfile.personal ??
    nestedProfile.account ??
    {};
  const vehicleValue =
    profile.vehicle ??
    profile.vehicle_info ??
    profile.vehicle_details ??
    nestedProfile.vehicle ??
    nestedProfile.vehicle_info ??
    nestedProfile.vehicle_details ??
    {};
  const vehicle = Array.isArray(vehicleValue)
    ? (vehicleValue[0] ?? {})
    : isRecord(vehicleValue)
      ? vehicleValue
      : {};
  const performance = profile.performance ?? profile.metrics ?? {};
  const earnings = profile.earnings ?? profile.earnings_summary ?? {};
  const earningsPeriod =
    earnings.last_30_days ?? earnings.last30Days ?? profile.last_30_days ?? {};
  const activity = profile.activity ?? profile.activity_summary ?? {};
  const records = [
    profile,
    personal,
    vehicle,
    performance,
    earnings,
    earningsPeriod,
    activity,
  ];
  const items = documents ?? [];
  const documentMutationPending =
    approveDocument.isPending || rejectDocument.isPending;
  const isSuspended = driver.statusKey === "suspended";
  const email = driver.email === "—" ? "" : driver.email;
  const phone = driver.phone === "—" ? "" : driver.phone;
  const phoneVerified = firstValue(
    [profile, personal],
    [
      "phone_verified",
      "is_phone_verified",
      "phone_is_verified",
      "phone_verification_status",
    ],
  );
  const phoneVerifiedAt = firstValue(
    [profile, personal],
    ["phone_verified_at"],
  );
  const emailVerified = firstValue(
    [profile, personal],
    [
      "email_verified",
      "is_email_verified",
      "email_is_verified",
      "email_verification_status",
    ],
  );
  const emailVerifiedAt = firstValue(
    [profile, personal],
    ["email_verified_at"],
  );
  const nationalId = firstValue(
    [profile, personal],
    ["national_id", "national_id_number", "identification_number", "id_number"],
  );
  const referralCode = firstValue([profile, personal], ["referral_code"]);
  const referredBy = firstValue(
    [profile, personal],
    ["referred_by", "referrer", "referral_source"],
  );
  const online = firstValue(
    [profile, personal, activity],
    ["is_online", "online", "online_status", "availability_status"],
  );
  const lastOnline = firstValue(
    [profile, personal, activity],
    ["last_online", "last_seen_at", "last_active_at"],
  );
  const normalizedOnline = String(online ?? "").trim().toLowerCase();
  const isOnline =
    online === true ||
    ["online", "available", "true", "1"].includes(normalizedOnline);
  const onlineLabel =
    isOnline
      ? "Online"
      : lastOnline
        ? `Last online: ${formatRelative(lastOnline)}`
        : online === null
          ? "Online status unavailable"
          : "Offline";
  const photoFields: [string, string[]][] = [
    ["Front", ["front_photo", "front_image", "vehicle_front_photo"]],
    ["Back", ["back_photo", "back_image", "vehicle_back_photo"]],
    ["Left", ["left_photo", "left_image", "vehicle_left_photo"]],
    ["Right", ["right_photo", "right_image", "vehicle_right_photo"]],
    ["Interior", ["interior_photo", "interior_image", "vehicle_interior_photo"]],
  ];
  const vehiclePhotos = photoFields
    .map(([label, keys]) => ({
      label,
      url: firstValue([vehicle, profile, nestedProfile], keys),
    }))
    .filter((photo) => typeof photo.url === "string" && photo.url.length > 0);
  const vehiclePhotoDocs = items.filter(
    (document) => document.type === "vehicle_photo" && document.fileUrl,
  );
  const insuranceExpiry =
    driver.vehicleInsuranceExpiry ??
    firstValue(
      [vehicle, profile, nestedProfile],
      ["insurance_expiry", "insurance_expires_at", "insurance_expiry_date"],
    );
  const insuranceValidity =
    driver.vehicleInsuranceValid ??
    firstValue(
      [vehicle, profile, nestedProfile],
      ["insurance_valid", "is_insurance_valid"],
    );
  const activeIssues = firstValue(
    [profile, activity],
    ["active_issues", "open_issues", "current_issues", "flags"],
  );
  const historicalIssues = firstValue(
    [profile, activity],
    ["historical_issues", "resolved_disputes", "disputes"],
  );
  const dateJoined = firstValue([profile, personal], ["created_at", "joined_at"]);
  const joinedRelative = dateJoined ? formatRelative(dateJoined) : null;

  const navigateToRides = () => {
    setRidesDriverId(String(driverId));
    setRidesPage(1);
    router.push("/rides");
  };

  const navigateToPayouts = () => {
    setPayoutDriverId(String(driverId));
    setPayoutStatus("all");
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 29);
    setPayoutFrom(start.toISOString().slice(0, 10));
    setPayoutTo(end.toISOString().slice(0, 10));
    setPayoutsPage(1);
    router.push("/payouts");
  };

  const navigateToPendingPayouts = () => {
    setPayoutDriverId(String(driverId));
    setPayoutStatus("pending");
    setPayoutsPage(1);
    router.push("/payouts");
  };

  const exportProfile = () => {
    try {
      const exportData = {
        driver: {
          id: driver.id,
          name: driver.name,
          phone: driver.phone,
          email: driver.email,
          status: driver.status,
          joined: driver.joined,
          verifiedAt: driver.verifiedAt,
          rides: driver.rides,
          rating: driver.rating,
          ratingCount: driver.ratingCount,
          profile,
        },
        documents: items.map(
          ({
            fileUrl: _fileUrl,
            ...document
          }) => document,
        ),
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `driver-${driver.id}-data.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Driver data exported.");
    } catch (error) {
      toast.error(error?.message ?? "Could not export driver data.");
    }
  };

  const getMetric = (keys) => firstValue(records, keys);
  const driverRating =
    getMetric(["rating_avg", "rating", "average_rating"]) ??
    (driver.rating > 0 ? driver.rating : null);
  const rideCount =
    getMetric(["total_rides", "ride_count", "completed_rides"]) ?? driver.rides;
  const ratingCount =
    getMetric(["rating_count", "ratings_count", "total_ratings"]) ??
    driver.ratingCount;
  const getEarningsMetric = (keys) =>
    firstValue([earningsPeriod, earnings], keys);
  const grossEarnings = numericValue(
    getEarningsMetric(["gross_earnings", "gross_amount", "total_gross"]),
  );
  const platformFee = numericValue(
    getEarningsMetric(["platform_fee", "platform_fees", "commission_amount"]),
  );
  const providedNetEarnings = numericValue(
    getEarningsMetric(["net_earnings", "net_amount", "driver_earnings"]),
  );
  const netEarnings =
    grossEarnings !== null && platformFee !== null
      ? grossEarnings - platformFee
      : providedNetEarnings;
  const detailFields: [string, string[]][] = [
    ["Acceptance rate", ["acceptance_rate", "acceptanceRate"]],
    ["Cancellation rate", ["cancellation_rate", "cancellationRate"]],
    ["Completion rate", ["completion_rate", "completionRate"]],
    ["On-time arrival", ["on_time_rate", "on_time_arrival_rate", "onTimeRate"]],
  ];
  const responseTime = getMetric([
    "average_response_time_seconds",
    "average_response_time",
    "avg_response_time",
    "response_time",
  ]);
  const performanceFields: {
    label: string;
    value: unknown;
    detail?: string;
  }[] = [
      {
        label: "Overall rating",
        value:
          driverRating !== null
            ? `${Number(driverRating).toFixed(1)} / 5`
            : "Not provided",
        detail:
          ratingCount > 0
            ? `${displayValue(ratingCount)} ratings · ${displayValue(rideCount)} rides`
            : "Rating count not provided",
      },
      ...detailFields.map(([label, keys]) => ({
        label,
        value: formatPercent(getMetric(keys)),
      })),
      {
        label: "Average response time",
        value: responseTime === null ? "Not provided" : formatDuration(responseTime),
      },
    ];

  const earningsFields: [string, unknown][] = [
    [
      "Total rides",
      getEarningsMetric(["rides_count", "total_rides", "ride_count"]),
    ],
    [
      "Gross earnings",
      grossEarnings !== null
        ? formatMoney(grossEarnings)
        : formatMoneyValue(
          netEarnings !== null && platformFee !== null
            ? netEarnings + platformFee
            : getEarningsMetric([
              "gross_earnings",
              "gross_amount",
              "total_gross",
            ]),
        ),
    ],
    [
      "Platform fee",
      formatMoneyValue(platformFee),
    ],
    [
      "Net earnings",
      formatMoneyValue(netEarnings),
    ],
    [
      "Already paid out",
      formatMoneyValue(
        getEarningsMetric(["paid_out", "paid_amount", "total_paid"]),
      ),
    ],
    [
      "Pending payout",
      formatMoneyValue(
        getEarningsMetric(["pending_payout", "pending_amount", "unpaid_amount"]),
      ),
    ],
  ];
  const activityFields: [string, unknown][] = [
    [
      "Last online",
      (() => {
        const value = lastOnline;
        return value ? formatRelative(value) : null;
      })(),
    ],
    [
      "Active hours today",
      formatHours(getMetric(["active_hours_today", "hours_active_today"])),
    ],
    [
      "Average weekly hours",
      formatHours(getMetric(["average_weekly_hours", "avg_weekly_hours"])),
    ],
    ["Peak hours", getMetric(["peak_hours", "peak_activity_hours"])],
    ...(driver.driveStats?.total_drives != null
      ? ([["Total drives", driver.driveStats.total_drives]] as [string, unknown][])
      : []),
    ...(driver.lastActivity
      ? ([["Last activity", formatRelative(driver.lastActivity)]] as [string, unknown][])
      : []),
  ];

  return (
    <>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/drivers">
                <ArrowLeft aria-hidden="true" />
                Back to Drivers
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                { driver.name }
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={
                driver.isActive
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }
            >
              <span
                className={ `h-1.5 w-1.5 rounded-full ${driver.isActive ? "bg-emerald-500" : "bg-rose-500"
                  }` }
                aria-hidden="true"
              />
              { driver.isActive ? "Active" : "Inactive" }
            </Badge>
            <Badge variant="outline" className="border-slate-200 text-slate-600">
              { onlineLabel }
            </Badge>
            <Badge variant="outline" className="border-slate-200 text-slate-600">
              { driver.status }
            </Badge>
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          { driver.statusKey === "pending" && (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={ verifyDriver.isPending }
                onClick={ () =>
                  (
                    verifyDriver.mutate as unknown as (variables: {
                      driverId: string;
                    }) => void
                  )({ driverId: String(driverId) })
                }
              >
                <CircleCheck aria-hidden="true" />
                Verify
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={ () => {
                  setRejectReason("");
                  setRejectOpen(true);
                } }
              >
                <CircleX aria-hidden="true" />
                Reject
              </Button>
            </>
          ) }
          { isSuspended ? (
            <Button
              type="button"
              variant="outline"
              disabled={ unsuspendDriver.isPending }
              onClick={ () =>
                (
                  unsuspendDriver.mutate as unknown as (variables: {
                    driverId: string;
                  }) => void
                )({ driverId: String(driverId) })
              }
            >
              Reactivate
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              disabled={
                suspendDriver.isPending ||
                !driver.isActive ||
                driver.statusKey !== "verified"
              }
              title={
                driver.isActive && driver.statusKey === "verified"
                  ? undefined
                  : "Only active, verified drivers can be suspended."
              }
              onClick={ () => {
                setSuspendReason("");
                setSuspendOpen(true);
              } }
            >
              <ShieldAlert aria-hidden="true" />
              Suspend
            </Button>
          ) }
          <Button
            type="button"
            variant="outline"
            disabled
            title="Blocking a driver is not supported by the current admin API."
          >
            <Ban aria-hidden="true" />
            Block
          </Button>
          { email ? (
            <Button asChild variant="outline">
              <a href={ `mailto:${encodeURIComponent(email)}` }>
                <MessageSquare aria-hidden="true" />
                Send Message
              </a>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled
              title="An email address is not available."
            >
              <MessageSquare aria-hidden="true" />
              Send Message
            </Button>
          ) }
          <Button type="button" variant="outline" onClick={ exportProfile }>
            <Download aria-hidden="true" />
            Export Data
          </Button>
        </div>

        <DriverSection icon={ UserRound } title="Personal Information">
          <dl className="grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
            <InfoField label="Name" value={ driver.name } />
            <InfoField
              label="Phone"
              value={ phone }
              badge={ verificationLabel(phoneVerified, phoneVerifiedAt) }
            />
            <InfoField
              label="Email"
              value={ email }
              badge={ verificationLabel(emailVerified, emailVerifiedAt) }
            />
            <InfoField label="National ID" value={ nationalId } />
            <InfoField
              label="Joined"
              value={ driver.joined }
              detail={ joinedRelative }
            />
            <InfoField label="Referral code" value={ referralCode } />
            <InfoField label="Referred by" value={ referredBy } />
          </dl>
        </DriverSection>

        <DriverSection icon={ CarFront } title="Vehicle Information">
          <dl className="grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
            <InfoField
              label="Make / model"
              value={
                [driver.vehicleMake, driver.vehicleModel].filter(Boolean).join(" ") ||
                driver.vehicle ||
                null
              }
            />
            <InfoField label="Year" value={ driver.vehicleYear } />
            <InfoField label="Color" value={ driver.vehicleColor } />
            <InfoField
              label="Plate"
              value={ driver.plateNumber }
              badge={
                driver.vehiclePlateVerified === true
                  ? "Verified"
                  : driver.vehiclePlateVerified === false
                    ? "Not verified"
                    : undefined
              }
            />
            <InfoField
              label="Insurance expiry"
              value={ insuranceExpiry ? formatDate(insuranceExpiry) : null }
              badge={
                insuranceValidity === true
                  ? "Valid"
                  : insuranceValidity === false
                    ? "Expired"
                    : undefined
              }
            />
          </dl>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-medium text-slate-500">Vehicle photos</h3>
            { vehiclePhotos.length > 0 || vehiclePhotoDocs.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                { vehiclePhotos.map((photo) => (
                  <button
                    key={ photo.label }
                    type="button"
                    onClick={ () =>
                      setLightboxPhoto({ label: photo.label, url: photo.url })
                    }
                    className="group relative h-24 w-32 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  >
                    <img
                      src={ photo.url }
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <span className="absolute inset-x-0 bottom-0 bg-slate-950/70 px-2 py-1 text-xs font-medium text-white">
                      { photo.label }
                    </span>
                  </button>
                )) }
                { vehiclePhotoDocs.map((photo, index) => (
                  <button
                    key={ photo.id ?? photo.fileName ?? index }
                    type="button"
                    onClick={ () =>
                      setLightboxPhoto({
                        label: photo.fileName || "Vehicle photo",
                        url: photo.fileUrl,
                      })
                    }
                    className="group relative h-24 w-32 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  >
                    <img
                      src={ photo.fileUrl }
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <span className="absolute inset-x-0 bottom-0 truncate bg-slate-950/70 px-2 py-1 text-xs font-medium text-white">
                      { photo.fileName || "Vehicle photo" }
                    </span>
                  </button>
                )) }
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Vehicle photo details are not provided.
              </p>
            ) }
          </div>
        </DriverSection>

        <DriverSection
          icon={ FileText }
          title="Documents"
          id="driver-documents"
          action={
            !documentsPending && !documentsIsError ? (
              <div className="flex items-center gap-2">
                { driver.allDocumentsVerified === true && (
                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 text-emerald-700"
                  >
                    All verified
                  </Badge>
                ) }
                { (driver.missingDocuments?.length ?? 0) > 0 && (
                  <span className="text-xs text-amber-700">
                    { driver.missingDocuments.length } missing
                  </span>
                ) }
                <span className="text-xs text-slate-500">
                  { items.length } document{ items.length === 1 ? "" : "s" }
                </span>
              </div>
            ) : null
          }
        >
          { documentsPending && (
            <div className="space-y-3">
              { [0, 1, 2].map((item) => (
                <div
                  key={ item }
                  className="h-16 animate-pulse rounded-lg bg-slate-100"
                />
              )) }
            </div>
          ) }
          { documentsIsError && (
            <QueryError error={ documentsError } onRetry={ refetchDocuments } />
          ) }
          { !documentsPending && !documentsIsError && items.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              This driver has not uploaded any documents.
            </p>
          ) }
          { !documentsPending && !documentsIsError && items.length > 0 && (
            <ul className="divide-y divide-slate-100">
              { items.map((document) => (
                <li
                  key={ document.id ?? document.fileName }
                  className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-1"
                >
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                      <span
                        className={ `h-2 w-2 rounded-full ${document.isApproved
                          ? "bg-emerald-500"
                          : document.isRejected
                            ? "bg-rose-500"
                            : "bg-amber-500"
                          }` }
                        aria-hidden="true"
                      />
                      { document.typeLabel }
                      <Badge variant="outline">{ document.status }</Badge>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      { document.reviewedAt
                        ? `${document.status} ${document.reviewedAt}`
                        : `Uploaded ${document.uploadedAt}` }
                      { document.reviewedBy ? ` · by ${document.reviewedBy}` : "" }
                    </p>
                    { document.expiry !== "No expiry" && (
                      <p className="mt-1 text-xs text-slate-500">
                        Valid until { document.expiry }
                      </p>
                    ) }
                    { document.rejectionReason && (
                      <p className="mt-1 text-xs text-rose-700">
                        { document.rejectionReason }
                      </p>
                    ) }
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={ documentMutationPending }
                      onClick={ () => setReviewTarget(document) }
                    >
                      View Document →
                    </Button>
                  </div>
                </li>
              )) }
            </ul>
          ) }
          { !documentsPending && !documentsIsError && (driver.missingDocuments?.length ?? 0) > 0 && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <p className="font-medium">Missing documents</p>
              <ul className="mt-1 list-disc pl-4">
                { driver.missingDocuments.map((doc, index) => (
                  <li key={ index }>{ displayValue(doc) }</li>
                )) }
              </ul>
              { driver.canBeVerified === false && (
                <p className="mt-1 text-amber-700">
                  Not ready to verify until these are uploaded.
                </p>
              ) }
            </div>
          ) }
        </DriverSection>

        <DriverSection icon={ Star } title="Performance Metrics">
          <dl className="grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
            { performanceFields.map((field) => (
              <InfoField
                key={ field.label }
                label={ field.label }
                value={ field.value }
                detail={ field.detail }
              />
            )) }
          </dl>
          <p className="mt-2 text-xs text-slate-500">
            Detailed acceptance, cancellation, and arrival metrics are only
            available when returned by the driver profile API.
          </p>
        </DriverSection>

        <DriverSection
          icon={ Download }
          title="Earnings · Last 30 Days"
          action={
            canProcessPayouts ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={ navigateToPendingPayouts }
              >
                Process →
              </Button>
            ) : null
          }
        >
          <dl className="grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
            { earningsFields.map(([label, value]) => (
              <InfoField
                key={ label }
                label={ label }
                value={
                  label === "Total rides"
                    ? displayValue(value)
                    : value
                }
              />
            )) }
          </dl>
          { driver.payoutStats && Object.keys(driver.payoutStats).length > 0 && (
            <div className="mt-3 border-t border-slate-100 pt-3">
              <h3 className="text-xs font-medium text-slate-500">Payout stats</h3>
              <dl className="mt-2 grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
                { Object.entries(driver.payoutStats).map(([key, value]) => (
                  <InfoField
                    key={ key }
                    label={ key
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (char) => char.toUpperCase()) }
                    value={ value }
                  />
                )) }
              </dl>
            </div>
          ) }
          <p className="mt-2 text-xs text-slate-500">
            Earnings and payout totals for this date range are not provided by
            the current driver profile API.
          </p>
        </DriverSection>

        <DriverSection icon={ Clock3 } title="Activity">
          <dl className="grid gap-x-8 sm:grid-cols-2 xl:grid-cols-4">
            { activityFields.map(([label, value]) => (
              <InfoField key={ label } label={ label } value={ value } />
            )) }
          </dl>
        </DriverSection>

        <DriverSection icon={ ShieldAlert } title="Issues & Flags">
          { activeIssues === null && historicalIssues === null ? (
            <p className="text-sm text-slate-500">
              Issue and dispute history is not provided by the current API.
            </p>
          ) : (
            <div className="space-y-3 text-sm">
              <p className="font-medium text-slate-800">
                Active: { displayValue(activeIssues) }
              </p>
              <p className="text-slate-600">
                Historical: { displayValue(historicalIssues) }
              </p>
            </div>
          ) }
        </DriverSection>

        <DriverSection icon={ ArrowUpRight } title="Quick Links">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={ navigateToRides }>
              View All Rides
              <ArrowUpRight aria-hidden="true" />
            </Button>
            <Button type="button" variant="outline" onClick={ navigateToPayouts }>
              View Earnings
              <ArrowUpRight aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled
              title="Rating comments are not available in the current API."
            >
              View Ratings
            </Button>
            { email && (
              <Button asChild variant="outline">
                <a href={ `mailto:${encodeURIComponent(email)}` }>
                  <Mail aria-hidden="true" />
                  Message Driver
                </a>
              </Button>
            ) }
            { phone && (
              <Button asChild variant="outline">
                <a href={ `tel:${encodeURIComponent(phone)}` }>
                  <Phone aria-hidden="true" />
                  Call Driver
                </a>
              </Button>
            ) }
          </div>
        </DriverSection>
      </div>

      { reviewTarget && (
        <DocumentReviewDialog
          key={ reviewTarget.id }
          open
          document={ reviewTarget }
          onClose={ closeDocumentReview }
          onApprove={ (documentId, notes) =>
            (
              approveDocument.mutate as unknown as (
                variables: { documentId: string; notes: string },
                options: { onSuccess: () => void },
              ) => void
            )(
              { documentId, notes },
              { onSuccess: () => setReviewTarget(null) },
            )
          }
          onReject={ (document) => {
            setReviewTarget(null);
            setRejectTarget(document);
          } }
          pending={ documentMutationPending }
        />
      ) }

      { lightboxPhoto && (
        <div
          className="fixed inset-0 z-80 flex items-center justify-center bg-slate-950/90 p-4"
          role="presentation"
          onMouseDown={ (event) => {
            if (event.target === event.currentTarget) setLightboxPhoto(null);
          } }
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={ lightboxPhoto.label }
            className="relative flex max-h-full max-w-full flex-col items-center gap-3"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={ () => setLightboxPhoto(null) }
              aria-label="Close vehicle photo"
              className="absolute -right-2 -top-2 z-10 rounded-full bg-white text-slate-700 hover:bg-slate-100 sm:right-0 sm:top-0"
            >
              <X aria-hidden="true" />
            </Button>
            <img
              src={ lightboxPhoto.url }
              alt={ lightboxPhoto.label }
              className="max-h-[80dvh] max-w-full rounded-lg object-contain"
            />
            <p className="text-sm font-medium text-white">
              { lightboxPhoto.label }
            </p>
          </section>
        </div>
      ) }

      <ReasonDialog
        open={ suspendOpen }
        onClose={ () => setSuspendOpen(false) }
        title="Suspend driver"
        description={ `${driver.name} will be taken off the road.` }
        confirmLabel="Suspend"
        tone="danger"
        placeholder="Why is the driver suspended?"
        value={ suspendReason }
        onChange={ setSuspendReason }
        pending={ suspendDriver.isPending }
        onConfirm={ async (reason) => {
          await (
            suspendDriver.mutateAsync as unknown as (variables: {
              driverId: string;
              reason: string;
            }) => Promise<unknown>
          )({ driverId: String(driverId), reason });
          setSuspendOpen(false);
        } }
      />

      <ReasonDialog
        open={ rejectOpen }
        onClose={ () => setRejectOpen(false) }
        title="Reject driver application"
        description={ `${driver.name} will not be able to take rides.` }
        confirmLabel="Reject"
        tone="danger"
        placeholder="Why is the application rejected?"
        value={ rejectReason }
        onChange={ setRejectReason }
        pending={ rejectDriver.isPending }
        onConfirm={ async (reason) => {
          await (
            rejectDriver.mutateAsync as unknown as (variables: {
              driverId: string;
              reason: string;
            }) => Promise<unknown>
          )({ driverId: String(driverId), reason });
          setRejectOpen(false);
        } }
      />

      <DocumentRejectionDialog
        key={ rejectTarget?.id ?? "closed" }
        open={ Boolean(rejectTarget) }
        onClose={ () => setRejectTarget(null) }
        description={
          rejectTarget
            ? `${rejectTarget.typeLabel} for ${driver.name} will be rejected.`
            : undefined
        }
        pending={ rejectDocument.isPending }
        onConfirm={ async (reason) => {
          await (
            rejectDocument.mutateAsync as unknown as (variables: {
              documentId: string;
              reason: string;
            }) => Promise<unknown>
          )({ documentId: rejectTarget.id, reason });
          setRejectTarget(null);
        } }
      />
    </>
  );
}

export default DriverDetailsPage;
