"use client";

import { useId, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";

import SidePanel from "@/components/SidePanel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateRbacRole,
  useDeleteRbacRole,
  usePermissionCatalog,
  useUpdateRbacRole,
} from "@/hooks/useRbacCatalog";
import { usePermissions } from "@/hooks/usePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import type {
  RbacCatalogPermission,
  RbacCatalogRole,
  RbacRoleCreatePayload,
  RbacRoleUpdatePayload,
} from "@/types/rbac";

type RoleEditorDialogProps = {
  open: boolean;
  role?: RbacCatalogRole | null;
  onClose: () => void;
  onSaved?: () => void;
};

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";
const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";
const scopeClass =
  "rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";

const SCOPES = ["platform", "region", "assigned", "own"] as const;

export function RoleEditorDialog({
  open,
  role,
  onClose,
  onSaved,
}: RoleEditorDialogProps) {
  const formId = `role-editor-${useId()}`;
  const { has } = usePermissions();
  const canManage = has(PERMISSIONS.PLATFORM_ROLES_MANAGE);
  const permissionsQuery = usePermissionCatalog(open && canManage);
  const createMutation = useCreateRbacRole();
  const updateMutation = useUpdateRbacRole();
  const deleteMutation = useDeleteRbacRole();

  const [name, setName] = useState(role?.name ?? "");
  const [key, setKey] = useState(role?.key ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selectedCodes, setSelectedCodes] = useState<string[]>(
    () => role?.permissions.map((permission) => permission.code) ?? [],
  );
  const [scopes, setScopes] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (role?.permissions ?? []).map((permission) => [
        permission.code,
        permission.scope,
      ]),
    ),
  );
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, RbacCatalogPermission[]> = {};

    (permissionsQuery.data ?? []).forEach((permission) => {
      const moduleName = permission.module.trim() || "general";
      groups[moduleName] = [...(groups[moduleName] ?? []), permission];
    });

    return Object.entries(groups).sort(([left], [right]) =>
      left.localeCompare(right),
    );
  }, [permissionsQuery.data]);

  const mutationError =
    createMutation.error ?? updateMutation.error ?? deleteMutation.error;
  const pending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const selectedCount = selectedCodes.length;

  const togglePermission = (code: string, checked: boolean) => {
    setSelectedCodes((previous) =>
      checked
        ? previous.includes(code)
          ? previous
          : [...previous, code]
        : previous.filter((entry) => entry !== code),
    );
    setScopes((previous) =>
      checked
        ? { ...previous, [code]: previous[code] ?? "platform" }
        : previous,
    );
  };

  const handleClose = () => {
    createMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
    onClose();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending || !canManage) return;

    const normalizedKey = key
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_")
      .replace(/_+/g, "_");
    const trimmedName = name.trim();

    if (!trimmedName || (!role && !normalizedKey)) {
      setError("A role key and display name are required.");
      return;
    }

    if (!role && !/^[a-z0-9][a-z0-9_]*$/.test(normalizedKey)) {
      setError("Role keys can only contain letters, numbers and underscores.");
      return;
    }

    const existingGrants = new Map(
      (role?.permissions ?? []).map((permission) => [
        permission.code,
        permission,
      ]),
    );

    const permissions = selectedCodes.map((code) => ({
      code,
      scope: scopes[code] ?? "platform",
      constraints: existingGrants.get(code)?.constraints ?? {},
    }));

    setError("");

    if (role) {
      if (!role.id) {
        setError("This role cannot be updated because it has no id.");
        return;
      }

      const payload: RbacRoleUpdatePayload = {
        name: trimmedName,
        description: description.trim(),
        permissions,
      };

      updateMutation.mutate(
        { roleId: role.id, roleKey: role.key, payload },
        {
          onSuccess: () => {
            onSaved?.();
            handleClose();
          },
        },
      );
      return;
    }

    const payload: RbacRoleCreatePayload = {
      key: normalizedKey,
      name: trimmedName,
      description: description.trim(),
      permissions,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        onSaved?.();
        handleClose();
      },
    });
  };

  const handleDelete = () => {
    if (!role?.id || deleteMutation.isPending) return;

    deleteMutation.mutate(role.id, {
      onSuccess: () => {
        setConfirmDelete(false);
        onSaved?.();
        handleClose();
      },
    });
  };

  return (
    <SidePanel
      open={open}
      onClose={handleClose}
      wide
      title={role ? `Edit ${role.name}` : "Create role"}
      description="Choose the permission codes this role grants across the dashboard."
      footer={
        <>
          {role?.id && !role.isSystem ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(true)}
              disabled={pending}
              className="h-auto border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete
            </Button>
          ) : null}
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
              disabled={pending || !canManage || Boolean(role && !role.id)}
              className="h-auto px-4 py-2 text-sm font-semibold"
            >
            {pending ? "Saving…" : role ? "Save role" : "Create role"}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Display name</span>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Regional Support Lead"
              className={inputClass}
              disabled={!canManage}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Role key</span>
            <Input
              value={key}
              onChange={(event) => setKey(event.target.value)}
              placeholder="regional_support_lead"
              className={`${inputClass} font-mono`}
              disabled={!canManage || Boolean(role)}
            />
          </label>
        </div>

        <label className="block">
          <span className={labelClass}>Description</span>
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What this role is responsible for."
            rows={2}
            className={inputClass}
            disabled={!canManage}
          />
        </label>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
          <span className="font-semibold text-slate-700">
            {selectedCount} permission{selectedCount === 1 ? "" : "s"} selected
          </span>
          <span className="mt-1 block text-slate-500">
            Permissions are matched by code. Changes take effect after the next
            permission refresh.
          </span>
        </div>

        {permissionsQuery.isPending ? (
          <div className="rounded-xl border border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            Loading permission catalog.
          </div>
        ) : null}

        {permissionsQuery.isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <p className="font-medium">Permission catalog could not be loaded.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void permissionsQuery.refetch()}
              className="mt-2"
            >
              Try again
            </Button>
          </div>
        ) : null}

        {groupedPermissions.map(([module, permissions]) => (
          <section key={module} className="rounded-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <h3 className="text-sm font-semibold capitalize text-slate-800">
                {module}
              </h3>
              <span className="text-xs text-slate-400">
                {permissions.length} permission{permissions.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
              {permissions.map((permission) => {
                const checked = selectedCodes.includes(permission.code);

                return (
                  <div
                    key={permission.code}
                    className="flex items-start justify-between gap-3 px-4 py-3"
                  >
                    <label className="flex min-w-0 flex-1 items-start gap-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) =>
                          togglePermission(permission.code, Boolean(next))
                        }
                        disabled={!canManage}
                        className="mt-0.5"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-800">
                          {permission.name}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs text-slate-400">
                          {permission.code}
                        </span>
                        {permission.description ? (
                          <span className="mt-1 block text-xs text-slate-500">
                            {permission.description}
                          </span>
                        ) : null}
                      </span>
                    </label>
                    {checked ? (
                      <select
                        value={scopes[permission.code] ?? "platform"}
                        onChange={(event) =>
                          setScopes((previous) => ({
                            ...previous,
                            [permission.code]: event.target.value,
                          }))
                        }
                        disabled={!canManage}
                        className={scopeClass}
                        aria-label={`Scope for ${permission.code}`}
                      >
                        {SCOPES.map((scope) => (
                          <option key={scope} value={scope}>
                            {scope}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {error || mutationError ? (
          <p className="text-sm font-medium text-rose-600">
            {error ||
              (mutationError instanceof Error
                ? mutationError.message
                : "The role could not be saved.")}
          </p>
        ) : null}

        {confirmDelete ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <p className="text-sm font-semibold text-rose-800">
              Delete {role?.name}?
            </p>
            <p className="mt-1 text-xs text-rose-700">
              Admins assigned to this role may lose access. This cannot be undone.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                className="border-rose-200 bg-white text-rose-700 hover:bg-rose-100"
              >
                Keep role
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-rose-600 hover:bg-rose-700"
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete role"}
              </Button>
            </div>
          </div>
        ) : null}
      </form>
    </SidePanel>
  );
}
