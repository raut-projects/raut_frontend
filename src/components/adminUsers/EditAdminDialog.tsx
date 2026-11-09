"use client";

import { useId, useState } from "react";

import SidePanel from "@/components/SidePanel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useUpdateAdminUser } from "@/hooks/useAdminUsers";
import {
  ADMIN_ROLE_LABELS,
  PERMISSION_FEATURES,
  formatPhone,
  PERMISSION_LEVEL_LABELS,
  resolvePermission,
  type AdminRoleKey,
  type AdminUser,
  type PermissionFeature,
  type PermissionLevel,
  type PermissionOverrides,
} from "@/lib/adminUsers";
import { editAdminUserSchema } from "@/schemas/adminUserSchemas";

import { AdminRoleSelect } from "./AdminRoleSelect";

type EditAdminDialogProps = {
  open: boolean;
  user: AdminUser | null;
  isSelf: boolean;
  onClose: () => void;
};

type OverrideValue = PermissionLevel | "default";

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";
const errorClass = "mt-1 block text-xs font-medium text-rose-600";

function initialOverrides(user: AdminUser | null): Record<string, OverrideValue> {
  const result: Record<string, OverrideValue> = {};

  PERMISSION_FEATURES.forEach((feature) => {
    result[feature.key] = user?.permissions?.[feature.key] ?? "default";
  });

  return result;
}

export function EditAdminDialog({
  open,
  user,
  isSelf,
  onClose,
}: EditAdminDialogProps) {
  const formId = `edit-admin-${useId()}`;
  const updateMutation = useUpdateAdminUser();
  const [role, setRole] = useState<AdminRoleKey>(user?.role ?? "support_agent");
  const [twoFactorRequired, setTwoFactorRequired] = useState(
    user?.twoFactorRequired ?? true,
  );
  const [overrides, setOverrides] = useState<Record<string, OverrideValue>>(
    () => initialOverrides(user),
  );
  const [error, setError] = useState("");

  const roleChanged = Boolean(user && role !== user.role);
  const overrideCount = Object.values(overrides).filter(
    (value) => value !== "default",
  ).length;

  const handleClose = () => {
    updateMutation.reset();
    onClose();
  };

  const setOverride = (feature: PermissionFeature, value: OverrideValue) => {
    setOverrides((previous) => ({ ...previous, [feature]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user || updateMutation.isPending) return;

    const permissions: PermissionOverrides = {};
    Object.entries(overrides).forEach(([feature, value]) => {
      if (value !== "default") {
        permissions[feature as PermissionFeature] = value;
      }
    });

    const result = editAdminUserSchema.safeParse({
      role,
      twoFactorRequired,
      permissions: Object.keys(permissions).length ? permissions : undefined,
    });

    if (!result.success) {
      setError(
        result.error.flatten().fieldErrors.role?.[0] ??
          "Check the selected role and try again.",
      );
      return;
    }

    const payload: {
      role: AdminRoleKey;
      two_factor_required: boolean;
      permissions?: PermissionOverrides;
    } = {
      role: result.data.role,
      two_factor_required: result.data.twoFactorRequired,
    };

    if (result.data.permissions) {
      payload.permissions = result.data.permissions;
    }

    updateMutation.mutate(
      { userId: user.id, payload },
      {
        onSuccess: () => {
          handleClose();
        },
      },
    );
  };

  return (
    <SidePanel
      open={open}
      onClose={handleClose}
      wide
      title={user ? `Edit ${user.name}` : "Edit admin user"}
      description={user ? user.email : "Update role and access."}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={updateMutation.isPending}
            className="h-auto border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={updateMutation.isPending || !user}
            className="h-auto px-4 py-2 text-sm font-semibold"
          >
            {updateMutation.isPending ? "Saving." : "Save changes"}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5"
      >
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-xs text-slate-600 sm:grid-cols-3">
          <div>
            <span className="block font-semibold text-slate-500">Admin ID</span>
            {user?.id ?? "\u2014"}
          </div>
          <div>
            <span className="block font-semibold text-slate-500">Phone</span>
            {user?.phone ? formatPhone(user.phone) : "\u2014"}
          </div>
          <div>
            <span className="block font-semibold text-slate-500">Status</span>
            {user?.status ?? "\u2014"}
          </div>
        </div>

        <div className="space-y-2">
          <span className={labelClass}>Role</span>
          <AdminRoleSelect
            value={role}
            onChange={setRole}
            disabled={isSelf}
          />
          {isSelf && (
            <p className="text-xs text-slate-500">
              You cannot change your own role. Ask another Super Admin to update
              it.
            </p>
          )}
          {(error || roleChanged) && (
            <p className={error ? errorClass : "text-xs text-amber-700"}>
              {error ||
                `Changing the role to ${ADMIN_ROLE_LABELS[role]} updates this admin's inherited access.`}
            </p>
          )}
        </div>

        <label className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
          <span>
            <span className="block text-sm font-medium text-slate-700">
              Require two-factor authentication
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Ask for a one-time code when this admin signs in.
            </span>
          </span>
          <Switch
            checked={twoFactorRequired}
            onCheckedChange={setTwoFactorRequired}
            aria-label="Require two-factor authentication"
          />
        </label>

        <div className="rounded-xl border border-slate-200">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Permission overrides
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Keep the role defaults, or customise individual features.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {overrideCount} custom
            </span>
          </div>

          <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
            {PERMISSION_FEATURES.map((feature) => {
              const inherited = resolvePermission(role, feature.key);
              const value = overrides[feature.key] ?? "default";

              return (
                <div
                  key={feature.key}
                  className="flex items-center justify-between gap-3 px-4 py-2"
                >
                  <span className="text-xs font-medium text-slate-700">
                    {feature.label}
                  </span>
                  <select
                    value={value}
                    onChange={(event) =>
                      setOverride(
                        feature.key,
                        event.target.value as OverrideValue,
                      )
                    }
                    aria-label={`Permission for ${feature.label}`}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="default">
                      Role default ({PERMISSION_LEVEL_LABELS[inherited]})
                    </option>
                    <option value="full">Full access</option>
                    <option value="limited">Limited access</option>
                    <option value="none">No access</option>
                    {feature.key === "audit_logs" && (
                      <>
                        <option value="own">Own only</option>
                        <option value="finance">Finance scope</option>
                        <option value="marketing">Marketing scope</option>
                      </>
                    )}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Overrides are saved with the admin profile and supersede the role
          matrix.
        </p>
      </form>
    </SidePanel>
  );
}
