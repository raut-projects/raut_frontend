import type { DashboardAlert } from "@/types/dashboardOps";

const STORAGE_KEY = "raut-dashboard-dismissed-alerts";
const EXPIRY_MS = 24 * 60 * 60 * 1000;

type DismissedRecord = { id: string; dismissedAt: number };

const isRecord = (value: unknown): value is DismissedRecord =>
  Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as DismissedRecord).id === "string" &&
      typeof (value as DismissedRecord).dismissedAt === "number",
  );

const readRecords = (): DismissedRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    const now = Date.now();
    const records: DismissedRecord[] = Array.isArray(parsed)
      ? parsed.map((entry) =>
          typeof entry === "string"
            ? { id: entry, dismissedAt: now }
            : isRecord(entry)
              ? entry
              : null,
        ).filter((entry): entry is DismissedRecord => Boolean(entry))
      : [];
    const fresh = records.filter(
      (record) => now - record.dismissedAt < EXPIRY_MS,
    );
    if (fresh.length !== records.length) writeRecords(fresh);
    return fresh;
  } catch {
    return [];
  }
};

const writeRecords = (records: DismissedRecord[]): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    return;
  }
};

export function getDismissedAlertIds(): string[] {
  return readRecords().map((record) => record.id);
}

export function dismissDashboardAlert(id: string): void {
  if (typeof window === "undefined" || !id) return;
  const records = readRecords().filter((record) => record.id !== id);
  writeRecords([...records, { id, dismissedAt: Date.now() }]);
}

export function filterVisibleDashboardAlerts(
  alerts: DashboardAlert[],
): DashboardAlert[] {
  const dismissed = new Set(getDismissedAlertIds());
  return alerts.filter((alert) => !dismissed.has(alert.id));
}
