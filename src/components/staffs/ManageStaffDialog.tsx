"use client";

import { useId, useMemo, useState } from "react";

import SidePanel from "@/components/SidePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRbacRegions, useRbacRoles } from "@/hooks/useRbacCatalog";
import { usePermissions } from "@/hooks/usePermissions";
import { useAssignStaffRole, useRevokeStaffRole } from "@/hooks/useStaff";
import { PERMISSIONS } from "@/lib/permissions";
import { isAssignableStaffRole } from "@/lib/rbacRoles";
import { formatDate } from "@/services/mappers";
import type { StaffMember, StaffScopeType } from "@/types/staff";

type ManageStaffDialogProps = {
  open: boolean;
  staff: StaffMember | null;
  isSelf: boolean;
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

export function ManageStaffDialog({
  open,
  staff,
  isSelf,
  onClose,
}: ManageStaffDialogProps) {
  const formId = `manage-staff-${useId()}`;
  const { has } = usePermissions();
  const canManage = has(PERMISSIONS.PLATFORM_ADMINS_MANAGE);
  const rolesQuery = useRbacRoles(canManage);
  const [scopeType, setScopeType] = useState<StaffScopeType>("platform");
  const regionsQuery = useRbacRegions(canManage && scopeType === "region");
  const assignMutation = useAssignStaffRole();
  const revokeMutation = useRevokeStaffRole();
  const [roleId, setRoleId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeError, setRevokeError] = useState("");

  const roles = useMemo(
    () => (rolesQuery.data ?? []).filter(isAssignableStaffRole),
    [rolesQuery.data],
  );
  const selectedRole = roles.find((role) => role.id === roleId);
  const pending = assignMutation.isPending || revokeMutation.isPending;

  const handleClose = () => {
    assignMutation.reset();
    revokeMutation.reset();
    onClose();
  };

  const handleAssign = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!staff || pending || !canManage) return;

    if (!roleId) {
      setError("Choose a role to assign.");
      return;
    }

    if (!roles.some((role) => role.id === roleId)) {
      setError("The Super Admin role cannot be assigned.");
      return;
    }

    if (scopeType === "region" && !regionId) {
      setError("Choose a region for this assignment.");
      return;
    }

    setError("");
    assignMutation.mutate(
      {
        userId: staff.id,
        payload: {
          role_id: roleId,
          scope_type: scopeType,
          scope_id: scopeType === "region" ? regionId : null,
          expires_at: expiresAt
            ? new Date(`${expiresAt}T00:00:00.000Z`).toISOString()
            : null,
          reason: reason.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          handleClose();
        },
      },
    );
  };

  const handleRevoke = () => {
    if (!staff || !revokeTarget || pending) return;

    const trimmed = revokeReason.trim();

    if (!trimmed) {
      setRevokeError("Give a reason for removing this role.");
      return;
    }

    setRevokeError("");
    revokeMutation.mutate(
      {
        userId: staff.id,
        assignmentId: revokeTarget,
        reason: trimmed,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      },
    );
  };

  const mutationError = assignMutation.error ?? revokeMutation.error;

  return (
    <SidePanel
      open={open}
      onClose={handleClose}
      wide
      title={staff ? `Manage ${staff.name}'s access` : "Manage staff access"}
      description={
        staff
          ? staff.email || staff.phone || "Assign roles and scopes."
          : "Assign roles and scopes."
      }
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={pending}
            className="h-auto border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={pending || !canManage || isSelf}
            className="h-auto px-4 py-2 text-sm font-semibold"
          >
            {assignMutation.isPending ? "Assigning…" : "Assign role"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {isSelf ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You cannot change your own role assignments.
          </p>
        ) : null}

        <section className="rounded-xl border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-800">
              Current assignments
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {staff?.assignments.length ? (
              staff.assignments.map((assignment) => (
                <div
                  key={assignment.assignmentId}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {assignment.roleName || assignment.roleKey || "Role"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {assignment.scope}
                      {assignment.scopeId ? ` · ${assignment.scopeId}` : ""}
                      {assignment.expiresAt
                        ? ` · expires ${formatDate(assignment.expiresAt)}`
                        : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRevokeTarget(assignment.assignmentId);
                      setRevokeReason("");
                      setRevokeError("");
                    }}
                    disabled={pending || !canManage || isSelf}
                    className="h-auto border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    Revoke
                  </Button>
                </div>
              ))
            ) : (
              <p className="px-4 py-5 text-sm text-slate-500">
                No roles assigned.
              </p>
            )}
          </div>
        </section>

        {revokeTarget ? (
          <section className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm font-semibold text-rose-800">Remove role?</p>
            <Textarea
              value={revokeReason}
              onChange={(event) => {
                setRevokeReason(event.target.value);
                setRevokeError("");
              }}
              placeholder="Why is this role being removed?"
              rows={3}
              className={`${inputClass} mt-2`}
            />
            {revokeError ? (
              <p className={errorClass}>{revokeError}</p>
            ) : null}
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleRevoke}
                disabled={revokeMutation.isPending}
                className="bg-rose-600 hover:bg-rose-700"
              >
                {revokeMutation.isPending ? "Removing…" : "Confirm revoke"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRevokeTarget(null)}
                disabled={revokeMutation.isPending}
                className="border-rose-200 bg-white text-rose-700 hover:bg-rose-100"
              >
                Cancel
              </Button>
            </div>
          </section>
        ) : null}

        <form id={formId} onSubmit={handleAssign} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={labelClass}>Role</span>
              <select
                value={roleId}
                onChange={(event) => {
                  setRoleId(event.target.value);
                  setError("");
                }}
                disabled={!canManage || isSelf || rolesQuery.isPending}
                className={inputClass}
              >
                <option value="">Choose a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id ?? ""}>
                    {role.name} ({role.permissions.length} permissions)
                  </option>
                ))}
              </select>
              {selectedRole?.description ? (
                <p className="mt-1 text-xs text-slate-500">
                  {selectedRole.description}
                </p>
              ) : null}
              {rolesQuery.isError ? (
                <p className={errorClass}>Roles could not be loaded.</p>
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
                disabled={!canManage || isSelf}
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
              <span className={labelClass}>Expires</span>
              <Input
                type="date"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                disabled={!canManage || isSelf}
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
                  disabled={!canManage || isSelf || regionsQuery.isPending}
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
                  <p className={errorClass}>Regions could not be loaded.</p>
                ) : null}
              </label>
            ) : null}

            <label className="block sm:col-span-2">
              <span className={labelClass}>Reason</span>
              <Textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Why is this role being assigned?"
                rows={2}
                disabled={!canManage || isSelf}
                className={inputClass}
              />
            </label>
          </div>

          {error || mutationError ? (
            <p className={errorClass}>
              {error ||
                (mutationError instanceof Error
                  ? mutationError.message
                  : "The role assignment could not be saved.")}
            </p>
          ) : null}
        </form>
      </div>
    </SidePanel>
  );
}
