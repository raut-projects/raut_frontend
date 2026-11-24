/**
 * Validates a redirect target returned by the backend.
 * Allows internal paths and same-origin absolute URLs; rejects protocol-relative
 * URLs, external origins and non-http(s) protocols. Falls back when invalid.
 */
export function safeRedirect(
  value: string | null | undefined,
  fallback = "/login",
): string {
  const target = String(value ?? "").trim();
  if (!target) return fallback;

  if (target.startsWith("/") && !target.startsWith("//")) {
    return target;
  }

  if (typeof window === "undefined") return fallback;

  try {
    const url = new URL(target, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    if (url.protocol !== "http:" && url.protocol !== "https:") return fallback;

    return `${url.pathname}${url.search}${url.hash}` || fallback;
  } catch {
    return fallback;
  }
}
