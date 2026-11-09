import type { AdminUserStatus } from "@/lib/adminUsers";

const TABS: Array<{ value: AdminUserStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "invited", label: "Invited" },
  { value: "deactivated", label: "Deactivated" },
];

type AdminUsersTabsProps = {
  value: AdminUserStatus;
  counts: Record<AdminUserStatus, number>;
  onChange: (status: AdminUserStatus) => void;
};

export function AdminUsersTabs({
  value,
  counts,
  onChange,
}: AdminUsersTabsProps) {
  return (
    <div
      className="flex gap-1 overflow-x-auto border-b border-slate-200"
      aria-label="Filter admin users by status"
    >
      {TABS.map((tab) => {
        const active = value === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            aria-pressed={active}
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
              active
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[0.7rem] font-semibold ${
                active
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {counts[tab.value] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
