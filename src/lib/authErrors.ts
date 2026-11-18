// User-facing copy for authentication failures. Maps HTTP status codes and raw
// error text from the sign-in and password-reset requests into short, safe
// messages; backend detail (field paths, endpoints, status codes) is never
// surfaced to the user.

const GENERIC_ERROR = "We couldn't sign you in. Please try again.";

/** Extracts a numeric HTTP status from an error object, or null if absent. */
const statusFrom = (error: unknown): number | null => {
  const status = (error as { status?: unknown })?.status;
  return typeof status === "number" ? status : null;
};

/** Extracts a message string from an Error, a string, or nothing. */
const rawMessageFrom = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "";
};

// Turns any failure from the sign-in request into plain, user-friendly copy.
// Backend messages can contain field paths, status codes or endpoint names, so
// they are never shown directly.
/**
 * Maps a sign-in failure to a user-facing message.
 *
 * Handles network failures (status 0), timeouts, invalid credentials
 * (400/401/403/422), missing endpoint (404), rate limiting (429) and server
 * errors (5xx); anything else falls back to a generic message.
 */
export function getLoginErrorMessage(error: unknown): string {
  const status = statusFrom(error);
  const rawMessage = rawMessageFrom(error);

  if (status === 0 && /took too long|timed out|timeout/i.test(rawMessage)) {
    return "The request timed out. Check your connection and try again.";
  }

  if (status === 400 || status === 401 || status === 403 || status === 422) {
    return "The email or password is incorrect.";
  }

  if (status === 404) {
    return "Sign-in isn't available right now. Please try again later.";
  }

  if (status === 408) {
    return "The request timed out. Check your connection and try again.";
  }

  if (status === 429) {
    return "Too many sign-in attempts. Please wait a minute and try again.";
  }

  if (status === 0) {
    return "We couldn't reach the server. Check your internet connection and try again.";
  }

  if (status !== null && status >= 500) {
    return "We couldn't sign you in right now. Please try again shortly.";
  }

  return GENERIC_ERROR;
}

// Turns any failure from the reset request into plain, user-friendly copy.
/**
 * Maps a password-reset failure to a user-facing message.
 *
 * Handles network failures (status 0), timeouts, rate limiting (429), rejected
 * addresses (400/422) and server errors (5xx); anything else falls back to a
 * generic message.
 */
export function getPasswordResetErrorMessage(error: unknown): string {
  const status = statusFrom(error);
  const rawMessage = rawMessageFrom(error);

  if (status === 0 && /took too long|timed out|timeout/i.test(rawMessage)) {
    return "The request timed out. Check your connection and try again.";
  }

  if (status === 429) {
    return "Too many reset requests. Please wait a minute and try again.";
  }

  if (status === 0) {
    return "We couldn't reach the server. Check your internet connection and try again.";
  }

  if (status === 400 || status === 422) {
    return "That email address was not accepted. Please check it and try again.";
  }

  if (status !== null && status >= 500) {
    return "We couldn't send the reset email right now. Please try again shortly.";
  }

  return "We couldn't send the reset email. Please try again.";
}
