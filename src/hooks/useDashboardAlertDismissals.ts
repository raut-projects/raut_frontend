"use client";

import { useCallback, useMemo, useState } from "react";
import {
  dismissDashboardAlert,
  getDismissedAlertIds,
} from "@/lib/dashboardAlerts";
import type {
  DashboardAlert,
  DashboardAlertPriority,
} from "@/types/dashboardOps";

const PRIORITY_ORDER: DashboardAlertPriority[] = [
  "critical",
  "high",
  "medium",
  "low",
];

export function useDashboardAlertDismissals(alerts: DashboardAlert[]) {
  const [dismissedIds, setDismissedIds] = useState<string[]>(() =>
    getDismissedAlertIds(),
  );

  const dismissAlert = useCallback((id: string) => {
    dismissDashboardAlert(id);
    setDismissedIds((current) =>
      current.includes(id) ? current : [...current, id],
    );
  }, []);

  const visibleAlerts = useMemo(
    () =>
      alerts
        .filter((alert) => !dismissedIds.includes(alert.id))
        .sort((a, b) => {
          const priorityDiff =
            PRIORITY_ORDER.indexOf(a.priority) -
            PRIORITY_ORDER.indexOf(b.priority);
          if (priorityDiff !== 0) return priorityDiff;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }),
    [alerts, dismissedIds],
  );

  return { dismissedIds, dismissAlert, visibleAlerts };
}
