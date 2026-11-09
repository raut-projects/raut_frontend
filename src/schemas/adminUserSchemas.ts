import { z } from "zod";

const ADMIN_ROLE_VALUES = [
  "super_admin",
  "platform_manager",
  "operations_agent",
  "support_agent",
  "finance_manager",
  "finance_agent",
  "marketing_manager",
  "marketing_agent",
  "analyst",
] as const;

const PERMISSION_LEVELS = [
  "full",
  "limited",
  "none",
  "own",
  "finance",
  "marketing",
] as const;

export const inviteAdminUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name needs at least 2 characters")
    .max(100, "Name must be 100 characters or fewer"),
  phone: z
    .string()
    .trim()
    .regex(/^\d{9}$/, "Enter the 9 digit number after +255"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  role: z.enum(ADMIN_ROLE_VALUES),
  twoFactorRequired: z.boolean(),
  sendWelcomeSms: z.boolean(),
});

export const editAdminUserSchema = z.object({
  role: z.enum(ADMIN_ROLE_VALUES),
  twoFactorRequired: z.boolean(),
  permissions: z
    .record(z.string(), z.enum(PERMISSION_LEVELS))
    .optional(),
});

export type InviteAdminUserValues = z.infer<typeof inviteAdminUserSchema>;
export type EditAdminUserValues = z.infer<typeof editAdminUserSchema>;
