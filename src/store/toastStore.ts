/**
 * Global toast queue for transient success/error/info notifications. Auto-
 * dismiss timers live outside the store so they never become render state.
 */
import { create } from "zustand";

/** Visual tone applied to a toast. */
export type ToastTone = "success" | "error" | "info";

/** A single toast. `id` is a generated number used as the React key. */
export type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastState = {
  toasts: Toast[];
  /**
   * Adds a toast, schedules its auto-dismiss, and returns the new id.
   * `tone` defaults to "info".
   */
  push: (message: string, tone?: ToastTone) => number;
  /** Removes a toast immediately and cancels its timer. */
  dismiss: (id: number) => void;
  /** Removes every toast and cancels all pending timers. */
  clear: () => void;
};

/** Auto-dismiss delay in milliseconds. */
const TOAST_DURATION = 4000;

// Timers live outside the store: they are not render state and should not be
// copied or compared by selectors.
const timers = new Map<number, ReturnType<typeof setTimeout>>();

const clearTimer = (id: number) => {
  const timer = timers.get(id);

  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
};

/** Zustand store holding the visible toast queue and its actions. */
export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],

  push: (message, tone = "info") => {
    const id = Date.now() + Math.random();

    set({ toasts: [...get().toasts, { id, message, tone }] });

    timers.set(
      id,
      setTimeout(() => {
        timers.delete(id);
        set({ toasts: get().toasts.filter((toast) => toast.id !== id) });
      }, TOAST_DURATION),
    );

    return id;
  },

  dismiss: (id) => {
    clearTimer(id);
    set({ toasts: get().toasts.filter((toast) => toast.id !== id) });
  },

  clear: () => {
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
    set({ toasts: [] });
  },
}));
