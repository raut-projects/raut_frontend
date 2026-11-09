"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Printer, Search, X } from "lucide-react";

import { useToast } from "@/components/toastContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ADMIN_ROLES,
  PERMISSION_FEATURES,
  PERMISSION_LEVEL_GLYPHS,
  PERMISSION_LEVEL_LABELS,
  PERMISSION_MATRIX,
  downloadPermissionMatrixCsv,
  type AdminRoleKey,
} from "@/lib/adminUsers";

import { PermissionMatrixTable } from "./PermissionMatrixTable";

type PermissionMatrixDialogProps = {
  open: boolean;
  onClose: () => void;
  initialRole?: AdminRoleKey | "all";
};

const legend = [
  { level: "full" as const, label: "Full" },
  { level: "limited" as const, label: "Limited" },
  { level: "none" as const, label: "None" },
  { level: "own" as const, label: "Own only" },
  { level: "finance" as const, label: "Finance scope" },
  { level: "marketing" as const, label: "Marketing scope" },
];

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function PermissionMatrixDialog({
  open,
  onClose,
  initialRole = "all",
}: PermissionMatrixDialogProps) {
  const toast = useToast();
  const [roleFilter, setRoleFilter] = useState<AdminRoleKey | "all">(
    initialRole,
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  const features = useMemo(() => {
    const needle = search.trim().toLowerCase();

    if (!needle) return PERMISSION_FEATURES;

    return PERMISSION_FEATURES.filter(
      (feature) =>
        feature.label.toLowerCase().includes(needle) ||
        feature.group.toLowerCase().includes(needle),
    );
  }, [search]);

  const roles =
    roleFilter === "all"
      ? ADMIN_ROLES
      : ADMIN_ROLES.filter((role) => role.key === roleFilter);

  const printMatrix = () => {
    const printWindow = window.open("", "_blank", "width=1100,height=800");

    if (!printWindow) {
      toast.error("Allow pop-ups to print the permission matrix.");
      return;
    }

    const header = roles
      .map((role) => `<th>${escapeHtml(role.label)}</th>`)
      .join("");
    const rows = features
      .map((feature) => {
        const cells = roles
          .map((role) => {
            const level = PERMISSION_MATRIX[feature.key][role.key];

            return `<td class="level-${level}">${PERMISSION_LEVEL_GLYPHS[level]} ${PERMISSION_LEVEL_LABELS[level]}</td>`;
          })
          .join("");

        return `<tr><th class="feature">${escapeHtml(feature.label)}<span>${escapeHtml(feature.group)}</span></th>${cells}</tr>`;
      })
      .join("");

    printWindow.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Raut permission matrix</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; margin: 28px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  p { font-size: 12px; color: #64748b; margin: 0 0 18px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 10px; text-align: center; }
  thead th { background: #f8fafc; font-size: 9px; text-transform: uppercase; letter-spacing: .03em; }
  th.feature { text-align: left; font-size: 11px; }
  th.feature span { display: block; font-weight: 400; color: #94a3b8; font-size: 9px; }
  .level-full { background: #ecfdf5; color: #047857; }
  .level-limited { background: #fffbeb; color: #b45309; }
  .level-none { background: #f8fafc; color: #94a3b8; }
  .level-own { background: #f0f9ff; color: #0369a1; }
  .level-finance { background: #f0fdfa; color: #0f766e; }
  .level-marketing { background: #f5f3ff; color: #6d28d9; }
</style>
</head>
<body>
  <h1>Admin role permission matrix</h1>
  <p>Generated ${escapeHtml(new Date().toLocaleString())} \u00b7 ${features.length} features \u00b7 ${roles.length} roles</p>
  <table>
    <thead><tr><th class="feature">Feature</th>${header}</tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const exportMatrix = () => {
    downloadPermissionMatrixCsv();
    toast.success("Permission matrix exported.");
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="permission-matrix-title"
        className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-elevated"
      >
        <div className="flex shrink-0 items-start gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="permission-matrix-title"
              className="text-base font-semibold text-slate-900"
            >
              Role permission matrix
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              What each admin role can access. Super Admin always has full
              access.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close permission matrix"
            className="ml-auto shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 px-5 py-3 sm:flex-row sm:items-center sm:px-6">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter features"
              aria-label="Filter permission features"
              className="h-9 bg-white pl-9"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value as AdminRoleKey | "all")
            }
            aria-label="Filter matrix by role"
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="all">All roles</option>
            {ADMIN_ROLES.map((role) => (
              <option key={role.key} value={role.key}>
                {role.label}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap items-center gap-3 sm:ml-auto">
            {legend.map((item) => (
              <span
                key={item.level}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500"
              >
                <span aria-hidden="true">
                  {PERMISSION_LEVEL_GLYPHS[item.level]}
                </span>
                {item.label}
              </span>
            ))}
            <div className="flex gap-2 sm:ml-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={printMatrix}
                className="h-auto border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Printer className="size-3.5" aria-hidden="true" />
                Print
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={exportMatrix}
                className="h-auto border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Download className="size-3.5" aria-hidden="true" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <PermissionMatrixTable
            features={features}
            roleFilter={roleFilter}
            roles={roles.map((role) => role.key)}
          />
          {features.length === 0 && (
            <p className="px-6 py-12 text-center text-sm text-slate-500">
              No features match that filter.
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
