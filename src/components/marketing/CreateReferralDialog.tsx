"use client";

import { useId, useState } from "react";
import { RefreshCw } from "lucide-react";

import { ReferralDialog } from "@/components/marketing/ReferralDialog";
import { UserSearchSelect } from "@/components/marketing/UserSearchSelect";
import { useToast } from "@/components/toastContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateReferralCode } from "@/hooks/useMarketing";
import {
  createReferralCodeDefaultForm,
  generateReferralCode,
  REFERRAL_REWARD_TYPE_LABELS,
  toReferralCodePayload,
  type ReferralAssignableUser,
  type ReferralCode,
  type ReferralCodeFormValues,
} from "@/lib/referralCodes";
import { referralCodeSchema } from "@/schemas/marketingSchemas";

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";
const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";
const errorClass = "mt-1 block text-xs font-medium text-rose-600";

export function CreateReferralDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (
    created: ReferralCode,
    assignedUser: ReferralAssignableUser | null,
  ) => void;
}) {
  const toast = useToast();
  const formId = `create-referral-${useId()}`;
  const create = useCreateReferralCode();
  const [values, setValues] = useState<ReferralCodeFormValues>(() =>
    createReferralCodeDefaultForm(),
  );
  const [selectedUser, setSelectedUser] =
    useState<ReferralAssignableUser | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <Field extends keyof ReferralCodeFormValues>(
    field: Field,
    value: ReferralCodeFormValues[Field],
  ) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  };

  const handleClose = () => {
    if (!create.isPending) onClose();
  };

  const handleUserTypeChange = (
    userType: ReferralCodeFormValues["userType"],
  ) => {
    setValues((previous) => ({
      ...previous,
      userType,
      assignedUserId: "",
    }));
    setSelectedUser(null);
    setErrors((previous) => {
      const next = { ...previous };
      delete next.assignedUserId;
      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (create.isPending) return;

    const result = referralCodeSchema.safeParse(values);

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

    create.mutate(toReferralCodePayload(result.data), {
      onSuccess: (created) => {
        onCreated(created, selectedUser);
        onClose();
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not create the referral code.",
        );
      },
    });
  };

  return (
    <ReferralDialog
      open
      onClose={handleClose}
      title="Create Referral"
      description="Create a referral code and assign it to a rider or driver."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={create.isPending}
            className="h-10 border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={create.isPending}
            className="h-10 bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {create.isPending ? "Creating…" : "Create Referral"}
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
            <span className={labelClass}>Referral Name</span>
            <Input
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="e.g. Neema rider invite"
              autoComplete="off"
              aria-invalid={Boolean(errors.name)}
              className={inputClass}
            />
            {errors.name && <span className={errorClass}>{errors.name}</span>}
          </label>

          <label className="block">
            <span className={labelClass}>User Type</span>
            <select
              value={values.userType}
              onChange={(event) =>
                handleUserTypeChange(
                  event.target.value as ReferralCodeFormValues["userType"],
                )
              }
              className={inputClass}
            >
              <option value="rider">Rider</option>
              <option value="driver">Driver</option>
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Status</span>
            <select
              value={values.status}
              onChange={(event) =>
                update(
                  "status",
                  event.target.value as ReferralCodeFormValues["status"],
                )
              }
              className={inputClass}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <span className="mt-1 block text-[11px] text-slate-400">
              Pending is set automatically when referrals are in progress.
            </span>
          </label>

          <div className="block sm:col-span-2">
            <span className={labelClass}>Assign to User</span>
            <UserSearchSelect
              selectedUser={selectedUser}
              onSelect={(user) => {
                setSelectedUser(user);
                update("assignedUserId", user?.id ?? "");
              }}
              userType={values.userType}
              error={errors.assignedUserId}
            />
          </div>

          <div className="block sm:col-span-2">
            <label className={labelClass} htmlFor={`${formId}-code`}>
              Referral Code
            </label>
            <div className="flex gap-2">
              <Input
                id={`${formId}-code`}
                value={values.code}
                onChange={(event) =>
                  update("code", event.target.value.toUpperCase())
                }
                placeholder="e.g. NEEMA2026"
                autoComplete="off"
                aria-invalid={Boolean(errors.code)}
                className={`${inputClass} font-mono uppercase`}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => update("code", generateReferralCode(values.name))}
                className="h-10 shrink-0 border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Generate
              </Button>
            </div>
            {errors.code && <span className={errorClass}>{errors.code}</span>}
          </div>

          <label className="block">
            <span className={labelClass}>Referrer Reward (TZS)</span>
            <Input
              type="number"
              min={0}
              step={100}
              value={values.referrerRewardTzs}
              onChange={(event) =>
                update("referrerRewardTzs", event.target.value)
              }
              aria-invalid={Boolean(errors.referrerRewardTzs)}
              className={inputClass}
            />
            {errors.referrerRewardTzs && (
              <span className={errorClass}>{errors.referrerRewardTzs}</span>
            )}
          </label>

          <label className="block">
            <span className={labelClass}>New User Reward (TZS)</span>
            <Input
              type="number"
              min={0}
              step={100}
              value={values.newUserRewardTzs}
              onChange={(event) =>
                update("newUserRewardTzs", event.target.value)
              }
              aria-invalid={Boolean(errors.newUserRewardTzs)}
              className={inputClass}
            />
            {errors.newUserRewardTzs && (
              <span className={errorClass}>{errors.newUserRewardTzs}</span>
            )}
          </label>

          <label className="block">
            <span className={labelClass}>Reward Type</span>
            <select
              value={values.rewardType}
              onChange={(event) =>
                update(
                  "rewardType",
                  event.target.value as ReferralCodeFormValues["rewardType"],
                )
              }
              className={inputClass}
            >
              {Object.entries(REFERRAL_REWARD_TYPE_LABELS).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="block">
            <span className={labelClass}>Maximum Uses</span>
            <Input
              type="number"
              min={1}
              max={1000}
              step={1}
              value={values.maxUses}
              onChange={(event) => update("maxUses", event.target.value)}
              aria-invalid={Boolean(errors.maxUses)}
              className={inputClass}
            />
            {errors.maxUses && (
              <span className={errorClass}>{errors.maxUses}</span>
            )}
          </label>

          <label className="block sm:col-span-2">
            <span className={labelClass}>Expiry Date</span>
            <Input
              type="date"
              value={values.expiryDate}
              onChange={(event) => update("expiryDate", event.target.value)}
              aria-invalid={Boolean(errors.expiryDate)}
              className={inputClass}
            />
            {errors.expiryDate && (
              <span className={errorClass}>{errors.expiryDate}</span>
            )}
          </label>
        </div>
      </form>
    </ReferralDialog>
  );
}
