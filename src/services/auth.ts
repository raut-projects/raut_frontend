// Authentication service for the admin console.
// Wraps the login, session lookup, admin promotion and password reset
// endpoints; stores the session and tokens through `./tokenStore` and clears
// client-side stores on sign-out. All requests go through `./http`, so failures
// surface as ApiError.

import { API_ROUTES } from "../lib/config";
import { hasDashboardAccess } from "../lib/permissions";
import {
  firstRole,
  formatRole,
  resolveRole,
  roleLabelFromPayload,
} from "../lib/roles";
import type { AuthSession } from "../types/models";
import type { RbacAccessSnapshot } from "../types/rbac";
import {
  ApiError,
  envelopeData,
  envelopeMessage,
  request,
  refreshAccessToken,
} from "./http";
import {
  clearSession,
  getAccessToken,
  getSessionSnapshot,
  publishSession,
  saveAuthTokens,
  saveSession,
  updateSession,
  updateTokens,
} from "./tokenStore";
import { resetClientState } from "../store/resetClientState";
import { usePermissionStore } from "../store/permissionStore";
import { fetchMyPermissions } from "./rbac";

/**
 * Strips spaces, parentheses, hyphens and dots from a phone number so the same
 * number compares equal across input formats.
 * Returns an empty string for null/undefined input.
 */
export const normalizePhone = (value) =>
  String(value ?? "").replace(/[\s()\-.]/g, "");

const firstText = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return null;
};

