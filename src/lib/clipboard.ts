// Clipboard helper. Wraps the async Clipboard API and falls back to a hidden
// textarea with document.execCommand("copy") where that API is unavailable.

/**
 * Copies text to the clipboard.
 *
 * Uses navigator.clipboard.writeText when available, otherwise a temporary
 * off-screen textarea. Resolves once the copy succeeds and throws if the
 * fallback path fails.
 */
export async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) throw new Error("Clipboard copy failed.");
}
