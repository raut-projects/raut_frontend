"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  Controller,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Sparkles, Upload, X } from "lucide-react";

import { useToast } from "@/components/toastContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useFeatureFlags } from "@/hooks/usePlatformConfig";
import {
  defaultDateTimeLocal,
  DISCOUNT_TYPE_LABELS,
  formatTzs,
  generatePromotionCode,
  parsePhoneListCsv,
  PROMOTION_DEFAULT_FORM,
  toDateTimeLocal,
  toPromotionPayload,
  type DiscountType,
  type PromotionFormValues,
  type PromotionPayload,
} from "@/lib/marketing";
import { promotionFormSchema } from "@/schemas/marketingSchemas";

const fieldClass =
  "h-10 bg-white text-sm text-slate-700 focus-visible:border-brand-400 focus-visible:ring-brand-100";

const DISCOUNT_TYPES: DiscountType[] = ["percentage", "fixed", "free_ride"];

const DISCOUNT_HINTS: Record<DiscountType, string> = {
  percentage: "A share off the fare, with an optional cap.",
  fixed: "A fixed amount taken off each ride.",
  free_ride: "The whole ride is covered up to a limit.",
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
      <header className="border-b border-slate-200 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        )}
      </header>
      <div className="space-y-5 px-5 py-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-semibold text-slate-600"
      >
        {label}
      </Label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

function SwitchRow({
  title,
  description,
  control,
  name,
  disabled,
  hint,
}: {
  title: string;
  description: string;
  control: Control<PromotionFormValues>;
  name:
    | "peakHoursOnly"
    | "duoOnly"
    | "notifySms"
    | "inAppBanner"
    | "minimumRideEnabled";
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div>
        <p className="text-sm font-medium text-slate-800">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        {hint && <p className="mt-1 text-xs font-medium text-amber-600">{hint}</p>}
      </div>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Switch
            checked={Boolean(field.value)}
            onCheckedChange={field.onChange}
            disabled={disabled}
            aria-label={title}
          />
        )}
      />
    </div>
  );
}

function errorText(errors: FieldErrors, key: string) {
  const entry = (errors as Record<string, unknown>)[key];

  if (entry && typeof entry === "object" && "message" in entry) {
    const message = (entry as { message?: unknown }).message;

    return typeof message === "string" ? message : undefined;
  }

  return undefined;
}

