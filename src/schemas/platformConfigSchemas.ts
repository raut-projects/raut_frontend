import { z } from "zod";

import { PEAK_HOUR_DAYS } from "@/types/platformConfig";
import type { FieldErrors } from "@/types/platformConfig";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const numberField = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .transform((value) => Number(value))
    .superRefine((value, ctx) => {
      if (!Number.isFinite(value)) {
        ctx.addIssue({
          code: "custom",
          message: `${label} must be a number`,
        });
        return;
      }

      if (value < min || value > max) {
        ctx.addIssue({
          code: "custom",
          message: `${label} must be between ${min} and ${max}`,
        });
      }
    });

const peakHourDraftSchema = z
  .object({
    day: z.enum(PEAK_HOUR_DAYS),
    start: z.string().regex(TIME_PATTERN, "Use HH:mm format"),
    end: z.string().regex(TIME_PATTERN, "Use HH:mm format"),
    enabled: z.boolean(),
  })
  .superRefine((slot, ctx) => {
    if (slot.enabled && slot.start >= slot.end) {
      ctx.addIssue({
        code: "custom",
        path: ["end"],
        message: "End time must be after start time",
      });
    }
  });

export const pricingSchema = z.object({
  base_fare_tzs: numberField(500, 10000, "Base fare"),
  price_per_km_tzs: numberField(100, 5000, "Price per km"),
  price_per_minute_tzs: numberField(10, 1000, "Price per minute"),
  platform_fee_percent: numberField(0, 50, "Platform fee"),
  peak_hour_surge_percent: numberField(0, 100, "Peak hour surge"),
  duo_discount_percent: numberField(0, 50, "DUO discount"),
  duo_distribution_percent: numberField(30, 70, "DUO distribution"),
  peak_hours: z
    .array(peakHourDraftSchema)
    .transform((slots) =>
      slots
        .filter((slot) => slot.enabled)
        .map(({ day, start, end }) => ({ day, start, end })),
    ),
});

export const featureFlagsSchema = z.object({
  scheduled_rides: z.boolean(),
  duo: z.boolean(),
  ratings: z.boolean(),
  in_app_chat: z.boolean(),
  corporate_accounts: z.boolean(),
});

export const operationsSchema = z.object({
  min_payout_amount_tzs: numberField(1000, 50000, "Minimum payout"),
  auto_payout_schedule: z.enum(["weekly", "biweekly", "monthly"]),
  document_expiry_reminder_days: numberField(
    7,
    90,
    "Document expiry reminder",
  ),
  max_concurrent_requests: numberField(1, 5, "Maximum concurrent requests"),
  request_timeout_seconds: numberField(10, 120, "Request timeout"),
  session_token_expiry_minutes: numberField(
    60,
    10080,
    "Session token expiry",
  ),
});

export const toFieldErrors = (error: z.ZodError): FieldErrors => {
  const errors: FieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : "form";

    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }

  return errors;
};
