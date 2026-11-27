"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CarFront,
  CircleCheck,
  CircleX,
  Clock3,
  Download,
  EllipsisVertical,
  FileText,
  Mail,
  MessageSquare,
  Phone,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react";
import { Can } from "@/components/Can";
import { QueryError, RefreshIndicator } from "@/components/queryStates";
import { ReasonDialog } from "@/components/reasonDialog";
import DocumentRejectionDialog from "@/components/documentRejectionDialog";
import DocumentReviewDialog from "@/components/documentReviewDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useApproveDocument,
  useRejectDocument,
  useRejectDriver,
  useSuspendDriver,
  useUnsuspendDriver,
  useVerifyDriver,
} from "@/hooks/useAdminActions";
import { useDriverDetails } from "@/hooks/useDriverDetails";
import { useSession } from "@/hooks/useSession";
import { useStaffDirectory } from "@/hooks/useStaff";
import { useToast } from "@/components/toastContext";
import { usePermissions } from "@/hooks/usePermissions";
import { usePageViewField } from "@/store/pageViewStore";
import {
  formatDate,
  formatMoney,
  formatRelative,
} from "@/services/mappers";
import { ApiError } from "@/services/http";
import type { DriverLatraStatus } from "@/types";
import { PERMISSIONS } from "@/lib/permissions";

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const hasValue = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  !(typeof value === "string" && value.trim() === "—");

const firstValue = (records, keys) => {
  for (const record of records) {
    if (!isRecord(record)) continue;

    for (const key of keys) {
      const value = record[key];
      if (hasValue(value)) return value;
    }
  }

  return null;
};

const displayValue = (value) => {
  if (!hasValue(value)) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    if (!value.length) return "—";
    return value
      .map((item) =>
        isRecord(item)
          ? item.summary ??
          item.title ??
          item.reason ??
          item.name ??
          item.id ??
          "—"
          : item,
      )
      .join(", ");
  }
  if (isRecord(value)) {
    return value.full_name ?? value.name ?? value.label ?? value.id ?? "—";
  }

  return String(value);
};

const titleCaseText = (value) =>
  String(value ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const numericValue = (value) => {
  if (!hasValue(value)) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
};

const formatMoneyValue = (value) => {
  const amount = numericValue(value);
  return amount === null ? displayValue(value) : formatMoney(amount);
};

const toneStyles = {
  emerald: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    panel: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  amber: {
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
    panel: "border-amber-200 bg-amber-50 text-amber-900",
  },
  rose: {
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
    panel: "border-rose-200 bg-rose-50 text-rose-800",
  },
  slate: {
    badge: "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-400",
    panel: "border-slate-200 bg-slate-50 text-slate-700",
  },
};

function StatusPill({ label, tone = "slate", icon: Icon = null }) {
  const styles = toneStyles[tone] ?? toneStyles.slate;

  return (
    <Badge
      variant="outline"
      className={ `gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${styles.badge}` }
    >
      <span className={ `size-1.5 rounded-full ${styles.dot}` } aria-hidden="true" />
      { Icon && <Icon className="size-3.5" aria-hidden="true" /> }
      { label }
    </Badge>
  );
}

function InfoField({ label, value, detail = null }) {
  return (
    <div className="min-w-0 py-2.5">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        { label }
      </dt>
      <dd className="mt-1 wrap-break-words text-sm font-medium text-slate-800">
        { displayValue(value) }
      </dd>
      { hasValue(detail) && (
        <p className="mt-0.5 text-xs text-slate-500">{ displayValue(detail) }</p>
      ) }
    </div>
  );
}

function Metric({ label, value, detail }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200/70">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        { label }
      </p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
        { value }
      </p>
      { hasValue(detail) && (
        <p className="mt-0.5 truncate text-xs text-slate-500">{ detail }</p>
      ) }
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center">
      { Icon && (
        <Icon
          className="mx-auto size-5 text-slate-400"
          strokeWidth={ 1.8 }
          aria-hidden="true"
        />
      ) }
      <p className="mt-2 text-sm font-medium text-slate-700">{ title }</p>
      { hasValue(description) && (
        <p className="mt-1 text-xs text-slate-500">{ description }</p>
      ) }
    </div>
  );
}

