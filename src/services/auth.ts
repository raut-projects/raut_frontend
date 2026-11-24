// Authentication service for the admin console.
// Wraps the login, session lookup, admin promotion and password reset
// endpoints; stores the session and tokens through `./tokenStore` and clears
// client-side stores on sign-out. All requests go through `./http`, so failures
// surface as ApiError.

import { API_ROUTES } from "../lib/config";
import { firstRole, formatRole, isAdminRole, resolveRole } from "../lib/roles";
import type { AuthSession } from "../types/models";
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
  saveSession,
  updateSession,
  updateTokens,
} from "./tokenStore";
import { resetClientState } from "../store/resetClientState";

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

const toSession = (user, phone, fallbackRole): AuthSession => {
  const fallbackPhone = normalizePhone(phone);
  const role = firstRole(user?.role, user?.roles, fallbackRole) ?? "user";

  const resolvedName =
    firstText(user?.full_name, user?.fullName, user?.name, user?.email) ??
    firstText(user?.phone, fallbackPhone) ??
    "User";

  // Accounts without a name fall back to their phone number, which reads badly
  // in the header and on the dashboard.
  const name = /^\+?\d[\d\s()-]{6,}$/.test(resolvedName)
    ? isAdminRole(role)
      ? "Admin"
      : "User"
    : resolvedName;

  return {
    id: user?.id ?? null,
    name,
    phone: user?.phone ?? fallbackPhone,
    role,
    roleLabel: formatRole(role),
    initials: buildInitials(name),
    signedInAt: new Date().toISOString(),
  };
};

/**
 * Signs in with email and password.
 * POST /auth/login (API_ROUTES.login) with `{ email, password }` and no bearer
 * token. The response token is stored through `saveSession`; `remember`
 * chooses persistent (localStorage) or per-tab (sessionStorage) storage.
 * Returns the new AuthSession. Throws ApiError when the server rejects the
 * credentials or returns no access token.
 */
export async function loginWithEmail({
  email,
  password,
  remember = true,
}): Promise<AuthSession> {
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

  const session = toSession(user, user?.phone ?? "", role);

  saveSession({
    session: { ...session, roleVerifiedAt: Date.now() },
    accessToken,
    refreshToken: data.refresh_token ?? data.refreshToken ?? null,
    expiresIn: data.expires_in ?? data.expiresIn ?? null,
    remember,
  });

  return session;
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
 * Returns `{ user, role }`, where the role is resolved from the response only.
 * Throws ApiError on an expired/invalid session or transport failure.
 */
export async function fetchCurrentUser() {
  const payload = await request(API_ROUTES.me, { auth: true });
  const data = envelopeData(payload) ?? {};
  const user = data.user ?? data;

  return {
    user,
    role: roleFromResponse({ user, data }),
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
 * pair when the response carries no access token, and persists the new role via
 * `updateSession`.
 * Returns `{ role, roleLabel, message }`.
 * Throws ApiError (403) when the secret is refused; a 409 error flagged
 * `requiresSignIn` when access was granted but a fresh token is required.
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

  const promotedUser = data.user ?? data;
  let role = roleFromResponse({ user: promotedUser, data });

  if (!role) {
    const current = await fetchCurrentUser();
    role = current.role;
  }

  if (!isAdminRole(role)) {
    throw new ApiError(
      "That secret was not accepted. Your access level has not changed.",
      403,
      payload,
    );
  }

  // The access token has to carry the new role, otherwise the backend keeps
  // treating the user as a plain user on every later request.
  let accessToken = promotedAccessToken ?? getAccessToken();

  if (!promotedAccessToken) {
    const refreshed = await refreshAccessToken();
    accessToken = getAccessToken();

    if (!refreshed || !accessToken) {
      throw signInAgainError(
        "Your access was granted but your session could not be refreshed. Please sign in again.",
      );
    }
  }

  const claims = decodeJwtPayload(accessToken);
  const claimRole = claims?.role ?? null;

  if (claimRole && !isAdminRole(claimRole)) {
    throw signInAgainError(
      "Your account now has admin access. Please sign in again to continue.",
    );
  }

  updateSession({
    role,
    roleLabel: formatRole(role),
    roleVerifiedAt: Date.now(),
  });

  return {
    role,
    roleLabel: formatRole(role),
    message: envelopeMessage(payload) || "Admin access granted.",
  };
}

/**
 * Requests a password reset email.
 * POST /auth/reset-password (API_ROUTES.resetPassword) with `{ email }` and no
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
