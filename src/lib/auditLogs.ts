// Audit log domain model and formatting for the admin audit trail. Defines log
// entries and categories, formats field/value pairs for display, and builds a
// CSV export. MOCK_AUDIT_LOGS is illustrative sample data, not a backend
// contract or real platform activity.

/** Category of platform activity an audit entry belongs to. */
export type AuditCategory =
  | "User"
  | "Driver"
  | "Ride"
  | "Payout"
  | "Promotion"
  | "Settings";

/** How serious an audit event is. */
export type AuditSeverity = "info" | "warning" | "critical";

/** A single audit-trail record. `before`/`after` hold the changed fields. */
export type AuditLogEntry = {
  id: string;
  occurredAt: string;
  actor: string;
  actorEmail: string;
  actorRole: string;
  category: AuditCategory;
  action: string;
  target: string;
  targetId: string;
  summary: string;
  severity: AuditSeverity;
  ipAddress: string;
  userAgent: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
};

/** All audit categories, in display order. */
export const AUDIT_CATEGORIES: AuditCategory[] = [
  "User",
  "Driver",
  "Ride",
  "Payout",
  "Promotion",
  "Settings",
];

/** All audit severities, in display order. */
export const AUDIT_SEVERITIES: AuditSeverity[] = [
  "info",
  "warning",
  "critical",
];

/**
 * Illustrative audit entries for UI development. This is sample data only, not
 * a backend contract, and does not represent real platform activity.
 */
