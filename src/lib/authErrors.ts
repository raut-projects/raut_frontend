const GENERIC_ERROR = "We couldn't sign you in. Please try again.";

const statusFrom = (error: unknown): number | null => {
  const status = (error as { status?: unknown })?.status;
  return typeof status === "number" ? status : null;
};

const rawMessageFrom = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : "";
};

// Turns any failure from the sign-in request into plain, user-friendly copy.
// Backend messages can contain field paths, status codes or endpoint names, so
// they are never shown directly.
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