export function PromotionForm({
  mode,
  initialValues,
  initialIsActive,
  isSubmitting,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  initialValues?: PromotionFormValues;
  initialIsActive?: boolean;
  isSubmitting: boolean;
  onSubmit: (payload: PromotionPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const toast = useToast();
  const featureQuery = useFeatureFlags();
  const duoAvailable = featureQuery.data ? Boolean(featureQuery.data.duo) : true;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [csvFileName, setCsvFileName] = useState("");

  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues:
      initialValues ??
      ({
        ...PROMOTION_DEFAULT_FORM,
        startsAt: defaultDateTimeLocal(0),
        endsAt: defaultDateTimeLocal(14),
      } as PromotionFormValues),
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;

  const discountType = useWatch({ control, name: "discountType" });
  const specificUsers = useWatch({ control, name: "specificUsers" });
  const eligiblePhones = useWatch({ control, name: "eligiblePhones" });
  const peakHoursOnly = useWatch({ control, name: "peakHoursOnly" });
  const minimumRideEnabled = useWatch({ control, name: "minimumRideEnabled" });
  const startsAt = useWatch({ control, name: "startsAt" });

  const resolveIsActive = (intent: "draft" | "live") => {
    if (intent === "draft") return false;
    if (mode === "edit") return initialIsActive ?? true;

    return true;
  };

  const submitWith = (intent: "draft" | "live") => {
    void handleSubmit(async (values) => {
      await onSubmit(toPromotionPayload(values, resolveIsActive(intent)));
    })();
  };

  const applyDuration = (days: number) => {
    const baseValue = startsAt ? new Date(startsAt) : new Date();
    const base = Number.isNaN(baseValue.getTime()) ? new Date() : baseValue;
    const end = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

    setValue("endsAt", toDateTimeLocal(end.toISOString()), {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleCsv = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const phones = parsePhoneListCsv(String(reader.result ?? ""));

      if (!phones.length) {
        toast.error("That file did not contain any phone numbers.");
        return;
      }

      setValue("eligiblePhones", phones, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setValue("specificUsers", true, { shouldDirty: true });
      setValue("eligibleListName", `${file.name} · ${phones.length} numbers`, {
        shouldDirty: true,
      });
      setCsvFileName(file.name);
      toast.success(`Loaded ${phones.length} phone numbers.`);
    };

    reader.onerror = () => toast.error("Could not read that CSV file.");
    reader.readAsText(file);
    event.target.value = "";
  };

  const clearCsv = () => {
    setValue("eligiblePhones", [], { shouldValidate: true, shouldDirty: true });
    setValue("eligibleListName", "", { shouldDirty: true });
    setCsvFileName("");
  };

  const codeError = errorText(errors, "code");

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submitWith("live");
      }}
      className="space-y-5"
    >
      <Section
        title="Campaign basics"
        description="Give riders a code and a clear name they will recognise."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Promo code"
            htmlFor="promo-code"
            error={codeError}
            hint="Uppercase letters, numbers and hyphens only."
          >
            <div className="flex gap-2">
              <Input
                id="promo-code"
                placeholder="PROMO-RIDE20"
                className={`${fieldClass} font-mono uppercase`}
                maxLength={20}
                aria-invalid={Boolean(codeError)}
                {...register("code")}
                onChange={(event) =>
                  setValue(
                    "code",
                    event.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9-]/g, "")
                      .slice(0, 20),
                    { shouldValidate: true, shouldDirty: true },
                  )
                }
              />
              <Button
                type="button"
                variant="outline"
                className="h-10 shrink-0 border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() =>
                  setValue("code", generatePromotionCode(), {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              >
                <Sparkles className="size-3.5" aria-hidden="true" />
                Generate
              </Button>
            </div>
          </Field>

          <Field
            label="Campaign name"
            htmlFor="promo-name"
            error={errorText(errors, "name")}
          >
            <Input
              id="promo-name"
              placeholder="Weekend rider bonus"
              className={fieldClass}
              maxLength={100}
              aria-invalid={Boolean(errorText(errors, "name"))}
              {...register("name")}
            />
          </Field>
        </div>

        <Field
          label="Description"
          htmlFor="promo-description"
          error={errorText(errors, "description")}
          hint="Shown to your team only. Keep it short and specific."
        >
          <Textarea
            id="promo-description"
            rows={3}
            maxLength={500}
            placeholder="20% off rides for new riders during the first two weeks."
            className="bg-white text-sm"
            aria-invalid={Boolean(errorText(errors, "description"))}
            {...register("description")}
          />
        </Field>
      </Section>

      <Section
        title="Discount"
        description="Choose how the discount is applied to each ride."
      >
        <div
          className="grid gap-2 sm:grid-cols-3"
          role="group"
          aria-label="Discount type"
        >
          {DISCOUNT_TYPES.map((type) => {
            const active = discountType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() =>
                  setValue("discountType", type, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                aria-pressed={active}
                className={`rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                  active
                    ? "border-brand-300 bg-brand-50"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`block text-sm font-semibold ${
                    active ? "text-brand-800" : "text-slate-800"
                  }`}
                >
                  {DISCOUNT_TYPE_LABELS[type]}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {DISCOUNT_HINTS[type]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {discountType === "percentage" && (
            <>
              <Field
                label="Discount (%)"
                htmlFor="discount-value"
                error={errorText(errors, "discountValue")}
              >
                <Input
                  id="discount-value"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={100}
                  step="0.5"
                  placeholder="20"
                  className={fieldClass}
                  aria-invalid={Boolean(errorText(errors, "discountValue"))}
                  {...register("discountValue")}
                />
              </Field>
              <Field
                label="Maximum discount (TZS)"
                htmlFor="max-discount"
                error={errorText(errors, "maxDiscountTzs")}
                hint="Optional cap per ride."
              >
                <Input
                  id="max-discount"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="5000"
                  className={fieldClass}
                  aria-invalid={Boolean(errorText(errors, "maxDiscountTzs"))}
                  {...register("maxDiscountTzs")}
                />
              </Field>
            </>
          )}

          {discountType === "fixed" && (
            <Field
              label="Discount amount (TZS)"
              htmlFor="discount-value"
              error={errorText(errors, "discountValue")}
            >
              <Input
                id="discount-value"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="3000"
                className={fieldClass}
                aria-invalid={Boolean(errorText(errors, "discountValue"))}
                {...register("discountValue")}
              />
            </Field>
          )}

          {discountType === "free_ride" && (
            <Field
              label="Maximum ride value (TZS)"
              htmlFor="max-ride-value"
              error={errorText(errors, "maxRideValueTzs")}
              hint="Rides above this value pay the difference."
            >
              <Input
                id="max-ride-value"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="10000"
                className={fieldClass}
                aria-invalid={Boolean(errorText(errors, "maxRideValueTzs"))}
                {...register("maxRideValueTzs")}
              />
            </Field>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Minimum ride amount (TZS)"
            htmlFor="minimum-ride"
            error={errorText(errors, "minimumRideTzs")}
            hint={
              minimumRideEnabled
                ? "Only rides above this amount qualify."
                : "Optional. Turn it on to require a minimum fare."
            }
          >
            <div className="flex items-center gap-3">
              <Controller
                control={control}
                name="minimumRideEnabled"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label="Enable minimum ride amount"
                  />
                )}
              />
              <Input
                id="minimum-ride"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="2000"
                disabled={!minimumRideEnabled}
                className={fieldClass}
                aria-invalid={Boolean(errorText(errors, "minimumRideTzs"))}
                {...register("minimumRideTzs")}
              />
            </div>
          </Field>
        </div>
      </Section>

      <Section
        title="Eligibility"
        description="Decide who can redeem this promotion."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm has-checked:border-brand-300 has-checked:bg-brand-50">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-brand-600"
              {...register("newUsers")}
            />
            <span>
              <span className="block font-medium text-slate-800">New users</span>
              <span className="block text-xs text-slate-500">
                Riders who have not completed a trip yet.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm has-checked:border-brand-300 has-checked:bg-brand-50">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-brand-600"
              {...register("existingUsers")}
            />
            <span>
              <span className="block font-medium text-slate-800">
                Existing users
              </span>
              <span className="block text-xs text-slate-500">
                Riders who already take trips on Raut.
              </span>
            </span>
          </label>
        </div>

        {errorText(errors, "newUsers") && (
          <p className="text-xs font-medium text-rose-600">
            {errorText(errors, "newUsers")}
          </p>
        )}

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-brand-600"
              {...register("specificUsers")}
            />
            <span>
              <span className="block font-medium text-slate-800">
                A specific list of riders
              </span>
              <span className="block text-xs text-slate-500">
                Upload a CSV with one phone number per line.
              </span>
            </span>
          </label>

          {specificUsers && (
            <div className="mt-3 space-y-2 pl-7">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={handleCsv}
              />

              {eligiblePhones.length ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                    {csvFileName || "Phone list"} · {eligiblePhones.length} numbers
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearCsv}
                    className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                    Remove
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 border-slate-200 bg-white px-2 text-xs text-slate-700"
                  >
                    <Upload className="size-3.5" aria-hidden="true" />
                    Replace
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Upload className="size-3.5" aria-hidden="true" />
                  Upload CSV
                </Button>
              )}

              {errorText(errors, "eligiblePhones") && (
                <p className="text-xs font-medium text-rose-600">
                  {errorText(errors, "eligiblePhones")}
                </p>
              )}
              <p className="text-xs text-slate-500">
                Numbers are normalised to +255 and duplicates are removed.
              </p>
            </div>
          )}
        </div>
      </Section>

      <Section
        title="Schedule"
        description="Set the campaign window. Times use East Africa Time (EAT)."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Starts at"
            htmlFor="starts-at"
            error={errorText(errors, "startsAt")}
          >
            <Input
              id="starts-at"
              type="datetime-local"
              className={fieldClass}
              aria-invalid={Boolean(errorText(errors, "startsAt"))}
              {...register("startsAt")}
            />
          </Field>

          <Field
            label="Ends at"
            htmlFor="ends-at"
            error={errorText(errors, "endsAt")}
          >
            <Input
              id="ends-at"
              type="datetime-local"
              className={fieldClass}
              aria-invalid={Boolean(errorText(errors, "endsAt"))}
              {...register("endsAt")}
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Quick set:</span>
          {[7, 14, 30].map((days) => (
            <Button
              key={days}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyDuration(days)}
              className="h-7 border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {days} days
            </Button>
          ))}
        </div>
      </Section>

      <Section
        title="Usage limits"
        description="Control how often the code can be used and how much budget it can spend."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Per-user limit"
            htmlFor="per-user-limit"
            error={errorText(errors, "perUserLimit")}
          >
            <Input
              id="per-user-limit"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              className={fieldClass}
              aria-invalid={Boolean(errorText(errors, "perUserLimit"))}
              {...register("perUserLimit")}
            />
          </Field>

          <Field
            label="Total uses limit"
            htmlFor="total-uses-limit"
            error={errorText(errors, "totalUsesLimit")}
            hint="Leave blank for unlimited."
          >
            <Input
              id="total-uses-limit"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              placeholder="Unlimited"
              className={fieldClass}
              aria-invalid={Boolean(errorText(errors, "totalUsesLimit"))}
              {...register("totalUsesLimit")}
            />
          </Field>

          <Field
            label="Budget cap (TZS)"
            htmlFor="budget-cap"
            error={errorText(errors, "budgetCapTzs")}
            hint="The campaign stops when this is reached."
          >
            <Input
              id="budget-cap"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="5000000"
              className={fieldClass}
              aria-invalid={Boolean(errorText(errors, "budgetCapTzs"))}
              {...register("budgetCapTzs")}
            />
          </Field>
        </div>

        <p className="text-xs text-slate-500">
          Default budget cap: {formatTzs(5000000)}. Review spend regularly from
          the promotions list.
        </p>
      </Section>

      <Section
        title="Advanced"
        description="Extra targeting and product rules for this campaign."
      >
        <div className="space-y-4 divide-y divide-slate-100 [&>*+*]:pt-4">
          <div>
            <SwitchRow
              title="Peak hours only"
              description="Only allow redemption during the busiest hours."
              control={control}
              name="peakHoursOnly"
            />
            {peakHoursOnly && (
              <Field
                label="Peak hours"
                htmlFor="peak-hours"
                error={errorText(errors, "peakHoursLabel")}
                hint="Example: Mon-Fri 7-9am, 5-8pm"
                className="mt-3 pl-0"
              >
                <Input
                  id="peak-hours"
                  placeholder="Mon-Fri 7-9am, 5-8pm"
                  className={fieldClass}
                  aria-invalid={Boolean(errorText(errors, "peakHoursLabel"))}
                  {...register("peakHoursLabel")}
                />
              </Field>
            )}
          </div>

          <SwitchRow
            title="DUO rides only"
            description="Only apply the discount when the rider shares a DUO trip."
            control={control}
            name="duoOnly"
            disabled={!duoAvailable}
            hint={
              duoAvailable
                ? undefined
                : "DUO rides are switched off in platform configuration."
            }
          />
        </div>
      </Section>

      <Section
        title="Notifications"
        description="Choose how riders hear about this promotion."
      >
        <div className="space-y-4 divide-y divide-slate-100 [&>*+*]:pt-4">
          <SwitchRow
            title="SMS notification"
            description="Send an SMS to eligible riders when the campaign starts."
            control={control}
            name="notifySms"
          />
          <SwitchRow
            title="In-app banner"
            description="Show the promotion on the rider home screen."
            control={control}
            name="inAppBanner"
          />
        </div>
      </Section>

      <div className="flex flex-wrap items-center justify-end gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-card">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-10 border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => submitWith("draft")}
          disabled={isSubmitting}
          className="h-10 border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Save as Draft
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-10 bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : mode === "create" ? (
            "Activate Now"
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </form>
  );
}
