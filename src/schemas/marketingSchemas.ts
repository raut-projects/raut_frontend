import { z } from "zod";

const PROMO_CODE_PATTERN = /^[A-Z0-9-]+$/;
const PEAK_HOURS_PATTERN =
  /[A-Za-z]{3}(?:\s*-\s*[A-Za-z]{3})?\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?(?:\s*-\s*\d{1,2}(?::\d{2})?\s*(?:am|pm))?/i;

const numeric = (value: string) => Number(value);

const addNumberIssue = (
  value: string,
  path: string,
  ctx: z.RefinementCtx,
  {
    label,
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
    required = true,
    integer = false,
  }: {
    label: string;
    min?: number;
    max?: number;
    required?: boolean;
    integer?: boolean;
  },
) => {
  const trimmed = String(value ?? "").trim();

  if (!trimmed) {
    if (required) {
      ctx.addIssue({ code: "custom", path: [path], message: `${label} is required` });
    }
    return;
  }

  const amount = numeric(trimmed);

  if (!Number.isFinite(amount)) {
    ctx.addIssue({ code: "custom", path: [path], message: `${label} must be a number` });
    return;
  }

  if (integer && !Number.isInteger(amount)) {
    ctx.addIssue({ code: "custom", path: [path], message: `${label} must be a whole number` });
  }

  if (amount < min || amount > max) {
    ctx.addIssue({
      code: "custom",
      path: [path],
      message: `${label} must be between ${min.toLocaleString("en-US")} and ${max.toLocaleString("en-US")}`,
    });
  }
};

export const promotionFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Promo code needs at least 3 characters")
      .max(20, "Promo code must be 20 characters or fewer")
      .regex(PROMO_CODE_PATTERN, "Use only letters, numbers and hyphens"),
    name: z
      .string()
      .trim()
      .min(2, "Name needs at least 2 characters")
      .max(100, "Name must be 100 characters or fewer"),
    description: z
      .string()
      .trim()
      .max(500, "Description must be 500 characters or fewer"),
    discountType: z.enum(["percentage", "fixed", "free_ride"]),
    discountValue: z.string(),
    maxDiscountTzs: z.string(),
    maxRideValueTzs: z.string(),
    newUsers: z.boolean(),
    existingUsers: z.boolean(),
    specificUsers: z.boolean(),
    eligiblePhones: z.array(z.string()),
    eligibleListName: z.string(),
    startsAt: z.string().min(1, "Start date is required"),
    endsAt: z.string().min(1, "End date is required"),
    perUserLimit: z.string(),
    totalUsesLimit: z.string(),
    budgetCapTzs: z.string(),
    peakHoursOnly: z.boolean(),
    peakHoursLabel: z.string(),
    minimumRideEnabled: z.boolean(),
    minimumRideTzs: z.string(),
    duoOnly: z.boolean(),
    notifySms: z.boolean(),
    inAppBanner: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.discountType === "percentage") {
      addNumberIssue(values.discountValue, "discountValue", ctx, {
        label: "Discount percentage",
        min: 1,
        max: 100,
      });
      addNumberIssue(values.maxDiscountTzs, "maxDiscountTzs", ctx, {
        label: "Maximum discount",
        min: 0,
        required: false,
      });
    }

    if (values.discountType === "fixed") {
      addNumberIssue(values.discountValue, "discountValue", ctx, {
        label: "Discount amount",
        min: 1,
      });
    }

    if (values.discountType === "free_ride") {
      addNumberIssue(values.maxRideValueTzs, "maxRideValueTzs", ctx, {
        label: "Free ride value",
        min: 1,
      });
    }

    if (!values.newUsers && !values.existingUsers && !values.specificUsers) {
      ctx.addIssue({
        code: "custom",
        path: ["newUsers"],
        message: "Choose at least one eligible audience",
      });
    }

    if (values.specificUsers && values.eligiblePhones.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["eligiblePhones"],
        message: "Upload a CSV with at least one phone number",
      });
    }

    const start = new Date(values.startsAt);
    const end = new Date(values.endsAt);

    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({ code: "custom", path: ["startsAt"], message: "Start date is invalid" });
    }

    if (Number.isNaN(end.getTime())) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End date is invalid" });
    }

    if (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      end.getTime() - start.getTime() < 60 * 60 * 1000
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "End date must be at least 1 hour after the start",
      });
    }

    addNumberIssue(values.perUserLimit, "perUserLimit", ctx, {
      label: "Per-user limit",
      min: 1,
      integer: true,
    });

    addNumberIssue(values.totalUsesLimit, "totalUsesLimit", ctx, {
      label: "Total uses limit",
      min: 1,
      required: false,
      integer: true,
    });

    if (values.totalUsesLimit.trim()) {
      const perUser = numeric(values.perUserLimit);
      const total = numeric(values.totalUsesLimit);

      if (
        Number.isFinite(perUser) &&
        Number.isFinite(total) &&
        total < perUser
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["totalUsesLimit"],
          message: "Total uses cannot be lower than the per-user limit",
        });
      }
    }

    addNumberIssue(values.budgetCapTzs, "budgetCapTzs", ctx, {
      label: "Budget cap",
      min: 1,
    });

    if (values.peakHoursOnly) {
      if (!values.peakHoursLabel.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["peakHoursLabel"],
          message: "Describe the peak hours",
        });
      } else if (!PEAK_HOURS_PATTERN.test(values.peakHoursLabel.trim())) {
        ctx.addIssue({
          code: "custom",
          path: ["peakHoursLabel"],
          message: "Use a format like “Mon-Fri 7-9am, 5-8pm”",
        });
      }
    }

    if (values.minimumRideEnabled) {
      addNumberIssue(values.minimumRideTzs, "minimumRideTzs", ctx, {
        label: "Minimum ride amount",
        min: 0,
      });
    }
  });

export type PromotionFormSchema = z.infer<typeof promotionFormSchema>;

export const referralConfigSchema = z.object({
  status: z.enum(["active", "inactive"]),
  referrerRewardTzs: z.string(),
  refereeRewardTzs: z.string(),
  maxReferralsPerUser: z.string(),
  rewardExpiryDays: z.string(),
}).superRefine((values, ctx) => {
  addNumberIssue(values.referrerRewardTzs, "referrerRewardTzs", ctx, {
    label: "Referrer reward",
    min: 0,
  });
  addNumberIssue(values.refereeRewardTzs, "refereeRewardTzs", ctx, {
    label: "Referee reward",
    min: 0,
  });
  addNumberIssue(values.maxReferralsPerUser, "maxReferralsPerUser", ctx, {
    label: "Max referrals per user",
    min: 1,
    max: 1000,
    integer: true,
  });
  addNumberIssue(values.rewardExpiryDays, "rewardExpiryDays", ctx, {
    label: "Reward expiry",
    min: 1,
    max: 365,
    integer: true,
  });
});

export type ReferralConfigSchema = z.infer<typeof referralConfigSchema>;
