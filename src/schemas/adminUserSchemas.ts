/**
 * Zod schemas for inviting and editing admin users. Role keys accept backend
 * identifiers; permission levels mirror the identifiers accepted by the backend.
 */
import { z } from "zod";

const ROLE_KEY = z
  .string()
  .trim()
  .min(1, "Choose a role")
  .regex(/^[a-z0-9][a-z0-9_-]*$/i, "Use letters, numbers, dashes and underscores");

/** Per-module permission levels submitted by the edit form. */
const PERMISSION_LEVELS = [
  "full",
  "limited",
  "none",
  "own",
  "finance",
  "marketing",
] as const;

/**
 * Validates the invite form. `phone` expects the 9 digits that follow the
 * +255 country code; `twoFactorRequired` and `sendWelcomeSms` mirror the
 * security and notification toggles shown in the UI.
 */
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
  role: ROLE_KEY,
  twoFactorRequired: z.boolean(),
  sendWelcomeSms: z.boolean(),
});

/**
 * Validates edits to an existing admin user. `permissions` is optional and
 * maps module keys to a permission level; omitting it leaves permissions as-is.
 */
export const editAdminUserSchema = z.object({
  role: ROLE_KEY,
  twoFactorRequired: z.boolean(),
  permissions: z
    .record(z.string(), z.enum(PERMISSION_LEVELS))
    .optional(),
});

/** Form values inferred from `inviteAdminUserSchema`. */
export type InviteAdminUserValues = z.infer<typeof inviteAdminUserSchema>;
/** Form values inferred from `editAdminUserSchema`. */
export type EditAdminUserValues = z.infer<typeof editAdminUserSchema>;