const buildInitials = (name) => {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "U";

  if (parts.length === 1) {
    const only = parts[0];

    if (/^\+?\d+$/.test(only)) {
      return only.replace(/\D/g, "").slice(-2).padStart(2, "0");
    }

    return only.slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const decodeJwtPayload = (token) => {
  try {
    const [, payload] = String(token ?? "").split(".");
    if (!payload) return null;

    // JWTs use base64url, so translate the URL-safe characters and restore the
    // padding before atob() will accept the value.
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
};

// The role can arrive on the user object, beside the tokens, as a list, or only
// inside the access token. Any of them is enough, and a missing role means "not
// an admin" rather than "admin".
const roleFromPayload = ({ user, data, accessToken }) =>
  resolveRole(
    user?.role,
    user?.roles,
    data?.role,
    data?.roles,
    decodeJwtPayload(accessToken)?.role,
  );

// Same lookup without the token fallback. The token can still carry the role a
// user had before a promotion, so it must never win over a fresh server answer.
const roleFromResponse = ({ user, data }) =>
  resolveRole(user?.role, user?.roles, data?.role, data?.roles);

const toSession = (
  user,
  phone,
  fallbackRole,
  roleLabelSources: unknown[] = [],
): AuthSession => {
  const fallbackPhone = normalizePhone(phone);
  const role = firstRole(user?.role, user?.roles, fallbackRole) ?? "user";
  const roleLabel =
    roleLabelFromPayload(user, ...roleLabelSources) || formatRole(role);

  const resolvedName =
    firstText(user?.full_name, user?.fullName, user?.name, user?.email) ??
    firstText(user?.phone, fallbackPhone) ??
    "User";

  // Accounts without a name fall back to their phone number, which reads badly
  // in the header and on the dashboard.
  const name = /^\+?\d[\d\s()-]{6,}$/.test(resolvedName)
    ? roleLabel
    : resolvedName;

  return {
    id: user?.id ?? null,
    name,
    phone: user?.phone ?? fallbackPhone,
    role,
    roleLabel,
    initials: buildInitials(name),
    signedInAt: new Date().toISOString(),
  };
};

export type LoginResult = {
  session: AuthSession;
  access: RbacAccessSnapshot;
};

/**
 * Signs in with email and password.
 * POST /auth/login (API_ROUTES.login) with `{ email, password }` and no bearer
 * token. The response token is stored through `saveSession`; `remember`
 * chooses persistent (localStorage) or per-tab (sessionStorage) storage.
 * Returns the session and the current RBAC snapshot. Throws ApiError when the
 * server rejects the credentials, returns no access token, or the permission
 * endpoint cannot be reached.
 */
export async function loginWithEmail({
  email,
  password,
  remember = true,
}): Promise<LoginResult> {
  const payload = await request(API_ROUTES.login, {
    method: "POST",
    body: {
      email: String(email ?? "").trim(),
      password: String(password ?? ""),
    },
    auth: false,
  });

  const data = envelopeData(payload) ?? {};
  // Accept the snake_case, camelCase and short token field names the backend
  // has used across versions.
  const accessToken = data.access_token ?? data.accessToken ?? data.token;

  if (!accessToken) {
    throw new ApiError(
      "The server did not return a session. Please try again.",
      500,
      payload,
    );
  }

  const user = data.user ?? data;
  const role = roleFromPayload({ user, data, accessToken });

  const session = toSession(user, user?.phone ?? "", role, [data, payload]);

  const nextSession = { ...session, roleVerifiedAt: Date.now() };

  saveAuthTokens({
    accessToken,
    refreshToken: data.refresh_token ?? data.refreshToken ?? null,
    expiresIn: data.expires_in ?? data.expiresIn ?? null,
    remember,
  });

  let access: RbacAccessSnapshot;

  try {
    access = await fetchMyPermissions();
  } catch (error) {
    signOut();
    throw error;
  }

  const permissions = usePermissionStore.getState();
  permissions.clear();
  permissions.setAccess(access);
  publishSession(nextSession);

  return { session: nextSession, access };
}

/**
 * Returns the cached session snapshot, or null when signed out.
 * Reads memory, not storage, so it is safe to call during render.
 */
export function getSession(): AuthSession | null {
  return getSessionSnapshot();
}

/**
 * Signs the user out.
 * Removes the session and tokens from both storages and resets in-memory client
 * stores. Synchronous and never throws.
 */
export function signOut() {
  clearSession();
  resetClientState();
}

/**
 * Returns the stored access token, or null when there is none.
 * Does not refresh an expired token; `./http` handles that per request.
 */
export function getToken() {
  return getAccessToken();
}

// Asks the backend who the signed in user actually is. This is the source of
// truth for the role, the local session only caches it.
/**
 * Fetches the currently authenticated user.
 * GET /auth/me (API_ROUTES.me) with the bearer token.
 * Returns `{ user, role, roleLabel }`, resolved from the response only.
 * Throws ApiError on an expired/invalid session or transport failure.
 */
export async function fetchCurrentUser() {
  const payload = await request(API_ROUTES.me, { auth: true });
  const data = envelopeData(payload) ?? {};
  const user = data.user ?? data;
  const role = roleFromResponse({ user, data });
  const roleLabel = roleLabelFromPayload(user, data, payload) || formatRole(role);

  return {
    user,
    role,
    roleLabel,
  };
}

const signInAgainError = (message) => {
  const error = new ApiError(message, 409, null);
  return Object.assign(error, { requiresSignIn: true });
};

/**
 * Promotes the signed-in account to admin using the shared admin secret.
 * POST /auth/promote (API_ROUTES.promote) as form-urlencoded with `{ secret }`.
 * Side effects: stores any returned refresh/access tokens, refreshes the token
 * pair when the response carries no access token, verifies the backend RBAC
 * snapshot, persists the returned role via `updateSession`, and refreshes the
 * cached permissions.
 * Returns `{ role, roleLabel, message }`.
 * Throws ApiError (403) when the secret is refused or no RBAC access was
 * granted; a 409 error flagged `requiresSignIn` when the refreshed session
 * cannot be verified.
 */
export async function requestAdminAccess(secret) {
  const payload = await request(API_ROUTES.promote, {
    method: "POST",
    body: { secret: String(secret ?? "").trim() },
    auth: true,
    form: true,
  });

  const data = envelopeData(payload) ?? {};
  const promotedAccessToken =
    data.access_token ?? data.accessToken ?? data.token ?? null;
  const promotedRefreshToken = data.refresh_token ?? data.refreshToken ?? null;
  const promotedExpiresIn = data.expires_in ?? data.expiresIn ?? null;

  if (promotedRefreshToken) {
    updateTokens({ refreshToken: promotedRefreshToken });
  }

  if (promotedAccessToken) {
    updateTokens({
      accessToken: promotedAccessToken,
      expiresIn: promotedExpiresIn,
    });
  }

  if (!promotedAccessToken) {
    const refreshed = await refreshAccessToken();

    if (!refreshed || !getAccessToken()) {
      throw signInAgainError(
        "Your access was granted but your session could not be refreshed. Please sign in again.",
      );
    }
  }

  let access: RbacAccessSnapshot;

  try {
    access = await fetchMyPermissions();
  } catch {
    throw signInAgainError(
      "Your access was updated but your dashboard permissions could not be verified. Please sign in again.",
    );
  }

  if (!hasDashboardAccess(access)) {
    throw new ApiError(
      "That secret was not accepted. Your access level has not changed.",
      403,
      payload,
    );
  }

  const promotedUser = data.user ?? data;
  let role = roleFromResponse({ user: promotedUser, data });
  let roleLabel = roleLabelFromPayload(promotedUser, data, payload);

  if (!role || !roleLabel) {
    const current = await fetchCurrentUser();

    role = role ?? current.role;
    roleLabel = roleLabel || current.roleLabel;
  }

  role = role ?? access.roles[0]?.key ?? "user";
  roleLabel = roleLabel || formatRole(role);

  const permissions = usePermissionStore.getState();
  permissions.clear();
  permissions.setAccess(access);

  updateSession({
    role,
    roleLabel,
    roleVerifiedAt: Date.now(),
  });

  return {
    role,
    roleLabel,
    message: envelopeMessage(payload) || "Admin access granted.",
  };
}

/**
 * Requests a password reset email.
 * POST /auth/password/reset (API_ROUTES.resetPassword) with `{ email }` and no
 * bearer token. Returns the server's envelope message (empty string when the
 * response has none). Throws ApiError on failure.
 */
export async function resetPassword(email) {
  const payload = await request(API_ROUTES.resetPassword, {
    method: "POST",
    body: { email: String(email ?? "").trim() },
    auth: false,
  });

  return envelopeMessage(payload);
}

/**
 * Completes a password reset by submitting a new password with the reset token.
 * POST /auth/password/update (API_ROUTES.passwordUpdate) with no bearer token.
 * Accepts flexible token/code/email params to match backend reset-link payloads.
 * Throws ApiError on failure.
 */
export async function updatePassword({
  token,
  code,
  email,
  password,
}: {
  token?: string | null;
  code?: string | null;
  email?: string | null;
  password: string;
}) {
  const body: Record<string, string> = {
    password: String(password ?? ""),
    new_password: String(password ?? ""),
    password_confirmation: String(password ?? ""),
  };

  const tokenValue = String(token ?? "").trim();
  const codeValue = String(code ?? "").trim();
  const emailValue = String(email ?? "").trim();

  if (tokenValue) {
    body.token = tokenValue;
    body.reset_token = tokenValue;
  }
  if (codeValue) {
    body.code = codeValue;
    body.otp = codeValue;
  }
  if (emailValue) body.email = emailValue;

  const payload = await request(API_ROUTES.passwordUpdate, {
    method: "POST",
    body,
    auth: false,
  });

  return envelopeMessage(payload);
}

/**
 * Completes a password reset by submitting a new password with the reset token.
 */
export async function confirmResetPassword({
  token,
  password,
}: {
  token: string;
  password: string;
}) {
  const body: Record<string, string> = {
    password: String(password ?? ""),
  };

  const tokenValue = String(token ?? "").trim();

  if (tokenValue) {
    body.token = tokenValue;
    body.reset_token = tokenValue;
  }

  const payload = await request(API_ROUTES.confirmResetPassword, {
    method: "POST",
    body,
    auth: false,
  });

  return envelopeMessage(payload);
}
