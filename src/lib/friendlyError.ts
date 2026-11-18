export type FriendlyErrorOptions = {
  fallback?: string;
  context?: string;
};

const DEFAULT_FALLBACK = "Something went wrong. Please try again.";
const LOAD_FALLBACK = "Could not load this data. Please try again.";
const SAVE_FALLBACK = "Could not save your changes. Please try again.";

const TECHNICAL_PATTERNS = [
  /request\s+(must|should|was)\s+be/i,
  /response\s+(must|is\s+missing|should)/i,
  /must\s+be\s+an?\s+/i,
  /must\s+contain/i,
  /must\s+not\s+contain/i,
  /must\s+be\s+a\s+finite/i,
  /expected\s+(an?\s+)?(object|array|string|number|boolean)/i,
  /is\s+not\s+a\s+(function|object|array|string|number)/i,
  /cannot\s+read\s+propert/i,
  /undefined\s+is\s+not/i,
  /null\s+is\s+not/i,
  /failed\s+to\s+fetch/i,
  /network\s*error/i,
  /typeerror/i,
  /syntaxerror/i,
  /referenceerror/i,
  /validation\s+failed/i,
  /invalid\s+(payload|request|response|body)/i,
  /malformed/i,
  /internal\s+server\s+error/i,
  /unexpected\s+(token|end)/i,
  /column|relation|constraint|sql|query/i,
  /stack\s*trace/i,
];

const CODE_MAP: Record<string, string> = {
  unauthorized: "Your session has expired. Please sign in again.",
  unauthenticated: "Your session has expired. Please sign in again.",
  forbidden: "You do not have permission to perform this action.",
  not_found: "The requested item could not be found.",
  invalid_credentials: "The email or password you entered is incorrect.",
  invalid_token: "Your session has expired. Please sign in again.",
  token_expired: "Your session has expired. Please sign in again.",
  validation_error: "Some details are invalid. Please check and try again.",
  bad_request:
    "We couldn't process that request. Please check the details and try again.",
  conflict:
    "This action conflicts with the current state. Please refresh and try again.",
  too_many_requests: "Too many attempts. Please wait a moment and try again.",
  rate_limited: "Too many attempts. Please wait a moment and try again.",
  server_error: "Something went wrong on our side. Please try again later.",
};

const MESSAGE_MAP: Array<[RegExp, string]> = [
  [
    /session|token|sign in|log in|unauthor/i,
    "Your session has expired. Please sign in again.",
  ],
  [
    /permission|forbidden|not allowed/i,
    "You do not have permission to perform this action.",
  ],
  [/not found/i, "The requested item could not be found."],
  [/timeout|timed out/i, "The request took too long. Please try again."],
  [
    /network|connection|failed to fetch/i,
    "Please check your internet connection and try again.",
  ],
  [
    /invalid credentials|incorrect password|wrong password/i,
    "The email or password you entered is incorrect.",
  ],
  [
    /already exists|duplicate|conflict/i,
    "This item already exists or conflicts with existing data.",
  ],
  [
    /too many|rate limit/i,
    "Too many attempts. Please wait a moment and try again.",
  ],
];

function isTechnicalMessage(message: string): boolean {
  if (!message) return false;
  const trimmed = message.trim();
  if (trimmed.length > 180) return true;
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || "";
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : "";
  }
  return "";
}

function getErrorStatus(error: unknown): number | null {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    return typeof status === "number" ? status : null;
  }
  return null;
}

function getErrorCode(error: unknown): string {
  if (error && typeof error === "object") {
    const body = (error as { body?: any }).body;
    const candidates = [
      body?.error?.code,
      body?.error?.type,
      body?.code,
      body?.error_code,
      (error as { code?: unknown }).code,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim().toLowerCase();
      }
    }
  }
  return "";
}

function fallbackFor(options?: FriendlyErrorOptions): string {
  if (options?.fallback) return options.fallback;
  if (options?.context === "load") return LOAD_FALLBACK;
  if (options?.context === "save") return SAVE_FALLBACK;
  return DEFAULT_FALLBACK;
}

export function getUserFriendlyErrorMessage(
  error: unknown,
  options?: FriendlyErrorOptions,
): string {
  const fallback = fallbackFor(options);
  const status = getErrorStatus(error);
  const code = getErrorCode(error);
  const raw = getErrorMessage(error).trim();

  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403)
    return "You do not have permission to perform this action.";
  if (status === 404) return "The requested item could not be found.";
  if (status === 408) return "The request took too long. Please try again.";
  if (status === 429)
    return "Too many attempts. Please wait a moment and try again.";
  if (status !== null && status >= 500)
    return "Something went wrong on our side. Please try again later.";

  if (code && CODE_MAP[code]) return CODE_MAP[code];

  if (raw) {
    if (!isTechnicalMessage(raw)) return raw;
    for (const [pattern, friendly] of MESSAGE_MAP) {
      if (pattern.test(raw)) return friendly;
    }
  }

  if (status === 400 || status === 422) {
    return "We couldn't process that request. Please check the details and try again.";
  }

  if (raw && options?.context === "load") return LOAD_FALLBACK;
  if (raw && options?.context === "save") return SAVE_FALLBACK;

  return fallback;
}