// Illustrative records only. These do not represent real platform activity.
export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "evt_20261110_0942_01",
    occurredAt: "2026-11-10T09:42:00Z",
    actor: "Amina Kweka",
    actorEmail: "amina.kweka@example.test",
    actorRole: "Super admin",
    category: "Payout",
    action: "Payout approved",
    target: "Payout batch PB-2048",
    targetId: "PB-2048",
    summary: "Approved 18 driver payouts totaling TZS 2,480,000.",
    severity: "critical",
    ipAddress: "197.250.12.44",
    userAgent: "Chrome 130 · Windows 11",
    before: { status: "Pending", totalTzs: 2480000 },
    after: { status: "Approved", totalTzs: 2480000, payoutCount: 18 },
  },
  {
    id: "evt_20261110_0916_02",
    occurredAt: "2026-11-10T09:16:00Z",
    actor: "Neema Mollel",
    actorEmail: "neema.mollel@example.test",
    actorRole: "Support admin",
    category: "User",
    action: "Account suspended",
    target: "Customer · Juma M.",
    targetId: "usr_83A17",
    summary: "Temporarily suspended an account after a safety report.",
    severity: "warning",
    ipAddress: "41.59.88.103",
    userAgent: "Chrome 130 · Windows 11",
    before: { accountStatus: "Active" },
    after: { accountStatus: "Suspended", reason: "Safety review" },
  },
  {
    id: "evt_20261110_0848_03",
    occurredAt: "2026-11-10T08:48:00Z",
    actor: "Grace Mwakalinga",
    actorEmail: "grace.mwakalinga@example.test",
    actorRole: "Marketing admin",
    category: "Promotion",
    action: "Promotion activated",
    target: "Promotion · NOVEMBER-RIDE",
    targetId: "promo_7FC21",
    summary: "Activated the November ride discount campaign.",
    severity: "info",
    ipAddress: "154.118.230.19",
    userAgent: "Firefox 132 · macOS",
    before: { isActive: false },
    after: { isActive: true, startsAt: "2026-11-10T06:00:00Z" },
  },
  {
    id: "evt_20261109_1724_04",
    occurredAt: "2026-11-09T17:24:00Z",
    actor: "Daniel Mushi",
    actorEmail: "daniel.mushi@example.test",
    actorRole: "Admin",
    category: "Driver",
    action: "Driver verified",
    target: "Driver · Rehema S.",
    targetId: "drv_10482",
    summary: "Verified the driver after reviewing identity and licence documents.",
    severity: "info",
    ipAddress: "197.250.12.44",
    userAgent: "Chrome 130 · Windows 11",
    before: { verificationStatus: "Pending" },
    after: { verificationStatus: "Verified", documentsReviewed: 3 },
  },
  {
    id: "evt_20261109_1605_05",
    occurredAt: "2026-11-09T16:05:00Z",
    actor: "Baraka Mtui",
    actorEmail: "baraka.mtui@example.test",
    actorRole: "Finance admin",
    category: "Payout",
    action: "Payout rejected",
    target: "Payout · PO-77403",
    targetId: "PO-77403",
    summary: "Rejected a payout because the recipient account details did not match.",
    severity: "warning",
    ipAddress: "41.222.173.66",
    userAgent: "Edge 129 · Windows 11",
    before: { status: "Pending", amountTzs: 185000 },
    after: { status: "Rejected", reason: "Account name mismatch" },
  },
  {
    id: "evt_20261109_1411_06",
    occurredAt: "2026-11-09T14:11:00Z",
    actor: "Amina Kweka",
    actorEmail: "amina.kweka@example.test",
    actorRole: "Super admin",
    category: "Settings",
    action: "Fare configuration changed",
    target: "Platform pricing · Standard rides",
    targetId: "cfg_fares_standard",
    summary: "Updated the per-kilometre fare for standard rides.",
    severity: "critical",
    ipAddress: "197.250.12.44",
    userAgent: "Chrome 130 · Windows 11",
    before: { pricePerKmTzs: 850, minimumFareTzs: 1500 },
    after: { pricePerKmTzs: 900, minimumFareTzs: 1500 },
  },
  {
    id: "evt_20261109_1202_07",
    occurredAt: "2026-11-09T12:02:00Z",
    actor: "Neema Mollel",
    actorEmail: "neema.mollel@example.test",
    actorRole: "Support admin",
    category: "Ride",
    action: "Ride cancelled",
    target: "Ride · Dar es Salaam CBD",
    targetId: "ride_5D291",
    summary: "Cancelled a ride and issued a full customer refund after a driver no-show.",
    severity: "warning",
    ipAddress: "41.59.88.103",
    userAgent: "Chrome 130 · Windows 11",
    before: { status: "In progress", fareTzs: 12400 },
    after: { status: "Cancelled", refundTzs: 12400 },
  },
  {
    id: "evt_20261108_1640_08",
    occurredAt: "2026-11-08T16:40:00Z",
    actor: "Hamisi Omari",
    actorEmail: "hamisi.omari@example.test",
    actorRole: "Operations admin",
    category: "Driver",
    action: "Driver suspended",
    target: "Driver · Peter L.",
    targetId: "drv_09517",
    summary: "Suspended driver access pending a vehicle document review.",
    severity: "warning",
    ipAddress: "102.223.14.207",
    userAgent: "Chrome 130 · Android 15",
    before: { accountStatus: "Active" },
    after: { accountStatus: "Suspended", reason: "Expired insurance" },
  },
  {
    id: "evt_20261108_1508_09",
    occurredAt: "2026-11-08T15:08:00Z",
    actor: "Grace Mwakalinga",
    actorEmail: "grace.mwakalinga@example.test",
    actorRole: "Marketing admin",
    category: "Promotion",
    action: "Promotion created",
    target: "Promotion · WEEKEND-2500",
    targetId: "promo_2AA19",
    summary: "Created a fixed discount for eligible weekend rides.",
    severity: "info",
    ipAddress: "154.118.230.19",
    userAgent: "Firefox 132 · macOS",
    after: { discountType: "Fixed", discountTzs: 2500, isActive: false },
  },
  {
    id: "evt_20261108_1113_10",
    occurredAt: "2026-11-08T11:13:00Z",
    actor: "Daniel Mushi",
    actorEmail: "daniel.mushi@example.test",
    actorRole: "Admin",
    category: "User",
    action: "Customer details updated",
    target: "Customer · Asha K.",
    targetId: "usr_77140",
    summary: "Corrected the customer’s preferred language at their request.",
    severity: "info",
    ipAddress: "197.250.12.44",
    userAgent: "Chrome 130 · Windows 11",
    before: { preferredLanguage: "en" },
    after: { preferredLanguage: "sw" },
  },
  {
    id: "evt_20261107_1752_11",
    occurredAt: "2026-11-07T17:52:00Z",
    actor: "Amina Kweka",
    actorEmail: "amina.kweka@example.test",
    actorRole: "Super admin",
    category: "Settings",
    action: "Admin role changed",
    target: "Admin · Kelvin N.",
    targetId: "adm_0042",
    summary: "Changed an administrator’s role from support to operations.",
    severity: "critical",
    ipAddress: "197.250.12.44",
    userAgent: "Chrome 130 · Windows 11",
    before: { role: "Support" },
    after: { role: "Operations", changedBy: "adm_0001" },
  },
  {
    id: "evt_20261107_1536_12",
    occurredAt: "2026-11-07T15:36:00Z",
    actor: "Baraka Mtui",
    actorEmail: "baraka.mtui@example.test",
    actorRole: "Finance admin",
    category: "Payout",
    action: "Payout retried",
    target: "Payout · PO-77091",
    targetId: "PO-77091",
    summary: "Retried a failed mobile money transfer after confirming the recipient number.",
    severity: "warning",
    ipAddress: "41.222.173.66",
    userAgent: "Edge 129 · Windows 11",
    before: { status: "Failed", attempts: 1 },
    after: { status: "Processing", attempts: 2 },
  },
  {
    id: "evt_20261107_1025_13",
    occurredAt: "2026-11-07T10:25:00Z",
    actor: "Neema Mollel",
    actorEmail: "neema.mollel@example.test",
    actorRole: "Support admin",
    category: "Ride",
    action: "Ride dispute resolved",
    target: "Ride · Mikocheni to Masaki",
    targetId: "ride_4B820",
    summary: "Resolved a fare dispute with a partial customer refund.",
    severity: "info",
    ipAddress: "41.59.88.103",
    userAgent: "Chrome 130 · Windows 11",
    before: { disputeStatus: "Open", fareTzs: 16800 },
    after: { disputeStatus: "Resolved", refundTzs: 3200 },
  },
  {
    id: "evt_20261106_1628_14",
    occurredAt: "2026-11-06T16:28:00Z",
    actor: "Hamisi Omari",
    actorEmail: "hamisi.omari@example.test",
    actorRole: "Operations admin",
    category: "Driver",
    action: "Document rejected",
    target: "Driver document · Vehicle insurance",
    targetId: "doc_61820",
    summary: "Rejected an unreadable insurance document and requested a replacement.",
    severity: "warning",
    ipAddress: "102.223.14.207",
    userAgent: "Chrome 130 · Android 15",
    before: { reviewStatus: "Pending" },
    after: { reviewStatus: "Rejected", reason: "Image is not legible" },
  },
  {
    id: "evt_20261106_1349_15",
    occurredAt: "2026-11-06T13:49:00Z",
    actor: "Amina Kweka",
    actorEmail: "amina.kweka@example.test",
    actorRole: "Super admin",
    category: "Settings",
    action: "Feature flag changed",
    target: "Platform feature · DUO rides",
    targetId: "cfg_feature_duo",
    summary: "Enabled DUO rides for the Dar es Salaam service area.",
    severity: "warning",
    ipAddress: "197.250.12.44",
    userAgent: "Chrome 130 · Windows 11",
    before: { enabled: false },
    after: { enabled: true, serviceArea: "Dar es Salaam" },
  },
  {
    id: "evt_20261106_0944_16",
    occurredAt: "2026-11-06T09:44:00Z",
    actor: "Grace Mwakalinga",
    actorEmail: "grace.mwakalinga@example.test",
    actorRole: "Marketing admin",
    category: "Promotion",
    action: "Promotion paused",
    target: "Promotion · FIRST-RIDE-15",
    targetId: "promo_18C04",
    summary: "Paused a first-ride campaign after reaching its budget cap.",
    severity: "warning",
    ipAddress: "154.118.230.19",
    userAgent: "Firefox 132 · macOS",
    before: { isActive: true, spendTzs: 4980000 },
    after: { isActive: false, budgetCapTzs: 5000000 },
  },
  {
    id: "evt_20261105_1758_17",
    occurredAt: "2026-11-05T17:58:00Z",
    actor: "Daniel Mushi",
    actorEmail: "daniel.mushi@example.test",
    actorRole: "Admin",
    category: "User",
    action: "Customer reactivated",
    target: "Customer · Omary R.",
    targetId: "usr_50132",
    summary: "Reactivated an account after completing a support review.",
    severity: "info",
    ipAddress: "197.250.12.44",
    userAgent: "Chrome 130 · Windows 11",
    before: { accountStatus: "Inactive" },
    after: { accountStatus: "Active" },
  },
  {
    id: "evt_20261105_1402_18",
    occurredAt: "2026-11-05T14:02:00Z",
    actor: "Baraka Mtui",
    actorEmail: "baraka.mtui@example.test",
    actorRole: "Finance admin",
    category: "Payout",
    action: "Payout approved",
    target: "Payout · PO-76514",
    targetId: "PO-76514",
    summary: "Approved a driver payout of TZS 326,500.",
    severity: "warning",
    ipAddress: "41.222.173.66",
    userAgent: "Edge 129 · Windows 11",
    before: { status: "Pending", amountTzs: 326500 },
    after: { status: "Approved", amountTzs: 326500 },
  },
  {
    id: "evt_20261105_1041_19",
    occurredAt: "2026-11-05T10:41:00Z",
    actor: "Neema Mollel",
    actorEmail: "neema.mollel@example.test",
    actorRole: "Support admin",
    category: "User",
    action: "Support ticket escalated",
    target: "Ticket · Safety concern",
    targetId: "ticket_44821",
    summary: "Escalated a safety ticket to the operations team.",
    severity: "critical",
    ipAddress: "41.59.88.103",
    userAgent: "Chrome 130 · Windows 11",
    before: { priority: "High", escalated: false },
    after: { priority: "Urgent", escalated: true, team: "Operations" },
  },
  {
    id: "evt_20261104_1644_20",
    occurredAt: "2026-11-04T16:44:00Z",
    actor: "Hamisi Omari",
    actorEmail: "hamisi.omari@example.test",
    actorRole: "Operations admin",
    category: "Driver",
    action: "Driver reinstated",
    target: "Driver · Peter L.",
    targetId: "drv_09517",
    summary: "Restored driver access after new insurance documents were approved.",
    severity: "info",
    ipAddress: "102.223.14.207",
    userAgent: "Chrome 130 · Android 15",
    before: { accountStatus: "Suspended" },
    after: { accountStatus: "Active", documentStatus: "Approved" },
  },
  {
    id: "evt_20261104_1312_21",
    occurredAt: "2026-11-04T13:12:00Z",
    actor: "Amina Kweka",
    actorEmail: "amina.kweka@example.test",
    actorRole: "Super admin",
    category: "Settings",
    action: "Admin invited",
    target: "Admin · Safiya John",
    targetId: "invite_2031",
    summary: "Invited a new administrator with the marketing role.",
    severity: "warning",
    ipAddress: "197.250.12.44",
    userAgent: "Chrome 130 · Windows 11",
    after: { role: "Marketing", inviteStatus: "Pending" },
  },
  {
    id: "evt_20261104_0930_22",
    occurredAt: "2026-11-04T09:30:00Z",
    actor: "Daniel Mushi",
    actorEmail: "daniel.mushi@example.test",
    actorRole: "Admin",
    category: "Ride",
    action: "Ride refund issued",
    target: "Ride · Sinza to Posta",
    targetId: "ride_1F804",
    summary: "Issued a TZS 9,600 refund after a duplicate fare charge.",
    severity: "warning",
    ipAddress: "197.250.12.44",
    userAgent: "Chrome 130 · Windows 11",
    before: { refundTzs: 0, disputeStatus: "Open" },
    after: { refundTzs: 9600, disputeStatus: "Resolved" },
  },
  {
    id: "evt_20261103_1722_23",
    occurredAt: "2026-11-03T17:22:00Z",
    actor: "Grace Mwakalinga",
    actorEmail: "grace.mwakalinga@example.test",
    actorRole: "Marketing admin",
    category: "Promotion",
    action: "Promotion edited",
    target: "Promotion · NOVEMBER-RIDE",
    targetId: "promo_7FC21",
    summary: "Extended the campaign end date and increased its total-use limit.",
    severity: "info",
    ipAddress: "154.118.230.19",
    userAgent: "Firefox 132 · macOS",
    before: { endsAt: "2026-11-24T21:00:00Z", totalUsesLimit: 2500 },
    after: { endsAt: "2026-11-30T21:00:00Z", totalUsesLimit: 4000 },
  },
  {
    id: "evt_20261103_1455_24",
    occurredAt: "2026-11-03T14:55:00Z",
    actor: "Baraka Mtui",
    actorEmail: "baraka.mtui@example.test",
    actorRole: "Finance admin",
    category: "Payout",
    action: "Payout details reviewed",
    target: "Driver payout account · A. M.",
    targetId: "payee_34802",
    summary: "Reviewed and confirmed the driver’s mobile money payout details.",
    severity: "info",
    ipAddress: "41.222.173.66",
    userAgent: "Edge 129 · Windows 11",
    before: { verificationStatus: "Unverified" },
    after: { verificationStatus: "Verified", network: "M-Pesa" },
  },
];

