"use client";

import { useId, useMemo, useState } from "react";

import SidePanel from "@/components/SidePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInviteStaff } from "@/hooks/useStaff";
import {
  usePermissionCatalog,
  useRbacRegions,
  useRbacRoles,
} from "@/hooks/useRbacCatalog";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { validateEmail } from "@/lib/validation";
import type { StaffInvitePayload, StaffScopeType } from "@/types/staff";

type InviteStaffDialogProps = {
  open: boolean;
  onClose: () => void;
};

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";
const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";
const errorClass = "mt-1 block text-xs font-medium text-rose-600";

const SCOPES: Array<{ value: StaffScopeType; label: string }> = [
  { value: "platform", label: "Platform" },
  { value: "region", label: "Region" },
  { value: "assigned", label: "Assigned records" },
  { value: "own", label: "Own records" },
];

export function InviteStaffDialog({ open, onClose }: InviteStaffDialogProps) {
  const formId = `invite-staff-${useId()}`;
  const { has } = usePermissions();
  const canManage = has(PERMISSIONS.PLATFORM_ADMINS_MANAGE);
  const rolesQuery = useRbacRoles(open && canManage);
  const permissionsQuery = usePermissionCatalog(open && canManage);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [scopeType, setScopeType] = useState<StaffScopeType>("platform");
  const [regionId, setRegionId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");

  const regionsQuery = useRbacRegions(open && canManage && scopeType === "region");
  const inviteMutation = useInviteStaff();

  const roles = useMemo(
    () => (rolesQuery.data ?? []).filter((role) => role.id),
    [rolesQuery.data],
  );
  const selectedRole = roles.find((role) => role.id === roleId);
  const permissionNames = useMemo(
    () =>
      new Map(
        (permissionsQuery.data ?? []).map((permission) => [
          permission.code,
          permission.name,
        ]),
      ),
    [permissionsQuery.data],
  );

  const close = () => {
    inviteMutation.reset();
    setError("");
    onClose();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inviteMutation.isPending || !canManage) return;

    const name = fullName.trim();
    const address = email.trim();

    if (!name) {
      setError("Enter the staff member's full name.");
      return;
    }

    const emailError = validateEmail(address);
    if (emailError) {
      setError(emailError);
      return;
    }

    if (!roleId) {
      setError("Choose a role for this staff member.");
      return;
    }

    if (scopeType === "region" && !regionId) {
      setError("Choose a region for this assignment.");
      return;
    }

    const payload: StaffInvitePayload = {
      email: address,
      full_name: name,
      role_id: roleId,
      scope_type: scopeType,
    };

    if (scopeType === "region") {
      payload.scope_id = regionId;
    }

    if (expiresAt) {
      const expires = new Date(`${expiresAt}T00:00:00.000Z`);
      if (!Number.isNaN(expires.getTime())) {
        payload.assignment_expires_at = expires.toISOString();
      }
    }

    setError("");
    inviteMutation.mutate(payload, {
      onSuccess: () => {
        setFullName("");
        setEmail("");
        setRoleId("");
        setScopeType("platform");
        setRegionId("");
        setExpiresAt("");
        close();
      },
    });
  };

  const mutationError = inviteMutation.error;

  return (
    <SidePanel
      open={open}
      onClose={close}
      wide
      title="Invite staff"
      description="Send an invitation with an RBAC role and access scope."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={close}
            disabled={inviteMutation.isPending}
            className="h-auto border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={inviteMutation.isPending || !canManage}
            className="h-auto px-4 py-2 text-sm font-semibold"
          >
            {inviteMutation.isPending ? "Sending…" : "Send invitation"}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelClass}>Full name</span>
            <Input
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value);
                setError("");
              }}
              placeholder="Amina Mwangi"
              autoComplete="name"
              maxLength={120}
              disabled={inviteMutation.isPending || !canManage}
              className={inputClass}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className={labelClass}>Email address</span>
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              placeholder="amina@raut.africa"
              disabled={inviteMutation.isPending || !canManage}
              className={inputClass}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className={labelClass}>Role</span>
            <select
              value={roleId}
              onChange={(event) => {
                setRoleId(event.target.value);
                setError("");
              }}
              disabled={
                inviteMutation.isPending || !canManage || rolesQuery.isPending
              }
              className={inputClass}
            >
              <option value="">Choose a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id ?? ""}>
                  {role.name} ({role.permissions.length} permissions)
                </option>
              ))}
            </select>
            {rolesQuery.isError ? (
              <span className={errorClass}>Roles could not be loaded.</span>
            ) : null}
          </label>

          <label className="block">
            <span className={labelClass}>Scope</span>
            <select
              value={scopeType}
              onChange={(event) => {
                setScopeType(event.target.value as StaffScopeType);
                setRegionId("");
                setError("");
              }}
              disabled={inviteMutation.isPending || !canManage}
              className={inputClass}
            >
              {SCOPES.map((scope) => (
                <option key={scope.value} value={scope.value}>
                  {scope.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Access expires</span>
            <Input
              type="date"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              disabled={inviteMutation.isPending || !canManage}
              className={inputClass}
            />
          </label>

          {scopeType === "region" ? (
            <label className="block sm:col-span-2">
              <span className={labelClass}>Region</span>
              <select
                value={regionId}
                onChange={(event) => {
                  setRegionId(event.target.value);
                  setError("");
                }}
                disabled={
                  inviteMutation.isPending ||
                  !canManage ||
                  regionsQuery.isPending
                }
                className={inputClass}
              >
                <option value="">Choose a region</option>
                {(regionsQuery.data ?? []).map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
              {regionsQuery.isError ? (
                <span className={errorClass}>Regions could not be loaded.</span>
              ) : null}
            </label>
          ) : null}
        </div>

        {selectedRole ? (
          <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-slate-800">
                Permissions granted by {selectedRole.name}
              </p>
              <span className="text-xs text-slate-500">
                {selectedRole.permissions.length} permissions
              </span>
            </div>
            {selectedRole.description ? (
              <p className="mt-1 text-xs text-slate-500">
                {selectedRole.description}
              </p>
            ) : null}
            {selectedRole.permissions.length ? (
              <ul className="mt-3 max-h-56 divide-y divide-slate-200 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                {selectedRole.permissions.map((permission) => (
                  <li
                    key={permission.code}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                  >
                    <span className="text-xs font-medium text-slate-700">
                      {permissionNames.get(permission.code) ?? permission.code}
                    </span>
                    <span className="font-mono text-[0.65rem] text-slate-400">
                      {permission.code} · {permission.scope}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                This role has no permissions yet.
              </p>
            )}
          </section>
        ) : null}

        {error || mutationError ? (
          <p className="text-sm font-medium text-rose-600">
            {error ||
              (mutationError instanceof Error
                ? mutationError.message
                : "The invitation could not be sent.")}
          </p>
        ) : null}
      </form>
    </SidePanel>
  );
}