function PhotoTile({ photo, onOpen }) {
  return (
    <button
      type="button"
      onClick={ onOpen }
      className="group relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:h-24 sm:w-32"
    >
      <img
        src={ photo.url }
        alt={ `${photo.label} photo` }
        loading="lazy"
        className="size-full object-cover transition-transform group-hover:scale-105"
      />
      <span className="absolute inset-x-0 bottom-0 truncate bg-slate-950/70 px-2 py-1 text-xs font-medium text-white">
        { photo.label }
      </span>
    </button>
  );
}

function DetailSection({
  id = undefined,
  icon: Icon,
  title,
  description = null,
  action = null,
  children,
  className = "",
}) {
  const titleId = id ? `${id}-title` : undefined;

  return (
    <Card
      id={ id }
      aria-labelledby={ titleId }
      className={ `gap-0 overflow-hidden rounded-xl py-0 shadow-card ring-slate-200 ${className}` }
    >
      <CardHeader className="border-b border-slate-200 px-4 py-3.5 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id={ titleId }
              className="flex items-center gap-2 text-sm font-semibold text-slate-900"
            >
              <Icon className="size-4 text-brand-600" aria-hidden="true" />
              { title }
            </h2>
            { hasValue(description) && (
              <p className="mt-1 text-xs text-slate-500">{ description }</p>
            ) }
          </div>
          { action && <div className="shrink-0">{ action }</div> }
        </div>
      </CardHeader>
      <CardContent className="px-4 pt-4 pb-5 sm:px-5">{ children }</CardContent>
    </Card>
  );
}

