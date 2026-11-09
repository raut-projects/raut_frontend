import {
  ADMIN_ROLE_TONES,
  ADMIN_STATUS_LABELS,
  ADMIN_STATUS_TONES,
  normalizeAdminRole,
  normalizeAdminStatus,
  roleLabel,
  type AdminUserStatus,
} from "@/lib/adminUsers";

export function AdminUserStatusBadge({ status }: { status: AdminUserStatus }) {
  const normalized = normalizeAdminStatus(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${ADMIN_STATUS_TONES[normalized]}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          normalized === "active"
            ? "bg-emerald-500"
            : normalized === "invited"
              ? "bg-amber-500"
              : "bg-slate-400"
        }`}
        aria-hidden="true"
      />
      {ADMIN_STATUS_LABELS[normalized]}
    </span>
  );
}

export function AdminRoleBadge({ role }: { role: string }) {
  const normalized = normalizeAdminRole(role);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ADMIN_ROLE_TONES[normalized]}`}
    >
      {roleLabel(normalized)}
    </span>
  );
}
