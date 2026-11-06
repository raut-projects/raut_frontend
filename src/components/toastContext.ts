"use client";

import { useMemo } from "react";
import { useToastStore, type ToastTone } from "../store/toastStore";

export function useToast() {
  return useMemo(
    () => ({
      toast: (message: string, tone: ToastTone = "info") =>
        useToastStore.getState().push(message, tone),
      success: (message: string) =>
        useToastStore.getState().push(message, "success"),
      error: (message: string) =>
        useToastStore.getState().push(message, "error"),
    }),
    [],
  );
}
