"use client";

import { useId, useState } from "react";

import SidePanel from "@/components/SidePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import TanzaniaPhoneInput from "@/components/TanzaniaPhoneInput";
import { useInviteAdminUser } from "@/hooks/useAdminUsers";
import {
  ADMIN_USER_DEFAULT_FORM,
  type AdminRoleKey,
  type AdminUserFormValues,
} from "@/lib/adminUsers";
import { inviteAdminUserSchema } from "@/schemas/adminUserSchemas";

import { AdminRoleSelect } from "./AdminRoleSelect";

type InviteAdminDialogProps = {
  open: boolean;
  onClose: () => void;
  onViewMatrix: () => void;
  onInvited?: () => void;
};

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";
const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";
const errorClass = "mt-1 block text-xs font-medium text-rose-600";

export function InviteAdminDialog({
  open,
  onClose,
  onViewMatrix,
  onInvited,
}: InviteAdminDialogProps) {
  const formId = `invite-admin-${useId()}`;
  const inviteMutation = useInviteAdminUser();
  const [values, setValues] = useState<AdminUserFormValues>(
    ADMIN_USER_DEFAULT_FORM,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    setValues(ADMIN_USER_DEFAULT_FORM);
    setErrors({});
    inviteMutation.reset();
    onClose();
  };

  const update = <Field extends keyof AdminUserFormValues>(
    field: Field,
    value: AdminUserFormValues[Field],
  ) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (inviteMutation.isPending) return;

    const result = inviteAdminUserSchema.safeParse(values);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors(
        Object.fromEntries(
          Object.entries(fieldErrors)
            .filter(([, messages]) => messages && messages.length > 0)
            .map(([field, messages]) => [field, messages?.[0] ?? ""]),
        ),
      );
      return;
    }

    inviteMutation.mutate(
      {
        name: result.data.name,
        phone: result.data.phone,
        email: result.data.email,
        role: result.data.role,
        two_factor_required: result.data.twoFactorRequired,
        send_welcome_sms: result.data.sendWelcomeSms,
      },
      {
        onSuccess: () => {
          handleClose();
          onInvited?.();
        },
      },
    );
  };

  return (
    <SidePanel
      open={open}
      onClose={handleClose}
      wide
      title="Invite admin user"
      description="Send dashboard access to a new team member."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={inviteMutation.isPending}
            className="h-auto border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={inviteMutation.isPending}
            className="h-auto px-4 py-2 text-sm font-semibold"
          >
            {inviteMutation.isPending ? "Sending." : "Send invitation"}
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
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={labelClass}>Full name</span>
            <Input
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Neema Mushi"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              className="h-10 bg-white"
            />
            {errors.name && <span className={errorClass}>{errors.name}</span>}
          </label>

          <label className="block">
            <span className={labelClass}>Phone number</span>
            <TanzaniaPhoneInput
              value={values.phone}
              onChange={(value) => update("phone", value)}
              className={inputClass}
            />
            {errors.phone && <span className={errorClass}>{errors.phone}</span>}
          </label>

          <label className="block">
            <span className={labelClass}>Email address</span>
            <Input
              type="email"
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="name@raut.co.tz"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              className="h-10 bg-white"
            />
            {errors.email && <span className={errorClass}>{errors.email}</span>}
          </label>
        </div>

        <div className="space-y-2 border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between gap-3">
            <span className={labelClass}>Role</span>
            <button
              type="button"
              onClick={onViewMatrix}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              View permission matrix
            </button>
          </div>
          <AdminRoleSelect
            value={values.role}
            onChange={(role: AdminRoleKey) => update("role", role)}
          />
          {errors.role && <span className={errorClass}>{errors.role}</span>}
        </div>

        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5">
          <label className="flex items-start justify-between gap-4">
            <span>
              <span className="block text-sm font-medium text-slate-700">
                Require two-factor authentication
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Ask for a one-time code when this admin signs in.
              </span>
            </span>
            <Switch
              checked={values.twoFactorRequired}
              onCheckedChange={(checked) =>
                update("twoFactorRequired", checked)
              }
              aria-label="Require two-factor authentication"
            />
          </label>

          <label className="flex items-start justify-between gap-4 border-t border-slate-200 pt-3">
            <span>
              <span className="block text-sm font-medium text-slate-700">
                Send welcome SMS
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Notify the admin that their account is ready.
              </span>
            </span>
            <Switch
              checked={values.sendWelcomeSms}
              onCheckedChange={(checked) => update("sendWelcomeSms", checked)}
              aria-label="Send welcome SMS"
            />
          </label>
        </div>

        <p className="text-xs text-slate-500">
          Invitees appear under the Invited tab until they sign in for the first
          time.
        </p>
      </form>
    </SidePanel>
  );
}