/** Severity to display label lookup. */
export const AUDIT_SEVERITY_LABELS: Record<AuditSeverity, string> = {
  info: "Info",
  warning: "Warning",
  critical: "Critical",
};

// Field words rendered as uppercase acronyms in labels.
const AUDIT_FIELD_ACRONYMS: Record<string, string> = {
  id: "ID",
  ip: "IP",
  url: "URL",
  sms: "SMS",
  tzs: "TZS",
  duo: "DUO",
};

// Splits camelCase, snake_case and kebab-case field names into words.
const splitAuditFieldWords = (field: string) =>
  String(field ?? "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

// True for fields whose name ends in "tzs" (a currency amount).
const isAuditCurrencyField = (field: string) => /tzs$/i.test(field);

/**
 * Formats a raw field key as a readable label.
 *
 * Splits camelCase/snake_case/kebab-case into words, uppercases known acronyms,
 * drops a leading "is"/"has" for booleans, and appends "(TZS)" for currency
 * fields.
 */
export function formatAuditFieldName(field: string) {
  const words = splitAuditFieldWords(field);
  const isCurrency = words[words.length - 1]?.toLowerCase() === "tzs";

  if (isCurrency) words.pop();

  if (words.length > 1 && /^(is|has)$/i.test(words[0])) words.shift();

  const label = words
    .map((word) => AUDIT_FIELD_ACRONYMS[word.toLowerCase()] ?? word.toLowerCase())
    .join(" ");
  const sentence = label
    ? label.charAt(0).toUpperCase() + label.slice(1)
    : "Value";

  return isCurrency ? `${sentence} (TZS)` : sentence;
}

// Matches ISO date-time strings (e.g. 2026-11-10T09:42).
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/**
 * Formats an audit value for display.
 *
 * Renders null/empty as "—", booleans as Yes/No, numbers with thousands
 * separators (prefixed "TZS" for currency fields), ISO dates via
 * {@link formatAuditDateTime}, and arrays/objects recursively.
 */
export function formatAuditValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return String(value);
    const formatted = value.toLocaleString("en-US");
    return isAuditCurrencyField(field) ? `TZS ${formatted}` : formatted;
  }

  if (typeof value === "string") {
    return ISO_DATE_PATTERN.test(value) ? formatAuditDateTime(value) : value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value.map((item) => formatAuditValue(field, item)).join(", ");
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return "—";

    return entries
      .map(
        ([key, nested]) =>
          `${formatAuditFieldName(key)}: ${formatAuditValue(key, nested)}`,
      )
      .join(" · ");
  }

  return String(value);
}