function DriverDetailsPage() {
  const { id: routeId } = useParams<{ id: string | string[] }>();
  const driverId = Array.isArray(routeId) ? routeId[0] : routeId;
  const router = useRouter();
  const toast = useToast();
  const { has } = usePermissions();
  const canProcessPayouts = has(PERMISSIONS.FINANCE_PAYOUTS_MANAGE);
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
  const lightboxCloseRef = useRef(null);
  const {
    data: driver,
    dataUpdatedAt,
    isPending: driverPending,
    isFetching,
    isError: driverIsError,
    error: driverError,
    refetch: refetchDriver,
  } = useDriverDetails(driverId);
  const session = useSession();
  const staffDirectoryQuery = useStaffDirectory(
    Boolean(driver?.documents?.some((document) => document.reviewedById)),
  );
  const reviewerNames = useMemo(() => {
    const names = new Map<string, string>();

    (staffDirectoryQuery.data ?? []).forEach((member) => {
      if (hasValue(member.id) && hasValue(member.name)) {
        names.set(String(member.id), member.name);
      }
    });

    return names;
  }, [staffDirectoryQuery.data]);

  useEffect(() => {
    if (!lightboxPhoto) return undefined;

    const previouslyFocused = window.document.activeElement as HTMLElement | null;
    lightboxCloseRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setLightboxPhoto(null);
        return;
      }
      if (event.key === "Tab") {
        event.preventDefault();
        lightboxCloseRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [lightboxPhoto]);

  const documents = driver?.documents ?? [];
  const approveDocument = useApproveDocument();
  const rejectDocument = useRejectDocument();
  const verifyDriver = useVerifyDriver();
  const rejectDriver = useRejectDriver();
  const suspendDriver = useSuspendDriver();
  const unsuspendDriver = useUnsuspendDriver();
  const closeDocumentReview = useCallback(() => setReviewTarget(null), []);

  if (driverPending) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-32" />
        <Card className="gap-0 rounded-xl py-0 shadow-card ring-slate-200">
          <CardContent className="px-5 py-6">
            <div className="flex items-center gap-4">
              <Skeleton className="size-20 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72 max-w-full" />
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
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
      <Card className="rounded-xl shadow-card ring-slate-200">
        <QueryError error={ driverError } onRetry={ refetchDriver } />
      </Card>
    );
  }

  const profile = driver.profile ?? {};
  const latraFromDriver: DriverLatraStatus = driver.latra ?? {
    submitted: null,
    submittedAt: null,
    submissionStatus: null,
    referenceNumber: null,
    errorMessage: null,
  };
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
    driver.primaryVehicle ??
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
  const latra = {
    submitted: latraFromDriver.submitted ?? vehicle.latra_verified ?? null,
    submittedAt:
      latraFromDriver.submittedAt ?? vehicle.latra_submitted_at ?? null,
    submissionStatus:
      latraFromDriver.submissionStatus ??
      vehicle.latra_submission_status ??
      null,
    referenceNumber:
      latraFromDriver.referenceNumber ?? vehicle.latra_reference_number ?? null,
    errorMessage:
      latraFromDriver.errorMessage ?? vehicle.latra_error_message ?? null,
  };
  const activity = profile.activity ?? profile.activity_summary ?? {};
  const items = documents ?? [];
  const resolveReviewerLabel = (document) => {
    if (hasValue(document.reviewedBy)) return document.reviewedBy;

    const reviewerId = document.reviewedById;
    if (!hasValue(reviewerId)) return null;

    const normalizedId = String(reviewerId);
    const directoryName = reviewerNames.get(normalizedId);
    if (hasValue(directoryName)) return directoryName;

    if (
      session?.id != null &&
      String(session.id) === normalizedId &&
      hasValue(session.name)
    ) {
      return session.name;
    }

    return `Unknown reviewer (${normalizedId})`;
  };
  const documentMutationPending =
    approveDocument.isPending || rejectDocument.isPending;
  const isSuspended = driver.statusKey === "suspended";
  const email = driver.email === "—" ? "" : driver.email;
  const phone = driver.phone === "—" ? "" : driver.phone;
  const profilePhotoUrl =
    driver.profilePhotoUrl ??
    firstValue([profile, personal], ["profile_photo_url", "photo_url"]);
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
  const onlineLabel = isOnline
    ? "Online"
    : online === false
      ? "Offline"
      : lastOnline
        ? `Last seen ${formatRelative(lastOnline)}`
        : null;
  const dateJoined = firstValue([profile, personal], ["created_at", "joined_at"]);
  const joinedRelative = dateJoined ? formatRelative(dateJoined) : null;
  const missingDocuments = driver.missingDocuments ?? [];
  const hasMissingDocuments = missingDocuments.length > 0;
  const isReadyForVerification =
    !hasMissingDocuments &&
    (driver.canBeVerified === true || driver.allDocumentsVerified === true);

  const statusTone =
    isSuspended || driver.statusKey === "rejected"
      ? "rose"
      : driver.statusKey === "pending"
        ? "amber"
        : driver.statusKey === "verified"
          ? "emerald"
          : "slate";
  const statusLabel = hasValue(driver.status)
    ? driver.status
    : titleCaseText(driver.statusKey ?? "unknown");

  const normalizedLatraStatus = String(latra.submissionStatus ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const latraSucceeded = ["approved", "verified", "success", "completed"].includes(
    normalizedLatraStatus,
  );
  const latraPending = ["pending", "submitted", "in_review", "processing"].includes(
    normalizedLatraStatus,
  );
  const latraTone = latra.errorMessage
    ? "rose"
    : latraSucceeded
      ? "emerald"
      : latraPending
        ? "amber"
        : "slate";
  const latraLabel = latra.errorMessage
    ? "Submission failed"
    : hasValue(latra.submissionStatus)
      ? titleCaseText(latra.submissionStatus)
      : latra.submitted === true
        ? "Submitted"
        : latra.submitted === false
          ? "Not submitted"
          : "No status available";

  const photoFields: [string, string[]][] = [
    [
      "Front",
      [
        "front_photo_url",
        "front_photo",
        "front_image",
        "vehicle_front_photo",
        "vehicle_front_photo_url",
      ],
    ],
    [
      "Back",
      [
        "back_photo_url",
        "rear_photo_url",
        "back_photo",
        "back_image",
        "vehicle_back_photo",
        "vehicle_back_photo_url",
      ],
    ],
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
  const primaryVehiclePhoto =
    vehiclePhotos.find((photo) => photo.label === "Front") ??
    vehiclePhotos.find((photo) => photo.label === "Back") ??
    vehiclePhotos.find(
      (photo) => photo.label !== "Front" && photo.label !== "Back",
    ) ??
    (vehiclePhotoDocs[0]
      ? { label: "Vehicle photo", url: vehiclePhotoDocs[0].fileUrl }
      : null);

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
  const totalDrives = driver.driveStats?.total_drives ?? driver.totalDrives;

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
          totalDrives: driver.totalDrives,
          rating: driver.rating,
          ratingCount: driver.ratingCount,
          profile,
          vehicle: driver.vehicle ?? null,
          primaryVehicle: driver.primaryVehicle ?? null,
          vehicles: driver.vehicles ?? [],
          driveStats: driver.driveStats ?? null,
          payoutStats: driver.payoutStats ?? null,
          latra,
        },
        documents: items.map(({ fileUrl: _fileUrl, ...document }) => document),
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

  const getPayoutMetric = (keys) =>
    firstValue([driver.payoutStats ?? {}], keys);
  const payoutRows = [
    ["Gross earnings", getPayoutMetric(["gross_earnings", "gross_amount", "total_gross"])],
    ["Platform fee", getPayoutMetric(["platform_fee", "platform_fees", "commission_amount"])],
    ["Paid out", getPayoutMetric(["paid_out", "paid_amount", "total_paid"])],
    ["Pending payout", getPayoutMetric(["pending_payout", "pending_amount", "unpaid_amount"])],
  ]
    .filter(([, value]) => hasValue(value))
    .map(([label, value]) => [label, formatMoneyValue(value)]);
  const activityRows = [
    ["Online status", onlineLabel],
    ["Last activity", driver.lastActivity ? formatRelative(driver.lastActivity) : null],
    ["Joined", hasValue(driver.joined) ? driver.joined : null],
    ...payoutRows,
  ].filter(([, value]) => hasValue(value));
  const identityFields = [
    ["Phone", phone],
    ["Email", email],
    ["National ID", nationalId],
    ["Referral code", referralCode],
    ["Referred by", referredBy],
    ["Joined", driver.joined],
    ["Driver ID", driver.id],
  ].filter(([, value]) => hasValue(value));

  return (
    <>
      <div className="mx-auto max-w-350 space-y-5 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/drivers">
              <ArrowLeft aria-hidden="true" />
              Back to drivers
            </Link>
          </Button>
          <RefreshIndicator
            isFetching={ isFetching }
            updatedAt={ dataUpdatedAt }
            onRefresh={ refetchDriver }
          />
        </div>

        <Card className="gap-0 overflow-hidden rounded-xl py-0 shadow-card ring-slate-200">
          <CardContent className="px-4 pt-5 sm:px-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                { hasValue(profilePhotoUrl) ? (
                  <button
                    type="button"
                    onClick={ () =>
                      setLightboxPhoto({
                        label: `${driver.name} profile photo`,
                        url: profilePhotoUrl,
                      })
                    }
                    className="group size-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  >
                    <img
                      src={ profilePhotoUrl }
                      alt={ `${driver.name} profile photo` }
                      className="size-full object-cover transition-transform group-hover:scale-105"
                    />
                  </button>
                ) : (
                  <div
                    className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 ring-1 ring-slate-200"
                    aria-hidden="true"
                  >
                    <UserRound className="size-8" strokeWidth={ 1.6 } />
                  </div>
                ) }
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                      { driver.name }
                    </h1>
                    <StatusPill label={ statusLabel } tone={ statusTone } />
                    { driver.hasIssues === true && (
                      <StatusPill
                        label="Flagged"
                        tone="amber"
                        icon={ ShieldAlert }
                      />
                    ) }
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span>{ driver.isActive ? "Active account" : "Inactive account" }</span>
                    { hasValue(driver.id) && <span>ID: { displayValue(driver.id) }</span> }
                    { joinedRelative && <span>Joined { joinedRelative }</span> }
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    { phone && (
                      <a
                        href={ `tel:${encodeURIComponent(phone)}` }
                        className="inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-slate-900"
                      >
                        <Phone className="size-4 text-slate-400" aria-hidden="true" />
                        { phone }
                      </a>
                    ) }
                    { email && (
                      <a
                        href={ `mailto:${encodeURIComponent(email)}` }
                        className="inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-slate-900"
                      >
                        <Mail className="size-4 text-slate-400" aria-hidden="true" />
                        { email }
                      </a>
                    ) }
                  </div>
                </div>
              </div>

              <div className="grid w-full gap-2 sm:grid-cols-3 lg:w-150">
                <Metric
                  label="Rating"
                  value={
                    numericValue(driver.rating) > 0
                      ? `${Number(driver.rating).toFixed(1)} / 5`
                      : "—"
                  }
                  detail={
                    driver.ratingCount > 0
                      ? `${driver.ratingCount} ratings`
                      : null
                  }
                />
                <Metric label="Rides" value={ displayValue(driver.rides) } detail={ null } />
                <Metric
                  label="Drives"
                  value={ hasValue(totalDrives) ? displayValue(totalDrives) : "—" }
                  detail={ null }
                />
              </div>
            </div>

            { hasMissingDocuments && (
              <div
                className={ `mt-5 rounded-lg border px-3 py-2.5 text-xs ${toneStyles.amber.panel}` }
              >
                <p className="font-semibold">
                  Verification blocked — { missingDocuments.length } missing
                  document{ missingDocuments.length === 1 ? "" : "s" }
                </p>
                <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  { missingDocuments.map((doc, index) => (
                    <li key={ index }>{ displayValue(doc) }</li>
                  )) }
                </ul>
                { driver.canBeVerified === false && (
                  <p className="mt-1 text-amber-800">
                    Upload the missing documents before verifying this driver.
                  </p>
                ) }
              </div>
            ) }
            { !hasMissingDocuments && isReadyForVerification &&
              driver.statusKey === "pending" && (
                <div
                  className={ `mt-5 rounded-lg border px-3 py-2.5 text-xs ${toneStyles.emerald.panel}` }
                >
                  <p className="font-semibold">
                    All required documents are verified. This application is
                    ready for review.
                  </p>
                </div>
              ) }
          </CardContent>

          <CardFooter className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              { driver.statusKey === "pending" && (
                <>
                  <Can permission={ PERMISSIONS.DRIVERS_VERIFY }>
                    <Button
                      type="button"
                      disabled={
                        verifyDriver.isPending || driver.canBeVerified === false
                      }
                      onClick={ () =>
                        (
                          verifyDriver.mutate as unknown as (variables: {
                            driverId: string;
                          }) => void
                        )({ driverId: String(driverId) })
                      }
                    >
                      <CircleCheck aria-hidden="true" />
                      Verify driver
                    </Button>
                  </Can>
                  <Can permission={ PERMISSIONS.DRIVERS_VERIFY }>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={ () => {
                        setRejectReason("");
                        setRejectOpen(true);
                      } }
                    >
                      <CircleX aria-hidden="true" />
                      Reject
                    </Button>
                  </Can>
                </>
              ) }
              { isSuspended && (
                <Can permission={ PERMISSIONS.DRIVERS_SUSPEND }>
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
                    <CircleCheck aria-hidden="true" />
                    Reactivate driver
                  </Button>
                </Can>
              ) }
              { driver.statusKey === "verified" && driver.isActive && (
                <Can permission={ PERMISSIONS.DRIVERS_SUSPEND }>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    onClick={ () => {
                      setSuspendReason("");
                      setSuspendOpen(true);
                    } }
                  >
                    <ShieldAlert aria-hidden="true" />
                    Suspend driver
                  </Button>
                </Can>
              ) }
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <EllipsisVertical aria-hidden="true" />
                  More actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Driver</DropdownMenuLabel>
                { phone && (
                  <DropdownMenuItem asChild>
                    <a href={ `tel:${encodeURIComponent(phone)}` }>
                      <Phone aria-hidden="true" />
                      Call driver
                    </a>
                  </DropdownMenuItem>
                ) }
                { email && (
                  <DropdownMenuItem asChild>
                    <a href={ `mailto:${encodeURIComponent(email)}` }>
                      <MessageSquare aria-hidden="true" />
                      Email driver
                    </a>
                  </DropdownMenuItem>
                ) }
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Related records</DropdownMenuLabel>
                <DropdownMenuItem onSelect={ navigateToRides }>
                  <ArrowUpRight aria-hidden="true" />
                  View rides
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={ navigateToPayouts }>
                  <Download aria-hidden="true" />
                  View earnings
                </DropdownMenuItem>
                { canProcessPayouts && (
                  <DropdownMenuItem onSelect={ navigateToPendingPayouts }>
                    <CircleCheck aria-hidden="true" />
                    Process payouts
                  </DropdownMenuItem>
                ) }
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={ exportProfile }>
                  <FileText aria-hidden="true" />
                  Export data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        </Card>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
          <div className="space-y-5">
            <DetailSection
              id="driver-documents"
              icon={ FileText }
              title="Documents"
              description="Review submitted proof before verifying this application."
              action={
                <div className="flex items-center gap-2">
                  { driver.allDocumentsVerified === true && (
                    <StatusPill label="All verified" tone="emerald" />
                  ) }
                  <Badge variant="outline" className="rounded-full px-2.5 text-xs">
                    { items.length } document{ items.length === 1 ? "" : "s" }
                  </Badge>
                </div>
              }
            >
              { items.length === 0 ? (
                <EmptyState
                  icon={ FileText }
                  title="No documents uploaded"
                  description={
                    hasMissingDocuments
                      ? "Required documents are still missing."
                      : null
                  }
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  { items.map((document) => {
                    const documentTone = document.isApproved
                      ? "emerald"
                      : document.isRejected
                        ? "rose"
                        : "amber";
                    const reviewerLabel = resolveReviewerLabel(document);

                    return (
                      <li
                        key={ document.id ?? document.fileName }
                        className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          { document.isImage && document.fileUrl ? (
                            <img
                              src={ document.fileUrl }
                              alt={ `${document.typeLabel} document thumbnail` }
                              loading="lazy"
                              className="size-10 shrink-0 rounded-md border border-slate-200 object-cover"
                            />
                          ) : (
                            <div
                              className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500"
                              aria-hidden="true"
                            >
                              <FileText className="size-4" />
                            </div>
                          ) }
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-slate-800">
                                { document.typeLabel }
                              </p>
                              <StatusPill
                                label={ document.status }
                                tone={ documentTone }
                              />
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              { document.reviewedAt
                                ? `Reviewed ${document.reviewedAt}`
                                : `Uploaded ${document.uploadedAt}` }
                              { document.reviewedAt && hasValue(reviewerLabel)
                                ? ` · by ${reviewerLabel}`
                                : "" }
                              { hasValue(document.fileFormatLabel)
                                ? ` · ${document.fileFormatLabel}`
                                : "" }
                            </p>
                            { document.expiry !== "No expiry" && (
                              <p className="mt-0.5 text-xs text-slate-500">
                                Valid until { document.expiry }
                              </p>
                            ) }
                            { hasValue(document.rejectionReason) && (
                              <p className="mt-1 text-xs font-medium text-rose-700">
                                { document.rejectionReason }
                              </p>
                            ) }
                          </div>
                        </div>
                        <Can permission={ PERMISSIONS.DRIVERS_DOCUMENTS_REVIEW }>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={ documentMutationPending }
                            onClick={ () => setReviewTarget(document) }
                          >
                            Review
                            <ArrowUpRight aria-hidden="true" />
                          </Button>
                        </Can>
                      </li>
                    );
                  }) }
                </ul>
              ) }
            </DetailSection>

            <DetailSection
              icon={ CarFront }
              title="Vehicle & media"
              description="Registered vehicle details and uploaded photos."
              action={
                hasValue(driver.plateNumber) ? (
                  <Badge
                    variant="outline"
                    className="rounded-full px-2.5 font-mono text-xs text-slate-700"
                  >
                    { displayValue(driver.plateNumber) }
                  </Badge>
                ) : null
              }
            >
              <dl className="grid gap-x-6 sm:grid-cols-2">
                <InfoField
                  label="Make / model"
                  value={
                    [driver.vehicleMake, driver.vehicleModel]
                      .filter(Boolean)
                      .join(" ") || driver.vehicle
                  }
                />
                <InfoField label="Type" value={ driver.vehicleType } />
                <InfoField label="Year" value={ driver.vehicleYear } />
                <InfoField label="Color" value={ driver.vehicleColor } />
                <InfoField
                  label="Plate verified"
                  value={
                    driver.vehiclePlateVerified === true
                      ? "Yes"
                      : driver.vehiclePlateVerified === false
                        ? "No"
                        : null
                  }
                />
                <InfoField
                  label="Insurance"
                  value={
                    insuranceExpiry ? formatDate(insuranceExpiry) : null
                  }
                  detail={
                    insuranceValidity === true
                      ? "Valid"
                      : insuranceValidity === false
                        ? "Expired"
                        : null
                  }
                />
              </dl>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Photos
                  </h3>
                  { primaryVehiclePhoto && (
                    <span className="text-xs text-slate-500">
                      { primaryVehiclePhoto.label }
                    </span>
                  ) }
                </div>
                { primaryVehiclePhoto ? (
                  <PhotoTile
                    photo={ primaryVehiclePhoto }
                    onOpen={ () => setLightboxPhoto(primaryVehiclePhoto) }
                  />
                ) : (
                  <EmptyState
                    icon={ CarFront }
                    title="No vehicle photos"
                    description="No vehicle images were returned for this driver."
                  />
                ) }
              </div>
            </DetailSection>
          </div>

          <div className="space-y-5">
            <DetailSection
              icon={ UserRound }
              title="Identity & contact"
              description="Recorded profile details from the driver application."
            >
              { identityFields.length > 0 ? (
                <dl className="grid gap-x-6 sm:grid-cols-2">
                  { identityFields.map(([label, value]) => (
                    <InfoField key={ label } label={ label } value={ value } />
                  )) }
                </dl>
              ) : (
                <EmptyState
                  icon={ UserRound }
                  title="No additional profile details"
                  description="Only the driver name is available."
                />
              ) }
            </DetailSection>

            <DetailSection
              icon={ ShieldAlert }
              title="LATRA compliance"
              description="Regulatory submission status for this driver."
            >
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill label={ latraLabel } tone={ latraTone } />
                { hasValue(latra.referenceNumber) && (
                  <span className="font-mono text-xs text-slate-500">
                    { displayValue(latra.referenceNumber) }
                  </span>
                ) }
              </div>
              { latra.submittedAt && (
                <p className="mt-3 text-xs text-slate-500">
                  Submitted { formatDate(latra.submittedAt) } ·{ " " }
                  { formatRelative(latra.submittedAt) }
                </p>
              ) }
              { hasValue(latra.errorMessage) && (
                <p
                  className={ `mt-3 rounded-lg border px-3 py-2 text-xs ${toneStyles.rose.panel}` }
                >
                  { displayValue(latra.errorMessage) }
                </p>
              ) }
              { !hasValue(latra.submitted) &&
                !hasValue(latra.submissionStatus) &&
                !hasValue(latra.errorMessage) && (
                  <p className="mt-3 text-xs text-slate-500">
                    No LATRA submission data was returned.
                  </p>
                ) }
            </DetailSection>

            <DetailSection
              icon={ Clock3 }
              title="Activity & payouts"
              description="Latest available signals and payout totals."
              action={
                canProcessPayouts ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={ navigateToPendingPayouts }
                  >
                    Process payouts
                  </Button>
                ) : null
              }
            >
              { activityRows.length > 0 ? (
                <dl className="grid gap-x-6 sm:grid-cols-2">
                  { activityRows.map(([label, value]) => (
                    <InfoField key={ label } label={ label } value={ value } />
                  )) }
                </dl>
              ) : (
                <EmptyState
                  icon={ Clock3 }
                  title="No recent activity"
                  description="No activity or payout totals were returned."
                />
              ) }
            </DetailSection>
          </div>
        </div>
      </div>

      <Can permission={ PERMISSIONS.DRIVERS_DOCUMENTS_REVIEW }>
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
      </Can>

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
              ref={ lightboxCloseRef }
              type="button"
              variant="ghost"
              size="icon"
              onClick={ () => setLightboxPhoto(null) }
              aria-label={ `Close ${lightboxPhoto.label}` }
              className="absolute -right-2 -top-2 z-10 rounded-full bg-white text-slate-700 hover:bg-slate-100 sm:right-0 sm:top-0"
            >
              <X aria-hidden="true" />
            </Button>
            <img
              src={ lightboxPhoto.url }
              alt={ lightboxPhoto.label }
              className="max-h-[80dvh] max-w-full rounded-lg object-contain"
            />
            <p className="text-sm font-medium text-white">{ lightboxPhoto.label }</p>
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

      <Can permission={ PERMISSIONS.DRIVERS_DOCUMENTS_REVIEW }>
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
      </Can>
    </>
  );
}

export default DriverDetailsPage;
