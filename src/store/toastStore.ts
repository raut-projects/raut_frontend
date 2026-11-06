import { create } from "zustand";

export type ToastTone = "success" | "error" | "info";

export type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastState = {
  toasts: Toast[];
  push: (message: string, tone?: ToastTone) => number;
  dismiss: (id: number) => void;
  clear: () => void;
};

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
