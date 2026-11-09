import { ADMIN_ROLES, type AdminRoleKey } from "@/lib/adminUsers";

type AdminRoleSelectProps = {
  value: AdminRoleKey;
  onChange: (role: AdminRoleKey) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

export function AdminRoleSelect({
  value,
  onChange,
  disabled,
  id,
  className = inputClass,
}: AdminRoleSelectProps) {
  const selected = ADMIN_ROLES.find((role) => role.key === value);

  return (
    <div className="space-y-1.5">
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as AdminRoleKey)}
        disabled={disabled}
        className={className}
      >
        {ADMIN_ROLES.map((role) => (
          <option key={role.key} value={role.key}>
            {role.label}
          </option>
        ))}
      </select>
      {selected && (
        <p className="text-xs text-slate-500">{selected.description}</p>
      )}
    </div>
  );
}
