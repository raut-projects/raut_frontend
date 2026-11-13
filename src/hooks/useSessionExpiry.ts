/**
 * Schedules session-expiry checks and signs out when the token expires.
 *
 * Sets a timer for the stored access-token expiry; on expiry it calls
 * `signOut()` and shows a toast. The timer is rescheduled when the session
 * changes (via `subscribeSession`) and re-checked when the tab becomes
 * visible or regains focus, so a tab left in the background still signs out
 * at the right time. The 31-bit timeout cap avoids `setTimeout` overflow for
 * long-lived tokens.
 *
 * Collaborates with tokenStore, auth service and toast.
 */
import { useEffect } from "react";
import { useToast } from "@/components/toastContext";
import { signOut } from "@/services/auth";
import {
  getExpiresAt,
  getSessionSnapshot,
  subscribeSession,
} from "@/services/tokenStore";

const MAX_TIMEOUT_MS = 2 ** 31 - 1;
const EXPIRED_MESSAGE = "Your session expired. Please sign in again.";

/**
 * useSessionExpiry hook.
 */
/**
 * useSessionExpiry — schedules expiry checks and signs out when the token
 * expires. Returns nothing; mount once at the app root.
 */
export function useSessionExpiry() {
  const toast = useToast();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let checking = false;

    const clearTimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const schedule = () => {
      clearTimer();

      if (!getSessionSnapshot()) return;

      const expiresAt = getExpiresAt();
      if (!expiresAt) return;

      const delay = Math.max(0, expiresAt - Date.now());
      timer = setTimeout(check, Math.min(delay, MAX_TIMEOUT_MS));
    };

    function check() {
      if (checking || !getSessionSnapshot()) return;

      const expiresAt = getExpiresAt();
      if (!expiresAt) return;

      if (Date.now() < expiresAt) {
        schedule();
        return;
      }

      checking = true;

      try {
        signOut();
        toast.error(EXPIRED_MESSAGE);
      } finally {
        checking = false;
      }
    }

    schedule();

    const unsubscribe = subscribeSession(schedule);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") check();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onVisibilityChange);

    return () => {
      clearTimer();
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onVisibilityChange);
    };
  }, [toast]);
}