/** A formatted before/after change row for the audit detail view. */
export type AuditChangeRow = {
  key: string;
  label: string;
  value: string;
};

/** Builds display rows (key, label, value) from a before/after change map. */
export function buildAuditChangeRows(
  changes: Record<string, unknown> | undefined,
): AuditChangeRow[] {
  if (!changes) return [];

  return Object.entries(changes).map(([key, value]) => ({
    key,
    label: formatAuditFieldName(key),
    value: formatAuditValue(key, value),
  }));
}

/** True when two audit values differ, comparing by JSON when needed. */
export function auditValuesDiffer(before: unknown, after: unknown) {
  if (Object.is(before, after)) return false;

  try {
    return JSON.stringify(before) !== JSON.stringify(after);
  } catch {
    return true;
  }
}

/** Formats an ISO timestamp in Africa/Dar_es_Salaam; "Unknown date" when invalid. */
export function formatAuditDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en-TZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Dar_es_Salaam",
  }).format(date);
}

/** Returns a YYYY-MM-DD key (Dar es Salaam time) for grouping entries, or "". */
export function auditDateKey(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Africa/Dar_es_Salaam",
  }).format(date);
}

// Escapes CSV cells; prefixes formula-triggering characters to prevent injection.
const csvEscape = (value: unknown) => {
  let text = value === null || value === undefined ? "" : String(value);

  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const csvRow = (...cells: unknown[]) => cells.map(csvEscape).join(",");

/** Builds a CRLF CSV string from audit entries, including serialized before/after. */
export function buildAuditLogsCsv(entries: AuditLogEntry[]) {
  return [
    csvRow(
      "Event ID",
      "Occurred at",
      "Administrator",
      "Email",
      "Role",
      "Category",
      "Action",
      "Severity",
      "Target",
      "Target ID",
      "Summary",
      "IP address",
      "User agent",
      "Before",
      "After",
    ),
    ...entries.map((entry) =>
      csvRow(
        entry.id,
        entry.occurredAt,
        entry.actor,
        entry.actorEmail,
        entry.actorRole,
        entry.category,
        entry.action,
        AUDIT_SEVERITY_LABELS[entry.severity],
        entry.target,
        entry.targetId,
        entry.summary,
        entry.ipAddress,
        entry.userAgent,
        entry.before ? JSON.stringify(entry.before) : "",
        entry.after ? JSON.stringify(entry.after) : "",
      ),
    ),
  ].join("\r\n");
}

/** Triggers a browser download of the audit log CSV with a UTF-8 BOM. */
export function downloadAuditLogsCsv(entries: AuditLogEntry[]) {
  const blob = new Blob(["\uFEFF", buildAuditLogsCsv(entries)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `raut-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
